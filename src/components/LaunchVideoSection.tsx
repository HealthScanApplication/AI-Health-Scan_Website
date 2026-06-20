import { ed, GRO, DISPLAY, kickerStyle, folioStyle, h2Style, deckStyle } from "../config/editorialTheme";

export function LaunchVideoSection() {
  return (
    <section id="video" style={{ background: ed.paper, width: "100%" }}>
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
          <p style={kickerStyle}>The film</p>
          <p style={folioStyle}>06 / 08</p>
        </div>
        <div style={{ marginTop: "clamp(28px, 4vw, 52px)", maxWidth: 920 }}>
          <h2 style={h2Style}>
            See it in a <span style={{ fontStyle: "italic", color: ed.accent }}>minute</span>.
          </h2>
          <p style={{ ...deckStyle, marginTop: 22, maxWidth: "44ch" }}>
            How HealthScan changes the way people make food choices — start to finish.
          </p>
        </div>

        {/* Matted film frame */}
        <figure style={{ margin: "clamp(44px, 6vw, 80px) 0 0", maxWidth: 1040 }}>
          <div style={{ border: `1px solid ${ed.ink}`, background: "#000", padding: 10 }}>
            <div style={{ position: "relative", paddingTop: "56.25%", overflow: "hidden", background: "#000" }}>
              <iframe
                src="https://www.youtube.com/embed/BWSJ3OJGB5A"
                title="HealthScan — Know What You Eat"
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: "none" }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                loading="lazy"
              />
            </div>
          </div>
          <figcaption style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginTop: 16 }}>
            <span style={{ fontFamily: GRO, fontSize: 11, fontStyle: "italic", color: ed.inkSoft, letterSpacing: "0.02em" }}>Fig. 05 — The HealthScan film</span>
            <a href="https://healthscan.gumroad.com/coffee" target="_blank" rel="noopener noreferrer" className="ed-cta">Back the project →</a>
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
