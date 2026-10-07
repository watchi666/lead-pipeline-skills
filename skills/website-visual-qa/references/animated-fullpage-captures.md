# Animated Full-Page Capture Diagnostics

## Evidence hierarchy

1. Live interaction at the target viewport
2. Segmented screenshots taken during normal scrolling
3. Screen recording of the scroll path
4. Full-page browser capture after pre-scroll
5. OS/app stitched long screenshot

Higher items override lower ones when they disagree.

## Symptom matrix

### Huge blank section in one long screenshot

Possible causes:
- ScrollTrigger or IntersectionObserver never activated
- lazy-loaded image/video was outside the synthetic viewport
- capture engine used document height without traversing scroll states
- pinned animation container kept its spacer but not its animated child

Required check: scroll into the section normally, wait, and take an ordinary viewport screenshot. If content appears there, classify the blank area as a capture artifact.

### Fixed button repeated down the page

Cause: a stitching app captured the fixed element in every viewport tile.

Required check: inspect one live viewport. Do not report repeated buttons as a site defect unless multiple copies exist simultaneously in the DOM or live view.

### Header/footer missing

Possible causes:
- screenshot tool intentionally removed sticky elements
- first or final tile was cropped
- capture stopped before the real document end

Required check: capture the top and bottom viewport independently.

### Full-page image ends mid-section

Possible causes:
- image height or memory limit
- browser renderer timeout
- dynamic document height changed during capture
- app silently capped the scroll distance

Required check: verify the real footer separately and state that the long screenshot is incomplete.

### Very low resolution or unreadable text

Cause: Android/gallery limits or the stitching app downscaled an extremely tall bitmap.

Mitigation: use segmented screenshots, export PDF, or capture sections separately. A single extremely tall PNG is often a poor review artifact even when technically complete.

## Automation pattern

For browser automation:

1. Load and wait for network idle.
2. Record the initial document height.
3. Scroll by about 70–90% of viewport height.
4. Pause 300–1000 ms per step depending on animation and image load behavior.
5. Continue until the bottom; repeat if document height grows.
6. Return to the top and wait briefly.
7. Take both segmented evidence and the final full-page screenshot.
8. Repeat with `prefers-reduced-motion: reduce` if scroll pinning prevents stable capture.

Do not disable page behavior merely to make an attractive screenshot unless the deliverable explicitly asks for a presentation capture rather than QA evidence.

## Reporting language

Use:
- “Verified in the live viewport”
- “Visible in segmented screenshots”
- “Likely capture artifact”
- “Not verified from this image alone”

Avoid:
- “The site is broken” based on one stitched image
- “The app is broken” without distinguishing unsupported page behavior from an implementation defect
