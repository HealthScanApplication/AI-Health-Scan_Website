"use client";

import { useState } from "react";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { 
  Target,
  Heart,
  Dumbbell,
  Brain,
  Shield,
  TrendingUp,
  User,
  Settings,
  CheckCircle,
  AlertTriangle,
  ArrowRight
} from "lucide-react";

interface HealthGoal {
  id: string;
  name: string;
  icon: any;
  color: string;
  description: string;
}

interface PersonalizedRecommendation {
  type: 'avoid' | 'prefer' | 'limit' | 'boost';
  title: string;
  reason: string;
  impact: string;
  icon: any;
}

const healthGoals: HealthGoal[] = [
  {
    id: 'weight-loss',
    name: 'Weight Management',
    icon: TrendingUp,
    color: 'text-blue-600 bg-blue-100',
    description: 'Lose weight and maintain healthy BMI'
  },
  {
    id: 'muscle-gain',
    name: 'Muscle Building',
    icon: Dumbbell,
    color: 'text-purple-600 bg-purple-100',
    description: 'Build lean muscle mass'
  },
  {
    id: 'heart-health',
    name: 'Heart Health',
    icon: Heart,
    color: 'text-red-600 bg-red-100',
    description: 'Improve cardiovascular health'
  },
  {
    id: 'brain-health',
    name: 'Cognitive Function',
    icon: Brain,
    color: 'text-indigo-600 bg-indigo-100',
    description: 'Enhance mental clarity and focus'
  },
  {
    id: 'immune-boost',
    name: 'Immune Support',
    icon: Shield,
    color: 'text-green-600 bg-green-100',
    description: 'Strengthen immune system'
  }
];

const getRecommendations = (goalId: string): PersonalizedRecommendation[] => {
  const recommendations: Record<string, PersonalizedRecommendation[]> = {
    'weight-loss': [
      {
        type: 'avoid',
        title: 'High Fructose Corn Syrup',
        reason: 'Linked to increased belly fat storage',
        impact: 'May slow your weight loss by 15-20%',
        icon: AlertTriangle
      },
      {
        type: 'prefer',
        title: 'Protein-Rich Foods',
        reason: 'Increases metabolism and satiety',
        impact: 'Can boost calorie burn by 80-100 calories/day',
        icon: CheckCircle
      },
      {
        type: 'limit',
        title: 'Added Sugars',
        reason: 'Keep under 25g per day for weight loss',
        impact: 'Staying below this can double weight loss rate',
        icon: Target
      }
    ],
    'muscle-gain': [
      {
        type: 'boost',
        title: 'Leucine-Rich Proteins',
        reason: 'Essential amino acid for muscle synthesis',
        impact: 'Can increase muscle building by 25%',
        icon: TrendingUp
      },
      {
        type: 'prefer',
        title: 'Creatine Supplements',
        reason: 'Proven to enhance strength and power',
        impact: 'May improve workout performance by 15%',
        icon: CheckCircle
      },
      {
        type: 'avoid',
        title: 'Alcohol',
        reason: 'Interferes with protein synthesis',
        impact: 'Can reduce muscle gains by up to 37%',
        icon: AlertTriangle
      }
    ],
    'heart-health': [
      {
        type: 'prefer',
        title: 'Omega-3 Fatty Acids',
        reason: 'Reduces inflammation and supports heart function',
        impact: 'Can reduce heart disease risk by 30%',
        icon: CheckCircle
      },
      {
        type: 'avoid',
        title: 'Trans Fats',
        reason: 'Increases bad cholesterol and inflammation',
        impact: 'Even small amounts increase heart risk by 23%',
        icon: AlertTriangle
      },
      {
        type: 'limit',
        title: 'Sodium Intake',
        reason: 'Keep under 2,300mg to manage blood pressure',
        impact: 'Can reduce stroke risk by 14%',
        icon: Target
      }
    ],
    'brain-health': [
      {
        type: 'boost',
        title: 'Antioxidant-Rich Foods',
        reason: 'Protects brain cells from oxidative stress',
        impact: 'May improve memory by 20-30%',
        icon: TrendingUp
      },
      {
        type: 'prefer',
        title: 'DHA and EPA',
        reason: 'Essential for brain structure and function',
        impact: 'Can enhance cognitive performance by 15%',
        icon: CheckCircle
      },
      {
        type: 'avoid',
        title: 'Artificial Food Dyes',
        reason: 'May affect focus and concentration',
        impact: 'Linked to 10-15% decrease in attention span',
        icon: AlertTriangle
      }
    ],
    'immune-boost': [
      {
        type: 'boost',
        title: 'Vitamin C & Zinc',
        reason: 'Critical for immune cell function',
        impact: 'Can reduce cold duration by 1-2 days',
        icon: TrendingUp
      },
      {
        type: 'prefer',
        title: 'Probiotic Foods',
        reason: '70% of immune system is in the gut',
        impact: 'May reduce illness frequency by 25%',
        icon: CheckCircle
      },
      {
        type: 'limit',
        title: 'Processed Foods',
        reason: 'High in preservatives that may weaken immunity',
        impact: 'Can reduce immune response by 40%',
        icon: Target
      }
    ]
  };

  return recommendations[goalId] || [];
};

