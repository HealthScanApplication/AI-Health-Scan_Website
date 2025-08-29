import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Separator } from "./ui/separator";
import { Alert, AlertDescription } from "./ui/alert";
import { ArrowLeft, Plus, Edit, Trash2, Save, X, Search, UtensilsCrossed, ExternalLink, ChevronLeft, ChevronRight, Users, Clock, Scan, Zap, AlertTriangle, Database, Info, CheckCircle } from "lucide-react";
import { toast } from "sonner@2.0.3";
import { projectId, publicAnonKey } from "../utils/supabase/info";
import { RecordImageDisplay } from "./RecordImageDisplay";
import { SimpleRecordImage } from "./SimpleRecordImage";

interface MealEditorProps {
  onClose: () => void;
}

interface Meal {
  id: number;
  name: string;
  description: string;
  category: string;
  cuisine_type: string;
  meal_type: string;
  preparation_time: number;
  serving_size: string;
  servings_per_package: number;
  calories_per_serving: number;
  ingredients: string[];
  allergens: string[];
  dietary_restrictions: string[];
  nutritional_highlights: string[];
  preparation_method: string;
  storage_instructions: string;
  barcode: string | null;
  brand: string | null;
  packaging_type: string;
  product_line: string | null;
  retail_locations: string[];
  price_range: string;
  availability: string;
  health_rating: number;
  sustainability_score: number;
  image_url: string | null;
  ai_generated_image: string | null;
  created_at: string;
  updated_at: string;
}

const defaultMeal: Omit<Meal, 'id' | 'created_at' | 'updated_at'> = {
  name: '',
  description: '',
  category: '',
  cuisine_type: '',
  meal_type: '',
  preparation_time: 0,
  serving_size: '',
  servings_per_package: 1,
  calories_per_serving: 0,
  ingredients: [],
  allergens: [],
  dietary_restrictions: [],
  nutritional_highlights: [],
  preparation_method: '',
  storage_instructions: '',
  barcode: null,
  brand: null,
  packaging_type: '',
  product_line: null,
  retail_locations: [],
  price_range: '',
  availability: '',
  health_rating: 0,
  sustainability_score: 0,
  image_url: null,
  ai_generated_image: null
};

