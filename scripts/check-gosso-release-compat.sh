#!/usr/bin/env bash
set -euo pipefail

GOSSO_RELEASE_VERSION="${GOSSO_RELEASE_VERSION:-1.6.1}"
GOSSO_RELEASE_DIGEST="${GOSSO_RELEASE_DIGEST:-sha256:cf3c321279b9860bbbcf30735dcd0d3a3465151075420d8fa70d6d66e580838b}"
GOSSO_COMPAT_PORT="${GOSSO_COMPAT_PORT:-18080}"
ADMIN_USERNAME="${ADMIN_USERNAME:-compat-admin}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-CompatAdminPassword123}"

export GOSSO_IMAGE_TAG="v${GOSSO_RELEASE_VERSION}@${GOSSO_RELEASE_DIGEST}"
key_dir="$(mktemp -d)"
override_file="$(mktemp)"
cat >"$override_file" <<EOF
services:
  gosso:
    environment:
      GOUNO_WEB_SERVER_DEBUG: "false"
    ports:
      - "127.0.0.1:${GOSSO_COMPAT_PORT}:8080"
    volumes:
      - "${key_dir}:/app/keys"
EOF

compose=(docker compose -f docker-compose.yml -f "$override_file")

cleanup() {
  rc=$?
  trap - EXIT
  if [ "$rc" -ne 0 ]; then
    printf '\n[compat] failure diagnostics\n' >&2
    "${compose[@]}" ps >&2 || true
    "${compose[@]}" logs --no-color gosso db redis >&2 || true
  fi
  "${compose[@]}" down -v --remove-orphans >/dev/null 2>&1 || true
  sudo chown -R "$(id -u):$(id -g)" "$key_dir" 2>/dev/null || true
  rm -rf "$key_dir" "$override_file"
  exit "$rc"
}
trap cleanup EXIT

printf '[compat] Gosso release: v%s@%s\n' "$GOSSO_RELEASE_VERSION" "$GOSSO_RELEASE_DIGEST"

resolved_image="ghcr.io/rushairer/gosso:${GOSSO_IMAGE_TAG}"
if ! "${compose[@]}" config | grep -Fq "image: ${resolved_image}"; then
  echo "[compat] compose did not resolve the pinned Gosso release image" >&2
  exit 1
fi

"${compose[@]}" pull gosso

# Do not guess the numeric UID behind Alpine's system user. Query the published
# image itself, then keep the signing key at 0600 and assign it to that exact
# runtime identity. The temporary mount also avoids mutating repository files.
runtime_uid="$(docker run --rm --entrypoint id "$resolved_image" -u)"
runtime_gid="$(docker run --rm --entrypoint id "$resolved_image" -g)"
openssl genpkey -algorithm RSA -out "$key_dir/private.pem" -pkeyopt rsa_keygen_bits:2048 >/dev/null 2>&1
chmod 700 "$key_dir"
chmod 600 "$key_dir/private.pem"
if [ "$(id -u)" -eq 0 ]; then
  chown -R "${runtime_uid}:${runtime_gid}" "$key_dir"
else
  sudo chown -R "${runtime_uid}:${runtime_gid}" "$key_dir"
fi
printf '[ok] signing key remains 0600 and is owned by release runtime uid=%s gid=%s\n' "$runtime_uid" "$runtime_gid"

"${compose[@]}" up -d db redis mailpit gosso

ready=false
for _ in $(seq 1 60); do
  if curl -fsS "http://127.0.0.1:${GOSSO_COMPAT_PORT}/readiness" >/tmp/gosso-compat-readiness.json 2>/dev/null; then
    ready=true
    break
  fi
  sleep 2
done
if [ "$ready" != "true" ]; then
  echo "[compat] Gosso v${GOSSO_RELEASE_VERSION} did not become ready" >&2
  exit 1
fi
printf '[ok] release image booted, migrated, and became ready\n'

(
  cd seed
  GOSSO_ADMIN_ENV=development \
  PG_DSN='host=127.0.0.1 user=postgres password=password dbname=gosso port=5432 sslmode=disable' \
  ADMIN_USERNAME="$ADMIN_USERNAME" \
  ADMIN_PASSWORD="$ADMIN_PASSWORD" \
  ADMIN_DISPLAY_NAME='Compatibility Admin' \
  OAUTH2_CLIENT_REDIRECT_URIS='http://localhost:8080/callback' \
  go run .
)

client_policy="$("${compose[@]}" exec -T db psql -U postgres -d gosso -Atc \
  "SELECT CASE WHEN COUNT(*) = 1 THEN 'ok' ELSE 'bad' END FROM oauth2_clients WHERE client_id = 'gosso-admin-spa' AND is_confidential = false AND grant_types ? 'authorization_code' AND grant_types ? 'refresh_token' AND scopes ? 'openid' AND scopes ? 'admin';")"
if [ "$client_policy" != "ok" ]; then
  echo "[compat] gosso-admin-spa seed policy is incompatible with Gosso v${GOSSO_RELEASE_VERSION}" >&2
  exit 1
fi
printf '[ok] current Admin seed is compatible with release schema and policy\n'

