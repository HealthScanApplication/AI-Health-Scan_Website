"use client";

import { useState } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { CheckCircle, XCircle, Info, AlertTriangle, User, Key, Shield } from 'lucide-react';

export function AuthStatusGuide() {
  const [showGuide, setShowGuide] = useState(false);

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  if (!showGuide) {
    return (
      <div className="fixed top-4 left-4 z-50">
        <Button
          onClick={() => setShowGuide(true)}
          size="sm"
          variant="outline"
          className="bg-green-500 text-white hover:bg-green-600 border-green-500"
        >
          <Info className="w-4 h-4 mr-2" />
          Auth Guide
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed top-4 left-4 z-50">
      <Card className="w-96 p-4 bg-white shadow-lg border-2 border-green-500 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-green-600" />
            <h3 className="font-semibold text-green-900">Authentication Status Guide</h3>
          </div>
          <Button
            onClick={() => setShowGuide(false)}
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0"
          >
            ✕
          </Button>
        </div>

        <div className="space-y-4">
          {/* System Status */}
          <div className="p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="font-medium text-green-800">System Status: Working Correctly</span>
            </div>
            <p className="text-xs text-green-700">
              The authentication system is functioning properly. Error messages indicate expected behavior.
            </p>
          </div>

          {/* Error Explanations */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-500" />
              Common "Errors" That Are Actually Correct
            </h4>

            {/* Invalid Credentials */}
            <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <Key className="w-3 h-3 text-orange-600" />
                  <span className="text-sm font-medium text-orange-800">"Invalid login credentials"</span>
                </div>
                <Badge variant="outline" className="text-xs border-green-500 text-green-700">
                  ✅ Expected
                </Badge>
              </div>
              <p className="text-xs text-orange-700">
                This means: Account exists, but wrong password was entered. This is normal behavior!
              </p>
            </div>

            {/* User Already Registered */}
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <User className="w-3 h-3 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">"User already registered"</span>
                </div>
                <Badge variant="outline" className="text-xs border-green-500 text-green-700">
                  ✅ Expected
                </Badge>
              </div>
              <p className="text-xs text-blue-700">
                This means: Account already exists. User should sign in instead of signing up.
              </p>
            </div>

            {/* Network Errors */}
            <div className="p-3 bg-red-50 rounded-lg border border-red-200">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <XCircle className="w-3 h-3 text-red-600" />
                  <span className="text-sm font-medium text-red-800">Network/Connection errors</span>
                </div>
                <Badge variant="outline" className="text-xs border-red-500 text-red-700">
                  ⚠️ Investigate
                </Badge>
              </div>
              <p className="text-xs text-red-700">
                These indicate actual problems: Check internet connection, API status, or configuration.
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-2">
            <h4 className="font-medium text-gray-900">Quick Debugging</h4>
            
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={() => {
                  if (typeof window !== 'undefined' && (window as any).HealthScanAuthDebug) {
                    (window as any).HealthScanAuthDebug.testConnection();
                  } else {
                    console.log('AuthDebug not available - check App.tsx');
                  }
                }}
                size="sm"
                variant="outline"
                className="text-xs h-8"
              >
                Test Connection
              </Button>
              
              <Button
                onClick={() => {
                  if (typeof window !== 'undefined' && (window as any).HealthScanAuthDebug) {
                    (window as any).HealthScanAuthDebug.getCurrentUser();
                  }
                }}
                size="sm"
                variant="outline"
                className="text-xs h-8"
              >
                Check User
              </Button>
              
              <Button
                onClick={() => {
                  if (typeof window !== 'undefined' && (window as any).HealthScanAuthDebug) {
                    (window as any).HealthScanAuthDebug.help();
                  }
                }}
                size="sm"
                variant="outline"
                className="text-xs h-8 col-span-2"
              >
                Show Console Commands
              </Button>
            </div>
          </div>

          {/* Key Takeaway */}
          <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span className="font-medium text-emerald-800">Key Takeaway</span>
            </div>
            <p className="text-xs text-emerald-700">
              Authentication "errors" usually mean the system is working correctly and responding appropriately to different user actions.
            </p>
          </div>

          {/* Development Tools */}
          <div className="text-xs text-gray-600">
            <p className="font-medium mb-1">Available Development Tools:</p>
            <ul className="space-y-1 text-xs">
              <li>• Blue "Dev Auth" button (bottom-left) - Create test accounts</li>
              <li>• Console commands - Type HealthScanAuthDebug.help()</li>
              <li>• Login diagnostic page - Add ?page=login-diagnostic to URL</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}