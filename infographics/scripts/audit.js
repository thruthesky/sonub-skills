/*
 * infographicAudit — finds mechanical defects in an HTML infographic.
 * Runs inside the page. scripts/check.mjs injects it; you can also paste this file into DevTools
 * (or a browser tool's JavaScript runner) and call infographicAudit('main').
 *
 * Returns: { width, pageOverflowX, largestText[], blocks[], clipped[], scrolledX[], brokenShort[], crowdedLines[], crowdedMarks[], hugEdges[], unlinkedNodes[], overlaps[], tinyText[], typeScale,
 *            equalCardRows[], lowContrast[], colors, visuals { images, imageShare, lines, longText[] }, motion { kit, shots, lineLayers, player }, imagesWithoutAlt }
 * motion = the webmovie skill on the page (required, SKILL.md "Step 0"): kit loaded, [data-webmovie] shots, ig-lines svgs with a shot, movie players.
 * Options: minTextPx (12), maxItems (30), longTextChars (140), lineSelector (CSS-drawn connectors to count as lines),
 *          minLineGap (12 — closer parallel lines are crowdedLines), minEdgeGap (14 — a line closer along a box edge is hugEdges).
 * It cannot judge whether the page is empty, boring or answers the right question — look at it.
 */
function infographicAudit(selector = 'body', options = {}) {
    const MIN_TEXT_PX = options.minTextPx ?? 12;
    const MAX_ITEMS = options.maxItems ?? 30;
    const root = document.querySelector(selector) || document.body;

    const describe = (el) => {
        if (!el || el.nodeType !== 1) return '';
        const cls = [...el.classList].slice(0, 2).map((c) => '.' + c).join('');
        const id = el.id ? '#' + el.id : '';
        const text = (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 50);
        return `${el.tagName.toLowerCase()}${id}${cls}${text ? ` "${text}"` : ''}`;
    };
    const shown = (el) => {
        for (let e = el; e && e.nodeType === 1; e = e.parentElement) {
            const s = getComputedStyle(e);
            if (s.display === 'none' || s.visibility === 'hidden' || s.visibility === 'collapse' || Number(s.opacity) === 0) return false;
            // visually-hidden helpers for screen readers (clip-path: inset(50%) / clip: rect(0 0 0 0))
            if (/inset\(50%\)/.test(s.clipPath) || /^rect\(0(px)?,? 0(px)?,? 0(px)?,? 0(px)?\)$/.test(s.clip)) return false;
            if (e.tagName === 'DETAILS' && !e.open && e !== el && !el.closest('summary')) return false;
        }
        const r = el.getBoundingClientRect();
        return r.width > 1 && r.height > 1;
    };
    const parseColor = (c) => {
        const m = c && c.match(/rgba?\(([^)]+)\)/);
        if (!m) return null;
        const p = m[1].split(/[\s,\/]+/).filter(Boolean).map(Number);
        return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
    };
    const over = (top, bottom) => ({
        r: top.r * top.a + bottom.r * (1 - top.a),
        g: top.g * top.a + bottom.g * (1 - top.a),
        b: top.b * top.a + bottom.b * (1 - top.a),
        a: 1,
    });
    const luminance = ({ r, g, b }) => {
        const ch = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
        return 0.2126 * ch(r) + 0.7152 * ch(g) + 0.0722 * ch(b);
    };
    const contrast = (a, b) => {
        const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
        return (l1 + 0.05) / (l2 + 0.05);
    };
    // Background behind an element: composite every translucent layer down to the first opaque one.
    // Returns null when a background image/gradient is in the way (unknown).
    const backgroundOf = (el) => {
        const layers = [];
        for (let e = el; e && e.nodeType === 1; e = e.parentElement) {
            const s = getComputedStyle(e);
            if (s.backgroundImage && s.backgroundImage !== 'none') return null;
            const c = parseColor(s.backgroundColor);
            if (c && c.a > 0) { layers.push(c); if (c.a >= 1) break; }
        }
        let bg = { r: 255, g: 255, b: 255, a: 1 };
        for (let i = layers.length - 1; i >= 0; i--) bg = over(layers[i], bg);
        return bg;
    };

    // 1. Text nodes and their line boxes
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
        acceptNode: (n) => (n.nodeValue.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT),
    });
    const owners = new Map(); // element → characters
    const lines = [];
    const range = document.createRange();
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
        const el = n.parentElement;
        if (!el || ['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE'].includes(el.tagName) || !shown(el)) continue;
        owners.set(el, (owners.get(el) || 0) + n.nodeValue.trim().length);
        range.selectNodeContents(n);
        for (const r of range.getClientRects()) {
            if (r.width > 1 && r.height > 1 && lines.length < 4000) lines.push({ node: n, el, r });
        }
    }

    // 2. Overlapping text — line boxes of different text nodes that cover each other
    const overlaps = [];
    lines.sort((a, b) => a.r.top - b.r.top);
    for (let i = 0; i < lines.length && overlaps.length < MAX_ITEMS; i++) {
        const a = lines[i];
        for (let j = i + 1; j < lines.length && lines[j].r.top < a.r.bottom; j++) {
            const b = lines[j];
            if (a.node === b.node) continue;
            const w = Math.min(a.r.right, b.r.right) - Math.max(a.r.left, b.r.left);
            const h = Math.min(a.r.bottom, b.r.bottom) - Math.max(a.r.top, b.r.top);
            if (w <= 0 || h <= 0) continue;
            const smaller = Math.min(a.r.width * a.r.height, b.r.width * b.r.height);
            if (w * h > Math.max(16, smaller * 0.3)) {
                overlaps.push({ a: describe(a.el), b: describe(b.el), area: Math.round(w * h) });
                break;
            }
        }
    }

    // 3. Clipped text — hidden overflow or ellipsis that cuts content
    const clipped = [];
    for (const el of [root, ...root.querySelectorAll('*')]) {
        if (clipped.length >= MAX_ITEMS) break;
        if (!el.textContent.trim() || !shown(el)) continue;
        const s = getComputedStyle(el);
        const hides = /hidden|clip/.test(s.overflowX + s.overflowY) || s.textOverflow === 'ellipsis' || Number(s.webkitLineClamp) > 0;
        if (!hides) continue;
        const r = el.getBoundingClientRect();
        if (r.width <= 2 || r.height <= 2) continue; // visually-hidden helpers
        if (el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1) {
            clipped.push({ el: describe(el), box: [Math.round(el.clientWidth), Math.round(el.clientHeight)], content: [el.scrollWidth, el.scrollHeight] });
        }
    }

    // 3b. Scrolled sideways — a box (often a table wrapper) whose content is wider than it and scrolls: the reader
    // sees part of a row and may never scroll. Pages with real data grids can accept it; an infographic should not.
    const scrolledX = [];
    for (const el of [root, ...root.querySelectorAll('*')]) {
        if (scrolledX.length >= MAX_ITEMS) break;
        if (!el.textContent.trim() || !shown(el)) continue;
        if (!/auto|scroll/.test(getComputedStyle(el).overflowX)) continue;
        if (el.scrollWidth > el.clientWidth + 1) scrolledX.push({ el: describe(el), box: el.clientWidth, content: el.scrollWidth });
    }

    // 3c. Broken short text — a number or badge ("10", "12단계", "#1") that wraps onto two lines. Happens when a fixed
    // circle or chip is squeezed by its flex row and overflow-wrap breaks inside the word; the second line often lands
    // outside the shape in the same color as the page (white on white) — invisible, and clipped[] cannot see it.
    const brokenShort = [];
    const shortWalker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    for (let n = shortWalker.nextNode(); n && brokenShort.length < MAX_ITEMS; n = shortWalker.nextNode()) {
        const t = n.textContent.trim();
        if (!t || t.length > 6 || /\s/.test(t) || !shown(n.parentElement)) continue;
        const range = document.createRange();
        range.selectNodeContents(n);
        const tops = new Set([...range.getClientRects()].filter((r) => r.width > 0).map((r) => Math.round(r.top)));
        if (tops.size > 1) brokenShort.push({ el: describe(n.parentElement), text: t });
    }

    // 4. Type scale, tiny text, contrast, colors
    const sizes = new Map();
    const textColors = new Map();
    const tinyText = [];
    const lowContrast = [];
    let totalChars = 0;
    for (const [el, chars] of owners) {
        const s = getComputedStyle(el);
        const r = el.getBoundingClientRect();
        if (r.width <= 1 || r.height <= 1) continue;
        const px = Math.round(parseFloat(s.fontSize) * 10) / 10;
        totalChars += chars;
        sizes.set(px, (sizes.get(px) || 0) + chars);
        textColors.set(s.color, (textColors.get(s.color) || 0) + chars);
        if (px < MIN_TEXT_PX && tinyText.length < MAX_ITEMS) tinyText.push({ el: describe(el), px });
        const fg = parseColor(s.color);
        const bg = backgroundOf(el);
        if (fg && bg && lowContrast.length < MAX_ITEMS) {
            const ratio = contrast(over(fg, bg), bg);
            const large = px >= 24 || (Number(s.fontWeight) >= 700 && px >= 18.66);
            if (ratio < (large ? 3 : 4.5)) lowContrast.push({ el: describe(el), ratio: Math.round(ratio * 100) / 100, px, large });
        }
    }
    const sorted = [...sizes.entries()].sort((a, b) => b[0] - a[0]);
    const body = [...sizes.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || 0;
    const levels = sorted.filter(([, c]) => c / (totalChars || 1) >= 0.01).length;
    const typeScale = {
        sizes: sorted.map(([px, chars]) => ({ px, share: Math.round((chars / (totalChars || 1)) * 1000) / 10 })),
        levels,
        bodyPx: body,
        titlePx: sorted[0]?.[0] || 0,
        titleToBody: body ? Math.round(((sorted[0]?.[0] || 0) / body) * 100) / 100 : 0,
    };

    // 5. Repeated equal cards — ≥ 3 siblings of the same kind (tag + class) and the same width, big enough
    //    to be content blocks, laid out as a grid (at least two side by side). Heights may differ (rows
    //    stretch to their content). Table rows and one-column stacks are not cards.
    const equalCardRows = [];
    for (const parent of [root, ...root.querySelectorAll('*')]) {
        if (equalCardRows.length >= MAX_ITEMS) break;
        if (['TABLE', 'THEAD', 'TBODY', 'TFOOT', 'TR'].includes(parent.tagName)) continue;
        const kids = [...parent.children].filter((c) => shown(c));
        if (kids.length < 3) continue;
        const groups = new Map();
        for (const k of kids) {
            const r = k.getBoundingClientRect();
            if (r.width < 120 || r.height < 80) continue;
            const key = `${k.tagName}.${[...k.classList].sort().join('.')}|${Math.round(r.width / 4)}`;
            const g = groups.get(key) || { w: r.width, hs: [], tops: [], n: 0 };
            g.n++; g.hs.push(Math.round(r.height)); g.tops.push(Math.round(r.top));
            groups.set(key, g);
        }
        const sideBySide = (g) => g.tops.some((t, i) => g.tops.some((u, j) => i !== j && Math.abs(t - u) <= 2));
        const big = [...groups.values()].find((g) => g.n >= 3 && sideBySide(g));
        if (big) equalCardRows.push({ parent: describe(parent).slice(0, 80), count: big.n, width: Math.round(big.w), heights: big.hs });
    }

    // 5b. Visuals — the must-haves. Pictures: img/canvas/video/background images of at least 48×48 px. Lines: stroked,
    // unfilled svg shapes (connectors from ig-lines.js or hand-made svg), plus anything matching options.lineSelector.
    // A page with images 0 or lines 0 is a document, not an infographic. Long text: blocks over longTextChars characters.
    const rootBox = root.getBoundingClientRect();
    const pictureEls = [];
    for (const el of [root, ...root.querySelectorAll('*')]) {
        if (!shown(el)) continue;
        const r = el.getBoundingClientRect();
        if (r.width < 48 || r.height < 48) continue;
        const isMedia = /^(IMG|CANVAS|VIDEO)$/.test(el.tagName);
        const bg = getComputedStyle(el).backgroundImage;
        if (isMedia || (bg && /url\(/.test(bg))) pictureEls.push({ el, r });
    }
    const lineEls = [...root.querySelectorAll('svg path, svg line, svg polyline')].filter((el) => {
        const s = getComputedStyle(el);
        const svgBox = el.ownerSVGElement?.getBoundingClientRect();
        return s.stroke !== 'none' && (s.fill === 'none' || el.tagName !== 'path') && svgBox && svgBox.width >= 48;
    });
    const extraLines = options.lineSelector ? root.querySelectorAll(options.lineSelector).length : 0;
    const longChars = options.longTextChars ?? 140;
    const longText = [];
    for (const el of root.querySelectorAll('p, li, dd, td, blockquote')) {
        if (longText.length >= MAX_ITEMS || !shown(el) || el.querySelector('p, li, dd, td')) continue;
        const n = (el.textContent || '').replace(/\s+/g, ' ').trim().length;
        if (n > longChars) longText.push({ el: describe(el), chars: n });
    }
    const visuals = {
        images: pictureEls.length,
        imageShare: Math.round((pictureEls.reduce((sum, { r }) => sum + r.width * r.height, 0) / ((rootBox.width * rootBox.height) || 1)) * 100),
        lines: lineEls.length + extraLines,
        longText,
    };

    // 5c. Crowded lines and marks. Lines that run side by side closer than minLineGap px (default 12) for 30px or more,
    // and small marks (dots, nodes, line sources up to 32px) that touch or overlap — the reader cannot tell which line
    // goes where (the /guide fork once had four lanes 10px apart and four start dots stacked on a picture corner).
    // Line ends are ignored (lines may meet at a node); identical overlapping segments count as one line.
    const MIN_GAP = options.minLineGap ?? 12;
    const lineName = (el) => (el.getAttribute('class') || el.tagName).trim().slice(0, 40);
    const sampled = lineEls.filter((el) => typeof el.getTotalLength === 'function').slice(0, 150).map((el) => {
        const len = el.getTotalLength(), m = el.getScreenCTM();
        if (!m || !len) return null;
        const pts = [];
        for (let at = 0; at <= len; at += 6) {
            const p = el.getPointAtLength(at);
            pts.push([m.a * p.x + m.c * p.y + m.e, m.b * p.x + m.d * p.y + m.f, at, len]);
        }
        const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
        return { el, pts, box: [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)] };
    }).filter(Boolean);
    const crowdedLines = [];
    for (let i = 0; i < sampled.length && crowdedLines.length < MAX_ITEMS; i++) {
        for (let j = i + 1; j < sampled.length && crowdedLines.length < MAX_ITEMS; j++) {
            const A = sampled[i], B = sampled[j];
            if (A.box[0] > B.box[2] + MIN_GAP || B.box[0] > A.box[2] + MIN_GAP || A.box[1] > B.box[3] + MIN_GAP || B.box[1] > A.box[3] + MIN_GAP) continue;
            let close = 0;
            for (const p of A.pts) {
                if (p[2] < 14 || p[3] - p[2] < 14) continue;
                if (B.pts.some((q) => q[2] >= 14 && q[3] - q[2] >= 14 && (() => { const d = Math.hypot(p[0] - q[0], p[1] - q[1]); return d > 0.5 && d < MIN_GAP; })())) close++;
            }
            if (close * 6 >= 30) crowdedLines.push({ a: lineName(A.el), b: lineName(B.el), sideBySidePx: close * 6 });
        }
    }
    // A line that runs along the edge of a box it connects (a chip, card, picture) closer than minEdgeGap px (default 14)
    // for 60px or more reads as a second border (the /guide route wrap lines once ran 11px under the chip edges).
    const EDGE_GAP = options.minEdgeGap ?? 14;
    const edgeBoxes = [...root.querySelectorAll('[data-ig-chain] > *, [data-ig-tree] > *, [data-ig-lines] img, [data-ig-lines] figure')]
        .map((el) => ({ el, r: el.getBoundingClientRect() })).filter(({ r }) => r.width > 0 && r.height > 0);
    const hugEdges = [];
    for (const A of sampled) {
        if (hugEdges.length >= MAX_ITEMS) break;
        for (const { el, r } of edgeBoxes) {
            if (A.box[0] > r.right + EDGE_GAP || A.box[2] < r.left - EDGE_GAP || A.box[1] > r.bottom + EDGE_GAP || A.box[3] < r.top - EDGE_GAP) continue;
            let near = 0;
            for (const p of A.pts) {
                if (p[2] < 14 || p[3] - p[2] < 14) continue;
                const dx = Math.max(r.left - p[0], 0, p[0] - r.right), dy = Math.max(r.top - p[1], 0, p[1] - r.bottom);
                const d = Math.hypot(dx, dy);
                if (d > 0.5 && d < EDGE_GAP) near++;
            }
            if (near * 6 >= 60) hugEdges.push({ line: lineName(A.el), box: describe(el) || el.tagName.toLowerCase(), alongPx: near * 6 });
        }
    }
    const markEls = [...root.querySelectorAll('svg circle, [data-ig-to], [data-ig-mark]')]
        .map((el) => ({ el, r: el.getBoundingClientRect() }))
        .filter(({ r }) => r.width > 0 && r.width <= 32 && r.height <= 32);
    const crowdedMarks = [];
    for (let i = 0; i < markEls.length && crowdedMarks.length < MAX_ITEMS; i++) {
        for (let j = i + 1; j < markEls.length; j++) {
            const a = markEls[i].r, b = markEls[j].r;
            const gap = Math.hypot(a.left + a.width / 2 - b.left - b.width / 2, a.top + a.height / 2 - b.top - b.height / 2) - (a.width + b.width) / 2;
            if (gap < 4) crowdedMarks.push({ a: describe(markEls[i].el) || lineName(markEls[i].el), b: describe(markEls[j].el) || lineName(markEls[j].el), gapPx: Math.round(gap) });
        }
    }

    // 5d. Unlinked nodes. Every item drawn on a chain or tree (a station, a path card) names something that has its own
    // page on the site — the item should link there (SKILL.md "Link every item"). Items without a link are listed so
    // the author can confirm each one really has no page (SONUB /guide: only the "group" step has none).
    const unlinkedNodes = [...root.querySelectorAll('[data-ig-chain] > *, [data-ig-tree] > *')]
        .filter((el) => !el.matches('a[href]') && !el.querySelector('a[href]'))
        .slice(0, MAX_ITEMS).map((el) => describe(el) || el.tagName.toLowerCase());

    // 6. Largest text — what a reader sees in the first 5 seconds
    const largestText = [...owners.keys()]
        .map((el) => ({ el, px: parseFloat(getComputedStyle(el).fontSize), top: el.getBoundingClientRect().top + window.scrollY }))
        .filter((x) => x.el.getBoundingClientRect().width > 1)
        .sort((a, b) => b.px - a.px || a.top - b.top)
        .slice(0, 5)
        .map((x) => ({ px: Math.round(x.px), text: (x.el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 80), firstScreen: x.top < window.innerHeight }));

    // 7. Blocks — share of each top-level block (descend through single wrappers), for the hero rule
    let level = root;
    for (let kids = [...level.children].filter(shown); kids.length === 1; kids = [...level.children].filter(shown)) level = kids[0];
    const rootRect = level.getBoundingClientRect();
    const screenArea = window.innerWidth * window.innerHeight;
    const blocks = [...level.children].filter(shown).map((el) => {
        const r = el.getBoundingClientRect();
        const top = r.top + window.scrollY;
        const visibleH = Math.max(0, Math.min(top + r.height, window.innerHeight) - Math.max(top, 0));
        return {
            el: describe(el).slice(0, 70),
            pageShare: Math.round(((r.width * r.height) / (rootRect.width * rootRect.height || 1)) * 100),
            firstScreenShare: Math.round(((Math.min(r.width, window.innerWidth) * visibleH) / screenArea) * 100),
        };
    }).sort((a, b) => b.pageShare - a.pageShare).slice(0, 8);

    const bgColors = new Set();
    for (const el of [root, ...root.querySelectorAll('*')]) {
        const c = getComputedStyle(el).backgroundColor;
        if (parseColor(c)?.a > 0 && shown(el)) bgColors.add(c);
    }

    return {
        width: window.innerWidth,
        pageOverflowX: document.documentElement.scrollWidth > window.innerWidth + 1,
        largestText,
        blocks,
        clipped,
        scrolledX,
        brokenShort,
        crowdedLines,
        crowdedMarks,
        hugEdges,
        unlinkedNodes,
        overlaps,
        tinyText,
        typeScale,
        equalCardRows,
        lowContrast,
        colors: {
            text: [...textColors.entries()].sort((a, b) => b[1] - a[1]).map(([c]) => c).slice(0, 12),
            textCount: textColors.size,
            backgroundCount: bgColors.size,
        },
        visuals,
        motion: {
            kit: document.documentElement.classList.contains('webmovie-js') || typeof window.webmovie === 'object',
            shots: root.querySelectorAll('[data-webmovie], [data-webmovie-player], [data-webmovie-rotate]').length,
            lineLayers: root.querySelectorAll('svg.ig-svg[data-webmovie]').length,
            player: root.querySelectorAll('[data-webmovie-player]').length,
        },
        imagesWithoutAlt: [...root.querySelectorAll('img')].filter((i) => !i.hasAttribute('alt')).length,
    };
}
