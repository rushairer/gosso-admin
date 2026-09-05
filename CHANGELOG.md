# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed
- Standardize Modal structure and design system alignment: add `description` prop to `Modal`, move modal action buttons out of form bodies into unified sticky `footer` prop across all modals (Client Editor, Email Change, MFA Disable, Passkeys Registration, User Creation, Password Reset, User Consents), and maintain stable close button geometry anchored to the title bar regardless of subtitle presence.

### Fixed
- Fix `.panel-header` margin/padding inside `.workspace-panel` to eliminate double horizontal inset and align with table and form content.
- Align Toast notification layout: vertically center icon and text, set `flex: 1` on message container, and push close button to the far right (`margin-left: auto`).

## [0.7.24] - 2026-09-04

### Changed
- Align UI/UX design system with Gouno Blog: standardize inline status list and rows (`.inline-status-list`, `.inline-status-row`).
- Standardize semantic inline icon badges (`.inline-icon`, `--success`, `--danger`, `--warning`, `--info`).
- Standardize setup cards and health status cards (`.setup-card`, `.health-card`, `.setup-title`, `.health-icon`).

## [0.7.23] - 2026-09-04

### Changed
- Align UI/UX design system with Gouno Blog: standardize editor sticky command bar layout and elements (`.editor-commandbar`, `.editor-back`, `.editor-save-state`).
- Standardize preformatted JSON and code block viewer typography and border tokens (`.code-block-viewer`, `pre.code-block-viewer`).

## [0.7.22] - 2026-09-04

### Changed
- Align UI/UX design system with Gouno Blog: unify post and page editor workspace multi-column grid (`.editor-workspace`, `.editor-workspace:not(:has(.editor-outline))`).
- Align canvas (main editor) and inspector (right sidebar) layout dimensions across 3-column (articles with outline/history) and 2-column (standalone pages) editor variants.

## [0.7.21] - 2026-09-04

### Changed
- Align UI/UX design system with Gouno Blog: standardize page header anatomy (`.admin-page-header`, `.page-header`, `.admin-page-heading`, `.admin-page-actions`, `.admin-page-count`).
- Standardize taxonomy and tag admin cards grid (`.tag-admin-grid`, `.tag-admin-card`, `.tag-admin-card__content`, `.tag-admin-card__actions`).
- Standardize media grid and media cards (`.media-grid`, `.media-card`, hover elevation and action layout).
- Standardize editor AI prompt box, result container, and candidate preview (`.editor-ai-prompt-box`, `.editor-ai-result-box`, `.editor-ai-result-header`, `.editor-ai-result-preview`).

## [0.7.20] - 2026-09-04

### Changed
- Align UI/UX design system with Gouno Blog: redesign table filter bar to a single-row horizontal layout with unified 36px control height (search input, select dropdowns, clear button and actions).
- Fix sidebar section heading spacing and indentation alignment (`padding: 10px 12px 6px`, consistent rhythm with nav links).
- Add floating bulk action bar styling (`.bulk-action-bar`, `.table-bulk-actions`) and empty state normalization (`.filter-empty-state`, `.data-table-empty-wrap`).

## [0.7.19] - 2026-09-04

### Changed
- Align UI/UX design system with Gouno Blog: standardize 404 / Not Found page layout and card (`.not-found-page`, `.not-found-card`, `.not-found-title`, `.not-found-subtitle`).
- Normalize 2-column form grid (`.form-grid-2`) and card grid (`.card-grid`) with mobile breakpoints.
- Standardize semantic status dots (`.status-dot`, `--success`, `--warning`, `--danger`, `--brand`).
- Normalize section and modal dividers (`.modal-section-divider`, `.section-divider`).
- Standardize security MFA secret boxes and backup codes grid (`.mfa-secret-box`, `.mfa-secret-code`, `.mfa-backup-codes-grid`, `.mfa-backup-code`).

## [0.7.18] - 2026-09-04

### Changed
- Align UI/UX design system with Gouno Blog: standardize list stacks and item rows (`.list-stack`, `.list-row`, `.list-row-main`, `.list-icon`, `.list-title`, `.list-meta`).
- Align data table header and row hover states across `.admin-table`, `.content-table`, and `.dashboard-table` (uppercase tracking headers, hover row highlighting, text-right action columns, nested strong/small typography).
- Standardize plain sections (`.plain-section`, `.plain-section-title`).
- Normalize button group alignment variants (`.button-group-left`, `.button-group-right`, `.button-group-between`) and link buttons (`.btn-link`).

## [0.7.17] - 2026-09-04

