---
name: source-evidence-audit
description: "Use when auditing source evidence. Verify and log scope."
version: 1.0.0
---

# Source-evidence audit

- Validate each newly introduced evidence URL by browser navigation and record UTC retrieval time, final URL, HTTP end status, and redirect count; do not claim a larger validation scope.
- Treat robots.txt as crawl guidance, never as an implicit content, retention, or reuse licence.
- For UGC sources, retrieve only policy, robots, operator, and product-route metadata during an evidence audit; do not collect or persist review/forum bodies, author data, ratings, or screenshots.
- If a primary owner, terms, or access-route page is blocked or unavailable, record the exact failed URL and observable outcome, then keep the source deferred or excluded rather than filling the gap from secondary claims.
- Separate a known canonical product route from proof of permission: route reachability does not establish collection rights.
- For scoped absence checks, list the exact paths tested, outcome, UTC time, and scope limitation; never convert a few 404s into a universal nonexistence claim.
- Ensure the catalogue status matches the detailed report and add a timestamped changelog entry describing the evidence repair.
