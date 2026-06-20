"use client";

import { useState } from "react";
import { ed, GRO, DISPLAY, kickerStyle } from "../config/editorialTheme";

const brass = "#C49A5E";
const sage = "#8FB57E";
const clay = "#CC8C6A";

interface NutrientData { name: string; amount: string; unit: string; dailyValue?: string; status: "low" | "adequate" | "high"; }
interface PollutantData { name: string; detected: string; safeLimit: string; unit: string; riskLevel: "low" | "moderate" | "high"; effect: string; }
interface ScanExample { id: string; product: string; scanTime: string; healthScore: number; category: "food" | "supplement" | "drink"; nutrients: NutrientData[]; pollutants: PollutantData[]; }

const scanExamples: ScanExample[] = [
  {
    id: "1",
    product: "Organic baby-food purée",
    scanTime: "0.7s",
    healthScore: 82,
    category: "food",
    nutrients: [
      { name: "Vitamin A", amount: "850", unit: "μg", dailyValue: "125%", status: "high" },
      { name: "Iron", amount: "1.8", unit: "mg", dailyValue: "18%", status: "adequate" },
      { name: "Vitamin C", amount: "12", unit: "mg", dailyValue: "80%", status: "adequate" },
    ],
    pollutants: [
      { name: "Cadmium", detected: "0.02", safeLimit: "0.005", unit: "mg/kg", riskLevel: "moderate", effect: "Public-safety databases recommend limiting regular intake at elevated levels." },
      { name: "Arsenic", detected: "0.008", safeLimit: "0.01", unit: "mg/kg", riskLevel: "low", effect: "Flagged as a contaminant to limit at high, prolonged exposure." },
    ],
  },
  {
    id: "2",
    product: "Daily multivitamin",
    scanTime: "0.9s",
    healthScore: 91,
    category: "supplement",
    nutrients: [
      { name: "Vitamin D3", amount: "1000", unit: "IU", dailyValue: "250%", status: "high" },
      { name: "B12", amount: "6", unit: "μg", dailyValue: "250%", status: "high" },
      { name: "Folate", amount: "400", unit: "μg", dailyValue: "100%", status: "adequate" },
      { name: "Zinc", amount: "11", unit: "mg", dailyValue: "100%", status: "adequate" },
    ],
    pollutants: [
      { name: "Lead", detected: "0.3", safeLimit: "0.5", unit: "μg", riskLevel: "low", effect: "Within public-safety limits; tracked over time as cumulative exposure." },
    ],
  },
  {
    id: "3",
    product: "Salmon open sandwich",
    scanTime: "1.1s",
    healthScore: 74,
    category: "food",
    nutrients: [
      { name: "Omega-3 EPA", amount: "1200", unit: "mg", dailyValue: "75%", status: "high" },
      { name: "Protein", amount: "28", unit: "g", dailyValue: "56%", status: "high" },
      { name: "Vitamin B12", amount: "3.2", unit: "μg", dailyValue: "133%", status: "high" },
      { name: "Selenium", amount: "42", unit: "μg", dailyValue: "76%", status: "adequate" },
    ],
    pollutants: [
      { name: "Methylmercury", detected: "0.14", safeLimit: "0.1", unit: "mg/kg", riskLevel: "moderate", effect: "Keep weekly oily-fish servings moderate; tracked against your limit." },
      { name: "Parasite risk", detected: "Present", safeLimit: "None", unit: "", riskLevel: "high", effect: "Cook to 63°C internal, or freeze, to remove the risk." },
    ],
  },
];

const catLabel: Record<string, string> = { food: "Food", supplement: "Supplement", drink: "Drink" };

