import { test, expect } from "@playwright/test";

test("Contact offers four branded, direct contact channels on desktop and mobile", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.getByRole("button", { name: "Enter", exact: true }).click();
  await page
    .getByRole("navigation", { name: "Main navigation" })
    .getByRole("link", { name: "Contact", exact: true })
    .click();
  const contact = page.locator("#contact");
  await expect(contact.locator(".contact-channel")).toHaveCount(4);
  await expect(contact.locator("form, input, textarea")).toHaveCount(0);
  for (const kind of ["github", "linkedin", "instagram"]) {
    await expect(
      contact.locator(`svg[data-social-icon="${kind}"]`),
    ).toBeVisible();
  }
  await expect(
    contact.getByRole("link", { name: /Instagram/ }),
  ).toHaveAttribute("href", "https://www.instagram.com/chfitrah/");
  await expect(contact.getByRole("link", { name: /Email/ })).toHaveAttribute(
    "href",
    "mailto:chairulfitrar@gmail.com",
  );
  await expect(
    contact.getByRole("link", { name: /Email/ }).locator("svg.lucide-mail"),
  ).toBeVisible();
  for (const [width, height] of [
    [1600, 1000],
    [1366, 768],
    [390, 844],
    [320, 568],
    [320, 480],
    [844, 390],
    [568, 320],
  ]) {
    await page.setViewportSize({ width, height });
    await page
      .getByRole("navigation", { name: "Main navigation" })
      .getByRole("link", { name: "Contact", exact: true })
      .click();
    await expect
      .poll(() =>
        page.evaluate(() =>
          Math.abs(
            document.documentElement.scrollHeight - innerHeight - scrollY,
          ),
        ),
      )
      .toBeLessThanOrEqual(1);
    const header = await page.locator(".public-header").boundingBox();
    const links = await contact.locator(".contact-channel").all();
    for (const link of links) {
      const bounds = await link.boundingBox();
      expect(bounds!.y).toBeGreaterThanOrEqual(header!.height - 1);
      expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(height + 1);
    }
    const footer = await page.locator("body > .footer").boundingBox();
    expect(footer!.y + footer!.height).toBeLessThanOrEqual(height + 1);
    const bottom = await page.evaluate(() => scrollY);
    await page.mouse.wheel(0, 700);
    await expect.poll(() => page.evaluate(() => scrollY)).toBe(bottom);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  expect(errors).toEqual([]);
});
