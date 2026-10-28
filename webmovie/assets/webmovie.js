/*! webmovie.js — web animation where text stays real text (indexable, translatable, editable). MIT. https://sonub.com/skills
 *
 * Load it in <head> WITHOUT defer, after webmovie.css, so the page never flashes:
 *   <link rel="stylesheet" href="webmovie.css"><script src="webmovie.js"></script>
 *
 * Markup:  <h1 data-webmovie="mask">Real text</h1>      presets: references/presets.md
 * Options: data-webmovie-split="chars|words|lines|children|paths|none"  data-webmovie-from="start|end|center|edges|random"
 *          data-webmovie-delay|dur|stagger|max="ms"  data-webmovie-trigger="view|load|hover|click|manual"  data-webmovie-repeat
 * Words:   <span data-webmovie-rotate><span>fast</span>, <span>simple</span></span>  (data-webmovie-hold, data-webmovie-loops)
 * Spotlight: <div data-webmovie-spotlight="pop"> … <strong data-webmovie-cue>key</strong> … </div> — after everything entered, the key
 *          texts take turns: one at a time gets a cue (pop tada jelly hop glow · ripple = letters), 2 rounds, pauses on hover/focus
 * Freeze:  page.html?webmovie-t=0.4  plays everything and pauses it at 0.4 s (screenshots, scripts/check.mjs)
 * Movie:   <section data-webmovie-player data-label-play="Play" data-label-pause="Pause"> <section class="webmovie-scene">…</section> … </section>
 *          scenes play one after another (?webmovie-scene=2 with ?webmovie-t= freezes scene 2)
 * Power:   data-webmovie-power="calm|bold|wild" on any container (default bold: distances × 1.6, overshoot) — references/acting.md
 * Impact:  data-webmovie-burst="12" (sparks as it lands, colors --webmovie-burst) · presets smash stamp blast whip assemble elastic …
 * Picture: <figure class="webmovie-picture" data-webmovie-picture> plate + cut-out layers (walk · jump · wave · unfold · drift · fly · ping …)
 *          — the layers start together on their own delays when the picture is in view; <button data-webmovie-replay> plays it again
 * Autoplay: data-webmovie-autoplay="off" on a player or a picture — it stands still (plain HTML) until play / replay is pressed
 * API:     webmovie.play(el) · replay(el | picture | spotlight) · reset · finish · refresh(root) · pause(movie) · resume(movie) · go(movie, k)
 *          · stopSpotlights()
 *
 * The rule: without JS, with reduced motion, and after the animation, the DOM is the original HTML (the final frame).
 * Text is split into spans only while it moves, then put back — same text nodes, same elements, same listeners.
 */
