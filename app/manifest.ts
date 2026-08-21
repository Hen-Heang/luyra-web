import type { MetadataRoute } from "next";

// Whole-app manifest — HeangOS is the installable product, not Finance.
// Per AGENTS.md's PWA phase: "Do not make Finance a separate PWA."
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "HeangOS",
    short_name: "HeangOS",
    description: "Personal life and productivity operating system.",
    lang: "en",
    start_url: "/today",
    display: "standalone",
    background_color: "#fafafa",
    theme_color: "#18181b",
    orientation: "portrait",
    categories: ["productivity", "finance", "lifestyle"],
    icons: [
      { src: "/icons/icon-192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-192", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icons/icon-512", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Today", short_name: "Today", url: "/today", icons: [{ src: "/icons/icon-192", sizes: "192x192" }] },
      { name: "Tasks", short_name: "Tasks", url: "/tasks", icons: [{ src: "/icons/icon-192", sizes: "192x192" }] },
      { name: "Finance", short_name: "Finance", url: "/finance", icons: [{ src: "/icons/icon-192", sizes: "192x192" }] },
      { name: "Habits", short_name: "Habits", url: "/habits", icons: [{ src: "/icons/icon-192", sizes: "192x192" }] },
    ],
  };
}
