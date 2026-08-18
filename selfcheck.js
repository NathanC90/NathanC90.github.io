/* Structural self-check for the bilingual page. Run: node selfcheck.js
 *
 * The failure modes this page actually has are all invisible in the browser
 * because only one language is on screen at a time: a translation quietly
 * missing, a pair written in the wrong order, or a class whose `display`
 * beating the [lang] visibility rules so BOTH languages show at once.
 * Nothing here needs a test framework or a DOM. */
const { readFileSync } = require('node:fs');
const assert = require('node:assert');

const html = readFileSync(`${__dirname}/index.html`, 'utf8');
const css = readFileSync(`${__dirname}/styles.css`, 'utf8');

const TAG = /<(\w+)([^>]*\blang="(en|zh)"[^>]*)>/g;
const tags = [...html.matchAll(TAG)]
    .map(([, name, attrs, lang]) => ({ name, attrs, lang }))
    .filter(t => t.name !== 'html');

// 1. Every English string has a Chinese counterpart, in that order, same tag.
assert.ok(tags.length > 0, 'no [lang] elements found — did the markup change?');
assert.strictEqual(tags.length % 2, 0, `odd number of [lang] elements (${tags.length}): one is unpaired`);

for (let i = 0; i < tags.length; i += 2) {
    const [en, zh] = [tags[i], tags[i + 1]];
    const where = `pair ${i / 2 + 1} (<${en.name} lang="${en.lang}">)`;
    assert.strictEqual(en.lang, 'en', `${where}: expected the English half first`);
    assert.strictEqual(zh.lang, 'zh', `${where}: English half has no Chinese counterpart`);
    assert.strictEqual(en.name, zh.name, `${where}: pair uses <${en.name}> and <${zh.name}> — must match`);
}

// 2. No class on a [lang] element may set `display`, or both languages render.
const classed = new Set();
for (const t of tags) {
    const m = t.attrs.match(/\bclass="([^"]*)"/);
    if (m) m[1].split(/\s+/).filter(Boolean).forEach(c => classed.add(c));
}
for (const cls of classed) {
    const rule = new RegExp(`\\.${cls}\\b[^{}]*\\{([^}]*)\\}`, 'g');
    for (const [, body] of css.matchAll(rule)) {
        assert.ok(
            !/(^|[;\s])display\s*:/.test(body),
            `.${cls} is used on a [lang] element and sets \`display\` — it will beat the ` +
            `visibility rules and show both languages at once`
        );
    }
}

// 3. Placeholder pairs travel together.
for (const [, attrs] of html.matchAll(/<(?:input|textarea)([^>]*)>/g)) {
    if (/\bdata-en=/.test(attrs) !== /\bdata-zh=/.test(attrs)) {
        assert.fail(`field has only one of data-en / data-zh:${attrs}`);
    }
}

// 4. Every in-page link points at something that exists.
const ids = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]));
for (const [, href] of html.matchAll(/href="#([^"]+)"/g)) {
    assert.ok(ids.has(href), `href="#${href}" has no matching element`);
}

console.log(`ok — ${tags.length / 2} translation pairs, ${classed.size} classes on [lang] elements, ${ids.size} ids`);
