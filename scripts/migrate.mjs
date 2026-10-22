import pg from "pg";
import { readdir, readFile } from "node:fs/promises";
const client = new pg.Client({
  connectionString: process.env.MIGRATION_DATABASE_URL,
});
await client.connect();
try {
  await client.query("SELECT pg_advisory_lock(4815162342)");
  await client.query(
    "CREATE TABLE IF NOT EXISTS schema_migrations(name text PRIMARY KEY,applied_at timestamptz DEFAULT now())",
  );
  for (const name of (await readdir("db/migrations"))
    .filter((n) => n.endsWith(".sql"))
    .sort()) {
    if (
      (
        await client.query("SELECT 1 FROM schema_migrations WHERE name=$1", [
          name,
        ])
      ).rowCount
    )
      continue;
    await client.query("BEGIN");
    try {
      await client.query(await readFile(`db/migrations/${name}`, "utf8"));
      await client.query("INSERT INTO schema_migrations(name) VALUES($1)", [
        name,
      ]);
      await client.query("COMMIT");
      console.log(`Applied ${name}`);
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    }
  }
  for (const [role, key] of [
    ["portfolio_public", "DATABASE_URL"],
    ["portfolio_owner", "OWNER_DATABASE_URL"],
    ["portfolio_auth", "AUTH_DATABASE_URL"],
  ]) {
    const password = decodeURIComponent(new URL(process.env[key]).password);
    if (!password || password === "CHANGE_ME")
      throw Error(`Set a strong password in ${key}`);
    await client.query(
      `ALTER ROLE ${role} PASSWORD '${password.replaceAll("'", "''")}'`,
    );
  }
} finally {
  await client.end();
}
