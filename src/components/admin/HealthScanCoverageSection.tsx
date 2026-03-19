import React, { useEffect, useState } from 'react';
import { FlaskConical, Pill, ExternalLink, CheckCircle, XCircle, ChevronDown, ChevronRight, ShoppingCart, Package, Box, Image as ImageIcon } from 'lucide-react';
import { Badge } from '../ui/badge';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

interface HsTest {
  id: string;
  slug: string;
  name: string;
  category: string;
  sample_type: string;
  turnaround_days: number;
  retail_price_eur: number;
  gross_margin_pct: number;
  element_key: string;
  is_active: boolean;
  buy_url?: string;
  sample_order_url?: string;
  image_url?: string;
  icon_url?: string;
  api_dropship_available?: boolean;
  api_dropship_connected?: boolean;
}

interface HsSupplement {
  id: string;
  slug: string;
  name: string;
  element_key: string;
  category: string;
  region: string;
  currency: string;
  retail_price: number;
  margin_pct: number;
  supplier: string;
  affiliate_url?: string;
  buy_url?: string;
  amazon_url?: string;
  iherb_url?: string;
  image_url?: string;
  icon_url?: string;
  is_active: boolean;
}

interface HsProduct {
  id: string;
  slug: string;
  name: string;
  product_type: string;
  category: string;
  element_key: string;
  retail_price: number;
  currency: string;
  region: string;
  supplier: string;
  buy_url?: string;
  image_url?: string;
  icon_url?: string;
  is_active: boolean;
}

interface Props {
  /** Single element key (for element detail view) */
  elementKey?: string;
  /** Multiple element keys (for ingredient detail view) */
  elementKeys?: string[];
  accessToken?: string;
  onOpenTest?: (testId: string) => void;
  onOpenSupplement?: (supplementId: string) => void;
  onOpenProduct?: (productId: string) => void;
}

const REGION_FLAGS: Record<string, string> = { EU: '🇪🇺', UK: '🇬🇧', US: '🇺🇸', AU: '🇦🇺', ROW: '🌍' };

const SAMPLE_LABELS: Record<string, string> = {
  BLOOD_FINGER_PRICK: 'Blood',
  URINE: 'Urine',
  SALIVA: 'Saliva',
  STOOL: 'Stool',
  DRIED_URINE: 'Dried Urine',
};

