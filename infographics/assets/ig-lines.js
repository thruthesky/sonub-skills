/*
 * ig-lines.js — draw connector lines (curve · straight · diagonal · elbow) between real HTML elements.
 * No build step, no dependency. Lines are redrawn whenever the layout changes (resize, fonts, wrapping, RTL).
 *
 * Markup
 *   <div data-ig-lines data-ig-motion="wipe"> … </div>
 *       A container. Its lines go into one <svg class="ig-svg"> drawn behind its content. data-ig-motion = a webmovie shot
 *       for that svg (copied to its data-webmovie): "wipe" draws the lines in along the reading direction (RTL mirrored),
 *       "fade" fades them in. Without webmovie, without JS or with reduced motion the lines simply show. Lines are redrawn
 *       when a webmovie shot ends (webmovie:done), so boxes that moved in (stagger, rise) get lines on their final place.
 *   <div id="a" data-ig-to="b c:dash d:arrow" data-ig-shape="curve" data-ig-class="is-kids" data-ig-from="end">
 *       One line from #a to each listed id. Flags after ":" — dash (dashed line), arrow (arrowhead at the target).
 *       A target's data-ig-in-class is added to the lines that end at it (a fork whose branches take each path's color).
 *   <ol data-ig-chain data-ig-class="is-kids"> <li>…</li> <li data-ig-dash>…</li> </ol>
 *       Lines between consecutive children, in order (stations on a route). A child with data-ig-dash gets a
 *       dashed line into it. Same row → straight (or curve); where the row wraps → a Z along the gap between rows.
 *   <ol data-ig-tree="start-id" data-ig-class="is-trunk"> <li data-ig-class="is-kids">…</li> … </ol>
 *       A trunk with branches: ONE line down the list's start gutter (its padding-inline-start) from #start-id (or the
 *       list's top) to the last child, a short branch into each child at its middle (child's data-ig-class, dashed with
 *       data-ig-dash) and a node (svg circle.ig-node) on the trunk at each branch. Use it for "one start → many options"
 *       stacked in a column instead of a bundle of parallel lanes: one trunk never crowds, branches sit a card apart.
 *
 * Shapes
 *   curve     cubic Bézier leaving and entering at right angles — forks (1 → N), merges (N → 1), soft flows
 *   straight  a straight segment between the facing edges — order along a row or column
 *   diagonal  a straight segment between the centres' facing corners — cross relations, shortcuts
 *   elbow     right-angled with rounded corners — trees, a trunk with branches, org charts
 *
 * Anchors are picked from the real boxes: a target straight below (overlapping horizontally) leaves from the bottom and
 * enters at the top; any other target leaves from the facing side. A forced vertical start (from = bottom) whose target
 * sits beside the run goes down and turns into the target's near side (a trunk with branches). data-ig-from = top | bottom | start | end | bottom-start forces the source side
 * ("start"/"end" follow the writing direction, so RTL mirrors by itself).
 * The CSS custom properties --ig-shape and --ig-from override the attributes — switch them in a container query
 * (e.g. a fork of curves on wide screens becomes a trunk of elbows on a phone).
 *
 * Styling is CSS only: every path gets class "ig-line" + data-ig-class (+ "is-dashed", "ig-arrow", "ig-trunk"); tree nodes are
 * circle.ig-node + the child's data-ig-class (style fill/stroke/r in CSS).
 *   .ig-line { stroke: …; stroke-width: …; fill: none }   — give each class its color; dark themes just work.
 * Lines are aria-hidden: the same facts must also be in the HTML text (a legend, "(optional)", an ordered list).
 */
