"use client";

import { motion, useReducedMotion } from "motion/react";
import { EASE_OUT, DUR } from "../../config/motionTokens";

/**
 * Headline reveal: the line(s) fade + rise into view on scroll.
 * Uses the proven whileInView object pattern (reliable, never leaves text clipped).
 * Pass `lines` as strings or JSX (so an italic emphasis word can live in a line).
 */
export function RevealLines({
  lines,
  style,
  amount = 0.4,
  delay = 0,
}: {
  lines: React.ReactNode[];
  style?: React.CSSProperties;
  amount?: number;
  delay?: number;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.span
      style={{ display: "block", ...style }}
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 22 }}
      whileInView={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount }}
      transition={{ duration: reduce ? 0.3 : DUR.large, ease: EASE_OUT, delay }}
    >
      {lines.map((line, i) => (
        <span key={i} style={{ display: "block" }}>
          {line}
        </span>
      ))}
    </motion.span>
  );
}
