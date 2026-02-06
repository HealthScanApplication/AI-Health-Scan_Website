import React, { useState } from 'react'
import { Button } from '../ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { toast } from 'sonner'
import { List, ArrowUpDown, RefreshCw } from 'lucide-react'
import { projectId } from '../../utils/supabase/info'

interface QueueManagementProps {
  accessToken: string
  serverConnected: boolean
  onStatsUpdate: () => void
}

export function QueueManagement({ accessToken, serverConnected, onStatsUpdate }: QueueManagementProps) {
  const [recalculating, setRecalculating] = useState(false)
  const [recalculateResult, setRecalculateResult] = useState<any>(null)

  const handleRecalculatePositions = async () => {
    setRecalculating(true)
    setRecalculateResult(null)
    
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ed0fe4c2/recalculate-queue-positions`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          signal: AbortSignal.timeout(60000) // 60 second timeout for recalculation
        }
      )

      const result = await response.json()
      
      if (response.ok) {
        setRecalculateResult(result)
        toast.success(`Queue positions recalculated! ${result.updated} entries updated.`)
        onStatsUpdate() // Refresh stats
      } else {
        throw new Error(result.error || 'Recalculation failed')
      }
    } catch (error: any) {
      console.error('❌ Queue position recalculation error:', error)
      toast.error(`Recalculation failed: ${error.message}`)
    } finally {
      setRecalculating(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <List className="h-5 w-5 text-green-600" />
          <CardTitle className="text-lg">Queue Management</CardTitle>
        </div>
        <CardDescription className="text-sm">
          Manage waitlist queue positions and ensure chronological order.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <h4 className="font-medium text-blue-800 mb-2 text-sm">📊 Queue Position System</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Positions assigned incrementally (1, 2, 3...)</li>
            <li>• Earlier signups get lower numbers</li>
            <li>• Referral boosts can move users up</li>
            <li>• Deletions auto-recalculate all positions</li>
          </ul>
        </div>

        {recalculateResult && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <h4 className="font-medium text-green-800 mb-2 text-sm">✅ Recalculation Complete</h4>
            <div className="text-sm text-green-700 space-y-1">
              <p>• Total processed: {recalculateResult.total}</p>
              <p>• Updated: {recalculateResult.updated}</p>
              <p>• Chronological order restored</p>
            </div>
          </div>
        )}

        <Button 
          onClick={handleRecalculatePositions} 
          disabled={recalculating || !serverConnected}
          className="w-full h-12 btn-standard bg-green-600 hover:bg-green-700 text-white"
        >
          {recalculating ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Recalculating...
            </>
          ) : (
            <>
              <ArrowUpDown className="h-4 w-4 mr-2" />
              Recalculate Queue Positions
            </>
          )}
        </Button>

        <div className="text-xs text-gray-500 space-y-1 p-2 bg-gray-50 rounded">
          <p className="font-medium">This operation will:</p>
          <p>• Sort all entries by signup date</p>
          <p>• Assign positions 1, 2, 3... chronologically</p>
          <p>• Update queue counter to match highest position</p>
        </div>
      </CardContent>
    </Card>
  )
}