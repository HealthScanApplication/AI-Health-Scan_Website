"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { ed, GRO, DISPLAY } from "../config/editorialTheme";
import { EASE_OUT } from "../config/motionTokens";
import { GOALS, type RealProtocol } from "../config/realProtocols";
import { PhoneFrame } from "./mockups/PhoneFrame";
import { ProtocolHomeScreen, type HomeItem } from "./mockups/ProtocolHomeScreen";

/* ---- The real app home screen, presented in a device frame ---- */
function ProtocolPhone({ protocol }: { protocol: RealProtocol }) {
  const items: HomeItem[] = protocol.items.map((it) => ({
    display_name: it.name,
    item_type: it.item_type,
    time: it.meta || null,
    image_url: it.image_url || null,
    group_name: it.group_name || null,
    description: it.description || null,
    children: it.children,
  }));
  return (
    <PhoneFrame width={300} screenBg="#FFFFFF">
      <ProtocolHomeScreen protocolName={protocol.name} items={items} />
    </PhoneFrame>
  );
}

/* ---- Do / Avoid guidance shown under the protocol card (mirrors the app) ---- */
function GuidanceList({ title, glyph, color, items }: { title: string; glyph: string; color: string; items?: string[] }) {
  if (!items || items.length === 0) return null;
  return (
    <div style={{ flex: "1 1 200px", minWidth: 180 }}>
      <div style={{ fontFamily: GRO, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.14em", color, marginBottom: 10 }}>{title}</div>
      <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 8 }}>
        {items.map((it, i) => (
          <li key={i} style={{ display: "flex", gap: 9, fontFamily: GRO, fontSize: 14, lineHeight: 1.45, color: ed.inkSoft }}>
            <span aria-hidden style={{ color, fontWeight: 700, flexShrink: 0, marginTop: 1 }}>{glyph}</span>
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </div>
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

          {(protocol.dos?.length || protocol.donts?.length) ? (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "24px 40px", marginTop: 30, maxWidth: "44ch" }}>
              <GuidanceList title="Do" glyph="✓" color="#5E7B5A" items={protocol.dos} />
              <GuidanceList title="Avoid" glyph="✕" color="#B0573F" items={protocol.donts} />
            </div>
          ) : null}
        </div>

        {/* The home screen — presented like the other sections */}
        <div style={{ flex: "1 1 300px", minWidth: 280, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <ProtocolPhone protocol={protocol} />
          <p style={{ fontFamily: GRO, fontSize: 11, fontStyle: "italic", color: ed.inkSoft, marginTop: 18, letterSpacing: "0.02em", textAlign: "center" }}>
            Fig. — Your routine, today in the app
          </p>
        </div>
      </motion.div>
    </div>
  );
}
