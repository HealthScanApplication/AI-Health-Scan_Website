import { Card } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { Settings, ExternalLink, Info, AlertCircle } from 'lucide-react';
import { SETUP_STEPS } from '../../constants/googleSheetsConstants';

const colorClasses = {
  green: "border-green-500",
  blue: "border-blue-500", 
  purple: "border-purple-500",
  orange: "border-orange-500"
};

const textColorClasses = {
  green: "text-green-700",
  blue: "text-blue-700",
  purple: "text-purple-700", 
  orange: "text-orange-700"
};

export function SetupInstructionsTab() {
  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Settings className="w-5 h-5" />
        Step-by-Step Setup Instructions (Optional)
      </h3>
      
      <Alert className="border-green-200 bg-green-50 mb-6">
        <Info className="w-4 h-4 text-green-600" />
        <AlertDescription className="text-green-800">
          <strong>Note:</strong> Google Sheets integration is completely optional. The email capture and waitlist system works perfectly without any Google Sheets setup. This is purely for external backup and data export convenience.
        </AlertDescription>
      </Alert>
      
      <div className="space-y-6">
        {SETUP_STEPS.map((step) => (
          <div key={step.id} className={`border-l-4 ${colorClasses[step.color as keyof typeof colorClasses]} pl-4 space-y-2`}>
            <h4 className={`font-semibold ${textColorClasses[step.color as keyof typeof textColorClasses]}`}>
              Step {step.id}: {step.title}
            </h4>
            <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600 ml-4">
              {step.steps.map((stepItem, index) => (
                <li key={index}>
                  {typeof stepItem === 'string' ? (
                    stepItem
                  ) : (
                    <a 
                      href={stepItem.link} 
                      target="_blank" 
                      className="text-blue-600 hover:underline inline-flex items-center gap-1"
                    >
                      {stepItem.text} <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </li>
              ))}
            </ol>
            
            {step.id === 4 && (
              <Alert className="mt-3">
                <Info className="w-4 h-4" />
                <AlertDescription>
                  The Spreadsheet ID is the long string in the Google Sheets URL between "/d/" and "/edit". 
                  For example: docs.google.com/spreadsheets/d/<strong>SPREADSHEET_ID_HERE</strong>/edit
                </AlertDescription>
              </Alert>
            )}
          </div>
        ))}
      </div>

      <Alert className="border-amber-200 bg-amber-50 mt-6">
        <AlertCircle className="w-4 h-4 text-amber-600" />
        <AlertDescription className="text-amber-800">
          <strong>Security:</strong> If you choose to set up Google Sheets, keep your API key secure and never share it publicly. 
          The API key will be stored as an environment variable in your Supabase project.
        </AlertDescription>
      </Alert>
    </Card>
  );
}