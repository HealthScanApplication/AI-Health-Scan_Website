import React from 'react';
import { Label } from '../../ui/label';
import { Loader2, Sparkles, Wrench } from 'lucide-react';
import { projectId, publicAnonKey } from '../../../utils/supabase/info';

export type EquipmentRecord = { id: string; name: string; category?: string; image_url?: string };

interface CookingToolsFieldProps {
  val: any;
  updateField: (v: any) => void;
  accessToken?: string;
  onAiEnrich?: () => void;
  enriching?: boolean;
  externalCatalog?: EquipmentRecord[];
}

export function CookingToolsField({ val, updateField, accessToken, onAiEnrich, enriching, externalCatalog }: CookingToolsFieldProps) {
  const tools: string[] = Array.isArray(val) ? val : [];
  const [search, setSearch] = React.useState('');
  const [localCatalog, setLocalCatalog] = React.useState<EquipmentRecord[]>([]);
  const [loadingCatalog, setLoadingCatalog] = React.useState(false);

  // Use external catalog from parent if available, otherwise fetch independently as fallback
  React.useEffect(() => {
    if (externalCatalog && externalCatalog.length > 0) {
      setLocalCatalog(externalCatalog);
      setLoadingCatalog(false);
      return;
    }
    if (!accessToken) return;
    setLoadingCatalog(true);
    const restUrl = `https://${projectId}.supabase.co/rest/v1/catalog_equipment?select=id,name,category,image_url&limit=500&order=category,name`;
    fetch(restUrl, {
      headers: {
        'apikey': publicAnonKey,
        'Authorization': `Bearer ${accessToken}`,
      },
    })
      .then(r => r.json())
      .then(d => { if (Array.isArray(d) && d.length > 0) setLocalCatalog(d); })
      .catch((err) => console.warn('[CookingToolsField] Failed to fetch catalog:', err))
      .finally(() => setLoadingCatalog(false));
  }, [accessToken, externalCatalog]);

  // Use catalog from external or local fetch
  const catalogList: EquipmentRecord[] = localCatalog;

  const addTool = (name: string) => {
    if (!tools.includes(name)) updateField([...tools, name]);
  };
  const removeTool = (name: string) => updateField(tools.filter(t => t !== name));
  const addCustom = () => {
    const t = search.trim();
    if (t && !tools.includes(t)) { updateField([...tools, t]); setSearch(''); }
  };

  const filtered = catalogList.filter(t =>
    !tools.includes(t.name) &&
    (!search || t.name.toLowerCase().includes(search.toLowerCase()) || (t.category || '').toLowerCase().includes(search.toLowerCase()))
  );
  const categories = [...new Set(filtered.map(t => t.category || 'Other'))];

  // Find catalog record for a tool name (for image lookup)
  const getCatalogRecord = (name: string) => catalogList.find(e => e.name === name);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-1">
        <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          🔧 Equipment
          {loadingCatalog && <Loader2 className="inline w-3 h-3 ml-1 animate-spin text-gray-400" />}
          {tools.length > 0 && <span className="ml-1.5 text-[10px] font-light italic text-gray-400 normal-case tracking-normal">{tools.length} selected</span>}
        </Label>
        {onAiEnrich && (
          <button type="button" onClick={onAiEnrich} disabled={enriching}
            className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-violet-50 hover:bg-violet-100 text-violet-700 border border-violet-200 disabled:opacity-50 transition-colors flex-shrink-0">
            {enriching ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
            {enriching ? '…' : 'AI Enrich'}
          </button>
        )}
      </div>

      {/* Search / add custom */}
      <div className="flex gap-1.5">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCustom())}
          placeholder="Search equipment catalog..."
          className="flex-1 px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-orange-400"
        />
        {search.trim() && (
          <button type="button" onClick={addCustom}
            className="text-xs px-2.5 py-1.5 rounded-lg bg-orange-100 text-orange-700 hover:bg-orange-200 font-medium">
            + Add
          </button>
        )}
      </div>

      {/* Catalog — tag cloud with images grouped by category */}
      <div className="border border-gray-100 rounded-lg bg-white max-h-96 overflow-y-auto p-3">
        {loadingCatalog ? (
          <div className="flex items-center justify-center gap-2 py-3 text-gray-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-[10px]">Loading equipment catalog...</span>
          </div>
        ) : catalogList.length === 0 ? (
          <p className="text-[10px] text-gray-400 italic text-center py-2">No equipment in catalog yet. Add items to the catalog_equipment table.</p>
        ) : (() => {
          const visible = catalogList.filter(t => !search || t.name.toLowerCase().includes(search.toLowerCase()) || (t.category || '').toLowerCase().includes(search.toLowerCase()));
          if (visible.length === 0) return <p className="text-[10px] text-gray-400 italic text-center py-1">No matches for "{search}"</p>;
          const cats = [...new Set(visible.map(t => t.category || 'Other'))];
          return (
            <div className="space-y-4">
              {cats.map(cat => {
                const catItems = visible.filter(t => (t.category || 'Other') === cat);
                if (catItems.length === 0) return null;
                return (
                  <div key={cat} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <p className="text-[10px] font-bold text-gray-600 uppercase tracking-wider">{cat}</p>
                      <div className="flex-1 h-px bg-gray-200"></div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {catItems.map(t => {
                        const isSelected = tools.includes(t.name);
                        return (
                          <button key={t.id} type="button"
                            onClick={() => isSelected ? removeTool(t.name) : addTool(t.name)}
                            className={`group relative flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all ${
                              isSelected
                                ? 'bg-orange-100 border-2 border-orange-400 shadow-md'
                                : 'bg-gray-50 border border-gray-200 hover:border-orange-300 hover:shadow-sm'
                            }`}
                            style={{ width: '80px' }}>
                            <div className="relative">
                              {t.image_url ? (
                                <img src={t.image_url} alt="" className="w-12 h-12 rounded-lg object-cover border border-gray-300" />
                              ) : (
                                <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center border border-orange-200">
                                  <Wrench className="w-6 h-6 text-orange-500" />
                                </div>
                              )}
                              {isSelected && (
                                <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-orange-500 border-2 border-white flex items-center justify-center shadow-sm">
                                  <span className="text-[10px] font-bold text-white">✓</span>
                                </div>
                              )}
                            </div>
                            <span className={`text-[9px] font-medium text-center leading-tight line-clamp-2 ${
                              isSelected ? 'text-orange-900' : 'text-gray-700'
                            }`}>{t.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}
      </div>

      {/* Selected tools summary — image + text tags below the catalog */}
      {tools.length > 0 && (
        <div className="pt-1 border-t border-gray-100">
          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Selected</p>
          <div className="flex flex-wrap gap-2">
            {tools.map(t => {
              const eq = getCatalogRecord(t);
              return (
                <span key={t} className="flex items-center gap-1.5 pl-1 pr-2 py-1 rounded-xl border bg-orange-50 border-orange-200 text-orange-900 text-xs font-medium shadow-sm">
                  {eq?.image_url ? (
                    <img src={eq.image_url} alt="" className="w-6 h-6 rounded-lg object-cover flex-shrink-0" />
                  ) : (
                    <span className="w-6 h-6 rounded-lg bg-orange-200 flex items-center justify-center flex-shrink-0">
                      <Wrench className="w-3 h-3 text-orange-600" />
                    </span>
                  )}
                  {t}
                  <button type="button" onClick={() => removeTool(t)} className="text-orange-400 hover:text-red-600 ml-0.5 font-bold leading-none">&times;</button>
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
