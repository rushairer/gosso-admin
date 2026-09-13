# Shared UI Design System Baseline

This frontend follows the same interaction and layout contract as `gouno-blog/blog-frontend` and the Gouno UI Showcase. Product branding may use a different accent hue, but component geometry, spacing, state semantics, surface depth, and accessibility behavior must remain equivalent.

## Primitive ownership

- Shared controls, tokens, theme behavior, shell patterns, runtime theme bootstrap, and canonical Gouno family brand marks are owned by the published `@gouno/ui` package.
- Product code consumes governed package entrypoints such as `@gouno/ui/core`, `@gouno/ui/patterns`, `@gouno/ui/gouno`, `@gouno/ui/theme`, and `@gouno/ui/brand-icons/*`; it must not recreate package primitives under `src/components/ui` or vendor package assets into `public/`.
- Feature code must use `Button`, `ButtonLink`, `IconButton`, `IconButtonLink`, `Badge`, `Dialog`, `Modal`, `Panel`, and shared form controls instead of duplicating their markup.
- Legacy size aliases remain accepted for compatibility, but new code uses `sm`, `default`, or `lg`.

## Control matrix

| Size | Height | Text action padding | Icon action |
| --- | ---: | ---: | ---: |
| `sm` | 34px | 12px | 34 x 34px |
| `default` | 38px | 14px | 38 x 38px |
| `lg` | 46px | 18px | 46 x 46px |

Controls use a 6px radius (`--radius-control: 6px`; large controls scale to 8px). Small controls use a 6px icon/label gap; default and large controls use 8px. Icons always render in a fixed 16px, non-shrinking slot.

Canonical action variants are `primary`, `secondary`, `destructive`/`danger`, `ghost`, and `outline`. `default`, `base`, `regular`, and `compact` are compatibility aliases only.

## Badge contract

Badges default to a neutral tone and use an 8px radius, 3px vertical padding, and 8px horizontal padding. Supported semantic tones are `primary`/`brand`, `secondary`/`neutral`, `success`, `warning`, and `destructive`/`danger`. Use `pill` only when a fully rounded capsule is semantically useful.

## Layout rhythm

- Page and panel groups use 24px (`gap-6`) as the default vertical rhythm; dense item groups use 12-16px.
- Cards and panels use 24px internal padding unless a component explicitly owns a flush table or list.
- Form labels sit 6px above their controls. Fields are separated by 16px. Submit/action rows start after 16px.
- Page content uses responsive horizontal padding capped at 36px.

## Data display

Table cells are vertically centered. Text, icons, badges, and actions that belong together stay on one line. Action columns are right-aligned and use a non-wrapping 8px action group. Icon slots and controls must declare non-shrinking behavior.

## Surface and overlay contract

Panels use semantic surface tokens, restrained borders/radii/elevation, and the same light/dark hierarchy as the canonical package. Product code must not recreate primitive surface rules locally.

`Dialog` and `Modal` consume the focus-management and overlay behavior provided by `@gouno/ui`; product pages must not import Radix UI directly or reimplement escape/outside-click behavior.

## CSS cascade isolation

- Tailwind is imported exactly once from `src/styles/tailwind.css`, which must be the first CSS entry loaded by `main.tsx`.
- Canonical reset, font faces, semantic tokens, and primitive styling come from `@gouno/ui`; product CSS is feature-scoped only.
- Accessibility overrides that must outrank utilities live in the final `overrides` layer and are loaded last.
- Every source stylesheet must place style rules inside an explicit cascade layer; `npm run lint:css` rejects unlayered top-level rules, `!important`, and invalid entry ordering.

## Brand and bootstrap ownership

- Shell branding uses the canonical color-agnostic Gosso Admin mark published under `@gouno/ui/brand-icons/gosso-admin.svg` and the same CSS-mask treatment as Showcase. Runtime `product_name` remains product data, while uploaded site logo/favicon fields do not replace the product mark in application shell chrome.
- The parser-blocking theme bootstrap and fallback favicon are read from the exact installed `@gouno/ui` release by the Vite build/dev pipeline. Committed `public/ui-bootstrap.js` or `public/gosso-admin.svg` copies are forbidden because they can drift from the installed package.

## Verification

Before merging frontend changes, run:

```bash
npm run format && npm run quality
```
