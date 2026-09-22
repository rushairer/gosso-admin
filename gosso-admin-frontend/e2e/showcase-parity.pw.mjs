import { expect, test } from "@playwright/test";
import { installApiFixtures, setTheme } from "./mock-api.mjs";

const showcaseOrigin = "http://127.0.0.1:4174";

async function styleFingerprint(locator) {
  await expect(locator).toBeVisible();
  return locator.evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      display: style.display,
      position: style.position,
      gap: style.gap,
      paddingTop: style.paddingTop,
      paddingRight: style.paddingRight,
      paddingBottom: style.paddingBottom,
      paddingLeft: style.paddingLeft,
      borderTopWidth: style.borderTopWidth,
      borderRightWidth: style.borderRightWidth,
      borderBottomWidth: style.borderBottomWidth,
      borderLeftWidth: style.borderLeftWidth,
      borderRadius: style.borderRadius,
      backgroundColor: style.backgroundColor,
      boxShadow: style.boxShadow,
      opacity: style.opacity,
    };
  });
}

async function geometry(locator) {
  const box = await locator.boundingBox();
  expect(box).not.toBeNull();
  return { width: Math.round(box.width), height: Math.round(box.height) };
}

async function width(locator) {
  return (await geometry(locator)).width;
}

async function pairScreenshot(showcase, product, label, testInfo) {
  for (const [kind, page] of [["showcase", showcase], ["product", product]]) {
    const path = testInfo.outputPath(`${label}-${kind}.png`);
    await page.screenshot({ path, fullPage: true });
    await testInfo.attach(`${label}-${kind}`, { path, contentType: "image/png" });
  }
}

async function openPair(browser, fixtureId, productPath, theme = "light", viewport = { width: 1440, height: 900 }) {
  const context = await browser.newContext({ viewport });
  const showcase = await context.newPage();
  const product = await context.newPage();
  await setTheme(showcase, theme);
  await setTheme(product, theme);
  const unknown = await installApiFixtures(product);
  await showcase.goto(`${showcaseOrigin}/?embedded=1&workspace=gosso-admin&brand=gosso-admin#${fixtureId}`, { waitUntil: "networkidle" });
  await product.goto(`http://127.0.0.1:4173${productPath}`, { waitUntil: "networkidle" });
  await expect(showcase.locator("html")).toHaveAttribute("data-brand", "gosso-admin");
  await expect(product.locator("html")).toHaveAttribute("data-brand", "gosso-admin");
  return { context, showcase, product, unknown };
}

async function proveNoOverflow(...pages) {
  for (const page of pages) {
    expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1)).toBe(false);
  }
}

