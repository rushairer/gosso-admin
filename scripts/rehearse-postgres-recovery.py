#!/usr/bin/env python3
"""Rehearse disposable local PostgreSQL recovery; never accept target Staging."""
import argparse
import base64
import hashlib
import json
import os
import pathlib
import secrets
import subprocess
import tempfile
import time
import urllib.request
import urllib.error
import urllib.parse

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--output', type=pathlib.Path, required=True)
parser.add_argument('--cosign', default='cosign')
options = parser.parse_args()
ROOT = options.output.resolve()
if ROOT.exists() and any(ROOT.iterdir()):
    raise SystemExit('Output directory must be empty; preserve previous receipts.')
ROOT.mkdir(parents=True, exist_ok=True)
ADMIN_ROOT = pathlib.Path(__file__).resolve().parents[1]
IMAGE = 'ghcr.io/rushairer/gosso:v1.7.2@sha256:bf398c6c2129da2f68c030dece3ceb52f8f5a7a6036a58b797c8e3f0619b5e90'
prefix = 'gouno-recovery-' + secrets.token_hex(5)
network = prefix + '-net'
volume = prefix + '-keys'
containers = []
receipt = {'scope': 'disposable local PostgreSQL15 recovery rehearsal; not target Staging, production, upgrade or version rollback acceptance', 'gosso_image': IMAGE, 'checks': {}, 'ok': False}

def command(args, env=None, data=None, cwd=None):
    p = subprocess.run(args, env=env, input=data, capture_output=True, cwd=cwd)
    if p.returncode:
        raise RuntimeError('Command failed: ' + args[0] + ' ' + args[1] + ' (environment and diagnostics withheld)')
    return p.stdout

def docker(*args, env=None, data=None):
    return command(['docker', *args], env, data)

def check(name, value=True):
    if not value:
        raise RuntimeError('Check failed: ' + name)
    receipt['checks'][name] = True
    print('[ok] ' + name, flush=True)

def ready(name):
    for _ in range(60):
        p = subprocess.run(['docker', 'exec', name, 'pg_isready', '-U', 'gosso'], capture_output=True)
        if p.returncode == 0:
            return
        time.sleep(1)
    raise RuntimeError('Postgres readiness failed')

def port(name, private):
    return docker('port', name, private).decode().strip().rsplit(':', 1)[1]

def api(base, path, method='GET', payload=None, token=None, headers=None):
    h = dict(headers or {})
    body = payload
    if isinstance(payload, dict):
        body = json.dumps(payload).encode()
        h['Content-Type'] = 'application/json'
    if token:
        h['Authorization'] = 'Bearer ' + token
    req = urllib.request.Request(base + path, data=body, headers=h, method=method)
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            return (r.status, json.load(r))
    except urllib.error.HTTPError as e:
        return (e.code, json.load(e))

def login(base, password):
    status, body = api(base, '/api/v1/auth/login', 'POST', {'username': 'recovery-admin', 'password': password})
    check('fresh_admin_login_' + str(len(receipt['checks'])), status == 200)
    return body['data']['access_token']

def create(base, token, name):
    status, body = api(base, '/api/v1/admin/oauth2/clients', 'POST', {'name': name, 'redirect_uris': ['https://recovery.example.test/callback'], 'grant_types': ['authorization_code'], 'scopes': ['openid'], 'is_confidential': True}, token)
    check('create_' + name, status in (200, 201))
    return body['data']
