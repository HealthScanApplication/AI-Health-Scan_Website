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
      
      // Build query with proper filters
      let url = `https://${projectId}.supabase.co/rest/v1/${currentTab.table}?limit=100`;
      
      // Add category filter for elements
      if (activeTab === 'elements') {
        url += '&order=category.asc,name.asc';
      } else if (activeTab !== 'users') {
        url += '&order=created_at.desc';
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'apikey': publicAnonKey,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Loaded ${data?.length || 0} ${currentTab.label}`);
        setRecords(Array.isArray(data) ? data : []);
      } else {
        console.warn(`⚠️ Failed to fetch ${currentTab.label}:`, response.status, response.statusText);
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

  const filteredRecords = records.filter(record => {
    const searchLower = searchQuery.toLowerCase();
    return (
      (record.name?.toLowerCase().includes(searchLower)) ||
      (record.email?.toLowerCase().includes(searchLower)) ||
      (record.title?.toLowerCase().includes(searchLower)) ||
      (record.category?.toLowerCase().includes(searchLower))
    );
  });

  const PLACEHOLDER_IMAGE = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23e5e7eb" width="200" height="200"/%3E%3Ctext x="50%25" y="50%25" font-size="14" fill="%236b7280" text-anchor="middle" dy=".3em"%3ENo Image%3C/text%3E%3C/svg%3E';

  const getDisplayName = (record: AdminRecord) => {
    return record.name_common || record.name || record.email || record.title || 'Unnamed';
  };

  const getImageUrl = (record: AdminRecord) => {
    return record.image_url || record.avatar_url || PLACEHOLDER_IMAGE;
  };

  const renderTableHeader = () => {
    return (
      <div className="flex items-center bg-gray-100 border-b font-semibold text-sm sticky top-0">
        <div className="w-12 px-4 py-3 text-center">Select</div>
        <div className="w-28 px-4 py-3 text-center">Image</div>
        <div className="flex-1 px-4 py-3 min-w-0">Name</div>
        <div className="w-40 px-4 py-3">Category/Email</div>
        <div className="w-48 px-4 py-3">Description</div>
        <div className="w-32 px-4 py-3">Actions</div>
      </div>
    );
  };

  const renderRecordRow = (record: AdminRecord) => {
    const imageUrl = getImageUrl(record);
    const displayName = getDisplayName(record);
    const isSelected = selectedRecords.has(record.id);

    return (
      <div key={record.id} className={`flex items-center border-b hover:bg-gray-50 transition-colors ${isSelected ? 'bg-blue-50' : 'bg-white'}`}>
        {/* Checkbox */}
        <div className="w-12 px-4 py-3 text-center flex justify-center">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => {
              const newSelected = new Set(selectedRecords);
              if (e.target.checked) {
                newSelected.add(record.id);
              } else {
                newSelected.delete(record.id);
              }
              setSelectedRecords(newSelected);
            }}
            className="w-4 h-4"
            title="Select record"
          />
        </div>

        {/* Image */}
        <div className="w-28 px-4 py-3 text-center flex justify-center">
          <img 
            src={imageUrl} 
            alt={displayName} 
            className="w-20 h-20 rounded object-cover"
            loading="lazy"
          />
        </div>

        {/* Name */}
        <div className="flex-1 px-4 py-3 min-w-0">
          <div className="font-medium text-gray-900 truncate">{displayName}</div>
          {record.created_at && (
            <div className="text-xs text-gray-500">
              {new Date(record.created_at).toLocaleDateString()}
            </div>
          )}
        </div>

        {/* Category/Email */}
        <div className="w-40 px-4 py-3">
          {record.category && <Badge className="mb-1 block w-fit">{record.category}</Badge>}
          {record.email && <div className="text-sm text-gray-600 truncate">{record.email}</div>}
        </div>

        {/* Description */}
        <div className="w-48 px-4 py-3">
          {record.description && (
            <div className="text-sm text-gray-600 line-clamp-2">{record.description}</div>
          )}
        </div>

        {/* Actions */}
        <div className="w-32 px-4 py-3 flex gap-1">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleEdit(record)}
            className="gap-1"
          >
            <Edit className="w-3 h-3" />
            Edit
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => handleDelete(record.id)}
            className="gap-1"
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
                {/* Search Bar and Bulk Actions */}
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                      <Input
                        placeholder={`Search ${tab.label.toLowerCase()}...`}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
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
                    ) : filteredRecords.length > 0 ? (
                      filteredRecords.map(record => renderRecordRow(record))
                    ) : (
                      <div className="text-center py-8 text-gray-500">No records found</div>
                    )}
                  </div>
                </div>

                {/* Record Count */}
                <div className="text-sm text-gray-600">
                  Showing {filteredRecords.length} of {records.length} records
                </div>
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
              {/* Image Preview */}
              {editingRecord.image_url && (
                <div className="flex justify-center">
                  <img 
                    src={editingRecord.image_url} 
                    alt="Record" 
                    className="w-32 h-32 rounded object-cover"
                  />
                </div>
              )}

              {/* Dynamic Fields */}
              {Object.entries(editingRecord).map(([key, value]) => {
                if (key === 'id' || key === 'created_at' || key === 'updated_at') return null;
                
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
