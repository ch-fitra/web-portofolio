import { test, expect } from "@playwright/test";
import pg from "pg";
import {
  randomBytes,
  scryptSync,
  randomUUID,
  createHmac,
  createHash,
} from "node:crypto";
import sharp from "sharp";
const password = randomBytes(24).toString("hex");
const email = "e2e-owner@example.test";
const auth = new pg.Pool({ connectionString: process.env.AUTH_DATABASE_URL });
const owner = new pg.Pool({ connectionString: process.env.OWNER_DATABASE_URL });
let createdOwner = false;
let profile: unknown;
const trackedIds: string[] = [];
const trackedMedia: string[] = [];
test.beforeEach(async ({ page }) => {
  page.on("pageerror", (error) => {
    throw error;
  });
});
test.beforeAll(async () => {
  if (new URL(process.env.AUTH_DATABASE_URL!).port !== "55432")
    throw Error("E2E mutates only the isolated test database on port 55432.");
  if ((await auth.query("SELECT 1 FROM owners")).rowCount)
    throw Error(
      "An owner already exists. Run E2E before creating your real account; tests never replace an existing owner.",
    );
  const keys = ["login", "contact"].map((scope) =>
    createHmac("sha256", process.env.IP_HASH_SECRET!)
      .update(`${scope}:local-proxy`)
      .digest("hex"),
  );
  keys.push(createHash("sha256").update(`login-email:${email}`).digest("hex"));
  await auth.query("DELETE FROM rate_limits WHERE key=ANY($1::text[])", [keys]);
  const salt = randomBytes(16).toString("hex");
  await auth.query(
    "INSERT INTO owners(id,email,password_hash) VALUES('00000000-0000-4000-8000-000000000001',$1,$2)",
    [email, `${salt}:${scryptSync(password, salt, 64).toString("hex")}`],
  );
  createdOwner = true;
  profile = (
    await owner.query("SELECT data FROM documents WHERE key='profile'")
  ).rows[0].data;
});
test.afterAll(async () => {
  for (const id of trackedIds)
    await owner.query("DELETE FROM projects WHERE id=$1", [id]);
  if (profile)
    await owner.query("UPDATE documents SET data=$1 WHERE key='profile'", [
      JSON.stringify(profile),
    ]);
  for (const id of trackedMedia) {
    const m = (
      await owner.query("DELETE FROM media WHERE id=$1 RETURNING filename", [
        id,
      ])
    ).rows[0];
    if (m) {
      const { unlink } = await import("node:fs/promises");
      const path = await import("node:path");
      await unlink(
        path.resolve(process.env.MEDIA_ROOT || "storage/media", m.filename),
      ).catch(() => {});
    }
  }
  await owner.query(
    "DELETE FROM messages WHERE email='e2e-visitor@example.test'",
  );
  await owner.query("DELETE FROM records WHERE data->>'name'=ANY($1::text[])", [
    ["E2E skill", "E2E certificate (test only)"],
  ]);
  if (createdOwner)
    await auth.query("DELETE FROM owners WHERE email=$1", [email]);
  await auth.end();
  await owner.end();
});
test("public pages, mobile layout, theme, animated motion and unauthorized resources", async ({
  page,
  request,
}) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Intelligent software",
  );
  await page.screenshot({ path: ".local/home-desktop.png", fullPage: true });
  await page.getByRole("button", { name: /Switch to light theme/ }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.screenshot({ path: ".local/home-light.png", fullPage: true });
  await expect(page.getByRole("button", { name: /Motion:/ })).toHaveCount(0);
  await expect(page.locator("html")).toHaveAttribute("data-motion", "full");
  for (const route of [
    "/about",
    "/projects",
    "/skills",
    "/contact",
    "/privacy",
  ]) {
    const response = await page.goto(route);
    expect(response?.status()).toBe(200);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.screenshot({ path: ".local/home-mobile.png", fullPage: true });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.keyboard.press("Tab");
  await expect(page.getByText("Skip to content")).toBeFocused();
  await page.goto("/admin/inbox");
  await expect(page).toHaveURL(/\/admin\/login/);
  expect((await request.post("/api/media")).status()).toBe(401);
  expect((await request.delete(`/api/media/${randomUUID()}`)).status()).toBe(
    401,
  );
  expect((await request.get("/projects/ai-support-triage")).status()).toBe(404);
});
test("contact validation saves a private message with honest notification state", async ({
  page,
}) => {
  await page.goto("/contact?type=freelance");
  await expect(page.locator('input[name="type"]')).toHaveValue("freelance");
  await page.getByLabel("Your name").fill("E2E Visitor");
  await page.getByLabel("Email address").fill("e2e-visitor@example.test");
  await page
    .getByLabel("Tell me about your project")
    .fill("I would like to discuss an AI application for a small team.");
  await page.getByLabel(/I agree to/).check();
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(page.getByRole("status")).toContainText("saved safely");
  expect(
    (
      await owner.query(
        "SELECT notification FROM messages WHERE email='e2e-visitor@example.test'",
      )
    ).rows[0].notification,
  ).toBe("not_configured");
});
test("owner creates, reorders, previews, publishes and unpublishes a safe case study", async ({
  page,
  request,
}) => {
  await page.goto("/admin/login");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Enter studio" }).click();
  await expect(page).toHaveURL("/admin");
  await page.goto("/admin/projects/new");
  await page.getByLabel("Title", { exact: true }).fill("E2E case study");
  await page.getByLabel("Slug", { exact: true }).fill("e2e-case-study");
  await page.getByLabel("My role", { exact: true }).fill("Test engineer");
  await page
    .getByLabel("Quick-read summary")
    .fill("A clearly labeled integration test project.");
  await page.getByLabel("Project context").fill("Automated QA only.");
  await page
    .getByLabel("My personal contribution")
    .fill("Implemented the test workflow.");
  await page.getByRole("button", { name: "Add chapter" }).click();
  await page.getByLabel("Chapter title").fill("Overview");
  for (let i = 0; i < 5; i++) {
    await page.getByRole("button", { name: "Add block" }).click();
    await page
      .getByLabel("Content", { exact: true })
      .nth(i)
      .fill(
        i === 0
          ? "<script>window.hacked=true</script>"
          : `Test evidence block ${i + 1}`,
      );
  }
  await page.getByRole("button", { name: "Add chapter" }).click();
  await page.getByLabel("Chapter title").nth(1).fill("Lessons");
  await page.getByRole("button", { name: "Move chapter 2 up" }).click();
  await expect(page.getByLabel("Chapter title").first()).toHaveValue("Lessons");
  await page.getByRole("button", { name: "Save project", exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/projects\/[\w-]+\/edit/);
  const id = page.url().split("/").at(-2)!;
  trackedIds.push(id);
  expect((await request.get("/projects/e2e-case-study")).status()).toBe(404);
  await page.getByRole("link", { name: /Preview saved version/ }).click();
  await expect(page.getByText("PRIVATE PREVIEW")).toBeVisible();
  await expect(
    page.getByText("<script>window.hacked=true</script>"),
  ).toBeVisible();
  expect(
    await page.evaluate(() => Reflect.get(window, "hacked")),
  ).toBeUndefined();
  await page.goto(`/admin/projects/${id}/edit`);
  await page.getByLabel("Status", { exact: true }).selectOption("published");
  await page.getByRole("button", { name: "Save project", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("published");
  expect((await request.get("/projects/e2e-case-study")).status()).toBe(200);
  expect(await (await request.get("/sitemap.xml")).text()).toContain(
    "/projects/e2e-case-study",
  );
  await page.goto("/projects");
  await page.getByRole("button", { name: "AI/ML", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "E2E case study" }),
  ).toBeVisible();
  await page.getByLabel("Search projects").fill("no-such-project");
  await expect(page.getByText("No matching projects.")).toBeVisible();
  await page.goto(`/admin/projects/${id}/edit`);
  await page.getByLabel("Status", { exact: true }).selectOption("draft");
  await page.getByRole("button", { name: "Save project", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("draft");
  expect((await request.get("/projects/e2e-case-study")).status()).toBe(404);
  expect(await (await request.get("/sitemap.xml")).text()).not.toContain(
    "/projects/e2e-case-study",
  );
});
test("two portrait uploads stay independent and private media rejects anonymous requests", async ({
  page,
  request,
}) => {
  await page.goto("/admin/login");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Enter studio" }).click();
  await expect(page).toHaveURL("/admin");
  const mediaIds: string[] = [];
  for (const [name, color] of [
    ["Home test portrait", "#777777"],
    ["About test portrait", "#445566"],
  ]) {
    const buffer = await sharp({
      create: { width: 300, height: 400, channels: 3, background: color },
    })
      .png()
      .toBuffer();
    const response = await page.request.post("/api/media", {
      headers: { Origin: "http://localhost:3000" },
      multipart: {
        alt: name,
        file: { name: "portrait.png", mimeType: "image/png", buffer },
      },
    });
    expect(response.status()).toBe(200);
    const { id } = await response.json();
    mediaIds.push(id);
    trackedMedia.push(id);
  }
  expect((await request.get(`/media/${mediaIds[0]}`)).status()).toBe(404);
  const bad = await page.request.post("/api/media", {
    headers: { Origin: "http://localhost:3000" },
    multipart: {
      alt: "Unsafe SVG",
      file: {
        name: "evil.svg",
        mimeType: "image/svg+xml",
        buffer: Buffer.from('<svg onload="alert(1)"/>'),
      },
    },
  });
  expect(bad.status()).toBe(400);
  await page.goto("/admin/profile");
  await page
    .getByLabel("Home portrait", { exact: true })
    .selectOption(mediaIds[0]);
  await page
    .getByLabel("About portrait", { exact: true })
    .selectOption(mediaIds[1]);
  await page.getByLabel("Home crop position").fill("25");
  await page.getByRole("button", { name: "Save profile" }).click();
  await expect(page.getByRole("status")).toContainText("Changes saved");
  await page.goto("/");
  await expect(page.locator(`img[src="/media/${mediaIds[0]}"]`)).toBeVisible();
  await expect(page.locator(`img[src="/media/${mediaIds[1]}"]`)).toHaveCount(0);
  await page.goto("/about");
  await expect(page.locator(`img[src="/media/${mediaIds[1]}"]`)).toBeVisible();
  expect((await request.get(`/media/${mediaIds[1]}`)).status()).toBe(200);
  expect(
    (
      await page.request.delete(`/api/media/${mediaIds[0]}`, {
        headers: { Origin: "http://localhost:3000" },
      })
    ).status(),
  ).toBe(409);
});
test("owner manages skill and certificate visibility through the studio", async ({
  page,
}) => {
  await page.goto("/admin/login");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Enter studio" }).click();
  await expect(page).toHaveURL("/admin");
  await page.goto("/admin/skills");
  await page.getByLabel("Name", { exact: true }).fill("E2E skill");
  await page.getByLabel("Category", { exact: true }).fill("Testing");
  await page.getByLabel("Publicly visible").check();
  await page.getByRole("button", { name: "Save item" }).click();
  await expect(page.getByRole("status")).toContainText("saved");
  await page.goto("/skills");
  await expect(page.getByRole("heading", { name: "E2E skill" })).toBeVisible();
  await page.goto("/admin/skills");
  await page.getByRole("button", { name: /E2E skill/ }).click();
  await page.getByLabel("Publicly visible").uncheck();
  await page.getByRole("button", { name: "Save item" }).click();
  await expect(page.getByRole("status")).toContainText("saved");
  await page.goto("/skills");
  await expect(page.getByRole("heading", { name: "E2E skill" })).toHaveCount(0);
  await page.goto("/admin/skills");
  await page.getByRole("button", { name: /E2E skill/ }).click();
  await page.getByRole("button", { name: "Delete item" }).click();
  await expect(page.getByRole("status")).toContainText("deleted");
  await page.goto("/admin/certifications");
  await page
    .getByLabel("Name", { exact: true })
    .fill("E2E certificate (test only)");
  await page.getByLabel("issuer", { exact: true }).fill("Automated QA");
  await page.getByLabel("Publicly visible").check();
  await page.getByRole("button", { name: "Save item" }).click();
  await expect(page.getByRole("status")).toContainText("saved");
  await page.goto("/skills");
  await expect(
    page.getByRole("heading", { name: "E2E certificate (test only)" }),
  ).toBeVisible();
  await page.goto("/admin/certifications");
  await page.getByRole("button", { name: /E2E certificate/ }).click();
  await page.getByRole("button", { name: "Delete item" }).click();
  await expect(page.getByRole("status")).toContainText("deleted");
});
test("Animated motion, keyboard contact flow, missing media and resume degrade gracefully", async ({
  page,
  request,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-motion", "full");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/contact");
  await page.keyboard.press("Tab");
  await expect(page.getByText("Skip to content")).toBeFocused();
  await page.keyboard.press("Enter");
  await page.getByLabel("Your name").fill("QA");
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByLabel("Email address")).toBeFocused();
  await expect(page.getByRole("button", { name: "Continue" })).toBeEnabled();
  expect((await request.get(`/media/${randomUUID()}`)).status()).toBe(404);
  const resume = await request.get("/resume");
  expect(resume.status()).toBe(404);
  expect(await resume.text()).toContain("Nothing at this address");
});
test("private pages and mutation endpoints reject anonymous and cross-origin requests", async ({
  page,
  request,
}) => {
  for (const route of [
    "/admin",
    "/admin/profile",
    "/admin/projects/new",
    "/admin/skills",
    "/admin/certifications",
    "/admin/media",
    "/admin/inbox",
    "/admin/settings",
  ]) {
    await page.goto(route);
    await expect(page).toHaveURL(/\/admin\/login/);
  }
  expect(
    (
      await request.patch(`/api/media/${randomUUID()}`, {
        data: { alt: "malicious" },
      })
    ).status(),
  ).toBe(401);
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Password", { exact: true }).fill("wrong password");
  await page.getByRole("button", { name: "Enter studio" }).click();
  await expect(page.getByRole("status")).toContainText("Check your email");
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Enter studio" }).click();
  await expect(page).toHaveURL("/admin");
  expect(
    (
      await page.request.post("/api/media", {
        headers: { Origin: "https://untrusted.example" },
      })
    ).status(),
  ).toBe(403);
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL("/admin/login");
});