export function HealthScanCoverageSection({ elementKey, elementKeys, accessToken, onOpenTest, onOpenSupplement, onOpenProduct }: Props) {
  const [tests, setTests] = useState<HsTest[]>([]);
  const [supplements, setSupplements] = useState<HsSupplement[]>([]);
  const [products, setProducts] = useState<HsProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(true);

  const keys = elementKeys ?? (elementKey ? [elementKey] : []);

  useEffect(() => {
    if (!keys.length) { setLoading(false); return; }

    let cancelled = false;
    setLoading(true);

    const headers: Record<string, string> = {
      apikey: publicAnonKey,
      Authorization: `Bearer ${accessToken || publicAnonKey}`,
    };

    const keyFilter = keys.map(k => `"${k}"`).join(',');

    Promise.all([
      fetch(`https://${projectId}.supabase.co/rest/v1/hs_tests?element_key=in.(${keyFilter})&order=category.asc,name.asc`, { headers }).then(r => r.ok ? r.json() : []),
      fetch(`https://${projectId}.supabase.co/rest/v1/hs_supplements?element_key=in.(${keyFilter})&order=region.asc,name.asc`, { headers }).then(r => r.ok ? r.json() : []),
      fetch(`https://${projectId}.supabase.co/rest/v1/hs_products?element_key=in.(${keyFilter})&order=category.asc,name.asc`, { headers }).then(r => r.ok ? r.json() : []),
    ]).then(([t, s, p]) => {
      if (!cancelled) {
        setTests(Array.isArray(t) ? t : []);
        setSupplements(Array.isArray(s) ? s : []);
        setProducts(Array.isArray(p) ? p : []);
        setLoading(false);
      }
    }).catch(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [keys.join(','), accessToken]);

  const hasTests = tests.length > 0;
  const hasSupplements = supplements.length > 0;
  const hasProducts = products.length > 0;
  const hasCoverage = hasTests || hasSupplements || hasProducts;

  return (
    <div className="border border-teal-200 rounded-xl overflow-hidden">
      {/* Header */}
      <button
        className="w-full flex items-center justify-between px-4 py-3 bg-teal-50 hover:bg-teal-100 transition-colors"
        onClick={() => setExpanded(v => !v)}
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-teal-800">HealthScan Coverage</span>
          {loading ? (
            <span className="text-xs text-teal-500">Loading…</span>
          ) : (
            <div className="flex items-center gap-1.5">
              {hasCoverage ? (
                <CheckCircle className="w-3.5 h-3.5 text-teal-600" />
              ) : (
                <XCircle className="w-3.5 h-3.5 text-gray-400" />
              )}
              <span className="text-xs text-teal-600">
                {tests.length} test{tests.length !== 1 ? 's' : ''} · {supplements.length} supplement{supplements.length !== 1 ? 's' : ''}{products.length > 0 ? ` · ${products.length} product${products.length !== 1 ? 's' : ''}` : ''}
              </span>
            </div>
          )}
        </div>
        {expanded ? <ChevronDown className="w-4 h-4 text-teal-600" /> : <ChevronRight className="w-4 h-4 text-teal-600" />}
      </button>

      {expanded && !loading && (
        <div className="px-4 py-3 space-y-4 bg-white">
          {/* Tests */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <FlaskConical className="w-3.5 h-3.5 text-indigo-500" />
              <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Tests</span>
            </div>
            {!hasTests ? (
              <p className="text-xs text-gray-400 italic">No HealthScan test linked to this element</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {tests.map(test => (
                  <div
                    key={test.id}
                    className="flex flex-col gap-1.5 bg-indigo-50 border border-indigo-200 hover:border-indigo-300 rounded-lg p-2.5 transition-colors min-w-[180px] max-w-[220px]"
                  >
                    {/* Test info row */}
                    <button
                      onClick={() => onOpenTest?.(test.id)}
                      className="flex items-start gap-1.5 text-left group"
                    >
                      {test.icon_url || test.image_url ? (
                        <img src={test.icon_url || test.image_url} alt="" className="w-6 h-6 rounded object-cover flex-shrink-0" />
                      ) : (
                        <FlaskConical className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
                      )}
                      <div className="min-w-0">
                        <div className="text-xs font-medium text-indigo-800 leading-tight">{test.name}</div>
                        <div className="text-[10px] text-indigo-500 mt-0.5">
                          {SAMPLE_LABELS[test.sample_type] ?? test.sample_type} · {test.turnaround_days}d · €{test.retail_price_eur}
                        </div>
                        {(test.api_dropship_available || test.api_dropship_connected) && (
                          <div className="text-[9px] mt-0.5">
                            {test.api_dropship_connected
                              ? <span className="text-green-600 font-medium">✓ API connected</span>
                              : <span className="text-amber-500">API available</span>}
                          </div>
                        )}
                      </div>
                      {onOpenTest && <ExternalLink className="w-3 h-3 text-indigo-300 group-hover:text-indigo-500 flex-shrink-0 ml-auto" />}
                    </button>
                    {/* Action buttons */}
                    <div className="flex gap-1">
                      {test.buy_url && (
                        <a
                          href={test.buy_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={e => e.stopPropagation()}
                          className="flex-1 flex items-center justify-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-semibold py-1 px-1.5 rounded transition-colors"
                        >
                          <ShoppingCart className="w-2.5 h-2.5" />
                          Buy
                        </a>
                      )}
                      {test.sample_order_url && (
                        <a
                          href={test.sample_order_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={e => e.stopPropagation()}
                          className="flex-1 flex items-center justify-center gap-1 bg-white hover:bg-indigo-50 border border-indigo-300 text-indigo-700 text-[10px] font-medium py-1 px-1.5 rounded transition-colors"
                        >
                          <Package className="w-2.5 h-2.5" />
                          Sample
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Supplements */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Pill className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Supplements</span>
            </div>
            {!hasSupplements ? (
              <p className="text-xs text-gray-400 italic">No HealthScan supplement linked to this element</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {supplements.map(supp => (
                  <div
                    key={supp.id}
                    className="flex flex-col gap-1.5 bg-emerald-50 border border-emerald-200 hover:border-emerald-300 rounded-lg p-2.5 transition-colors min-w-[160px] max-w-[200px]"
                  >
                    <button
                      onClick={() => onOpenSupplement?.(supp.id)}
                      className="flex items-start gap-1.5 text-left group"
                    >
                      {supp.icon_url || supp.image_url ? (
                        <img src={supp.icon_url || supp.image_url} alt="" className="w-6 h-6 rounded object-cover flex-shrink-0" />
                      ) : (
                        <span className="text-base leading-none flex-shrink-0">{REGION_FLAGS[supp.region] ?? '🌍'}</span>
                      )}
                      <div className="min-w-0">
                        <div className="text-xs font-medium text-emerald-800 leading-tight">{supp.name}</div>
                        <div className="text-[10px] text-emerald-600 mt-0.5">
                          {supp.currency} {supp.retail_price}
                          {supp.supplier ? ` · ${supp.supplier}` : ''}
                        </div>
                      </div>
                      {onOpenSupplement && <ExternalLink className="w-3 h-3 text-emerald-300 group-hover:text-emerald-500 flex-shrink-0 ml-auto" />}
                    </button>
                    {/* Buy links */}
                    {(supp.buy_url || supp.affiliate_url || supp.amazon_url || supp.iherb_url) && (
                      <div className="flex flex-wrap gap-1">
                        {(supp.buy_url || supp.affiliate_url) && (
                          <a href={supp.buy_url || supp.affiliate_url} target="_blank" rel="noopener noreferrer"
                            className="flex-1 flex items-center justify-center gap-0.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-semibold py-1 px-1.5 rounded transition-colors">
                            <ShoppingCart className="w-2.5 h-2.5" />Buy
                          </a>
                        )}
                        {supp.amazon_url && (
                          <a href={supp.amazon_url} target="_blank" rel="noopener noreferrer"
                            className="flex items-center justify-center bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-semibold py-1 px-1.5 rounded transition-colors">
                            Amazon
                          </a>
                        )}
                        {supp.iherb_url && (
                          <a href={supp.iherb_url} target="_blank" rel="noopener noreferrer"
                            className="flex items-center justify-center bg-green-600 hover:bg-green-700 text-white text-[10px] font-semibold py-1 px-1.5 rounded transition-colors">
                            iHerb
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Products */}
          {hasProducts && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Box className="w-3.5 h-3.5 text-teal-500" />
                <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Products</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {products.map(prod => (
                  <div
                    key={prod.id}
                    className="flex flex-col gap-1.5 bg-teal-50 border border-teal-200 hover:border-teal-300 rounded-lg p-2.5 transition-colors min-w-[160px] max-w-[200px]"
                  >
                    <button
                      onClick={() => onOpenProduct?.(prod.id)}
                      className="flex items-start gap-1.5 text-left group"
                    >
                      {prod.icon_url || prod.image_url ? (
                        <img src={prod.icon_url || prod.image_url} alt="" className="w-6 h-6 rounded object-cover flex-shrink-0" />
                      ) : (
                        <ImageIcon className="w-4 h-4 text-teal-400 flex-shrink-0 mt-0.5" />
                      )}
                      <div className="min-w-0">
                        <div className="text-xs font-medium text-teal-800 leading-tight">{prod.name}</div>
                        <div className="text-[10px] text-teal-600 mt-0.5">
                          {prod.currency} {prod.retail_price}
                          {prod.supplier ? ` · ${prod.supplier}` : ''}
                        </div>
                      </div>
                      {onOpenProduct && <ExternalLink className="w-3 h-3 text-teal-300 group-hover:text-teal-500 flex-shrink-0 ml-auto" />}
                    </button>
                    {prod.buy_url && (
                      <div className="flex gap-1">
                        <a href={prod.buy_url} target="_blank" rel="noopener noreferrer"
                          className="flex-1 flex items-center justify-center gap-0.5 bg-teal-600 hover:bg-teal-700 text-white text-[10px] font-semibold py-1 px-1.5 rounded transition-colors">
                          <ShoppingCart className="w-2.5 h-2.5" />Buy
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Coverage summary badge */}
          {!hasCoverage && (
            <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 border border-dashed border-gray-300">
              <XCircle className="w-4 h-4 text-gray-400" />
              <span className="text-xs text-gray-500">This element is not yet covered by HealthScan tests, supplements or products. Add via the HS tabs.</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Ingredient-level coverage: derives element keys from elements_content JSONB
 * then shows aggregated test + supplement coverage.
 */
export function IngredientCoverageSection({ record, accessToken, onOpenTest, onOpenSupplement }: {
  record: any;
  accessToken?: string;
  onOpenTest?: (testId: string) => void;
  onOpenSupplement?: (supplementId: string) => void;
}) {
  const elementsContent = record?.elements_content;
  const elementsBeneficial = record?.elements_beneficial;

  let keys: string[] = [];

  if (elementsContent && typeof elementsContent === 'object' && !Array.isArray(elementsContent)) {
    keys = Object.keys(elementsContent);
  } else if (Array.isArray(elementsBeneficial)) {
    keys = elementsBeneficial.filter((k: any) => typeof k === 'string');
  }

  if (!keys.length) {
    return (
      <div className="border border-gray-200 rounded-xl p-4 bg-gray-50 text-center">
        <p className="text-xs text-gray-400">No element links found — add element keys to elements_content to see HealthScan coverage.</p>
      </div>
    );
  }

  return (
    <HealthScanCoverageSection
      elementKeys={keys}
      accessToken={accessToken}
      onOpenTest={onOpenTest}
      onOpenSupplement={onOpenSupplement}
    />
  );
}
