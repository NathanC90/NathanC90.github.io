/* Nathan Chao — portfolio behaviour.
   One vendored dependency (Lenis, 13KB) for scroll feel. The hero is raw
   WebGL: a single fragment shader, no 3D library. Everything degrades —
   with JS off you get the English page, all content visible and readable. */
(function () {
    'use strict';

    var root = document.documentElement;
    var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ================= smooth scroll ================= */
    var lenis = null;
    if (window.Lenis && !reduced) {
        lenis = new window.Lenis({ duration: 1.05, smoothWheel: true });
        (function raf(t) { lenis.raf(t); requestAnimationFrame(raf); })(0);

        /* Lenis owns the scroll position: it writes its own value back every
           frame, so anything using window.scrollTo — a hash link on load, a
           "back to top", devtools, some assistive tooling — gets silently
           reverted. Exposing the instance and honouring hashes ourselves is
           the cost of smooth scrolling. */
        window.__lenis = lenis;

        addEventListener('hashchange', function () {
            var el = location.hash && document.querySelector(location.hash);
            if (el) lenis.scrollTo(el, { offset: -80 });
        });

        if (location.hash) {
            var initial = document.querySelector(location.hash);
            if (initial) requestAnimationFrame(function () {
                lenis.scrollTo(initial, { offset: -80, immediate: true });
            });
        }
    }

    function goTo(target) {
        if (lenis) lenis.scrollTo(target, { offset: -80 });
        else target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
    }

    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
        a.addEventListener('click', function (e) {
            var el = document.querySelector(a.getAttribute('href'));
            if (!el) return;
            e.preventDefault();
            goTo(el);
        });
    });

    /* ================= hero shader =================
       A domain-warped fbm field cut by angular bands. Three.js would be
       ~600KB to draw one full-screen quad; this is the quad. */
    (function hero() {
        var canvas = document.getElementById('gl');
        if (!canvas || reduced) return;

        var gl = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'low-power' });
        if (!gl) { canvas.style.display = 'none'; return; }

        var VERT = [
            'attribute vec2 a;',
            'void main(){ gl_Position = vec4(a, 0.0, 1.0); }'
        ].join('\n');

        var FRAG = [
            'precision highp float;',
            'uniform vec2 u_res; uniform float u_time; uniform float u_light;',
            'float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }',
            'float noise(vec2 p){',
            '  vec2 i=floor(p), f=fract(p);',
            '  vec2 u=f*f*(3.0-2.0*f);',
            '  return mix(mix(hash(i),hash(i+vec2(1.0,0.0)),u.x),',
            '             mix(hash(i+vec2(0.0,1.0)),hash(i+vec2(1.0,1.0)),u.x),u.y);',
            '}',
            'float fbm(vec2 p){',
            '  float v=0.0, a=0.5;',
            '  for(int i=0;i<5;i++){ v+=a*noise(p); p*=2.02; a*=0.5; }',
            '  return v;',
            '}',
            'void main(){',
            '  vec2 uv = gl_FragCoord.xy/u_res.xy;',
            '  vec2 p = uv; p.x *= u_res.x/u_res.y;',
            '  float t = u_time*0.05;',
            '  vec2 q = vec2(fbm(p*1.6 + t), fbm(p*1.6 + vec2(3.2,1.7) - t));',
            '  float f = fbm(p*2.2 + q*1.4 + t*0.5);',
            '  float band = sin((p.x*1.4 - p.y*1.1)*3.0 + f*4.5 + t*2.0);',
            '  band = smoothstep(-0.15, 0.85, band);',
            '  vec3 cA = vec3(0.043,0.055,0.086);',
            '  vec3 cB = vec3(0.110,0.300,0.850);',
            '  vec3 cC = vec3(0.420,0.280,0.850);',
            '  vec3 cD = vec3(0.130,0.720,0.850);',
            '  vec3 col = mix(cA, cB, smoothstep(0.15,0.95,f));',
            '  col = mix(col, cC, band*0.55*smoothstep(0.2,1.0,f));',
            '  col += cD * pow(band,3.0)*0.18;',
            '  float vig = smoothstep(1.25, 0.25, length(uv-0.5)*1.5);',
            '  col *= vig;',
            '  col = mix(col, vec3(1.0)-col*0.55, u_light);',
            '  gl_FragColor = vec4(col, 1.0);',
            '}'
        ].join('\n');

        function compile(type, src) {
            var s = gl.createShader(type);
            gl.shaderSource(s, src);
            gl.compileShader(s);
            if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
                console.warn('shader:', gl.getShaderInfoLog(s));
                return null;
            }
            return s;
        }

        var vs = compile(gl.VERTEX_SHADER, VERT);
        var fs = compile(gl.FRAGMENT_SHADER, FRAG);
        if (!vs || !fs) { canvas.style.display = 'none'; return; }

        var prog = gl.createProgram();
        gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
        if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { canvas.style.display = 'none'; return; }
        gl.useProgram(prog);

        var buf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
        var loc = gl.getAttribLocation(prog, 'a');
        gl.enableVertexAttribArray(loc);
        gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

        var uRes = gl.getUniformLocation(prog, 'u_res');
        var uTime = gl.getUniformLocation(prog, 'u_time');
        var uLight = gl.getUniformLocation(prog, 'u_light');

        function size() {
            var dpr = Math.min(devicePixelRatio || 1, 1.5);
            canvas.width = Math.floor(canvas.clientWidth * dpr);
            canvas.height = Math.floor(canvas.clientHeight * dpr);
            gl.viewport(0, 0, canvas.width, canvas.height);
            gl.uniform2f(uRes, canvas.width, canvas.height);
        }
        size();
        addEventListener('resize', size);

        // Only burn GPU while the hero is actually on screen.
        var visible = true;
        new IntersectionObserver(function (e) { visible = e[0].isIntersecting; })
            .observe(canvas.parentElement);

        var start = performance.now();
        (function draw(now) {
            requestAnimationFrame(draw);
            if (!visible) return;
            gl.uniform1f(uTime, (now - start) / 1000);
            gl.uniform1f(uLight, root.classList.contains('light') ? 1.0 : 0.0);
            gl.drawArrays(gl.TRIANGLES, 0, 3);
        })(start);

        root.classList.add('has-gl');
    })();

    /* ================= language ================= */
    var TITLES = {
        en: 'Nathan Chao | Freelance web development',
        zh: 'Nathan Chao | 自由接案 · 網頁開發'
    };
    var CJK_HREF = 'https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;600;700;800&display=swap';
    var cjkLoaded = false;

    function loadCjk() {
        if (cjkLoaded) return;
        cjkLoaded = true;
        var l = document.createElement('link');
        l.rel = 'stylesheet'; l.href = CJK_HREF;
        document.head.appendChild(l);
    }

    function setLang(lang) {
        var isZh = lang === 'zh';
        if (isZh) loadCjk();
        root.classList.toggle('zh', isZh);
        root.lang = isZh ? 'zh-Hant' : 'en';
        document.title = isZh ? TITLES.zh : TITLES.en;

        document.querySelectorAll('.nav-tools .seg-opt').forEach(function (b) {
            b.setAttribute('aria-pressed', String(b.dataset.lang === lang));
        });
        document.querySelectorAll('[data-en][data-zh]').forEach(function (el) {
            el.placeholder = isZh ? el.dataset.zh : el.dataset.en;
        });

        try { localStorage.setItem('lang', lang); } catch (e) { /* private mode */ }
        var d = document.getElementById('demo');
        if (d) d.dispatchEvent(new Event('langchange'));
    }

    setLang(root.classList.contains('zh') ? 'zh' : 'en');
    document.querySelectorAll('.nav-tools .seg-opt').forEach(function (b) {
        b.addEventListener('click', function () { setLang(b.dataset.lang); });
    });

    /* ================= theme ================= */
    var themeBtn = document.getElementById('theme-btn');
    var themeMeta = document.querySelector('meta[name="theme-color"]');
    themeBtn.addEventListener('click', function () {
        themeBtn.classList.remove('spin'); void themeBtn.offsetWidth; themeBtn.classList.add('spin');
        var light = root.classList.toggle('light');
        try { localStorage.setItem('theme', light ? 'light' : 'dark'); } catch (e) { /* private mode */ }
        themeMeta.setAttribute('content', light ? '#f6f7fb' : '#05060b');
    });

    /* ================= nav ================= */
    var nav = document.getElementById('nav');
    var onScroll = function () { nav.classList.toggle('stuck', scrollY > 20); };
    addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    var burger = document.querySelector('.burger');
    var links = document.querySelector('.nav-links');
    burger.addEventListener('click', function () {
        var open = links.classList.toggle('open');
        burger.setAttribute('aria-expanded', String(open));
    });
    links.addEventListener('click', function (e) {
        if (e.target.closest('a')) { links.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); }
    });

    /* ================= metric counters ================= */
    document.querySelectorAll('.metric-num').forEach(function (el) {
        var target = parseInt(el.dataset.count, 10);
        var suffix = el.dataset.suffix || '';
        new IntersectionObserver(function (entries, obs) {
            if (!entries[0].isIntersecting) return;
            obs.disconnect();
            if (reduced) { el.textContent = target + suffix; return; }
            var t0 = performance.now(), dur = 1100;
            (function step(now) {
                var k = Math.min((now - t0) / dur, 1);
                el.textContent = Math.round(target * (1 - Math.pow(1 - k, 3))) + suffix;
                if (k < 1) requestAnimationFrame(step);
            })(t0);
        }, { threshold: 0.6 }).observe(el);
    });

    /* ================= process rail ================= */
    var dots = [].slice.call(document.querySelectorAll('.flow-dot'));
    var stages = [].slice.call(document.querySelectorAll('.stage'));

    if (dots.length && stages.length) {
        dots.forEach(function (d) {
            d.addEventListener('click', function () {
                var s = document.getElementById('stage-' + d.dataset.go);
                if (s) goTo(s);
            });
        });

        var mark = function (n) {
            dots.forEach(function (d) { d.classList.toggle('active', d.dataset.go === String(n)); });
        };
        mark(1);

        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (e) { if (e.isIntersecting) mark(e.target.dataset.stage); });
        }, { rootMargin: '-35% 0px -55% 0px' });
        stages.forEach(function (s) { io.observe(s); });
    }

    /* ================= boop ================= */
    document.querySelectorAll('[data-boop]').forEach(function (el) {
        var timer;
        var boop = function () {
            clearTimeout(timer);
            el.classList.add('boop');
            timer = setTimeout(function () { el.classList.remove('boop'); }, 420);
        };
        el.addEventListener('mouseenter', boop);
        var row = el.closest('.cap');
        if (row) row.addEventListener('mouseenter', boop);
    });

    /* ================= typesetting demo ================= */
    var demo = document.getElementById('demo');
    if (demo) {
        var verdict = demo.querySelector('.demo-verdict');
        var thumb = demo.querySelector('.demo-thumb');
        var opts = [].slice.call(demo.querySelectorAll('.demo-opt'));

        var VERDICT = {
            same: {
                en: 'The English is fine. The Chinese is cramped — CJK characters are full-width squares ' +
                    'that need far more room between lines, and the negative letter-spacing that tightens ' +
                    'Latin text is squeezing them together.',
                zh: '英文沒問題，中文卻擠成一團。中文字是全形方塊字，行距需要放得比英文寬得多；而那個為了收緊英文而設的負字距，正把中文字硬擠在一起。'
            },
            tuned: {
                en: 'Same paragraph, same page, different metrics: looser leading and positive tracking for ' +
                    'the Chinese. Nothing about the English changed — which is exactly why this gets missed.',
                zh: '同一段文字、同一頁，只是換了一組排版數值：中文放寬行距、字距轉正。英文完全沒動 —— 這正是這個問題常常被忽略的原因。'
            }
        };

        var setMode = function (mode) {
            demo.classList.toggle('tuned', mode === 'tuned');
            opts.forEach(function (b) {
                var on = b.dataset.mode === mode;
                b.setAttribute('aria-pressed', String(on));
                if (on && thumb) {
                    thumb.style.width = b.offsetWidth + 'px';
                    thumb.style.transform = 'translateX(' + (b.offsetLeft - 3) + 'px)';
                }
            });
            demo.querySelectorAll('.demo-pane').forEach(function (pane) {
                // Read the custom properties, not the resolved line-height: those
                // are mid-transition here and report the value being animated away.
                var cs = getComputedStyle(pane.querySelector('.demo-text'));
                pane.querySelector('.demo-stats').textContent =
                    'line-height ' + cs.getPropertyValue('--demo-leading').trim() +
                    '   ·   letter-spacing ' + cs.getPropertyValue('--demo-track').trim();
            });
            verdict.textContent = VERDICT[mode][root.classList.contains('zh') ? 'zh' : 'en'];
        };

        opts.forEach(function (b) { b.addEventListener('click', function () { setMode(b.dataset.mode); }); });

        // The demo shows Chinese type whatever language the page is in.
        new IntersectionObserver(function (e, obs) {
            if (!e[0].isIntersecting) return;
            loadCjk(); obs.disconnect();
            setTimeout(function () { setMode(demo.classList.contains('tuned') ? 'tuned' : 'same'); }, 150);
        }, { rootMargin: '250px' }).observe(demo);

        setMode('same');
        addEventListener('resize', function () { setMode(demo.classList.contains('tuned') ? 'tuned' : 'same'); });
        demo.addEventListener('langchange', function () { setMode(demo.classList.contains('tuned') ? 'tuned' : 'same'); });
    }

    /* ================= contact form ================= */
    var form = document.getElementById('contact-form');
    var status = document.getElementById('contact-status');
    var submitBtn = document.getElementById('contact-submit');
    var btnText = submitBtn.querySelector('.btn-text');
    var SEND = { en: 'Send message', zh: '送出訊息' };

    /* Formal register for system messages — deliberately different from the
       conversational register of the marketing copy. */
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

    function label(en, zh) {
        btnText.querySelector('[lang="en"]').textContent = en;
        btnText.querySelector('[lang="zh"]').textContent = zh;
    }

    form.addEventListener('submit', async function (event) {
        event.preventDefault();
        var lang = root.classList.contains('zh') ? 'zh' : 'en';
        status.className = 'form-status';
        label(MSG.en.sending, MSG.zh.sending);
        submitBtn.disabled = true;

        try {
            var res = await fetch(form.action, {
                method: form.method,
                body: new FormData(form),
                headers: { Accept: 'application/json' }
            });
            if (res.ok) {
                status.textContent = MSG[lang].success;
                status.classList.add('success', 'shown');
                form.reset();
            } else {
                var data = await res.json().catch(function () { return {}; });
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
            label(SEND.en, SEND.zh);
        }
    });
})();
