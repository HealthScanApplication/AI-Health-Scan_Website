/*
 * Oura-inspired design tokens for the ROUTINE³ site.
 *
 * The project ships a PREBUILT static index.css with NO Tailwind JIT, so custom
 * values must be applied via inline style objects (these tokens), not new utility
 * classes. Green is a refined ACCENT (<5% of any viewport), never a bright fill.
 */
export const oura = {
  // Canvases
  dark: "#151619",
  darkRaised: "#222428",
  cream: "#f7f1e8",
  creamLight: "#fefaef",
  creamPanel: "#efeae2",
  creamDeep: "#e6ded3",
  // Text on cream
  ink: "#1c1b1a",
  body: "#4a4741",
  muted: "#838280",
  // Text on dark
  onDark: "#f7f1e8",
  onDarkBody: "#eee6dc",
  onDarkMuted: "#a8a5a0",
  // Green accent system
  forest: "#224228",
  forestHover: "#2f5d3a",
  sage: "#7b886d",
  greenWash: "#e2edd5",
  greenDot: "#4ade80",
  // Hairlines (no drop shadows anywhere)
  hairline: "rgba(74,71,65,0.16)",
  hairlineOnDark: "rgba(247,241,232,0.14)",
} as const;

const serif = '"Instrument Serif", Georgia, serif';
const sans = "Inter, sans-serif";

export const ouraType = {
  serif,
  sans,
  eyebrow: (onDark = false) => ({
    fontFamily: sans,
    fontSize: 12,
    fontWeight: 500,
    textTransform: "uppercase" as const,
    letterSpacing: "0.1em",
    color: onDark ? "rgba(247,241,232,0.7)" : oura.forest,
  }),
  h2: (onDark = false) => ({
    fontFamily: serif,
    fontWeight: 400,
    fontSize: "clamp(2rem, 4vw, 3.25rem)",
    lineHeight: 1.1,
    letterSpacing: "-0.025em",
    color: onDark ? oura.onDark : oura.ink,
    margin: 0,
  }),
  h3: (onDark = false) => ({
    fontFamily: serif,
    fontWeight: 400,
    fontSize: "clamp(1.6rem, 3vw, 2.25rem)",
    lineHeight: 1.15,
    letterSpacing: "-0.02em",
    color: onDark ? oura.onDark : oura.ink,
    margin: 0,
  }),
  body: (onDark = false) => ({
    fontFamily: sans,
    fontWeight: 400,
    fontSize: "clamp(1rem, 1.4vw, 1.125rem)",
    lineHeight: 1.6,
    color: onDark ? oura.onDarkBody : oura.body,
  }),
};

/** Full-pill CTA. variant: 'green' (forest), 'dark', or 'inverse' (cream on dark). */
export const ouraButton = (variant: "green" | "dark" | "inverse" = "green") => {
  const map = {
    green: { background: oura.forest, color: oura.onDark },
    dark: { background: oura.dark, color: oura.onDark },
    inverse: { background: oura.cream, color: oura.dark },
  } as const;
  return {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 999,
    padding: "13px 26px",
    fontFamily: sans,
    fontWeight: 500,
    fontSize: 15,
    letterSpacing: 0,
    border: "none",
    boxShadow: "none",
    cursor: "pointer",
    transition: "background-color 300ms cubic-bezier(0.4,0,0.2,1)",
    ...map[variant],
  };
};

/** Shadowless card. */
export const ouraCard = (onDark = false) => ({
  background: onDark ? oura.darkRaised : oura.creamLight,
  border: `1px solid ${onDark ? oura.hairlineOnDark : oura.hairline}`,
  borderRadius: 24,
  boxShadow: "none",
});

export const ouraSection = (bg: string) => ({ background: bg, width: "100%" });
export const ouraSectionInner = {
  maxWidth: 1200,
  margin: "0 auto",
  padding: "clamp(80px, 10vw, 140px) 24px",
};
