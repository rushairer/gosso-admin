import { expect, test } from "@playwright/test";
import { installApiFixtures, setTheme } from "./mock-api.mjs";

async function addCsrfCookie(page) {
  await page.context().addCookies([
    {
      name: "csrf_token",
      value: "fixture-csrf-token",
      url: "http://127.0.0.1:4173/",
    },
  ]);
}

async function activateSudo(page) {
  await page.addInitScript(() => {
    sessionStorage.setItem("gosso-admin:sudo_active_until", String(Date.now() + 10 * 60 * 1000));
  });
}

async function openWithFixtures(page, path, options = {}) {
  await setTheme(page, "light");
  const unknown = await installApiFixtures(page, options);
  await page.goto(path, { waitUntil: "domcontentloaded" });
  await expect(page.locator('[data-slot="page-container"]')).toBeVisible();
  return unknown;
}

test("Account Settings Tabs own route switching and active panel state", async ({ page }) => {
  const unknown = await openWithFixtures(page, "/account-settings/profile");
  const tabs = page.getByRole("tab");

  await expect(tabs).toHaveCount(5);
  await expect(tabs.nth(0)).toHaveAttribute("aria-selected", "true");
  await tabs.nth(1).click();
  await expect(page).toHaveURL(/\/account-settings\/password$/);
  await expect(tabs.nth(1)).toHaveAttribute("aria-selected", "true");
  await expect(page.locator('input[type="password"]')).toHaveCount(3);
  expect(unknown).toEqual([]);
});

test("Clients edit and destructive confirmation stay in canonical modals", async ({ page }) => {
  const unknown = await openWithFixtures(page, "/system-management/clients");
  const row = page.getByRole("row").filter({ hasText: "Blog Admin" });

  await row.getByRole("button", { name: "编辑客户端" }).click();
  let dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText(/编辑.*客户端/)).toBeVisible();
  await dialog.getByRole("button", { name: "取消" }).click();
  await expect(dialog).toBeHidden();

  await row.getByRole("button", { name: "删除客户端" }).click();
  dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("button", { name: "确认删除" })).toBeVisible();
  await dialog.getByRole("button", { name: "取消" }).click();
  expect(unknown).toEqual([]);
});

test("Users destructive action presents confirmation before Sudo verification", async ({ page }) => {
  const unknown = await openWithFixtures(page, "/system-management/users");
  const row = page.getByRole("row").filter({ hasText: "Demo User" });

  await row.getByRole("button", { name: "操作" }).click();
  await page.getByRole("menuitem", { name: "删除用户" }).click();

  let dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText(/永久删除用户/)).toBeVisible();
  await dialog.getByRole("button", { name: "确认删除" }).click();

  dialog = page.getByRole("dialog");
  await expect(dialog.getByText("安全提权验证 (Sudo Mode)")).toBeVisible();
  await expect(dialog.locator('input[inputmode="numeric"]')).toBeVisible();
  await expect(dialog.getByRole("button", { name: /通行密钥/ })).toBeVisible();
  expect(unknown).toEqual([]);
});

test("Users role assignment Select works inside the canonical Modal", async ({ page }, testInfo) => {
  const unknown = await openWithFixtures(page, "/system-management/users");
  const row = page.getByRole("row").filter({ hasText: "Demo User" });

  await row.getByRole("button", { name: "管理角色" }).click();

  const dialog = page.getByRole("dialog", { name: /管理角色 - Demo User/ });
  await expect(dialog).toBeVisible();

  const roleSelect = dialog.getByRole("combobox", { name: "分配新角色" });
  await expect(roleSelect).toBeVisible();
  await roleSelect.click();

  const option = page.getByRole("option", { name: /admin \(role-adm\)/ });
  await expect(option).toBeVisible();
  await option.click();

  await expect(roleSelect).toContainText("admin (role-adm)");
  await expect(dialog.getByRole("button", { name: "分配" })).toBeEnabled();

  const screenshotPath = testInfo.outputPath("users-role-select-inside-modal.png");
  await page.screenshot({
    path: screenshotPath,
    fullPage: true,
    animations: "disabled",
    caret: "hide",
  });
  await testInfo.attach("users-role-select-inside-modal", {
    path: screenshotPath,
    contentType: "image/png",
  });

  expect(unknown).toEqual([]);
});

