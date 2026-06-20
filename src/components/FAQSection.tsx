import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { faqData, categories } from "../constants/faqData";
import { ed, GRO, DISPLAY, kickerStyle, folioStyle, h2Style, deckStyle } from "../config/editorialTheme";

export function FAQSection() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [openItems, setOpenItems] = useState<Set<number>>(new Set([0]));

  const filteredFAQs =
    selectedCategory === "all" ? faqData : faqData.filter((item) => item.category === selectedCategory);

  const toggleItem = (index: number) => {
    const next = new Set(openItems);
    next.has(index) ? next.delete(index) : next.add(index);
    setOpenItems(next);
  };

  return (
    <section id="faq" style={{ background: ed.paperAlt, width: "100%" }}>
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
          <p style={kickerStyle}>Questions</p>
          <p style={folioStyle}>08 / 08</p>
        </div>
        <div style={{ marginTop: "clamp(28px, 4vw, 52px)", maxWidth: 920 }}>
          <h2 style={h2Style}>
            Frequently asked, <span style={{ fontStyle: "italic", color: ed.accent }}>plainly answered</span>.
          </h2>
          <p style={{ ...deckStyle, marginTop: 22, maxWidth: "46ch" }}>
            Everything on features, privacy and the app — and where to reach us if something's missing.
          </p>
        </div>

        {/* Category filter — editorial text links */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "12px 22px", marginTop: "clamp(36px, 4vw, 56px)", paddingBottom: 4 }}>
          {categories.map((category) => {
            const active = selectedCategory === category.id;
            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                style={{
                  fontFamily: GRO,
                  fontSize: 12,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                  background: "none",
                  border: "none",
                  padding: "0 0 4px",
                  cursor: "pointer",
                  color: active ? ed.ink : ed.inkSoft,
                  borderBottom: `1px solid ${active ? ed.accent : "transparent"}`,
                }}
              >
                {category.label}
              </button>
            );
          })}
        </div>

        {/* Q&A list */}
        <div style={{ marginTop: "clamp(32px, 4vw, 48px)", maxWidth: 920, borderTop: `1px solid ${ed.hair}` }}>
          <AnimatePresence initial={false}>
            {filteredFAQs.map((faq, index) => {
              const isOpen = openItems.has(index);
              return (
                <motion.div
                  key={`${selectedCategory}-${index}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  style={{ borderBottom: `1px solid ${ed.hair}` }}
                >
                  <button
                    onClick={() => toggleItem(index)}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      display: "flex",
                      alignItems: "baseline",
                      gap: 18,
                      padding: "26px 0",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    <span style={{ fontFamily: DISPLAY, fontStyle: "italic", fontSize: "1.5rem", lineHeight: 1, color: ed.accent, flexShrink: 0, width: 28 }}>Q.</span>
                    <h3
                      style={{
                        flex: 1,
                        fontFamily: DISPLAY,
                        fontWeight: 400,
                        fontSize: "clamp(1.2rem, 2vw, 1.6rem)",
                        lineHeight: 1.25,
                        letterSpacing: "-0.01em",
                        color: ed.ink,
                        margin: 0,
                      }}
                    >
                      {faq.question}
                    </h3>
                    <span
                      aria-hidden="true"
                      style={{
                        flexShrink: 0,
                        fontFamily: GRO,
                        fontSize: 22,
                        lineHeight: 1,
                        color: ed.inkFaint,
                        transform: isOpen ? "rotate(45deg)" : "none",
                        transition: "transform 280ms cubic-bezier(0.4,0,0.2,1)",
                      }}
                    >
                      +
                    </span>
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        style={{ overflow: "hidden" }}
                      >
                        <p style={{ fontFamily: GRO, fontSize: 16.5, lineHeight: 1.65, color: ed.inkSoft, margin: 0, padding: "0 40px 30px 46px", maxWidth: "62ch" }}>
                          {faq.answer}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Still asking */}
        <div style={{ marginTop: "clamp(48px, 6vw, 80px)", display: "flex", flexWrap: "wrap", alignItems: "center", gap: "14px 16px" }}>
          <p style={{ fontFamily: DISPLAY, fontStyle: "italic", fontSize: "clamp(1.2rem, 2vw, 1.6rem)", color: ed.ink, margin: "0 8px 0 0" }}>Still wondering?</p>
          <a href="mailto:hello@healthscan.live" className="ed-cta">Write to us →</a>
          <a href="https://discord.gg/4QJpFyTD44" target="_blank" rel="noopener noreferrer" className="ed-cta">Ask the community →</a>
        </div>
      </div>
    </section>
  );
}
