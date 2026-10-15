/*
 * recipePdf — printable black-&-white recipe pages for Guardian recipes and recipe books.
 * One recipe per page: ROUTINE³ | RECIPE lockup, title, meta line, description, ingredients
 * (amount + grams), numbered method, and the database-calculated nutrition table.
 * Pure client-side jsPDF vectors, like protocolPdf.
 */
import { jsPDF } from 'jspdf';
import { KEY_MICROS, MACRO_KEYS, computeNutrition, type RecipeDraft } from './guideRecipeAI';

const MACRO_LABEL: Record<string, [string, string]> = {
  energy_kcal: ['Energy', ' kcal'], protein_g: ['Protein', ' g'], carbohydrates_g: ['Carbohydrates', ' g'], fats_g: ['Fat', ' g'],
  saturated_fat_g: ['of which saturated', ' g'], sugar_g: ['Sugars', ' g'], fiber_g: ['Fibre', ' g'],
};

export function buildRecipePdf(recipes: RecipeDraft[], opts: { bookTitle?: string; author?: string } = {}): { doc: jsPDF; filename: string } {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const PW = 210, PH = 297, M = 16, W = PW - M * 2;
  doc.setTextColor(0); doc.setDrawColor(0);
  let y = M;
  const ensure = (need: number) => { if (y + need > PH - M) { doc.addPage(); y = M; } };
  const heading = (t: string) => { ensure(14); doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.text(t.toUpperCase(), M, y, { charSpace: 0.4 }); y += 2; doc.setLineWidth(0.4); doc.line(M, y, M + W, y); y += 5; };
  const lockup = () => {
    const h = 7, pad = 2.6;
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9.5);
    const wordW = doc.getTextWidth('ROUTINE³') + 1.6;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(6.5);
    const tagW = doc.getTextWidth('RECIPE');
    doc.setLineWidth(0.3);
    doc.rect(M, y - 2, pad * 4 + wordW + tagW, h);
    doc.line(M + pad * 2 + wordW, y - 2, M + pad * 2 + wordW, y - 2 + h);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9.5); doc.text('ROUTINE³', M + pad, y + 2.6, { charSpace: 0.2 });
    doc.setFont('helvetica', 'normal'); doc.setFontSize(6.5); doc.text('RECIPE', M + pad * 3 + wordW, y + 2.4);
    if (opts.bookTitle) { doc.setFontSize(8); doc.text(opts.bookTitle, PW - M, y + 2.4, { align: 'right' }); }
    y += h + 6;
  };

  recipes.forEach((recipe, index) => {
    if (index) { doc.addPage(); y = M; }
    lockup();
    doc.setFont('helvetica', 'bold'); doc.setFontSize(22);
    const title = doc.splitTextToSize(recipe.title || 'Recipe', W);
    doc.text(title, M, y + 4); y += 4 + title.length * 8.5;
    const total = (recipe.prep_time || 0) + (recipe.cook_time || 0);
    const meta = [recipe.meal_slot && recipe.meal_slot !== 'any' ? recipe.meal_slot[0].toUpperCase() + recipe.meal_slot.slice(1) : '', `Serves ${recipe.servings}`, recipe.prep_time != null ? `Prep ${recipe.prep_time} min` : '', recipe.cook_time ? `Cook ${recipe.cook_time} min` : '', total ? `Total ${total} min` : '', opts.author ? `by ${opts.author}` : ''].filter(Boolean).join('   ·   ');
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9.5); doc.text(meta, M, y); y += 7;
    if (recipe.description) { doc.setFontSize(10.5); const d = doc.splitTextToSize(recipe.description, W); doc.text(d, M, y); y += d.length * 5 + 4; }

    heading('Ingredients');
    doc.setFontSize(10);
    for (const item of recipe.ingredients.filter((i) => i.name.trim())) {
      ensure(6);
      const amount = `${+item.amount.toFixed(2)} ${item.unit}`;
      doc.setLineWidth(0.25); doc.rect(M, y - 3, 3, 3);
      doc.setFont('helvetica', 'bold'); doc.text(amount, M + 6, y);
      doc.setFont('helvetica', 'normal');
      const name = doc.splitTextToSize(`${item.name}${item.preparation ? `, ${item.preparation}` : ''}`, W - 60);
      doc.text(name, M + 32, y);
      if (item.unit !== 'g' && item.grams) doc.text(`${Math.round(item.grams)} g`, M + W, y, { align: 'right' });
      y += name.length * 4.6 + 1.4;
    }
    y += 3;

    heading('Method');
    recipe.instructions.map((s) => s.trim()).filter(Boolean).forEach((step, i) => {
      const lines = doc.splitTextToSize(step, W - 9);
      ensure(lines.length * 4.8 + 2);
      doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.text(`${i + 1}.`, M, y);
      doc.setFont('helvetica', 'normal'); doc.text(lines, M + 8, y);
      y += lines.length * 4.8 + 2;
    });
    y += 3;

    const n = computeNutrition(recipe.ingredients, recipe.servings);
    const rows: Array<[string, string, string]> = [];
    for (const key of MACRO_KEYS) if (n.perServing[key] != null) { const [label, unit] = MACRO_LABEL[key]; rows.push([label, `${n.perServing[key]}${unit}`, `${n.total[key]}${unit}`]); }
    for (const [key, label] of KEY_MICROS) if (n.perServing.micros?.[key] != null) { const unit = key.endsWith('_iu') ? ' IU' : ` ${key.split('_').pop()}`; rows.push([label, `${+n.perServing.micros[key].toFixed(1)}${unit}`, `${+n.total.micros![key].toFixed(1)}${unit}`]); }
    ensure(14 + rows.length * 5.2);
    heading('Nutrition');
    doc.setFontSize(8.5); doc.setFont('helvetica', 'bold');
    doc.text(`Per serving (${n.servingWeight} g)`, M + W * 0.72, y, { align: 'right' }); doc.text(`Whole recipe (${n.totalWeight} g)`, M + W, y, { align: 'right' }); y += 4.5;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9.5);
    for (const [label, per, all] of rows) { doc.setLineWidth(0.1); doc.line(M, y - 3.6, M + W, y - 3.6); doc.text(label, M + (label.startsWith('of which') ? 4 : 0), y); doc.text(per, M + W * 0.72, y, { align: 'right' }); doc.text(all, M + W, y, { align: 'right' }); y += 5.2; }
    doc.setFontSize(7.5); doc.setTextColor(90);
    doc.text(`Calculated from the ROUTINE³ ingredient database (${n.matched} of ${n.count} ingredients matched${n.microMatched < n.matched ? `; micronutrients from ${n.microMatched}` : ''}).`, M, y + 1);
    doc.setTextColor(0);
  });
  const slug = (opts.bookTitle || recipes[0]?.title || 'recipe').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return { doc, filename: `${slug || 'recipe'}.pdf` };
}
