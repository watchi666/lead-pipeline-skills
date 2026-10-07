# website-quality-scorer

A single-file Node CLI that audits small-business websites with a real Chrome and returns a 0 to 100 score, a blocker list, screenshots and a brief for a visual review. No npm dependencies.

It is a measuring tool, not a design oracle. It does not invent visual scores. It writes a `vision-brief.md` so a person or a vision-capable model can judge the pictures.

## Requirements

- Node 20 or newer
- Chrome, Chromium or Edge. Set `CHROME_PATH` if it is not found in a standard place.
- Optional: the `lighthouse` CLI on your PATH for `--lighthouse`

## Use

```bash
# audit a live site or a local file
node bin/website-quality-scorer.mjs audit https://example.com --out ./report --no-lighthouse

# with Lighthouse (slow on image-heavy pages)
node bin/website-quality-scorer.mjs audit https://example.com --out ./report --lighthouse

# compare two sites (e.g. old and new)
node bin/website-quality-scorer.mjs compare https://old.example https://new.example --out ./compare

# keep a benchmark history
node bin/website-quality-scorer.mjs audit https://example.com --out ./report --project demo --history ./history.jsonl
node bin/website-quality-scorer.mjs history ./history.jsonl --mode rank
```

| Option | Effect |
|---|---|
| `--out <dir>` | output folder for report and screenshots |
| `--name <label>` | label for the default output folder |
| `--project <name>` | project name for a history entry |
| `--history <jsonl>` | append a summary to a JSONL history |
| `--limit <n>` | number of history entries to show |
| `--mode raw` or `rank` | history as rows or as a project ranking |
| `--lang en` or `de` | language of the report (default: en) |
| `--lighthouse` / `--no-lighthouse` | run Lighthouse (default: off) |
| `--links` / `--no-links` | HTTP link check (default: on) |

## Output

```
report.md
report.json
vision-brief.md
desktop-1440.png
tablet-768.png
mobile-375.png
lighthouse.json    # only with --lighthouse
```

## What it scores

| Area | Max |
|---|---:|
| Hero and first impression | 15 |
| Services and substance | 10 |
| Trust and proof | 15 |
| Conversion and call to action | 20 |
| Mobile UX | 15 |
| Images and authenticity | 10 |
| Copy and naturalness | 10 |
| Technical hygiene | 5 |
| **Total** | **100** |

Hard blockers include: no H1, no contact path, broken images, dead or empty links, horizontal scroll on mobile, a form without a fallback, placeholder text, and visible AI-style file names.

## Languages

- **Output:** English by default. Use `--lang de` (or `WQS_LANG=de`) for the original German texts.
- **Detection:** the text checks (call-to-action words, services, trust, FAQ, gallery, local reference, filler phrases) know **English and German**. Other languages need their own term lists in the constants near the top of `bin/website-quality-scorer.mjs` (`LOCAL_TERMS`, `SERVICE_TERMS`, `TRUST_TERMS`, `PLACEHOLDER_PATTERNS`, and the call-to-action regex in the scoring function).
- **Structural checks** (H1, links, images, forms, mobile overflow, Lighthouse) are language-independent.
- **Not yet tested widely:** the English term lists were checked on a minimal English page and on a German site, not on a sample of real English trade sites. Run it on ten or so sites you know well and compare the score with your own judgement before you rely on the priority bands.
- The output translation is a phrase table applied to the final text, so a site's own words that match a German phrase could be altered in the report. This is rare and only affects the wording of the report, not the score.

Pages behind a bot check or CAPTCHA interstitial are detected and reported as "not assessed" instead of being scored. The tool does not try to get past such checks.

First test on 18 English trade sites (2 blocked): the other 16 scored 63 to 90. The score separates structural problems well and design taste poorly. "Dead or empty links" fires often on menus built with `href="#"`; check the live site before counting it as a real defect.

Performance (Lighthouse) is reported separately and does not enter the 100-point score.

## Origin and license

Licensed under the PolyForm Noncommercial License 1.0.0 (see `../../LICENSE.md`): noncommercial use and adaptation are allowed, commercial use needs separate permission.

The tool carried no author or license file when it was received. The git history of the original repository shows a single automated agent identity as the only author, with no fork or upstream, and a search of the agents' logs found no third-party source. The most likely explanation is that an agent wrote it for the licensor; this is not confirmed, so the license covers the tool only to the extent the licensor holds the rights.
