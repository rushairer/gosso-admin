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
  { name: "login", path: "/login", selector: '[data-slot="login-surface"]', appShell: false },
  { name: "forgot-password", path: "/forgot-password", selector: "h1", appShell: false },
  { name: "reset-password", path: "/reset-password#token=fixture-reset-token", selector: "h1", appShell: false },
  { name: "callback", path: "/callback", selector: "h1", appShell: false },
  { name: "not-found", path: "/this-route-does-not-exist", selector: "h1", appShell: true },
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
        await expect(page.locator('[data-slot="app-shell"]')).toHaveCount(routeCase.appShell ? 1 : 0);
        await expect(page.locator('[data-slot="page-loader"]')).toHaveCount(0);

        const horizontalOverflow = await page.evaluate(
          () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
        );
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

test("login required fields stay on the auth surface without submitting", async ({ page }) => {
  await setTheme(page, "light");
  const unknown = await installApiFixtures(page);
  await page.goto("/login");

  await page.getByRole("button", { name: /login|sign in|登录/i }).first().click();

  await expect(page.locator('input[type="text"]').first()).toHaveJSProperty("validity.valid", false);
  await expect(page.locator('input[type="password"]').first()).toHaveJSProperty("validity.valid", false);
  await expect(page.locator('[data-slot="login-surface"]')).toBeVisible();
  expect(unknown).toEqual([]);
});

test("login backend error remains persistent on the auth surface", async ({ page }) => {
  await setTheme(page, "light");
  const unknown = await installApiFixtures(page, { failLoginCount: 1 });
  await page.goto("/login");

  await page.locator('input[type="text"]').first().fill("admin");
  await page.locator('input[type="password"]').first().fill("wrong-password");
  await page.getByRole("button", { name: /login|sign in|登录/i }).first().click();

  await expect(page.getByRole("alert")).toBeVisible();
  await expect(page.locator('[data-slot="login-surface"]')).toBeVisible();
  expect(unknown).toEqual([]);
});

test("login MFA challenge stays inside the canonical auth surface", async ({ page }) => {
  await setTheme(page, "light");
  const unknown = await installApiFixtures(page, { loginRequiresMfa: true });
  await page.goto("/login");

  await page.locator('input[type="text"]').first().fill("admin");
  await page.locator('input[type="password"]').first().fill("correct-password");
  await page.getByRole("button", { name: /login|sign in|登录/i }).first().click();

  await expect(page.locator('[data-slot="login-surface"]')).toBeVisible();
  await expect(page.locator('input[inputmode="numeric"]')).toBeVisible();
  await expect(page.getByRole("alert")).toBeVisible();
  expect(unknown).toEqual([]);
});

test("login passkey branch renders its failure on the auth surface", async ({ page }) => {
  await setTheme(page, "light");
  const unknown = await installApiFixtures(page, { failPasskeyLoginCount: 1 });
  await page.goto("/login");

  await page.getByRole("button", { name: "使用通行密钥登录" }).click();

  await expect(page.locator('[data-slot="login-surface"]')).toBeVisible();
  await expect(page.getByRole("alert")).toBeVisible();
  expect(unknown).toEqual([]);
});

test("forgot password keeps native validation ownership on the auth surface", async ({ page }) => {
  await setTheme(page, "light");
  const unknown = await installApiFixtures(page);
  await page.goto("/forgot-password");

  const email = page.locator('input[type="email"]');
  await expect(email).toHaveJSProperty("validity.valid", false);
  await expect(page.locator('button[type="submit"]')).toBeDisabled();
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.locator('[data-slot="app-shell"]')).toHaveCount(0);
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

test("OAuth callback shows indeterminate processing before a persistent exchange error", async ({ page }) => {
  await setTheme(page, "light");
  await page.addInitScript(() => {
    sessionStorage.setItem("gosso-admin:auth_state", "fixture-state");
    sessionStorage.setItem("gosso-admin:pkce_verifier", "fixture-verifier");
  });
  const unknown = await installApiFixtures(page, {
    failTokenExchange: true,
    tokenExchangeDelayMs: 500,
  });

  await page.goto("/callback?code=fixture-code&state=fixture-state", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("status")).toBeVisible();
  await expect(page.getByRole("alert")).toBeVisible();
  await expect(page.locator('[data-slot="app-shell"]')).toHaveCount(0);
  expect(unknown).toEqual([]);
});
