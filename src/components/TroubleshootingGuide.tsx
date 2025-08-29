import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { 
  AlertTriangle, 
  CheckCircle, 
  Info, 
  Server,
  Database,
  Globe,
  Key,
  RefreshCw,
  ExternalLink
} from 'lucide-react';

interface TroubleshootingStep {
  step: number;
  title: string;
  description: string;
  commands?: string[];
  links?: { text: string; url: string }[];
}

interface TroubleshootingGuideProps {
  error?: string;
}

export function TroubleshootingGuide({ error }: TroubleshootingGuideProps) {
  const commonSteps: TroubleshootingStep[] = [
    {
      step: 1,
      title: "Check Environment Variables",
      description: "Ensure your Supabase configuration is properly set up in the environment.",
      commands: [
        "Verify SUPABASE_URL is set correctly",
        "Verify SUPABASE_ANON_KEY is set correctly",
        "Check that environment variables are available in the runtime"
      ]
    },
    {
      step: 2,
      title: "Verify Supabase Edge Function Deployment",
      description: "Make sure your server Edge Function is deployed and running on Supabase.",
      links: [
        { text: "Deploy Edge Functions", url: "https://supabase.com/docs/guides/functions/deploy" },
        { text: "Debug Edge Functions", url: "https://supabase.com/docs/guides/functions/debugging" }
      ]
    },
    {
      step: 3,
      title: "Check Network Connectivity",
      description: "Test if you can reach the Supabase servers from your network.",
      commands: [
        "Try accessing Supabase dashboard in browser",
        "Check for firewall or proxy blocking requests",
        "Test with a different network if possible"
      ]
    },
    {
      step: 4,
      title: "Review Server Logs",
      description: "Check the Edge Function logs for any errors or issues.",
      links: [
        { text: "View Function Logs", url: `https://supabase.com/dashboard/project/${window.location.hostname.includes('supabase') ? 'your-project' : 'PROJECT_ID'}/logs/edge-functions` }
      ]
    }
  ];

  const errorSpecificSteps: Record<string, TroubleshootingStep[]> = {
    "Failed to fetch": [
      {
        step: 1,
        title: "Network Connection Issue",
        description: "This error typically indicates a network connectivity problem.",
        commands: [
          "Check your internet connection",
          "Verify the Supabase URL is correct",
          "Check if Edge Function is deployed and running",
          "Try refreshing the page"
        ]
      },
      {
        step: 2,
        title: "CORS Configuration",
        description: "Cross-Origin Resource Sharing (CORS) may be blocking the request.",
        commands: [
          "Verify CORS headers are set in the Edge Function",
          "Check if the request origin is allowed",
          "Ensure OPTIONS method is handled for preflight requests"
        ]
      }
    ],
    "TypeError": [
      {
        step: 1,
        title: "Code Error",
        description: "A TypeError suggests an issue with the JavaScript code itself.",
        commands: [
          "Check for undefined variables in the fetch call",
          "Verify URL construction is correct",
          "Check if projectId and publicAnonKey are properly imported"
        ]
      }
    ],
    "401": [
      {
        step: 1,
        title: "Authentication Error",
        description: "The server is rejecting the request due to invalid authentication.",
        commands: [
          "Verify the SUPABASE_ANON_KEY is correct",
          "Check if the key has expired",
          "Ensure Authorization header is formatted correctly"
        ]
      }
    ],
    "404": [
      {
        step: 1,
        title: "Endpoint Not Found",
        description: "The requested endpoint doesn't exist or isn't deployed.",
        commands: [
          "Verify the Edge Function is deployed",
          "Check the endpoint path is correct",
          "Ensure the function name matches the deployment"
        ]
      }
    ],
    "500": [
      {
        step: 1,
        title: "Server Error",
        description: "The Edge Function encountered an internal error.",
        commands: [
          "Check the Edge Function logs for error details",
          "Verify database connections are working",
          "Check for any missing dependencies or environment variables"
        ]
      }
    ]
  };

  const getErrorType = (errorMessage?: string): string => {
    if (!errorMessage) return "general";
    
    if (errorMessage.includes("Failed to fetch")) return "Failed to fetch";
    if (errorMessage.includes("TypeError")) return "TypeError";
    if (errorMessage.includes("401")) return "401";
    if (errorMessage.includes("404")) return "404";
    if (errorMessage.includes("500")) return "500";
    
    return "general";
  };

  const errorType = getErrorType(error);
  const specificSteps = errorSpecificSteps[errorType] || [];
  const allSteps = [...specificSteps, ...commonSteps];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Troubleshooting Guide</h2>
        <p className="text-gray-600">Steps to resolve common server connectivity issues</p>
      </div>

      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-500" />
          <AlertDescription className="text-red-800">
            <strong>Current Error:</strong> {error}
          </AlertDescription>
        </Alert>
      )}

      <Alert className="border-blue-200 bg-blue-50">
        <Info className="h-4 w-4 text-blue-500" />
        <AlertDescription className="text-blue-800">
          <strong>Quick Fix:</strong> Most fetch errors are resolved by ensuring your Supabase Edge Function is deployed and your environment variables are correctly configured.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6">
        {allSteps.map((step, index) => (
          <Card key={index} className="border-l-4 border-l-blue-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Badge variant="outline" className="bg-blue-100 text-blue-800">
                  Step {step.step}
                </Badge>
                {step.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 mb-4">{step.description}</p>
              
              {step.commands && (
                <div className="mb-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Action Items:</h4>
                  <ul className="space-y-1">
                    {step.commands.map((command, cmdIndex) => (
                      <li key={cmdIndex} className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{command}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {step.links && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Helpful Links:</h4>
                  <div className="space-y-1">
                    {step.links.map((link, linkIndex) => (
                      <a
                        key={linkIndex}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm"
                      >
                        <ExternalLink className="w-3 h-3" />
                        {link.text}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-800">
            <CheckCircle className="w-5 h-5" />
            Still Having Issues?
          </CardTitle>
        </CardHeader>
        <CardContent className="text-green-700">
          <p className="mb-3">If you're still experiencing problems after following these steps:</p>
          <ul className="space-y-2 list-disc list-inside">
            <li>Use the Server Diagnostic tab to get detailed error information</li>
            <li>Check the Edge Function logs in your Supabase dashboard</li>
            <li>Try deploying a fresh copy of the Edge Function</li>
            <li>Verify your Supabase project settings and API keys</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-blue-500" />
            Prevention Tips
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Server className="w-4 h-4 text-blue-500" />
                Server Monitoring
              </h4>
              <ul className="text-sm space-y-1 text-gray-600">
                <li>• Set up monitoring for your Edge Functions</li>
                <li>• Enable error logging and alerts</li>
                <li>• Regularly check function deployment status</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Key className="w-4 h-4 text-green-500" />
                Environment Management
              </h4>
              <ul className="text-sm space-y-1 text-gray-600">
                <li>• Keep environment variables secure and updated</li>
                <li>• Use environment-specific configurations</li>
                <li>• Test after any configuration changes</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}