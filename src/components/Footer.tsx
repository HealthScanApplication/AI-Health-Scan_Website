import {
  Twitter,
  Instagram,
  Facebook,
  ArrowUpRight,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ed, GRO, DISPLAY } from "../config/editorialTheme";
import { APP_STORE_URL } from "../config/appLinks";

interface FooterProps {}

// Brass — the editorial ochre, lifted for legibility on the dark ink spread.
const brass = "#C49A5E";

// ---- brand glyphs ----
function AppleMark({ size = 14 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden="true" style={{ marginBottom: -2 }}>
      <path d="M17.05 12.54c-.02-2.06 1.68-3.05 1.76-3.1-.96-1.4-2.46-1.6-3-1.62-1.27-.13-2.49.75-3.14.75-.65 0-1.65-.73-2.71-.71-1.39.02-2.68.81-3.4 2.06-1.45 2.52-.37 6.25 1.04 8.3.69 1 1.51 2.13 2.58 2.09 1.04-.04 1.43-.67 2.69-.67 1.25 0 1.61.67 2.71.65 1.12-.02 1.83-1.02 2.51-2.03.79-1.16 1.12-2.29 1.13-2.35-.02-.01-2.17-.83-2.19-3.3zM15 5.88c.57-.69.96-1.65.85-2.61-.83.03-1.83.55-2.42 1.24-.53.61-.99 1.59-.87 2.53.93.07 1.87-.47 2.44-1.16z" />
    </svg>
  );
}

const TikTokLogo = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
  </svg>
);

const DiscordLogo = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
  </svg>
);

const TelegramLogo = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.568 8.16l-1.58 7.44c-.12.539-.432.667-.864.416l-2.388-1.764-1.152 1.116c-.128.128-.236.236-.484.236l.172-2.436 4.456-4.028c.196-.172-.04-.268-.308-.096L9.788 13.22l-2.304-.724c-.5-.156-.508-.5.108-.74L19.544 7.368c.42-.156.78.096.656.792z" />
  </svg>
);

const LinktreeLogo = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
    <path d="M12 3L20 12L12 21L4 12L12 3Z" />
    <path d="M8 12H16" />
    <path d="M12 8V16" />
  </svg>
);

const QUICK_LINKS = [
  { label: "Routines", href: "#routines" },
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Leaderboard", href: "#leaderboard" },
  { label: "FAQ", href: "#faq" },
];

const SOCIALS = [
  { label: "Discord", href: "https://discord.gg/4QJpFyTD44", Icon: DiscordLogo },
  { label: "TikTok", href: "https://www.tiktok.com/@healthscan.live", Icon: TikTokLogo },
  { label: "Telegram", href: "https://t.me/healthscanai", Icon: TelegramLogo },
  { label: "X / Twitter", href: "https://twitter.com/healthscanlive", Icon: Twitter },
  { label: "Instagram", href: "https://www.instagram.com/healthscan.live/", Icon: Instagram },
  { label: "Facebook", href: "https://www.facebook.com/profile.php?id=61579058123361", Icon: Facebook },
  { label: "Linktree", href: "https://linktr.ee/healthscan", Icon: LinktreeLogo },
];

// shared editorial type fragments (on the dark spread)
const kicker: React.CSSProperties = {
  fontFamily: GRO,
  fontSize: 11,
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.2em",
  color: brass,
  margin: 0,
};
const colHead: React.CSSProperties = {
  fontFamily: GRO,
  fontSize: 11,
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.18em",
  color: ed.onDarkSoft,
  margin: "0 0 20px",
};
const folio: React.CSSProperties = {
  fontFamily: GRO,
  fontSize: 11,
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.2em",
  color: "rgba(244,241,234,0.4)",
  margin: 0,
};

// underline-on-hover for list links
const hoverOn = (e: React.MouseEvent<HTMLAnchorElement>) => {
  e.currentTarget.style.color = ed.onDark;
  e.currentTarget.style.textDecorationColor = brass;
};
const hoverOff = (e: React.MouseEvent<HTMLAnchorElement>) => {
  e.currentTarget.style.color = ed.onDarkSoft;
  e.currentTarget.style.textDecorationColor = "transparent";
};

