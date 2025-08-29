"use client";

import { useState } from "react";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { 
  Scale,
  TrendingUp,
  TrendingDown,
  Minus,
  Star,
  CheckCircle,
  XCircle,
  ArrowRight,
  Zap,
  Award
} from "lucide-react";

interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  image: string;
  healthScore: number;
  price: string;
  nutrition: {
    calories: number;
    protein: number;
    sugar: number;
    sodium: number;
    fiber: number;
  };
  highlights: string[];
  warnings: string[];
  ingredients: number;
  rating: number;
}

const comparisonProducts: Product[] = [
  {
    id: '1',
    name: 'Organic Protein Bar',
    brand: 'NatureFit',
    category: 'Protein Bar',
    image: '/api/placeholder/150/100',
    healthScore: 85,
    price: '$2.99',
    nutrition: {
      calories: 200,
      protein: 20,
      sugar: 8,
      sodium: 180,
      fiber: 12
    },
    highlights: ['Organic ingredients', 'High protein', 'No artificial sweeteners', 'Rich in fiber'],
    warnings: ['Contains tree nuts'],
    ingredients: 12,
    rating: 4.6
  },
  {
    id: '2',
    name: 'Power Protein Bar',
    brand: 'MuscleMax',
    category: 'Protein Bar',
    image: '/api/placeholder/150/100',
    healthScore: 42,
    price: '$1.99',
    nutrition: {
      calories: 240,
      protein: 18,
      sugar: 22,
      sodium: 350,
      fiber: 3
    },
    highlights: ['High protein', 'Great taste'],
    warnings: ['High sugar content', 'Contains artificial colors', 'High sodium'],
    ingredients: 28,
    rating: 3.8
  },
  {
    id: '3',
    name: 'Plant-Based Bar',
    brand: 'GreenEats',
    category: 'Protein Bar',
    image: '/api/placeholder/150/100',
    healthScore: 78,
    price: '$3.49',
    nutrition: {
      calories: 190,
      protein: 15,
      sugar: 6,
      sodium: 140,
      fiber: 8
    },
    highlights: ['Plant-based protein', 'Low sugar', 'Vegan friendly', 'Sustainably sourced'],
    warnings: ['Lower protein than others'],
    ingredients: 15,
    rating: 4.3
  }
];

