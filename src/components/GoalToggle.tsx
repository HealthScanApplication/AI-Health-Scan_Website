"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { ed, GRO, DISPLAY } from "../config/editorialTheme";
import { EASE_OUT } from "../config/motionTokens";
import { CATEGORY_TINTS, categorize, itemIcon, type ProtocolItem } from "../config/protocolCategories";
import { GOALS, type RealProtocol } from "../config/realProtocols";
import { PhoneFrame } from "./mockups/PhoneFrame";

/* ---- Home-screen phone: items grouped by time-of-day, like the real app ---- */
function bucketByDaypart(items: ProtocolItem[]) {
  const parts: Record<string, ProtocolItem[]> = { Morning: [], Afternoon: [], Evening: [], Anytime: [] };
  for (const it of items) {
    const m = /^(\d{1,2}):(\d{2})$/.exec(it.meta || "");
    if (!m) parts.Anytime.push(it);
    else {
      const h = parseInt(m[1], 10);
      if (h < 12) parts.Morning.push(it);
      else if (h < 17) parts.Afternoon.push(it);
      else parts.Evening.push(it);
    }
  }
  return (["Morning", "Afternoon", "Evening", "Anytime"] as const)
    .map((label) => ({ label, items: parts[label] }))
    .filter((g) => g.items.length);
}

