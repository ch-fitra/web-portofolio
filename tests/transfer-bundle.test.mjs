import test from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import {
  encryptBundle,
  decryptBundle,
  safeFilename,
} from "../scripts/transfer-bundle.mjs";

test("encrypted backup preserves Unicode, secrets and binary media", () => {
  const key = randomBytes(32);
  const value = {
    name: "Medan · Indonesia",
    secret: "private-test-value",
    media: randomBytes(1024).toString("base64"),
  };
  const bytes = encryptBundle(value, key);
  assert.equal(bytes.includes(Buffer.from(value.secret)), false);
  assert.deepEqual(decryptBundle(bytes, key), value);
});

test("wrong key, damaged ciphertext and truncated backup are rejected", () => {
  const key = randomBytes(32);
  const bytes = encryptBundle({ data: "important" }, key);
  assert.throws(() => decryptBundle(bytes, randomBytes(32)));
  const damaged = Buffer.from(bytes);
  damaged[damaged.length - 1] ^= 1;
  assert.throws(() => decryptBundle(damaged, key));
  assert.throws(() => decryptBundle(bytes.subarray(0, 25), key));
});

test("media paths cannot escape the destination", () => {
  for (const value of [
    "../secret",
    "a/b",
    "a\\b",
    "/etc/passwd",
    "C:secret",
    "..",
    "a\0b",
  ])
    assert.throws(() => safeFilename(value));
  assert.equal(safeFilename("1234-photo.webp"), "1234-photo.webp");
});
