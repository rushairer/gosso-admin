#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENVIRONMENT="${1:-${GOSSO_ADMIN_ENV:-${GOUNO_ENV:-development}}}"
ENVIRONMENT="$(printf '%s' "$ENVIRONMENT" | tr '[:upper:]' '[:lower:]')"

failures=0
warnings=0

info() {
  printf '[info] %s\n' "$*"
}

warn() {
  warnings=$((warnings + 1))
  printf '[warn] %s\n' "$*"
}

fail() {
  failures=$((failures + 1))
  printf '[fail] %s\n' "$*"
}

is_production_like() {
  case "$ENVIRONMENT" in
    prod|production|staging|stage|preview|uat) return 0 ;;
    *) return 1 ;;
  esac
}

require_or_warn() {
  local value="$1"
  local message="$2"
  if is_production_like; then
    if [ -z "$value" ]; then fail "$message"; else info "$message: configured"; fi
  else
    if [ -z "$value" ]; then warn "$message"; else info "$message: configured"; fi
  fi
}

load_env_file() {
  local file="$1"
  if [ -f "$file" ]; then
    info "Loading environment defaults from ${file#$ROOT_DIR/}"
    set -a
    # shellcheck disable=SC1090
    . "$file"
    set +a
  fi
}

load_env_file "$ROOT_DIR/.env"
case "$ENVIRONMENT" in
  prod|production) load_env_file "$ROOT_DIR/.env.production" ;;
  development|dev|local) load_env_file "$ROOT_DIR/.env.development" ;;
  test|testing) load_env_file "$ROOT_DIR/.env.test" ;;
esac

info "Running GOSSO Admin preflight for environment: $ENVIRONMENT"

admin_password="${ADMIN_PASSWORD:-}"
if is_production_like; then
  if [ -z "$admin_password" ] || [ "$admin_password" = "admin123" ]; then
    fail "ADMIN_PASSWORD must be set and must not use the local development default"
  elif [ "${#admin_password}" -lt 12 ]; then
    fail "ADMIN_PASSWORD must be at least 12 characters"
  else
    info "ADMIN_PASSWORD is non-default"
  fi
else
  if [ -z "$admin_password" ] || [ "$admin_password" = "admin123" ]; then
    warn "ADMIN_PASSWORD uses the local development default; acceptable only for local demo"
  else
    info "ADMIN_PASSWORD is non-default"
  fi
fi

issuer="${GOUNO_AUTH_ISSUER:-}"
require_or_warn "$issuer" "GOUNO_AUTH_ISSUER"
if is_production_like && printf '%s' "$issuer" | grep -Eq '^http://|localhost|127\.0\.0\.1'; then
  fail "GOUNO_AUTH_ISSUER must be an HTTPS public origin in production-like environments"
fi

private_key="${GOUNO_AUTH_PRIVATE_KEY_PATH:-$ROOT_DIR/keys/private.pem}"
if [ -f "$private_key" ]; then
  info "RSA signing key exists at $private_key"
  perms="$(stat -f '%Lp' "$private_key" 2>/dev/null || stat -c '%a' "$private_key" 2>/dev/null || true)"
  if is_production_like && [ -n "$perms" ] && [ "$perms" -gt 600 ]; then
    fail "RSA signing key permissions are $perms; use 600 or stricter"
  fi
else
  if is_production_like; then fail "RSA signing key missing at $private_key"; else warn "RSA signing key missing at $private_key"; fi
fi

totp_key="${GOUNO_AUTH_TOTP_ENCRYPTION_KEY:-}"
if is_production_like && { [ -z "$totp_key" ] || printf '%s' "$totp_key" | grep -Eq '^0{64}$'; }; then
  fail "GOUNO_AUTH_TOTP_ENCRYPTION_KEY must be a unique 64-character hex key"
elif [ -z "$totp_key" ] || printf '%s' "$totp_key" | grep -Eq '^0{64}$'; then
  warn "GOUNO_AUTH_TOTP_ENCRYPTION_KEY is missing or uses the local all-zero default"
else
  info "GOUNO_AUTH_TOTP_ENCRYPTION_KEY is configured"
fi

pepper="${GOUNO_AUTH_VERIFY_HASH_PEPPER:-}"
if is_production_like && { [ -z "$pepper" ] || printf '%s' "$pepper" | grep -Eq '^0{64}$'; }; then
  fail "GOUNO_AUTH_VERIFY_HASH_PEPPER must be a unique secret"
elif [ -z "$pepper" ] || printf '%s' "$pepper" | grep -Eq '^0{64}$'; then
  warn "GOUNO_AUTH_VERIFY_HASH_PEPPER is missing or uses the local all-zero default"
else
  info "GOUNO_AUTH_VERIFY_HASH_PEPPER is configured"
fi

dsn="${GOUNO_DATABASE_DRIVERS_POSTGRES_DSN:-${PG_DSN:-}}"
require_or_warn "$dsn" "PostgreSQL DSN"
if is_production_like && printf '%s' "$dsn" | grep -Eq 'password=password|sslmode=disable'; then
  fail "PostgreSQL DSN must not use default password or sslmode=disable in production-like environments"
fi

redis_dsn="${GOUNO_REDIS_DSN:-}"
require_or_warn "$redis_dsn" "GOUNO_REDIS_DSN"
if is_production_like && printf '%s' "$redis_dsn" | grep -Eq '^redis://([^:@/]+@)?[^:]+:6379/|^redis://redis:6379/0$'; then
  fail "Redis DSN should include authentication and production-specific host/database"
fi

smtp_tls="${GOUNO_SMTP_TLS_POLICY:-}"
if is_production_like && [ "$smtp_tls" != "mandatory" ]; then
  fail "GOUNO_SMTP_TLS_POLICY must be mandatory in production-like environments"
elif [ -z "$smtp_tls" ] || [ "$smtp_tls" = "notls" ]; then
  warn "SMTP TLS policy is not production-safe"
else
  info "SMTP TLS policy: $smtp_tls"
fi

require_or_warn "${GOUNO_CORS_ALLOWED_ORIGINS:-}" "GOUNO_CORS_ALLOWED_ORIGINS"
require_or_warn "${GOUNO_WEB_SERVER_TRUSTED_PROXIES:-}" "GOUNO_WEB_SERVER_TRUSTED_PROXIES"

if is_production_like; then
  if grep -Rqs 'swagger' "$ROOT_DIR/nginx-gateway.conf"; then
    warn "Swagger route/config references detected; ensure Swagger is disabled or access-controlled in production"
  fi
fi

if [ "$failures" -gt 0 ]; then
  printf '\nPreflight failed with %d failure(s) and %d warning(s).\n' "$failures" "$warnings"
  exit 1
fi

printf '\nPreflight completed with %d warning(s).\n' "$warnings"
