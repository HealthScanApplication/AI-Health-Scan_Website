import { ed, GRO, DISPLAY, kickerStyle, folioStyle, h2Style, deckStyle } from "../config/editorialTheme";

const DiscordLogo = ({ size = 18, color = "currentColor" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} aria-hidden="true">
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
  </svg>
);

const BENEFITS = [
  { no: "01", title: "Health community", desc: "People focused on food transparency, comparing notes and routines." },
  { no: "02", title: "Direct support", desc: "Quick answers from our team and the wider community." },
  { no: "03", title: "Early access", desc: "Preview new features and shape what we build next." },
];

export function DiscordCommunitySection() {
  return (
    <section style={{ background: ed.paperAlt, width: "100%" }}>
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
          <p style={kickerStyle}>Community</p>
          <p style={folioStyle}>Discord</p>
        </div>
        <div style={{ marginTop: "clamp(28px, 4vw, 52px)", maxWidth: 920 }}>
          <h2 style={h2Style}>
            Join the <span style={{ fontStyle: "italic", color: ed.accent }}>table</span>.
          </h2>
          <p style={{ ...deckStyle, marginTop: 22, maxWidth: "46ch" }}>
            Health-conscious people uncovering food transparency together — live now on Discord.
          </p>
        </div>

        {/* Benefits */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "40px 56px", marginTop: "clamp(48px, 6vw, 88px)" }}>
          {BENEFITS.map((b) => (
            <div key={b.title} style={{ flex: "1 1 240px", minWidth: 220 }}>
              <div style={{ fontFamily: DISPLAY, fontSize: "1.4rem", color: ed.accent, marginBottom: 14 }}>{b.no}</div>
              <h3 style={{ fontFamily: DISPLAY, fontWeight: 400, fontSize: "clamp(1.3rem, 2vw, 1.7rem)", lineHeight: 1.15, color: ed.ink, margin: "0 0 10px" }}>{b.title}</h3>
              <p style={{ fontFamily: GRO, fontSize: 15.5, lineHeight: 1.6, color: ed.inkSoft, margin: 0 }}>{b.desc}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div style={{ marginTop: "clamp(48px, 6vw, 80px)", paddingTop: 24, borderTop: `1px solid ${ed.hair}`, display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
          <span style={{ display: "inline-flex", color: "#5865F2" }}><DiscordLogo /></span>
          <a href="https://discord.gg/4QJpFyTD44" target="_blank" rel="noopener noreferrer" className="ed-cta">Join the community →</a>
          <span style={{ fontFamily: GRO, fontSize: 12, color: ed.inkFaint, letterSpacing: "0.02em" }}>Free · No spam · Health-focused</span>
        </div>
      </div>
    </section>
  );
}
