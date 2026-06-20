"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { ed, GRO, DISPLAY } from "../config/editorialTheme";
import { EASE_OUT } from "../config/motionTokens";
import { CATEGORY_TINTS, buildGroups, itemIcon, type ProtocolItem } from "../config/protocolCategories";

interface Goal {
  key: string;
  label: string;
  title: string;
  tag: string;
  items: ProtocolItem[];
}

const GOALS: Goal[] = [
  {
    key: "lose-weight",
    label: "Lose weight",
    title: "The weight-loss protocol",
    tag: "Stay full, cut hidden sugar, move a little more.",
    items: [
      { name: "Berberine", item_type: "supplement", meta: "with meals" },
      { name: "Green tea extract", item_type: "supplement", meta: "morning" },
      { name: "High-protein breakfast", item_type: "consume", meta: "08:00" },
      { name: "Black coffee", item_type: "consume", meta: "07:30" },
      { name: "2 L water", item_type: "consume", meta: "through the day" },
      { name: "10,000 steps", item_type: "activity", meta: "before dinner" },
      { name: "Strength session", item_type: "activity", meta: "20 min" },
      { name: "Morning sunlight", item_type: "activity", meta: "10 min" },
      { name: "Sleep hygiene routine", item_type: "activity", meta: "22:15" },
    ],
  },
  {
    key: "gain-weight",
    label: "Gain weight",
    title: "The healthy weight-gain protocol",
    tag: "A clean calorie surplus and progressive lifting.",
    items: [
      { name: "Creatine 5 g", item_type: "supplement", meta: "daily" },
      { name: "Whey protein", item_type: "supplement", meta: "post-workout" },
      { name: "Calorie-surplus breakfast", item_type: "consume", meta: "08:00" },
      { name: "Mass-gainer shake", item_type: "consume", meta: "11:00" },
      { name: "Three full meals", item_type: "consume", meta: "+2 snacks" },
      { name: "Progressive-overload lifting", item_type: "activity", meta: "45 min" },
      { name: "Mobility stretch", item_type: "activity", meta: "10 min" },
      { name: "8-hour sleep target", item_type: "activity", meta: "recovery" },
    ],
  },
  {
    key: "skin",
    label: "Clearer skin",
    title: "The clearer-skin protocol",
    tag: "Calm breakouts from the inside out.",
    items: [
      { name: "Zinc", item_type: "supplement", meta: "with lunch" },
      { name: "Omega-3", item_type: "supplement", meta: "with lunch" },
      { name: "Collagen", item_type: "supplement", meta: "morning" },
      { name: "Low-glycemic breakfast", item_type: "consume", meta: "08:00" },
      { name: "2 L water", item_type: "consume", meta: "through the day" },
      { name: "Green tea", item_type: "consume", meta: "afternoon" },
      { name: "AM / PM skincare", item_type: "activity", meta: "twice daily" },
      { name: "Morning sunlight", item_type: "activity", meta: "10 min" },
      { name: "Sleep hygiene routine", item_type: "activity", meta: "22:15" },
    ],
  },
  {
    key: "gut",
    label: "Gut health",
    title: "The gut-health protocol",
    tag: "Feed good bacteria, dodge the additives.",
    items: [
      { name: "Probiotic", item_type: "supplement", meta: "morning" },
      { name: "L-glutamine", item_type: "supplement", meta: "empty stomach" },
      { name: "Fibre + fermented breakfast", item_type: "consume", meta: "08:00" },
      { name: "Prebiotic snack", item_type: "consume", meta: "15:00" },
      { name: "Bone broth", item_type: "consume", meta: "evening" },
      { name: "Post-meal walk", item_type: "activity", meta: "10 min" },
      { name: "Breathwork", item_type: "activity", meta: "5 min" },
      { name: "Wind-down routine", item_type: "activity", meta: "22:00" },
    ],
  },
  {
    key: "energy",
    label: "More energy",
    title: "The daily-energy protocol",
    tag: "Steady energy all day — no 3 pm crash.",
    items: [
      { name: "Magnesium glycinate", item_type: "supplement", meta: "evening" },
      { name: "Vitamin D3", item_type: "supplement", meta: "morning" },
      { name: "Balanced breakfast", item_type: "consume", meta: "08:00" },
      { name: "Electrolytes", item_type: "consume", meta: "morning" },
      { name: "Matcha", item_type: "consume", meta: "10:00" },
      { name: "Morning sunlight", item_type: "activity", meta: "10 min" },
      { name: "Daily walk", item_type: "activity", meta: "20 min" },
      { name: "Sleep hygiene routine", item_type: "activity", meta: "22:15" },
    ],
  },
  {
    key: "muscle",
    label: "Build muscle",
    title: "The muscle-building protocol",
    tag: "Train hard, fuel right, recover well.",
    items: [
      { name: "Creatine 5 g", item_type: "supplement", meta: "daily" },
      { name: "Whey protein", item_type: "supplement", meta: "post-workout" },
      { name: "High-protein breakfast", item_type: "consume", meta: "08:00" },
      { name: "Post-workout shake", item_type: "consume", meta: "after lifting" },
      { name: "1.6 g/kg protein", item_type: "consume", meta: "daily target" },
      { name: "Progressive-overload lifting", item_type: "activity", meta: "60 min" },
      { name: "Sauna session", item_type: "activity", meta: "15 min" },
      { name: "8-hour sleep target", item_type: "activity", meta: "recovery" },
    ],
  },
  {
    key: "women",
    label: "Women's health",
    title: "The women's-health protocol",
    tag: "Eat and move in sync with your cycle.",
    items: [
      { name: "Iron", item_type: "supplement", meta: "with vit C" },
      { name: "Calcium + vitamin D", item_type: "supplement", meta: "daily" },
      { name: "Magnesium", item_type: "supplement", meta: "evening" },
      { name: "Iron-rich breakfast", item_type: "consume", meta: "08:00" },
      { name: "2 L water", item_type: "consume", meta: "through the day" },
      { name: "Cycle-synced movement", item_type: "activity", meta: "30 min" },
      { name: "Meditation", item_type: "activity", meta: "10 min" },
      { name: "Wind-down routine", item_type: "activity", meta: "22:00" },
    ],
  },
  {
    key: "kids",
    label: "Healthy kids",
    title: "The healthy-kids protocol",
    tag: "Easy, tasty meals they'll actually eat.",
    items: [
      { name: "Kids' multivitamin", item_type: "supplement", meta: "breakfast" },
      { name: "Balanced lunchbox", item_type: "consume", meta: "school" },
      { name: "Colourful plate", item_type: "consume", meta: "dinner" },
      { name: "Water (no fizzy)", item_type: "consume", meta: "all day" },
      { name: "60 min active play", item_type: "activity", meta: "outdoors" },
      { name: "Family meal together", item_type: "activity", meta: "evening" },
      { name: "Consistent bedtime", item_type: "activity", meta: "wind-down" },
    ],
  },
];