(() => {
    'use strict';
    if (window.webmovie) return;
    const doc = document;
    doc.documentElement.classList.add('webmovie-js');

    const reduce = matchMedia('(prefers-reduced-motion: reduce)');
    const query = new URLSearchParams(location.search);
    const freeze = query.has('webmovie-t') ? Math.max(0, parseFloat(query.get('webmovie-t')) || 0) * 1000 : null;
    if (freeze !== null) doc.documentElement.classList.add('webmovie-frozen'); // CSS pauses every animation from its first frame

    // Default split of each preset (data-webmovie-split overrides). none = the element moves as one block.
    const SPLIT = {
        'soft-blur': 'chars', rise: 'chars', drop: 'chars', center: 'chars', typewriter: 'chars', scramble: 'chars', flip: 'chars', converge: 'chars',
        words: 'words', spring: 'words', depth: 'words', bounce: 'words', whip: 'words',
        assemble: 'chars', elastic: 'chars',
        mask: 'lines', slide: 'lines',
        stagger: 'children', draw: 'paths',
    };
    const FROM = { center: 'center' };
    // Letters of these scripts join or stack: one span per letter breaks the shaping, so split by word instead.
    const JOINING = /[\p{Script=Arabic}\p{Script=Syriac}\p{Script=Thaana}\p{Script=Nko}\p{Script=Mongolian}\p{Script=Adlam}\p{Script=Hanifi_Rohingya}\p{Script=Devanagari}\p{Script=Bengali}\p{Script=Gurmukhi}\p{Script=Gujarati}\p{Script=Oriya}\p{Script=Tamil}\p{Script=Telugu}\p{Script=Kannada}\p{Script=Malayalam}\p{Script=Sinhala}\p{Script=Tibetan}\p{Script=Myanmar}\p{Script=Khmer}]/u;
    // Scripts written without spaces: words come from Intl.Segmenter, not from spaces.
    const NO_SPACE = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Thai}\p{Script=Lao}\p{Script=Khmer}\p{Script=Myanmar}]/u;
    // These scripts may wrap between any two letters (unless word-break: keep-all): a word is split into letters that share one
    // timing, so the lines break exactly where the browser breaks the plain text — no jump when the text is put back.
    const LOOSE = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/u;
    const SKIP = 'br, svg, img, picture, video, audio, canvas, iframe, math, code, kbd, samp, textarea, select, [data-webmovie], [data-webmovie-rotate], .webmovie-keep';
    const SPACE = /^\s+$/;

    const states = new WeakMap();
    const num = (v) => (v === undefined || v === null || v === '' || isNaN(+v) ? null : +v);
    const ms = (v) => {
        v = String(v || '').trim();
        const n = parseFloat(v);
        return isNaN(n) ? 0 : v.endsWith('ms') ? n : v.endsWith('s') ? n * 1000 : n;
    };
    const clamp = (p) => Math.min(1, Math.max(0, p));
    // A fixed pseudo-random number −1…1 per (index, channel): scattered starts that are the same on every play and frozen frame.
    const rnd = (i, k) => {
        const x = Math.sin((i + 1) * 12.9898 + k * 78.233) * 43758.5453;
        return (x - Math.floor(x)) * 2 - 1;
    };
    const easeOut = (p) => (p >= 1 ? 1 : 1 - Math.pow(2, -10 * p)); // easeOutExpo, same feel as cubic-bezier(0.16, 1, 0.3, 1)
    const langOf = (el) => el.closest('[lang]')?.getAttribute('lang') || undefined;
    const segmenters = new Map();
    const segmenter = (lang, granularity) => {
        const key = `${lang}|${granularity}`;
        if (!segmenters.has(key)) {
            let s = null;
            try { s = new Intl.Segmenter(lang, { granularity }); } catch { /* old browser */ }
            segmenters.set(key, s);
        }
        return segmenters.get(key);
    };

    // A text run → tokens: words and the whitespace between them (whitespace stays a text node, so lines wrap and copy as before).
    function tokens(text, lang) {
        if (!NO_SPACE.test(text)) return text.split(/(\s+)/).filter(Boolean);
        const seg = segmenter(lang, 'word');
        if (!seg) return Array.from(text);
        const out = [];
        let carry = '';
        for (const { segment, isWordLike } of seg.segment(text)) {
            const last = out[out.length - 1];
            if (SPACE.test(segment)) {
                if (carry) { out.push(carry); carry = ''; }
                out.push(segment);
            } else if (!isWordLike && /^[\p{Ps}\p{Pi}]+$/u.test(segment)) {
                carry += segment; // opening bracket or quote sticks to the next word
            } else if (!isWordLike && !carry && last && !SPACE.test(last)) {
                out[out.length - 1] = last + segment; // closing punctuation sticks to the previous word (no line starts with 。or ,)
            } else {
                out.push(carry + segment);
                carry = '';
            }
        }
        if (carry) out.push(carry);
        return out;
    }
    const graphemes = (text, lang) => {
        const seg = segmenter(lang, 'grapheme');
        return seg ? Array.from(seg.segment(text), (s) => s.segment) : Array.from(text);
    };

    // Replace text nodes (never elements) with word spans → piece spans. restore() puts the very same text nodes back.
    function splitText(el, mode, lang) {
        const pieces = [];
        const words = [];
        const group = []; // word number of each piece
        const swaps = [];
        const loose = getComputedStyle(el).wordBreak !== 'keep-all';
        const visit = (node) => {
            for (const child of Array.from(node.childNodes)) {
                if (child.nodeType === Node.TEXT_NODE) {
                    if (!child.data.trim()) continue;
                    const frag = doc.createDocumentFragment();
                    const parts = [];
                    for (const token of tokens(child.data, lang)) {
                        if (SPACE.test(token)) {
                            const t = doc.createTextNode(token);
                            frag.append(t);
                            parts.push(t);
                            continue;
                        }
                        const word = doc.createElement('span');
                        const wrapsInside = loose && LOOSE.test(token);
                        word.className = wrapsInside ? 'webmovie-word webmovie-loose' : 'webmovie-word';
                        for (const unit of mode === 'chars' || wrapsInside ? graphemes(token, lang) : [token]) {
                            const piece = doc.createElement('span');
                            piece.className = 'webmovie-piece';
                            piece.textContent = unit;
                            word.append(piece);
                            pieces.push(piece);
                            group.push(words.length);
                        }
                        frag.append(word);
                        parts.push(word);
                        words.push(word);
                    }
                    swaps.push({ text: child, parts });
                    child.replaceWith(frag);
                } else if (child.nodeType === Node.ELEMENT_NODE && !child.matches(SKIP)) {
                    visit(child);
                }
            }
        };
        visit(el);
        return {
            pieces,
            words,
            group,
            restore() {
                for (const { text, parts } of swaps) {
                    parts[0].before(text);
                    parts.forEach((p) => p.remove());
                }
            },
        };
    }

    // children: each child element (cards, list items, steps) · paths: each SVG shape with pathLength (line drawing).
    function splitNodes(el, mode) {
        const pieces = Array.from(mode === 'paths' ? el.querySelectorAll('[pathLength]') : el.children);
        pieces.forEach((p) => p.classList.add('webmovie-piece'));
        return {
            pieces,
            words: pieces,
            group: pieces.map((_, i) => i),
            restore() {
                pieces.forEach((p) => {
                    p.classList.remove('webmovie-piece');
                    ['--i', '--r1', '--r2', '--r3'].forEach((v) => p.style.removeProperty(v));
                    if (!p.getAttribute('style')) p.removeAttribute('style');
                });
            },
        };
    }

    function order(count, from) {
        const idx = Array.from({ length: count }, (_, i) => i);
        const mid = (count - 1) / 2;
        if (from === 'end') return idx.map((i) => count - 1 - i);
        if (from === 'center') return idx.map((i) => Math.round(Math.abs(i - mid)));
        if (from === 'edges') return idx.map((i) => Math.round(mid - Math.abs(i - mid)));
        if (from === 'random') {
            let seed = count * 7919;
            return idx.map(() => (seed = (seed * 9301 + 49297) % 233280) % count); // fixed seed: the same frame every run
        }
        return idx;
    }

    // Line number of each piece, measured after fonts load — works across <strong>, <a>, <br> inside the element.
    function lineOf(pieces) {
        let line = -1;
        let top = -Infinity;
        return pieces.map((w) => {
            const r = w.getBoundingClientRect();
            if (r.top > top + r.height / 2) {
                line++;
                top = r.top;
            }
            return line;
        });
    }

    function setVar(el, name, value) {
        el.style.setProperty(name, value);
    }

    function cleanStyle(el, names) {
        names.forEach((n) => el.style.removeProperty(n));
        if (!el.getAttribute('style')) el.removeAttribute('style');
    }

    function play(el, extra = 0) {
        const s = states.get(el);
        if (!s || s.playing) return;
        s.playing = true;
        const name = el.dataset.webmovie;
        let mode = el.dataset.webmovieSplit || SPLIT[name] || 'none';
        if (mode === 'chars' && JOINING.test(el.textContent)) mode = 'words';
        const start = () => {
            if (!s.playing) return;
            const lines = mode === 'lines';
            const parts = mode === 'none' ? null
                : mode === 'children' || mode === 'paths' ? splitNodes(el, mode)
                : splitText(el, lines ? 'words' : mode, langOf(el));
            s.parts = parts;
            const cs = getComputedStyle(el);
            el.classList.toggle('webmovie-rtl', cs.direction === 'rtl'); // the language (and dir) may have changed since prepare
            const dur = num(el.dataset.webmovieDur) ?? ms(cs.getPropertyValue('--webmovie-dur'));
            const delay = (num(el.dataset.webmovieDelay) ?? ms(cs.getPropertyValue('--webmovie-delay'))) + extra;
            const max = num(el.dataset.webmovieMax) ?? ms(cs.getPropertyValue('--webmovie-max'));
            let step = num(el.dataset.webmovieStagger) ?? ms(cs.getPropertyValue('--webmovie-stagger'));
            let groups = 1;
            if (parts && parts.pieces.length) {
                const from = el.dataset.webmovieFrom || FROM[name];
                let idx;
                if (lines) idx = lineOf(parts.pieces);
                else if (mode === 'chars') idx = order(parts.pieces.length, from);
                else {
                    const byWord = order(parts.words.length, from);
                    idx = parts.group.map((w) => byWord[w]); // letters of one CJK word move together
                }
                groups = Math.max(...idx) + 1;
                // A longer translation must not take longer: squeeze the stagger so the whole reveal fits in --webmovie-max.
                if (groups > 1 && max && (groups - 1) * step + dur > max) step = Math.max(0, (max - dur) / (groups - 1));
                const mid = (parts.pieces.length - 1) / 2;
                parts.pieces.forEach((p, i) => {
                    setVar(p, '--i', idx[i]);
                    if (mode === 'chars') setVar(p, '--d', i - mid); // signed distance from the middle letter (converge)
                    for (let k = 1; k <= 3; k++) setVar(p, `--r${k}`, rnd(i, k).toFixed(3)); // scattered starts (assemble …)
                });
            }
            setVar(el, '--webmovie-delay', `${delay - (freeze ?? 0)}ms`); // frozen: a negative delay shows the frame at t
            setVar(el, '--webmovie-step', `${step}ms`);
            if (el.dataset.webmovieDur) setVar(el, '--webmovie-dur', `${dur}ms`);
            if (name === 'shine') setVar(el, '--webmovie-ink', cs.color);
            el.classList.remove('webmovie-wait', 'webmovie-done');
            el.classList.add(parts ? 'webmovie-split' : 'webmovie-whole');
            void el.offsetWidth; // a replay restarts the CSS animation
            el.classList.add('webmovie-in');
            let total = delay + (groups - 1) * step + dur;
            if (name === 'count') total = Math.max(total, count(el, s, delay, cs));
            if (el.hasAttribute('data-webmovie-burst')) burst(el, num(el.dataset.webmovieBurstAt) ?? delay + dur * 0.42);
            if (name === 'scramble' && parts) scramble(el, s, parts, delay, step, dur);
            if (freeze === null) s.timer = setTimeout(() => finish(el), total + 60);
        };
        if (mode === 'lines' && doc.fonts && doc.fonts.status !== 'loaded') doc.fonts.ready.then(start);
        else start();
    }

    // Numbers: the HTML holds the final, server-formatted value (SEO); we count up to it in the page language and put it back.
    function count(el, s, delay, cs) {
        const final = el.textContent;
        const target = num(el.getAttribute('value')) ?? num(el.dataset.webmovieCount) ?? parseFloat(final.replace(/[^\d.-]/g, ''));
        if (!isFinite(target)) return 0;
        const from = num(el.dataset.webmovieCountFrom) ?? 0;
        const dur = num(el.dataset.webmovieCountDur) ?? ms(cs.getPropertyValue('--webmovie-count-dur'));
        const decimals = (String(target).split('.')[1] || '').length;
        const format = new Intl.NumberFormat(langOf(el), { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
        s.text = final;
        el.style.minInlineSize = `${el.getBoundingClientRect().width}px`; // the final width is reserved: no jitter
        const t0 = performance.now();
        const frame = (now) => {
            if (!s.playing || s.text === undefined) return;
            const p = clamp(((freeze ?? now - t0) - delay) / dur);
            el.textContent = p >= 1 ? final : format.format(from + (target - from) * easeOut(p));
            if (freeze === null && p < 1) requestAnimationFrame(frame);
            else if (freeze === null) el.classList.add('webmovie-punch'); // the last digit lands with a punch
        };
        frame(performance.now());
        return delay + dur + (freeze === null ? 480 : 0);
    }

    // Decode effect: each letter flickers through letters of the same text (works in every script), then lands.
    function scramble(el, s, parts, delay, step, dur) {
        const pool = parts.pieces.map((p) => p.textContent).filter((t) => t.trim());
        const finals = parts.pieces.map((p) => p.textContent);
        const t0 = performance.now();
        const frame = (now) => {
            if (!s.playing || s.parts !== parts) return;
            const t = freeze ?? now - t0;
            let busy = false;
            parts.pieces.forEach((p, i) => {
                const settle = delay + (+p.style.getPropertyValue('--i') || 0) * step + dur * 0.7;
                if (t >= settle || !finals[i].trim()) p.textContent = finals[i];
                else {
                    busy = true;
                    p.textContent = pool[(i * 7 + Math.floor(t / 60) * 13) % pool.length];
                }
            });
            if (freeze === null && busy) requestAnimationFrame(frame);
        };
        frame(performance.now());
    }

    function finish(el) {
        const s = states.get(el);
        if (!s) return;
        clearTimeout(s.timer);
        s.playing = false;
        s.played = true;
        if (s.parts) s.parts.restore();
        s.parts = null;
        if (s.text !== undefined) el.textContent = s.text;
        s.text = undefined;
        el.classList.remove('webmovie-in', 'webmovie-split', 'webmovie-whole', 'webmovie-wait', 'webmovie-punch');
        el.classList.add('webmovie-done');
        cleanStyle(el, ['--webmovie-delay', '--webmovie-step', '--webmovie-dur', '--webmovie-ink', 'min-inline-size']);
        el.dispatchEvent(new CustomEvent('webmovie:done', { bubbles: true }));
    }

    function reset(el) {
        const s = states.get(el);
        if (!s) return;
        finish(el);
        s.played = false;
        el.classList.remove('webmovie-done');
        el.classList.add('webmovie-wait');
        if (io && (el.dataset.webmovieTrigger || 'view') === 'view' && !el.closest('[data-webmovie-picture]')) io.observe(el); // plays again when it next enters the view
    }

    function replay(el) {
        if (el.matches?.('[data-webmovie-picture]')) {
            // the whole picture from its first frame: every layer at once, each on its own delay
            layers(el).forEach((l) => {
                finish(l);
                play(l);
            });
            pictures.set(el, 'played');
            restartSpotlights(el);
            return;
        }
        const s = states.get(el);
        if (!s) return spotted.has(el) && restartSpotlights(el);
        if (s.playing) return;
        finish(el);
        play(el);
        restartSpotlights(el);
    }

    // Picture movie (data-webmovie-picture): a still illustration split into a background plate and cut-out layers.
    // Its layers are one shot list on one clock — they start together when the picture is ≥ 25 % in view, each after its own
    // data-webmovie-delay, without the reading-order cascade (a layer's timing is the director's, not the DOM's).
    const pictures = new WeakMap(); // picture → 'waiting' | 'played'
    const layers = (pic) => Array.from(pic.querySelectorAll('[data-webmovie]')).filter((l) => l.closest('[data-webmovie-picture]') === pic);
    // data-webmovie-autoplay="off" on the picture: it stands as the original picture until its replay button (or webmovie.replay).
    function picture(pic, el) {
        if (pic.dataset.webmovieAutoplay === 'off' && !pictures.get(pic)) return finish(el);
        const state = pictures.get(pic);
        if (state === 'played') return play(el); // a layer added after the start plays at once
        if (state) return;
        pictures.set(pic, 'waiting');
        const go = () => {
            pictures.set(pic, 'played');
            layers(pic).forEach((l) => play(l));
        };
        if (!io) return void requestAnimationFrame(go);
        new IntersectionObserver((entries, o) => {
            if (!entries.some((e) => e.isIntersecting)) return;
            o.disconnect();
            go();
        }, { threshold: 0.25 }).observe(pic);
    }

    // Impact sparks: data-webmovie-burst="12" throws decoration out of the element as it lands (data-webmovie-burst-at="ms",
    // colors from the CSS variable --webmovie-burst — a comma list — or the text color). aria-hidden, no text, removed after ~1 s:
    // the final frame stays the plain HTML. Never in reduced motion or in a frozen frame.
    function burst(el, at) {
        if (freeze !== null || reduce.matches) return;
        const n = Math.min(40, num(el.dataset.webmovieBurst) || 12);
        setTimeout(() => {
            const r = el.getBoundingClientRect();
            if (!r.width && !r.height) return;
            const host = el.offsetParent || doc.body;
            const h = host.getBoundingClientRect();
            const box = doc.createElement('span');
            box.className = 'webmovie-sparks';
            box.setAttribute('aria-hidden', 'true');
            box.style.left = `${r.left - h.left - host.clientLeft + host.scrollLeft + r.width / 2}px`;
            box.style.top = `${r.top - h.top - host.clientTop + host.scrollTop + r.height / 2}px`;
            const cs = getComputedStyle(el);
            const colors = (cs.getPropertyValue('--webmovie-burst').trim() || cs.color).split(/,(?![^(]*\))/).map((c) => c.trim());
            const reach = Math.max(56, Math.min(220, Math.max(r.width, r.height) * 0.95));
            for (let i = 0; i < n; i++) {
                const a = (i / n) * Math.PI * 2 + rnd(i, 4) * 0.35;
                const d = reach * (0.55 + 0.45 * (rnd(i, 5) + 1) / 2);
                const p = doc.createElement('i');
                p.style.setProperty('--tx', `${(Math.cos(a) * d).toFixed(1)}px`);
                p.style.setProperty('--ty', `${(Math.sin(a) * d).toFixed(1)}px`);
                p.style.setProperty('--ang', `${((a * 180) / Math.PI + 90).toFixed(0)}deg`);
                p.style.setProperty('--sz', `${(6 + 5 * (rnd(i, 6) + 1)).toFixed(1)}px`);
                p.style.setProperty('--life', `${Math.round(650 + 250 * (rnd(i, 7) + 1) / 2)}ms`);
                p.style.setProperty('--c', colors[i % colors.length]);
                box.append(p);
            }
            host.append(box);
            setTimeout(() => box.remove(), 1100);
        }, Math.max(0, at));
    }

    const cascade = () => ms(getComputedStyle(doc.documentElement).getPropertyValue('--webmovie-cascade')) || 100;
    const byDom = (a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1);
    // Elements that come into view together cascade in reading order (--webmovie-cascade apart) instead of all at once.
    const io = 'IntersectionObserver' in window && new IntersectionObserver((entries) => {
        const gap = cascade();
        entries.filter((e) => e.isIntersecting).map((e) => e.target).sort(byDom).forEach((el, k) => {
            if (!el.hasAttribute('data-webmovie-repeat')) io.unobserve(el);
            // A direct anchor may have finished this shot before its queued view callback.
            if (states.get(el)?.played && !el.hasAttribute('data-webmovie-repeat')) return;
            play(el, k * gap);
        });
        entries.filter((e) => !e.isIntersecting && e.target.hasAttribute('data-webmovie-repeat')).forEach((e) => {
            const s = states.get(e.target);
            if (s && (s.played || s.playing)) reset(e.target);
        });
    }, { rootMargin: '0px 0px -8% 0px' });

    function prepare(el) {
        if (states.has(el)) return;
        states.set(el, {});
        if (getComputedStyle(el).direction === 'rtl') el.classList.add('webmovie-rtl');
        el.classList.add('webmovie-ready');
        if (reduce.matches) {
            el.classList.add('webmovie-done'); // reduced motion: the final frame, nothing moves
            return;
        }
        if (el.closest('[data-webmovie-player] > :is(.webmovie-scene, [data-webmovie-scene])')) {
            el.classList.add('webmovie-wait'); // its movie plays it when the scene starts
            return;
        }
        const pic = el.closest('[data-webmovie-picture]');
        if (pic) {
            el.classList.add('webmovie-wait'); // its picture plays it together with the other layers
            if (freeze !== null) {
                if (frozen) bake([el]);
                return;
            }
            picture(pic, el);
            return;
        }
        const trigger = el.dataset.webmovieTrigger || 'view';
        if (trigger === 'hover') {
            el.addEventListener('pointerenter', () => replay(el));
            el.addEventListener('focusin', () => replay(el));
            if (freeze === null) return;
        }
        if (trigger === 'click') {
            el.addEventListener('click', () => replay(el));
            if (freeze === null) return;
        }
        el.classList.add('webmovie-wait');
        if (freeze !== null) {
            if (frozen) bake([el]); // added after the freeze (an ig-lines svg, an Alpine row): freeze it on its own
            return; // freezeAll() plays everything at once
        }
        if (trigger === 'load' || (trigger === 'view' && !io)) play(el);
        else if (trigger === 'view') io.observe(el);
    }

    // Rotating words: every word is in the HTML (SEO, translation); one is shown at a time, a few rounds, then it rests on the first.
    function rotator(el) {
        if (states.has(el)) return;
        states.set(el, {});
        const items = Array.from(el.children);
        if (items.length < 2) return;
        for (const n of Array.from(el.childNodes)) {
            if (n.nodeType !== Node.TEXT_NODE) continue;
            const sep = doc.createElement('span');
            sep.className = 'webmovie-sep';
            n.replaceWith(sep);
            sep.append(n);
        }
        el.classList.add('webmovie-rotating');
        items.forEach((it, k) => {
            if (k) it.setAttribute('aria-hidden', 'true');
            else it.classList.add('webmovie-on');
        });
        if (reduce.matches || freeze !== null) return;
        const hold = num(el.dataset.webmovieHold) ?? 2200;
        const loops = num(el.dataset.webmovieLoops) ?? 3;
        let i = 0;
        let turns = 0;
        let paused = false;
        let visible = false;
        el.addEventListener('pointerenter', () => (paused = true));
        el.addEventListener('pointerleave', () => (paused = false));
        el.addEventListener('focusin', () => (paused = true));
        el.addEventListener('focusout', () => (paused = false));
        if (io) new IntersectionObserver(([e]) => (visible = e.isIntersecting)).observe(el);
        else visible = true;
        const tick = () => {
            if (!el.isConnected) return;
            if (!paused && visible && !doc.hidden) {
                const cur = items[i];
                i = (i + 1) % items.length;
                const next = items[i];
                cur.classList.remove('webmovie-on');
                cur.classList.add('webmovie-off');
                cur.setAttribute('aria-hidden', 'true');
                next.classList.remove('webmovie-off');
                next.classList.add('webmovie-on');
                next.removeAttribute('aria-hidden');
                if (i === 0 && ++turns >= loops) return; // WCAG 2.2.2: it stops by itself
            }
            setTimeout(tick, hold);
        };
        setTimeout(tick, hold);
    }

    // Spotlight (data-webmovie-spotlight="pop|tada|jelly|hop|glow|ripple …"): a text-heavy block keeps the eye on its key texts.
    // After every member has entered (no .webmovie-wait/.webmovie-in on it or above it), one member at a time gets a cue — a short
    // emphasis that starts and ends at the natural state — then the next, in DOM order, for data-webmovie-loops rounds (2), then
    // nothing moves (WCAG 2.2.2). Members: [data-webmovie-cue] inside (else the children); a member's own data-webmovie-cue="…"
    // overrides the block's cue list. ripple splits the member into letters (words for joined scripts) and puts the same text nodes
    // back; data-webmovie-cue-with="id …" cues partner elements with it (a marker, an icon). Paused off-screen, in a hidden tab, on
    // hover or focus inside; never in reduced motion or a frozen frame. A hidden member (display: none) still cues its partners.
    const CUES = ['pop', 'tada', 'jelly', 'hop', 'glow'];
    const spotlights = new Set();
    const spotted = new WeakSet(); // a spotlight block may also have its own entrance (data-webmovie="stagger")
    function spotlight(root) {
        if (spotted.has(root) || reduce.matches || freeze !== null) return;
        spotted.add(root);
        const hold = num(root.dataset.webmovieHold) ?? 1700;
        const loops = num(root.dataset.webmovieLoops) ?? 2;
        const wait = num(root.dataset.webmovieDelay) ?? 700;
        const marked = () => Array.from(root.querySelectorAll('[data-webmovie-cue]'));
        const members = () => (marked().length ? marked() : Array.from(root.children));
        const entering = (m) => !!m.closest('.webmovie-wait, .webmovie-in');
        let visible = !io, paused = false, timer = 0, i = 0, turns = 0, cur = null;
        const c = { root };
        const off = () => {
            if (!cur) return;
            cur.forEach((fn) => fn());
            cur = null;
        };
        const cue = (m) => {
            const names = (m.dataset.webmovieCue || root.dataset.webmovieSpotlight || 'pop').split(/\s+/);
            const whole = names.find((n) => CUES.includes(n));
            const partners = (m.dataset.webmovieCueWith || '').split(/\s+/).map((id) => id && doc.getElementById(id)).filter(Boolean);
            const shown = m.getClientRects().length > 0;
            const undo = [];
            const on = (el, cls) => {
                el.classList.remove('webmovie-cue-on', cls);
                void el.offsetWidth; // the same cue again restarts
                el.classList.add('webmovie-cue-on', cls);
                undo.push(() => el.classList.remove('webmovie-cue-on', cls));
            };
            if (shown && whole) on(m, `webmovie-cue-${whole}`);
            partners.forEach((p) => on(p, 'webmovie-cue-partner'));
            if (shown && names.includes('ripple')) {
                let mode = 'chars';
                if (JOINING.test(m.textContent)) mode = 'words';
                const parts = splitText(m, mode, langOf(m));
                const n = parts.pieces.length;
                const step = n > 1 ? Math.min(45, 800 / (n - 1)) : 0;
                parts.pieces.forEach((p, k) => setVar(p, '--i', k));
                setVar(m, '--webmovie-step', `${step}ms`);
                m.classList.add('webmovie-cue-split');
                undo.push(() => {
                    parts.restore();
                    m.classList.remove('webmovie-cue-split');
                    m.style.removeProperty('--webmovie-step');
                    if (!m.getAttribute('style')) m.removeAttribute('style');
                });
            }
            cur = undo;
            return shown || partners.length;
        };
        const tick = () => {
            timer = 0;
            if (!root.isConnected) return;
            const list = members();
            if (!list.length) return;
            if (paused || !visible || doc.hidden || list.some(entering)) {
                timer = setTimeout(tick, 400);
                return;
            }
            off();
            const m = list[i % list.length];
            i++;
            const acted = cue(m);
            setTimeout(off, 1300); // a cue is ≤ 1.2 s; the member is the plain HTML again before the next one
            if (i % list.length === 0 && ++turns >= loops) return;
            timer = setTimeout(tick, acted ? hold : 0);
        };
        c.restart = () => {
            clearTimeout(timer);
            off();
            i = 0;
            turns = 0;
            timer = setTimeout(tick, wait);
        };
        c.stop = () => {
            clearTimeout(timer);
            timer = 0;
            turns = loops;
            off();
        };
        root.addEventListener('pointerenter', () => (paused = true));
        root.addEventListener('pointerleave', () => (paused = false));
        root.addEventListener('focusin', () => (paused = true));
        root.addEventListener('focusout', () => (paused = false));
        if (io) new IntersectionObserver(([e]) => (visible = e.isIntersecting), { threshold: 0.3 }).observe(root);
        spotlights.add(c);
        timer = setTimeout(tick, wait);
    }
    const restartSpotlights = (el) => spotlights.forEach((c) => (c.root === el || c.root.contains(el) || el.contains(c.root)) && c.restart());

    // Movie: scenes that play one after another like a video, with play/pause and a progress bar. Every scene stays in the
    // HTML (SEO, translation); without JS or with reduced motion the scenes are simply the page, one after another.
    const readingTime = (el) => {
        const text = el.textContent;
        const seg = segmenter(langOf(el), 'word');
        const words = seg ? Array.from(seg.segment(text)).filter((w) => w.isWordLike).length : text.split(/\s+/).filter(Boolean).length;
        return Math.max(1500, words * 280); // ≈ 0.3 s per word, at least 1.5 s
    };
    const movies = new WeakMap();
    function movie(root) {
        if (movies.has(root) || reduce.matches) return;
        const scenes = Array.from(root.children).filter((c) => c.matches('.webmovie-scene, [data-webmovie-scene]'));
        if (!scenes.length) return;
        const st = { i: -1, playing: false, user: false, done: false, started: false, timer: 0, left: 0, endsAt: 0, round: 0 };
        // Labels are read every time: a language switch that changes data-label-* or the headings is picked up.
        const L = (key) => root.dataset[`label${key[0].toUpperCase()}${key.slice(1)}`] || { play: 'Play', pause: 'Pause', replay: 'Replay', scene: 'Scene' }[key];
        const name = (sc, k) => sc.querySelector('h1, h2, h3, h4, h5, h6')?.textContent.trim() || `${L('scene')} ${k + 1}`;
        const loops = num(root.dataset.webmovieLoops) ?? 0;
        const OUT = 600;
        root.classList.add('webmovie-player-on');
        scenes.forEach((sc) => { sc.classList.add('webmovie-scene'); sc.inert = true; });
        const bar = doc.createElement('div');
        bar.className = 'webmovie-controls';
        const toggle = doc.createElement('button');
        toggle.type = 'button';
        toggle.className = 'webmovie-toggle';
        const segs = scenes.map((sc, k) => {
            const b = doc.createElement('button');
            b.type = 'button';
            b.className = 'webmovie-seg';
            b.setAttribute('aria-label', name(sc, k));
            b.append(doc.createElement('span'));
            b.addEventListener('click', () => { st.user = false; go(k); });
            return b;
        });
        bar.append(toggle, ...segs);
        root.append(bar);
        const label = () => {
            const state = st.done ? 'replay' : st.playing ? 'pause' : 'play';
            toggle.dataset.state = state;
            toggle.setAttribute('aria-label', L(state));
            toggle.textContent = state === 'replay' ? '↻' : state === 'pause' ? '❚❚' : '▶';
        };
        const parts = (sc) => Array.from(sc.querySelectorAll('[data-webmovie]'));
        function show(k) {
            clearTimeout(st.timer);
            const prev = scenes[st.i];
            if (prev && prev !== scenes[k]) {
                parts(prev).forEach(finish); // the leaving scene shows its plain text while it fades out
                prev.classList.remove('webmovie-scene-on');
                prev.classList.add('webmovie-scene-off');
                prev.inert = true;
                setTimeout(() => {
                    prev.classList.remove('webmovie-scene-off');
                    if (!prev.classList.contains('webmovie-scene-on')) parts(prev).forEach(reset);
                }, OUT);
            }
            st.i = k;
            const sc = scenes[k];
            const els = parts(sc);
            const gap = cascade();
            const hold = num(sc.dataset.webmovieHold) ?? els.length * gap + 1400 + readingTime(sc);
            sc.inert = false;
            sc.classList.remove('webmovie-scene-off');
            sc.classList.add('webmovie-scene-on');
            setVar(sc, '--webmovie-scene-dur', `${hold}ms`);
            segs.forEach((b, j) => {
                b.classList.toggle('webmovie-seg-done', j < k);
                b.classList.toggle('webmovie-seg-on', j === k);
                setVar(b, '--webmovie-scene-dur', `${j === k ? hold : 0}ms`);
                b.setAttribute('aria-label', name(scenes[j], j));
                if (j === k) b.setAttribute('aria-current', 'step');
                else b.removeAttribute('aria-current');
            });
            const enter = prev && prev !== sc ? OUT / 2 : 0; // the next scene starts while the last one fades
            els.forEach((e) => { const s = states.get(e); if (s && (s.playing || s.played)) reset(e); });
            els.forEach((e, n) => play(e, enter + n * gap));
            st.left = hold + enter;
            st.endsAt = performance.now() + st.left;
            if (st.playing && freeze === null) st.timer = setTimeout(next, st.left);
        }
        function next() {
            if (st.i < scenes.length - 1) show(st.i + 1);
            else if (st.round < loops) { st.round++; show(0); }
            else {
                st.playing = false;
                st.done = true;
                root.classList.add('webmovie-player-end');
                segs[st.i].classList.add('webmovie-seg-done');
                label();
            }
        }
        function go(k) {
            st.done = false;
            st.playing = true;
            st.started = true;
            root.classList.remove('webmovie-player-end', 'webmovie-player-paused');
            show(k);
            label();
        }
        function pause(user) {
            if (!st.playing) return;
            if (user) st.user = true;
            st.playing = false;
            clearTimeout(st.timer);
            st.left = Math.max(0, st.endsAt - performance.now());
            root.classList.add('webmovie-player-paused');
            label();
        }
        function resume(user) {
            if (st.playing || (!user && st.user)) return;
            if (user) st.user = false;
            if (st.done || !st.started) { st.round = 0; go(0); return; }
            st.playing = true;
            root.classList.remove('webmovie-player-paused');
            st.endsAt = performance.now() + st.left;
            st.timer = setTimeout(next, st.left);
            label();
        }
        toggle.addEventListener('click', () => (st.playing ? pause(true) : resume(true)));
        movies.set(root, { pause: () => pause(true), resume: () => resume(true), go: (k) => { st.user = false; go(k || 0); } });
        if (freeze !== null) {
            const k = Math.min(scenes.length - 1, Math.max(0, parseInt(query.get('webmovie-scene'), 10) || 0));
            st.started = true;
            st.i = -1;
            show(k); // ?webmovie-t=…&webmovie-scene=k freezes that scene
            label();
            return;
        }
        // data-webmovie-autoplay="off": the first scene stands still (plain HTML) until the reader presses play.
        if (root.dataset.webmovieAutoplay === 'off') {
            st.user = true;
            scenes[0].classList.add('webmovie-scene-on');
            scenes[0].inert = false;
            parts(scenes[0]).forEach(finish);
        }
        label();
        // Plays while it is on screen and the tab is visible; the pause button wins over both (WCAG 2.2.2).
        let visible = false;
        const sync = () => (visible && !doc.hidden ? resume(false) : pause(false));
        if (io) new IntersectionObserver(([e]) => { visible = e.isIntersecting; sync(); }, { threshold: 0.35 }).observe(root);
        else { visible = true; sync(); }
        doc.addEventListener('visibilitychange', sync);
    }

    function refresh(root = doc) {
        if (root.nodeType !== Node.ELEMENT_NODE && root !== doc) return;
        if (root.matches?.('[data-webmovie]')) prepare(root);
        if (root.matches?.('[data-webmovie-rotate]')) rotator(root);
        root.querySelectorAll('[data-webmovie]').forEach(prepare);
        root.querySelectorAll('[data-webmovie-rotate]').forEach(rotator);
        if (root.matches?.('[data-webmovie-spotlight]')) spotlight(root);
        root.querySelectorAll('[data-webmovie-spotlight]').forEach(spotlight);
        if (root.matches?.('[data-webmovie-player]')) movie(root);
        root.querySelectorAll('[data-webmovie-player]').forEach(movie);
    }

    const BAKE = ['opacity', 'translate', 'scale', 'rotate', 'filter', 'clip-path', 'background-position', 'background-size', 'stroke-dashoffset', 'font-weight', 'box-shadow', 'mask-position', '-webkit-mask-position'];
    // Play the elements at t and bake the frame into inline styles, then drop the animations: a paused animation inside the
    // viewport may keep its old compositor frame in a (headless) screenshot, a plain style always paints what getComputedStyle says.
    let frozen = false;
    async function bake(els) {
        els.forEach((el) => {
            if (!el.closest('.webmovie-player-on .webmovie-scene:not(.webmovie-scene-on)')) play(el);
        });
        await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
        const frames = doc.getAnimations()
            .filter((a) => a.effect?.target instanceof Element && els.some((el) => el.contains(a.effect.target)) && a.effect.target.closest('.webmovie-in'))
            .map((a) => {
                const cs = getComputedStyle(a.effect.target);
                return [a, a.effect.target, BAKE.map((p) => [p, cs.getPropertyValue(p)])];
            });
        frames.forEach(([a, target, values]) => {
            a.cancel();
            values.forEach(([p, v]) => target.style.setProperty(p, v, 'important'));
        });
    }
    async function freezeAll() {
        if (doc.fonts) await doc.fonts.ready;
        const waiting = [...doc.querySelectorAll('.webmovie-wait')];
        frozen = true; // from now on prepare() bakes late elements itself
        await bake(waiting);
        window.__webmovieReady = true;
    }

    function init() {
        refresh(doc);
        new MutationObserver((list) => {
            for (const m of list) {
                for (const n of m.addedNodes) {
                    if (n.nodeType === Node.ELEMENT_NODE && !n.classList.contains('webmovie-word') && !n.classList.contains('webmovie-sep')) refresh(n);
                }
            }
        }).observe(doc.body, { childList: true, subtree: true });
        // <button data-webmovie-replay> inside a picture (or data-webmovie-replay="<id>" anywhere) plays it again
        doc.addEventListener('click', (e) => {
            const b = e.target.closest?.('[data-webmovie-replay]');
            const target = b && (b.dataset.webmovieReplay ? doc.getElementById(b.dataset.webmovieReplay) : b.closest('[data-webmovie-picture]'));
            if (target) replay(target);
        });
        if (freeze !== null) freezeAll();
        else window.__webmovieReady = true;
    }

    // pause/resume/go act on a [data-webmovie-player] element.
    window.webmovie = {
        play: (el) => play(el), replay, reset, finish, refresh,
        stopSpotlights: () => spotlights.forEach((c) => c.stop()), // every cue back to the plain HTML (scripts/check.mjs)
        pause: (el) => movies.get(el)?.pause(), resume: (el) => movies.get(el)?.resume(), go: (el, k) => movies.get(el)?.go(k),
    };
    if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', init, { once: true });
    else init();
})();
