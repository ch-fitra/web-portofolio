import { test } from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { verifyAdminPassword, hashSessionToken } from "../src/lib/password";

test("environment password is required, exact, and changes immediately with configuration", () => {
  const oldPassword = "old local password";
  const newPassword = "new local password";
  assert.equal(verifyAdminPassword(oldPassword, oldPassword), true);
  assert.equal(verifyAdminPassword(oldPassword, newPassword), false);
  assert.equal(verifyAdminPassword(newPassword, newPassword), true);
  assert.equal(verifyAdminPassword("", undefined), false);
  assert.equal(verifyAdminPassword("", ""), false);
  assert.equal(verifyAdminPassword(" password ", "password"), false);
});

test("rotating password invalidates stored session digests, including legacy sessions", () => {
  const token = randomBytes(32).toString("hex");
  const stored = hashSessionToken(token, "old password");
  assert.equal(hashSessionToken(token, "old password"), stored);
  assert.notEqual(hashSessionToken(token, "new password"), stored);
  assert.notEqual(
    hashSessionToken(randomBytes(32).toString("hex"), "old password"),
    stored,
  );
  assert.throws(() => hashSessionToken(token, ""));
});
