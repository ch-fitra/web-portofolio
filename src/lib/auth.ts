import "server-only";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { createHmac } from "node:crypto";
import { db } from "./db";
import { hashToken } from "./password";
export const cookieName = "portfolio_session";
export async function currentOwner() {
  const token = (await cookies()).get(cookieName)?.value;
  if (!token || !/^[a-f0-9]{64}$/.test(token) || !process.env.AUTH_DATABASE_URL)
    return null;
  const { rows } = await db("auth").query(
    "SELECT o.id,o.email FROM sessions s JOIN owners o ON o.id=s.owner_id WHERE s.token_hash=$1 AND s.expires_at>now()",
    [hashToken(token)],
  );
  return rows[0] as { id: string; email: string } | undefined;
}
export async function requireOwner() {
  const owner = await currentOwner();
  if (!owner) redirect("/admin/login");
  return owner;
}
export async function clientKey(scope: string) {
  const h = await headers();
  const ip =
    process.env.TRUST_PROXY === "true"
      ? h.get("x-forwarded-for")?.split(",")[0].trim() || "unknown"
      : "local-proxy";
  if (!process.env.IP_HASH_SECRET) throw Error("IP_HASH_SECRET is required");
  return createHmac("sha256", process.env.IP_HASH_SECRET)
    .update(`${scope}:${ip}`)
    .digest("hex");
}
export async function consumeLimit(
  key: string,
  limit: number,
  seconds: number,
) {
  const { rows } = await db("auth").query(
    `INSERT INTO rate_limits(key,count,reset_at) VALUES($1,1,now()+make_interval(secs=>$2)) ON CONFLICT(key) DO UPDATE SET count=CASE WHEN rate_limits.reset_at<now() THEN 1 ELSE rate_limits.count+1 END,reset_at=CASE WHEN rate_limits.reset_at<now() THEN now()+make_interval(secs=>$2) ELSE rate_limits.reset_at END RETURNING count`,
    [key, seconds],
  );
  return rows[0].count <= limit;
}
