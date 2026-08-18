# nathanc90.github.io

My portfolio — freelance web development, bilingual (繁體中文 / English).

**Live:** https://nathanc90.github.io/

## What it is

A single static page: `index.html`, `styles.css`, `main.js`, plus one vendored
dependency. Dark product register, reference-inspired by prolibu.com for structure and
motion; all copy, artwork and colour here are original.

- **Lenis** (`vendor/lenis.min.js`, 13KB) for scroll feel. Vendored rather than hot-linked
  so the page has no third-party runtime dependency.
- **The hero is raw WebGL** — one fragment shader (domain-warped fbm cut by angular
  bands) drawn on a single full-screen triangle. Three.js would have been ~600KB to draw
  one quad.
- Everything else is native CSS: scroll-driven timelines, sticky pinning, grid.

## Notes for future me

- **Never set `overflow-x` on `html` or `body` here.** `hidden` on `<body>` forces
  `overflow-y: auto` and makes body a scroll container; `clip` on `<html>` stops the
  document scrolling entirely. Nothing on the page overflows horizontally — fix any
  offender at the source instead.
- **Lenis owns the scroll position.** It writes its own value back every frame, so
  `window.scrollTo` gets silently reverted. Anchor links go through `goTo()`, hash
  navigation is handled explicitly, and the instance is exposed as `window.__lenis`.
- Lenis and the metric counters are `requestAnimationFrame`-driven, so neither runs while
  the tab is hidden. That is correct behaviour, not a bug — but it means they cannot be
  verified in a backgrounded preview pane.
- The CJK webfont loads **on demand**, on first switch to Chinese and when the
  typesetting demo scrolls near. Do not move it into `<head>`.
- Language and theme are applied by a script in `<head>` before first paint, which is why
  the bilingual CSS is keyed on `:root` and not `body` — body does not exist yet.
- **Never set `display` on an element carrying `[lang]`**; it beats the visibility rules
  and renders both languages at once. `selfcheck.js` enforces this.
- The demo's stats read `--demo-leading` / `--demo-track`, not the resolved
  `line-height`: those are transitioned and report the value being animated away from.
- No scroll sweep on anything already on screen at load — a `view()` timeline starts
  part-way through its own range and never resolves.

## Check

```
node selfcheck.js
```

Verifies every English string has a Chinese counterpart in the right order, that no class
on a `[lang]` element sets `display`, that placeholder pairs travel together, and that
every in-page link resolves.
