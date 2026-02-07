import { useMemo, useState } from 'react';

interface AdminRecord {
  id: string;
  scanned_at?: string;
  created_at?: string;
  status?: string;
  scan_type?: string;
  overall_score?: number;
  [key: string]: any;
}

interface ScanFunnelDashboardProps {
  records: AdminRecord[];
}

type Period = 'daily' | 'weekly' | 'monthly';
type DateRange = 'day' | 'week' | 'month' | 'year' | 'all';

function filterByDate(records: AdminRecord[], range: DateRange): AdminRecord[] {
  if (range === 'all') return records;
  const now = new Date();
  const cutoff = new Date();
  if (range === 'day') cutoff.setDate(now.getDate() - 1);
  else if (range === 'week') cutoff.setDate(now.getDate() - 7);
  else if (range === 'month') cutoff.setMonth(now.getMonth() - 1);
  else if (range === 'year') cutoff.setFullYear(now.getFullYear() - 1);
  return records.filter(r => {
    const d = new Date(r.scanned_at || r.created_at || '');
    return !isNaN(d.getTime()) && d >= cutoff;
  });
}

export function ScanFunnelDashboard({ records }: ScanFunnelDashboardProps) {
  const [period, setPeriod] = useState<Period>('weekly');
  const [range, setRange] = useState<DateRange>('all');

  const metrics = useMemo(() => {
    const filtered = filterByDate(records, range);
    const total = filtered.length;
    if (records.length === 0) return null;

    const now = new Date();
    const completed = filtered.filter(r => r.status === 'completed').length;
    const failed = filtered.filter(r => r.status === 'failed').length;
    const processing = filtered.filter(r => r.status === 'processing' || r.status === 'pending').length;
    const avgScore = completed > 0
      ? Math.round(filtered.filter(r => r.status === 'completed' && r.overall_score != null).reduce((s, r) => s + (r.overall_score || 0), 0) / completed)
      : 0;

    // Time-based grouping (uses ALL records for timeline, not filtered)
    const getDate = (r: AdminRecord) => new Date(r.scanned_at || r.created_at || '');
    const getPeriodKey = (d: Date): string => {
      if (period === 'daily') return d.toISOString().slice(0, 10);
      if (period === 'weekly') {
        const start = new Date(d);
        start.setDate(start.getDate() - start.getDay());
        return start.toISOString().slice(0, 10);
      }
      return d.toISOString().slice(0, 7); // monthly
    };

    // Group scans by period
    const grouped: Record<string, number> = {};
    records.forEach(r => {
      const d = getDate(r);
      if (isNaN(d.getTime())) return;
      const key = getPeriodKey(d);
      grouped[key] = (grouped[key] || 0) + 1;
    });

    const sortedKeys = Object.keys(grouped).sort();
    const currentKey = getPeriodKey(now);
    const prevKey = sortedKeys.length >= 2 ? sortedKeys[sortedKeys.length - 2] : null;
    const currentCount = grouped[currentKey] || 0;
    const prevCount = prevKey ? (grouped[prevKey] || 0) : 0;
    const growth = prevCount > 0 ? Math.round(((currentCount - prevCount) / prevCount) * 100) : (currentCount > 0 ? 100 : 0);

    // Scan type breakdown (from filtered)
    const types: Record<string, number> = {};
    filtered.forEach(r => {
      const t = r.scan_type || 'unknown';
      types[t] = (types[t] || 0) + 1;
    });
    const topType = Object.entries(types).sort((a, b) => b[1] - a[1])[0];

    // Build timeline bars (last 8 periods)
    const timelineKeys = sortedKeys.slice(-8);
    const maxInTimeline = Math.max(...timelineKeys.map(k => grouped[k] || 0), 1);

    return {
      total, completed, failed, processing, avgScore,
      currentCount, growth, period,
      topType,
      timeline: timelineKeys.map(k => ({ key: k, count: grouped[k] || 0, pct: ((grouped[k] || 0) / maxInTimeline) * 100 })),
    };
  }, [records, period, range]);

  if (!metrics) return null;

  const periodLabel = period === 'daily' ? 'Today' : period === 'weekly' ? 'This Week' : 'This Month';
  const growthColor = metrics.growth >= 0 ? 'text-green-600' : 'text-red-600';
  const growthArrow = metrics.growth >= 0 ? '↑' : '↓';

  return (
    <div className="space-y-3">
      {/* Header with date filter */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-gray-500">Scan Metrics</p>
        <div className="flex gap-0.5 bg-gray-100 rounded-lg p-0.5">
          {(['day', 'week', 'month', 'year', 'all'] as DateRange[]).map(r => (
            <button key={r} onClick={() => setRange(r)} className={`px-2 py-1 rounded-md text-[10px] font-medium transition-all ${range === r ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              {r === 'all' ? 'All' : r.charAt(0).toUpperCase() + r.slice(1)}
            </button>
          ))}
        </div>
      </div>
      {/* Summary cards */}
      <div className="grid grid-cols-6 gap-2">
        {[
          { label: 'Total Scans', value: metrics.total, max: Math.max(metrics.total, 10), color: 'bg-blue-500', sub: 'All time' },
          { label: 'Completed', value: metrics.completed, max: metrics.total || 1, color: 'bg-emerald-500', sub: `${metrics.total > 0 ? Math.round((metrics.completed / metrics.total) * 100) : 0}% success` },
          { label: 'Failed', value: metrics.failed, max: metrics.total || 1, color: 'bg-red-500', sub: `${metrics.total > 0 ? Math.round((metrics.failed / metrics.total) * 100) : 0}% of scans` },
          { label: 'Processing', value: metrics.processing, max: metrics.total || 1, color: 'bg-amber-500', sub: 'In progress' },
          { label: 'Avg Score', value: metrics.avgScore, max: 100, color: 'bg-violet-500', sub: 'Completed scans' },
          { label: 'Top Type', value: metrics.topType ? metrics.topType[1] : 0, max: metrics.total || 1, color: 'bg-indigo-500', sub: metrics.topType ? metrics.topType[0] : '—' },
        ].map((step) => {
          const pct = Math.min(100, Math.max(2, (step.value / step.max) * 100));
          return (
            <div key={step.label} className="bg-white rounded-xl border border-gray-200 p-3 flex flex-col justify-between min-h-[100px]">
              <div>
                <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider leading-tight">{step.label}</p>
                <p className="text-xl font-bold text-gray-900 mt-1 tabular-nums">{step.value.toLocaleString()}</p>
              </div>
              <div className="mt-2">
                <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${step.color} transition-all duration-500`} style={{ width: `${pct}%` }} />
                </div>
                <p className="text-[9px] text-gray-400 mt-1 leading-tight">{step.sub}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Timeline chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm font-semibold text-gray-900">Scan Activity</p>
            <p className="text-xs text-gray-400">
              {periodLabel}: <span className="font-medium text-gray-700">{metrics.currentCount}</span>
              {metrics.growth !== 0 && (
                <span className={`ml-1 ${growthColor}`}>{growthArrow} {Math.abs(metrics.growth)}%</span>
              )}
            </p>
          </div>
          <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
            {(['daily', 'weekly', 'monthly'] as Period[]).map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-2.5 py-1 rounded-md text-[10px] font-medium transition-all ${
                  period === p ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Bar chart */}
        <div className="flex items-end gap-1.5 h-24">
          {metrics.timeline.map((bar) => {
            const label = period === 'monthly'
              ? new Date(bar.key + '-01').toLocaleDateString('en-US', { month: 'short' })
              : period === 'weekly'
                ? new Date(bar.key).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                : new Date(bar.key).toLocaleDateString('en-US', { weekday: 'short' });
            return (
              <div key={bar.key} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[9px] text-gray-500 tabular-nums">{bar.count}</span>
                <div className="w-full bg-gray-100 rounded-t-sm overflow-hidden" style={{ height: '64px' }}>
                  <div
                    className="w-full bg-blue-400 rounded-t-sm transition-all duration-500"
                    style={{ height: `${Math.max(2, bar.pct)}%`, marginTop: `${100 - Math.max(2, bar.pct)}%` }}
                  />
                </div>
                <span className="text-[8px] text-gray-400 truncate max-w-full">{label}</span>
              </div>
            );
          })}
          {metrics.timeline.length === 0 && (
            <div className="flex-1 flex items-center justify-center text-xs text-gray-400">No scan data yet</div>
          )}
        </div>
      </div>
    </div>
  );
}
