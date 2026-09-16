export const adminProfile = {
  sub: "account-admin-001",
  name: "Aben Admin",
  preferred_username: "admin",
  email: "admin@example.com",
  roles: ["admin"],
  scope: "openid profile email admin",
};

export const publicBranding = {
  product_name: "GOSSO",
  logo_url: "",
  favicon_url: "",
  login_title: "Sign in to GOSSO",
  login_description: "Identity and access management",
  login_background_url: "",
};

export const clients = [
  {
    account_id: "account-admin-001",
    client_id: "blog-admin",
    name: "Blog Admin",
    description: "Gouno Blog administration console",
    redirect_uris: ["https://blog.example.com/auth/callback"],
    post_logout_redirect_uris: ["https://blog.example.com/"],
    grant_types: ["authorization_code", "refresh_token"],
    scopes: ["openid", "profile", "email", "admin"],
    is_confidential: true,
    allowed_resources: ["https://blog.example.com/api"],
  },
  {
    account_id: "account-user-002",
    client_id: "developer-spa",
    name: "Developer SPA",
    description: "Public PKCE client",
    redirect_uris: ["http://localhost:5173/callback"],
    grant_types: ["authorization_code", "refresh_token"],
    scopes: ["openid", "profile", "email"],
    is_confidential: false,
  },
];

export const accounts = [
  {
    id: "account-admin-001",
    username: "admin",
    display_name: "Aben Admin",
    status: "active",
    created_at: "2026-08-01T08:00:00Z",
    roles: [{ id: "role-admin", name: "admin", description: "Administrator" }],
  },
  {
    id: "account-user-002",
    username: "demo-user",
    display_name: "Demo User",
    status: "active",
    created_at: "2026-08-12T10:30:00Z",
    roles: [{ id: "role-user", name: "user", description: "Standard user" }],
  },
];

export const auditLogs = [
  {
    id: "audit-001",
    action: "auth.login.success",
    event_type: "auth.login.success",
    actor: "admin",
    account_id: "account-admin-001",
    created_at: "2026-09-13T06:42:00Z",
    resource: { client_id: "gosso-admin-spa" },
    meta: { ip: "127.0.0.1", method: "passkey" },
  },
  {
    id: "audit-002",
    action: "oauth.client.updated",
    event_type: "oauth.client.updated",
    actor: "admin",
    account_id: "account-admin-001",
    created_at: "2026-09-13T06:38:00Z",
    resource: { client_id: "blog-admin" },
    meta: { fields: ["redirect_uris"] },
  },
];

export const siteSettings = {
  product_name: "GOSSO",
  logo_url: "",
  favicon_url: "",
  login_title: "Welcome back",
  login_description: "Continue to the identity center",
  login_background_url: "",
};

export const securityPolicy = {
  session_ttl: "12 hours",
  max_sessions: 10,
  max_session_age: "30 days",
  access_token_expiry: "15 min",
  refresh_token_expiry: "30 days",
  id_token_expiry: "15 min",
  enforce_ip_binding: false,
  enforce_pkce_for_confidential: true,
  login_max_attempts: 8,
  login_rate_limit_window: "15 min",
  mfa_account_max_attempts: 6,
  mfa_account_rate_limit_window: "10 min",
  password_reset_token_ttl: "15 min",
  webauthn_enabled: true,
};

export const readiness = {
  status: "ok",
  ready: true,
  checks: {
    database: "ok",
    redis: "ok",
  },
  checked_at: "2026-09-13T06:45:00Z",
  duration_ms: 12,
};

export const oidcConfiguration = {
  issuer: "http://127.0.0.1:4173",
  authorization_endpoint: "http://127.0.0.1:4173/oauth2/authorize",
  token_endpoint: "http://127.0.0.1:4173/oauth2/token",
  userinfo_endpoint: "http://127.0.0.1:4173/oidc/userinfo",
  jwks_uri: "http://127.0.0.1:4173/.well-known/jwks.json",
  scopes_supported: ["openid", "profile", "email", "admin"],
  grant_types_supported: ["authorization_code", "refresh_token", "client_credentials"],
  response_types_supported: ["code"],
  subject_types_supported: ["public"],
  id_token_signing_alg_values_supported: ["RS256"],
};

export const mfaStatus = {
  enabled: true,
  types: ["totp"],
};

export const passkeys = [
  {
    id: "passkey-001",
    name: "MacBook Touch ID",
    created_at: "2026-09-01T04:00:00Z",
  },
];

export const sessions = [
  {
    id: "session-current",
    ip: "127.0.0.1",
    user_agent: "Chrome on macOS",
    created_at: "2026-09-13T05:30:00Z",
    last_active_at: "2026-09-13T06:45:00Z",
  },
  {
    id: "session-mobile",
    ip: "10.0.0.8",
    user_agent: "Safari on iPhone",
    created_at: "2026-09-12T12:00:00Z",
    last_active_at: "2026-09-13T03:10:00Z",
  },
];

export const currentSession = sessions[0];
