/*
 * Protocol item-rules fix pass: DRY RUN ONLY. It reads an export and writes a report; it never writes to the database.
 *
 * Input: a JSON array of protocol_items rows (every column the export has), e.g. from
 *   select * from protocol_items where coalesce(hidden,false) = false;
 * Output: a CSV of proposed changes per item, to review with the user before anything is applied.
 *
 * Usage:
 *   npx esbuild scripts/protocol-fix-dryrun.ts --bundle --platform=node --outfile=/tmp/dryrun.js
 *   node /tmp/dryrun.js items.json > protocol-fix-dryrun.csv
 *
 * The same checker the AI builders use runs here (src/utils/protocolRules.ts), so the report shows exactly what
 * the builders would now produce. Applying is a separate, approved step: update or hide only, logged to admin_audit_log.
 */
import { readFileSync } from 'fs';
import { enforceProtocolRules, END_SLEEP, START_SLEEP, type RuleStep } from '../src/utils/protocolRules';

type Row = {
  id: string; protocol_id: string; display_name: string | null; kind: string | null; category: string | null; subtype: string | null;
  scheduled_time: string | null; duration_minutes: number | null; notes: string | null; parent_protocol_item_id: string | null;
  day_number: number | null; recurrence_start_date: string | null; recurrence_end_date: string | null;
};
type Step = RuleStep & { id: string };

const rows: Row[] = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const groupOf = (r: Row) => r.category === 'sleep' ? 'sleep' : r.category === 'consume' || ['meal', 'snack', 'drink', 'beverage'].includes(r.subtype || '') ? 'meal' : r.category === 'supplement' ? 'supplements' : r.subtype === 'exercise' ? 'fitness' : r.subtype || 'wellness';
const csv = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
const out: string[] = [['protocol_id', 'item_id', 'action', 'field', 'from', 'to', 'reason'].join(',')];
const add = (pid: string, id: string, action: string, field: string, from: unknown, to: unknown, reason: string) => out.push([pid, id, action, field, from, to, reason].map(csv).join(','));

const byProtocol = new Map<string, Row[]>();
for (const r of rows) byProtocol.set(r.protocol_id, [...(byProtocol.get(r.protocol_id) || []), r]);

for (const [pid, items] of byProtocol) {
  const tops = items.filter((r) => !r.parent_protocol_item_id && (r.kind === 'action' || !r.kind));
  const steps: Step[] = tops.map((r) => ({
    id: r.id, title: r.display_name || '', group: groupOf(r), time: r.scheduled_time?.slice(0, 5) || null, notes: r.notes || '',
    durationMinutes: r.duration_minutes, dos: [], donts: [], windowKey: `${r.day_number ?? ''}|${r.recurrence_start_date ?? ''}|${r.recurrence_end_date ?? ''}`,
  }));
  const fixed = enforceProtocolRules(steps) as Step[];
  const kept = new Set(fixed.map((s) => s.id));
  for (const s of steps) {
    if (kept.has(s.id)) continue;
    // Folded into Start Sleep, or moved onto a meal as checklist entries: hide the original, add it as a rule child.
    const host = fixed.find((f) => f.dos.includes(s.title) || f.donts.some((d) => s.title.toLowerCase().includes(d.toLowerCase())));
    add(pid, s.id, 'hide + add rule child', 'display_name', s.title, host ? `${host.title} ← ${s.title}` : s.title, host?.title === START_SLEEP ? 'Extra sleep advice becomes a Start Sleep rule' : 'Do/don\'t guidance becomes a checklist on the item it governs');
  }
  for (const f of fixed) {
    const before = steps.find((s) => s.id === f.id)!;
    if (f.kind === 'rule') { add(pid, f.id, 'convert to top-level rule', 'kind', 'action', 'rule_do / rule_dont', 'Guidance, not a checkable step'); continue; }
    if (f.title !== before.title) add(pid, f.id, 'update', 'display_name', before.title, f.title, f.title === END_SLEEP || f.title === START_SLEEP ? 'Sleep anchor name' : (f.issues || []).find((i) => i.code === 'vague') ? 'Vague practice → concrete, linkable' : 'Meal = dish name / action amount');
    if (f.time !== before.time) add(pid, f.id, 'update', 'scheduled_time', before.time, f.time, 'Every item needs a time');
    for (const i of f.issues || []) if (i.code === 'not_verb') add(pid, f.id, 'review', 'display_name', f.title, '', 'Title should start with a verb (manual)');
  }
}
process.stdout.write(out.join('\n') + '\n');