(() => {
    const NS = 'http://www.w3.org/2000/svg';
    const R = 10; // elbow corner radius

    const rectIn = (el, box) => {
        const r = el.getBoundingClientRect();
        const x = r.left - box.left, y = r.top - box.top;
        return { x, y, w: r.width, h: r.height, cx: x + r.width / 2, cy: y + r.height / 2, r: x + r.width, b: y + r.height };
    };

    // Which sides to join: vertical only when the boxes overlap horizontally (one above the other), otherwise the
    // facing sides — so a column of sources fanning out to a column of targets never leaves from the bottom.
    function anchors(a, b, from, rtl) {
        const overlapX = b.x < a.r - 2 && b.r > a.x + 2;
        let side = overlapX ? (b.cy >= a.cy ? 'bottom' : 'top') : (b.cx >= a.cx ? 'right' : 'left');
        if (from) {
            const map = { start: rtl ? 'right' : 'left', end: rtl ? 'left' : 'right', top: 'top', bottom: 'bottom', 'bottom-start': 'bottom-start' };
            side = map[from] || side;
        }
        const p = { top: [a.cx, a.y], bottom: [a.cx, a.b], left: [a.x, a.cy], right: [a.r, a.cy], 'bottom-start': [rtl ? a.r - 20 : a.x + 20, a.b] }[side];
        const vertical = side === 'top' || side === 'bottom' || side === 'bottom-start';
        let q;
        if (vertical) {
            // Entering a box that sits beside the vertical run (a trunk with branches): enter from its near side.
            const beside = p[0] < b.x - 4 || p[0] > b.r + 4;
            q = beside ? [p[0] < b.x ? b.x : b.r, b.cy] : [b.cx, side === 'top' ? b.b : b.y];
            return { p, q, vertical, beside };
        }
        q = [side === 'right' ? b.x : b.r, b.cy];
        return { p, q, vertical, beside: false };
    }

    function pathFor(shape, a, b, from, rtl) {
        const { p, q, vertical, beside } = anchors(a, b, from, rtl);
        const [x1, y1] = p, [x2, y2] = q;
        if (shape === 'straight' || shape === 'diagonal') return { d: `M${x1} ${y1}L${x2} ${y2}`, end: [x2, y2], dir: [x2 - x1, y2 - y1] };
        if (shape === 'elbow') {
            if (vertical && beside) { // down the trunk, then across into the box
                const sy = Math.sign(y2 - y1) || 1, sx = Math.sign(x2 - x1) || 1, r = Math.min(R, Math.abs(y2 - y1), Math.abs(x2 - x1));
                return { d: `M${x1} ${y1}V${y2 - sy * r}Q${x1} ${y2} ${x1 + sx * r} ${y2}H${x2}`, end: [x2, y2], dir: [sx, 0] };
            }
            if (vertical) { // down, across at the middle, down
                const m = (y1 + y2) / 2, sy = Math.sign(y2 - y1) || 1, sx = Math.sign(x2 - x1), r = Math.min(R, Math.abs(x2 - x1) / 2, Math.abs(y2 - y1) / 2);
                if (!sx || r < 1) return { d: `M${x1} ${y1}L${x2} ${y2}`, end: [x2, y2], dir: [0, sy] };
                return { d: `M${x1} ${y1}V${m - sy * r}Q${x1} ${m} ${x1 + sx * r} ${m}H${x2 - sx * r}Q${x2} ${m} ${x2} ${m + sy * r}V${y2}`, end: [x2, y2], dir: [0, sy] };
            }
            const m = (x1 + x2) / 2, sx = Math.sign(x2 - x1) || 1, sy = Math.sign(y2 - y1), r = Math.min(R, Math.abs(y2 - y1) / 2, Math.abs(x2 - x1) / 2);
            if (!sy || r < 1) return { d: `M${x1} ${y1}L${x2} ${y2}`, end: [x2, y2], dir: [sx, 0] };
            return { d: `M${x1} ${y1}H${m - sx * r}Q${m} ${y1} ${m} ${y1 + sy * r}V${y2 - sy * r}Q${m} ${y2} ${m + sx * r} ${y2}H${x2}`, end: [x2, y2], dir: [sx, 0] };
        }
        // curve
        if (vertical && beside) {
            return { d: `M${x1} ${y1}C${x1} ${(y1 + y2) / 2} ${x1} ${y2} ${x2} ${y2}`, end: [x2, y2], dir: [x2 - x1, 0] };
        }
        if (vertical) {
            const k = Math.max(Math.abs(y2 - y1) / 2, 12);
            const s = y2 >= y1 ? 1 : -1;
            return { d: `M${x1} ${y1}C${x1} ${y1 + s * k} ${x2} ${y2 - s * k} ${x2} ${y2}`, end: [x2, y2], dir: [0, s] };
        }
        const k = Math.max(Math.abs(x2 - x1) / 2, 12);
        const s = x2 >= x1 ? 1 : -1;
        return { d: `M${x1} ${y1}C${x1 + s * k} ${y1} ${x2 - s * k} ${y2} ${x2} ${y2}`, end: [x2, y2], dir: [s, 0] };
    }

    // A chain wraps like text: same row → straight between facing sides; next row → a Z that runs along the gap
    // between the rows (down from the last item, across, down into the first item) so it never hides behind items.
    function chainPath(shape, a, b, rtl) {
        const sameRow = Math.abs(a.cy - b.cy) < Math.min(a.h, b.h) / 2;
        if (sameRow) return pathFor(shape === 'curve' ? 'curve' : 'straight', a, b, null, rtl);
        const x1 = a.cx, y1 = a.b, x2 = b.cx, y2 = b.y, m = (y1 + y2) / 2;
        const sy = Math.sign(y2 - y1) || 1, sx = Math.sign(x2 - x1), r = Math.min(R, Math.abs(x2 - x1) / 2, Math.abs(y2 - y1) / 2);
        if (!sx || r < 1) return { d: `M${x1} ${y1}L${x2} ${y2}` };
        return { d: `M${x1} ${y1}V${m - sy * r}Q${x1} ${m} ${x1 + sx * r} ${m}H${x2 - sx * r}Q${x2} ${m} ${x2} ${m + sy * r}V${y2}` };
    }

    function arrowHead(end, dir) {
        const len = Math.hypot(dir[0], dir[1]) || 1, ux = dir[0] / len, uy = dir[1] / len, s = 7;
        const [x, y] = end;
        return `M${x - ux * s - uy * s * 0.6} ${y - uy * s + ux * s * 0.6}L${x} ${y}L${x - ux * s + uy * s * 0.6} ${y - uy * s - ux * s * 0.6}`;
    }

    // A CSS custom property wins over the data attribute, so a container query can switch the shape on narrow screens.
    const prop = (el, name) => getComputedStyle(el).getPropertyValue(name).trim();

    function add(svg, cls, d) {
        const path = document.createElementNS(NS, 'path');
        path.setAttribute('class', cls);
        path.setAttribute('d', d);
        svg.appendChild(path);
    }

    function addNode(svg, cls, x, y) {
        const c = document.createElementNS(NS, 'circle');
        c.setAttribute('class', cls);
        c.setAttribute('cx', x);
        c.setAttribute('cy', y);
        c.setAttribute('r', 7);
        svg.appendChild(c);
    }

    function draw(box) {
        let svg = box.querySelector(':scope > svg.ig-svg');
        if (!svg) {
            svg = document.createElementNS(NS, 'svg');
            svg.setAttribute('class', 'ig-svg');
            svg.setAttribute('aria-hidden', 'true');
            svg.setAttribute('focusable', 'false');
            if (box.dataset.igMotion) svg.setAttribute('data-webmovie', box.dataset.igMotion); // before prepend: webmovie sees it once
            Object.assign(svg.style, { position: 'absolute', top: '0', left: '0', zIndex: '-1', pointerEvents: 'none', overflow: 'visible' });
            box.prepend(svg);
            if (getComputedStyle(box).position === 'static') box.style.position = 'relative';
            box.style.isolation = 'isolate';
        }
        svg.replaceChildren();
        const br = box.getBoundingClientRect();
        svg.setAttribute('width', box.scrollWidth);
        svg.setAttribute('height', box.scrollHeight);
        if (!box.offsetParent && getComputedStyle(box).display === 'none') return;
        const rtl = getComputedStyle(box).direction === 'rtl';
        const origin = { left: br.left + box.clientLeft, top: br.top + box.clientTop };
        const visible = (el) => el && el.getClientRects().length > 0;

        for (const src of box.querySelectorAll('[data-ig-to]')) {
            if (!visible(src)) continue;
            const a = rectIn(src, origin);
            for (const token of src.dataset.igTo.trim().split(/\s+/)) {
                const [id, ...flags] = token.split(':');
                const dst = document.getElementById(id);
                if (!visible(dst)) continue;
                const { d, end, dir } = pathFor(prop(src, '--ig-shape') || src.dataset.igShape || 'curve', a, rectIn(dst, origin), prop(src, '--ig-from') || src.dataset.igFrom, rtl);
                const cls = ['ig-line', src.dataset.igClass || '', dst.dataset.igInClass || '', flags.includes('dash') ? 'is-dashed' : ''].join(' ').replace(/\s+/g, ' ').trim();
                add(svg, cls, d);
                if (flags.includes('arrow')) add(svg, `${cls} ig-arrow`, arrowHead(end, dir));
            }
        }
        for (const chain of box.querySelectorAll('[data-ig-chain]')) {
            const items = [...chain.children].filter(visible);
            for (let i = 1; i < items.length; i++) {
                const { d } = chainPath(prop(chain, '--ig-shape') || chain.dataset.igShape, rectIn(items[i - 1], origin), rectIn(items[i], origin), rtl);
                add(svg, ['ig-line', chain.dataset.igClass || '', items[i].hasAttribute('data-ig-dash') ? 'is-dashed' : ''].join(' ').trim(), d);
            }
        }
        for (const tree of box.querySelectorAll('[data-ig-tree]')) drawTree(svg, tree, origin, rtl, visible);
    }

    // Trunk with branches: the trunk runs in the middle of the gutter between the list's start edge and its children.
    function drawTree(svg, tree, origin, rtl, visible) {
        const items = [...tree.children].filter(visible);
        if (!items.length) return;
        const t = rectIn(tree, origin), boxes = items.map((el) => rectIn(el, origin));
        const x = rtl ? (t.r + boxes[0].r) / 2 : (t.x + boxes[0].x) / 2;
        const start = tree.dataset.igTree && document.getElementById(tree.dataset.igTree);
        const y0 = visible(start) ? rectIn(start, origin).cy : t.y;
        add(svg, ['ig-line', 'ig-trunk', tree.dataset.igClass || ''].join(' ').trim(), `M${x} ${y0}V${boxes[boxes.length - 1].cy}`);
        items.forEach((el, i) => {
            const b = boxes[i];
            add(svg, ['ig-line', el.dataset.igClass || '', el.hasAttribute('data-ig-dash') ? 'is-dashed' : ''].join(' ').replace(/\s+/g, ' ').trim(), `M${x} ${b.cy}H${rtl ? b.r : b.x}`);
        });
        items.forEach((el, i) => addNode(svg, ['ig-node', el.dataset.igClass || ''].join(' ').trim(), x, boxes[i].cy));
    }

    function boot() {
        const boxes = [...document.querySelectorAll('[data-ig-lines]')];
        if (!boxes.length) return;
        let queued = false;
        const redraw = () => {
            if (queued) return;
            queued = true;
            requestAnimationFrame(() => { queued = false; boxes.forEach(draw); });
        };
        const ro = new ResizeObserver(redraw);
        boxes.forEach((box) => {
            ro.observe(box);
            box.querySelectorAll('[data-ig-to], [data-ig-chain], [data-ig-chain] > *, [data-ig-tree], [data-ig-tree] > *').forEach((el) => ro.observe(el));
        });
        document.fonts?.ready.then(redraw);
        window.addEventListener('load', redraw);
        document.addEventListener('webmovie:done', redraw); // a shot moved a box (translate/scale) — end the lines on its final place
        redraw();
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
    else boot();
})();
