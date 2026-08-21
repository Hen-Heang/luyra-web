import type { MetadataRoute } from "next";

// Money Flow is the active installable product while the broader Hengo modules are paused.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Money Flow",
    short_name: "Money Flow",
    description: "Personal money tracking, budgeting, savings, and financial reviews.",
    lang: "en",
    start_url: "/finance",
    display: "standalone",
    background_color: "#fafafa",
    theme_color: "#18181b",
    orientation: "portrait",
    categories: ["finance", "productivity"],
    icons: [
      { src: "/icons/icon-192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-192", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icons/icon-512", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Overview", short_name: "Overview", url: "/finance", icons: [{ src: "/icons/icon-192", sizes: "192x192" }] },
      { name: "Transactions", short_name: "Transactions", url: "/finance/transactions", icons: [{ src: "/icons/icon-192", sizes: "192x192" }] },
      { name: "Budgets", short_name: "Budgets", url: "/finance/budgets", icons: [{ src: "/icons/icon-192", sizes: "192x192" }] },
      { name: "Savings", short_name: "Savings", url: "/finance/savings", icons: [{ src: "/icons/icon-192", sizes: "192x192" }] },
    ],
  };
}
