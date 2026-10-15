/*
 * Pasted text → dated, event-anchored Protocol suggestion.
 *
 * A Guardian pastes anything (a forwarded ceremony-prep email, a surgery leaflet, a race plan).
 * We clean it, find time anchors relative to an event ("7 days before", "48 hours before",
 * "on the day … nothing after 3 PM", "1–2 days after"), ask for the event date, and lay the
 * Protocol out on real days. Every suggested item is offset-based (days relative to the event)
 * so the same plan re-dates when the Guardian changes the event date.
 *
 * Data shapes follow the mobile app (source of truth, AI-Health-Scan_Mobile):
 *  - date windows: recurrence_type 'daily' + recurrence_start_date / recurrence_end_date
 *    (protocolRecurrence.itemShowsOnDate). We avoid one_off for parents: a parented one_off row
 *    reads as a DEV-418 day override.
 *  - smart groups come from `subtype` (ProtocolHomeScreen SUBTYPE_TO_SMART).
 *  - avoid lists are rule_do / rule_dont children of a parent step (timeline/subTaskRows.ts:
 *    "contextual rules" render as the do/don't checklist inside the parent card).
 *  - a packing list is ACTION children = sub-tasks under the parent.
 */
import { projectId, publicAnonKey } from './supabase/info';
import { enforceProtocolRules, isGenericTitle, ruleGroupFor, ruleRowFields, type RuleGroup, type RuleIssue } from './protocolRules';
import { createProtocolItem, searchCatalog, type AdminProtocolItem, type CatalogHit, type CatalogKind } from './protocolAdmin';

export type SmartGroup = 'hygiene' | 'beauty' | 'wellness' | 'fitness' | 'supplements' | 'meal' | 'work' | 'home' | 'tasks';
export const SMART_GROUPS: SmartGroup[] = ['hygiene', 'beauty', 'wellness', 'fitness', 'supplements', 'meal', 'work', 'home', 'tasks'];
export const SMART_GROUP_TITLE: Record<SmartGroup, string> = { hygiene: 'Hygiene', beauty: 'Beauty', wellness: 'Wellness', fitness: 'Fitness', supplements: 'Supplements', meal: 'Meal', work: 'Work', home: 'Home', tasks: 'Tasks' };
export type DayPart = 'morning' | 'afternoon' | 'evening';
export type PhaseKey = 'early' | 'prep' | 'strict' | 'day' | 'after' | 'daily';

export interface PlanPhase { key: PhaseKey; title: string; startOffset: number; endOffset: number }
export interface PlanMatch { kind: CatalogKind; id: string; name: string; image: string | null; quality: 'exact' | 'close' }
export interface PlanItem {
  id: string;
  title: string;
  group: SmartGroup | 'sleep';
  time: string | null;          // HH:MM
  durationMinutes: number | null;
  notes: string;
  phase: PhaseKey;
  startOffset: number;          // days relative to the event (0 = event day)
  endOffset: number;
  dos: string[];                // rule_do children
  donts: string[];              // rule_dont children
  subtasks: string[];           // action children (packing list)
  link: { kind: 'food' | 'activity'; query: string } | null;
  match: PlanMatch | null;
  include: boolean;
  /** 'rule' = top-level dated rule rows (Rules & Avoidances tray), no time or done state. */
  kind?: 'action' | 'rule';
  /** For rules: the list it governs (Drinks / Consume / Supplements / general). */
  ruleGroup?: RuleGroup;
  mealSlot?: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';
  anchor?: 'wake' | 'bedtime' | 'before_meal' | 'after_meal' | null;
  offsetMinutes?: number | null;
  issues?: RuleIssue[];
}

/** Run the shared item rules (protocolRules.ts) over a plan; windows are the event-relative day ranges. */
export function applyItemRules(items: PlanItem[]): PlanItem[] {
  return enforceProtocolRules(items.map((it) => ({ ...it, windowKey: `${it.startOffset}|${it.endOffset}` })))
    .map(({ windowKey: _w, ...it }) => ({ ...it, time: it.kind === 'rule' ? null : it.time }) as PlanItem);
}
export interface EventPlan {
  summary: string;
  hasEvent: boolean;
  eventTitle: string;
  eventDate: string | null;     // YYYY-MM-DD
  eventTime: string | null;     // HH:MM
  cutoffTime: string | null;    // HH:MM — "nothing after 3 PM" on the day
  phases: PlanPhase[];
  items: PlanItem[];
  source: 'ai' | 'local';
}

