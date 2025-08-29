import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Badge } from "./ui/badge";
import { Alert, AlertDescription } from "./ui/alert";
import { ScrollArea } from "./ui/scroll-area";
import { Separator } from "./ui/separator";
import { 
  X, 
  Save, 
  ChevronLeft, 
  ChevronRight, 
  Search,
  Eye,
  Edit3,
  Calendar,
  ExternalLink,
  Image as ImageIcon,
  AlertCircle,
  CheckCircle,
  Database,
  Tag,
  FileText,
  Info,
  Menu
} from "lucide-react";
import { SimpleRecordImage } from "./SimpleRecordImage";
import { toast } from "sonner@2.0.3";
import { projectId, publicAnonKey } from "../utils/supabase/info";

interface Record {
  id: string;
  name: string;
  description?: string;
  category?: string;
  source?: string;
  imported_at?: string;
  image_url?: string;
  [key: string]: any;
}

interface UniversalDataEditorProps {
  isOpen: boolean;
  record: Record | null;
  dataType: string;
  allRecords: Record[];
  onSave: () => void;
  onCancel: () => void;
  onRecordChange: (record: Record) => void;
}

// Data type field configurations
const DATA_TYPE_FIELDS: Record<string, {
  title: string;
  fields: Array<{
    key: string;
    label: string;
    type: 'text' | 'textarea' | 'number' | 'select' | 'json';
    required?: boolean;
    options?: string[];
    placeholder?: string;
  }>;
}> = {
  nutrients: {
    title: 'Nutrient',
    fields: [
      { key: 'name', label: 'Name', type: 'text', required: true, placeholder: 'e.g., Vitamin C' },
      { key: 'category', label: 'Category', type: 'select', options: ['Vitamins', 'Minerals', 'Amino Acids', 'Fatty Acids', 'Fiber', 'General Nutrients'] },
      { key: 'unit', label: 'Unit', type: 'text', placeholder: 'e.g., mg, μg, g' },
      { key: 'rdi', label: 'RDI', type: 'number', placeholder: 'Recommended Daily Intake' },
      { key: 'type', label: 'Type', type: 'text', placeholder: 'e.g., Water-soluble vitamin' },
      { key: 'description', label: 'Description', type: 'textarea', placeholder: 'Detailed description of the nutrient...' },
      { key: 'health_benefits', label: 'Health Benefits', type: 'textarea', placeholder: 'Health benefits and functions...' },
      { key: 'deficiency_symptoms', label: 'Deficiency Symptoms', type: 'textarea', placeholder: 'Symptoms of deficiency...' },
      { key: 'food_sources', label: 'Food Sources', type: 'json', placeholder: 'JSON array of food sources' }
    ]
  },
  pollutants: {
    title: 'Pollutant',
    fields: [
      { key: 'name', label: 'Name', type: 'text', required: true, placeholder: 'e.g., PM2.5' },
      { key: 'scientific_name', label: 'Scientific Name', type: 'text', placeholder: 'Chemical or scientific name' },
      { key: 'category', label: 'Category', type: 'select', options: ['Particulate Matter', 'Heavy Metals', 'Volatile Organic Compounds', 'Pesticides', 'Industrial Chemicals', 'Air Pollutants'] },
      { key: 'risk_level', label: 'Risk Level', type: 'select', options: ['Low', 'Moderate', 'High', 'Very High'] },
      { key: 'description', label: 'Description', type: 'textarea', placeholder: 'Detailed description of the pollutant...' },
      { key: 'health_effects', label: 'Health Effects', type: 'textarea', placeholder: 'Health effects and risks...' },
      { key: 'exposure_routes', label: 'Exposure Routes', type: 'textarea', placeholder: 'How exposure occurs...' },
      { key: 'safe_levels', label: 'Safe Levels', type: 'textarea', placeholder: 'WHO/EPA safety guidelines...' }
    ]
  },
  ingredients: {
    title: 'Ingredient',
    fields: [
      { key: 'name', label: 'Name', type: 'text', required: true, placeholder: 'e.g., Organic Spinach' },
      { key: 'common_name', label: 'Common Name', type: 'text', placeholder: 'Alternative or common name' },
      { key: 'category', label: 'Category', type: 'select', options: ['Fresh Vegetables', 'Fresh Fruits', 'Proteins', 'Grains & Cereals', 'Dairy & Alternatives', 'Herbs & Spices', 'Oils & Fats', 'Natural Sweeteners', 'Beverages', 'Condiments & Sauces'] },
      { key: 'description', label: 'Description', type: 'textarea', placeholder: 'Detailed description of the ingredient...' },
      { key: 'nutritional_info', label: 'Nutritional Info', type: 'textarea', placeholder: 'Key nutritional information...' },
      { key: 'allergen_info', label: 'Allergen Info', type: 'text', placeholder: 'Allergen information' }
    ]
  },
  products: {
    title: 'Product',
    fields: [
      { key: 'name', label: 'Product Name', type: 'text', required: true, placeholder: 'e.g., Organic Whole Milk' },
      { key: 'brand', label: 'Brand', type: 'text', placeholder: 'Brand name' },
      { key: 'category', label: 'Category', type: 'select', options: ['Dairy', 'Meat', 'Seafood', 'Eggs', 'Vegetables', 'Fruits', 'Grains', 'Nuts', 'Oils', 'Beverages'] },
      { key: 'description', label: 'Description', type: 'textarea', placeholder: 'Product description...' },
      { key: 'ingredients', label: 'Ingredients', type: 'textarea', placeholder: 'Product ingredients list...' },
      { key: 'nutritional_profile', label: 'Nutritional Profile', type: 'json', placeholder: 'JSON object with nutrition data' }
    ]
  },
  parasites: {
    title: 'Parasite',
    fields: [
      { key: 'name', label: 'Name', type: 'text', required: true, placeholder: 'e.g., Giardia lamblia' },
      { key: 'scientific_name', label: 'Scientific Name', type: 'text', placeholder: 'Scientific classification' },
      { key: 'category', label: 'Category', type: 'select', options: ['Protozoa', 'Helminths', 'Ectoparasites', 'Biological Contaminants'] },
      { key: 'description', label: 'Description', type: 'textarea', placeholder: 'Description of the parasite...' },
      { key: 'health_effects', label: 'Health Effects', type: 'textarea', placeholder: 'Health effects and symptoms...' }
    ]
  },
  scans: {
    title: 'Scan',
    fields: [
      { key: 'name', label: 'Scan Name', type: 'text', required: true, placeholder: 'e.g., Product Analysis #123' },
      { key: 'scan_type', label: 'Scan Type', type: 'select', options: ['Product Analysis', 'Ingredient Scan', 'Nutrient Analysis', 'Contamination Check'] },
      { key: 'description', label: 'Description', type: 'textarea', placeholder: 'Scan description...' },
      { key: 'results', label: 'Results', type: 'json', placeholder: 'JSON object with scan results' }
    ]
  },
  meals: {
    title: 'Meal',
    fields: [
      { key: 'name', label: 'Meal Name', type: 'text', required: true, placeholder: 'e.g., Mediterranean Bowl' },
      { key: 'meal_type', label: 'Meal Type', type: 'select', options: ['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Balanced Meal'] },
      { key: 'description', label: 'Description', type: 'textarea', placeholder: 'Meal description...' },
      { key: 'ingredients', label: 'Ingredients', type: 'json', placeholder: 'JSON array of ingredients' },
      { key: 'nutrition_profile', label: 'Nutrition Profile', type: 'json', placeholder: 'JSON object with nutrition data' }
    ]
  }
};

