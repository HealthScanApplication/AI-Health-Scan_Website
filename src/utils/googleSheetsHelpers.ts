import { toast } from "sonner@2.0.3";
import { projectId, publicAnonKey } from '../utils/supabase/info';

export interface TestResult {
  success: boolean;
  connection?: any;
  initialization?: any;
  recentSignups?: any;
  error?: string;
  details?: string;
}

export const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text);
  toast.success('Copied to clipboard!');
};

export const testGoogleSheetsConnection = async (): Promise<TestResult> => {
  try {
    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-ed0fe4c2/google-sheets-test`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const result = await response.json();

    if (result.success) {
      toast.success('✅ Google Sheets connection successful!');
    } else {
      toast.error('❌ Google Sheets connection failed');
    }

    return result;
  } catch (error) {
    console.error('Google Sheets test error:', error);
    const errorResult = {
      success: false,
      error: 'Connection test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    };
    toast.error('❌ Connection test failed');
    return errorResult;
  }
};