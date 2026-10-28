# SchoolPass Business Brief

## Business and Problem

SchoolPass is a private web app for parents of a single school in Nigeria (~400 students). Parents repeatedly contact staff for routine information, creating extra administrative workload and forcing reliance on fragmented WhatsApp messages, phone calls, and paper notices.

SchoolPass provides one central place to ask school questions, view student attendance and fee records, confirm daily arrival, pay fees via Flutterwave, and reach the Front Desk Officer via WhatsApp when human assistance is needed.

**Product promise:** The school's answers. Your child's records. One place.

## Target Users

- **Primary users:** Parents and guardians of enrolled students.
- **Age range:** Approximately 28–52 years old *(operating assumption based on typical school-parent cohorts; requires validation)*.
- **Device access:** Mobile-first. Primarily parents' personal mobile phones, benchmarked on mid-range Android devices with small screens (PRD §15).
- **Connection quality:** Often limited, variable, or slow 3G cellular connections; requires lightweight pages and persistent loading/retry states (PRD §15).
- **Technical literacy:** Comfortable with common apps (WhatsApp, mobile banking), but requiring clear visual hierarchy and low navigational friction *(operating assumption; requires validation)*.

## The Must-Work Feature

Parents must be able to securely access their child's private attendance and fee balance records. These student-linked records are strictly separated from general school information.

## Three Questions Only This Business Can Answer

1. *"How much school fees do I owe, and how do I pay my outstanding balance?"* (Answered solely by the school's fee records via Flutterwave).
2. *"Has my child arrived safely and been marked present today?"* (Answered solely by SchoolPass attendance and arrival confirmation records).
3. *"When does the next term begin, and what time does school close?"* (Answered solely by the administration's verified policy database).

## Visual Direction and Typographic Rationale

Because SchoolPass handles student physical safety and financial payments for busy parents on the move, the interface must project **institutional authority, calm clarity, and effortless scannability**. It avoids decorative clutter or playful visuals.

This visual direction directly informs the typography system:
- **Typeface (DM Sans):** A geometric humanist sans-serif with open apertures and high x-height, ensuring crisp legibility on small Android viewports over unstable networks.
- **Scale and Spacing:** Uses compact letter spacing (-3% / -1.92px on 64px Display Large) to avoid awkward word wraps on narrow screens, paired with a consistent 1.5× line-height multiplier across all 15 styles for predictable vertical rhythm.