export function FeatureShowcase() {
  const [active, setActive] = useState<ScanExample>(scanExamples[0]);

  return (
    <section style={{ background: ed.dark, color: ed.onDark, width: "100%" }}>
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
        <div style={{ borderTop: `1px solid ${ed.onDarkHair}`, paddingTop: 16, display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 8 }}>
          <p style={{ ...kickerStyle, color: brass }}>Inside a scan</p>
          <p style={{ ...kickerStyle, color: "rgba(244,241,234,0.4)" }}>05 / 08</p>
        </div>
        <div style={{ marginTop: "clamp(28px, 4vw, 52px)", maxWidth: 960 }}>
          <h2 style={{ fontFamily: DISPLAY, fontWeight: 380, fontSize: "clamp(2.2rem, 4vw, 3.6rem)", lineHeight: 1.02, letterSpacing: "-0.03em", color: ed.onDark, margin: 0 }}>
            What one photo <span style={{ fontStyle: "italic", color: brass }}>tells you</span>.
          </h2>
          <p style={{ fontFamily: DISPLAY, fontStyle: "italic", fontSize: "clamp(1.15rem, 1.8vw, 1.5rem)", lineHeight: 1.4, color: ed.onDarkSoft, marginTop: 22, maxWidth: "46ch" }}>
            Nutrients worth having, ingredients worth watching, and a single score — read straight off the label.
          </p>
        </div>

        {/* Spread */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "48px 72px", marginTop: "clamp(48px, 7vw, 96px)", alignItems: "flex-start" }}>
          {/* Selector */}
          <div style={{ flex: "1 1 280px", minWidth: 260 }}>
            <p style={{ ...kickerStyle, color: "rgba(244,241,234,0.4)", marginBottom: 20 }}>Pick a sample</p>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {scanExamples.map((ex, i) => {
                const on = ex.id === active.id;
                return (
                  <button
                    key={ex.id}
                    onClick={() => setActive(ex)}
                    style={{
                      textAlign: "left",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "baseline",
                      gap: 16,
                      padding: "18px 0",
                      borderTop: i === 0 ? "none" : `1px solid ${ed.onDarkHair}`,
                    }}
                  >
                    <span style={{ fontFamily: DISPLAY, fontSize: "1.3rem", color: on ? brass : "rgba(244,241,234,0.4)", lineHeight: 1, flexShrink: 0 }}>{String(i + 1).padStart(2, "0")}</span>
                    <span style={{ flex: 1 }}>
                      <span style={{ display: "block", fontFamily: GRO, fontSize: 16, fontWeight: 600, color: on ? ed.onDark : ed.onDarkSoft, borderBottom: on ? `1px solid ${brass}` : "1px solid transparent", paddingBottom: 2 }}>{ex.product}</span>
                      <span style={{ display: "block", fontFamily: GRO, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(244,241,234,0.4)", marginTop: 6 }}>{catLabel[ex.category]} · analysed in {ex.scanTime}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Readout */}
          <div style={{ flex: "1.4 1 420px", minWidth: 300 }}>
            {/* Score */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", paddingBottom: 22, borderBottom: `1px solid ${ed.onDarkHair}` }}>
              <div>
                <div style={{ fontFamily: DISPLAY, fontSize: "clamp(1.5rem, 2.4vw, 2rem)", fontWeight: 400, color: ed.onDark, letterSpacing: "-0.02em" }}>{active.product}</div>
                <div style={{ fontFamily: GRO, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(244,241,234,0.4)", marginTop: 8 }}>Health score</div>
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 2, color: brass, fontVariantNumeric: "tabular-nums" }}>
                <span style={{ fontFamily: DISPLAY, fontSize: "clamp(2.6rem, 5vw, 4rem)", fontWeight: 360, lineHeight: 0.9 }}>{active.healthScore}</span>
                <span style={{ fontFamily: GRO, fontSize: 15, color: "rgba(244,241,234,0.45)" }}>/100</span>
              </div>
            </div>

            {/* Nutrients */}
            <p style={{ ...kickerStyle, color: sage, margin: "26px 0 6px" }}>Nutrients detected</p>
            <div>
              {active.nutrients.map((n) => (
                <div key={n.name} style={{ display: "flex", alignItems: "baseline", gap: 12, padding: "12px 0", borderBottom: `1px solid ${ed.onDarkHair}` }}>
                  <span style={{ width: 6, height: 6, borderRadius: 999, background: sage, flexShrink: 0, transform: "translateY(-2px)" }} />
                  <span style={{ flex: 1, fontFamily: GRO, fontSize: 15.5, color: ed.onDark }}>{n.name}</span>
                  {n.dailyValue && <span style={{ fontFamily: GRO, fontSize: 12, color: "rgba(244,241,234,0.45)" }}>{n.dailyValue} DV</span>}
                  <span style={{ fontFamily: GRO, fontSize: 15, fontWeight: 600, color: ed.onDark, fontVariantNumeric: "tabular-nums", minWidth: 64, textAlign: "right" }}>{n.amount}{n.unit}</span>
                </div>
              ))}
            </div>

            {/* Pollutants */}
            <p style={{ ...kickerStyle, color: clay, margin: "30px 0 6px" }}>Things to watch</p>
            <div>
              {active.pollutants.map((p) => (
                <div key={p.name} style={{ padding: "14px 0", borderBottom: `1px solid ${ed.onDarkHair}`, borderLeft: `2px solid ${clay}`, paddingLeft: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
                    <span style={{ fontFamily: GRO, fontSize: 15.5, fontWeight: 600, color: ed.onDark }}>{p.name}</span>
                    <span style={{ fontFamily: GRO, fontSize: 13, color: clay, fontVariantNumeric: "tabular-nums", textAlign: "right" }}>
                      {p.detected}{p.unit}{p.safeLimit !== "None" ? ` · limit ${p.safeLimit}${p.unit}` : ""}
                    </span>
                  </div>
                  <p style={{ fontFamily: GRO, fontSize: 13.5, lineHeight: 1.5, color: "rgba(244,241,234,0.55)", margin: "6px 0 0" }}>{p.effect}</p>
                </div>
              ))}
            </div>

            <p style={{ fontFamily: GRO, fontSize: 12, lineHeight: 1.6, color: "rgba(244,241,234,0.4)", marginTop: 22 }}>
              Informational estimates from public food-safety data — not medical advice.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