export function UniversalDataEditor({ 
  isOpen, 
  record, 
  dataType, 
  allRecords, 
  onSave, 
  onCancel, 
  onRecordChange 
}: UniversalDataEditorProps) {
  const [editedRecord, setEditedRecord] = useState<Record | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSidebar, setShowSidebar] = useState(true);

  // Get configuration for current data type
  const config = DATA_TYPE_FIELDS[dataType] || {
    title: 'Record',
    fields: [
      { key: 'name', label: 'Name', type: 'text', required: true },
      { key: 'description', label: 'Description', type: 'textarea' }
    ]
  };

  // Filter records for quick selection
  const filteredRecords = useMemo(() => {
    if (!searchTerm) return allRecords;
    return allRecords.filter(r => 
      r.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [allRecords, searchTerm]);

  // Current record index for navigation
  const currentIndex = useMemo(() => {
    if (!record) return -1;
    return allRecords.findIndex(r => r.id === record.id);
  }, [record, allRecords]);

  // Lock body scroll when editor is open
  useEffect(() => {
    if (isOpen) {
      // Lock scroll on body
      document.body.style.overflow = 'hidden';
    } else {
      // Restore scroll on body
      document.body.style.overflow = 'unset';
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Initialize edited record when record changes
  useEffect(() => {
    if (record) {
      setEditedRecord({ ...record });
    } else {
      setEditedRecord(null);
    }
  }, [record]);

  // Handle field changes
  const handleFieldChange = (key: string, value: any) => {
    if (!editedRecord) return;
    
    setEditedRecord(prev => ({
      ...prev!,
      [key]: value
    }));
  };

  // Navigate to previous record
  const handlePrevious = () => {
    if (currentIndex > 0 && allRecords[currentIndex - 1]) {
      onRecordChange(allRecords[currentIndex - 1]);
    }
  };

  // Navigate to next record
  const handleNext = () => {
    if (currentIndex < allRecords.length - 1 && allRecords[currentIndex + 1]) {
      onRecordChange(allRecords[currentIndex + 1]);
    }
  };

  // Save changes
  const handleSave = async () => {
    if (!editedRecord) return;

    setIsSaving(true);
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-557a7646/admin/kv-save`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          key: editedRecord.id,
          value: {
            ...editedRecord,
            imported_at: editedRecord.imported_at || new Date().toISOString()
          }
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          toast.success(`✅ ${config.title} saved successfully!`);
          onSave();
        } else {
          throw new Error(result.error || 'Failed to save');
        }
      } else {
        throw new Error(`HTTP ${response.status}: Save failed`);
      }
    } catch (error: any) {
      console.error('Save failed:', error);
      toast.error(`❌ Failed to save ${config.title}: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Render field input based on type
  const renderFieldInput = (field: any, value: any) => {
    switch (field.type) {
      case 'textarea':
        return (
          <Textarea
            value={value || ''}
            onChange={(e) => handleFieldChange(field.key, e.target.value)}
            placeholder={field.placeholder}
            rows={3}
            className="resize-none"
          />
        );
      
      case 'number':
        return (
          <Input
            type="number"
            value={value || ''}
            onChange={(e) => handleFieldChange(field.key, parseFloat(e.target.value) || 0)}
            placeholder={field.placeholder}
          />
        );
      
      case 'select':
        return (
          <select
            value={value || ''}
            onChange={(e) => handleFieldChange(field.key, e.target.value)}
            className="w-full px-3 py-2 border rounded-md bg-white text-sm"
          >
            <option value="">Select...</option>
            {field.options?.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        );
      
      case 'json':
        return (
          <Textarea
            value={typeof value === 'object' ? JSON.stringify(value, null, 2) : value || ''}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value);
                handleFieldChange(field.key, parsed);
              } catch {
                handleFieldChange(field.key, e.target.value);
              }
            }}
            placeholder={field.placeholder}
            rows={4}
            className="resize-none font-mono text-sm"
          />
        );
      
      default:
        return (
          <Input
            value={value || ''}
            onChange={(e) => handleFieldChange(field.key, e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
          />
        );
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex">
      {/* Mobile overlay to close sidebar */}
      {showSidebar && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/20 z-10"
          onClick={() => setShowSidebar(false)}
        />
      )}

      <div className="flex w-full h-full bg-white">
        {/* Record Selection Sidebar - Responsive */}
        <div className={`
          ${showSidebar ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          fixed lg:relative top-0 left-0 z-20 lg:z-auto
          w-80 lg:w-80 h-full 
          bg-gray-50 border-r flex flex-col
          transition-transform duration-300 ease-in-out
          lg:transition-none
        `}>
          <div className="p-4 border-b bg-white">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-gray-900">Select {config.title}</h3>
              <div className="flex items-center space-x-2">
                <Badge variant="secondary" className="text-xs">
                  {allRecords.length} total
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  className="lg:hidden"
                  onClick={() => setShowSidebar(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder={`Search ${dataType}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 text-sm"
              />
            </div>
          </div>
          
          {/* Scrollable record list */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-2 space-y-1">
              {filteredRecords.map((r) => (
                <div
                  key={r.id}
                  onClick={() => {
                    onRecordChange(r);
                    setShowSidebar(false); // Close sidebar on mobile after selection
                  }}
                  className={`p-3 rounded-md cursor-pointer transition-colors ${
                    record?.id === r.id 
                      ? 'bg-green-100 border border-green-200' 
                      : 'hover:bg-white border border-transparent'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    {r.image_url && (
                      <SimpleRecordImage
                        imageUrl={r.image_url}
                        altText={r.name}
                        className="w-10 h-10 rounded object-cover flex-shrink-0"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate">{r.name}</p>
                      {r.category && (
                        <p className="text-xs text-gray-500">{r.category}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Editor Panel - Responsive */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header - Fixed */}
          <div className="flex items-center justify-between p-4 border-b bg-white flex-shrink-0">
            <div className="flex items-center space-x-4 min-w-0">
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="lg:hidden"
                  onClick={() => setShowSidebar(true)}
                >
                  <Menu className="w-4 h-4" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onCancel}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="min-w-0">
                <h2 className="text-lg font-semibold">
                  Edit {config.title}
                </h2>
                {record && (
                  <p className="text-sm text-gray-600 truncate">
                    {record.name}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2 flex-shrink-0">
              <div className="hidden sm:flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handlePrevious}
                  disabled={currentIndex <= 0}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                
                <span className="text-sm text-gray-600 px-2 whitespace-nowrap">
                  {currentIndex + 1} of {allRecords.length}
                </span>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleNext}
                  disabled={currentIndex >= allRecords.length - 1}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
                
                <Separator orientation="vertical" className="h-6" />
              </div>
              
              <Button
                onClick={handleSave}
                disabled={isSaving || !editedRecord}
                className="bg-green-600 hover:bg-green-700"
                size="sm"
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                    <span className="hidden sm:inline">Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 sm:mr-2" />
                    <span className="hidden sm:inline">Save Changes</span>
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Editor Content - Scrollable */}
          {editedRecord ? (
            <div className="flex-1 overflow-y-auto">
              <div className="p-4 sm:p-6">
                <div className="max-w-2xl space-y-6">
                  {/* Image Display */}
                  {editedRecord.image_url && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base flex items-center">
                          <ImageIcon className="w-4 h-4 mr-2" />
                          Image
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <SimpleRecordImage
                          imageUrl={editedRecord.image_url}
                          altText={editedRecord.name}
                          className="w-full h-48 object-cover rounded-md"
                        />
                      </CardContent>
                    </Card>
                  )}

                  {/* Basic Fields */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center">
                        <Edit3 className="w-4 h-4 mr-2" />
                        Basic Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {config.fields.map((field) => (
                        <div key={field.key}>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {field.label}
                            {field.required && <span className="text-red-500 ml-1">*</span>}
                          </label>
                          {renderFieldInput(field, editedRecord[field.key])}
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  {/* Metadata */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center">
                        <Info className="w-4 h-4 mr-2" />
                        Metadata
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Source
                        </label>
                        <Input
                          value={editedRecord.source || ''}
                          onChange={(e) => handleFieldChange('source', e.target.value)}
                          placeholder="Data source"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          External ID
                        </label>
                        <Input
                          value={editedRecord.external_id || ''}
                          onChange={(e) => handleFieldChange('external_id', e.target.value)}
                          placeholder="External identifier"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Image URL
                        </label>
                        <Input
                          value={editedRecord.image_url || ''}
                          onChange={(e) => handleFieldChange('image_url', e.target.value)}
                          placeholder="https://..."
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 gap-4 pt-2 border-t text-sm text-gray-600">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-2" />
                          <span>
                            Last updated: {editedRecord.imported_at 
                              ? new Date(editedRecord.imported_at).toLocaleString()
                              : 'Never'
                            }
                          </span>
                        </div>
                        <div className="flex items-center">
                          <Database className="w-4 h-4 mr-2" />
                          <span>ID: {editedRecord.id}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Mobile navigation at bottom */}
                  <div className="sm:hidden flex items-center justify-center space-x-4 py-4 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePrevious}
                      disabled={currentIndex <= 0}
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" />
                      Previous
                    </Button>
                    
                    <span className="text-sm text-gray-600 px-2">
                      {currentIndex + 1} of {allRecords.length}
                    </span>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleNext}
                      disabled={currentIndex >= allRecords.length - 1}
                    >
                      Next
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <Database className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p>Select a {config.title.toLowerCase()} to edit</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}