/**
 * PackageItemsPanel
 * =================
 * Manages the contents of an HS Package — add/remove supplements, tests,
 * products, and services with search. Shows images and quantities.
 */

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { CollapsibleSection } from '../ui/CollapsibleSection';
import {
  Search,
  Plus,
  X,
  Loader2,
  FlaskConical,
  Pill,
  Package,
  Briefcase,
  ImageIcon,
  GripVertical,
  Minus,
} from 'lucide-react';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import { toast } from 'sonner';
import type { AdminRecord } from '../../utils/adminHelpers';

/* ── Types ── */
interface PackageItem {
  junctionId: string;        // package_items.id
  item_type: string;         // supplement, test, product, service
  item_id: string;
  name: string;
  image_url?: string;
  category?: string;
  quantity: number;
  sort_order: number;
  is_optional: boolean;
  price_override?: number;
  notes?: string;
}

interface SearchResult {
  id: string;
  name: string;
  image_url?: string;
  icon_url?: string;
  category?: string;
}

interface PackageItemsPanelProps {
  record: AdminRecord;
  accessToken?: string;
}

const ITEM_TYPES = [
  { key: 'supplement', label: 'Supplements', table: 'hs_supplements', icon: Pill, color: 'text-green-600' },
  { key: 'test', label: 'Tests', table: 'hs_tests', icon: FlaskConical, color: 'text-blue-600' },
  { key: 'product', label: 'Products', table: 'hs_products', icon: Package, color: 'text-orange-600' },
  { key: 'service', label: 'Services', table: 'hs_services', icon: Briefcase, color: 'text-purple-600' },
] as const;

const PLACEHOLDER = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHJ4PSI4IiBmaWxsPSIjZjFmNWY5Ii8+PHBhdGggZD0iTTE2IDI0bDQtNCA0IDQiIHN0cm9rZT0iI2NiZDVlMSIgc3Ryb2tlLXdpZHRoPSIyIi8+PC9zdmc+';

