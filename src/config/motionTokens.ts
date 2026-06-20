/*
 * Shared motion language for the site (sits alongside ouraTheme.ts).
 * Two easings, two durations, no springs — so every component animates in one voice.
 */
export const EASE_OUT = [0.53, 0.02, 0, 0.99] as const; // reveals / fades — fast start, long soft settle
export const EASE_INOUT = [0.84, 0, 0.16, 1] as const; // big state changes
export const DUR = { base: 0.42, large: 0.55 } as const;
export const VIEWPORT_ONCE = { once: true, amount: 0.3, margin: "0px 0px -12% 0px" } as const;
