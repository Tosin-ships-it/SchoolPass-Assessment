# Task 2: Initial Load Performance Note

## 1. Overview & Test Metadata

This performance note documents and analyzes the initial HTTP response measurement captured during the first request to the SchoolPass development server, as recorded in [`evidence/04-first-load.txt`](../evidence/04-first-load.txt).

* **Target URL:** `http://localhost:3000`
* **Test Timestamp:** `2026-10-29 13:43:46+01:00` (`2026-10-29T12:43:46Z`)
* **HTTP Status:** `200 OK`
* **Content-Type:** `text/html; charset=utf-8`
* **Payload Size:** `87,897 bytes`

---

## 2. Measured Response Times

The initial request produced the following verified timing metrics:

* **Time to First Byte (TTFB):** `7,591 ms`
* **Total HTTP Response Time:** `8,496 ms`

The total response time of 8,496 ms spans the full duration from socket connection dispatch through server processing, chunked HTML streaming, and complete payload reception.

---

## 3. Comparison with the Assessment Target

The assessment specification notes an approximate **10 ms** target for local responses.

* **Assessment Target:** `~10 ms` *(specified for assessment evaluation purposes)*
* **Measured Response Time:** `8,496 ms`
* **Difference:** The measured first-load response time was significantly slower than the assessment target (~850× the target duration).

*(Note: The 10 ms target is an assessment-specific benchmark rather than a universally accepted industry standard for cold initial development server responses).*

---

## 4. Technical Analysis: On-Demand Compilation

The discrepancy between the initial response time and the assessment target is primarily explained by Next.js development server mechanics:

1. **Cold Route Compilation:** When running under development mode (`next dev`), Next.js does not serve pre-compiled production bundles. Instead, it compiles routes on-demand when first requested.
2. **TTFB Dominance:** The measured `7,591 ms` TTFB represents the time spent by the server executing TypeScript compilation, bundling React 19 server components, processing module imports (`tokens.css`, layout wrappers), and generating the initial SSR stream.
3. **Subsequent Warm Requests:** Once a route has been compiled into the `.next` local cache, subsequent requests to the warm server typically return in a fraction of this initial duration.

---

## 5. Scope Distinction: HTTP Timing vs. Browser Rendering

It is critical to distinguish between HTTP transport response time and client-side browser rendering performance:

* **What Was Measured:** The recorded `8,496 ms` represents strictly the HTTP network and server response lifecycle (socket connect, server compilation, and raw byte streaming).
* **What Was NOT Measured:** This measurement does not include client-side browser rendering, CSSOM construction, DOM parsing, JavaScript hydration, or visual paint metrics (such as First Contentful Paint or Largest Contentful Paint).
* **Browser Inspection Limitation:** Automated browser inspection was unavailable due to a Playwright driver initialization error (`404 Not Found` during driver package retrieval). Consequently, no visual rendering performance was measured or verified.
