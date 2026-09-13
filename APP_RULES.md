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

Consume `@gouno/ui` as an exact immutable npm registry version. Keep `package.json` and `package-lock.json` aligned with the same published release and require registry tarball integrity metadata. Do not vendor local UI archives or hand-edit/copy Gouno UI source into this repository.

Gouno UI registry releases are the stable distribution mechanism. Upgrade through explicit SemVer dependency changes plus the existing quality gates rather than product-side migration forks.

## Migration Status

The Gosso Admin reverse-migration and design convergence onto canonical Gouno UI is closed as of 2026-09-09. The production application is now a normal consumer of the shared package rather than an active migration target.

Future Gouno UI changes must flow through the registry dependency update workflow and be handled as normal dependency upgrades: validate exported contracts, lock the exact registry release, run the full product quality gates, and make only the product-side compatibility or fidelity changes required by an intentional upstream contract change.

Do not reopen a broad product-side migration program merely because Gouno UI gains new Showcase examples, documentation, tests, Patterns, or unrelated product fixtures. Reopen migration-level work only for an explicit breaking shared contract or an intentional redesign of the Gosso Admin canonical product language.

The 2026-09-10 System Management navigation change is such an intentional product-language redesign, but it remains a narrow product update rather than a reopened migration program. Its five durable management domains are standalone Sidebar destinations; Account Settings remains the canonical page-local Tabs family.

## Normal Admin Page Grammar

Normal routed admin/settings pages use the smallest navigation hierarchy that matches their information architecture:

1. `PageHeader` owns the routed page title and any route-level introduction that is stable for that destination.
2. A durable domain that is already reachable from the Sidebar renders its panel lead and real content directly; do not repeat those destinations in a route-family `Tabs` layer.
3. One page-local `Tabs` layer is allowed when peer views genuinely share one route context and are not already independent primary-navigation destinations. Account Settings is the canonical current example.
4. A panel lead is used only when the active page or section needs description, status, or actions.
5. Real content surfaces follow: `Card`, `Table`, `Empty`, `Alert`, forms, lists, or status rows.

Do not repeat the current page or selected tab label immediately as another heading. Do not add a wrapper Card merely to create spacing around a self-surfaced Table, list, or Empty state.

Landing/dashboard routes may use a different composition when the stable Showcase explicitly defines it. The Overview Hero is such a product-space exception.

## Tabs Ownership

`Tabs` is a page-local secondary-navigation primitive, not a second representation of the primary Sidebar navigation. The five System Management domains (`clients`, `users`, `audit-logs`, `site-settings`, `system`) are standalone Sidebar routes and must not be wrapped in a System Management `Tabs` layer.

Where Tabs is canonical, it owns the structural relationship and spacing between the tab bar and its active `TabPanel`. Business content belongs inside the tab item's `children` / panel ownership rather than as a page sibling that happens to be separated with an outer `gap`.

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

- Use `Skeleton` when the eventual structure is predictable. Keep route shells, PageHeader, any canonical page-local Tabs, panel leads, Table headers, form geometry, and list anatomy visible instead of replacing the whole region with a spinner.
- Treat initial loading separately from later refreshes. If usable data already exists, keep it rendered, mark the affected region with `aria-busy`, and disable controls that would conflict with the in-flight refresh.
- Domain-shaped defaults exposed by SDKs or hooks are unresolved until the first successful request completes. Values such as `MFA disabled`, empty Passkeys, or empty Sessions must not be presented as real business state before that boundary is crossed.
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
