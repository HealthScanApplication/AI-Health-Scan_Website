/*
 * protocolPdf — generate a printable, black-&-white "weekly protocol tracker"
 * PDF for a protocol, to download and hand to a user. Layout:
 *   1. Header — protocol name, "Week starting ____" date field, the goal.
 *   2. Weekly tracker — a box-on-box grid: each behaviour is a row, Mon–Sun are
 *      columns of tick-boxes, with a write-in date box under each day.
 *   3. How to do it — numbered instructions (each step's child detail lines),
 *      plus Do / Avoid guidance.
 *   4. Recipes — the mini-recipes for any linked recipe (ingredients + method).
 *
 * Pure client-side (jsPDF vector rects/lines — crisp B&W, no rasterisation).
 * Recipe details are fetched from the current environment via PostgREST.
 */
import { jsPDF } from 'jspdf';
import { projectId, publicAnonKey } from './supabase/info';

export interface PdfProtocol {
  name: string;
  description?: string | null;
  creator?: string | null;
  health_score?: number | null;
  total_days?: number | null;
}
export interface PdfItem {
  id: string;
  display_name?: string | null;
  scheduled_time?: string | null;
  kind?: string | null;
  scope?: string | null;
  group_name?: string | null;
  day_number?: number | null;
  hidden?: boolean | null;
  parent_protocol_item_id?: string | null;
  catalog_recipe_id?: string | null;
}
interface Recipe {
  id: string; name_common: string; description?: string | null;
  servings?: number | null; prep_time?: string | null; cook_time?: string | null;
  instructions?: any; ingredients: { name: string; amount?: string; optional?: boolean }[];
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function fmtTime(t?: string | null): string {
  const m = /^(\d{1,2}):(\d{2})/.exec(t || '');
  if (!m) return '';
  let h = parseInt(m[1], 10); const min = m[2];
  const ap = h < 12 ? 'am' : 'pm'; h = h % 12 || 12;
  return `${h}:${min}${ap}`;
}
const rest = () => `https://${projectId}.supabase.co/rest/v1`;

async function fetchRecipes(accessToken: string, ids: string[]): Promise<Recipe[]> {
  if (!ids.length) return [];
  const headers = { Authorization: `Bearer ${accessToken}`, apikey: publicAnonKey };
  const list = ids.join(',');
  const [recRes, ingRes] = await Promise.all([
    fetch(`${rest()}/catalog_recipes?id=in.(${list})&select=id,name_common,description,servings,prep_time,cook_time,instructions`, { headers }),
    fetch(`${rest()}/catalog_recipe_ingredients?recipe_id=in.(${list})&select=recipe_id,ingredient_name,amount_g,unit,quantity,preparation,is_optional,sort_order,display_order`, { headers }),
  ]);
  const recs: any[] = recRes.ok ? await recRes.json() : [];
  const ings: any[] = ingRes.ok ? await ingRes.json() : [];
  const byRecipe = new Map<string, any[]>();
  for (const g of ings) { const a = byRecipe.get(g.recipe_id) || []; a.push(g); byRecipe.set(g.recipe_id, a); }
  return recs.map((r) => ({
    id: r.id, name_common: r.name_common, description: r.description,
    servings: r.servings, prep_time: r.prep_time, cook_time: r.cook_time, instructions: r.instructions,
    ingredients: (byRecipe.get(r.id) || [])
      .sort((a, b) => (a.display_order ?? a.sort_order ?? 0) - (b.display_order ?? b.sort_order ?? 0))
      .map((g) => {
        const qty = g.quantity != null ? String(g.quantity) : g.amount_g != null ? String(g.amount_g) : '';
        const unit = g.unit || (g.amount_g != null ? 'g' : '');
        const amount = [qty, unit].filter(Boolean).join(' ') + (g.preparation ? `, ${g.preparation}` : '');
        return { name: g.ingredient_name || 'Ingredient', amount: amount.trim(), optional: !!g.is_optional };
      }),
  }));
}

function instructionSteps(instructions: any): string[] {
  if (!instructions) return [];
  if (Array.isArray(instructions)) return instructions.map((s) => (typeof s === 'string' ? s : s?.text || '')).filter(Boolean);
  if (typeof instructions === 'string') {
    const s = instructions.trim();
    if (s.startsWith('[')) { try { return instructionSteps(JSON.parse(s)); } catch { /* fall through */ } }
    return s.split(/\n+|(?<=\.)\s+(?=[A-Z0-9])/).map((x) => x.trim()).filter(Boolean);
  }
  return [];
}

/** Build the PDF and return the jsPDF doc + filename (caller saves it — keeps
 *  this pure/testable; browser code calls `doc.save(filename)`). */
export async function buildProtocolPdf(opts: { accessToken: string; protocol: PdfProtocol; items: PdfItem[]; day?: number }): Promise<{ doc: jsPDF; filename: string }> {
  const { accessToken, protocol, items } = opts;
  const day = opts.day ?? 1;

  // top-level behaviours to track (one cycle day) + their child "how-to" lines
  const tops = items.filter((i) => (i.kind === 'action' || !i.kind) && !i.parent_protocol_item_id && !i.hidden
    && (i.day_number == null || i.day_number === day));
  const childrenByParent = new Map<string, string[]>();
  for (const it of items) {
    if (it.parent_protocol_item_id && it.display_name) {
      const a = childrenByParent.get(it.parent_protocol_item_id) || []; a.push(it.display_name); childrenByParent.set(it.parent_protocol_item_id, a);
    }
  }
  const minutesOf = (t?: string | null) => { const m = /^(\d{1,2}):(\d{2})/.exec(t || ''); return m ? +m[1] * 60 + +m[2] : 1e9; };
  const behaviours = [...tops].sort((a, b) => minutesOf(a.scheduled_time) - minutesOf(b.scheduled_time));
  const dos = items.filter((i) => i.kind === 'rule_do' && !i.parent_protocol_item_id).map((i) => i.display_name || '');
  const donts = items.filter((i) => i.kind === 'rule_dont' && !i.parent_protocol_item_id).map((i) => i.display_name || '');
  const recipeIds = [...new Set(items.map((i) => i.catalog_recipe_id).filter(Boolean) as string[])];
  const recipes = await fetchRecipes(accessToken, recipeIds).catch(() => []);
  const recipeById = new Map(recipes.map((r) => [r.id, r]));

  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const PW = 210, PH = 297, M = 14, W = PW - M * 2;
  doc.setTextColor(0); doc.setDrawColor(0);
  let y = M;

  const ensure = (need: number) => { if (y + need > PH - M) { doc.addPage(); y = M; } };
  const heading = (t: string, size = 12) => { ensure(10); doc.setFont('helvetica', 'bold'); doc.setFontSize(size); doc.text(t, M, y); y += size * 0.5; doc.setLineWidth(0.4); doc.line(M, y, M + W, y); y += 5; };

  // ── 1. Header ──
  doc.setFont('helvetica', 'bold'); doc.setFontSize(20);
  const titleLines = doc.splitTextToSize(protocol.name || 'Protocol', W);
  doc.text(titleLines, M, y + 5); y += 5 + titleLines.length * 8;
  doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
  const meta = ['Weekly tracker', protocol.creator ? `by ${protocol.creator}` : '', protocol.health_score ? `${protocol.health_score}/100` : ''].filter(Boolean).join('   ·   ');
  doc.text(meta, M, y); y += 7;
  // date field
  doc.setFont('helvetica', 'bold'); doc.setFontSize(11);
  doc.text('Week starting:', M, y);
  doc.setLineWidth(0.3); doc.line(M + 30, y + 0.5, M + 85, y + 0.5);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.text('(write the Monday’s date)', M + 88, y);
  y += 8;
  if (protocol.description) {
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9.5);
    let goal = String(protocol.description).replace(/[#*_>`]/g, '').split(/\n\s*\n/)[0].trim();
    if (goal.length > 300) goal = goal.slice(0, 300).replace(/\s+\S*$/, '') + '…';
    const gl = doc.splitTextToSize(goal, W); ensure(gl.length * 4.6 + 4); doc.text(gl, M, y); y += gl.length * 4.6 + 4;
  }

  // ── 2. Weekly tracker grid (box-on-box) ──
  heading('Tick each day you do it', 13);
  const labelW = 66, dayW = (W - labelW) / 7;
  const drawGridHeader = () => {
    const hHead = 8, hDate = 9;
    // day-name header row
    doc.setFillColor(0); doc.rect(M, y, labelW, hHead, 'S');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.text('Behaviour', M + 2, y + 5.5);
    DAYS.forEach((d, i) => { const x = M + labelW + i * dayW; doc.rect(x, y, dayW, hHead, 'S'); doc.text(d, x + dayW / 2, y + 5.5, { align: 'center' }); });
    y += hHead;
    // write-in date row
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5);
    doc.rect(M, y, labelW, hDate, 'S'); doc.text('Date', M + 2, y + 5.5);
    for (let i = 0; i < 7; i++) { const x = M + labelW + i * dayW; doc.rect(x, y, dayW, hDate, 'S'); }
    y += hDate;
  };
  drawGridHeader();
  doc.setFontSize(8.5);
  behaviours.forEach((b, idx) => {
    const label = `${idx + 1}. ${b.display_name || 'Step'}`;
    const time = fmtTime(b.scheduled_time);
    const labelLines = doc.splitTextToSize(label, labelW - 4);
    const rowH = Math.max(9, labelLines.length * 3.6 + 3.5);
    if (y + rowH > PH - M) { doc.addPage(); y = M; drawGridHeader(); doc.setFontSize(8.5); }
    // label cell
    doc.rect(M, y, labelW, rowH, 'S');
    doc.setFont('helvetica', 'normal'); doc.text(labelLines, M + 2, y + 4);
    if (time) { doc.setFont('helvetica', 'italic'); doc.setFontSize(7); doc.text(time, M + labelW - 2, y + rowH - 2, { align: 'right' }); doc.setFontSize(8.5); }
    // day tick boxes
    const box = 4.5;
    for (let i = 0; i < 7; i++) {
      const x = M + labelW + i * dayW; doc.rect(x, y, dayW, rowH, 'S');
      doc.setLineWidth(0.25); doc.rect(x + dayW / 2 - box / 2, y + rowH / 2 - box / 2, box, box, 'S'); doc.setLineWidth(0.4);
    }
    y += rowH;
  });
  if (!behaviours.length) { doc.setFont('helvetica', 'italic'); doc.setFontSize(9); doc.text('No timed steps to track.', M, y + 4); y += 8; }
  y += 4;

  // ── 3. How to do it ──
  heading('How to do it', 13);
  doc.setFontSize(9.5);
  behaviours.forEach((b, idx) => {
    const kids = childrenByParent.get(b.id) || [];
    const rec = b.catalog_recipe_id ? recipeById.get(b.catalog_recipe_id) : null;
    const head = `${idx + 1}. ${b.display_name || 'Step'}${fmtTime(b.scheduled_time) ? `  (${fmtTime(b.scheduled_time)})` : ''}`;
    const headLines = doc.splitTextToSize(head, W);
    ensure(headLines.length * 5 + 2);
    doc.setFont('helvetica', 'bold'); doc.text(headLines, M, y); y += headLines.length * 5;
    doc.setFont('helvetica', 'normal');
    for (const k of kids) {
      const kl = doc.splitTextToSize(`•  ${k}`, W - 6); ensure(kl.length * 4.4 + 1);
      doc.text(kl, M + 4, y); y += kl.length * 4.4;
    }
    if (rec) { ensure(5); doc.setFont('helvetica', 'italic'); doc.text(`»  Recipe: ${rec.name_common} (see Recipes at the end)`, M + 4, y); doc.setFont('helvetica', 'normal'); y += 5; }
    y += 2;
  });

  if (dos.length || donts.length) {
    heading('Do & Avoid', 12);
    const col = W / 2 - 3; doc.setFontSize(9.5);
    const startY = y;
    let yL = startY;
    doc.setFont('helvetica', 'bold'); doc.text('DO', M, yL); yL += 5; doc.setFont('helvetica', 'normal');
    for (const d of dos) { const l = doc.splitTextToSize(`+  ${d}`, col); if (yL + l.length * 4.4 > PH - M) break; doc.text(l, M, yL); yL += l.length * 4.4 + 1; }
    let yR = startY;
    const xR = M + W / 2 + 3;
    doc.setFont('helvetica', 'bold'); doc.text('AVOID', xR, yR); yR += 5; doc.setFont('helvetica', 'normal');
    for (const d of donts) { const l = doc.splitTextToSize(`×  ${d}`, col); if (yR + l.length * 4.4 > PH - M) break; doc.text(l, xR, yR); yR += l.length * 4.4 + 1; }
    y = Math.max(yL, yR) + 4;
  }

  // ── 4. Mini recipes ──
  if (recipes.length) {
    doc.addPage(); y = M;
    heading('Recipes', 14);
    for (const r of recipes) {
      ensure(16);
      doc.setFont('helvetica', 'bold'); doc.setFontSize(12);
      const nl = doc.splitTextToSize(r.name_common, W); doc.text(nl, M, y); y += nl.length * 5.5;
      const sub = [r.servings ? `Serves ${r.servings}` : '', r.prep_time ? `Prep ${r.prep_time}` : '', r.cook_time ? `Cook ${r.cook_time}` : ''].filter(Boolean).join('   ·   ');
      if (sub) { doc.setFont('helvetica', 'italic'); doc.setFontSize(8.5); doc.text(sub, M, y); y += 5; }
      // ingredients
      if (r.ingredients.length) {
        doc.setFont('helvetica', 'bold'); doc.setFontSize(9.5); ensure(6); doc.text('Ingredients', M, y); y += 4.6;
        doc.setFont('helvetica', 'normal');
        for (const ing of r.ingredients) {
          const line = `•  ${ing.amount ? ing.amount + '  ' : ''}${ing.name}${ing.optional ? ' (optional)' : ''}`;
          const l = doc.splitTextToSize(line, W - 4); ensure(l.length * 4.4); doc.text(l, M + 2, y); y += l.length * 4.4;
        }
        y += 2;
      }
      // method
      const steps = instructionSteps(r.instructions);
      if (steps.length) {
        doc.setFont('helvetica', 'bold'); doc.setFontSize(9.5); ensure(6); doc.text('Method', M, y); y += 4.6;
        doc.setFont('helvetica', 'normal');
        steps.forEach((s, i) => { const l = doc.splitTextToSize(`${i + 1}.  ${s}`, W - 4); ensure(l.length * 4.4); doc.text(l, M + 2, y); y += l.length * 4.4; });
      }
      y += 6; doc.setLineWidth(0.2); if (y < PH - M) doc.line(M, y, M + W, y); y += 6; doc.setLineWidth(0.4);
    }
  }

  // footer page numbers
  const n = doc.getNumberOfPages();
  for (let p = 1; p <= n; p++) {
    doc.setPage(p); doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(120);
    doc.text(`${protocol.name} — page ${p} of ${n}`, M, PH - 6);
    doc.text('HealthScan', PW - M, PH - 6, { align: 'right' });
    doc.setTextColor(0);
  }

  const slug = (protocol.name || 'protocol').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'protocol';
  return { doc, filename: `${slug}-weekly-tracker.pdf` };
}

/** Browser entry point — build + trigger the download. */
export async function generateProtocolPdf(opts: { accessToken: string; protocol: PdfProtocol; items: PdfItem[]; day?: number }): Promise<void> {
  const { doc, filename } = await buildProtocolPdf(opts);
  doc.save(filename);
}
