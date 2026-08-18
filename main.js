/* Nathan Chao — portfolio behaviour.
   No framework, no dependencies. Everything degrades: with JS off you get
   the English page, all content visible, every <details> still opens. */
(function () {
    'use strict';

    var root = document.documentElement;

    /* ---------- language ----------------------------------------------
       The switch does three things: flips the visible language, swaps the
       type stack (CSS, via :root.zh), and pulls the CJK webfonts down —
       but only the first time someone actually asks for Chinese, so the
       ~2MB of Noto TC never lands on a visitor who reads English. */

    var TITLES = {
        en: 'Nathan Chao | Bilingual websites for local businesses',
        zh: 'Nathan Chao | 為在地商家打造中英雙語網站'
    };
    var CJK_HREF = 'https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500&family=Noto+Serif+TC:wght@600;700&display=swap';
    var cjkLoaded = false;

    function loadCjkFonts() {
        if (cjkLoaded) return;
        cjkLoaded = true;
        var link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = CJK_HREF;
        document.head.appendChild(link);
    }

    function setLang(lang, animate) {
        var isZh = lang === 'zh';
        if (isZh) loadCjkFonts();

        root.classList.toggle('zh', isZh);
        root.lang = isZh ? 'zh-Hant' : 'en';
        document.title = isZh ? TITLES.zh : TITLES.en;

        document.querySelectorAll('.lang-opt').forEach(function (btn) {
            btn.setAttribute('aria-pressed', String(btn.dataset.lang === lang));
        });

        document.querySelectorAll('[data-en][data-zh]').forEach(function (el) {
            el.placeholder = isZh ? el.dataset.zh : el.dataset.en;
        });

        try { localStorage.setItem('lang', lang); } catch (e) { /* private mode */ }

        var d = document.getElementById('demo');
        if (d) d.dispatchEvent(new Event('langchange'));

        if (animate) {
            root.classList.remove('retype');
            void root.offsetWidth;            // restart the animation
            root.classList.add('retype');
        }
    }

    // The pre-paint script in <head> already set the class; sync the rest.
    setLang(root.classList.contains('zh') ? 'zh' : 'en', false);

    document.querySelectorAll('.lang-opt').forEach(function (btn) {
        btn.addEventListener('click', function () {
            if (btn.getAttribute('aria-pressed') === 'true') return;
            setLang(btn.dataset.lang, true);
        });
    });

    /* ---------- theme ---------- */
    var themeBtn = document.getElementById('theme-btn');
    var themeColor = document.querySelector('meta[name="theme-color"]');

    themeBtn.addEventListener('click', function () {
        var isDark = root.classList.toggle('dark');
        try { localStorage.setItem('theme', isDark ? 'dark' : 'light'); } catch (e) { /* private mode */ }
        themeColor.setAttribute('content', isDark ? '#14120e' : '#f2efe7');
    });

    /* ---------- masthead hairline on scroll ---------- */
    var masthead = document.getElementById('masthead');
    var onScroll = function () { masthead.classList.toggle('stuck', window.scrollY > 24); };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    /* ---------- mobile menu ---------- */
    var menuBtn = document.querySelector('.menu-btn');
    var nav = document.querySelector('.nav');

    menuBtn.addEventListener('click', function () {
        var open = nav.classList.toggle('open');
        menuBtn.setAttribute('aria-expanded', String(open));
    });
    nav.addEventListener('click', function (e) {
        if (e.target.closest('a')) {
            nav.classList.remove('open');
            menuBtn.setAttribute('aria-expanded', 'false');
        }
    });

    /* ---------- live project embeds ----------------------------------
       Each case study can pull the real deployed site into the page. The
       iframe is built on first click, never on load — four embedded sites
       booting up behind a closed drawer would cost more than the page. */
    document.querySelectorAll('.case').forEach(function (details) {
        var btn = details.querySelector('.embed-btn');
        var slot = details.querySelector('.embed-slot');
        if (!btn || !slot) return;

        btn.addEventListener('click', function () {
            if (slot.firstChild) {                 // already loaded: toggle it away
                slot.textContent = '';
                setLabel(btn, 'Load it in this page', '直接載進這一頁');
                return;
            }
            var frame = document.createElement('iframe');
            frame.className = 'embed-frame';
            frame.src = details.dataset.embed;
            frame.title = details.querySelector('.case-title').textContent.trim();
            slot.appendChild(frame);

            var cap = document.createElement('p');
            cap.className = 'embed-caption';
            cap.textContent = details.dataset.embed;
            slot.appendChild(cap);

            setLabel(btn, 'Hide it again', '收起來');
            frame.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        });
    });

    function setLabel(btn, en, zh) {
        btn.querySelector('[lang="en"]').textContent = en;
        btn.querySelector('[lang="zh"]').textContent = zh;
    }

    /* ---------- boop ---------------------------------------------------
       A spring nudge on hover, lifted from joshwcomeau.com. Add .boop for
       one beat and let the overshoot in the CSS easing do the work. It is
       decoration, so it only ever touches aria-hidden elements, and the
       reduced-motion media query neutralises it. */
    var BOOP_MS = 420;

    document.querySelectorAll('[data-boop]').forEach(function (el) {
        var timer;
        var boop = function () {
            clearTimeout(timer);
            el.classList.add('boop');
            timer = setTimeout(function () { el.classList.remove('boop'); }, BOOP_MS);
        };
        el.addEventListener('mouseenter', boop);
        // A parent row is a much bigger hover target than a 30px icon.
        var row = el.closest('.approach, .case-summary, .step');
        if (row) row.addEventListener('mouseenter', boop);
    });

    /* ---------- typesetting demo ---------------------------------------
       Sets the same two paragraphs with one shared set of metrics, then
       with metrics tuned per script. The English pane is identical in both
       modes — which is the whole point: if you only read English, nothing
       looks wrong. */
    var demo = document.getElementById('demo');

    if (demo) {
        var verdict = demo.querySelector('.demo-verdict');
        var thumb = demo.querySelector('.demo-thumb');
        var opts = [].slice.call(demo.querySelectorAll('.demo-opt'));

        var VERDICT = {
            same: {
                en: 'The English is fine. The Chinese is cramped — CJK characters are full-width ' +
                    'squares and need far more room between lines, and the negative letter-spacing ' +
                    'that tightens Latin text is actively squeezing them together.',
                zh: '英文沒問題，中文卻擠成一團。中文字是全形方塊字，行距需要放得比英文寬得多；' +
                    '而那個為了收緊英文而設的負字距，正把中文字硬擠在一起。'
            },
            tuned: {
                en: 'Same paragraph, same page, different metrics: looser leading and positive ' +
                    'tracking for the Chinese. Nothing about the English changed — which is exactly ' +
                    'why this gets missed.',
                zh: '同一段文字、同一頁，只是換了一組排版數值：中文放寬行距、字距轉正。英文完全沒動 ——' +
                    '這正是這個問題常常被忽略的原因。'
            }
        };

        var setMode = function (mode) {
            demo.classList.toggle('tuned', mode === 'tuned');

            opts.forEach(function (btn, i) {
                var on = btn.dataset.mode === mode;
                btn.setAttribute('aria-pressed', String(on));
                if (on && thumb) {
                    thumb.style.width = btn.offsetWidth + 'px';
                    thumb.style.transform = 'translateX(' + (btn.offsetLeft - 3) + 'px)';
                }
            });

            demo.querySelectorAll('.demo-pane').forEach(function (pane) {
                // Read the custom properties, not the resolved line-height:
                // those are mid-transition at this point and would report the
                // value being animated away from. Custom properties flip at once.
                var cs = getComputedStyle(pane.querySelector('.demo-text'));
                pane.querySelector('.demo-stats').textContent =
                    'line-height ' + cs.getPropertyValue('--demo-leading').trim() +
                    '   ·   letter-spacing ' + cs.getPropertyValue('--demo-track').trim();
            });

            verdict.textContent = VERDICT[mode][root.classList.contains('zh') ? 'zh' : 'en'];
        };

        opts.forEach(function (btn) {
            btn.addEventListener('click', function () { setMode(btn.dataset.mode); });
        });

        // The demo shows Chinese type whatever language the page is in, so it
        // needs the CJK faces even for an English-reading visitor — but only
        // once they have actually scrolled to it.
        new IntersectionObserver(function (entries, obs) {
            if (!entries[0].isIntersecting) return;
            loadCjkFonts();
            obs.disconnect();
            setTimeout(function () { setMode(demo.classList.contains('tuned') ? 'tuned' : 'same'); }, 150);
        }, { rootMargin: '200px' }).observe(demo);

        setMode('same');
        window.addEventListener('resize', function () {
            setMode(demo.classList.contains('tuned') ? 'tuned' : 'same');
        });
        demo.addEventListener('langchange', function () {
            setMode(demo.classList.contains('tuned') ? 'tuned' : 'same');
        });
    }

    /* ---------- reveal on scroll ---------- */
    var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('seen');
            io.unobserve(entry.target);
        });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

    document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });

    /* ---------- contact form ---------- */
    var form = document.getElementById('contact-form');
    var status = document.getElementById('contact-status');
    var submitBtn = document.getElementById('contact-submit');
    var btnText = submitBtn.querySelector('.btn-text');
    var SEND = { en: 'Send message', zh: '送出訊息' };

    /* Formal register for system messages — deliberate, and different from
       the conversational register used in the marketing copy above. */
    var MSG = {
        en: {
            sending: 'Sending…',
            success: 'Thank you. Your message has been sent — I will reply within two working days.',
            error: 'Your message could not be sent. Please email ymnchao@gmail.com directly.'
        },
        zh: {
            sending: '傳送中……',
            success: '已收到您的來信，將於兩個工作天內回覆。',
            error: '訊息傳送失敗，請直接來信 ymnchao@gmail.com。'
        }
    };

    form.addEventListener('submit', async function (event) {
        event.preventDefault();
        var lang = root.classList.contains('zh') ? 'zh' : 'en';

        status.className = 'contact-status';
        setLabel(btnText, MSG.en.sending, MSG.zh.sending);
        submitBtn.disabled = true;

        try {
            var response = await fetch(form.action, {
                method: form.method,
                body: new FormData(form),
                headers: { Accept: 'application/json' }
            });

            if (response.ok) {
                status.textContent = MSG[lang].success;
                status.classList.add('success', 'shown');
                form.reset();
            } else {
                var data = await response.json().catch(function () { return {}; });
                status.textContent = Array.isArray(data.errors)
                    ? data.errors.map(function (e) { return e.message; }).join(', ')
                    : MSG[lang].error;
                status.classList.add('error', 'shown');
            }
        } catch (e) {
            status.textContent = MSG[lang].error;
            status.classList.add('error', 'shown');
        } finally {
            submitBtn.disabled = false;
            setLabel(btnText, SEND.en, SEND.zh);
        }
    });
})();
