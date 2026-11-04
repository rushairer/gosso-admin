# GOSSO Admin dependency & canonical freshness recertification

Date: **2026-11-03**  
State: **needs-manual-recertification (pending, not verified)**.

## Why the existing certification must be demoted

The frozen Product certification was manually reviewed on 2026-09-22, using Gouno UI ref 4495147ae0b9807d2e5c9137187cfdc3e906cceb. Its governed canonicalPaths includes canonical-showcase.json. The current Gouno UI main 2e1e1a5c31cc6f741fecf273b7ddd63a88133ee9 adds seven post-freeze amendments (CSA-A001 to CSA-A007). The listed changes concern Blog Admin, not the GOSSO Admin page-specific Showcase JSX; nevertheless canonical-showcase.json changed, so the strict source-freshness gate correctly rejects the old manual certificate.

This candidate also updates the GOSSO Admin frontend dependency and runtime layer. Exact released @gouno/ui@0.4.9 and @gosso/client@0.9.3 remain unchanged; no Product JSX/CSS/auth contract is edited.

## Security reason for the batch

- Dependabot #78 moves compatible same-major React, Vite and related frontend libraries and includes source-map-js 1.2.2, addressing high-severity GHSA-68fv-2mgg-jv7q from 1.2.1.
- Dependabot #77 uses Go 1.27.3 instead of 1.27.0 in the Seed builder, addressing scanner-observed fixed standard-library vulnerabilities including CVE-2026-111943. The Security workflow also used Go 1.26.6 from seed/go.mod and detected two code-reachable crypto/x509 and crypto/tls findings (GO-2026-6809, GO-2026-6607). The minimum Seed Go toolchain is now 1.26.10, the published patch containing both fixes; no audit or govulncheck suppression was added.
- Both Playwright workflow runners pin ubuntu-24.04. The previous ubuntu-latest selected ubuntu26.04-x64, unsupported by this Playwright version. Assertions, coverage and visual thresholds are unchanged.

## Exact-head gates

1. Frontend quality, Seed quality, GOSSO release compatibility, npm production dependency audit, container scanning and supply-chain checks.
2. Real Chromium GOSSO Admin Product and Showcase paired states for the 12 frozen canonical surfaces and 16 real Product routes, including login, callback, MFA/passkeys, clients, users, settings, audit and status.
3. Independent manual rendered review of new desktop/mobile Product / Canonical screenshots and their important loading, error, empty, feedback and interaction states.
4. Record exact GOSSO Admin and Gouno UI SHAs, pinned @gouno/ui release, artifact IDs and downloaded SHA-256 hashes, reviewer and date. Do not reuse the historical 2026-09-22 certification or substitute a passing CI signal for manual review.
5. Restore verified only in a separate reviewed commit after manual evidence exists.

No certification check, path tracking, image scan, npm audit or Playwright coverage may be suppressed to make this candidate pass.


## 2026-11-04 automated candidate evidence (not maintainer approval)

The following evidence refreshes the candidate without restoring the certification. The ledger remains `needs-manual-recertification` until the maintainer completes the required direct rendered review and records a separate approval.

### Exact refs and package baseline

- GOSSO Admin Product base at review: `049eecc9b72843e32de91ce9bbea3b9951ae6072`.
- Candidate parity-test head: `1530552df5fe46cff789fb00f0acea4501b84b33`. This candidate changes only parity tests and Unreleased documentation; no Product JSX, CSS, API, auth, or permission behavior changes.
- Gouno UI main at review: `b706b6c25c6252c7f55500b69eb08e17c1de554b`. Its canonical Showcase source remains the post-freeze baseline `2e1e1a5c31cc6f741fecf273b7ddd63a88133ee9`; subsequent changes are workflow/documentation maintenance only.
- Exact registry packages remain `@gouno/ui@0.4.9` and `@gosso/client@0.9.3`. Frontend engine baseline is Node `>=24.15 <25`.

### Exact-head automated gates

| Gate | Run | Result |
|---|---:|---|
| CI (frontend, Seed, Compose) | 41809972746 | Passed |
| Product Browser Acceptance | 41809972783 | 150/150 passed |
| Gosso Showcase parity | 41809972760 | 32/32 passed |
| Security / dependency review / govulncheck / CodeQL | 41809972822 | Passed |
| Container images and Trivy scans | 41809972834 | Passed |

### Retained evidence

- Browser Acceptance artifact: `13311662908`, SHA-256 `5bcd6dea8c0fa8b772e4520e24a604316a497cbb5dd88898e4eae2a3ce7930ff`.
- Showcase parity artifact: `13311269300`, SHA-256 `02845788a4d7830c75f9138cd8c0cf1a264ecc5bbbf13f15171a59d1ffb7c0b0`.
- Browser Acceptance covers 150 rendered tests, including five authentication routes across desktop, tablet landscape, tablet portrait and mobile, in light and dark themes.
- Showcase parity retains 32 Product/Showcase paired scenarios across light and dark themes. The System Status test now scrolls both sides to the capability and security-policy panels, verifies shared scopes/grant types and five policy rows, and retains viewport screenshots after scrolling.

### Visual inspection observations

Assistant visual inspection of the retained paired screenshots found no structural, spacing, surface, or responsive geometry regression in the reviewed routes. Product-owned differences are intentional and must remain semantic rather than text-identical:

- Login title is site-branding data supplied by the Product fixture, not a fixed canonical label.
- Forgot-password/reset-password titles and security-policy labels are localized Product copy.
- Product OIDC grant types are driven by real metadata; the Showcase fixture includes `device_code`, which the Product metadata does not advertise.
- Rate-limit values use localized/compact Product formatting (`8 / 15 min`, `6 / 10 min`) versus explanatory Showcase formatting (`8 attempts / 15 min`, `6 attempts / 10 min`). Numeric limits and windows match.

This is AI-assisted artifact inspection, not a maintainer's live interaction sign-off. The required human review of important loading, error, empty, feedback and interaction states remains pending. Do not change the certification ledger to `verified` based on these CI results or this artifact inspection alone.
