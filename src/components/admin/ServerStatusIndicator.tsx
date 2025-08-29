import React from 'react'

interface ServerStatusIndicatorProps {
  serverConnected: boolean
}

export function ServerStatusIndicator({ serverConnected }: ServerStatusIndicatorProps) {
  return (
    <div className="flex items-center gap-2 text-xs">
      {serverConnected ? (
        <>
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-green-600 hidden sm:inline">Server Online</span>
        </>
      ) : (
        <>
          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
          <span className="text-red-600 hidden sm:inline">Server Issue</span>
        </>
      )}
    </div>
  )
}