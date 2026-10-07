---
name: website-visual-qa
description: Use when reviewing websites from visual captures.
---

# Website Visual QA

Validate what a responsive website actually renders before judging its design or reporting visual defects. Screenshot tools are evidence generators, not ground truth.

## Triggers

Use this skill when:

- comparing a redesign with a live website;
- reviewing mobile or desktop screenshots;
- inspecting long/full-page captures;
- diagnosing blank sections, repeated controls, missing images, or clipped content;
- testing sites with lazy loading, sticky elements, parallax, or scroll-driven animation.

## Core workflow

1. **Inspect the original source first.** Open the live URL when accessible. A screenshot is secondary evidence.
2. **Map and inspect the proof path before judging credibility.** Read the primary navigation and hero links, then open the most relevant linked proof page (for example gallery, references, portfolio, testimonials, team, or contact) before claiming that a design lacks real work, trust signals, or local evidence; those elements often belong one click beyond the homepage.
3. **Capture the initial viewport** at an explicit device size.
4. **Traverse the page normally.** Scroll in viewport-sized increments and pause after each step so IntersectionObserver, image lazy loading, and scroll animations initialize.
5. **Collect segmented screenshots.** Capture representative ordinary viewports throughout the page. These are primary evidence for whether content renders during real use.
6. **Capture the full page last.** Compare it with segmented captures before treating anomalies as real defects.
7. **Test interactions separately.** Verify menus, accordions, carousels, forms, fixed CTAs, before/after controls, and reduced-motion behavior.
8. **Report confidence and scope.** Say whether the conclusion is based on a live interaction, segmented screenshots, or one static image.

## Artifact classification

Common **capture/stitching artifacts**:

- large blank regions where scroll-triggered media should appear;
- fixed or sticky widgets duplicated at regular vertical intervals;
- headers or bottom bars missing from the assembled image;
- capture ending before the real footer;
- compressed or unreadably narrow output;
- lazy-loaded images absent from a full-page render but present after manual scrolling.

Likely **site defects** require corroboration in a live viewport or multiple independent captures:

- content remains blank after scrolling into view and waiting;
- controls cover text during normal interaction;
- horizontal overflow occurs at the tested width;
- visible labels, focus states, or tap targets are missing;
- the same defect persists across reloads or browsers.

Never label a blank area as a website bug solely from one long screenshot.

## Responsive review checklist

- Test at least 390×844 and a desktop viewport near 1440×900.
- Check readable typography, contrast, heading hierarchy, and line length.
- Ensure primary CTAs are visible and not obscured by fixed bars.
- Check fixed headers, mobile call bars, chat/accessibility widgets, and safe-area spacing together.
- Verify touch targets are at least 44×44 px.
- Confirm meaningful images load and retain correct aspect ratios.
- Prefer visible labels over placeholder-only forms.
- Inspect the real bottom of the page, including final CTA and footer.

## Reporting format

Use four blocks:

1. **What is visible** — factual description.
2. **What works** — hierarchy, trust, conversion, responsiveness.
3. **Verified defects** — only defects reproduced in live/segmented evidence.
4. **Capture artifacts or uncertainties** — anomalies that need corroboration.

Keep design opinions separate from technical defects.

## Android long-screenshot caution

Android scrolling-capture apps commonly stitch successive viewport images. On animated sites this can duplicate fixed controls and miss content that initializes asynchronously. Prefer segmented screenshots from normal scrolling, or a browser automation capture that pre-scrolls with pauses before taking the full-page image.

See `references/animated-fullpage-captures.md` for diagnosis patterns and evidence requirements.

## Verification

- [ ] Original URL inspected when accessible
- [ ] Initial viewport captured
- [ ] Page manually or programmatically pre-scrolled
- [ ] Segmented captures compared with full-page output
- [ ] Fixed elements checked independently
- [ ] Report distinguishes defect from capture artifact
- [ ] Review scope and confidence stated
