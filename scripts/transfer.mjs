import pg from "pg";
import { spawn } from "node:child_process";
import { createHash, randomBytes } from "node:crypto";
import { existsSync } from "node:fs";
import {
  mkdir,
  readFile,
  writeFile,
  readdir,
  stat,
  lstat,
  unlink,
} from "node:fs/promises";
import path from "node:path";
import {
  encryptBundle,
  decryptBundle,
  safeFilename,
  maxBundleBytes,
} from "./transfer-bundle.mjs";

const [mode, ...args] = process.argv.slice(2);
const option = (name) => {
  const index = args.indexOf(`--${name}`);
  if (index < 0 || !args[index + 1] || args[index + 1].startsWith("--"))
    throw Error(`Provide --${name} VALUE`);
  return args[index + 1];
};
const tables = [
  "documents",
  "projects",
  "records",
  "media",
  "messages",
  "owners",
  "revisions",
  "audit_logs",
];
const transient = ["sessions", "rate_limits"];
const sha = (value) => createHash("sha256").update(value).digest("hex");
const root = path.resolve(".local/transfers");
const id =
  new Date().toISOString().replaceAll(/[:.]/g, "-") +
  "-" +
  randomBytes(4).toString("hex");

async function run(executable, argv, env = process.env) {
  await new Promise((resolve, reject) => {
    const child = spawn(executable, argv, {
      env,
      stdio: ["ignore", "pipe", "pipe"],
    });
    // Do not echo subprocess output: connection strings and secrets may occur in errors.
    child.stdout.resume();
    child.stderr.resume();
    child.on("error", () =>
      reject(
        Error(
          `Cannot run ${path.basename(executable)}. Check installation/PG_BIN.`,
        ),
      ),
    );
    child.on("close", (code) =>
      code === 0
        ? resolve()
        : reject(
            Error(
              `${path.basename(executable)} failed (exit ${code}). Check credentials, permissions and PostgreSQL version.`,
            ),
          ),
    );
  });
}

async function pgCommand(name, argv) {
  const url = new URL(process.env.MIGRATION_DATABASE_URL);
  const directory =
    process.env.PG_BIN ||
    (process.platform === "win32" ? "C:/Program Files/PostgreSQL/18/bin" : "");
  const executable = directory
    ? path.join(directory, name + (process.platform === "win32" ? ".exe" : ""))
    : name;
  await run(
    executable,
    [
      "--host",
      url.hostname,
      "--port",
      url.port || "5432",
      "--username",
      decodeURIComponent(url.username),
      "--dbname",
      decodeURIComponent(url.pathname.slice(1)),
      "--no-password",
      ...argv,
    ],
    {
      ...process.env,
      PGPASSWORD: decodeURIComponent(url.password),
      PGSSLMODE: url.searchParams.get("sslmode") || "prefer",
    },
  );
}

async function migrations() {
  const result = {};
  for (const name of (await readdir("db/migrations"))
    .filter((n) => n.endsWith(".sql"))
    .sort())
    result[name] = sha(
      (await readFile(path.join("db/migrations", name), "utf8")).replaceAll(
        "\r\n",
        "\n",
      ),
    );
  return result;
}

async function identity(client) {
  const { rows } = await client.query(
    "SELECT current_database() AS database, system_identifier::text AS cluster FROM pg_control_system()",
  );
  return rows[0];
}

async function fingerprints(client) {
  await client.query("SET TIME ZONE 'UTC'");
  const result = {};
  for (const name of tables) {
    const { rows } = await client.query(
      `SELECT count(*)::int AS count, coalesce(jsonb_agg(to_jsonb(t) ORDER BY to_jsonb(t)::text COLLATE "C"), '[]'::jsonb)::text AS content FROM public."${name}" t`,
    );
    result[name] = { count: rows[0].count, sha256: sha(rows[0].content) };
  }
  return result;
}

async function connect() {
  if (!process.env.MIGRATION_DATABASE_URL)
    throw Error("MIGRATION_DATABASE_URL is required in the private env file.");
  const target = new URL(process.env.MIGRATION_DATABASE_URL);
  for (const key of [
    "DATABASE_URL",
    "OWNER_DATABASE_URL",
    "AUTH_DATABASE_URL",
  ]) {
    const url = new URL(process.env[key]);
    if (url.host !== target.host || url.pathname !== target.pathname)
      throw Error(
        `${key} must point to the same database/host as MIGRATION_DATABASE_URL.`,
      );
  }
  const client = new pg.Client({
    connectionString: process.env.MIGRATION_DATABASE_URL,
  });
  await client.connect();
  return client;
}

