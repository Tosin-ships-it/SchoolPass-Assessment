# Colour Roles and Contrast Verification

## 1. Brand Colour and Tonal System

### 1.1 Brand Colour Selection and Origin

SchoolPass uses teal as its primary brand colour.

- **Brand colour:** `#087E8B`
- **Selected tonal palette value:** Primary 40 (`--primitives-color-palettes-primary-primary40`)
- **Purpose:** Primary actions, links, active navigation states, and key brand elements.
- **Design-system reference:** Material Design 3 colour-role and tonal-palette principles.

**Historical Origin vs. Design Rationale:**
- *Historical origin:* The baseline SchoolPass requirements (PRD v6.0 and Addendum v6.1) define functional capabilities, user flows, and operational boundaries, but do not specify a pre-existing school logo, brand style guide, or stakeholder-supplied colour palette. Hex `#087E8B` was selected during initial product design and scaffolding as the primary brand key colour. It was not inherited from an existing physical school brand or primary field research.
- *Design rationale:* Teal was chosen to establish an institutional, trustworthy, and calm aesthetic suited for a school management application handling sensitive child attendance records and financial school fee transactions. It conveys authority and reliability while avoiding aggressive primaries (such as high-saturation red or plain blue) and maintaining sufficient contrast against light background surfaces on mobile viewports.

### 1.2 Primary 40 Pinning (Before and After)

The primary colour was configured in Figma using the Material Design 3 tonal palette workflow. Evidence includes two comparison captures:

- **Unpinned state:** `Evidence/01-palette-before-pin.png`
- **Pinned state:** `Evidence/02-palette-after-pin.png`
- **Variable assignment:** `Evidence/14-primary40-variable-assignment.png`

**Visible Differences Confirmed from Evidence:**
In the unpinned state (`01-palette-before-pin.png`), the primary tonal palette displays the 14 generated tonal swatches (tones 0 to 100) alongside the brand colour `#087E8B`, but no specific swatch is assigned or designated as the Primary Key Color. In the pinned state (`02-palette-after-pin.png`), tone 40 is explicitly pinned with a checkmark badge and assigned as the Primary Key Color. Pinning `#087E8B` as Primary 40 anchors the brand colour within the token system, ensuring that primary semantic roles resolve to the exact intended hex value while the surrounding lighter and darker tones generate around it. This connects the variable reference to the named role in the design system rather than leaving the base brand tone unassigned.

### 1.3 Tonal Palette Scale and Theme Support

The SchoolPass colour system generates tonal palettes comprising exactly **14 tone values**:

```text
0, 5, 10, 20, 30, 40, 50, 60, 70, 80, 90, 95, 99, 100
```

- **Material Baseline Divergence:** As documented in `Docs/Divergences.md` (Divergence 3), the standard Material Design 3 tonal scale uses 13 tones (`0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 95, 99, 100`). SchoolPass deliberately incorporates tone 5 (`#001417` in Primary) to provide an intermediate step between pure black (0) and deep tone (10).
- **Dual-Theme Support Mechanism:** A tonal palette establishes a mathematically defined luminance progression from tone 0 (pure black) to tone 100 (pure white). In an M3-style token architecture, a single tonal export supports both light and dark themes by inverting role assignments across the scale:
  - *Light theme:* Surfaces use high-luminance tones (e.g., Surface at tone 99 `#FAFDFE`), text and icons use dark tones (e.g., On Surface at tone 10 `#191C1D`), and primary actions use tone 40 (`#087E8B`) with tone 100 text (`#FFFFFF`).
  - *Dark theme:* Surfaces shift to low-luminance tones (e.g., Surface at tone 10/20), text shifts to tone 90/99, and primary actions shift to tone 80 with tone 20 text.
  - *Application status:* While the 14-tone scale architecturally supports both themes from a shared token source, the running SchoolPass web application currently implements light theme only. Dark theme is an architectural capability of the token system, not an active application feature.

---

## 2. Semantic Colour Roles

