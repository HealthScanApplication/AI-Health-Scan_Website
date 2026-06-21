/*
 * RecordPreview — a phone-framed, app-faithful preview of any admin record, for
 * EVERY data type. Reverse-engineered from the mobile repo's list cards
 * (UnifiedCard "protocol" + "compact" variants, SuppliesScreen SupplyRow) so the
 * admin shows each record exactly as it appears in the iOS app.
 *
 * One entry point: <RecordPreview activeTab record />. A tab→component map picks
 * the right card; everything without a bespoke app card falls back to the shared
 * CatalogCardPreview (which IS the real catalog list card). Protocols defer to
 * the routine editor's ProtocolHomeScreen; waitlist has no app surface.
 *
 * No-JIT: all styling is inline (the site ships prebuilt static CSS).
 */
import {
  Package, Leaf, UtensilsCrossed, Atom, Dumbbell, Wrench, Flame, HeartPulse,
  FlaskConical, Stethoscope, Gift, Pill, Utensils, User, Bookmark,
  Beef, Wheat, Salad, MoreVertical,
} from "lucide-react";
import type { CSSProperties, ReactNode } from "react";
import { PhoneFrame } from "../../mockups/PhoneFrame";
import type { AdminRecord } from "../../../hooks/useAdminRecords";

const POPPINS = 'Poppins, "Archivo", system-ui, -apple-system, sans-serif';

/* ───────── tokens + helpers ───────── */
function getHealthScoreStyle(score: number): { bg: string; fg: string; text: string } {
  const n = Number(score);
  let bg = "#E5E7EB", fg = "#6B7280";
  if (n < 0) { bg = "#FEE2E2"; fg = "#991B1B"; }
  else if (n >= 70) { bg = "#DCFCE7"; fg = "#166534"; }
  else if (n >= 60) { bg = "#F0FDF4"; fg = "#059669"; }
  else if (n >= 40) { bg = "#F3F4F6"; fg = "#4B5563"; }
  else if (n >= 30) { bg = "#FEF3C7"; fg = "#92400E"; }
  else if (n >= 20) { bg = "#FED7AA"; fg = "#C2410C"; }
  return { bg, fg, text: `★ ${n > 0 ? n : "—"}` };
}
const num = (x: any) => Math.round(Number(x) || 0);
const capitalize = (s: any) => { const t = String(s || ""); return t ? t.charAt(0).toUpperCase() + t.slice(1) : ""; };
function finiteScore(record: AdminRecord): number | null {
  const v = record.health_score;
  const n = Number(v);
  return v != null && Number.isFinite(n) ? n : null;
}
function nameOf(record: AdminRecord): string {
  return record.name_common || record.name || record.name_brand || record.product_name || record.title || "Untitled";
}
function pickImage(record: AdminRecord): string | null {
  if (record.image_url) return record.image_url;
  if (record.image) return record.image;
  if (Array.isArray(record.images) && record.images[0]) return typeof record.images[0] === "string" ? record.images[0] : record.images[0]?.url || null;
  if (typeof record.images === "string" && record.images) return record.images;
  if (record.avatar_url) return record.avatar_url;
  if (record.thumbnail) return record.thumbnail;
  return null;
}
function countryCodeToFlag(cc: any): string {
  if (!cc || typeof cc !== "string" || cc.length !== 2) return "";
  const A = 0x1f1e6, c = cc.toUpperCase();
  return String.fromCodePoint(A + (c.charCodeAt(0) - 65)) + String.fromCodePoint(A + (c.charCodeAt(1) - 65));
}
function collectNames(v: any): string[] {
  if (!v) return [];
  if (Array.isArray(v)) return v.map((x) => (typeof x === "string" ? x : x?.name || x?.element || "")).filter(Boolean);
  if (typeof v === "object") return Object.keys(v);
  return [];
}
function buildNutritionSubtitle(record: AdminRecord): string {
  const ben = collectNames(record.elements_beneficial).slice(0, 3);
  const hazCount = collectNames(record.elements_hazardous).length;
  const parts = [...ben];
  if (hazCount) parts.push(`${hazCount} risk${hazCount > 1 ? "s" : ""}`);
  return parts.join(" · ");
}
function asObj(v: any): any {
  if (!v) return null;
  if (typeof v === "string") { try { return JSON.parse(v); } catch { return null; } }
  return typeof v === "object" ? v : null;
}
interface Macro { Icon: any; color: string; text: string }
function macrosOf(record: AdminRecord): Macro[] {
  const n = asObj(record.nutrition_per_100g) || asObj(record.nutrition_per_serving) || asObj(record.nutritionalInfo) || asObj(record.nutrition);
  if (!n) return [];
  const g = (...keys: string[]) => { for (const k of keys) { const v = n[k]; if (v != null && !isNaN(Number(v))) return Number(v); } return null; };
  const cal = g("calories", "kcal", "energy");
  const pro = g("protein", "protein_g", "proteins");
  const carb = g("carbs", "carbohydrates", "carbs_g", "carbohydrate");
  const fat = g("fat", "fat_g", "fats", "total_fat");
  const out: Macro[] = [];
  if (cal != null) out.push({ Icon: Flame, color: "#2196F3", text: `${num(cal)} cal` });
  if (pro != null) out.push({ Icon: Beef, color: "#22C55E", text: `${num(pro)}g` });
  if (carb != null) out.push({ Icon: Wheat, color: "#F59E0B", text: `${num(carb)}g` });
  if (fat != null) out.push({ Icon: Salad, color: "#10B981", text: `${num(fat)}g` });
  return out;
}