/* ───────── 1. clean ───────── */
const NOISE = [
  /^-{2,}\s*(forwarded|original) message\s*-{2,}$/i,
  /^(from|sent|to|cc|bcc|date|subject|reply-to)\s*:/i,
  /^(begin forwarded message|fwd?:|re:)/i,
  /^(hi|hello|hey|dear|good (morning|afternoon|evening)|hola|ol[aá])\b[^.!?]{0,40}[,!]?$/i,
  /^(thanks?|thank you|many thanks|cheers|best|kind regards|warm regards|regards|with love|love|blessings|namaste|see you( soon)?|xx+|abra[cç]os?|besos)\b[^.]{0,40}$/i,
  /^sent from my /i,
  /^(on .+ wrote:)$/i,
  /unsubscribe|view (this|in) (email|browser)|privacy policy/i,
  /^>+\s*$/,
];
/** Strip greetings, signatures, forward headers and quote marks; keep the actionable guidance. */
export function cleanPastedText(raw: string): string {
  const lines = raw.replace(/\r/g, '').split('\n').map((l) => l.replace(/^>+\s?/, '').replace(/[ \t]+/g, ' ').trim());
  const out: string[] = [];
  let signature = false;
  for (const l of lines) {
    if (/^(--|__)\s*$/.test(l)) { signature = true; continue; }
    if (signature) continue;
    if (!l) { if (out.length && out[out.length - 1] !== '') out.push(''); continue; }
    if (NOISE.some((re) => re.test(l))) continue;
    if (/^[+\d][\d\s().-]{7,}$/.test(l) || /^\S+@\S+\.\w+$/.test(l) || /^(https?:\/\/|www\.)\S+$/.test(l)) continue;
    out.push(l);
  }
  return out.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

/* ───────── 2. detect anchors + event date ───────── */
const NUM: Record<string, number> = { one: 1, a: 1, an: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, twelve: 12, fourteen: 14, '24': 1, '48': 2, '72': 3 };
const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
const EVENT_WORDS = /\b(ceremony|ceremonies|retreat|session|surgery|operation|procedure|colonoscopy|race|marathon|wedding|exam|competition|fight|shoot|treatment|event)\b/i;
const ANCHOR = /\b(\d+|one|two|three|four|five|six|seven|eight|nine|ten|twelve|fourteen|a|an)\s*(?:-|–|to)?\s*(?:\d+\s*)?(hours?|hrs?|h|days?|weeks?|wks?)\s+(before|prior|ahead|after|following|post)\b/i;
const DAY_OF = /\b(on the day|day of the|the day of|ceremony day|on ceremony day|event day|that day)\b/i;

function num(s: string): number { return /^\d+$/.test(s) ? Number(s) : NUM[s.toLowerCase()] ?? 1; }

export interface DetectedEvent { hasEvent: boolean; title: string; dateGuess: string | null; timeGuess: string | null }
export function detectEvent(text: string, today = new Date()): DetectedEvent {
  const hasEvent = ANCHOR.test(text) || DAY_OF.test(text);
  const word = text.match(EVENT_WORDS)?.[1]?.toLowerCase().replace(/ies$/, 'y') || 'event';
  const title = word === 'event' ? 'Event' : word[0].toUpperCase() + word.slice(1);
  let dateGuess: string | null = null;
  const dm = text.match(/\b(\d{1,2})(?:st|nd|rd|th)?\s+(?:of\s+)?(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\b/i)
    || text.match(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+(\d{1,2})(?:st|nd|rd|th)?\b/i);
  if (dm) {
    const [d, m] = /^\d/.test(dm[1]) ? [Number(dm[1]), dm[2]] : [Number(dm[2]), dm[1]];
    const month = MONTHS.indexOf(m.slice(0, 3).toLowerCase());
    let year = today.getFullYear();
    if (new Date(year, month, d) < new Date(today.getFullYear(), today.getMonth(), today.getDate())) year++;
    dateGuess = isoDate(new Date(year, month, d));
  }
  const tm = text.match(/\b(?:start|begin|arrive|ceremony|session)s?\b[^.\n]{0,30}?\b(?:at|from)\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
  const timeGuess = tm ? hm(to24(Number(tm[1]), tm[3]), Number(tm[2] || 0)) : null;
  return { hasEvent, title, dateGuess, timeGuess };
}

/* ───────── 3a. local (offline) planner ───────── */
const FOODS: { re: RegExp; query: string; title: string }[] = [
  { re: /\b(brown |white )?rice\b/i, query: 'rice', title: 'Eat plain rice' },
  { re: /\bpotato(es)?\b/i, query: 'potato', title: 'Eat boiled potatoes' },
  { re: /\b(boiled )?eggs?\b/i, query: 'egg', title: 'Eat boiled eggs' },
  { re: /\b(vegetable|veggie|veg) soup\b|\bsoups? of vegetables\b/i, query: 'vegetable soup', title: 'Eat vegetable soup' },
  { re: /\bpolenta\b/i, query: 'polenta', title: 'Eat polenta' },
  { re: /\bsalads?\b/i, query: 'salad', title: 'Eat a fresh salad' },
  { re: /\bfruits?\b/i, query: 'fruit', title: 'Eat fresh fruit' },
  { re: /\b(steamed |boiled )?(vegetables|veg|veggies)\b(?! soup)/i, query: 'vegetables', title: 'Eat steamed vegetables' },
  { re: /\b(oats|porridge|oatmeal)\b/i, query: 'oat', title: 'Eat oat porridge' },
  { re: /\b(quinoa)\b/i, query: 'quinoa', title: 'Eat quinoa' },
  { re: /\b(fish)\b/i, query: 'fish', title: 'Eat white fish' },
];
const PRACTICES: { re: RegExp; query: string; title: string; time: string; minutes: number }[] = [
  { re: /\bmeditat/i, query: 'meditation', title: 'Meditate', time: '07:30', minutes: 20 },
  { re: /\byoga\b/i, query: 'yoga', title: 'Practise yoga', time: '08:00', minutes: 30 },
  { re: /\bbreath(work|ing)\b|pranayama/i, query: 'breath', title: 'Do breathwork', time: '17:30', minutes: 15 },
  { re: /\bwalk(s|ing)?\b|time in nature/i, query: 'walk', title: 'Go walking', time: '16:00', minutes: 30 },
  { re: /\bstretch/i, query: 'stretch', title: 'Stretch gently', time: '20:30', minutes: 10 },
  { re: /\bjournal/i, query: 'journal', title: 'Write in a journal', time: '21:00', minutes: 10 },
];
const AVOID = /\b(no|avoid|avoiding|drop|cut out|cut|stop|without|abstain|refrain|eliminate|skip|reduce|limit|nothing)\b/i;

function phaseFor(start: number, end: number): PhaseKey {
  if (start === 0 && end === 0) return 'day';
  if (start > 0) return 'after';
  if (start >= -2) return 'strict';
  if (start < -7) return 'early';
  return 'prep';
}

/** Split "pork, alcohol, salt and sugar (aged cheese, soy)" into clean list entries. */
function splitList(s: string): string[] {
  return s.replace(/\b(etc|and so on)\.?/gi, '').split(/,|;|\/|\band\b|\bor\b|\bnor\b|•|·/i)
    .map((x) => x.replace(/^(any|all|the|foods? that are|foods?|no|avoid|drop)\s+/i, '').replace(/[.:!)(]+$/g, '').replace(/^[(\s-]+/, '').trim())
    .filter((x) => x.length > 1 && x.length < 40 && !/^(before|after|days?|hours?|weeks?)$/i.test(x));
}
const cap = (s: string) => s ? s[0].toUpperCase() + s.slice(1) : s;

/** Window (event-relative day offsets) a sentence applies to, or null when it has no anchor. */
function windowOf(sentence: string, eventHour: number): { start: number; end: number } | null {
  const a = sentence.match(ANCHOR);
  if (a) {
    let n = num(a[1]);
    const unit = a[2].toLowerCase();
    if (/^h/.test(unit)) {
      if (Number(a[1]) <= 12) return { start: 0, end: 0 }; // "5 hours before" = the day itself
      n = Math.ceil(Number(a[1]) / 24);                     // "48 hours before" = 2 days
    }
    if (/^w/.test(unit)) n *= 7;
    const range = sentence.match(/(\d+)\s*(?:-|–|to)\s*(\d+)\s*days?\s+(after|following|post)/i);
    if (/after|following|post/i.test(a[3])) return { start: 1, end: range ? Number(range[2]) : n };
    return { start: -n, end: -1 };
  }
  if (DAY_OF.test(sentence)) return { start: 0, end: 0 };
  if (/\b(after|following) the (ceremony|session|retreat|event)\b|\bafter[- ]care\b|\bthe (next|following) (morning|day)\b/i.test(sentence)) return { start: 1, end: 1 };
  return null;
}

function to24(h: number, ap?: string) { const p = (ap || '').toLowerCase(); return p === 'pm' && h < 12 ? h + 12 : p === 'am' && h === 12 ? 0 : h; }
function hm(h: number, m = 0) { return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`; }

export function localEventPlan(cleaned: string, eventTime: string | null, hasEvent: boolean): Omit<EventPlan, 'eventDate'> {
  const eventHour = Number((eventTime || '19:00').split(':')[0]);
  const det = detectEvent(cleaned);
  // Sentences, keeping list lines attached to their heading ("7 days before:" + bullet lines).
  const blocks: string[] = [];
  let heading = '';
  for (const raw of cleaned.split('\n')) {
    const l = raw.replace(/^\s*([-*•·]|\d+[.)])\s+/, '').trim();
    if (!l) { heading = ''; continue; }
    if (/:$/.test(l) && l.length < 80) { heading = l.replace(/:$/, ''); continue; }
    for (const s of l.split(/(?<=[.!?])\s+(?=[A-Z])/)) blocks.push(heading && !windowOf(s, eventHour) ? `${heading}: ${s}` : s);
  }
  let defaultWindow = { start: -7, end: -1 };
  let afterEnd = 1;
  let cutoff: string | null = null;
  const items: PlanItem[] = [];
  let n = 0;
  const add = (p: Partial<PlanItem> & { title: string; group: PlanItem['group'] }, w: { start: number; end: number }) => {
    const existing = items.find((it) => it.title === p.title && it.startOffset === w.start && it.endOffset === w.end);
    if (existing) { existing.dos.push(...(p.dos || [])); existing.donts.push(...(p.donts || [])); existing.subtasks.push(...(p.subtasks || [])); return existing; }
    const it: PlanItem = { id: `s${++n}`, time: null, durationMinutes: null, notes: '', dos: [], donts: [], subtasks: [], link: null, match: null, include: true, ...p, phase: phaseFor(w.start, w.end), startOffset: w.start, endOffset: w.end };
    items.push(it);
    return it;
  };
  const foodsSeen = new Map<string, { start: number; end: number }>();

  for (const s of blocks) {
    const w0 = windowOf(s, eventHour);
    if (w0 && w0.start <= -3 && w0.start >= -10 && !/week/i.test(s)) defaultWindow = w0;
    if (w0 && w0.start > 0) afterEnd = Math.max(afterEnd, w0.end);
    const w = w0 || (hasEvent ? defaultWindow : { start: 0, end: 0 });
    const low = s.toLowerCase();

    // Day-of cut-off: "nothing after 3 PM" / "last meal 5 hours before".
    const cut = s.match(/\b(?:nothing|no food|don'?t eat|stop eating|last meal)\b[^.]*?\b(?:after|by|before)\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
    const hoursBefore = s.match(/\b(\d+)\s*hours?\s+before\b/i);
    if (cut || (hoursBefore && /eat|food|meal|nothing/i.test(s) && Number(hoursBefore[1]) <= 12)) {
      cutoff = cut ? hm(to24(Number(cut[1]), cut[3] || (Number(cut[1]) < 8 ? 'pm' : '')), Number(cut[2] || 0)) : hm(Math.max(0, eventHour - Number(hoursBefore![1])));
      add({ title: 'Stop eating', group: 'meal', time: cutoff, notes: `Nothing to eat after ${cutoff} on ${det.title.toLowerCase()} day. Water is fine.`, donts: ['Food after the cut-off'] }, { start: 0, end: 0 });
      if (/\bwater\b/i.test(s)) add({ title: 'Drink plenty of water', group: 'meal', time: '09:00', notes: 'Sip water through the day.', link: { kind: 'food', query: 'water' } }, { start: 0, end: 0 });
      if (/light (meal|lunch|breakfast)/i.test(s)) add({ title: 'Eat a light meal', group: 'meal', time: hm(Math.max(7, Number(cutoff.slice(0, 2)) - 3)), notes: 'Small, plain, easy to digest.', link: { kind: 'food', query: 'vegetable soup' } }, { start: 0, end: 0 });
      continue;
    }
    if (/light (meal|lunch|breakfast)/i.test(s) && w.start === 0) { add({ title: 'Eat a light meal', group: 'meal', time: '12:00', notes: 'Small, plain, easy to digest.', link: { kind: 'food', query: 'vegetable soup' } }, w); continue; }
    if (/\bwater\b/i.test(s) && /drink|lots|plenty|hydrat|litre|liter|\bl\b/i.test(s) && !/bring/i.test(s)) {
      add({ title: 'Drink plenty of water', group: 'meal', time: '09:00', notes: cap(s), link: { kind: 'food', query: 'water' } }, w);
      continue;
    }
    if (/\b(bring|pack|what to bring|take with you)\b/i.test(s)) {
      const list = splitList(s.replace(/^.*?\b(bring|pack|take with you)\b\s*:?/i, ''));
      add({ title: `Pack for the ${det.title.toLowerCase()}`, group: 'tasks', time: '18:00', subtasks: list, notes: 'Packing checklist.' }, hasEvent ? { start: -1, end: -1 } : w);
      continue;
    }
    if (/\bintention\b/i.test(s)) { add({ title: 'Set an intention', group: 'wellness', time: '21:00', durationMinutes: 10, notes: cap(s) }, w.start === 0 ? w : { start: Math.min(w.start, -3), end: 0 }); continue; }
    if (/sharing circle|integration circle|\bcircle\b/i.test(s)) {
      const t = s.match(/\b(\d{1,2})(?::(\d{2}))?\s*(?:am|pm)?\s*(?:-|–|to)\s*(\d{1,2})/);
      const start = t ? hm(to24(Number(t[1]), Number(t[1]) < 7 ? 'pm' : 'am'), Number(t[2] || 0)) : '09:00';
      add({ title: 'Join the sharing circle', group: 'wellness', time: start, durationMinutes: t ? Math.max(30, (Number(t[3]) - Number(t[1])) * 60) : 60, notes: cap(s), link: { kind: 'activity', query: 'sharing circle' } }, { start: 1, end: 1 });
      continue;
    }
    if (/screens?|phone|social media|tv|television/i.test(s) && AVOID.test(s)) {
      add({ title: 'Reduce screen time', group: 'wellness', time: '20:00', notes: cap(s), dos: ['Put the phone away an hour before bed', 'Read or rest instead of scrolling'], donts: ['Social media', 'News and TV late in the day'] }, w);
      continue;
    }
    if (/\bsex|sexual|abstinen/i.test(s)) { add({ title: 'Practise sexual abstinence', group: 'wellness', time: null, notes: cap(s), donts: ['Sexual activity'] }, w); continue; }
    if (/psychoactive|drugs?|cannabis|marijuana|recreational|medication/i.test(s)) {
      add({ title: 'Avoid psychoactive substances', group: 'wellness', time: null, notes: `${cap(s)} Check any prescribed medication with a clinician before stopping it.`, donts: splitList(s.match(/\(([^)]+)\)/)?.[1] || s.replace(/^.*?\b(no|avoid|stop)\b/i, '')).map(cap).filter((x) => x.length < 30).slice(0, 6) }, w);
      continue;
    }
    const practice = PRACTICES.filter((p) => p.re.test(s));
    if (practice.length && !AVOID.test(s.replace(/\b(stop|reduce)\b.*$/i, ''))) {
      for (const p of practice) add({ title: p.title, group: p.query === 'walk' ? 'fitness' : 'wellness', time: p.time, durationMinutes: p.minutes, notes: cap(s), link: { kind: 'activity', query: p.query } }, hasEvent && w.start >= 0 && w.start === 0 ? w : w);
      continue;
    }
    if (AVOID.test(s) && !/eat|have|enjoy|stick to/i.test(s.split(AVOID)[0] || '')) {
      const caffeine = /coffee|caffeine|black tea|green tea|matcha|energy drink/i.test(s);
      const tyramine = /tyramine/i.test(s);
      const paren = s.match(/\(([^)]+)\)/)?.[1];
      const body = s.replace(/\([^)]*\)/g, '').replace(/^.*?\b(no|avoid|avoiding|drop|cut out|cut|stop|without|eliminate|skip|reduce|limit)\b\s*:?/i, '');
      if (tyramine) {
        add({ title: 'Avoid tyramine foods', group: 'meal', time: '08:00', notes: cap(s), donts: splitList(paren || body).map(cap) }, w);
        const rest = splitList(body.replace(/tyramine[^,;]*/i, '')).map(cap);
        if (rest.length > 1) add({ title: 'Follow the clean diet', group: 'meal', time: '08:00', notes: '', donts: rest }, w);
      } else if (caffeine) {
        add({ title: 'Skip caffeine', group: 'meal', time: '08:00', notes: cap(s), dos: ['Herbal tea or warm water instead'], donts: splitList(body).map(cap) }, w);
      } else if (/salt|sugar|pork|meat|alcohol|vinegar|spic|pickl|canned|fried|dairy|gluten|processed/i.test(s)) {
        add({ title: 'Follow the clean diet', group: 'meal', time: '08:00', notes: cap(s), donts: splitList(paren ? `${body}, ${paren}` : body).map(cap) }, w);
      } else {
        const list = splitList(body).map(cap);
        if (list.length) add({ title: `Avoid ${list[0].toLowerCase()}`.slice(0, 40), group: 'wellness', time: null, notes: cap(s), donts: list }, w);
      }
      continue;
    }
    // Allowed foods → meal items linked to recipes / ingredients.
    const foods = FOODS.filter((f) => f.re.test(s));
    for (const f of foods) if (!foodsSeen.has(`${f.query}|${w.start}`)) foodsSeen.set(`${f.query}|${w.start}`, w);
    if (foods.length) {
      if (/eat|meal|diet|food|cook|have|stick|boiled|steamed/i.test(low)) {
        const diet = items.find((it) => it.title === 'Follow the clean diet' && it.startOffset <= w.start && it.endOffset >= w.end);
        diet?.dos.push(...foods.map((f) => cap(f.query)));
      }
      continue;
    }
  }

  // Meals: spread the allowed foods over breakfast / lunch / dinner for each diet window.
  const MEAL_SLOTS = [{ t: '08:00', label: 'breakfast' }, { t: '12:30', label: 'lunch' }, { t: '18:30', label: 'dinner' }];
  const byWindow = new Map<string, { w: { start: number; end: number }; queries: string[] }>();
  for (const [k, w] of foodsSeen) { const key = `${w.start}|${w.end}`; const q = k.split('|')[0]; byWindow.set(key, { w, queries: [...(byWindow.get(key)?.queries || []), q] }); }
  if (hasEvent && ![...byWindow.values()].some((v) => v.w.start < 0)) byWindow.set('prep', { w: defaultWindow, queries: ['rice', 'vegetable soup', 'salad', 'polenta', 'fruit'] });
  for (const { w, queries } of byWindow.values()) {
    const breakfast = queries.filter((q) => ['fruit', 'oat', 'egg'].includes(q));
    const mains = queries.filter((q) => !breakfast.includes(q) && q !== 'water');
    const plan = [breakfast[0] || 'fruit', mains[0] || 'vegetable soup', mains[1] || mains[0] || 'rice'];
    const extras = [...breakfast.slice(1), ...mains.slice(2)];
    plan.forEach((q, i) => {
      const f = FOODS.find((x) => x.query === q);
      add({ title: f?.title || `Eat ${q}`, group: 'meal', time: MEAL_SLOTS[i].t, notes: `Simple ${MEAL_SLOTS[i].label}: plain, unsalted, unspiced.`, link: { kind: 'food', query: q } }, w);
    });
    extras.forEach((q, i) => {
      const f = FOODS.find((x) => x.query === q);
      add({ title: f?.title || `Eat ${q}`, group: 'meal', time: i % 2 ? '19:00' : '13:00', notes: 'Alternative within the same diet.', link: { kind: 'food', query: q } }, w);
    });
  }
  // A strict window (48h) replaces the prep meals on its days rather than doubling them.
  const strict = items.find((it) => it.phase === 'strict' && it.group === 'meal' && it.link);
  if (strict) for (const it of items) if (it.phase === 'prep' && it.group === 'meal' && it.link && it.endOffset >= strict.startOffset) it.endOffset = strict.startOffset - 1;
  const dietRules = items.filter((it) => it.title === 'Follow the clean diet');
  for (const d of dietRules) d.dos = Array.from(new Set(d.dos)).slice(0, 8);

  // The event itself, and sleep anchors over the whole window.
  const minStart = Math.min(0, ...items.map((it) => it.startOffset));
  const maxEnd = Math.max(hasEvent ? afterEnd : 0, ...items.map((it) => it.endOffset));
  if (hasEvent) add({ title: `Attend the ${det.title.toLowerCase()}`, group: 'wellness', time: eventTime || '19:00', notes: 'Arrive rested and hydrated, with your packed bag.' }, { start: 0, end: 0 });
  const span = hasEvent ? { start: Math.max(-7, minStart), end: maxEnd } : { start: 0, end: 0 };
  add({ title: 'Wake up', group: 'sleep', time: '07:00', notes: 'Keep a steady wake time.' }, span);
  add({ title: 'Go to bed', group: 'sleep', time: '22:00', notes: 'Wind down early.', dos: ['Keep the room dark', 'Put screens away an hour before'] }, span);

  for (const it of items) { it.dos = Array.from(new Set(it.dos)); it.donts = Array.from(new Set(it.donts)); it.subtasks = Array.from(new Set(it.subtasks)); }
  const ruled = applyItemRules(items);
  items.splice(0, items.length, ...ruled);
  const phases = buildPhases(items, hasEvent, det.title);
  return {
    summary: hasEvent ? `${items.length} suggested steps laid out around the ${det.title.toLowerCase()}, from the pasted text.` : `${items.length} suggested daily steps from the pasted text.`,
    hasEvent, eventTitle: det.title, eventTime: hasEvent ? eventTime || '19:00' : null, cutoffTime: cutoff,
    phases, items, source: 'local',
  };
}

export function buildPhases(items: PlanItem[], hasEvent: boolean, eventTitle: string): PlanPhase[] {
  if (!hasEvent) return [{ key: 'daily', title: 'Daily routine', startOffset: 0, endOffset: 0 }];
  const used = new Set(items.map((it) => it.phase));
  const span = (k: PhaseKey) => { const xs = items.filter((it) => it.phase === k && it.group !== 'sleep'); return xs.length ? { s: Math.min(...xs.map((x) => x.startOffset)), e: Math.max(...xs.map((x) => x.endOffset)) } : null; };
  const def: { key: PhaseKey; title: string }[] = [
    { key: 'early', title: 'Early preparation' },
    { key: 'prep', title: 'Preparation' },
    { key: 'strict', title: 'Strict 48 hours' },
    { key: 'day', title: `${eventTitle} day` },
    { key: 'after', title: 'After-care' },
  ];
  return def.filter((d) => used.has(d.key) && span(d.key)).map((d) => { const s = span(d.key)!; return { key: d.key, title: d.title, startOffset: s.s, endOffset: d.key === 'early' || d.key === 'prep' || d.key === 'strict' ? -1 : s.e }; });
}

/* ───────── 3b. AI planner (edge route), local fallback ───────── */
export async function planEventProtocol(accessToken: string, protocolId: string, cleaned: string, event: { date: string | null; time: string | null }, hasEvent: boolean): Promise<EventPlan> {
  try {
    const res = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-ed0fe4c2/guides/plan-event-protocol`, {
      method: 'POST',
      headers: { apikey: publicAnonKey, Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ protocolId, text: cleaned.slice(0, 12000), eventDate: event.date, eventTime: event.time, hasEvent }),
    });
    if (res.ok) {
      const data = await res.json();
      const plan = normaliseAIPlan(data, hasEvent);
      if (plan.items.length) return { ...plan, eventDate: event.date, eventTime: hasEvent ? plan.eventTime || event.time : null };
    }
  } catch { /* route not deployed / offline → local planner */ }
  return { ...localEventPlan(cleaned, event.time, hasEvent), eventDate: event.date };
}

function normaliseAIPlan(data: any, hasEvent: boolean): Omit<EventPlan, 'eventDate'> {
  const time = (t: any) => /^([01]\d|2[0-3]):[0-5]\d$/.test(String(t || '')) ? String(t) : null;
  const list = (x: any) => Array.isArray(x) ? x.map((s) => String(s).trim()).filter(Boolean).slice(0, 20) : [];
  const items: PlanItem[] = (Array.isArray(data?.items) ? data.items : []).slice(0, 60).map((r: any, i: number) => {
    const start = Math.round(Number(r.start_offset ?? 0)), end = Math.max(start, Math.round(Number(r.end_offset ?? start)));
    const group = r.group === 'sleep' || SMART_GROUPS.includes(r.group) ? r.group : 'wellness';
    const lk = r.link_kind === 'food' || r.link_kind === 'activity' ? { kind: r.link_kind, query: String(r.link_query || r.title).slice(0, 40) } : null;
    const anchor = ['wake', 'bedtime', 'before_meal', 'after_meal'].includes(r.anchor) ? r.anchor : null;
    return { id: `a${i}`, kind: r.kind === 'rule' ? 'rule' : 'action', anchor, offsetMinutes: Number(r.offset_minutes) || 0, title: String(r.title || `Step ${i + 1}`).slice(0, 80), group, time: time(r.time), durationMinutes: r.duration_minutes ? Math.min(240, Number(r.duration_minutes)) : null, notes: String(r.notes || '').slice(0, 600), startOffset: hasEvent ? start : 0, endOffset: hasEvent ? end : 0, phase: hasEvent ? phaseFor(start, end) : 'daily', dos: list(r.dos || r.tips), donts: list(r.donts), subtasks: list(r.subtasks), link: lk as PlanItem['link'], match: null, include: true };
  });
  // Top-level rules for a day / week / phase ("rules":[{title,dos,donts,start_offset,end_offset}]).
  for (const [j, r] of (Array.isArray(data?.rules) ? data.rules : []).slice(0, 20).entries()) {
    const start = Math.round(Number(r.start_offset ?? 0)), end = Math.max(start, Math.round(Number(r.end_offset ?? start)));
    items.push({ id: `r${j}`, kind: 'rule', title: String(r.title || 'Rules').slice(0, 80), group: SMART_GROUPS.includes(r.group) ? r.group : 'wellness', time: null, durationMinutes: null, notes: '', startOffset: hasEvent ? start : 0, endOffset: hasEvent ? end : 0, phase: hasEvent ? phaseFor(start, end) : 'daily', dos: list(r.dos || r.tips), donts: list(r.donts), subtasks: [], link: null, match: null, include: true });
  }
  const ruled = applyItemRules(items);
  items.splice(0, items.length, ...ruled);
  const title = String(data?.event_title || 'Event').slice(0, 30);
  return { summary: String(data?.summary || '').slice(0, 600), hasEvent, eventTitle: title, eventTime: time(data?.event_time), cutoffTime: time(data?.cutoff_time), phases: buildPhases(items, hasEvent, title), items, source: 'ai' };
}

/* ───────── 4. link to catalog records ───────── */
const norm = (s: string) => s.toLowerCase().replace(/[^a-z ]/g, ' ').replace(/\s+/g, ' ').trim();
function pick(hits: CatalogHit[], query: string): { hit: CatalogHit; quality: 'exact' | 'close' } | null {
  const q = norm(query);
  const scored = hits.map((h) => {
    const n = norm(h.name);
    const s = n === q || n === `${q}s` ? 3 : n.startsWith(q) || n.split(' ').includes(q) ? 2 : n.includes(q) ? 1 : 0;
    return { h, s: s * 100 - n.length };
  }).filter((x) => x.s > 0).sort((a, b) => b.s - a.s);
  if (!scored.length) return null;
  return { hit: scored[0].h, quality: scored[0].s >= 200 ? 'exact' : 'close' };
}
export async function linkPlanItems(accessToken: string, plan: EventPlan, onProgress?: (done: number, total: number) => void): Promise<EventPlan> {
  // One lookup per distinct query, shared by every item that asks for it (items run in parallel).
  const cache = new Map<string, Promise<PlanMatch | null>>();
  const lookup = async (kindOf: 'food' | 'activity', query: string): Promise<PlanMatch | null> => {
    const kinds: CatalogKind[] = kindOf === 'activity' ? ['activity'] : ['recipe', 'ingredient'];
    let found: PlanMatch | null = null;
    for (const kind of kinds) {
      const hits = await searchCatalog(accessToken, kind, query, 12).catch(() => [] as CatalogHit[]);
      const p = pick(hits, query);
      if (p && (!found || (found.quality === 'close' && p.quality === 'exact'))) found = { kind, id: p.hit.id, name: p.hit.name, image: p.hit.image, quality: p.quality };
      if (found?.quality === 'exact') break;
    }
    return found;
  };
  const targets = plan.items.filter((it) => it.link);
  let done = 0;
  const items = await Promise.all(plan.items.map(async (it) => {
    if (!it.link) return it;
    const key = `${it.link.kind}|${norm(it.link.query)}`;
    if (!cache.has(key)) cache.set(key, lookup(it.link.kind, it.link.query));
    const match = await cache.get(key)!;
    onProgress?.(++done, targets.length);
    // A linked meal takes the recipe name only when the Guardian's title was blank or generic.
    const title = match && it.link.kind === 'food' && isGenericTitle(it.title, it.link.query) ? match.name : it.title;
    return { ...it, match, title };
  }));
  return { ...plan, items };
}

/* ───────── 5. apply ───────── */
export function isoDate(d: Date) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }
export function offsetDate(eventDate: string, offset: number): string { const [y, m, d] = eventDate.split('-').map(Number); return isoDate(new Date(y, m - 1, d + offset)); }
export function dayPart(time: string | null): DayPart { const h = Number((time || '08:00').slice(0, 2)); return h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening'; }

const SUBTYPE: Record<SmartGroup | 'sleep', string> = { hygiene: 'hygiene', beauty: 'hygiene', wellness: 'wellness', fitness: 'exercise', supplements: 'supplement', meal: 'meal', work: 'work', home: 'home', tasks: 'tasks', sleep: 'sleep' };
const CATEGORY: Record<SmartGroup | 'sleep', string> = { hygiene: 'do', beauty: 'do', wellness: 'do', fitness: 'do', supplements: 'supplement', meal: 'consume', work: 'do', home: 'do', tasks: 'do', sleep: 'sleep' };

/** Adds the included items to `protocolId` only. Never hides, edits or deletes existing steps. */
export async function applyEventPlan(accessToken: string, protocolId: string, plan: EventPlan, startSort = 0): Promise<{ added: number; children: number }> {
  const chosen = plan.items.filter((it) => it.include);
  const dated = plan.hasEvent && plan.eventDate;
  const window = (it: PlanItem) => dated
    ? { recurrence_type: 'daily', recurrence_start_date: offsetDate(plan.eventDate!, it.startOffset), recurrence_end_date: offsetDate(plan.eventDate!, it.endOffset) }
    : { recurrence_type: 'daily', recurrence_start_date: null, recurrence_end_date: null };
  let added = 0, children = 0;
  for (const [index, it] of chosen.entries()) {
    if (it.kind === 'rule') {
      // Top-level dated rules: the app lists them in "Rules & Avoidances", grouped by scope.
      const rows = [...it.dos.map((name) => ({ name, kind: 'rule_do' })), ...it.donts.map((name) => ({ name, kind: 'rule_dont' }))];
      if (!rows.length) rows.push({ name: it.title, kind: 'rule_do' });
      // Group-level rule: Drinks / Consume / Supplements list for these dates (scope + subtype), never one item.
      const groupRule = ruleRowFields(it.ruleGroup || ruleGroupFor(`${it.title} ${[...it.dos, ...it.donts].join(' ')}`, it.group));
      for (const [k, row] of rows.entries()) {
        await createProtocolItem(accessToken, {
          protocol_id: protocolId, display_name: row.name, kind: row.kind, ...groupRule,
          item_type: groupRule.category === 'consume' ? 'consume' : 'activity', scheduled_time: null, duration_minutes: null, group_name: null, day_number: 1,
          sort_order: startSort + index + 1 + k, parent_protocol_item_id: null, has_children: false,
          hidden: false, enabled: true, notes: k === 0 ? [it.title, it.notes].filter(Boolean).join(' — ') : '', ...window(it),
        } as Partial<AdminProtocolItem>);
        children++;
      }
      continue;
    }
    const m = it.match;
    const link: Partial<AdminProtocolItem> = m ? { [m.kind === 'recipe' ? 'catalog_recipe_id' : m.kind === 'ingredient' ? 'catalog_ingredient_id' : 'catalog_activity_id']: m.id } : {};
    const item_type = m?.kind === 'recipe' ? 'recipe' : it.group === 'meal' ? 'consume' : it.group === 'supplements' ? 'supplement' : 'activity';
    const kidCount = it.dos.length + it.donts.length + it.subtasks.length;
    const parent = await createProtocolItem(accessToken, {
      protocol_id: protocolId, display_name: it.title, kind: 'action', scope: null, item_type,
      scheduled_time: it.time ? `${it.time}:00` : null, duration_minutes: it.durationMinutes, group_name: it.mealSlot || (it.group === 'beauty' ? 'Beauty' : null),
      day_number: 1, sort_order: startSort + index + 1, parent_protocol_item_id: null, has_children: kidCount > 0,
      category: CATEGORY[it.group], subtype: SUBTYPE[it.group], hidden: false, enabled: true, notes: it.notes,
      ...window(it), ...link,
    } as Partial<AdminProtocolItem>);
    added++;
    const kids: { name: string; kind: string }[] = [
      ...it.dos.map((name) => ({ name, kind: 'rule_do' })),
      ...it.donts.map((name) => ({ name, kind: 'rule_dont' })),
      ...it.subtasks.map((name) => ({ name, kind: 'action' })),
    ];
    for (const [k, kid] of kids.entries()) {
      await createProtocolItem(accessToken, {
        protocol_id: protocolId, display_name: kid.name, kind: kid.kind, scope: null, item_type: kid.kind === 'action' ? 'activity' : item_type,
        scheduled_time: null, duration_minutes: null, group_name: null, day_number: 1, sort_order: k + 1,
        parent_protocol_item_id: parent.id, has_children: false, category: CATEGORY[it.group], subtype: SUBTYPE[it.group],
        hidden: false, enabled: true, notes: '', ...window(it),
      } as Partial<AdminProtocolItem>);
      children++;
    }
  }
  return { added, children };
}
