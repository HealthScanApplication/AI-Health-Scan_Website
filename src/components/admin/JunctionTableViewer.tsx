/**
 * Junction Table Viewer Component
 * ================================
 * Displays all related records for an entity via junction tables
 * Shows images and key info for each related record
 */

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Loader2, Package, TestTube, Pill, ChefHat, Utensils, Apple, AlertTriangle, Activity } from 'lucide-react';
import {
  getIngredientElements,
  getIngredientsForElement,
  getRecipeIngredients,
  getRecipesForIngredient,
  getElementHSCoverage,
  getSupplementsForElement,
  getTestsForElement,
  getProductsForElement,
  getCookingMethodElements,
  getSymptomElements,
  getActivityElements,
} from '../../utils/junctionTableHelpers';

interface JunctionTableViewerProps {
  entityType: 'element' | 'ingredient' | 'recipe' | 'product' | 'supplement' | 'test' | 'cooking_method' | 'symptom' | 'activity';
  entityId: string;
  entityName?: string;
}

interface RelatedItem {
  id: string;
  name: string;
  image_url?: string;
  category?: string;
  amount?: number;
  unit?: string;
  relationship?: string;
  severity?: string;
  is_primary?: boolean;
}

interface JunctionData {
  ingredients: RelatedItem[];
  recipes: RelatedItem[];
  elements: RelatedItem[];
  supplements: RelatedItem[];
  tests: RelatedItem[];
  products: RelatedItem[];
  cooking_methods: RelatedItem[];
  symptoms: RelatedItem[];
  activities: RelatedItem[];
}

