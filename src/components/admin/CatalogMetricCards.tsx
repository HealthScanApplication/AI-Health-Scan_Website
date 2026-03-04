import { useMemo, useState } from 'react';
import { adminFieldConfig, getFieldsForView } from '../../config/adminFieldConfig';

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

// Must stay in sync with server SKIP_TYPES + non-AI types
const SKIP_TYPES = new Set([
  'image', 'video', 'media_upload', 'icon_picker',
  'readonly', 'date',
  'linked_elements', 'content_links',
  'element_sources_viewer',
]);

// Smart data check — mirrors server isEffectivelyEmpty logic
function fieldHasData(key: string, v: any): boolean {
  if (v == null || v === '') return false;
  if (Array.isArray(v)) return v.length > 0;
  if (typeof v === 'object') {
    if (Object.keys(v).length === 0) return false;
    if (key === 'taste_profile' || key === 'nutrition_per_100g' || key === 'nutrition_per_serving') {
      return !!JSON.stringify(v).match(/[1-9]/);
    }
    if (key === 'elements_beneficial') {
      const p = v.per_100g || v.nutrition_per_100g || {};
      return !!JSON.stringify(p).match(/[1-9]/);
    }
    if (key === 'elements_hazardous') {
      return Object.values(v).some((x: any) => {
        if (typeof x === 'string') return x !== 'none' && x !== '';
        if (typeof x === 'object' && x) return x.level && x.level !== 'none';
        return false;
      });
    }
    if (key === 'herbal_quality') {
      const hq = v as any;
      if (!hq.herbal_identity?.common_name && (!hq.symptom_uses || hq.symptom_uses.length === 0) && (!hq.mechanisms || hq.mechanisms.length === 0)) return false;
    }
    return true;
  }
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

// Section icons for the hover breakdown
const SECTION_ICONS: Record<string, string> = {
  'Media': '🖼️', 'Identity': '🏷️', 'Chemistry': '⚗️', 'Summary': '📝',
  'Functions & Benefits': '💚', 'DRV by Population': '📊', 'Thresholds & Range': '📏',
  'Food Sources': '🍎', 'Detailed Sections': '📖', 'Interactions': '🔄',
  'Interventions': '🛡️', 'Scoring': '⭐', 'References & Meta': '📚', 'Content': '🔗',
  'Basic Info': '📋', 'Processing': '⚙️', 'Culinary Origin': '🌍', 'Flavor Profile': '👅',
  'Nutrition Data': '🥗', 'Hazards & Risks': '⚠️', 'Health & Scoring': '⭐',
  'Herbal / Medicinal Quality': '🌿', 'Cooking Details': '🍳', 'Ingredients & Steps': '📋',
  'Descriptions': '📝', 'Scores & Labels': '🏅', 'Ingredients': '🧅',
};

export function CatalogMetricCards({ records, tabId }: CatalogMetricCardsProps) {
  const [range, setRange] = useState<DateRange>('all');

  const { metrics, aiCard } = useMemo(() => {
    const filtered = filterByDate(records, range);
    const total = filtered.length;
    const allTotal = records.length;

    const config = adminFieldConfig[tabId];
    if (!config) return { metrics: null, aiCard: null };

    // Get actual AI-fillable edit fields from config (same logic as getRecordCompleteness)
    const editFields = getFieldsForView(tabId, 'edit');
    const scoreable = editFields.filter(f => !SKIP_TYPES.has(f.type));

    const withImage = filtered.filter(r => r.image_url && r.image_url.trim() !== '').length;

    // Per-record completeness using actual fields
    const recordScores = filtered.map(r => {
      if (scoreable.length === 0) return 100;
      const filled = scoreable.filter(f => fieldHasData(f.key, r[f.key])).length;
      return Math.round((filled / scoreable.length) * 100);
    });
    const avgCompleteness = total > 0 ? Math.round(recordScores.reduce((a, b) => a + b, 0) / total) : 0;
    const fullyComplete = recordScores.filter(s => s === 100).length;

    // Per-field stats grouped by section
    const sectionMap = new Map<string, { key: string; label: string; section: string; count: number; pct: number }[]>();
    for (const f of scoreable) {
      const section = f.section || 'Other';
      const count = filtered.filter(r => fieldHasData(f.key, r[f.key])).length;
      const pct = total > 0 ? Math.round((count / total) * 100) : 0;
      if (!sectionMap.has(section)) sectionMap.set(section, []);
      sectionMap.get(section)!.push({ key: f.key, label: f.label, section, count, pct });
    }

    // Flat field stats for summary
    const allFieldStats = scoreable.map(f => {
      const count = filtered.filter(r => fieldHasData(f.key, r[f.key])).length;
      return { key: f.key, label: f.label, section: f.section || 'Other', count, pct: total > 0 ? Math.round((count / total) * 100) : 0 };
    });

    // Find the emptiest fields (lowest coverage)
    const emptiestFields = [...allFieldStats].sort((a, b) => a.pct - b.pct).slice(0, 6);

    return {
      metrics: [
        { label: 'Total Records', value: total, max: Math.max(allTotal, 10), color: 'bg-blue-500', sub: config.label + 's' },
        { label: 'With Image', value: withImage, max: total || 1, color: 'bg-emerald-500', sub: `${total > 0 ? Math.round((withImage / total) * 100) : 0}% coverage` },
        { label: '100% Complete', value: fullyComplete, max: total || 1, color: 'bg-violet-500', sub: `${total > 0 ? Math.round((fullyComplete / total) * 100) : 0}% of records` },
      ],
      aiCard: scoreable.length > 0 ? {
        avgCompleteness,
        totalFields: scoreable.length,
        total,
        sectionMap,
        emptiestFields,
      } : null,
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
                <p className="text-[10px] font-medium text-purple-500 uppercase tracking-wider leading-tight">AI Fillable</p>
                <p className="text-xl font-bold text-purple-900 mt-1 tabular-nums">{aiCard.avgCompleteness}<span className="text-sm font-normal text-purple-400">%</span></p>
              </div>
              <div className="relative flex items-center justify-center">
                <CircularProgress pct={aiCard.avgCompleteness} size={48} stroke={4} color={aiCard.avgCompleteness >= 80 ? '#22c55e' : aiCard.avgCompleteness >= 50 ? '#8b5cf6' : '#f59e0b'} />
                <span className="absolute text-[10px] font-bold text-purple-700">{aiCard.totalFields}</span>
              </div>
            </div>
            <p className="text-[9px] text-purple-400 mt-1">avg completeness across {aiCard.totalFields} fields</p>

            {/* Hover tooltip with per-section breakdown */}
            <div className="absolute left-0 right-0 top-full mt-1 z-50 hidden group-hover:block">
              <div className="bg-white rounded-lg shadow-xl border border-gray-200 p-3 mx-1 max-h-80 overflow-y-auto">
                <p className="text-[9px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Field Coverage by Section</p>
                <div className="space-y-2.5">
                  {Array.from(aiCard.sectionMap.entries()).map(([section, fields]) => {
                    const sectionAvg = fields.length > 0 ? Math.round(fields.reduce((a, f) => a + f.pct, 0) / fields.length) : 0;
                    return (
                      <div key={section}>
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="text-[10px]">{SECTION_ICONS[section] || '📄'}</span>
                          <span className="text-[10px] font-semibold text-gray-700 flex-1">{section}</span>
                          <span className={`text-[9px] font-bold ${sectionAvg >= 80 ? 'text-green-600' : sectionAvg >= 50 ? 'text-purple-600' : 'text-amber-600'}`}>{sectionAvg}%</span>
                        </div>
                        <div className="space-y-0.5 pl-5">
                          {fields.map(f => (
                            <div key={f.key} className="flex items-center gap-1.5">
                              <span className="text-[9px] text-gray-500 flex-1 truncate">{f.label}</span>
                              <div className="w-14 h-1 bg-gray-100 rounded-full overflow-hidden flex-shrink-0">
                                <div className={`h-full rounded-full transition-all duration-500 ${f.pct >= 80 ? 'bg-green-400' : f.pct >= 50 ? 'bg-purple-400' : 'bg-amber-400'}`} style={{ width: `${Math.max(2, f.pct)}%` }} />
                              </div>
                              <span className="text-[8px] font-medium text-gray-400 w-7 text-right flex-shrink-0">{f.pct}%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {aiCard.emptiestFields.length > 0 && (
                  <>
                    <div className="border-t border-gray-100 mt-2.5 pt-2">
                      <p className="text-[9px] font-semibold text-amber-600 uppercase tracking-wider mb-1.5">Emptiest Fields</p>
                      <div className="space-y-0.5">
                        {aiCard.emptiestFields.map(f => (
                          <div key={f.key} className="flex items-center gap-1.5">
                            <span className="text-[9px] text-gray-500 flex-1 truncate">{f.label}</span>
                            <span className={`text-[8px] font-bold ${f.pct === 0 ? 'text-red-500' : 'text-amber-500'}`}>{f.pct}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
