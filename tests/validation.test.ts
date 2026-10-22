import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID, scryptSync } from "node:crypto";
import {
  projectSchema,
  blockSchema,
  contactSchema,
  webUrl,
} from "../src/lib/schema";
import { verifyPassword, hashToken } from "../src/lib/password";
import { prepareUpload } from "../src/lib/upload";
import sharp from "sharp";
test("publication requires contribution, context, summary and visible content", () => {
  const p = {
    title: "Test",
    slug: "test",
    summary: "",
    category: "AI",
    role: "Developer",
    collaboration: "Team",
    context: "",
    contribution: "",
    stack: [],
    status: "draft",
    featured: false,
    order: 0,
    chapters: [],
  };
  assert.equal(projectSchema.safeParse(p).success, true);
  assert.equal(
    projectSchema.safeParse({ ...p, status: "published" }).success,
    false,
  );
  assert.equal(
    projectSchema.safeParse({
      ...p,
      status: "published",
      summary: "Test summary",
      context: "Team exercise",
      contribution: "Backend integration",
      chapters: [
        {
          id: randomUUID(),
          title: "Overview",
          visible: true,
          blocks: [{ id: randomUUID(), type: "text", text: "Evidence" }],
        },
      ],
    }).success,
    true,
  );
});
test("safe blocks reject scripts as URLs, arbitrary HTML types, unsafe video and unsourced metrics", () => {
  assert.equal(webUrl.safeParse("javascript:alert(1)").success, false);
  for (const b of [
    { type: "html" },
    { type: "metric", source: "" },
    { type: "video", url: "https://evil.example/embed/1" },
  ])
    assert.equal(
      blockSchema.safeParse({ id: randomUUID(), ...b }).success,
      false,
    );
  assert.equal(
    blockSchema.safeParse({
      id: randomUUID(),
      type: "text",
      text: "<script>alert(1)</script>",
    }).success,
    true,
  ); // React must escape this string.
  assert.equal(
    blockSchema.safeParse({
      id: randomUUID(),
      type: "video",
      url: "https://www.youtube-nocookie.com/embed/abc123",
    }).success,
    true,
  );
});
test("contact rejects honeypot, missing consent and invalid email", () => {
  const valid = {
    name: "Test Visitor",
    email: "visitor@example.com",
    type: "hiring",
    message: "I would like to discuss a software development role.",
    consent: true,
    website: "",
  };
  assert.equal(contactSchema.safeParse(valid).success, true);
  for (const patch of [
    { website: "bot.example" },
    { consent: false },
    { email: "invalid" },
    { message: "short" },
  ])
    assert.equal(
      contactSchema.safeParse({ ...valid, ...patch }).success,
      false,
    );
});
test("password verification and token hashing", () => {
  const salt = "a".repeat(32);
  const stored = `${salt}:${scryptSync("a secure test password", salt, 64).toString("hex")}`;
  assert.equal(verifyPassword("a secure test password", stored), true);
  assert.equal(verifyPassword("wrong", stored), false);
  assert.equal(verifyPassword("anything", "bad"), false);
  assert.equal(hashToken("token").length, 64);
});
test("upload checks actual bytes and reencodes valid images", async () => {
  const png = await sharp({
    create: { width: 80, height: 120, channels: 3, background: "#667788" },
  })
    .png()
    .toBuffer();
  const result = await prepareUpload(png, ".png");
  assert.equal(result.mime, "image/webp");
  assert.equal(result.width, 80);
  assert.equal(result.height, 120);
  await assert.rejects(prepareUpload(png, ".jpg"), /does not match/);
  await assert.rejects(
    prepareUpload(Buffer.from('<svg onload="alert(1)"/>'), ".svg"),
  );
  await assert.rejects(
    prepareUpload(Buffer.from("%PDF-1.7 /JavaScript evil %%EOF"), ".pdf"),
    /Active/,
  );
  await assert.rejects(
    prepareUpload(Buffer.alloc(11 * 1024 * 1024), ".png"),
    /10 MB/,
  );
});
