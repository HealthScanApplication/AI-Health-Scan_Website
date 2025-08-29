import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Alert, AlertDescription } from '../ui/alert';
import { TestTube, Sheet, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { TEST_CHECKS } from '../../constants/googleSheetsConstants';
import { TestResult } from '../../utils/googleSheetsHelpers';

interface TestConnectionTabProps {
  isTestingConnection: boolean;
  testResult: TestResult | null;
  onTestConnection: () => void;
}

export function TestConnectionTab({
  isTestingConnection,
  testResult,
  onTestConnection
}: TestConnectionTabProps) {
  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <TestTube className="w-5 h-5" />
        Test Google Sheets Integration
      </h3>
      
      <div className="space-y-4">
        <div className="flex gap-4">
          <Button
            onClick={onTestConnection}
            disabled={isTestingConnection}
            className="flex items-center gap-2"
          >
            {isTestingConnection ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Sheet className="w-4 h-4" />
            )}
            Test Connection
          </Button>
        </div>

        {testResult && (
          <Card className={`p-4 ${testResult.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
            <div className="flex items-start gap-3">
              {testResult.success ? (
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
              )}
              <div className="flex-1">
                <h4 className={`font-semibold ${testResult.success ? 'text-green-800' : 'text-red-800'}`}>
                  {testResult.success ? 'Connection Successful!' : 'Connection Failed'}
                </h4>
                
                {testResult.success ? (
                  <div className="space-y-2 mt-2">
                    {testResult.connection?.info && (
                      <p className="text-sm text-green-700">
                        <strong>Sheet:</strong> {testResult.connection.info.title}
                      </p>
                    )}
                    {testResult.initialization?.success && (
                      <p className="text-sm text-green-700">
                        <CheckCircle className="w-3 h-3 inline mr-1" />
                        Sheet headers initialized successfully
                      </p>
                    )}
                    {testResult.recentSignups?.success && (
                      <p className="text-sm text-green-700">
                        <CheckCircle className="w-3 h-3 inline mr-1" />
                        Found {testResult.recentSignups.data?.length || 0} recent signups
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-1 mt-2">
                    <p className="text-sm text-red-700">
                      <strong>Error:</strong> {testResult.error}
                    </p>
                    {testResult.details && (
                      <p className="text-xs text-red-600">
                        {testResult.details}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </Card>
        )}

        <Alert className="border-blue-200 bg-blue-50">
          <Info className="w-4 h-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>What this test checks:</strong>
            <ul className="list-disc list-inside mt-2 space-y-1">
              {TEST_CHECKS.map((check, index) => (
                <li key={index}>{check}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      </div>
    </Card>
  );
}