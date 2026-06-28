#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:8080}"
ADMIN_USERNAME="${ADMIN_USERNAME:-admin}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-}"
SMOKE_ACCESS_TOKEN="${SMOKE_ACCESS_TOKEN:-}"
SMOKE_MUTATE="${SMOKE_MUTATE:-false}"

failures=0

check() {
  local name="$1"
  local method="$2"
  local path="$3"
  local expected="$4"
  local status
  status="$(curl -ksS -o /tmp/gosso-smoke-response.txt -w '%{http_code}' -X "$method" "$BASE_URL$path" || true)"
  if [ "$status" = "$expected" ]; then
    printf '[ok] %s (%s %s -> %s)\n' "$name" "$method" "$path" "$status"
  else
    failures=$((failures + 1))
    printf '[fail] %s expected %s got %s\n' "$name" "$expected" "$status"
    sed -n '1,8p' /tmp/gosso-smoke-response.txt || true
  fi
}

json_value() {
  python3 - "$1" <<'PY'
import json, sys
path = sys.argv[1].split(".")
data = json.load(sys.stdin)
for key in path:
    data = data[key]
print(data)
PY
}

printf '[info] Running smoke checks against %s\n' "$BASE_URL"

check "readiness" GET "/readiness" 200
check "OIDC discovery" GET "/.well-known/openid-configuration" 200
check "JWKS" GET "/.well-known/jwks.json" 200
check "Swagger route" GET "/swagger" 307

if [ -n "$SMOKE_ACCESS_TOKEN" ] || [ -n "$ADMIN_PASSWORD" ]; then
  printf '[info] Admin credentials provided; running authenticated admin API smoke checks\n'
  token="$SMOKE_ACCESS_TOKEN"
  if [ -z "$token" ]; then
    login_payload="$(printf '{"username":"%s","password":"%s"}' "$ADMIN_USERNAME" "$ADMIN_PASSWORD")"
    login_status="$(curl -ksS -o /tmp/gosso-smoke-login.json -w '%{http_code}' -H 'Content-Type: application/json' -d "$login_payload" "$BASE_URL/api/v1/auth/login" || true)"
    if [ "$login_status" != "200" ]; then
      failures=$((failures + 1))
      printf '[fail] admin login expected 200 got %s\n' "$login_status"
      sed -n '1,8p' /tmp/gosso-smoke-login.json || true
      token=""
    else
      token="$(json_value data.access_token < /tmp/gosso-smoke-login.json)"
      printf '[ok] admin login\n'
    fi
  else
    printf '[ok] using provided SMOKE_ACCESS_TOKEN\n'
  fi

  if [ -n "$token" ]; then
    accounts_status="$(curl -ksS -o /tmp/gosso-smoke-accounts.json -w '%{http_code}' -H "Authorization: Bearer $token" "$BASE_URL/api/v1/admin/accounts?page_size=1" || true)"
    if [ "$accounts_status" = "200" ]; then
      printf '[ok] admin accounts API\n'
    else
      failures=$((failures + 1))
      printf '[fail] admin accounts API expected 200 got %s\n' "$accounts_status"
    fi

    audit_status="$(curl -ksS -o /tmp/gosso-smoke-audit.json -w '%{http_code}' -H "Authorization: Bearer $token" "$BASE_URL/api/v1/admin/audit-logs?page_size=1" || true)"
    if [ "$audit_status" = "200" ]; then
      printf '[ok] admin audit API\n'
    else
      failures=$((failures + 1))
      printf '[fail] admin audit API expected 200 got %s\n' "$audit_status"
    fi

    if [ "$SMOKE_MUTATE" = "true" ]; then
      suffix="$(date +%s)"
      client_payload="$(printf '{"name":"Smoke Test Client %s","description":"Temporary P0 smoke client","redirect_uris":["http://localhost:8080/callback"],"grant_types":["authorization_code"],"scopes":["openid","profile","email"],"is_confidential":false}' "$suffix")"
      client_status="$(curl -ksS -o /tmp/gosso-smoke-client.json -w '%{http_code}' -H "Authorization: Bearer $token" -H 'Content-Type: application/json' -d "$client_payload" "$BASE_URL/api/v1/oauth2/clients" || true)"
      if [ "$client_status" = "201" ] || [ "$client_status" = "200" ]; then
        client_id="$(json_value data.client_id < /tmp/gosso-smoke-client.json)"
        printf '[ok] OAuth2 client create\n'
        delete_client_status="$(curl -ksS -o /tmp/gosso-smoke-client-delete.json -w '%{http_code}' -X DELETE -H "Authorization: Bearer $token" "$BASE_URL/api/v1/oauth2/clients/$client_id" || true)"
        if [ "$delete_client_status" = "200" ]; then
          printf '[ok] OAuth2 client cleanup\n'
        else
          failures=$((failures + 1))
          printf '[fail] OAuth2 client cleanup expected 200 got %s\n' "$delete_client_status"
        fi
      else
        failures=$((failures + 1))
        printf '[fail] OAuth2 client create expected 200/201 got %s\n' "$client_status"
        sed -n '1,8p' /tmp/gosso-smoke-client.json || true
      fi

      user_payload="$(printf '{"username":"smoke-%s","display_name":"Smoke Test User","email":"smoke-%s@example.test","password":"SmokeTestPassw0rd!"}' "$suffix" "$suffix")"
      user_status="$(curl -ksS -o /tmp/gosso-smoke-user.json -w '%{http_code}' -H "Authorization: Bearer $token" -H 'Content-Type: application/json' -d "$user_payload" "$BASE_URL/api/v1/admin/accounts" || true)"
      if [ "$user_status" = "201" ]; then
        account_id="$(json_value data.id < /tmp/gosso-smoke-user.json)"
        printf '[ok] admin user create\n'
        delete_user_status="$(curl -ksS -o /tmp/gosso-smoke-user-delete.json -w '%{http_code}' -X DELETE -H "Authorization: Bearer $token" "$BASE_URL/api/v1/admin/accounts/$account_id" || true)"
        if [ "$delete_user_status" = "200" ]; then
          printf '[ok] admin user cleanup\n'
        else
          failures=$((failures + 1))
          printf '[fail] admin user cleanup expected 200 got %s\n' "$delete_user_status"
        fi
      else
        failures=$((failures + 1))
        printf '[fail] admin user create expected 201 got %s\n' "$user_status"
        sed -n '1,8p' /tmp/gosso-smoke-user.json || true
      fi
    else
      printf '[info] SMOKE_MUTATE is not true; skipped client/user create cleanup checks\n'
    fi
  fi
else
  printf '[info] ADMIN_PASSWORD/SMOKE_ACCESS_TOKEN not set; skipped authenticated admin smoke checks\n'
fi

if [ "$failures" -gt 0 ]; then
  printf '\nSmoke checks failed with %d failure(s).\n' "$failures"
  exit 1
fi

printf '\nSmoke checks passed.\n'
