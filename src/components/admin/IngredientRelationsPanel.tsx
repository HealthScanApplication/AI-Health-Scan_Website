/**
 * IngredientRelationsPanel
 * ========================
 * Shows all related records for an ingredient:
 *   1. Elements (junction + JSONB merged) with search/add/remove
 *   2. Sub-ingredients (raw ingredients of processed items)
 *   3. Recipes using this ingredient
 *   4. Products using this ingredient
 *
 * Reads from BOTH junction tables AND JSONB to avoid data loss.
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
  Apple,
  Utensils,
  Package,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  Leaf,
  ImageIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface IngredientRelationsPanelProps {
  record: any;
  accessToken?: string;
}

interface ElementItem {
  id: string;
  name: string;
  category?: string;
  type_label?: string;
  image_url?: string;
  amount_per_100g?: number;
  unit_per_100g?: string;
  is_primary?: boolean;
  source: 'junction' | 'jsonb' | 'both';
}

interface RecipeItem {
  id: string;
  name: string;
  category?: string;
  image_url?: string;
  qty_g?: number;
  unit?: string;
}

interface ProductItem {
  id: string;
  name: string;
  category?: string;
  image_url?: string;
  is_main?: boolean;
}

interface SubIngredient {
  id: string;
  name: string;
  category?: string;
  image_url?: string;
}

/* ------------------------------------------------------------------ */
/*  Helper: REST fetch from staging Supabase                           */
/* ------------------------------------------------------------------ */

async function supaFetch(path: string, token?: string) {
  const url = `https://${projectId}.supabase.co/rest/v1/${path}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token || publicAnonKey}`,
      apikey: publicAnonKey,
    },
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

