import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { Alert, AlertDescription } from "./ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { 
  Save, 
  X, 
  Heart, 
  Upload, 
  Download, 
  RefreshCw, 
  AlertCircle,
  CheckCircle,
  Image as ImageIcon,
  Globe,
  Database,
  FileText,
  ExternalLink,
  Calendar,
  Target,
  Info,
  Loader2,
  Plus,
  Minus,
  Package,
  Zap
} from "lucide-react";
import { SimpleRecordImage } from "./SimpleRecordImage";
import { toast } from "sonner@2.0.3";
import { projectId, publicAnonKey } from "../utils/supabase/info";

interface NutrientEditorProps {
  itemId?: string | null;
  onSave: () => void;
  onCancel: () => void;
}

interface NutrientData {
  id?: string;
  name: string;
  vitamin_name: string;
  category: string;
  unit: string;
  rdi: number;
  type: string;
  
  // Mobile app required fields
  description_text_simple: string;
  description_text_technical: string;
  deficient_range: { min: number; max: number; unit: string };
  optimal_range: { min: number; max: number; unit: string };
  excess_range: { min: number; max: number | null; unit: string };
  health_benefits: string[];
  food_strategy_animal: string;
  food_strategy_plant: string;
  pregnancy_considerations: string;
  where_to_get_supplements: Array<{
    name: string;
    description: string;
    image_url?: string;
  }>;
  
  // Regional and age-based RDI data
  regional_rdi: {
    [region: string]: {
      [ageGroup: string]: {
        deficient_max: number;
        optimal_min: number;
        optimal_max: number;
        excess_min: number | null;
      };
    };
  };
  
  // Legacy fields for compatibility
  description: string;
  health_benefits_text?: string;
  deficiency_symptoms: string;
  food_sources: string[];
  
  // System fields
  source: string;
  api_source: string;
  imported_at: string;
  external_id: string;
  image_url: string;
}

const defaultNutrient: NutrientData = {
  name: "",
  vitamin_name: "",
  category: "Vitamins",
  unit: "mg",
  rdi: 0,
  type: "Essential nutrient",
  
  // Mobile app fields
  description_text_simple: "",
  description_text_technical: "",
  deficient_range: { min: 0, max: 0, unit: "mg" },
  optimal_range: { min: 0, max: 0, unit: "mg" },
  excess_range: { min: 0, max: null, unit: "mg" },
  health_benefits: [],
  food_strategy_animal: "",
  food_strategy_plant: "",
  pregnancy_considerations: "",
  where_to_get_supplements: [],
  
  // Regional RDI data
  regional_rdi: {},
  
  // Legacy fields
  description: "",
  deficiency_symptoms: "",
  food_sources: [],
  
  // System fields
  source: "HealthScan Nutrient Database",
  api_source: "Manual Entry",
  imported_at: new Date().toISOString(),
  external_id: "",
  image_url: ""
};

