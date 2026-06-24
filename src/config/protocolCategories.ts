/*
 * Protocol item grouping — ported from the mobile repo's single source of truth
 * (src/utils/protocolItemCategory.ts + design-system/tokens/categoryTints.ts).
 * Items bucket into Supplements / Consume / Do / Sleep with the SAME tints,
 * labels, icons, item-keyword icons, and fixed group order as the app.
 */
import {
  Pill,
  Utensils,
  Dumbbell,
  Moon,
  Coffee,
  Flame,
  Droplets,
  BookOpen,
  Wind,
  Heart,
  Lightbulb,
  Zap,
  Activity,
  Sparkles,
} from "lucide-react";

import { isSleepItemByName } from "../protocolDomain/category";

export type CatKey = "supplements" | "consume" | "do" | "sleep";

export const CATEGORY_TINTS: Record<CatKey, { fg: string; bg: string; label: string; Icon: any }> = {
  supplements: { fg: "#0097A7", bg: "#E8F5F7", label: "Supplements", Icon: Pill },
  consume: { fg: "#388E3C", bg: "#EBF5EB", label: "Consume", Icon: Utensils },
  do: { fg: "#D45B0A", bg: "#FEF3EB", label: "Do", Icon: Dumbbell },
  sleep: { fg: "#5C6B7A", bg: "#F2F2F4", label: "Sleep", Icon: Moon },
};

// Fixed display order, exactly like ProtocolGroupBody.buildGroups.
export const CATEGORY_ORDER: CatKey[] = ["supplements", "consume", "do", "sleep"];

export interface ProtocolItem {
  name: string;
  item_type: "supplement" | "consume" | "activity";
  meta?: string;
  image_url?: string;   // linked recipe / catalog image (shown on meal cards)
  group_name?: string;  // meal-slot grouping (Breakfast, Lunch, Snack, …)
}

/** Canonical category for an item — mirrors mobile categorizeProtocolItem precedence. */
export function categorize(item: ProtocolItem): CatKey {
  if (isSleepItemByName(item.name)) return "sleep";
  if (item.item_type === "supplement") return "supplements";
  if (item.item_type === "consume") return "consume";
  return "do";
}

/** Per-item keyword icon, mirroring mobile ProtocolGroupBody.itemIconConfig. */
export function itemIcon(item: ProtocolItem): { Icon: any; color: string } {
  const t = item.item_type;
  const n = item.name.toLowerCase();
  if (t === "supplement") return { Icon: Pill, color: "#00897B" };
  if (t === "consume") {
    if (/coffee|tea|latte|matcha|drink|shake|smoothie|collagen|ag1|electrolyte|water/.test(n)) return { Icon: Coffee, color: "#795548" };
    return { Icon: Utensils, color: "#388E3C" };
  }
  if (/cleanse|serum|moisturi|cream|\bmask\b|toner|essence|exfoliant|spf|sunscreen|gua sha|setting mist|mucin|skincare|\bskin\b|eye cream/.test(n)) return { Icon: Sparkles, color: "#D8638E" };
  if (/sauna|steam|heat/.test(n)) return { Icon: Flame, color: "#E64A19" };
  if (/cold|shower|plunge|ice|cryo|contrast|splash/.test(n)) return { Icon: Droplets, color: "#039BE5" };
  if (/sleep|bed|wind.?down|lights.?out/.test(n)) return { Icon: Moon, color: "#5C6BC0" };
  if (/journal|write|reflect|gratitude|book|read/.test(n)) return { Icon: BookOpen, color: "#6D4C41" };
  if (/meditat|mindful|breath|pranayama|yoga/.test(n)) return { Icon: Wind, color: "#26A69A" };
  if (/connect|call|family|friend|social/.test(n)) return { Icon: Heart, color: "#E91E63" };
  if (/light|sun|photob|infrared|red.?light/.test(n)) return { Icon: Lightbulb, color: "#FFA000" };
  if (/wake|rise|alarm/.test(n)) return { Icon: Zap, color: "#F59E0B" };
  if (/run|jog|sprint|treadmill|cardio|walk|hike|steps|stretch/.test(n)) return { Icon: Activity, color: "#43A047" };
  return { Icon: Dumbbell, color: "#D45B0A" };
}

/** Group items into the fixed-order category buckets (drops empty groups). */
export function buildGroups(items: ProtocolItem[]): { cat: CatKey; items: ProtocolItem[] }[] {
  const map = new Map<CatKey, ProtocolItem[]>();
  for (const it of items) {
    const c = categorize(it);
    if (!map.has(c)) map.set(c, []);
    map.get(c)!.push(it);
  }
  return CATEGORY_ORDER.filter((c) => map.has(c)).map((c) => ({ cat: c, items: map.get(c)! }));
}
