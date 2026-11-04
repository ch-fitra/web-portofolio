import pg from "pg";
const client = new pg.Client({
  connectionString: process.env.OWNER_DATABASE_URL,
});
await client.connect();
try {
  await client.query(
    "DELETE FROM audit_logs WHERE created_at<now()-interval '365 days'",
  );
  console.log("Expired audit logs removed.");
} finally {
  await client.end();
}
