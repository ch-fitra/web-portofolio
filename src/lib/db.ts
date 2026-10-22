import "server-only";
import pg from "pg";
type Access = "public" | "owner" | "auth";
const globalDb = globalThis as typeof globalThis & {
  portfolioPools?: Partial<Record<Access, pg.Pool>>;
};
const pools = (globalDb.portfolioPools ??= {});
export function db(access: Access = "public") {
  if (!pools[access]) {
    const key =
      access === "owner"
        ? "OWNER_DATABASE_URL"
        : access === "auth"
          ? "AUTH_DATABASE_URL"
          : "DATABASE_URL";
    if (!process.env[key])
      throw Error(`Database configuration unavailable: ${key}`);
    pools[access] = new pg.Pool({
      connectionString: process.env[key],
      max: 5,
      connectionTimeoutMillis: 5000,
      idleTimeoutMillis: 10000,
    });
  }
  return pools[access]!;
}
export async function audit(action: string, entityId: string) {
  await db("owner").query(
    "INSERT INTO audit_logs(action,entity_id) VALUES($1,$2)",
    [action, entityId],
  );
}
