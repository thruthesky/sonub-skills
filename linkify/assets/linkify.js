/*!
 * linkify.js — copyable deep links for every section of a page (no dependencies, no build).
 *
 * Every heading (h2–h4 by default) and every element marked data-linkify-anchor gets a stable id
 * and a small link button. Clicking the button — or the heading itself — puts `page#id` in the
 * address bar, copies that address to the clipboard and shows "Link copied". Opening the address
 * later scrolls to the same place, below any sticky header, opening closed <details> and hidden
 * tabs on the way.
 *
 *   <link rel="stylesheet" href="/linkify/linkify.css">
 *   <script defer src="/linkify/linkify.js"
 *           data-root="main" data-levels="h2,h3,h4" data-header=".site-header"></script>
 *
 * Script attributes (all optional)
 *   data-root          where to look (CSS selector list). Default: [data-linkify], else main, else article, else body
 *   data-levels        headings that get a link. Default: h2,h3,h4
 *   data-blocks        other elements that get a link automatically, e.g. "p,li" (ids from a text hash)
 *   data-skip          never touch elements inside this. Default: nav, header, footer, aside, dialog, [data-linkify-skip]
 *   data-header        sticky header selector — its height becomes --linkify-offset (scroll lands below it)
 *   data-heading-click "false" — only the button copies; clicking the heading text does nothing
 *   data-history       "replace" (default — no hashchange, no extra Back stop) or "push"
 *   data-reveal-attr   attribute that marks hidden panels (tabs, steps). Default: data-linkify-reveal
 *   data-reveal-event  event sent to those panels so the page shows them. Default: linkify:reveal
 *   data-label-copy / data-label-copied / data-label-failed   button label and messages ({title} = heading text)
 *   data-auto          "false" — do nothing until Linkify.apply() is called
 *
 * Markup hooks
 *   <section data-linkify> … </section>        a root (several allowed)
 *   <p id="refund-rule" data-linkify-anchor>    this element gets a link too (keep the id stable!)
 *   <h2 data-linkify-skip>                      this heading gets none
 *   <div data-linkify-reveal="tab-2" hidden>    a hidden panel; the page listens for linkify:reveal and shows it
 *
 * API: Linkify.start() (only with data-auto="false") · Linkify.apply(el) after a re-render · Linkify.copy(id) · Linkify.go(id) · Linkify.idFor(text)
 * Events (bubble from the target): linkify:copy {id, url, ok} · linkify:go {id}
 */
