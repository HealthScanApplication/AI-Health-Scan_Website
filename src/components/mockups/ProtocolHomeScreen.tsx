/*
 * ProtocolHomeScreen — a pixel-faithful web replica of the ROUTINE³ iOS app's
 * protocol HOME screen (the "YOUR ROUTINE" day view). Reverse-engineered from
 * the mobile repo (ActiveProtocolCard / ProtocolGroupBody / WeekCalendarStrip /
 * categoryTints) so the marketing phone mock and the admin preview are identical
 * to each other and to the app.
 *
 * Fed a protocol name + a flat list of items, it runs the app's TWO-LEVEL
 * grouping: (1) part-of-day section (Morning/Afternoon/Evening) then (2) the
 * "TIME · TYPE" bands (category-tinted cards). Tints/icons come from the shared
 * src/config/protocolCategories.ts — the single source of truth.
 *
 * No-JIT: every style is inline (the site ships prebuilt static CSS).
 */
import { useState } from "react";
import {
  User, BarChart, TrendingUp, ShoppingBasket,
  ListChecks, BookOpen, Plus, Repeat, Check, Eye, EyeOff,
} from "lucide-react";
import {
  CATEGORY_TINTS, itemIcon, type CatKey, type ProtocolItem as CatItem,
} from "../../config/protocolCategories";
import { computeSleepWindow } from "../../utils/sleepWindow";
import { getItemTod, parseHM, type SimpleTod } from "../../protocolDomain/timeOfDay";
import { mealSlotName } from "../../protocolDomain/mealSlot";
import { isSleepItemByName } from "../../protocolDomain/category";

const POPPINS = 'Poppins, "Archivo", system-ui, -apple-system, sans-serif';

export interface HomeItem {
  display_name: string;
  item_type?: string;            // supplement | consume | recipe | activity | product | ingredient
  kind?: string | null;
  scope?: string | null;         // consume | supplement | inside | outside | None
  time?: string | null;          // 'HH:MM' or 'HH:MM:SS'
  duration_minutes?: number | null;
  group_name?: string | null;
  image_url?: string | null;
  repeat?: boolean;
  description?: string | null;
  done?: boolean;                // checked off for the day
  children?: string[];           // sub-item descriptions, shown as a faded checklist (like the app)
}

/* ───────── time + category helpers (mirror mobile precedence) ───────── */
function fmtTime(t?: string | null): string {
  const hm = parseHM(t);
  if (!hm) return "";
  const h12 = ((hm.h + 11) % 12) + 1;
  const ampm = hm.h < 12 ? "am" : "pm";
  return `${h12}:${String(hm.m).padStart(2, "0")}${ampm}`;
}
function categorizeFull(it: HomeItem): CatKey {
  if (isSleepItemByName(it.display_name)) return "sleep";
  if (it.item_type === "supplement") return "supplements";
  if (it.item_type === "consume" || it.item_type === "recipe") return "consume";
  if (it.scope === "consume") return "consume";
  if (it.scope === "supplement") return "supplements";
  return "do";
}
const CAT_TITLE: Record<CatKey, string> = { supplements: "Supplements", consume: "Consume", do: "Do", sleep: "Sleep" };

// shim for the shared itemIcon (expects the simplified item shape)
function iconFor(it: HomeItem) {
  const t: CatItem["item_type"] =
    it.item_type === "supplement" ? "supplement"
      : (it.item_type === "consume" || it.item_type === "recipe" || it.scope === "consume") ? "consume"
        : "activity";
  return itemIcon({ name: it.display_name || "", item_type: t });
}

