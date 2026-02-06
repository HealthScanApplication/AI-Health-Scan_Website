import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Alert, AlertDescription } from './ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { StandardDataView } from './StandardDataView';
import { AIImageGenerator } from './AIImageGenerator';
import { toast } from 'sonner';
import { ArrowLeft, Save, RefreshCw, Wand2, Info } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface Parasite {
  id?: string;
  name: string;
  scientific_name: string;
  common_name?: string;
  category: string;
  description: string;
  transmission: string;
  symptoms: string;
  treatment: string;
  prevention: string;
  geographic_distribution: string;
  host_range: string;
  life_cycle: string;
  health_risk: string;
  food_association: string;
  incubation_period: string;
  source?: string;
  api_source?: string;
  imported_at?: string;
  image_url?: string;
  created_at?: string;
  updated_at?: string;
}

interface ParasiteEditorProps {
  onBack?: () => void;
}

export function ParasiteEditor({ onBack }: ParasiteEditorProps) {
  const [parasites, setParasites] = useState<Parasite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('list');
  const [editingParasite, setEditingParasite] = useState<Parasite | null>(null);
  const [formData, setFormData] = useState<Parasite>({
    name: '',
    scientific_name: '',
    common_name: '',
    category: 'Protozoa',
    description: '',
    transmission: '',
    symptoms: '',
    treatment: '',
    prevention: '',
    geographic_distribution: '',
    host_range: '',
    life_cycle: '',
    health_risk: 'Low',
    food_association: '',
    incubation_period: '',
    image_url: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [serverMode, setServerMode] = useState<string>('unknown');

  // Function to refresh admin stats (used by parent dashboard)
  const refreshAdminStats = async () => {
    try {
      console.log('🔄 Refreshing admin stats after parasite operation...');
      // Just trigger a simple fetch to refresh the admin stats cache
      await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-557a7646/admin/stats`, {
        headers: { 'Authorization': `Bearer ${publicAnonKey}` }
      });
      console.log('✅ Admin stats refresh triggered');
    } catch (error) {
      console.log('ℹ️ Admin stats refresh failed (non-critical):', error);
    }
  };

  const parasiteCategories = [
    'Protozoa',
    'Nematode',
    'Cestode',
    'Trematode',
    'Arthropod',
    'Other'
  ];

  const healthRiskLevels = ['Low', 'Moderate', 'High', 'Very High'];

  useEffect(() => {
    loadParasites();
  }, []);

  const loadParasites = async () => {
    setIsLoading(true);
    try {
      console.log('🔍 Loading parasites from server...');
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-557a7646/admin/parasites`,
        {
          headers: { 'Authorization': `Bearer ${publicAnonKey}` }
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log('📋 Server response:', data);
        
        // Handle different response formats
        let parasiteRecords = [];
        if (data.records) {
          parasiteRecords = data.records;
        } else if (data.parasites) {
          parasiteRecords = data.parasites;
        } else if (Array.isArray(data)) {
          parasiteRecords = data;
        }
        
        // Set server mode for user information
        setServerMode(data.serverMode || 'unknown');
        
        setParasites(parasiteRecords);
        console.log(`✅ Loaded ${parasiteRecords.length} parasites`);
        
        if (parasiteRecords.length === 0) {
          console.log('💡 No parasites found - server may be in memory mode with empty data');
        }
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Error loading parasites:', error);
      toast.error('Failed to load parasites');
      setParasites([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Parasite name is required');
      return;
    }

    setIsSaving(true);
    try {
      const url = editingParasite
        ? `https://${projectId}.supabase.co/functions/v1/make-server-557a7646/admin/parasites/${editingParasite.id}`
        : `https://${projectId}.supabase.co/functions/v1/make-server-557a7646/admin/parasites`;

      const method = editingParasite ? 'PUT' : 'POST';

      console.log('💾 Saving parasite:', formData.name);

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          created_at: formData.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Parasite saved successfully:', result);
        
        toast.success(editingParasite ? 'Parasite updated successfully' : 'Parasite created successfully');
        
        // Refresh the list
        await loadParasites();
        
        // Refresh admin stats to update count displays
        await refreshAdminStats();
        
        // Reset form
        resetForm();
        setActiveTab('list');
      } else {
        const errorData = await response.text();
        console.error('❌ Save failed:', errorData);
        throw new Error(errorData);
      }
    } catch (error) {
      console.error('❌ Error saving parasite:', error);
      toast.error('Failed to save parasite');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (parasite: Parasite) => {
    setEditingParasite(parasite);
    setFormData({ ...parasite });
    setActiveTab('edit');
  };

  const handleDelete = async (parasite: Parasite) => {
    if (!confirm('Are you sure you want to delete this parasite?')) return;

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-557a7646/admin/parasites/${parasite.id}`,
        {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${publicAnonKey}` }
        }
      );

      if (response.ok) {
        toast.success('Parasite deleted successfully');
        await loadParasites();
        
        // Refresh admin stats to update count displays
        await refreshAdminStats();
      } else {
        throw new Error('Delete failed');
      }
    } catch (error) {
      console.error('❌ Error deleting parasite:', error);
      toast.error('Failed to delete parasite');
    }
  };

  const handleCreate = () => {
    resetForm();
    setActiveTab('edit');
  };

  const resetForm = () => {
    setEditingParasite(null);
    setFormData({
      name: '',
      scientific_name: '',
      common_name: '',
      category: 'Protozoa',
      description: '',
      transmission: '',
      symptoms: '',
      treatment: '',
      prevention: '',
      geographic_distribution: '',
      host_range: '',
      life_cycle: '',
      health_risk: 'Low',
      food_association: '',
      incubation_period: '',
      image_url: ''
    });
  };

  const handleImageGenerated = (imageUrl: string) => {
    setFormData(prev => ({ ...prev, image_url: imageUrl }));
    toast.success('Image generated and attached to parasite');
  };

  const customColumns = [
    { key: 'id', label: 'ID', sortable: true },
    { key: 'image', label: 'Image', sortable: false },
    { key: 'name', label: 'Name', sortable: true },
    { key: 'scientific_name', label: 'Scientific Name', sortable: true },
    { key: 'category', label: 'Category', sortable: true },
    { key: 'health_risk', label: 'Health Risk', sortable: true, render: (value: string) => (
      <Badge variant={
        value === 'Very High' ? 'destructive' :
        value === 'High' ? 'default' :
        value === 'Moderate' ? 'secondary' : 'outline'
      } className="text-xs">
        {value}
      </Badge>
    )},
    { key: 'source', label: 'Source', sortable: true },
    { key: 'actions', label: 'Actions', sortable: false }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            {onBack && (
              <Button
                variant="outline"
                size="sm"
                onClick={onBack}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Admin</span>
              </Button>
            )}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Parasite Database Editor</h1>
              <p className="text-gray-600">Manage parasites, pathogens, and foodborne threats</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Badge variant="outline" className="text-sm bg-orange-50 text-orange-700 border-orange-200">
              🦠 {parasites.length} Total Parasites {parasites.length === 35 ? '(Full Demo Set)' : ''}
            </Badge>
            {serverMode === 'memory-storage' && (
              <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                Memory Mode
              </Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={loadParasites}
              disabled={isLoading}
              className="flex items-center space-x-2"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </Button>
          </div>
        </div>

        {/* Memory Mode Information */}
        {serverMode === 'memory-storage' && (
          <Alert className="mb-6">
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Memory Storage Mode:</strong> {parasites.length === 0 
                ? 'No parasite records found. The comprehensive parasite database with 35+ species should be automatically loaded. Try refreshing or check server initialization.'
                : `Currently loaded with ${parasites.length} comprehensive parasite records including Protozoa, Nematodes, Cestodes, Trematodes, and Arthropods. All CRUD operations work normally.`}
            </AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="list">
              Parasite List ({parasites.length})
            </TabsTrigger>
            <TabsTrigger value="edit">
              {editingParasite ? 'Edit Parasite' : 'Add Parasite'}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="space-y-6">
            <StandardDataView
              data={parasites}
              recordType="parasite"
              isLoading={isLoading}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onCreate={handleCreate}
              onRefresh={loadParasites}
              searchPlaceholder="Search parasites by name, category, or health risk..."
              emptyMessage="The comprehensive parasite database should contain 35+ species including foodborne, waterborne, and vector-borne parasites."
              columns={customColumns}
            />
          </TabsContent>

          <TabsContent value="edit" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Wand2 className="w-5 h-5" />
                  <span>{editingParasite ? 'Edit Parasite' : 'Add New Parasite'}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Basic Information */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900">Basic Information</h3>
                    
                    <div>
                      <Label htmlFor="name">Parasite Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g., Giardia, Roundworm"
                      />
                    </div>

                    <div>
                      <Label htmlFor="scientific_name">Scientific Name</Label>
                      <Input
                        id="scientific_name"
                        value={formData.scientific_name}
                        onChange={(e) => setFormData(prev => ({ ...prev, scientific_name: e.target.value }))}
                        placeholder="e.g., Giardia lamblia"
                      />
                    </div>

                    <div>
                      <Label htmlFor="common_name">Common Name</Label>
                      <Input
                        id="common_name"
                        value={formData.common_name || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, common_name: e.target.value }))}
                        placeholder="e.g., Beaver fever parasite"
                      />
                    </div>

                    <div>
                      <Label htmlFor="category">Category</Label>
                      <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {parasiteCategories.map(category => (
                            <SelectItem key={category} value={category}>{category}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="health_risk">Health Risk Level</Label>
                      <Select value={formData.health_risk} onValueChange={(value) => setFormData(prev => ({ ...prev, health_risk: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select risk level" />
                        </SelectTrigger>
                        <SelectContent>
                          {healthRiskLevels.map(level => (
                            <SelectItem key={level} value={level}>{level}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Medical Information */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900">Medical Information</h3>
                    
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Describe this parasite and its characteristics..."
                        rows={3}
                      />
                    </div>

                    <div>
                      <Label htmlFor="symptoms">Symptoms</Label>
                      <Textarea
                        id="symptoms"
                        value={formData.symptoms}
                        onChange={(e) => setFormData(prev => ({ ...prev, symptoms: e.target.value }))}
                        placeholder="List common symptoms and health effects..."
                        rows={3}
                      />
                    </div>

                    <div>
                      <Label htmlFor="treatment">Treatment</Label>
                      <Textarea
                        id="treatment"
                        value={formData.treatment}
                        onChange={(e) => setFormData(prev => ({ ...prev, treatment: e.target.value }))}
                        placeholder="Medical treatments and medications..."
                        rows={2}
                      />
                    </div>

                    <div>
                      <Label htmlFor="prevention">Prevention</Label>
                      <Textarea
                        id="prevention"
                        value={formData.prevention}
                        onChange={(e) => setFormData(prev => ({ ...prev, prevention: e.target.value }))}
                        placeholder="Prevention methods and hygiene practices..."
                        rows={2}
                      />
                    </div>
                  </div>

                  {/* Biological Information */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900">Biological Information</h3>
                    
                    <div>
                      <Label htmlFor="transmission">Transmission</Label>
                      <Textarea
                        id="transmission"
                        value={formData.transmission}
                        onChange={(e) => setFormData(prev => ({ ...prev, transmission: e.target.value }))}
                        placeholder="How this parasite spreads and transmits..."
                        rows={2}
                      />
                    </div>

                    <div>
                      <Label htmlFor="life_cycle">Life Cycle</Label>
                      <Textarea
                        id="life_cycle"
                        value={formData.life_cycle}
                        onChange={(e) => setFormData(prev => ({ ...prev, life_cycle: e.target.value }))}
                        placeholder="Life cycle stages and development..."
                        rows={2}
                      />
                    </div>

                    <div>
                      <Label htmlFor="host_range">Host Range</Label>
                      <Input
                        id="host_range"
                        value={formData.host_range}
                        onChange={(e) => setFormData(prev => ({ ...prev, host_range: e.target.value }))}
                        placeholder="e.g., Humans, mammals, birds"
                      />
                    </div>

                    <div>
                      <Label htmlFor="food_association">Food Association</Label>
                      <Textarea
                        id="food_association"
                        value={formData.food_association}
                        onChange={(e) => setFormData(prev => ({ ...prev, food_association: e.target.value }))}
                        placeholder="Foods commonly associated with this parasite..."
                        rows={2}
                      />
                    </div>

                    <div>
                      <Label htmlFor="geographic_distribution">Geographic Distribution</Label>
                      <Input
                        id="geographic_distribution"
                        value={formData.geographic_distribution}
                        onChange={(e) => setFormData(prev => ({ ...prev, geographic_distribution: e.target.value }))}
                        placeholder="e.g., Worldwide, Tropical regions"
                      />
                    </div>

                    <div>
                      <Label htmlFor="incubation_period">Incubation Period</Label>
                      <Input
                        id="incubation_period"
                        value={formData.incubation_period}
                        onChange={(e) => setFormData(prev => ({ ...prev, incubation_period: e.target.value }))}
                        placeholder="e.g., 1-3 weeks"
                      />
                    </div>

                    <div>
                      <Label htmlFor="image_url">Image URL</Label>
                      <Input
                        id="image_url"
                        value={formData.image_url || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
                        placeholder="https://example.com/image.jpg"
                      />
                    </div>

                    {/* AI Image Generation */}
                    <AIImageGenerator
                      recordType="parasite"
                      itemName={formData.name}
                      category={formData.category}
                      onImageGenerated={handleImageGenerated}
                    />
                  </div>
                </div>

                {/* Image Preview */}
                {formData.image_url && (
                  <div>
                    <Label>Image Preview</Label>
                    <div className="mt-2 h-32 w-32 border rounded-lg overflow-hidden bg-gray-50">
                      <img
                        src={formData.image_url}
                        alt={formData.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-6 border-t">
                  <Button
                    variant="outline"
                    onClick={() => {
                      resetForm();
                      setActiveTab('list');
                    }}
                  >
                    Cancel
                  </Button>
                  
                  <Button
                    onClick={handleSave}
                    disabled={isSaving || !formData.name.trim()}
                    className="flex items-center space-x-2"
                  >
                    {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    <span>{editingParasite ? 'Update Parasite' : 'Create Parasite'}</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}