export function MealEditor({ onClose }: MealEditorProps) {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const [editingMeal, setEditingMeal] = useState<Partial<Meal> | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<string>('unknown');
  const itemsPerPage = 10;

  const fetchMeals = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🍽️ Fetching meals from server...');
      
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-557a7646/admin/meals`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch meals: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Meals response:', data);
      
      if (data.success !== false && data.meals) {
        setMeals(data.meals);
        setDataSource(data.source || 'unknown');
        console.log(`✅ Loaded ${data.meals.length} meals from source: ${data.source}`);
      } else {
        throw new Error(data.error || 'Failed to load meals');
      }
    } catch (err: any) {
      console.error('❌ Error fetching meals:', err);
      setError(err.message);
      setDataSource('error');
      setMeals([]); // Clear meals on error
      toast.error(`Failed to load meals: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeals();
  }, []);

  const filteredMeals = meals.filter(meal => 
    meal.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    meal.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    meal.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedMeals = filteredMeals.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredMeals.length / itemsPerPage);

  const handleSaveMeal = async () => {
    if (!editingMeal?.name) {
      toast.error('Meal name is required');
      return;
    }

    try {
      setSaving(true);
      
      const mealData = {
        ...editingMeal,
        ingredients: Array.isArray(editingMeal.ingredients) ? editingMeal.ingredients : editingMeal.ingredients?.split(',').map(i => i.trim()).filter(Boolean) || [],
        allergens: Array.isArray(editingMeal.allergens) ? editingMeal.allergens : editingMeal.allergens?.split(',').map(a => a.trim()).filter(Boolean) || [],
        dietary_restrictions: Array.isArray(editingMeal.dietary_restrictions) ? editingMeal.dietary_restrictions : editingMeal.dietary_restrictions?.split(',').map(d => d.trim()).filter(Boolean) || [],
        nutritional_highlights: Array.isArray(editingMeal.nutritional_highlights) ? editingMeal.nutritional_highlights : editingMeal.nutritional_highlights?.split(',').map(n => n.trim()).filter(Boolean) || [],
        retail_locations: Array.isArray(editingMeal.retail_locations) ? editingMeal.retail_locations : editingMeal.retail_locations?.split(',').map(r => r.trim()).filter(Boolean) || []
      };

      const url = editingMeal.id 
        ? `https://${projectId}.supabase.co/functions/v1/make-server-557a7646/admin/meals/${editingMeal.id}`
        : `https://${projectId}.supabase.co/functions/v1/make-server-557a7646/admin/meals`;
      
      const method = editingMeal.id ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(mealData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to save meal: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success !== false) {
        toast.success(editingMeal.id ? 'Meal updated successfully!' : 'Meal created successfully!');
        setEditingMeal(null);
        setSelectedMeal(null);
        fetchMeals();
      } else {
        throw new Error(result.error || 'Failed to save meal');
      }
    } catch (err: any) {
      console.error('❌ Error saving meal:', err);
      toast.error(`Failed to save meal: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMeal = async (mealId: number) => {
    if (!confirm('Are you sure you want to delete this meal?')) return;

    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-557a7646/admin/meals/${mealId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to delete meal: ${response.status} ${response.statusText}`);
      }

      toast.success('Meal deleted successfully!');
      fetchMeals();
      setSelectedMeal(null);
      setEditingMeal(null);
    } catch (err: any) {
      console.error('❌ Error deleting meal:', err);
      toast.error(`Failed to delete meal: ${err.message}`);
    }
  };

  const getStatusColor = (source: string) => {
    if (source === 'kv-store') return 'text-green-600 bg-green-50 border-green-200';
    if (source === 'supabase-database') return 'text-blue-600 bg-blue-50 border-blue-200';
    if (source.includes('fallback') || source.includes('error')) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-gray-600 bg-gray-50 border-gray-200';
  };

  const getStatusText = (source: string) => {
    if (source === 'kv-store') return 'KV Store';
    if (source === 'supabase-database') return 'Database';
    if (source.includes('fallback')) return 'Fallback Data';
    if (source.includes('error')) return 'Error State';
    return 'Unknown';
  };

  const getStatusIcon = (source: string) => {
    if (source === 'kv-store') return <CheckCircle className="w-4 h-4" />;
    if (source === 'supabase-database') return <Database className="w-4 h-4" />;
    if (source.includes('fallback')) return <Info className="w-4 h-4" />;
    if (source.includes('error')) return <AlertTriangle className="w-4 h-4" />;
    return <Database className="w-4 h-4" />;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex items-center space-x-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-healthscan-green"></div>
            <div>Loading meals...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (editingMeal) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <UtensilsCrossed className="w-5 h-5" />
              <span>{editingMeal.id ? 'Edit Meal' : 'Create New Meal'}</span>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={() => setEditingMeal(null)}>
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleSaveMeal} disabled={saving}>
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Saving...' : 'Save Meal'}
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="basic" className="space-y-4">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="nutrition">Nutrition</TabsTrigger>
              <TabsTrigger value="ingredients">Ingredients</TabsTrigger>
              <TabsTrigger value="product">Product Info</TabsTrigger>
              <TabsTrigger value="retail">Retail</TabsTrigger>
              <TabsTrigger value="ratings">Ratings</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Meal Name *</Label>
                  <Input
                    id="name"
                    value={editingMeal.name || ''}
                    onChange={(e) => setEditingMeal(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Mediterranean Quinoa Bowl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select 
                    value={editingMeal.category || ''} 
                    onValueChange={(value) => setEditingMeal(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="breakfast">Breakfast</SelectItem>
                      <SelectItem value="lunch">Lunch</SelectItem>
                      <SelectItem value="dinner">Dinner</SelectItem>
                      <SelectItem value="snack">Snack</SelectItem>
                      <SelectItem value="dessert">Dessert</SelectItem>
                      <SelectItem value="beverage">Beverage</SelectItem>
                      <SelectItem value="appetizer">Appetizer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cuisine_type">Cuisine Type</Label>
                  <Input
                    id="cuisine_type"
                    value={editingMeal.cuisine_type || ''}
                    onChange={(e) => setEditingMeal(prev => ({ ...prev, cuisine_type: e.target.value }))}
                    placeholder="e.g., Mediterranean, Asian, American"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="meal_type">Meal Type</Label>
                  <Select 
                    value={editingMeal.meal_type || ''} 
                    onValueChange={(value) => setEditingMeal(prev => ({ ...prev, meal_type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select meal type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fresh">Fresh</SelectItem>
                      <SelectItem value="frozen">Frozen</SelectItem>
                      <SelectItem value="packaged">Packaged</SelectItem>
                      <SelectItem value="fast-food">Fast Food</SelectItem>
                      <SelectItem value="restaurant">Restaurant</SelectItem>
                      <SelectItem value="homemade">Homemade</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={editingMeal.description || ''}
                  onChange={(e) => setEditingMeal(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe the meal, its taste, and key features..."
                  rows={3}
                />
              </div>
            </TabsContent>

            <TabsContent value="nutrition" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="serving_size">Serving Size</Label>
                  <Input
                    id="serving_size"
                    value={editingMeal.serving_size || ''}
                    onChange={(e) => setEditingMeal(prev => ({ ...prev, serving_size: e.target.value }))}
                    placeholder="e.g., 1 cup, 200g"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="servings_per_package">Servings per Package</Label>
                  <Input
                    id="servings_per_package"
                    type="number"
                    value={editingMeal.servings_per_package || ''}
                    onChange={(e) => setEditingMeal(prev => ({ ...prev, servings_per_package: parseInt(e.target.value) || 0 }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="calories_per_serving">Calories per Serving</Label>
                  <Input
                    id="calories_per_serving"
                    type="number"
                    value={editingMeal.calories_per_serving || ''}
                    onChange={(e) => setEditingMeal(prev => ({ ...prev, calories_per_serving: parseInt(e.target.value) || 0 }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="preparation_time">Preparation Time (minutes)</Label>
                  <Input
                    id="preparation_time"
                    type="number"
                    value={editingMeal.preparation_time || ''}
                    onChange={(e) => setEditingMeal(prev => ({ ...prev, preparation_time: parseInt(e.target.value) || 0 }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="nutritional_highlights">Nutritional Highlights (comma-separated)</Label>
                <Input
                  id="nutritional_highlights"
                  value={Array.isArray(editingMeal.nutritional_highlights) ? editingMeal.nutritional_highlights.join(', ') : editingMeal.nutritional_highlights || ''}
                  onChange={(e) => setEditingMeal(prev => ({ ...prev, nutritional_highlights: e.target.value }))}
                  placeholder="e.g., High protein, Low sodium, Rich in fiber"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="preparation_method">Preparation Method</Label>
                <Textarea
                  id="preparation_method"
                  value={editingMeal.preparation_method || ''}
                  onChange={(e) => setEditingMeal(prev => ({ ...prev, preparation_method: e.target.value }))}
                  placeholder="Describe how to prepare or heat this meal..."
                  rows={3}
                />
              </div>
            </TabsContent>

            <TabsContent value="ingredients" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ingredients">Ingredients List (comma-separated)</Label>
                <Textarea
                  id="ingredients"
                  value={Array.isArray(editingMeal.ingredients) ? editingMeal.ingredients.join(', ') : editingMeal.ingredients || ''}
                  onChange={(e) => setEditingMeal(prev => ({ ...prev, ingredients: e.target.value }))}
                  placeholder="e.g., Quinoa, Chickpeas, Olive oil, Tomatoes, Feta cheese"
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="allergens">Allergens (comma-separated)</Label>
                <Input
                  id="allergens"
                  value={Array.isArray(editingMeal.allergens) ? editingMeal.allergens.join(', ') : editingMeal.allergens || ''}
                  onChange={(e) => setEditingMeal(prev => ({ ...prev, allergens: e.target.value }))}
                  placeholder="e.g., Milk, Nuts, Soy"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dietary_restrictions">Dietary Restrictions (comma-separated)</Label>
                <Input
                  id="dietary_restrictions"
                  value={Array.isArray(editingMeal.dietary_restrictions) ? editingMeal.dietary_restrictions.join(', ') : editingMeal.dietary_restrictions || ''}
                  onChange={(e) => setEditingMeal(prev => ({ ...prev, dietary_restrictions: e.target.value }))}
                  placeholder="e.g., Vegetarian, Gluten-free, Vegan"
                />
              </div>
            </TabsContent>

            <TabsContent value="product" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="brand">Brand</Label>
                  <Input
                    id="brand"
                    value={editingMeal.brand || ''}
                    onChange={(e) => setEditingMeal(prev => ({ ...prev, brand: e.target.value }))}
                    placeholder="e.g., Healthy Choice, Amy's"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="barcode">Barcode/UPC</Label>
                  <Input
                    id="barcode"
                    value={editingMeal.barcode || ''}
                    onChange={(e) => setEditingMeal(prev => ({ ...prev, barcode: e.target.value }))}
                    placeholder="e.g., 123456789012"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="packaging_type">Packaging Type</Label>
                  <Select 
                    value={editingMeal.packaging_type || ''} 
                    onValueChange={(value) => setEditingMeal(prev => ({ ...prev, packaging_type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select packaging" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fresh">Fresh/Unpackaged</SelectItem>
                      <SelectItem value="plastic-container">Plastic Container</SelectItem>
                      <SelectItem value="cardboard-box">Cardboard Box</SelectItem>
                      <SelectItem value="glass-jar">Glass Jar</SelectItem>
                      <SelectItem value="metal-can">Metal Can</SelectItem>
                      <SelectItem value="frozen-bag">Frozen Bag</SelectItem>
                      <SelectItem value="vacuum-sealed">Vacuum Sealed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="product_line">Product Line</Label>
                  <Input
                    id="product_line"
                    value={editingMeal.product_line || ''}
                    onChange={(e) => setEditingMeal(prev => ({ ...prev, product_line: e.target.value }))}
                    placeholder="e.g., Organic, Simply Steam, Power Bowls"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="storage_instructions">Storage Instructions</Label>
                <Input
                  id="storage_instructions"
                  value={editingMeal.storage_instructions || ''}
                  onChange={(e) => setEditingMeal(prev => ({ ...prev, storage_instructions: e.target.value }))}
                  placeholder="e.g., Keep frozen, Refrigerate after opening"
                />
              </div>
            </TabsContent>

            <TabsContent value="retail" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price_range">Price Range</Label>
                  <Select 
                    value={editingMeal.price_range || ''} 
                    onValueChange={(value) => setEditingMeal(prev => ({ ...prev, price_range: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select price range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="budget">Budget ($1-5)</SelectItem>
                      <SelectItem value="moderate">Moderate ($5-15)</SelectItem>
                      <SelectItem value="premium">Premium ($15-30)</SelectItem>
                      <SelectItem value="luxury">Luxury ($30+)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="availability">Availability</Label>
                  <Select 
                    value={editingMeal.availability || ''} 
                    onValueChange={(value) => setEditingMeal(prev => ({ ...prev, availability: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select availability" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="year-round">Year Round</SelectItem>
                      <SelectItem value="seasonal">Seasonal</SelectItem>
                      <SelectItem value="limited-time">Limited Time</SelectItem>
                      <SelectItem value="discontinued">Discontinued</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="retail_locations">Retail Locations (comma-separated)</Label>
                <Input
                  id="retail_locations"
                  value={Array.isArray(editingMeal.retail_locations) ? editingMeal.retail_locations.join(', ') : editingMeal.retail_locations || ''}
                  onChange={(e) => setEditingMeal(prev => ({ ...prev, retail_locations: e.target.value }))}
                  placeholder="e.g., Whole Foods, Target, Kroger"
                />
              </div>
            </TabsContent>

            <TabsContent value="ratings" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="health_rating">Health Rating (1-10)</Label>
                  <Input
                    id="health_rating"
                    type="number"
                    min="1"
                    max="10"
                    value={editingMeal.health_rating || ''}
                    onChange={(e) => setEditingMeal(prev => ({ ...prev, health_rating: parseInt(e.target.value) || 0 }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sustainability_score">Sustainability Score (1-10)</Label>
                  <Input
                    id="sustainability_score"
                    type="number"
                    min="1"
                    max="10"
                    value={editingMeal.sustainability_score || ''}
                    onChange={(e) => setEditingMeal(prev => ({ ...prev, sustainability_score: parseInt(e.target.value) || 0 }))}
                  />
                </div>
              </div>
              
              {/* AI Image Generation Component */}
              <div className="space-y-2">
                <Label>Meal Image</Label>
                <RecordImageDisplay
                  itemName={editingMeal.name || 'Untitled Meal'}
                  recordType="meal"
                  category={editingMeal.category}
                  currentImageUrl={editingMeal.image_url}
                  onImageUpdate={(imageUrl) => setEditingMeal(prev => ({ ...prev, image_url: imageUrl }))}
                  size="lg"
                  showControls={true}
                />
                <p className="text-xs text-gray-500">
                  AI-generated images show meals beautifully plated on a table with professional food photography and blurred bokeh background.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <UtensilsCrossed className="w-5 h-5" />
            <span>Meals Database</span>
            <Badge variant="secondary">{filteredMeals.length} meals</Badge>
            <Badge className={getStatusColor(dataSource)}>
              {getStatusIcon(dataSource)}
              <span className="ml-1">{getStatusText(dataSource)}</span>
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(`https://supabase.com/dashboard/project/${projectId}/editor/meals`, '_blank')}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Open in Supabase
            </Button>
          </div>
          <Button onClick={() => setEditingMeal(defaultMeal)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Meal
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {dataSource === 'kv-store' && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription className="text-green-800">
              Meals are stored in the KV store for reliable access. Full CRUD functionality available.
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-red-800">
              Error loading meals: {error}
            </AlertDescription>
          </Alert>
        )}

        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search meals..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Button
            variant="outline"
            onClick={fetchMeals}
            disabled={loading}
          >
            <Database className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        {filteredMeals.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <UtensilsCrossed className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>
              {error ? 'Unable to load meals.' : 'No meals found.'} 
              {' '}Add your first meal to get started!
            </p>
          </div>
        ) : (
          <>
            <div className="grid gap-4">
              {paginatedMeals.map((meal, index) => (
                <Card key={meal.id} className="hover:shadow-md transition-shadow overflow-hidden">
                  <CardContent className="p-0">
                    <div className="flex">
                      {/* Image Section */}
                      <div className="w-24 h-24 flex-shrink-0">
                        <SimpleRecordImage
                          imageUrl={meal.image_url}
                          itemName={meal.name}
                          recordType="meal"
                          className="w-full h-full"
                        />
                      </div>

                      {/* Content Section */}
                      <div className="flex-1 p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <Badge variant="outline" className="text-xs">
                                #{((currentPage - 1) * itemsPerPage) + index + 1}
                              </Badge>
                              <div className="flex items-center space-x-2">
                                <UtensilsCrossed className="w-4 h-4 text-gray-500" />
                                <span className="font-medium">{meal.name}</span>
                              </div>
                              <Badge variant="secondary">{meal.category}</Badge>
                              {meal.cuisine_type && (
                                <Badge variant="outline">{meal.cuisine_type}</Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{meal.description}</p>
                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                              <div className="flex items-center space-x-1">
                                <Clock className="w-3 h-3" />
                                <span>{meal.preparation_time} min</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Zap className="w-3 h-3" />
                                <span>{meal.calories_per_serving} cal</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Users className="w-3 h-3" />
                                <span>{meal.servings_per_package} serving{meal.servings_per_package !== 1 ? 's' : ''}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex space-x-2 ml-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setEditingMeal(meal)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteMeal(meal.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredMeals.length)} of {filteredMeals.length} meals
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-sm">
                    {currentPage} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}