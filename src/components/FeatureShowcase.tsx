"use client";

import { useState } from "react";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { 
  Scan, 
  AlertTriangle, 
  CheckCircle, 
  Zap, 
  Eye,
  Camera,
  BarChart3,
  Shield
} from "lucide-react";

interface NutrientData {
  name: string;
  amount: string;
  unit: string;
  dailyValue?: string;
  status: 'low' | 'adequate' | 'high';
}

interface PollutantData {
  name: string;
  detected: string;
  safeLimit: string;
  unit: string;
  riskLevel: 'low' | 'moderate' | 'high';
  effect: string;
}

interface ScanExample {
  id: string;
  product: string;
  image: string;
  scanTime: string;
  healthScore: number;
  nutrients: NutrientData[];
  pollutants: PollutantData[];
  category: 'food' | 'supplement' | 'drink';
}

const scanExamples: ScanExample[] = [
  {
    id: '1',
    product: 'Organic Baby Food Puree',
    image: '/api/placeholder/300/200',
    scanTime: '0.7s',
    healthScore: 82,
    nutrients: [
      { name: 'Vitamin A', amount: '850', unit: 'μg', dailyValue: '125%', status: 'high' },
      { name: 'Iron', amount: '1.8', unit: 'mg', dailyValue: '18%', status: 'adequate' },
      { name: 'Vitamin C', amount: '12', unit: 'mg', dailyValue: '80%', status: 'adequate' }
    ],
    pollutants: [
      { 
        name: 'Cadmium', 
        detected: '0.02', 
        safeLimit: '0.005', 
        unit: 'mg/kg', 
        riskLevel: 'moderate',
        effect: 'Kidney damage and bone demineralization at >0.5mg/kg daily intake'
      },
      {
        name: 'Arsenic',
        detected: '0.008',
        safeLimit: '0.01',
        unit: 'mg/kg',
        riskLevel: 'low',
        effect: 'Developmental delays and cancer risk at >0.1mg/kg chronic exposure'
      }
    ],
    category: 'food'
  },
  {
    id: '2', 
    product: 'Daily Multivitamin',
    image: '/api/placeholder/300/200',
    scanTime: '0.9s',
    healthScore: 91,
    nutrients: [
      { name: 'Vitamin D3', amount: '1000', unit: 'IU', dailyValue: '250%', status: 'high' },
      { name: 'B12 (Cyanocobalamin)', amount: '6', unit: 'μg', dailyValue: '250%', status: 'high' },
      { name: 'Folate', amount: '400', unit: 'μg', dailyValue: '100%', status: 'adequate' },
      { name: 'Zinc', amount: '11', unit: 'mg', dailyValue: '100%', status: 'adequate' }
    ],
    pollutants: [
      {
        name: 'Lead',
        detected: '0.3',
        safeLimit: '0.5',
        unit: 'μg',
        riskLevel: 'low',
        effect: 'Neurological effects and cognitive impairment at >10μg daily'
      }
    ],
    category: 'supplement'
  },
  {
    id: '3',
    product: 'Salmon Open Face Sandwich',
    image: '/api/placeholder/300/200', 
    scanTime: '1.1s',
    healthScore: 74,
    nutrients: [
      { name: 'Omega-3 EPA', amount: '1200', unit: 'mg', dailyValue: '75%', status: 'high' },
      { name: 'Protein', amount: '28', unit: 'g', dailyValue: '56%', status: 'high' },
      { name: 'Vitamin B12', amount: '3.2', unit: 'μg', dailyValue: '133%', status: 'high' },
      { name: 'Selenium', amount: '42', unit: 'μg', dailyValue: '76%', status: 'adequate' }
    ],
    pollutants: [
      {
        name: 'Mercury (Methylmercury)',
        detected: '0.14',
        safeLimit: '0.1',
        unit: 'mg/kg',
        riskLevel: 'moderate',
        effect: 'Neurological damage and developmental delays at >0.3mg/kg weekly'
      },
      {
        name: 'Anisakis Parasite Risk',
        detected: 'Present',
        safeLimit: 'None',
        unit: 'organisms',
        riskLevel: 'high',
        effect: 'Anisakiasis infection causing abdominal pain, nausea. Cook to 63°C internal temp'
      },
      {
        name: 'Diphyllobothrium (Fish Tapeworm)',
        detected: 'Possible',
        safeLimit: 'None',
        unit: 'larvae',
        riskLevel: 'moderate',
        effect: 'Intestinal infection, B12 deficiency. Freeze at -20°C for 7 days minimum'
      }
    ],
    category: 'food'
  }
];

