# Lead Pipeline Skill Bundle

Skills and one tool for web designers who want to find small local businesses with weak websites and prepare a credible pitch.

The idea: cheap automated sorting first, expensive visual judgement only where it pays.

```
find businesses -> pre-filter -> script pre-score -> visual review of the shortlist -> lead sheet -> (optional) redesign preview
```

## What is inside

| Part | What it does |
|---|---|
| `skills/website-lead-discovery` | Finds businesses for a trade and city, filters them, pre-scores them with the CLI, reviews the shortlist, writes a lead sheet. Stops there. It never sends messages. |
| `skills/website-visual-qa` | How to review a site from screenshots without false defects: live check first, follow the proof path, tell capture artifacts from real bugs. |
| `skills/source-evidence-audit` | Log sources, final URLs and scope so a claim can be traced. |
| `skills/small-business-conversion-patterns` | Patterns for trade-business sites (trust bar, floating call button, schema). All numbers are placeholders. |
| `skills/website-redesign-prototype` | Turn one existing site into a credible preview that keeps the business's brand and facts. |
| `tools/website-quality-scorer` | Chrome-based CLI: 0 to 100 score, blockers, screenshots, vision brief. No npm dependencies. |

## Install

Copy the folders in `skills/` into your agent's skills folder (for Claude Code: `~/.claude/skills/`). Keep `tools/` next to your project and call it with Node (see its README).

Requirements: Node 20+, Chrome or Chromium or Edge. A vision-capable model or a person for the review step.

## Limits you should know

- **The scorer speaks English and German.** Reports are English by default (`--lang de` for German) and the text checks know both languages. Other languages need their own term lists. The English lists have only had light testing; compare the scores with your own judgement first (see its README).
- **Scoring is a sorting aid.** The visual review decides.
- **Sourcing depends on each source's terms.** The discovery skill prefers APIs and open data and does not work around bot protection.
- **Outreach is not covered.** Rules for cold contact differ by country and channel. Check them before you contact anyone. This bundle is not legal advice.
- **No personal data is included.** No real leads, contact data, credentials or client files.
- **License: PolyForm Noncommercial 1.0.0** (see `LICENSE.md`). You may use and adapt this bundle for noncommercial purposes. Commercial use, for example selling it or building it into a paid service, needs separate permission from the licensor. The scorer's origin is unconfirmed: it was most likely written by an AI agent for the licensor, no fork or upstream exists, and a search of the agents' logs found no third-party source. This is the best available explanation, not proof, so the license covers the scorer only to the extent the licensor holds the rights.

## Credits

The visual QA, source audit, discovery notes and prototype workflow come from an agent-built working set that was cleaned and generalised for sharing. The scorer tool is included as received; its likely origin and open questions are described under Limits.

## License

PolyForm Noncommercial License 1.0.0. See `LICENSE.md`.
