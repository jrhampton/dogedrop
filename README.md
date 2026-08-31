# DogeDrop: Crypto Merge

A physics-based "merge" game (Suika/2048-style): drop coins into the jar,
merge two matching ones into the next tier up, and climb the real
CoinMarketCap top-10 ladder all the way to Bitcoin.

Tiers, in order (live CoinMarketCap ranking, 2026-08-29, stablecoins
excluded): **LEO → ZEC → DOGE → HYPE → TRX → SOL → XRP → BNB → ETH → BTC**.

It's the same code in two forms:
- **Standalone web page** — open `game.html` directly, or serve the folder.
- **Chrome extension (MV3)** — load unpacked; the toolbar icon opens the
  same `game.html` in its own tab.

## Play it

**Live:** https://jrhampton.github.io/dogedrop/

Or open `game.html` in a browser, or serve the folder locally:

```
npx http-server .
```

**Controls:** move the mouse (or `←`/`→`) to aim, click / `Space` / `↓` to
drop, `M` to mute.

## Load as a Chrome extension

1. Go to `chrome://extensions`
2. Enable **Developer mode** (top-right toggle)
3. Click **Load unpacked** and select this folder
4. Click the toolbar icon — it opens the game in a new tab (not a popup,
   so a mid-run game never dies from losing focus)

## Design notes

- **No remote code, no CDNs.** Manifest V3 forbids loading remote scripts,
  so everything — physics, audio, rendering — is vendored/hand-written
  and runs from local files only.
- **Coin art uses each project's real logo** (`assets/coins/`), downloaded
  once from CoinGecko's public asset CDN and bundled locally — no runtime
  network fetch. Every tier composites its real logo into a code-drawn
  metallic coin badge (glow, gradient, bevel, shine) so the ladder still
  reads as one consistent set as the coins grow. `js/coins.js` preloads
  all ten before the game starts; if a logo ever fails to load, that tier
  falls back to a drawn glyph instead of breaking.
- **Sound is fully synthesized** via the Web Audio API (oscillators +
  gain envelopes, tier-scaled merge chimes, a noise-burst landing thud) —
  no bundled audio files.
- **Physics is a small custom circle-collision solver** (semi-implicit
  Euler + multi-pass constraint relaxation), not a vendored library, so
  the whole engine is auditable in `js/physics.js`.
- **Storage** (`js/storage.js`) uses `chrome.storage.local` when running
  as an extension and transparently falls back to `localStorage` on the
  web — the game code never branches on which context it's in.
- High score ("All-Time High") persists across sessions.

## Files

```
manifest.json     MV3 manifest (no popup — toolbar icon opens a full tab)
background.js     Service worker: opens/focuses the game tab
game.html         The game page (works standalone or as the extension page)
css/style.css     Dark "crypto terminal" UI theme
js/coins.js       Tier data + canvas coin artwork
js/physics.js     Circle-physics engine (gravity, collision, merge detection)
js/particles.js   Merge bursts, shockwave rings, screen shake, score popups
js/audio.js       Synthesized SFX (Web Audio API)
js/storage.js     chrome.storage.local / localStorage wrapper
js/game.js        Game loop, input, scoring, game-over, rendering
js/main.js        Boot
icons/            Toolbar icons (rendered from the game's own Bitcoin coin art)
assets/coins/     Real project logos (LEO, ZEC, DOGE, HYPE, TRX, SOL, XRP, BNB, ETH, BTC)
```

## Permissions

- `storage` — only permission requested, used solely for the local
  All-Time-High score. No `host_permissions`, no network access, no
  tracking.

## Coin logos

The ten logos in `assets/coins/` are each project's real mark, used to
identify the actual cryptocurrency it represents — no different from any
portfolio tracker or price app. This project isn't affiliated with, and
isn't endorsed by, any of the ten projects shown.

## Testing

Verified with Playwright against a real Chromium: the full merge chain
LEO→BTC, max-tier capping at BTC, mute toggle, sustained-danger-line
game-over, All-Time-High persistence across a reload, and — separately —
loading as an actual unpacked MV3 extension (service worker boot,
`chrome.storage.local` round-trip, icon resolution), all with zero
console errors.