try:
    with tempfile.TemporaryDirectory(prefix=prefix + '-private-') as private:
        private = pathlib.Path(private)
        os.chmod(private, 0o700)
        key = private / 'rsa.pem'
        command(['openssl', 'genpkey', '-algorithm', 'RSA', '-pkeyopt', 'rsa_keygen_bits:2048', '-out', str(key)])
        os.chmod(key, 0o600)
        pwfile = private / 'backup-key'
        pwfile.write_text(secrets.token_hex(32))
        os.chmod(pwfile, 0o600)
        seed_binary = private / 'seed'
        command(['go', 'build', '-o', str(seed_binary), '.'], cwd=ADMIN_ROOT / 'seed')
        verified = command([options.cosign, 'verify', '--certificate-identity', 'https://github.com/rushairer/gosso/.github/workflows/release.yml@refs/tags/v1.7.2', '--certificate-oidc-issuer', 'https://token.actions.githubusercontent.com', IMAGE])
        signatures = json.loads(verified)
        check('exact_formal_image_signature', bool(signatures))
        (ROOT / 'gosso-cosign-verification.json').write_text(json.dumps(signatures, indent=2) + '\n')
        docker('pull', IMAGE)
        docker('pull', 'postgres:15-alpine')
        docker('pull', 'redis:7-alpine')
        receipt['seed_repository_head'] = command(['git', 'rev-parse', 'HEAD'], cwd=ADMIN_ROOT).decode().strip()
        pgpassword = secrets.token_hex(24)
        adminpassword = secrets.token_urlsafe(30)
        totp = secrets.token_hex(32)
        pepper = secrets.token_hex(32)
        pgimage = json.loads(docker('image', 'inspect', 'postgres:15-alpine'))[0]['RepoDigests'][0]
        redisimage = json.loads(docker('image', 'inspect', 'redis:7-alpine'))[0]['RepoDigests'][0]
        receipt.update({'postgres_image': pgimage, 'redis_image': redisimage})
        docker('network', 'create', network)
        docker('volume', 'create', volume)
        uid = docker('run', '--rm', '--entrypoint', 'id', IMAGE, '-u').decode().strip()
        gid = docker('run', '--rm', '--entrypoint', 'id', IMAGE, '-g').decode().strip()
        docker('run', '--rm', '--user', '0', '-v', volume + ':/keys', '--mount', 'type=bind,source=' + str(key) + ',target=/input.pem,readonly', '--entrypoint', 'sh', IMAGE, '-c', 'cp /input.pem /keys/private.pem && chmod 600 /keys/private.pem && chown ' + uid + ':' + gid + ' /keys/private.pem')
        pg = prefix + '-pg'
        containers.append(pg)
        docker('run', '-d', '--name', pg, '--network', network, '--network-alias', 'db', '--tmpfs', '/var/lib/postgresql/data', '-p', '127.0.0.1::5432', '-e', 'POSTGRES_USER=gosso', '-e', 'POSTGRES_DB=gosso', '-e', 'POSTGRES_PASSWORD', pgimage, env=dict(os.environ, POSTGRES_PASSWORD=pgpassword))
        ready(pg)
        redis = prefix + '-redis'
        containers.append(redis)
        docker('run', '-d', '--name', redis, '--network', network, '--network-alias', 'redis', redisimage)

        def start_app(suffix, dbname, redisdb):
            name = prefix + '-' + suffix
            containers.append(name)
            env = dict(os.environ, GOUNO_ENV='development', GOUNO_WEB_SERVER_ADDRESS='0.0.0.0', GOUNO_WEB_SERVER_PORT='8080', GOUNO_WEB_SERVER_DEBUG='false', GOUNO_DATABASE_DEFAULT='postgres', GOUNO_DATABASE_DRIVERS_POSTGRES_DSN=f'host=db user=gosso password={pgpassword} dbname={dbname} port=5432 sslmode=disable search_path=public', GOUNO_REDIS_DSN=f'redis://redis:6379/{redisdb}', GOUNO_AUTH_ISSUER='http://localhost:8080', GOUNO_AUTH_LOGIN_URL='/login', GOUNO_AUTH_PRIVATE_KEY_PATH='/app/keys/private.pem', GOUNO_AUTH_TOTP_ENCRYPTION_KEY=totp, GOUNO_AUTH_VERIFY_HASH_PEPPER=pepper)
            args = ['run', '-d', '--name', name, '--network', network, '-p', '127.0.0.1::8080', '-v', volume + ':/app/keys:ro']
            for k in env:
                if k in {'GOUNO_ENV', 'GOUNO_WEB_SERVER_ADDRESS', 'GOUNO_WEB_SERVER_PORT', 'GOUNO_WEB_SERVER_DEBUG', 'GOUNO_DATABASE_DEFAULT', 'GOUNO_DATABASE_DRIVERS_POSTGRES_DSN', 'GOUNO_REDIS_DSN', 'GOUNO_AUTH_ISSUER', 'GOUNO_AUTH_LOGIN_URL', 'GOUNO_AUTH_PRIVATE_KEY_PATH', 'GOUNO_AUTH_TOTP_ENCRYPTION_KEY', 'GOUNO_AUTH_VERIFY_HASH_PEPPER'}:
                    args += ['-e', k]
            docker(*args, IMAGE, 'web', '-e', 'development', env=env)
            base = 'http://127.0.0.1:' + port(name, '8080/tcp')
            for _ in range(60):
                try:
                    status, _ = api(base, '/readiness')
                    if status == 200:
                        return (name, base)
                except Exception:
                    pass
                time.sleep(1)
            raise RuntimeError('Gosso readiness failed')
        app, base = start_app('source', 'gosso', 0)
        seedenv = dict(os.environ, GOSSO_ADMIN_ENV='test', PG_DSN=f"host=127.0.0.1 user=gosso password={pgpassword} dbname=gosso port={port(pg, '5432/tcp')} sslmode=disable", ADMIN_USERNAME='recovery-admin', ADMIN_PASSWORD=adminpassword, ADMIN_DISPLAY_NAME='Disposable Recovery Admin', OAUTH2_CLIENT_REDIRECT_URIS='http://localhost:8080/callback')
        # Never let inherited operator secret-file variables redirect the Seed.
        seedenv.pop('PG_DSN_FILE', None)
        seedenv.pop('ADMIN_PASSWORD_FILE', None)
        command([str(seed_binary)], seedenv)
        check('current_Admin_seed_on_formal_Gosso')
        token = login(base, adminpassword)
        baseline = create(base, token, 'baseline')
        dump = docker('exec', pg, 'pg_dump', '-U', 'gosso', '-Fc', '--no-owner', '--no-acl', 'gosso')
        encrypted = command(['openssl', 'enc', '-aes-256-cbc', '-pbkdf2', '-salt', '-pass', 'file:' + str(pwfile)], data=dump)
        check('backup_encrypted', encrypted != dump and encrypted.startswith(b'Salted__'))
        decrypted = command(['openssl', 'enc', '-d', '-aes-256-cbc', '-pbkdf2', '-pass', 'file:' + str(pwfile)], data=encrypted)
        check('encrypted_backup_roundtrip', hashlib.sha256(dump).digest() == hashlib.sha256(decrypted).digest())
        receipt['backup'] = {'format': 'pg_dump custom', 'encryption': 'AES-256-CBC PBKDF2; disposable key destroyed after rehearsal', 'encrypted_sha256': hashlib.sha256(encrypted).hexdigest(), 'plaintext_sha256': hashlib.sha256(dump).hexdigest(), 'bytes': len(dump)}
        later = create(base, token, 'after-backup')
        docker('stop', app)
        docker('exec', pg, 'createdb', '-U', 'gosso', 'gosso_restore')
        docker('exec', '-i', pg, 'pg_restore', '-U', 'gosso', '-d', 'gosso_restore', '--exit-on-error', '--single-transaction', '--no-owner', '--no-acl', data=decrypted)
        check('restore_into_separate_database')
        restored, restored_base = start_app('restored', 'gosso_restore', 1)
        restored_token = login(restored_base, adminpassword)
        status, body = api(restored_base, '/api/v1/admin/oauth2/clients', token=restored_token)
        ids = [x['client_id'] for x in body['data']]
        check('restored_baseline_client_preserved', status == 200 and baseline['client_id'] in ids)
        check('post_backup_mutation_absent', later['client_id'] not in ids)
        status, rotated = api(restored_base, '/api/v1/admin/oauth2/clients/' + baseline['client_id'] + '/rotate-secret', 'POST', token=restored_token)
        check('restored_client_rotation', status == 200)
        for kind, secret, expected in [('retired', baseline['client_secret'], 401), ('replacement', rotated['data']['client_secret'], 400)]:
            auth = base64.b64encode((baseline['client_id'] + ':' + secret).encode()).decode()
            status, body = api(restored_base, '/oauth2/token', 'POST', urllib.parse.urlencode({'grant_type': 'authorization_code', 'code': 'nonexistent-recovery-code', 'redirect_uri': 'https://recovery.example.test/callback'}).encode(), headers={'Authorization': 'Basic ' + auth, 'Content-Type': 'application/x-www-form-urlencoded'})
            check('restored_' + kind + '_secret_authentication', status == expected and body.get('error') == ('invalid_client' if kind == 'retired' else 'invalid_grant'))
        receipt['limits'] = ['No production credentials or existing volumes used.', 'Loopback HTTP and isolated fresh Redis; no TLS/MFA/SMTP/Redis recovery certification.', 'Fresh seeded PostgreSQL15 snapshot, not real historical production data or Blog identity migration.', 'Same-version recovery; not release upgrade/rollback acceptance.', 'Synthetic encryption/signing material destroyed after test; receipt is not an operational backup.']
        receipt['ok'] = True