function ProtocolGroups({ items }: { items: ProtocolItem[] }) {
  const groups = buildGroups(items);
  return (
    <div className="grid sm:grid-cols-2" style={{ gap: 12 }}>
      {groups.map(({ cat, items: catItems }) => {
        const tint = CATEGORY_TINTS[cat];
        const HeadIcon = tint.Icon;
        return (
          <div key={cat} style={{ background: tint.bg, borderRadius: 14, padding: "12px 14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 10 }}>
              <HeadIcon className="w-3.5 h-3.5" style={{ color: tint.fg }} strokeWidth={2} />
              <span style={{ fontFamily: GRO, fontSize: 10.5, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: tint.fg }}>
                {tint.label}
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {catItems.map((item, i) => {
                const { Icon, color } = itemIcon(item);
                return (
                  <div
                    key={i}
                    style={{
                      background: "#FFFFFF",
                      borderRadius: 12,
                      padding: "8px 10px",
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
                    <span style={{ width: 34, height: 34, borderRadius: 8, background: tint.bg, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Icon className="w-[18px] h-[18px]" style={{ color }} strokeWidth={1.8} />
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: GRO, fontSize: 14, fontWeight: 500, color: tint.fg, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {item.name}
                      </div>
                      {item.meta && (
                        <div style={{ fontFamily: GRO, fontSize: 11, color: "#9CA3AF", marginTop: 1 }}>{item.meta}</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function GoalToggle() {
  const [active, setActive] = useState(GOALS[0].key);
  const goal = GOALS.find((g) => g.key === active) || GOALS[0];

  return (
    <div>
      {/* Goal selector — editorial pills */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {GOALS.map((g) => {
          const on = g.key === active;
          return (
            <button
              key={g.key}
              onClick={() => setActive(g.key)}
              style={{
                fontFamily: GRO,
                fontSize: 12,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                padding: "9px 15px",
                borderRadius: 2,
                cursor: "pointer",
                background: on ? ed.ink : "transparent",
                color: on ? ed.paper : ed.inkSoft,
                border: `1px solid ${on ? ed.ink : ed.hair}`,
                transition: "background-color 200ms ease, color 200ms ease",
              }}
            >
              {g.label}
            </button>
          );
        })}
      </div>

      {/* The selected protocol, grouped exactly like the app */}
      <motion.div
        key={goal.key}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: EASE_OUT }}
        style={{ marginTop: 32 }}
      >
        <h3 style={{ fontFamily: DISPLAY, fontWeight: 400, fontSize: "clamp(1.5rem, 2.4vw, 2rem)", letterSpacing: "-0.02em", color: ed.ink, margin: 0 }}>
          {goal.title}
        </h3>
        <p style={{ fontFamily: GRO, fontSize: 16, color: ed.inkSoft, margin: "8px 0 24px", maxWidth: "52ch" }}>{goal.tag}</p>
        <ProtocolGroups items={goal.items} />
      </motion.div>
    </div>
  );
}
