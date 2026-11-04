import { test, expect } from "@playwright/test";

test("Welcome fills the viewport without scrolling and keeps entry reachable", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Welcome." })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Portfolio", exact: true }),
  ).toHaveCount(0);
  await expect(page.locator(".welcome-brand")).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Skip intro" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Replay intro" })).toHaveCount(
    0,
  );
  await expect(
    page.getByRole("navigation", { name: "Main navigation" }),
  ).toBeHidden();

  for (const [width, height] of [
    [1920, 1080],
    [1280, 720],
    [390, 844],
    [320, 568],
    [844, 390],
    [568, 320],
    [320, 240],
  ]) {
    await page.setViewportSize({ width, height });
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            document.documentElement.scrollHeight <= innerHeight &&
            document.documentElement.scrollWidth <= innerWidth,
        ),
      )
      .toBe(true);
    await page.mouse.wheel(0, 1000);
    await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
    const button = await page
      .getByRole("button", { name: "Enter", exact: true })
      .boundingBox();
    expect(button).not.toBeNull();
    expect(button!.y).toBeGreaterThanOrEqual(0);
    expect(button!.y + button!.height).toBeLessThanOrEqual(height);
  }
  expect(errors).toEqual([]);
});

test("entry opens Home and refreshing Contact returns to Welcome", async ({
  page,
}) => {
  await page.goto("/#contact");
  await expect(page.getByRole("heading", { name: "Welcome." })).toBeVisible();
  await expect(page).toHaveURL("/");
  await page.getByRole("button", { name: "Enter", exact: true }).click();
  await expect(page.locator("#home h1")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Welcome." })).toHaveCount(0);
  await expect(page.locator(".home-cursor-field")).toHaveCount(1);
  await page
    .getByRole("navigation", { name: "Main navigation" })
    .getByRole("link", { name: "Contact", exact: true })
    .click();
  await expect(page).toHaveURL("/#contact");
  await page.reload();
  await expect(page.getByRole("heading", { name: "Welcome." })).toBeVisible();
  await expect(page).toHaveURL("/");
  await page.getByRole("button", { name: "Enter", exact: true }).click();
  await expect(page.locator("#home h1")).toBeVisible();
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
});

test("Welcome remains usable with reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Welcome." })).toBeVisible();
  await expect(page.locator(".home-cursor-field")).toBeHidden();
  expect(
    await page
      .locator(".welcome-marquee-track")
      .evaluate((element) => getComputedStyle(element).animationName),
  ).toBe("none");
  await page.keyboard.press("Enter");
  await expect(page.locator("#home h1")).toBeVisible();
  await expect(page.locator(".portal-transition")).toHaveCount(0);
});

test("keyboard Enter starts the portal without focusing the button", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Welcome." })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Enter", exact: true }),
  ).not.toBeFocused();
  await page.keyboard.press("Control+Enter");
  await expect(page.locator(".portal-transition")).toHaveCount(0);
  await page.keyboard.down("Enter");
  await expect(page.locator(".portal-transition")).toBeVisible();
  await page.keyboard.down("Enter");
  await expect(page.locator(".portal-transition")).toHaveCount(1);
  await page.keyboard.up("Enter");
  await expect(page.locator(".portal-transition")).toHaveCount(0, {
    timeout: 5000,
  });
  await expect(page.locator("#home h1")).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator(".portal-transition")).toHaveCount(0);
});

test("Enter opens a star portal before handing focus to Home", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Enter", exact: true }).click();
  await expect(page.locator(".portal-transition")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Enter", exact: true }),
  ).toBeDisabled();
  await expect(page.locator(".gateway-destination")).toHaveAttribute(
    "inert",
    "",
  );
  await expect(page.getByRole("heading", { name: "Welcome." })).toHaveCount(1);
  await expect(page.locator(".portal-transition")).toHaveCount(0, {
    timeout: 5000,
  });
  await expect(page.locator(".welcome-landing")).toHaveCount(0);
  await expect(page.locator(".gateway-destination")).not.toHaveAttribute(
    "inert",
  );
  await expect(page.locator("#home h1")).toBeFocused();
  await expect(page.locator(".home-cursor-field")).toHaveCount(1);
  // The final reveal must keep Home visible instead of starting its entrance again.
  const titleLine = page
    .locator('#home .headline-phrase[data-active] [data-enter="title"]')
    .first();
  expect(
    await titleLine.evaluate((element) => {
      const transform = getComputedStyle(element).transform;
      return (
        transform === "none" || new DOMMatrixReadOnly(transform).isIdentity
      );
    }),
  ).toBe(true);
  expect(
    await page
      .locator(".gateway-destination")
      .evaluate((element) => getComputedStyle(element).filter),
  ).toBe("none");
  expect(
    await page
      .locator("#home h1")
      .evaluate((element) => getComputedStyle(element).outlineStyle),
  ).toBe("none");
  await page.waitForTimeout(180);
  expect(
    await titleLine.evaluate((element) => {
      const transform = getComputedStyle(element).transform;
      return (
        transform === "none" || new DOMMatrixReadOnly(transform).isIdentity
      );
    }),
  ).toBe(true);
});

test("touch entry plays the portal even without a hover cursor", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();
  try {
    await page.goto("http://localhost:3000/");
    await expect(page.locator(".home-cursor-field")).toBeHidden();
    await page.getByRole("button", { name: "Enter", exact: true }).tap();
    await expect(page.locator(".portal-transition")).toBeVisible();
    await expect(page.locator(".portal-transition")).toHaveCount(0, {
      timeout: 5000,
    });
    await expect(page.locator("#home h1")).toBeVisible();
    await expect(page.locator(".welcome-landing")).toHaveCount(0);
  } finally {
    await context.close();
  }
});
