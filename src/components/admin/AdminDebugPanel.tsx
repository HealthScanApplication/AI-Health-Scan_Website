import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Bug, X, Trash2, ChevronDown, ChevronUp, AlertCircle, Info, AlertTriangle, Copy, Check } from 'lucide-react';

interface LogEntry {
  id: number;
  level: 'log' | 'warn' | 'error' | 'info' | 'network';
  message: string;
  timestamp: Date;
  details?: string;
}

let logIdCounter = 0;

export function AdminDebugPanel() {
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState<'all' | 'error' | 'warn' | 'network'>('all');
  const [copied, setCopied] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const addLog = useCallback((level: LogEntry['level'], args: any[], details?: string) => {
    const message = args.map(a => {
      if (typeof a === 'string') return a;
      try { return JSON.stringify(a, null, 0); } catch { return String(a); }
    }).join(' ');

    // Only capture admin-related or error logs to avoid noise
    const isAdmin = message.includes('[Admin') || message.includes('[Storage');
    const isError = level === 'error' || level === 'warn';
    const isNetwork = level === 'network';
    if (!isAdmin && !isError && !isNetwork) return;

    setLogs(prev => {
      const entry: LogEntry = { id: ++logIdCounter, level, message: message.slice(0, 500), timestamp: new Date(), details };
      const next = [...prev, entry];
      return next.length > 200 ? next.slice(-200) : next;
    });
  }, []);

  useEffect(() => {
    const origLog = console.log;
    const origWarn = console.warn;
    const origError = console.error;
    const origInfo = console.info;

    console.log = (...args: any[]) => { origLog.apply(console, args); addLog('log', args); };
    console.warn = (...args: any[]) => { origWarn.apply(console, args); addLog('warn', args); };
    console.error = (...args: any[]) => { origError.apply(console, args); addLog('error', args); };
    console.info = (...args: any[]) => { origInfo.apply(console, args); addLog('info', args); };

    // Intercept fetch to log network requests
    const origFetch = window.fetch;
    window.fetch = async (...args: Parameters<typeof fetch>) => {
      const url = typeof args[0] === 'string' ? args[0] : (args[0] as Request).url;
      const method = (args[1]?.method || 'GET').toUpperCase();
      // Only log admin/storage API calls
      if (url.includes('make-server') || url.includes('storage/v1')) {
        const shortUrl = url.replace(/https:\/\/[^/]+/, '');
        try {
          const res = await origFetch.apply(window, args);
          const status = res.status;
          const lvl = status >= 400 ? 'error' : 'network';
          addLog(lvl as LogEntry['level'], [`${method} ${shortUrl} → ${status}`]);
          return res;
        } catch (err: any) {
          addLog('error', [`${method} ${shortUrl} → FAILED: ${err.message}`]);
          throw err;
        }
      }
      return origFetch.apply(window, args);
    };

    return () => {
      console.log = origLog;
      console.warn = origWarn;
      console.error = origError;
      console.info = origInfo;
      window.fetch = origFetch;
    };
  }, [addLog]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current && open && !minimized) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, open, minimized]);

  const filtered = filter === 'all' ? logs : logs.filter(l => l.level === filter);
  const errorCount = logs.filter(l => l.level === 'error').length;

  const levelIcon = (level: LogEntry['level']) => {
    switch (level) {
      case 'error': return <AlertCircle className="w-3 h-3 text-red-500 shrink-0" />;
      case 'warn': return <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0" />;
      case 'network': return <Info className="w-3 h-3 text-blue-500 shrink-0" />;
      default: return <Info className="w-3 h-3 text-gray-400 shrink-0" />;
    }
  };

  const levelColor = (level: LogEntry['level']) => {
    switch (level) {
      case 'error': return 'text-red-600 bg-red-50';
      case 'warn': return 'text-amber-700 bg-amber-50';
      case 'network': return 'text-blue-700 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-4 left-4 z-50 flex items-center gap-1.5 px-3 py-2 rounded-full bg-gray-900 text-white text-xs font-medium shadow-lg hover:bg-gray-800 transition-colors"
        title="Open Admin Debug Panel"
      >
        <Bug className="w-3.5 h-3.5" />
        Debug
        {errorCount > 0 && (
          <span className="ml-1 px-1.5 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-bold leading-none">
            {errorCount}
          </span>
        )}
      </button>
    );
  }

  return (
    <div
      className={`fixed bottom-4 left-4 z-50 bg-gray-900 text-gray-100 rounded-xl shadow-2xl border border-gray-700 overflow-hidden transition-all ${
        minimized ? 'w-64' : 'w-[480px]'
      }`}
      style={minimized ? { maxHeight: '40px' } : { maxHeight: '360px' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-gray-800 border-b border-gray-700 cursor-pointer select-none"
        onClick={() => setMinimized(!minimized)}
      >
        <div className="flex items-center gap-2">
          <Bug className="w-3.5 h-3.5 text-green-400" />
          <span className="text-xs font-semibold">Admin Debug</span>
          <span className="text-[10px] text-gray-400">{logs.length} logs</span>
          {errorCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400 text-[10px] font-bold leading-none">
              {errorCount} errors
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button onClick={(e) => {
            e.stopPropagation();
            const text = logs.map(l => `[${l.timestamp.toLocaleTimeString('en-GB', { hour12: false })}] [${l.level.toUpperCase()}] ${l.message}`).join('\n');
            navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); });
          }} className="p-1 hover:bg-gray-700 rounded" title="Copy all logs">
            {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3 text-gray-400" />}
          </button>
          <button onClick={(e) => { e.stopPropagation(); setLogs([]); }} className="p-1 hover:bg-gray-700 rounded" title="Clear logs">
            <Trash2 className="w-3 h-3 text-gray-400" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); setMinimized(!minimized); }} className="p-1 hover:bg-gray-700 rounded" title={minimized ? 'Expand panel' : 'Minimize panel'}>
            {minimized ? <ChevronUp className="w-3 h-3 text-gray-400" /> : <ChevronDown className="w-3 h-3 text-gray-400" />}
          </button>
          <button onClick={(e) => { e.stopPropagation(); setOpen(false); }} className="p-1 hover:bg-gray-700 rounded" title="Close debug panel">
            <X className="w-3 h-3 text-gray-400" />
          </button>
        </div>
      </div>

      {!minimized && (
        <>
          {/* Filters */}
          <div className="flex gap-1 px-3 py-1.5 border-b border-gray-700 bg-gray-850">
            {(['all', 'error', 'warn', 'network'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                  filter === f ? 'bg-gray-600 text-white' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'
                }`}
              >
                {f === 'all' ? 'All' : f === 'error' ? 'Errors' : f === 'warn' ? 'Warnings' : 'Network'}
              </button>
            ))}
          </div>

          {/* Log entries */}
          <div ref={scrollRef} className="overflow-y-auto max-h-[280px]">
            {filtered.length === 0 ? (
              <div className="px-3 py-6 text-center text-gray-500 text-xs">No logs yet</div>
            ) : (
              filtered.map(entry => (
                <div key={entry.id} className={`flex items-start gap-2 px-3 py-1.5 border-b border-gray-800 hover:bg-gray-800/50 ${levelColor(entry.level)}`}>
                  <div className="mt-0.5">{levelIcon(entry.level)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-mono leading-tight break-all">{entry.message}</p>
                    <p className="text-[9px] text-gray-500 mt-0.5">
                      {entry.timestamp.toLocaleTimeString('en-GB', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