const TYPE_ICON: Record<string, { Icon: any; fg: string; bg: string }> = {
  elements: { Icon: Atom, fg: "#7C3AED", bg: "#F3E8FF" },
  ingredients: { Icon: Leaf, fg: "#388E3C", bg: "#EBF5EB" },
  cooking_methods: { Icon: Flame, fg: "#E64A19", bg: "#FEF3EB" },
  recipes: { Icon: UtensilsCrossed, fg: "#388E3C", bg: "#EBF5EB" },
  products: { Icon: Package, fg: "#6B7280", bg: "#F3F4F6" },
  equipment: { Icon: Wrench, fg: "#475569", bg: "#F1F5F9" },
  activities: { Icon: Dumbbell, fg: "#D45B0A", bg: "#FEF3EB" },
  symptoms: { Icon: HeartPulse, fg: "#DC2626", bg: "#FEE2E2" },
  hs_tests: { Icon: FlaskConical, fg: "#0097A7", bg: "#E8F5F7" },
  hs_products: { Icon: Package, fg: "#6B7280", bg: "#F3F4F6" },
  hs_services: { Icon: Stethoscope, fg: "#2563EB", bg: "#EFF6FF" },
  hs_packages: { Icon: Gift, fg: "#9333EA", bg: "#F3E8FF" },
  hs_supplements: { Icon: Pill, fg: "#0097A7", bg: "#E8F5F7" },
  hs_experts: { Icon: User, fg: "#64748B", bg: "#EEF2F7" },
  scans: { Icon: Utensils, fg: "#6B7280", bg: "#F3F4F6" },
};

