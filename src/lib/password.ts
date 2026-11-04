import {
  scryptSync,
  timingSafeEqual,
  createHash,
  createHmac,
} from "node:crypto";
export function verifyAdminPassword(
  password: string,
  configured: string | undefined,
) {
  if (!configured || configured.length > 256) return false;
  return timingSafeEqual(
    createHash("sha256").update(password).digest(),
    createHash("sha256").update(configured).digest(),
  );
}
// Binding the stored session digest to the password revokes old cookies on rotation.
export function hashSessionToken(token: string, password: string) {
  if (!password) throw Error("ADMIN_PASSWORD is required");
  return createHmac("sha256", password).update(token).digest("hex");
}
export const hashToken = (token: string) =>
  createHash("sha256").update(token).digest("hex");
export function verifyPassword(password: string, stored: string) {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash || hash.length !== 128) return false;
  const candidate = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  return (
    expected.length === candidate.length && timingSafeEqual(candidate, expected)
  );
}
