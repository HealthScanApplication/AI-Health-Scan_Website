import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Alert, AlertDescription } from '../ui/alert';
import { Badge } from '../ui/badge';
import { Key, Copy, Eye, EyeOff, Database, Info } from 'lucide-react';
import { SHEET_HEADERS } from '../../constants/googleSheetsConstants';
import { copyToClipboard } from '../../utils/googleSheetsHelpers';

interface ConfigurationTabProps {
  apiKey: string;
  setApiKey: (value: string) => void;
  spreadsheetId: string;
  setSpreadsheetId: (value: string) => void;
  showApiKey: boolean;
  setShowApiKey: (value: boolean) => void;
}

export function ConfigurationTab({
  apiKey,
  setApiKey,
  spreadsheetId,
  setSpreadsheetId,
  showApiKey,
  setShowApiKey
}: ConfigurationTabProps) {
  return (
    <div className="space-y-4">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Key className="w-5 h-5" />
          Configuration Details
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Google Sheets API Key
            </label>
            <div className="relative">
              <Input
                type={showApiKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your Google Sheets API key..."
                className="pr-20"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="p-1 h-8 w-8"
                >
                  {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
                {apiKey && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(apiKey)}
                    className="p-1 h-8 w-8"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              This should start with "AIza..." and be about 39 characters long
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Google Spreadsheet ID
            </label>
            <div className="relative">
              <Input
                type="text"
                value={spreadsheetId}
                onChange={(e) => setSpreadsheetId(e.target.value)}
                placeholder="Enter your Google Spreadsheet ID..."
                className="pr-10"
              />
              {spreadsheetId && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(spreadsheetId)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 h-8 w-8"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Found in your Google Sheet URL between "/d/" and "/edit"
            </p>
          </div>

          <Alert className="border-blue-200 bg-blue-50">
            <Info className="w-4 h-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              These values need to be set as environment variables in your Supabase project:
              <br />
              • <code className="bg-white px-1 rounded">GOOGLE_SHEETS_API_KEY</code>
              <br />
              • <code className="bg-white px-1 rounded">GOOGLE_SHEETS_SPREADSHEET_ID</code>
            </AlertDescription>
          </Alert>
        </div>
      </Card>

      <Card className="p-6 bg-gray-50">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Database className="w-5 h-5" />
          Expected Sheet Structure
        </h3>
        
        <p className="text-sm text-gray-600 mb-3">
          Your Google Sheet will automatically be initialized with these headers:
        </p>
        
        <div className="bg-white p-4 rounded border">
          <div className="grid grid-cols-4 gap-2 text-xs">
            {SHEET_HEADERS.map((header, index) => (
              <Badge key={index} variant="outline">{header}</Badge>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}