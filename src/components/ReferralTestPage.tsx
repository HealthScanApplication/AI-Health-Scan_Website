"use client";

import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { useReferral, ReferralUtils } from "../hooks/useReferral";
import { UniversalWaitlist } from "./UniversalWaitlist";
import { toast } from "sonner@2.0.3";

export function ReferralTestPage() {
  const [testReferralCode, setTestReferralCode] = useState("");
  const [manualTestUrl, setManualTestUrl] = useState("");
  const { referralCode, hasReferral, isActive } = useReferral();
  
  // Generate a test referral URL
  const generateTestUrl = () => {
    const baseUrl = window.location.origin + window.location.pathname;
    const testCode = testReferralCode || `test_${Date.now().toString().slice(-6)}`;
    return `${baseUrl}?ref=${testCode}`;
  };

  // Test referral code setting
  const testSetReferralCode = () => {
    if (!testReferralCode) {
      toast.error("Please enter a test referral code first");
      return;
    }
    
    ReferralUtils.setPendingReferral(testReferralCode);
    window.dispatchEvent(new CustomEvent('referralStatusChanged'));
    toast.success(`Set test referral code: ${testReferralCode}`);
  };

  // Clear referral data
  const clearReferralData = () => {
    ReferralUtils.clearPendingReferral();
    localStorage.removeItem('healthscan_user_email');
    localStorage.removeItem('healthscan_referral_code');
    localStorage.removeItem('healthscan_user_position');
    localStorage.removeItem('healthscan_signup_date');
    window.dispatchEvent(new CustomEvent('referralStatusChanged'));
    toast.success("Cleared all referral data");
  };

  // Copy URL to clipboard
  const copyTestUrl = async () => {
    try {
      await navigator.clipboard.writeText(generateTestUrl());
      toast.success("Test URL copied to clipboard!");
    } catch (error) {
      toast.error("Failed to copy URL");
    }
  };

  // Navigate to URL with ref parameter
  const navigateToTestUrl = () => {
    if (!manualTestUrl) {
      toast.error("Please enter a test URL first");
      return;
    }
    
    try {
      const url = new URL(manualTestUrl);
      window.location.href = url.toString();
    } catch (error) {
      toast.error("Invalid URL format");
    }
  };

  // Check localStorage data
  const checkLocalStorageData = () => {
    const data = {
      pendingReferral: localStorage.getItem('healthscan_pending_referral'),
      referralTimestamp: localStorage.getItem('healthscan_referral_timestamp'),
      userEmail: localStorage.getItem('healthscan_user_email'),
      userReferralCode: localStorage.getItem('healthscan_referral_code'),
      userPosition: localStorage.getItem('healthscan_user_position'),
      signupDate: localStorage.getItem('healthscan_signup_date'),
      localUsers: localStorage.getItem('healthscan_local_users')
    };
    
    console.log('📊 Current localStorage data:', data);
    toast.success("Check console for localStorage data");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">
            Referral System Test Page
          </h1>
          <p className="text-lg text-gray-600">
            Test and debug the HealthScan referral system functionality
          </p>
        </div>

        {/* Current Referral Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              📊 Current Referral Status
            </CardTitle>
            <CardDescription>
              Live status from the useReferral hook
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg">
                <div className="text-sm font-medium text-gray-500">Has Referral</div>
                <div className={`text-lg font-semibold ${hasReferral ? 'text-green-600' : 'text-gray-400'}`}>
                  {hasReferral ? '✅ Yes' : '❌ No'}
                </div>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="text-sm font-medium text-gray-500">Is Active</div>
                <div className={`text-lg font-semibold ${isActive ? 'text-green-600' : 'text-gray-400'}`}>
                  {isActive ? '🟢 Active' : '🔴 Inactive'}
                </div>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="text-sm font-medium text-gray-500">Referral Code</div>
                <div className="text-lg font-semibold text-blue-600">
                  {referralCode || 'None'}
                </div>
              </div>
            </div>
            
            <Button onClick={checkLocalStorageData} variant="outline" className="w-full">
              🔍 Check localStorage Data (See Console)
            </Button>
          </CardContent>
        </Card>

        {/* Referral Testing Tools */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🧪 Referral Testing Tools
            </CardTitle>
            <CardDescription>
              Tools to test different referral scenarios
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Generate Test URL */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-700">
                Generate Test Referral URL
              </label>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter test referral code (optional)"
                  value={testReferralCode}
                  onChange={(e) => setTestReferralCode(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={copyTestUrl} variant="outline">
                  📋 Copy URL
                </Button>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-600 break-all">
                {generateTestUrl()}
              </div>
            </div>

            {/* Manual URL Test */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-700">
                Test with Manual URL
              </label>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter full URL with ?ref=code parameter"
                  value={manualTestUrl}
                  onChange={(e) => setManualTestUrl(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={navigateToTestUrl} variant="outline">
                  🔗 Navigate
                </Button>
              </div>
            </div>

            {/* Manual Referral Code Setting */}
            <div className="flex gap-2">
              <Button onClick={testSetReferralCode} className="flex-1">
                🎯 Set Test Referral Code
              </Button>
              <Button onClick={clearReferralData} variant="destructive" className="flex-1">
                🗑️ Clear All Data
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Test Waitlist Component */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              📝 Test Waitlist Component
            </CardTitle>
            <CardDescription>
              Test the referral integration with the waitlist signup
            </CardDescription>
          </CardHeader>
          <CardContent>
            <UniversalWaitlist 
              onSignupSuccess={() => {
                toast.success("🎉 Signup successful! Check referral status above.");
              }}
              placeholder="Test email for referral system"
            />
          </CardContent>
        </Card>

        {/* How to Test */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              📖 How to Test the Referral System
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm">
              <div className="border-l-4 border-blue-500 pl-4">
                <h3 className="font-semibold mb-2">Testing Steps:</h3>
                <ol className="space-y-1 list-decimal list-inside">
                  <li>Clear all data using the "Clear All Data" button</li>
                  <li>Generate a test URL or manually enter one with a ?ref=code parameter</li>
                  <li>Navigate to the URL (opens in same tab)</li>
                  <li>Check that the referral status shows as active</li>
                  <li>Enter an email in the waitlist form and submit</li>
                  <li>Verify that the referral success message appears</li>
                  <li>Check that the referral status becomes inactive after signup</li>
                </ol>
              </div>
              
              <div className="border-l-4 border-yellow-500 pl-4">
                <h3 className="font-semibold mb-2">Expected Behavior:</h3>
                <ul className="space-y-1 list-disc list-inside">
                  <li>URL parameters should be captured and stored in localStorage</li>
                  <li>URL should be cleaned (parameter removed) after capture</li>
                  <li>Referral banner should appear when active</li>
                  <li>Referral code should be sent to server during signup</li>
                  <li>Success message should mention referral when used</li>
                  <li>Referral should become inactive after successful signup</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}