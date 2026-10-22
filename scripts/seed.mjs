import pg from "pg";
import { defaultProfile, defaultSettings } from "../src/lib/schema.ts";
const client = new pg.Client({
  connectionString: process.env.OWNER_DATABASE_URL,
});
await client.connect();
try {
  for (const [key, data] of [
    ["profile", defaultProfile],
    ["settings", defaultSettings],
  ])
    await client.query(
      "INSERT INTO documents(key,data) VALUES($1,$2) ON CONFLICT(key) DO NOTHING",
      [key, JSON.stringify(data)],
    );
  const title = "AI Support Triage";
  const data = {
    title,
    slug: "ai-support-triage",
    summary:
      "Draft candidate from the supplied PRD. Review the project, contribution, and evidence before publication.",
    category: "AI/ML",
    role: "To be confirmed by owner",
    collaboration: "Team",
    context:
      "Draft / Example — source context and team attribution require owner review.",
    contribution: "",
    stack: ["Flask", "Gemini", "Make.com"],
    tags: [],
    timeframe: "",
    team: "",
    coverId: "",
    sourceUrl: "",
    demoUrl: "",
    demoVerified: false,
    status: "draft",
    featured: false,
    order: 0,
    seoTitle: "",
    seoDescription: "",
    locale: "en",
    chapters: [],
  };
  await client.query(
    "INSERT INTO projects(slug,status,data) VALUES($1,'draft',$2) ON CONFLICT(slug) DO NOTHING",
    [data.slug, JSON.stringify(data)],
  );
  console.log(
    "Profile/settings initialized; candidate project remains a private draft.",
  );
} finally {
  await client.end();
}
