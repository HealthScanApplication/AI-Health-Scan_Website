import React, { useState } from 'react'
import { Button } from '../ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { toast } from 'sonner'
import { ArrowUpDown, RefreshCw } from 'lucide-react'
import { projectId } from '../../utils/supabase/info'

interface QueuePositionMigrationProps {
  accessToken: string
  serverConnected: boolean
}

export function QueuePositionMigration({ accessToken, serverConnected }: QueuePositionMigrationProps) {
  const [migrating, setMigrating] = useState(false)
  const [migrationResult, setMigrationResult] = useState<any>(null)

  const handleMigration = async () => {
    setMigrating(true)
    setMigrationResult(null)
    
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ed0fe4c2/migrate-queue-positions`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          signal: AbortSignal.timeout(60000) // 60 second timeout for migrations
        }
      )

      const result = await response.json()
      
      if (response.ok) {
        setMigrationResult(result)
        toast.success(`Migration completed! ${result.migratedCount} entries updated.`)
      } else {
        throw new Error(result.error || 'Migration failed')
      }
    } catch (error: any) {
      console.error('❌ Queue position migration error:', error)
      toast.error(`Migration failed: ${error.message}`)
    } finally {
      setMigrating(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <ArrowUpDown className="h-5 w-5 text-blue-600" />
          <CardTitle className="text-lg">Queue Position Migration</CardTitle>
        </div>
        <CardDescription className="text-sm">
          Migrate existing waitlist entries to use proper chronological queue positions.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <h4 className="font-medium text-yellow-800 mb-2 text-sm">⚠️ Migration Information</h4>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• Reassign positions based on signup date order</li>
            <li>• Earlier signups get lower queue numbers</li>
            <li>• Process maintains all other user data</li>
            <li>• Ensures consistent queue positions</li>
          </ul>
        </div>

        {migrationResult && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <h4 className="font-medium text-green-800 mb-2 text-sm">✅ Migration Complete</h4>
            <div className="text-sm text-green-700 space-y-1">
              <p>• Total entries: {migrationResult.totalEntries}</p>
              <p>• Updated: {migrationResult.migratedCount}</p>
              <p>• Max position: #{migrationResult.maxPosition}</p>
            </div>
          </div>
        )}

        <Button 
          onClick={handleMigration} 
          disabled={migrating || !serverConnected}
          className="w-full h-12 btn-standard"
        >
          {migrating ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Migrating...
            </>
          ) : (
            <>
              <ArrowUpDown className="h-4 w-4 mr-2" />
              Migrate Queue Positions
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}