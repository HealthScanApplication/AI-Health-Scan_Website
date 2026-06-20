import React from "react";
import { ed } from "../../config/editorialTheme";

/**
 * Editorial device frame — a clean ink phone used to present faithful
 * recreations of the HealthScan app screens. The frame is the only place a
 * soft shadow + large radius is allowed (it's a depicted object, not UI chrome).
 */
export function PhoneFrame({
  children,
  width = 318,
  screenBg = "#FFFFFF",
  notch = true,
}: {
  children: React.ReactNode;
  width?: number;
  screenBg?: string;
  /** Draw the dynamic island. Turn OFF when the child is a real screenshot that already includes one. */
  notch?: boolean;
}) {
  return (
    <div style={{ width, maxWidth: "100%", margin: "0 auto" }}>
      <div
        style={{
          position: "relative",
          background: ed.ink,
          borderRadius: 46,
          padding: 9,
          boxShadow: "0 44px 80px -44px rgba(22,20,15,0.5)",
        }}
      >
        {/* side buttons */}
        <div style={{ position: "absolute", left: -2, top: 118, width: 2, height: 30, background: ed.ink, borderRadius: 2 }} />
        <div style={{ position: "absolute", left: -2, top: 162, width: 2, height: 52, background: ed.ink, borderRadius: 2 }} />
        <div style={{ position: "absolute", right: -2, top: 150, width: 2, height: 68, background: ed.ink, borderRadius: 2 }} />
        <div
          style={{
            position: "relative",
            borderRadius: 38,
            overflow: "hidden",
            background: screenBg,
            aspectRatio: "9 / 19.5",
            width: "100%",
          }}
        >
          {/* dynamic island */}
          {notch && (
            <div
              style={{
                position: "absolute",
                top: 10,
                left: "50%",
                transform: "translateX(-50%)",
                width: 84,
                height: 22,
                background: ed.ink,
                borderRadius: 999,
                zIndex: 40,
              }}
            />
          )}
          {children}
        </div>
      </div>
    </div>
  );
}
