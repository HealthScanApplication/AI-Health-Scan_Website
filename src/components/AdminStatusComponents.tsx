/**
 * Admin Status Components
 * Displays system status and health metrics for the admin dashboard
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { 
  Activity, 
  Database, 
  Globe, 
  Shield, 
  Zap, 
  CheckCircle, 
  AlertTriangle,
  Heart,
  Leaf,
  Bug,
  Search,
  Utensils
} from 'lucide-react';

interface AdminStatusComponentsProps {
  stats: {
    nutrients: number;
    pollutants: number;
    ingredients: number;
    products: number;
    parasites: number;
    scans: number;
    meals: number;
  };
}

export function AdminStatusComponents({ stats }: AdminStatusComponentsProps) {
  // Calculate total records and health metrics
  const totalRecords = Object.values(stats).reduce((sum, count) => sum + count, 0);
  
  // Calculate system health score based on data coverage
  const getHealthScore = () => {
    const targetCoverage = {
      nutrients: 100,
      pollutants: 100,
      ingredients: 50,
      products: 50,
      parasites: 25,
      scans: 10,
      meals: 10
    };
    
    let totalScore = 0;
    let totalTargets = 0;
    
    Object.entries(targetCoverage).forEach(([key, target]) => {
      const actual = stats[key as keyof typeof stats] || 0;
      const score = Math.min((actual / target) * 100, 100);
      totalScore += score;
      totalTargets += 100;
    });
    
    return Math.round(totalScore / Object.keys(targetCoverage).length);
  };

  const systemHealth = getHealthScore();
  
  // Determine system status
  const getSystemStatus = () => {
    if (systemHealth >= 90) return { status: 'Excellent', color: 'text-green-600', bgColor: 'bg-green-100' };
    if (systemHealth >= 70) return { status: 'Good', color: 'text-blue-600', bgColor: 'bg-blue-100' };
    if (systemHealth >= 50) return { status: 'Fair', color: 'text-yellow-600', bgColor: 'bg-yellow-100' };
    return { status: 'Needs Attention', color: 'text-red-600', bgColor: 'bg-red-100' };
  };

  const systemStatus = getSystemStatus();

  return (
    <div className="space-y-6">
      {/* System Overview Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="w-5 h-5 text-green-600" />
            <span>System Overview</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <Database className="w-6 h-6 text-blue-600 mx-auto mb-1" />
              <div className="text-2xl font-bold text-blue-700">{totalRecords.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Total Records</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600 mx-auto mb-1" />
              <div className="text-2xl font-bold text-green-700">{systemHealth}%</div>
              <div className="text-sm text-gray-600">System Health</div>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Overall Status:</span>
              <Badge className={`${systemStatus.bgColor} ${systemStatus.color}`}>
                {systemStatus.status}
              </Badge>
            </div>
            <Progress value={systemHealth} className="w-full" />
          </div>
        </CardContent>
      </Card>

      {/* Data Coverage Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="w-5 h-5 text-purple-600" />
            <span>Data Coverage</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { key: 'nutrients', label: 'Nutrients', icon: Heart, target: 100, color: 'text-green-600' },
              { key: 'pollutants', label: 'Pollutants', icon: AlertTriangle, target: 100, color: 'text-red-600' },
              { key: 'ingredients', label: 'Ingredients', icon: Leaf, target: 50, color: 'text-blue-600' },
              { key: 'products', label: 'Products', icon: Database, target: 50, color: 'text-yellow-600' },
              { key: 'parasites', label: 'Parasites', icon: Bug, target: 25, color: 'text-purple-600' },
            ].map(({ key, label, icon: Icon, target, color }) => {
              const current = stats[key as keyof typeof stats] || 0;
              const percentage = Math.min((current / target) * 100, 100);
              
              return (
                <div key={key} className="space-y-1">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <Icon className={`w-4 h-4 ${color}`} />
                      <span className="text-sm">{label}</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      {current} / {target}
                    </div>
                  </div>
                  <Progress value={percentage} className="h-2" />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* API Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Globe className="w-5 h-5 text-blue-600" />
            <span>API Status</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[
              { name: 'USDA FoodData Central', status: 'active', description: 'Nutrition data' },
              { name: 'OpenFood Facts', status: 'active', description: 'Global food database' },
              { name: 'EPA ECOTOX', status: 'active', description: 'Environmental data' },
              { name: 'OpenAQ', status: 'active', description: 'Air quality data' },
              { name: 'Spoonacular', status: 'optional', description: 'Recipe data (paid)' },
              { name: 'Nutritionix', status: 'optional', description: 'Branded foods (paid)' }
            ].map((api) => (
              <div key={api.name} className="flex justify-between items-center p-2 rounded-lg bg-gray-50">
                <div>
                  <div className="font-medium text-sm">{api.name}</div>
                  <div className="text-xs text-gray-500">{api.description}</div>
                </div>
                <Badge 
                  variant={api.status === 'active' ? 'default' : 'secondary'}
                  className={
                    api.status === 'active' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-600'
                  }
                >
                  {api.status === 'active' ? 'Active' : 'Optional'}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Metrics Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="w-5 h-5 text-yellow-600" />
            <span>Quick Metrics</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center p-2 bg-green-50 rounded">
              <div className="font-bold text-green-700">{stats.nutrients + stats.ingredients}</div>
              <div className="text-xs text-gray-600">Health Data</div>
            </div>
            <div className="text-center p-2 bg-red-50 rounded">
              <div className="font-bold text-red-700">{stats.pollutants}</div>
              <div className="text-xs text-gray-600">Risk Data</div>
            </div>
            <div className="text-center p-2 bg-blue-50 rounded">
              <div className="font-bold text-blue-700">{stats.products}</div>
              <div className="text-xs text-gray-600">Products</div>
            </div>
            <div className="text-center p-2 bg-purple-50 rounded">
              <div className="font-bold text-purple-700">{stats.scans + stats.meals}</div>
              <div className="text-xs text-gray-600">User Data</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}