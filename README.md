# nathanc90.github.io

My portfolio — bilingual (繁體中文 / English) websites for local businesses.

**Live:** https://nathanc90.github.io/

## What it is

A single static page. No framework, no build step, no dependencies, no tracking:
`index.html`, `styles.css`, `main.js`.

The language switch is the point of the design rather than a convenience. Flipping
it swaps the whole type system — Fraunces/Inter for Latin, Noto Serif TC/Noto Sans TC
for Chinese — along with the tracking, leading and display weights each script needs.
Both languages are written, not machine-translated.

## Notes for future me

- The CJK webfonts are ~2MB and load **on demand**, the first time someone asks for
  Chinese (`loadCjkFonts()` in `main.js`). Do not move them into the `<head>`.
- Language and theme are applied by a small script in the `<head>`, before first
  paint, so a returning visitor never sees the wrong one flash. That is also why the
  bilingual CSS rules are keyed on `:root` and not on `body` — the body does not
  exist yet when that script runs.
- Never set `display` on an element that also carries a `[lang]` attribute; it beats
  the visibility rules and both languages render at once. `selfcheck.js` enforces this.
- `.reveal` is gated behind `:root.js` so the page is not blank with JavaScript off.
- The typesetting demo reads `--demo-leading` / `--demo-track` to print its stats, NOT
  the resolved `line-height`. Those properties are transitioned, so a computed read
  during a mode change reports the value being animated away from, not the new one.
- The headline's alternate word is generated content (`::after` + `data-alt`), not
  markup, and is positioned out of flow. As a real element it landed inside the `<h1>`,
  so copy, find-in-page and crawlers all saw "I build bilingual中英雙語 websites"; and
  sharing a layout box with the visible word sized that box by the *wider* of the two,
  leaving a gap around the shorter one.
- Inside a `:root.zh` rule, `var(--font-display)` resolves to the *CJK* face. To set
  something in Fraunces there, name the family explicitly — the headline swap needs
  this, and it silently renders English in Noto Serif TC otherwise.
- CJK has no italic. Never let `font-style: italic` reach Chinese text; the browser
  fakes it by shearing the glyphs. Chinese emphasis in this design is a rule beneath
  the word.
- Scroll animation is native CSS (`animation-timeline: view()` / `scroll()`), all of it
  inside `@supports`. No GSAP, no Lenis, no scroll listener. A browser without support
  gets the IntersectionObserver reveal, which is why that path is still there.
- Never put a scroll sweep on the hero `.display`: it is already on screen at load, so
  its `view()` timeline starts part-way through its range and the headline settles
  half-grey forever. Sweeps only belong on headings you scroll to.
- `boop` is decoration only: it sits on `aria-hidden` elements, and
  `prefers-reduced-motion` neutralises it.
- Each case study can pull the real deployed site into the page in an iframe, built
  on first click. This works because GitHub Pages sends no `X-Frame-Options` or
  `Content-Security-Policy` header — if that ever changes, the embeds go blank and
  the "Open full site" links become the only route.

## Check

```
node selfcheck.js
```

Verifies every English string has a Chinese counterpart in the right order, that no
class on a `[lang]` element sets `display`, that placeholder pairs travel together,
and that every in-page link resolves.
