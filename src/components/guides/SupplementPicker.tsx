import { useEffect, useState } from 'react';
import { searchSupplements, type SupplementCatalogKind } from '../../utils/supplementCatalog';
import type { SupplementPick } from '../../utils/protocolBuilders';

const field: React.CSSProperties = { width: '100%', background: '#0D0E0C', color: '#F5F2EA', border: '1px solid #55564F', padding: 9, borderRadius: 3 };
const button: React.CSSProperties = { ...field, cursor: 'pointer', width: 'auto', fontSize: 12 };

export function SupplementPicker({ accessToken, title, items, onChange }: {
  accessToken: string; title: string; items: Array<string | SupplementPick>; onChange: (items: Array<string | SupplementPick>) => void;
}) {
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<SupplementCatalogKind>('generic');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SupplementPick[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [matching, setMatching] = useState<number | null>(null);
  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    setResults([]); setError(''); setBusy(true);
    const timer = setTimeout(() => {
      searchSupplements(accessToken, kind, query, controller.signal).then((rows) => {
        if (!controller.signal.aborted) setResults(rows);
      }).catch((err) => {
        if (!controller.signal.aborted) setError(err.message);
      }).finally(() => { if (!controller.signal.aborted) setBusy(false); });
    }, 250);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [accessToken, open, kind, query]);
  return <div>
    <div style={{ color: '#B8B6AF', fontSize: 10, textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 8 }}>{title}</div>
    {items.map((item, index) => <div key={index} style={{ borderBottom: '1px solid #44453F', padding: '8px 0', display: 'flex', gap: 8, alignItems: 'center' }}>
      {typeof item !== 'string' && item.image && <img src={item.image} alt="" style={{ width: 36, height: 36, objectFit: 'cover' }} />}
      <div style={{ flex: 1, minWidth: 0, fontSize: 12 }}>
        <div>{typeof item === 'string' ? item : item.name}</div>
        {typeof item === 'string' ? <button type="button" style={{ ...button, marginTop: 5 }} onClick={() => { setMatching(index); setQuery(item.replace(/^take\s+/i, '')); setOpen(true); }}>Match catalogue entry</button>
          : <><small style={{ color: '#B8B6AF', overflowWrap: 'anywhere' }}>{item.brand ? `${item.brand} · ` : ''}{item.barcode && /^\d{8,14}$/.test(item.barcode) ? item.barcode : 'Generic supplement'} · Linked</small>{item.elementCount === 0 && <div style={{ color: '#E8B07A', fontSize: 11 }}>Composition not linked yet</div>}</>}
      </div>
      <button type="button" aria-label={`Remove ${typeof item === 'string' ? item : item.name}`} style={button} onClick={() => { onChange(items.filter((_, i) => i !== index)); setOpen(false); setMatching(null); }}>×</button>
    </div>)}
    <button type="button" style={{ ...button, marginTop: 9 }} onClick={() => { setMatching(null); setQuery(''); setOpen(!open); }}>{open ? 'Close picker' : '+ Add supplement'}</button>
    {open && <section aria-label={`${title} catalogue picker`} style={{ marginTop: 10, padding: 10, border: '1px solid #55564F' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 9 }}>
        {(['generic', 'specific'] as const).map((value) => <button type="button" key={value} aria-pressed={kind === value} style={{ ...button, color: kind === value ? '#C7D8A3' : '#F5F2EA' }} onClick={() => setKind(value)}>{value === 'generic' ? 'Generic' : 'Branded / barcode'}</button>)}
      </div>
      <input aria-label={`Search ${title}`} placeholder="Search name, brand or barcode" style={{ ...field, boxSizing: 'border-box' }} value={query} onChange={(e) => setQuery(e.target.value)} />
      <div aria-live="polite" style={{ fontSize: 12, marginTop: 8 }}>{busy ? 'Searching…' : error || (!results.length ? 'No supplements found. Try another name or catalogue type.' : '')}</div>
      <div style={{ maxHeight: 270, overflowY: 'auto' }}>{results.map((result) => <button type="button" key={`${result.source}:${result.id}`} style={{ ...field, cursor: 'pointer', marginTop: 6, textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8 }} onClick={() => {
        onChange(matching === null ? [...items, result] : items.map((item, i) => i === matching ? result : item));
        setMatching(null); setOpen(false);
      }}>
        {result.image && <img src={result.image} alt="" style={{ width: 38, height: 38, objectFit: 'cover' }} />}
        <span><span style={{ display: 'block' }}>{result.name}</span><small style={{ color: '#B8B6AF', overflowWrap: 'anywhere' }}>{result.brand || (kind === 'generic' ? 'Generic supplement' : 'Supplement product')}{kind === 'specific' && result.barcode ? ` · ${result.barcode}` : ''}</small><small style={{ display: 'block', color: result.elementCount ? '#C7D8A3' : '#E8B07A' }}>{result.elementCount ? `${result.elementCount} linked elements` : 'Composition not linked yet'}</small></span>
      </button>)}</div>
    </section>}
  </div>;
}