const mealSlot = (group?: string | null): string | null => mealSlotName(group);
// Day-anchor detection, mirroring the app (ProtocolWidget):
// "End Sleep"/Wake book-ends the morning; the terminal sleep/bed action ends the day.
const WAKE_RE = /^(end[\s-]?sleep|wake([\s-]?up)?|morning[\s-]?wake)$/i;
function isWake(it: HomeItem): boolean {
  return WAKE_RE.test((it.display_name || "").trim());
}
function isBed(it: HomeItem): boolean {
  const n = (it.display_name || "").trim();
  if (/^(start[\s-]?sleep|bed(time)?|lights[\s-]?out)$/i.test(n)) return true;
  if (/(prep|prepare|wind[\s-]?down|reflection)/i.test(n)) return false; // prep steps don't count
  return /\b(sleep|bed)\b/i.test(n);
}
// Virtual sleep anchors float to the very top (-1) / bottom (1e9) of the day.
function orderKey(it: HomeItem): number {
  if (isWake(it)) return -1;
  if (isBed(it)) return 1e9;
  return parseHM(it.time)?.mins ?? 5e8;
}
// Book-end any day with grey Sleep anchors when the protocol doesn't supply them.
// The WAKE default links to the protocol's own first timed step (so a 7am routine
// wakes at 7am, not a fixed 6am). Bedtime stays a real 10pm default — the last
// step is usually an evening activity, not actual bedtime.
function withSleepAnchors(items: HomeItem[]): HomeItem[] {
  const hasEnd = items.some(isWake);
  const hasStart = items.some(isBed);
  const mins = items.map((i) => parseHM(i.time)?.mins).filter((m): m is number => m != null).sort((a, b) => a - b);
  const toHM = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
  const wakeTime = mins.length ? toHM(mins[0]) : "06:00";
  return [
    ...(hasEnd ? [] : [{ display_name: "End Sleep", item_type: "activity", time: wakeTime } as HomeItem]),
    ...items,
    ...(hasStart ? [] : [{ display_name: "Start Sleep", item_type: "activity", time: "22:00" } as HomeItem]),
  ];
}

type Tod = SimpleTod;
const todForItem = (it: HomeItem, wakeHour: number): Tod =>
  getItemTod({ group_name: it.group_name, scheduled_time: it.time }, wakeHour);

interface Band { cat: CatKey; slot: string | null; firstMin: number | null; order: number; time?: string | null; label: string; items: HomeItem[] }
function buildBands(list: HomeItem[]): Band[] {
  const sorted = [...list].sort((a, b) => orderKey(a) - orderKey(b));
  const bands: Band[] = [];
  for (const it of sorted) {
    const cat = categorizeFull(it);
    const slot = mealSlot(it.group_name);
    const m = parseHM(it.time)?.mins ?? null;
    const last = bands[bands.length - 1];
    const canMerge = !!last && !last.slot && !slot && last.cat === cat &&
      m != null && last.firstMin != null && m - last.firstMin <= 60;
    if (canMerge) last.items.push(it);
    else bands.push({ cat, slot, firstMin: m, order: orderKey(it), time: it.time, label: "", items: [it] });
  }
  bands.sort((a, b) => a.order - b.order);
  for (const b of bands) {
    b.items.sort((x, y) => orderKey(x) - orderKey(y));
    b.label = b.slot
      ? b.slot.toUpperCase()
      : (b.time ? `${fmtTime(b.time)} · ${CAT_TITLE[b.cat]}` : CAT_TITLE[b.cat]).toUpperCase();
  }
  return bands;
}

/* ───────── date helpers for header + week strip ───────── */
const WD = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const MON = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
function isoWeek(d: Date): number {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() - dayNum + 3);
  const firstThu = new Date(Date.UTC(date.getUTCFullYear(), 0, 4));
  return 1 + Math.round((date.getTime() - firstThu.getTime()) / (7 * 24 * 3600 * 1000));
}
function sameDay(a: Date, b: Date) { return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate(); }

