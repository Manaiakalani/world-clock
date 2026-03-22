import { ImageResponse } from "next/og";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 64,
          height: 64,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0ea5e9 100%)",
          borderRadius: 14,
        }}
      >
        {/* Globe + clock SVG */}
        <svg
          width="48"
          height="48"
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Globe circle */}
          <circle cx="24" cy="24" r="21" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />

          {/* Globe meridians */}
          <ellipse cx="24" cy="24" rx="10" ry="21" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
          <ellipse cx="24" cy="24" rx="18" ry="21" stroke="rgba(255,255,255,0.15)" strokeWidth="0.75" />

          {/* Globe parallels */}
          <ellipse cx="24" cy="14" rx="18" ry="4" stroke="rgba(255,255,255,0.15)" strokeWidth="0.75" />
          <line x1="3" y1="24" x2="45" y2="24" stroke="rgba(255,255,255,0.2)" strokeWidth="0.75" />
          <ellipse cx="24" cy="34" rx="18" ry="4" stroke="rgba(255,255,255,0.15)" strokeWidth="0.75" />

          {/* Land masses — simplified dots */}
          <circle cx="18" cy="16" r="1.5" fill="rgba(74,222,128,0.6)" />
          <circle cx="28" cy="18" r="2" fill="rgba(74,222,128,0.5)" />
          <circle cx="33" cy="22" r="1.5" fill="rgba(74,222,128,0.5)" />
          <circle cx="14" cy="26" r="2.5" fill="rgba(74,222,128,0.6)" />
          <circle cx="30" cy="30" r="1.5" fill="rgba(74,222,128,0.5)" />
          <circle cx="22" cy="22" r="1" fill="rgba(74,222,128,0.4)" />

          {/* Clock hour hand (pointing to ~10) */}
          <line
            x1="24"
            y1="24"
            x2="16"
            y2="13"
            stroke="white"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* Clock minute hand (pointing to ~2) */}
          <line
            x1="24"
            y1="24"
            x2="33"
            y2="14"
            stroke="white"
            strokeWidth="1.5"
            strokeLinecap="round"
          />

          {/* Center dot */}
          <circle cx="24" cy="24" r="2" fill="white" />
          <circle cx="24" cy="24" r="1" fill="#ef4444" />
        </svg>
      </div>
    ),
    { ...size }
  );
}
