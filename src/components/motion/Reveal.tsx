"use client";

import { motion, useReducedMotion } from "motion/react";
import { EASE_OUT, DUR } from "../../config/motionTokens";

/**
 * Reveal — a single element rises 16px + fades in once, when scrolled into view.
 * The Motion-native, reusable replacement for the hand-rolled hero entrance.
 * Reduced motion → fade only (no translate).
 */
export function Reveal({
  children,
  as = "div",
  delay = 0,
  y = 12,
  amount = 0.05,
  style,
  ...rest
}: {
  children: React.ReactNode;
  as?: any;
  delay?: number;
  y?: number;
  amount?: number;
  style?: React.CSSProperties;
  [key: string]: any;
}) {
  const reduce = useReducedMotion();
  const M = (motion as any)[as] || motion.div;
  return (
    <M
      initial={reduce ? { opacity: 0 } : { opacity: 0, y }}
      whileInView={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount, margin: "0px 0px 280px 0px" }}
      transition={{ duration: reduce ? 0.3 : DUR.base, ease: EASE_OUT, delay: reduce ? 0 : delay }}
      style={style}
      {...rest}
    >
      {children}
    </M>
  );
}

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.04, delayChildren: 0 } },
};

/** Wrap a grid/list; its <RevealItem> children cascade in on enter. */
export function RevealGroup({ children, amount = 0.05, style, ...rest }: any) {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount, margin: "0px 0px 280px 0px" }}
      style={style}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

export function RevealItem({ children, y = 12, style, ...rest }: any) {
  const reduce = useReducedMotion();
  const itemVariants = {
    hidden: reduce ? { opacity: 0 } : { opacity: 0, y },
    visible: { opacity: 1, y: 0, transition: { duration: reduce ? 0.3 : DUR.base, ease: EASE_OUT } },
  };
  return (
    <motion.div variants={itemVariants} style={style} {...rest}>
      {children}
    </motion.div>
  );
}
