import { useState } from 'react';
import { nutrientsForTier, type Tier } from '../../utils/recipeNutrients';
import { TIERS, tierLabel, useEssential90, Essential90Note } from './RecipeInsights';
import { WEEK } from '../../utils/protocolBuilders';
import type { aggregateDiet } from '../../utils/dietNutrition';

const format = (n: number) => n.toLocaleString(undefined, { maximumSignificantDigits: 5 });
const title = (key: string) => key.replace(/_(kcal|kj|g|mg|mcg|ug|iu)$/i,'').replace(/_/g,' ').replace(/^./,(c) => c.toUpperCase());
const unit = (key: string) => /_(kcal|kj|g|mg|mcg|ug|iu)$/i.exec(key)?.[1] || 'source units';
export function DietNutritionPanel({ report, loading, error }: { report: ReturnType<typeof aggregateDiet>; loading: boolean; error: string }) {
  const [day,setDay] = useState('week');
  const [tier,setTier] = useState<Tier>(15);
  const catalog = useEssential90();
  const defs = nutrientsForTier(tier,catalog);
  const totals = day === 'week' ? report.week : report.days[Number(day)-1];
  const macros = ['energy_kcal','protein_g','carbohydrates_g','fats_g','fiber_g','sugars_g','saturated_fat_g','trans_fat_g','salt_g','alcohol_g'];
  const keys = [...new Set([...macros, ...defs.map(d => d.key), ...Object.keys(totals.nutrients).filter(k => totals.nutrients[k].amount != null)])];
  return <section aria-label="Meal and drink nutrition" style={{ border: '1px solid rgba(245,242,234,.24)', padding: 16, marginBottom: 18, background: '#11120F', color: '#F5F2EA' }}>
    <h2 style={{ fontSize: 16, margin: '0 0 8px' }}>All meals &amp; drinks · nutrition and hazards</h2>
    <div aria-label="Nutrient groups" style={{ display: 'flex', gap: 8, marginBottom: 8 }}>{TIERS.map(t => <button type="button" key={t} aria-pressed={tier === t} onClick={() => setTier(t)} style={{ border: '1px solid #B8B6AF', borderRadius: 20, padding: '6px 10px', color: tier === t ? '#C7D8A3' : '#F5F2EA', background: tier === t ? '#272C20' : 'transparent' }}>{tierLabel(t)}</button>)}</div>
    <Essential90Note defs={catalog} />
    <p style={{ fontSize: 12, color: '#B8B6AF' }}>{defs.length} entries in this group. All other measured nutrients remain visible separately.</p>
    <label>Totals for <select aria-label="Nutrition totals period" value={day} onChange={(e) => setDay(e.target.value)} style={{ background: '#11120F', color: '#F5F2EA', padding: 6, marginLeft: 8 }}><option value="week">Whole week</option>{WEEK.map((w) => <option key={w.day} value={w.day}>{w.short}</option>)}</select></label>
    <p style={{ fontSize: 12, color: '#B8B6AF' }}>{totals.count} planned selections, with serving quantities applied. Amounts are recorded subtotals; missing data is unknown, not zero. Supplements are listed separately and are not included in meal totals.</p>
    {loading && <p role="status">Refreshing selected recipes’ nutrients and hazards…</p>}
    {error && <p role="alert" style={{ color: '#E8B07A' }}>{error} Showing available saved data only; totals and hazards may be incomplete.</p>}
    {!!totals.unlinked && <p style={{ color: '#E8B07A' }}>{totals.unlinked} text-only drink selections need a database recipe match before their nutrition can be counted.</p>}
    <div style={{ maxHeight: 430, overflow: 'auto' }}><table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse', textAlign: 'left' }}>
      <thead><tr><th>Nutrient</th><th>Recorded total</th><th>Selections with data</th></tr></thead>
      <tbody>{keys.map((key) => { const def = defs.find((d) => d.key === key); const cell = totals.nutrients[key]; return <tr key={key} style={{ borderTop: '1px solid rgba(245,242,234,.12)' }}><th style={{ padding: '6px 0', fontWeight: 400 }}>{def?.label || title(key)}{def?.safety === 'Hazardous' ? ' · hazardous; not an intake goal' : ''}</th><td>{cell?.amount == null ? (totals.count ? 'Unknown' : '—') : `${format(cell.amount)} ${def?.unit || unit(key)}`}</td><td>{cell?.known || 0}/{totals.count}{(cell?.partial || cell?.known !== totals.count) && totals.count > 0 ? ' · incomplete' : ''}</td></tr>; })}</tbody>
    </table></div>
    <h3 style={{ fontSize: 14 }}>All recorded hazards · including low and trace</h3>
    <p style={{ color: '#B8B6AF', fontSize: 12 }}>Hazard levels describe source records, not calculated safe exposure limits. No recorded hazard does not mean a meal is hazard-free. {totals.unassessed} selections have incomplete ingredient analysis.</p>
    {!totals.hazards.length && <p style={{ fontSize: 12 }}>No hazard records available for these selections.</p>}
    {totals.hazards.map((h) => <div key={h.key} style={{ borderTop: '1px solid rgba(245,242,234,.12)', padding: '8px 0', fontSize: 12 }}>
      <strong>{h.label}</strong> · {h.level} · {h.amount == null ? 'Additive quantity unknown' : `${format(h.amount)} ${unit(h.key)} recorded subtotal`}{h.unknown ? ` · ${h.unknown} occurrences with incomplete or non-additive quantities` : ''} · {h.assessed ? 'source assessed' : 'assessment incomplete'}
      <div style={{ color: '#B8B6AF', marginTop: 3 }}>{h.sources.join(' · ')}</div>{h.reasons.length > 0 && <div>{h.reasons.join(' · ')}</div>}
    </div>)}
  </section>;
}