async function exportBackup() {
  const client = await connect();
  const work = path.join(root, id);
  await mkdir(work, { recursive: true, mode: 0o700 });
  const dump = path.join(work, "database.dump");
  try {
    await client.query("BEGIN ISOLATION LEVEL REPEATABLE READ");
    await client.query("SET LOCAL lock_timeout = '10s'");
    await client.query(
      `LOCK TABLE ${tables.map((t) => `public."${t}"`).join(",")} IN SHARE MODE`,
    );
    const snapshot = (await client.query("SELECT pg_export_snapshot() AS id"))
      .rows[0].id;
    const source = await identity(client);
    const data = await fingerprints(client);
    const files = [];
    let total = 0;
    const mediaRoot = path.resolve(process.env.MEDIA_ROOT || "storage/media");
    const filenames = [
      ...new Set(
        (await client.query("SELECT filename FROM media")).rows.map((r) =>
          safeFilename(r.filename),
        ),
      ),
    ];
    for (const name of filenames) {
      const file = path.join(mediaRoot, name);
      const info = await lstat(file);
      if (!info.isFile() || info.isSymbolicLink())
        throw Error("Media must be regular files, not symlinks.");
      total += info.size;
      if (total > maxBundleBytes / 2)
        throw Error(
          "Media too large for this portable backup (128 MiB limit).",
        );
      const bytes = await readFile(file);
      files.push({ name, sha256: sha(bytes), data: bytes.toString("base64") });
    }
    await pgCommand("pg_dump", [
      "--format=custom",
      "--schema=public",
      "--exclude-table=public.schema_migrations",
      ...transient.map((t) => `--exclude-table-data=public.${t}`),
      `--snapshot=${snapshot}`,
      "--file",
      dump,
    ]);
    if ((await stat(dump)).size + total > maxBundleBytes / 2)
      throw Error("Backup too large (128 MiB raw limit).");
    const secrets = Object.fromEntries(
      ["ADMIN_PASSWORD", "IP_HASH_SECRET"].map((key) => {
        if (!process.env[key])
          throw Error(`${key} must be configured before exporting.`);
        return [key, process.env[key]];
      }),
    );
    const value = {
      version: 1,
      createdAt: new Date().toISOString(),
      source,
      migrations: await migrations(),
      fingerprints: data,
      files,
      secrets,
      dump: (await readFile(dump)).toString("base64"),
    };
    const key = randomBytes(32);
    const bundle = path.join(root, `${id}.portfolio`);
    const keyFile = path.join(root, `${id}.key`);
    await writeFile(keyFile, key.toString("base64") + "\n", {
      flag: "wx",
      mode: 0o600,
    });
    await writeFile(bundle, encryptBundle(value, key), {
      flag: "wx",
      mode: 0o600,
    });
    await client.query("COMMIT");
    console.log(
      JSON.stringify(
        {
          bundle,
          keyFile,
          createdAt: value.createdAt,
          tables: data,
          mediaFiles: files.length,
        },
        null,
        2,
      ),
    );
  } finally {
    await client.query("ROLLBACK").catch(() => {});
    await client.end();
    await unlink(dump).catch(() => {});
  }
}

async function loadBackup() {
  const bundle = option("bundle");
  if ((await stat(bundle)).size > maxBundleBytes)
    throw Error("Backup exceeds size limit.");
  const key = Buffer.from(
    (await readFile(option("key"), "utf8")).trim(),
    "base64",
  );
  const value = decryptBundle(await readFile(bundle), key);
  if (
    value.version !== 1 ||
    !Array.isArray(value.files) ||
    !value.fingerprints ||
    !value.secrets ||
    !value.dump
  )
    throw Error("Invalid backup format.");
  const seen = new Set();
  for (const file of value.files) {
    safeFilename(file.name);
    if (
      seen.has(file.name) ||
      sha(Buffer.from(file.data, "base64")) !== file.sha256
    )
      throw Error("Invalid or duplicate media file.");
    seen.add(file.name);
  }
  return value;
}

