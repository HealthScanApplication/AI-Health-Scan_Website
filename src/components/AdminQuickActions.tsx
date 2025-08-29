/**
 * Admin Quick Actions Component
 * Provides quick access to common admin operations
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  Plus, 
  Download, 
  Eye, 
  Database, 
  Globe, 
  TestTube,
  Zap,
  Heart,
  AlertTriangle,
  Leaf,
  Bug,
  Search,
  Utensils
} from 'lucide-react';

interface AdminQuickActionsProps {
  onNavigate: (tab: string) => void;
  onImport: (dataType: string) => void;
}

export function AdminQuickActions({ onNavigate, onImport }: AdminQuickActionsProps) {
  const quickActions = [
    {
      category: 'Data Management',
      actions: [
        {
          label: 'Add Nutrient',
          icon: Heart,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          onClick: () => onNavigate('nutrients'),
          description: 'Add new nutrient data'
        },
        {
          label: 'Add Pollutant',
          icon: AlertTriangle,
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          onClick: () => onNavigate('pollutants'),
          description: 'Add new pollutant data'
        },
        {
          label: 'Add Ingredient',
          icon: Leaf,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          onClick: () => onNavigate('ingredients'),
          description: 'Add new ingredient data'
        },
        {
          label: 'Add Product',
          icon: Database,
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          onClick: () => onNavigate('products'),
          description: 'Add new product data'
        }
      ]
    },
    {
      category: 'Data Import',
      actions: [
        {
          label: 'Import Nutrients',
          icon: Download,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          onClick: () => onImport('nutrients'),
          description: 'Import from USDA API'
        },
        {
          label: 'Import Pollutants',
          icon: Download,
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          onClick: () => onImport('pollutants'),
          description: 'Import from EPA/OpenAQ'
        },
        {
          label: 'Import Products',
          icon: Download,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          onClick: () => onImport('products'),
          description: 'Import from OpenFood Facts'
        },
        {
          label: 'Import Ingredients',
          icon: Download,
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          onClick: () => onImport('ingredients'),
          description: 'Import from global APIs'
        }
      ]
    }
  ];

  const systemActions = [
    {
      label: 'Run API Tests',
      icon: TestTube,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      description: 'Test all API integrations',
      priority: 'high' as const
    },
    {
      label: 'View All Data',
      icon: Eye,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      description: 'Browse all database records',
      priority: 'medium' as const
    },
    {
      label: 'Bulk Operations',
      icon: Zap,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      description: 'Mass import/export tools',
      priority: 'medium' as const
    }
  ];

  return (
    <div className="space-y-6">
      {/* Quick Data Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Plus className="w-5 h-5 text-green-600" />
            <span>Quick Actions</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {quickActions.map((section) => (
            <div key={section.category} className="mb-6 last:mb-0">
              <h4 className="text-sm font-medium text-gray-700 mb-3">{section.category}</h4>
              <div className="grid grid-cols-1 gap-2">
                {section.actions.map((action) => (
                  <Button
                    key={action.label}
                    variant="outline"
                    onClick={action.onClick}
                    className="justify-start h-auto p-3 hover:shadow-sm transition-all duration-200"
                  >
                    <div className={`p-2 rounded-lg ${action.bgColor} mr-3`}>
                      <action.icon className={`w-4 h-4 ${action.color}`} />
                    </div>
                    <div className="text-left">
                      <div className="font-medium">{action.label}</div>
                      <div className="text-xs text-gray-500">{action.description}</div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* System Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Globe className="w-5 h-5 text-blue-600" />
            <span>System Operations</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {systemActions.map((action) => (
            <div key={action.label} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${action.bgColor}`}>
                  <action.icon className={`w-4 h-4 ${action.color}`} />
                </div>
                <div>
                  <div className="font-medium">{action.label}</div>
                  <div className="text-xs text-gray-500">{action.description}</div>
                </div>
              </div>
              <Badge 
                variant={action.priority === 'high' ? 'destructive' : 'secondary'}
                className={
                  action.priority === 'high' 
                    ? 'bg-red-100 text-red-800' 
                    : 'bg-gray-100 text-gray-600'
                }
              >
                {action.priority}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Data Types Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Data Types</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {[
              { key: 'nutrients', label: 'Nutrients', icon: Heart, color: 'text-green-600' },
              { key: 'pollutants', label: 'Pollutants', icon: AlertTriangle, color: 'text-red-600' },
              { key: 'ingredients', label: 'Ingredients', icon: Leaf, color: 'text-blue-600' },
              { key: 'products', label: 'Products', icon: Database, color: 'text-yellow-600' },
              { key: 'parasites', label: 'Parasites', icon: Bug, color: 'text-purple-600' },
              { key: 'scans', label: 'Scans', icon: Search, color: 'text-indigo-600' },
              { key: 'meals', label: 'Meals', icon: Utensils, color: 'text-orange-600' }
            ].map(({ key, label, icon: Icon, color }) => (
              <Button
                key={key}
                variant="outline"
                onClick={() => onNavigate(key)}
                className="justify-start p-2 h-auto hover:shadow-sm transition-all duration-200"
              >
                <Icon className={`w-4 h-4 ${color} mr-2`} />
                <span className="text-sm">{label}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}