The colour system separates primitive palette values from semantic roles. Components should use semantic roles rather than primitive palette values or raw hex codes.

| Semantic role | Value | Source primitive token | Intended use |
|---|---|---|---|
| Primary | `#087E8B` | `primary-primary40` | Primary actions, links, active states |
| On Primary | `#FFFFFF` | `primary-primary100` | Text and icons on primary backgrounds |
| Primary Container | `#DBF8FF` | `primary-primary95` | Subtle primary containers and badges |
| On Primary Container | `#00666F` | `primary-primary30` | Text and icons on primary containers |
| Secondary | `#066A75` | `secondary-secondary40` | Secondary actions, badges, and headers |
| On Secondary | `#FFFFFF` | `secondary-secondary100` | Text and icons on secondary backgrounds |
| Background | `#FAFDFE` | `neutral-neutral99` | Main application background |
| On Background | `#191C1D` | `neutral-neutral10` | Primary text on application background |
| Surface | `#FAFDFE` | `neutral-neutral99` | Cards, dialogs, and component surfaces |
| On Surface | `#191C1D` | `neutral-neutral10` | Primary text on component surfaces |
| Surface Variant | `#EFF1F2` | `neutral-neutral95` | Secondary cards and muted backgrounds |
| On Surface Variant | `#434748` | `neutral-neutral30` | Supporting/secondary text on surfaces |
| Outline Color | `#E0E3E4` | `neutral-neutral90` | Borders, outlines, and form field boundaries |
| Outline Variant | `#EFF1F2` | `neutral-neutral95` | Subtle dividers and secondary borders |
| Error | `#BA1A1A` | `error-error40` | Error states, alerts, and destructive actions |
| On Error | `#FFFFFF` | `error-error100` | Text and icons on error backgrounds |
| Error Container | `#FFEDEA` | `error-error95` | Error alert backgrounds |
| On Error Container | `#93000A` | `error-error30` | Text and icons on error containers |

### 2.1 Functional Colours Export Status

- **Error:** **Fully Implemented.** Defined in `design-tokens.tokens.json` and `tokens.css` with a key colour (`#ba1a1a`), full 14-step tonal palette, and 4 semantic roles (`error`, `on error`, `error container`, `on error container`).
- **Warning:** **Outstanding Token/Export Gap.** A warning key colour (`#8a5a00`) and 14-tone primitive palette exist in `tokens.json` and `tokens.css`. However, **zero semantic roles** were generated under `color roles`. Because semantic warning roles are absent from the token files, UI components currently bypass the design system and use hardcoded hex values (`#E65100` and `#c25700`).
- **Success:** **Outstanding Token/Export Gap.** Neither key colour, tonal palette, nor semantic roles are present in `design-tokens.tokens.json` or `tokens.css`. Although previous documentation referred to `#2E7D32` in the design tool, no success tokens were included in the export.
- **Export Classification:** The omission of Warning and Success semantic roles is an outstanding export defect/gap, not an intentional design decision.

### 2.2 Implementation and Export Discrepancies

1. **Undefined Outline Token:**
   - In `tokens.css:142`, the token is generated as `--color-roles-outline-color` (from `"outline color"` in Figma).
   - In `StudentsManager.tsx:469-724`, form inputs call `var(--color-roles-outline)`.
   - Because `--color-roles-outline` is undefined and has no fallback, the shorthand border declaration is invalid at computed-value time, causing inputs to render without borders.
2. **Missing Surface Container Tokens:**
   - In `tokens.css`, the only exported surface container roles are `--color-roles-surface-container-highest` and `--color-roles-surface-container-dim`.
   - In `src/app/(staff)/students/page.tsx:45` and `StudentsManager.tsx:414, 753, 766, 884`, inline styles call `var(--color-roles-surface-container)`.
   - This property is undefined, causing the affected container backgrounds to resolve to transparent at computed-value time.
3. **Malformed Secondary Container Role Name:**
   - In `design-tokens.tokens.json`, the token key was exported as `"on secondarycontainer"` (missing a space).
   - In `tokens.css:123`, this generated `--color-roles-on-secondarycontainer` rather than `--color-roles-on-secondary-container`.