const clamp2: CSSProperties = { display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" };
const oneLine: CSSProperties = { whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" };

/* ───────── shared pieces ───────── */
function ScoreChip({ score }: { score: number }) {
  const s = getHealthScoreStyle(score);
  return <span style={{ padding: "3px 8px", borderRadius: 12, background: s.bg, color: s.fg, fontFamily: POPPINS, fontSize: 11, fontWeight: 600, whiteSpace: "nowrap", flexShrink: 0 }}>{s.text}</span>;
}

function BaseListCard({ image, desaturate, Placeholder, placeholderBg, placeholderFg, title, subtitle, description, score, showBookmark = true, macros = [] }: {
  image: string | null; desaturate?: boolean; Placeholder: any; placeholderBg: string; placeholderFg: string;
  title: ReactNode; subtitle?: string; description?: string; score: number | null; showBookmark?: boolean; macros?: Macro[];
}) {
  return (
    <div style={{ background: "#fff", borderRadius: 12, overflow: "hidden", display: "flex", alignItems: "center", marginBottom: 6, paddingRight: 12, boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
      <div style={{ width: 96, height: 96, marginRight: 12, background: image ? "#F3F4F6" : placeholderBg, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
        {image ? <img src={image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", opacity: desaturate ? 0.45 : 1 }} /> : <Placeholder size={32} strokeWidth={1.5} color={placeholderFg} />}
      </div>
      <div style={{ flex: 1, minWidth: 0, paddingTop: 8, paddingBottom: 8 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: POPPINS, fontSize: 15, fontWeight: 600, color: "#374151", lineHeight: "20px", ...clamp2 }}>{title}</div>
            {subtitle && <div style={{ fontFamily: POPPINS, fontSize: 12, color: "#6B7280", marginTop: 1, textTransform: "capitalize", ...oneLine }}>{subtitle}</div>}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
            {score != null && <ScoreChip score={score} />}
            {showBookmark && <Bookmark size={18} color="#9CA3AF" />}
          </div>
        </div>
        {description && <div style={{ fontFamily: POPPINS, fontSize: 13, color: "#1F2937", lineHeight: "18px", marginTop: 2, ...clamp2 }}>{description}</div>}
        {macros.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 6 }}>
            {macros.map((m, i) => (
              <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 2 }}>
                <m.Icon size={12} color={m.color} strokeWidth={2} />
                <span style={{ fontFamily: POPPINS, fontSize: 12, color: "#6B7280" }}>{m.text}</span>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

type LeafProps = { record: AdminRecord; tab?: string };

/* ───────── per-type leaf previews ───────── */
function CatalogCardPreview({ record, tab }: LeafProps) {
  const ti = TYPE_ICON[tab || ""] || { Icon: Package, fg: "#6B7280", bg: "#F3F4F6" };
  const flag = record.country_code ? countryCodeToFlag(record.country_code) + " " : "";
  const subtitle = capitalize(record.category || record.type || record.type_label || "");
  const description = buildNutritionSubtitle(record) || record.description || "";
  return <BaseListCard image={pickImage(record)} Placeholder={ti.Icon} placeholderBg={ti.bg} placeholderFg={ti.fg}
    title={flag + nameOf(record)} subtitle={subtitle} description={description} score={finiteScore(record)} />;
}

function ProductCardPreview({ record }: LeafProps) {
  const flag = record.country_code ? countryCodeToFlag(record.country_code) + " " : "";
  const subtitle = capitalize([record.brand || record.name_brand || record.manufacturer, record.region || record.country || record.origin].filter(Boolean).join(" • ") || record.category || "");
  const description = buildNutritionSubtitle(record) || record.description || "";
  return <BaseListCard image={pickImage(record)} desaturate Placeholder={Package} placeholderBg="#F3F4F6" placeholderFg="#6B7280"
    title={flag + nameOf(record)} subtitle={subtitle} description={description} score={finiteScore(record)} macros={macrosOf(record)} />;
}

function MealCardPreview({ record }: LeafProps) {
  const gd = asObj(record.ai_response)?.generated_data || asObj(record.ai_response) || {};
  const title = record.name || gd.title || "Scan";
  const subtitle = capitalize(record.category || gd.category || record.type || "Consumed");
  const n = asObj(record.nutrition_per_100g);
  const cals = n ? num(n.calories || n.kcal || 0) : 0;
  const prot = n ? num(n.protein || n.protein_g || 0) : 0;
  const description = cals ? `${cals} cal · ${prot}g protein` : subtitle;
  const gdScore = Number(gd.health_score);
  const score = finiteScore(record) ?? (Number.isFinite(gdScore) ? gdScore : null);
  const image = pickImage(record);
  return (
    <div style={{ background: "#fff", borderRadius: 12, padding: 10, marginBottom: 6, display: "flex", alignItems: "center", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
      <div style={{ width: 48, height: 48, borderRadius: 10, marginRight: 10, border: "1px solid #E5E7EB", overflow: "hidden", background: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        {image ? <img src={image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <Utensils size={22} color="#6B7280" strokeWidth={1.5} />}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
          <span style={{ fontFamily: POPPINS, fontSize: 14, fontWeight: 600, color: "#374151", ...oneLine }}>{title}</span>
          {score != null && <ScoreChip score={score} />}
        </div>
        <div style={{ fontFamily: POPPINS, fontSize: 12, color: "#6B7280", marginTop: 1, textTransform: "capitalize", ...oneLine }}>{subtitle}</div>
        <div style={{ fontFamily: POPPINS, fontSize: 12, color: "#1F2937", marginTop: 1, ...oneLine }}>{description}</div>
      </div>
    </div>
  );
}

function SupplyRowPreview({ record }: LeafProps) {
  const image = pickImage(record);
  const meta = [record.brand, [record.dose || record.quantity, record.unit].filter(Boolean).join(" ").trim(), "Supplement", record.element_key].filter(Boolean);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#fff", borderRadius: 14, padding: 12, marginBottom: 8, border: "1px solid #F3F4F6" }}>
      <span style={{ width: 38, height: 38, borderRadius: 10, flexShrink: 0, display: "inline-flex", alignItems: "center", justifyContent: "center", background: image ? "#F3F4F6" : "rgba(0,151,167,0.09)", overflow: "hidden" }}>
        {image ? <img src={image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <Pill size={18} color="#0097A7" strokeWidth={2} />}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: POPPINS, fontSize: 14, fontWeight: 500, color: "#111827", ...oneLine }}>{nameOf(record)}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 2, flexWrap: "wrap" }}>
          {meta.map((m, i) => (
            <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
              {i > 0 && <span style={{ color: "#D1D5DB", fontSize: 11 }}>·</span>}
              <span style={{ fontFamily: POPPINS, fontSize: 11, fontWeight: i === 0 ? 600 : 400, color: i === 0 ? "#15803D" : "#6B7280" }}>{m}</span>
            </span>
          ))}
        </div>
      </div>
      <MoreVertical size={18} color="#6B7280" style={{ flexShrink: 0 }} />
    </div>
  );
}

function ExpertCardPreview({ record }: LeafProps) {
  const image = pickImage(record);
  const subtitle = [record.title, record.specialty || record.category].filter(Boolean).join(" · ");
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, background: "#fff", borderRadius: 12, padding: 12, marginBottom: 6, boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
      <span style={{ width: 48, height: 48, borderRadius: 24, flexShrink: 0, overflow: "hidden", background: "#EEF2F7", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
        {image ? <img src={image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <User size={22} color="#64748B" strokeWidth={1.6} />}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: POPPINS, fontSize: 14, fontWeight: 600, color: "#374151", ...oneLine }}>{record.name || "Unnamed"}</div>
        {subtitle && <div style={{ fontFamily: POPPINS, fontSize: 12, color: "#6B7280", marginTop: 1, ...oneLine }}>{subtitle}</div>}
        {record.bio && <div style={{ fontFamily: POPPINS, fontSize: 12, color: "#1F2937", marginTop: 4, ...clamp2 }}>{record.bio}</div>}
      </div>
    </div>
  );
}

function NoPreview({ label }: { label: string }) {
  return <div style={{ padding: "52px 22px", textAlign: "center", color: "#9CA3AF", fontFamily: POPPINS, fontSize: 12, lineHeight: 1.5 }}>{label}</div>;
}

/* ───────── phone list-screen chrome ───────── */
function ListScreenShell({ tabLabel, children }: { tabLabel: string; children: ReactNode }) {
  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", fontFamily: POPPINS, background: "#FBFBFA" }}>
      <div style={{ padding: "15px 20px 0", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11, fontWeight: 600, color: "#111827", flexShrink: 0 }}>
        <span style={{ fontVariantNumeric: "tabular-nums" }}>9:41</span>
        <span style={{ letterSpacing: "0.18em", fontSize: 9, color: "#9CA3AF", textTransform: "uppercase" }}>{tabLabel}</span>
      </div>
      <div style={{ padding: "10px 16px 6px", flexShrink: 0 }}>
        <div style={{ fontFamily: POPPINS, fontSize: 22, fontWeight: 700, color: "#111827", letterSpacing: -0.5 }}>{tabLabel}</div>
      </div>
      <div className="phone-scroll" style={{ flex: 1, overflowY: "auto", padding: "4px 14px 20px" }}>{children}</div>
    </div>
  );
}

/* ───────── dispatcher ───────── */
const PREVIEW_BY_TAB: Record<string, (p: LeafProps) => ReactNode> = {
  products: ProductCardPreview,
  hs_products: ProductCardPreview,
  scans: MealCardPreview,
  hs_supplements: SupplyRowPreview,
  hs_experts: ExpertCardPreview,
};
const TAB_LABEL: Record<string, string> = {
  elements: "Elements", ingredients: "Ingredients", cooking_methods: "Cooking", recipes: "Recipes",
  products: "Products", equipment: "Equipment", activities: "Activities", symptoms: "Symptoms",
  hs_tests: "Tests", hs_supplements: "Supplies", hs_products: "Products", hs_services: "Services",
  hs_experts: "Experts", hs_packages: "Packages", scans: "Scans",
};

export function RecordPreview({ activeTab, record, width = 270 }: { activeTab: string; record: AdminRecord | null | undefined; width?: number }) {
  if (!record) return null;
  if (activeTab === "protocols")
    return <PhoneFrame width={width} screenBg="#FBFBFA"><ListScreenShell tabLabel="Routine"><NoPreview label="Protocol preview is in the routine editor below." /></ListScreenShell></PhoneFrame>;
  if (activeTab === "waitlist")
    return <PhoneFrame width={width} screenBg="#FBFBFA"><ListScreenShell tabLabel="Waitlist"><NoPreview label="Waitlist users don't appear in the mobile app." /></ListScreenShell></PhoneFrame>;
  const Card = PREVIEW_BY_TAB[activeTab] || CatalogCardPreview;
  const label = TAB_LABEL[activeTab] || capitalize((activeTab || "").replace(/^hs_/, "").replace(/_/g, " "));
  return (
    <PhoneFrame width={width} screenBg="#FBFBFA">
      <ListScreenShell tabLabel={label}>
        <Card record={record} tab={activeTab} />
      </ListScreenShell>
    </PhoneFrame>
  );
}