test("Password recent-auth failure remains persistent inside the password panel", async ({ page }) => {
  await addCsrfCookie(page);
  const unknown = await openWithFixtures(page, "/account-settings/password", {
    failPasswordChangeCount: 1,
  });
  const inputs = page.locator('input[type="password"]');

  await inputs.nth(0).fill("CurrentPassword123!");
  await inputs.nth(1).fill("NewPassword12345!");
  await inputs.nth(2).fill("NewPassword12345!");
  await page.locator('form button[type="submit"]').click();

  await expect(page.getByRole("alert")).toBeVisible();
  await expect(page).toHaveURL(/\/account-settings\/password$/);
  expect(unknown).toEqual([]);
});

test("MFA disabled state transitions into enrollment presentation without simplifying the state machine", async ({ page }) => {
  await addCsrfCookie(page);
  const unknown = await openWithFixtures(page, "/account-settings/mfa", {
    mfaStatus: { enabled: false, types: [] },
    mfaEnrollment: {
      secret: "JBSWY3DPEHPK3PXP",
      otpauth_url: "otpauth://totp/GOSSO:admin?secret=JBSWY3DPEHPK3PXP&issuer=GOSSO",
    },
  });

  await page.getByRole("button", { name: "设置身份验证器应用" }).click();
  await expect(page.getByText("配置身份验证器应用")).toBeVisible();
  await expect(page.getByText("JBSWY3DPEHPK3PXP")).toBeVisible();
  await expect(page.locator('input[inputmode="numeric"]')).toBeVisible();
  expect(unknown).toEqual([]);
});

test("Passkeys empty state can enter registration and render a registration failure", async ({ page }) => {
  await activateSudo(page);
  await addCsrfCookie(page);
  const unknown = await openWithFixtures(page, "/account-settings/passkeys", {
    passkeys: [],
    failPasskeyRegisterCount: 1,
  });

  await expect(page.getByText("暂未注册通行密钥")).toBeVisible();
  await page.getByRole("button", { name: "添加通行密钥" }).first().click();

  const dialog = page.getByRole("dialog");
  await expect(dialog.getByText("注册通行密钥")).toBeVisible();
  await dialog.locator('input[type="text"]').fill("CI Touch ID");
  await dialog.locator('button[type="submit"]').click();

  await expect(dialog.getByRole("alert")).toBeVisible();
  await expect(dialog).toBeVisible();
  expect(unknown).toEqual([]);
});

test("Sessions revoke action requires a destructive confirmation modal", async ({ page }) => {
  const unknown = await openWithFixtures(page, "/account-settings/sessions");

  await page.getByRole("button", { name: "撤销" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("heading", { name: "终止会话" })).toBeVisible();
  await expect(dialog.getByRole("button", { name: "终止", exact: true })).toBeVisible();
  await dialog.getByRole("button", { name: "取消" }).click();
  expect(unknown).toEqual([]);
});

test("Audit filters keep canonical filter ownership and preserve the compact collection", async ({ page }) => {
  const unknown = await openWithFixtures(page, "/system-management/audit-logs");
  const inputs = page.locator('form input[type="text"]');

  await inputs.nth(0).fill("auth.login.success");
  await inputs.nth(1).fill("account-admin-001");
  await page.getByRole("button", { name: "搜索" }).click();

  await expect(inputs.nth(0)).toHaveValue("auth.login.success");
  await expect(inputs.nth(1)).toHaveValue("account-admin-001");
  await expect(page.getByText("auth.login.success").first()).toBeVisible();
  await page.getByRole("button", { name: "清除" }).click();
  await expect(inputs.nth(0)).toHaveValue("");
  await expect(inputs.nth(1)).toHaveValue("");
  expect(unknown).toEqual([]);
});
