import pg from "pg";
import { scryptSync, randomBytes } from "node:crypto";
import { createInterface } from "node:readline/promises";
// Credentials come from hidden stdin, not command arguments or committed files.
const input = createInterface({ input: process.stdin, output: process.stdout });
const email = (await input.question("Owner email: ")).trim().toLowerCase();
input.close();
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw Error("Invalid email");
process.stdout.write("New password (hidden): ");
const password = await new Promise((resolve) => {
  let value = "";
  process.stdin.setRawMode?.(true);
  process.stdin.resume();
  process.stdin.setEncoding("utf8");
  const handler = (chunk) => {
    for (const char of chunk) {
      if (char === "\r" || char === "\n") {
        process.stdin.off("data", handler);
        process.stdin.setRawMode?.(false);
        process.stdin.pause();
        process.stdout.write("\n");
        resolve(value);
        return;
      }
      if (char === "\u0003") process.exit(1);
      if (char === "\u007f" || char === "\b") value = value.slice(0, -1);
      else value += char;
    }
  };
  process.stdin.on("data", handler);
});
if (!password.length) throw Error("Password is required");
if (password.length > 256)
  throw Error("Password must not exceed 256 characters");
const salt = randomBytes(16).toString("hex");
const hash = `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
const client = new pg.Client({
  connectionString: process.env.AUTH_DATABASE_URL,
});
await client.connect();
try {
  await client.query("BEGIN");
  await client.query(
    "INSERT INTO owners(id,email,password_hash) VALUES('00000000-0000-4000-8000-000000000001',$1,$2) ON CONFLICT(id) DO UPDATE SET email=$1,password_hash=$2",
    [email, hash],
  );
  await client.query("DELETE FROM sessions");
  await client.query("COMMIT");
  console.log("Owner updated; previous sessions revoked.");
} finally {
  await client.end();
}
