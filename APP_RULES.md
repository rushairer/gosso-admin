# App Rules

## Admin Page Skeleton

Admin and settings tabs belong to one page family. Each tab must use the same skeleton:

1. tabs
2. one primary panel
3. panel header with title, description, and optional right-side primary action
4. panel body containing exactly one primary content pattern: table, list, definition list, form, or empty state
5. modal only for focused create, edit, confirm, or inspect tasks

Do not add a second visual card inside a panel. If a tab needs multiple groups, use plain sections separated by borders inside the same panel.

## Panel Hierarchy

A panel is the highest content container inside a tab. Panels own their header, body spacing, and borders.

Use one of these content roles inside a panel:

- table for resource collections
- list for compact item collections
- definition list for key/value metadata
- form for edit flows
- empty state when the collection has no rows
- inline status rows for health or state summaries

Do not hand-roll new border, radius, background, or padding combinations for these roles.

## Action Placement

Primary actions that create or register items belong in the panel header, aligned right.

Examples:

- Register Client lives in the OAuth2 Clients panel header.
- Add User lives in the User Accounts panel header.
- Add a Passkey lives in the Passkeys panel header.

Row actions belong inside the row they affect. Destructive actions must be visually secondary until confirmation or execution.

## Empty States

Empty states replace the table or list body. They do not create another card.

Empty states must include:

- one muted icon
- one short title
- one explanatory sentence

If the primary action already exists in the panel header, do not duplicate it inside the empty state.

## Spacing

Use the shared CSS primitives instead of inline spacing:

- panel header: `18px 20px`
- panel body: `20px`
- section separator: `20px` padding with top border
- row vertical rhythm: `14px`
- compact action buttons: `36px` height

Use `8 / 12 / 16 / 20 / 24 / 32` as the spacing scale. Avoid one-off values unless required by a fixed external asset.

## Visual Style

The admin UI should feel quiet, operational, and repeatable.

Avoid:

- gradient text
- decorative glow
- nested cards
- mixed border colors for the same role
- marketing-style hero layouts
- repeated inline background/border/radius styles

Prefer:

- flat dark panels
- clear borders
- compact tables
- predictable action placement
- muted metadata
- restrained status color

## Engineering Pattern

Repeated UI structure must be expressed through shared components or shared CSS primitives.

Use:

- `Panel`
- `PanelHeader`
- `PanelBody`
- `PlainSection`
- `DataTable`
- `DefinitionList`
- `EmptyState`
- `ListStack`
- `ListRow`
- `Feedback`

Do not add new repeated admin UI with raw `glass-card`, `panel-header`, `admin-table`, or large inline style blocks directly in pages.
