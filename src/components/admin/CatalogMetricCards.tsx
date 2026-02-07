import { useMemo } from 'react';
import { adminFieldConfig } from '../../config/adminFieldConfig';

interface AdminRecord {
  id: string;
  [key: string]: any;
}

interface CatalogMetricCardsProps {
  records: AdminRecord[];
  tabId: string;
}

export function CatalogMetricCards({ records, tabId }: CatalogMetricCardsProps) {
  const metrics = useMemo(() => {
    const total = records.length;
    if (total === 0) return null;

    const config = adminFieldConfig[tabId];
    if (!config) return null;

    // Records with image
    const withImage = records.filter(r => r.image_url && r.image_url.trim() !== '').length;

    // Determine "required" fields for completeness based on tab
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

    const isComplete = (r: AdminRecord) => {
      return completenessFields.every(key => {
        const v = r[key];
        if (v == null || v === '') return false;
        if (Array.isArray(v) && v.length === 0) return false;
        if (typeof v === 'object' && !Array.isArray(v) && Object.keys(v).length === 0) return false;
        return true;
      });
    };

    const complete = records.filter(isComplete).length;

    // Category breakdown
    const categories: Record<string, number> = {};
    records.forEach(r => {
      const cat = r.category || 'uncategorized';
      categories[cat] = (categories[cat] || 0) + 1;
    });
    const topCategory = Object.entries(categories).sort((a, b) => b[1] - a[1])[0];

    const steps = [
      { label: 'Total Records', value: total, max: Math.max(total, 10), color: 'bg-blue-500', sub: config.label + 's' },
      { label: 'With Image', value: withImage, max: total || 1, color: 'bg-emerald-500', sub: `${total > 0 ? Math.round((withImage / total) * 100) : 0}% coverage` },
      { label: '100% Complete', value: complete, max: total || 1, color: 'bg-violet-500', sub: `${total > 0 ? Math.round((complete / total) * 100) : 0}% of records` },
      { label: 'Top Category', value: topCategory ? topCategory[1] : 0, max: total || 1, color: 'bg-amber-500', sub: topCategory ? topCategory[0] : '—' },
    ];

    return steps;
  }, [records, tabId]);

  if (!metrics) return null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
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
  );
}
