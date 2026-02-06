import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Alert, AlertDescription } from './ui/alert';
import { StandardDataView } from './StandardDataView';
import { AIImageGenerator } from './AIImageGenerator';
import {
  ArrowLeft,
  Save,
  RefreshCw,
  Wand2,
  Info
} from 'lucide-react';
import { toast } from 'sonner';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface Pollutant {
  id?: string;
  name: string;
  category: string;
  description: string;
  risk_level: string;
  health_risks: string;
  sources: string;
  safe_limit: string;
  unit: string;
  alternatives: string;
  regulatory_status: string;
  source?: string;
  api_source?: string;
  imported_at?: string;
  image_url?: string;
  created_at?: string;
  updated_at?: string;
}

interface PollutantEditorProps {
  onBack?: () => void;
}

export function PollutantEditor({ onBack }: PollutantEditorProps) {
  const [pollutants, setPollutants] = useState<Pollutant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('list');
  const [editingPollutant, setEditingPollutant] = useState<Pollutant | null>(null);
  const [formData, setFormData] = useState<Pollutant>({
    name: '',
    category: 'Heavy Metals',
    description: '',
    risk_level: 'Medium',
    health_risks: '',
    sources: '',
    safe_limit: '',
    unit: 'mg/kg',
    alternatives: '',
    regulatory_status: '',
    image_url: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [serverMode, setServerMode] = useState<string>('unknown');

  const pollutantCategories = [
    'Heavy Metals',
    'Pesticides',
    'Air Pollutants',
    'Water Contaminants',
    'Food Additives',
    'Industrial Chemicals',
    'Microplastics',
    'Chemical',
    'Physical',
    'Other'
  ];

  const riskLevels = ['Low', 'Medium', 'High', 'Very High'];

  useEffect(() => {
    loadPollutants();
  }, []);

  const loadPollutants = async () => {
    setIsLoading(true);
    try {
      console.log('🔍 Loading pollutants from server...');
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-557a7646/admin/pollutants`,
        {
          headers: { 'Authorization': `Bearer ${publicAnonKey}` }
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log('📋 Server response:', data);
        
        // Handle different response formats
        let pollutantRecords = [];
        if (data.records) {
          pollutantRecords = data.records;
        } else if (data.pollutants) {
          pollutantRecords = data.pollutants;
        } else if (Array.isArray(data)) {
          pollutantRecords = data;
        }
        
        // Set server mode for user information
        setServerMode(data.serverMode || 'unknown');
        
        setPollutants(pollutantRecords);
        console.log(`✅ Loaded ${pollutantRecords.length} pollutants`);
        
        if (pollutantRecords.length === 0) {
          console.log('💡 No pollutants found - server may be in memory mode with empty data');
        }
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Error loading pollutants:', error);
      toast.error('Failed to load pollutants');
      setPollutants([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Pollutant name is required');
      return;
    }

    setIsSaving(true);
    try {
      const url = editingPollutant
        ? `https://${projectId}.supabase.co/functions/v1/make-server-557a7646/admin/pollutants/${editingPollutant.id}`
        : `https://${projectId}.supabase.co/functions/v1/make-server-557a7646/admin/pollutants`;

      const method = editingPollutant ? 'PUT' : 'POST';

      console.log('💾 Saving pollutant:', formData.name);

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
        console.log('✅ Pollutant saved successfully:', result);
        
        toast.success(editingPollutant ? 'Pollutant updated successfully' : 'Pollutant created successfully');
        
        // Refresh the list
        await loadPollutants();
        
        // Reset form
        resetForm();
        setActiveTab('list');
      } else {
        const errorData = await response.text();
        console.error('❌ Save failed:', errorData);
        throw new Error(errorData);
      }
    } catch (error) {
      console.error('❌ Error saving pollutant:', error);
      toast.error('Failed to save pollutant');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (pollutant: Pollutant) => {
    setEditingPollutant(pollutant);
    setFormData({ ...pollutant });
    setActiveTab('edit');
  };

  const handleDelete = async (pollutant: Pollutant) => {
    if (!confirm('Are you sure you want to delete this pollutant?')) return;

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-557a7646/admin/pollutants/${pollutant.id}`,
        {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${publicAnonKey}` }
        }
      );

      if (response.ok) {
        toast.success('Pollutant deleted successfully');
        await loadPollutants();
      } else {
        throw new Error('Delete failed');
      }
    } catch (error) {
      console.error('❌ Error deleting pollutant:', error);
      toast.error('Failed to delete pollutant');
    }
  };

  const handleCreate = () => {
    resetForm();
    setActiveTab('edit');
  };

  const resetForm = () => {
    setEditingPollutant(null);
    setFormData({
      name: '',
      category: 'Heavy Metals',
      description: '',
      risk_level: 'Medium',
      health_risks: '',
      sources: '',
      safe_limit: '',
      unit: 'mg/kg',
      alternatives: '',
      regulatory_status: '',
      image_url: ''
    });
  };

  const handleImageGenerated = (imageUrl: string) => {
    setFormData(prev => ({ ...prev, image_url: imageUrl }));
    toast.success('Image generated and attached to pollutant');
  };

  const customColumns = [
    { key: 'id', label: 'ID', sortable: true },
    { key: 'image', label: 'Image', sortable: false },
    { key: 'name', label: 'Name', sortable: true },
    { key: 'category', label: 'Category', sortable: true },
    { key: 'risk_level', label: 'Risk Level', sortable: true, render: (value: string) => (
      <Badge variant={
        value === 'Very High' ? 'destructive' :
        value === 'High' ? 'default' :
        value === 'Medium' ? 'secondary' : 'outline'
      } className="text-xs">
        {value}
      </Badge>
    )},
    { key: 'safe_limit', label: 'Safe Limit', sortable: false },
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
              <h1 className="text-2xl font-bold text-gray-900">Pollutant Database Editor</h1>
              <p className="text-gray-600">Manage environmental pollutants and contaminants</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Badge variant="outline" className="text-sm">
              {pollutants.length} Total Pollutants
            </Badge>
            {serverMode === 'memory-storage' && (
              <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                Memory Mode
              </Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={loadPollutants}
              disabled={isLoading}
              className="flex items-center space-x-2"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </Button>
          </div>
        </div>

        {/* Memory Mode Information */}
        {serverMode === 'memory-storage' && pollutants.length === 0 && (
          <Alert className="mb-6">
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Demo Mode Active:</strong> No pollutant records found in memory storage. 
              Add some sample pollutants below to get started, or create database tables 
              following DATABASE_SETUP.md for persistent storage.
            </AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="list">
              Pollutant List ({pollutants.length})
            </TabsTrigger>
            <TabsTrigger value="edit">
              {editingPollutant ? 'Edit Pollutant' : 'Add Pollutant'}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="space-y-6">
            <StandardDataView
              data={pollutants}
              recordType="pollutant"
              isLoading={isLoading}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onCreate={handleCreate}
              onRefresh={loadPollutants}
              searchPlaceholder="Search pollutants by name, category, or risk level..."
              emptyMessage="Start building your pollutant database by adding environmental contaminants and toxic substances."
              columns={customColumns}
            />
          </TabsContent>

          <TabsContent value="edit" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Wand2 className="w-5 h-5" />
                  <span>{editingPollutant ? 'Edit Pollutant' : 'Add New Pollutant'}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Basic Information */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900">Basic Information</h3>
                    
                    <div>
                      <Label htmlFor="name">Pollutant Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g., Mercury, Lead, BPA"
                      />
                    </div>

                    <div>
                      <Label htmlFor="category">Category</Label>
                      <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {pollutantCategories.map(category => (
                            <SelectItem key={category} value={category}>{category}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="risk_level">Risk Level</Label>
                      <Select value={formData.risk_level} onValueChange={(value) => setFormData(prev => ({ ...prev, risk_level: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select risk level" />
                        </SelectTrigger>
                        <SelectContent>
                          {riskLevels.map(level => (
                            <SelectItem key={level} value={level}>{level}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="safe_limit">Safe Limit</Label>
                      <Input
                        id="safe_limit"
                        value={formData.safe_limit}
                        onChange={(e) => setFormData(prev => ({ ...prev, safe_limit: e.target.value }))}
                        placeholder="e.g., 0.5"
                      />
                    </div>

                    <div>
                      <Label htmlFor="unit">Unit</Label>
                      <Input
                        id="unit"
                        value={formData.unit}
                        onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                        placeholder="e.g., mg/kg, ppm, µg/L"
                      />
                    </div>
                  </div>

                  {/* Health Information */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900">Health Information</h3>
                    
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Describe this pollutant and its characteristics..."
                        rows={3}
                      />
                    </div>

                    <div>
                      <Label htmlFor="health_risks">Health Risks</Label>
                      <Textarea
                        id="health_risks"
                        value={formData.health_risks}
                        onChange={(e) => setFormData(prev => ({ ...prev, health_risks: e.target.value }))}
                        placeholder="List health risks and effects..."
                        rows={3}
                      />
                    </div>

                    <div>
                      <Label htmlFor="sources">Sources</Label>
                      <Textarea
                        id="sources"
                        value={formData.sources}
                        onChange={(e) => setFormData(prev => ({ ...prev, sources: e.target.value }))}
                        placeholder="Common sources and origins..."
                        rows={2}
                      />
                    </div>
                  </div>

                  {/* Regulatory Information */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900">Regulatory Information</h3>
                    
                    <div>
                      <Label htmlFor="regulatory_status">Regulatory Status</Label>
                      <Textarea
                        id="regulatory_status"
                        value={formData.regulatory_status}
                        onChange={(e) => setFormData(prev => ({ ...prev, regulatory_status: e.target.value }))}
                        placeholder="EPA regulations, WHO guidelines, etc..."
                        rows={2}
                      />
                    </div>

                    <div>
                      <Label htmlFor="alternatives">Alternatives</Label>
                      <Textarea
                        id="alternatives"
                        value={formData.alternatives}
                        onChange={(e) => setFormData(prev => ({ ...prev, alternatives: e.target.value }))}
                        placeholder="Safer alternatives and substitutes..."
                        rows={2}
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
                      recordType="pollutant"
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
                    <span>{editingPollutant ? 'Update Pollutant' : 'Create Pollutant'}</span>
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