import type { MetadataRoute } from "next";
import { getProjects } from "@/lib/content";
export const dynamic = "force-dynamic";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.SITE_URL || "http://localhost:3000";
  return [
    ...["", "/projects", "/privacy"].map((path) => ({ url: base + path })),
    ...(await getProjects()).map((p) => ({
      url: `${base}/projects/${p.slug}`,
      lastModified: p.updated_at,
    })),
  ];
}