finally:
    if not receipt['ok']:
        diagnostics = []
        for name in containers:
            state = subprocess.run(['docker', 'inspect', '--format', '{{json .State}}', name], capture_output=True, text=True)
            logs = subprocess.run(['docker', 'logs', '--tail', '30', name], capture_output=True, text=True)
            text = logs.stdout + logs.stderr
            for val in (locals().get('pgpassword'), locals().get('adminpassword'), locals().get('totp'), locals().get('pepper')):
                if val:
                    text = text.replace(val, '[REDACTED_DISPOSABLE_SECRET]')
            diagnostics.append({'container': name, 'state': state.stdout, 'logs': text})
        (ROOT / 'recovery-failure-diagnostics.json').write_text(json.dumps(diagnostics, indent=2) + '\n')
    for name in reversed(containers):
        subprocess.run(['docker', 'rm', '-f', name], capture_output=True)
    subprocess.run(['docker', 'volume', 'rm', volume], capture_output=True)
    subprocess.run(['docker', 'network', 'rm', network], capture_output=True)
    cleanup_verified = True
    for query, owned in [(['docker', 'ps', '-a', '--format', '{{.Names}}'], set(containers)), (['docker', 'network', 'ls', '--format', '{{.Name}}'], {network}), (['docker', 'volume', 'ls', '--format', '{{.Name}}'], {volume})]:
        result = subprocess.run(query, capture_output=True, text=True)
        if result.returncode or owned.intersection(result.stdout.splitlines()):
            cleanup_verified = False
    receipt['cleanup_owned_resources'] = cleanup_verified
    if not cleanup_verified:
        receipt['ok'] = False
    (ROOT / 'admin-local-recovery.json').write_text(json.dumps(receipt, indent=2) + '\n')
    if not cleanup_verified:
        raise RuntimeError('Owned resource cleanup could not be independently verified')
    print('Recovery receipt saved; owned resources removed; target Staging gate remains separate.', flush=True)