export function ComparisonTool() {
  const [selectedProducts, setSelectedProducts] = useState<string[]>(['1', '2']);
  const [comparisonMetric, setComparisonMetric] = useState<'health' | 'nutrition' | 'ingredients'>('health');

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getComparisonIcon = (value1: number, value2: number, higherIsBetter: boolean = true) => {
    if (value1 === value2) return <Minus className="w-4 h-4 text-gray-400" />;
    
    const isHigher = value1 > value2;
    const isBetter = higherIsBetter ? isHigher : !isHigher;
    
    if (isBetter) {
      return <TrendingUp className="w-4 h-4 text-green-600" />;
    } else {
      return <TrendingDown className="w-4 h-4 text-red-600" />;
    }
  };

  const selectedProductsData = selectedProducts.map(id => 
    comparisonProducts.find(p => p.id === id)
  ).filter(Boolean) as Product[];

  const bestProduct = selectedProductsData.reduce((best, current) => 
    current.healthScore > best.healthScore ? current : best
  );

  return (
    <section className="py-20 px-4 bg-gradient-to-br from-gray-50 via-slate-50 to-gray-100">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Smart Product Comparison
          </h2>
          <p className="text-xl text-[var(--healthscan-text-muted)] max-w-3xl mx-auto mb-8">
            Don't just compare prices—compare health. HealthScan makes it easy to see which 
            products are truly better for you with side-by-side nutritional analysis.
          </p>
          <div className="flex justify-center items-center gap-6 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Scale className="w-4 h-4 text-[var(--healthscan-green)]" />
              <span>Side-by-side comparison</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-[var(--healthscan-green)]" />
              <span>Instant health scores</span>
            </div>
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-[var(--healthscan-green)]" />
              <span>Clear winner recommendations</span>
            </div>
          </div>
        </div>

        {/* Product Selection */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Select products to compare:</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {comparisonProducts.map((product) => (
              <button
                key={product.id}
                onClick={() => {
                  if (selectedProducts.includes(product.id)) {
                    if (selectedProducts.length > 1) {
                      setSelectedProducts(selectedProducts.filter(id => id !== product.id));
                    }
                  } else if (selectedProducts.length < 3) {
                    setSelectedProducts([...selectedProducts, product.id]);
                  } else {
                    setSelectedProducts([selectedProducts[1], selectedProducts[2], product.id]);
                  }
                }}
                className={`p-4 rounded-lg border-2 text-left transition-all ${
                  selectedProducts.includes(product.id)
                    ? 'border-[var(--healthscan-green)] bg-[var(--healthscan-bg-light)]'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-8 bg-gray-200 rounded"></div>
                  <div>
                    <h4 className="font-medium text-gray-900 text-sm">{product.name}</h4>
                    <p className="text-xs text-gray-600">{product.brand}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <Badge className={`text-xs ${getScoreColor(product.healthScore)}`}>
                    {product.healthScore}/100
                  </Badge>
                  <span className="text-sm font-medium text-gray-700">{product.price}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Comparison View */}
        {selectedProductsData.length >= 2 && (
          <>
            {/* Comparison Metrics Tabs */}
            <div className="flex justify-center mb-8">
              <div className="flex bg-white rounded-lg p-1 border">
                <button
                  onClick={() => setComparisonMetric('health')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    comparisonMetric === 'health'
                      ? 'bg-[var(--healthscan-green)] text-white'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Health Scores
                </button>
                <button
                  onClick={() => setComparisonMetric('nutrition')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    comparisonMetric === 'nutrition'
                      ? 'bg-[var(--healthscan-green)] text-white'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Nutrition Facts
                </button>
                <button
                  onClick={() => setComparisonMetric('ingredients')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    comparisonMetric === 'ingredients'
                      ? 'bg-[var(--healthscan-green)] text-white'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Ingredients
                </button>
              </div>
            </div>

            {/* Comparison Table */}
            <Card className="p-6 mb-8">
              <div className="grid gap-6" style={{ gridTemplateColumns: `200px repeat(${selectedProductsData.length}, 1fr)` }}>
                {/* Header Row */}
                <div></div>
                {selectedProductsData.map((product) => (
                  <div key={product.id} className="text-center">
                    <div className="w-20 h-14 bg-gray-200 rounded mx-auto mb-3"></div>
                    <h4 className="font-semibold text-gray-900 text-sm mb-1">{product.name}</h4>
                    <p className="text-xs text-gray-600 mb-2">{product.brand}</p>
                    {product.id === bestProduct.id && (
                      <Badge className="bg-[var(--healthscan-green)] text-white text-xs">
                        <Award className="w-3 h-3 mr-1" />
                        Best Choice
                      </Badge>
                    )}
                  </div>
                ))}

                {/* Health Score Comparison */}
                {comparisonMetric === 'health' && (
                  <>
                    <div className="font-medium text-gray-700">Health Score</div>
                    {selectedProductsData.map((product, index) => (
                      <div key={product.id} className="text-center">
                        <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold ${getScoreColor(product.healthScore)}`}>
                          {index > 0 && getComparisonIcon(product.healthScore, selectedProductsData[0].healthScore)}
                          {product.healthScore}/100
                        </div>
                      </div>
                    ))}

                    <div className="font-medium text-gray-700">Price</div>
                    {selectedProductsData.map((product, index) => (
                      <div key={product.id} className="text-center">
                        <span className="text-sm font-medium text-gray-900">{product.price}</span>
                      </div>
                    ))}

                    <div className="font-medium text-gray-700">Rating</div>
                    {selectedProductsData.map((product, index) => (
                      <div key={product.id} className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Star className="w-4 h-4 text-yellow-400 fill-current" />
                          <span className="text-sm font-medium text-gray-900">{product.rating}</span>
                        </div>
                      </div>
                    ))}
                  </>
                )}

                {/* Nutrition Comparison */}
                {comparisonMetric === 'nutrition' && (
                  <>
                    <div className="font-medium text-gray-700">Calories</div>
                    {selectedProductsData.map((product, index) => (
                      <div key={product.id} className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          {index > 0 && getComparisonIcon(product.nutrition.calories, selectedProductsData[0].nutrition.calories, false)}
                          <span className="text-sm font-medium">{product.nutrition.calories}</span>
                        </div>
                      </div>
                    ))}

                    <div className="font-medium text-gray-700">Protein (g)</div>
                    {selectedProductsData.map((product, index) => (
                      <div key={product.id} className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          {index > 0 && getComparisonIcon(product.nutrition.protein, selectedProductsData[0].nutrition.protein)}
                          <span className="text-sm font-medium">{product.nutrition.protein}g</span>
                        </div>
                      </div>
                    ))}

                    <div className="font-medium text-gray-700">Sugar (g)</div>
                    {selectedProductsData.map((product, index) => (
                      <div key={product.id} className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          {index > 0 && getComparisonIcon(product.nutrition.sugar, selectedProductsData[0].nutrition.sugar, false)}
                          <span className="text-sm font-medium">{product.nutrition.sugar}g</span>
                        </div>
                      </div>
                    ))}

                    <div className="font-medium text-gray-700">Sodium (mg)</div>
                    {selectedProductsData.map((product, index) => (
                      <div key={product.id} className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          {index > 0 && getComparisonIcon(product.nutrition.sodium, selectedProductsData[0].nutrition.sodium, false)}
                          <span className="text-sm font-medium">{product.nutrition.sodium}mg</span>
                        </div>
                      </div>
                    ))}

                    <div className="font-medium text-gray-700">Fiber (g)</div>
                    {selectedProductsData.map((product, index) => (
                      <div key={product.id} className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          {index > 0 && getComparisonIcon(product.nutrition.fiber, selectedProductsData[0].nutrition.fiber)}
                          <span className="text-sm font-medium">{product.nutrition.fiber}g</span>
                        </div>
                      </div>
                    ))}
                  </>
                )}

                {/* Ingredients Comparison */}
                {comparisonMetric === 'ingredients' && (
                  <>
                    <div className="font-medium text-gray-700">Total Ingredients</div>
                    {selectedProductsData.map((product, index) => (
                      <div key={product.id} className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          {index > 0 && getComparisonIcon(product.ingredients, selectedProductsData[0].ingredients, false)}
                          <span className="text-sm font-medium">{product.ingredients}</span>
                        </div>
                      </div>
                    ))}

                    <div className="font-medium text-gray-700">Highlights</div>
                    {selectedProductsData.map((product) => (
                      <div key={product.id} className="space-y-1">
                        {product.highlights.slice(0, 3).map((highlight, idx) => (
                          <div key={idx} className="flex items-center gap-1 text-xs text-green-700">
                            <CheckCircle className="w-3 h-3" />
                            <span>{highlight}</span>
                          </div>
                        ))}
                      </div>
                    ))}

                    <div className="font-medium text-gray-700">Warnings</div>
                    {selectedProductsData.map((product) => (
                      <div key={product.id} className="space-y-1">
                        {product.warnings.slice(0, 3).map((warning, idx) => (
                          <div key={idx} className="flex items-center gap-1 text-xs text-red-700">
                            <XCircle className="w-3 h-3" />
                            <span>{warning}</span>
                          </div>
                        ))}
                      </div>
                    ))}
                  </>
                )}
              </div>
            </Card>

            {/* Recommendation */}
            <Card className="p-6 bg-gradient-to-r from-[var(--healthscan-bg-light)] to-white border border-[var(--healthscan-green)]/20">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <Award className="w-5 h-5 text-[var(--healthscan-green)]" />
                    Our Recommendation: {bestProduct.name}
                  </h4>
                  <p className="text-sm text-gray-600 mb-2">
                    Based on health score ({bestProduct.healthScore}/100), nutritional content, and ingredient quality.
                  </p>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-green-700 font-medium">
                      {bestProduct.highlights.length} health benefits
                    </span>
                    <span className="text-red-700 font-medium">
                      {bestProduct.warnings.length} concerns
                    </span>
                  </div>
                </div>
                <Button className="bg-[var(--healthscan-green)] hover:bg-[var(--healthscan-light-green)] text-white">
                  Add to Shopping List
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </Card>
          </>
        )}
      </div>
    </section>
  );
}