---

## 3. Contrast Verification

### 3.1 Calculation Methodology

Contrast ratios are evaluated against the W3C Web Content Accessibility Guidelines (WCAG) 2.1 Level AA requirements:
- Normal text (< 18pt or < 14pt bold): minimum **4.5:1**
- Large text ($\ge$ 18pt or $\ge$ 14pt bold): minimum **3.0:1**

The contrast ratio is calculated using the standard relative luminance formula:
$$\text{Contrast Ratio} = \frac{L_1 + 0.05}{L_2 + 0.05}$$
where $L_1$ is the relative luminance of the lighter colour and $L_2$ is the relative luminance of the darker colour. Luminance $L$ is computed by linearizing 8-bit sRGB components ($C_{\text{srgb}} = C / 255$):
$$c = \begin{cases} \frac{C_{\text{srgb}}}{12.92} & \text{if } C_{\text{srgb}} \le 0.04045 \\ \left(\frac{C_{\text{srgb}} + 0.055}{1.055}\right)^{2.4} & \text{if } C_{\text{srgb}} > 0.04045 \end{cases}$$
$$L = 0.2126R + 0.7152G + 0.0722B$$

### 3.2 Checked Semantic Role Combinations

The following 13 semantic role combinations were mathematically verified using the formula above:

| Role combination | Foreground hex | Background hex | Calculated ratio | Documented ratio | WCAG AA status |
|---|---|---|---:|---:|---|
| On Primary on Primary | `#FFFFFF` | `#087E8B` | 4.81:1 | 4.81:1 | Pass |
| On Secondary on Secondary | `#FFFFFF` | `#066A75` | 6.31:1 | 6.31:1 | Pass |
| On Surface Variant on Surface Variant | `#434748` | `#EFF1F2` | 8.30:1 | 8.30:1 | Pass |
| On Background on Background | `#191C1D` | `#FAFDFE` | 16.77:1 | 16.77:1 | Pass |
| On Surface on Surface | `#191C1D` | `#FAFDFE` | 16.77:1 | 16.77:1 | Pass |
| On Surface Variant on Surface | `#434748` | `#FAFDFE` | 9.20:1 | 9.20:1 | Pass |
| Primary on Surface | `#087E8B` | `#FAFDFE` | 4.70:1 | 4.70:1 | Pass |
| Primary on Background | `#087E8B` | `#FAFDFE` | 4.70:1 | 4.70:1 | Pass |
| On Primary Container on Primary Container | `#00666F` | `#DBF8FF` | 6.03:1 | 6.03:1 | Pass |
| On Error Container on Error Container | `#93000A` | `#FFEDEA` | 8.26:1 | 8.26:1 | Pass |
| Error on Surface / Background | `#BA1A1A` | `#FAFDFE` | 6.32:1 | 6.32:1 | Pass |
| On Surface Variant on Outline Color | `#434748` | `#E0E3E4` | 7.29:1 | 7.29:1 | Pass |
| On Surface on Surface Variant | `#191C1D` | `#EFF1F2` | 15.13:1 | 15.13:1 | Pass |

All 13 defined semantic role pairings exceed the 4.5:1 threshold for normal text.

### 3.3 Source-Level Component Checks and Contrast Failures

Source code inspection identified hardcoded warning and button colours in component files. The following checks document those combinations:

| Element & Location | Foreground | Background | Calculated ratio | WCAG AA status |
|---|---|---|---:|---|
| Pending badge in `StudentLinkSection.tsx` | `#E65100` | Orange tint on `#FAFDFE` | 3.27:1 | **Fail (< 4.5:1)** |
| Pending notice in `StudentLinkSection.tsx` | `#E65100` | `#FAFDFE` | 3.71:1 | **Fail (< 4.5:1)** |
| Pending badge in `GuardianLinksManager.tsx` | `#E65100` | Orange tint on `#FAFDFE` | 3.27:1 | **Fail (< 4.5:1)** |
| Approval badge in `ParentRegisterForm.tsx` | `#C25700` | Amber tint on `#FAFDFE` | 3.88:1 | **Fail (< 4.5:1)** |
| Tab counter active state in `GuardianLinksManager.tsx` | `#087E8B` | `#FFFFFF` | 4.81:1 | Pass |
| Tab counter inactive state in `GuardianLinksManager.tsx` | `#FFFFFF` | `#087E8B` | 4.81:1 | Pass |
| Confirm rejection button in `GuardianLinksManager.tsx` | `#FFFFFF` | `#BA1A1A` | 6.46:1 | Pass |
| Confirm removal button in `GuardianLinksManager.tsx` | `#FFFFFF` | `#BA1A1A` | 6.46:1 | Pass |

**Documented Accessibility Failures:** The four warning/pending badge and text combinations fall below the 4.5:1 normal-text requirement. They are explicitly recorded as known accessibility defects resulting from hardcoded raw colours rather than token-controlled roles.

### 3.4 Scope and Limitations

This contrast verification covers the 13 defined semantic role pairs and the 8 source-level component checks. It does not constitute an exhaustive automated audit of every screen state across the application. Live browser-rendered computed contrast was not verified due to offline test driver constraints.

---

## 4. Implementation Divergences

1. **Raw Warning Colours:** Hardcoded `#E65100` and `#C25700` with translucent `rgba(...)` backgrounds are used in parent records, guardian links, and registration forms. These fail WCAG AA contrast for normal text and should be replaced with standardized semantic warning tokens.
2. **Raw White Values:** Literal `#ffffff` is hardcoded in `GuardianLinksManager.tsx` for button text and tab counters rather than referencing `var(--color-roles-on-primary)` or `var(--color-roles-surface)`.
3. **Undefined Token Call Sites:** `StudentsManager.tsx` and `students/page.tsx` reference `--color-roles-outline` and `--color-roles-surface-container`, which are absent from the CSS token export.
4. **Transactional Email Inlines:** Transactional email templates in `src/lib/auth/email.ts` contain inline hex codes (`#087e8b`, `#066a75`, `#f8fafc`, `#334155`). These are required for broad email client compatibility where CSS custom properties are unsupported, and are documented as an intentional architectural exception.

---

## 5. Raw-Colour Search Evidence

Supporting evidence for the codebase colour scan is located at:

`Evidence/07-raw-value-search.txt`

The report records the exact PowerShell search commands and full output scanning both `SchoolPass-Assessment` (0 violations outside tokens) and `SchoolPass\src` (capturing all raw hex occurrences).

---

## 6. Evidence References

| Evidence Item | File Path |
|---|---|
| Palette before pinning | `Evidence/01-palette-before-pin.png` |
| Palette after pinning | `Evidence/02-palette-after-pin.png` |
| Display Large default spacing | `Evidence/03-spacing-default.png` |
| Display Large chosen spacing | `Evidence/04-spacing-chosen.png` |
| Raw-value search output | `Evidence/07-raw-value-search.txt` |
| Typography agent answer | `Evidence/08-agent-typography-answer.txt` |
| Primary palette overview | `Evidence/13-primary-palette-overview.png` |
| Primary 40 variable assignment | `Evidence/14-primary40-variable-assignment.png` |
| Display Large default settings | `Evidence/15-display-large-default-settings.png` |
| Shadow styles in Figma | `Evidence/16-shadow-styles-in-figma.png` |

---

## 7. Summary

The SchoolPass colour system establishes an intentional primary brand colour (`#087E8B`), pinned as Primary 40, with a 14-step tonal palette. Contrast verification confirms that all 13 defined semantic role combinations pass WCAG Level AA thresholds, while four hardcoded warning implementations fail AA and represent documented accessibility defects.

Export discrepancies—specifically the omission of semantic Warning and Success roles, the undefined `--color-roles-outline` token, and the missing `--color-roles-surface-container` property—are documented as known token export gaps rather than resolved features.
