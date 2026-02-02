import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { toast } from 'sonner@2.0.3';
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
  UtensilsCrossed
} from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';

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
  [key: string]: any;
}

interface SimplifiedAdminPanelProps {
  accessToken: string;
  user: any;
}

export function SimplifiedAdminPanel({ accessToken, user }: SimplifiedAdminPanelProps) {
  const [activeTab, setActiveTab] = useState('users');
  const [searchQuery, setSearchQuery] = useState('');
  const [records, setRecords] = useState<AdminRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingRecord, setEditingRecord] = useState<AdminRecord | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedRecords, setSelectedRecords] = useState<Set<string>>(new Set());
  const [bulkEditField, setBulkEditField] = useState('');
  const [bulkEditValue, setBulkEditValue] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [elementFilter, setElementFilter] = useState<'all' | 'beneficial' | 'hazardous'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [resendingEmail, setResendingEmail] = useState<string | null>(null);

  const tabs = [
    { id: 'users', label: 'Users', icon: '👤', table: 'auth.users' },
    { id: 'waitlist', label: 'Waitlist', icon: '⏳', table: 'waitlist' },
    { id: 'elements', label: 'Elements', icon: '🧪', table: 'catalog_elements' },
    { id: 'ingredients', label: 'Ingredients', icon: '🌾', table: 'catalog_ingredients' },
    { id: 'recipes', label: 'Recipes', icon: '🍽️', table: 'catalog_recipes' }
  ];

  const currentTab = tabs.find(t => t.id === activeTab);

  // Fetch records for current tab
  const fetchRecords = async () => {
    if (!currentTab) return;
    
    try {
      setLoading(true);
      console.log(`📊 Fetching ${currentTab.label} from ${currentTab.table}...`);
      console.log(`🔑 Access Token: ${accessToken ? 'Present' : 'Missing'}`);
      console.log(`🔑 API Key: ${publicAnonKey ? 'Present' : 'Missing'}`);
      
      // Build query with proper filters
      let url = `https://${projectId}.supabase.co/rest/v1/${currentTab.table}?limit=100`;
      
      // Add category filter for elements
      if (activeTab === 'elements') {
        url += '&order=category.asc,name.asc';
      } else if (activeTab !== 'users') {
        url += '&order=created_at.desc';
      }

      console.log(`🌐 Fetching URL: ${url}`);

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'apikey': publicAnonKey,
          'Content-Type': 'application/json'
        }
      });

      console.log(`📡 Response Status: ${response.status} ${response.statusText}`);

      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Loaded ${data?.length || 0} ${currentTab.label}`);
        console.log(`📋 Sample data:`, data?.slice(0, 2));
        if (activeTab === 'recipes') {
          console.log(`🖼️ Recipe images debug:`, data?.slice(0, 3).map(r => ({
            id: r.id,
            name: r.name_common || r.name,
            image_url: r.image_url,
            has_image: !!r.image_url
          })));
        }
        setRecords(Array.isArray(data) ? data : []);
      } else {
        const errorText = await response.text();
        console.warn(`⚠️ Failed to fetch ${currentTab.label}:`, response.status, response.statusText);
        console.warn(`📝 Error response:`, errorText);
        setRecords([]);
      }
    } catch (error) {
      console.error(`❌ Error fetching ${currentTab.label}:`, error);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [activeTab, accessToken]);

  const handleEdit = (record: AdminRecord) => {
    setEditingRecord(record);
    setShowEditModal(true);
  };

  const handleSave = async () => {
    if (!editingRecord || !currentTab) return;

    try {
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
    } catch (error) {
      console.error('Error saving record:', error);
      toast.error('Error saving record');
    }
  };

  const handleDelete = async (recordId: string) => {
    if (!currentTab || !confirm('Are you sure you want to delete this record?')) return;

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/rest/v1/${currentTab.table}?id=eq.${recordId}`,
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
    } catch (error) {
      console.error('Error deleting record:', error);
      toast.error('Error deleting record');
    }
  };

  const handleResendEmail = async (recordId: string, email: string) => {
    setResendingEmail(recordId);
    try {
      const response = await fetch('/api/resend-welcome-email', {
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
        toast.error('Failed to resend email');
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
    
    // Filter by element type if on elements tab
    if (activeTab === 'elements' && elementFilter !== 'all') {
      const category = record.category?.toLowerCase() || '';
      if (elementFilter === 'beneficial' && !category.includes('beneficial')) return false;
      if (elementFilter === 'hazardous' && !category.includes('hazardous')) return false;
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
    return record.image_url || record.avatar_url || PLACEHOLDER_IMAGE;
  };

  const renderTableHeader = () => {
    const isWaitlist = activeTab === 'waitlist';
    const colWidth = 'flex-1';
    
    return (
      <div className="flex items-center bg-gray-100 border-b font-semibold text-sm sticky top-0">
        <div className={`${colWidth} px-3 py-3 text-center min-w-[60px]`}>ID</div>
        <div className={`${colWidth} px-3 py-3 text-center min-w-[100px]`}>Image</div>
        <div className={`${colWidth} px-3 py-3 min-w-[140px]`}>Name</div>
        <div className={`${colWidth} px-3 py-3 min-w-[120px]`}>Description</div>
        <div className={`${colWidth} px-3 py-3 min-w-[100px]`}>Category</div>
        {isWaitlist && (
          <>
            <div className={`${colWidth} px-3 py-3 text-center min-w-[90px]`}>Email</div>
            <div className={`${colWidth} px-3 py-3 text-center min-w-[80px]`}>Referrals</div>
          </>
        )}
        <div className={`${colWidth} px-3 py-3 min-w-[100px]`}>Created</div>
        <div className={`${colWidth} px-3 py-3 text-center min-w-[100px]`}>Actions</div>
      </div>
    );
  };

  const renderRecordRow = (record: AdminRecord & { _displayIndex?: number }) => {
    const imageUrl = getImageUrl(record);
    const displayName = getDisplayName(record);
    const isSelected = selectedRecords.has(record.id);
    const isWaitlist = activeTab === 'waitlist';
    const colWidth = 'flex-1';
    const displayIndex = record._displayIndex ?? 0;

    return (
      <div key={record.id} className={`flex items-center border-b hover:bg-gray-50 transition-colors ${isSelected ? 'bg-blue-50' : 'bg-white'}`}>
        {/* ID */}
        <div className={`${colWidth} px-3 py-3 text-center min-w-[60px] font-semibold text-gray-700`}>
          {displayIndex}
        </div>

        {/* Image */}
        <div className={`${colWidth} px-3 py-3 text-center flex justify-center cursor-pointer min-w-[100px]`} onClick={() => handleEdit(record)}>
          <img 
            src={imageUrl} 
            alt={displayName} 
            className="w-16 h-16 rounded object-cover hover:opacity-80 transition-opacity"
            loading="lazy"
          />
        </div>

        {/* Name */}
        <div className={`${colWidth} px-3 py-3 min-w-[140px] cursor-pointer`} onClick={() => handleEdit(record)}>
          <div className="font-medium text-gray-900 truncate hover:text-blue-600">{displayName}</div>
        </div>

        {/* Description */}
        <div className={`${colWidth} px-3 py-3 min-w-[120px]`}>
          {record.description && (
            <div className="text-sm text-gray-600 truncate">{record.description}</div>
          )}
        </div>

        {/* Category/Email */}
        <div className={`${colWidth} px-3 py-3 min-w-[100px]`}>
          {record.category && <Badge className="mb-1 block w-fit text-xs">{record.category}</Badge>}
          {record.email && <div className="text-xs text-gray-600 truncate">{record.email}</div>}
        </div>

        {/* Email Sent & Referrals (Waitlist only) */}
        {isWaitlist && (
          <>
            <div className={`${colWidth} px-3 py-3 text-center min-w-[120px]`}>
              {record.emailsSent || record.email_sent ? (
                <Badge className="bg-green-100 text-green-800 text-xs">✓ Sent</Badge>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleResendEmail(record.id, record.email || '')}
                  disabled={resendingEmail === record.id}
                  className="h-7 px-2 text-xs"
                >
                  {resendingEmail === record.id ? 'Sending...' : 'Resend'}
                </Button>
              )}
            </div>
            <div className={`${colWidth} px-3 py-3 text-center min-w-[80px]`}>
              <span className="font-semibold text-gray-900 text-sm">{record.referrals || 0}</span>
            </div>
          </>
        )}

        {/* Created Date */}
        <div className={`${colWidth} px-3 py-3 min-w-[100px]`}>
          {record.created_at && (
            <div className="text-xs text-gray-500 border-t border-gray-300 pt-1">
              {new Date(record.created_at).toLocaleDateString()}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className={`${colWidth} px-3 py-3 text-center min-w-[100px] flex gap-1 justify-center`}>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleEdit(record)}
            className="gap-1 h-8 px-2"
          >
            <Edit className="w-3 h-3" />
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => handleDelete(record.id)}
            className="gap-1 h-8 px-2"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
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
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
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
                {/* Element Filter Tabs */}
                {tab.id === 'elements' && (
                  <div className="flex gap-2 border-b">
                    <button
                      onClick={() => setElementFilter('all')}
                      className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                        elementFilter === 'all'
                          ? 'border-blue-600 text-blue-600'
                          : 'border-transparent text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      All
                    </button>
                    <button
                      onClick={() => setElementFilter('beneficial')}
                      className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                        elementFilter === 'beneficial'
                          ? 'border-green-600 text-green-600'
                          : 'border-transparent text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Beneficial
                    </button>
                    <button
                      onClick={() => setElementFilter('hazardous')}
                      className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                        elementFilter === 'hazardous'
                          ? 'border-red-600 text-red-600'
                          : 'border-transparent text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Hazardous
                    </button>
                  </div>
                )}

                {/* Category Filter */}
                {uniqueCategories.length > 0 && (
                  <div className="flex gap-2 items-center">
                    <label className="text-sm font-medium text-gray-700">Filter by Category:</label>
                    <select
                      value={categoryFilter}
                      onChange={(e) => {
                        setCategoryFilter(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All Categories</option>
                      {uniqueCategories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Search Bar and Bulk Actions */}
                <div className="space-y-2">
                  <div className="flex gap-2">
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
                    <Button className="gap-2">
                      <Plus className="w-4 h-4" />
                      Add
                    </Button>
                  </div>

                  {/* Bulk Edit Section */}
                  {selectedRecords.size > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-2">
                      <div className="text-sm font-medium text-blue-900">
                        {selectedRecords.size} record(s) selected
                      </div>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Field name (e.g., category, status)"
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
                          onClick={async () => {
                            if (!bulkEditField || !bulkEditValue || !currentTab) return;
                            try {
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
                              setSelectedRecords(new Set());
                              setBulkEditField('');
                              setBulkEditValue('');
                              fetchRecords();
                            } catch (error) {
                              console.error('Bulk edit error:', error);
                              toast.error('Failed to update records');
                            }
                          }}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          Bulk Update
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setSelectedRecords(new Set());
                            setBulkEditField('');
                            setBulkEditValue('');
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Records Table */}
                <div className="border rounded-lg overflow-hidden">
                  {renderTableHeader()}
                  <div className="bg-white">
                    {loading ? (
                      <div className="text-center py-8 text-gray-500">Loading...</div>
                    ) : paginatedRecords.length > 0 ? (
                      paginatedRecords.map(record => renderRecordRow(record))
                    ) : (
                      <div className="text-center py-8 text-gray-500">No records found</div>
                    )}
                  </div>
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

      {/* Unified Edit Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Record</DialogTitle>
            <DialogDescription>
              Update the record details below
            </DialogDescription>
          </DialogHeader>

          {editingRecord && (
            <div className="space-y-4">
              {/* Image Preview & Upload */}
              <div className="space-y-2">
                <Label>Image</Label>
                <div className="flex gap-4 items-start">
                  {editingRecord.image_url && (
                    <div className="flex-shrink-0">
                      <img 
                        src={editingRecord.image_url} 
                        alt="Record" 
                        className="w-32 h-32 rounded object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1 space-y-2">
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
                              setEditingRecord({
                                ...editingRecord,
                                image_url: base64
                              });
                              toast.success('Image ready to upload');
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
                    <p className="text-xs text-gray-500">
                      Upload a new image to replace the current one
                    </p>
                  </div>
                </div>
              </div>

              {/* Dynamic Fields */}
              {Object.entries(editingRecord).map(([key, value]) => {
                if (key === 'id' || key === 'created_at' || key === 'updated_at' || key === 'image_url' || key === 'avatar_url') return null;
                
                return (
                  <div key={key} className="space-y-2">
                    <Label className="capitalize">{key.replace(/_/g, ' ')}</Label>
                    {key === 'description' || key === 'health_benefits' ? (
                      <Textarea
                        value={value || ''}
                        onChange={(e) => setEditingRecord({
                          ...editingRecord,
                          [key]: e.target.value
                        })}
                        className="min-h-24"
                      />
                    ) : (
                      <Input
                        value={value || ''}
                        onChange={(e) => setEditingRecord({
                          ...editingRecord,
                          [key]: e.target.value
                        })}
                      />
                    )}
                  </div>
                );
              })}

              {/* Save Button */}
              <div className="flex gap-2 justify-end pt-4">
                <Button variant="outline" onClick={() => setShowEditModal(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
