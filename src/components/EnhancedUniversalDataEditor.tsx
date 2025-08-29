import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Badge } from "./ui/badge";
import { Alert, AlertDescription } from "./ui/alert";
import { ScrollArea } from "./ui/scroll-area";
import { Separator } from "./ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
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
  Menu,
  Upload,
  Wand2,
  Merge,
  Bot,
  Loader2,
  GitMerge,
  AlertTriangle,
  Sparkles,
  Shuffle,
  Copy,
  Link
} from "lucide-react";
import { SimpleRecordImage } from "./SimpleRecordImage";
import { AIImageGenerator } from "./AIImageGenerator";
import { toast } from "sonner@2.0.3";
import { projectId, publicAnonKey } from "../utils/supabase/info";

interface Record {
  id: string;
  name: string;
  description?: string;
  category?: string;
  source?: string;
  sources?: string[];
  imported_at?: string;
  image_url?: string;
  external_id?: string;
  merge_suggestions?: string[];
  [key: string]: any;
}

interface MergeCandidate {
  record: Record;
  similarity: number;
  reasons: string[];
}

interface EnhancedUniversalDataEditorProps {
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
    aiHint?: string;
  }>;
}> = {
  nutrients: {
    title: 'Nutrient',
    fields: [
      { key: 'name', label: 'Name', type: 'text', required: true, placeholder: 'e.g., Vitamin C', aiHint: 'Provide the standard scientific name for this nutrient' },
      { key: 'category', label: 'Category', type: 'select', options: ['Vitamins', 'Minerals', 'Amino Acids', 'Fatty Acids', 'Fiber', 'General Nutrients'] },
      { key: 'unit', label: 'Unit', type: 'text', placeholder: 'e.g., mg, μg, g', aiHint: 'Standard unit of measurement for this nutrient' },
      { key: 'rdi', label: 'RDI', type: 'number', placeholder: 'Recommended Daily Intake', aiHint: 'WHO/FDA recommended daily intake value' },
      { key: 'type', label: 'Type', type: 'text', placeholder: 'e.g., Water-soluble vitamin', aiHint: 'Classification type (water-soluble, fat-soluble, etc.)' },
      { key: 'description', label: 'Description', type: 'textarea', placeholder: 'Detailed description of the nutrient...', aiHint: 'Scientific description of the nutrient and its properties' },
      { key: 'health_benefits', label: 'Health Benefits', type: 'textarea', placeholder: 'Health benefits and functions...', aiHint: 'Evidence-based health benefits from scientific studies' },
      { key: 'deficiency_symptoms', label: 'Deficiency Symptoms', type: 'textarea', placeholder: 'Symptoms of deficiency...', aiHint: 'Clinical symptoms of nutrient deficiency' },
      { key: 'food_sources', label: 'Food Sources', type: 'json', placeholder: 'JSON array of food sources', aiHint: 'Common dietary sources rich in this nutrient' }
    ]
  },
  pollutants: {
    title: 'Pollutant',
    fields: [
      { key: 'name', label: 'Name', type: 'text', required: true, placeholder: 'e.g., PM2.5', aiHint: 'Standard name for this pollutant or contaminant' },
      { key: 'scientific_name', label: 'Scientific Name', type: 'text', placeholder: 'Chemical or scientific name', aiHint: 'IUPAC chemical name or scientific classification' },
      { key: 'category', label: 'Category', type: 'select', options: ['Particulate Matter', 'Heavy Metals', 'Volatile Organic Compounds', 'Pesticides', 'Industrial Chemicals', 'Air Pollutants'] },
      { key: 'risk_level', label: 'Risk Level', type: 'select', options: ['Low', 'Moderate', 'High', 'Very High'] },
      { key: 'description', label: 'Description', type: 'textarea', placeholder: 'Detailed description of the pollutant...', aiHint: 'Scientific description of the pollutant and its properties' },
      { key: 'health_effects', label: 'Health Effects', type: 'textarea', placeholder: 'Health effects and risks...', aiHint: 'Documented health effects from EPA/WHO studies' },
      { key: 'exposure_routes', label: 'Exposure Routes', type: 'textarea', placeholder: 'How exposure occurs...', aiHint: 'Common pathways of human exposure' },
      { key: 'safe_levels', label: 'Safe Levels', type: 'textarea', placeholder: 'WHO/EPA safety guidelines...', aiHint: 'Regulatory safety limits and guidelines' }
    ]
  },
  ingredients: {
    title: 'Ingredient',
    fields: [
      { key: 'name', label: 'Name', type: 'text', required: true, placeholder: 'e.g., Organic Spinach', aiHint: 'Standard ingredient name as commonly used' },
      { key: 'common_name', label: 'Common Name', type: 'text', placeholder: 'Alternative or common name', aiHint: 'Alternative or colloquial names for this ingredient' },
      { key: 'category', label: 'Category', type: 'select', options: ['Fresh Vegetables', 'Fresh Fruits', 'Proteins', 'Grains & Cereals', 'Dairy & Alternatives', 'Herbs & Spices', 'Oils & Fats', 'Natural Sweeteners', 'Beverages', 'Condiments & Sauces'] },
      { key: 'description', label: 'Description', type: 'textarea', placeholder: 'Detailed description of the ingredient...', aiHint: 'Culinary and nutritional description of the ingredient' },
      { key: 'nutritional_info', label: 'Nutritional Info', type: 'textarea', placeholder: 'Key nutritional information...', aiHint: 'Key nutritional highlights per 100g serving' },
      { key: 'allergen_info', label: 'Allergen Info', type: 'text', placeholder: 'Allergen information', aiHint: 'Common allergens present in this ingredient' }
    ]
  },
  products: {
    title: 'Product',
    fields: [
      { key: 'name', label: 'Product Name', type: 'text', required: true, placeholder: 'e.g., Organic Whole Milk', aiHint: 'Full product name as it appears on packaging' },
      { key: 'brand', label: 'Brand', type: 'text', placeholder: 'Brand name', aiHint: 'Manufacturer or brand name' },
      { key: 'category', label: 'Category', type: 'select', options: ['Dairy', 'Meat', 'Seafood', 'Eggs', 'Vegetables', 'Fruits', 'Grains', 'Nuts', 'Oils', 'Beverages'] },
      { key: 'description', label: 'Description', type: 'textarea', placeholder: 'Product description...', aiHint: 'Marketing description and key product features' },
      { key: 'ingredients', label: 'Ingredients', type: 'textarea', placeholder: 'Product ingredients list...', aiHint: 'Complete ingredients list from product label' },
      { key: 'nutritional_profile', label: 'Nutritional Profile', type: 'json', placeholder: 'JSON object with nutrition data', aiHint: 'Nutrition facts per serving size' }
    ]
  },
  parasites: {
    title: 'Parasite',
    fields: [
      { key: 'name', label: 'Name', type: 'text', required: true, placeholder: 'e.g., Giardia lamblia', aiHint: 'Scientific name of the parasite' },
      { key: 'scientific_name', label: 'Scientific Name', type: 'text', placeholder: 'Scientific classification', aiHint: 'Full taxonomic scientific name' },
      { key: 'category', label: 'Category', type: 'select', options: ['Protozoa', 'Helminths', 'Ectoparasites', 'Biological Contaminants'] },
      { key: 'description', label: 'Description', type: 'textarea', placeholder: 'Description of the parasite...', aiHint: 'Scientific description of morphology and lifecycle' },
      { key: 'health_effects', label: 'Health Effects', type: 'textarea', placeholder: 'Health effects and symptoms...', aiHint: 'Clinical symptoms and health impacts from infection' }
    ]
  },
  scans: {
    title: 'Scan',
    fields: [
      { key: 'name', label: 'Scan Name', type: 'text', required: true, placeholder: 'e.g., Product Analysis #123', aiHint: 'Descriptive name for this scan result' },
      { key: 'scan_type', label: 'Scan Type', type: 'select', options: ['Product Analysis', 'Ingredient Scan', 'Nutrient Analysis', 'Contamination Check'] },
      { key: 'description', label: 'Description', type: 'textarea', placeholder: 'Scan description...', aiHint: 'Description of what was scanned and methodology used' },
      { key: 'results', label: 'Results', type: 'json', placeholder: 'JSON object with scan results', aiHint: 'Structured scan results with findings and recommendations' }
    ]
  },
  meals: {
    title: 'Meal',
    fields: [
      { key: 'name', label: 'Meal Name', type: 'text', required: true, placeholder: 'e.g., Mediterranean Bowl', aiHint: 'Descriptive name for this meal combination' },
      { key: 'meal_type', label: 'Meal Type', type: 'select', options: ['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Balanced Meal'] },
      { key: 'description', label: 'Description', type: 'textarea', placeholder: 'Meal description...', aiHint: 'Description of the meal preparation and presentation' },
      { key: 'ingredients', label: 'Ingredients', type: 'json', placeholder: 'JSON array of ingredients', aiHint: 'List of all ingredients with quantities' },
      { key: 'nutrition_profile', label: 'Nutrition Profile', type: 'json', placeholder: 'JSON object with nutrition data', aiHint: 'Complete nutritional analysis of the meal' }
    ]
  }
};

