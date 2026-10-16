import React, { useMemo, useState } from 'react';
import { ArrowRight, CalendarDays, Check, Loader2 } from 'lucide-react';
import { GuardianModal } from './GuardianModal';
import {
  applyEventPlan, cleanPastedText, dayPart, detectEvent, linkPlanItems, offsetDate, planEventProtocol,
  SMART_GROUPS, SMART_GROUP_TITLE, type EventPlan, type PlanItem,
} from '../../utils/eventProtocol';
import { listProtocolItems } from '../../utils/protocolAdmin';

const ink = '#F5F2EA', muted = '#B8B6AF', line = 'rgba(245,242,234,0.24)', black = '#090A08', acid = '#C7D8A3', warn = '#E8C07A';
const serif = '"CanelaText", "Canela Text", Georgia, serif';
const sans = '"EuclidCircularA", "DM Sans", "Helvetica Neue", Arial, sans-serif';
const btn: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, height: 40, padding: '0 16px', border: 'none', borderRadius: 2, background: acid, color: black, fontFamily: sans, fontSize: 10, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', cursor: 'pointer' };
const field: React.CSSProperties = { height: 40, boxSizing: 'border-box', border: `1px solid ${line}`, background: black, color: ink, fontFamily: sans, fontSize: 13, padding: '0 10px', borderRadius: 2, colorScheme: 'dark' };
const PARTS = [{ key: 'morning', title: 'Morning' }, { key: 'afternoon', title: 'Afternoon' }, { key: 'evening', title: 'Evening' }] as const;

const fmtDay = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
const fmtLong = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });

/**
 * Paste anything → cleaned text → (event date) → reviewable dated Protocol → apply.
 * Applies ONLY to `protocolId` (the Protocol on screen) and only adds steps.
 */
