# GOSSO Admin dependency & canonical freshness recertification

Date: **2026-11-03**  
State: **needs-manual-recertification (pending, not verified)**.

## Why the existing certification must be demoted

The frozen Product certification was manually reviewed on 2026-09-22, using Gouno UI ref 4495147ae0b9807d2e5c9137187cfdc3e906cceb. Its governed canonicalPaths includes canonical-showcase.json. The current Gouno UI main 2e1e1a5c31cc6f741fecf273b7ddd63a88133ee9 adds seven post-freeze amendments (CSA-A001 to CSA-A007). The listed changes concern Blog Admin, not the GOSSO Admin page-specific Showcase JSX; nevertheless canonical-showcase.json changed, so the strict source-freshness gate correctly rejects the old manual certificate.

This candidate also updates the GOSSO Admin frontend dependency and runtime layer. Exact released @gouno/ui@0.4.9 and @gosso/client@0.9.3 remain unchanged; no Product JSX/CSS/auth contract is edited.

## Security reason for the batch

- Dependabot #78 moves compatible same-major React, Vite and related frontend libraries and includes source-map-js 1.2.2, addressing high-severity GHSA-68fv-2mgg-jv7q from 1.2.1.
- Dependabot #77 uses Go 1.27.3 instead of 1.27.0 in the Seed builder, addressing scanner-observed fixed standard-library vulnerabilities including CVE-2026-111943.
- Both Playwright workflow runners pin ubuntu-24.04. The previous ubuntu-latest selected ubuntu26.04-x64, unsupported by this Playwright version. Assertions, coverage and visual thresholds are unchanged.

## Exact-head gates

1. Frontend quality, Seed quality, GOSSO release compatibility, npm production dependency audit, container scanning and supply-chain checks.
2. Real Chromium GOSSO Admin Product and Showcase paired states for the 12 frozen canonical surfaces and 16 real Product routes, including login, callback, MFA/passkeys, clients, users, settings, audit and status.
3. Independent manual rendered review of new desktop/mobile Product / Canonical screenshots and their important loading, error, empty, feedback and interaction states.
4. Record exact GOSSO Admin and Gouno UI SHAs, pinned @gouno/ui release, artifact IDs and downloaded SHA-256 hashes, reviewer and date. Do not reuse the historical 2026-09-22 certification or substitute a passing CI signal for manual review.
5. Restore verified only in a separate reviewed commit after manual evidence exists.

No certification check, path tracking, image scan, npm audit or Playwright coverage may be suppressed to make this candidate pass.