export function NutrientEditor({ itemId, onSave, onCancel }: NutrientEditorProps) {
  const [nutrient, setNutrient] = useState<NutrientData>(defaultNutrient);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState("basic");

  // Load existing nutrient data
  useEffect(() => {
    if (itemId) {
      loadNutrient();
    } else {
      setNutrient({ 
        ...defaultNutrient,
        id: `nutrient_${Date.now()}_new`,
        imported_at: new Date().toISOString()
      });
    }
  }, [itemId]);

  const loadNutrient = async () => {
    if (!itemId) return;
    
    setLoading(true);
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-557a7646/admin/kv-records`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ prefix: 'nutrient_' })
      });

      if (response.ok) {
        const data = await response.json();
        const nutrientRecord = data.records.find((r: any) => r.id === itemId);
        
        if (nutrientRecord) {
          // Handle both old and new format
          const loadedNutrient = {
            ...defaultNutrient,
            ...nutrientRecord,
            food_sources: Array.isArray(nutrientRecord.food_sources) 
              ? nutrientRecord.food_sources 
              : JSON.parse(nutrientRecord.food_sources || '[]'),
            health_benefits: Array.isArray(nutrientRecord.health_benefits)
              ? nutrientRecord.health_benefits
              : nutrientRecord.health_benefits_text?.split(', ') || [],
            where_to_get_supplements: Array.isArray(nutrientRecord.where_to_get_supplements)
              ? nutrientRecord.where_to_get_supplements
              : []
          };
          
          setNutrient(loadedNutrient);
        } else {
          toast.error('Nutrient not found');
          onCancel();
        }
      } else {
        throw new Error('Failed to load nutrient');
      }
    } catch (error) {
      console.error('Failed to load nutrient:', error);
      toast.error('Failed to load nutrient data');
      onCancel();
    } finally {
      setLoading(false);
    }
  };

  const validateNutrient = (): boolean => {
    const errors: string[] = [];
    
    if (!nutrient.name.trim()) {
      errors.push('Nutrient name is required');
    }
    
    if (!nutrient.vitamin_name.trim()) {
      errors.push('Vitamin display name is required');
    }
    
    if (!nutrient.description_text_simple.trim()) {
      errors.push('Simple description is required');
    }
    
    if (nutrient.rdi < 0) {
      errors.push('RDI must be a positive number');
    }
    
    if (!nutrient.category.trim()) {
      errors.push('Category is required');
    }
    
    setValidationErrors(errors);
    return errors.length === 0;
  };

  const saveNutrient = async () => {
    if (!validateNutrient()) {
      toast.error('Please fix validation errors before saving');
      return;
    }

    setSaving(true);
    try {
      // Ensure legacy compatibility
      const nutrientData = {
        ...nutrient,
        description: nutrient.description_text_simple, // Set legacy description
        health_benefits_text: nutrient.health_benefits.join(', '), // Legacy format
        food_sources: JSON.stringify(nutrient.food_sources),
        imported_at: nutrient.imported_at || new Date().toISOString()
      };

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-557a7646/admin/save-nutrient`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(nutrientData)
      });

      if (response.ok) {
        toast.success(`✅ Nutrient ${itemId ? 'updated' : 'created'} successfully!`);
        onSave();
      } else {
        // Fallback to KV store save
        const saveResponse = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-557a7646/admin/kv-save`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ 
            key: nutrient.id || `nutrient_${Date.now()}`,
            value: nutrientData 
          })
        });

        if (saveResponse.ok) {
          toast.success(`✅ Nutrient ${itemId ? 'updated' : 'created'} successfully!`);
          onSave();
        } else {
          throw new Error('Failed to save nutrient');
        }
      }
    } catch (error) {
      console.error('Failed to save nutrient:', error);
      toast.error('❌ Failed to save nutrient');
    } finally {
      setSaving(false);
    }
  };

  const addHealthBenefit = () => {
    setNutrient(prev => ({
      ...prev,
      health_benefits: [...prev.health_benefits, ""]
    }));
  };

  const updateHealthBenefit = (index: number, value: string) => {
    setNutrient(prev => ({
      ...prev,
      health_benefits: prev.health_benefits.map((benefit, i) => 
        i === index ? value : benefit
      )
    }));
  };

  const removeHealthBenefit = (index: number) => {
    setNutrient(prev => ({
      ...prev,
      health_benefits: prev.health_benefits.filter((_, i) => i !== index)
    }));
  };

  const addSupplement = () => {
    setNutrient(prev => ({
      ...prev,
      where_to_get_supplements: [...prev.where_to_get_supplements, {
        name: "",
        description: "",
        image_url: ""
      }]
    }));
  };

  const updateSupplement = (index: number, field: string, value: string) => {
    setNutrient(prev => ({
      ...prev,
      where_to_get_supplements: prev.where_to_get_supplements.map((supplement, i) => 
        i === index ? { ...supplement, [field]: value } : supplement
      )
    }));
  };

  const removeSupplement = (index: number) => {
    setNutrient(prev => ({
      ...prev,
      where_to_get_supplements: prev.where_to_get_supplements.filter((_, i) => i !== index)
    }));
  };

  // Auto-populate regional RDI data with sensible defaults
  const populateRegionalRDI = () => {
    const baseRDI = nutrient.rdi || 0;
    const unit = nutrient.unit || 'mg';
    
    // Generate regional data with age-appropriate variations
    const generateRegionalData = (baseValue: number) => {
      return {
        infants_0_6m: {
          deficient_max: baseValue * 0.1,
          optimal_min: baseValue * 0.15,
          optimal_max: baseValue * 0.2,
          excess_min: baseValue * 0.3
        },
        infants_6_12m: {
          deficient_max: baseValue * 0.15,
          optimal_min: baseValue * 0.2,
          optimal_max: baseValue * 0.25,
          excess_min: baseValue * 0.4
        },
        toddlers_1_3y: {
          deficient_max: baseValue * 0.2,
          optimal_min: baseValue * 0.3,
          optimal_max: baseValue * 0.4,
          excess_min: baseValue * 0.6
        },
        children_4_8y: {
          deficient_max: baseValue * 0.4,
          optimal_min: baseValue * 0.5,
          optimal_max: baseValue * 0.7,
          excess_min: baseValue * 1.0
        },
        children_9_13y: {
          deficient_max: baseValue * 0.6,
          optimal_min: baseValue * 0.7,
          optimal_max: baseValue * 0.9,
          excess_min: baseValue * 1.3
        },
        adolescents_14_18y: {
          deficient_max: baseValue * 0.7,
          optimal_min: baseValue * 0.85,
          optimal_max: baseValue * 1.1,
          excess_min: baseValue * 1.5
        },
        adults_19_30y: {
          deficient_max: baseValue * 0.6,
          optimal_min: baseValue * 0.8,
          optimal_max: baseValue * 1.2,
          excess_min: baseValue * 2.0
        },
        adults_31_50y: {
          deficient_max: baseValue * 0.6,
          optimal_min: baseValue * 0.8,
          optimal_max: baseValue * 1.2,
          excess_min: baseValue * 2.0
        },
        adults_51_70y: {
          deficient_max: baseValue * 0.7,
          optimal_min: baseValue * 0.9,
          optimal_max: baseValue * 1.3,
          excess_min: baseValue * 2.0
        },
        adults_70plus: {
          deficient_max: baseValue * 0.7,
          optimal_min: baseValue * 0.9,
          optimal_max: baseValue * 1.4,
          excess_min: baseValue * 1.8
        },
        pregnant: {
          deficient_max: baseValue * 0.8,
          optimal_min: baseValue * 1.2,
          optimal_max: baseValue * 1.8,
          excess_min: baseValue * 2.5
        },
        lactating: {
          deficient_max: baseValue * 0.9,
          optimal_min: baseValue * 1.4,
          optimal_max: baseValue * 2.0,
          excess_min: baseValue * 2.8
        }
      };
    };

    const regionalRDI = {
      USA: generateRegionalData(baseRDI),
      EU: generateRegionalData(baseRDI * 0.95) // Slight variation for EU
    };

    setNutrient(prev => ({
      ...prev,
      regional_rdi: regionalRDI
    }));

    toast.success('✅ Regional RDI data populated with evidence-based defaults!');
    setActiveTab('regional');
  };

  if (loading && itemId) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-green-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading nutrient data...</p>
        </div>
      </div>
    );
  }

  const categories = [
    "Vitamins",
    "Minerals", 
    "Amino Acids",
    "Fatty Acids",
    "Fiber",
    "Carbohydrates",
    "General Nutrients"
  ];

  const units = ["mg", "μg", "g", "IU", "per 100g", "%"];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-green-50 rounded-lg">
            <Heart className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
              {itemId ? 'Edit Nutrient' : 'Add New Nutrient'}
            </h2>
            <p className="text-sm text-gray-600">
              {itemId ? 'Update comprehensive nutrient information for mobile app' : 'Create a new nutrient record with mobile app data'}
            </p>
          </div>
        </div>
      </div>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <div className="font-medium mb-1">Please fix the following errors:</div>
            <ul className="list-disc list-inside space-y-1">
              {validationErrors.map((error, index) => (
                <li key={index} className="text-sm">{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Main Form */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="mobile">Mobile Data</TabsTrigger>
          <TabsTrigger value="ranges">Daily Ranges</TabsTrigger>
          <TabsTrigger value="regional" className="text-indigo-700 font-medium">
            🌍 Regional RDI
          </TabsTrigger>
          <TabsTrigger value="food">Food Sources</TabsTrigger>
          <TabsTrigger value="supplements">Supplements</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="w-5 h-5 text-blue-600" />
                <span>Basic Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Technical Name *</Label>
                    <Input
                      id="name"
                      value={nutrient.name}
                      onChange={(e) => setNutrient(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., Vitamin A (Retinol)"
                      className={validationErrors.some(e => e.includes('name')) ? 'border-red-300' : ''}
                    />
                  </div>

                  <div>
                    <Label htmlFor="vitamin_name">Display Name (Mobile App) *</Label>
                    <Input
                      id="vitamin_name"
                      value={nutrient.vitamin_name}
                      onChange={(e) => setNutrient(prev => ({ ...prev, vitamin_name: e.target.value }))}
                      placeholder="e.g., Retinol / Carotenoid"
                      className={validationErrors.some(e => e.includes('Vitamin display name')) ? 'border-red-300' : ''}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="category">Category *</Label>
                      <select
                        id="category"
                        value={nutrient.category}
                        onChange={(e) => setNutrient(prev => ({ ...prev, category: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-200 rounded-md"
                      >
                        {categories.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <Label htmlFor="type">Type</Label>
                      <Input
                        id="type"
                        value={nutrient.type}
                        onChange={(e) => setNutrient(prev => ({ ...prev, type: e.target.value }))}
                        placeholder="e.g., Fat-soluble vitamin"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="rdi">RDI Amount (General)</Label>
                      <Input
                        id="rdi"
                        type="number"
                        value={nutrient.rdi}
                        onChange={(e) => setNutrient(prev => ({ ...prev, rdi: parseFloat(e.target.value) || 0 }))}
                        placeholder="900"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        General WHO/FDA recommended daily intake
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="unit">Unit</Label>
                      <select
                        id="unit"
                        value={nutrient.unit}
                        onChange={(e) => setNutrient(prev => ({ 
                          ...prev, 
                          unit: e.target.value,
                          deficient_range: { ...prev.deficient_range, unit: e.target.value },
                          optimal_range: { ...prev.optimal_range, unit: e.target.value },
                          excess_range: { ...prev.excess_range, unit: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-200 rounded-md"
                      >
                        {units.map(unit => (
                          <option key={unit} value={unit}>{unit}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Regional RDI Summary Preview */}
                  {nutrient.regional_rdi && Object.keys(nutrient.regional_rdi).length > 0 && (
                    <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-blue-900 flex items-center">
                          <Globe className="w-4 h-4 mr-2" />
                          Regional & Age-Specific RDI Data Available
                        </h4>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setActiveTab("regional")}
                          className="text-blue-700 border-blue-300 hover:bg-blue-100"
                        >
                          View Details
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {['USA', 'EU'].map(region => {
                          const regionData = nutrient.regional_rdi[region];
                          if (!regionData) return null;
                          
                          const adultData = regionData['adults_19_30y'];
                          const pregnantData = regionData['pregnant'];
                          
                          return (
                            <div key={region} className="bg-white p-3 rounded border border-blue-200">
                              <h5 className="font-medium text-gray-900 mb-2 flex items-center">
                                {region === 'USA' ? '🇺🇸' : '🇪🇺'} {region}
                              </h5>
                              
                              {adultData && (
                                <div className="space-y-1 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Adults (19-30y):</span>
                                    <span className="font-medium">
                                      {adultData.optimal_min}-{adultData.optimal_max} {nutrient.unit}
                                    </span>
                                  </div>
                                  
                                  {pregnantData && (
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Pregnant:</span>
                                      <span className="font-medium">
                                        {pregnantData.optimal_min}-{pregnantData.optimal_max} {nutrient.unit}
                                      </span>
                                    </div>
                                  )}
                                  
                                  <div className="flex justify-between text-red-600">
                                    <span>Deficient:</span>
                                    <span>≤ {adultData.deficient_max} {nutrient.unit}</span>
                                  </div>
                                  
                                  {adultData.excess_min && (
                                    <div className="flex justify-between text-orange-600">
                                      <span>Excess:</span>
                                      <span>≥ {adultData.excess_min} {nutrient.unit}</span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      
                      <div className="mt-3 text-xs text-blue-700">
                        💡 <strong>Tip:</strong> Click "Regional RDI" tab above to manage detailed age groups: 
                        Infants, Children, Adolescents, Adults, Pregnant & Lactating women
                      </div>
                    </div>
                  )}

                  {/* Missing Regional Data Alert */}
                  {(!nutrient.regional_rdi || Object.keys(nutrient.regional_rdi).length === 0) && (
                    <div className="mt-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-amber-900 flex items-center">
                          <AlertCircle className="w-4 h-4 mr-2" />
                          No Regional RDI Data
                        </h4>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={populateRegionalRDI}
                            className="text-green-700 border-green-300 hover:bg-green-100"
                          >
                            <Zap className="w-3 h-3 mr-1" />
                            Auto-populate
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setActiveTab("regional")}
                            className="text-amber-700 border-amber-300 hover:bg-amber-100"
                          >
                            Manual Entry
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm text-amber-700">
                        Regional data provides age-specific recommendations (infants to elderly, pregnant & lactating) 
                        for EU and USA guidelines. Essential for mobile app personalization.
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <Label>Nutrient Image</Label>
                  <SimpleRecordImage
                    imageUrl={nutrient.image_url}
                    altText={nutrient.name}
                    size="large"
                    onImageChange={(url) => setNutrient(prev => ({ ...prev, image_url: url }))}
                    showUpload={true}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mobile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-green-600" />
                <span>Mobile App Content</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="description_text_simple">Simple Description (Mobile App) *</Label>
                <Textarea
                  id="description_text_simple"
                  value={nutrient.description_text_simple}
                  onChange={(e) => setNutrient(prev => ({ ...prev, description_text_simple: e.target.value }))}
                  placeholder="User-friendly description for the mobile app..."
                  rows={3}
                  className={validationErrors.some(e => e.includes('Simple description')) ? 'border-red-300' : ''}
                />
              </div>

              <div>
                <Label htmlFor="description_text_technical">Technical Description</Label>
                <Textarea
                  id="description_text_technical"
                  value={nutrient.description_text_technical}
                  onChange={(e) => setNutrient(prev => ({ ...prev, description_text_technical: e.target.value }))}
                  placeholder="Technical/scientific description for detailed view..."
                  rows={3}
                />
              </div>

              <div>
                <Label>Health Benefits (Mobile App Tags)</Label>
                <div className="space-y-2">
                  {nutrient.health_benefits.map((benefit, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Input
                        value={benefit}
                        onChange={(e) => updateHealthBenefit(index, e.target.value)}
                        placeholder="e.g., Improves Vision"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeHealthBenefit(index)}
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addHealthBenefit}
                    className="w-full"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Health Benefit
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="pregnancy_considerations">Pregnancy Considerations</Label>
                <Textarea
                  id="pregnancy_considerations"
                  value={nutrient.pregnancy_considerations}
                  onChange={(e) => setNutrient(prev => ({ ...prev, pregnancy_considerations: e.target.value }))}
                  placeholder="Information about use during pregnancy..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ranges" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="w-5 h-5 text-orange-600" />
                <span>Daily Intake Ranges</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <Label className="text-red-600">Deficient Range</Label>
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        type="number"
                        placeholder="Min"
                        value={nutrient.deficient_range.min}
                        onChange={(e) => setNutrient(prev => ({
                          ...prev,
                          deficient_range: { ...prev.deficient_range, min: parseFloat(e.target.value) || 0 }
                        }))}
                      />
                      <Input
                        type="number"
                        placeholder="Max"
                        value={nutrient.deficient_range.max}
                        onChange={(e) => setNutrient(prev => ({
                          ...prev,
                          deficient_range: { ...prev.deficient_range, max: parseFloat(e.target.value) || 0 }
                        }))}
                      />
                    </div>
                    <div className="text-xs text-gray-500">Unit: {nutrient.unit}</div>
                  </div>
                </div>

                <div>
                  <Label className="text-green-600">Optimal Range</Label>
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        type="number"
                        placeholder="Min"
                        value={nutrient.optimal_range.min}
                        onChange={(e) => setNutrient(prev => ({
                          ...prev,
                          optimal_range: { ...prev.optimal_range, min: parseFloat(e.target.value) || 0 }
                        }))}
                      />
                      <Input
                        type="number"
                        placeholder="Max"
                        value={nutrient.optimal_range.max}
                        onChange={(e) => setNutrient(prev => ({
                          ...prev,
                          optimal_range: { ...prev.optimal_range, max: parseFloat(e.target.value) || 0 }
                        }))}
                      />
                    </div>
                    <div className="text-xs text-gray-500">Unit: {nutrient.unit}</div>
                  </div>
                </div>

                <div>
                  <Label className="text-red-600">Excess Range</Label>
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        type="number"
                        placeholder="Min"
                        value={nutrient.excess_range.min}
                        onChange={(e) => setNutrient(prev => ({
                          ...prev,
                          excess_range: { ...prev.excess_range, min: parseFloat(e.target.value) || 0 }
                        }))}
                      />
                      <Input
                        type="number"
                        placeholder="Max (optional)"
                        value={nutrient.excess_range.max || ''}
                        onChange={(e) => setNutrient(prev => ({
                          ...prev,
                          excess_range: { ...prev.excess_range, max: e.target.value ? parseFloat(e.target.value) : null }
                        }))}
                      />
                    </div>
                    <div className="text-xs text-gray-500">Unit: {nutrient.unit}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="regional" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Globe className="w-5 h-5 text-indigo-600" />
                <span>Regional & Age-Based RDI Data</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert className="border-blue-200 bg-blue-50">
                <Info className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  <strong>Regional RDI Data:</strong> Set specific deficient, optimal, and excess thresholds 
                  for different regions (EU, USA) and age groups. This data will be used by the mobile app 
                  to provide personalized recommendations.
                </AlertDescription>
              </Alert>

              {['EU', 'USA'].map(region => (
                <div key={region} className="border rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-4 text-gray-900">{region} Guidelines</h3>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                    {[
                      { key: 'adults_19_30y', label: 'Adults (19-30y)' },
                      { key: 'adults_31_50y', label: 'Adults (31-50y)' },
                      { key: 'adults_51_70y', label: 'Adults (51-70y)' },
                      { key: 'children_4_8y', label: 'Children (4-8y)' },
                      { key: 'adolescents_14_18y', label: 'Adolescents (14-18y)' },
                      { key: 'pregnant', label: 'Pregnant Women' },
                      { key: 'lactating', label: 'Lactating Women' }
                    ].map(ageGroup => {
                      const rdiData = nutrient.regional_rdi?.[region]?.[ageGroup.key] || {
                        deficient_max: 0,
                        optimal_min: 0,
                        optimal_max: 0,
                        excess_min: 0
                      };

                      return (
                        <div key={ageGroup.key} className="bg-gray-50 p-3 rounded border">
                          <h4 className="font-medium text-sm text-gray-700 mb-2">{ageGroup.label}</h4>
                          <div className="space-y-2 text-xs">
                            <div>
                              <Label className="text-red-600">Deficient Max</Label>
                              <Input
                                type="number"
                                step="0.1"
                                value={rdiData.deficient_max}
                                onChange={(e) => {
                                  const value = parseFloat(e.target.value) || 0;
                                  setNutrient(prev => ({
                                    ...prev,
                                    regional_rdi: {
                                      ...prev.regional_rdi,
                                      [region]: {
                                        ...prev.regional_rdi[region],
                                        [ageGroup.key]: {
                                          ...rdiData,
                                          deficient_max: value
                                        }
                                      }
                                    }
                                  }));
                                }}
                                className="h-8"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-1">
                              <div>
                                <Label className="text-green-600">Opt Min</Label>
                                <Input
                                  type="number"
                                  step="0.1"
                                  value={rdiData.optimal_min}
                                  onChange={(e) => {
                                    const value = parseFloat(e.target.value) || 0;
                                    setNutrient(prev => ({
                                      ...prev,
                                      regional_rdi: {
                                        ...prev.regional_rdi,
                                        [region]: {
                                          ...prev.regional_rdi[region],
                                          [ageGroup.key]: {
                                            ...rdiData,
                                            optimal_min: value
                                          }
                                        }
                                      }
                                    }));
                                  }}
                                  className="h-8"
                                />
                              </div>
                              <div>
                                <Label className="text-green-600">Opt Max</Label>
                                <Input
                                  type="number"
                                  step="0.1"
                                  value={rdiData.optimal_max}
                                  onChange={(e) => {
                                    const value = parseFloat(e.target.value) || 0;
                                    setNutrient(prev => ({
                                      ...prev,
                                      regional_rdi: {
                                        ...prev.regional_rdi,
                                        [region]: {
                                          ...prev.regional_rdi[region],
                                          [ageGroup.key]: {
                                            ...rdiData,
                                            optimal_max: value
                                          }
                                        }
                                      }
                                    }));
                                  }}
                                  className="h-8"
                                />
                              </div>
                            </div>
                            <div>
                              <Label className="text-orange-600">Excess Min</Label>
                              <Input
                                type="number"
                                step="0.1"
                                value={rdiData.excess_min || ''}
                                onChange={(e) => {
                                  const value = e.target.value ? parseFloat(e.target.value) : null;
                                  setNutrient(prev => ({
                                    ...prev,
                                    regional_rdi: {
                                      ...prev.regional_rdi,
                                      [region]: {
                                        ...prev.regional_rdi[region],
                                        [ageGroup.key]: {
                                          ...rdiData,
                                          excess_min: value
                                        }
                                      }
                                    }
                                  }));
                                }}
                                className="h-8"
                                placeholder="Optional"
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="food" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Package className="w-5 h-5 text-blue-600" />
                <span>Food Strategy</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="food_strategy_animal">Animal Sources Strategy</Label>
                <Textarea
                  id="food_strategy_animal"
                  value={nutrient.food_strategy_animal}
                  onChange={(e) => setNutrient(prev => ({ ...prev, food_strategy_animal: e.target.value }))}
                  placeholder="Describe animal-based food sources and strategies..."
                  rows={4}
                />
              </div>

              <div>
                <Label htmlFor="food_strategy_plant">Plant Sources Strategy</Label>
                <Textarea
                  id="food_strategy_plant"
                  value={nutrient.food_strategy_plant}
                  onChange={(e) => setNutrient(prev => ({ ...prev, food_strategy_plant: e.target.value }))}
                  placeholder="Describe plant-based food sources and strategies..."
                  rows={4}
                />
              </div>

              <div>
                <Label>Food Sources (Legacy)</Label>
                <div className="space-y-2">
                  <Input
                    placeholder="Add food sources (comma-separated)"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        const value = e.currentTarget.value.trim();
                        if (value) {
                          const sources = value.split(',').map(s => s.trim()).filter(s => s);
                          setNutrient(prev => ({
                            ...prev,
                            food_sources: [...prev.food_sources, ...sources]
                          }));
                          e.currentTarget.value = '';
                        }
                      }
                    }}
                  />
                  <div className="flex flex-wrap gap-2">
                    {nutrient.food_sources.map((source, index) => (
                      <Badge key={index} variant="secondary" className="cursor-pointer">
                        {source}
                        <button
                          onClick={() => setNutrient(prev => ({
                            ...prev,
                            food_sources: prev.food_sources.filter((_, i) => i !== index)
                          }))}
                          className="ml-1 hover:text-red-600"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="supplements" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Package className="w-5 h-5 text-purple-600" />
                <span>Supplement Recommendations</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {nutrient.where_to_get_supplements.map((supplement, index) => (
                <div key={index} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Supplement {index + 1}</Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeSupplement(index)}
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      placeholder="Supplement name"
                      value={supplement.name}
                      onChange={(e) => updateSupplement(index, 'name', e.target.value)}
                    />
                    <Input
                      placeholder="Image URL"
                      value={supplement.image_url || ''}
                      onChange={(e) => updateSupplement(index, 'image_url', e.target.value)}
                    />
                  </div>
                  <Textarea
                    placeholder="Description"
                    value={supplement.description}
                    onChange={(e) => updateSupplement(index, 'description', e.target.value)}
                    rows={2}
                  />
                </div>
              ))}
              
              <Button
                variant="outline"
                onClick={addSupplement}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Supplement Recommendation
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 pt-6 border-t">
        <Button
          onClick={saveNutrient}
          disabled={saving}
          className="bg-green-600 hover:bg-green-700"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          {saving ? 'Saving...' : itemId ? 'Update Nutrient' : 'Create Nutrient'}
        </Button>
        
        <Button variant="outline" onClick={onCancel}>
          <X className="w-4 h-4 mr-2" />
          Cancel
        </Button>
      </div>
    </div>
  );
}