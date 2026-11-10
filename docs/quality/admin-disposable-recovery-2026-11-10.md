# Disposable PostgreSQL recovery rehearsal — 2026-11-10

Status:14 real checks passed. This is local recovery evidence, not acceptance of
a target Staging deployment, a version upgrade/rollback or maintainer approval.

The reproducible script verifies formal Gosso1.7.1 with exact Cosign
release.yml@refs/tags/v1.7.1 identity and GitHub OIDC issuer, then creates only
uniquely named Docker resources with loopback ports and fresh synthetic secrets.
The current Admin Seed runs against the signed released image. PostgreSQL15
and Redis7 inputs resolve to immutable digests recorded in the receipt.

A real authenticated Client is created before a PostgreSQL custom-format backup.
The dump is AES-256-CBC/PBKDF2 encrypted and decrypted with an exact hash check.
A second Client is created after the snapshot. After stopping the source app,
the backup is restored transactionally into a separate database. The same
signed Gosso image starts with that restored database, original synthetic
signing/encryption keys and fresh Redis state. Fresh login succeeds; the
original Client is present and the later Client absent. Real rotation rejects
the retired credential and accepts the replacement credential. No token is
issued for the deliberately nonexistent authorization code.

The tool also passes with inherited PG_DSN_FILE/ADMIN_PASSWORD_FILE set to
nonexistent sentinel paths: those variables are explicitly removed from the
Seed environment, preventing operator secret files from redirecting the test.
Resource cleanup is independently checked with Docker container/network/volume
inventories and fails closed if any owned resource remains. Existing containers
and volumes are outside the cleanup list.

[Machine receipt](evidence/admin-recovery-2026-11-10.json) records14 successful
checks, image references, hashes, source Seed revision and limits. Script SHA256:
`86170d7a32d77cf59fbfcd3293a32f9d1e32ffdc9b7e087a1dbf3f81a96b2e16`. The Seed source revision is the accepted predecessor bf07f3b;
Seed sources are unchanged by this rehearsal/tooling update. The first temporary
helper attempt failed port discovery on an internal network and is retained
locally as a rejected attempt; only the fresh owned bridge runs are accepted.

Run from this repository with Go, Docker, OpenSSL and Cosign installed:

```sh
python3 scripts/rehearse-postgres-recovery.py --output /tmp/gosso-admin-recovery-new
```

Use --cosign /absolute/path/to/cosign when it is not on PATH. Output must be
empty. Synthetic signing/encryption material is destroyed after execution; the
receipt is not a usable operational backup. TLS, MFA, verified SMTP, Redis
loss/revocation policy, actual historical data, Blog identity migration, target
upgrade/rollback and operator acceptance remain separate mandatory work.
