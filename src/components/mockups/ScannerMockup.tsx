import { GRO } from "../../config/editorialTheme";
import { PhoneFrame } from "./PhoneFrame";
import heroBackdrop from "../../assets/5f38caf68dd6b8af22362056b70854ea4cf4b933.png";
import { X, Wifi, BarChart3 } from "lucide-react";

/* 100% faithful recreation of the real HealthScan capture screen
   (asset 04f4e7cf…): blurred camera view, white corner brackets, ✕ close,
   Meal | Product segmented toggle, white shutter, gallery thumbnail. */

const sans = GRO;

function CornerBrackets() {
  // A centred frame made of four white L-brackets, with a small barcode glyph.
  const arm = 26;
  const t = 3;
  const col = "#FFFFFF";
  const corner = (s: React.CSSProperties): React.CSSProperties => ({ position: "absolute", width: arm, height: arm, borderColor: col, borderStyle: "solid", borderWidth: 0, ...s });
  return (
    <div style={{ position: "absolute", left: "16%", top: "31%", width: "68%", height: "30%", zIndex: 12 }}>
      <div style={corner({ top: 0, left: 0, borderTopWidth: t, borderLeftWidth: t, borderTopLeftRadius: 6 })} />
      <div style={corner({ top: 0, right: 0, borderTopWidth: t, borderRightWidth: t, borderTopRightRadius: 6 })} />
      <div style={corner({ bottom: 0, left: 0, borderBottomWidth: t, borderLeftWidth: t, borderBottomLeftRadius: 6 })} />
      <div style={corner({ bottom: 0, right: 0, borderBottomWidth: t, borderRightWidth: t, borderBottomRightRadius: 6 })} />
      {/* barcode glyph, bottom-right inside the frame */}
      <div style={{ position: "absolute", right: 6, bottom: 8, display: "flex", gap: 1.5, alignItems: "flex-end", opacity: 0.92 }}>
        {[7, 4, 9, 3, 8, 5, 9, 4, 7].map((h, i) => (
          <span key={i} style={{ width: 1.5, height: h, background: "#fff", display: "block" }} />
        ))}
      </div>
    </div>
  );
}

export function ScannerMockup({ width }: { width?: number }) {
  return (
    <PhoneFrame width={width} screenBg="#0d0c0a">
      <div style={{ position: "absolute", inset: 0, fontFamily: sans, overflow: "hidden" }}>
        {/* camera view */}
        <img src={heroBackdrop} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: "brightness(0.82) saturate(1.05)" }} />
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(120% 70% at 50% 45%, rgba(0,0,0,0) 40%, rgba(0,0,0,0.4) 100%)" }} />

        {/* status bar */}
        <div style={{ position: "absolute", top: 15, left: 0, right: 0, padding: "0 26px 0 30px", display: "flex", justifyContent: "space-between", alignItems: "center", color: "#fff", zIndex: 30 }}>
          <span style={{ fontSize: 13, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>9:41</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
            {/* cellular */}
            <span style={{ display: "inline-flex", alignItems: "flex-end", gap: 1.5, height: 10 }}>
              {[4, 6, 8, 10].map((h, i) => <span key={i} style={{ width: 2.5, height: h, background: "#fff", borderRadius: 1, display: "block" }} />)}
            </span>
            <Wifi size={14} color="#fff" strokeWidth={2.4} />
            {/* battery */}
            <span style={{ width: 22, height: 11, border: "1.4px solid rgba(255,255,255,0.85)", borderRadius: 3, padding: 1.4, display: "inline-flex" }}>
              <span style={{ flex: 1, background: "#fff", borderRadius: 1 }} />
            </span>
          </span>
        </div>

        {/* close */}
        <div style={{ position: "absolute", top: 52, right: 18, width: 30, height: 30, borderRadius: 999, background: "rgba(20,18,15,0.45)", display: "inline-flex", alignItems: "center", justifyContent: "center", zIndex: 30 }}>
          <X size={16} color="#fff" strokeWidth={2.4} />
        </div>

        <CornerBrackets />

        {/* Meal | Product segmented toggle */}
        <div style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", bottom: 116, display: "flex", background: "rgba(255,255,255,0.22)", borderRadius: 999, padding: 3, zIndex: 30, backdropFilter: "blur(6px)" }}>
          <span style={{ padding: "7px 22px", fontSize: 13, fontWeight: 600, color: "#fff" }}>Meal</span>
          <span style={{ padding: "7px 22px", fontSize: 13, fontWeight: 600, color: "#16140F", background: "#fff", borderRadius: 999 }}>Product</span>
        </div>

        {/* gallery thumb + shutter */}
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 34, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 30 }}>
          <span style={{ position: "absolute", left: 24, width: 40, height: 40, borderRadius: 9, overflow: "hidden", border: "1.5px solid rgba(255,255,255,0.7)" }}>
            <img src={heroBackdrop} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </span>
          {/* shutter */}
          <span style={{ width: 62, height: 62, borderRadius: 999, border: "3px solid rgba(255,255,255,0.55)", display: "inline-flex", alignItems: "center", justifyContent: "center", padding: 4 }}>
            <span style={{ width: "100%", height: "100%", borderRadius: 999, background: "#fff", display: "block" }} />
          </span>
        </div>

        {/* home indicator */}
        <div style={{ position: "absolute", bottom: 9, left: "50%", transform: "translateX(-50%)", width: 110, height: 4, borderRadius: 999, background: "rgba(255,255,255,0.7)", zIndex: 30 }} />
      </div>
    </PhoneFrame>
  );
}
