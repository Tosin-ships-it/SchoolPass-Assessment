# Shadow Styles

## Purpose

SchoolPass uses three shadow levels to create visual hierarchy and distinguish interface elements by elevation. Each shadow uses the brand colour `#087E8B` rather than plain black.

## Shadow Specifications

| Style | X offset | Y offset | Blur | Spread | Colour | Opacity |
|---|---:|---:|---:|---:|---|---:|
| Soft | 1.5px | 6px | 30px | 0px | `#087E8B` | 12% |
| Medium | 4px | 6px | 24px | 0px | `#087E8B` | 18% |
| Hard | 6px | 10px | 20px | 0px | `#087E8B` | 20% |

## Existing Design Token Values

```css
--effect-soft-shadow: 1.5px 6px 30px 0px #087e8b1f;
--effect-medium-shadow: 4px 6px 24px 0px #087e8b2e;
--effect-hard-shadow: 6px 10px 20px 0px #087e8b33;
```

The final two digits of each eight-digit hex colour represent the alpha channel:
- `1f` = approximately 12% opacity
- `2e` = approximately 18% opacity
- `33` = approximately 20% opacity

## Rationale

The soft shadow provides a broad, subtle separation between interface elements and their surroundings. The medium and hard shadows use progressively stronger offsets and opacity to create more noticeable elevation and hierarchy.

Using the SchoolPass brand colour for all three shadows maintains consistency with the product's visual identity and avoids introducing unrelated black shadows.

## Evidence Checklist

- [x] Capture a screenshot showing the three shadow styles in Figma (`Evidence/16-shadow-styles-in-figma.png`).
- [x] Confirm the documented values match the Figma effects.
- [x] Record the existing shadow values from `tokens.css`.