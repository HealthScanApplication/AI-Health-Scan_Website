"use client";

import { useRef, useState, useEffect } from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "motion/react";
import { EASE_OUT } from "../config/motionTokens";

const FOREST = "#224228";
const HAIRLINE = "rgba(74,71,65,0.28)";
const INK = "#1c1b1a";
const MUTED = "#838280";

const RUNGS = ["Daily to-dos", "Activity tracking", "Scan your food", "Shop your kit"];

// SVG geometry (viewBox 0 0 500 300)
const RUNG_X = 130;
const RUNG_W = 240;
const RUNG_H = 38;
const BASE_Y = 250; // top edge of the bottom rung
const GAP = 46;
const rungY = (i: number) => BASE_Y - i * GAP;

// One routine rung: draws on + rises from the bottom, brightening as the act plays.
function Rung({ i, p }: { i: number; p: any }) {
  const start = 0.3 + i * 0.11;
  const end = start + 0.13;
  const y = useTransform(p, [start, end], [22, 0]);
  const opacity = useTransform(p, [start, end], [0, 1]);
  const len = useTransform(p, [start, end], [0, 1]);
  const stroke = useTransform(p, [start, end], [HAIRLINE, INK]);
  const yPos = rungY(i);
  return (
    <motion.g style={{ y, opacity }}>
      <motion.rect
        x={RUNG_X}
        y={yPos}
        width={RUNG_W}
        height={RUNG_H}
        rx={RUNG_H / 2}
        fill="none"
        strokeWidth={1.25}
        style={{ stroke, pathLength: len }}
      />
      <text x={RUNG_X + 22} y={yPos + RUNG_H / 2 + 4} fontFamily="Inter, sans-serif" fontSize={13} fill={INK}>
        {RUNGS[i]}
      </text>
    </motion.g>
  );
}

const captionStyle: React.CSSProperties = {
  textAlign: "center",
  marginTop: 6,
  fontFamily: "Inter, sans-serif",
  fontSize: 12,
  fontWeight: 500,
  letterSpacing: "0.18em",
  textTransform: "uppercase",
  color: MUTED,
};

// Calm, compact composed diagram — always visible (no scroll-jack, no fragile reveal).
function RoutineBuilderStatic() {
  return (
    <div style={{ display: "flex", justifyContent: "center", padding: "8px 0" }}>
      <div style={{ width: "min(520px, 90vw)" }}>
        <svg viewBox="0 0 500 300" width="100%" aria-hidden="true">
          <rect x={170} y={16} width={160} height={40} rx={20} fill="none" stroke={HAIRLINE} strokeWidth={1.25} />
          <text x={250} y={41} textAnchor="middle" fontFamily='"Instrument Serif", serif' fontStyle="italic" fontSize={21} fill={INK}>
            clearer skin
          </text>
          <line x1={250} y1={56} x2={250} y2={258} stroke={HAIRLINE} strokeWidth={1} />
          {RUNGS.map((label, i) => (
            <g key={i}>
              <rect x={RUNG_X} y={rungY(i)} width={RUNG_W} height={RUNG_H} rx={RUNG_H / 2} fill="none" stroke={INK} strokeWidth={1.25} />
              <text x={RUNG_X + 22} y={rungY(i) + RUNG_H / 2 + 4} fontFamily="Inter, sans-serif" fontSize={13} fill={INK}>
                {label}
              </text>
            </g>
          ))}
          <circle cx={250} cy={64} r={5} fill={FOREST} />
        </svg>
        <p style={captionStyle}>Goal in. Routine out.</p>
      </div>
    </div>
  );
}

export function RoutineBuilder() {
  const reduce = useReducedMotion();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const apply = () => setIsMobile(mq.matches);
    apply();
    mq.addEventListener?.("change", apply);
    return () => mq.removeEventListener?.("change", apply);
  }, []);

  const outerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: outerRef, offset: ["start start", "end end"] });

  // ACT 1 — goal drops in (top-down)
  const goalY = useTransform(scrollYProgress, [0, 0.26], [-36, 0]);
  const goalOpacity = useTransform(scrollYProgress, [0, 0.18], [0, 1]);
  const guideLen = useTransform(scrollYProgress, [0.1, 0.3], [0, 1]);
  // green node travels UP the guide as rungs build (ACT 2)
  const nodeY = useTransform(scrollYProgress, [0.3, 0.78], [258, 64]);
  const nodeOpacity = useTransform(scrollYProgress, [0.28, 0.34], [0, 1]);
  // ACT 3 — resolution caption
  const capOpacity = useTransform(scrollYProgress, [0.8, 1], [0, 1]);

  // Always render the compact composed diagram — the pinned scroll version made
  // the page far too long and left an empty gap. Hooks above still run in order.
  return <RoutineBuilderStatic />;

  // eslint-disable-next-line no-unreachable
  return (
    <div ref={outerRef} style={{ height: "160vh", position: "relative" }}>
      <div
        style={{
          position: "sticky",
          top: 0,
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ width: "min(520px, 90vw)" }}>
          <svg viewBox="0 0 500 300" width="100%" aria-hidden="true">
            {/* ACT 1 — goal pill drops in */}
            <motion.g style={{ y: goalY, opacity: goalOpacity }}>
              <rect x={170} y={16} width={160} height={40} rx={20} fill="none" stroke={HAIRLINE} strokeWidth={1.25} />
              <text x={250} y={41} textAnchor="middle" fontFamily='"Instrument Serif", serif' fontStyle="italic" fontSize={21} fill={INK}>
                clearer skin
              </text>
            </motion.g>
            {/* guide line drawing downward */}
            <motion.line x1={250} y1={56} x2={250} y2={258} stroke={HAIRLINE} strokeWidth={1} style={{ pathLength: guideLen }} />
            {/* ACT 2 — rungs build bottom-up */}
            {RUNGS.map((_, i) => (
              <Rung key={i} i={i} p={scrollYProgress} />
            ))}
            {/* migrating forest-green node */}
            <motion.circle cx={250} r={5} fill={FOREST} style={{ cy: nodeY, opacity: nodeOpacity }} />
          </svg>
          {/* ACT 3 — caption resolves */}
          <motion.p style={{ ...captionStyle, opacity: capOpacity }}>Goal in. Routine out.</motion.p>
        </div>
      </div>
    </div>
  );
}
