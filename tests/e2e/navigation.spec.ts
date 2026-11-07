import { test, expect } from "@playwright/test";

test("section navigation keeps the root URL and the project feed has its own route", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.getByRole("button", { name: "Enter", exact: true }).click();
  const nav = page.getByRole("navigation", { name: "Main navigation" });
  const historyLength = await page.evaluate(() => history.length);
  for (const name of ["About", "Skills", "Projects", "Contact", "Home"]) {
    await nav.getByRole("link", { name, exact: true }).click();
    await expect(page).toHaveURL("/");
    await expect(nav.getByRole("link", { name, exact: true })).toHaveAttribute(
      "aria-current",
      "location",
    );
  }
  expect(await page.evaluate(() => history.length)).toBe(historyLength);

  await nav.getByRole("link", { name: "Projects", exact: true }).click();
  await page
    .getByRole("link", { name: "View all projects", exact: true })
    .click();
  await expect(page).toHaveURL("/projects");
  await page.goBack();
  await expect(page).toHaveURL("/");
  await expect(page.locator("#projects h2")).toBeInViewport();
  await page.goForward();
  await expect(page).toHaveURL("/projects");
  await expect(nav).toHaveCount(0);
  expect(
    await page
      .locator("#main")
      .evaluate((main) => main.getBoundingClientRect().x),
  ).toBe(0);
  await expect(
    page.getByRole("heading", { name: "All projects." }),
  ).toBeVisible();
  await expect(
    page.locator(".single-page-portfolio, .orbit-stage"),
  ).toHaveCount(0);
  await expect(page.locator(".project-grid .project-card")).toHaveCount(3);
  await page
    .getByRole("textbox", { name: "Search projects" })
    .fill("MY PREMIER");
  await expect(page.locator(".project-grid .project-card")).toHaveCount(1);
  await page
    .locator(
      'a.project-card[href="/projects/my-premier-industrial-product-catalog"]',
    )
    .click();
  await expect(page).toHaveURL(
    "/projects/my-premier-industrial-product-catalog",
  );
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "MY PREMIER – Industrial Product Catalog Platform",
  );
  await expect(nav).toHaveCount(0);

  await page
    .getByRole("link", { name: "Back to the work", exact: false })
    .click();
  await expect(page).toHaveURL("/projects");
  await page
    .getByRole("link", { name: "Back to portfolio", exact: true })
    .click();
  await nav.getByRole("link", { name: "About", exact: true }).click();
  await expect(page).toHaveURL("/");
  await expect(page.getByRole("heading", { name: "Welcome." })).toHaveCount(0);
  await expect(page.locator("#about h2")).toBeInViewport();

  await nav.getByRole("link", { name: "Projects", exact: true }).click();
  await page
    .getByRole("link", { name: "View all projects", exact: true })
    .click();
  await page
    .getByRole("link", { name: "Back to portfolio", exact: true })
    .click();
  await expect(page).toHaveURL("/");
  await expect(page.locator("#projects h2")).toBeInViewport();

  await page.goto("/projects");
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await expect(nav).toHaveCount(0);
  await page
    .getByRole("link", { name: "Back to portfolio", exact: true })
    .click();
  await nav.getByRole("link", { name: "Skills", exact: true }).click();
  await expect(page).toHaveURL("/");
  await expect(page.locator("#skills h2")).toBeInViewport();
  await expect(page.getByRole("heading", { name: "Welcome." })).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole("heading", { name: "Welcome." })).toBeVisible();
  expect(errors).toEqual([]);
});
