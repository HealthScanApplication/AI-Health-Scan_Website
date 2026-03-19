import React, { useEffect, useState } from 'react';
import { Atom, ChevronDown, ChevronRight, CheckCircle, XCircle, Image as ImageIcon } from 'lucide-react';
import { Badge } from '../ui/badge';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

interface LinkedElement {
  id: string;
  slug: string;
  name_common: string;
  category: string;
  type_label?: string;
  health_role?: string;
  image_url?: string;
}

interface Props {
  /** The element_key value from the HS record */
  elementKey?: string;
  /** The record ID to look up via join table */
  recordId?: string;
  /** Which HS table this record belongs to */
  hsTable: 'hs_supplements' | 'hs_tests' | 'hs_products';
  accessToken?: string;
  onOpenElement?: (elementId: string) => void;
}

const PLACEHOLDER_IMG = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="48" height="48"%3E%3Crect fill="%23f3f4f6" width="48" height="48" rx="6"/%3E%3Ctext x="50%25" y="50%25" font-size="8" fill="%239ca3af" text-anchor="middle" dy=".3em"%3ENo img%3C/text%3E%3C/svg%3E';

const JOIN_TABLE_MAP: Record<string, { table: string; foreignKey: string }> = {
  hs_supplements: { table: 'element_supplements', foreignKey: 'supplement_id' },
  hs_tests: { table: 'element_tests', foreignKey: 'test_id' },
  hs_products: { table: 'element_products', foreignKey: 'product_id' },
};

export function LinkedElementsSection({ elementKey, recordId, hsTable, accessToken, onOpenElement }: Props) {
  const [elements, setElements] = useState<LinkedElement[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const headers: Record<string, string> = {
      apikey: publicAnonKey,
      Authorization: `Bearer ${accessToken || publicAnonKey}`,
    };

    const fetchElements = async () => {
      const foundElements: LinkedElement[] = [];

      // Strategy 1: Look up via element_key — try both nutrient_key and slug
      if (elementKey) {
        try {
          const encoded = encodeURIComponent(elementKey);
          const res = await fetch(
            `https://${projectId}.supabase.co/rest/v1/catalog_elements?select=id,slug,name_common,category,type_label,health_role,image_url&or=(nutrient_key.eq.${encoded},slug.eq.${encoded})&limit=10`,
            { headers }
          );
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data)) foundElements.push(...data);
          }
        } catch (err) {
          console.error('[LinkedElementsSection] element_key lookup failed:', err);
        }
      }

      // Strategy 2: Look up via join table if we have a record ID
      if (recordId) {
        const joinInfo = JOIN_TABLE_MAP[hsTable];
        if (joinInfo) {
          try {
            // First get element_ids from join table
            const joinRes = await fetch(
              `https://${projectId}.supabase.co/rest/v1/${joinInfo.table}?select=element_id&${joinInfo.foreignKey}=eq.${recordId}`,
              { headers }
            );
            if (joinRes.ok) {
              const joinData = await joinRes.json();
              const elementIds = Array.isArray(joinData)
                ? joinData.map((r: { element_id: string }) => r.element_id).filter(Boolean)
                : [];

              if (elementIds.length > 0) {
                // Fetch those elements
                const idFilter = elementIds.map((id: string) => `"${id}"`).join(',');
                const elemRes = await fetch(
                  `https://${projectId}.supabase.co/rest/v1/catalog_elements?select=id,slug,name_common,category,type_label,health_role,image_url&id=in.(${idFilter})`,
                  { headers }
                );
                if (elemRes.ok) {
                  const elemData = await elemRes.json();
                  if (Array.isArray(elemData)) {
                    // Merge, avoiding duplicates
                    const existingIds = new Set(foundElements.map(e => e.id));
                    for (const el of elemData) {
                      if (!existingIds.has(el.id)) foundElements.push(el);
                    }
                  }
                }
              }
            }
          } catch (err) {
            console.error('[LinkedElementsSection] join table lookup failed:', err);
          }
        }
      }

      if (!cancelled) {
        setElements(foundElements);
        setLoading(false);
      }
    };

    fetchElements();
    return () => { cancelled = true; };
  }, [elementKey, recordId, hsTable, accessToken]);

  const hasElements = elements.length > 0;

  return (
    <div className="border border-purple-200 rounded-xl overflow-hidden">
      {/* Header */}
      <button
        className="w-full flex items-center justify-between px-4 py-3 bg-purple-50 hover:bg-purple-100 transition-colors"
        onClick={() => setExpanded(v => !v)}
      >
        <div className="flex items-center gap-2">
          <Atom className="w-4 h-4 text-purple-600" />
          <span className="text-sm font-semibold text-purple-800">Linked Elements</span>
          {loading ? (
            <span className="text-xs text-purple-500">Loading…</span>
          ) : (
            <div className="flex items-center gap-1.5">
              {hasElements ? (
                <CheckCircle className="w-3.5 h-3.5 text-purple-600" />
              ) : (
                <XCircle className="w-3.5 h-3.5 text-gray-400" />
              )}
              <span className="text-xs text-purple-600">
                {elements.length} element{elements.length !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>
        {expanded ? <ChevronDown className="w-4 h-4 text-purple-600" /> : <ChevronRight className="w-4 h-4 text-purple-600" />}
      </button>

      {expanded && !loading && (
        <div className="px-4 py-3 bg-white">
          {!hasElements ? (
            <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 border border-dashed border-gray-300">
              <XCircle className="w-4 h-4 text-gray-400" />
              <span className="text-xs text-gray-500">
                No elements linked. Set the element_key field or add links via the join tables.
              </span>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {elements.map(el => (
                <button
                  key={el.id}
                  onClick={() => onOpenElement?.(el.id)}
                  className="flex items-center gap-2.5 bg-purple-50 border border-purple-200 hover:border-purple-400 rounded-lg p-2.5 transition-all text-left group"
                >
                  {/* Element image or placeholder */}
                  {el.image_url ? (
                    <img
                      src={el.image_url}
                      alt={el.name_common}
                      className="w-10 h-10 rounded-lg object-cover flex-shrink-0 border border-purple-100"
                      onError={(e) => { (e.target as HTMLImageElement).src = PLACEHOLDER_IMG; }}
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-purple-100 border border-purple-200 flex items-center justify-center flex-shrink-0">
                      <ImageIcon className="w-4 h-4 text-purple-400" />
                    </div>
                  )}
                  {/* Element info */}
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold text-purple-900 leading-tight truncate group-hover:text-purple-700">
                      {el.name_common}
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      {el.category && (
                        <Badge className="text-[9px] px-1 py-0 bg-purple-100 text-purple-700">
                          {el.category}
                        </Badge>
                      )}
                      {el.type_label && (
                        <span className="text-[9px] text-purple-500">{el.type_label}</span>
                      )}
                    </div>
                    {el.health_role && (
                      <div className="text-[10px] text-gray-500 mt-0.5 truncate">{el.health_role}</div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
