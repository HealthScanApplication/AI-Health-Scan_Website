"use client";

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { FileSpreadsheet } from 'lucide-react';
import { SetupInstructionsTab } from './GoogleSheetsSetup/SetupInstructionsTab';
import { ConfigurationTab } from './GoogleSheetsSetup/ConfigurationTab';
import { TestConnectionTab } from './GoogleSheetsSetup/TestConnectionTab';
import { testGoogleSheetsConnection, TestResult } from '../utils/googleSheetsHelpers';

export function GoogleSheetsSetupGuide() {
  const [apiKey, setApiKey] = useState('');
  const [spreadsheetId, setSpreadsheetId] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);

  const handleTestConnection = async () => {
    setIsTestingConnection(true);
    setTestResult(null);

    const result = await testGoogleSheetsConnection();
    setTestResult(result);
    setIsTestingConnection(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-green-100 rounded-lg">
          <FileSpreadsheet className="w-5 h-5 text-green-600" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Google Sheets Integration</h2>
          <p className="text-sm text-gray-600">Save email signups automatically to Google Sheets</p>
        </div>
      </div>

      <Tabs defaultValue="setup" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="setup">Setup Guide</TabsTrigger>
          <TabsTrigger value="configure">Configure</TabsTrigger>
          <TabsTrigger value="test">Test Connection</TabsTrigger>
        </TabsList>

        <TabsContent value="setup" className="space-y-4">
          <SetupInstructionsTab />
        </TabsContent>

        <TabsContent value="configure" className="space-y-4">
          <ConfigurationTab
            apiKey={apiKey}
            setApiKey={setApiKey}
            spreadsheetId={spreadsheetId}
            setSpreadsheetId={setSpreadsheetId}
            showApiKey={showApiKey}
            setShowApiKey={setShowApiKey}
          />
        </TabsContent>

        <TabsContent value="test" className="space-y-4">
          <TestConnectionTab
            isTestingConnection={isTestingConnection}
            testResult={testResult}
            onTestConnection={handleTestConnection}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}