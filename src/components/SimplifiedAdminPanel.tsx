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
  email?: string;
  title?: string;
  category?: string;
  description?: string;
  image_url?: string;
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

  const renderRecordRow = (record: AdminRecord) => (
    <div key={record.id} className="flex items-center justify-between p-4 bg-white border rounded-lg hover:shadow-md transition-shadow">
      <div className="flex items-center gap-4 flex-1">
        {record.image_url && (
          <img 
            src={record.image_url} 
            alt={record.name || 'Record'} 
            className="w-12 h-12 rounded object-cover"
            loading="lazy"
          />
        )}
        <div className="flex-1">
          <div className="font-medium text-gray-900">
            {record.name || record.email || record.title || 'Unnamed'}
          </div>
          {record.email && <div className="text-sm text-gray-600">{record.email}</div>}
          {record.category && <Badge className="mt-1">{record.category}</Badge>}
          {record.description && (
            <div className="text-sm text-gray-600 line-clamp-2 mt-1">{record.description}</div>
          )}
          {record.created_at && (
            <div className="text-xs text-gray-500 mt-1">
              {new Date(record.created_at).toLocaleDateString()}
            </div>
          )}
        </div>
      </div>
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleEdit(record)}
          className="gap-2"
        >
          <Edit className="w-4 h-4" />
          Edit
        </Button>
        <Button
          size="sm"
          variant="destructive"
          onClick={() => handleDelete(record.id)}
          className="gap-2"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );

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
                {/* Search Bar */}
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

                {/* Records List */}
                <div className="space-y-2">
                  {loading ? (
                    <div className="text-center py-8 text-gray-500">Loading...</div>
                  ) : filteredRecords.length > 0 ? (
                    filteredRecords.map(record => renderRecordRow(record))
                  ) : (
                    <div className="text-center py-8 text-gray-500">No records found</div>
                  )}
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
