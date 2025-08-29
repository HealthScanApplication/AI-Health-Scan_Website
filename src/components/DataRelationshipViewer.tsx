import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { 
  Search, 
  Heart, 
  AlertTriangle, 
  Bug, 
  Leaf, 
  Database, 
  Utensils, 
  Camera,
  ArrowRight,
  GitBranch,
  Layers,
  Eye,
  Edit,
  ExternalLink,
  ChevronRight,
  ChevronDown
} from "lucide-react";
import { toast } from "sonner@2.0.3";
import { projectId, publicAnonKey } from "../utils/supabase/info";

interface RelationshipData {
  scans: any[];
  meals: any[];
  products: any[];
  ingredients: any[];
  nutrients: any[];
  pollutants: any[];
  parasites: any[];
}

interface SelectedItem {
  id: string;
  type: string;
  data: any;
  relationships: {
    ingredients?: string[];
    nutrients?: string[];
    pollutants?: string[];
    parasites?: string[];
  };
}

export function DataRelationshipViewer() {
  const [relationshipData, setRelationshipData] = useState<RelationshipData>({
    scans: [],
    meals: [],
    products: [],
    ingredients: [],
    nutrients: [],
    pollutants: [],
    parasites: []
  });
  const [selectedItem, setSelectedItem] = useState<SelectedItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    scans: true,
    meals: true,
    products: true
  });

  // Load relationship data
  useEffect(() => {
    loadRelationshipData();
  }, []);

  const loadRelationshipData = async () => {
    setLoading(true);
    try {
      // Fetch sample data from each data type
      const dataTypes = ['scan', 'meal', 'product', 'ingredient', 'nutrient', 'pollutant', 'parasite'];
      const dataPromises = dataTypes.map(async (dataType) => {
        try {
          const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-557a7646/admin/kv-records`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${publicAnonKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ prefix: `${dataType}_` })
          });

          if (response.ok) {
            const data = await response.json();
            return { type: dataType, records: data.records.slice(0, 10) }; // Get first 10 records
          }
          return { type: dataType, records: [] };
        } catch (error) {
          console.error(`Failed to fetch ${dataType} data:`, error);
          return { type: dataType, records: [] };
        }
      });

      const results = await Promise.all(dataPromises);
      
      const relationshipData: RelationshipData = {
        scans: [],
        meals: [],
        products: [],
        ingredients: [],
        nutrients: [],
        pollutants: [],
        parasites: []
      };

      results.forEach(({ type, records }) => {
        if (type === 'scan') relationshipData.scans = records;
        else if (type === 'meal') relationshipData.meals = records;
        else if (type === 'product') relationshipData.products = records;
        else if (type === 'ingredient') relationshipData.ingredients = records;
        else if (type === 'nutrient') relationshipData.nutrients = records;
        else if (type === 'pollutant') relationshipData.pollutants = records;
        else if (type === 'parasite') relationshipData.parasites = records;
      });

      setRelationshipData(relationshipData);
    } catch (error) {
      console.error('Failed to load relationship data:', error);
      toast.error('Failed to load relationship data');
    } finally {
      setLoading(false);
    }
  };

  // Simulate relationship data for demonstration
  const generateRelationships = (item: any, type: string) => {
    const { ingredients, nutrients, pollutants, parasites } = relationshipData;
    
    // Simulate realistic relationships
    const relationships: any = {};
    
    if (type === 'scan' || type === 'meal' || type === 'product') {
      // These connect to ingredients
      relationships.ingredients = ingredients.slice(0, Math.min(3, ingredients.length)).map(i => i.id);
    }
    
    if (type === 'ingredient') {
      // Ingredients connect to nutrients, pollutants, and parasites
      relationships.nutrients = nutrients.slice(0, Math.min(2, nutrients.length)).map(n => n.id);
      relationships.pollutants = pollutants.slice(0, Math.min(2, pollutants.length)).map(p => p.id);
      relationships.parasites = parasites.slice(0, Math.min(1, parasites.length)).map(p => p.id);
    }
    
    return relationships;
  };

  const handleItemClick = (item: any, type: string) => {
    const relationships = generateRelationships(item, type);
    setSelectedItem({
      id: item.id,
      type,
      data: item,
      relationships
    });
  };

  const getRelatedItems = (ids: string[], dataArray: any[]) => {
    return dataArray.filter(item => ids.includes(item.id));
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const renderDataTypeIcon = (type: string) => {
    const iconMap = {
      scan: Camera,
      meal: Utensils,
      product: Database,
      ingredient: Leaf,
      nutrient: Heart,
      pollutant: AlertTriangle,
      parasite: Bug
    };
    const Icon = iconMap[type as keyof typeof iconMap] || Database;
    return <Icon className="w-4 h-4" />;
  };

  const getDataTypeColor = (type: string) => {
    const colorMap = {
      scan: 'text-indigo-600 bg-indigo-50 border-indigo-200',
      meal: 'text-orange-600 bg-orange-50 border-orange-200',
      product: 'text-yellow-600 bg-yellow-50 border-yellow-200',
      ingredient: 'text-blue-600 bg-blue-50 border-blue-200',
      nutrient: 'text-green-600 bg-green-50 border-green-200',
      pollutant: 'text-red-600 bg-red-50 border-red-200',
      parasite: 'text-purple-600 bg-purple-50 border-purple-200'
    };
    return colorMap[type as keyof typeof colorMap] || 'text-gray-600 bg-gray-50 border-gray-200';
  };

  const renderItemCard = (item: any, type: string, size: 'small' | 'medium' | 'large' = 'medium') => {
    const isSelected = selectedItem?.id === item.id;
    const colorClass = getDataTypeColor(type);
    
    return (
      <Card 
        key={item.id} 
        className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
          isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : ''
        } ${size === 'small' ? 'p-2' : size === 'large' ? 'p-4' : 'p-3'}`}
        onClick={() => handleItemClick(item, type)}
      >
        <div className="flex items-center space-x-2">
          <div className={`p-1 rounded ${colorClass}`}>
            {renderDataTypeIcon(type)}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className={`font-medium truncate ${size === 'small' ? 'text-sm' : 'text-base'}`}>
              {item.name || `${type} ${item.id?.split('_')[1] || ''}`}
            </h4>
            {size !== 'small' && (
              <p className="text-xs text-gray-500 truncate">
                {item.description || item.category || `Sample ${type} data`}
              </p>
            )}
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </div>
      </Card>
    );
  };

  const renderRelationshipDiagram = () => {
    if (!selectedItem) {
      return (
        <Card className="h-96 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <GitBranch className="w-8 h-8 mx-auto mb-2" />
            <p>Select a scan, meal, or product to view its relationships</p>
          </div>
        </Card>
      );
    }

    const { type, data, relationships } = selectedItem;

    return (
      <Card className="p-6">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center space-x-2">
            <div className={`p-2 rounded ${getDataTypeColor(type)}`}>
              {renderDataTypeIcon(type)}
            </div>
            <span>Relationship Diagram: {data.name || `${type} ${data.id?.split('_')[1] || ''}`}</span>
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-6">
            {/* Root Item */}
            <div className="flex justify-center">
              <div className={`p-4 rounded-lg border-2 ${getDataTypeColor(type)} max-w-xs`}>
                <div className="text-center">
                  <div className="flex justify-center mb-2">
                    {renderDataTypeIcon(type)}
                  </div>
                  <h3 className="font-bold">{type.toUpperCase()}</h3>
                  <p className="text-sm font-medium">{data.name || `${type} ${data.id?.split('_')[1] || ''}`}</p>
                  {data.description && (
                    <p className="text-xs mt-1 opacity-75">{data.description.substring(0, 50)}...</p>
                  )}
                </div>
              </div>
            </div>

            {/* Arrow Down */}
            {relationships.ingredients && relationships.ingredients.length > 0 && (
              <div className="flex justify-center">
                <ArrowRight className="w-6 h-6 text-gray-400 transform rotate-90" />
              </div>
            )}

            {/* Ingredients Level */}
            {relationships.ingredients && relationships.ingredients.length > 0 && (
              <div>
                <h4 className="text-center font-medium text-gray-700 mb-3">Connected Ingredients</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {getRelatedItems(relationships.ingredients, relationshipData.ingredients).map((ingredient) => (
                    <div key={ingredient.id} className="space-y-3">
                      <div className={`p-3 rounded-lg border ${getDataTypeColor('ingredient')}`}>
                        <div className="text-center">
                          <div className="flex justify-center mb-2">
                            <Leaf className="w-5 h-5" />
                          </div>
                          <h5 className="font-medium">{ingredient.name}</h5>
                          <p className="text-xs opacity-75">{ingredient.category || 'Food Ingredient'}</p>
                        </div>
                      </div>

                      {/* Nutrients, Pollutants, Parasites for this ingredient */}
                      <div className="space-y-2">
                        {/* Nutrients */}
                        {generateRelationships(ingredient, 'ingredient').nutrients?.slice(0, 2).map((nutrientId: string) => {
                          const nutrient = relationshipData.nutrients.find(n => n.id === nutrientId);
                          return nutrient ? (
                            <div key={nutrient.id} className={`p-2 rounded text-center text-xs ${getDataTypeColor('nutrient')}`}>
                              <Heart className="w-3 h-3 mx-auto mb-1" />
                              <div className="font-medium">{nutrient.name}</div>
                            </div>
                          ) : null;
                        })}

                        {/* Pollutants */}
                        {generateRelationships(ingredient, 'ingredient').pollutants?.slice(0, 1).map((pollutantId: string) => {
                          const pollutant = relationshipData.pollutants.find(p => p.id === pollutantId);
                          return pollutant ? (
                            <div key={pollutant.id} className={`p-2 rounded text-center text-xs ${getDataTypeColor('pollutant')}`}>
                              <AlertTriangle className="w-3 h-3 mx-auto mb-1" />
                              <div className="font-medium">{pollutant.name}</div>
                            </div>
                          ) : null;
                        })}

                        {/* Parasites */}
                        {generateRelationships(ingredient, 'ingredient').parasites?.slice(0, 1).map((parasiteId: string) => {
                          const parasite = relationshipData.parasites.find(p => p.id === parasiteId);
                          return parasite ? (
                            <div key={parasite.id} className={`p-2 rounded text-center text-xs ${getDataTypeColor('parasite')}`}>
                              <Bug className="w-3 h-3 mx-auto mb-1" />
                              <div className="font-medium">{parasite.name}</div>
                            </div>
                          ) : null;
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Legend */}
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Data Type Legend</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                <div className="flex items-center space-x-2">
                  <Heart className="w-4 h-4 text-green-600" />
                  <span>Nutrients</span>
                </div>
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  <span>Pollutants</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Bug className="w-4 h-4 text-purple-600" />
                  <span>Parasites</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Leaf className="w-4 h-4 text-blue-600" />
                  <span>Ingredients</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <GitBranch className="w-8 h-8 animate-pulse text-gray-400 mx-auto mb-2" />
          <p className="text-gray-600">Loading relationship data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Data Relationship Explorer</h2>
        <p className="text-gray-600">
          Explore how scans, meals, and products connect to ingredients, and how ingredients link to nutrients, pollutants, and parasites
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel - Data Selection */}
        <div className="lg:col-span-1 space-y-4">
          {/* Scans */}
          <Card>
            <CardHeader 
              className="cursor-pointer"
              onClick={() => toggleSection('scans')}
            >
              <CardTitle className="flex items-center justify-between text-lg">
                <div className="flex items-center space-x-2">
                  <Camera className="w-5 h-5 text-indigo-600" />
                  <span>Scans ({relationshipData.scans.length})</span>
                </div>
                {expandedSections.scans ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </CardTitle>
            </CardHeader>
            {expandedSections.scans && (
              <CardContent className="space-y-2">
                {relationshipData.scans.slice(0, 5).map(scan => 
                  renderItemCard(scan, 'scan', 'small')
                )}
                {relationshipData.scans.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">No scans available</p>
                )}
              </CardContent>
            )}
          </Card>

          {/* Meals */}
          <Card>
            <CardHeader 
              className="cursor-pointer"
              onClick={() => toggleSection('meals')}
            >
              <CardTitle className="flex items-center justify-between text-lg">
                <div className="flex items-center space-x-2">
                  <Utensils className="w-5 h-5 text-orange-600" />
                  <span>Meals ({relationshipData.meals.length})</span>
                </div>
                {expandedSections.meals ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </CardTitle>
            </CardHeader>
            {expandedSections.meals && (
              <CardContent className="space-y-2">
                {relationshipData.meals.slice(0, 5).map(meal => 
                  renderItemCard(meal, 'meal', 'small')
                )}
                {relationshipData.meals.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">No meals available</p>
                )}
              </CardContent>
            )}
          </Card>

          {/* Products */}
          <Card>
            <CardHeader 
              className="cursor-pointer"
              onClick={() => toggleSection('products')}
            >
              <CardTitle className="flex items-center justify-between text-lg">
                <div className="flex items-center space-x-2">
                  <Database className="w-5 h-5 text-yellow-600" />
                  <span>Products ({relationshipData.products.length})</span>
                </div>
                {expandedSections.products ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </CardTitle>
            </CardHeader>
            {expandedSections.products && (
              <CardContent className="space-y-2">
                {relationshipData.products.slice(0, 5).map(product => 
                  renderItemCard(product, 'product', 'small')
                )}
                {relationshipData.products.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">No products available</p>
                )}
              </CardContent>
            )}
          </Card>
        </div>

        {/* Right Panel - Relationship Diagram */}
        <div className="lg:col-span-2">
          {renderRelationshipDiagram()}
        </div>
      </div>

      {/* Data Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Layers className="w-5 h-5 text-blue-600" />
            <span>Database Summary</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 text-center">
            {Object.entries(relationshipData).map(([key, data]) => (
              <div key={key} className="space-y-2">
                <div className={`p-3 rounded-lg ${getDataTypeColor(key.slice(0, -1))}`}>
                  {renderDataTypeIcon(key.slice(0, -1))}
                </div>
                <div>
                  <div className="font-bold text-lg">{data.length}</div>
                  <div className="text-sm text-gray-600 capitalize">{key}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}