import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, X } from 'lucide-react';

interface DebugData {
  auth: {
    user: any;
    session: any;
    isAuthenticated: boolean;
  };
  waitlist: {
    total: number;
    users: any[];
    lastFetch: string;
  };
  logs: {
    messages: Array<{ timestamp: string; level: string; message: string }>;
  };
}

export function FloatingDebugMenu({ accessToken }: { accessToken?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [debugData, setDebugData] = useState<DebugData>({
    auth: { user: null, session: null, isAuthenticated: false },
    waitlist: { total: 0, users: [], lastFetch: '' },
    logs: { messages: [] }
  });
  const [activeTab, setActiveTab] = useState<'auth' | 'waitlist' | 'logs'>('auth');

  useEffect(() => {
    const fetchDebugData = async () => {
      try {
        // Get auth data from localStorage
        const authData = localStorage.getItem('sb-ljqlvvbktgiflkxywsld-auth-token');
        const sessionData = localStorage.getItem('sb-ljqlvvbktgiflkxywsld-auth-session');
        
        // Fetch waitlist data if access token is available
        let waitlistData = [];
        if (accessToken) {
          const response = await fetch(
            'https://ljqlvvbktgiflkxywsld.functions.supabase.co/make-server-ed0fe4c2/admin/waitlist',
            {
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
              }
            }
          );
          if (response.ok) {
            waitlistData = await response.json();
          }
        }

        setDebugData({
          auth: {
            user: authData ? JSON.parse(authData) : null,
            session: sessionData ? JSON.parse(sessionData) : null,
            isAuthenticated: !!authData
          },
          waitlist: {
            total: waitlistData.length,
            users: waitlistData,
            lastFetch: new Date().toISOString()
          },
          logs: {
            messages: [
              { timestamp: new Date().toISOString(), level: 'info', message: 'Debug menu initialized' }
            ]
          }
        });
      } catch (error) {
        console.error('Error fetching debug data:', error);
      }
    };

    if (isOpen) {
      fetchDebugData();
      const interval = setInterval(fetchDebugData, 5000);
      return () => clearInterval(interval);
    }
  }, [isOpen, accessToken]);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 bg-purple-600 hover:bg-purple-700 text-white rounded-full p-3 shadow-lg z-50 transition-all"
        title="Open debug menu"
      >
        🐛
      </button>
    );
  }

  return (
    <div className={`fixed bottom-4 right-4 bg-gray-900 text-white rounded-lg shadow-2xl z-50 transition-all ${isMinimized ? 'w-64' : 'w-96'}`}>
      {/* Header */}
      <div className="flex items-center justify-between bg-purple-600 p-3 rounded-t-lg">
        <h3 className="font-bold text-sm">🐛 Debug Menu</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="hover:bg-purple-700 p-1 rounded transition-all"
            title={isMinimized ? 'Expand' : 'Minimize'}
          >
            {isMinimized ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="hover:bg-purple-700 p-1 rounded transition-all"
            title="Close"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Tabs */}
          <div className="flex border-b border-gray-700">
            <button
              onClick={() => setActiveTab('auth')}
              className={`flex-1 px-3 py-2 text-xs font-medium transition-all ${
                activeTab === 'auth'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              Auth
            </button>
            <button
              onClick={() => setActiveTab('waitlist')}
              className={`flex-1 px-3 py-2 text-xs font-medium transition-all ${
                activeTab === 'waitlist'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              Waitlist ({debugData.waitlist.total})
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className={`flex-1 px-3 py-2 text-xs font-medium transition-all ${
                activeTab === 'logs'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              Logs
            </button>
          </div>

          {/* Content */}
          <div className="p-3 max-h-96 overflow-y-auto bg-gray-800">
            {activeTab === 'auth' && (
              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-purple-400 font-bold">Authenticated:</span>
                  <span className={debugData.auth.isAuthenticated ? 'text-green-400' : 'text-red-400'}>
                    {' '}{debugData.auth.isAuthenticated ? '✓ Yes' : '✗ No'}
                  </span>
                </div>
                {debugData.auth.user && (
                  <div>
                    <span className="text-purple-400 font-bold">User:</span>
                    <pre className="bg-gray-900 p-2 rounded mt-1 overflow-x-auto text-gray-300">
                      {JSON.stringify(debugData.auth.user, null, 2).substring(0, 500)}...
                    </pre>
                  </div>
                )}
                {!debugData.auth.user && (
                  <div className="text-gray-400">No auth data available</div>
                )}
              </div>
            )}

            {activeTab === 'waitlist' && (
              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-purple-400 font-bold">Total Users:</span>
                  <span className="text-green-400 ml-2">{debugData.waitlist.total}</span>
                </div>
                <div>
                  <span className="text-purple-400 font-bold">Last Fetch:</span>
                  <span className="text-gray-400 ml-2 text-xs">
                    {new Date(debugData.waitlist.lastFetch).toLocaleTimeString()}
                  </span>
                </div>
                {debugData.waitlist.users.length > 0 && (
                  <div>
                    <span className="text-purple-400 font-bold block mb-2">Recent Users:</span>
                    <div className="space-y-1 max-h-48 overflow-y-auto">
                      {debugData.waitlist.users.slice(0, 10).map((user: any, idx: number) => (
                        <div key={idx} className="bg-gray-900 p-2 rounded text-gray-300">
                          <div>📧 {user.email}</div>
                          <div className="text-gray-500">Position: #{user.position}</div>
                          <div className="text-gray-500">Emails Sent: {user.emailsSent || 0}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'logs' && (
              <div className="space-y-2 text-xs max-h-48 overflow-y-auto">
                {debugData.logs.messages.length > 0 ? (
                  debugData.logs.messages.map((log, idx) => (
                    <div key={idx} className="bg-gray-900 p-2 rounded">
                      <div className="text-gray-500">{new Date(log.timestamp).toLocaleTimeString()}</div>
                      <div className={log.level === 'error' ? 'text-red-400' : 'text-green-400'}>
                        [{log.level.toUpperCase()}] {log.message}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-gray-400">No logs available</div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-800 border-t border-gray-700 p-2 text-xs text-gray-500">
            Auto-refresh: 5s
          </div>
        </>
      )}
    </div>
  );
}
