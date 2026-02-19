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

function hasData(v: any): boolean {
  if (v == null || v === '') return false;
  if (Array.isArray(v) && v.length === 0) return false;
  if (typeof v === 'object' && !Array.isArray(v) && Object.keys(v).length === 0) return false;
  return true;
}

function CircularProgress({ pct, size = 56, stroke = 5, color }: { pct: number; size?: number; stroke?: number; color: string }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(pct, 100) / 100) * circ;
  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f3f4f6" strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        className="transition-all duration-700 ease-out" />
    </svg>
  );
}

export function CatalogMetricCards({ records, tabId }: CatalogMetricCardsProps) {
  const [range, setRange] = useState<DateRange>('all');

  const { metrics, aiCard } = useMemo(() => {
    const filtered = filterByDate(records, range);
    const total = filtered.length;
    const allTotal = records.length;

    const config = adminFieldConfig[tabId];
    if (!config) return { metrics: null, aiCard: null };

    const withImage = filtered.filter(r => r.image_url && r.image_url.trim() !== '').length;

    const completenessFields: string[] = (() => {
      switch (tabId) {
        case 'elements':
          return ['name_common', 'category', 'type', 'description', 'image_url', 'health_benefits', 'food_sources'];
        case 'ingredients':
          return ['name_common', 'category', 'image_url', 'description_simple', 'elements_beneficial', 'elements_hazardous'];
        case 'recipes':
          return ['name', 'category', 'description', 'image_url', 'linked_ingredients', 'elements_beneficial', 'elements_hazardous'];
        case 'products':
          return ['name', 'brand', 'category', 'description', 'image_url', 'linked_ingredients', 'elements_beneficial', 'elements_hazardous'];
        default:
          return ['name', 'description', 'image_url'];
      }
    })();

    const isComplete = (r: AdminRecord) => completenessFields.every(key => hasData(r[key]));
    const complete = filtered.filter(isComplete).length;

    // AI Enrichment fields — these are the fields typically populated by AI
    const aiFields: { key: string; label: string; icon: string }[] = (() => {
      switch (tabId) {
        case 'ingredients':
          return [
            { key: 'elements_beneficial', label: 'Nutrition', icon: '🥗' },
            { key: 'elements_hazardous', label: 'Hazards', icon: '⚠️' },
            { key: 'taste_profile', label: 'Taste', icon: '👅' },
            { key: 'description_simple', label: 'Description', icon: '📝' },
            { key: 'health_benefits', label: 'Benefits', icon: '💚' },
            { key: 'processing_methods', label: 'Processing', icon: '⚙️' },
          ];
        case 'recipes':
          return [
            { key: 'elements_beneficial', label: 'Nutrition', icon: '🥗' },
            { key: 'elements_hazardous', label: 'Hazards', icon: '⚠️' },
            { key: 'taste_profile', label: 'Taste', icon: '👅' },
            { key: 'linked_ingredients', label: 'Ingredients', icon: '🧅' },
            { key: 'description', label: 'Description', icon: '📝' },
            { key: 'health_benefits', label: 'Benefits', icon: '💚' },
            { key: 'instructions', label: 'Instructions', icon: '📋' },
          ];
        case 'products':
          return [
            { key: 'elements_beneficial', label: 'Nutrition', icon: '🥗' },
            { key: 'elements_hazardous', label: 'Hazards', icon: '⚠️' },
            { key: 'taste_profile', label: 'Taste', icon: '👅' },
            { key: 'linked_ingredients', label: 'Ingredients', icon: '🧅' },
            { key: 'description', label: 'Description', icon: '📝' },
            { key: 'health_benefits', label: 'Benefits', icon: '💚' },
            { key: 'processing_methods', label: 'Processing', icon: '⚙️' },
          ];
        case 'elements':
          return [
            { key: 'description', label: 'Description', icon: '📝' },
            { key: 'health_benefits', label: 'Benefits', icon: '💚' },
            { key: 'food_sources', label: 'Sources', icon: '🍎' },
            { key: 'reason', label: 'Reason', icon: '🔬' },
          ];
        default:
          return [];
      }
    })();

    // Calculate per-field enrichment counts
    const fieldStats = aiFields.map(f => {
      const count = filtered.filter(r => hasData(r[f.key])).length;
      return { ...f, count, pct: total > 0 ? Math.round((count / total) * 100) : 0 };
    });

    // Overall AI enrichment: a record is "enriched" if it has at least half the AI fields populated
    const minFields = Math.max(1, Math.ceil(aiFields.length / 2));
    const enriched = filtered.filter(r => {
      const filled = aiFields.filter(f => hasData(r[f.key])).length;
      return filled >= minFields;
    }).length;
    const enrichPct = total > 0 ? Math.round((enriched / total) * 100) : 0;

    return {
      metrics: [
        { label: 'Total Records', value: total, max: Math.max(allTotal, 10), color: 'bg-blue-500', sub: config.label + 's' },
        { label: 'With Image', value: withImage, max: total || 1, color: 'bg-emerald-500', sub: `${total > 0 ? Math.round((withImage / total) * 100) : 0}% coverage` },
        { label: '100% Complete', value: complete, max: total || 1, color: 'bg-violet-500', sub: `${total > 0 ? Math.round((complete / total) * 100) : 0}% of records` },
      ],
      aiCard: aiFields.length > 0 ? { enriched, total, enrichPct, fieldStats } : null,
    };
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
        {/* Standard metric cards */}
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

        {/* AI Enrichment hero card */}
        {aiCard && (
          <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl border border-purple-200 p-3 flex flex-col justify-between min-h-[100px] relative group">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-medium text-purple-500 uppercase tracking-wider leading-tight">AI Enriched</p>
                <p className="text-xl font-bold text-purple-900 mt-1 tabular-nums">{aiCard.enriched}<span className="text-sm font-normal text-purple-400">/{aiCard.total}</span></p>
              </div>
              <div className="relative flex items-center justify-center">
                <CircularProgress pct={aiCard.enrichPct} size={48} stroke={4} color="#8b5cf6" />
                <span className="absolute text-[10px] font-bold text-purple-700">{aiCard.enrichPct}%</span>
              </div>
            </div>
            <p className="text-[9px] text-purple-400 mt-1">records with AI data</p>

            {/* Hover tooltip with per-field breakdown */}
            <div className="absolute left-0 right-0 top-full mt-1 z-50 hidden group-hover:block">
              <div className="bg-white rounded-lg shadow-xl border border-gray-200 p-2.5 mx-1">
                <p className="text-[9px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Field Coverage</p>
                <div className="space-y-1">
                  {aiCard.fieldStats.map(f => (
                    <div key={f.key} className="flex items-center gap-1.5">
                      <span className="text-[10px] w-4 text-center">{f.icon}</span>
                      <span className="text-[10px] text-gray-600 flex-1">{f.label}</span>
                      <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-purple-400 transition-all duration-500" style={{ width: `${Math.max(2, f.pct)}%` }} />
                      </div>
                      <span className="text-[9px] font-medium text-gray-500 w-8 text-right">{f.pct}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