### Changed
- Align UI/UX design system with Gouno Blog: standardize form input affix wrapper (`.input-affix-wrapper`, `.input-prefix-icon`, `.input-suffix-icon`, `.input-icon-button`, `.has-prefix`, `.has-suffix`).
- Normalize multiline text input (`.textarea-field`, `textarea.ui-control`, `textarea.input-field`): 88px min-height, vertical resize, 1.5 line-height.
- Standardize form field metadata (`.form-label` / `.field__label`, `.form-label-required` / `.field__required`, `.form-hint` / `.field__hint`, `.form-error` / `.field__error`, `.field--invalid`).
- Normalize checkbox and checkbox group (`.checkbox-field`, `.checkbox-group`, `.ui-checkbox`).
- Align metric strips and field summary cards (`.metric-strip`, `.metric-item`, `.field-card`, `.field-label`, `.field-value`).

## [0.7.16] - 2026-09-04

### Changed
- Align UI/UX design system with Gouno Blog: normalize panel/card header anatomy (`.panel-header`, `.card-header`, `.panel-heading`, `.card-title`, `.card-description`, `.panel-header__action`, `.card-header__action`).
- Align panel body and card content (`.panel-body`, `.card-content`, `.flush` modifier) and card footer (`.card-footer`).
- Add definition list alignment (`.definition-list`, `.definition-row`, `.definition-label`, `.definition-value`) with cross-alias `.detail-*` variants.
- Add form action bar alignment (`.form-action-bar`, `.is-sticky` modifier, `.form-action-bar__status`) with cross-alias `.form-submit-bar`.

## [0.7.15] - 2026-09-04

### Changed
- Align UI/UX design system with Gouno Blog: normalize loading spinner geometry and animation (`.loading-spinner`, `.spinner`, `--sm/md/lg` variants, `.page-loader`).
- Align sidebar nav link geometry (`.sidebar-link`, `.admin-nav-link`): 40px min-height, 12px padding, token-based hover/active colors.
- Align sidebar section label (`.sidebar-section-title`, `.admin-nav-section-title`): uppercase, 12px, 0.08em tracking.
- Align avatar component (`.avatar`, `.admin-avatar`, `--circle`, `--sm`, `--lg`): 34px, 8px radius, brand background.
- Normalize session card and profile strip (`.session-card`, `.session-meta`).
- Add breadcrumb alignment (`.breadcrumb`, `.page-breadcrumb`).
- Normalize `:focus-visible` ring across buttons, nav links and tabs.

## [0.7.14] - 2026-09-04

### Changed
- Align UI/UX design system with Gouno Blog: standardize notice cards and informational banners (`.notice-card`, `.notice-card--info`, `.notice-card--stacked`, `.notice-card.success`, `.notice-card--success`).
- Align inline status indicators and metric labels (`.inline-status-title`, `.inline-status-value`, `.inline-status-value--success`, `.inline-status-value--danger`, `.system-link`).

## [0.7.13] - 2026-09-04

### Changed
- Align UI/UX design system with Gouno Blog: standardize inline code chips and URI copy chips (`.inline-code`, `.client-id-code`, `.uri-copy-chip`, `.uri-copy-text`, `.uri-copy-btn`).
- Align error retry banners (`.error-retry-banner`) and sticky section navigation bars (`.section-nav`).

## [0.7.12] - 2026-09-04

### Changed
- Align UI/UX design system with Gouno Blog: standardize Drawer slide-over panels and backdrop blur overlays (`.drawer-overlay`, `.drawer-backdrop`, `.drawer-panel`, `.drawer`, `.drawer-header`, `.drawer-title`, `.drawer-description`, `.drawer-body`, `.drawer-footer`, `.drawer-actions`).
- Standardize Confirm Dialog modal components (`.confirm-dialog`, `.confirm-dialog-title`, `.confirm-dialog-icon`, `.confirm-dialog-message`).

## [0.7.11] - 2026-09-04

### Changed
- Align UI/UX design system with Gouno Blog: standardize table pagination bar layout (`.table-pagination`, `.pagination`, `.pagination-compact`, `.pagination__info`, `.table-pagination-info`).
- Align table filter bars and search field wrappers (`.table-filter-bar`, `.filter-bar`, `.table-filter-actions`, `.filter-bar__actions`, `.search-field`).
- Standardize skeleton and shimmer placeholder variants (`.skeleton--text`, `.skeleton-text`, `.skeleton--circular`, `.skeleton-circular`, `.skeleton--rectangular`, `.skeleton-rectangular`, `.skeleton--card`, `.skeleton-card`, `.table-skeleton-wrap`).