const listLink: React.CSSProperties = {
  fontFamily: GRO,
  fontSize: 15,
  color: ed.onDarkSoft,
  textDecoration: "underline",
  textDecorationColor: "transparent",
  textUnderlineOffset: 4,
  transition: "color 200ms ease, text-decoration-color 200ms ease",
  display: "inline-flex",
  alignItems: "center",
  gap: 11,
};

export function Footer({}: FooterProps = {}) {
  const [contactForm, setContactForm] = useState({ email: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const year = new Date().getFullYear();

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactForm.email || !contactForm.message) {
      toast.error("Please add your email and a message");
      return;
    }
    setIsSubmitting(true);
    try {
      const subject = encodeURIComponent("Contact from HealthScan");
      const body = encodeURIComponent(`From: ${contactForm.email}\n\nMessage:\n${contactForm.message}`);
      window.open(`mailto:hello@healthscan.live?subject=${subject}&body=${body}`);
      toast.success("Opening your email client…");
      setContactForm({ email: "", message: "" });
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const underInput: React.CSSProperties = {
    width: "100%",
    fontFamily: GRO,
    fontSize: 15,
    color: ed.onDark,
    background: "transparent",
    border: "none",
    borderBottom: `1px solid ${ed.onDarkHair}`,
    borderRadius: 0,
    padding: "10px 0",
    outline: "none",
  };

  return (
    <footer
      style={{
        background: ed.dark,
        color: ed.onDark,
        paddingTop: "clamp(72px, 9vw, 128px)",
        paddingBottom: "clamp(36px, 5vw, 64px)",
        paddingLeft: "clamp(20px, 5vw, 72px)",
        paddingRight: "clamp(20px, 5vw, 72px)",
      }}
    >
      <div style={{ maxWidth: 1320, margin: "0 auto" }}>
        {/* Masthead band */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            borderTop: `1px solid ${ed.onDarkHair}`,
            paddingTop: 16,
            flexWrap: "wrap",
            gap: 8,
          }}
        >
          <p style={kicker}>The Routine Issue — Issue 01</p>
          <p style={folio}>Colophon · 08 / 08</p>
        </div>

        {/* Sign-off + primary CTAs */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            flexWrap: "wrap",
            gap: 32,
            marginTop: "clamp(40px, 6vw, 72px)",
            marginBottom: "clamp(56px, 7vw, 96px)",
          }}
        >
          <h2
            style={{
              fontFamily: DISPLAY,
              fontWeight: 380,
              fontSize: "clamp(2.4rem, 5vw, 4.4rem)",
              lineHeight: 0.98,
              letterSpacing: "-0.03em",
              color: ed.onDark,
              margin: 0,
              maxWidth: "16ch",
            }}
          >
            Build a routine for <span style={{ fontStyle: "italic", color: brass }}>any goal</span>.
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: 18, alignItems: "flex-start" }}>
            <p style={{ ...kicker, color: "rgba(244,241,234,0.46)" }}>Out now on iOS — Android coming soon</p>
            <a
              href={APP_STORE_URL || undefined}
              target={APP_STORE_URL ? "_blank" : undefined}
              rel="noopener noreferrer"
              className="ed-cta-dark"
            >
              <AppleMark />Try HealthScan&nbsp;→
            </a>
            <a
              href="https://healthscan.gumroad.com/coffee"
              target="_blank"
              rel="noopener noreferrer"
              className="ed-cta-dark"
            >
              Back the project <ArrowUpRight className="w-3.5 h-3.5" strokeWidth={2} />
            </a>
          </div>
        </div>

        {/* Colophon columns */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "48px 56px",
            borderTop: `1px solid ${ed.onDarkHair}`,
            paddingTop: "clamp(40px, 5vw, 64px)",
          }}
        >
          {/* Brand + manifesto */}
          <div style={{ flex: "2.2 1 320px", minWidth: 280 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 22 }}>
              <span style={{ fontFamily: DISPLAY, fontSize: "1.85rem", fontWeight: 400, letterSpacing: "-0.02em", color: ed.onDark }}>
                HealthScan
              </span>
              <span
                style={{
                  fontFamily: GRO,
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  color: brass,
                  border: `1px solid ${ed.onDarkHair}`,
                  borderRadius: 1,
                  padding: "3px 7px",
                }}
              >
                Beta
              </span>
            </div>
            <p
              style={{
                fontFamily: DISPLAY,
                fontStyle: "italic",
                fontSize: "clamp(1.15rem, 1.6vw, 1.4rem)",
                lineHeight: 1.4,
                color: "rgba(244,241,234,0.8)",
                margin: "0 0 22px",
                maxWidth: "30ch",
              }}
            >
              A personalized routine for any goal — habits, meals and activity in one place, with a food scanner that knows what fits.
            </p>
            <p style={{ fontFamily: GRO, fontSize: 14, lineHeight: 1.6, color: ed.onDarkSoft, margin: 0, maxWidth: "42ch" }}>
              Pick a goal, follow the daily to-dos, scan any food to see what helps, and shop everything your routine needs in one tap.
            </p>
          </div>

          {/* Index */}
          <div style={{ flex: "1 1 150px", minWidth: 140 }}>
            <h3 style={colHead}>Index</h3>
            <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 13 }}>
              {QUICK_LINKS.map((l) => (
                <li key={l.label}>
                  <a href={l.href} style={listLink} onMouseEnter={hoverOn} onMouseLeave={hoverOff}>
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Connect */}
          <div style={{ flex: "1 1 170px", minWidth: 150 }}>
            <h3 style={colHead}>Connect</h3>
            <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 13 }}>
              {SOCIALS.map(({ label, href, Icon }) => (
                <li key={label}>
                  <a href={href} target="_blank" rel="noopener noreferrer" style={listLink} onMouseEnter={hoverOn} onMouseLeave={hoverOff}>
                    <span style={{ color: brass, display: "inline-flex", width: 16, justifyContent: "center" }}>
                      <Icon size={16} />
                    </span>
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Write to us */}
          <div style={{ flex: "1.6 1 260px", minWidth: 240 }}>
            <h3 style={colHead}>Write to us</h3>
            <form onSubmit={handleContactSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <input
                type="email"
                value={contactForm.email}
                onChange={(e) => setContactForm((p) => ({ ...p, email: e.target.value }))}
                placeholder="you@email.com"
                style={underInput}
                required
              />
              <textarea
                value={contactForm.message}
                onChange={(e) => setContactForm((p) => ({ ...p, message: e.target.value }))}
                placeholder="How can we help?"
                rows={2}
                style={{ ...underInput, resize: "none" }}
                required
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className="ed-cta-dark"
                style={{ alignSelf: "flex-start", marginTop: 4 }}
              >
                {isSubmitting ? "Sending…" : "Send message →"}
              </button>
            </form>
          </div>
        </div>

        {/* Bottom bar / colophon line */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            flexWrap: "wrap",
            gap: "16px 28px",
            borderTop: `1px solid ${ed.onDarkHair}`,
            marginTop: "clamp(48px, 6vw, 80px)",
            paddingTop: 24,
          }}
        >
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 18 }}>
            {["Privacy", "Terms", "Cookies"].map((l) => (
              <a
                key={l}
                href={`#${l.toLowerCase()}`}
                style={{ ...listLink, fontSize: 12, letterSpacing: "0.06em", textTransform: "uppercase" }}
                onMouseEnter={hoverOn}
                onMouseLeave={hoverOff}
              >
                {l}
              </a>
            ))}
          </div>

          <p style={{ fontFamily: GRO, fontSize: 12, color: "rgba(244,241,234,0.4)", margin: 0, letterSpacing: "0.02em" }}>
            {`© ${year} HealthScan — Set in Fraunces & Archivo. Made for a healthier world.`}
          </p>
        </div>
      </div>
    </footer>
  );
}