/* ── REST helper ── */
async function supaFetch(path: string, token: string): Promise<unknown[]> {
  const res = await fetch(`https://${projectId}.supabase.co/rest/v1/${path}`, {
    headers: { Authorization: `Bearer ${token}`, apikey: publicAnonKey, 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

async function supaPost(path: string, body: Record<string, unknown>, token: string) {
  const res = await fetch(`https://${projectId}.supabase.co/rest/v1/${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      apikey: publicAnonKey,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`${res.status}: ${txt}`);
  }
  return res.json();
}

async function supaDelete(path: string, token: string) {
  const res = await fetch(`https://${projectId}.supabase.co/rest/v1/${path}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}`, apikey: publicAnonKey },
  });
  if (!res.ok) throw new Error(`${res.status}`);
}

async function supaPatch(path: string, body: Record<string, unknown>, token: string) {
  const res = await fetch(`https://${projectId}.supabase.co/rest/v1/${path}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      apikey: publicAnonKey,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
}

/* ── Component ── */
export function PackageItemsPanel({ record, accessToken: rawToken }: PackageItemsPanelProps) {
  const packageId = record.id as string;
  const accessToken = rawToken || '';
  const [items, setItems] = useState<PackageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSearchType, setActiveSearchType] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  /* ── Load package items ── */
  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      const rows = (await supaFetch(
        `package_items?package_id=eq.${packageId}&order=sort_order.asc,item_type.asc`,
        accessToken,
      )) as Array<Record<string, unknown>>;

      // Resolve names/images for each item from its source table
      const resolved: PackageItem[] = [];
      for (const row of rows) {
        const itemType = row.item_type as string;
        const itemId = row.item_id as string;
        const cfg = ITEM_TYPES.find(t => t.key === itemType);
        let name = itemId;
        let image_url: string | undefined;
        let category: string | undefined;

        if (cfg) {
          try {
            const detail = (await supaFetch(
              `${cfg.table}?id=eq.${itemId}&select=id,name,icon_url,image_url,category&limit=1`,
              accessToken,
            )) as Array<Record<string, unknown>>;
            if (detail.length > 0) {
              name = (detail[0].name as string) || itemId;
              image_url = (detail[0].icon_url as string) || (detail[0].image_url as string);
              category = detail[0].category as string;
            }
          } catch { /* skip resolution errors */ }
        }

        resolved.push({
          junctionId: row.id as string,
          item_type: itemType,
          item_id: itemId,
          name,
          image_url,
          category,
          quantity: (row.quantity as number) || 1,
          sort_order: (row.sort_order as number) || 0,
          is_optional: (row.is_optional as boolean) || false,
          price_override: row.price_override as number | undefined,
          notes: row.notes as string | undefined,
        });
      }
      setItems(resolved);
    } catch (err) {
      console.warn('[PackageItemsPanel] load failed:', err);
    } finally {
      setLoading(false);
    }
  }, [packageId, accessToken]);

  useEffect(() => { loadItems(); }, [loadItems]);

  /* ── Search ── */
  const doSearch = useCallback(async (q: string, type: string) => {
    if (q.length < 2) { setSearchResults([]); return; }
    const cfg = ITEM_TYPES.find(t => t.key === type);
    if (!cfg) return;
    setSearching(true);
    try {
      const rows = (await supaFetch(
        `${cfg.table}?select=id,name,icon_url,image_url,category&name=ilike.*${encodeURIComponent(q)}*&limit=10`,
        accessToken,
      )) as Array<Record<string, unknown>>;
      // Filter out items already in the package
      const existing = new Set(items.filter(i => i.item_type === type).map(i => i.item_id));
      setSearchResults(
        rows
          .filter(r => !existing.has(r.id as string))
          .map(r => ({
            id: r.id as string,
            name: (r.name as string) || 'Unknown',
            image_url: (r.icon_url as string) || (r.image_url as string),
            category: r.category as string,
          })),
      );
    } catch (err) {
      console.warn('[PackageItemsPanel] search failed:', err);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, [accessToken, items]);

  function handleSearchInput(q: string) {
    setSearchQuery(q);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (activeSearchType) doSearch(q, activeSearchType);
    }, 300);
  }

  /* ── Add item ── */
  async function handleAdd(type: string, itemId: string) {
    try {
      const maxSort = items.length > 0 ? Math.max(...items.map(i => i.sort_order)) + 1 : 0;
      await supaPost('package_items', {
        package_id: packageId,
        item_type: type,
        item_id: itemId,
        quantity: 1,
        sort_order: maxSort,
      }, accessToken);
      toast.success('Item added to package');
      setSearchQuery('');
      setSearchResults([]);
      await loadItems();
    } catch (err) {
      toast.error('Failed to add item');
      console.warn(err);
    }
  }

  /* ── Remove item ── */
  async function handleRemove(junctionId: string) {
    try {
      await supaDelete(`package_items?id=eq.${junctionId}`, accessToken);
      toast.success('Item removed from package');
      setItems(prev => prev.filter(i => i.junctionId !== junctionId));
    } catch (err) {
      toast.error('Failed to remove item');
      console.warn(err);
    }
  }

  /* ── Update quantity ── */
  async function handleQuantity(junctionId: string, delta: number) {
    const item = items.find(i => i.junctionId === junctionId);
    if (!item) return;
    const newQty = Math.max(1, item.quantity + delta);
    try {
      await supaPatch(`package_items?id=eq.${junctionId}`, { quantity: newQty }, accessToken);
      setItems(prev => prev.map(i => i.junctionId === junctionId ? { ...i, quantity: newQty } : i));
    } catch (err) {
      console.warn(err);
    }
  }

  /* ── Group items by type ── */
  const grouped = ITEM_TYPES.map(cfg => ({
    ...cfg,
    items: items.filter(i => i.item_type === cfg.key),
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8 text-gray-400">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        Loading package items…
      </div>
    );
  }

  return (
    <div className="space-y-4 mt-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <Package className="w-4 h-4" />
          Package Contents
          <Badge variant="outline" className="text-[10px]">{items.length} items</Badge>
        </h3>
      </div>

      {/* Add item buttons */}
      <div className="flex flex-wrap gap-2">
        {ITEM_TYPES.map(cfg => {
          const Icon = cfg.icon;
          const isActive = activeSearchType === cfg.key;
          return (
            <Button
              key={cfg.key}
              size="sm"
              variant={isActive ? 'default' : 'outline'}
              className="text-xs gap-1.5"
              onClick={() => {
                if (isActive) {
                  setActiveSearchType(null);
                  setSearchQuery('');
                  setSearchResults([]);
                } else {
                  setActiveSearchType(cfg.key);
                  setSearchQuery('');
                  setSearchResults([]);
                  setTimeout(() => searchRef.current?.focus(), 100);
                }
              }}
            >
              <Plus className="w-3 h-3" />
              <Icon className="w-3 h-3" />
              {cfg.label}
            </Button>
          );
        })}
      </div>

      {/* Search panel */}
      {activeSearchType && (
        <div className="border rounded-lg p-3 bg-gray-50 space-y-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-gray-400" />
            <Input
              ref={searchRef}
              value={searchQuery}
              onChange={e => handleSearchInput(e.target.value)}
              placeholder={`Search ${ITEM_TYPES.find(t => t.key === activeSearchType)?.label}…`}
              className="pl-8 text-sm h-9"
            />
            {searching && <Loader2 className="absolute right-2.5 top-2.5 w-4 h-4 animate-spin text-gray-400" />}
          </div>
          {searchResults.length > 0 && (
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {searchResults.map(r => (
                <button
                  key={r.id}
                  onClick={() => handleAdd(activeSearchType, r.id)}
                  className="flex items-center gap-2 w-full text-left px-2 py-1.5 rounded-md hover:bg-white transition-colors text-sm"
                >
                  <img
                    src={r.image_url || PLACEHOLDER}
                    alt=""
                    className="w-7 h-7 rounded-md object-cover bg-gray-100 flex-shrink-0"
                    onError={e => { (e.target as HTMLImageElement).src = PLACEHOLDER; }}
                  />
                  <span className="truncate flex-1 font-medium text-gray-700">{r.name}</span>
                  {r.category && (
                    <Badge variant="outline" className="text-[9px] flex-shrink-0">{r.category}</Badge>
                  )}
                  <Plus className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                </button>
              ))}
            </div>
          )}
          {searchQuery.length >= 2 && !searching && searchResults.length === 0 && (
            <p className="text-xs text-gray-400 py-2 text-center">No results found</p>
          )}
        </div>
      )}

      {/* Grouped item list */}
      {grouped.map(group => {
        if (group.items.length === 0) return null;
        const Icon = group.icon;
        return (
          <CollapsibleSection
            key={group.key}
            title={`${group.label} (${group.items.length})`}
            defaultExpanded
          >
            <div className="space-y-1">
              {group.items.map(item => (
                <div
                  key={item.junctionId}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-50 group transition-colors"
                >
                  <GripVertical className="w-3 h-3 text-gray-300 flex-shrink-0" />
                  <img
                    src={item.image_url || PLACEHOLDER}
                    alt=""
                    className="w-8 h-8 rounded-md object-cover bg-gray-100 flex-shrink-0"
                    onError={e => { (e.target as HTMLImageElement).src = PLACEHOLDER; }}
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-gray-800 truncate block">{item.name}</span>
                    {item.category && (
                      <span className="text-[10px] text-gray-400">{item.category}</span>
                    )}
                  </div>
                  {/* Quantity controls */}
                  <div className="flex items-center gap-1 bg-gray-100 rounded-md px-1">
                    <button
                      onClick={() => handleQuantity(item.junctionId, -1)}
                      className="p-0.5 hover:bg-gray-200 rounded"
                      disabled={item.quantity <= 1}
                      title="Decrease quantity"
                    >
                      <Minus className="w-3 h-3 text-gray-500" />
                    </button>
                    <span className="text-xs font-medium w-5 text-center">{item.quantity}</span>
                    <button
                      onClick={() => handleQuantity(item.junctionId, 1)}
                      className="p-0.5 hover:bg-gray-200 rounded"
                      title="Increase quantity"
                    >
                      <Plus className="w-3 h-3 text-gray-500" />
                    </button>
                  </div>
                  {item.is_optional && (
                    <Badge variant="outline" className="text-[9px] text-amber-600 border-amber-200">Optional</Badge>
                  )}
                  {/* Remove */}
                  <button
                    onClick={() => handleRemove(item.junctionId)}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-red-50 transition-all"
                    title="Remove from package"
                  >
                    <X className="w-3.5 h-3.5 text-red-400" />
                  </button>
                </div>
              ))}
            </div>
          </CollapsibleSection>
        );
      })}

      {items.length === 0 && (
        <div className="text-center py-8 text-gray-400 text-sm">
          <Package className="w-8 h-8 mx-auto mb-2 text-gray-300" />
          No items in this package yet. Use the buttons above to add supplements, tests, products, or services.
        </div>
      )}
    </div>
  );
}
