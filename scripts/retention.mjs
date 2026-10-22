import pg from "pg";
const client = new pg.Client({
  connectionString: process.env.OWNER_DATABASE_URL,
});
await client.connect();
try {
  const { rows } = await client.query(
    "SELECT data->>'retentionDays' days FROM documents WHERE key='settings'",
  );
  const days = Number(rows[0]?.days || 180);
  if (!Number.isInteger(days) || days < 1)
    throw Error("Invalid retention period");
  const result = await client.query(
    "DELETE FROM messages WHERE created_at<now()-make_interval(days=>$1)",
    [days],
  );
  await client.query(
    "DELETE FROM audit_logs WHERE created_at<now()-interval '365 days'",
  );
  console.log(`Deleted ${result.rowCount} expired messages.`);
} finally {
  await client.end();
}
