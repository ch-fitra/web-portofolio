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
    [390, 844],
    [320, 568],
  ]) {
    await page.setViewportSize({ width, height });
    await contact.scrollIntoViewIfNeeded();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  expect(errors).toEqual([]);
});
