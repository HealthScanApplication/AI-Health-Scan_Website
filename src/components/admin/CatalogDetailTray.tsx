import React from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Trash2, Edit, Image as ImageIcon } from 'lucide-react';
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
}: CatalogDetailTrayProps) {
  const detailFields = getFieldsForView(activeTab, 'detail');

  // Partition fields into logical groups
  const headerFieldKeys = ['category', 'type', 'brand', 'scan_type', 'status'];
  const descField = detailFields.find((f) => f.key === 'description');
  const sectionedFields = detailFields.filter((f) => f.section);
  const sections = [...new Set(sectionedFields.map((f) => f.section!))];
  const unsectionedFields = detailFields
    .filter(
      (f) =>
        f.type !== 'image' &&
        !headerFieldKeys.includes(f.key) &&
        f.key !== 'description' &&
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

        {/* Description */}
        {descField && record.description && (
          <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-700 leading-relaxed">
            {record.description}
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
                          <FieldValue field={field} value={val} ipGeoData={ipGeoData} />
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

  return (
    <div className="relative w-full h-48 bg-gray-100 overflow-hidden">
      {hasRealImage ? (
        <img
          src={imageUrl}
          alt={getDisplayName(record)}
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center text-gray-300">
          <ImageIcon className="w-12 h-12" />
          <span className="text-xs mt-1.5 text-gray-400">No image</span>
        </div>
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
}: {
  section: string;
  fields: FieldConfig[];
  record: AdminRecord;
  ipGeoData: Record<string, GeoInfo>;
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
                <FieldValue field={f} value={expanded ? v : slice} ipGeoData={ipGeoData} />
              </div>
            );
          }

          if (typeof v === 'object' && v !== null) {
            const entries = Object.entries(v);
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
              <FieldValue field={f} value={v} ipGeoData={ipGeoData} />
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

function FieldValue({
  field,
  value,
  ipGeoData,
}: {
  field: FieldConfig;
  value: any;
  ipGeoData: Record<string, GeoInfo>;
}) {
  if (value == null || value === '' || value === 'null') return <span className="text-gray-400 text-xs">—</span>;

  if (field.type === 'boolean') {
    return (
      <Badge className={value ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}>
        {value ? 'Yes' : 'No'}
      </Badge>
    );
  }

  if (field.type === 'date') {
    const d = new Date(value);
    return (
      <span>
        {d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}{' '}
        <span className="text-gray-400">
          {d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
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

  if (
    (field.key === 'signupDate' ||
      field.key === 'created_at' ||
      field.key === 'lastActiveDate' ||
      field.key === 'lastReferralDate') &&
    value
  ) {
    const d = new Date(value);
    return (
      <span>
        {d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}{' '}
        <span className="text-gray-400">
          {d.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
          })}
        </span>
      </span>
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
    const entries = Object.entries(value);
    if (entries.length === 0) return <span className="text-gray-400 text-xs">Empty</span>;
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {entries.slice(0, 9).map(([k, v]) => (
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
