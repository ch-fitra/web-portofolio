import { spawnSync } from "node:child_process";
import { mkdir, writeFile, access, unlink } from "node:fs/promises";
import { randomBytes } from "node:crypto";
import path from "node:path";
const bin =
  process.env.PG_BIN ||
  (process.platform === "win32"
    ? "C:/Program Files/PostgreSQL/18/bin"
    : "/usr/lib/postgresql/18/bin");
const root = path.resolve(".local");
const data = path.join(root, "postgres-dev");
const run = (name, args) => {
  const result = spawnSync(
    path.join(bin, name + (process.platform === "win32" ? ".exe" : "")),
    args,
    { encoding: "utf8", stdio: name === "pg_ctl" ? "ignore" : "pipe" },
  );
  if (result.status !== 0)
    throw Error(result.stderr || result.stdout || result.error?.message);
  return result.stdout;
};
if (process.argv.includes("--stop")) {
  run("pg_ctl", ["-D", data, "stop", "-m", "fast"]);
  console.log("Isolated cluster stopped.");
  process.exit(0);
}
await mkdir(root, { recursive: true });
const exists = async (target) =>
  access(target).then(
    () => true,
    () => false,
  );
if (await exists(".env.local")) {
  if (!(await exists(data)))
    throw Error(
      ".env.local already exists. Refusing to change your database configuration.",
    );
  try {
    run("pg_ctl", ["-D", data, "status"]);
    console.log("Isolated cluster is already running.");
  } catch {
    run("pg_ctl", [
      "-D",
      data,
      "-l",
      path.join(root, "postgres.log"),
      "-o",
      "-h 127.0.0.1 -p 55432",
      "start",
      "-w",
    ]);
    console.log("Isolated cluster restarted.");
  }
  process.exit(0);
}
const admin = randomBytes(24).toString("hex");
const pw = path.join(root, "init-password");
await writeFile(pw, admin, { mode: 0o600 });
try {
  run("initdb", [
    "-D",
    data,
    "-U",
    "portfolio_migrator",
    "-A",
    "scram-sha-256",
    `--pwfile=${pw}`,
    "--encoding=UTF8",
    "--locale=C",
  ]);
} finally {
  await unlink(pw);
}
run("pg_ctl", [
  "-D",
  data,
  "-l",
  path.join(root, "postgres.log"),
  "-o",
  "-h 127.0.0.1 -p 55432",
  "start",
  "-w",
]);
process.env.PGPASSWORD = admin;
run("createdb", [
  "-h",
  "127.0.0.1",
  "-p",
  "55432",
  "-U",
  "portfolio_migrator",
  "portfolio",
]);
delete process.env.PGPASSWORD;
const url = (role, password) =>
  `postgresql://${role}:${password}@127.0.0.1:55432/portfolio`;
await writeFile(
  ".env.local",
  `DATABASE_URL=${url("portfolio_public", randomBytes(24).toString("hex"))}\nOWNER_DATABASE_URL=${url("portfolio_owner", randomBytes(24).toString("hex"))}\nAUTH_DATABASE_URL=${url("portfolio_auth", randomBytes(24).toString("hex"))}\nMIGRATION_DATABASE_URL=${url("portfolio_migrator", admin)}\nSITE_URL=http://localhost:3000\nMEDIA_ROOT=./storage/media\nIP_HASH_SECRET=${randomBytes(32).toString("hex")}\nTRUST_PROXY=false\n`,
  { mode: 0o600, flag: "wx" },
);
console.log(
  "Isolated PostgreSQL ready on 127.0.0.1:55432. Secrets saved only to ignored .env.local. Existing PostgreSQL service untouched.",
);
