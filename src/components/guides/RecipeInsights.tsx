import { useEffect, useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import {
  coverage, gaps, nutrientsForTier, loadEssential90,
  type Coverage, type NutrientDef, type RecipeFilters, type RecipeHazard, type Tier,
} from '../../utils/recipeNutrients';

// Guardian dark tokens (same values as GuidePortal.tsx).
const ink = '#F5F2EA';
const muted = '#B8B6AF';
const line = 'rgba(245,242,234,0.24)';
const acid = '#C7D8A3';
const warn = '#E8B86A';
const danger = '#E88A7A';
const sans = '"EuclidCircularA", "DM Sans", "Helvetica Neue", Arial, sans-serif';
const label: React.CSSProperties = { display: 'block', color: muted, fontFamily: sans, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 7, lineHeight: 1.35 };
const chip = (on: boolean, tone = acid): React.CSSProperties => ({ border: `1px solid ${on ? tone : line}`, background: on ? `${tone}22` : 'transparent', color: on ? tone : ink, borderRadius: 999, padding: '5px 10px', fontFamily: sans, fontSize: 11, fontWeight: 700, cursor: 'pointer' });
const input: React.CSSProperties = { width: '100%', height: 36, boxSizing: 'border-box', border: `1px solid ${line}`, background: '#0D0E0C', color: ink, borderRadius: 2, padding: '0 10px', fontFamily: sans, fontSize: 12, outline: 'none' };

/** Shared catalog definitions; failed requests can retry on the next mount. */
let essentialCache: Promise<NutrientDef[]> | null = null;
export function useEssential90() {
  const [extra, setExtra] = useState<NutrientDef[]>([]);
  useEffect(() => { let alive = true; (essentialCache ||= loadEssential90()).then(rows => { if (alive) setExtra(rows); }).catch(() => { essentialCache = null; }); return () => { alive = false; }; }, []);
  return extra;
}

export const TIERS: Tier[] = [15, 30, 90];
// Collection names; the UI reports the actual full-collection count separately.
export const tierLabel = (t: Tier, _extra: NutrientDef[] = []) => (t === 15 ? 'Core 15' : t === 30 ? 'Extended 30' : 'Essential 90');

export function Essential90Note({ defs }: { defs: NutrientDef[] }) {
  const linked = defs.filter(d => d.catalogBacked).length;
  return <p style={{ color: muted, fontSize: 11, margin: '6px 0' }}>Dr. Wallach’s historical core90: 60 minerals · 16 vitamins · 12 amino acids · 2 fatty-acid groups. {linked}/90 catalog identities loaded; remaining entries use the source-list fallback. Published variants add Omega-9 (91 entries); Omega-9 stays outside the core count. Core15/30 are app subsets. Historical membership is not proof of safety or a recommendation to consume these substances. <a href="https://youngevityproducts.co.uk/pages/the-90-nutrients" target="_blank" rel="noreferrer" style={{ color: acid }}>Source and variant</a></p>;
}

function Bar({ c }: { c: Coverage }) {
  const pct = c.pct ?? 0;
  const color = c.pct == null ? line : pct >= 20 ? acid : pct >= 10 ? warn : danger;
  return <div title={c.amount == null ? 'No ingredient data for this nutrient' : `${c.amount} ${c.def.unit} per serving${c.def.dv ? ` of ${c.def.dv} ${c.def.unit} daily value` : ''}`} style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 70px 38px', gap: 8, alignItems: 'center', fontSize: 11, padding: '3px 0' }}>
    <span style={{ color: c.amount == null ? 'rgba(184,182,175,.55)' : ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.def.label}{c.def.safety === 'Hazardous' ? ' · hazardous' : ''}</span>
    <span style={{ height: 4, background: 'rgba(245,242,234,.1)' }}><span style={{ display: 'block', height: 4, width: `${Math.min(100, pct)}%`, background: color }} /></span>
    <span style={{ color: c.amount == null ? 'rgba(184,182,175,.55)' : muted, textAlign: 'right' }}>{c.amount == null ? '—' : c.pct != null ? `${c.pct}%` : `${c.amount}${c.def.unit}`}</span>
  </div>;
}

/** % of daily value per serving for the 15 / 30 / 90 essential nutrients. */
export function NutrientCoverage({ micros, macros, tier, onTier, title = 'Essential nutrients · % daily value per serving' }: { micros?: Record<string, number>; macros: { protein_g?: number; fiber_g?: number }; tier: Tier; onTier: (t: Tier) => void; title?: string }) {
  const extra = useEssential90();
  const cov = coverage(micros, macros, tier, extra);
  const measured = cov.filter((c) => c.amount != null).length;
  const strong = cov.filter((c) => (c.pct ?? 0) >= 20).length;
  return <div style={{ marginTop: 14 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
      <span style={{ ...label, margin: 0, color: acid }}>{title}</span>
      <span style={{ display: 'flex', gap: 5 }}>{TIERS.map((t) => <button key={t} type="button" onClick={() => onTier(t)} style={chip(t === tier)}>{tierLabel(t, extra)}</button>)}</span>
    </div>
    <div style={{ color: muted, fontSize: 10, marginBottom: 6 }}>{strong} of {cov.length} at 20%+ of {extra.length ? 'catalog reference amount' : 'daily value'} · {measured} measured in the ingredient data · grey = no data yet</div>
    <Essential90Note defs={extra} />
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', columnGap: 16, maxHeight: tier === 90 ? 320 : undefined, overflowY: tier === 90 ? 'auto' : undefined }}>{cov.map((c) => <Bar key={c.def.key} c={c} />)}</div>
  </div>;
}

export function gapNutrients(micros: Record<string, number> | undefined, macros: { protein_g?: number; fiber_g?: number }, tier: Tier, extra: NutrientDef[]) {
  return gaps(coverage(micros, macros, tier, extra));
}

/** Hazards summed from the ingredients' catalog data, worst first. */
export function HazardList({ hazards, allergens = [] }: { hazards: RecipeHazard[]; allergens?: string[] }) {
  const [all, setAll] = useState(false);
  const shown = all ? hazards : hazards.filter((h) => h.level !== 'trace').slice(0, 8);
  const tone = (l: RecipeHazard['level']) => l === 'high' ? danger : l === 'moderate' ? warn : muted;
  return <div style={{ marginTop: 14 }}>
    <div style={{ ...label, margin: '0 0 6px', color: hazards.some((h) => h.level === 'high') ? danger : acid, display: 'flex', gap: 6, alignItems: 'center' }}><AlertTriangle size={12} /> Hazards · from the ingredient database</div>
    {allergens.length > 0 && <div style={{ fontSize: 11, marginBottom: 6 }}><span style={{ color: danger, fontWeight: 700 }}>Allergens:</span> <span style={{ color: ink }}>{allergens.join(', ')}</span></div>}
    {!hazards.length && <div style={{ color: muted, fontSize: 11 }}>No hazards recorded for these ingredients.</div>}
    {shown.map((h) => <div key={h.key} title={h.reasons.join(' ')} style={{ display: 'grid', gridTemplateColumns: '70px minmax(0,1fr) auto', gap: 8, fontSize: 11, padding: '4px 0', borderTop: `1px solid ${line}` }}>
      <span style={{ color: tone(h.level), fontWeight: 700, textTransform: 'uppercase', fontSize: 9, letterSpacing: '.06em', paddingTop: 1 }}>{h.level}{!h.assessed ? '?' : ''}</span>
      <span style={{ minWidth: 0 }}><span style={{ color: ink }}>{h.label}</span><span style={{ color: muted }}> · from {h.sources.join(', ')}</span>{h.reasons[0] && <span style={{ display: 'block', color: muted, fontSize: 10 }}>{h.reasons[0]}</span>}</span>
      <span style={{ color: muted, whiteSpace: 'nowrap' }}>{h.perServing != null ? `${h.perServing} /serv.` : ''}</span>
    </div>)}
    {hazards.length > shown.length && <button type="button" onClick={() => setAll(true)} style={{ border: 0, background: 'transparent', color: acid, fontSize: 10, cursor: 'pointer', padding: '4px 0' }}>Show all {hazards.length} (including trace)</button>}
    <div style={{ color: muted, fontSize: 9, marginTop: 4 }}>? = not yet assessed by the catalog team, likelihood only.</div>
  </div>;
}

export const DIETS = ['vegan', 'vegetarian', 'pescatarian', 'gluten-free', 'dairy-free', 'nut-free', 'egg-free', 'keto', 'low-carb', 'low-FODMAP', 'Mediterranean', 'paleo', 'high-protein', 'low-sodium'];
const LIMITS = ['added sugar', 'salt', 'saturated fat', 'ultra-processed foods', 'caffeine', 'alcohol', 'high-oxalate foods', 'heavy-metal-prone foods (rice, large fish)'];

function Chips({ title, values, onChange, placeholder, tone }: { title: string; values: string[]; onChange: (v: string[]) => void; placeholder: string; tone?: string }) {
  const [text, setText] = useState('');
  const add = () => { const v = text.split(',').map((x) => x.trim()).filter(Boolean); if (v.length) onChange([...new Set([...values, ...v])]); setText(''); };
  return <div>
    <span style={label}>{title}</span>
    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: values.length ? 6 : 0 }}>{values.map((v) => <span key={v} style={{ ...chip(true, tone), display: 'inline-flex', alignItems: 'center', gap: 4 }}>{v}<button type="button" aria-label={`Remove ${v}`} onClick={() => onChange(values.filter((x) => x !== v))} style={{ border: 0, background: 'transparent', color: 'inherit', cursor: 'pointer', padding: 0, display: 'inline-flex' }}><X size={11} /></button></span>)}</div>
    <input style={input} value={text} placeholder={placeholder} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }} onBlur={add} />
  </div>;
}

