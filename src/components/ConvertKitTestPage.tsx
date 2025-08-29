"use client";

import React from "react";
import { ConvertKitIntegrationTest } from "./ConvertKitIntegrationTest";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { ArrowLeft, ExternalLink, Settings } from "lucide-react";

interface ConvertKitTestPageProps {
  onNavigateBack?: () => void;
  onNavigateToAdmin?: () => void;
}

export function ConvertKitTestPage({ onNavigateBack, onNavigateToAdmin }: ConvertKitTestPageProps) {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            {onNavigateBack && (
              <Button
                onClick={onNavigateBack}
                variant="outline"
                className="btn-standard"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            )}
            
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900">ConvertKit Integration Testing</h1>
              <p className="text-gray-600 mt-1">
                Test and validate your ConvertKit email marketing integration
              </p>
            </div>
            
            {onNavigateToAdmin && (
              <Button
                onClick={onNavigateToAdmin}
                variant="outline"
                className="btn-standard"
              >
                <Settings className="w-4 h-4 mr-2" />
                Admin Dashboard
              </Button>
            )}
          </div>
          
          <div className="flex gap-2">
            <Badge variant="outline">Production Testing</Badge>
            <Badge variant="outline">Email Marketing</Badge>
            <Badge variant="outline">ConvertKit Integration</Badge>
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Integration Status</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Check if ConvertKit is properly configured and connected to your waitlist system.
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Email Sync Test</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Verify that emails are synchronized between Supabase and ConvertKit when users join the waitlist.
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Production Ready</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                This test uses real API endpoints and will create actual records in your systems.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Test Component */}
        <ConvertKitIntegrationTest />

        {/* Documentation */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-lg">ConvertKit Setup Documentation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <h4 className="font-medium">Required Environment Variables:</h4>
              <div className="bg-gray-100 p-3 rounded-lg">
                <code className="text-sm">
                  CONVERTER_KIT_API_KEY=your_convertkit_api_key_here
                </code>
              </div>
              <p className="text-sm text-gray-600">
                Your ConvertKit API key should be uploaded via the Supabase secret manager.
              </p>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-medium">Form Configuration:</h4>
              <p className="text-sm text-gray-600">
                The integration uses ConvertKit Form ID: <code className="bg-gray-100 px-1 rounded">293a519eba</code>
              </p>
              <p className="text-sm text-gray-600">
                This matches your ConvertKit script: <code className="bg-gray-100 px-1 rounded">healthscan.kit.com/293a519eba/index.js</code>
              </p>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-medium">What Happens During Integration:</h4>
              <ul className="text-sm text-gray-600 space-y-1 ml-4">
                <li>• User enters email in your waitlist form</li>
                <li>• Email is saved to your Supabase database</li>
                <li>• Simultaneously, email is subscribed to ConvertKit form</li>
                <li>• ConvertKit tags are applied based on user status (new, referred, etc.)</li>
                <li>• Custom fields are updated with waitlist position and metadata</li>
                <li>• If ConvertKit fails, the user is still added to your local waitlist</li>
              </ul>
            </div>

            <div className="flex gap-2 pt-4">
              <Button variant="outline" className="btn-standard" asChild>
                <a href="https://help.convertkit.com/en/articles/2502552-getting-started-convertkit-api" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  ConvertKit API Docs
                </a>
              </Button>
              <Button variant="outline" className="btn-standard" asChild>
                <a href="https://app.convertkit.com/account_settings/advanced_settings" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Get API Key
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}