## [0.7.10] - 2026-09-04

### Changed
- Align UI/UX design system with Gouno Blog: normalize form controls (`.input-field`, `.ui-control`), compact control variants, and select wrapper chevrons.
- Standardize Switch and Checkbox component styling (`.switch-field`, `.ui-switch-label`, `.ui-switch__text`, `.ui-switch__label`).
- Harmonize Empty and Error states (`.empty-state`, `.state`, `.empty-state-actions`, `.state__actions`) with unified 40px icon sizing, typography, and spacing.
- Align Feedback banner styles (`.feedback-error`, `.feedback--error`, `.feedback-success`, `.feedback--success`).
- Standardize Tab button height (34px), active states, and Toast notification container/item cross-project aliases.

## [0.7.9] - 2026-09-04

### Changed
- Align UI/UX design system with Gouno Blog: add cross-project component class aliases (`.icon-button`, `.modal-actions`, `.ui-card`).
- Standardize table action button dimensions to 34px (`--control-h-sm`) and 8px gap (`gap-2`), right-aligned with nowrap.
- Enforce single-line nowrap on `.client-name-row` and ensure `shrink-0` on code chips and role icons to prevent unexpected table cell wrapping.

## [0.7.8] - 2026-09-04

### Added
- Add `login_hint` cross-account step-up alignment: detect identity mismatch between active SSO session and requested `login_hint`.
- Display account mismatch warning notice (`LoginSurface`) informing user of the target account vs. active session, prefill target username, and prompt account switch or target authentication instead of invalid Sudo Mode elevation.
- Preserve redirect and query parameters when switching accounts on logout (`Login.tsx`).

## [0.7.7] - 2026-09-04

### Added
- Introduce in-app Sudo Mode (`useSudo` / `SudoModal`) with 5-minute verification grace period (`sessionStorage`, aligned with backend strong-auth TTL) for sensitive operations.
- Add Sudo Mode view in `LoginSurface` and `Login.tsx` that skips username/password re-entry for active sessions, verifying TOTP/Passkey directly before returning.
- Protect Site Settings modification (`SiteSettingsTab`), Role Assignment/Revocation, Reset User MFA, Reset User Password (`UsersTab`), Client Secret Rotation / Deletion (`ClientsTab`), Passkey registration and removal (`PasskeysPanel`), and MFA backup code regeneration (`MFAPanel`) with unified Sudo MFA challenge.
- Auto-catch stale strong authentication errors on passkey registration and prompt Sudo step-up modal immediately.
- Integrate `@gosso/client` v0.9.3 with `stepUpPasskey` in `Login.tsx` to handle in-session Passkey step-up authentication during Sudo Mode without replacing existing sessions.

### Fixed
- Fix Radix Dialog overlay and content z-index hierarchy by removing conflicting `z-50` utility classes, ensuring dialog overlay (`z-index: 1000`) and content (`z-index: 1001`) reliably cover background elements and sticky bars.
- Fix `EmptyState` visual alignment across all pages by setting `.empty-state` as a centered flex column and centering `.empty-state-icon svg`, eliminating leftward icon drift.
- Wrap `EmptyState` in `PasskeysPanel` inside `PanelBody` to conform to panel container standards.

## [0.7.6] - 2026-09-03

### Changed
- Upgrade `Drawer` with Tab focus trapping, Esc close, previous focus restoration, body scroll locking, and explicit ARIA modal attributes.
- Extend `AsyncState` with built-in empty state rendering, standardizing empty and error handling across sessions and audit log tabs.
- Add explicit Chinese font fallbacks (`PingFang SC`, `Microsoft YaHei`) to body typography stack.
- Modernize `SessionsPanel` to use `Badge` instead of deprecated `Tag`, replacing full-page spinner with table skeletons and localized empty state.
- Standardize grid and spacing utility classes across user creation modal and audit log filters.

## [0.7.5] - 2026-09-02

### Added
- Add strong authentication warning and localized messages when authorization requests require MFA step-up.

## [0.7.4] - 2026-09-01

### Fixed
- Upgrade `@gosso/client` to `0.9.2` to preserve in-flight OAuth flow state (`auth_state`, `pkce_verifier`, `post_login_redirect`) during unauthenticated session initialization and session clear, fixing `State mismatch. Potential CSRF attack.` error on direct IdP login.
- Fix button text vertical centering on authentication error callback page.

### Changed
- Provide tailored overview dashboard for non-admin users with quick shortcuts to profile, security, and session management instead of an access denied error.

## [0.7.3] - 2026-08-31

