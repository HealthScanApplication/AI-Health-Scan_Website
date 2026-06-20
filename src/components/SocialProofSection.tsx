// SocialProofSection — editorial trust block.
// HealthScan is newly live on iOS; rather than invent testimonials or stats,
// this presents an honest set of commitments as a magazine "statement of values".
import { ed, GRO, DISPLAY, kickerStyle, folioStyle, h2Style, deckStyle, pullStyle } from "../config/editorialTheme";
import { Reveal } from "./motion/Reveal";

const PILLARS = [
  {
    no: "i",
    title: "Built on real science",
    body: "Every analysis is grounded in published research and verified ingredient data — not marketing claims.",
  },
  {
    no: "ii",
    title: "Private by design",
    body: "Your scans and health context stay yours. We never sell your data, full stop.",
  },
  {
    no: "iii",
    title: "Honest by default",
    body: "We only show numbers and reviews once they're real. No borrowed credibility, ever.",
  },
];

export function SocialProofSection() {
  return (
    <section style={{ background: ed.paper, width: "100%" }}>
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
          <p style={kickerStyle}>Why trust us</p>
          <p style={folioStyle}>07 / 08</p>
        </div>
        <div style={{ marginTop: "clamp(28px, 4vw, 52px)", maxWidth: 920 }}>
          <Reveal>
            <h2 style={h2Style}>
              Earning your trust, <span style={{ fontStyle: "italic", color: ed.accent }}>honestly</span>.
            </h2>
          </Reveal>
          <Reveal as="p" delay={0.1} style={{ ...deckStyle, marginTop: 22, maxWidth: "48ch" }}>
            We won't show ratings or testimonials we haven't earned. Here's what we hold to from day one.
          </Reveal>
        </div>

        {/* Pull-quote */}
        <Reveal style={{ margin: "clamp(56px, 8vw, 104px) 0", maxWidth: 940 }}>
          <p style={{ ...pullStyle }}>
            “Know exactly what you're eating, and exactly what we know about you. <span style={{ color: ed.accent }}>Nothing more, nothing hidden.</span>”
          </p>
        </Reveal>

        {/* Pillars */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "40px 56px", borderTop: `1px solid ${ed.hair}`, paddingTop: "clamp(40px, 5vw, 64px)" }}>
          {PILLARS.map((p) => (
            <div key={p.title} style={{ flex: "1 1 260px", minWidth: 240 }}>
              <div style={{ fontFamily: DISPLAY, fontSize: "1.6rem", fontStyle: "italic", color: ed.accent, marginBottom: 16 }}>{p.no}.</div>
              <h3 style={{ fontFamily: DISPLAY, fontWeight: 400, fontSize: "clamp(1.35rem, 2vw, 1.7rem)", lineHeight: 1.15, letterSpacing: "-0.01em", color: ed.ink, margin: "0 0 12px" }}>{p.title}</h3>
              <p style={{ fontFamily: GRO, fontSize: 16, lineHeight: 1.6, color: ed.inkSoft, margin: 0 }}>{p.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
