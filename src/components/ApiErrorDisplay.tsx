import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Alert, AlertDescription } from './ui/alert'
import { Badge } from './ui/badge'
import { 
  AlertTriangle, 
  RefreshCw, 
  Server, 
  Wifi, 
  CheckCircle, 
  XCircle,
  Clock,
  Info
} from 'lucide-react'

interface ApiErrorDisplayProps {
  error?: any
  dataType?: string
  onRetry?: () => void
  loading?: boolean
  showDetails?: boolean
  context?: string
}

export function ApiErrorDisplay({ 
  error, 
  dataType = 'data', 
  onRetry, 
  loading = false,
  showDetails = false,
  context = 'loading'
}: ApiErrorDisplayProps) {
  
  const getErrorInfo = () => {
    if (!error) {
      return {
        type: 'info' as const,
        title: `No ${dataType} found`,
        description: `No ${dataType} data is available yet. This is normal for new installations.`,
        icon: Info,
        color: 'blue'
      }
    }

    if (error.details?.includes('404') || error.code === 404) {
      return {
        type: 'missing' as const,
        title: 'Endpoint Not Available',
        description: `The ${dataType} endpoint is not yet implemented. This feature will be available in a future update.`,
        icon: Server,
        color: 'yellow'
      }
    }

    if (error.details?.includes('500') || error.code === 500) {
      return {
        type: 'server' as const,
        title: 'Server Error',
        description: `The server encountered an error while processing ${dataType}. Please try again in a moment.`,
        icon: AlertTriangle,
        color: 'red'
      }
    }

    if (error.details?.includes('Network') || error.details?.includes('fetch')) {
      return {
        type: 'network' as const,
        title: 'Connection Issue',
        description: 'Unable to connect to the server. Please check your internet connection.',
        icon: Wifi,
        color: 'red'
      }
    }

    if (error.details?.includes('401') || error.details?.includes('403')) {
      return {
        type: 'auth' as const,
        title: 'Authentication Required',
        description: 'Your session has expired. Please refresh the page and sign in again.',
        icon: XCircle,
        color: 'red'
      }
    }

    return {
      type: 'unknown' as const,
      title: 'Unexpected Error',
      description: error.message || error.error || `An error occurred while ${context} ${dataType}.`,
      icon: AlertTriangle,
      color: 'red'
    }
  }

  const errorInfo = getErrorInfo()
  const IconComponent = errorInfo.icon

  const getColorClasses = () => {
    switch (errorInfo.color) {
      case 'blue':
        return 'border-blue-200 bg-blue-50 text-blue-800'
      case 'yellow':
        return 'border-yellow-200 bg-yellow-50 text-yellow-800'
      case 'red':
        return 'border-red-200 bg-red-50 text-red-800'
      default:
        return 'border-gray-200 bg-gray-50 text-gray-800'
    }
  }

  const getBadgeVariant = () => {
    switch (errorInfo.type) {
      case 'info':
        return 'secondary'
      case 'missing':
        return 'outline'
      case 'server':
      case 'network':
      case 'auth':
      case 'unknown':
        return 'destructive'
      default:
        return 'secondary'
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <IconComponent className={`w-5 h-5 ${
              errorInfo.color === 'red' ? 'text-red-600' :
              errorInfo.color === 'yellow' ? 'text-yellow-600' :
              errorInfo.color === 'blue' ? 'text-blue-600' :
              'text-gray-600'
            }`} />
            <div>
              <CardTitle className="text-lg">{errorInfo.title}</CardTitle>
              <CardDescription className="mt-1">
                {errorInfo.description}
              </CardDescription>
            </div>
          </div>
          <Badge variant={getBadgeVariant()}>
            {errorInfo.type === 'info' && 'Empty'}
            {errorInfo.type === 'missing' && 'Not Available'}
            {errorInfo.type === 'server' && 'Server Error'}
            {errorInfo.type === 'network' && 'Connection'}
            {errorInfo.type === 'auth' && 'Auth Required'}
            {errorInfo.type === 'unknown' && 'Error'}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Action buttons */}
        <div className="flex flex-wrap gap-2">
          {onRetry && (
            <Button 
              onClick={onRetry} 
              disabled={loading}
              variant="outline"
              size="sm"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Retrying...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Retry
                </>
              )}
            </Button>
          )}

          {errorInfo.type === 'auth' && (
            <Button 
              onClick={() => window.location.reload()}
              variant="default"
              size="sm"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh Page
            </Button>
          )}

          {errorInfo.type === 'missing' && (
            <Button 
              onClick={() => window.open('https://github.com/healthscan-live/feedback/issues', '_blank')}
              variant="outline"
              size="sm"
            >
              <Info className="w-4 h-4 mr-2" />
              Request Feature
            </Button>
          )}
        </div>

        {/* Detailed error information for development */}
        {showDetails && error && (
          <Alert className={getColorClasses()}>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2 text-xs">
                <div><strong>Error:</strong> {error.error}</div>
                {error.details && (
                  <div><strong>Details:</strong> {error.details}</div>
                )}
                {error.code && (
                  <div><strong>Code:</strong> {error.code}</div>
                )}
                {error.timestamp && (
                  <div><strong>Time:</strong> {new Date(error.timestamp).toLocaleString()}</div>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Helpful guidance */}
        {errorInfo.type === 'missing' && (
          <Alert className="border-blue-200 bg-blue-50">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <div className="space-y-2 text-sm">
                <p><strong>What this means:</strong></p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>This feature is planned but not yet implemented</li>
                  <li>The application will work normally without it</li>
                  <li>You can continue using other features</li>
                </ul>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {errorInfo.type === 'server' && (
          <Alert className="border-orange-200 bg-orange-50">
            <Clock className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              <div className="space-y-2 text-sm">
                <p><strong>Troubleshooting steps:</strong></p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Wait a moment and try again</li>
                  <li>Check if other features are working</li>
                  <li>Contact support if the issue persists</li>
                </ul>
              </div>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}

// Enhanced loading state component
export function ApiLoadingDisplay({ 
  dataType = 'data',
  message = 'Loading...'
}: {
  dataType?: string
  message?: string
}) {
  return (
    <Card className="w-full">
      <CardContent className="flex items-center justify-center py-8">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <RefreshCw className="w-8 h-8 text-[var(--healthscan-green)] animate-spin" />
          </div>
          <div>
            <p className="font-medium text-gray-900">Loading {dataType}...</p>
            <p className="text-sm text-gray-600 mt-1">{message}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Success state component
export function ApiSuccessDisplay({ 
  dataType = 'data',
  count = 0,
  message
}: {
  dataType?: string
  count?: number
  message?: string
}) {
  return (
    <Alert className="border-green-200 bg-green-50">
      <CheckCircle className="h-4 w-4 text-green-600" />
      <AlertDescription className="text-green-800">
        <div className="flex items-center justify-between">
          <span>
            {message || `Successfully loaded ${count} ${dataType}${count !== 1 ? 's' : ''}`}
          </span>
          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
            {count} items
          </Badge>
        </div>
      </AlertDescription>
    </Alert>
  )
}