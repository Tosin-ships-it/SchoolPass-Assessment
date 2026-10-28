# Design System Divergences

## Purpose

This document records deliberate SchoolPass design decisions that differ from the Material Design 3 baseline. Each divergence explains the chosen approach, the reason behind it, and situations where the decision may be unsuitable.

## Divergence 1: Display Large Typography

**Material Design 3 baseline:** Roboto, 57sp font size, 400 weight and 64sp line height.

**SchoolPass choice:** DM Sans, 64px font size, 600 weight, 96px line height and -3% letter spacing (-1.92px at 64px).

**Reason:** I deliberately chose DM Sans and a larger, heavier Display Large style to give prominent SchoolPass headings a distinct visual hierarchy.

**When this choice could be wrong:** The larger type and generous line height may consume too much space on smaller screens or push important information below the fold. The heavier weight and tight letter spacing may also be unsuitable for long text or dense interfaces.

**Evidence references:**
- Typography tokens: `tokens/tokens.css`
- Typography evidence: `evidence/`

## Divergence 2: Brand-Coloured Shadows

**Material Design 3 baseline:** Material elevation uses defined elevation and shadow treatments, with implementation details varying by platform and component.

**SchoolPass choice:** All three shadow tokens use the brand colour `#087E8B`, with different offsets, blur values and opacity.

| Style | X offset | Y offset | Blur | Spread | Colour with alpha |
|---|---:|---:|---:|---:|---|
| Soft | 1.5px | 6px | 30px | 0px | `#087E8B1F` |
| Medium | 4px | 6px | 24px | 0px | `#087E8B2E` |
| Hard | 6px | 10px | 20px | 0px | `#087E8B33` |

**Reason:** I deliberately chose the brand colour for the shadows to reinforce SchoolPass's visual identity and maintain consistency with the primary colour.

**When this choice could be wrong:** Brand-coloured shadows may introduce unwanted colour casts or distract from content, especially on large surfaces or when several elevated elements overlap.

**Evidence references:**
- Shadow tokens: `tokens/tokens.css`
- Figma effects evidence: `evidence/`

## Divergence 3: Extended Tonal Scale

**Material Design 3 baseline:** The classic tonal scale uses 13 values: 0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 95, 99 and 100.

**SchoolPass choice:** The SchoolPass tonal scale uses 14 values: 0, 5, 10, 20, 30, 40, 50, 60, 70, 80, 90, 95, 99 and 100.

**Reason:** I deliberately added tone 5 to broaden the available range of colour tones and provide an additional step between tones 0 and 10.

**When this choice could be wrong:** An additional tone increases the number of colour values that must be maintained and documented. It may add unnecessary complexity if the interface does not benefit from the extra distinction.

**Evidence references:**
- Colour tokens: `tokens/design-tokens.tokens.json`
- Colour palette screenshots: `evidence/`

## References

- Material Design 3: https://m3.material.io/
- Material Design 3 typography guidance: https://developer.android.com/develop/ui/compose/designsystems/material3
- SchoolPass CSS design tokens: `tokens/tokens.css`
- SchoolPass JSON design tokens: `tokens/design-tokens.tokens.json`
- SchoolPass token conversion script: `tokens/convert-tokens.js`

## Verification Status

The three choices are confirmed as intentional design decisions. Before submission, verify the Material reference values against the documentation used for the assessment and confirm that the copied token files and Figma evidence support each comparison.
