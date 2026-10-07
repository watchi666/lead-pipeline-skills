---
name: website-redesign-prototype
description: Use when turning one existing small-business website into a modern, credible HTML preview that keeps the business's brand, photos and facts. Short audit, keep/improve decisions, one-page prototype, then core subpages, with a browser check at the end.
---

# Website Redesign Prototype

Build a believable preview of how a small business's current site could look. The preview must sell the service, not explain itself. Keep what the business already owns (name, logo, photos, facts) and improve structure, hierarchy and clarity.

## Before you start

- Make sure you may use the business's material for a preview. Photos, texts and logos belong to the business. Keep the preview private or clearly marked as a non-binding demo, set it to `noindex`, and do not use it as a published site without permission.
- Never invent facts. No made-up ratings, years, project counts, reviews or prices. Use what the current site and public listings say, and mark anything you could not verify.
- Use placeholder contact data in public demos if the real number or address should not be shared. A form in a preview must not send real data.

## Workflow

### 1. Read the current site

Open the live site at desktop and phone width. Note:

- page titles and descriptions, headings and section order;
- navigation, where the call to action sits, what happens on a phone;
- the images that are usable and their real size;
- weak points: template feel, weak first screen, no trust signals, text walls, missing contact path.

Follow the proof path (gallery, references, reviews) before saying the site lacks proof of work.

### 2. Decide what to keep and what to change

Keep by default: business name, logo, usable photos, positioning, main services, facts such as address and hours.

Improve: structure, spacing, type, clarity of the call to action, how services are shown, trust and contact flow.

### 3. Build one strong first page

A standalone page with:

- one clear first screen with a short promise and one primary action (call or message);
- the services, shown clearly;
- real work (the business's photos) in quiet frames;
- trust signals that are true (live review rating if the business has one, with a link);
- an honest contact section with phone, address and a short form.

Use one visual system. Keep section names about the business, not about the design.

### 4. Extend when the concept holds

Add the core subpages the business already has (services, about, gallery, contact, legal pages). Keep the same system and the same facts.

### 5. Check in a browser

At 390 and 1440 px wide: no horizontal scroll, readable text, tap targets of at least 44 px, images load, the call to action is not hidden by fixed bars, forms show errors in plain language, reduced-motion respected. Use `website-visual-qa` for the evidence rules.

Run the scorer on the preview and on the original and compare:

```bash
node tools/website-quality-scorer/bin/website-quality-scorer.mjs compare <old-url> <new-url> --out reports/compare
```

## Output

1. A short audit (what is weak, what stays).
2. Where the preview is, and how to open it.
3. Screenshots at phone and desktop width.
4. What changed and why, in a few lines.
5. Open questions for the business (missing photos, facts to confirm).

## Pitfalls

- Copying another website too closely.
- Redesigning the brand when the real problem is structure.
- Over-designing a small local site.
- Stock photos presented as the business's own work.
- Skipping the browser check.
