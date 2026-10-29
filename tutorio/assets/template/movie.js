// tutorio scene helpers (no build, no library):
// 1. aim — a cursor / focus ring with data-tut-to="<selector>" is placed on that element inside its .tut-stage,
//    and a stage with data-tut-zoom-to="<selector>" zooms toward it. Layout offsets are used (not getBoundingClientRect),
//    so an entrance animation in progress does not move the target.
// 2. progress — a thin bar at the bottom of every scene shows how far the tutorial is.
(() => {
    const pct = (v, of) => `${((v / of) * 100).toFixed(2)}%`;
    const box = (stage, sel) => {
        const target = stage.querySelector(sel);
        if (!target) return null;
        let x = 0, y = 0, n = target;
        while (n && n !== stage) { x += n.offsetLeft; y += n.offsetTop; n = n.offsetParent; }
        if (n !== stage || !stage.offsetWidth) return null;
        return { x, y, w: target.offsetWidth, h: target.offsetHeight, W: stage.offsetWidth, H: stage.offsetHeight };
    };
    const aim = () => {
        document.querySelectorAll('[data-tut-to]').forEach((el) => {
            const stage = el.closest('.tut-stage');
            const b = stage && box(stage, el.dataset.tutTo);
            if (!b) return;
            if (el.classList.contains('tut-cursor')) {
                el.style.setProperty('--x', pct(b.x + b.w * 0.55, b.W));
                el.style.setProperty('--y', pct(b.y + b.h * 0.6, b.H));
            } else {
                const pad = Math.max(6, b.h * 0.18);
                el.style.setProperty('--x', pct(b.x - pad, b.W));
                el.style.setProperty('--y', pct(b.y - pad, b.H));
                el.style.setProperty('--w', pct(b.w + pad * 2, b.W));
                el.style.setProperty('--h', pct(b.h + pad * 2, b.H));
            }
        });
        document.querySelectorAll('[data-tut-zoom-to]').forEach((stage) => {
            const b = box(stage, stage.dataset.tutZoomTo);
            if (!b) return;
            stage.style.setProperty('--zx', pct(b.x + b.w / 2, b.W));
            stage.style.setProperty('--zy', pct(b.y + b.h / 2, b.H));
        });
    };
    const progress = () => {
        const scenes = document.querySelectorAll('.webmovie-scene');
        scenes.forEach((scene, k) => {
            if (scene.querySelector(':scope > .tut-progress')) return;
            const bar = document.createElement('div');
            bar.className = 'tut-progress';
            bar.setAttribute('aria-hidden', 'true');
            bar.style.setProperty('--p', String((k + 1) / scenes.length));
            scene.append(bar);
        });
    };
    const start = () => { progress(); aim(); };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
    else start();
    addEventListener('resize', aim);
})();
