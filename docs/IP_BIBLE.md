# IP BIBLE — GHOST PROJECT

Single source of truth for the game's identity, universe, and characters.
Anything that contradicts this file should not ship.

## Brand identity

| Field | Value |
|---|---|
| Working title | **GHOST PROJECT** |
| Tagline | *Dodge issues. Avoid accountability.* |
| Premise | You are the ghost of a project that never was — funded, declared complete, but never started or never finished. You haunt the infrastructure that was supposed to be yours. |
| Genre | 2D flappy-style arcade satire, canvas-drawn |
| Tone | Deadpan bureaucratic absurdism. The horror is paperwork. |
| Antagonist | **ACCOUNTABILITY** — an approaching red slab that can only be dodged, never confronted. Keep it abstract. |
| Share-card footer | "A political satire game." |

## The protagonist (current cast, MVP)

**THE GHOST** — the ghost of a project that never existed. A small sheet
of a ghost wearing an askew yellow hard hat (the worker the project never
hired). Oval eyes, tiny distressed mouth, faint glow, wavy hem that
drifts. Drawn entirely in code (`drawGhostSprite` in `game.js`) — original
character art with no external asset.

- Visual: ivory sheet, dark oval eyes, askew yellow hard hat, faint glow
- Hitbox: unchanged (r=22, hitbox 82% of r — keep fair)
- Silhouette mode (blackouts): dark shape + gold outline — "only the ghost remains"

## Future cast plan (Phase 2+) — archetypes, not aliases

Fictional composite archetypes drawn from recognizable roles in
Philippine political life. Never disguised copies of real politicians.

1. **The Dynasty Heir** — heir to a fictional dynasty; flies a flag with
   a family crest (fictional crest only).
2. **The Patronage Mayor** — names every wall after themselves; ability:
   "Ribbon Cutting".
3. **The Budget Gatekeeper** — briefcase bird; ability: "Audit Escape".
4. **The Deflection Spokesman** — megaphone crest; ability: "Out of
   Context" (flips a scandal into a press conference).
5. **The Populist Firebrand** — rally-style bird; ability: "Rally Wave".
6. **The Old Ward Boss** — anachronistic boss curmudgeon bird.

**Compositeness rule:** no character may converge on one real person
across **name + position + appearance + era + family**. If any three of
the five align, change one. Cheap test: does this read as a *job
description* (mayor who names walls after himself) or a *person*?

**No pointer names:** no phonetic puns, anagrams, or derivatives of real
politicians' names. Fictional parties (e.g. "Partido Kaunlaran Natin"),
fictional places, fictional slogans.

**Design hygiene:** internal design notes describe *archetypes*, never
name real persons as references. Character data files (future
`src/data/characters.js`) carry `isFictional: true` and a `requiresReview`
flag.

## Fictional universe rules

- Project signage uses the generic descriptor **FLOOD CONTROL PROJECT**
  on amber hazard styling — never a real agency's name, blue-and-white
  sign style, or seal. No invented agency names on signage (owner call:
  fictional agency names don't read for a Filipino audience).
- Billboards may use fictional slogans and generic Filipino internet slang
  (e.g. "SANA ALL INFRASTRUCTURE") — never administration slogans.
- Places are generic Filipino cityscape (jeepneys, poles, wires, skyline);
  no named real cities, streets, or officials.
- The Philippine flag appears only as respectful scenery; no altered or
  seal-like variants.
- All quotes are character fiction inside the press-conference modal;
  never formatted as real-world news attribution.
- Prices (₱80/L fuel, ₱14/kWh) are absurd fictional numbers presented as
  satire; never presented as real data.

## Naming and brand rules

- No real person's name, alias, or near-pun anywhere in player-facing copy.
- No administration slogan or "Bagong ___" echo.
- No "Flappy" prefix.
- Final name subject to availability/clearance checks (USPTO / IPOPHL /
  app-store search) before store submission — see the rebrand audit plan.
- localStorage keys (`fm-*`) and Redis key prefixes (`fm-lb:`, `fm-rl:`)
  are legacy identifiers kept deliberately (invisible to players; renaming
  resets saved scores/boards). Documented here so they don't get renamed
  accidentally; any future rename needs a migration note.
- `window.__fm` is a dev/testing hook; harmless to keep.