for (const theme of ["light", "dark"]) {
  test(`Overview hero and quick-link geometry match Showcase (${theme})`, async ({ browser }, testInfo) => {
    const pair = await openPair(browser, "gosso-overview", "/", theme);
    const showcaseHero = pair.showcase.getByRole("heading", { name: "身份管理控制台" }).locator('xpath=ancestor::*[@data-slot="card"][1]');
    const productHero = pair.product.getByRole("heading", { name: "身份管理控制台" }).locator('xpath=ancestor::*[@data-slot="card"][1]');
    expect(await styleFingerprint(productHero)).toEqual(await styleFingerprint(showcaseHero));
    const showcaseQuick = pair.showcase.getByText("客户端注册", { exact: true }).locator("xpath=ancestor::a[1]");
    const productQuick = pair.product.getByText("客户端注册", { exact: true }).locator("xpath=ancestor::a[1]");
    expect(await styleFingerprint(productQuick)).toEqual(await styleFingerprint(showcaseQuick));
    expect(await geometry(productQuick)).toEqual(await geometry(showcaseQuick));
    expect(pair.unknown).toEqual([]);
    await proveNoOverflow(pair.showcase, pair.product);
    await pairScreenshot(pair.showcase, pair.product, `overview-${theme}`, testInfo);
    await pair.context.close();
  });

  test(`Clients collection and action geometry match Showcase (${theme})`, async ({ browser }, testInfo) => {
    const pair = await openPair(browser, "gosso-system-clients", "/system-management/clients", theme);
    const showcaseTable = pair.showcase.locator("table").first();
    const productTable = pair.product.locator("table").first();
    expect(await styleFingerprint(productTable)).toEqual(await styleFingerprint(showcaseTable));
    const showcaseAction = pair.showcase.getByRole("button", { name: /编辑/ }).first();
    const productAction = pair.product.getByRole("button", { name: /编辑/ }).first();
    expect(await geometry(productAction)).toEqual(await geometry(showcaseAction));
    expect(pair.unknown).toEqual([]);
    await pairScreenshot(pair.showcase, pair.product, `clients-${theme}`, testInfo);
    await pair.context.close();
  });

  test(`Users collection and row-action geometry match Showcase (${theme})`, async ({ browser }, testInfo) => {
    const pair = await openPair(browser, "gosso-system-users", "/system-management/users", theme);
    const showcaseTable = pair.showcase.locator("table").first();
    const productTable = pair.product.locator("table").first();
    expect(await styleFingerprint(productTable)).toEqual(await styleFingerprint(showcaseTable));

    const showcaseAction = showcaseTable.locator("tbody tr").first().getByRole("button").first();
    const productAction = productTable.locator("tbody tr").first().getByRole("button").first();
    expect(await geometry(productAction)).toEqual(await geometry(showcaseAction));

    expect(pair.unknown).toEqual([]);
    await proveNoOverflow(pair.showcase, pair.product);
    await pairScreenshot(pair.showcase, pair.product, `users-${theme}`, testInfo);
    await pair.context.close();
  });

  test(`Audit log filters and collection match Showcase (${theme})`, async ({ browser }, testInfo) => {
    const pair = await openPair(browser, "gosso-system-audit-logs", "/system-management/audit-logs", theme);
    const showcaseFilter = pair.showcase.locator('[data-slot="card"]').first();
    const productFilter = pair.product.locator('[data-slot="card"]').first();
    expect(await styleFingerprint(productFilter)).toEqual(await styleFingerprint(showcaseFilter));

    const showcaseTable = pair.showcase.locator("table").first();
    const productTable = pair.product.locator("table").first();
    expect(await styleFingerprint(productTable)).toEqual(await styleFingerprint(showcaseTable));

    expect(pair.unknown).toEqual([]);
    await proveNoOverflow(pair.showcase, pair.product);
    await pairScreenshot(pair.showcase, pair.product, `audit-logs-${theme}`, testInfo);
    await pair.context.close();
  });

  test(`System status surfaces match Showcase (${theme})`, async ({ browser }, testInfo) => {
    const pair = await openPair(browser, "gosso-system-status", "/system-management/system", theme);
    const showcaseCard = pair.showcase.locator('[data-slot="card"]').first();
    const productCard = pair.product.locator('[data-slot="card"]').first();
    expect(await styleFingerprint(productCard)).toEqual(await styleFingerprint(showcaseCard));

    const showcaseRefresh = pair.showcase.getByRole("button", { name: /刷新状态/ }).first();
    const productRefresh = pair.product.getByRole("button", { name: /刷新状态|Refresh/i }).first();
    expect(await geometry(productRefresh)).toEqual(await geometry(showcaseRefresh));

    expect(pair.unknown).toEqual([]);
    await proveNoOverflow(pair.showcase, pair.product);
    await pairScreenshot(pair.showcase, pair.product, `system-status-${theme}`, testInfo);
    await pair.context.close();
  });

  test(`Site Settings form and LoginPreview sibling surfaces match Showcase (${theme})`, async ({ browser }, testInfo) => {
    const pair = await openPair(browser, "gosso-system-site-settings", "/system-management/site-settings", theme);
    const showcaseFormCard = pair.showcase.locator("form").locator('[data-slot="card"]').first();
    const productFormCard = pair.product.locator("form").locator('[data-slot="card"]').first();
    expect(await styleFingerprint(productFormCard)).toEqual(await styleFingerprint(showcaseFormCard));
    const showcasePreview = pair.showcase.getByText("登录页预览", { exact: true }).locator('xpath=ancestor::*[@data-slot="card"][1]');
    const productPreview = pair.product.getByText(/登录页预览|Login Page Preview/i).first().locator('xpath=ancestor::*[@data-slot="card"][1]');
    await expect(productPreview).toBeVisible();
    expect(await styleFingerprint(productPreview)).toEqual(await styleFingerprint(showcasePreview));
    expect(await productPreview.locator("form").count()).toBe(0);
    expect(pair.unknown).toEqual([]);
    await pairScreenshot(pair.showcase, pair.product, `site-settings-${theme}`, testInfo);
    await pair.context.close();
  });

  test(`Account Settings Tabs and profile surface match Showcase (${theme})`, async ({ browser }, testInfo) => {
    const pair = await openPair(browser, "gosso-account-settings", "/account-settings/profile", theme);
    const showcaseTabs = pair.showcase.getByRole("tablist");
    const productTabs = pair.product.getByRole("tablist");
    expect(await styleFingerprint(productTabs)).toEqual(await styleFingerprint(showcaseTabs));
    expect(await geometry(productTabs)).toEqual(await geometry(showcaseTabs));
    await expect(pair.showcase.getByRole("tab", { name: /个人资料/ })).toHaveAttribute("aria-selected", "true");
    await expect(pair.product.getByRole("tab", { name: /个人资料|Profile/i })).toHaveAttribute("aria-selected", "true");
    expect(pair.unknown).toEqual([]);
    await pairScreenshot(pair.showcase, pair.product, `account-tabs-${theme}`, testInfo);
    await pair.context.close();
  });

  for (const accountCase of [
    { key: "password", label: /修改密码/, path: "/account-settings/password", screenshot: "account-password" },
    { key: "passkeys", label: /通行密钥/, path: "/account-settings/passkeys", screenshot: "account-passkeys" },
    { key: "sessions", label: /活跃会话/, path: "/account-settings/sessions", screenshot: "account-sessions" },
  ]) {
    test(`Account Settings ${accountCase.key} surface matches Showcase (${theme})`, async ({ browser }, testInfo) => {
      const pair = await openPair(browser, "gosso-account-settings", accountCase.path, theme);
      await pair.showcase.getByRole("tab", { name: accountCase.label }).click();

      const showcaseTab = pair.showcase.getByRole("tab", { name: accountCase.label });
      const productTab = pair.product.getByRole("tab", { name: accountCase.label });
      await expect(showcaseTab).toHaveAttribute("aria-selected", "true");
      await expect(productTab).toHaveAttribute("aria-selected", "true");
      expect(await styleFingerprint(productTab)).toEqual(await styleFingerprint(showcaseTab));

      const showcaseSurface = pair.showcase.locator('[data-slot="card"]').first();
      const productSurface = pair.product.locator('[data-slot="card"]').first();
      expect(await styleFingerprint(productSurface)).toEqual(await styleFingerprint(showcaseSurface));
      expect(pair.unknown).toEqual([]);
      await proveNoOverflow(pair.showcase, pair.product);
      await pairScreenshot(pair.showcase, pair.product, `${accountCase.screenshot}-${theme}`, testInfo);
      await pair.context.close();
    });
  }

  test(`MFA state surface stays composition-compatible (${theme})`, async ({ browser }, testInfo) => {
    const pair = await openPair(browser, "gosso-account-settings", "/account-settings/mfa", theme);
    await pair.showcase.getByRole("tab", { name: /MFA/ }).click();
    const showcaseSurface = pair.showcase.locator('[data-slot="card"]').first();
    const productSurface = pair.product.locator('[data-slot="card"]').first();
    expect(await styleFingerprint(productSurface)).toEqual(await styleFingerprint(showcaseSurface));
    expect(pair.unknown).toEqual([]);
    await pairScreenshot(pair.showcase, pair.product, `mfa-${theme}`, testInfo);
    await pair.context.close();
  });

  test(`Login auth card width and primitive styles match Showcase (${theme})`, async ({ browser }, testInfo) => {
    const pair = await openPair(browser, "gosso-login", "/login", theme);
    const showcaseCard = pair.showcase.getByRole("heading", { name: "统一身份中心" }).locator('xpath=ancestor::*[@data-slot="card"][1]');
    const productCard = pair.product.getByRole("heading").first().locator('xpath=ancestor::*[@data-slot="card"][1]');
    expect(await styleFingerprint(productCard)).toEqual(await styleFingerprint(showcaseCard));
    expect(await width(productCard)).toBe(await width(showcaseCard));
    const showcasePassword = pair.showcase.locator('input[type="password"]');
    const productPassword = pair.product.locator('input[type="password"]');
    expect(await geometry(productPassword)).toEqual(await geometry(showcasePassword));
    expect(pair.unknown).toEqual([]);
    await proveNoOverflow(pair.showcase, pair.product);
    await pairScreenshot(pair.showcase, pair.product, `login-${theme}`, testInfo);
    await pair.context.close();
  });

  test(`Forgot password AuthPageSurface width and primitive styles match Showcase (${theme})`, async ({ browser }, testInfo) => {
    const pair = await openPair(browser, "gosso-forgot-password", "/forgot-password", theme);
    const showcaseCard = pair.showcase.locator('[data-slot="card"]').first();
    const productCard = pair.product.locator('[data-slot="card"]').first();
    expect(await styleFingerprint(productCard)).toEqual(await styleFingerprint(showcaseCard));
    expect(await width(productCard)).toBe(await width(showcaseCard));
    const showcaseInput = pair.showcase.locator('input[type="email"]');
    const productInput = pair.product.locator('input[type="email"]');
    expect(await geometry(productInput)).toEqual(await geometry(showcaseInput));
    expect(pair.unknown).toEqual([]);
    await pairScreenshot(pair.showcase, pair.product, `forgot-password-${theme}`, testInfo);
    await pair.context.close();
  });

  test(`Reset password AuthPageSurface matches Showcase (${theme})`, async ({ browser }, testInfo) => {
    const pair = await openPair(browser, "gosso-reset-password", "/reset-password#token=fixture-reset-token", theme);
    const showcaseCard = pair.showcase.locator('[data-slot="card"]').first();
    const productCard = pair.product.locator('[data-slot="card"]').first();
    expect(await styleFingerprint(productCard)).toEqual(await styleFingerprint(showcaseCard));
    expect(await width(productCard)).toBe(await width(showcaseCard));

    const showcasePassword = pair.showcase.locator('input[type="password"]').first();
    const productPassword = pair.product.locator('input[type="password"]').first();
    expect(await geometry(productPassword)).toEqual(await geometry(showcasePassword));

    expect(pair.unknown).toEqual([]);
    await proveNoOverflow(pair.showcase, pair.product);
    await pairScreenshot(pair.showcase, pair.product, `reset-password-${theme}`, testInfo);
    await pair.context.close();
  });

  test(`OAuth callback processing surface matches Showcase (${theme})`, async ({ browser }, testInfo) => {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const showcase = await context.newPage();
    const product = await context.newPage();
    await setTheme(showcase, theme);
    await setTheme(product, theme);
    await product.addInitScript(() => {
      sessionStorage.setItem("gosso-admin:auth_state", "fixture-state");
      sessionStorage.setItem("gosso-admin:pkce_verifier", "fixture-verifier");
    });
    const unknown = await installApiFixtures(product, {
      failTokenExchange: true,
      tokenExchangeDelayMs: 1000,
    });

    await showcase.goto(
      `${showcaseOrigin}/?embedded=1&workspace=gosso-admin&brand=gosso-admin#gosso-callback`,
      { waitUntil: "networkidle" },
    );
    await product.goto(
      "http://127.0.0.1:4173/callback?code=fixture-code&state=fixture-state",
      { waitUntil: "domcontentloaded" },
    );

    await expect(product.getByRole("status")).toBeVisible();
    const showcaseCard = showcase.locator('[data-slot="card"]').first();
    const productCard = product.locator('[data-slot="card"]').first();
    expect(await styleFingerprint(productCard)).toEqual(await styleFingerprint(showcaseCard));
    expect(await width(productCard)).toBe(await width(showcaseCard));

    const showcaseSpinner = showcase.getByRole("status").first();
    const productSpinner = product.getByRole("status").first();
    expect(await geometry(productSpinner)).toEqual(await geometry(showcaseSpinner));

    expect(unknown).toEqual([]);
    await proveNoOverflow(showcase, product);
    await pairScreenshot(showcase, product, `callback-processing-${theme}`, testInfo);
    await context.close();
  });

  test(`NotFound Result composition matches Showcase (${theme})`, async ({ browser }, testInfo) => {
    const pair = await openPair(browser, "gosso-not-found", "/missing-parity-route", theme);
    const showcaseCard = pair.showcase.locator('[data-slot="card"]').first();
    const productCard = pair.product.locator('[data-slot="card"]').first();
    expect(await styleFingerprint(productCard)).toEqual(await styleFingerprint(showcaseCard));
    expect(await width(productCard)).toBe(await width(showcaseCard));
    expect(await pair.product.locator('[data-slot="result"]').count()).toBe(await pair.showcase.locator('[data-slot="result"]').count());
    expect(pair.unknown).toEqual([]);
    await pairScreenshot(pair.showcase, pair.product, `not-found-${theme}`, testInfo);
    await pair.context.close();
  });
}
