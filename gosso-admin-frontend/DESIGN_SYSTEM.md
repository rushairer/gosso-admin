# Shared UI Design System Baseline

Gosso Admin follows the canonical Gouno UI design language and the executable Gosso Admin Showcase. Product branding may use a different accent hue from other Gouno products, but primitive geometry, state semantics, structural spacing, surface depth, and accessibility behavior remain package-owned unless an explicit product exception is documented.

## Primitive ownership

- Shared controls, tokens, theme behavior, shell patterns, runtime theme bootstrap, and canonical Gouno family brand marks are owned by the published `@gouno/ui` package.
- Product code consumes explicit supported package entrypoints: `@gouno/ui/core`, `@gouno/ui/gouno`, `@gouno/ui/theme`, and canonical `@gouno/ui/brand-icons/*` assets. Package-root imports, direct Radix imports, local primitive copies, and vendored package assets are forbidden.
- Feature code uses canonical `Button`, `ButtonLink`, `IconButton`, `Input`, `Textarea`, `Select`, `Checkbox`, `Radio`, `Switch`, `Tabs`, `Card`, `Table`, `Empty`, `Alert`, `Message`, `Modal`, `Dialog`, `Drawer`, `Skeleton`, `Spinner`, `Pagination`, `Tag`, `Tooltip`, `FormField`, `PageHeader`, `PageContainer`, and `AppShell` ownership instead of recreating markup or chrome.
- Retired compatibility containers such as product-local `Panel` are not part of the current Gosso grammar.
- Legacy size aliases may remain inside package compatibility surfaces, but Gosso product code uses canonical current props.

## Admin composition grammar

### System Management

System Management durable domains are first-class Sidebar destinations. They must not add a route-family Tabs layer.

```text
PageContainer
  PageHeader
  PanelLead (only when useful)
  PageFeedback
  Content Surface
  Pagination / actions
  Modal / Dialog
```

A self-surfaced collection (`Table`, `Empty`, or another canonical collection owner) is not wrapped in an extra decorative Card simply to create visual depth.

### Account Settings

Account Settings intentionally uses page-local Tabs:

```text
PageContainer
  PageHeader
  Tabs
    active TabPanel content
```

Tabs own the tab-list ↔ active-panel structural relationship. Page wrappers must not compensate for internal Tabs spacing.

### Authentication surfaces

Login, forgot/reset password, OAuth callback, and NotFound remain outside AppShell. Auth presentation uses the dedicated Login/Auth surface family and is not forced through normal Admin page Card grammar.

### Site Settings

The real settings form and `LoginPreview` are siblings. Preview controls are presentation-only and cannot participate in real form validation or submission.

## Async and feedback semantics

- Known future structure uses `Skeleton` / `PageSkeleton`.
- Fatal initial load failure is persistent page feedback and is not an Empty state.
- `Empty` means a successful read with no data.
- Existing data refresh keeps stale content visible and marks the refreshing owner busy instead of replacing the whole page.
- Mutation loading belongs to the initiating control when possible.
- `Spinner` is reserved for genuinely indeterminate processing, including the OAuth callback exchange.
- Persistent load/security warnings stay on the page using canonical feedback such as `Alert`.
- Transient Gosso mutation feedback uses the product's canonical `MessageProvider/useMessage` grammar; a page Alert must not be used merely as a toast replacement.

## Layout and surface ownership

- Normal page groups use the canonical 24px rhythm; dense item groups use the package-defined compact rhythm.
- Product layout may own business-specific grids, responsive rearrangement, long-content containment, and branding data presentation.
- Product code must not redefine canonical control geometry, primitive border/radius/shadow rules, modal overlay/focus behavior, or primitive interaction chrome.
- `Dialog` and `Modal` consume focus-management and overlay behavior from `@gouno/ui`; Gosso pages do not import Radix directly or recreate escape/outside-click behavior.

## CSS cascade isolation

- Tailwind is imported exactly once from `src/styles/tailwind.css`, first among product CSS entries in `main.tsx`.
- Canonical reset, font faces, semantic tokens, and primitive styling come from `@gouno/ui`.
- Product CSS may own only product/layout concerns; it must not style package `[data-slot]` selectors, primitive selectors, concrete design-system colors, or use `!important` to seize primitive ownership.
- Accessibility overrides that intentionally outrank utilities live in the final `overrides` layer and are loaded last.
- `npm run lint:css` is the executable cascade/ownership gate.

## Brand and bootstrap ownership

- Shell branding uses the canonical color-agnostic Gosso Admin mark published under `@gouno/ui/brand-icons/gosso-admin.svg`. Runtime `product_name` remains product data; uploaded login/site branding does not replace the shell product mark.
- The parser-blocking theme bootstrap and fallback favicon come from the exact installed `@gouno/ui` release through the Vite pipeline. Committed `public/ui-bootstrap.js` or `public/gosso-admin.svg` copies are forbidden.

## Verification

Before merging frontend changes run the same gates used by CI:

```bash
npm run format
npm run quality
VITE_APP_BASE_PATH=/identity-admin npm run build
```

Rendered/browser and cross-repository parity are additional required CI contracts; fixture evidence proves presentation, not production authentication or security state machines.
