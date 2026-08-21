import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

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
        <div style={{ fontSize: 267, fontWeight: 700, color: "#fafafa", fontFamily: "system-ui, sans-serif" }}>H</div>
      </div>
    ),
    { ...size }
  );
}
