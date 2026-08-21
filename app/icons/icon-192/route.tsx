import { ImageResponse } from "next/og";

export const size = { width: 192, height: 192 };
export const contentType = "image/png";

// Generated at request time via Satori (bundled with Next.js) — no image
// binary or design asset needed for a placeholder app icon. Padding keeps
// the glyph inside the ~80% "safe zone" OSes use when cropping a maskable
// icon to a circle/rounded-square.
export function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#18181b",
        }}
      >
        <div style={{ fontSize: 100, fontWeight: 700, color: "#fafafa", fontFamily: "system-ui, sans-serif" }}>M</div>
      </div>
    ),
    { ...size }
  );
}
