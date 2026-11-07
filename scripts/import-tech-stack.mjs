import pg from "pg";
import { techStack } from "../src/lib/tech-stack.ts";
import { recordSchema } from "../src/lib/schema.ts";

// Explicit import of the owner's supplied list, not automatic sample content.
const client = new pg.Client({
  connectionString: process.env.OWNER_DATABASE_URL,
});
if (!process.env.OWNER_DATABASE_URL)
  throw Error("OWNER_DATABASE_URL is required.");
await client.connect();
try {
  await client.query("BEGIN");
  let inserted = 0;
  let order = 0;
  for (const group of techStack) {
    for (const name of group.items) {
      const data = recordSchema.parse({
        name,
        category: group.title,
        summary: "",
        visible: true,
        order: order++,
        projectIds: [],
      });
      const result = await client.query(
        "INSERT INTO records(kind,visible,data) SELECT 'skill',true,$1::jsonb WHERE NOT EXISTS (SELECT 1 FROM records WHERE kind='skill' AND lower(trim(data->>'name'))=lower($2)) RETURNING id",
        [JSON.stringify(data), name],
      );
      inserted += result.rowCount;
    }
  }
  await client.query("COMMIT");
  console.log(
    `${inserted} technologies imported. Existing skills and certificates left intact.`,
  );
} catch (error) {
  await client.query("ROLLBACK");
  throw error;
} finally {
  await client.end();
}
