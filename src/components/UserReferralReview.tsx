"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { ScrollArea } from "./ui/scroll-area";
import { toast } from "sonner@2.0.3";
import { Search, Users, Trophy, Mail, Calendar, ExternalLink, RefreshCw, Download } from "lucide-react";
import { projectId, publicAnonKey } from "../utils/supabase/info";

interface UserReferralData {
  id: string;
  email: string;
  name?: string;
  position: number;
  referralCode: string;
  referrals: number;
  usedReferralCode?: string;
  joinedDate: string;
  lastReferralDate?: string;
  source: string;
  accountType?: string;
}

interface ReferralStats {
  totalUsers: number;
  totalReferrals: number;
  averageReferrals: number;
  topReferrer: UserReferralData | null;
}

export function UserReferralReview() {
  const [users, setUsers] = useState<UserReferralData[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserReferralData[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [stats, setStats] = useState<ReferralStats>({
    totalUsers: 0,
    totalReferrals: 0,
    averageReferrals: 0,
    topReferrer: null
  });

  // Load users data
  const loadUsers = async () => {
    setLoading(true);
    try {
      console.log('📊 Loading users referral data...');
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ed0fe4c2/admin/users-referral-data`,
        {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('📧 Raw server response:', data);

      if (!data.success) {
        throw new Error(data.error || 'Failed to load users data');
      }

      // Add null checks and default to empty array if users is undefined
      const usersArray = Array.isArray(data.users) ? data.users : [];
      console.log('👥 Processing users array:', usersArray.length, 'users');

      if (usersArray.length === 0) {
        console.warn('⚠️ No users found in response');
        setUsers([]);
        setFilteredUsers([]);
        setStats({
          totalUsers: 0,
          totalReferrals: 0,
          averageReferrals: 0,
          topReferrer: null
        });
        toast.info("No users found in the system");
        return;
      }

      // Sort users by referrals count (descending)
      const sortedUsers = usersArray.sort((a: UserReferralData, b: UserReferralData) => 
        (b.referrals || 0) - (a.referrals || 0)
      );

      setUsers(sortedUsers);
      setFilteredUsers(sortedUsers);
      
      // Calculate stats with null checks
      const totalUsers = sortedUsers.length;
      const totalReferrals = sortedUsers.reduce((sum: number, user: UserReferralData) => 
        sum + (user.referrals || 0), 0
      );
      const averageReferrals = totalUsers > 0 ? totalReferrals / totalUsers : 0;
      const topReferrer = sortedUsers.find((user: UserReferralData) => (user.referrals || 0) > 0) || null;
      
      setStats({
        totalUsers,
        totalReferrals,
        averageReferrals,
        topReferrer
      });

      console.log('✅ Users data loaded successfully:', {
        totalUsers,
        totalReferrals,
        averageReferrals,
        topReferrer: topReferrer?.email || 'None'
      });

    } catch (error) {
      console.error("❌ Error loading users:", error);
      
      // Reset all state on error
      setUsers([]);
      setFilteredUsers([]);
      setStats({
        totalUsers: 0,
        totalReferrals: 0,
        averageReferrals: 0,
        topReferrer: null
      });
      
      // Show user-friendly error message
      if (error.message?.includes('HTTP 404')) {
        toast.error("Users endpoint not found. Please check server configuration.");
      } else if (error.message?.includes('HTTP 500')) {
        toast.error("Server error while loading users. Please try again later.");
      } else if (error.message?.includes('Failed to fetch')) {
        toast.error("Network error. Please check your connection and try again.");
      } else {
        toast.error(`Failed to load users: ${error.message || 'Unknown error'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // Filter users based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(user => 
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.name && user.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        user.referralCode?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
  }, [searchTerm, users]);

  // Load data on component mount
  useEffect(() => {
    loadUsers();
  }, []);

  // Export users data as CSV
  const exportToCSV = () => {
    if (!Array.isArray(filteredUsers) || filteredUsers.length === 0) {
      toast.error("No users data to export");
      return;
    }

    try {
      const headers = [
        "Email",
        "Name", 
        "Position",
        "Referral Code",
        "Referrals Count",
        "Used Referral Code",
        "Joined Date",
        "Last Referral Date",
        "Source",
        "Account Type"
      ];
      
      const csvData = filteredUsers.map(user => [
        user.email || "",
        user.name || "",
        user.position || 0,
        user.referralCode || "",
        user.referrals || 0,
        user.usedReferralCode || "",
        user.joinedDate || "",
        user.lastReferralDate || "",
        user.source || "",
        user.accountType || "waitlist"
      ]);
      
      const csvContent = [headers, ...csvData]
        .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
        .join("\n");
      
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `healthscan-users-referrals-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success(`Exported ${filteredUsers.length} users to CSV`);
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export CSV. Please try again.");
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch (error) {
      return "Invalid Date";
    }
  };

  const getRewardTier = (referralCount: number): { label: string; color: string } => {
    const count = referralCount || 0;
    if (count >= 50) {
      return { label: "Premium (20 Weeks)", color: "bg-purple-100 text-purple-800" };
    } else if (count >= 40) {
      return { label: "Premium (16 Weeks)", color: "bg-purple-100 text-purple-800" };
    } else if (count >= 30) {
      return { label: "Premium (12 Weeks)", color: "bg-blue-100 text-blue-800" };
    } else if (count >= 20) {
      return { label: "Premium (8 Weeks)", color: "bg-blue-100 text-blue-800" };
    } else if (count >= 10) {
      return { label: "Premium (4 Weeks)", color: "bg-green-100 text-green-800" };
    } else if (count >= 5) {
      return { label: "Early Access", color: "bg-yellow-100 text-yellow-800" };
    } else {
      return { label: "Basic Access", color: "bg-gray-100 text-gray-800" };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">User Referral Review</h2>
          <p className="text-gray-600">Review users and their referral statistics</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            onClick={loadUsers} 
            disabled={loading}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button 
            onClick={exportToCSV}
            disabled={!Array.isArray(filteredUsers) || filteredUsers.length === 0}
            variant="outline"
            size="sm"
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              Registered users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Referrals</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalReferrals}</div>
            <p className="text-xs text-muted-foreground">
              All referrals made
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Referrals</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageReferrals.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">
              Per user
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Referrer</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.topReferrer ? stats.topReferrer.referrals || 0 : 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.topReferrer ? (stats.topReferrer.email || '').split('@')[0] : 'No referrals yet'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Users & Referrals</CardTitle>
          <CardDescription>
            Search and review all users with their referral statistics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by email, name, or referral code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Users Table */}
            <ScrollArea className="h-[600px] w-full">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[250px]">User</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead>Referrals</TableHead>
                    <TableHead>Reward Tier</TableHead>
                    <TableHead>Referral Code</TableHead>
                    <TableHead>Used Code</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Source</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        <div className="flex items-center justify-center">
                          <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                          Loading users...
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : !Array.isArray(filteredUsers) || filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                        {searchTerm ? 'No users found matching your search' : 'No users found'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user) => {
                      const rewardTier = getRewardTier(user.referrals || 0);
                      return (
                        <TableRow key={user.id || user.email}>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="font-medium flex items-center gap-2">
                                <Mail className="h-3 w-3 text-gray-400" />
                                {user.email || 'N/A'}
                              </div>
                              {user.name && (
                                <div className="text-sm text-gray-600">{user.name}</div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              #{user.position || 0}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Trophy className="h-3 w-3 text-yellow-600" />
                              <span className="font-medium">{user.referrals || 0}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={`text-xs ${rewardTier.color}`}>
                              {rewardTier.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                              {user.referralCode || 'N/A'}
                            </code>
                          </TableCell>
                          <TableCell>
                            {user.usedReferralCode ? (
                              <code className="text-xs bg-blue-100 px-2 py-1 rounded text-blue-800">
                                {user.usedReferralCode}
                              </code>
                            ) : (
                              <span className="text-gray-400 text-xs">None</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-xs text-gray-600">
                              <Calendar className="h-3 w-3" />
                              {formatDate(user.joinedDate)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="text-xs">
                              {(user.source || 'unknown').replace('_', ' ')}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </ScrollArea>

            {/* Summary */}
            {Array.isArray(filteredUsers) && filteredUsers.length > 0 && (
              <div className="flex items-center justify-between text-sm text-gray-600 border-t pt-4">
                <div>
                  Showing {filteredUsers.length} of {users.length} users
                </div>
                <div>
                  Total referrals in filtered results: {filteredUsers.reduce((sum, user) => sum + (user.referrals || 0), 0)}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}