import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import pg from "pg";
import { projectSchema } from "../src/lib/schema.ts";

if (!process.env.OWNER_DATABASE_URL)
  throw Error("OWNER_DATABASE_URL is required.");
const source = JSON.parse(
  await readFile(
    new URL("../content/linkedin-projects.json", import.meta.url),
    "utf8",
  ),
);
const projects = source.projects.map(({ sections, ...project }) =>
  projectSchema.parse({
    ...project,
    status: "published",
    locale: "en",
    chapters: sections.map((section, index) => ({
      id: randomUUID(),
      title: section.title,
      visible: true,
      blocks: [
        { id: randomUUID(), type: "text", text: section.text },
        ...(index === sections.length - 1
          ? [
              {
                id: randomUUID(),
                type: "cta",
                title: "View LinkedIn profile",
                url: source.source,
              },
            ]
          : []),
      ],
    })),
  }),
);
const client = new pg.Client({
  connectionString: process.env.OWNER_DATABASE_URL,
});
await client.connect();
try {
  await client.query("BEGIN");
  let inserted = 0;
  for (const project of projects) {
    const result = await client.query(
      "INSERT INTO projects(slug,status,data) SELECT $1,$2,$3::jsonb WHERE NOT EXISTS (SELECT 1 FROM projects WHERE slug=$1 OR lower(trim(data->>'title'))=lower($4)) RETURNING id",
      [project.slug, project.status, JSON.stringify(project), project.title],
    );
    if (result.rowCount) {
      inserted++;
      await client.query(
        "INSERT INTO audit_logs(action,entity_id) VALUES($1,$2)",
        ["import_linkedin_project", result.rows[0].id],
      );
    }
  }
  await client.query("COMMIT");
  console.log(
    `${inserted} LinkedIn projects imported. Existing projects left intact.`,
  );
} catch (error) {
  await client.query("ROLLBACK");
  throw error;
} finally {
  await client.end();
}
