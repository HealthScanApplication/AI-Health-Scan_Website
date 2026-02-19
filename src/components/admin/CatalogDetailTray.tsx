import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Trash2, Edit, Image as ImageIcon, Loader2, Flame, Beef, Wheat, Droplets, ChevronDown, ChevronRight } from 'lucide-react';
import { AdminModal } from '../ui/AdminModal';
import { CollapsibleSection } from '../ui/CollapsibleSection';
import { getFieldsForView, adminFieldConfig, badgeColorMap, type FieldConfig } from '../../config/adminFieldConfig';
import {
  type AdminRecord,
  type GeoInfo,
  getDisplayName,
  getImageUrl,
  PLACEHOLDER_IMAGE,
} from '../../utils/adminHelpers';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

interface CatalogDetailTrayProps {
  record: AdminRecord;
  activeTab: string;
  open: boolean;
  onClose: () => void;
  onEdit: (record: AdminRecord) => void;
  onDelete: (record: AdminRecord) => void;
  ipGeoData: Record<string, GeoInfo>;
  accessToken?: string;
}

interface ResolvedLinkedItem {
  id: string;
  name: string;
  category?: string;
  type?: string;
  image_url?: string;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function CatalogDetailTray({
  record,
  activeTab,
  open,
  onClose,
  onEdit,
  onDelete,
  ipGeoData,
  accessToken,
}: CatalogDetailTrayProps) {
  const detailFields = getFieldsForView(activeTab, 'detail');

  // Resolve linked ingredient/element IDs to names
  const [resolvedLinked, setResolvedLinked] = useState<Record<string, ResolvedLinkedItem[]>>({});
  const [linkedLoading, setLinkedLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    const linkedFields = detailFields.filter(
      (f) => f.type === 'linked_elements' || f.type === 'linked_ingredients',
    );
    if (!linkedFields.length) return;

    const idsToResolve: { field: string; ids: string[]; table: string }[] = [];
    for (const f of linkedFields) {
      const ids = Array.isArray(record[f.key]) ? record[f.key] as string[] : [];
      if (!ids.length) continue;
      const table =
        f.type === 'linked_elements' ? 'catalog_elements' : 'catalog_ingredients';
      idsToResolve.push({ field: f.key, ids, table });
    }
    if (!idsToResolve.length) return;

    let cancelled = false;
    setLinkedLoading(true);

    (async () => {
      const result: Record<string, ResolvedLinkedItem[]> = {};
      for (const { field, ids, table } of idsToResolve) {
        try {
          const nameCol = table === 'catalog_elements' ? 'name_common,name' : 'name';
          const idFilter = ids.map((id) => `"${id}"`).join(',');
          const url = `https://${projectId}.supabase.co/rest/v1/${table}?select=id,${nameCol},category,type,image_url&id=in.(${idFilter})`;
          const res = await fetch(url, {
            headers: {
              Authorization: `Bearer ${accessToken || publicAnonKey}`,
              apikey: publicAnonKey,
            },
          });
          if (res.ok) {
            const data: any[] = await res.json();
            result[field] = data.map((d) => ({
              id: d.id,
              name: d.name_common || d.name || 'Unknown',
              category: d.category,
              type: d.type,
              image_url: d.image_url,
            }));
          }
        } catch (err) {
          console.error(`[CatalogDetailTray] Failed to resolve ${field}:`, err);
        }
      }
      if (!cancelled) {
        setResolvedLinked(result);
        setLinkedLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [open, record.id, activeTab]);

  // Partition fields into logical groups
  const headerFieldKeys = ['category', 'type', 'brand', 'scan_type', 'status'];
  const descKeys = ['description', 'description_simple', 'description_technical'];
  const descFields = detailFields.filter((f) => descKeys.includes(f.key) && record[f.key]);
  const sectionedFields = detailFields.filter((f) => f.section);
  const sections = [...new Set(sectionedFields.map((f) => f.section!))];
  const unsectionedFields = detailFields
    .filter(
      (f) =>
        f.type !== 'image' &&
        !headerFieldKeys.includes(f.key) &&
        !descKeys.includes(f.key) &&
        !f.section,
    )
    .filter((f) => {
      const v = record[f.key];
      return v != null && v !== '' && v !== 'null';
    });

  return (
    <AdminModal
      open={open}
      onClose={onClose}
      title={getDisplayName(record)}
      subtitle={adminFieldConfig[activeTab]?.label || 'Record'}
      size="xl"
      noPadding
      footer={
        <div className="flex items-center justify-between">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onDelete(record)}
            className="gap-1.5 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
          >
            <Trash2 className="w-3.5 h-3.5" /> Delete
          </Button>
          <Button
            size="sm"
            onClick={() => {
              onEdit(record);
              onClose();
            }}
            className="gap-1.5 text-xs bg-blue-600 hover:bg-blue-700"
          >
            <Edit className="w-3.5 h-3.5" /> Edit
          </Button>
        </div>
      }
    >
      {/* Hero image / placeholder */}
      <HeroImage record={record} activeTab={activeTab} />

      {/* Content with padding */}
      <div className="px-6 py-5 space-y-4">
        {/* Badges */}
        <BadgeRow record={record} />

        {/* Description(s) */}
        {descFields.length > 0 && (
          <div className="space-y-2">
            {descFields.map((df) => (
              <div key={df.key} className="bg-gray-50 rounded-xl p-4">
                {descFields.length > 1 && (
                  <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">{df.label}</div>
                )}
                <div className="text-sm text-gray-700 leading-relaxed">{record[df.key]}</div>
              </div>
            ))}
          </div>
        )}

        {/* Sectioned fields */}
        {sections.map((section) => (
          <SectionBlock
            key={section}
            section={section}
            fields={sectionedFields.filter((f) => f.section === section)}
            record={record}
            ipGeoData={ipGeoData}
            resolvedLinked={resolvedLinked}
            linkedLoading={linkedLoading}
          />
        ))}

        {/* Unsectioned detail fields */}
        {unsectionedFields.length > 0 && (
          <CollapsibleSection
            title="Details"
            itemCount={unsectionedFields.length}
            previewCount={6}
            totalItems={unsectionedFields.length}
          >
            {(expanded: boolean) => (
              <div className="grid grid-cols-2 gap-2">
                {(expanded ? unsectionedFields : unsectionedFields.slice(0, 6)).map(
                  (field) => {
                    const val = record[field.key];
                    const span =
                      field.colSpan === 2 ||
                      field.type === 'textarea' ||
                      field.type === 'json' ||
                      field.type === 'array'
                        ? 'col-span-2'
                        : '';
                    return (
                      <div key={field.key} className={`bg-gray-50 rounded-lg p-3 ${span}`}>
                        <div className="text-[10px] text-gray-400 font-medium uppercase">
                          {field.label}
                        </div>
                        <div className="text-sm text-gray-900 mt-0.5 break-all">
                          <FieldValue field={field} value={val} ipGeoData={ipGeoData} resolvedLinked={resolvedLinked} linkedLoading={linkedLoading} />
                        </div>
                      </div>
                    );
                  },
                )}
              </div>
            )}
          </CollapsibleSection>
        )}
      </div>
    </AdminModal>
  );
}

/* ------------------------------------------------------------------ */
/*  Sub-components (private to this file)                              */
/* ------------------------------------------------------------------ */

function HeroImage({
  record,
  activeTab,
}: {
  record: AdminRecord;
  activeTab: string;
}) {
  const imageUrl = getImageUrl(record, activeTab);
  const hasRealImage = imageUrl && imageUrl !== PLACEHOLDER_IMAGE;
  const [imgError, setImgError] = useState(false);

  const showPlaceholder = !hasRealImage || imgError;

  return (
    <div className="relative w-full h-48 bg-gray-100 overflow-hidden">
      {showPlaceholder ? (
        <div className="w-full h-full flex flex-col items-center justify-center text-gray-300">
          <ImageIcon className="w-12 h-12" />
          <span className="text-xs mt-1.5 text-gray-400">No image</span>
        </div>
      ) : (
        <img
          src={imageUrl}
          alt={getDisplayName(record)}
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
        />
      )}
      {record.overall_score != null && (
        <div className="absolute top-3 left-3 bg-black/60 text-white rounded-full px-2.5 py-1 text-xs font-bold flex items-center gap-1">
          <span className="text-yellow-400">&#9733;</span> {record.overall_score}
        </div>
      )}
    </div>
  );
}

function BadgeRow({ record }: { record: AdminRecord }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {record.category && (
        <Badge
          className={`text-xs ${badgeColorMap[record.category.toLowerCase()] || 'bg-blue-100 text-blue-800'}`}
        >
          {record.category}
        </Badge>
      )}
      {record.type && (
        <Badge
          className={`text-xs ${badgeColorMap[record.type.toLowerCase()] || 'bg-gray-100 text-gray-700'}`}
        >
          {record.type}
        </Badge>
      )}
      {record.status && (
        <Badge
          className={`text-xs ${
            record.status === 'completed'
              ? 'bg-green-100 text-green-800'
              : record.status === 'failed'
                ? 'bg-red-100 text-red-800'
                : 'bg-amber-100 text-amber-800'
          }`}
        >
          {record.status}
        </Badge>
      )}
    </div>
  );
}

function SectionBlock({
  section,
  fields,
  record,
  ipGeoData,
  resolvedLinked,
  linkedLoading,
}: {
  section: string;
  fields: FieldConfig[];
  record: AdminRecord;
  ipGeoData: Record<string, GeoInfo>;
  resolvedLinked: Record<string, ResolvedLinkedItem[]>;
  linkedLoading: boolean;
}) {
  const hasData = fields.some((f) => {
    const v = record[f.key];
    return (
      v != null &&
      v !== '' &&
      v !== 'null' &&
      !(typeof v === 'object' && Object.keys(v).length === 0)
    );
  });
  if (!hasData) return null;

  const totalItems = fields.reduce((t, f) => {
    const v = record[f.key];
    if (v == null) return t;
    if (Array.isArray(v)) return t + v.length;
    if (typeof v === 'object') return t + Object.keys(v).length;
    return t + 1;
  }, 0);

  return (
    <CollapsibleSection
      title={section}
      itemCount={totalItems}
      previewCount={4}
      totalItems={totalItems}
    >
      {(expanded: boolean) => {
        let idx = 0;
        return fields.map((f) => {
          const v = record[f.key];
          if (v == null || v === '') return null;

          if (Array.isArray(v)) {
            const startIdx = idx;
            idx += v.length;
            const slice = expanded ? v : v.slice(0, Math.max(0, 4 - startIdx));
            if (!slice.length) return null;
            return (
              <div key={f.key}>
                {fields.length > 1 && (
                  <div className="text-[10px] text-gray-400 font-medium uppercase mb-1">
                    {f.label}
                  </div>
                )}
                <FieldValue field={f} value={expanded ? v : slice} ipGeoData={ipGeoData} resolvedLinked={resolvedLinked} linkedLoading={linkedLoading} />
              </div>
            );
          }

          if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
            // Guard: only use Object.entries on plain objects
            const isPlain = v.constructor === Object || v.constructor == null;
            const entries = isPlain ? Object.entries(v) : [];
            if (!entries.length) {
              idx += 1;
              if (!expanded && idx > 4) return null;
              return (
                <div key={f.key}>
                  {fields.length > 1 && (
                    <div className="text-[10px] text-gray-400 font-medium uppercase mb-1">
                      {f.label}
                    </div>
                  )}
                  <FieldValue field={f} value={String(v)} ipGeoData={ipGeoData} resolvedLinked={resolvedLinked} linkedLoading={linkedLoading} />
                </div>
              );
            }
            const startIdx = idx;
            idx += entries.length;
            const slice = expanded ? entries : entries.slice(0, Math.max(0, 4 - startIdx));
            if (!slice.length) return null;
            return (
              <div key={f.key}>
                {fields.length > 1 && (
                  <div className="text-[10px] text-gray-400 font-medium uppercase mb-1">
                    {f.label}
                  </div>
                )}
                <FieldValue
                  field={f}
                  value={expanded ? v : Object.fromEntries(slice)}
                  ipGeoData={ipGeoData}
                  resolvedLinked={resolvedLinked}
                  linkedLoading={linkedLoading}
                />
              </div>
            );
          }

          const myIdx = idx;
          idx += 1;
          if (!expanded && myIdx >= 4) return null;

          return (
            <div key={f.key}>
              {fields.length > 1 && (
                <div className="text-[10px] text-gray-400 font-medium uppercase mb-1">
                  {f.label}
                </div>
              )}
              <FieldValue field={f} value={v} ipGeoData={ipGeoData} resolvedLinked={resolvedLinked} linkedLoading={linkedLoading} />
            </div>
          );
        });
      }}
    </CollapsibleSection>
  );
}

/* ------------------------------------------------------------------ */
/*  FieldValue — renders a single field value as JSX                   */
/* ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ */
/*  Nutrition helpers                                                    */
/* ------------------------------------------------------------------ */

const NUTRITION_FIELD_KEYS = new Set([
  'macro_nutrition',
  'nutrients_detected',
  'hazards',
  'pollutants_detected',
  'nutrition_facts',
  'nutritional_value',
  'elements_beneficial',
]);

function isNutritionField(key: string): boolean {
  return NUTRITION_FIELD_KEYS.has(key);
}

/** Extract a numeric value from various data shapes */
function extractNumeric(v: any): { value: number; unit: string; rdi: number | null } {
  const num =
    typeof v === 'number' ? v
    : typeof v === 'object' && v != null && (v as any).amount != null ? Number((v as any).amount)
    : typeof v === 'object' && v != null && (v as any).value != null ? Number((v as any).value)
    : typeof v === 'string' ? parseFloat(v)
    : NaN;
  const unit = typeof v === 'object' && v != null && (v as any).unit ? String((v as any).unit) : '';
  const rdi = typeof v === 'object' && v != null && (v as any).rdi_percent != null ? Number((v as any).rdi_percent) : null;
  return { value: isNaN(num) ? 0 : num, unit, rdi };
}

/** Check if a value is a nested group (object whose children are also objects, not leaf values) */
function isNestedGroup(v: any): boolean {
  if (typeof v !== 'object' || v == null || Array.isArray(v)) return false;
  const vals = Object.values(v);
  if (vals.length === 0) return false;
  // If most children are objects (not primitives), treat as a group
  const objCount = vals.filter((c) => typeof c === 'object' && c != null && !Array.isArray(c)).length;
  return objCount > vals.length / 2;
}

/* ------------------------------------------------------------------ */
/*  MacroCards — 4 core macros as compact colored cards                  */
/* ------------------------------------------------------------------ */

const MACRO_KEYS: Record<string, { icon: React.ReactNode; bg: string; text: string; label: string; unit: string }> = {
  calories:  { icon: <Flame className="w-4 h-4" />,    bg: 'bg-orange-50 border-orange-200', text: 'text-orange-700', label: 'Calories', unit: 'kcal' },
  protein:   { icon: <Beef className="w-4 h-4" />,     bg: 'bg-red-50 border-red-200',       text: 'text-red-700',    label: 'Protein',  unit: 'g' },
  carbs:     { icon: <Wheat className="w-4 h-4" />,    bg: 'bg-amber-50 border-amber-200',   text: 'text-amber-700',  label: 'Carbs',    unit: 'g' },
  carbohydrates: { icon: <Wheat className="w-4 h-4" />, bg: 'bg-amber-50 border-amber-200',  text: 'text-amber-700',  label: 'Carbs',    unit: 'g' },
  fat:       { icon: <Droplets className="w-4 h-4" />, bg: 'bg-blue-50 border-blue-200',     text: 'text-blue-700',   label: 'Fat',      unit: 'g' },
  fats:      { icon: <Droplets className="w-4 h-4" />, bg: 'bg-blue-50 border-blue-200',     text: 'text-blue-700',   label: 'Fat',      unit: 'g' },
};

function MacroCards({ data }: { data: Record<string, any> }) {
  const macroEntries: { key: string; cfg: typeof MACRO_KEYS[string]; value: number; unit: string }[] = [];
  const remaining: Record<string, any> = {};

  for (const [k, v] of Object.entries(data)) {
    const normalised = k.toLowerCase().replace(/[_\s-]/g, '');
    const cfg = MACRO_KEYS[normalised];
    if (cfg) {
      const { value, unit } = extractNumeric(v);
      if (value > 0) macroEntries.push({ key: k, cfg, value, unit: unit || cfg.unit });
    } else {
      remaining[k] = v;
    }
  }

  return (
    <div className="space-y-3">
      {macroEntries.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {macroEntries.map(({ key, cfg, value, unit }) => (
            <div
              key={key}
              className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 ${cfg.bg}`}
            >
              <div className={`${cfg.text} shrink-0`}>{cfg.icon}</div>
              <div className="min-w-0">
                <div className={`text-base font-bold leading-tight ${cfg.text}`}>
                  {value}<span className="text-xs font-medium ml-0.5 opacity-70">{unit}</span>
                </div>
                <div className="text-[10px] text-gray-500 font-medium">{cfg.label}</div>
              </div>
            </div>
          ))}
        </div>
      )}
      {Object.keys(remaining).length > 0 && (
        <NutritionBarList data={remaining} colorClass="bg-blue-500" maxItems={12} />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  NutritionBarList — progress bars (filters out zero values)          */
/* ------------------------------------------------------------------ */

function NutritionBarList({
  data,
  colorClass,
  maxItems,
}: {
  data: Record<string, any>;
  colorClass: string;
  maxItems?: number;
}) {
  const entries = Object.entries(data);
  if (!entries.length) return <span className="text-gray-400 text-xs">—</span>;

  const numericEntries = entries
    .map(([k, v]) => {
      const { value, unit, rdi } = extractNumeric(v);
      return { key: k, value, unit, rdi, raw: v };
    })
    .filter((e) => e.value > 0) // Hide zero values
    .slice(0, maxItems || 20);

  if (!numericEntries.length) return <span className="text-gray-400 text-xs">No values detected</span>;

  const maxVal = Math.max(...numericEntries.map((e) => e.rdi ?? e.value), 1);

  return (
    <div className="space-y-2">
      {numericEntries.map((entry) => {
        const pct = entry.rdi != null ? Math.min(entry.rdi, 100) : Math.min((entry.value / maxVal) * 100, 100);
        const label = entry.key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
        const displayVal = entry.rdi != null
          ? `${entry.value}${entry.unit ? ` ${entry.unit}` : ''} (${entry.rdi}% RDI)`
          : `${entry.value}${entry.unit ? ` ${entry.unit}` : ''}`;

        return (
          <div key={entry.key}>
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-xs font-medium text-gray-700 capitalize truncate">{label}</span>
              <span className="text-[10px] text-gray-500 ml-2 shrink-0">{displayVal}</span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${colorClass}`}
                style={{ width: `${Math.max(pct, 2)}%` }}
              />
            </div>
          </div>
        );
      })}
      {entries.filter(([ , v]) => extractNumeric(v).value > 0).length > (maxItems || 20) && (
        <div className="text-xs text-gray-400 text-center">
          + {entries.filter(([ , v]) => extractNumeric(v).value > 0).length - (maxItems || 20)} more
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  GroupedNutritionList — nested groups as folder headers + list cards  */
/* ------------------------------------------------------------------ */

function GroupedNutritionList({
  data,
  colorClass,
}: {
  data: Record<string, any>;
  colorClass: string;
}) {
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  const toggle = (group: string) =>
    setOpenGroups((prev) => ({ ...prev, [group]: !prev[group] }));

  // Separate top-level leaf values from nested groups
  const leafEntries: Record<string, any> = {};
  const groups: { name: string; items: Record<string, any> }[] = [];

  for (const [k, v] of Object.entries(data)) {
    if (isNestedGroup(v)) {
      groups.push({ name: k, items: v });
    } else {
      leafEntries[k] = v;
    }
  }

  // Filter out zero-value leaves
  const nonZeroLeaves = Object.fromEntries(
    Object.entries(leafEntries).filter(([, v]) => extractNumeric(v).value > 0),
  );

  return (
    <div className="space-y-3">
      {Object.keys(nonZeroLeaves).length > 0 && (
        <NutritionBarList data={nonZeroLeaves} colorClass={colorClass} maxItems={12} />
      )}
      {groups.map(({ name, items }) => {
        const label = name.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
        const nonZeroItems = Object.fromEntries(
          Object.entries(items).filter(([, v]) => extractNumeric(v).value > 0),
        );
        if (Object.keys(nonZeroItems).length === 0) return null;
        const isOpen = openGroups[name] !== false; // default open

        return (
          <div key={name} className="border border-gray-100 rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => toggle(name)}
              className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <span className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                {label}
                <span className="text-[10px] text-gray-400 font-normal">({Object.keys(nonZeroItems).length})</span>
              </span>
            </button>
            {isOpen && (
              <div className="px-3 py-2">
                <NutritionBarList data={nonZeroItems} colorClass={colorClass} maxItems={20} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  LinkedItemsList — resolved linked ingredients/elements              */
/* ------------------------------------------------------------------ */

function LinkedItemsList({
  items,
  loading,
  category,
}: {
  items: ResolvedLinkedItem[];
  loading: boolean;
  category?: string;
}) {
  if (loading) {
    return (
      <div className="flex items-center gap-2 py-2 text-gray-400">
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        <span className="text-xs">Loading...</span>
      </div>
    );
  }

  if (!items.length) return <span className="text-gray-400 text-xs">None linked</span>;

  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => {
        const colorCls =
          item.category === 'beneficial'
            ? 'bg-green-100 text-green-800'
            : item.category === 'hazardous'
              ? 'bg-red-100 text-red-800'
              : 'bg-gray-100 text-gray-800';
        return (
          <span
            key={item.id}
            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${colorCls}`}
          >
            {item.name}
            {item.type && <span className="text-[10px] opacity-60">({item.type})</span>}
          </span>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  FieldValue — renders a single field value as JSX                   */
/* ------------------------------------------------------------------ */

function FieldValue({
  field,
  value,
  ipGeoData,
  resolvedLinked,
  linkedLoading,
}: {
  field: FieldConfig;
  value: any;
  ipGeoData: Record<string, GeoInfo>;
  resolvedLinked?: Record<string, ResolvedLinkedItem[]>;
  linkedLoading?: boolean;
}) {
  if (value == null || value === '' || value === 'null') return <span className="text-gray-400 text-xs">—</span>;

  // Linked elements / ingredients — show resolved names with badges
  if (field.type === 'linked_elements' || field.type === 'linked_ingredients') {
    const items = resolvedLinked?.[field.key] || [];
    return <LinkedItemsList items={items} loading={!!linkedLoading} category={field.linkedCategory} />;
  }

  if (field.type === 'boolean') {
    return (
      <Badge className={value ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}>
        {value ? 'Yes' : 'No'}
      </Badge>
    );
  }

  if (
    field.type === 'date' ||
    field.key === 'signupDate' ||
    field.key === 'created_at' ||
    field.key === 'lastActiveDate' ||
    field.key === 'lastReferralDate'
  ) {
    const d = new Date(value);
    if (isNaN(d.getTime())) return <span className="text-gray-400 text-xs">Invalid date</span>;
    return (
      <span>
        {d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}{' '}
        <span className="text-gray-400">
          {d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
        </span>
      </span>
    );
  }

  if (field.key === 'ipAddress' && value) {
    const ip = String(value).split(',')[0].trim();
    const geo = ipGeoData[ip];
    return geo ? (
      <span>
        {geo.flag} {geo.city}, {geo.country}{' '}
        <span className="text-gray-400 text-xs">({ip})</span>
      </span>
    ) : (
      <span>{ip}</span>
    );
  }

  if (field.type === 'badge') {
    return (
      <Badge
        className={`text-xs ${badgeColorMap[String(value).toLowerCase()] || 'bg-blue-100 text-blue-800'}`}
      >
        {String(value)}
      </Badge>
    );
  }

  if (field.type === 'json' && typeof value === 'object' && value !== null) {
    if (Array.isArray(value)) {
      return (
        <div className="space-y-1.5">
          {value.map((item: any, i: number) => (
            <div
              key={i}
              className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-gray-100"
            >
              <span className="text-sm">
                {typeof item === 'object'
                  ? item.name || item.label || JSON.stringify(item)
                  : String(item)}
              </span>
            </div>
          ))}
        </div>
      );
    }
    // Guard: only use Object.entries on plain objects
    const isPlain = value.constructor === Object || value.constructor == null;
    if (!isPlain) return <span className="text-sm">{String(value)}</span>;
    const entries = Object.entries(value);
    if (entries.length === 0) return <span className="text-gray-400 text-xs">Empty</span>;

    // Nutrition fields → smart rendering
    if (isNutritionField(field.key)) {
      const colorMap: Record<string, string> = {
        macro_nutrition: 'bg-blue-500',
        nutrients_detected: 'bg-emerald-500',
        hazards: 'bg-red-500',
        pollutants_detected: 'bg-orange-500',
        nutrition_facts: 'bg-blue-500',
        nutritional_value: 'bg-emerald-500',
        elements_beneficial: 'bg-emerald-500',
      };
      const color = colorMap[field.key] || 'bg-blue-500';

      // Macro fields → show 4 core macros as colored cards + remaining as bars
      if (field.key === 'macro_nutrition' || field.key === 'nutrition_facts') {
        return <MacroCards data={value} />;
      }

      // Check for nested groups (e.g. { minerals: { iron: 5 }, vitamins: { ... } })
      const hasGroups = entries.some(([, v]) => isNestedGroup(v));
      if (hasGroups) {
        return <GroupedNutritionList data={value} colorClass={color} />;
      }

      // Flat numeric data → progress bars (zero values already filtered inside)
      const hasNumeric = entries.some(([, v]) =>
        typeof v === 'number' || (typeof v === 'object' && v != null && ((v as any).amount != null || (v as any).value != null)),
      );
      if (hasNumeric) {
        return <NutritionBarList data={value} colorClass={color} maxItems={12} />;
      }
    }

    const maxVisible = 9;
    const hiddenCount = entries.length - maxVisible;
    return (
      <div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {entries.slice(0, maxVisible).map(([k, v]) => (
            <div key={k} className="bg-white rounded-lg p-2.5 border border-gray-100 text-center">
              <div className="text-sm font-semibold text-gray-900">
                {typeof v === 'number' ? v : String(v)}
              </div>
              <div className="text-[10px] text-gray-500 mt-0.5 capitalize">
                {k.replace(/_/g, ' ')}
              </div>
            </div>
          ))}
        </div>
        {hiddenCount > 0 && (
          <div className="text-xs text-gray-400 text-center mt-2">+ {hiddenCount} more</div>
        )}
      </div>
    );
  }

  if (field.type === 'array' && Array.isArray(value)) {
    return (
      <div className="space-y-1">
        {value.map((item: any, i: number) => (
          <div key={i} className="bg-white rounded-lg px-3 py-2 border border-gray-100 text-sm">
            {String(item)}
          </div>
        ))}
      </div>
    );
  }

  return <span>{String(value)}</span>;
}
