import { test, after } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import pg from "pg";
const urls = [
  process.env.DATABASE_URL,
  process.env.OWNER_DATABASE_URL,
  process.env.AUTH_DATABASE_URL,
];
if (urls.some((u) => !u || new URL(u).port !== "55432"))
  throw Error("Integration tests require the isolated database on port 55432.");
const [publicDb, ownerDb, authDb] = urls.map(
  (connectionString) => new pg.Pool({ connectionString }),
);
after(async () => {
  await Promise.all([publicDb.end(), ownerDb.end(), authDb.end()]);
});
test("native PostgreSQL roles deny private reads, drafts, writes and privilege escalation", async () => {
  const id = randomUUID(),
    mediaId = randomUUID();
  try {
    await ownerDb.query(
      "INSERT INTO media(id,filename,mime,size,alt) VALUES($1,'test.webp','image/webp',100,'test')",
      [mediaId],
    );
    await ownerDb.query(
      "INSERT INTO projects(id,slug,status,data) VALUES($1,$2,'draft',$3)",
      [
        id,
        `security-${id}`,
        JSON.stringify({ title: "Security Test", order: 0, coverId: mediaId }),
      ],
    );
    assert.equal(
      (await publicDb.query("SELECT * FROM projects WHERE id=$1", [id]))
        .rowCount,
      0,
    );
    assert.equal(
      (await publicDb.query("SELECT * FROM media WHERE id=$1", [mediaId]))
        .rowCount,
      0,
    );
    for (const table of [
      "messages",
      "owners",
      "sessions",
      "revisions",
      "audit_logs",
    ])
      await assert.rejects(
        publicDb.query(`SELECT * FROM ${table}`),
        /permission denied/,
      );
    await assert.rejects(
      publicDb.query("UPDATE projects SET status='published' WHERE id=$1", [
        id,
      ]),
      /permission denied/,
    );
    await assert.rejects(
      publicDb.query("SET ROLE portfolio_owner"),
      /permission denied/,
    );
    await ownerDb.query("UPDATE projects SET status='published' WHERE id=$1", [
      id,
    ]);
    assert.equal(
      (await publicDb.query("SELECT * FROM projects WHERE id=$1", [id]))
        .rowCount,
      1,
    );
    assert.equal(
      (await publicDb.query("SELECT * FROM media WHERE id=$1", [mediaId]))
        .rowCount,
      1,
    );
    await ownerDb.query("UPDATE projects SET status='draft' WHERE id=$1", [id]);
    assert.equal(
      (await publicDb.query("SELECT * FROM media WHERE id=$1", [mediaId]))
        .rowCount,
      0,
    );
    await assert.rejects(
      authDb.query("SELECT * FROM projects"),
      /permission denied/,
    );
    await assert.rejects(
      ownerDb.query("SELECT * FROM owners"),
      /permission denied/,
    );
    const roles = await publicDb.query(
      "SELECT rolname,rolsuper,rolbypassrls FROM pg_roles WHERE rolname LIKE 'portfolio_%' AND rolname<>'portfolio_migrator'",
    );
    assert.ok(roles.rows.every((r) => !r.rolsuper && !r.rolbypassrls));
  } finally {
    await ownerDb.query("DELETE FROM projects WHERE id=$1", [id]);
    await ownerDb.query("DELETE FROM media WHERE id=$1", [mediaId]);
  }
});
test("published selection is parameterized against SQL injection", async () => {
  assert.equal(
    (
      await publicDb.query("SELECT * FROM projects WHERE slug=$1", [
        "x' OR 1=1 --",
      ])
    ).rowCount,
    0,
  );
});
