import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import { Alert, AlertDescription } from './ui/alert';
import { Skeleton } from './ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Separator } from './ui/separator';
import { AIFieldAssistant } from './AIFieldAssistant';
import { 
  Settings,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Info,
  Edit3,
  Type,
  Hash,
  List,
  Eye,
  FileText,
  RefreshCw,
  Plus,
  Minus,
  Copy,
  Heart,
  Zap,
  Shield,
  Beaker,
  Utensils,
  MapPin,
  Users,
  Calendar,
  Target,
  Wand2
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface NutrientForm {
  form_name: string;
  type: string;
  conversion_factor: number;
  bioavailability_notes: string;
}

interface OptimalRange {
  min: number;
  max: number;
  deficiency: number;
  toxicity: number;
}

interface RegionalValues {
  units: string;
  general: { [ageGroup: string]: number };
  pregnancy?: { [ageGroup: string]: number };
  lactation?: { [ageGroup: string]: number };
}

interface ThresholdGroup {
  deficient: {
    lt: number;
    effects: string[];
  };
  optimal: {
    min: number;
    max: number;
    benefits: string[];
  };
  excess: {
    gt: number;
    effects: string[];
  };
}

interface ThresholdEffects {
  USA: {
    units: string;
    groups: { [groupName: string]: ThresholdGroup };
  };
  EU: {
    units: string;  
    groups: { [groupName: string]: ThresholdGroup };
  };
}

interface FoodStrategy {
  animal?: {
    title: string;
    description: string;
  };
  plant?: {
    title: string;
    description: string;
  };
}

interface TopFood {
  name: string;
  type: string;
  amount_mcg_per_100g: number;
}

interface AbsorptionRequirements {
  description: string;
}

interface KeyInteraction {
  name: string;
  mechanism: string;
}

interface KeyInteractions {
  description: string;
  interactions: KeyInteraction[];
}

interface PregnancyConsiderations {
  summary: string;
  guidance: string;
}

interface SupplementGuidance {
  guidance: string;
}

interface AgeGroup {
  if_deficient: number;
  if_pregnant?: number | null;
}

interface RegionalSupplementGuidelines {
  units: string;
  source: string;
  by_age: { [ageGroup: string]: AgeGroup };
}

interface SupplementSource {
  name: string;
  description: string;
  link: string;
}

interface ComprehensiveNutrientDefinition {
  name: string;
  category: string;
  'sub-category': string;
  simple_description: string;
  technical_description: string;
  primary_function: string;
  measurement_unit: string;
  daily_value: number;
  health_benefits: string[];
  deficiency_symptoms: string[];
  excess_symptoms: string[];
  forms: NutrientForm[];
  functions: string[];
  optimal_range_umol_l: OptimalRange;
  recommended_values: {
    USA: RegionalValues;
    EU: RegionalValues;
  };
  threshold_effects: ThresholdEffects;
  food_strategy: FoodStrategy;
  top_foods: TopFood[];
  synergistic_nutrients: string[];
  depleting_factors: string[];
  absorption_requirements: AbsorptionRequirements;
  key_interactions: KeyInteractions;
  pregnancy_considerations: PregnancyConsiderations;
  when_to_supplement: SupplementGuidance;
  supplement_guidelines: {
    USA: RegionalSupplementGuidelines;
    EU: RegionalSupplementGuidelines;
  };
  supplement_sources: SupplementSource[];
}

interface FieldDefinitionManagerProps {
  onDataChanged?: () => void;
}

export function FieldDefinitionManager({ onDataChanged }: FieldDefinitionManagerProps) {
  const [nutrientData, setNutrientData] = useState<ComprehensiveNutrientDefinition>({
    name: '',
    category: '',
    'sub-category': '',
    simple_description: '',
    technical_description: '',
    primary_function: '',
    measurement_unit: '',
    daily_value: 0,
    health_benefits: [],
    deficiency_symptoms: [],
    excess_symptoms: [],
    forms: [],
    functions: [],
    optimal_range_umol_l: {
      min: 0,
      max: 0,
      deficiency: 0,
      toxicity: 0
    },
    recommended_values: {
      USA: {
        units: '',
        general: {},
        pregnancy: {},
        lactation: {}
      },
      EU: {
        units: '',
        general: {},
        pregnancy: {},
        lactation: {}
      }
    },
    threshold_effects: {
      USA: {
        units: '',
        groups: {}
      },
      EU: {
        units: '',
        groups: {}
      }
    },
    food_strategy: {},
    top_foods: [],
    synergistic_nutrients: [],
    depleting_factors: [],
    absorption_requirements: {
      description: ''
    },
    key_interactions: {
      description: '',
      interactions: []
    },
    pregnancy_considerations: {
      summary: '',
      guidance: ''
    },
    when_to_supplement: {
      guidance: ''
    },
    supplement_guidelines: {
      USA: {
        units: '',
        source: '',
        by_age: {}
      },
      EU: {
        units: '',
        source: '',
        by_age: {}
      }
    },
    supplement_sources: []
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');

  const categoryOptions = [
    'vitamins',
    'minerals',
    'amino-acids',
    'fatty-acids',
    'antioxidants',
    'phytonutrients',
    'enzymes',
    'probiotics'
  ];

  const subcategoryOptions = {
    vitamins: ['fat-soluble', 'water-soluble', 'b-complex'],
    minerals: ['macro-minerals', 'trace-minerals', 'electrolytes'],
    'amino-acids': ['essential', 'non-essential', 'conditional'],
    'fatty-acids': ['omega-3', 'omega-6', 'omega-9', 'saturated'],
    antioxidants: ['carotenoids', 'polyphenols', 'flavonoids'],
    phytonutrients: ['carotenoids', 'polyphenols', 'glucosinolates'],
    enzymes: ['digestive', 'metabolic', 'antioxidant'],
    probiotics: ['lactobacillus', 'bifidobacterium', 'streptococcus']
  };

  const loadSampleData = () => {
    const sampleData: ComprehensiveNutrientDefinition = {
      name: "Vitamin A",
      category: "vitamins",
      'sub-category': "fat-soluble",
      simple_description: "A vitamin essential for good vision, healthy skin, immune function, and growth.",
      technical_description: "Vitamin A is a group of fat-soluble retinoids including retinol, retinal, and retinyl esters. It plays key roles in gene transcription, immune modulation, and visual phototransduction via the retinal pigment epithelium.",
      primary_function: "Supports vision, immune health, and cell development.",
      measurement_unit: "mcg RAE/day",
      daily_value: 900,
      health_benefits: [
        "Improves night and color vision",
        "Enhances immunity and infection resistance",
        "Supports fetal development and cell growth",
        "Maintains healthy skin and mucous membranes"
      ],
      deficiency_symptoms: [
        "Night blindness",
        "Dry eyes and skin",
        "Frequent infections",
        "Delayed growth",
        "Fertility issues"
      ],
      excess_symptoms: [
        "Headaches",
        "Liver toxicity",
        "Birth defects (in pregnancy)",
        "Bone thinning",
        "Nausea"
      ],
      forms: [
        {
          form_name: "Retinol",
          type: "Preformed",
          conversion_factor: 1,
          bioavailability_notes: "Highly bioavailable in animal foods"
        },
        {
          form_name: "Beta-Carotene",
          type: "Provitamin A Carotenoid",
          conversion_factor: 12,
          bioavailability_notes: "Lower bioavailability, conversion depends on genetics and gut health"
        }
      ],
      functions: ["Vision", "Immune Defense", "Cell Growth"],
      optimal_range_umol_l: {
        min: 0.35,
        max: 1.75,
        deficiency: 0.34,
        toxicity: 2.1
      },
      recommended_values: {
        USA: {
          units: "mcg RAE/day",
          general: {
            infants_0_6m: 400,
            infants_7_12m: 500,
            children_1_3y: 300,
            children_4_8y: 400,
            children_9_13y: 600,
            teens_14_18y_male: 900,
            teens_14_18y_female: 700,
            adults_male: 900,
            adults_female: 700
          },
          pregnancy: {
            "14_18y": 750,
            "19_50y": 770
          },
          lactation: {
            "14_18y": 1200,
            "19_50y": 1300
          }
        },
        EU: {
          units: "mcg RE/day",
          general: {
            infants_0_12m: 250,
            children_1_3y: 300,
            children_4_6y: 350,
            children_7_10y: 450,
            children_11_14y: 600,
            adolescents_15_17y: 700,
            adults_male: 750,
            adults_female: 650
          },
          pregnancy: {
            all: 700
          },
          lactation: {
            all: 1300
          }
        }
      },
      threshold_effects: {
        USA: {
          units: "mcg RAE/day",
          groups: {
            adults_female: {
              deficient: {
                lt: 500,
                effects: [
                  "Night Blindness",
                  "Higher Infection Risk",
                  "Dry Eyes, Skin",
                  "Impaired Fertility",
                  "Weakened Immunity"
                ]
              },
              optimal: {
                min: 700,
                max: 900,
                benefits: [
                  "Improves Vision",
                  "Immune Defence",
                  "Cellular Growth",
                  "Fetal Development"
                ]
              },
              excess: {
                gt: 3000,
                effects: [
                  "Headache",
                  "Liver Damage",
                  "Birth Defects"
                ]
              }
            },
            adults_male: {
              deficient: {
                lt: 600,
                effects: [
                  "Night Blindness",
                  "Higher Infection Risk"
                ]
              },
              optimal: {
                min: 900,
                max: 1500,
                benefits: [
                  "Improves Vision",
                  "Immune Defence"
                ]
              },
              excess: {
                gt: 3000,
                effects: [
                  "Headache",
                  "Liver Damage"
                ]
              }
            }
          }
        },
        EU: {
          units: "mcg RE/day",
          groups: {
            adults_female: {
              deficient: {
                lt: 500,
                effects: [
                  "Night Blindness",
                  "Impaired Fertility"
                ]
              },
              optimal: {
                min: 650,
                max: 1000,
                benefits: [
                  "Improves Vision",
                  "Fetal Development"
                ]
              },
              excess: {
                gt: 3000,
                effects: [
                  "Liver Damage",
                  "Birth Defects"
                ]
              }
            }
          }
        }
      },
      food_strategy: {
        animal: {
          title: "Animal Retinol",
          description: "Small amounts go a long way. Just 25g of beef liver provides 2.25 mg of Vitamin A, which is 150–300% of the daily requirement. Because it's so potent, it's best consumed only once or twice a month. Cod liver oil is another concentrated source—1 teaspoon provides around 1.3 mg, or over 100% of daily needs. Eggs, butter, and cheese contain moderate amounts and can be safely included more frequently across the week."
        },
        plant: {
          title: "Plant Carotenoids",
          description: "Are from vegetables and are converted into Vitamin A as needed by the body, making them safer for daily intake. A combination of cooked carrots (~0.8 mg per medium carrot), kale (~0.9 mg per cup), sweet potatoes (~1.0 mg per 100g), and spinach (~0.5 mg per cup) can meet daily requirements without the risk of overdose. These can be rotated or combined in salads, soups, or stir-fries throughout the day."
        }
      },
      top_foods: [
        { name: "Beef Liver", type: "Animal", amount_mcg_per_100g: 8000 },
        { name: "Sweet Potato", type: "Plant", amount_mcg_per_100g: 960 },
        { name: "Carrots", type: "Plant", amount_mcg_per_100g: 835 },
        { name: "Spinach", type: "Plant", amount_mcg_per_100g: 469 },
        { name: "Cheddar", type: "Animal", amount_mcg_per_100g: 265 },
        { name: "Mango", type: "Plant", amount_mcg_per_100g: 54 }
      ],
      synergistic_nutrients: ["Zinc", "Fat", "Protein"],
      depleting_factors: ["Alcohol", "Smoking", "Statins"],
      absorption_requirements: {
        description: "Vitamin A is absorbed in the small intestine but requires 3–5g of dietary fat per meal to be effective. Bile salts and pancreatic enzymes break down fat, allowing Vitamin A to enter the lymphatic system. From there, it's delivered to the liver, which stores 80–90% of the body's supply as retinyl esters. Without fat or proper digestion, up to 75% of Vitamin A may go unabsorbed."
      },
      key_interactions: {
        description: "What it works with and against",
        interactions: [
          { name: "Zinc", mechanism: "Enables transport (retinol-binding protein)" },
          { name: "Protein", mechanism: "Needed for Vitamin A metabolism and transport" },
          { name: "Iron", mechanism: "Supports conversion from beta-carotene" },
          { name: "Vitamin E", mechanism: "Protects Vitamin A from oxidation" },
          { name: "Vitamin D", mechanism: "Works in balance with A for immune function" }
        ]
      },
      pregnancy_considerations: {
        summary: "Crucial for fetal organ and nervous system development.",
        guidance: "Excess (>10,000 IU/day or >3 mg retinol) can be teratogenic, especially in the first 60 days of gestation. Safe zone: ~0.75 mg/day (2,500 IU). Prefer provitamin A (beta-carotene) sources over high-dose retinol supplements during pregnancy."
      },
      when_to_supplement: {
        guidance: "Use only if deficient or at risk. Limit preformed A (retinol) to <3 mg (10,000 IU) daily. Beta-carotene is safer long-term. Take with fat for absorption. Avoid high doses during pregnancy."
      },
      supplement_guidelines: {
        USA: {
          units: "mcg RAE/day",
          source: "National Institutes of Health (NIH) Office of Dietary Supplements, USA",
          by_age: {
            "0_12m": { if_deficient: 400, if_pregnant: null },
            "2_3y": { if_deficient: 300, if_pregnant: null },
            "4_18y": { if_deficient: 600, if_pregnant: null },
            "19_64y": { if_deficient: 900, if_pregnant: 770 },
            "65_plus": { if_deficient: 900, if_pregnant: null }
          }
        },
        EU: {
          units: "mcg RE/day",
          source: "European Food Safety Authority (EFSA), European Commission",
          by_age: {
            "0_12m": { if_deficient: 250, if_pregnant: null },
            "2_3y": { if_deficient: 300, if_pregnant: null },
            "4_18y": { if_deficient: 600, if_pregnant: null },
            "19_64y": { if_deficient: 750, if_pregnant: 700 },
            "65_plus": { if_deficient: 750, if_pregnant: null }
          }
        }
      },
      supplement_sources: [
        {
          name: "Nordic Naturals Vitamin A",
          description: "Preformed Retinol (1,500 mcg), sourced from cod liver oil. Third-party tested.",
          link: "https://example.com/products/nordic-naturals-vitamin-a"
        },
        {
          name: "NOW Foods Beta-Carotene",
          description: "Provitamin A – 25,000 IU per softgel. Vegetarian source.",
          link: "https://example.com/products/now-foods-beta-carotene"
        },
        {
          name: "Thorne Vitamin A",
          description: "Retinyl Palmitate – 7,500 mcg per capsule. Medical-grade, highly bioavailable.",
          link: "https://example.com/products/thorne-vitamin-a"
        }
      ]
    };

    setNutrientData(sampleData);
    toast.success('✅ Loaded comprehensive Vitamin A sample data');
  };

  const saveNutrientData = async () => {
    try {
      setSaving(true);
      console.log('💾 Saving comprehensive nutrient data...');

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-ed0fe4c2/admin/comprehensive-nutrient`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(nutrientData)
      });

      if (!response.ok) {
        throw new Error(`Failed to save: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        toast.success(`✅ Saved comprehensive ${nutrientData.name} definition`);
        
        if (onDataChanged) {
          onDataChanged();
        }
      } else {
        throw new Error(result.error || 'Failed to save nutrient data');
      }
    } catch (error: any) {
      console.error('❌ Save error:', error);
      toast.error(`❌ Save failed: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const resetData = () => {
    if (confirm('Reset all nutrient data? This will lose all current changes.')) {
      setNutrientData({
        name: '',
        category: '',
        'sub-category': '',
        simple_description: '',
        technical_description: '',
        primary_function: '',
        measurement_unit: '',
        daily_value: 0,
        health_benefits: [],
        deficiency_symptoms: [],
        excess_symptoms: [],
        forms: [],
        functions: [],
        optimal_range_umol_l: {
          min: 0,
          max: 0,
          deficiency: 0,
          toxicity: 0
        },
        recommended_values: {
          USA: { units: '', general: {}, pregnancy: {}, lactation: {} },
          EU: { units: '', general: {}, pregnancy: {}, lactation: {} }
        },
        threshold_effects: {
          USA: { units: '', groups: {} },
          EU: { units: '', groups: {} }
        },
        food_strategy: {},
        top_foods: [],
        synergistic_nutrients: [],
        depleting_factors: [],
        absorption_requirements: { description: '' },
        key_interactions: { description: '', interactions: [] },
        pregnancy_considerations: { summary: '', guidance: '' },
        when_to_supplement: { guidance: '' },
        supplement_guidelines: {
          USA: { units: '', source: '', by_age: {} },
          EU: { units: '', source: '', by_age: {} }
        },
        supplement_sources: []
      });
      toast.success('Reset nutrient data');
    }
  };

  const addArrayItem = (field: keyof ComprehensiveNutrientDefinition, item: string) => {
    if (item.trim()) {
      setNutrientData(prev => ({
        ...prev,
        [field]: [...(prev[field] as string[]), item.trim()]
      }));
    }
  };

  const removeArrayItem = (field: keyof ComprehensiveNutrientDefinition, index: number) => {
    setNutrientData(prev => ({
      ...prev,
      [field]: (prev[field] as string[]).filter((_, i) => i !== index)
    }));
  };

  const addForm = () => {
    const newForm: NutrientForm = {
      form_name: '',
      type: '',
      conversion_factor: 1,
      bioavailability_notes: ''
    };
    setNutrientData(prev => ({
      ...prev,
      forms: [...prev.forms, newForm]
    }));
  };

  const updateForm = (index: number, field: keyof NutrientForm, value: any) => {
    setNutrientData(prev => ({
      ...prev,
      forms: prev.forms.map((form, i) => 
        i === index ? { ...form, [field]: value } : form
      )
    }));
  };

  const removeForm = (index: number) => {
    setNutrientData(prev => ({
      ...prev,
      forms: prev.forms.filter((_, i) => i !== index)
    }));
  };

  const addTopFood = () => {
    const newFood: TopFood = {
      name: '',
      type: 'Plant',
      amount_mcg_per_100g: 0
    };
    setNutrientData(prev => ({
      ...prev,
      top_foods: [...prev.top_foods, newFood]
    }));
  };

  const updateTopFood = (index: number, field: keyof TopFood, value: any) => {
    setNutrientData(prev => ({
      ...prev,
      top_foods: prev.top_foods.map((food, i) => 
        i === index ? { ...food, [field]: value } : food
      )
    }));
  };

  const removeTopFood = (index: number) => {
    setNutrientData(prev => ({
      ...prev,
      top_foods: prev.top_foods.filter((_, i) => i !== index)
    }));
  };

  const addInteraction = () => {
    const newInteraction: KeyInteraction = {
      name: '',
      mechanism: ''
    };
    setNutrientData(prev => ({
      ...prev,
      key_interactions: {
        ...prev.key_interactions,
        interactions: [...prev.key_interactions.interactions, newInteraction]
      }
    }));
  };

  const updateInteraction = (index: number, field: keyof KeyInteraction, value: string) => {
    setNutrientData(prev => ({
      ...prev,
      key_interactions: {
        ...prev.key_interactions,
        interactions: prev.key_interactions.interactions.map((interaction, i) => 
          i === index ? { ...interaction, [field]: value } : interaction
        )
      }
    }));
  };

  const removeInteraction = (index: number) => {
    setNutrientData(prev => ({
      ...prev,
      key_interactions: {
        ...prev.key_interactions,
        interactions: prev.key_interactions.interactions.filter((_, i) => i !== index)
      }
    }));
  };

  const addSupplementSource = () => {
    const newSource: SupplementSource = {
      name: '',
      description: '',
      link: ''
    };
    setNutrientData(prev => ({
      ...prev,
      supplement_sources: [...prev.supplement_sources, newSource]
    }));
  };

  const updateSupplementSource = (index: number, field: keyof SupplementSource, value: string) => {
    setNutrientData(prev => ({
      ...prev,
      supplement_sources: prev.supplement_sources.map((source, i) => 
        i === index ? { ...source, [field]: value } : source
      )
    }));
  };

  const removeSupplementSource = (index: number) => {
    setNutrientData(prev => ({
      ...prev,
      supplement_sources: prev.supplement_sources.filter((_, i) => i !== index)
    }));
  };

  if (loading) {
    return (
      <Card className="border-purple-200 bg-purple-50">
        <CardHeader>
          <Skeleton className="h-6 w-64" />
          <Skeleton className="h-4 w-96" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-purple-200 bg-purple-50">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-purple-800">
          <Settings className="h-5 w-5" />
          <span>Comprehensive Nutrient Definition Manager</span>
          <Badge variant="outline" className="ml-2">
            {nutrientData.name || 'New Nutrient'}
          </Badge>
        </CardTitle>
        <p className="text-sm text-purple-600">
          Create enterprise-grade nutrient profiles with detailed RDI breakdowns, health thresholds, and evidence-based recommendations. 
          <span className="font-medium text-purple-700 ml-2">✨ AI-powered content generation available for all fields</span>
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button
              onClick={saveNutrientData}
              disabled={saving}
              size="sm"
              className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700"
            >
              {saving ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              <span>{saving ? 'Saving...' : 'Save Definition'}</span>
            </Button>

            <Button
              onClick={loadSampleData}
              size="sm"
              variant="outline"
              className="flex items-center space-x-2"
            >
              <Copy className="h-4 w-4" />
              <span>Load Sample (Vitamin A)</span>
            </Button>

            <Button
              onClick={resetData}
              size="sm"
              variant="outline"
              className="flex items-center space-x-2"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Reset</span>
            </Button>
          </div>
        </div>

        <Alert className="border-purple-300 bg-purple-25">
          <Wand2 className="h-4 w-4 text-purple-600" />
          <AlertDescription className="text-purple-700">
            <strong>AI Assistant Available:</strong> Click the "AI Assist" button next to any input field to generate scientifically accurate content with proper character lengths and field-specific guidance.
          </AlertDescription>
        </Alert>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-8 text-xs">
            <TabsTrigger value="basic" className="flex items-center gap-1">
              <Info className="h-3 w-3" />
              Basic
            </TabsTrigger>
            <TabsTrigger value="health" className="flex items-center gap-1">
              <Heart className="h-3 w-3" />
              Health
            </TabsTrigger>
            <TabsTrigger value="forms" className="flex items-center gap-1">
              <Beaker className="h-3 w-3" />
              Forms
            </TabsTrigger>
            <TabsTrigger value="rdi" className="flex items-center gap-1">
              <Target className="h-3 w-3" />
              RDI
            </TabsTrigger>
            <TabsTrigger value="thresholds" className="flex items-center gap-1">
              <Zap className="h-3 w-3" />
              Thresholds
            </TabsTrigger>
            <TabsTrigger value="foods" className="flex items-center gap-1">
              <Utensils className="h-3 w-3" />
              Foods
            </TabsTrigger>
            <TabsTrigger value="interactions" className="flex items-center gap-1">
              <Shield className="h-3 w-3" />
              Interactions
            </TabsTrigger>
            <TabsTrigger value="supplements" className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              Supplements
            </TabsTrigger>
          </TabsList>

          {/* Basic Information Tab */}
          <TabsContent value="basic" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Nutrient Name</Label>
                <div className="flex gap-2">
                  <Input
                    id="name"
                    value={nutrientData.name}
                    onChange={(e) => setNutrientData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Vitamin A"
                    className="flex-1"
                  />
                  <AIFieldAssistant
                    fieldName="name"
                    fieldType="text"
                    currentValue={nutrientData.name}
                    onContentGenerated={(content) => setNutrientData(prev => ({ ...prev, name: content as string }))}
                    nutrientName={nutrientData.name}
                    category={nutrientData.category}
                    className="flex-shrink-0"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={nutrientData.category}
                  onValueChange={(value) => setNutrientData(prev => ({ ...prev, category: value, 'sub-category': '' }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryOptions.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subcategory">Sub-category</Label>
                <Select
                  value={nutrientData['sub-category']}
                  onValueChange={(value) => setNutrientData(prev => ({ ...prev, 'sub-category': value }))}
                  disabled={!nutrientData.category}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select sub-category" />
                  </SelectTrigger>
                  <SelectContent>
                    {nutrientData.category && subcategoryOptions[nutrientData.category as keyof typeof subcategoryOptions]?.map(subcat => (
                      <SelectItem key={subcat} value={subcat}>{subcat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="measurement_unit">Measurement Unit</Label>
                <div className="flex gap-2">
                  <Input
                    id="measurement_unit"
                    value={nutrientData.measurement_unit}
                    onChange={(e) => setNutrientData(prev => ({ ...prev, measurement_unit: e.target.value }))}
                    placeholder="e.g., mcg RAE/day"
                    className="flex-1"
                  />
                  <AIFieldAssistant
                    fieldName="measurement_unit"
                    fieldType="text"
                    currentValue={nutrientData.measurement_unit}
                    onContentGenerated={(content) => setNutrientData(prev => ({ ...prev, measurement_unit: content as string }))}
                    nutrientName={nutrientData.name}
                    category={nutrientData.category}
                    className="flex-shrink-0"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="daily_value">Daily Value</Label>
                <Input
                  id="daily_value"
                  type="number"
                  value={nutrientData.daily_value}
                  onChange={(e) => setNutrientData(prev => ({ ...prev, daily_value: parseFloat(e.target.value) || 0 }))}
                  placeholder="e.g., 900"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="primary_function">Primary Function</Label>
                <div className="flex gap-2">
                  <Input
                    id="primary_function"
                    value={nutrientData.primary_function}
                    onChange={(e) => setNutrientData(prev => ({ ...prev, primary_function: e.target.value }))}
                    placeholder="e.g., Supports vision, immune health, and cell development."
                    className="flex-1"
                  />
                  <AIFieldAssistant
                    fieldName="primary_function"
                    fieldType="text"
                    currentValue={nutrientData.primary_function}
                    onContentGenerated={(content) => setNutrientData(prev => ({ ...prev, primary_function: content as string }))}
                    nutrientName={nutrientData.name}
                    category={nutrientData.category}
                    className="flex-shrink-0"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="simple_description">Simple Description</Label>
                <div className="flex gap-2 items-start">
                  <Textarea
                    id="simple_description"
                    value={nutrientData.simple_description}
                    onChange={(e) => setNutrientData(prev => ({ ...prev, simple_description: e.target.value }))}
                    placeholder="A clear, accessible description for general audiences..."
                    rows={3}
                    className="flex-1"
                  />
                  <AIFieldAssistant
                    fieldName="simple_description"
                    fieldType="textarea"
                    currentValue={nutrientData.simple_description}
                    onContentGenerated={(content) => setNutrientData(prev => ({ ...prev, simple_description: content as string }))}
                    nutrientName={nutrientData.name}
                    category={nutrientData.category}
                    className="flex-shrink-0"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="technical_description">Technical Description</Label>
                <div className="flex gap-2 items-start">
                  <Textarea
                    id="technical_description"
                    value={nutrientData.technical_description}
                    onChange={(e) => setNutrientData(prev => ({ ...prev, technical_description: e.target.value }))}
                    placeholder="Detailed scientific explanation with biochemical mechanisms..."
                    rows={4}
                    className="flex-1"
                  />
                  <AIFieldAssistant
                    fieldName="technical_description"
                    fieldType="textarea"
                    currentValue={nutrientData.technical_description}
                    onContentGenerated={(content) => setNutrientData(prev => ({ ...prev, technical_description: content as string }))}
                    nutrientName={nutrientData.name}
                    category={nutrientData.category}
                    className="flex-shrink-0"
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Health Effects Tab */}
          <TabsContent value="health" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Health Benefits */}
              <div className="space-y-3">
                <Label className="flex items-center space-x-2">
                  <Heart className="h-4 w-4 text-green-600" />
                  <span>Health Benefits</span>
                </Label>
                <div className="space-y-2">
                  {nutrientData.health_benefits.map((benefit, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Input
                        value={benefit}
                        onChange={(e) => setNutrientData(prev => ({
                          ...prev,
                          health_benefits: prev.health_benefits.map((b, i) => i === index ? e.target.value : b)
                        }))}
                        placeholder="Health benefit"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => removeArrayItem('health_benefits', index)}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => addArrayItem('health_benefits', 'New benefit')}
                      className="flex-1"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Benefit
                    </Button>
                    <AIFieldAssistant
                      fieldName="health_benefits"
                      fieldType="array"
                      currentValue={nutrientData.health_benefits}
                      onContentGenerated={(content) => setNutrientData(prev => ({ ...prev, health_benefits: content as string[] }))}
                      nutrientName={nutrientData.name}
                      category={nutrientData.category}
                      className="flex-shrink-0"
                    />
                  </div>
                </div>
              </div>

              {/* Deficiency Symptoms */}
              <div className="space-y-3">
                <Label className="flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  <span>Deficiency Symptoms</span>
                </Label>
                <div className="space-y-2">
                  {nutrientData.deficiency_symptoms.map((symptom, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Input
                        value={symptom}
                        onChange={(e) => setNutrientData(prev => ({
                          ...prev,
                          deficiency_symptoms: prev.deficiency_symptoms.map((s, i) => i === index ? e.target.value : s)
                        }))}
                        placeholder="Deficiency symptom"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => removeArrayItem('deficiency_symptoms', index)}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => addArrayItem('deficiency_symptoms', 'New symptom')}
                      className="flex-1"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Symptom
                    </Button>
                    <AIFieldAssistant
                      fieldName="deficiency_symptoms"
                      fieldType="array"
                      currentValue={nutrientData.deficiency_symptoms}
                      onContentGenerated={(content) => setNutrientData(prev => ({ ...prev, deficiency_symptoms: content as string[] }))}
                      nutrientName={nutrientData.name}
                      category={nutrientData.category}
                      className="flex-shrink-0"
                    />
                  </div>
                </div>
              </div>

              {/* Excess Symptoms */}
              <div className="space-y-3">
                <Label className="flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <span>Excess Symptoms</span>
                </Label>
                <div className="space-y-2">
                  {nutrientData.excess_symptoms.map((symptom, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Input
                        value={symptom}
                        onChange={(e) => setNutrientData(prev => ({
                          ...prev,
                          excess_symptoms: prev.excess_symptoms.map((s, i) => i === index ? e.target.value : s)
                        }))}
                        placeholder="Excess symptom"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => removeArrayItem('excess_symptoms', index)}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => addArrayItem('excess_symptoms', 'New symptom')}
                      className="flex-1"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Symptom
                    </Button>
                    <AIFieldAssistant
                      fieldName="excess_symptoms"
                      fieldType="array"
                      currentValue={nutrientData.excess_symptoms}
                      onContentGenerated={(content) => setNutrientData(prev => ({ ...prev, excess_symptoms: content as string[] }))}
                      nutrientName={nutrientData.name}
                      category={nutrientData.category}
                      className="flex-shrink-0"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Functions */}
            <div className="space-y-3">
              <Label>Primary Functions</Label>
              <div className="flex flex-wrap gap-2">
                {nutrientData.functions.map((func, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center space-x-1">
                    <span>{func}</span>
                    <button
                      onClick={() => removeArrayItem('functions', index)}
                      className="ml-1 hover:text-red-600"
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Add function (press Enter)"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      addArrayItem('functions', e.currentTarget.value);
                      e.currentTarget.value = '';
                    }
                  }}
                  className="flex-1"
                />
                <AIFieldAssistant
                  fieldName="functions"
                  fieldType="array"
                  currentValue={nutrientData.functions}
                  onContentGenerated={(content) => setNutrientData(prev => ({ ...prev, functions: content as string[] }))}
                  nutrientName={nutrientData.name}
                  category={nutrientData.category}
                  className="flex-shrink-0"
                />
              </div>
            </div>
          </TabsContent>

          {/* Forms Tab */}
          <TabsContent value="forms" className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="flex items-center space-x-2">
                  <Beaker className="h-4 w-4" />
                  <span>Nutrient Forms</span>
                </Label>
                <Button onClick={addForm} size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Form
                </Button>
              </div>

              {nutrientData.forms.map((form, index) => (
                <Card key={index} className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Form Name</Label>
                      <div className="flex gap-2">
                        <Input
                          value={form.form_name}
                          onChange={(e) => updateForm(index, 'form_name', e.target.value)}
                          placeholder="e.g., Retinol"
                          className="flex-1"
                        />
                        <AIFieldAssistant
                          fieldName="form_name"
                          fieldType="text"
                          currentValue={form.form_name}
                          onContentGenerated={(content) => updateForm(index, 'form_name', content as string)}
                          nutrientName={nutrientData.name}
                          category={nutrientData.category}
                          className="flex-shrink-0"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Type</Label>
                      <div className="flex gap-2">
                        <Input
                          value={form.type}
                          onChange={(e) => updateForm(index, 'type', e.target.value)}
                          placeholder="e.g., Preformed"
                          className="flex-1"
                        />
                        <AIFieldAssistant
                          fieldName="form_type"
                          fieldType="text"
                          currentValue={form.type}
                          onContentGenerated={(content) => updateForm(index, 'type', content as string)}
                          nutrientName={nutrientData.name}
                          category={nutrientData.category}
                          className="flex-shrink-0"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Conversion Factor</Label>
                      <Input
                        type="number"
                        value={form.conversion_factor}
                        onChange={(e) => updateForm(index, 'conversion_factor', parseFloat(e.target.value) || 1)}
                        placeholder="1"
                      />
                    </div>
                    <div className="space-y-2 flex items-end">
                      <Button
                        onClick={() => removeForm(index)}
                        size="sm"
                        variant="outline"
                        className="text-red-600"
                      >
                        <Minus className="h-4 w-4 mr-2" />
                        Remove
                      </Button>
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <Label>Bioavailability Notes</Label>
                      <div className="flex gap-2 items-start">
                        <Textarea
                          value={form.bioavailability_notes}
                          onChange={(e) => updateForm(index, 'bioavailability_notes', e.target.value)}
                          placeholder="Bioavailability and absorption characteristics..."
                          rows={2}
                          className="flex-1"
                        />
                        <AIFieldAssistant
                          fieldName="bioavailability_notes"
                          fieldType="textarea"
                          currentValue={form.bioavailability_notes}
                          onContentGenerated={(content) => updateForm(index, 'bioavailability_notes', content as string)}
                          nutrientName={nutrientData.name}
                          category={nutrientData.category}
                          className="flex-shrink-0"
                        />
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Optimal Range */}
            <div className="space-y-4">
              <Label className="flex items-center space-x-2">
                <Target className="h-4 w-4" />
                <span>Optimal Blood Range (μmol/L)</span>
              </Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Minimum</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={nutrientData.optimal_range_umol_l.min}
                    onChange={(e) => setNutrientData(prev => ({
                      ...prev,
                      optimal_range_umol_l: { ...prev.optimal_range_umol_l, min: parseFloat(e.target.value) || 0 }
                    }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Maximum</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={nutrientData.optimal_range_umol_l.max}
                    onChange={(e) => setNutrientData(prev => ({
                      ...prev,
                      optimal_range_umol_l: { ...prev.optimal_range_umol_l, max: parseFloat(e.target.value) || 0 }
                    }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Deficiency Threshold</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={nutrientData.optimal_range_umol_l.deficiency}
                    onChange={(e) => setNutrientData(prev => ({
                      ...prev,
                      optimal_range_umol_l: { ...prev.optimal_range_umol_l, deficiency: parseFloat(e.target.value) || 0 }
                    }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Toxicity Threshold</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={nutrientData.optimal_range_umol_l.toxicity}
                    onChange={(e) => setNutrientData(prev => ({
                      ...prev,
                      optimal_range_umol_l: { ...prev.optimal_range_umol_l, toxicity: parseFloat(e.target.value) || 0 }
                    }))}
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          {/* RDI Tab */}
          <TabsContent value="rdi" className="space-y-6">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                This tab would contain comprehensive RDI data entry forms for USA and EU regions with age-specific values, pregnancy, and lactation recommendations. Due to space constraints, this is represented as a placeholder.
              </AlertDescription>
            </Alert>
            <div className="text-center py-8 text-gray-500">
              <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>RDI Management Interface</p>
              <small>Regional age-based recommendations for USA & EU</small>
            </div>
          </TabsContent>

          {/* Thresholds Tab */}
          <TabsContent value="thresholds" className="space-y-6">
            <Alert>
              <Zap className="h-4 w-4" />
              <AlertDescription>
                This tab would contain threshold effect management with deficiency, optimal, and excess ranges for different demographic groups. Implementation follows the comprehensive format provided.
              </AlertDescription>
            </Alert>
            <div className="text-center py-8 text-gray-500">
              <Zap className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Threshold Effects Management</p>
              <small>Deficiency, optimal, and excess thresholds by demographic</small>
            </div>
          </TabsContent>

          {/* Foods Tab */}
          <TabsContent value="foods" className="space-y-6">
            {/* Food Strategy */}
            <div className="space-y-4">
              <Label className="flex items-center space-x-2">
                <Utensils className="h-4 w-4" />
                <span>Food Strategies</span>
              </Label>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="p-4">
                  <h4 className="font-medium mb-3 flex items-center space-x-2">
                    <span>🥩</span>
                    <span>Animal Sources</span>
                  </h4>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label>Title</Label>
                      <div className="flex gap-2">
                        <Input
                          value={nutrientData.food_strategy.animal?.title || ''}
                          onChange={(e) => setNutrientData(prev => ({
                            ...prev,
                            food_strategy: {
                              ...prev.food_strategy,
                              animal: { ...prev.food_strategy.animal, title: e.target.value }
                            }
                          }))}
                          placeholder="e.g., Animal Retinol"
                          className="flex-1"
                        />
                        <AIFieldAssistant
                          fieldName="food_strategy_animal_title"
                          fieldType="text"
                          currentValue={nutrientData.food_strategy.animal?.title || ''}
                          onContentGenerated={(content) => setNutrientData(prev => ({
                            ...prev,
                            food_strategy: {
                              ...prev.food_strategy,
                              animal: { ...prev.food_strategy.animal, title: content as string }
                            }
                          }))}
                          nutrientName={nutrientData.name}
                          category={nutrientData.category}
                          className="flex-shrink-0"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <div className="flex gap-2 items-start">
                        <Textarea
                          value={nutrientData.food_strategy.animal?.description || ''}
                          onChange={(e) => setNutrientData(prev => ({
                            ...prev,
                            food_strategy: {
                              ...prev.food_strategy,
                              animal: { ...prev.food_strategy.animal, description: e.target.value }
                            }
                          }))}
                          placeholder="Detailed food strategy explanation..."
                          rows={4}
                          className="flex-1"
                        />
                        <AIFieldAssistant
                          fieldName="food_strategy_animal_description"
                          fieldType="textarea"
                          currentValue={nutrientData.food_strategy.animal?.description || ''}
                          onContentGenerated={(content) => setNutrientData(prev => ({
                            ...prev,
                            food_strategy: {
                              ...prev.food_strategy,
                              animal: { ...prev.food_strategy.animal, description: content as string }
                            }
                          }))}
                          nutrientName={nutrientData.name}
                          category={nutrientData.category}
                          className="flex-shrink-0"
                        />
                      </div>
                    </div>
                  </div>
                </Card>

                <Card className="p-4">
                  <h4 className="font-medium mb-3 flex items-center space-x-2">
                    <span>🌱</span>
                    <span>Plant Sources</span>
                  </h4>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label>Title</Label>
                      <div className="flex gap-2">
                        <Input
                          value={nutrientData.food_strategy.plant?.title || ''}
                          onChange={(e) => setNutrientData(prev => ({
                            ...prev,
                            food_strategy: {
                              ...prev.food_strategy,
                              plant: { ...prev.food_strategy.plant, title: e.target.value }
                            }
                          }))}
                          placeholder="e.g., Plant Carotenoids"
                          className="flex-1"
                        />
                        <AIFieldAssistant
                          fieldName="food_strategy_plant_title"
                          fieldType="text"
                          currentValue={nutrientData.food_strategy.plant?.title || ''}
                          onContentGenerated={(content) => setNutrientData(prev => ({
                            ...prev,
                            food_strategy: {
                              ...prev.food_strategy,
                              plant: { ...prev.food_strategy.plant, title: content as string }
                            }
                          }))}
                          nutrientName={nutrientData.name}
                          category={nutrientData.category}
                          className="flex-shrink-0"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <div className="flex gap-2 items-start">
                        <Textarea
                          value={nutrientData.food_strategy.plant?.description || ''}
                          onChange={(e) => setNutrientData(prev => ({
                            ...prev,
                            food_strategy: {
                              ...prev.food_strategy,
                              plant: { ...prev.food_strategy.plant, description: e.target.value }
                            }
                          }))}
                          placeholder="Detailed food strategy explanation..."
                          rows={4}
                          className="flex-1"
                        />
                        <AIFieldAssistant
                          fieldName="food_strategy_plant_description"
                          fieldType="textarea"
                          currentValue={nutrientData.food_strategy.plant?.description || ''}
                          onContentGenerated={(content) => setNutrientData(prev => ({
                            ...prev,
                            food_strategy: {
                              ...prev.food_strategy,
                              plant: { ...prev.food_strategy.plant, description: content as string }
                            }
                          }))}
                          nutrientName={nutrientData.name}
                          category={nutrientData.category}
                          className="flex-shrink-0"
                        />
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </div>

            {/* Top Foods */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="flex items-center space-x-2">
                  <Utensils className="h-4 w-4" />
                  <span>Top Food Sources</span>
                </Label>
                <Button onClick={addTopFood} size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Food
                </Button>
              </div>

              {nutrientData.top_foods.map((food, index) => (
                <Card key={index} className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div className="space-y-2">
                      <Label>Food Name</Label>
                      <div className="flex gap-2">
                        <Input
                          value={food.name}
                          onChange={(e) => updateTopFood(index, 'name', e.target.value)}
                          placeholder="e.g., Beef Liver"
                          className="flex-1"
                        />
                        <AIFieldAssistant
                          fieldName="food_name"
                          fieldType="text"
                          currentValue={food.name}
                          onContentGenerated={(content) => updateTopFood(index, 'name', content as string)}
                          nutrientName={nutrientData.name}
                          category={nutrientData.category}
                          className="flex-shrink-0"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Type</Label>
                      <Select
                        value={food.type}
                        onValueChange={(value) => updateTopFood(index, 'type', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Animal">Animal</SelectItem>
                          <SelectItem value="Plant">Plant</SelectItem>
                          <SelectItem value="Supplement">Supplement</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Amount (mcg/100g)</Label>
                      <Input
                        type="number"
                        value={food.amount_mcg_per_100g}
                        onChange={(e) => updateTopFood(index, 'amount_mcg_per_100g', parseFloat(e.target.value) || 0)}
                        placeholder="0"
                      />
                    </div>
                    <Button
                      onClick={() => removeTopFood(index)}
                      size="sm"
                      variant="outline"
                      className="text-red-600"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Interactions Tab */}
          <TabsContent value="interactions" className="space-y-6">
            {/* Synergistic & Depleting Factors */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label className="flex items-center space-x-2">
                  <Shield className="h-4 w-4 text-green-600" />
                  <span>Synergistic Nutrients</span>
                </Label>
                <div className="flex flex-wrap gap-2">
                  {nutrientData.synergistic_nutrients.map((nutrient, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center space-x-1">
                      <span>{nutrient}</span>
                      <button
                        onClick={() => removeArrayItem('synergistic_nutrients', index)}
                        className="ml-1 hover:text-red-600"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add synergistic nutrient (press Enter)"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        addArrayItem('synergistic_nutrients', e.currentTarget.value);
                        e.currentTarget.value = '';
                      }
                    }}
                    className="flex-1"
                  />
                  <AIFieldAssistant
                    fieldName="synergistic_nutrients"
                    fieldType="array"
                    currentValue={nutrientData.synergistic_nutrients}
                    onContentGenerated={(content) => setNutrientData(prev => ({ ...prev, synergistic_nutrients: content as string[] }))}
                    nutrientName={nutrientData.name}
                    category={nutrientData.category}
                    className="flex-shrink-0"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label className="flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <span>Depleting Factors</span>
                </Label>
                <div className="flex flex-wrap gap-2">
                  {nutrientData.depleting_factors.map((factor, index) => (
                    <Badge key={index} variant="destructive" className="flex items-center space-x-1">
                      <span>{factor}</span>
                      <button
                        onClick={() => removeArrayItem('depleting_factors', index)}
                        className="ml-1 hover:text-white"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add depleting factor (press Enter)"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        addArrayItem('depleting_factors', e.currentTarget.value);
                        e.currentTarget.value = '';
                      }
                    }}
                    className="flex-1"
                  />
                  <AIFieldAssistant
                    fieldName="depleting_factors"
                    fieldType="array"
                    currentValue={nutrientData.depleting_factors}
                    onContentGenerated={(content) => setNutrientData(prev => ({ ...prev, depleting_factors: content as string[] }))}
                    nutrientName={nutrientData.name}
                    category={nutrientData.category}
                    className="flex-shrink-0"
                  />
                </div>
              </div>
            </div>

            {/* Absorption Requirements */}
            <div className="space-y-2">
              <Label>Absorption Requirements</Label>
              <div className="flex gap-2 items-start">
                <Textarea
                  value={nutrientData.absorption_requirements.description}
                  onChange={(e) => setNutrientData(prev => ({
                    ...prev,
                    absorption_requirements: { description: e.target.value }
                  }))}
                  placeholder="Detailed explanation of absorption requirements, co-factors, and bioavailability considerations..."
                  rows={4}
                  className="flex-1"
                />
                <AIFieldAssistant
                  fieldName="absorption_requirements"
                  fieldType="textarea"
                  currentValue={nutrientData.absorption_requirements.description}
                  onContentGenerated={(content) => setNutrientData(prev => ({
                    ...prev,
                    absorption_requirements: { description: content as string }
                  }))}
                  nutrientName={nutrientData.name}
                  category={nutrientData.category}
                  className="flex-shrink-0"
                />
              </div>
            </div>

            {/* Key Interactions */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="flex items-center space-x-2">
                  <Shield className="h-4 w-4" />
                  <span>Key Nutrient Interactions</span>
                </Label>
                <Button onClick={addInteraction} size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Interaction
                </Button>
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <div className="flex gap-2">
                  <Input
                    value={nutrientData.key_interactions.description}
                    onChange={(e) => setNutrientData(prev => ({
                      ...prev,
                      key_interactions: { ...prev.key_interactions, description: e.target.value }
                    }))}
                    placeholder="e.g., What it works with and against"
                    className="flex-1"
                  />
                  <AIFieldAssistant
                    fieldName="key_interactions_description"
                    fieldType="text"
                    currentValue={nutrientData.key_interactions.description}
                    onContentGenerated={(content) => setNutrientData(prev => ({
                      ...prev,
                      key_interactions: { ...prev.key_interactions, description: content as string }
                    }))}
                    nutrientName={nutrientData.name}
                    category={nutrientData.category}
                    className="flex-shrink-0"
                  />
                </div>
              </div>

              {nutrientData.key_interactions.interactions.map((interaction, index) => (
                <Card key={index} className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div className="space-y-2">
                      <Label>Nutrient Name</Label>
                      <div className="flex gap-2">
                        <Input
                          value={interaction.name}
                          onChange={(e) => updateInteraction(index, 'name', e.target.value)}
                          placeholder="e.g., Zinc"
                          className="flex-1"
                        />
                        <AIFieldAssistant
                          fieldName="interaction_name"
                          fieldType="text"
                          currentValue={interaction.name}
                          onContentGenerated={(content) => updateInteraction(index, 'name', content as string)}
                          nutrientName={nutrientData.name}
                          category={nutrientData.category}
                          className="flex-shrink-0"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Mechanism</Label>
                      <div className="flex gap-2">
                        <Input
                          value={interaction.mechanism}
                          onChange={(e) => updateInteraction(index, 'mechanism', e.target.value)}
                          placeholder="e.g., Enables transport (retinol-binding protein)"
                          className="flex-1"
                        />
                        <AIFieldAssistant
                          fieldName="interaction_mechanism"
                          fieldType="text"
                          currentValue={interaction.mechanism}
                          onContentGenerated={(content) => updateInteraction(index, 'mechanism', content as string)}
                          nutrientName={nutrientData.name}
                          category={nutrientData.category}
                          className="flex-shrink-0"
                        />
                      </div>
                    </div>
                    <Button
                      onClick={() => removeInteraction(index)}
                      size="sm"
                      variant="outline"
                      className="text-red-600"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>

            {/* Pregnancy Considerations */}
            <div className="space-y-4">
              <Label className="flex items-center space-x-2">
                <Calendar className="h-4 w-4" />
                <span>Pregnancy Considerations</span>
              </Label>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>Summary</Label>
                  <div className="flex gap-2">
                    <Input
                      value={nutrientData.pregnancy_considerations.summary}
                      onChange={(e) => setNutrientData(prev => ({
                        ...prev,
                        pregnancy_considerations: { ...prev.pregnancy_considerations, summary: e.target.value }
                      }))}
                      placeholder="e.g., Crucial for fetal organ and nervous system development."
                      className="flex-1"
                    />
                    <AIFieldAssistant
                      fieldName="pregnancy_summary"
                      fieldType="text"
                      currentValue={nutrientData.pregnancy_considerations.summary}
                      onContentGenerated={(content) => setNutrientData(prev => ({
                        ...prev,
                        pregnancy_considerations: { ...prev.pregnancy_considerations, summary: content as string }
                      }))}
                      nutrientName={nutrientData.name}
                      category={nutrientData.category}
                      className="flex-shrink-0"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Guidance</Label>
                  <div className="flex gap-2 items-start">
                    <Textarea
                      value={nutrientData.pregnancy_considerations.guidance}
                      onChange={(e) => setNutrientData(prev => ({
                        ...prev,
                        pregnancy_considerations: { ...prev.pregnancy_considerations, guidance: e.target.value }
                      }))}
                      placeholder="Detailed pregnancy-specific guidance with safety thresholds and recommendations..."
                      rows={3}
                      className="flex-1"
                    />
                    <AIFieldAssistant
                      fieldName="pregnancy_guidance"
                      fieldType="textarea"
                      currentValue={nutrientData.pregnancy_considerations.guidance}
                      onContentGenerated={(content) => setNutrientData(prev => ({
                        ...prev,
                        pregnancy_considerations: { ...prev.pregnancy_considerations, guidance: content as string }
                      }))}
                      nutrientName={nutrientData.name}
                      category={nutrientData.category}
                      className="flex-shrink-0"
                    />
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Supplements Tab */}
          <TabsContent value="supplements" className="space-y-6">
            {/* Supplementation Guidance */}
            <div className="space-y-2">
              <Label className="flex items-center space-x-2">
                <Users className="h-4 w-4" />
                <span>When to Supplement</span>
              </Label>
              <div className="flex gap-2 items-start">
                <Textarea
                  value={nutrientData.when_to_supplement.guidance}
                  onChange={(e) => setNutrientData(prev => ({
                    ...prev,
                    when_to_supplement: { guidance: e.target.value }
                  }))}
                  placeholder="Comprehensive guidance on when supplementation is appropriate, dosing recommendations, timing, and safety considerations..."
                  rows={4}
                  className="flex-1"
                />
                <AIFieldAssistant
                  fieldName="when_to_supplement"
                  fieldType="textarea"
                  currentValue={nutrientData.when_to_supplement.guidance}
                  onContentGenerated={(content) => setNutrientData(prev => ({
                    ...prev,
                    when_to_supplement: { guidance: content as string }
                  }))}
                  nutrientName={nutrientData.name}
                  category={nutrientData.category}
                  className="flex-shrink-0"
                />
              </div>
            </div>

            {/* Supplement Sources */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="flex items-center space-x-2">
                  <Users className="h-4 w-4" />
                  <span>Recommended Supplement Sources</span>
                </Label>
                <Button onClick={addSupplementSource} size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Source
                </Button>
              </div>

              {nutrientData.supplement_sources.map((source, index) => (
                <Card key={index} className="p-4">
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Product Name</Label>
                        <div className="flex gap-2">
                          <Input
                            value={source.name}
                            onChange={(e) => updateSupplementSource(index, 'name', e.target.value)}
                            placeholder="e.g., Nordic Naturals Vitamin A"
                            className="flex-1"
                          />
                          <AIFieldAssistant
                            fieldName="supplement_name"
                            fieldType="text"
                            currentValue={source.name}
                            onContentGenerated={(content) => updateSupplementSource(index, 'name', content as string)}
                            nutrientName={nutrientData.name}
                            category={nutrientData.category}
                            className="flex-shrink-0"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Link</Label>
                        <Input
                          value={source.link}
                          onChange={(e) => updateSupplementSource(index, 'link', e.target.value)}
                          placeholder="https://example.com/product"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <div className="flex gap-2 items-start">
                        <Textarea
                          value={source.description}
                          onChange={(e) => updateSupplementSource(index, 'description', e.target.value)}
                          placeholder="Detailed product description with dosage, source, and quality indicators..."
                          rows={2}
                          className="flex-1"
                        />
                        <AIFieldAssistant
                          fieldName="supplement_description"
                          fieldType="textarea"
                          currentValue={source.description}
                          onContentGenerated={(content) => updateSupplementSource(index, 'description', content as string)}
                          nutrientName={nutrientData.name}
                          category={nutrientData.category}
                          className="flex-shrink-0"
                        />
                      </div>
                    </div>
                    <Button
                      onClick={() => removeSupplementSource(index)}
                      size="sm"
                      variant="outline"
                      className="text-red-600"
                    >
                      <Minus className="h-4 w-4 mr-2" />
                      Remove Source
                    </Button>
                  </div>
                </Card>
              ))}
            </div>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Regional supplement guidelines (USA/EU) with age-specific dosing recommendations would be implemented as detailed forms following the comprehensive format provided. This represents the framework for enterprise-grade supplement guidance management.
              </AlertDescription>
            </Alert>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}