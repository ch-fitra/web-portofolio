import { Code2, Coffee, Server, Terminal } from "lucide-react";
import { techIconSlugs } from "@/lib/tech-stack";
import paths from "./tech-icon-paths.json";
import colors from "./tech-icon-colors.json";
import type { CSSProperties } from "react";

export function techBrandStyle(name: string): CSSProperties {
  const slug = techIconSlugs[name];
  const color =
    colors[slug as keyof typeof colors] ??
    (name === "Java" ? "#ED8B00" : name === "SSH" ? "#4EAA25" : "#00B4D8");
  // Black/white marks follow the theme; deep brand colors get a visible dark variant.
  const monochrome = color === "#000000" || color === "#FFFFFF";
  const rgb = color
    .slice(1)
    .match(/.{2}/g)!
    .map((part) => parseInt(part, 16));
  const dark = rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722 < 65;
  return {
    "--tech-brand-color": monochrome ? "var(--text)" : color,
    "--tech-brand-dark": monochrome
      ? "var(--text)"
      : dark
        ? `color-mix(in srgb, ${color} 65%, white)`
        : color,
  } as CSSProperties;
}

/** Simple Icons 16.36.0 (CC0). See docs/licenses/simple-icons-CC0.md. */
export function TechIcon({ name }: { name: string }) {
  const slug = techIconSlugs[name];
  const path = paths[slug as keyof typeof paths];
  if (path) {
    return (
      <svg
        viewBox="0 0 24 24"
        width="30"
        height="30"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d={path} />
      </svg>
    );
  }
  const Icon =
    name === "SSH"
      ? Terminal
      : name === "VPS Hosting"
        ? Server
        : name === "Java"
          ? Coffee
          : Code2;
  return <Icon size={30} strokeWidth={1.6} aria-hidden="true" />;
}
