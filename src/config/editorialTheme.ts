/*
 * "The Routine Issue" — magazine-editorial design tokens for HealthScan.
 * Warm newsprint + ink, Fraunces display + Archivo grotesque, one ochre accent,
 * a strict 12-col grid. All applied via inline styles (no Tailwind JIT).
 */
export const ed = {
  // Warmed toward Function Health's palette — beige paper + terracotta accent.
  paper: "#FAF5EC",
  paperAlt: "#F1EBDD",
  ink: "#16140F",
  inkSoft: "rgba(22,20,15,0.62)",
  inkFaint: "rgba(22,20,15,0.30)",
  hair: "rgba(22,20,15,0.14)",
  accent: "#B05A36",
  // single inverted dark spread
  dark: "#16140F",
  onDark: "#F4F1EA",
  onDarkSoft: "rgba(244,241,234,0.66)",
  onDarkHair: "rgba(244,241,234,0.16)",
} as const;

export const DISPLAY = '"Fraunces", Georgia, serif';
export const GRO = '"Archivo", "Inter", sans-serif';

// ---- grid ----
export const inner: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(12, 1fr)",
  columnGap: 24,
  maxWidth: 1440,
  margin: "0 auto",
  paddingLeft: "clamp(20px, 5vw, 72px)",
  paddingRight: "clamp(20px, 5vw, 72px)",
};
export const col = (start: number, span: number): React.CSSProperties => ({
  gridColumn: `${start} / span ${span}`,
});
export const fullBleed: React.CSSProperties = {
  gridColumn: "1 / -1",
  marginLeft: "calc(50% - 50vw)",
  marginRight: "calc(50% - 50vw)",
};
export const sectionPad: React.CSSProperties = {
  paddingTop: "clamp(96px, 12vw, 200px)",
  paddingBottom: "clamp(96px, 12vw, 200px)",
};

// ---- editorial type ----
export const kickerStyle: React.CSSProperties = {
  fontFamily: GRO,
  fontSize: 12,
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.18em",
  color: ed.accent,
  margin: 0,
};
export const folioStyle: React.CSSProperties = {
  fontFamily: GRO,
  fontSize: 11,
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.18em",
  color: ed.inkFaint,
  fontVariantNumeric: "tabular-nums",
  textAlign: "right",
  margin: 0,
};
export const coverStyle: React.CSSProperties = {
  fontFamily: DISPLAY,
  fontSize: "clamp(3.2rem, 9vw, 9.5rem)",
  fontWeight: 380,
  lineHeight: 0.94,
  letterSpacing: "-0.04em",
  color: ed.ink,
  margin: 0,
  fontOpticalSizing: "auto" as any,
  fontVariationSettings: '"opsz" 144',
};
export const h2Style: React.CSSProperties = {
  fontFamily: DISPLAY,
  fontSize: "clamp(2.2rem, 4vw, 3.6rem)",
  fontWeight: 380,
  lineHeight: 1.02,
  letterSpacing: "-0.03em",
  color: ed.ink,
  margin: 0,
};
export const h3Style: React.CSSProperties = {
  fontFamily: DISPLAY,
  fontSize: "clamp(1.6rem, 2.6vw, 2.4rem)",
  fontWeight: 400,
  lineHeight: 1.1,
  letterSpacing: "-0.02em",
  color: ed.ink,
  margin: 0,
};
export const deckStyle: React.CSSProperties = {
  fontFamily: DISPLAY,
  fontStyle: "italic",
  fontSize: "clamp(1.15rem, 1.8vw, 1.5rem)",
  lineHeight: 1.4,
  color: ed.inkSoft,
  margin: 0,
};
export const bodyStyle: React.CSSProperties = {
  fontFamily: GRO,
  fontSize: 18,
  fontWeight: 400,
  lineHeight: 1.6,
  color: ed.ink,
  maxWidth: "62ch",
};
export const captionStyle: React.CSSProperties = {
  fontFamily: GRO,
  fontSize: 12,
  fontStyle: "italic",
  color: ed.inkSoft,
  letterSpacing: "0.02em",
};
export const pullStyle: React.CSSProperties = {
  fontFamily: DISPLAY,
  fontStyle: "italic",
  fontSize: "clamp(1.8rem, 3vw, 2.8rem)",
  fontWeight: 360,
  lineHeight: 1.18,
  letterSpacing: "-0.01em",
  color: ed.ink,
  margin: 0,
};

// ---- links / inputs (no pill, no radius, no shadow) ----
export const ctaLink: React.CSSProperties = {
  fontFamily: GRO,
  fontSize: 13,
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.14em",
  color: ed.ink,
  textDecoration: "underline",
  textUnderlineOffset: 4,
  textDecorationColor: ed.accent,
  cursor: "pointer",
  background: "none",
  border: "none",
  padding: 0,
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
};
export const underlineInput: React.CSSProperties = {
  fontFamily: GRO,
  fontSize: 16,
  color: ed.ink,
  background: "transparent",
  border: "none",
  borderBottom: `1px solid ${ed.ink}`,
  borderRadius: 0,
  padding: "8px 0",
  outline: "none",
};
export const plate: React.CSSProperties = {
  border: `1px solid ${ed.ink}`,
  borderRadius: 0,
  boxShadow: "none",
  filter: "saturate(0.92) contrast(1.02)",
  display: "block",
  width: "100%",
};