export function PersonalizedInsights() {
  const [selectedGoal, setSelectedGoal] = useState<string>('weight-loss');

  const getRecommendationColor = (type: string) => {
    switch (type) {
      case 'avoid': return 'border-red-200 bg-red-50';
      case 'prefer': return 'border-green-200 bg-green-50';
      case 'boost': return 'border-blue-200 bg-blue-50';
      case 'limit': return 'border-yellow-200 bg-yellow-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  const getRecommendationIcon = (type: string) => {
    switch (type) {
      case 'avoid': return 'text-red-600';
      case 'prefer': return 'text-green-600';
      case 'boost': return 'text-blue-600';
      case 'limit': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  const currentRecommendations = getRecommendations(selectedGoal);

  return (
    <section className="py-20 px-4 bg-gradient-to-bl from-green-50 to-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Personalized Health Insights
          </h2>
          <p className="text-xl text-[var(--healthscan-text-muted)] max-w-3xl mx-auto mb-8">
            Get recommendations tailored to your unique health goals and dietary needs. 
            HealthScan learns what matters most to you and highlights what to look for.
          </p>
          <div className="flex justify-center items-center gap-6 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-[var(--healthscan-green)]" />
              <span>Personalized to your goals</span>
            </div>
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-[var(--healthscan-green)]" />
              <span>Science-backed recommendations</span>
            </div>
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4 text-[var(--healthscan-green)]" />
              <span>Adapts as you progress</span>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Health Goals Selection */}
          <div className="lg:col-span-1">
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-[var(--healthscan-green)]" />
                Your Health Goals
              </h3>
              
              <div className="space-y-3">
                {healthGoals.map((goal) => {
                  const Icon = goal.icon;
                  return (
                    <button
                      key={goal.id}
                      onClick={() => setSelectedGoal(goal.id)}
                      className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
                        selectedGoal === goal.id
                          ? 'border-[var(--healthscan-green)] bg-[var(--healthscan-bg-light)]'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${goal.color}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 mb-1">{goal.name}</h4>
                          <p className="text-xs text-gray-600">{goal.description}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-6 p-4 bg-[var(--healthscan-bg-light)] rounded-lg">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Pro Tip</h4>
                <p className="text-xs text-gray-600">
                  You can set multiple goals in the app. HealthScan will balance recommendations 
                  to help you achieve all your health objectives.
                </p>
              </div>
            </Card>
          </div>

          {/* Personalized Recommendations */}
          <div className="lg:col-span-2">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Recommendations for {healthGoals.find(g => g.id === selectedGoal)?.name}
              </h3>
              <p className="text-sm text-gray-600">
                Based on your goal, here's what HealthScan will highlight when scanning products:
              </p>
            </div>

            <div className="space-y-4 mb-8">
              {currentRecommendations.map((rec, index) => {
                const Icon = rec.icon;
                return (
                  <Card key={index} className={`p-4 border-l-4 ${getRecommendationColor(rec.type)}`}>
                    <div className="flex items-start gap-4">
                      <div className={`p-2 rounded-lg bg-white shadow-sm`}>
                        <Icon className={`w-4 h-4 ${getRecommendationIcon(rec.type)}`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold text-gray-900">{rec.title}</h4>
                          <Badge 
                            variant="secondary" 
                            className={`text-xs capitalize ${getRecommendationIcon(rec.type)} bg-white`}
                          >
                            {rec.type}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-700 mb-2">{rec.reason}</p>
                        <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                          <TrendingUp className="w-3 h-3" />
                          <span>{rec.impact}</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>

            {/* Call to Action */}
            <Card className="p-6 bg-gradient-to-r from-[var(--healthscan-bg-light)] to-white border border-[var(--healthscan-green)]/20">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">
                    Ready to Get Personalized Insights?
                  </h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Set up your health profile and start getting tailored recommendations 
                    for every product you scan.
                  </p>
                </div>
                <Button className="bg-[var(--healthscan-green)] hover:bg-[var(--healthscan-light-green)] text-white">
                  Set Up Profile
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}