# THIRD-PARTY LICENSES — GHOST PROJECT

Licenses for third-party components. Verified 2026-09-10. If a font gets
bundled into an offline/mobile build later, the OFL license text and
copyright notice must accompany the font files.

## Fonts (loaded from Google Fonts CDN, not bundled)

### Bebas Neue

- Designer: Ryoichi Tsunekawa / Dharma Type; Google Fonts release © 2019 The Bebas Neue Project Authors
- License: **SIL Open Font License 1.1** — free for commercial use, may be bundled with software (with license + copyright notice); may not be sold standalone; modified versions may not use the reserved "Bebas Neue" name
- Sources: [OFL.txt (dharmatype/Bebas-Neue)](https://github.com/dharmatype/Bebas-Neue/blob/master/OFL.txt) · [upstream repo](https://github.com/dharmatype/Bebas-Neue/) · [Google Fonts METADATA.pb](https://github.com/google/fonts/blob/main/ofl/bebasneue/METADATA.pb)

### Space Grotesk

- Designer: Florian Karsten (2018, v2.0.0 Oct 2020); Google Fonts release © 2020 The Space Grotesk Project Authors
- License: **SIL Open Font License 1.1** — same conditions
- Sources: [floriankarsten/space-grotesk](https://github.com/floriankarsten/space-grotesk/) · [OFL.txt on google/fonts](https://github.com/google/fonts/blob/main/ofl/spacegrotesk/OFL.txt) · [Google Fonts specimen](https://fonts.google.com/specimen/Space+Grotesk) · [Google Fonts METADATA.pb](https://github.com/google/fonts/blob/main/ofl/spacegrotesk/METADATA.pb)

## Vendors (services, not code dependencies)

- **Vercel** — static hosting, serverless function (`api/leaderboard.js`), and Web Analytics (`/_vercel/insights/script.js`). Data practices are Vercel's; review Vercel's privacy documentation and disclose analytics in the privacy policy.
- **Upstash** — Redis REST storage for the leaderboard. Credentials are env-injected; review Upstash's terms and data-residency options.

## No other third-party assets

The game has no other external images, audio files, icons, embeds, or
code dependencies (verified in the 2026-09-10 rebrand audit). All art is
canvas-drawn and all audio is synthesized at runtime.