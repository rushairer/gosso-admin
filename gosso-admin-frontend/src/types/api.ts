export type DependencyStatus = 'ok' | 'unavailable' | 'error' | 'unknown';

export interface Role {
  id: string;
  name: string;
  description?: string;
}

export interface Account {
  id: string;
  username: string;
  display_name: string;
  status: string;
  created_at?: string;
  roles?: Role[];
}

export interface OAuth2Client {
  client_id: string;
  name: string;
  description: string;
  redirect_uris: string[];
  post_logout_redirect_uris?: string[];
  grant_types: string[];
  scopes: string[];
  is_confidential: boolean;
  allowed_resources?: string[];
  metadata?: Record<string, unknown>;
}

export interface AuditLog {
  id: string;
  action: string;
  actor: string;
  account_id?: string;
  event_type?: string;
  created_at?: string;
  resource?: Record<string, unknown>;
  meta?: Record<string, unknown>;
}

export interface Consent {
  client_id: string;
  scopes?: string[];
  granted_at?: string;
}

export interface OidcConfiguration {
  issuer: string;
  authorization_endpoint: string;
  token_endpoint: string;
  userinfo_endpoint: string;
  jwks_uri: string;
  scopes_supported?: string[];
  grant_types_supported?: string[];
  response_types_supported?: string[];
  subject_types_supported?: string[];
  id_token_signing_alg_values_supported?: string[];
}

export interface SiteSettings {
  product_name: string;
  logo_url: string;
  favicon_url: string;
  login_title: string;
  login_description: string;
  login_background_url: string;
}

export type PublicSiteBranding = SiteSettings;

export interface SecurityPolicy {
  session_ttl: string;
  max_sessions: number;
  max_session_age: string;
  access_token_expiry: string;
  refresh_token_expiry: string;
  id_token_expiry: string;
  enforce_ip_binding: boolean;
  enforce_pkce_for_confidential: boolean;
  login_max_attempts: number;
  login_rate_limit_window: string;
  mfa_account_max_attempts: number;
  mfa_account_rate_limit_window: string;
  password_reset_token_ttl: string;
  webauthn_enabled: boolean;
}

export interface LockoutCounter {
  attempts: number;
  window_seconds: number;
}

export interface LockoutStatus {
  locked_out: boolean;
  counters: LockoutCounter[];
}

export interface WebAuthnCredential {
  id: string;
  type: string;
  transports?: string[];
}

export interface WebAuthnRegistrationOptions {
  challenge: string;
  rp: { name: string; id: string };
  user: { id: string; name: string; displayName: string };
  pubKeyCredParams: unknown[];
  excludeCredentials?: WebAuthnCredential[];
  authenticatorSelection?: Record<string, unknown>;
  timeout?: number;
}

export interface WebAuthnLoginOptions {
  challenge: string;
  allowCredentials?: WebAuthnCredential[];
  timeout?: number;
  rpId?: string;
  userVerification?: string;
}
