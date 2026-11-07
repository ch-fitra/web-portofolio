import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { gzipSync, gunzipSync } from "node:zlib";

const magic = Buffer.from("PORTFOLIO-BACKUP-1\n");
export const maxBundleBytes = 256 * 1024 * 1024;

export function encryptBundle(value, key) {
  const plain = Buffer.from(JSON.stringify(value));
  if (plain.length > maxBundleBytes)
    throw Error("Backup exceeds 256 MiB; use a streaming DBA backup instead.");
  const nonce = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, nonce);
  cipher.setAAD(magic);
  const encrypted = Buffer.concat([
    cipher.update(gzipSync(plain)),
    cipher.final(),
  ]);
  return Buffer.concat([magic, nonce, cipher.getAuthTag(), encrypted]);
}

export function decryptBundle(bytes, key) {
  if (
    bytes.length > maxBundleBytes ||
    !bytes.subarray(0, magic.length).equals(magic)
  )
    throw Error("Invalid or oversized backup.");
  const offset = magic.length;
  const decipher = createDecipheriv(
    "aes-256-gcm",
    key,
    bytes.subarray(offset, offset + 12),
  );
  decipher.setAAD(magic);
  decipher.setAuthTag(bytes.subarray(offset + 12, offset + 28));
  const compressed = Buffer.concat([
    decipher.update(bytes.subarray(offset + 28)),
    decipher.final(),
  ]);
  return JSON.parse(
    gunzipSync(compressed, { maxOutputLength: maxBundleBytes }).toString(
      "utf8",
    ),
  );
}

export function safeFilename(name) {
  if (
    typeof name !== "string" ||
    !/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(name) ||
    name.includes("..")
  )
    throw Error("Unsafe media filename.");
  return name;
}
