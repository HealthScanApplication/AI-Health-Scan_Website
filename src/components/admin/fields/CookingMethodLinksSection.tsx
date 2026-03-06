import React, { useState } from 'react';
import { Label } from '../../ui/label';
import { Wrench, X, Search, Leaf } from 'lucide-react';

export type EquipmentDetail = {
  id: string;
  name: string;
  category?: string;
  image_url?: string;
  description?: string;
  use_case?: string;
  material?: string;
  size_notes?: string;
  brand?: string;
};

export type IngredientSuggestion = {
  id: string;
  name_common?: string;
  name?: string;
  category?: string;
  image_url?: string;
};

interface Props {
  equipmentIds: string[];
  onUpdateIds: (ids: string[]) => void;
  equipmentCatalog: EquipmentDetail[];
  ingredientsCatalog: IngredientSuggestion[];
  bestFor?: string;
  methodName?: string;
}

export function CookingMethodLinksSection({
  equipmentIds,
  onUpdateIds,
  equipmentCatalog,
  ingredientsCatalog,
  bestFor = '',
  methodName = '',
}: Props) {
  const [eqSearch, setEqSearch] = useState('');
  const [detailEq, setDetailEq] = useState<EquipmentDetail | null>(null);

  const selectedEquipment = equipmentCatalog.filter(e => equipmentIds.includes(e.id));
  const availableEquipment = equipmentCatalog.filter(e =>
    !equipmentIds.includes(e.id) &&
    (!eqSearch ||
      e.name.toLowerCase().includes(eqSearch.toLowerCase()) ||
      (e.category || '').toLowerCase().includes(eqSearch.toLowerCase()))
  );
  const availableCategories = [...new Set(availableEquipment.map(e => e.category || 'Other'))];

  const addEquipment = (id: string) => {
    onUpdateIds([...equipmentIds, id]);
    setEqSearch('');
  };
  const removeEquipment = (id: string) => {
    onUpdateIds(equipmentIds.filter(x => x !== id));
    if (detailEq?.id === id) setDetailEq(null);
  };

  // Suggested ingredients: parse best_for + method name keywords and match against catalog
  const terms = [
    ...bestFor.split(/[,;]+/).map(s => s.trim().toLowerCase()).filter(Boolean),
    ...methodName.toLowerCase().split(/\s+/).filter(s => s.length > 3),
  ];
  const suggestedIngredients = ingredientsCatalog
    .filter(ing => {
      const name = (ing.name_common || ing.name || '').toLowerCase();
      return terms.some(term => name.includes(term) || term.includes(name.split(' ')[0]));
    })
    .slice(0, 12);

  const showCatalogPicker = eqSearch.length > 0 || (selectedEquipment.length === 0 && equipmentCatalog.length > 0);

  return (
    <div className="space-y-4">
      {/* ═══ Equipment Needed ═══ */}
      <div className="space-y-2">
        <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          🔧 Equipment Needed
          {selectedEquipment.length > 0 && (
            <span className="ml-1.5 text-[10px] font-light italic text-gray-400 normal-case tracking-normal">
              {selectedEquipment.length} linked
            </span>
          )}
        </Label>

        {/* Selected equipment — image cards with click-to-detail */}
        {selectedEquipment.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedEquipment.map(eq => (
              <button
                key={eq.id}
                type="button"
                onClick={() => setDetailEq(detailEq?.id === eq.id ? null : eq)}
                title={`Click to view details: ${eq.name}`}
                className={`relative flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all ${
                  detailEq?.id === eq.id
                    ? 'border-orange-500 bg-orange-50 shadow-md'
                    : 'border-orange-300 bg-orange-50 hover:border-orange-500 hover:shadow-sm'
                }`}
                style={{ width: '78px' }}
              >
                {eq.image_url ? (
                  <img src={eq.image_url} alt={eq.name} className="w-12 h-12 rounded-lg object-cover border border-gray-200" />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center border border-orange-200">
                    <Wrench className="w-6 h-6 text-orange-500" />
                  </div>
                )}
                <span className="text-[9px] font-medium text-orange-900 text-center leading-tight line-clamp-2">
                  {eq.name}
                </span>
                {/* Remove ×  */}
                <span
                  role="button"
                  tabIndex={0}
                  onClick={e => { e.stopPropagation(); removeEquipment(eq.id); }}
                  onKeyDown={e => e.key === 'Enter' && (e.stopPropagation(), removeEquipment(eq.id))}
                  className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center text-[10px] hover:bg-red-700 shadow-sm cursor-pointer select-none"
                  title="Remove"
                >×</span>
              </button>
            ))}
          </div>
        )}

        {/* Detail panel — slide-in below selected items */}
        {detailEq && (
          <div className="rounded-xl border border-orange-200 bg-orange-50 p-3 space-y-2">
            <div className="flex items-start gap-3">
              {detailEq.image_url ? (
                <img src={detailEq.image_url} alt={detailEq.name} className="w-20 h-20 rounded-xl object-cover border border-orange-200 flex-shrink-0" />
              ) : (
                <div className="w-20 h-20 rounded-xl bg-orange-100 flex items-center justify-center border border-orange-200 flex-shrink-0">
                  <Wrench className="w-8 h-8 text-orange-500" />
                </div>
              )}
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-sm font-semibold text-gray-900">{detailEq.name}</h4>
                  <button type="button" onClick={() => setDetailEq(null)} className="text-gray-400 hover:text-gray-700 flex-shrink-0">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                {detailEq.category && (
                  <p className="text-[10px] text-orange-600 font-medium uppercase tracking-wider">{detailEq.category}</p>
                )}
                {detailEq.brand && <p className="text-[10px] text-gray-500">Brand: {detailEq.brand}</p>}
                {detailEq.material && <p className="text-[10px] text-gray-500">Material: {detailEq.material}</p>}
                {detailEq.size_notes && <p className="text-[10px] text-gray-500">Size: {detailEq.size_notes}</p>}
                {detailEq.use_case && <p className="text-[10px] text-gray-500 italic">Use: {detailEq.use_case}</p>}
                {detailEq.description && (
                  <p className="text-xs text-gray-600 leading-relaxed">{detailEq.description}</p>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => removeEquipment(detailEq.id)}
              className="w-full text-xs px-3 py-1 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 font-medium transition-colors"
            >
              Remove from this cooking method
            </button>
          </div>
        )}

        {/* Search input */}
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
          <input
            value={eqSearch}
            onChange={e => setEqSearch(e.target.value)}
            placeholder="Search equipment catalog to add…"
            className="w-full pl-7 pr-2.5 py-1.5 border border-gray-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
        </div>

        {/* Catalog picker */}
        {showCatalogPicker && availableEquipment.length > 0 && (
          <div className="border border-gray-100 rounded-lg bg-white max-h-56 overflow-y-auto p-2 space-y-3">
            {availableCategories.map(cat => {
              const items = availableEquipment.filter(e => (e.category || 'Other') === cat);
              if (!items.length) return null;
              return (
                <div key={cat} className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">{cat}</p>
                    <div className="flex-1 h-px bg-gray-100" />
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {items.map(eq => (
                      <button
                        key={eq.id}
                        type="button"
                        onClick={() => addEquipment(eq.id)}
                        className="flex items-center gap-1.5 px-2 py-1 rounded-lg border border-gray-200 bg-gray-50 hover:border-orange-300 hover:bg-orange-50 transition-all text-xs text-gray-700"
                      >
                        {eq.image_url
                          ? <img src={eq.image_url} alt="" className="w-5 h-5 rounded object-cover flex-shrink-0" />
                          : <Wrench className="w-3.5 h-3.5 text-orange-400 flex-shrink-0" />}
                        {eq.name}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {equipmentCatalog.length === 0 && (
          <p className="text-[10px] text-gray-400 italic">No equipment in catalog yet.</p>
        )}
      </div>

      {/* ═══ Suggested Ingredients ═══ */}
      <div className="pt-3 border-t border-gray-100 space-y-2">
        <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          🌿 Suggested Ingredients
          {bestFor && (
            <span className="ml-1.5 text-[10px] font-light italic text-gray-400 normal-case tracking-normal">
              — based on &quot;Best For&quot;
            </span>
          )}
        </Label>
        {suggestedIngredients.length === 0 ? (
          <p className="text-[10px] text-gray-400 italic">
            {bestFor || methodName
              ? 'No matching ingredients found. Add more ingredients or broaden the "Best For" field.'
              : 'Fill in the "Best For" field to see ingredient suggestions.'}
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {suggestedIngredients.map(ing => (
              <div
                key={ing.id}
                className="flex items-center gap-1.5 px-2 py-1 rounded-xl border border-green-200 bg-green-50 text-green-800 text-xs font-medium"
              >
                {ing.image_url
                  ? <img src={ing.image_url} alt="" className="w-5 h-5 rounded-full object-cover flex-shrink-0" />
                  : <Leaf className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />}
                {ing.name_common || ing.name}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