async function supaPost(path: string, body: any, token?: string) {
  const url = `https://${projectId}.supabase.co/rest/v1/${path}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token || publicAnonKey}`,
      apikey: publicAnonKey,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status}: ${text}`);
  }
}

async function supaDelete(path: string, token?: string) {
  const url = `https://${projectId}.supabase.co/rest/v1/${path}`;
  const res = await fetch(url, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token || publicAnonKey}`,
      apikey: publicAnonKey,
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status}: ${text}`);
  }
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function IngredientRelationsPanel({ record, accessToken }: IngredientRelationsPanelProps) {
  const [elements, setElements] = useState<ElementItem[]>([]);
  const [recipes, setRecipes] = useState<RecipeItem[]>([]);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [subIngredients, setSubIngredients] = useState<SubIngredient[]>([]);
  const [loading, setLoading] = useState(true);

  const ingredientId = record?.id;
  const isProcessed = record?.processing_type && record.processing_type !== 'raw';

  useEffect(() => {
    if (!ingredientId) return;
    loadAll();
  }, [ingredientId]);

  async function loadAll() {
    setLoading(true);
    try {
      await Promise.all([
        loadElements(),
        loadRecipes(),
        loadProducts(),
        isProcessed ? loadSubIngredients() : Promise.resolve(),
      ]);
    } catch (err) {
      console.error('[IngredientRelationsPanel] Load error:', err);
    } finally {
      setLoading(false);
    }
  }

  /* ── Load Elements: merge junction table + JSONB ── */
  async function loadElements() {
    const merged = new Map<string, ElementItem>();

    // 1) Junction table: catalog_ingredient_elements
    try {
      const junctionRows: any[] = await supaFetch(
        `catalog_ingredient_elements?select=id,element_id,amount_per_100g,unit_per_100g,is_primary,catalog_elements(id,name_common,category,type_label,image_url)&ingredient_id=eq.${ingredientId}&order=amount_per_100g.desc.nullslast`,
        accessToken,
      );
      for (const row of junctionRows) {
        const el = row.catalog_elements;
        if (!el) continue;
        merged.set(el.id, {
          id: el.id,
          name: el.name_common || el.id,
          category: el.category,
          type_label: el.type_label,
          image_url: el.image_url,
          amount_per_100g: row.amount_per_100g,
          unit_per_100g: row.unit_per_100g,
          is_primary: row.is_primary,
          source: 'junction',
        });
      }
    } catch (err) {
      console.warn('[IngredientRelationsPanel] Junction table query failed (table may not exist yet):', err);
    }

    // 2) JSONB: elements_content
    if (record.elements_content && typeof record.elements_content === 'object') {
      for (const [key, val] of Object.entries(record.elements_content)) {
        if (merged.has(key)) {
          merged.get(key)!.source = 'both';
        } else {
          const v = val as any;
          merged.set(key, {
            id: key,
            name: key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
            amount_per_100g: v?.amount ?? v?.value,
            unit_per_100g: v?.unit ?? 'mg',
            source: 'jsonb',
          });
        }
      }
    }

    // 3) JSONB: elements_beneficial (nested per_100g structure)
    if (record.elements_beneficial && typeof record.elements_beneficial === 'object') {
      const eb = record.elements_beneficial;
      const sections = eb.per_100g || eb;
      for (const [sectionKey, sectionVal] of Object.entries(sections)) {
        if (sectionKey === 'calories' || typeof sectionVal !== 'object' || !sectionVal) continue;
        for (const [elKey, elVal] of Object.entries(sectionVal as any)) {
          if (merged.has(elKey)) {
            merged.get(elKey)!.source = 'both';
          } else {
            const v = elVal as any;
            const amount = typeof v === 'number' ? v : v?.amount ?? v?.value;
            const unit = typeof v === 'object' ? (v?.unit ?? 'mg') : (elKey.endsWith('_g') ? 'g' : 'mg');
            merged.set(elKey, {
              id: elKey,
              name: elKey.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
              category: sectionKey === 'vitamins' ? 'Vitamin' : sectionKey === 'minerals' ? 'Mineral' : 'Macronutrient',
              amount_per_100g: amount,
              unit_per_100g: unit,
              source: 'jsonb',
            });
          }
        }
      }
    }

    // 4) JSONB: elements_hazardous
    if (record.elements_hazardous && typeof record.elements_hazardous === 'object') {
      for (const [key, val] of Object.entries(record.elements_hazardous)) {
        if (merged.has(key)) {
          merged.get(key)!.source = 'both';
        } else {
          const v = val as any;
          merged.set(key, {
            id: key,
            name: key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
            category: 'Hazardous Element',
            amount_per_100g: v?.amount ?? v?.level,
            unit_per_100g: v?.unit ?? v?.risk_level ?? '',
            source: 'jsonb',
          });
        }
      }
    }

    // Resolve names/images for JSONB-only elements by looking up catalog_elements
    const jsonbOnlyKeys = [...merged.values()].filter(e => e.source === 'jsonb').map(e => e.id);
    if (jsonbOnlyKeys.length > 0) {
      try {
        const filter = jsonbOnlyKeys.map(k => `"${k}"`).join(',');
        const resolved: any[] = await supaFetch(
          `catalog_elements?select=id,name_common,category,type_label,image_url&or=(id.in.(${filter}),nutrient_key.in.(${filter}),slug.in.(${filter}))`,
          accessToken,
        );
        for (const r of resolved) {
          // Find which key matches
          const matchKey = jsonbOnlyKeys.find(k => k === r.id || k === r.nutrient_key || k === r.slug);
          if (matchKey && merged.has(matchKey)) {
            const existing = merged.get(matchKey)!;
            existing.name = r.name_common || existing.name;
            existing.category = r.category || existing.category;
            existing.type_label = r.type_label;
            existing.image_url = r.image_url;
            // Update the key to the real element ID
            if (matchKey !== r.id) {
              merged.delete(matchKey);
              merged.set(r.id, { ...existing, id: r.id });
            }
          }
        }
      } catch (err) {
        console.warn('[IngredientRelationsPanel] Failed to resolve JSONB element names:', err);
      }
    }

    setElements([...merged.values()].sort((a, b) => (b.amount_per_100g || 0) - (a.amount_per_100g || 0)));
  }

  /* ── Load Recipes using this ingredient ── */
  async function loadRecipes() {
    try {
      const rows: any[] = await supaFetch(
        `recipe_ingredients?select=id,qty_g,unit,catalog_recipes(id,name_common,category,image_url)&ingredient_id=eq.${ingredientId}&order=qty_g.desc.nullslast`,
        accessToken,
      );
      setRecipes(
        rows
          .filter(r => r.catalog_recipes)
          .map(r => ({
            id: r.catalog_recipes.id,
            name: r.catalog_recipes.name_common || 'Unknown',
            category: r.catalog_recipes.category,
            image_url: r.catalog_recipes.image_url,
            qty_g: r.qty_g,
            unit: r.unit,
          })),
      );
    } catch (err) {
      console.warn('[IngredientRelationsPanel] recipe_ingredients query failed:', err);
      setRecipes([]);
    }
  }

  /* ── Load Products using this ingredient ── */
  async function loadProducts() {
    try {
      const rows: any[] = await supaFetch(
        `product_ingredients?select=id,is_main,catalog_products(id,name,category,image_url)&ingredient_id=eq.${ingredientId}`,
        accessToken,
      );
      setProducts(
        rows
          .filter(r => r.catalog_products)
          .map(r => ({
            id: r.catalog_products.id,
            name: r.catalog_products.name || 'Unknown',
            category: r.catalog_products.category,
            image_url: r.catalog_products.image_url,
            is_main: r.is_main,
          })),
      );
    } catch (err) {
      console.warn('[IngredientRelationsPanel] product_ingredients query failed:', err);
      setProducts([]);
    }
  }

  /* ── Load Sub-ingredients (raw ingredients of processed items) ── */
  async function loadSubIngredients() {
    const rawIds = record.raw_ingredients;
    if (!rawIds || !Array.isArray(rawIds) || rawIds.length === 0) {
      setSubIngredients([]);
      return;
    }
    try {
      const filter = rawIds.map((id: string) => `"${id}"`).join(',');
      const rows: any[] = await supaFetch(
        `catalog_ingredients?select=id,name_common,category,image_url&id=in.(${filter})`,
        accessToken,
      );
      setSubIngredients(
        rows.map(r => ({
          id: r.id,
          name: r.name_common || r.id,
          category: r.category,
          image_url: r.image_url,
        })),
      );
    } catch (err) {
      console.warn('[IngredientRelationsPanel] Failed to load sub-ingredients:', err);
      setSubIngredients([]);
    }
  }

  /* ── Add element to junction table ── */
  async function handleAddElement(elementId: string) {
    try {
      await supaPost(
        'catalog_ingredient_elements',
        {
          ingredient_id: ingredientId,
          element_id: elementId,
          is_primary: false,
        },
        accessToken,
      );
      toast.success('Element linked');
      await loadElements();
    } catch (err: any) {
      if (err.message?.includes('409') || err.message?.includes('duplicate') || err.message?.includes('23505')) {
        toast.info('Element already linked');
      } else {
        toast.error(`Failed to link: ${err.message}`);
      }
    }
  }

  /* ── Remove element from junction table ── */
  async function handleRemoveElement(elementId: string) {
    try {
      await supaDelete(
        `catalog_ingredient_elements?ingredient_id=eq.${ingredientId}&element_id=eq.${elementId}`,
        accessToken,
      );
      toast.success('Element unlinked');
      await loadElements();
    } catch (err: any) {
      toast.error(`Failed to unlink: ${err.message}`);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6 text-gray-400">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        Loading related records...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ── Elements Section ── */}
      <ElementsSection
        elements={elements}
        onAdd={handleAddElement}
        onRemove={handleRemoveElement}
        accessToken={accessToken}
      />

      {/* ── Sub-ingredients (if processed) ── */}
      {isProcessed && (
        <RelatedItemsSection
          title="Raw Ingredients"
          icon={<Leaf className="h-4 w-4 text-green-600" />}
          items={subIngredients.map(s => ({
            id: s.id,
            name: s.name,
            image_url: s.image_url,
            category: s.category,
          }))}
          emptyText="No raw ingredient links — add source ingredients in the Processing section"
        />
      )}

      {/* ── Recipes Section ── */}
      <RelatedItemsSection
        title="Recipes Using This Ingredient"
        icon={<Utensils className="h-4 w-4 text-orange-600" />}
        items={recipes.map(r => ({
          id: r.id,
          name: r.name,
          image_url: r.image_url,
          category: r.category,
          badge: r.qty_g ? `${r.qty_g}${r.unit || 'g'}` : undefined,
        }))}
        emptyText="No recipe links found"
      />

      {/* ── Products Section ── */}
      <RelatedItemsSection
        title="Products Containing This Ingredient"
        icon={<Package className="h-4 w-4 text-blue-600" />}
        items={products.map(p => ({
          id: p.id,
          name: p.name,
          image_url: p.image_url,
          category: p.category,
          badge: p.is_main ? 'Main' : undefined,
        }))}
        emptyText="No product links found"
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Elements Section with Search + Add/Remove                          */
/* ------------------------------------------------------------------ */

function ElementsSection({
  elements,
  onAdd,
  onRemove,
  accessToken,
}: {
  elements: ElementItem[];
  onAdd: (elementId: string) => void;
  onRemove: (elementId: string) => void;
  accessToken?: string;
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  const linkedIds = new Set(elements.map(e => e.id));

  const doSearch = useCallback(
    async (query: string) => {
      if (query.length < 2) {
        setSearchResults([]);
        return;
      }
      setSearching(true);
      try {
        const results: any[] = await supaFetch(
          `catalog_elements?select=id,name_common,category,type_label,image_url&or=(name_common.ilike.*${encodeURIComponent(query)}*,slug.ilike.*${encodeURIComponent(query)}*,nutrient_key.ilike.*${encodeURIComponent(query)}*)&limit=20&order=name_common`,
          accessToken,
        );
        setSearchResults(results);
      } catch (err) {
        console.error('[ElementsSection] Search failed:', err);
      } finally {
        setSearching(false);
      }
    },
    [accessToken],
  );

  const handleSearchInput = (value: string) => {
    setSearchQuery(value);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => doSearch(value), 300);
  };

  const getCategoryColor = (category?: string) => {
    if (!category) return 'bg-gray-100 text-gray-700';
    if (category.toLowerCase().includes('vitamin')) return 'bg-green-100 text-green-800';
    if (category.toLowerCase().includes('mineral')) return 'bg-purple-100 text-purple-800';
    if (category.toLowerCase().includes('macro')) return 'bg-blue-100 text-blue-800';
    if (category.toLowerCase().includes('hazard')) return 'bg-red-100 text-red-800';
    if (category.toLowerCase().includes('phytochemical') || category.toLowerCase().includes('bioactive')) return 'bg-amber-100 text-amber-800';
    return 'bg-gray-100 text-gray-700';
  };

  const beneficialElements = elements.filter(e => e.category !== 'Hazardous Element');
  const hazardousElements = elements.filter(e => e.category === 'Hazardous Element');

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Apple className="h-4 w-4 text-emerald-600" />
          <span className="text-sm font-semibold text-gray-800">
            Elements ({elements.length})
          </span>
          {elements.some(e => e.source === 'jsonb') && (
            <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-300">
              includes JSONB data
            </Badge>
          )}
        </div>
        <Button
          size="sm"
          variant={showSearch ? 'default' : 'outline'}
          className="h-7 text-xs gap-1"
          onClick={() => setShowSearch(!showSearch)}
        >
          {showSearch ? <X className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
          {showSearch ? 'Close' : 'Add Element'}
        </Button>
      </div>

      {/* Search bar */}
      {showSearch && (
        <div className="px-4 py-3 bg-white border-b border-gray-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSearchInput(e.target.value)}
              placeholder="Search elements... (e.g. thymoquinone, vitamin c, iron)"
              className="pl-10 h-9 text-sm"
              autoFocus
            />
            {searching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />}
          </div>

          {/* Search results */}
          {searchResults.length > 0 && (
            <div className="mt-2 max-h-60 overflow-y-auto space-y-1">
              {searchResults.map(result => {
                const isLinked = linkedIds.has(result.id);
                return (
                  <div
                    key={result.id}
                    className={`flex items-center gap-3 p-2 rounded-lg ${isLinked ? 'bg-green-50' : 'hover:bg-gray-50 cursor-pointer'}`}
                    onClick={() => !isLinked && onAdd(result.id)}
                  >
                    <div className="w-8 h-8 rounded bg-gray-100 overflow-hidden flex-shrink-0">
                      {result.image_url ? (
                        <img src={result.image_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                          <Apple className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{result.name_common}</div>
                      <div className="text-[10px] text-gray-400">{result.id}</div>
                    </div>
                    <Badge className={`text-[10px] ${getCategoryColor(result.category)}`}>
                      {result.category || 'Unknown'}
                    </Badge>
                    {isLinked ? (
                      <Badge className="bg-green-100 text-green-700 text-[10px]">Linked</Badge>
                    ) : (
                      <Plus className="h-4 w-4 text-gray-400" />
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {searchQuery.length >= 2 && !searching && searchResults.length === 0 && (
            <div className="mt-2 text-center text-xs text-gray-400 py-3">
              No elements found for "{searchQuery}"
            </div>
          )}
        </div>
      )}

      {/* Beneficial Elements */}
      {beneficialElements.length > 0 && (
        <div className="px-4 py-3">
          <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Beneficial ({beneficialElements.length})
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {beneficialElements.map(el => (
              <ElementCard key={el.id} element={el} onRemove={onRemove} getCategoryColor={getCategoryColor} />
            ))}
          </div>
        </div>
      )}

      {/* Hazardous Elements */}
      {hazardousElements.length > 0 && (
        <div className="px-4 py-3 bg-red-50/50">
          <div className="text-[10px] font-semibold text-red-400 uppercase tracking-wider mb-2 flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            Hazardous ({hazardousElements.length})
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {hazardousElements.map(el => (
              <ElementCard key={el.id} element={el} onRemove={onRemove} getCategoryColor={getCategoryColor} />
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {elements.length === 0 && (
        <div className="px-4 py-8 text-center">
          <Apple className="h-8 w-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-400">No elements linked yet</p>
          <p className="text-xs text-gray-300 mt-1">Click "Add Element" to search and link elements</p>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Element Card                                                       */
/* ------------------------------------------------------------------ */

function ElementCard({
  element,
  onRemove,
  getCategoryColor,
}: {
  element: ElementItem;
  onRemove: (id: string) => void;
  getCategoryColor: (cat?: string) => string;
}) {
  return (
    <div className="flex items-center gap-3 p-2 rounded-lg bg-white border border-gray-100 hover:border-gray-200 group transition-colors">
      {/* Image */}
      <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
        {element.image_url ? (
          <img
            src={element.image_url}
            alt={element.name}
            className="w-full h-full object-cover"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <Apple className="h-5 w-5" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1">
          <span className="text-sm font-medium text-gray-800 truncate">{element.name}</span>
          {element.is_primary && (
            <Badge className="bg-yellow-100 text-yellow-700 text-[8px] px-1">Primary</Badge>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <Badge className={`text-[9px] px-1 py-0 ${getCategoryColor(element.category)}`}>
            {element.category || 'Unknown'}
          </Badge>
          {element.amount_per_100g != null && (
            <span className="text-[10px] text-gray-500">
              {typeof element.amount_per_100g === 'number'
                ? element.amount_per_100g.toFixed(1)
                : element.amount_per_100g}
              {element.unit_per_100g ? ` ${element.unit_per_100g}` : ''}
            </span>
          )}
          {element.source === 'jsonb' && (
            <Badge variant="outline" className="text-[8px] text-amber-500 border-amber-200 px-1 py-0">
              JSONB only
            </Badge>
          )}
        </div>
      </div>

      {/* Remove button */}
      <button
        onClick={() => onRemove(element.id)}
        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md hover:bg-red-50 text-gray-400 hover:text-red-500"
        title="Remove element link"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Related Items Section (Recipes, Products, Sub-ingredients)         */
/* ------------------------------------------------------------------ */

function RelatedItemsSection({
  title,
  icon,
  items,
  emptyText,
}: {
  title: string;
  icon: React.ReactNode;
  items: Array<{
    id: string;
    name: string;
    image_url?: string;
    category?: string;
    badge?: string;
  }>;
  emptyText: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const previewCount = 4;
  const hasMore = items.length > previewCount;
  const visibleItems = expanded ? items : items.slice(0, previewCount);

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <div className="bg-gray-50 px-4 py-3 flex items-center gap-2">
        {icon}
        <span className="text-sm font-semibold text-gray-800">{title}</span>
        <Badge variant="secondary" className="text-[10px]">
          {items.length}
        </Badge>
      </div>

      {items.length === 0 ? (
        <div className="px-4 py-6 text-center text-xs text-gray-400">{emptyText}</div>
      ) : (
        <div className="px-4 py-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {visibleItems.map(item => (
              <div
                key={item.id}
                className="flex items-center gap-3 p-2 rounded-lg bg-white border border-gray-100 hover:border-gray-200 transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                      <ImageIcon className="h-5 w-5" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-800 truncate">{item.name}</div>
                  {item.category && (
                    <div className="text-[10px] text-gray-400">{item.category}</div>
                  )}
                </div>
                {item.badge && (
                  <Badge className="text-[10px] bg-blue-50 text-blue-700">{item.badge}</Badge>
                )}
              </div>
            ))}
          </div>

          {hasMore && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="mt-2 w-full text-center text-xs text-blue-600 hover:text-blue-800 py-1"
            >
              {expanded ? 'Show less' : `Show all ${items.length} items`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
