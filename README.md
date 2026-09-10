# GHOST PROJECT

> *Dodge issues. Avoid accountability.*

A political satire game about contemporary Philippine governance. You play
**the ghost of a project that never existed** — a flood-control project
that was funded, declared completed, and never built. Haunt the
infrastructure that was supposed to be yours. Dodge flood-control walls,
utility pylons, fuel and power prices, bills and paperwork. Keep flying.
Avoid accountability.

## Play

Serve the folder with any static server and open it in a browser:

```bash
python3 -m http.server 8080
# then open http://localhost:8080
```

## Controls

- **Tap / Click / Space** — flap
- **Esc / P** — pause
- **Space** at a press conference — deflect, obviously

## The satire

- Flood-control walls signed **BUREAU OF FLOODWORKS** — a fictional
  agency — with "PROJECT COMPLETED ✓" signs on visibly broken concrete
- A peso coin that sinks lower the longer it's on screen, with a bearish ₱/$ chart
- GASOLINE at ₱80/L and electricity at ₱14/kWh — absurd, fictional prices ticking up live while you fly
- Blackouts that cut the music to an electrical buzz (only the ghost's
  silhouette remains, then *click*, power returns)
- Rising floodwater, a looming ACCOUNTABILITY slab, and press conferences where
  deflecting is always the correct answer
- Briefcases full of cash (+5). Definitely above board.

All characters, headlines, statements, prices and projects are fictional.
A work of political satire — no real quotations are attributed to any real
person, and no character depicts any real person.

## Content & IP documentation

- `docs/POLITICAL_CONTENT_GUIDELINES.md` — content policy for satire development
- `docs/IP_BIBLE.md` — brand and character bible
- `docs/ASSET_REGISTER.md` — asset inventory and provenance
- `docs/AI_ASSET_LOG.md` — AI-generated asset provenance log
- `docs/THIRD_PARTY_LICENSES.md` — font licenses and vendor notes
- `legal/` — privacy policy, terms, satire disclaimer drafts
- `scripts/content-check.sh` — fails the build if banned strings appear in player-facing files