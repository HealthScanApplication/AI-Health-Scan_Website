import { useState } from "react";
import { UniversalWaitlist } from "./UniversalWaitlist";
import { ConfettiCelebration } from "./ConfettiCelebration";
import { ed, GRO, DISPLAY, kickerStyle, folioStyle, h2Style, deckStyle } from "../config/editorialTheme";
import { APP_STORE_URL } from "../config/appLinks";

const DISPATCH = [
  { no: "01", title: "New protocols", desc: "Fresh routines for new goals as we publish them." },
  { no: "02", title: "Scanner findings", desc: "What the camera is learning about everyday foods." },
  { no: "03", title: "Routine tips", desc: "Small, practical ways to actually stick with it." },
];

function AppleMark({ size = 14 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden="true" style={{ marginBottom: -2 }}>
      <path d="M17.05 12.54c-.02-2.06 1.68-3.05 1.76-3.1-.96-1.4-2.46-1.6-3-1.62-1.27-.13-2.49.75-3.14.75-.65 0-1.65-.73-2.71-.71-1.39.02-2.68.81-3.4 2.06-1.45 2.52-.37 6.25 1.04 8.3.69 1 1.51 2.13 2.58 2.09 1.04-.04 1.43-.67 2.69-.67 1.25 0 1.61.67 2.71.65 1.12-.02 1.83-1.02 2.51-2.03.79-1.16 1.12-2.29 1.13-2.35-.02-.01-2.17-.83-2.19-3.3zM15 5.88c.57-.69.96-1.65.85-2.61-.83.03-1.83.55-2.42 1.24-.53.61-.99 1.59-.87 2.53.93.07 1.87-.47 2.44-1.16z" />
    </svg>
  );
}

export function EmailSubscribeSection() {
  const [showConfetti, setShowConfetti] = useState(false);
  const handleSignupSuccess = () => {
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 3000);
  };

  return (
    <section style={{ background: ed.paper, width: "100%", position: "relative", overflow: "hidden" }}>
      {showConfetti && <ConfettiCelebration />}
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
          <p style={kickerStyle}>The dispatch</p>
          <p style={folioStyle}>Subscribe</p>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "48px 72px", marginTop: "clamp(28px, 4vw, 52px)", alignItems: "flex-start" }}>
          {/* Left — the pitch + subscribe */}
          <div style={{ flex: "1.3 1 380px", minWidth: 300 }}>
            <h2 style={h2Style}>
              Get the <span style={{ fontStyle: "italic", color: ed.accent }}>dispatch</span>.
            </h2>
            <p style={{ ...deckStyle, marginTop: 22, maxWidth: "40ch" }}>
              An occasional note on routines, protocols and what the scanner is learning. No spam — unsubscribe anytime.
            </p>

            <div style={{ marginTop: "clamp(28px, 3vw, 40px)", display: "flex", alignItems: "baseline", gap: 14, flexWrap: "wrap" }}>
              <span style={{ ...kickerStyle, color: ed.inkSoft }}>Subscribe</span>
              <UniversalWaitlist variant="editorial" submitLabel="Subscribe →" placeholder="you@email.com" onSignupSuccess={handleSignupSuccess} />
            </div>

            <div style={{ marginTop: 30, paddingTop: 24, borderTop: `1px solid ${ed.hair}` }}>
              <p style={{ ...kickerStyle, color: ed.accent, marginBottom: 14 }}>Out now on iOS — Android coming soon</p>
              <a
                href={APP_STORE_URL || undefined}
                target={APP_STORE_URL ? "_blank" : undefined}
                rel="noopener noreferrer"
                className="ed-cta"
              >
                <AppleMark />Try ROUTINE³&nbsp;→
              </a>
            </div>
          </div>

          {/* Right — what's inside */}
          <div style={{ flex: "1 1 280px", minWidth: 260 }}>
            <p style={{ ...kickerStyle, color: ed.inkSoft, marginBottom: 22 }}>In each issue</p>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {DISPATCH.map((d, i) => (
                <div key={d.no} style={{ display: "flex", gap: 16, alignItems: "baseline", paddingTop: i === 0 ? 0 : 18, paddingBottom: 18, borderTop: i === 0 ? "none" : `1px solid ${ed.hair}` }}>
                  <span style={{ fontFamily: DISPLAY, fontSize: "1.3rem", color: ed.accent, lineHeight: 1, flexShrink: 0 }}>{d.no}</span>
                  <div>
                    <div style={{ fontFamily: GRO, fontSize: 16, fontWeight: 600, color: ed.ink, marginBottom: 4 }}>{d.title}</div>
                    <div style={{ fontFamily: GRO, fontSize: 14.5, lineHeight: 1.55, color: ed.inkSoft }}>{d.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
