import pg from "pg";
const client = new pg.Client({
  connectionString: process.env.AUTH_DATABASE_URL,
});
await client.connect();
try {
  await client.query("DELETE FROM sessions WHERE expires_at<now()");
  await client.query("DELETE FROM rate_limits WHERE reset_at<now()");
  console.log("Expired sessions and rate-limit buckets removed.");
} finally {
  await client.end();
}
