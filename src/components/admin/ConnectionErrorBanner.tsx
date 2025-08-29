import React from 'react'
import { Button } from '../ui/button'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface ConnectionErrorBannerProps {
  serverConnected: boolean
  lastFetchError: string | null
  loading: boolean
  onRetry: () => void
}

export function ConnectionErrorBanner({ 
  serverConnected, 
  lastFetchError, 
  loading, 
  onRetry 
}: ConnectionErrorBannerProps) {
  if (serverConnected || !lastFetchError) return null

  // Determine error type and provide appropriate messaging
  const getErrorMessage = () => {
    if (lastFetchError.includes('Authentication failed') || lastFetchError.includes('401')) {
      return {
        title: 'Authentication Required',
        description: 'Your admin session has expired. Please refresh the page to continue.',
        action: 'Refresh Page',
        actionFn: () => window.location.reload()
      }
    }
    
    if (lastFetchError.includes('Admin access denied') || lastFetchError.includes('403')) {
      return {
        title: 'Access Denied',
        description: 'You do not have admin permissions. Please contact support if you believe this is an error.',
        action: 'Contact Support',
        actionFn: () => window.open('mailto:support@healthscan.live', '_blank')
      }
    }
    
    if (lastFetchError.includes('timeout') || lastFetchError.includes('Network')) {
      return {
        title: 'Connection Issue',
        description: 'Unable to connect to the admin server. Please check your internet connection.',
        action: 'Retry',
        actionFn: onRetry
      }
    }
    
    return {
      title: 'Server Issue',
      description: 'The admin server is temporarily unavailable. Please try again in a few minutes.',
      action: 'Retry',
      actionFn: onRetry
    }
  }

  const errorInfo = getErrorMessage()

  return (
    <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
      <div className="flex items-start gap-2">
        <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-yellow-800 text-sm">{errorInfo.title}</h4>
          <p className="text-sm text-yellow-700 mt-1">{errorInfo.description}</p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <Button
            onClick={errorInfo.actionFn}
            variant="outline"
            size="sm"
            disabled={loading}
            className="h-8 text-xs bg-yellow-100 border-yellow-300 text-yellow-800 hover:bg-yellow-200"
          >
            <RefreshCw className={`h-3 w-3 mr-1 ${loading ? 'animate-spin' : ''}`} />
            {errorInfo.action}
          </Button>
        </div>
      </div>
    </div>
  )
}