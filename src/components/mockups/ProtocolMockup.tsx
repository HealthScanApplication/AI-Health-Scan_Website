import { GRO } from "../../config/editorialTheme";
import { PhoneFrame } from "./PhoneFrame";
import { CATEGORY_TINTS, itemIcon, type CatKey, type ProtocolItem } from "../../config/protocolCategories";
import { Check, Flame } from "lucide-react";

/* Faithful recreation of the ROUTINE³ "today's routine" completion screen.
   App-true: progress fill #10B981 on #F3F4F6 track, "3 / 5" counter,
   category-tinted icon tiles, completed rows strike-through + faded. */

const sans = GRO;

const ITEM_TYPE: Record<CatKey, ProtocolItem["item_type"]> = {
  supplements: "supplement",
  consume: "consume",
  do: "activity",
  sleep: "activity",
};

interface Row {
  time: string;
  name: string;
  cat: CatKey;
  meta: string;
  done: boolean;
}

const ROWS: Row[] = [
  { time: "06:30", name: "Vitamin D3", cat: "supplements", meta: "4000 IU", done: true },
  { time: "07:00", name: "Green tea", cat: "consume", meta: "Breakfast", done: true },
  { time: "07:30", name: "Morning sunlight", cat: "do", meta: "10 min", done: true },
  { time: "12:30", name: "High-protein lunch", cat: "consume", meta: "Lunch", done: false },
  { time: "18:00", name: "Strength session", cat: "do", meta: "30 min", done: false },
];

function ItemRow({ row }: { row: Row }) {
  const tint = CATEGORY_TINTS[row.cat];
  const { Icon, color } = itemIcon({ name: row.name, item_type: ITEM_TYPE[row.cat] });
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "7px 9px", borderRadius: 10, background: row.done ? "#F9FAFB" : "#fff", border: "1px solid #F0F0EE", opacity: row.done ? 0.92 : 1 }}>
      <span style={{ fontSize: 10.5, color: "#9CA3AF", width: 32, flexShrink: 0, fontVariantNumeric: "tabular-nums", textDecoration: row.done ? "line-through" : "none" }}>{row.time}</span>

      {/* checkbox */}
      <span
        style={{
          width: 20,
          height: 20,
          borderRadius: 6,
          flexShrink: 0,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          background: row.done ? "#10B981" : "#fff",
          border: row.done ? "1px solid #10B981" : "2px solid #D1D5DB",
        }}
      >
        {row.done && <Check size={12} strokeWidth={3} color="#fff" />}
      </span>

      {/* tinted icon tile */}
      <span style={{ width: 30, height: 30, borderRadius: 8, flexShrink: 0, background: tint.bg, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
        <Icon size={15} color={color} strokeWidth={1.9} />
      </span>

      {/* name + meta */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12.5, fontWeight: 600, color: row.done ? "#9CA3AF" : "#1F2937", lineHeight: 1.2, textDecoration: row.done ? "line-through" : "none", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{row.name}</div>
        <div style={{ fontSize: 9.5, color: "#9CA3AF", marginTop: 1, letterSpacing: "0.02em" }}>{tint.label} · {row.meta}</div>
      </div>
    </div>
  );
}

export function ProtocolMockup({ width }: { width?: number }) {
  const done = ROWS.filter((r) => r.done).length;
  const pct = Math.round((done / ROWS.length) * 100);
  return (
    <PhoneFrame width={width} screenBg="#FFFFFF">
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", fontFamily: sans, background: "#FBFBFA" }}>
        {/* status bar */}
        <div style={{ padding: "15px 22px 0", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11, fontWeight: 600, color: "#111827" }}>
          <span style={{ fontVariantNumeric: "tabular-nums" }}>9:41</span>
          <span style={{ letterSpacing: "0.18em", fontSize: 9, color: "#9CA3AF" }}>TODAY</span>
        </div>

        {/* header card */}
        <div style={{ margin: "16px 14px 0", background: "#fff", border: "1px solid #F0F0EE", borderRadius: 16, padding: "14px 15px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#111827", lineHeight: 1.1 }}>Weight-loss routine</div>
              <div style={{ fontSize: 10.5, color: "#9CA3AF", marginTop: 3, letterSpacing: "0.04em" }}>Mon 20 Jun</div>
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 1, color: "#111827", fontVariantNumeric: "tabular-nums" }}>
              <span style={{ fontSize: 22, fontWeight: 700, lineHeight: 1 }}>{done}</span>
              <span style={{ fontSize: 13, color: "#9CA3AF" }}>/{ROWS.length}</span>
            </div>
          </div>
          {/* progress bar */}
          <div style={{ height: 5, borderRadius: 3, background: "#F3F4F6", marginTop: 12, overflow: "hidden" }}>
            <div style={{ width: `${pct}%`, height: "100%", background: "#10B981", borderRadius: 3 }} />
          </div>
        </div>

        {/* items */}
        <div style={{ flex: 1, overflow: "hidden", padding: "12px 14px 0", display: "flex", flexDirection: "column", gap: 6 }}>
          {ROWS.map((r) => (
            <ItemRow key={r.name} row={r} />
          ))}
        </div>

        {/* streak footer */}
        <div style={{ padding: "10px 14px 16px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "#FEF3EB", color: "#D45B0A", fontSize: 11, fontWeight: 600, padding: "7px 12px", borderRadius: 999 }}>
            <Flame size={13} color="#D45B0A" strokeWidth={2} /> 12-day streak — keep it going
          </div>
        </div>
      </div>
    </PhoneFrame>
  );
}
