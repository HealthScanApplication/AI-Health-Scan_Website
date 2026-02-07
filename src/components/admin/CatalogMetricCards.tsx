import { useMemo, useState } from 'react';
import { adminFieldConfig } from '../../config/adminFieldConfig';

interface AdminRecord {
  id: string;
  [key: string]: any;
}

interface CatalogMetricCardsProps {
  records: AdminRecord[];
  tabId: string;
}

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
    const d = new Date(r.created_at || r.signupDate || '');
    return !isNaN(d.getTime()) && d >= cutoff;
  });
}

export function CatalogMetricCards({ records, tabId }: CatalogMetricCardsProps) {
  const [range, setRange] = useState<DateRange>('all');

  const metrics = useMemo(() => {
    const filtered = filterByDate(records, range);
    const total = filtered.length;
    const allTotal = records.length;

    const config = adminFieldConfig[tabId];
    if (!config) return null;

    const withImage = filtered.filter(r => r.image_url && r.image_url.trim() !== '').length;

    const completenessFields: string[] = (() => {
      switch (tabId) {
        case 'elements':
          return ['name_common', 'category', 'type', 'description', 'image_url', 'health_benefits', 'food_sources'];
        case 'ingredients':
          return ['name', 'category', 'type', 'description', 'image_url', 'allergens'];
        case 'recipes':
          return ['name', 'category', 'type', 'description', 'image_url', 'ingredients', 'instructions'];
        case 'products':
          return ['name', 'brand', 'category', 'type', 'description', 'image_url', 'ingredients'];
        default:
          return ['name', 'description', 'image_url'];
      }
    })();

    const isComplete = (r: AdminRecord) => completenessFields.every(key => {
      const v = r[key];
      if (v == null || v === '') return false;
      if (Array.isArray(v) && v.length === 0) return false;
      if (typeof v === 'object' && !Array.isArray(v) && Object.keys(v).length === 0) return false;
      return true;
    });

    const complete = filtered.filter(isComplete).length;

    const categories: Record<string, number> = {};
    filtered.forEach(r => { categories[r.category || 'uncategorized'] = (categories[r.category || 'uncategorized'] || 0) + 1; });
    const topCategory = Object.entries(categories).sort((a, b) => b[1] - a[1])[0];

    return [
      { label: 'Total Records', value: total, max: Math.max(allTotal, 10), color: 'bg-blue-500', sub: config.label + 's' },
      { label: 'With Image', value: withImage, max: total || 1, color: 'bg-emerald-500', sub: `${total > 0 ? Math.round((withImage / total) * 100) : 0}% coverage` },
      { label: '100% Complete', value: complete, max: total || 1, color: 'bg-violet-500', sub: `${total > 0 ? Math.round((complete / total) * 100) : 0}% of records` },
      { label: 'Top Category', value: topCategory ? topCategory[1] : 0, max: total || 1, color: 'bg-amber-500', sub: topCategory ? topCategory[0] : '—' },
    ];
  }, [records, tabId, range]);

  if (!metrics) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-gray-500">Overview</p>
        <div className="flex gap-0.5 bg-gray-100 rounded-lg p-0.5">
          {(['day', 'week', 'month', 'year', 'all'] as DateRange[]).map(r => (
            <button key={r} onClick={() => setRange(r)} className={`px-2 py-1 rounded-md text-[10px] font-medium transition-all ${range === r ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              {r === 'all' ? 'All' : r.charAt(0).toUpperCase() + r.slice(1)}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {metrics.map((step) => {
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
    </div>
  );
}
