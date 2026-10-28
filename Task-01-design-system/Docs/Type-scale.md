# Typography Scale

## Typeface

- **Font family:** DM Sans
- **Font style:** Normal
- **Text decoration:** None
- **Default text case:** None
- **Paragraph indent:** 0px
- **Paragraph spacing:** 0px

## Type Styles

All 15 styles use DM Sans. The line-height multiplier is consistently 1.5× the font size, providing a predictable vertical rhythm across display, heading, title, body, and label text.

| Category | Style | Size | Weight | Letter spacing | Line height |
|---|---|---:|---:|---:|---:|
| Display | Large | 64px | 600 | -1.92px | 96px |
| Display | Medium | 50px | 600 | -1.5px | 75px |
| Display | Small | 40px | 600 | -0.8px | 60px |
| Headline | Large | 32px | 500 | -0.48px | 48px |
| Headline | Medium | 28px | 500 | -0.56px | 42px |
| Headline | Small | 24px | 500 | -0.336px | 36px |
| Title | Large | 22px | 500 | -0.22px | 33px |
| Title | Medium | 16px | 500 | -0.16px | 24px |
| Title | Small | 14px | 500 | -0.126px | 21px |
| Body | Large | 16px | 500 | -0.136px | 24px |
| Body | Medium | 14px | 500 | -0.119px | 21px |
| Body | Small | 12px | 500 | -0.048px | 18px |
| Label | Large | 14px | 500 | -0.119px | 21px |
| Label | Medium | 12px | 500 | -0.102px | 18px |
| Label | Small | 11px | 500 | -0.044px | 16.5px |

## Line-Height Rationale

The system uses a 1.5× line-height multiplier for all 15 styles. This creates consistent vertical spacing and supports readability across different text sizes. The smallest label style uses a 16.5px line height, matching the same multiplier.

## Letter Spacing

Letter spacing varies by style and is generally negative. Display Large uses -1.92px, while smaller styles use less negative values. These are the existing design-token values and should be validated visually at their intended sizes.

### Display Large Letter-Spacing Comparison

Material Design 3 specifies -0.25px letter spacing for Display Large.
SchoolPass uses -3% letter spacing at its chosen font size of 64px,
equivalent to -1.92px in tokens.css.

The default and chosen-spacing screenshots use the same font size
and line height, isolating the visual effect of the letter-spacing
change.