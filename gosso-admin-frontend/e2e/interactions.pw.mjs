import { expect, test } from "@playwright/test";
import { installApiFixtures, setTheme } from "./mock-api.mjs";

async function collectConsoleProblems(page) {
  const problems = [];
  page.on("console", (message) => {
    if (message.type() === "error") problems.push(`error: ${message.text()}`);
  });
  page.on("pageerror", (error) => problems.push(`pageerror: ${error.message}`));
  return problems;
}

async function openWithFixtures(page, path, options = {}) {
  await setTheme(page, "light");
  const unknown = await installApiFixtures(page, options);
  await page.goto(path, { waitUntil: "domcontentloaded" });
  await expect(page.locator('[data-slot="page-container"]')).toBeVisible();
  return unknown;
}

test("desktop AppShell follows the canonical header, navigation, and display-name contract", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const problems = await collectConsoleProblems(page);
  const unknown = await openWithFixtures(page, "/system-management/clients");

  const shell = page.locator('[data-slot="app-shell"]');
  await expect(shell).toBeVisible();
  await expect(shell.locator('header [data-slot="brand-mark"]')).toBeVisible();
  await expect(page.getByRole("navigation", { name: "管理导航" })).toBeVisible();
  await expect(page.getByText("Admin User", { exact: true })).toBeVisible();
  await expect(page.getByText("admin@example.com", { exact: true })).toBeVisible();
  expect(unknown).toEqual([]);
  expect(problems).toEqual([]);
});

test("mobile AppShell drawer navigates routed management pages and closes", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const problems = await collectConsoleProblems(page);
  const unknown = await openWithFixtures(page, "/system-management/clients");

  await page.getByRole("button", { name: "打开导航" }).click();
  const dialog = page.getByRole("dialog", { name: "导航" });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("link", { name: "用户管理" }).click();
  await expect(page).toHaveURL(/\/system-management\/users$/);
  await expect(dialog).toBeHidden();
  await expect(page.getByRole("heading", { name: "用户管理" })).toBeVisible();
  expect(unknown).toEqual([]);
  expect(problems).toEqual([]);
});

test("client editor modal stays usable at phone width", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const problems = await collectConsoleProblems(page);
  const unknown = await openWithFixtures(page, "/system-management/clients");
  const row = page.getByRole("row").filter({ hasText: "Blog Admin" });

  await row.getByRole("button", { name: "编辑客户端" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText(/编辑.*客户端/)).toBeVisible();
  const box = await dialog.boundingBox();
  expect(box).not.toBeNull();
  expect(box.width).toBeLessThanOrEqual(390);
  expect(box.x).toBeGreaterThanOrEqual(0);
  await dialog.getByRole("button", { name: "取消" }).click();
  expect(unknown).toEqual([]);
  expect(problems).toEqual([]);
});

test("audit detail modal opens from the canonical compact table", async ({ page }) => {
  const problems = await collectConsoleProblems(page);
  const unknown = await openWithFixtures(page, "/system-management/audit-logs");

  await expect(page.getByText("auth.login.success").first()).toBeVisible();
  await page.getByRole("button", { name: "查看" }).first().click();

  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText("审计日志详情")).toBeVisible();
  await expect(dialog.getByText("audit-001", { exact: false })).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  expect(unknown).toEqual([]);
  expect(problems).toEqual([]);
});

test("site settings preserves real AppShell sticky offset and recovers from load failure", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const problems = collectConsoleProblems(page);
  const unknown = await openWithFixtures(page, "/system-management/site-settings", {
    failSettingsCount: 2,
  });

  await expect(page.getByText("browser injected settings failure")).toBeVisible();
  await page.getByRole("button", { name: "重新载入" }).click();
  const productName = page.getByRole("textbox", { name: "产品名称" });
  await expect(productName).toHaveValue("GOSSO");

  const previewSticky = page.getByText("登录页预览").locator("xpath=ancestor::div[contains(@class, 'xl:sticky')]");
  await expect(previewSticky).toBeVisible();
  const geometry = await previewSticky.evaluate((element) => {
    const style = getComputedStyle(element);
    const header = document.querySelector('[data-slot="app-shell"] > header');
    return {
      position: style.position,
      top: Number.parseFloat(style.top),
      headerHeight: header?.getBoundingClientRect().height || 0,
    };
  });
  expect(geometry.position).toBe("sticky");
  expect(geometry.top).toBe(geometry.headerHeight + 16);

  const expectedFailure = /^error: Failed to load resource: the server responded with a status of 500/;
  expect(problems.some((problem) => expectedFailure.test(problem))).toBe(true);
  expect(problems.filter((problem) => !expectedFailure.test(problem))).toEqual([]);
  expect(unknown).toEqual([]);
});

test("system status renders degraded readiness and refreshes back to healthy", async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  const unknown = await openWithFixtures(page, "/system-management/system", {
    failReadinessCount: 2,
  });

  await expect(page.getByText(/就绪检查异常/)).toBeVisible();
  await page.getByRole("button", { name: "刷新" }).click();
  await expect(page.getByText("200", { exact: true })).toBeVisible();
  await expect(page.getByText(/就绪检查异常/)).toHaveCount(0);
  expect(unknown).toEqual([]);
});