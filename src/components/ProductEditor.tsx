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

interface Product {
  id?: string;
  name: string;
  brand: string;
  category: string;
  description: string;
  barcode: string;
  manufacturer: string;
  country: string;
  status: string;
  health_score: number | null;
  ingredients: string;
  nutrition_facts: string;
  allergens: string;
  source?: string;
  api_source?: string;
  imported_at?: string;
  image_url?: string;
  created_at?: string;
  updated_at?: string;
}

interface ProductEditorProps {
  onBack?: () => void;
  accessToken: string;
  onStatsUpdate?: () => void;
}

export function ProductEditor({ onBack, accessToken, onStatsUpdate }: ProductEditorProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('list');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<Product>({
    name: '',
    brand: '',
    category: 'Food & Beverages',
    description: '',
    barcode: '',
    manufacturer: '',
    country: '',
    status: 'active',
    health_score: null,
    ingredients: '',
    nutrition_facts: '',
    allergens: '',
    image_url: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [serverMode, setServerMode] = useState<string>('unknown');

  const productCategories = [
    'Food & Beverages',
    'Snacks',
    'Dairy',
    'Meat & Poultry',
    'Fruits & Vegetables',
    'Bakery',
    'Frozen Foods',
    'Canned Goods',
    'Beverages',
    'Health & Wellness',
    'Personal Care',
    'Household',
    'Other'
  ];

  const statusOptions = ['active', 'inactive', 'pending', 'discontinued'];

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setIsLoading(true);
    try {
      console.log('🔍 Loading products from server...');
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ed0fe4c2/admin/products`,
        {
          headers: { 
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log('📋 Server response:', data);
        
        // Handle different response formats
        let productRecords = [];
        if (data.records) {
          productRecords = data.records;
        } else if (data.products) {
          productRecords = data.products;
        } else if (Array.isArray(data)) {
          productRecords = data;
        }
        
        // Set server mode for user information
        setServerMode(data.serverMode || 'kv-storage');
        
        setProducts(productRecords);
        console.log(`✅ Loaded ${productRecords.length} products`);
        
        if (productRecords.length === 0) {
          console.log('💡 No products found - you can create sample products using the populate feature');
        }
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Error loading products:', error);
      toast.error('Failed to load products');
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Product name is required');
      return;
    }

    setIsSaving(true);
    try {
      const url = editingProduct
        ? `https://${projectId}.supabase.co/functions/v1/make-server-ed0fe4c2/admin/products/${editingProduct.id}`
        : `https://${projectId}.supabase.co/functions/v1/make-server-ed0fe4c2/admin/products`;

      const method = editingProduct ? 'PUT' : 'POST';

      console.log('💾 Saving product:', formData.name);

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          health_score: formData.health_score ? Number(formData.health_score) : null,
          created_at: formData.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Product saved successfully:', result);
        
        toast.success(editingProduct ? 'Product updated successfully' : 'Product created successfully');
        
        // Refresh the list
        await loadProducts();
        
        // Update stats if callback provided
        if (onStatsUpdate) {
          onStatsUpdate();
        }
        
        // Reset form
        resetForm();
        setActiveTab('list');
      } else {
        const errorData = await response.text();
        console.error('❌ Save failed:', errorData);
        throw new Error(errorData);
      }
    } catch (error) {
      console.error('❌ Error saving product:', error);
      toast.error('Failed to save product');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({ ...product });
    setActiveTab('edit');
  };

  const handleDelete = async (product: Product) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ed0fe4c2/admin/products/${product.id}`,
        {
          method: 'DELETE',
          headers: { 
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        toast.success('Product deleted successfully');
        await loadProducts();
        
        // Update stats if callback provided
        if (onStatsUpdate) {
          onStatsUpdate();
        }
      } else {
        throw new Error('Delete failed');
      }
    } catch (error) {
      console.error('❌ Error deleting product:', error);
      toast.error('Failed to delete product');
    }
  };

  const handleCreate = () => {
    resetForm();
    setActiveTab('edit');
  };

  const resetForm = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      brand: '',
      category: 'Food & Beverages',
      description: '',
      barcode: '',
      manufacturer: '',
      country: '',
      status: 'active',
      health_score: null,
      ingredients: '',
      nutrition_facts: '',
      allergens: '',
      image_url: ''
    });
  };

  const handleImageGenerated = (imageUrl: string) => {
    setFormData(prev => ({ ...prev, image_url: imageUrl }));
    toast.success('Image generated and attached to product');
  };

  const customColumns = [
    { key: 'id', label: 'ID', sortable: true },
    { key: 'image', label: 'Image', sortable: false },
    { key: 'name', label: 'Name', sortable: true },
    { key: 'brand', label: 'Brand', sortable: true },
    { key: 'category', label: 'Category', sortable: true },
    { key: 'barcode', label: 'Barcode', sortable: false },
    { key: 'status', label: 'Status', sortable: true, render: (value: string) => (
      <Badge variant={
        value === 'active' ? 'default' :
        value === 'inactive' ? 'secondary' :
        value === 'pending' ? 'outline' : 'destructive'
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
              <h1 className="text-2xl font-bold text-gray-900">Product Database Editor</h1>
              <p className="text-gray-600">Manage products, brands, and consumer goods</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Badge variant="outline" className="text-sm">
              {products.length} Total Products
            </Badge>
            {serverMode === 'kv-storage' && (
              <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                KV Storage
              </Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={loadProducts}
              disabled={isLoading}
              className="flex items-center space-x-2"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </Button>
          </div>
        </div>

        {/* Empty State Information */}
        {serverMode === 'kv-storage' && products.length === 0 && (
          <Alert className="mb-6">
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>No Products Found:</strong> The product database is empty. 
              You can create individual products using the form below, or use the 
              admin populate feature to generate sample products for testing.
            </AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="list">
              Product List ({products.length})
            </TabsTrigger>
            <TabsTrigger value="edit">
              {editingProduct ? 'Edit Product' : 'Add Product'}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="space-y-6">
            <StandardDataView
              data={products}
              recordType="product"
              isLoading={isLoading}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onCreate={handleCreate}
              onRefresh={loadProducts}
              searchPlaceholder="Search products by name, brand, barcode, or category..."
              emptyMessage="Start building your product database by adding consumer goods, food items, and branded products."
              columns={customColumns}
            />
          </TabsContent>

          <TabsContent value="edit" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Wand2 className="w-5 h-5" />
                  <span>{editingProduct ? 'Edit Product' : 'Add New Product'}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Basic Information */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900">Basic Information</h3>
                    
                    <div>
                      <Label htmlFor="name">Product Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g., Organic Whole Milk"
                      />
                    </div>

                    <div>
                      <Label htmlFor="brand">Brand</Label>
                      <Input
                        id="brand"
                        value={formData.brand}
                        onChange={(e) => setFormData(prev => ({ ...prev, brand: e.target.value }))}
                        placeholder="e.g., Nature's Best"
                      />
                    </div>

                    <div>
                      <Label htmlFor="category">Category</Label>
                      <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {productCategories.map(category => (
                            <SelectItem key={category} value={category}>{category}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="barcode">Barcode</Label>
                      <Input
                        id="barcode"
                        value={formData.barcode}
                        onChange={(e) => setFormData(prev => ({ ...prev, barcode: e.target.value }))}
                        placeholder="e.g., 123456789012"
                      />
                    </div>

                    <div>
                      <Label htmlFor="status">Status</Label>
                      <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          {statusOptions.map(status => (
                            <SelectItem key={status} value={status}>
                              {status.charAt(0).toUpperCase() + status.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Product Details */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900">Product Details</h3>
                    
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Describe this product..."
                        rows={3}
                      />
                    </div>

                    <div>
                      <Label htmlFor="manufacturer">Manufacturer</Label>
                      <Input
                        id="manufacturer"
                        value={formData.manufacturer}
                        onChange={(e) => setFormData(prev => ({ ...prev, manufacturer: e.target.value }))}
                        placeholder="e.g., ABC Foods Inc."
                      />
                    </div>

                    <div>
                      <Label htmlFor="country">Country of Origin</Label>
                      <Input
                        id="country"
                        value={formData.country}
                        onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                        placeholder="e.g., United States"
                      />
                    </div>

                    <div>
                      <Label htmlFor="health_score">Health Score (0-100)</Label>
                      <Input
                        id="health_score"
                        type="number"
                        min="0"
                        max="100"
                        value={formData.health_score || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, health_score: e.target.value ? Number(e.target.value) : null }))}
                        placeholder="85"
                      />
                    </div>
                  </div>

                  {/* Nutritional Information */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900">Nutritional Information</h3>
                    
                    <div>
                      <Label htmlFor="ingredients">Ingredients</Label>
                      <Textarea
                        id="ingredients"
                        value={formData.ingredients}
                        onChange={(e) => setFormData(prev => ({ ...prev, ingredients: e.target.value }))}
                        placeholder="List of ingredients..."
                        rows={2}
                      />
                    </div>

                    <div>
                      <Label htmlFor="nutrition_facts">Nutrition Facts</Label>
                      <Textarea
                        id="nutrition_facts"
                        value={formData.nutrition_facts}
                        onChange={(e) => setFormData(prev => ({ ...prev, nutrition_facts: e.target.value }))}
                        placeholder="Nutrition information..."
                        rows={2}
                      />
                    </div>

                    <div>
                      <Label htmlFor="allergens">Allergens</Label>
                      <Textarea
                        id="allergens"
                        value={formData.allergens}
                        onChange={(e) => setFormData(prev => ({ ...prev, allergens: e.target.value }))}
                        placeholder="Known allergens..."
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
                      recordType="product"
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
                    <span>{editingProduct ? 'Update Product' : 'Create Product'}</span>
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