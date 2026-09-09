# App Rules

## Sources of Truth

GOSSO Admin has two complementary sources of truth:

- The real `gosso-admin-frontend` owns business behavior, routing, API integration, session handling, authorization, Sudo flows, and security semantics.
- The Gosso Admin product space in the independent `gouno-ui` Showcase owns the canonical visual language, component composition, spacing, surface hierarchy, and interaction presentation.

Do not copy Showcase fixtures, scenario switches, route simulators, or Showcase-only helpers into the production application.

## Gouno UI Consumption

Use the independent `@gouno/ui` package as the only shared UI source.

Production code must import from explicit supported subpaths such as:

- `@gouno/ui/core`
- `@gouno/ui/gouno`
- `@gouno/ui/theme`

Do not import from the package root `@gouno/ui`. Do not recreate removed compatibility APIs such as `Panel`, `DataTable`, `Feedback`, `ToastProvider`, or `useToast` inside the product.

The current vendored `gouno-ui-*.tgz` is a distribution artifact, not a second source of UI truth. Update it only through the repository's Gouno UI synchronization workflow and keep `vendor/gouno-ui-source.txt` / the vendor manifest aligned with the exact upstream commit. Do not hand-edit or copy Gouno UI source into this repository.

When Gouno UI registry releases become the stable distribution mechanism, prefer SemVer dependency upgrades plus the existing quality gates over product-side migration forks.

## Normal Admin Page Grammar

Normal routed admin/settings pages use this composition order:

1. `PageHeader` for the route-family title and description.
2. One page-local `Tabs` layer when the route has peer sections.
3. A panel lead only when the active section needs description, status, or actions.
4. The section's real content surfaces: `Card`, `Table`, `Empty`, `Alert`, forms, lists, or status rows.

Do not repeat the selected tab label immediately as another heading. Do not add a wrapper Card merely to create spacing around a self-surfaced Table, list, or Empty state.

Landing/dashboard routes may use a different composition when the stable Showcase explicitly defines it. The Overview Hero is such a product-space exception.

## Tabs Ownership

`Tabs` owns the structural relationship and spacing between the tab bar and its active `TabPanel`. Business content belongs inside the tab item's `children` / panel ownership rather than as a page sibling that happens to be separated with an outer `gap`.

The active panel owns its own internal padding and rhythm. Do not use page-level spacing utilities to compensate for a Tabs layout defect.

## Surface and Elevation Semantics

Use Gouno UI semantic surfaces instead of raw shadow-size utilities or locally invented card chrome.

- Normal business Cards and bordered Tables use the standard surface depth.
- The Overview Hero uses the raised/elevated role defined by the Showcase.
- Overview quick links are standard surfaces at rest and may become raised on hover.
- Standalone authentication surfaces and the Not Found result Card may use the raised/elevated role.
- Embedded compact lists or groups should normally remain border-only/grounded unless the Showcase defines a stronger surface.

Do not use `shadow-xs`, `shadow-sm`, `shadow-md`, `shadow-lg`, `shadow-xl`, or `shadow-2xl` as product vocabulary. Do not add `padding="lg"`, `p-5`, or `p-8` to normal product surfaces merely to repair alignment.

Normal product content follows the shared 24px edge rhythm unless a canonical component or the stable Showcase defines a deliberate exception.

## Collections and Actions

One semantic collection should normally have one dominant surface boundary.

Use canonical Gouno UI collection primitives directly:

- `Table` for tabular resource collections.
- `Empty` for no-data states.
- `Alert` for persistent feedback or status that should remain in flow.
- `Pagination` for paged collections.
- `Tag` for compact state/role metadata.

Dense row actions stay compact, single-line, and associated with the row they affect. Destructive meaning is expressed through semantic color and a confirmation/Sudo flow, not through a different container structure.

Production-only actions are allowed and expected when real behavior exceeds the Showcase fixture. Preserve those actions while keeping the same visual grammar.

## Async State Grammar

Asynchronous UI must preserve the most stable structure that is already known.

- Use `Skeleton` when the eventual structure is predictable. Keep route shells, PageHeader/Tabs, panel leads, Table headers, form geometry, and list anatomy visible instead of replacing the whole region with a spinner.
- Treat initial loading separately from later refreshes. If usable data already exists, keep it rendered, mark the affected region with `aria-busy`, and disable controls that would conflict with the in-flight refresh.
- Use `Button` / `IconButton` loading or disabled state for mutations and submissions. A save, delete, search, pagination, or security action must not replace unrelated page content with a loading placeholder.
- `Empty` means a successful load returned no data. A fatal initial load error must render an `Alert`/retry state without also rendering `Empty`.
- A refresh failure may render an in-flow `Alert` together with previously loaded stale content when that content is still useful and safe to show.
- Use `Spinner` only for genuinely indeterminate processing where there is no meaningful future content silhouette to preserve, such as the OAuth callback/code-exchange step.

Product-local loading compositions may live next to the route family when they mirror real product anatomy. Do not promote them into Gouno Core until repeated use across independent products proves a stable abstraction.

## Forms and Product-Local Composition

Forms use Gouno UI controls and semantic field components, while business validation and submission remain product-owned.

Small repeated compositions may live inside Gosso Admin when they express product-specific behavior. Examples include `ManagementPanelLead`, `AuthPageSurface`, and the real `LoginSurface`. Do not promote a product-local composition into Gouno Core merely because it appears in more than one Gosso route.

The Site Settings editor form and `LoginPreview` must remain sibling regions. The preview contains login inputs for fidelity and must not participate in the settings form's native validation or submission ownership.

## Authentication Surface Family

Authentication routes are a separate surface family from `AppShell` admin routes.

`LoginSurface` owns the real branded login, password, MFA, Passkey, account-mismatch, and Sudo presentation. Forgot Password, Reset Password, and OAuth Callback may share the product-local `AuthPageSurface` shell. Do not move authentication state machines, token handling, OAuth callback behavior, or Sudo semantics into Gouno UI.

## Showcase Boundary

The following concepts are Showcase-only and must not appear in production product layout:

- static fixture selectors
- scene/scenario preview controls
- "real product route" helpers
- fixture docks
- Showcase route simulators

Production pages consume the resulting design/component contract only.

## Required Validation

Every UI migration or Gouno UI upgrade must keep the repository's existing quality gates green, including formatting, linting, UI/CSS contract checks, type checking, coverage, the normal build, and the `/identity-admin` subpath build. Security and image workflows must remain green for the resulting `main` commit.

A successful build does not by itself prove visual fidelity. When a browser-capable environment is available, compare the real route against the corresponding stable Showcase state at representative desktop and mobile widths.