export function JunctionTableViewer({ entityType, entityId, entityName }: JunctionTableViewerProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<JunctionData>({
    ingredients: [],
    recipes: [],
    elements: [],
    supplements: [],
    tests: [],
    products: [],
    cooking_methods: [],
    symptoms: [],
    activities: [],
  });

  useEffect(() => {
    loadJunctionData();
  }, [entityType, entityId]);

  async function loadJunctionData() {
    setLoading(true);
    try {
      const newData: JunctionData = {
        ingredients: [],
        recipes: [],
        elements: [],
        supplements: [],
        tests: [],
        products: [],
        cooking_methods: [],
        symptoms: [],
        activities: [],
      };

      // Load data based on entity type
      switch (entityType) {
        case 'element':
          await loadElementJunctions(entityId, newData);
          break;
        case 'ingredient':
          await loadIngredientJunctions(entityId, newData);
          break;
        case 'recipe':
          await loadRecipeJunctions(entityId, newData);
          break;
        case 'cooking_method':
          await loadCookingMethodJunctions(entityId, newData);
          break;
        case 'symptom':
          await loadSymptomJunctions(entityId, newData);
          break;
        case 'activity':
          await loadActivityJunctions(entityId, newData);
          break;
      }

      setData(newData);
    } catch (error) {
      console.error('Failed to load junction data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadElementJunctions(elementId: string, data: JunctionData) {
    try {
      // Get ingredients containing this element
      const ingredientLinks = await getIngredientsForElement(elementId);
      data.ingredients = ingredientLinks.map((link: any) => ({
        id: link.catalog_ingredients?.id || link.ingredient_id,
        name: link.catalog_ingredients?.name_common || 'Unknown',
        image_url: link.catalog_ingredients?.image_url,
        category: link.catalog_ingredients?.category,
        amount: link.amount_per_100g,
        unit: link.unit_per_100g,
        is_primary: link.is_primary,
      }));

      // Get HS coverage (supplements, tests, products)
      const coverage = await getElementHSCoverage(elementId);
      
      data.supplements = coverage.supplements.map((item: any) => ({
        id: item.hs_item_id,
        name: item.hs_item_name,
        image_url: item.hs_item_image,
        category: item.hs_item_category,
        is_primary: item.is_primary_for_element,
      }));

      data.tests = coverage.tests.map((item: any) => ({
        id: item.hs_item_id,
        name: item.hs_item_name,
        image_url: item.hs_item_image,
        category: item.hs_item_category,
        is_primary: item.is_primary_for_element,
      }));

      data.products = coverage.products.map((item: any) => ({
        id: item.hs_item_id,
        name: item.hs_item_name,
        image_url: item.hs_item_image,
        category: item.hs_item_category,
        is_primary: item.is_primary_for_element,
      }));
    } catch (error) {
      console.error('Error loading element junctions:', error);
    }
  }

  async function loadIngredientJunctions(ingredientId: string, data: JunctionData) {
    try {
      // Get elements in this ingredient
      const elementLinks = await getIngredientElements(ingredientId);
      data.elements = elementLinks.map((link: any) => ({
        id: link.element?.id || link.element_id,
        name: link.element?.name_common || 'Unknown',
        image_url: link.element?.image_url,
        category: link.element?.category,
        amount: link.amount_per_100g,
        unit: link.amount_unit || link.unit_per_100g,
        is_primary: link.is_primary,
      }));

      // Get recipes using this ingredient
      const recipeLinks = await getRecipesForIngredient(ingredientId);
      data.recipes = recipeLinks.map((link: any) => ({
        id: link.catalog_recipes?.id || link.recipe_id,
        name: link.catalog_recipes?.name_common || 'Unknown',
        image_url: link.catalog_recipes?.image_url,
        category: link.catalog_recipes?.category,
        amount: link.qty_g,
        unit: link.unit || 'g',
      }));
    } catch (error) {
      console.error('Error loading ingredient junctions:', error);
    }
  }

  async function loadRecipeJunctions(recipeId: string, data: JunctionData) {
    try {
      // Get ingredients in this recipe
      const ingredientLinks = await getRecipeIngredients(recipeId);
      data.ingredients = ingredientLinks.map((link: any) => ({
        id: link.ingredient?.id || link.ingredient_id,
        name: link.ingredient?.name_common || 'Unknown',
        image_url: link.ingredient?.image_url,
        category: link.ingredient?.category,
        amount: link.qty_g,
        unit: link.unit || 'g',
      }));
    } catch (error) {
      console.error('Error loading recipe junctions:', error);
    }
  }

  async function loadCookingMethodJunctions(cookingMethodId: string, data: JunctionData) {
    try {
      // Get hazardous elements
      const hazardousLinks = await getCookingMethodElements(cookingMethodId, 'hazardous');
      const beneficialLinks = await getCookingMethodElements(cookingMethodId, 'beneficial');
      
      data.elements = [
        ...hazardousLinks.map((link: any) => ({
          id: link.element?.id || link.element_id,
          name: link.element?.name_common || 'Unknown',
          image_url: link.element?.image_url,
          category: link.element?.category,
          relationship: 'hazardous',
          severity: link.severity,
        })),
        ...beneficialLinks.map((link: any) => ({
          id: link.element?.id || link.element_id,
          name: link.element?.name_common || 'Unknown',
          image_url: link.element?.image_url,
          category: link.element?.category,
          relationship: 'beneficial',
          severity: link.severity,
        })),
      ];
    } catch (error) {
      console.error('Error loading cooking method junctions:', error);
    }
  }

  async function loadSymptomJunctions(symptomId: string, data: JunctionData) {
    try {
      const elementLinks = await getSymptomElements(symptomId);
      data.elements = elementLinks.map((link: any) => ({
        id: link.element?.id || link.element_id,
        name: link.element?.name_common || 'Unknown',
        image_url: link.element?.image_url,
        category: link.element?.category,
        relationship: link.relationship,
        severity: link.severity,
      }));
    } catch (error) {
      console.error('Error loading symptom junctions:', error);
    }
  }

  async function loadActivityJunctions(activityId: string, data: JunctionData) {
    try {
      const elementLinks = await getActivityElements(activityId);
      data.elements = elementLinks.map((link: any) => ({
        id: link.element?.id || link.element_id,
        name: link.element?.name_common || 'Unknown',
        image_url: link.element?.image_url,
        category: link.element?.category,
        relationship: link.relationship,
      }));
    } catch (error) {
      console.error('Error loading activity junctions:', error);
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-500">Loading related records...</span>
        </CardContent>
      </Card>
    );
  }

  const tabs = [
    { key: 'elements', label: 'Elements', icon: Apple, data: data.elements },
    { key: 'ingredients', label: 'Ingredients', icon: Apple, data: data.ingredients },
    { key: 'recipes', label: 'Recipes', icon: Utensils, data: data.recipes },
    { key: 'supplements', label: 'Supplements', icon: Pill, data: data.supplements },
    { key: 'tests', label: 'Tests', icon: TestTube, data: data.tests },
    { key: 'products', label: 'Products', icon: Package, data: data.products },
    { key: 'cooking_methods', label: 'Cooking Methods', icon: ChefHat, data: data.cooking_methods },
    { key: 'symptoms', label: 'Symptoms', icon: AlertTriangle, data: data.symptoms },
    { key: 'activities', label: 'Activities', icon: Activity, data: data.activities },
  ].filter(tab => tab.data.length > 0);

  if (tabs.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-gray-500">
          No related records found
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Related Records via Junction Tables</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={tabs[0].key}>
          <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${tabs.length}, 1fr)` }}>
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <TabsTrigger key={tab.key} value={tab.key} className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  {tab.label}
                  <Badge variant="secondary" className="ml-1">
                    {tab.data.length}
                  </Badge>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {tabs.map(tab => (
            <TabsContent key={tab.key} value={tab.key} className="mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tab.data.map(item => (
                  <RelatedItemCard key={item.id} item={item} />
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}

function RelatedItemCard({ item }: { item: RelatedItem }) {
  const getCategoryColor = (category?: string) => {
    const colors: Record<string, string> = {
      'Macronutrient': 'bg-blue-100 text-blue-800',
      'Vitamin': 'bg-green-100 text-green-800',
      'Mineral': 'bg-purple-100 text-purple-800',
      'Hazardous Element': 'bg-red-100 text-red-800',
      'Protein': 'bg-blue-100 text-blue-800',
      'Vegetable': 'bg-green-100 text-green-800',
      'Fruit': 'bg-orange-100 text-orange-800',
      'Meat': 'bg-red-100 text-red-800',
    };
    return colors[category || ''] || 'bg-gray-100 text-gray-800';
  };

  const getRelationshipBadge = (relationship?: string, severity?: string) => {
    if (!relationship) return null;
    
    const colors: Record<string, string> = {
      'hazardous': 'bg-red-100 text-red-800',
      'beneficial': 'bg-green-100 text-green-800',
      'deficiency': 'bg-orange-100 text-orange-800',
      'excess': 'bg-red-100 text-red-800',
      'depletes': 'bg-yellow-100 text-yellow-800',
    };

    return (
      <div className="flex gap-1">
        <Badge className={colors[relationship] || 'bg-gray-100 text-gray-800'}>
          {relationship}
        </Badge>
        {severity && (
          <Badge variant="outline" className="text-xs">
            {severity}
          </Badge>
        )}
      </div>
    );
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="aspect-video bg-gray-100 relative">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x200?text=No+Image';
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <Apple className="h-12 w-12" />
          </div>
        )}
        {item.is_primary && (
          <Badge className="absolute top-2 right-2 bg-yellow-500 text-white">
            Primary
          </Badge>
        )}
      </div>
      <CardContent className="p-4">
        <h4 className="font-semibold text-sm mb-2 line-clamp-2">{item.name}</h4>
        
        <div className="flex flex-wrap gap-2 mb-2">
          {item.category && (
            <Badge className={getCategoryColor(item.category)}>
              {item.category}
            </Badge>
          )}
          {getRelationshipBadge(item.relationship, item.severity)}
        </div>

        {item.amount !== undefined && (
          <div className="text-sm text-gray-600 mt-2">
            <span className="font-medium">{item.amount.toFixed(1)}</span>
            <span className="ml-1">{item.unit}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
