# AI ASSET LOG — GHOST PROJECT

Provenance log for every AI-generated asset, active or retired. One entry
per asset. Fields per the rebrand-audit plan:

> asset id · final path · tool/model · creation date · prompt (+ seed/params
> if the tool exposes them) · reference material used · human modifications ·
> derived assets · commercial-use terms reviewed (which ToS/version,
> reviewed-when) · C2PA metadata preserved? · reviewer · status

**Policy:** every AI-generated asset shipped with the game gets an entry
here at creation time — tool, date, prompt, reference material, human
modifications, and which terms of service were reviewed for commercial
use. Assets without a complete entry don't ship.

## Entries

### AI-001 — `marcos.png` — **RETIRED**

| Field | Value |
|---|---|
| Asset id | AI-001 |
| Final path | `/marcos.png` (repo root) — **removed from distribution 2026-09-10** |
| Tool/model | OpenAI Media Service API (identified from embedded C2PA metadata: softwareAgent "OpenAI Media Service API", OpenAI TSA certificate chain) |
| Creation date | 2026-09-04 (per C2PA timestamp) |
| Prompt | **Unknown — not recoverable from the repo.** Human verification required. |
| Reference material | Unknown — human verification required |
| Human modifications | None recorded |
| Derived assets | Rendered in-game (menu/share-card/blackout silhouette) by `game.js` |
| Commercial-use terms | Governed by the OpenAI terms in force at generation; not reviewed in-repo — **human verification required** |
| C2PA metadata | Present at audit time (2026-09-10); preserved in git history only (asset removed from repo forward) |
| Reviewer | Ralph (owner) |
| Status | **RETIRED** — AI caricature of a real person; incompatible with the fictional-cast rebrand. Removed from repo forward; git history intentionally retained (owner decision). |

## Template (for future AI-generated assets)

```markdown
### AI-00X — <filename>

| Field | Value |
|---|---|
| Asset id | AI-00X |
| Final path | assets/characters/<file>.png |
| Tool/model | <tool + model + version> |
| Creation date | YYYY-MM-DD |
| Prompt | <exact prompt text> (seed/params if available) |
| Reference material | <none / describe> |
| Human modifications | <none / description> |
| Derived assets | <none / list> |
| Commercial-use terms | <ToS name + version, reviewed date, conclusion> |
| C2PA metadata | <preserved / stripped by tool — record facts> |
| Reviewer | <name> |
| Status | active / retired |
```

## Notes

- Preserve C2PA metadata where the tool emits it; if a tool strips it,
  record the facts here manually at creation time.
- The retired AI-001 prompt/reference-material fields are marked
  "human verification required" — they were not recoverable from the
  repository, and none are invented.