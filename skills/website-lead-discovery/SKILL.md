---
name: website-lead-discovery
description: Use when finding small local businesses (trades, workshops, clinics, shops) whose websites are weak, so a web designer can pitch them. Covers sourcing, pre-filters, a cheap automated pre-score, a short visual review of the shortlist, and a clean lead sheet. Stops at the lead sheet; it never sends messages.
---

# Website Lead Discovery

Find local businesses whose website is clearly weaker than their business, rank them cheaply, and spend the expensive visual review only on the best candidates.

The funnel, from cheap to expensive:

1. **Find** businesses for one trade in one city (structured sources).
2. **Pre-filter** with simple rules (chains, size, missing contact data).
3. **Pre-score** every remaining site with the `website-quality-scorer` CLI (automated, minutes for a whole list).
4. **Visual review** only for the shortlist, using the `website-visual-qa` skill (slow, needs a vision-capable model or a person).
5. **Write the lead sheet** with one row per business and an "AI assessment" column.

The script score is only a sorting aid. It decides who is worth a human or vision look. It does not replace that look.

## Inputs

- trade (e.g. painter, plumber, car repair)
- city or region and country
- optional: radius, max leads, language of the sites

## Step 1: Find businesses

Prefer sources that allow automated access:

1. **Official APIs you hold a key for** (for example a maps/places API). Respect quotas and the provider's terms on storing results.
2. **Open data** such as OpenStreetMap (Overpass API) for businesses tagged with the trade in the area.
3. **Local business directories**, only where their terms allow automated reading. Read the terms first. If a directory forbids it, do it by hand or skip it.

Rules:

- Do not circumvent CAPTCHAs, rate limits or bot detection. If a source blocks you, stop using it, slow down, or switch to an API.
- Collect only business data you need: name, address, public phone, website URL, review count and average rating, map link, source and date. Sole proprietors are individuals, so treat their names and numbers as personal data (see Compliance).

## Step 2: Pre-filter

Apply cheap rules before any site is opened. Make the thresholds configurable and record which rule removed each business.

- Skip chains, franchises and branches of larger companies.
- Skip businesses with neither website nor phone/email (no way to reach them).
- Optional size filter: skip businesses with a very high review count (example default: more than 50 reviews). Large, established firms usually already have an agency. Tune this per trade and country.
- **No website at all:** keep as a separate track, "no website", with LOW priority. Skip the scorer. A business without a site has not shown that it wants one, and there is nothing to compare a redesign against. Contact them only if you have a reason to believe they would want a first website.
- Skip placeholder or parked domains (registrar pages, "this domain is for sale", generic directory redirects). They are not real sites.
- Skip sites that already look recent. Do not decide this from the pre-score alone; if the score is high, exclude and move on.

## Step 3: Pre-score with the CLI

Run the bundled scorer on each remaining site:

```bash
node tools/website-quality-scorer/bin/website-quality-scorer.mjs audit <url> --out reports/<slug> --no-lighthouse
```

It opens the site in Chrome, takes desktop, tablet and mobile screenshots, checks DOM and CSS, tests links, and returns a 0 to 100 score, a blocker list and a vision brief. Add `--lighthouse` only for shortlisted sites because it is slow.

Read the result in this order:

1. **"Not assessed"** means the page sat behind bot protection or a browser check (for example "Checking your browser"). The scorer did not see the real site, so do not rank it. Look at it by hand or retry later from a normal connection. Never try to get around the check.
2. **Hard blockers** (no H1, no way to contact the business, broken images, horizontal scroll on mobile) are strong signals. Confirm them in the live site.
3. **The score** sorts the rest. A low score is a better lead. The scorer measures structure and hygiene; it does **not** judge whether a design looks outdated, so a site can score well and still look dated.

A starting point for the shortlist, to be tuned on your own sample:

| Result | Action |
|---|---|
| Not assessed | check by hand, do not rank |
| Score 75 or lower, or a confirmed hard blocker | shortlist for visual review (priority HIGH or MEDIUM) |
| Score 76 to 87, no hard blocker | LOW, review only if time allows |
| Score 88 or higher, no blocker | EXCLUDE |

What the first test showed (18 trade websites in Boise, Leeds, Brisbane and Portland, one visit each, small sample, English):

- 2 sites were bot-check pages, not the real sites (scores 33 and 37 were meaningless).
- The other 16 sites scored between 63 and 90, most between 73 and 85. Fixed bands such as 0 to 30 would have flagged nothing, so the bands above are tighter and still need tuning.
- "Dead or empty links" was the most common blocker (11 of 16 sites). On modern sites it is often a menu toggle with `href="#"`, not a real defect. Look at the live site before counting it.
- A site with a good-looking first screen scored only 66 because the scorer flagged broken images and horizontal scroll on mobile. Those findings were not verified by hand, so treat them as leads to check.

Check a handful of results by eye before trusting them for a whole city.

Note: the scorer's text checks know English and German. For other languages add term lists first (see the tool's README), and check a sample of results by eye before ranking a whole city.

## Step 4: Visual review of the shortlist

Take the HIGH and the best MEDIUM businesses only. For each, follow `website-visual-qa`:

- open the live site first, desktop and mobile;
- follow the proof path (gallery, references, reviews, contact) before saying a site lacks real work;
- separate verified defects from capture artifacts.

Write a short assessment (see the sheet below), in four parts: what is visible, what works, verified defects, uncertainties. Add the scope and confidence.

If you use a vision-capable model, give it the screenshots and `vision-brief.md` from the scorer. Keep your own words for the verdict.

## Step 5: Lead sheet

Use `references/lead-sheet-template.md` for columns. One row per business. Always keep the evidence: scorer report path, screenshot folder, the URL as finally resolved, and the date checked.

## Compliance

This skill ends at the lead sheet. It does not write or send outreach.

- Rules for contacting businesses cold differ widely by country and by channel (email, phone, post, messaging). In some countries unsolicited email to businesses is restricted or needs prior consent. Check the law for each target market before any contact. This text is not legal advice.
- Personal data of sole traders is still personal data. Keep only what you need, state your source and purpose if someone asks, and delete on request.
- Do not publish a business's photos, texts or logo in a public demo without permission. Mark any preview as a non-binding demo.
- Never invent facts about a business (ratings, years in business, project counts).

## Pitfalls

- A blocked page is not a bad site. Check from a normal connection before judging.
- One screenshot is not proof of a defect. Use the evidence rules in `website-visual-qa`.
- A very low pre-score can mean a site that is simply down or heavy on JavaScript. Look at the live site before ranking it HIGH.
- Do not mass-process a whole city without sampling the results first.
