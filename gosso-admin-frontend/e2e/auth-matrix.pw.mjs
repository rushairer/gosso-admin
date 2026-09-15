import { test, expect } from "@playwright/test";
import { installApiFixtures, setTheme } from "./mock-api.mjs";

const viewports = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "tablet-landscape", width: 1024, height: 768 },
  { name: "tablet-portrait", width: 768, height: 1024 },
  { name: "mobile", width: 390, height: 844 },
];
const themes = ["light", "dark"];
const routes = [
  { name: "login", path: "/login", selector: '[data-slot="login-surface"]' },
  { name: "forgot-password", path: "/forgot-password", selector: "h1" },
  { name: "reset-password", path: "/reset-password#token=fixture-reset-token", selector: "h1" },
  { name: "callback", path: "/callback", selector: "h1" },
  { name: "not-found", path: "/this-route-does-not-exist", selector: "h1" },
];

function collectRuntimeFailures(page) {
  const errors = [];
  page.on("console", (message) => {
    if (message.type() === "error" || message.type() === "warning") errors.push(`console:${message.type()}: ${message.text()}`);
  });
  page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
  return errors;
}

for (const viewport of viewports) {
  for (const theme of themes) {
    for (const routeCase of routes) {
      test(`${routeCase.name} ${viewport.name} ${theme}`, async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await setTheme(page, theme);
        const runtimeFailures = collectRuntimeFailures(page);
        const unknown = await installApiFixtures(page);

        await page.goto(routeCase.path, { waitUntil: "domcontentloaded" });
        await expect(page.locator(routeCase.selector).first()).toBeVisible();
        await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
        await expect(page.locator("html")).toHaveAttribute("data-brand", "gosso-admin");
        await expect(page.locator('[data-slot="app-shell"]')).toHaveCount(0);
        await expect(page.locator('[data-slot="page-loader"]')).toHaveCount(0);

        const horizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
        expect(horizontalOverflow).toBe(false);
        expect(unknown, `unknown mocked API requests on ${routeCase.path}`).toEqual([]);
        expect(runtimeFailures, `runtime failures on ${routeCase.path}`).toEqual([]);

        await page.screenshot({
          path: `../test-results/ui-browser-acceptance/auth-${routeCase.name}-${viewport.name}-${theme}.png`,
          fullPage: true,
        });
      });
    }
  }
}

test("login validation feedback remains on the auth surface", async ({ page }) => {
  await setTheme(page, "light");
  const unknown = await installApiFixtures(page);
  await page.goto("/login");
  await page.getByRole("button", { name: /login|sign in|登录/i }).first().click();
  await expect(page.getByRole("alert")).toBeVisible();
  await expect(page.locator('[data-slot="login-surface"]')).toBeVisible();
  expect(unknown).toEqual([]);
});

test("reset password invalid token keeps a persistent error and disabled form", async ({ page }) => {
  await setTheme(page, "light");
  const unknown = await installApiFixtures(page);
  await page.goto("/reset-password");
  await expect(page.getByRole("alert")).toBeVisible();
  await expect(page.locator('input[type="password"]')).toHaveCount(2);
  for (const input of await page.locator('input[type="password"]').all()) await expect(input).toBeDisabled();
  expect(unknown).toEqual([]);
});