export function EnhancedUniversalDataEditor({ 
  isOpen, 
  record, 
  dataType, 
  allRecords, 
  onSave, 
  onCancel, 
  onRecordChange 
}: EnhancedUniversalDataEditorProps) {
  const [editedRecord, setEditedRecord] = useState<Record | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSidebar, setShowSidebar] = useState(true);
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [showMergeDialog, setShowMergeDialog] = useState(false);
  const [mergeCandidates, setMergeCandidates] = useState<MergeCandidate[]>([]);
  const [selectedForMerge, setSelectedForMerge] = useState<string[]>([]);
  const [isLoadingMerge, setIsLoadingMerge] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState<string | null>(null);

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
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
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

  // Find merge candidates when record changes
  useEffect(() => {
    if (editedRecord && allRecords.length > 1) {
      findMergeCandidates();
    }
  }, [editedRecord?.name, allRecords]);

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

  // Find potential merge candidates
  const findMergeCandidates = () => {
    if (!editedRecord) return;

    const candidates: MergeCandidate[] = [];
    const currentName = editedRecord.name.toLowerCase();

    allRecords.forEach(r => {
      if (r.id === editedRecord.id) return;

      const otherName = r.name.toLowerCase();
      const reasons: string[] = [];
      let similarity = 0;

      // Check for variant patterns
      if (currentName.includes('variant') || otherName.includes('variant')) {
        const cleanCurrent = currentName.replace(/\s*\(variant\s*\d*\)/gi, '').trim();
        const cleanOther = otherName.replace(/\s*\(variant\s*\d*\)/gi, '').trim();
        
        if (cleanCurrent === cleanOther) {
          similarity += 90;
          reasons.push('Same name with variant differences');
        }
      }

      // Check for parenthetical differences (like Mercury (Hg))
      if (currentName.includes('(') || otherName.includes('(')) {
        const baseCurrent = currentName.split('(')[0].trim();
        const baseOther = otherName.split('(')[0].trim();
        
        if (baseCurrent === baseOther) {
          similarity += 85;
          reasons.push('Same base name with different notation');
        }
      }

      // Check for similar names
      const words1 = currentName.split(/\s+/);
      const words2 = otherName.split(/\s+/);
      const commonWords = words1.filter(w => words2.includes(w));
      
      if (commonWords.length > 0 && commonWords.length >= Math.min(words1.length, words2.length) * 0.7) {
        similarity += 60;
        reasons.push('Highly similar names');
      }

      // Check category match
      if (editedRecord.category && r.category && editedRecord.category === r.category) {
        similarity += 10;
        reasons.push('Same category');
      }

      if (similarity >= 60) {
        candidates.push({ record: r, similarity, reasons });
      }
    });

    // Sort by similarity
    candidates.sort((a, b) => b.similarity - a.similarity);
    setMergeCandidates(candidates.slice(0, 5)); // Top 5 candidates
  };

  // Handle AI field completion
  const handleAIComplete = async (fieldKey: string) => {
    if (!editedRecord) return;

    setIsGeneratingAI(fieldKey);
    try {
      const field = config.fields.find(f => f.key === fieldKey);
      if (!field?.aiHint) return;

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-ed0fe4c2/admin/ai-complete`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          recordType: dataType,
          recordName: editedRecord.name,
          fieldKey,
          fieldLabel: field.label,
          aiHint: field.aiHint,
          currentValue: editedRecord[fieldKey],
          context: {
            category: editedRecord.category,
            description: editedRecord.description
          }
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.content) {
          handleFieldChange(fieldKey, result.content);
          toast.success('AI content generated successfully!');
        } else {
          throw new Error(result.error || 'Failed to generate content');
        }
      } else {
        throw new Error(`HTTP ${response.status}: AI completion failed`);
      }
    } catch (error: any) {
      console.error('AI completion failed:', error);
      toast.error(`Failed to generate AI content: ${error.message}`);
    } finally {
      setIsGeneratingAI(null);
    }
  };

  // Handle merge records
  const handleMergeRecords = async () => {
    if (!editedRecord || selectedForMerge.length === 0) return;

    setIsLoadingMerge(true);
    try {
      const recordsToMerge = [editedRecord, ...allRecords.filter(r => selectedForMerge.includes(r.id))];
      
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-557a7646/admin/merge-records`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          records: recordsToMerge,
          dataType,
          primaryRecordId: editedRecord.id
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setEditedRecord(result.mergedRecord);
          setShowMergeDialog(false);
          setSelectedForMerge([]);
          toast.success(`Successfully merged ${selectedForMerge.length + 1} records!`);
        } else {
          throw new Error(result.error || 'Merge failed');
        }
      } else {
        throw new Error(`HTTP ${response.status}: Merge failed`);
      }
    } catch (error: any) {
      console.error('Merge failed:', error);
      toast.error(`Failed to merge records: ${error.message}`);
    } finally {
      setIsLoadingMerge(false);
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

  // Handle image generation
  const handleImageGenerated = (imageUrl: string) => {
    if (editedRecord) {
      handleFieldChange('image_url', imageUrl);
      setShowImageDialog(false);
    }
  };

  // Handle image upload
  const handleImageUpload = async (file: File) => {
    if (!file || !editedRecord) return;

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('recordId', editedRecord.id);
      formData.append('recordType', dataType);

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-557a7646/admin/upload-image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.imageUrl) {
          handleFieldChange('image_url', result.imageUrl);
          setShowImageDialog(false);
          toast.success('Image uploaded successfully!');
        } else {
          throw new Error(result.error || 'Upload failed');
        }
      } else {
        throw new Error(`HTTP ${response.status}: Upload failed`);
      }
    } catch (error: any) {
      console.error('Image upload failed:', error);
      toast.error(`Failed to upload image: ${error.message}`);
    }
  };

  // Render field input based on type with AI button
  const renderFieldInput = (field: any, value: any) => {
    const baseInput = (() => {
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
    })();

    if (field.aiHint) {
      return (
        <div className="flex space-x-2">
          <div className="flex-1">{baseInput}</div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleAIComplete(field.key)}
            disabled={isGeneratingAI === field.key || !editedRecord?.name}
            className="px-3"
            title={`Generate ${field.label} with AI`}
          >
            {isGeneratingAI === field.key ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Bot className="w-4 h-4" />
            )}
          </Button>
        </div>
      );
    }

    return baseInput;
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
          w-[90vw] sm:w-80 lg:w-80 h-full 
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
                    setShowSidebar(false);
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
                      {r.sources && r.sources.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {r.sources.slice(0, 2).map((source, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {source}
                            </Badge>
                          ))}
                          {r.sources.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{r.sources.length - 2}
                            </Badge>
                          )}
                        </div>
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

              {/* Merge button */}
              {mergeCandidates.length > 0 && (
                <Dialog open={showMergeDialog} onOpenChange={setShowMergeDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <GitMerge className="w-4 h-4 sm:mr-2" />
                      <span className="hidden sm:inline">Merge ({mergeCandidates.length})</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Merge Similar Records</DialogTitle>
                      <DialogDescription>
                        Review and merge duplicate records to maintain data quality and consistency.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          Found {mergeCandidates.length} potential duplicates to merge with "{editedRecord?.name}".
                        </AlertDescription>
                      </Alert>
                      
                      <div className="space-y-3 max-h-64 overflow-y-auto">
                        {mergeCandidates.map((candidate) => (
                          <div key={candidate.record.id} className="border rounded-lg p-3">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                  <input
                                    type="checkbox"
                                    checked={selectedForMerge.includes(candidate.record.id)}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setSelectedForMerge([...selectedForMerge, candidate.record.id]);
                                      } else {
                                        setSelectedForMerge(selectedForMerge.filter(id => id !== candidate.record.id));
                                      }
                                    }}
                                    className="rounded"
                                  />
                                  <span className="font-medium">{candidate.record.name}</span>
                                  <Badge variant="secondary">{candidate.similarity}% match</Badge>
                                </div>
                                <div className="mt-1 text-sm text-gray-600">
                                  {candidate.reasons.join(', ')}
                                </div>
                                {candidate.record.sources && (
                                  <div className="mt-2 flex flex-wrap gap-1">
                                    {candidate.record.sources.map((source, idx) => (
                                      <Badge key={idx} variant="outline" className="text-xs">
                                        {source}
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" onClick={() => setShowMergeDialog(false)}>
                          Cancel
                        </Button>
                        <Button 
                          onClick={handleMergeRecords}
                          disabled={selectedForMerge.length === 0 || isLoadingMerge}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          {isLoadingMerge ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Merge className="w-4 h-4 mr-2" />
                          )}
                          Merge {selectedForMerge.length} Records
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
              
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
                  {/* Image Management */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center justify-between">
                        <div className="flex items-center">
                          <ImageIcon className="w-4 h-4 mr-2" />
                          Image
                        </div>
                        <Dialog open={showImageDialog} onOpenChange={setShowImageDialog}>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Upload className="w-4 h-4 mr-2" />
                              Manage
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-lg">
                            <DialogHeader>
                              <DialogTitle>Manage Image</DialogTitle>
                              <DialogDescription>
                                Upload a new image, generate one with AI, or enter an image URL for this record.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <label className="block text-sm font-medium mb-2">Upload Image</label>
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleImageUpload(file);
                                  }}
                                  className="w-full"
                                />
                              </div>
                              
                              <Separator />
                              
                              <div>
                                <label className="block text-sm font-medium mb-2">Or Generate with AI</label>
                                <AIImageGenerator
                                  recordType={dataType}
                                  itemName={editedRecord.name}
                                  category={editedRecord.category}
                                  onImageGenerated={handleImageGenerated}
                                />
                              </div>
                              
                              <Separator />
                              
                              <div>
                                <label className="block text-sm font-medium mb-2">Or Enter URL</label>
                                <div className="flex space-x-2">
                                  <Input
                                    value={editedRecord.image_url || ''}
                                    onChange={(e) => handleFieldChange('image_url', e.target.value)}
                                    placeholder="https://..."
                                  />
                                  <Button 
                                    onClick={() => setShowImageDialog(false)}
                                    variant="outline"
                                  >
                                    Done
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {editedRecord.image_url ? (
                        <SimpleRecordImage
                          imageUrl={editedRecord.image_url}
                          altText={editedRecord.name}
                          className="w-full h-48 object-cover rounded-md"
                        />
                      ) : (
                        <div className="w-full h-48 bg-gray-100 rounded-md flex items-center justify-center">
                          <div className="text-center text-gray-500">
                            <ImageIcon className="w-8 h-8 mx-auto mb-2" />
                            <p className="text-sm">No image</p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

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
                            {field.aiHint && (
                              <Sparkles className="inline w-3 h-3 ml-1 text-purple-500" title="AI-enhanced field" />
                            )}
                          </label>
                          {renderFieldInput(field, editedRecord[field.key])}
                          {field.aiHint && (
                            <p className="text-xs text-gray-500 mt-1">{field.aiHint}</p>
                          )}
                        </div>
                      ))}

                      {/* RDI Information Section - Only show for nutrients */}
                      {dataType === 'nutrients' && editedRecord && (
                        <div className="mt-6 pt-4 border-t border-gray-200">
                          <div className="flex items-center gap-2 mb-3">
                            <Info className="w-4 h-4 text-blue-600" />
                            <h4 className="text-sm font-semibold text-gray-900">Regional RDI Information</h4>
                          </div>
                          
                          <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 sm:gap-4">
                            {/* EU RDI Data */}
                            <Card className="border border-blue-100 bg-blue-50/50">
                              <CardHeader className="pb-2">
                                <CardTitle className="text-sm text-blue-800 flex items-center gap-2">
                                  🇪🇺 European Union (EFSA)
                                </CardTitle>
                              </CardHeader>
                              <CardContent className="text-xs space-y-2">
                                {editedRecord.rdi_eu ? (
                                  <div className="space-y-1">
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                                      <div className="text-red-600">
                                        <strong>Deficient:</strong> &lt;{editedRecord.rdi_eu.deficient || 'N/A'}
                                      </div>
                                      <div className="text-green-600">
                                        <strong>Optimal:</strong> {editedRecord.rdi_eu.optimal || 'N/A'}
                                      </div>
                                      <div className="text-orange-600">
                                        <strong>Excess:</strong> &gt;{editedRecord.rdi_eu.excess || 'N/A'}
                                      </div>
                                    </div>
                                    <div className="text-gray-600">
                                      <strong>Unit:</strong> {editedRecord.rdi_eu.unit || editedRecord.unit || 'mg'}
                                    </div>
                                    {editedRecord.rdi_eu.pregnancy_adjustment && (
                                      <div className="text-purple-600">
                                        <strong>Pregnancy:</strong> {editedRecord.rdi_eu.pregnancy_adjustment}
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div className="text-gray-500 italic">No EU RDI data available</div>
                                )}
                              </CardContent>
                            </Card>

                            {/* USA RDI Data */}
                            <Card className="border border-green-100 bg-green-50/50">
                              <CardHeader className="pb-2">
                                <CardTitle className="text-sm text-green-800 flex items-center gap-2">
                                  🇺🇸 United States (FDA/NIH)
                                </CardTitle>
                              </CardHeader>
                              <CardContent className="text-xs space-y-2">
                                {editedRecord.rdi_usa ? (
                                  <div className="space-y-1">
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                                      <div className="text-red-600">
                                        <strong>Deficient:</strong> &lt;{editedRecord.rdi_usa.deficient || 'N/A'}
                                      </div>
                                      <div className="text-green-600">
                                        <strong>Optimal:</strong> {editedRecord.rdi_usa.optimal || 'N/A'}
                                      </div>
                                      <div className="text-orange-600">
                                        <strong>Excess:</strong> &gt;{editedRecord.rdi_usa.excess || 'N/A'}
                                      </div>
                                    </div>
                                    <div className="text-gray-600">
                                      <strong>Unit:</strong> {editedRecord.rdi_usa.unit || editedRecord.unit || 'mg'}
                                    </div>
                                    {editedRecord.rdi_usa.pregnancy_adjustment && (
                                      <div className="text-purple-600">
                                        <strong>Pregnancy:</strong> {editedRecord.rdi_usa.pregnancy_adjustment}
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div className="text-gray-500 italic">No USA RDI data available</div>
                                )}
                              </CardContent>
                            </Card>
                          </div>

                          {/* Age Group Breakdown */}
                          {(editedRecord.age_groups_eu || editedRecord.age_groups_usa) && (
                            <div className="mt-4">
                              <h5 className="text-sm font-medium text-gray-800 mb-2 flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                Age Group Recommendations
                                <Badge variant="outline" className="ml-2 text-xs">
                                  {Object.keys(editedRecord.age_groups_eu || editedRecord.age_groups_usa || {}).length} Groups
                                </Badge>
                              </h5>
                              
                              {/* Age Group Reference */}
                              <div className="mb-3 p-2 bg-gray-50 rounded-md">
                                <div className="text-xs text-gray-600 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-1">
                                  <div><strong>Infants:</strong> 0-12 months</div>
                                  <div><strong>Children:</strong> 1-8 years</div>
                                  <div><strong>Adolescents:</strong> 9-18 years</div>
                                  <div><strong>Adults:</strong> 19-50 years</div>
                                  <div><strong>Adults 51+:</strong> 51-70 years</div>
                                  <div><strong>Elderly:</strong> 70+ years</div>
                                  <div><strong>Pregnancy:</strong> All trimesters</div>
                                  <div><strong>Lactation:</strong> Breastfeeding</div>
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                                {/* EU Age Groups */}
                                {editedRecord.age_groups_eu && (
                                  <div className="bg-blue-50 rounded-md p-3">
                                    <h6 className="text-xs font-semibold text-blue-800 mb-3">🇪🇺 EU Age Groups (EFSA)</h6>
                                    <ScrollArea className="max-h-[300px]">
                                      <div className="space-y-3 text-xs">
                                        {Object.entries(editedRecord.age_groups_eu).map(([ageGroup, values]) => {
                                          const isObject = typeof values === 'object' && values !== null;
                                          const unit = editedRecord.unit || 'mg';
                                          
                                          return (
                                            <div key={ageGroup} className="border-l-2 border-blue-200 pl-2">
                                              <div className="font-medium text-blue-900 capitalize mb-1 text-xs">
                                                {ageGroup.replace(/_/g, ' ')}
                                              </div>
                                              
                                              {isObject ? (
                                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 text-xs">
                                                  <div className="text-red-600">
                                                    <div className="font-medium">Deficient</div>
                                                    <div>&lt;{values.deficient || values.ear || '—'} {unit}</div>
                                                  </div>
                                                  <div className="text-green-600">
                                                    <div className="font-medium">Optimal</div>
                                                    <div>{values.optimal || values.rda || values.recommended || '—'} {unit}</div>
                                                  </div>
                                                  <div className="text-orange-600">
                                                    <div className="font-medium">Excess</div>
                                                    <div>&gt;{values.excess || values.ul || '—'} {unit}</div>
                                                  </div>
                                                </div>
                                              ) : (
                                                <div className="text-gray-700">
                                                  <span className="font-medium">RDA:</span> {values} {unit}
                                                </div>
                                              )}
                                              
                                              {isObject && (values.notes || values.special_conditions) && (
                                                <div className="text-gray-600 italic mt-1 text-xs">
                                                  {values.notes || values.special_conditions}
                                                </div>
                                              )}
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </ScrollArea>
                                  </div>
                                )}

                                {/* USA Age Groups */}
                                {editedRecord.age_groups_usa && (
                                  <div className="bg-green-50 rounded-md p-3">
                                    <h6 className="text-xs font-semibold text-green-800 mb-3">🇺🇸 USA Age Groups (FDA/NIH)</h6>
                                    <ScrollArea className="max-h-[300px]">
                                      <div className="space-y-3 text-xs">
                                        {Object.entries(editedRecord.age_groups_usa).map(([ageGroup, values]) => {
                                          const isObject = typeof values === 'object' && values !== null;
                                          const unit = editedRecord.unit || 'mg';
                                          
                                          return (
                                            <div key={ageGroup} className="border-l-2 border-green-200 pl-2">
                                              <div className="font-medium text-green-900 capitalize mb-1 text-xs">
                                                {ageGroup.replace(/_/g, ' ')}
                                              </div>
                                              
                                              {isObject ? (
                                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 text-xs">
                                                  <div className="text-red-600">
                                                    <div className="font-medium">Deficient</div>
                                                    <div>&lt;{values.deficient || values.ear || '—'} {unit}</div>
                                                  </div>
                                                  <div className="text-green-600">
                                                    <div className="font-medium">Optimal</div>
                                                    <div>{values.optimal || values.rda || values.recommended || '—'} {unit}</div>
                                                  </div>
                                                  <div className="text-orange-600">
                                                    <div className="font-medium">Excess</div>
                                                    <div>&gt;{values.excess || values.ul || '—'} {unit}</div>
                                                  </div>
                                                </div>
                                              ) : (
                                                <div className="text-gray-700">
                                                  <span className="font-medium">RDA:</span> {values} {unit}
                                                </div>
                                              )}
                                              
                                              {isObject && (values.notes || values.special_conditions) && (
                                                <div className="text-gray-600 italic mt-1 text-xs">
                                                  {values.notes || values.special_conditions}
                                                </div>
                                              )}
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </ScrollArea>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Special Conditions */}
                          {(editedRecord.special_conditions || editedRecord.interactions || editedRecord.absorption_factors) && (
                            <div className="mt-4 bg-amber-50 rounded-md p-3 border border-amber-200">
                              <h5 className="text-sm font-medium text-amber-800 mb-2 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" />
                                Special Considerations
                              </h5>
                              
                              <div className="space-y-2 text-xs">
                                {editedRecord.special_conditions && (
                                  <div>
                                    <strong className="text-amber-700">Special Conditions:</strong>
                                    <p className="text-gray-700 mt-1">{editedRecord.special_conditions}</p>
                                  </div>
                                )}
                                
                                {editedRecord.interactions && (
                                  <div>
                                    <strong className="text-amber-700">Drug/Nutrient Interactions:</strong>
                                    <p className="text-gray-700 mt-1">{editedRecord.interactions}</p>
                                  </div>
                                )}
                                
                                {editedRecord.absorption_factors && (
                                  <div>
                                    <strong className="text-amber-700">Absorption Factors:</strong>
                                    <p className="text-gray-700 mt-1">{editedRecord.absorption_factors}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Quick RDI Actions */}
                          <div className="mt-4 flex flex-col sm:flex-row sm:flex-wrap gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                window.open('/test-regional-rdi.html', '_blank');
                              }}
                              className="text-xs"
                            >
                              <ExternalLink className="w-3 h-3 mr-1" />
                              View RDI Manager
                            </Button>
                            
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                const rdiData = {
                                  nutrient: editedRecord.name,
                                  eu: editedRecord.rdi_eu,
                                  usa: editedRecord.rdi_usa,
                                  ageGroups: {
                                    eu: editedRecord.age_groups_eu,
                                    usa: editedRecord.age_groups_usa
                                  }
                                };
                                navigator.clipboard.writeText(JSON.stringify(rdiData, null, 2));
                                toast.success('RDI data copied to clipboard');
                              }}
                              className="text-xs"
                            >
                              <Copy className="w-3 h-3 mr-1" />
                              Copy RDI Data
                            </Button>

                            {(!editedRecord.rdi_eu || !editedRecord.rdi_usa) && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={async () => {
                                  // Auto-populate RDI data based on nutrient name
                                  try {
                                    const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-557a7646/mobile/rdi-options`, {
                                      headers: {
                                        'Authorization': `Bearer ${publicAnonKey}`,
                                        'Content-Type': 'application/json'
                                      }
                                    });
                                    
                                    if (response.ok) {
                                      const data = await response.json();
                                      const nutrientRDI = data.nutrients?.find(n => 
                                        n.name?.toLowerCase().includes(editedRecord.name?.toLowerCase()) ||
                                        editedRecord.name?.toLowerCase().includes(n.name?.toLowerCase())
                                      );
                                      
                                      if (nutrientRDI) {
                                        setEditedRecord(prev => ({
                                          ...prev,
                                          rdi_eu: nutrientRDI.rdi_eu || prev.rdi_eu,
                                          rdi_usa: nutrientRDI.rdi_usa || prev.rdi_usa,
                                          age_groups_eu: nutrientRDI.age_groups_eu || prev.age_groups_eu,
                                          age_groups_usa: nutrientRDI.age_groups_usa || prev.age_groups_usa
                                        }));
                                        toast.success('RDI data auto-populated from database');
                                      } else {
                                        toast.info('No matching RDI data found for this nutrient');
                                      }
                                    }
                                  } catch (error) {
                                    toast.error('Failed to auto-populate RDI data');
                                  }
                                }}
                                className="text-xs text-purple-600 border-purple-200 hover:bg-purple-50"
                              >
                                <Wand2 className="w-3 h-3 mr-1" />
                                Auto-populate RDI
                              </Button>
                            )}

                            <Dialog>
                              <DialogTrigger asChild>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="text-xs text-blue-600 border-blue-200 hover:bg-blue-50"
                                >
                                  <Info className="w-3 h-3 mr-1" />
                                  RDI Data Format
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-y-auto sm:max-h-[80vh]">
                                <DialogHeader>
                                  <DialogTitle>RDI Data Structure Example</DialogTitle>
                                  <DialogDescription>
                                    Reference format for entering age-specific RDI values with deficient, optimal, and excess thresholds.
                                  </DialogDescription>
                                </DialogHeader>
                                
                                <div className="space-y-4">
                                  <div className="bg-gray-50 p-3 sm:p-4 rounded-md">
                                    <h4 className="font-medium mb-2 text-sm sm:text-base">Age Groups Structure (JSON)</h4>
                                    <ScrollArea className="h-[300px] sm:h-[400px]">
                                      <pre className="text-xs sm:text-sm bg-white p-2 sm:p-3 rounded border overflow-x-auto whitespace-pre-wrap">
{`{
  "infants_0_6_months": {
    "deficient": 5,
    "optimal": 10,
    "excess": 25,
    "notes": "AI (Adequate Intake)"
  },
  "infants_7_12_months": {
    "deficient": 8,
    "optimal": 15,
    "excess": 38
  },
  "children_1_3_years": {
    "deficient": 12,
    "optimal": 20,
    "excess": 63
  },
  "children_4_8_years": {
    "deficient": 16,
    "optimal": 25,
    "excess": 75
  },
  "children_9_13_years": {
    "deficient": 20,
    "optimal": 35,
    "excess": 100
  },
  "adolescents_14_18_years": {
    "deficient": 24,
    "optimal": 40,
    "excess": 120
  },
  "adults_19_50_years": {
    "deficient": 30,
    "optimal": 50,
    "excess": 150
  },
  "adults_51_70_years": {
    "deficient": 32,
    "optimal": 55,
    "excess": 150
  },
  "elderly_70_plus": {
    "deficient": 35,
    "optimal": 60,
    "excess": 150
  },
  "pregnant_women": {
    "deficient": 40,
    "optimal": 70,
    "excess": 180,
    "special_conditions": "Higher needs in 2nd/3rd trimester"
  },
  "lactating_women": {
    "deficient": 45,
    "optimal": 75,
    "excess": 180
  }
}`}
                                      </pre>
                                    </ScrollArea>
                                  </div>
                                  
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-blue-50 p-3 sm:p-4 rounded-md">
                                      <h4 className="font-medium mb-2 text-sm sm:text-base">Key Terms</h4>
                                      <div className="text-xs sm:text-sm space-y-1">
                                        <div><strong>Deficient:</strong> Below this value indicates deficiency risk</div>
                                        <div><strong>Optimal:</strong> RDA/AI - Recommended Daily Allowance or Adequate Intake</div>
                                        <div><strong>Excess:</strong> UL - Tolerable Upper Intake Level (safety threshold)</div>
                                        <div><strong>EAR:</strong> Estimated Average Requirement (can be used for deficient threshold)</div>
                                      </div>
                                    </div>
                                    
                                    <div className="bg-green-50 p-3 sm:p-4 rounded-md">
                                      <h4 className="font-medium mb-2 text-sm sm:text-base">Regional Differences</h4>
                                      <div className="text-xs sm:text-sm space-y-1">
                                        <div><strong>EU (EFSA):</strong> European Food Safety Authority guidelines</div>
                                        <div><strong>USA (FDA/NIH):</strong> Food and Drug Administration / National Institutes of Health guidelines</div>
                                        <div>Values may differ due to different assessment methodologies and population studies</div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Metadata and Sources */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center">
                        <Info className="w-4 h-4 mr-2" />
                        Metadata & Sources
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Primary Source
                        </label>
                        <Input
                          value={editedRecord.source || ''}
                          onChange={(e) => handleFieldChange('source', e.target.value)}
                          placeholder="Primary data source"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          All Sources
                        </label>
                        <Textarea
                          value={editedRecord.sources ? editedRecord.sources.join(', ') : ''}
                          onChange={(e) => {
                            const sources = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                            handleFieldChange('sources', sources);
                          }}
                          placeholder="API1, API2, Manual Entry, etc."
                          rows={2}
                        />
                        {editedRecord.sources && editedRecord.sources.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {editedRecord.sources.map((source, idx) => (
                              <Badge key={idx} variant="outline">
                                {source}
                              </Badge>
                            ))}
                          </div>
                        )}
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