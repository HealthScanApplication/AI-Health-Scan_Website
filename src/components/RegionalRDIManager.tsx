import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import {
  Globe,
  Search,
  Download,
  Upload,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Info,
  Target,
  Calendar,
  Baby,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface RegionalRDI {
  deficient_max: number;
  optimal_min: number;
  optimal_max: number;
  excess_min: number | null;
}

interface NutrientRDI {
  id: string;
  name: string;
  vitamin_name: string;
  category: string;
  unit: string;
  regional_rdi: {
    [region: string]: {
      [ageGroup: string]: RegionalRDI;
    };
  };
  has_complete_data?: boolean;
}

const AGE_GROUPS = [
  { key: 'infants_0_6m', label: 'Infants (0-6 months)', icon: '👶', color: 'bg-pink-50 text-pink-700' },
  { key: 'infants_6_12m', label: 'Infants (6-12 months)', icon: '🍼', color: 'bg-pink-50 text-pink-700' },
  { key: 'toddlers_1_3y', label: 'Toddlers (1-3 years)', icon: '🧒', color: 'bg-purple-50 text-purple-700' },
  { key: 'children_4_8y', label: 'Children (4-8 years)', icon: '👧', color: 'bg-blue-50 text-blue-700' },
  { key: 'children_9_13y', label: 'Children (9-13 years)', icon: '🧑', color: 'bg-blue-50 text-blue-700' },
  { key: 'adolescents_14_18y', label: 'Adolescents (14-18 years)', icon: '👦', color: 'bg-indigo-50 text-indigo-700' },
  { key: 'adults_19_30y', label: 'Adults (19-30 years)', icon: '👨', color: 'bg-green-50 text-green-700' },
  { key: 'adults_31_50y', label: 'Adults (31-50 years)', icon: '👩', color: 'bg-green-50 text-green-700' },
  { key: 'adults_51_70y', label: 'Adults (51-70 years)', icon: '🧓', color: 'bg-orange-50 text-orange-700' },
  { key: 'adults_70plus', label: 'Adults (70+ years)', icon: '👴', color: 'bg-orange-50 text-orange-700' },
  { key: 'pregnant', label: 'Pregnant Women', icon: '🤱', color: 'bg-rose-50 text-rose-700' },
  { key: 'lactating', label: 'Lactating Women', icon: '🤱', color: 'bg-rose-50 text-rose-700' }
];

export function RegionalRDIManager() {
  const [nutrients, setNutrients] = useState<NutrientRDI[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<'EU' | 'USA'>('USA');
  const [selectedNutrient, setSelectedNutrient] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadNutrients();
  }, []);

  const loadNutrients = async () => {
    setLoading(true);
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-ed0fe4c2/admin/nutrients`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        const processedNutrients = data.nutrients.map((nutrient: any) => ({
          ...nutrient,
          has_complete_data: hasCompleteRegionalData(nutrient.regional_rdi || {})
        }));
        
        setNutrients(processedNutrients);
        toast.success(`✅ Loaded ${processedNutrients.length} nutrients`);
      } else {
        throw new Error('Failed to load nutrients');
      }
    } catch (error) {
      console.error('Failed to load nutrients:', error);
      toast.error('❌ Failed to load nutrients');
    } finally {
      setLoading(false);
    }
  };

  const hasCompleteRegionalData = (regionalRDI: any): boolean => {
    const regions = ['EU', 'USA'];
    const requiredAgeGroups = AGE_GROUPS.map(ag => ag.key);
    
    for (const region of regions) {
      if (!regionalRDI[region]) return false;
      for (const ageGroup of requiredAgeGroups) {
        const data = regionalRDI[region][ageGroup];
        if (!data || !data.deficient_max || !data.optimal_min || !data.optimal_max) {
          return false;
        }
      }
    }
    return true;
  };

  const populateAllNutrientsWithRDI = async () => {
    setSaving(true);
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-ed0fe4c2/admin/populate-datatype`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          dataType: 'nutrients',
          targetCount: 100,
          includeImages: true,
          includeMetadata: true,
          includeRegionalRDI: true
        })
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(`✅ Successfully populated nutrients with regional RDI data!`);
        await loadNutrients(); // Reload to see updated data
      } else {
        throw new Error('Failed to populate nutrients');
      }
    } catch (error) {
      console.error('Failed to populate nutrients:', error);
      toast.error('❌ Failed to populate nutrients with RDI data');
    } finally {
      setSaving(false);
    }
  };

  const exportRDIData = async () => {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-ed0fe4c2/admin/export-datatype`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          dataType: 'nutrients',
          format: 'csv'
        })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `nutrients-regional-rdi-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        toast.success('✅ Regional RDI data exported successfully!');
      } else {
        throw new Error('Failed to export data');
      }
    } catch (error) {
      console.error('Failed to export RDI data:', error);
      toast.error('❌ Failed to export RDI data');
    }
  };

  const filteredNutrients = nutrients.filter(nutrient =>
    nutrient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    nutrient.vitamin_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    nutrient.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const completeNutrients = filteredNutrients.filter(n => n.has_complete_data);
  const incompleteNutrients = filteredNutrients.filter(n => !n.has_complete_data);

  const renderNutrientCard = (nutrient: NutrientRDI) => {
    const hasRegionalData = nutrient.regional_rdi && Object.keys(nutrient.regional_rdi).length > 0;
    const regionData = nutrient.regional_rdi?.[selectedRegion];
    const adultData = regionData?.['adults_19_30y'];

    return (
      <Card key={nutrient.id} className={`cursor-pointer transition-all hover:shadow-md ${
        selectedNutrient === nutrient.id ? 'ring-2 ring-blue-500' : ''
      }`} onClick={() => setSelectedNutrient(selectedNutrient === nutrient.id ? null : nutrient.id)}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">{nutrient.vitamin_name || nutrient.name}</CardTitle>
              <p className="text-sm text-gray-600">{nutrient.category}</p>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant={hasRegionalData ? "default" : "secondary"}>
                {hasRegionalData ? `${Object.keys(nutrient.regional_rdi).length} regions` : 'No data'}
              </Badge>
              {nutrient.has_complete_data ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-orange-600" />
              )}
            </div>
          </div>
        </CardHeader>
        
        {selectedNutrient === nutrient.id && (
          <CardContent className="border-t">
            <div className="space-y-4 pt-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-900">
                  Regional Data for {selectedRegion} - Adults (19-30y)
                </h4>
                <Badge variant="outline">{nutrient.unit}/day</Badge>
              </div>
              
              {adultData ? (
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-red-50 p-3 rounded-lg text-center">
                    <div className="text-red-600 font-medium text-sm">Deficient</div>
                    <div className="text-red-800 font-bold text-lg">≤ {adultData.deficient_max}</div>
                    <div className="text-red-600 text-xs">{nutrient.unit}/day</div>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg text-center">
                    <div className="text-green-600 font-medium text-sm">Optimal</div>
                    <div className="text-green-800 font-bold text-lg">
                      {adultData.optimal_min} to {adultData.optimal_max}
                    </div>
                    <div className="text-green-600 text-xs">{nutrient.unit}/day</div>
                  </div>
                  <div className="bg-orange-50 p-3 rounded-lg text-center">
                    <div className="text-orange-600 font-medium text-sm">Excess</div>
                    <div className="text-orange-800 font-bold text-lg">
                      ≥ {adultData.excess_min || 'No limit'}
                    </div>
                    <div className="text-orange-600 text-xs">{nutrient.unit}/day</div>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 p-4 rounded-lg text-center">
                  <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600">No regional data available for {selectedRegion}</p>
                </div>
              )}
            </div>
          </CardContent>
        )}
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading regional RDI data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-50 rounded-lg">
            <Globe className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Regional RDI Manager</h1>
            <p className="text-gray-600">
              Manage deficient, optimal, and excess ranges for EU & USA across all age groups
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button
            onClick={populateAllNutrientsWithRDI}
            disabled={saving}
            className="bg-green-600 hover:bg-green-700"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Upload className="w-4 h-4 mr-2" />
            )}
            Populate All RDI Data
          </Button>
          <Button variant="outline" onClick={exportRDIData}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button variant="outline" onClick={loadNutrients}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Target className="w-8 h-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{nutrients.length}</p>
                <p className="text-gray-600">Total Nutrients</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{completeNutrients.length}</p>
                <p className="text-gray-600">Complete RDI Data</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <AlertCircle className="w-8 h-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{incompleteNutrients.length}</p>
                <p className="text-gray-600">Missing RDI Data</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Globe className="w-8 h-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">2</p>
                <p className="text-gray-600">Regions (EU, USA)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search nutrients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <div className="flex space-x-2">
          <Button
            variant={selectedRegion === 'USA' ? 'default' : 'outline'}
            onClick={() => setSelectedRegion('USA')}
            size="sm"
          >
            🇺🇸 USA
          </Button>
          <Button
            variant={selectedRegion === 'EU' ? 'default' : 'outline'}
            onClick={() => setSelectedRegion('EU')}
            size="sm"
          >
            🇪🇺 EU
          </Button>
        </div>
      </div>

      {/* Age Groups Reference */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-indigo-600" />
            <span>Age Groups Reference</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
            {AGE_GROUPS.map(group => (
              <div key={group.key} className={`p-3 rounded-lg border ${group.color}`}>
                <div className="text-center">
                  <div className="text-lg mb-1">{group.icon}</div>
                  <div className="font-medium text-xs">{group.label}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Nutrient Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">
            Overview ({filteredNutrients.length})
          </TabsTrigger>
          <TabsTrigger value="complete">
            Complete Data ({completeNutrients.length})
          </TabsTrigger>
          <TabsTrigger value="incomplete">
            Missing Data ({incompleteNutrients.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <Alert className="mb-6">
            <Info className="h-4 w-4" />
            <AlertDescription>
              Click on any nutrient card to view detailed RDI ranges for {selectedRegion}. 
              Green checkmarks indicate complete regional data for all age groups.
            </AlertDescription>
          </Alert>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredNutrients.map(renderNutrientCard)}
          </div>
        </TabsContent>

        <TabsContent value="complete" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {completeNutrients.map(renderNutrientCard)}
          </div>
        </TabsContent>

        <TabsContent value="incomplete" className="mt-6">
          <Alert className="mb-6 border-orange-200 bg-orange-50">
            <AlertCircle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              These nutrients are missing complete regional RDI data. Use the "Populate All RDI Data" button 
              to automatically fill in missing values with scientific defaults.
            </AlertDescription>
          </Alert>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {incompleteNutrients.map(renderNutrientCard)}
          </div>
        </TabsContent>
      </Tabs>

      {filteredNutrients.length === 0 && searchTerm && (
        <div className="text-center py-12">
          <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No nutrients found matching "{searchTerm}"</p>
        </div>
      )}
    </div>
  );
}