async function restoreBackup(value) {
  if (JSON.stringify(value.migrations) !== JSON.stringify(await migrations()))
    throw Error(
      "Migration files differ. Use the same Git commit as the export.",
    );
  const site = new URL(option("site-url"));
  if (
    site.protocol !== "https:" &&
    site.hostname !== "localhost" &&
    site.hostname !== "127.0.0.1"
  )
    throw Error("Use an HTTPS SITE_URL for production.");
  const runtimeOut = path.resolve(option("runtime-out"));
  if (existsSync(runtimeOut))
    throw Error("Runtime output already exists; refusing to overwrite.");
  const mediaRoot = path.resolve(process.env.MEDIA_ROOT || "storage/media");
  if (existsSync(mediaRoot) && (await readdir(mediaRoot)).length)
    throw Error("Target MEDIA_ROOT must be empty. Use a new media directory.");
  const client = await connect();
  const work = path.join(root, `restore-${id}`);
  await mkdir(work, { recursive: true, mode: 0o700 });
  const dump = path.join(work, "database.dump");
  try {
    const target = await identity(client);
    if (
      target.cluster === value.source.cluster &&
      target.database === value.source.database
    )
      throw Error("Target is the source database. Restore refused.");
    // A fresh database is required; even an existing empty schema is rejected.
    const existing = await client.query(
      "SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname NOT IN ('pg_catalog','information_schema') AND n.nspname NOT LIKE 'pg_toast%' AND c.relkind IN ('r','p','v','m','S','f') LIMIT 1",
    );
    if (existing.rowCount)
      throw Error("Target database is not empty. Restore refused.");
    await run(process.execPath, ["scripts/migrate.mjs"]);
    await mkdir(mediaRoot, { recursive: true, mode: 0o700 });
    for (const file of value.files)
      await writeFile(
        path.join(mediaRoot, file.name),
        Buffer.from(file.data, "base64"),
        { flag: "wx", mode: 0o600 },
      );
    await writeFile(dump, Buffer.from(value.dump, "base64"), {
      flag: "wx",
      mode: 0o600,
    });
    await pgCommand("pg_restore", [
      "--data-only",
      "--no-owner",
      "--no-acl",
      "--exit-on-error",
      "--single-transaction",
      dump,
    ]);
    const restored = await fingerprints(client);
    if (JSON.stringify(restored) !== JSON.stringify(value.fingerprints))
      throw Error(
        "Restored database verification failed. Do not start the application.",
      );
    const runtime = {
      NODE_ENV: "production",
      DATABASE_URL: process.env.DATABASE_URL,
      OWNER_DATABASE_URL: process.env.OWNER_DATABASE_URL,
      AUTH_DATABASE_URL: process.env.AUTH_DATABASE_URL,
      SITE_URL: site.origin,
      MEDIA_ROOT: mediaRoot,
      ADMIN_PASSWORD: value.secrets.ADMIN_PASSWORD,
      IP_HASH_SECRET: value.secrets.IP_HASH_SECRET,
      TRUST_PROXY: process.env.TRUST_PROXY === "true" ? "true" : "false",
    };
    // JSON double quotes are compatible with Node --env-file and systemd EnvironmentFile.
    for (const text of Object.values(runtime))
      if (/[\r\n\0]/.test(text))
        throw Error("Environment values cannot contain newlines or NUL.");
    await writeFile(
      runtimeOut,
      Object.entries(runtime)
        .map(([key, text]) => `${key}=${JSON.stringify(text)}`)
        .join("\n") + "\n",
      { flag: "wx", mode: 0o600 },
    );
    console.log(
      JSON.stringify(
        {
          verified: true,
          runtimeOut,
          mediaRoot,
          tables: restored,
          mediaFiles: value.files.length,
        },
        null,
        2,
      ),
    );
  } finally {
    await client.end();
    await unlink(dump).catch(() => {});
  }
}

try {
  if (args.includes("--env")) process.loadEnvFile(option("env"));
  else if (mode === "export") process.loadEnvFile(".env.local");
  if (mode === "export") await exportBackup();
  else if (mode === "inspect" || mode === "restore") {
    const value = await loadBackup();
    if (mode === "restore") await restoreBackup(value);
    else
      console.log(
        JSON.stringify(
          {
            createdAt: value.createdAt,
            migrations: Object.keys(value.migrations),
            tables: value.fingerprints,
            mediaFiles: value.files.length,
          },
          null,
          2,
        ),
      );
  } else
    throw Error(
      "Usage: transfer.mjs export | inspect --bundle FILE --key FILE | restore --env FILE --bundle FILE --key FILE --site-url URL --runtime-out FILE",
    );
} catch (error) {
  // pg errors may contain credentials; expose only our controlled messages.
  console.error(
    error.code
      ? `Database/filesystem operation failed (${error.code}). Check private configuration and permissions.`
      : error.message,
  );
  process.exitCode = 1;
}
