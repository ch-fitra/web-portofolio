import { ImageResponse } from "next/og";
import { getProfile } from "@/lib/content";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const alt = "ch-fitra — AI developer portfolio";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export default async function OpenGraph() {
  const p = await getProfile();
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "70px",
        background: "#0b0d10",
        color: "#f1f3f5",
        fontFamily: "sans-serif",
        border: "1px solid #343a42",
      }}
    >
      <div style={{ display: "flex", fontSize: 23, color: "#9bc3ce" }}>
        {p.handle} / {p.role}
      </div>
      <div
        style={{
          display: "flex",
          fontSize: 70,
          lineHeight: 1.15,
          letterSpacing: -3,
          maxWidth: 1000,
        }}
      >
        {p.headline.replaceAll("\n", " ")}
      </div>
      <div style={{ display: "flex", fontSize: 21, color: "#a6adb8" }}>
        {p.name}
      </div>
    </div>,
    size,
  );
}
