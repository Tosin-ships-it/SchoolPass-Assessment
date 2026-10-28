# Task 1 Defect Report: Undefined CSS Custom Property in Staff Student Management

## 1. Defect Summary

The staff prospective student intake and directory interface uses an undefined CSS custom property, `--color-roles-outline`, across its form input and search elements without providing a fallback value. 

While the component implementation expects `--color-roles-outline`, the loaded token stylesheet defines the token as `--color-roles-outline-color`. Under CSS custom property rules, referencing an undefined custom property without a fallback value causes shorthand properties (such as `border: 1px solid var(--color-roles-outline)`) to be treated as invalid at computed-value time, resetting the declaration to its initial value (`border-style: none`).

---

## 2. Exact Source File and Affected Lines

- **Source File:** `C:\Users\gbola\Desktop\SchoolPass\src\app\(staff)\students\StudentsManager.tsx`
- **Affected Lines:**
  - **Line 312:** `color: 'var(--color-roles-outline)'` *(Registration slip status text)*
  - **Line 469:** `border: '1px solid var(--color-roles-outline)'` *(Student Full Name input `#name`)*
  - **Line 502:** `border: '1px solid var(--color-roles-outline)'` *(Intended Class input `#intendedClass`)*
  - **Line 535:** `border: '1px solid var(--color-roles-outline)'` *(Intake Session input `#intakeYear`)*
  - **Line 569:** `border: '1px solid var(--color-roles-outline)'` *(Guardian Name input `#guardianName`)*
  - **Line 601:** `border: '1px solid var(--color-roles-outline)'` *(Guardian Phone input `#guardianPhone`)*
  - **Line 633:** `border: '1px solid var(--color-roles-outline)'` *(Guardian Email input `#guardianEmail`)*
  - **Line 667:** `border: '1px solid var(--color-roles-outline)'` *(Notes textarea `#notes`)*
  - **Line 724:** `border: '1px solid var(--color-roles-outline)'` *(Directory search input)*

---

## 3. Evidence and Technical Explanation

### 3.1 Source-Code Call Sites
In `StudentsManager.tsx`, the prospective student registration inputs and directory search input apply inline styles with the following pattern:

```tsx
style={{
  width: '100%',
  padding: '10px 12px',
  borderRadius: '8px',
  border: '1px solid var(--color-roles-outline)',
  backgroundColor: 'var(--color-roles-surface)',
  color: 'var(--color-roles-on-surface)',
  fontSize: 'var(--typography-body-medium-fontsize)',
  boxSizing: 'border-box',
}}
```

### 3.2 Loaded Token Stylesheet Definitions
The application loads design system tokens through `src\app\globals.css`, which imports `tokens.css`:

```css
/* C:\Users\gbola\Desktop\SchoolPass\tokens.css, lines 142-143 */
--color-roles-outline-color: var(--primitives-color-palettes-neutral-neutral90);
--color-roles-outline-variant: var(--primitives-color-palettes-neutral-neutral95);
```

The property `--color-roles-outline` is not declared anywhere in `tokens.css` or `globals.css`.

### 3.3 Root Cause of Token Name Mismatch
In `design-tokens.tokens.json`, the token under `color roles` is defined as `"outline color"` (pointing to `{primitives.color palettes.neutral.neutral90}`, hex `#E0E3E4`). When `convert-tokens.js` ran, it slugified the token key directly to `--color-roles-outline-color`. The component author expected the standard Material Design 3 token name `--color-roles-outline`, creating an undetected naming divergence.

### 3.4 CSS Custom Property Invalidation Mechanism
Per the W3C CSS Custom Properties for Cascading Variables Module Level 1 specification (§3.3 "Invalid at Computed-Value Time"):
- When a CSS declaration contains a `var()` function referencing an undeclared property without a fallback value, the declaration becomes invalid at computed-value time.
- For shorthand properties such as `border`, invalidation at computed-value time causes the declaration to reset to its `initial` value (`border-style: none`, `border-width: medium`).
- Because `globals.css` does not provide an explicit fallback border rule for `input` or `textarea`, the inputs lose their visible bounding outline under standard CSS engine rules.

---

## 4. Steps to Reproduce or Verify

1. **Verify Token Absence in CSS:**
   - Open `C:\Users\gbola\Desktop\SchoolPass\tokens.css`.
   - Search for `--color-roles-outline:`.
   - Observe that only `--color-roles-outline-color` (line 142) and `--color-roles-outline-variant` (line 143) exist.

2. **Verify Component Call Sites:**
   - Open `C:\Users\gbola\Desktop\SchoolPass\src\app\(staff)\students\StudentsManager.tsx`.
   - Inspect line 469 (`#name` input) through line 724 (directory search input).
   - Observe that each input specifies `border: '1px solid var(--color-roles-outline)'` without a fallback parameter.

3. **Runtime Browser Inspection (when server is running):**
   - Start the development server (`npm run dev`) and sign in with front-desk staff credentials (`frontdesk@school.ng` / `FrontDesk2026!`).
   - Navigate to `/students`.
   - Open browser developer tools and inspect the `#name` input element.
   - Inspect the computed style pane: `border-style` resolves to `none` (or is struck through as invalid at computed-value time), indicating that the border declaration failed to apply.

---

## 5. User Impact

- **Front-Desk Staff and Administrators:** Staff operating the intake desk may experience difficulty distinguishing where the form input fields and search box begin and end against the light card surface (`--color-roles-surface`).
- **Form Usability:** Without clear bounding borders, users relying on visual cues may struggle to pinpoint click or tap targets, especially on lower-contrast screens or in brightly lit school front-office environments.

---

## 6. Likely Production Cost or Consequence

- **Reduced Data Entry Efficiency:** Front-desk staff entering prospective student records during busy term registration periods are likely to encounter slower data entry speeds or missed form interactions due to reduced visual boundary clarity.
- **Form Boundary Ambiguity:** Input fields blending into their background can lead to user hesitation and increased risk of accidental form resets or validation retries.
- **Design System Drift:** This issue demonstrates the risk of manual token consumption: when components reference guessed token names rather than the verified token dictionary, silent visual degradation occurs without raising compiler or build-time errors.

*(Note: These are evaluated as likely operational consequences based on UI inspection, rather than a measured financial loss or formal compliance ruling).*

---

## 7. Verification Limitations

- **Source-Code vs. Browser-Tested Verification:**
  - This defect has been **fully confirmed through static source-code analysis**, token dictionary cross-referencing, and CSS specification rules.
  - **Live browser verification was not completed.** Automated headless browser testing via Playwright could not be initialized in this environment due to offline/sandboxed driver download constraints (HTTP 404 on Playwright binaries).
  - Therefore, live computed style readouts (e.g. via `window.getComputedStyle`) and browser screenshots are not claimed as verified evidence in this report.