function ProtocolPhone({ protocol, pillar }: { protocol: RealProtocol; pillar: string }) {
  const sections = bucketByDaypart(protocol.items);
  return (
    <PhoneFrame width={300} screenBg="#FBFBFA">
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", fontFamily: GRO, background: "#FBFBFA" }}>
        {/* status bar */}
        <div style={{ padding: "15px 20px 0", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11, fontWeight: 600, color: "#111827", flexShrink: 0 }}>
          <span style={{ fontVariantNumeric: "tabular-nums" }}>9:41</span>
          <span style={{ letterSpacing: "0.18em", fontSize: 9, color: "#9CA3AF", textTransform: "uppercase" }}>{pillar}</span>
        </div>

        {/* protocol header */}
        <div style={{ padding: "12px 16px 10px", flexShrink: 0, display: "flex", alignItems: "center", gap: 10, borderBottom: "1px solid #F0F0EE" }}>
          <span style={{ width: 38, height: 38, borderRadius: 9, background: "#16140F", color: "#F4F1EA", display: "inline-flex", alignItems: "center", justifyContent: "center", fontFamily: DISPLAY, fontSize: 17, flexShrink: 0 }}>
            {protocol.name.charAt(0)}
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: "#111827", lineHeight: 1.2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{protocol.name}</div>
            <div style={{ fontSize: 10.5, color: "#9CA3AF", marginTop: 2 }}>{protocol.items.length} steps · today</div>
          </div>
          <span style={{ fontSize: 11, fontWeight: 600, color: "#15803D", background: "#ECFDF5", border: "1px solid #BBF7D0", borderRadius: 8, padding: "4px 8px", flexShrink: 0 }}>0/{protocol.items.length}</span>
        </div>

        {/* scrollable day timeline grouped by part of day */}
        <div className="phone-scroll" style={{ flex: 1, overflowY: "auto", padding: "8px 14px 16px", display: "flex", flexDirection: "column", gap: 4 }}>
          {sections.map((section) => (
            <div key={section.label}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 4px 6px" }}>
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.09em", textTransform: "uppercase", color: "#6B7280" }}>{section.label}</span>
                <span style={{ fontSize: 9.5, color: "#C4C4C0" }}>{section.items.length}</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {section.items.map((item, i) => {
                  const tint = CATEGORY_TINTS[categorize(item)];
                  const { Icon, color } = itemIcon(item);
                  return (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 9, padding: "7px 9px", borderRadius: 10, background: "#fff", border: "1px solid #F0F0EE" }}>
                      <span style={{ width: 30, height: 30, borderRadius: 8, flexShrink: 0, background: tint.bg, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                        <Icon size={15} color={color} strokeWidth={1.9} />
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12.5, fontWeight: 600, color: "#1F2937", lineHeight: 1.2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.name}</div>
                        <div style={{ fontSize: 9.5, color: tint.fg, marginTop: 1, letterSpacing: "0.04em" }}>{tint.label}</div>
                      </div>
                      {item.meta && <span style={{ fontSize: 10, fontWeight: 500, color: "#9CA3AF", fontVariantNumeric: "tabular-nums", flexShrink: 0 }}>{item.meta}</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </PhoneFrame>
  );
}

/* ---- short lead paragraph distilled from the real protocol description ---- */
function leadParagraph(desc: string): string {
  if (!desc) return "";
  let lead = desc.split(/\n\s*\n|\n###/)[0].trim().replace(/\*\*/g, "").replace(/^###\s*/, "");
  if (lead.length > 230) {
    const cut = lead.slice(0, 230);
    lead = cut.slice(0, cut.lastIndexOf(" ")).trim().replace(/[—,;:]$/, "") + "…";
  }
  return lead;
}

export function GoalToggle() {
  const [goalKey, setGoalKey] = useState(GOALS[0].key);
  const goal = GOALS.find((g) => g.key === goalKey) || GOALS[0];
  const [protoKey, setProtoKey] = useState(goal.protocols[0].key);
  const protocol = goal.protocols.find((p) => p.key === protoKey) || goal.protocols[0];

  const selectGoal = (g: typeof goal) => {
    setGoalKey(g.key);
    setProtoKey(g.protocols[0].key);
  };

  const metaBits: string[] = [];
  if (protocol.creator && protocol.creator.length < 32 && !/protocol|evidence|based/i.test(protocol.creator)) metaBits.push(protocol.creator);
  if (protocol.score) metaBits.push(`${protocol.score}/100 health score`);
  if (protocol.evidence) metaBits.push(`${protocol.evidence} evidence`);

  return (
    <div>
      {/* Level 1 — goals, mirroring the hero */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {GOALS.map((g) => {
          const on = g.key === goalKey;
          return (
            <button
              key={g.key}
              onClick={() => selectGoal(g)}
              style={{
                fontFamily: GRO, fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em",
                padding: "9px 15px", borderRadius: 2, cursor: "pointer",
                background: on ? ed.ink : "transparent", color: on ? ed.paper : ed.inkSoft,
                border: `1px solid ${on ? ed.ink : ed.hair}`, transition: "background-color 200ms ease, color 200ms ease",
              }}
            >
              {g.label}
            </button>
          );
        })}
      </div>

      {/* Level 2 — the named protocols under the chosen goal */}
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px 16px", marginTop: 16 }}>
        <span style={{ fontFamily: GRO, fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.16em", color: ed.inkFaint }}>Protocols</span>
        {goal.protocols.map((p) => {
          const on = p.key === protoKey;
          return (
            <button
              key={p.key}
              onClick={() => setProtoKey(p.key)}
              style={{
                fontFamily: GRO, fontSize: 13, fontWeight: 600, color: on ? ed.ink : ed.inkSoft,
                background: "none", border: "none", padding: "2px 0", cursor: "pointer",
                borderBottom: `2px solid ${on ? ed.accent : "transparent"}`, transition: "color 200ms ease, border-color 200ms ease",
              }}
            >
              {p.chip}
            </button>
          );
        })}
      </div>

      {/* The selected protocol — description on the left, the home-screen phone on the right */}
      <motion.div
        key={protocol.key}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: EASE_OUT }}
        style={{ marginTop: 36, display: "flex", flexWrap: "wrap", gap: "48px 64px", alignItems: "flex-start" }}
      >
        <div style={{ flex: "1.1 1 340px", minWidth: 300 }}>
          <div style={{ fontFamily: GRO, fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.16em", color: ed.accent, marginBottom: 10 }}>
            {goal.label}
          </div>
          <h3 style={{ fontFamily: DISPLAY, fontWeight: 400, fontSize: "clamp(1.7rem, 2.8vw, 2.4rem)", letterSpacing: "-0.02em", color: ed.ink, margin: 0 }}>
            {protocol.name}
          </h3>
          {metaBits.length > 0 && (
            <p style={{ fontFamily: GRO, fontSize: 12.5, color: ed.inkFaint, margin: "10px 0 0", letterSpacing: "0.02em" }}>
              {metaBits.join("  ·  ")}
            </p>
          )}

          <p style={{ fontFamily: GRO, fontSize: 17, lineHeight: 1.6, color: ed.inkSoft, margin: "18px 0 0", maxWidth: "42ch" }}>
            {leadParagraph(protocol.description)}
          </p>
        </div>

        {/* The home screen — presented like the other sections */}
        <div style={{ flex: "1 1 300px", minWidth: 280, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <ProtocolPhone protocol={protocol} pillar={goal.pillar} />
          <p style={{ fontFamily: GRO, fontSize: 11, fontStyle: "italic", color: ed.inkSoft, marginTop: 18, letterSpacing: "0.02em", textAlign: "center" }}>
            Fig. — Your routine, today in the app
          </p>
        </div>
      </motion.div>
    </div>
  );
}
