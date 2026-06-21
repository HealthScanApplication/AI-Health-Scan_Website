import { ed, GRO, DISPLAY, kickerStyle, folioStyle, h2Style, deckStyle } from "../config/editorialTheme";
import { Reveal, RevealGroup, RevealItem } from "./motion/Reveal";
import { PhoneFrame } from "./mockups/PhoneFrame";
import { ProtocolHomeScreen, type HomeItem } from "./mockups/ProtocolHomeScreen";

/* A weight-loss day, partly checked off — same app UI as the "routine" section above. */
const CHECKED_DAY: HomeItem[] = [
  { display_name: "Vitamin D3", item_type: "supplement", time: "06:30", group_name: "Supplements", done: true },
  { display_name: "Green Tea", item_type: "consume", time: "07:00", group_name: "Breakfast", done: true },
  { display_name: "Morning Sunlight", item_type: "activity", time: "07:30", group_name: "Do", duration_minutes: 10, done: true },
  { display_name: "High-Protein Lunch", item_type: "consume", time: "12:30", group_name: "Lunch" },
  { display_name: "Strength Session", item_type: "activity", time: "18:00", group_name: "Do", duration_minutes: 30 },
];

const STEPS = [
  {
    number: "01",
    title: "Pick your goal",
    description: "Lose weight, clear your skin, build muscle, feed your kids better — choose what matters and HealthScan turns it into a plan.",
  },
  {
    number: "02",
    title: "Get your routine",
    description: "Receive a personalised routine in seconds: daily to-dos, meals, habits, and the exact foods and products you'll need.",
  },
  {
    number: "03",
    title: "Track every day",
    description: "Check off your tasks, log your activity, and scan any food with the camera to see if it fits your goal.",
  },
  {
    number: "04",
    title: "Hit your goal",
    description: "Build streaks, watch progress grow, and let HealthScan adapt the routine as you go.",
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" style={{ background: ed.paperAlt, width: "100%" }}>
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
        {/* Section header */}
        <div style={{ borderTop: `1px solid ${ed.hair}`, paddingTop: 16, display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 8 }}>
          <p style={kickerStyle}>How it works</p>
          <p style={folioStyle}>03 / 08</p>
        </div>
        <div style={{ marginTop: "clamp(28px, 4vw, 52px)", maxWidth: 920 }}>
          <Reveal>
            <h2 style={h2Style}>
              From goal to <span style={{ fontStyle: "italic", color: ed.accent }}>results</span>, in four steps.
            </h2>
          </Reveal>
          <Reveal as="p" delay={0.1} style={{ ...deckStyle, marginTop: 22, maxWidth: "46ch" }}>
            HealthScan turns whatever you want to achieve into a routine you can actually keep — and tracks every step with you.
          </Reveal>
        </div>

        {/* Steps + phone */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "56px 72px", marginTop: "clamp(48px, 7vw, 96px)", alignItems: "flex-start" }}>
          {/* Steps */}
          <div style={{ flex: "1.3 1 380px", minWidth: 300 }}>
            <RevealGroup>
              {STEPS.map((step, index) => (
                <RevealItem
                  key={step.number}
                  style={{
                    display: "flex",
                    gap: "clamp(18px, 3vw, 36px)",
                    alignItems: "flex-start",
                    paddingTop: index === 0 ? 0 : "clamp(24px, 3vw, 36px)",
                    paddingBottom: index === STEPS.length - 1 ? 0 : "clamp(24px, 3vw, 36px)",
                    borderTop: index === 0 ? "none" : `1px solid ${ed.hair}`,
                  }}
                >
                  <span style={{ fontFamily: DISPLAY, fontSize: "clamp(2.2rem, 4vw, 3.2rem)", fontWeight: 360, color: ed.accent, lineHeight: 0.85, letterSpacing: "-0.03em", flexShrink: 0, width: "1.8em" }}>
                    {step.number}
                  </span>
                  <div style={{ paddingTop: 4 }}>
                    <h3 style={{ fontFamily: DISPLAY, fontWeight: 400, fontSize: "clamp(1.4rem, 2.4vw, 1.9rem)", lineHeight: 1.12, letterSpacing: "-0.02em", color: ed.ink, margin: "0 0 10px" }}>
                      {step.title}
                    </h3>
                    <p style={{ fontFamily: GRO, fontSize: 16, lineHeight: 1.6, color: ed.inkSoft, margin: 0, maxWidth: "44ch" }}>
                      {step.description}
                    </p>
                  </div>
                </RevealItem>
              ))}
            </RevealGroup>
          </div>

          {/* Phone — the routine, tracked (same app UI as the section above, checked off) */}
          <div style={{ flex: "1 1 300px", minWidth: 280, display: "flex", flexDirection: "column", alignItems: "center" }}>
            <PhoneFrame width={300} screenBg="#FFFFFF">
              <ProtocolHomeScreen protocolName="Weight-loss routine" items={CHECKED_DAY} anchors={false} />
            </PhoneFrame>
            <p style={{ fontFamily: GRO, fontSize: 11, fontStyle: "italic", color: ed.inkSoft, marginTop: 18, letterSpacing: "0.02em", textAlign: "center" }}>
              Fig. 02 — Your day, checked off
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
