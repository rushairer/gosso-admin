export type DependencyStatus = 'ok' | 'unavailable' | 'error' | 'unknown';

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