(() => {
	if (window.Linkify) return;

	const script = document.currentScript;
	const attr = (name, fallback) => script?.getAttribute(`data-${name}`) ?? fallback;
	const config = {
		root: attr('root', ''),
		levels: attr('levels', 'h2,h3,h4'),
		blocks: attr('blocks', ''),
		skip: attr('skip', 'nav, header, footer, aside, dialog, [data-linkify-skip]'),
		header: attr('header', ''),
		headingClick: attr('heading-click', 'true') !== 'false',
		history: attr('history', 'replace'),
		revealAttr: attr('reveal-attr', 'data-linkify-reveal'),
		revealEvent: attr('reveal-event', 'linkify:reveal'),
		auto: attr('auto', 'true') !== 'false',
	};

	const LABELS = {
		en: { copy: 'Copy link to “{title}”', copied: 'Link copied', failed: 'Could not copy — the link is in the address bar' },
		ko: { copy: '“{title}” 링크 복사', copied: '링크를 복사했어요', failed: '복사하지 못했어요 — 주소창에 링크가 있어요' },
		ja: { copy: '「{title}」へのリンクをコピー', copied: 'リンクをコピーしました', failed: 'コピーできませんでした — リンクはアドレスバーにあります' },
		zh: { copy: '复制“{title}”的链接', copied: '链接已复制', failed: '无法复制 — 链接在地址栏中' },
	};
	const lang = (document.documentElement.lang || 'en').toLowerCase().split('-')[0];
	const base = LABELS[lang] || LABELS.en;
	const labels = {
		copy: attr('label-copy', base.copy),
		copied: attr('label-copied', base.copied),
		failed: attr('label-failed', base.failed),
	};

	const ICON = '<svg viewBox="0 0 24 24" width="1em" height="1em" aria-hidden="true" focusable="false"><path fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" d="M10 14a4.5 4.5 0 0 0 6.4 0l3.2-3.2a4.5 4.5 0 0 0-6.4-6.4l-1 1M14 10a4.5 4.5 0 0 0-6.4 0l-3.2 3.2a4.5 4.5 0 0 0 6.4 6.4l1-1"/></svg>';
	const INTERACTIVE = 'a, button, input, select, textarea, summary, label, [contenteditable], [role="button"], [tabindex]:not([tabindex="-1"])';
	const reduceMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

	/** Ids this script decorated (or found). Only these are handled when the page opens with a #hash. */
	const known = new Set();

	// ---- ids -------------------------------------------------------------------------------

	/** Heading text → id. Letters of every script are kept (설치-방법, café). Same text → same id, in every browser. */
	function idFor(text) {
		const slug = String(text)
			.normalize('NFKC')
			.toLowerCase()
			.replace(/[^\p{L}\p{M}\p{N}\s_-]+/gu, '')
			.trim()
			.replace(/[\s_]+/g, '-')
			.replace(/-+/g, '-')
			.replace(/^-|-$/g, '');
		return slug || 'section';
	}

	/** Short, stable hash for paragraphs (data-blocks). Same text → same id; edit the text and the id changes. */
	function hashId(text) {
		let h = 0x811c9dc5;
		for (const ch of String(text).replace(/\s+/g, ' ').trim()) {
			h ^= ch.codePointAt(0);
			h = Math.imul(h, 0x01000193) >>> 0;
		}
		return `p-${h.toString(36)}`;
	}

	function unique(id, el) {
		const base = /^\d/.test(id) ? `s-${id}` : id;
		let candidate = base;
		for (let n = 2; ; n++) {
			const other = document.getElementById(candidate);
			if (!other || other === el) return candidate;
			candidate = `${base}-${n}`;
		}
	}

	/** Visible text of a heading, without our own button or hidden parts. */
	function titleOf(el) {
		const copy = el.cloneNode(true);
		copy.querySelectorAll('.linkify-link, [aria-hidden="true"], .sr-only, .visually-hidden').forEach((n) => n.remove());
		return copy.textContent.replace(/\s+/g, ' ').trim();
	}

	// ---- decorate --------------------------------------------------------------------------

	function roots(scope) {
		if (scope && scope !== document) return [scope];
		if (config.root) return [...document.querySelectorAll(config.root)];
		const marked = [...document.querySelectorAll('[data-linkify]')];
		if (marked.length) return marked;
		const fallback = document.querySelector('main') || document.querySelector('article') || document.body;
		return fallback ? [fallback] : [];
	}

	function decorate(el, kind) {
		if (el.hasAttribute('data-linkified')) return;
		if (el.closest(config.skip)) return;
		if (el.closest('a, button')) return; // a heading inside a card link — a link inside a link is invalid
		const title = titleOf(el);
		if (!title && !el.id) return;

		if (!el.id) el.id = unique(kind === 'block' ? hashId(title) : idFor(title), el);
		known.add(el.id);
		el.setAttribute('data-linkified', kind);

		const link = document.createElement('a');
		link.className = 'linkify-link';
		link.href = `#${encodeURIComponent(el.id)}`;
		link.innerHTML = ICON;
		link.setAttribute('aria-label', labels.copy.replace('{title}', title.slice(0, 80)));
		link.title = labels.copy.replace('{title}', title.slice(0, 80));
		link.addEventListener('click', (event) => {
			if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return; // new tab etc.
			event.preventDefault();
			event.stopPropagation();
			copy(el.id);
		});
		el.append(link);
	}

	/** Decorates the roots (or one re-rendered element). If the address points at a section that only now exists, goes there. */
	function apply(scope) {
		for (const root of roots(scope)) {
			root.querySelectorAll(config.levels).forEach((el) => decorate(el, 'heading'));
			root.querySelectorAll('[data-linkify-anchor]').forEach((el) => decorate(el, 'block'));
			if (config.blocks) root.querySelectorAll(config.blocks).forEach((el) => decorate(el, 'block'));
		}
		if (started && landed !== location.hash) go(currentId());
	}

	// ---- copy ------------------------------------------------------------------------------

	function urlFor(id) {
		const url = new URL(location.href);
		url.hash = id;
		return url.href;
	}

	async function writeClipboard(text) {
		try {
			if (navigator.clipboard && window.isSecureContext) {
				await navigator.clipboard.writeText(text);
				return true;
			}
		} catch {
			// fall through to the old way (permissions, iframes)
		}
		const area = document.createElement('textarea');
		area.value = text;
		area.setAttribute('readonly', '');
		area.className = 'linkify-clipboard';
		document.body.append(area);
		area.select();
		let ok = false;
		try {
			ok = document.execCommand('copy');
		} catch {
			ok = false;
		}
		area.remove();
		return ok;
	}

	async function copy(id) {
		const el = document.getElementById(id);
		if (!el) return false;
		const url = urlFor(id);
		history[config.history === 'push' ? 'pushState' : 'replaceState'](history.state, '', url);
		land(el, true);
		const ok = await writeClipboard(url);
		toast(ok ? labels.copied : labels.failed, ok);
		el.classList.add('linkify-copied');
		setTimeout(() => el.classList.remove('linkify-copied'), 1600);
		el.dispatchEvent(new CustomEvent('linkify:copy', { bubbles: true, detail: { id, url, ok } }));
		return ok;
	}

	let toastEl = null;
	let toastTimer = 0;
	function toast(message, ok) {
		if (!toastEl) {
			toastEl = document.createElement('div');
			toastEl.className = 'linkify-toast';
			toastEl.setAttribute('role', 'status');
			toastEl.setAttribute('aria-live', 'polite');
			document.body.append(toastEl);
		}
		toastEl.textContent = message;
		toastEl.classList.toggle('is-error', !ok);
		toastEl.classList.add('is-visible');
		clearTimeout(toastTimer);
		toastTimer = setTimeout(() => toastEl.classList.remove('is-visible'), 2200);
	}

	// ---- go (incoming links) ---------------------------------------------------------------

	/** Opens what hides the target: closed <details>, and hidden panels (outermost first). */
	function reveal(el) {
		for (let p = el.parentElement; p; p = p.parentElement) {
			if (p.tagName === 'DETAILS' && !p.open) p.open = true;
		}
		const chain = [];
		for (let p = el.closest(`[${config.revealAttr}]`); p; p = p.parentElement?.closest(`[${config.revealAttr}]`)) chain.unshift(p);
		for (const panel of chain) {
			panel.dispatchEvent(new CustomEvent(config.revealEvent, { bubbles: true, detail: panel.getAttribute(config.revealAttr) }));
		}
	}

	/** Scrolls to el and flashes it. After a page load, aligns again when late fonts/images push it away — until the reader moves. */
	function land(el, smooth) {
		// Anchor coordinates must use the final frame, including an animated parent.
		// Otherwise a large entrance transform leaves the heading below the header after settling.
		if (window.webmovie?.finish) {
			for (let node = el; node; node = node.parentElement) {
				if (node.matches('[data-webmovie]')) window.webmovie.finish(node);
			}
		}
		el.scrollIntoView({ block: 'start', behavior: smooth && !reduceMotion() ? 'smooth' : 'instant' });
		el.classList.remove('linkify-target');
		void el.offsetWidth; // restart the flash animation
		el.classList.add('linkify-target');
		setTimeout(() => el.classList.remove('linkify-target'), 2400);
	}

	/** The page's own scroll-padding (html { scroll-padding-top }) — scrollIntoView adds it to our scroll-margin. */
	const pagePadding = () => parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;

	function settle(el) {
		let moved = false;
		for (const type of ['wheel', 'touchstart', 'keydown', 'pointerdown']) {
			window.addEventListener(type, () => (moved = true), { once: true, passive: true, capture: true });
		}
		const again = () => {
			if (moved || !el.isConnected) return;
			const want = (parseFloat(getComputedStyle(el).scrollMarginTop) || 0) + pagePadding(); // = sticky header + gap (linkify.css)
			if (Math.abs(el.getBoundingClientRect().top - want) > 4) el.scrollIntoView({ block: 'start', behavior: 'instant' });
		};
		// a bar or block above that grows after landing (a login button, a late menu) pushes the section down — follow it at once
		const resized = new ResizeObserver(again);
		resized.observe(document.body);
		document.fonts?.ready.then(again);
		window.addEventListener('load', again, { once: true });
		setTimeout(again, 400);
		setTimeout(() => {
			again();
			resized.disconnect();
		}, 1200);
	}

	function currentId() {
		if (location.hash.length < 2) return '';
		try {
			return decodeURIComponent(location.hash.slice(1));
		} catch {
			return location.hash.slice(1);
		}
	}

	function go(id, { smooth = false } = {}) {
		const el = id && document.getElementById(id);
		if (!el || !known.has(id)) return false;
		landed = location.hash;
		reveal(el);
		// let the page show the panel first (frameworks re-render on the next frame)
		requestAnimationFrame(() => requestAnimationFrame(() => {
			land(el, smooth);
			if (!smooth) settle(el);
			el.dispatchEvent(new CustomEvent('linkify:go', { bubbles: true, detail: { id } }));
		}));
		return true;
	}

	// ---- heading clicks --------------------------------------------------------------------

	function onClick(event) {
		if (!config.headingClick || event.defaultPrevented || event.button !== 0) return;
		if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
		const el = event.target.closest?.('[data-linkified="heading"]');
		if (!el) return;
		const control = event.target.closest(INTERACTIVE);
		if (control && control !== el) return; // a link/button in the heading, or a heading inside <summary> — let it do its job
		if (String(window.getSelection?.() || '').length) return; // the reader is selecting text
		copy(el.id);
	}

	// ---- sticky header offset --------------------------------------------------------------

	function watchHeader() {
		const header = config.header && document.querySelector(config.header);
		if (!header) return;
		const update = () => {
			const box = header.getBoundingClientRect();
			const sticky = ['sticky', 'fixed'].includes(getComputedStyle(header).position);
			// a page that already reserves the header with scroll-padding must not get it twice
			const offset = sticky ? Math.max(0, Math.ceil(box.height) - pagePadding()) : 0;
			document.documentElement.style.setProperty('--linkify-offset', `${offset}px`);
		};
		new ResizeObserver(update).observe(header);
		update();
	}

	// ---- start -----------------------------------------------------------------------------

	let started = false;
	let landed = '';
	function start() {
		if (started) return;
		started = true;
		watchHeader();
		apply();
		document.addEventListener('click', onClick);
		window.addEventListener('hashchange', () => go(currentId(), { smooth: true }));
		go(currentId());
	}

	window.Linkify = { start, apply, copy, go, idFor, labels };
	if (!config.auto) return;
	// A deferred script runs while readyState is already 'interactive' but before DOMContentLoaded — frameworks
	// (Alpine, Vue) may not have rendered yet. Wait for DOMContentLoaded; 'load' covers a script added after it.
	if (document.readyState === 'complete') start();
	else {
		document.addEventListener('DOMContentLoaded', start, { once: true });
		window.addEventListener('load', start, { once: true });
	}
})();
