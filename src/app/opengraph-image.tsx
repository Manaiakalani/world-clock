import { ImageResponse } from "next/og";
import { siteConfig } from "@/lib/site";

export const alt = siteConfig.title;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// A few representative regions so the card previews what the app actually does.
const CITIES = [
  { city: "San Francisco", time: "6:12 AM" },
  { city: "London", time: "2:12 PM" },
  { city: "Tokyo", time: "11:12 PM" },
];

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "linear-gradient(135deg, #0b1120 0%, #10233f 55%, #0c4a6e 100%)",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <svg width="72" height="72" viewBox="0 0 48 48" fill="none">
            <circle cx="24" cy="24" r="21" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" />
            <ellipse cx="24" cy="24" rx="10" ry="21" stroke="rgba(255,255,255,0.22)" strokeWidth="1" />
            <ellipse cx="24" cy="14" rx="18" ry="4" stroke="rgba(255,255,255,0.18)" strokeWidth="0.75" />
            <line x1="3" y1="24" x2="45" y2="24" stroke="rgba(255,255,255,0.22)" strokeWidth="0.75" />
            <ellipse cx="24" cy="34" rx="18" ry="4" stroke="rgba(255,255,255,0.18)" strokeWidth="0.75" />
            <circle cx="18" cy="16" r="1.5" fill="rgba(74,222,128,0.65)" />
            <circle cx="28" cy="18" r="2" fill="rgba(74,222,128,0.55)" />
            <circle cx="14" cy="26" r="2.5" fill="rgba(74,222,128,0.65)" />
            <circle cx="30" cy="30" r="1.5" fill="rgba(74,222,128,0.55)" />
            <line x1="24" y1="24" x2="16" y2="13" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="24" y1="24" x2="33" y2="14" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="24" cy="24" r="2" fill="white" />
            <circle cx="24" cy="24" r="1" fill="#ef4444" />
          </svg>
          <div
            style={{
              marginLeft: 24,
              fontSize: 34,
              letterSpacing: 6,
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.62)",
            }}
          >
            {siteConfig.name}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 74, fontWeight: 700, lineHeight: 1.08, letterSpacing: -1.5 }}>
            Every teammate&apos;s time,
          </div>
          <div
            style={{
              fontSize: 74,
              fontWeight: 700,
              lineHeight: 1.08,
              letterSpacing: -1.5,
              color: "#7dd3fc",
            }}
          >
            at a glance.
          </div>
          <div
            style={{
              marginTop: 26,
              fontSize: 30,
              lineHeight: 1.4,
              color: "rgba(255,255,255,0.72)",
              maxWidth: 900,
            }}
          >
            {siteConfig.shortDescription}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center" }}>
          {CITIES.map((entry) => (
            <div
              key={entry.city}
              style={{
                display: "flex",
                flexDirection: "column",
                marginRight: 28,
                padding: "16px 28px",
                borderRadius: 18,
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.14)",
              }}
            >
              <div style={{ fontSize: 21, color: "rgba(255,255,255,0.6)" }}>{entry.city}</div>
              <div style={{ fontSize: 34, fontWeight: 600 }}>{entry.time}</div>
            </div>
          ))}
          <div
            style={{
              marginLeft: "auto",
              paddingLeft: 24,
              fontSize: 23,
              whiteSpace: "nowrap",
              color: "rgba(255,255,255,0.45)",
            }}
          >
            No account · No tracking · Open source
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
