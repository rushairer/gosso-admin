# Gosso Admin Frozen Canonical Recertification

Status: **verified / manual-reviewed**

Date: 2026-09-22

## Purpose

This review renews Gosso Admin Showcase parity after Gouno UI completed CSA-5 and froze `canonical-showcase.json`.

The 2026-09-15 hardening program remains historical engineering evidence rather than current certification evidence:

- it closed against `@gouno/ui@0.4.1`;
- Gosso Admin later moved through `0.4.7`;
- the accepted frozen consumer baseline is the published `@gouno/ui@0.4.8`;
- the accepted Gouno UI frozen main is `059bc2806689f70be7178c16fc50a339f6526405`;
- the frozen Gosso Product matrix contains 12 Product Showcase ids.

This is an explicit dependency upgrade and manual-first recertification, not a broad product-side migration restart.

## Accepted baselines

- Original frozen recertification Product/parity ref: `fd5f23852a721829fb01c32bc063108bce4d41a0`.
- Latest corrective Product/browser reviewed ref: `88963c804d371ca5b1f5025acd81c7ec1e160d2e`.
- Gosso Admin starting main before this recertification: `a322644c97142bb26af37a93128a6ca2e3c60360`.
- Previous exact package pin: `@gouno/ui@0.4.7`.
- Accepted exact package pin: `@gouno/ui@0.4.8`.
- Gouno UI frozen ref: `059bc2806689f70be7178c16fc50a339f6526405`.
- Browser plugin: not available in this session; repository Playwright/GitHub Actions was the rendered validation path.

The 0.4.7 → 0.4.8 package change is intentionally small and includes shared Modal/Drawer nested-overlay interaction handling. A fresh Product quality/parity pass was therefore required even though the package API surface remained compatible.

## Frozen Showcase scope

The 12 frozen Gosso Admin Product ids are:

1. `gosso-overview`
2. `gosso-account-settings`
3. `gosso-not-found`
4. `gosso-system-clients`
5. `gosso-system-users`
6. `gosso-system-audit-logs`
7. `gosso-system-site-settings`
8. `gosso-system-status`
9. `gosso-login`
10. `gosso-forgot-password`
11. `gosso-reset-password`
12. `gosso-callback`

The Product has 16 real visual routes because the single frozen Account Settings Showcase page owns five real Product subroutes: Profile, Password, MFA, Passkeys and Sessions.

## Manual preflight findings and fixes

Source-by-source comparison against the frozen Showcase found Product-only semantic typography drift in Overview and several System Management routes. The accepted candidate normalized these locations to the same semantic vocabulary already owned by the canonical surfaces:

- Overview Hero, quick-link title/description and quick-navigation label;
- Clients names, client ids and redirect URI code;
- Users identity typography;
- Audit Logs mono/caption cells;
- Site Settings preview label;
- System Status compact section headings, definition rows, endpoint code, status metrics and dependency labels.

The same pass found both Product-local panel-lead helpers still using pre-canonical hand-built geometry:

- System Management now follows the frozen `tab-panel-lead` ownership: `min-h-9`, semantic `Text leading="relaxed"` and wrapped actions.
- Account Settings keeps its helper Product-local, but now follows frozen `settings-composition` / `tab-panel-lead` ownership and semantic SettingRow typography.

Profile, MFA, Passkeys, Sessions, Forgot Password, Reset Password and Not Found were also normalized to the semantic typography equivalents already used by their frozen canonical owners.

These fixes are presentation-only. They do not alter API calls, permissions, auth/security state machines or route ownership.

`check-ui-contracts.mjs` now contains reviewed required/forbidden markers for these Product files. A final source differential pass found no Product-only raw typography token remaining across the reviewed frozen page families.

## Parity harness corrections

Fresh paired testing exposed evidence-model defects that were corrected without weakening Product/canonical contracts:

- System Status refresh parity no longer depends on localized button copy. Product uses `刷新` while Showcase uses `刷新状态`; the harness scopes the action inside the shared panel-lead owner.
- System Status Button style/padding and height must match; text-driven width may differ because the localized labels differ.
- Passkeys and Sessions are direct collection surfaces, not Card surfaces. The harness compares the bordered passkey list and Sessions Table respectively.
- Password remains a Card-backed Account Settings surface and keeps its Card parity assertion.
- Direct paired parity was expanded from the historical representative subset to all 12 frozen Gosso Product ids, with all five real Account Settings routes exercised under the single frozen owner.

## Fresh exact-candidate evidence

The manually reviewed candidate `fd5f23852a721829fb01c32bc063108bce4d41a0` passed all required gates:

- CI `35680543564` — success;
- Images `35680543523` — success;
- Security `35680543531` — success;
- Gosso Release Compatibility `35680543529` — success;
- Gosso Showcase Parity `35680543528` — success, **32 / 32** paired tests;
- UI Browser Acceptance `35680543624` — success, **149 / 149** rendered Product tests.

Retained artifacts:

- paired parity artifact `10674532972` — `gosso-showcase-parity`, SHA-256 `eb23caa56325b8d0800e8d1ca376c2f97326f4eb896f161f89c5f2a0d3105c91`;
- Product browser artifact `10675002476` — `gosso-admin-browser-acceptance`, SHA-256 `a11dfec8fcda16f63b80cf2f814bc4646816a2f2810fdf2fbe02b09b2acbbd77`.

The paired workflow used current `gouno-ui/main`, which remained `059bc2806689f70be7178c16fc50a339f6526405` through this review.

### Browser coverage

The Product acceptance suite exercised:

- 5 authentication/recovery routes × desktop, tablet-landscape, tablet-portrait and mobile × light/dark;
- login validation, backend error, MFA challenge, Passkey failure, reset-token failure and OAuth callback processing/error ownership;
- Account Settings route switching, password recent-auth failure, MFA enrollment transition, Passkey registration failure and Session revoke confirmation;
- Clients edit/destructive Modal, Users destructive confirmation/Sudo boundary, Audit filters/detail, Site Settings failure/recovery and System Status degraded→healthy refresh;
- 11 AppShell Product routes × 1440 / 1024 / 768 / 390 widths × light/dark.

No document-level horizontal overflow, framework error overlay, broken route shell or unresolved interaction-state failure was found in the accepted run.

## Manual rendered review

Green workflows were not treated as visual proof by themselves. The retained paired and Product artifacts were inspected directly.

### Overview

The Product Hero, role/status placement and quick-link Card family preserve the frozen composition, spacing, surface depth and typography. Real current-user data and Product navigation copy remain Product-owned.

### System Management

Clients, Users and Audit Logs preserve canonical collection/Table ownership, compact row-action geometry and semantic identity/mono typography.

Site Settings keeps the settings form and LoginPreview as sibling surfaces. The preview does not become part of the real settings form or native validation ownership.

System Status preserves the shared panel lead, three status summary Cards, infrastructure Card, OIDC definition surfaces, capability tags and security-policy presentation. Live service values and localized copy are intentionally Product-specific.

### Account Settings

The page-local Tabs remain the single secondary navigation owner. Profile and Password retain canonical form/Card hierarchy.

Passkeys correctly uses the direct bordered collection instead of inventing a wrapper Card. Sessions correctly uses the direct Table collection. MFA preserves the real enrollment/recovery state machine inside the same canonical section hierarchy.

The 390px Product captures were checked for Profile, Password, MFA, Passkeys and Sessions in light and dark mode; the content stacks cleanly without page-level horizontal overflow.

### Authentication / recovery

Login, Forgot Password, Reset Password, OAuth Callback and Not Found preserve the canonical raised AuthPageSurface/Result family across desktop, tablet and 390px mobile layouts in light/dark mode.

The Product keeps real OAuth callback exchange behavior, password-reset token handling, validation and session semantics instead of copying Showcase fixtures.

### Responsive and dark mode

Representative 390px light/dark Product captures for Overview, System Management and Account Settings were inspected directly. Long tables/collections remain contained by their intended region, page shells do not overflow the document, actions remain reachable, and no overlay or z-index regression was observed.

## Intentional Product divergences

The certification explicitly permits:

