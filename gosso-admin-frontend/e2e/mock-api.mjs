import {
  accounts,
  adminProfile,
  auditLogs,
  clients,
  currentSession,
  mfaStatus,
  oidcConfiguration,
  passkeys,
  publicBranding,
  readiness,
  securityPolicy,
  sessions,
  siteSettings,
} from "./fixtures.mjs";

const envelope = (data) => JSON.stringify({ data });

const json = (route, data, status = 200) =>
  route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(data),
  });

const enveloped = (route, data, status = 200) =>
  route.fulfill({
    status,
    contentType: "application/json",
    body: envelope(data),
  });

function isProductRequest(path) {
  return (
    path.startsWith("/api/v1/") ||
    path.startsWith("/oidc/") ||
    path.startsWith("/.well-known/") ||
    path === "/readiness"
  );
}

export async function installApiFixtures(page, options = {}) {
  const unknown = [];
  const profile = options.profile || adminProfile;
  let remainingSettingsFailures = options.failSettingsCount || 0;
  let remainingReadinessFailures = options.failReadinessCount || 0;
  let remainingLoginFailures = options.failLoginCount || 0;

  await page.route("**/*", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;
    const method = request.method();

    if (!isProductRequest(path)) {
      await route.continue();
      return;
    }

    if (path === "/api/v1/auth/login" && method === "POST") {
      if (remainingLoginFailures > 0) {
        remainingLoginFailures -= 1;
        return json(route, { message: "browser injected login failure" }, 401);
      }
      if (options.loginRequiresMfa) {
        return enveloped(route, { requires_mfa: true, mfa_token: "fixture-mfa-token" });
      }
    }

    if (method !== "GET" && method !== "HEAD") {
      await enveloped(route, null);
      return;
    }

    if (path === "/oidc/userinfo") return json(route, profile);
    if (path === "/api/v1/public/site-branding") return enveloped(route, publicBranding);
    if (path === "/api/v1/oauth2/clients") return enveloped(route, clients);
    if (path === "/api/v1/admin/accounts") {
      return enveloped(route, { items: accounts, total: accounts.length });
    }
    if (path === "/api/v1/admin/audit-logs") {
      return enveloped(route, { items: auditLogs, total: auditLogs.length });
    }
    if (path === "/api/v1/admin/site-settings") {
      if (remainingSettingsFailures > 0) {
        remainingSettingsFailures -= 1;
        return json(route, { message: "browser injected settings failure" }, 500);
      }
      return enveloped(route, siteSettings);
    }
    if (path === "/api/v1/admin/security-policy") return enveloped(route, securityPolicy);
    if (path === "/api/v1/auth/mfa") return enveloped(route, mfaStatus);
    if (path === "/api/v1/passkeys") return enveloped(route, passkeys);
    if (path === "/api/v1/auth/sessions") return enveloped(route, sessions);
    if (path === "/api/v1/auth/session") return enveloped(route, currentSession);
    if (path === "/readiness") {
      if (remainingReadinessFailures > 0) {
        remainingReadinessFailures -= 1;
        return json(route, { status: "error", ready: false, checks: {} }, 503);
      }
      return json(route, readiness);
    }
    if (path === "/.well-known/openid-configuration") return json(route, oidcConfiguration);

    unknown.push(`${method} ${path}`);
    return enveloped(route, null);
  });

  return unknown;
}

export async function setTheme(page, theme) {
  await page.addInitScript((mode) => {
    localStorage.setItem("gosso-admin:theme", mode);
    localStorage.setItem("gosso_lang", "zh");
  }, theme);
  await page.emulateMedia({ colorScheme: theme });
}