/* ───────── the screen ───────── */
export function ProtocolHomeScreen({
  protocolName,
  items,
  date = new Date(),
  done = 0,
  scale = 0.85,
  anchors = true,
  imageUrl = null,
  showDetails: showDetailsProp = true,
}: {
  protocolName: string;
  items: HomeItem[];
  date?: Date;
  done?: number;
  /** Protocol cover image, shown as the header avatar. */
  imageUrl?: string | null;
  /** Shrink the whole app UI to fit the device frame more naturally (1 = real-phone size). */
  scale?: number;
  /** Book-end the day with the grey Sleep anchors (off for a clean checked-off demo). */
  anchors?: boolean;
  /** Initial state of the in-frame "Details" toggle (each step's description + child checklist). */
  showDetails?: boolean;
}) {
  // In-frame toggle for per-step descriptions + child do/don't lines (mirrors the app's showDetails).
  const [showDetails, setShowDetails] = useState(showDetailsProp);
  // book-end the day with grey Sleep anchors (End Sleep / Start Sleep), like the app
  const allItems = anchors ? withSleepAnchors(items) : items;
  // sleep window (hours slept = bedtime → wake) — shown on the anchor cards
  const sleepWin = computeSleepWindow(allItems.map((i) => ({ display_name: i.display_name, scheduled_time: i.time ?? null, category: null })));

  // wake hour = End Sleep / Wake item's hour, clamped 0..11, else 5
  let wakeHour = 5;
  for (const it of allItems) {
    if (isWake(it)) {
      const hm = parseHM(it.time);
      if (hm) { wakeHour = Math.min(11, Math.max(0, hm.h)); break; }
    }
  }

  const todOrder: Tod[] = ["Morning", "Afternoon", "Evening"];
  const byTod: Record<Tod, HomeItem[]> = { Morning: [], Afternoon: [], Evening: [] };
  for (const it of allItems) byTod[todForItem(it, wakeHour)].push(it);
  const sections = todOrder
    .map((tod) => ({ tod, bands: buildBands(byTod[tod]) }))
    .filter((s) => s.bands.length);

  // week strip: Mon–Sun containing `date`, with `date` selected
  const dow = (date.getDay() + 6) % 7;
  const monday = new Date(date); monday.setDate(date.getDate() - dow);
  const week = Array.from({ length: 7 }, (_, i) => { const d = new Date(monday); d.setDate(monday.getDate() + i); return d; });
  const today = new Date();

  const weekLine = `WEEK ${isoWeek(date)}  ·  ${WD[date.getDay()]} ${MON[date.getMonth()]} ${date.getDate()}`;
  const sectionDate = `${WD[date.getDay()]}, ${MON[date.getMonth()]} ${date.getDate()}`;
  const total = allItems.length;
  const doneCount = allItems.filter((i) => i.done).length || done;

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", background: "#FFFFFF" }}>
    <div style={{ position: "absolute", top: 0, left: 0, width: `${100 / scale}%`, height: `${100 / scale}%`, transform: `scale(${scale})`, transformOrigin: "top left", display: "flex", flexDirection: "column", fontFamily: POPPINS, color: "#111827", overflow: "hidden" }}>
      {/* status bar */}
      <div style={{ padding: "13px 22px 2px", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: "#111827", fontVariantNumeric: "tabular-nums", letterSpacing: 0.2 }}>9:41</span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 9, fontWeight: 700, color: "#111827" }}>
          <span style={{ letterSpacing: 0.5 }}>LTE</span>
          <span style={{ display: "inline-block", width: 22, height: 11, borderRadius: 3, border: "1px solid #111827", position: "relative", padding: 1.5 }}>
            <span style={{ display: "block", width: "78%", height: "100%", background: "#34C759", borderRadius: 1 }} />
          </span>
        </span>
      </div>

      {/* scrollable app canvas */}
      <div className="phone-scroll" style={{ flex: 1, overflowY: "auto", padding: "6px 0 96px", display: "flex", flexDirection: "column" }}>
        {/* HEADER */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", minHeight: 40, padding: "0 16px", marginBottom: 6 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 1, minWidth: 0 }}>
            <span style={{ width: 24, height: 24, borderRadius: 12, background: "#E5E7EB", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden" }}>
              {imageUrl
                ? <img src={imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : <User size={13} color="#4B5563" strokeWidth={1.5} />}
            </span>
            <div style={{ display: "flex", flexDirection: "column", gap: 1, alignItems: "flex-start", minWidth: 0 }}>
              <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1.2, color: "#374151", whiteSpace: "nowrap" }}>{weekLine}</span>
              <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: 1.2, color: "#9CA3AF", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{(protocolName || "Your routine").toUpperCase()}</span>
            </div>
          </div>
          <button type="button" onClick={() => setShowDetails((v) => !v)} title={showDetails ? "Hide step details" : "Show step details"}
            style={{ display: "inline-flex", alignItems: "center", gap: 4, flexShrink: 0, padding: "4px 9px", borderRadius: 999, border: "1px solid #E5E7EB", background: "#FFFFFF", cursor: "pointer", fontSize: 10, fontWeight: 600, letterSpacing: 0.3, color: "#6B7280", lineHeight: 1 }}>
            {showDetails ? <EyeOff size={11} strokeWidth={2} /> : <Eye size={11} strokeWidth={2} />}
            {showDetails ? "Hide" : "Details"}
          </button>
        </div>

        {/* WEEK STRIP */}
        <div style={{ display: "flex", justifyContent: "center", padding: "2px 6px 10px" }}>
          {week.map((d, i) => {
            const isToday = sameDay(d, today);
            const isSelected = sameDay(d, date);
            const circleBg = isToday ? "#1F2937" : isSelected ? "#3D3D3D" : "transparent";
            const filled = isToday || isSelected;
            return (
              <div key={i} style={{ width: 44, display: "flex", flexDirection: "column", alignItems: "center", padding: "4px 0" }}>
                <span style={{ fontSize: 10, fontWeight: filled ? 600 : 500, letterSpacing: 0.6, textTransform: "uppercase", color: filled ? "#3D3D3D" : "#6B7280", marginBottom: 4 }}>{WD[d.getDay()]}</span>
                <span style={{ width: 32, height: 32, borderRadius: 16, background: circleBg, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: 14, fontWeight: filled ? 600 : 500, color: filled ? "#FFFFFF" : "#374151", fontVariantNumeric: "tabular-nums" }}>{d.getDate()}</span>
                </span>
              </div>
            );
          })}
        </div>

        {/* SECTIONS */}
        {sections.length === 0 && (
          <div style={{ textAlign: "center", color: "#9CA3AF", fontSize: 12, padding: "48px 0" }}>No steps scheduled</div>
        )}
        {sections.map(({ tod, bands }) => (
          <div key={tod}>
            <div style={{ padding: "6px 16px 4px 20px", minHeight: 22, display: "flex", alignItems: "baseline" }}>
              <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1.2, color: "#374151", textTransform: "uppercase" }}>{tod}</span>
              <span style={{ fontSize: 11, fontWeight: 500, letterSpacing: 0.8, color: "#9CA3AF" }}>{"   ·   " + sectionDate}</span>
            </div>

            {bands.map((band, bi) => {
              const tint = CATEGORY_TINTS[band.cat];
              const GroupIcon = tint.Icon;
              return (
                <div key={bi} style={{ padding: "0 16px 8px 8px" }}>
                  <div style={{ borderRadius: 14, paddingBottom: 10, background: tint.bg }}>
                    {/* band header */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                        <GroupIcon size={12} strokeWidth={2} color={tint.fg} />
                        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.8, color: tint.fg }}>{band.label}</span>
                      </span>
                    </div>
                    {/* items */}
                    <div style={{ padding: "0 8px 2px", display: "flex", flexDirection: "column", gap: 6 }}>
                      {band.items.map((it, ii) => {
                        const ic = iconFor(it);
                        const ItemIcon = ic.Icon;
                        const isDone = !!it.done;
                        const sleepExtra = sleepWin.durationLabel && isWake(it) ? `${sleepWin.durationLabel} sleep`
                          : sleepWin.durationLabel && isBed(it) ? `${sleepWin.durationLabel} until wake` : null;
                        const sub = [fmtTime(it.time), it.group_name, sleepExtra, it.duration_minutes ? `${it.duration_minutes} min` : null].filter(Boolean).join(" · ");
                        return (
                          <div key={ii} style={{ display: "flex", alignItems: "center", gap: 10, background: "#FFFFFF", borderRadius: 12, padding: "8px 10px", boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}>
                            {it.image_url ? (
                              <img src={it.image_url} alt="" style={{ width: 36, height: 36, borderRadius: 8, objectFit: "cover", background: "#F3F4F6", flexShrink: 0, opacity: isDone ? 0.5 : 1 }} />
                            ) : (
                              <span style={{ width: 36, height: 36, borderRadius: 8, background: tint.bg, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0, opacity: isDone ? 0.5 : 1 }}>
                                <ItemIcon size={18} strokeWidth={1.8} color={ic.color} />
                              </span>
                            )}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 5, minWidth: 0 }}>
                                <span style={{ fontSize: 14, fontWeight: 500, color: isDone ? "#9CA3AF" : tint.fg, textDecoration: isDone ? "line-through" : "none", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{it.display_name}</span>
                                {it.repeat && <Repeat size={11} color={tint.fg} strokeWidth={2} style={{ flexShrink: 0 }} />}
                              </div>
                              {sub && <div style={{ fontSize: 11, fontWeight: 400, color: isDone ? "#C4C4C0" : "#9CA3AF", textDecoration: isDone ? "line-through" : "none", marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{sub}</div>}
                              {showDetails && it.description && <div style={{ fontSize: 11, lineHeight: 1.4, color: tint.fg, marginTop: 4, opacity: 0.92 }}>{it.description}</div>}
                              {showDetails && it.children && it.children.length > 0 && (
                                <div style={{ marginTop: 5, display: "flex", flexDirection: "column", gap: 4 }}>
                                  {it.children.map((c, ci) => (
                                    <div key={ci} style={{ display: "flex", alignItems: "flex-start", gap: 6, minWidth: 0 }}>
                                      <span style={{ width: 4, height: 4, borderRadius: 2, background: "#C4C4C0", flexShrink: 0, marginTop: 5 }} />
                                      <span style={{ fontSize: 10.5, color: "#9CA3AF", lineHeight: 1.35 }}>{c}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                            <span style={{ width: 22, height: 22, borderRadius: 7, flexShrink: 0, display: "inline-flex", alignItems: "center", justifyContent: "center", background: isDone ? "#22C55E" : "#FFFFFF", border: isDone ? "1px solid #22C55E" : "1.5px solid #D1D5DB" }}>
                              {isDone && <Check size={13} color="#FFFFFF" strokeWidth={3} />}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}

        {/* FOOTER goals card */}
        <div style={{ margin: "10px 16px 0", background: "#FFFFFF", borderRadius: 12, padding: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
          <div style={{ height: 4, borderRadius: 2, background: "#E5E7EB", marginBottom: 10 }}>
            <div style={{ height: "100%", borderRadius: 2, background: "#059669", width: `${total ? Math.min(100, Math.max(0, (doneCount / total) * 100)) : 0}%` }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: 0.5, textTransform: "uppercase", color: "#6B7280" }}>DAILY GOALS ▾</span>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <span style={{ fontSize: 42, fontWeight: 600, letterSpacing: -1.5, lineHeight: "46px" }}>
              <span style={{ color: "#000000" }}>{doneCount}</span>
              <span style={{ color: "#C7CBD1" }}>/{total}</span>
            </span>
          </div>
          <div style={{ marginTop: -2 }}>
            <span style={{ fontFamily: '"DM Sans", ' + POPPINS, fontSize: 11, fontWeight: 500, color: "#6B7280" }}>Protocol Progress</span>
          </div>
          <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 8, marginBottom: 2 }}>
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <span key={i} style={{ width: 6, height: 6, borderRadius: 3, background: "transparent", border: i === 0 ? "1.5px solid #111827" : "1px solid #9CA3AF" }} />
            ))}
          </div>
        </div>
      </div>

      {/* floating TAB BAR */}
      <div style={{ position: "absolute", left: 12, right: 12, bottom: 12, display: "flex", alignItems: "center", borderRadius: 56, background: "rgba(255,255,255,0.94)", border: "1px solid rgba(0,0,0,0.06)", boxShadow: "0 -4px 20px rgba(0,0,0,0.08)", padding: "8px 4px", backdropFilter: "blur(8px)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 2, flex: 1, justifyContent: "space-around" }}>
          {[
            { I: BarChart, label: "Home", active: true },
            { I: TrendingUp, label: "Stats", active: false },
            { I: ShoppingBasket, label: "Supplies", active: false },
            { I: ListChecks, label: "Protocol", active: false },
            { I: BookOpen, label: "Recipe", active: false },
          ].map(({ I, label, active }) => (
            <div key={label} style={{ width: 48, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <span style={{ width: 38, height: 30, borderRadius: 28, display: "inline-flex", alignItems: "center", justifyContent: "center", background: active ? "rgba(0,0,0,0.06)" : "transparent" }}>
                <I size={20} strokeWidth={active ? 2 : 1} color={active ? "#000000" : "#4B5563"} />
              </span>
              <span style={{ fontSize: 9, fontWeight: 400, marginTop: 2, color: active ? "#000000" : "#4B5563" }}>{label}</span>
            </div>
          ))}
        </div>
        <span style={{ width: 48, height: 48, borderRadius: 24, background: "#000000", display: "inline-flex", alignItems: "center", justifyContent: "center", marginLeft: 4, flexShrink: 0, boxShadow: "0 4px 6px rgba(0,0,0,0.25)" }}>
          <Plus size={24} strokeWidth={1.6} color="#FFFFFF" />
        </span>
      </div>
    </div>
    </div>
  );
}