- real Product API data, account/client/session/passkey/audit cardinality and timestamps instead of Showcase fixture values;
- translated Product copy where semantics remain equivalent to frozen Showcase copy;
- System Status Product label `刷新` versus Showcase label `刷新状态`, with text-driven Button width allowed to differ while primitive styling/height remains canonical;
- Product-only security actions and Sudo/recent-MFA/WebAuthn/OAuth state machines;
- real GOSSO API loading/error/mutation behavior;
- five Product Account Settings routes represented by one frozen canonical page-local Tabs owner.

These divergences do not authorize Product-local recreation of shared primitive styling, surface hierarchy or navigation grammar.

## Security boundary

This recertification does not change OAuth2/OIDC semantics, Authorization Code + PKCE, callback/token exchange behavior, JWT/session lifecycle, RequireAuth/RequireAdmin, Sudo/recent-MFA, MFA enrollment/recovery, Passkey/WebAuthn, password-reset security, session revocation, OAuth client credentials, permissions, audit logging, API contracts, backend behavior, CSP or cookie policy.

Fixture/browser evidence proves presentation and interaction ownership only.

## Corrective follow-up: role Select inside Modal

Status: **accepted / manual-reviewed**

The stale pre-0.4.8 PR #66 contained one useful idea that was not part of the original frozen recertification: exercising the Product's real role-assignment `Select` inside `AssignRolesModal`.

Its original test failed for a real accessibility reason, not because the 0.4.8 Select overlay fix was missing. `AssignRolesModal` wrapped the real `Select` / fallback `Input` inside an extra `div` beneath `FormField`. The Foundation-level A11Y-D001 fix correctly transfers label/required/description semantics to the direct child control owner, so this Product composition prevented the visible combobox from receiving the `分配新角色` accessible name.

The accepted correction:

- makes `Select` or `Input` the direct `FormField` child;
- keeps the submit Button as a sibling in the same responsive row with bottom alignment;
- preserves the visible label and stable `assign-role` id;
- verifies `aria-labelledby="assign-role-label"` and native label `for="assign-role"` ownership;
- opens the portaled Select options while the parent Modal remains visible;
- chooses `admin (role-adm)` and verifies the parent Modal remains the interaction owner after selection;
- normalizes the Product role-name typography from raw `font-semibold` to semantic `Text weight="semibold"`;
- locks the reviewed composition in `check-ui-contracts.mjs`.

Fresh exact-head evidence for `88963c804d371ca5b1f5025acd81c7ec1e160d2e`:

- CI `35681805962` — success;
- Images `35681805959` — success;
- Security `35681805975` — success;
- Gosso Showcase Parity `35681806007` — success, the full frozen paired suite remains green;
- UI Browser Acceptance `35681805949` — success, **150 / 150** rendered Product tests;
- the new high-risk case `Users role assignment Select keeps accessible Modal ownership` passed in 1.3s.

Retained follow-up artifacts:

- paired parity artifact `10674994702` — `gosso-showcase-parity`, SHA-256 `67cf83d9e51359dcd405c89f1755376b1b06442bc346f6be81b3b3381772689c`;
- Product browser artifact `10674388514` — `gosso-admin-browser-acceptance`, SHA-256 `43429e57a5662b2e31a31f64679fde7a5d54ab770f2f3e197ca8a556325e352a`.

The retained passing screenshot was inspected directly. The role Modal remains the visible owner, the labelled Select is aligned with the assign action, selecting `admin (role-adm)` leaves the parent Modal open, and the assign action becomes enabled without overlay or focus-layer breakage.

This follow-up changes no authorization rule, Sudo/recent-MFA behavior, account API or role-assignment business semantics.

## Certification conclusion

Gosso Admin is **verified / manual-reviewed** against the frozen Gouno UI baseline above, including the accepted role-assignment Modal/Select corrective follow-up.

The final follow-up certification commit changes only this review record, not the manually reviewed Product or parity source paths. The repository gates must still pass on that final PR head before merge.

Any later change to the exact `@gouno/ui` package baseline or to the reviewed Product/canonical ownership paths requires fresh validation under the same manual-first discipline.
