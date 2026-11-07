import { test, expect } from "@playwright/test";

test("the four skill groups fit in a single viewport and preserve brand hover", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.getByRole("button", { name: "Enter", exact: true }).click();
  const skills = page.locator("#skills");
  await expect(skills.locator("li")).toHaveCount(32);
  await expect(
    skills.getByRole("heading", { name: "DevOps & Infrastructure" }),
  ).toHaveCount(0);
  await expect(skills.locator("h3")).toHaveText([
    "Programming Languages",
    "Frontend",
    "Backend",
    "Database",
  ]);
  for (const [width, height] of [
    [1536, 918],
    [1366, 768],
    [1024, 768],
    [768, 1024],
    [390, 844],
    [320, 568],
    [844, 390],
    [568, 320],
  ]) {
    await page.setViewportSize({ width, height });
    await page
      .getByRole("navigation", { name: "Main navigation" })
      .getByRole("link", { name: "Skills", exact: true })
      .click();
    await expect
      .poll(async () => {
        const header = await page.locator(".public-header").boundingBox();
        return skills.locator("li").evaluateAll(
          (items, top) =>
            items.every((item) => {
              const bounds = item.getBoundingClientRect();
              return bounds.top >= top - 1 && bounds.bottom <= innerHeight + 1;
            }),
          header!.height,
        );
      })
      .toBe(true);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  const python = skills
    .locator("li")
    .filter({
      has: page.getByRole("heading", { name: "Python", exact: true }),
    });
  await page.mouse.move(1, 1);
  const neutral = await python
    .locator("svg")
    .evaluate((icon) => getComputedStyle(icon).color);
  await python.hover();
  await expect
    .poll(() =>
      python.locator("svg").evaluate((icon) => getComputedStyle(icon).color),
    )
    .not.toBe(neutral);
});