/** Diets, ingredients to use / avoid, nutrients to boost / limit; plus "build for the 15 / 30 / 90". */
export function RecipeFiltersPanel({ value, onChange, tier, onTier }: { value: RecipeFilters; onChange: (f: RecipeFilters) => void; tier: Tier; onTier: (t: Tier) => void }) {
  const extra = useEssential90();
  const set = (patch: Partial<RecipeFilters>) => onChange({ ...value, ...patch });
  const tierDefs = nutrientsForTier(tier, extra).filter(d => d.dv != null);
  return <div style={{ border: `1px solid ${line}`, padding: 14, marginTop: 12, display: 'grid', gap: 14 }}>
    <div><span style={label}>Diet</span><div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>{DIETS.map((d) => { const on = value.diets.includes(d); return <button key={d} type="button" onClick={() => set({ diets: on ? value.diets.filter((x) => x !== d) : [...value.diets, d] })} style={chip(on)}>{d}</button>; })}</div></div>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 14 }}>
      <Chips title="Ingredients to use" values={value.useIngredients} onChange={(useIngredients) => set({ useIngredients })} placeholder="e.g. lentils, spinach · Enter to add" />
      <Chips title="Ingredients to avoid" values={value.avoidIngredients} onChange={(avoidIngredients) => set({ avoidIngredients })} placeholder="e.g. peanuts, pork · Enter to add" tone={danger} />
    </div>
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
        <span style={{ ...label, margin: 0 }}>Nutrients to boost</span>
        <span style={{ display: 'flex', gap: 5, alignItems: 'center' }}>{TIERS.map((t) => <button key={t} type="button" onClick={() => onTier(t)} style={chip(t === tier)}>{tierLabel(t, extra)}</button>)}
          <button type="button" onClick={() => set({ boost: tierDefs.map((d) => d.key) })} style={{ ...chip(false), color: acid }}>Build for all {tierDefs.length}</button>
          {value.boost.length > 0 && <button type="button" onClick={() => set({ boost: [] })} style={{ ...chip(false), color: muted }}>Clear</button>}</span>
      </div>
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', maxHeight: 120, overflowY: 'auto' }}>{tierDefs.map((d) => { const on = value.boost.includes(d.key); return <button key={d.key} type="button" onClick={() => set({ boost: on ? value.boost.filter((x) => x !== d.key) : [...value.boost, d.key] })} style={chip(on)}>{d.label}</button>; })}</div>
    </div>
    <div><span style={label}>Nutrients and foods to limit</span><div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>{LIMITS.map((l) => { const on = value.limit.includes(l); return <button key={l} type="button" onClick={() => set({ limit: on ? value.limit.filter((x) => x !== l) : [...value.limit, l] })} style={chip(on, warn)}>{l}</button>; })}</div></div>
  </div>;
}