export function EventProtocolBuilder({ accessToken, protocolId, initialText, onClose, onApplied }: {
  accessToken: string; protocolId: string; initialText: string; onClose: () => void; onApplied: (message: string) => void;
}) {
  const cleaned = useMemo(() => cleanPastedText(initialText), [initialText]);
  const detected = useMemo(() => detectEvent(cleaned), [cleaned]);
  const [useEvent, setUseEvent] = useState(detected.hasEvent);
  const [when, setWhen] = useState(detected.dateGuess ? `${detected.dateGuess}T${detected.timeGuess || '19:00'}` : '');
  const [plan, setPlan] = useState<EventPlan | null>(null);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [showCleaned, setShowCleaned] = useState(false);

  async function build() {
    setError('');
    if (useEvent && !when) { setError(`Pick the ${detected.title.toLowerCase()} date first.`); return; }
    const [date, time] = useEvent ? when.split('T') : [null, null];
    try {
      setBusy('Reading the text…');
      const draft = await planEventProtocol(accessToken, protocolId, cleaned, { date, time: time || null }, useEvent);
      setBusy('Linking recipes, ingredients and activities…');
      setPlan(await linkPlanItems(accessToken, draft));
    } catch (e: any) { setError(e?.message || String(e)); } finally { setBusy(''); }
  }

  async function apply() {
    if (!plan) return;
    setError(''); setBusy('Adding steps to this Protocol…');
    try {
      const existing = await listProtocolItems(accessToken, protocolId);
      const r = await applyEventPlan(accessToken, protocolId, plan, existing.filter((it) => !it.parent_protocol_item_id).length);
      onApplied(`${r.added} steps added (${r.children} checklist entries)${plan.eventDate ? `, dated ${fmtDay(offsetDate(plan.eventDate, Math.min(...plan.items.filter((i) => i.include).map((i) => i.startOffset))))} – ${fmtDay(offsetDate(plan.eventDate, Math.max(...plan.items.filter((i) => i.include).map((i) => i.endOffset))))}` : ''}.`);
    } catch (e: any) { setError(`Could not apply: ${e?.message || e}`); setBusy(''); }
  }

  const toggle = (id: string) => setPlan((p) => p && { ...p, items: p.items.map((it) => it.id === id ? { ...it, include: !it.include } : it) });
  const linkable = plan?.items.filter((it) => it.link) || [];
  const matched = linkable.filter((it) => it.match).length;

  return <GuardianModal label="Build a dated Protocol from text" onClose={onClose} zIndex={60}
    panelStyle={{ background: black, color: ink, border: `1px solid ${line}`, fontFamily: sans, borderRadius: 2 }}
    bodyStyle={{ paddingTop: 0 }} footerStyle={{ borderTop: `1px solid ${line}`, display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}
    header={<>
          <div style={{ color: acid, fontSize: 9, fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase' }}>From pasted text</div>
          <h2 style={{ fontFamily: serif, fontWeight: 300, fontSize: 'clamp(28px,4vw,40px)', margin: '6px 0 4px' }}>{plan ? 'Review the suggested Protocol' : 'Turn this into a Protocol'}</h2>
          <p style={{ color: muted, fontSize: 12, margin: 0 }}>Nothing changes until you apply. Steps are added to the Protocol on screen; existing steps stay as they are.</p>
    </>}
    footer={!plan ? <button type="button" onClick={build} disabled={Boolean(busy)} style={{ ...btn, marginLeft: 'auto', opacity: busy ? .6 : 1 }}>{busy ? <><Loader2 size={13} className="animate-spin" /> {busy}</> : <>Build suggestion <ArrowRight size={13} /></>}</button> : <>
      <button type="button" onClick={() => setPlan(null)} disabled={Boolean(busy)} style={{ ...btn, background: 'transparent', color: ink, border: `1px solid ${line}` }}>Back</button>
      <button type="button" onClick={apply} disabled={Boolean(busy) || !plan.items.some((it) => it.include)} style={{ ...btn, height: 'auto', minHeight: 40, paddingTop: 8, paddingBottom: 8, opacity: busy ? .6 : 1 }}>{busy ? <><Loader2 size={13} className="animate-spin" /> {busy}</> : <><Check size={13} /> Apply {plan.items.filter((it) => it.include).length} steps to this Protocol</>}</button>
    </>}>

      <section style={{ marginTop: 18, border: `1px solid ${line}`, padding: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', fontSize: 11, color: muted }}>
          <span>Cleaned: {cleaned.split(/\s+/).filter(Boolean).length} words kept of {initialText.split(/\s+/).filter(Boolean).length} (greetings, signatures and forward headers removed)</span>
          <button type="button" onClick={() => setShowCleaned((v) => !v)} style={{ background: 'none', border: 'none', color: acid, cursor: 'pointer', fontSize: 11, padding: 0 }}>{showCleaned ? 'Hide' : 'Show'} cleaned text</button>
        </div>
        {showCleaned && <pre style={{ whiteSpace: 'pre-wrap', fontFamily: sans, fontSize: 12, color: ink, maxHeight: 220, overflowY: 'auto', margin: '10px 0 0' }}>{cleaned}</pre>}
      </section>

      <section style={{ marginTop: 12, border: `1px solid ${useEvent ? acid : line}`, padding: 14, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <CalendarDays size={18} color={acid} />
        {useEvent ? <>
          <label htmlFor="event-when" style={{ fontSize: 14, flex: '1 1 220px' }}>{when ? <>Your {detected.title.toLowerCase()} is on <strong>{fmtLong(when.split('T')[0])}</strong>?</> : <>The text is timed around a {detected.title.toLowerCase()}. When is it?</>}</label>
          <input id="event-when" type="datetime-local" value={when} onChange={(e) => { setWhen(e.target.value); setPlan(null); }} style={field} />
          <button type="button" onClick={() => { setUseEvent(false); setPlan(null); }} style={{ background: 'none', border: 'none', color: muted, fontSize: 11, cursor: 'pointer' }}>No event — daily routine</button>
        </> : <>
          <span style={{ fontSize: 13, flex: '1 1 220px' }}>{detected.hasEvent ? 'Building a normal daily routine (no event date).' : 'No event timing found — this becomes a normal daily routine.'}</span>
          <button type="button" onClick={() => { setUseEvent(true); setPlan(null); }} style={{ background: 'none', border: 'none', color: acid, fontSize: 11, cursor: 'pointer' }}>It's for an event — add a date</button>
        </>}
      </section>

      {error && <p role="alert" style={{ color: '#F0A7A7', fontSize: 12 }}>{error}</p>}

      {plan && <>
        <p style={{ fontSize: 12, color: muted, margin: '16px 0 0' }}>{plan.summary} <span style={{ color: acid }}>{matched}/{linkable.length} linked to catalog records</span>{linkable.length - matched ? <span style={{ color: warn }}> · {linkable.length - matched} unmatched</span> : null}{plan.source === 'local' ? ' · offline planner' : ''}</p>
        {plan.phases.map((phase) => {
          const items = plan.items.filter((it) => it.phase === phase.key || plan.phases.length === 1);
          const range = plan.eventDate ? (phase.startOffset === phase.endOffset ? fmtDay(offsetDate(plan.eventDate, phase.startOffset)) : `${fmtDay(offsetDate(plan.eventDate, phase.startOffset))} – ${fmtDay(offsetDate(plan.eventDate, phase.endOffset))}`) : 'Every day';
          return <section key={phase.key} style={{ marginTop: 18, borderTop: `1px solid ${line}`, paddingTop: 14 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
              <h3 style={{ fontFamily: serif, fontWeight: 300, fontSize: 26, margin: 0 }}>{phase.title}</h3>
              <span style={{ color: acid, fontSize: 11, fontWeight: 700, letterSpacing: '.06em' }}>{range}</span>
              {phase.key === 'day' && plan.cutoffTime && <span style={{ color: warn, fontSize: 11 }}>Nothing to eat after {plan.cutoffTime}</span>}
            </div>
            {items.some((it) => it.kind === 'rule') && <div style={{ marginTop: 12 }}>
              <div style={{ color: muted, fontSize: 9, fontWeight: 800, letterSpacing: '.14em', textTransform: 'uppercase' }}>Rules for these days</div>
              {items.filter((it) => it.kind === 'rule').map((it) => <Row key={it.id} it={it} plan={plan} onToggle={toggle} />)}
            </div>}
            {PARTS.map((part) => {
              const inPart = items.filter((it) => it.kind !== 'rule' && dayPart(it.time) === part.key);
              if (!inPart.length) return null;
              const wake = inPart.filter((it) => it.group === 'sleep' && /wake/i.test(it.title));
              const bed = inPart.filter((it) => it.group === 'sleep' && !/wake/i.test(it.title));
              const groups = SMART_GROUPS.map((g) => ({ g, xs: inPart.filter((it) => it.group === g).sort((a, b) => (a.time || '').localeCompare(b.time || '')) })).filter((x) => x.xs.length);
              return <div key={part.key} style={{ marginTop: 12 }}>
                <div style={{ color: muted, fontSize: 9, fontWeight: 800, letterSpacing: '.14em', textTransform: 'uppercase' }}>{part.title}</div>
                {wake.map((it) => <Row key={it.id} it={it} plan={plan} onToggle={toggle} />)}
                {groups.map(({ g, xs }) => <div key={g} style={{ marginTop: 8, paddingLeft: 10, borderLeft: `2px solid ${line}` }}>
                  <div style={{ fontSize: 10, color: acid, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase' }}>{part.title} {SMART_GROUP_TITLE[g]}</div>
                  {xs.map((it) => <Row key={it.id} it={it} plan={plan} onToggle={toggle} />)}
                </div>)}
                {bed.map((it) => <Row key={it.id} it={it} plan={plan} onToggle={toggle} />)}
              </div>;
            })}
          </section>;
        })}
      </>}
  </GuardianModal>;
}

function Row({ it, plan, onToggle }: { it: PlanItem; plan: EventPlan; onToggle: (id: string) => void }) {
  const dates = plan.eventDate && it.group !== 'sleep' ? (it.startOffset === it.endOffset ? fmtDay(offsetDate(plan.eventDate, it.startOffset)) : `${fmtDay(offsetDate(plan.eventDate, it.startOffset))}–${fmtDay(offsetDate(plan.eventDate, it.endOffset))}`) : '';
  const badge = it.match
    ? <span title={`${it.match.kind}: ${it.match.name}`} style={{ border: `1px solid ${acid}`, color: acid, fontSize: 9, padding: '2px 6px', whiteSpace: 'nowrap' }}>{it.match.quality === 'exact' ? '✓' : '≈'} {it.match.kind} · {it.match.name}</span>
    : it.link ? <span style={{ border: `1px solid ${warn}`, color: warn, fontSize: 9, padding: '2px 6px', whiteSpace: 'nowrap' }}>Unmatched · “{it.link.query}”</span> : null;
  return <div style={{ display: 'grid', gridTemplateColumns: '22px 52px minmax(0,1fr)', gap: 8, alignItems: 'start', padding: '7px 0', opacity: it.include ? 1 : .45 }}>
    <input type="checkbox" aria-label={`Include ${it.title}`} checked={it.include} onChange={() => onToggle(it.id)} style={{ accentColor: acid, marginTop: 3 }} />
    <span style={{ fontSize: 12, color: muted, fontVariantNumeric: 'tabular-nums' }}>{it.kind === 'rule' ? 'Rule' : it.time}</span>
    <div style={{ minWidth: 0 }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        {it.match?.image && <img src={it.match.image} alt="" style={{ width: 22, height: 22, objectFit: 'cover', borderRadius: 2 }} />}
        <strong style={{ fontSize: 13, fontWeight: 600 }}>{it.title}</strong>
        {it.durationMinutes ? <span style={{ fontSize: 11, color: muted }}>{it.durationMinutes} min</span> : null}
        {badge}
        {dates && <span style={{ fontSize: 10, color: muted }}>{dates}</span>}
        {(it.issues || []).map((issue) => <span key={issue.code + issue.message} title={issue.message} style={{ fontSize: 9, color: issue.code === 'renamed' || issue.code === 'moved_to_rules' ? muted : warn }}>· {issue.message}</span>)}
      </div>
      {(it.dos.length > 0 || it.donts.length > 0 || it.subtasks.length > 0) && <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 5 }}>
        {it.dos.map((x) => <span key={`d${x}`} style={{ fontSize: 10, color: acid, border: `1px solid ${line}`, padding: '1px 6px' }}>✓ {x}</span>)}
        {it.donts.map((x) => <span key={`n${x}`} style={{ fontSize: 10, color: '#F0A7A7', border: `1px solid ${line}`, padding: '1px 6px' }}>✕ {x}</span>)}
        {it.subtasks.map((x) => <span key={`s${x}`} style={{ fontSize: 10, color: ink, border: `1px solid ${line}`, padding: '1px 6px' }}>☐ {x}</span>)}
      </div>}
    </div>
  </div>;
}
