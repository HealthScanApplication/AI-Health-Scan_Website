"use client";

import { useState } from "react";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { 
  Search,
  AlertTriangle,
  CheckCircle,
  Info,
  Zap,
  ChevronDown,
  ChevronUp,
  Microscope
} from "lucide-react";

interface Ingredient {
  name: string;
  status: 'safe' | 'caution' | 'avoid';
  description: string;
  effects: string[];
  alternatives?: string[];
}

const ingredientExamples: Ingredient[] = [
  {
    name: 'Aspartame (E951)',
    status: 'caution',
    description: 'Artificial sweetener that may cause headaches in sensitive individuals',
    effects: ['May trigger migraines', 'Possible mood changes', 'Sweet taste without calories'],
    alternatives: ['Stevia', 'Monk fruit extract', 'Erythritol']
  },
  {
    name: 'Organic Quinoa',
    status: 'safe',
    description: 'Complete protein source with all essential amino acids',
    effects: ['High in protein', 'Rich in fiber', 'Contains iron and magnesium'],
    alternatives: []
  },
  {
    name: 'Yellow #5 (Tartrazine)',
    status: 'avoid',
    description: 'Artificial food coloring linked to hyperactivity in children',
    effects: ['May increase hyperactivity', 'Possible allergic reactions', 'No nutritional value'],
    alternatives: ['Turmeric', 'Beta-carotene', 'Annatto extract']
  },
  {
    name: 'Probiotics (L. acidophilus)',
    status: 'safe',
    description: 'Beneficial bacteria that support digestive health',
    effects: ['Improves gut health', 'Boosts immune system', 'Aids digestion'],
    alternatives: []
  },
  {
    name: 'High Fructose Corn Syrup',
    status: 'avoid',
    description: 'Processed sweetener linked to obesity and metabolic issues',
    effects: ['Rapid blood sugar spikes', 'May contribute to weight gain', 'Linked to inflammation'],
    alternatives: ['Raw honey', 'Maple syrup', 'Coconut sugar']
  }
];

export function IngredientAnalysis() {
  const [expandedIngredient, setExpandedIngredient] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'safe' | 'caution' | 'avoid'>('all');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'safe': return 'bg-green-100 text-green-800 border-green-200';
      case 'caution': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'avoid': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'safe': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'caution': return <Info className="w-4 h-4 text-yellow-600" />;
      case 'avoid': return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default: return <Info className="w-4 h-4 text-gray-600" />;
    }
  };

  const filteredIngredients = selectedCategory === 'all' 
    ? ingredientExamples 
    : ingredientExamples.filter(ing => ing.status === selectedCategory);

  const statusCounts = {
    safe: ingredientExamples.filter(ing => ing.status === 'safe').length,
    caution: ingredientExamples.filter(ing => ing.status === 'caution').length,
    avoid: ingredientExamples.filter(ing => ing.status === 'avoid').length
  };

  return (
    <section className="py-20 px-4 bg-gradient-to-tr from-gray-50 to-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            AI-Powered Ingredient Analysis
          </h2>
          <p className="text-xl text-[var(--healthscan-text-muted)] max-w-3xl mx-auto mb-8">
            Don't just read ingredient lists—understand them. Our AI analyzes every component 
            and explains what it means for your health in simple terms.
          </p>
          <div className="flex justify-center items-center gap-6 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Microscope className="w-4 h-4 text-[var(--healthscan-green)]" />
              <span>Detailed ingredient breakdown</span>
            </div>
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-[var(--healthscan-green)]" />
              <span>Health impact analysis</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-[var(--healthscan-green)]" />
              <span>Personalized alternatives</span>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Analysis Summary */}
          <div className="lg:col-span-1">
            <Card className="p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Analysis Summary</h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800">Safe Ingredients</span>
                  </div>
                  <Badge className="bg-green-100 text-green-800">{statusCounts.safe}</Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Info className="w-4 h-4 text-yellow-600" />
                    <span className="text-sm font-medium text-yellow-800">Use Caution</span>
                  </div>
                  <Badge className="bg-yellow-100 text-yellow-800">{statusCounts.caution}</Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    <span className="text-sm font-medium text-red-800">Consider Avoiding</span>
                  </div>
                  <Badge className="bg-red-100 text-red-800">{statusCounts.avoid}</Badge>
                </div>
              </div>
            </Card>

            {/* Filter Buttons */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">Filter by category:</p>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={selectedCategory === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory('all')}
                  className="text-xs"
                >
                  All ({ingredientExamples.length})
                </Button>
                <Button
                  variant={selectedCategory === 'safe' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory('safe')}
                  className="text-xs"
                >
                  Safe ({statusCounts.safe})
                </Button>
                <Button
                  variant={selectedCategory === 'caution' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory('caution')}
                  className="text-xs"
                >
                  Caution ({statusCounts.caution})
                </Button>
                <Button
                  variant={selectedCategory === 'avoid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory('avoid')}
                  className="text-xs"
                >
                  Avoid ({statusCounts.avoid})
                </Button>
              </div>
            </div>
          </div>

          {/* Ingredient List */}
          <div className="lg:col-span-2">
            <div className="space-y-4">
              {filteredIngredients.map((ingredient, index) => (
                <Card key={index} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {getStatusIcon(ingredient.status)}
                        <h4 className="font-semibold text-gray-900">{ingredient.name}</h4>
                        <Badge 
                          variant="secondary" 
                          className={`text-xs border ${getStatusColor(ingredient.status)}`}
                        >
                          {ingredient.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{ingredient.description}</p>
                      
                      {/* Effects Preview */}
                      <div className="mb-3">
                        <div className="text-xs text-gray-500 mb-1">Key Effects:</div>
                        <div className="text-sm text-gray-700">
                          {ingredient.effects.slice(0, 2).join(' • ')}
                          {ingredient.effects.length > 2 && '...'}
                        </div>
                      </div>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setExpandedIngredient(
                        expandedIngredient === ingredient.name ? null : ingredient.name
                      )}
                    >
                      {expandedIngredient === ingredient.name ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </Button>
                  </div>

                  {/* Expanded Details */}
                  {expandedIngredient === ingredient.name && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="space-y-4">
                        {/* All Effects */}
                        <div>
                          <h5 className="text-sm font-semibold text-gray-900 mb-2">All Effects:</h5>
                          <ul className="space-y-1">
                            {ingredient.effects.map((effect, idx) => (
                              <li key={idx} className="text-sm text-gray-600 flex items-center gap-2">
                                <div className="w-1 h-1 bg-gray-400 rounded-full" />
                                {effect}
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Alternatives */}
                        {ingredient.alternatives && ingredient.alternatives.length > 0 && (
                          <div>
                            <h5 className="text-sm font-semibold text-gray-900 mb-2">Healthier Alternatives:</h5>
                            <div className="flex flex-wrap gap-2">
                              {ingredient.alternatives.map((alt, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs text-[var(--healthscan-green)] border-[var(--healthscan-green)]">
                                  {alt}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </Card>
              ))}
            </div>

            <div className="text-center mt-8">
              <p className="text-sm text-gray-600 mb-4">
                This analysis covers ingredients from a sample energy bar. Your products may vary.
              </p>
              <Button className="bg-[var(--healthscan-green)] hover:bg-[var(--healthscan-light-green)] text-white">
                Try Your Own Product
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}