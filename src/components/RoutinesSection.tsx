"use client";

import { ListChecks, Activity, ScanLine, ShoppingBag } from "lucide-react";
import { GoalToggle } from "./GoalToggle";
import { Reveal, RevealGroup, RevealItem } from "./motion/Reveal";
import { ed, GRO, DISPLAY, kickerStyle, folioStyle, h2Style, deckStyle } from "../config/editorialTheme";

const included = [
  { icon: <ListChecks className="w-5 h-5" strokeWidth={1.5} />, title: "Daily to-do list", desc: "A simple checklist of meals, habits and actions — so you always know your next step." },
  { icon: <Activity className="w-5 h-5" strokeWidth={1.5} />, title: "Activity tracking", desc: "Log workouts, water, sleep and habits. Watch your streaks and progress build." },
  { icon: <ScanLine className="w-5 h-5" strokeWidth={1.5} />, title: "Scan & check food", desc: "Point your camera at any meal or product to see what fits your goal — and what doesn't." },
  { icon: <ShoppingBag className="w-5 h-5" strokeWidth={1.5} />, title: "Shop your kit", desc: "Get the exact foods, supplements and products your routine needs — in one tap." },
];

export function RoutinesSection() {
  return (
    <section id="routines" style={{ background: ed.paper, width: "100%" }}>
      <div
        style={{
          maxWidth: 1320,
          margin: "0 auto",
          paddingLeft: "clamp(20px, 5vw, 72px)",
          paddingRight: "clamp(20px, 5vw, 72px)",
          paddingTop: "clamp(80px, 11vw, 168px)",
          paddingBottom: "clamp(80px, 11vw, 168px)",
        }}
      >
        {/* Header */}
        <div style={{ borderTop: `1px solid ${ed.hair}`, paddingTop: 16, display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 8 }}>
          <p style={kickerStyle}>Choose your goal</p>
          <p style={folioStyle}>02 / 08</p>
        </div>
        <div style={{ marginTop: "clamp(28px, 4vw, 52px)", maxWidth: 920 }}>
          <Reveal>
            <h2 style={h2Style}>
              A routine for <span style={{ fontStyle: "italic", color: ed.accent }}>any goal</span>.
            </h2>
          </Reveal>
          <Reveal as="p" delay={0.1} style={{ ...deckStyle, marginTop: 22, maxWidth: "48ch" }}>
            Tell ROUTINE³ what you want to achieve — it builds the routine: daily to-dos, activity tracking and the scanner, working together.
          </Reveal>
        </div>

        {/* Goal toggle */}
        <div style={{ marginTop: "clamp(40px, 6vw, 72px)" }}>
          <GoalToggle />
        </div>

        {/* What every routine includes */}
        <div style={{ marginTop: "clamp(64px, 9vw, 120px)", borderTop: `1px solid ${ed.hair}`, paddingTop: "clamp(40px, 5vw, 64px)" }}>
          <Reveal>
            <p style={kickerStyle}>What's inside</p>
            <h3 style={{ fontFamily: DISPLAY, fontWeight: 400, fontSize: "clamp(1.6rem, 2.8vw, 2.4rem)", lineHeight: 1.1, letterSpacing: "-0.02em", color: ed.ink, margin: "16px 0 0", maxWidth: "20ch" }}>
              Every routine comes with
            </h3>
          </Reveal>

          <RevealGroup style={{ display: "flex", flexWrap: "wrap", gap: "40px 48px", marginTop: "clamp(36px, 4vw, 56px)" }}>
            {included.map((item) => (
              <RevealItem key={item.title} style={{ flex: "1 1 220px", minWidth: 200 }}>
                <span style={{ display: "inline-flex", color: ed.accent, marginBottom: 16 }}>{item.icon}</span>
                <h4 style={{ fontFamily: DISPLAY, fontWeight: 400, fontSize: "1.4rem", lineHeight: 1.15, color: ed.ink, margin: "0 0 8px" }}>{item.title}</h4>
                <p style={{ fontFamily: GRO, fontSize: 15, lineHeight: 1.55, color: ed.inkSoft, margin: 0 }}>{item.desc}</p>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </div>
    </section>
  );
}