discovery="$(curl -fsS "http://127.0.0.1:${GOSSO_COMPAT_PORT}/.well-known/openid-configuration")"
printf '%s' "$discovery" | python3 -c 'import json,sys; d=json.load(sys.stdin); assert d["issuer"] == "http://localhost:8080"; assert "S256" in d["code_challenge_methods_supported"]'
jwks="$(curl -fsS "http://127.0.0.1:${GOSSO_COMPAT_PORT}/.well-known/jwks.json")"
printf '%s' "$jwks" | python3 -c 'import json,sys; d=json.load(sys.stdin); assert len(d.get("keys", [])) >= 1; assert all(k.get("kty") == "RSA" for k in d["keys"])'
printf '[ok] discovery, PKCE metadata, and JWKS are available\n'

login_payload="$(printf '{"username":"%s","password":"%s"}' "$ADMIN_USERNAME" "$ADMIN_PASSWORD")"
login_json="$(curl -fsS -H 'Content-Type: application/json' -d "$login_payload" "http://127.0.0.1:${GOSSO_COMPAT_PORT}/api/v1/auth/login")"
access_token="$(printf '%s' "$login_json" | python3 -c 'import json,sys; d=json.load(sys.stdin); print(d["data"]["access_token"])')"
if [ -z "$access_token" ]; then
  echo '[compat] token-mode login did not return an access token' >&2
  exit 1
fi
curl -fsS -H "Authorization: Bearer ${access_token}" \
  "http://127.0.0.1:${GOSSO_COMPAT_PORT}/api/v1/admin/accounts?page_size=1" >/tmp/gosso-compat-accounts.json
printf '[ok] live user-session principal can access Admin control plane\n'

curl -fsS -D /tmp/gosso-compat-cookie-headers.txt -o /tmp/gosso-compat-cookie-login.json \
  -H 'Content-Type: application/json' \
  -H 'X-Gosso-Cookie-Session: 1' \
  -H 'X-Forwarded-Proto: https' \
  -d "$login_payload" \
  "http://127.0.0.1:${GOSSO_COMPAT_PORT}/api/v1/auth/login"

cookie_value="$(python3 - <<'PY'
import json
import re

with open('/tmp/gosso-compat-cookie-login.json', encoding='utf-8') as fh:
    body = json.load(fh)
data = body.get('data') or {}
assert 'access_token' not in data and 'refresh_token' not in data, 'cookie mode exposed bearer tokens'

headers = open('/tmp/gosso-compat-cookie-headers.txt', encoding='utf-8').read()
match = re.search(r'(?im)^set-cookie:\s*__Host-gosso-session=([^;\r\n]+);([^\r\n]*)$', headers)
assert match, '__Host-gosso-session cookie missing'
attrs = match.group(2).lower()
for required in ('path=/', 'httponly', 'secure', 'samesite=lax'):
    assert required in attrs, f'missing cookie attribute: {required}'
print(match.group(1))
PY
)"

cookie_header="Cookie: __Host-gosso-session=${cookie_value}"
curl -fsS -H "$cookie_header" -H 'X-Forwarded-Proto: https' \
  "http://127.0.0.1:${GOSSO_COMPAT_PORT}/api/v1/auth/session" >/tmp/gosso-compat-session.json
curl -fsS -H "$cookie_header" -H 'X-Forwarded-Proto: https' \
  "http://127.0.0.1:${GOSSO_COMPAT_PORT}/api/v1/admin/accounts?page_size=1" >/tmp/gosso-compat-cookie-accounts.json
printf '[ok] HttpOnly cookie session hides bearer tokens and retains Admin authority\n'

pkce_verifier='gosso-admin-release-compatibility-verifier-0123456789-ABCDE'
pkce_challenge="$(printf '%s' "$pkce_verifier" | python3 -c 'import base64,hashlib,sys; print(base64.urlsafe_b64encode(hashlib.sha256(sys.stdin.buffer.read()).digest()).rstrip(b"=").decode())')"
authorize_url="http://127.0.0.1:${GOSSO_COMPAT_PORT}/oauth2/authorize?response_type=code&client_id=gosso-admin-spa&redirect_uri=http%3A%2F%2Flocalhost%3A8080%2Fcallback&scope=openid%20profile%20email%20admin&state=compat-state&code_challenge=${pkce_challenge}&code_challenge_method=S256"
authorize_status="$(curl -sS -D /tmp/gosso-compat-authorize-headers.txt -o /tmp/gosso-compat-authorize-body.txt -w '%{http_code}' \
  -H "$cookie_header" -H 'X-Forwarded-Proto: https' "$authorize_url")"
case "$authorize_status" in
  200) ;;
  302)
    if grep -Eqi '^location: .*/login([?[:space:]]|$)' /tmp/gosso-compat-authorize-headers.txt; then
      echo '[compat] PKCE authorization did not recognize the live cookie session' >&2
      exit 1
    fi
    ;;
  *)
    echo "[compat] PKCE authorization returned HTTP ${authorize_status}" >&2
    sed -n '1,20p' /tmp/gosso-compat-authorize-body.txt >&2 || true
    exit 1
    ;;
esac
printf '[ok] seeded Admin SPA is accepted for Authorization Code + PKCE S256\n'

printf '\nGosso v%s compatibility acceptance passed.\n' "$GOSSO_RELEASE_VERSION"