export function FeatureShowcase() {
  const [selectedExample, setSelectedExample] = useState<ScanExample>(scanExamples[0]);

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getNutrientStatusColor = (status: string) => {
    switch (status) {
      case 'high': return 'text-green-700 bg-green-50 border-green-200';
      case 'adequate': return 'text-green-700 bg-green-50 border-green-200';
      case 'low': return 'text-red-700 bg-red-50 border-red-200';
      default: return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'high': return 'text-red-700 bg-red-50 border-red-200';
      case 'moderate': return 'text-red-700 bg-red-50 border-red-200';
      case 'low': return 'text-gray-700 bg-gray-50 border-gray-200';
      default: return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'food': return '🍽️';
      case 'drink': return '🥤';
      case 'supplement': return '💊';
      default: return '📦';
    }
  };

  return (
    <section className="relative py-20 px-4 overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0">
        {/* Base gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-white to-[var(--healthscan-bg-light)]"></div>
        
        {/* Floating blobs */}
        <div className="absolute w-88 h-88 rounded-full opacity-6 animate-blob-float-3"
             style={{
               background: `radial-gradient(circle, rgba(99, 102, 241, 0.2) 0%, rgba(79, 70, 229, 0.1) 50%, transparent 70%)`,
               top: "8%",
               left: "12%",
               filter: "blur(42px)",
             }}></div>
        
        <div className="absolute w-60 h-60 rounded-full opacity-8 animate-blob-float-5"
             style={{
               background: `radial-gradient(circle, rgba(34, 197, 94, 0.25) 0%, rgba(22, 163, 74, 0.12) 50%, transparent 70%)`,
               top: "55%",
               right: "10%",
               filter: "blur(35px)",
             }}></div>
        
        <div className="absolute w-76 h-76 rounded-full opacity-7 animate-blob-float-1"
             style={{
               background: `radial-gradient(circle, rgba(251, 146, 60, 0.18) 0%, rgba(249, 115, 22, 0.09) 50%, transparent 70%)`,
               bottom: "15%",
               left: "20%",
               filter: "blur(38px)",
             }}></div>
        
        <div className="absolute w-42 h-42 rounded-full opacity-10 animate-blob-float-7"
             style={{
               background: `radial-gradient(circle, rgba(168, 85, 247, 0.3) 0%, transparent 70%)`,
               top: "30%",
               right: "35%",
               filter: "blur(22px)",
             }}></div>
      </div>
      
      <div className="relative z-10 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Instant Health Insights
          </h2>
          <p className="text-xl text-[var(--healthscan-text-muted)] max-w-3xl mx-auto mb-8">
            Simply scan any product barcode and get detailed nutrient analysis and pollutant detection in seconds. 
            See exactly what's in your food with specific quantities and health effects.
          </p>
          <div className="flex justify-center items-center gap-6 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-[var(--healthscan-green)]" />
              <span>Scan in under 1 second</span>
            </div>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[var(--healthscan-green)]" />
              <span>AI-powered analysis</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-[var(--healthscan-green)]" />
              <span>Pollutant risk alerts</span>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Interactive Demo */}
          <div className="space-y-6">
            <div className="bg-gray-50 rounded-2xl p-8 text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-[var(--healthscan-green)] rounded-full mb-6">
                <Camera className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Try a Sample Scan</h3>
              <p className="text-gray-600 mb-6">
                Select a product below to see how HealthScan analyzes nutrients and detects pollutants with specific quantities.
              </p>
              
              {/* Product Selection */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                {scanExamples.map((example) => (
                  <button
                    key={example.id}
                    onClick={() => setSelectedExample(example)}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      selectedExample.id === example.id
                        ? 'border-[var(--healthscan-green)] bg-[var(--healthscan-bg-light)]'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-2xl mb-1">{getCategoryIcon(example.category)}</div>
                    <div className="text-xs font-medium text-gray-700">{example.product}</div>
                  </button>
                ))}
              </div>

              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="flex items-center justify-center gap-2 text-[var(--healthscan-green)]">
                  <Scan className="w-5 h-5" />
                  <span className="font-semibold">Ready to Scan</span>
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  Launch August 30th
                </p>
              </div>
            </div>
          </div>

          {/* Scan Results Display */}
          <div className="space-y-6">
            <Card className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-1">
                    {selectedExample.product}
                  </h4>
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <span>Scanned in {selectedExample.scanTime}</span>
                    <Badge variant="secondary" className="text-xs">
                      {selectedExample.category}
                    </Badge>
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-sm font-semibold ${getHealthScoreColor(selectedExample.healthScore)}`}>
                  {selectedExample.healthScore}/100
                </div>
              </div>

              {/* Nutrients Section */}
              <div className="mb-6">
                <h5 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Key Nutrients Detected
                </h5>
                <div className="space-y-2">
                  {selectedExample.nutrients.map((nutrient, index) => (
                    <div key={index} className={`flex items-center justify-between p-3 rounded-lg border ${getNutrientStatusColor(nutrient.status)}`}>
                      <div className="flex flex-col">
                        <span className="font-medium text-sm">{nutrient.name}</span>
                        {nutrient.dailyValue && (
                          <span className="text-xs opacity-75">{nutrient.dailyValue} daily value</span>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="font-semibold">{nutrient.amount}{nutrient.unit}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pollutants Section */}
              {selectedExample.pollutants.length > 0 && (
                <div>
                  <h5 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                    Pollutants & Risk Assessment
                  </h5>
                  <div className="space-y-3">
                    {selectedExample.pollutants.map((pollutant, index) => (
                      <div key={index} className={`p-3 rounded-lg border ${getRiskLevelColor(pollutant.riskLevel)}`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-sm">{pollutant.name}</span>
                          <div className="text-right">
                            <div className="text-sm font-semibold">
                              {pollutant.detected}{pollutant.unit} detected
                            </div>
                            <div className="text-xs opacity-75">
                              Safe limit: {pollutant.safeLimit}{pollutant.unit}
                            </div>
                          </div>
                        </div>
                        <p className="text-xs opacity-90 mt-1">
                          <strong>Health Effect:</strong> {pollutant.effect}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>

            <div className="bg-gradient-to-r from-[var(--healthscan-bg-light)] to-green-50/30 rounded-xl p-6 text-center">
              <div className="flex items-center justify-center gap-2 mb-3">
                <BarChart3 className="w-5 h-5 text-[var(--healthscan-green)]" />
                <span className="font-semibold text-gray-900">Complete Analysis Available</span>
              </div>
              <p className="text-sm text-gray-600 mb-2">
                Get quantified analysis like this for food products
              </p>
              <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Nutrients & Benefits</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span>Pollutants & Risks</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  <span>Safety Thresholds</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}