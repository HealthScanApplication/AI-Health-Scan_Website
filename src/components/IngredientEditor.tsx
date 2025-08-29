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
import { toast } from 'sonner@2.0.3';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface Ingredient {
  id?: string;
  name: string;
  category: string;
  common_name: string;
  scientific_name: string;
  origin: string;
  description: string;
  nutritional_profile: string;
  health_benefits: string;
  preparation_methods: string;
  storage_recommendations: string;
  allergen_information: string;
  sustainability_rating: string;
  seasonal_availability: string;
  cost_per_unit: string;
  shelf_life: string;
  culinary_uses: string;
  active_compounds: string;
  processing_methods: string;
  quality_grades: string;
  certifications: string;
  supplier_info: string;
  source?: string;
  api_source?: string;
  imported_at?: string;
  image_url?: string;
  created_at?: string;
  updated_at?: string;
}

interface IngredientEditorProps {
  onBack?: () => void;
}

export function IngredientEditor({ onBack }: IngredientEditorProps) {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('list');
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);
  const [formData, setFormData] = useState<Ingredient>({
    name: '',
    category: 'Natural Ingredients',
    common_name: '',
    scientific_name: '',
    origin: '',
    description: '',
    nutritional_profile: '',
    health_benefits: '',
    preparation_methods: '',
    storage_recommendations: '',
    allergen_information: '',
    sustainability_rating: 'B',
    seasonal_availability: '',
    cost_per_unit: '',
    shelf_life: '',
    culinary_uses: '',
    active_compounds: '',
    processing_methods: '',
    quality_grades: '',
    certifications: '',
    supplier_info: '',
    image_url: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [serverMode, setServerMode] = useState<string>('unknown');

  const ingredientCategories = [
    'Natural Ingredients',
    'Fruits',
    'Vegetables', 
    'Grains',
    'Proteins',
    'Spices & Herbs',
    'Oils & Fats',
    'Sweeteners',
    'Preservatives',
    'Additives'
  ];

  const sustainabilityRatings = ['A+', 'A', 'B+', 'B', 'C+', 'C', 'D'];

  useEffect(() => {
    loadIngredients();
  }, []);

  const loadIngredients = async () => {
    setIsLoading(true);
    try {
      console.log('🔍 Loading ingredients from server...');
      
      // Use the correct server endpoint path
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ed0fe4c2/admin/ingredients`,
        {
          headers: { 'Authorization': `Bearer ${publicAnonKey}` }
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log('📋 Server response:', data);
        
        // Handle different response formats with proper null checks
        let ingredientRecords: Ingredient[] = [];
        if (data && data.records && Array.isArray(data.records)) {
          ingredientRecords = data.records;
        } else if (data && data.ingredients && Array.isArray(data.ingredients)) {
          ingredientRecords = data.ingredients;
        } else if (Array.isArray(data)) {
          ingredientRecords = data;
        }
        
        // Set server mode for user information
        setServerMode(data?.serverMode || 'unknown');
        
        setIngredients(ingredientRecords);
        console.log(`✅ Loaded ${ingredientRecords.length} ingredients`);
        
        if (ingredientRecords.length === 0) {
          console.log('💡 No ingredients found - server may be in memory mode with empty data');
        }
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Error loading ingredients:', error);
      toast.error('Failed to load ingredients');
      setIngredients([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name?.trim()) {
      toast.error('Ingredient name is required');
      return;
    }

    setIsSaving(true);
    try {
      // Use the correct server endpoint path
      const url = editingIngredient
        ? `https://${projectId}.supabase.co/functions/v1/make-server-ed0fe4c2/admin/ingredients/${editingIngredient.id}`
        : `https://${projectId}.supabase.co/functions/v1/make-server-ed0fe4c2/admin/ingredients`;

      const method = editingIngredient ? 'PUT' : 'POST';

      console.log('💾 Saving ingredient:', formData.name);

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
        console.log('✅ Ingredient saved successfully:', result);
        
        toast.success(editingIngredient ? 'Ingredient updated successfully' : 'Ingredient created successfully');
        
        // Refresh the list
        await loadIngredients();
        
        // Reset form
        resetForm();
        setActiveTab('list');
      } else {
        const errorData = await response.text();
        console.error('❌ Save failed:', errorData);
        throw new Error(errorData);
      }
    } catch (error) {
      console.error('❌ Error saving ingredient:', error);
      toast.error('Failed to save ingredient');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (ingredient: Ingredient) => {
    setEditingIngredient(ingredient);
    setFormData({ ...ingredient });
    setActiveTab('edit');
  };

  const handleDelete = async (ingredient: Ingredient) => {
    if (!confirm('Are you sure you want to delete this ingredient?')) return;

    try {
      // Use the correct server endpoint path
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ed0fe4c2/admin/ingredients/${ingredient.id}`,
        {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${publicAnonKey}` }
        }
      );

      if (response.ok) {
        toast.success('Ingredient deleted successfully');
        await loadIngredients();
      } else {
        throw new Error('Delete failed');
      }
    } catch (error) {
      console.error('❌ Error deleting ingredient:', error);
      toast.error('Failed to delete ingredient');
    }
  };

  const handleCreate = () => {
    resetForm();
    setActiveTab('edit');
  };

  const resetForm = () => {
    setEditingIngredient(null);
    setFormData({
      name: '',
      category: 'Natural Ingredients',
      common_name: '',
      scientific_name: '',
      origin: '',
      description: '',
      nutritional_profile: '',
      health_benefits: '',
      preparation_methods: '',
      storage_recommendations: '',
      allergen_information: '',
      sustainability_rating: 'B',
      seasonal_availability: '',
      cost_per_unit: '',
      shelf_life: '',
      culinary_uses: '',
      active_compounds: '',
      processing_methods: '',
      quality_grades: '',
      certifications: '',
      supplier_info: '',
      image_url: ''
    });
  };

  const handleImageGenerated = (imageUrl: string) => {
    setFormData(prev => ({ ...prev, image_url: imageUrl }));
    toast.success('Image generated and attached to ingredient');
  };

  const customColumns = [
    { key: 'id', label: 'ID', sortable: true },
    { key: 'image', label: 'Image', sortable: false },
    { key: 'name', label: 'Name', sortable: true },
    { key: 'category', label: 'Category', sortable: true },
    { key: 'common_name', label: 'Common Name', sortable: true },
    { key: 'origin', label: 'Origin', sortable: true },
    { key: 'sustainability_rating', label: 'Sustainability', sortable: true, render: (value: string) => (
      <Badge variant={value >= 'B' ? 'default' : 'secondary'} className="text-xs">
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
              <h1 className="text-2xl font-bold text-gray-900">Ingredient Database Editor</h1>
              <p className="text-gray-600">Manage food ingredients, additives, and components</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Badge variant="outline" className="text-sm">
              {ingredients.length} Total Ingredients
            </Badge>
            {serverMode === 'memory-storage' && (
              <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                Memory Mode
              </Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={loadIngredients}
              disabled={isLoading}
              className="flex items-center space-x-2"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </Button>
          </div>
        </div>

        {/* Memory Mode Information */}
        {serverMode === 'memory-storage' && ingredients.length === 0 && (
          <Alert className="mb-6">
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Demo Mode Active:</strong> No ingredient records found in memory storage. 
              Add some sample ingredients below to get started, or create database tables 
              following DATABASE_SETUP.md for persistent storage.
            </AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="list">
              Ingredient List ({ingredients.length})
            </TabsTrigger>
            <TabsTrigger value="edit">
              {editingIngredient ? 'Edit Ingredient' : 'Add Ingredient'}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="space-y-6">
            <StandardDataView
              data={ingredients || []} // Ensure it's always an array
              recordType="ingredient"
              isLoading={isLoading}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onCreate={handleCreate}
              onRefresh={loadIngredients}
              searchPlaceholder="Search ingredients by name, category, or origin..."
              emptyMessage="Start building your ingredient database by adding natural ingredients, additives, and food components."
              columns={customColumns}
            />
          </TabsContent>

          <TabsContent value="edit" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Wand2 className="w-5 h-5" />
                  <span>{editingIngredient ? 'Edit Ingredient' : 'Add New Ingredient'}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Basic Information */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900">Basic Information</h3>
                    
                    <div>
                      <Label htmlFor="name">Ingredient Name *</Label>
                      <Input
                        id="name"
                        value={formData.name || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g., Organic Apple, Quinoa, Turmeric"
                      />
                    </div>

                    <div>
                      <Label htmlFor="common_name">Common Name</Label>
                      <Input
                        id="common_name"
                        value={formData.common_name || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, common_name: e.target.value }))}
                        placeholder="Popular or trade name"
                      />
                    </div>

                    <div>
                      <Label htmlFor="scientific_name">Scientific Name</Label>
                      <Input
                        id="scientific_name"
                        value={formData.scientific_name || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, scientific_name: e.target.value }))}
                        placeholder="e.g., Malus domestica"
                      />
                    </div>

                    <div>
                      <Label htmlFor="category">Category</Label>
                      <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {ingredientCategories.map(category => (
                            <SelectItem key={category} value={category}>{category}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="origin">Origin</Label>
                      <Input
                        id="origin"
                        value={formData.origin || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, origin: e.target.value }))}
                        placeholder="Geographic origin or source"
                      />
                    </div>
                  </div>

                  {/* Detailed Information */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900">Detailed Information</h3>
                    
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={formData.description || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Describe this ingredient..."
                        rows={3}
                      />
                    </div>

                    <div>
                      <Label htmlFor="nutritional_profile">Nutritional Profile</Label>
                      <Textarea
                        id="nutritional_profile"
                        value={formData.nutritional_profile || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, nutritional_profile: e.target.value }))}
                        placeholder="Key nutritional components..."
                        rows={2}
                      />
                    </div>

                    <div>
                      <Label htmlFor="health_benefits">Health Benefits</Label>
                      <Textarea
                        id="health_benefits"
                        value={formData.health_benefits || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, health_benefits: e.target.value }))}
                        placeholder="Health benefits and properties..."
                        rows={3}
                      />
                    </div>

                    <div>
                      <Label htmlFor="allergen_information">Allergen Information</Label>
                      <Textarea
                        id="allergen_information"
                        value={formData.allergen_information || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, allergen_information: e.target.value }))}
                        placeholder="Known allergens and sensitivities..."
                        rows={2}
                      />
                    </div>
                  </div>

                  {/* Practical Information */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900">Practical Information</h3>
                    
                    <div>
                      <Label htmlFor="storage_recommendations">Storage Recommendations</Label>
                      <Textarea
                        id="storage_recommendations"
                        value={formData.storage_recommendations || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, storage_recommendations: e.target.value }))}
                        placeholder="How to store properly..."
                        rows={2}
                      />
                    </div>

                    <div>
                      <Label htmlFor="shelf_life">Shelf Life</Label>
                      <Input
                        id="shelf_life"
                        value={formData.shelf_life || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, shelf_life: e.target.value }))}
                        placeholder="e.g., 2 weeks, 6 months"
                      />
                    </div>

                    <div>
                      <Label htmlFor="sustainability_rating">Sustainability Rating</Label>
                      <Select value={formData.sustainability_rating} onValueChange={(value) => setFormData(prev => ({ ...prev, sustainability_rating: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {sustainabilityRatings.map(rating => (
                            <SelectItem key={rating} value={rating}>{rating}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="cost_per_unit">Cost Per Unit</Label>
                      <Input
                        id="cost_per_unit"
                        value={formData.cost_per_unit || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, cost_per_unit: e.target.value }))}
                        placeholder="e.g., $2.50/lb"
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
                      recordType="ingredient"
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
                    disabled={isSaving || !formData.name?.trim()}
                    className="flex items-center space-x-2"
                  >
                    {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    <span>{editingIngredient ? 'Update Ingredient' : 'Create Ingredient'}</span>
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