# POLITICAL CONTENT GUIDELINES — GHOST PROJECT

Content policy for satire development on this project — for human
developers and coding agents alike. Goal: keep the satire pointed and
culturally recognizable while reducing avoidable legal/platform risk.
This is a risk-reduction policy, not legal advice; it does not make any
content "safe".

## DO

- Satire and parody of **systems**: flood control, power, currency,
  bureaucracy, dynasties, patronage, accountability itself
- Fictional scenarios, dialogue, parties, agencies, places, slogans
- Commentary on broad public issues (corruption as a theme,
  infrastructure, utilities, inflation, peso weakness, blackouts)
- Clearly-fictional figures presented as absurd (₱80/L reads as satire;
  ₱14.37 reads as a claim)
- Composite archetypes per the compositeness rule in `IP_BIBLE.md`
- Keep the in-game fiction disclaimers prominent and honest

## AVOID

- Fabricated quotations presented as real, or formatted like real news
  attribution
- Fabricated evidence or documents styled as official
- Unsupported criminal allegations against identifiable people
- Invented financial accusations tied to identifiable persons
- Real photographs or news images
- Real agency seals, branding, or sign-style lookalikes (the game's
  signage is fictional "BUREAU OF FLOODWORKS", amber, not blue/white)
- Administration slogans or "Bagong ___" echoes
- Names or copy implying endorsement or affiliation
- Real-person names, aliases, or near-puns in player-facing copy

## Classification convention

Classify every political reference before it ships:

- **GREEN** — clearly fictional, satirical, generic, or commentary on
  broad political themes → ship freely
- **YELLOW** — potentially identifiable to real persons/events → review
  or redesign before shipping
- **RED** — could read as factual allegation, fabricated quotation,
  fabricated evidence, impersonation, misleading affiliation, or use of
  protected material → do not ship

## Data conventions (when content extraction lands in Phase 2)

```js
// src/data/characters.js
{
  id: 'gatekeeper',
  name: 'The Budget Gatekeeper',
  archetype: 'patronage gatekeeping',
  bio: 'Fictional biography…',
  party: 'Partido Kaunlaran Natin',   // fictional
  quotes: ['…'],                       // character fiction only
  abilities: ['Audit Escape'],
  art: 'assets/characters/gatekeeper.png',
  meta: { isFictional: true, requiresReview: false }
}

// src/data/events.js
{
  id: 'flood-event',
  text: 'HEAVY RAIN. FLOODING LIKELY.',
  isFictional: true,
  satireTarget: 'flood-control infrastructure',
  realPersonReferenced: null,
  requiresReview: false
}
```

Any new string touching a real person, party, agency lookalike, or
plausible-sounding specific allegation must set `requiresReview: true`
and pass the pre-ship checklist below.

## Pre-ship checklist

1. No real surname in any shipped string
2. No official slogan or "Bagong ___" echo
3. No official-sign styling (blue/white project-sign lookalike)
4. Every quotation is character fiction, never real-world attribution
5. Prices and figures are absurd/fictional, not presented as data
6. Run `scripts/content-check.sh` — it must pass

## Enforcement

`scripts/content-check.sh` greps player-facing sources (`index.html`,
`game.js`, `style.css`, `README.md`) for a blocklist of real names and
the retired brand and fails on any hit.

**Sanctioned exemptions:**
- `api/leaderboard.js` holds the leaderboard moderation filter — the one
  place real names appear as *filter data*, not copy
- `docs/` and `legal/` document the retired asset and these rules
  themselves

Adding to the check's pattern list is a content-policy decision, not a
code change.