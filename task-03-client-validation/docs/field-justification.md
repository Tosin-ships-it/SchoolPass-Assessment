# Field Justification: Why Student Admission Numbers Must Use Controlled Text Inputs

## The Required Two-Sentence Justification
> A native `type="number"` input is the correct choice only when collecting discrete, quantifiable measurements that are mathematically operationalized and benefit from stepped increments, such as item quantities, ticket counts, or age. It is fundamentally incorrect for non-quantitative numeric identifiers (such as student admission numbers, credit card numbers, or postal codes), where leading zeros are meaningful, arithmetic operations are invalid, and spin buttons create accidental value mutation during mobile page scrolling.

---

## 1. Technical Flaws of Native `type="number"` for Identifiers

### 1.1 The Leading-Zero Truncation Flaw
In school administration databases, student admission identifiers frequently follow formats that contain leading zeros (e.g. `0400`, `0012`, or `SP-2026-0001`). 
When a browser encounters `<input type="number">`, the HTML Living Standard mandates that the DOM value represents a 64-bit IEEE 754 floating-point number. As a consequence:
- Entering `0400` results in the browser stripping the leading zero to serialize the mathematical value `400`.
- If an admission sequence distinguishes between Student `0400` and Student `400`, the native number input causes immediate data corruption.
- Furthermore, if the user enters letters or dashes (such as `SP-2026-0001`), the browser considers the entire input invalid and sets `input.value` to an empty string `""`, completely blinding client validation scripts.

### 1.2 Accidental Scroll Mutation and Stepper Buttons
Native `<input type="number">` controls render browser spin buttons (stepper arrows) and attach mousewheel listeners:
- On mobile devices, users scrolling down a long registration form who brush their thumb against the number input inadvertently increment or decrement the identifier value without noticing.
- Desktop users attempting to scroll through terms or form sections trigger the browser's `wheel` event, changing `0400` to `0401`.

### 1.3 Scientific Notation & Non-Numeric Characters
Because `type="number"` models floating-point numbers, browsers permit characters such as `e`, `E`, `+`, and `-`. A parent attempting to type an alphanumeric admission code or an expression will trigger scientific notation parsing (e.g., `1e5` evaluated as `100000`).

### 1.4 Accessibility Role Misalignment
In the browser Accessibility Tree (AT), `type="number"` is mapped to `role="spinbutton"`. Screen readers announce:
```
"Student Number, spinbutton, value 0, minimum 0, maximum 9999"
```
Assistive technology users are instructed to press the Up/Down arrow keys to adjust the value, which is entirely inappropriate and disorienting for an admission record identifier.

---

## 2. The Controlled Text Input Architecture

To eliminate all friction while providing an optimal mobile experience, SchoolPass implements the controlled text input pattern:
```html
<input
  id="studentNumber"
  type="text"
  inputmode="numeric"
  pattern="[0-9]*"
  placeholder="Enter student number from admission letter"
  autocomplete="off"
  aria-required="true"
/>
```

### 2.1 Benefits of Controlled Text:
1. **Preservation of Leading Zeros**: Values are stored as verbatim text strings (`"0400"` remains `"0400"`).
2. **Mobile Numeric Keypad**: The `inputmode="numeric"` attribute triggers the phone's native 0–9 number pad on iOS and Android without activating stepper arrows or floating-point rules.
3. **Regex Filtering**: Non-numeric or invalid delimiter input can be cleanly validated via client-side regular expressions or normalized to uppercase on blur.
4. **Accessible Role**: The field correctly announces as a `textbox`, avoiding any confusing spinbutton instructions.

---

## 3. Isolated Demonstration Harness
In accordance with architectural decisions, this evaluation was tested and captured using the isolated demonstration harness located in:
`task-03-client-validation/demo/number-input-demo.html`

### Verified Evidence:
- `evidence/09-number-input-annoying.png`: Demonstrates the three-state friction sequence where typing `400` into a zero-initialized native number input results in `0400` and stepper arrow pollution.
- `evidence/10-text-input-working.png`: Demonstrates the clean sequence where controlled text input accepts `400` directly with zero stepper artifacts and seamless integer conversion.