### Security
- Allow the seed job to receive its database DSN and initial administrator
  password through authoritative Docker Secret files, failing closed when a
  configured file is unavailable or empty.

## [0.7.2] - 2026-08-30

### Fixed
- Pin `@gosso/client` to the immutable registry release `0.9.1`.

## [0.7.1] - 2026-08-30

### Fixed
- Pin `@gosso/client` to the immutable registry release `0.9.0`.

## [0.7.0] - 2026-08-30

### Added
- Add a confirmed Client secret rotation action that displays the replacement secret only once.

## [0.6.1] - 2026-08-29

### Changed
- Upgrade `@gosso/client` to `0.8.8` to enforce RFC 10017 BFF boundary isolation.

## [0.6.0] - 2026-08-29

### Added
- Add RFC 8707 `allowed_resources` input field to ClientEditorModal with form serialization and validation.
- Add English and Chinese translation keys for allowed resources.

### Changed
- Upgrade `@gosso/client` to `0.8.7`.

## [0.5.1] - 2026-08-28

### Changed
- Upgrade `@gosso/client` to `0.8.4`.

## [0.5.0] - 2026-08-28

### Changed
- Upgrade `@gosso/client` to `0.8.0` and adopt provider session initialization so Cookie-backed sessions restore before guarded routes render.
- Centralize authentication and admin authorization at the application route boundary; remove page-level redirect and imperative profile checks.
- Keep system-management user profile updates reactive through `useUserProfile`.

## [0.4.1] - 2026-08-28

### Changed
- Upgrade `@gosso/client` to `0.6.1`.
- Refactor admin API services (`clientService`, `accountService`, `auditService`, `siteSettingsService`) to use `gossoClient.get / post / put / delete` with unified error handling.
- Adopt `useRequireAuth` hook in `AccountSettings` and `SystemManagement` pages to eliminate duplicate authentication redirect logic.

## [0.4.0] - 2026-08-28

### Changed
- Upgrade `@gosso/client` dependency to `0.6.0`, enabling declarative route guards, typed API clients, and seamless responsive session subscriptions.
- Align authentication, profile, MFA, and passkey management with latest SDK contracts.

## [0.3.0] - 2026-08-24

### Changed
- Delegate profile, password, email, MFA, passkey, session, and password-reset flows to `@gosso/client` instead of maintaining endpoint and response logic in React pages.
- Consume the registry-published `@gosso/client` 0.4.0 package with lockfile integrity.

### Fixed
- Preserve CSP, HSTS, Permissions-Policy, COOP, CORP, and related security headers on cached assets and SPA fallback responses.

### Security
- Upgrade the Seeder to Go 1.26.6 and `golang.org/x/text` 0.39.0 to resolve reachable advisories.
- Redact development default credential values from Seeder warning logs.

## [0.2.0] - 2026-08-15

### Changed
- Passkey registration, listing, and deletion now delegate to `@gosso/client`
  instead of the hand-rolled WebAuthn ceremony and base64 helpers.
- MFA enrollment QR now renders declaratively with `qrcode.react` instead of
  the imperative `qrcode.toDataURL` flow.

### Security
- Update transitive development dependencies `nanoid`, `postcss`, and `undici`
  to versions that resolve the open Dependabot advisories.

## [0.1.0] - 2026-07-11

### Added

- Apache-2.0 licensing and community governance documents.
- Release, compatibility, security, and production-operations baselines.
- Automated dependency, code, container, SBOM, provenance, and signature checks.

### Changed

- Release quality gates now include formatting, coverage, Go vet, vulnerability checks, and production configuration validation.
- The supported server baseline is Gosso `1.1.x` with OpenAPI `1.2.x` and database schema `20`.

### Security

- Hardened browser security headers and legacy database seeding safeguards.
- Updated the Seeder to Go 1.26.5 and pgx 5.9.2 to remove reachable standard-library and SQL sanitizer vulnerabilities.
- Upgrade Alpine runtime packages during frontend image builds so published images do not retain fixed high-severity base-image vulnerabilities.

[Unreleased]: https://github.com/rushairer/gosso-admin/compare/v0.5.0...HEAD
[0.5.0]: https://github.com/rushairer/gosso-admin/compare/v0.4.1...v0.5.0
[0.4.1]: https://github.com/rushairer/gosso-admin/compare/v0.4.0...v0.4.1
[0.4.0]: https://github.com/rushairer/gosso-admin/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/rushairer/gosso-admin/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/rushairer/gosso-admin/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/rushairer/gosso-admin/releases/tag/v0.1.0
