import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { toast } from 'sonner';
import { 
  Search, 
  Edit, 
  Trash2, 
  Plus,
  Image as ImageIcon,
  Mail,
  Calendar,
  User,
  Users,
  Leaf,
  UtensilsCrossed,
  CheckSquare,
  MoreHorizontal,
  X,
  Eye,
  RefreshCw,
  ChevronDown,
  FlaskConical,
  Package,
  Clock
} from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { FloatingDebugMenu } from './FloatingDebugMenu';

interface AdminRecord {
  id: string;
  name?: string;
  name_common?: string;
  email?: string;
  title?: string;
  category?: string;
  description?: string;
  image_url?: string;
  avatar_url?: string;
  created_at?: string;
  emailsSent?: number;
  email_sent?: boolean;
  referrals?: number;
  referralCode?: string;
  position?: number;
  confirmed?: boolean;
  lastEmailSent?: string;
  ipAddress?: string;
  userAgent?: string;
  source?: string;
  referredBy?: string;
  [key: string]: any;
}

interface SimplifiedAdminPanelProps {
  accessToken: string;
  user: any;
}

export function SimplifiedAdminPanel({ accessToken, user }: SimplifiedAdminPanelProps) {
  const [activeTab, setActiveTab] = useState('waitlist');
  const [searchQuery, setSearchQuery] = useState('');
  const [records, setRecords] = useState<AdminRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingRecord, setEditingRecord] = useState<AdminRecord | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedRecords, setSelectedRecords] = useState<Set<string>>(new Set());
  const [bulkEditField, setBulkEditField] = useState('');
  const [bulkEditValue, setBulkEditValue] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [subFilter, setSubFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [resendingEmail, setResendingEmail] = useState<string | null>(null);
  const [detailRecord, setDetailRecord] = useState<AdminRecord | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkAction, setBulkAction] = useState<'update' | 'delete' | null>(null);
  const [deletingRecord, setDeletingRecord] = useState<string | null>(null);
  const [savingRecord, setSavingRecord] = useState(false);

  const tabs = [
    { id: 'waitlist', label: 'Waitlist', icon: <Clock className="w-4 h-4" />, table: 'waitlist' },
    { id: 'elements', label: 'Elements', icon: <FlaskConical className="w-4 h-4" />, table: 'catalog_elements' },
    { id: 'ingredients', label: 'Ingredients', icon: <Leaf className="w-4 h-4" />, table: 'catalog_ingredients' },
    { id: 'recipes', label: 'Recipes', icon: <UtensilsCrossed className="w-4 h-4" />, table: 'catalog_recipes' },
    { id: 'products', label: 'Products', icon: <Package className="w-4 h-4" />, table: 'catalog_recipes' }
  ];

  const subFilters: Record<string, { label: string; value: string; color: string }[]> = {
    elements: [
      { label: 'All', value: 'all', color: 'blue' },
      { label: 'Beneficial', value: 'beneficial', color: 'green' },
      { label: 'Hazardous', value: 'hazardous', color: 'red' },
      { label: 'Both', value: 'both', color: 'amber' },
    ],
    ingredients: [
      { label: 'All', value: 'all', color: 'blue' },
      { label: 'Raw', value: 'raw', color: 'green' },
      { label: 'Processed', value: 'processed', color: 'orange' },
    ],
    recipes: [
      { label: 'All', value: 'all', color: 'blue' },
      { label: 'Beverage', value: 'beverage', color: 'cyan' },
      { label: 'Meal', value: 'meal', color: 'green' },
      { label: 'Condiment', value: 'condiment', color: 'amber' },
    ],
    products: [
      { label: 'All', value: 'all', color: 'blue' },
      { label: 'Beverage', value: 'beverage', color: 'cyan' },
      { label: 'Meal', value: 'meal', color: 'green' },
      { label: 'Condiment', value: 'condiment', color: 'amber' },
      { label: 'Supplement', value: 'supplement', color: 'purple' },
    ],
  };

  const currentTab = tabs.find(t => t.id === activeTab);

  // Fetch records for current tab
  const fetchRecords = async () => {
    if (!currentTab) return;
    
    try {
      setLoading(true);
      console.log(`[Admin] Fetching ${currentTab.label} from ${currentTab.table}...`);
      
      // Build query with proper filters
      let url: string;
      
      // Use custom endpoint for waitlist data from KV store
      if (activeTab === 'waitlist') {
        url = `https://${projectId}.supabase.co/functions/v1/make-server-ed0fe4c2/admin/waitlist`;
        console.log(`[Admin] Fetching waitlist from KV store: ${url}`);
        
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log(`[Admin] Loaded ${data?.length || 0} waitlist users from KV store`);
          setRecords(Array.isArray(data) ? data : []);
        } else {
          const errorText = await response.text();
          console.warn(`[Admin] Failed to fetch waitlist:`, response.status, response.statusText);
          console.warn(`[Admin] Error response:`, errorText);
          setRecords([]);
        }
        setLoading(false);
        return;
      }
      
      url = `https://${projectId}.supabase.co/rest/v1/${currentTab.table}?limit=100`;
      
      // Add ordering
      if (activeTab === 'elements') {
        url += '&order=category.asc,name_common.asc';
      } else {
        url += '&order=created_at.desc';
      }

      console.log(`[Admin] Fetching URL: ${url}`);

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'apikey': publicAnonKey,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        }
      });

      console.log(`[Admin] Response: ${response.status} ${response.statusText}`);

      if (response.ok) {
        const data = await response.json();
        console.log(`[Admin] Loaded ${data?.length || 0} ${currentTab.label}`);
        setRecords(Array.isArray(data) ? data : []);
      } else {
        const errorText = await response.text();
        console.warn(`[Admin] Failed to fetch ${currentTab.label}:`, response.status, response.statusText);
        console.warn(`[Admin] Error:`, errorText);
        setRecords([]);
      }
    } catch (error) {
      console.error(`[Admin] Error fetching ${currentTab.label}:`, error);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [activeTab, accessToken]);

  const handleEdit = (record: AdminRecord) => {
    setEditingRecord({ ...record });
    setShowEditModal(true);
  };

  const handleViewDetail = (record: AdminRecord) => {
    setDetailRecord(record);
    setShowDetailModal(true);
  };

  const handleSave = async () => {
    if (!editingRecord || !currentTab) return;
    setSavingRecord(true);

    try {
      if (activeTab === 'waitlist' && editingRecord.email) {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-ed0fe4c2/admin/waitlist/update`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              email: editingRecord.email,
              updates: {
                name: editingRecord.name,
                referrals: editingRecord.referrals,
                position: editingRecord.position,
                confirmed: editingRecord.confirmed
              }
            })
          }
        );
        if (response.ok) {
          toast.success('Waitlist user updated');
          setShowEditModal(false);
          setShowDetailModal(false);
          fetchRecords();
        } else {
          const err = await response.json();
          toast.error(err.error || 'Failed to update user');
        }
      } else {
        const response = await fetch(
          `https://${projectId}.supabase.co/rest/v1/${currentTab.table}?id=eq.${editingRecord.id}`,
          {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
              'apikey': publicAnonKey
            },
            body: JSON.stringify(editingRecord)
          }
        );
        if (response.ok) {
          toast.success('Record updated successfully');
          setShowEditModal(false);
          fetchRecords();
        } else {
          toast.error('Failed to update record');
        }
      }
    } catch (error) {
      console.error('Error saving record:', error);
      toast.error('Error saving record');
    } finally {
      setSavingRecord(false);
    }
  };

  const handleDelete = async (record: AdminRecord) => {
    if (!currentTab || !confirm(`Are you sure you want to delete ${record.email || record.name || 'this record'}?`)) return;

    try {
      if (activeTab === 'waitlist' && record.email) {
        setDeletingRecord(record.id);
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-ed0fe4c2/admin/waitlist/delete`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email: record.email })
          }
        );
        if (response.ok) {
          toast.success(`Deleted ${record.email}`);
          setShowDetailModal(false);
          fetchRecords();
        } else {
          const err = await response.json();
          toast.error(err.error || 'Failed to delete user');
        }
      } else {
        const response = await fetch(
          `https://${projectId}.supabase.co/rest/v1/${currentTab.table}?id=eq.${record.id}`,
          {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'apikey': publicAnonKey
            }
          }
        );
        if (response.ok) {
          toast.success('Record deleted successfully');
          fetchRecords();
        } else {
          toast.error('Failed to delete record');
        }
      }
    } catch (error) {
      console.error('Error deleting record:', error);
      toast.error('Error deleting record');
    } finally {
      setDeletingRecord(null);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedRecords.size === 0) return;
    if (!confirm(`Delete ${selectedRecords.size} selected records? This cannot be undone.`)) return;

    try {
      if (activeTab === 'waitlist') {
        const emails = records.filter(r => selectedRecords.has(r.id)).map(r => r.email).filter(Boolean);
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-ed0fe4c2/admin/waitlist/bulk-delete`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ emails })
          }
        );
        if (response.ok) {
          const result = await response.json();
          toast.success(`Deleted ${result.deleted} users`);
        } else {
          toast.error('Bulk delete failed');
        }
      }
      setSelectedRecords(new Set());
      setBulkMode(false);
      fetchRecords();
    } catch (error) {
      console.error('Bulk delete error:', error);
      toast.error('Bulk delete failed');
    }
  };

  const handleBulkUpdate = async () => {
    if (selectedRecords.size === 0 || !bulkEditField || !bulkEditValue) return;

    try {
      if (activeTab === 'waitlist') {
        const emails = records.filter(r => selectedRecords.has(r.id)).map(r => r.email).filter(Boolean);
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-ed0fe4c2/admin/waitlist/bulk-update`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ emails, updates: { [bulkEditField]: bulkEditValue } })
          }
        );
        if (response.ok) {
          const result = await response.json();
          toast.success(`Updated ${result.updated} users`);
        } else {
          toast.error('Bulk update failed');
        }
      } else if (currentTab) {
        for (const recordId of selectedRecords) {
          await fetch(
            `https://${projectId}.supabase.co/rest/v1/${currentTab.table}?id=eq.${recordId}`,
            {
              method: 'PATCH',
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
                'apikey': publicAnonKey
              },
              body: JSON.stringify({ [bulkEditField]: bulkEditValue })
            }
          );
        }
        toast.success(`Updated ${selectedRecords.size} records`);
      }
      setSelectedRecords(new Set());
      setBulkEditField('');
      setBulkEditValue('');
      setBulkMode(false);
      setBulkAction(null);
      fetchRecords();
    } catch (error) {
      console.error('Bulk update error:', error);
      toast.error('Bulk update failed');
    }
  };

  const toggleSelectRecord = (id: string) => {
    setSelectedRecords(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedRecords.size === filteredRecords.length) {
      setSelectedRecords(new Set());
    } else {
      setSelectedRecords(new Set(filteredRecords.map(r => r.id)));
    }
  };

  const handleResendEmail = async (recordId: string, email: string) => {
    setResendingEmail(recordId);
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-ed0fe4c2/admin/resend-welcome-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ email, recordId })
      });

      if (response.ok) {
        toast.success('Welcome email resent successfully');
        fetchRecords();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to resend email');
      }
    } catch (error) {
      console.error('Error resending email:', error);
      toast.error('Error resending email');
    } finally {
      setResendingEmail(null);
    }
  };

  const filteredRecords = records.filter(record => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = (
      (record.name?.toLowerCase().includes(searchLower)) ||
      (record.name_common?.toLowerCase().includes(searchLower)) ||
      (record.email?.toLowerCase().includes(searchLower)) ||
      (record.title?.toLowerCase().includes(searchLower)) ||
      (record.category?.toLowerCase().includes(searchLower))
    );
    
    // Filter by sub-category if a sub-filter is active
    if (subFilter !== 'all' && activeTab !== 'waitlist') {
      const category = record.category?.toLowerCase() || '';
      const type = record.type?.toLowerCase() || '';
      const combined = `${category} ${type}`;
      if (!combined.includes(subFilter.toLowerCase())) return false;
    }
    
    // Filter by category if categoryFilter is set
    if (categoryFilter !== 'all' && record.category !== categoryFilter) return false;
    
    return matchesSearch;
  }).map((record, index) => ({ ...record, _displayIndex: index }));

  // Get unique categories for filter dropdown
  const uniqueCategories = Array.from(new Set(records.map(r => r.category).filter(Boolean)));
  
  // Pagination
  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage);
  const paginatedRecords = filteredRecords.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const PLACEHOLDER_IMAGE = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23e5e7eb" width="200" height="200"/%3E%3Ctext x="50%25" y="50%25" font-size="14" fill="%236b7280" text-anchor="middle" dy=".3em"%3ENo Image%3C/text%3E%3C/svg%3E';

  const getDisplayName = (record: AdminRecord) => {
    return record.name_common || record.name || record.email || record.title || 'Unnamed';
  };

  const getImageUrl = (record: AdminRecord) => {
    // Try multiple possible image field names
    let imageUrl = record.image_url || record.avatar_url;
    
    // For recipes, also check for images array or image field
    if (!imageUrl && activeTab === 'recipes') {
      // Check if images is an array and get first image
      if (Array.isArray(record.images) && record.images.length > 0) {
        imageUrl = record.images[0];
      } else if (typeof record.images === 'string') {
        imageUrl = record.images;
      } else if (record.image) {
        imageUrl = record.image;
      }
    }
    
    return imageUrl || PLACEHOLDER_IMAGE;
  };

  const renderTableHeader = () => {
    // No header needed for card-based layout
    return null;
  };

  const renderRecordRow = (record: AdminRecord & { _displayIndex?: number }) => {
    const imageUrl = getImageUrl(record);
    const displayName = getDisplayName(record);
    const isSelected = selectedRecords.has(record.id);
    const isWaitlist = activeTab === 'waitlist';

    return (
      <div key={record.id} className={`flex gap-3 p-3 sm:p-4 mb-2 rounded-xl border transition-all ${isSelected ? 'bg-blue-50 border-blue-300 shadow-sm' : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-md'}`}>
        {/* Checkbox for bulk mode */}
        {bulkMode && (
          <div className="flex items-center flex-shrink-0">
            <input
              type="checkbox"
              title="Select record"
              checked={isSelected}
              onChange={() => toggleSelectRecord(record.id)}
              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
          </div>
        )}

        {/* Queue number + Avatar */}
        {isWaitlist ? (
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-xs font-bold text-gray-400 w-6 text-right">#{record.position || '?'}</span>
            <img
              src={`https://www.gravatar.com/avatar/${record.email ? Array.from(record.email.trim().toLowerCase()).reduce((h: number, c: string) => ((h << 5) - h + c.charCodeAt(0)) | 0, 0).toString(16).replace('-', '') : '0'}?d=identicon&s=40`}
              alt={record.email || ''}
              className="w-9 h-9 rounded-full cursor-pointer border border-gray-200"
              onClick={() => handleViewDetail(record)}
            />
          </div>
        ) : (
          <div className="flex-shrink-0">
            <img
              src={imageUrl}
              alt={displayName}
              className="w-16 h-16 rounded-lg object-cover hover:shadow-lg cursor-pointer transition-shadow"
              onClick={() => handleViewDetail(record)}
              loading="lazy"
            />
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div
                className="font-semibold text-gray-900 text-sm sm:text-base truncate hover:text-blue-600 cursor-pointer transition-colors"
                onClick={() => handleViewDetail(record)}
              >
                {isWaitlist ? (record.email || 'No email') : displayName}
              </div>
              {isWaitlist && (
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  {record.created_at && (
                    <span className="text-xs text-gray-500">
                      {new Date(record.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}
                    </span>
                  )}
                  {record.ipAddress && (
                    <span className="text-xs text-gray-400" title={record.ipAddress}>
                      IP: {record.ipAddress.split(',')[0].trim()}
                    </span>
                  )}
                  {record.source && (
                    <Badge className="text-[10px] px-1.5 py-0 bg-gray-100 text-gray-500">{record.source}</Badge>
                  )}
                </div>
              )}
              {!isWaitlist && record.category && (
                <Badge className="text-xs mt-1 bg-blue-100 text-blue-800">{record.category}</Badge>
              )}
              {!isWaitlist && record.description && (
                <p className="text-sm text-gray-600 line-clamp-1 mt-1">{record.description}</p>
              )}
              {!isWaitlist && record.created_at && (
                <div className="text-xs text-gray-500 mt-1">
                  {new Date(record.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}
                </div>
              )}
            </div>

            {/* Right Column */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {isWaitlist && (
                <div className="flex items-center gap-2">
                  {record.emailsSent || record.email_sent ? (
                    <Badge className="bg-green-100 text-green-800 text-xs font-medium">Sent</Badge>
                  ) : (
                    <Badge className="bg-yellow-100 text-yellow-800 text-xs font-medium">Pending</Badge>
                  )}
                  <span className="text-xs text-gray-500">Ref: <span className="font-semibold text-gray-700">{record.referrals || 0}</span></span>
                </div>
              )}
              {/* Action buttons */}
              <div className="flex items-center gap-1">
                {isWaitlist && !record.confirmed && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleResendEmail(record.id, record.email || '')}
                    disabled={resendingEmail === record.id}
                    className="h-8 w-8 p-0 text-gray-400 hover:text-orange-600"
                    title="Resend confirmation email"
                  >
                    <Mail className="w-4 h-4" />
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleViewDetail(record)}
                  className="h-8 w-8 p-0 text-gray-400 hover:text-blue-600"
                  title="View details"
                >
                  <Eye className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleEdit(record)}
                  className="h-8 w-8 p-0 text-gray-400 hover:text-blue-600"
                  title="Edit"
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDelete(record)}
                  disabled={deletingRecord === record.id}
                  className="h-8 w-8 p-0 text-gray-400 hover:text-red-600"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Admin Panel</CardTitle>
          <CardDescription>Manage users, waitlist, elements, ingredients, and recipes</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(val: string) => { setActiveTab(val); setSelectedRecords(new Set()); setBulkMode(false); setBulkAction(null); setCurrentPage(1); setSubFilter('all'); setCategoryFilter('all'); }} className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              {tabs.map(tab => (
                <TabsTrigger key={tab.id} value={tab.id} className="gap-2">
                  <span>{tab.icon}</span>
                  <span className="hidden sm:inline">{tab.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            {tabs.map(tab => (
              <TabsContent key={tab.id} value={tab.id} className="space-y-4">
                {/* Sub-category Filter Tabs */}
                {subFilters[tab.id] && (
                  <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
                    {subFilters[tab.id].map((sf) => {
                      const isActive = subFilter === sf.value;
                      const colorMap: Record<string, string> = {
                        blue: 'bg-blue-600 text-white shadow-sm',
                        green: 'bg-green-600 text-white shadow-sm',
                        red: 'bg-red-600 text-white shadow-sm',
                        amber: 'bg-amber-600 text-white shadow-sm',
                        orange: 'bg-orange-600 text-white shadow-sm',
                        cyan: 'bg-cyan-600 text-white shadow-sm',
                        purple: 'bg-purple-600 text-white shadow-sm',
                      };
                      return (
                        <button
                          key={sf.value}
                          onClick={() => { setSubFilter(sf.value); setCurrentPage(1); }}
                          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                            isActive
                              ? colorMap[sf.color] || 'bg-blue-600 text-white shadow-sm'
                              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                          }`}
                        >
                          {sf.label}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Toolbar */}
                <div className="space-y-2">
                  <div className="flex gap-2 items-center">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                      <Input
                        placeholder={`Search ${tab.label.toLowerCase()}...`}
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          setCurrentPage(1);
                        }}
                        className="pl-10"
                      />
                    </div>
                    <Button
                      variant={bulkMode ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        setBulkMode(!bulkMode);
                        if (bulkMode) {
                          setSelectedRecords(new Set());
                          setBulkAction(null);
                        }
                      }}
                      className="gap-1 whitespace-nowrap"
                    >
                      <CheckSquare className="w-4 h-4" />
                      {bulkMode ? 'Cancel' : 'Select'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={fetchRecords}
                      disabled={loading}
                      className="gap-1"
                      title="Refresh"
                    >
                      <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                  </div>

                  {/* Bulk Actions Bar */}
                  {bulkMode && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={toggleSelectAll}
                            className="text-sm font-medium text-blue-700 hover:text-blue-900 underline"
                          >
                            {selectedRecords.size === filteredRecords.length ? 'Deselect All' : 'Select All'}
                          </button>
                          <span className="text-sm text-blue-800">
                            {selectedRecords.size} of {filteredRecords.length} selected
                          </span>
                        </div>
                        {selectedRecords.size > 0 && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setBulkAction(bulkAction === 'update' ? null : 'update')}
                              className="gap-1 text-blue-700 border-blue-300 hover:bg-blue-100"
                            >
                              <Edit className="w-3 h-3" />
                              Bulk Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={handleBulkDelete}
                              className="gap-1 text-red-700 border-red-300 hover:bg-red-100"
                            >
                              <Trash2 className="w-3 h-3" />
                              Delete Selected
                            </Button>
                          </div>
                        )}
                      </div>
                      {bulkAction === 'update' && selectedRecords.size > 0 && (
                        <div className="flex gap-2 pt-1">
                          <Input
                            placeholder="Field (e.g., confirmed, name)"
                            value={bulkEditField}
                            onChange={(e) => setBulkEditField(e.target.value)}
                            className="flex-1"
                          />
                          <Input
                            placeholder="New value"
                            value={bulkEditValue}
                            onChange={(e) => setBulkEditValue(e.target.value)}
                            className="flex-1"
                          />
                          <Button
                            onClick={handleBulkUpdate}
                            disabled={!bulkEditField || !bulkEditValue}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            Apply
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Records Container */}
                <div className="space-y-3">
                  {loading ? (
                    <div className="text-center py-12 text-gray-500">Loading...</div>
                  ) : paginatedRecords.length > 0 ? (
                    paginatedRecords.map(record => renderRecordRow(record))
                  ) : (
                    <div className="text-center py-12 text-gray-500">No records found</div>
                  )}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      Showing {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, filteredRecords.length)} of {filteredRecords.length} records
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="gap-1"
                      >
                        ← Previous
                      </Button>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                              currentPage === page
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {page}
                          </button>
                        ))}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className="gap-1"
                      >
                        Next →
                      </Button>
                    </div>
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {activeTab === 'waitlist' ? 'Waitlist User Details' : 'Record Details'}
            </DialogTitle>
            <DialogDescription>
              View and manage this record
            </DialogDescription>
          </DialogHeader>

          {detailRecord && (
            <div className="space-y-4">
              {/* Waitlist-specific detail view */}
              {activeTab === 'waitlist' ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 pb-3 border-b">
                    <img
                      src={`https://www.gravatar.com/avatar/${detailRecord.email ? Array.from(detailRecord.email.trim().toLowerCase()).reduce((h: number, c: string) => ((h << 5) - h + c.charCodeAt(0)) | 0, 0).toString(16).replace('-', '') : '0'}?d=identicon&s=80`}
                      alt={detailRecord.email || ''}
                      className="w-14 h-14 rounded-full border-2 border-gray-200"
                    />
                    <div>
                      <div className="font-semibold text-gray-900">{detailRecord.email}</div>
                      {detailRecord.name && (
                        <div className="text-sm text-gray-500">{detailRecord.name}</div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-xs text-gray-500 font-medium uppercase">Queue Position</div>
                      <div className="text-lg font-semibold text-gray-900">#{detailRecord.position || 'N/A'}</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-xs text-gray-500 font-medium uppercase">Referrals</div>
                      <div className="text-lg font-semibold text-gray-900">{detailRecord.referrals || 0}</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-xs text-gray-500 font-medium uppercase">Email Status</div>
                      <div className="text-sm font-medium">
                        {detailRecord.emailsSent || detailRecord.email_sent ? (
                          <Badge className="bg-green-100 text-green-800">Sent</Badge>
                        ) : (
                          <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
                        )}
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-xs text-gray-500 font-medium uppercase">Confirmed</div>
                      <div className="text-sm font-medium">
                        {detailRecord.confirmed ? (
                          <Badge className="bg-green-100 text-green-800">Yes</Badge>
                        ) : (
                          <Badge className="bg-gray-100 text-gray-600">No</Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {detailRecord.ipAddress && (
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-xs text-gray-500 font-medium uppercase">IP Address</div>
                      <div className="text-sm font-mono text-gray-900 mt-1">{detailRecord.ipAddress}</div>
                    </div>
                  )}

                  {detailRecord.referralCode && (
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-xs text-gray-500 font-medium uppercase">Referral Code</div>
                      <div className="text-sm font-mono text-gray-900 mt-1">{detailRecord.referralCode}</div>
                    </div>
                  )}

                  {detailRecord.referredBy && (
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-xs text-gray-500 font-medium uppercase">Referred By</div>
                      <div className="text-sm font-mono text-gray-900 mt-1">{detailRecord.referredBy}</div>
                    </div>
                  )}

                  {detailRecord.source && (
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-xs text-gray-500 font-medium uppercase">Source</div>
                      <div className="text-sm text-gray-900 mt-1">{detailRecord.source}</div>
                    </div>
                  )}

                  {detailRecord.created_at && (
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-xs text-gray-500 font-medium uppercase">Joined</div>
                      <div className="text-sm text-gray-900 mt-1">
                        {new Date(detailRecord.created_at).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                      </div>
                    </div>
                  )}

                  {detailRecord.lastEmailSent && (
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-xs text-gray-500 font-medium uppercase">Last Email Sent</div>
                      <div className="text-sm text-gray-900 mt-1">
                        {new Date(detailRecord.lastEmailSent).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {Object.entries(detailRecord).filter(([key]) => !['_displayIndex'].includes(key)).map(([key, value]) => (
                    <div key={key} className="bg-gray-50 rounded-lg p-3">
                      <div className="text-xs text-gray-500 font-medium uppercase">{key.replace(/_/g, ' ')}</div>
                      <div className="text-sm text-gray-900 mt-1 break-all">
                        {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value ?? '')}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 justify-between pt-4 border-t">
                <div className="flex gap-2">
                  {activeTab === 'waitlist' && (
                    <Button
                      size="sm"
                      variant={detailRecord.confirmed ? 'outline' : 'default'}
                      onClick={() => handleResendEmail(detailRecord.id, detailRecord.email || '')}
                      disabled={resendingEmail === detailRecord.id}
                      className={`gap-1 ${!detailRecord.confirmed ? 'bg-orange-500 hover:bg-orange-600 text-white' : ''}`}
                    >
                      <Mail className="w-4 h-4" />
                      {resendingEmail === detailRecord.id ? 'Sending...' : (detailRecord.confirmed ? 'Resend Email' : 'Resend Confirmation')}
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(detailRecord)}
                    className="gap-1 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </Button>
                </div>
                <Button
                  size="sm"
                  onClick={() => {
                    handleEdit(detailRecord);
                    setShowDetailModal(false);
                  }}
                  className="gap-1 bg-blue-600 hover:bg-blue-700"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit {activeTab === 'waitlist' ? 'Waitlist User' : 'Record'}</DialogTitle>
            <DialogDescription>
              Update the details below and save
            </DialogDescription>
          </DialogHeader>

          {editingRecord && (
            <div className="space-y-4">
              {activeTab === 'waitlist' ? (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input value={editingRecord.email || ''} disabled className="bg-gray-50" />
                    <p className="text-xs text-gray-400">Email cannot be changed</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input
                      value={editingRecord.name || ''}
                      onChange={(e) => setEditingRecord({ ...editingRecord, name: e.target.value })}
                      placeholder="User name"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Position</Label>
                      <Input
                        type="number"
                        value={editingRecord.position || 0}
                        onChange={(e) => setEditingRecord({ ...editingRecord, position: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Referrals</Label>
                      <Input
                        type="number"
                        value={editingRecord.referrals || 0}
                        onChange={(e) => setEditingRecord({ ...editingRecord, referrals: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Confirmed</Label>
                    <select
                      title="Confirmed status"
                      value={editingRecord.confirmed ? 'true' : 'false'}
                      onChange={(e) => setEditingRecord({ ...editingRecord, confirmed: e.target.value === 'true' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="true">Yes</option>
                      <option value="false">No</option>
                    </select>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {editingRecord.image_url && (
                    <div className="space-y-2">
                      <Label>Image</Label>
                      <div className="flex gap-4 items-start">
                        <img src={editingRecord.image_url} alt="Record" className="w-24 h-24 rounded object-cover" />
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file && editingRecord) {
                              setUploadingImage(true);
                              try {
                                const reader = new FileReader();
                                reader.onload = (event) => {
                                  const base64 = event.target?.result as string;
                                  setEditingRecord({ ...editingRecord, image_url: base64 });
                                };
                                reader.readAsDataURL(file);
                              } catch (error) {
                                toast.error('Failed to read image');
                              } finally {
                                setUploadingImage(false);
                              }
                            }
                          }}
                          disabled={uploadingImage}
                        />
                      </div>
                    </div>
                  )}
                  {Object.entries(editingRecord).map(([key, value]) => {
                    if (['id', 'created_at', 'updated_at', 'image_url', 'avatar_url', '_displayIndex'].includes(key)) return null;
                    return (
                      <div key={key} className="space-y-2">
                        <Label className="capitalize">{key.replace(/_/g, ' ')}</Label>
                        {key === 'description' || key === 'health_benefits' ? (
                          <Textarea
                            value={value || ''}
                            onChange={(e) => setEditingRecord({ ...editingRecord, [key]: e.target.value })}
                            className="min-h-24"
                          />
                        ) : (
                          <Input
                            value={value || ''}
                            onChange={(e) => setEditingRecord({ ...editingRecord, [key]: e.target.value })}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="flex gap-2 justify-end pt-4 border-t">
                <Button variant="outline" onClick={() => setShowEditModal(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={savingRecord} className="bg-blue-600 hover:bg-blue-700">
                  {savingRecord ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      <FloatingDebugMenu accessToken={accessToken} />
    </div>
  );
}
