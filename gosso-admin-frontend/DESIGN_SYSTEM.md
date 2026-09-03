# Shared UI Design System Baseline

This frontend follows the same interaction and layout contract as `gouno-blog/blog-frontend`. Product branding may use a different accent hue, but component geometry, spacing, state semantics, surface depth, and accessibility behavior must remain equivalent.

## Primitive ownership

- Shared controls live in `src/components/ui` and compose `cn`, `cva`, Radix UI, and semantic CSS tokens.
- Feature code must use `Button`, `ButtonLink`, `IconButton`, `IconButtonLink`, `Badge`, `Dialog`, `Modal`, `Panel`, and shared form controls instead of duplicating their markup.
- Legacy size aliases remain accepted for compatibility, but new code uses `sm`, `default`, or `lg`.

## Control matrix

| Size | Height | Text action padding | Icon action |
| --- | ---: | ---: | ---: |
| `sm` | 34px | 12px | 34 x 34px |
| `default` | 38px | 14px | 38 x 38px |
| `lg` | 46px | 18px | 46 x 46px |

Buttons use an 8px radius. Small controls use a 6px icon/label gap; default and large controls use 8px. Icons always render in a fixed 16px, non-shrinking slot.

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

Panels use the semantic dark surface hierarchy, an 8% text-derived border, a 12px radius, and a restrained elevation shadow. Interactive panels lift by at most 1px.

`Dialog` and `Modal` use Radix UI focus management. Overlays blur by 8px, dialog surfaces use a 12px radius, and footer actions are separated by a top border and aligned to the end. Escape and outside-click behavior must be configured through the shared primitive rather than reimplemented by a page.

## Verification

Before merging frontend changes, run:

```bash
npm run format && npm run quality
```
