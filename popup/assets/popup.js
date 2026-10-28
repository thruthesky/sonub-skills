/*!
 * popup.js — glossary popups for any web page (`popup` skill from https://sonub.com, MIT).
 *
 * Hover (or tap, or focus) a technical word and a small card explains it:
 * term · reading · category → one-line meaning → explanation → "in plain words" → example lines
 * → source code → related terms → "learn more" link to another page of the project.
 *
 *   <link rel="stylesheet" href="/popup/popup.css">
 *   <script defer src="/popup/popup.js" data-glossary="/popup/glossary.json"></script>
 *
 * Script attributes (all optional except data-glossary):
 *   data-glossary   URL of the glossary JSON (one file, or one file per locale: "/popup/glossary.{locale}.json")
 *   data-locale     language to show; default <html lang>, then the glossary's defaultLocale
 *   data-root       where to find terms in plain text automatically; default "[data-popup-root], main, article"
 *                   ("none" turns automatic wrapping off — only explicit data-term markup is used)
 *   data-skip       extra CSS selector whose text is never wrapped (headings, links, buttons and code are always skipped)
 *   data-once       "false" wraps every occurrence; default wraps only the first occurrence of a term in each root
 *   data-fallback-locale  with a per-locale glossary URL, the file to load when this language has none (default en)
 *
 * Markup you can write by hand:
 *   <span data-term="api">API</span>                       explicit term (inflected forms, phrases, terms with match:false)
 *   <button class="popup-info" data-term="api"></button>   a small "?" button (next to links, cards, headings)
 *   <a href="/x" data-term="menu-x">…</a>                  a link or button that also explains itself on a 400 ms hover;
 *                                                          clicking still does its own job
 *   <section data-popup-scope="shell">…</section>          terms with "scope": "shell" match only in here
 *   <article data-popup-topic="git,commit">…</article>     topics of this part (term ids or scope names) — context for words with several meanings
 *   <div data-no-popup>…</div>                             never wrap inside
 *
 * JavaScript API (window.PopupGlossary):
 *   PopupGlossary.ready            Promise, resolves when the glossary is loaded and the page wrapped
 *   PopupGlossary.apply(element)   wrap new content (single-page apps after a render)
 *   PopupGlossary.open(id, anchor) open a term next to an element
 *   PopupGlossary.close()
 *   PopupGlossary.load(urlOrObject, locale?)  switch glossary or language
 *
 * Text is always inserted with textContent — glossary strings cannot inject HTML.
 */
(function () {
	'use strict';

	if (window.PopupGlossary && window.PopupGlossary.version) return;

	var HOVER_CLOSE_DELAY = 300; // ms — a mouse that slips off the term or the card for a moment does not close it
	var AIM_CLOSE_DELAY = 700; // ms — the mouse stopped on its way from the term to the card
	var SWITCH_DELAY = 300; // ms — another term crossed on the way to the card takes over only if the mouse rests on it
	var AIM_SLACK = 16; // px — widens the way to the card so a shaky hand stays on it
	var ACTION_OPEN_DELAY = 400; // ms — links and buttons open only after the mouse rests on them
	var GAP = 8; // px — between the card and the term / the screen edge
	var SHEET = '(max-width: 640px)'; // narrow screens get a bottom sheet instead of a floating card
	var SKIP = 'a,button,input,select,option,textarea,label,summary,code,pre,kbd,samp,var,script,style,noscript,template,svg,math,h1,h2,h3,h4,h5,h6,[contenteditable],[data-no-popup],.popup-term,.popup-pop';
	var DEFAULT_ROOT = '[data-popup-root], main, article';
	var LABELS = {
		dialog: 'Glossary', close: 'Close', easy: 'In plain words', example: 'Example', code: 'Code',
		related: 'Related', more: 'Learn more', copy: 'Copy', copied: 'Copied'
	};
	// Korean particles: a Hangul term followed by one of these still ends there ('토큰을' ✓ · '토큰화' ✗)
	var KO_PARTICLES = ['이라고', '라고', '으로써', '으로서', '로써', '로서', '이라는', '라는', '에서는', '에서도', '에게서', '한테서',
		'으로는', '으로도', '까지도', '부터는', '이라도', '라도', '이라면', '라면', '이란', '란', '조차', '마저', '밖에',
		'처럼', '보다', '마다', '부터', '까지', '에서', '에게', '한테', '으로', '이나', '나마', '이야', '와의', '과의',
		'들을', '들이', '들은', '들과', '들', '은', '는', '이', '가', '을', '를', '에', '의', '와', '과', '도', '만',
		'로', '나', '야', '라', '고', '며', '서', '인', '임', '일', '다',
		'입', '하', '한', '할', '함', '합', '해', '했', '되', '된', '될', '됨', '됩', '돼', '됐'];
	var ARABIC_PREFIXES = ['وال', 'بال', 'فال', 'كال', 'لل', 'ال', 'و', 'ب', 'ل', 'ك', 'ف'];

	var script = document.currentScript;
	var attr = function (name) { return script ? script.getAttribute(name) : null; };
	var options = window.PopupGlossaryOptions || {};
	var conf = {
		glossary: options.glossary || attr('data-glossary'),
		locale: options.locale || attr('data-locale'),
		root: options.root || attr('data-root') || DEFAULT_ROOT,
		skip: options.skip || attr('data-skip'),
		once: (options.once != null ? String(options.once) : attr('data-once')) !== 'false'
	};

	var data = null; // the glossary JSON
	var base = document.baseURI; // relative "learn more" links resolve against the glossary file
	var locale = 'en';
	var labels = LABELS;
	var matchers = {}; // scope → { re, cands } — cands[i] lists the candidate ids of spelling i ('~id' borrows the spelling)
	var pageIds = {}; // terms wrapped so far on this page — break ties between meanings
	// words with several meanings (references/content.md "Words with several meanings"): sentence 4 · paragraph 1 · topic 2, page ≤ 9 for ties only
	var CUE_WEIGHTS = { sentence: 4, text: 1, topic: 2 };
	var PAGE_CAP = 9;
	var SENTENCE_END = /[.!?。！？।؟۔](?=\s|$)|\n/gu;
	var BLOCK = 'p,li,td,th,dd,dt,figcaption,blockquote,h1,h2,h3,h4,h5,h6';

	// ── text helpers ──────────────────────────────────────────────

	function el(tag, cls, text) {
		var e = document.createElement(tag);
		if (cls) e.className = cls;
		if (text != null) e.textContent = text;
		return e;
	}
	function escapeRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
	function test(re, ch) { return !!ch && re.test(ch); }
	var LATIN = /[\p{Script=Latin}\p{N}]/u;

	// "Run `ls -la` to see hidden files" → text and <code> pieces
	function inline(parent, text) {
		String(text).split(/(`[^`]+`)/).forEach(function (part) {
			if (!part) return;
			if (part.length > 2 && part[0] === '`' && part[part.length - 1] === '`') parent.append(el('code', null, part.slice(1, -1)));
			else parent.append(document.createTextNode(part));
		});
	}
	function paragraphs(parent, text) {
		String(text).split(/\n{2,}/).forEach(function (p) {
			var para = el('p');
			p.split('\n').forEach(function (line, i) {
				if (i) para.append(el('br'));
				inline(para, line);
			});
			parent.append(para);
		});
	}
	// example: one item per line; a line that starts with `code` is shown as code + note
	function exampleLines(text) {
		return String(text || '').split('\n').map(function (line) {
			line = line.trim();
			var m = /^`([^`]+)`\s*(.*)$/.exec(line);
			return m ? { code: m[1], note: m[2] } : { code: '', note: line };
		}).filter(function (l) { return l.code || l.note; });
	}

	// ── glossary access ───────────────────────────────────────────

	function pickLocale(wanted) {
		var all = data.locales || Object.keys((data.labels || {}));
		var fallback = data.defaultLocale || all[0] || 'en';
		var candidates = [wanted, (wanted || '').split('-')[0], fallback];
		for (var i = 0; i < candidates.length; i++) {
			var c = candidates[i];
			if (c && (!all.length || all.indexOf(c) >= 0)) return c;
		}
		return fallback;
	}
	function text(id) {
		var t = data.terms[id] && data.terms[id].text;
		if (!t) return null;
		return t[locale] || t[data.defaultLocale] || t[Object.keys(t)[0]] || null;
	}
	function entry(id) {
		var term = data.terms[id];
		var t = text(id);
		if (!term || !t) return null;
		var cats = data.categories || {};
		var cat = term.category && cats[term.category];
		var href = t.href || term.href || null;
		if (href) {
			href = href.replace(/\{locale\}/g, locale);
			try { href = new URL(href, base).href; } catch (e) { href = null; }
		}
		return {
			id: id,
			term: t.term,
			reading: t.reading || '',
			short: t.short || '',
			long: t.long || '',
			easy: t.easy || '',
			examples: exampleLines(t.example),
			code: t.code || '',
			codeLang: term.codeLang || '',
			category: cat ? (typeof cat === 'string' ? cat : (cat[locale] || cat[data.defaultLocale] || term.category)) : '',
			related: (term.related || []).filter(function (r) { return data.terms[r] && text(r); })
				.map(function (r) { return { id: r, term: text(r).term }; }),
			href: href
		};
	}

	// ── matching ──────────────────────────────────────────────────

	// '환각(허위 생성)' → '환각' too: running text often uses only the part before the brackets
	function surfaces(id) {
		var term = data.terms[id];
		var t = text(id) || {};
		var list = [];
		var add = function (s, exact) {
			s = String(s || '').trim().replace(/\s+/g, ' ');
			if (s.length < 2) return;
			list.push({ s: s, exact: exact });
		};
		var exact = term.case === true;
		var exactSet = (term.exact || []).map(function (s) { return String(s); });
		add(t.term, exact);
		var bracket = /^(.+?)\s*[(（]/.exec(t.term || '');
		if (bracket) add(bracket[1], exact);
		(term.aliases || []).forEach(function (a) { add(a, exact || exactSet.indexOf(a) >= 0); });
		String(t.aliases || '').split(/[,،、，]/).forEach(function (a) { add(a, exact); });
		exactSet.forEach(function (a) { add(a, true); });
		return list;
	}

	function caseless(s) {
		var out = '';
		for (var ch of s) {
			var lo = ch.toLowerCase();
			var up = ch.toUpperCase();
			out += lo !== up && lo.length === 1 && up.length === 1 ? '[' + escapeRe(lo) + escapeRe(up) + ']' : escapeRe(ch);
		}
		return out;
	}

	function surfacePattern(s, exact) {
		var chars = Array.from(s);
		var first = chars[0];
		var last = chars[chars.length - 1];
		var words = s.split(' ');
		var body = '';
		words.forEach(function (w, i) {
			if (i) {
				var latinGap = test(LATIN, Array.from(words[i - 1]).pop()) && test(LATIN, Array.from(w)[0]);
				body += latinGap ? '\\s+' : '\\s*';
			}
			body += exact ? escapeRe(w) : caseless(w);
		});
		var before = '';
		if (test(LATIN, first)) before = '(?<![\\p{Script=Latin}\\p{N}_$#{])(?<![\\p{Script=Latin}\\p{N}]\\.)';
		else if (test(/\p{Script=Cyrillic}/u, first)) before = '(?<!\\p{Script=Cyrillic})';
		else if (test(/\p{Script=Hangul}/u, first)) before = '(?<!\\p{Script=Hangul})';
		else if (test(/\p{Script=Devanagari}/u, first)) before = '(?<!\\p{Script=Devanagari})';
		else if (test(/\p{Script=Bengali}/u, first)) before = '(?<!\\p{Script=Bengali})';
		else if (test(/\p{Script=Arabic}/u, first)) before = '(?:(?<!\\p{Script=Arabic})|(?<=(?<!\\p{Script=Arabic})(?:' + ARABIC_PREFIXES.join('|') + ')))';
		var after = '\\p{M}*';
		if (test(LATIN, last)) after = '(?![\\p{Script=Latin}\\p{N}\\p{M}_\\[]|\\.[\\p{Script=Latin}\\p{N}])';
		else if (test(/\p{Script=Cyrillic}/u, last)) after = '[\\p{Script=Cyrillic}\\p{M}]*';
		else if (test(/\p{Script=Arabic}/u, last)) after = '(?:(?!\\p{P})[\\p{Script=Arabic}\\p{M}])*';
		else if (test(/\p{Script=Hangul}/u, last)) after = '(?:(?!\\p{Script=Hangul})|(?=(?:' + KO_PARTICLES.join('|') + ')))';
		// the lookbehind sits outside the group so the group is exactly the wrapped text
		return before + '(' + body + after + ')';
	}

	function matcher(scope) {
		var key = scope || '';
		if (matchers[key]) return matchers[key];
		var ids = Object.keys(data.terms).filter(function (id) {
			var term = data.terms[id];
			return term.match !== false && term.auto !== false && (!term.scope || term.scope === scope);
		});
		var borrowers = {};
		ids.forEach(function (id) {
			(data.terms[id].shares || []).forEach(function (owner) { (borrowers[owner] = borrowers[owner] || []).push(id); });
		});
		// one item per spelling; every term that has the spelling stays a candidate (scoped terms first, then glossary order)
		var order = ids.slice().sort(function (a, b) { return (data.terms[a].scope ? 0 : 1) - (data.terms[b].scope ? 0 : 1); });
		Object.keys(borrowers).forEach(function (o) { if (order.indexOf(o) < 0 && data.terms[o]) order.push(o); });
		var bySpelling = {};
		var items = [];
		order.forEach(function (id, n) {
			var own = ids.indexOf(id) >= 0;
			surfaces(id).forEach(function (sf) {
				var k = (sf.exact ? '=' + sf.s : sf.s.toLowerCase());
				var item = bySpelling[k];
				if (!item) items.push(item = bySpelling[k] = { s: sf.s, exact: sf.exact, len: sf.s.length, order: n, cands: [] });
				(own ? [id] : []).concat((borrowers[id] || []).map(function (b) { return '~' + b; })).forEach(function (c) {
					if (item.cands.indexOf(c) < 0) item.cands.push(c);
				});
			});
		});
		items = items.filter(function (i) { return i.cands.length; });
		items.sort(function (a, b) { return b.len - a.len || a.order - b.order; });
		var m = { re: null, cands: items.map(function (i) { return i.cands; }), scope: scope || null };
		if (items.length) m.re = new RegExp(items.map(function (i) { return surfacePattern(i.s, i.exact); }).join('|'), 'gu');
		matchers[key] = m;
		return m;
	}

	function needsContext(c) { return c.charAt(0) === '~' || data.terms[c].context === true; }

	// every spelling in `value`: [{ start, text, cands }]
	function spans(m, value) {
		var out = [];
		var match;
		m.re.lastIndex = 0;
		while ((match = m.re.exec(value))) {
			var g = 1;
			while (g < match.length && match[g] === undefined) g++;
			if (match[g]) out.push({ start: match.index, text: match[g], cands: m.cands[g - 1] });
		}
		return out;
	}

	// the unambiguous terms of a paragraph — what the words around a word are about
	function evidence(m, value) {
		var ids = {};
		spans(m, value).forEach(function (h) { if (h.cands.length === 1 && !needsContext(h.cands[0])) ids[h.cands[0]] = true; });
		return ids;
	}

	function sentenceIndex(value, at) {
		var n = 0;
		var e;
		SENTENCE_END.lastIndex = 0;
		while ((e = SENTENCE_END.exec(value)) && e.index < at) n++;
		return n;
	}

	// pick the meaning of one spelling: avoid patterns rule a meaning out; scoped terms come first; then cues near the word.
	// A word marked context:true (or a borrowed spelling) needs a cue in its sentence, paragraph or topic — otherwise it stays plain.
	function resolve(m, value, hit, near, para, topics) {
		var best = null;
		var bestKey = null;
		hit.cands.forEach(function (c) {
			var id = c.charAt(0) === '~' ? c.slice(1) : c;
			var term = data.terms[id];
			var cues = [id].concat(term.cues || term.related || []);
			var local = 0;
			var close = 0; // same sentence or topic — a borrowed meaning needs this (the owner's meaning is always there)
			var far = 0;
			cues.forEach(function (q) {
				var n = (near[q] ? CUE_WEIGHTS.sentence : 0) + (topics[q] ? CUE_WEIGHTS.topic : 0);
				close += n;
				local += n + (para[q] ? CUE_WEIGHTS.text : 0);
				if (pageIds[q]) far++;
			});
			var avoided = ((term.avoid || {})[locale] || []).some(function (p) {
				var re = new RegExp(p, 'giu');
				var a;
				while ((a = re.exec(value))) {
					if (a.index <= hit.start && a.index + a[0].length >= hit.start + hit.text.length) return true;
					if (!a[0]) re.lastIndex++;
				}
				return false;
			});
			if (avoided || (needsContext(c) && (c.charAt(0) === '~' ? close : local) === 0)) return;
			var key = [term.scope && term.scope === m.scope ? 1 : 0, local * 10 + Math.min(far, PAGE_CAP)];
			if (!bestKey || key[0] > bestKey[0] || (key[0] === bestKey[0] && key[1] > bestKey[1])) { best = id; bestKey = key; }
		});
		return best;
	}

	function wrapRoot(root) {
		if (!data || root.closest('[data-no-popup]')) return;
		var scopeEl = root.closest('[data-popup-scope]');
		var m = matcher(scopeEl ? scopeEl.getAttribute('data-popup-scope') : null);
		if (!m.re) return;
		var skip = SKIP + (conf.skip ? ',' + conf.skip : '');
		var once = root.getAttribute('data-popup-once') ? root.getAttribute('data-popup-once') !== 'false' : conf.once;
		var topics = {};
		if (m.scope) topics[m.scope] = true;
		for (var t = root.closest('[data-popup-topic]'); t; t = t.parentElement ? t.parentElement.closest('[data-popup-topic]') : null) {
			t.getAttribute('data-popup-topic').split(',').forEach(function (x) { if (x.trim()) topics[x.trim()] = true; });
		}
		var paras = new Map(); // block element → its evidence
		var seen = {};
		root.querySelectorAll('.popup-term[data-term]').forEach(function (t) { seen[t.getAttribute('data-term')] = true; });
		var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
			acceptNode: function (node) {
				if (!node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
				var parent = node.parentElement;
				if (!parent || parent.closest(skip)) return NodeFilter.FILTER_REJECT;
				var inner = parent.closest('[data-popup-scope]');
				if (inner !== scopeEl && root.contains(inner)) return NodeFilter.FILTER_REJECT; // a nested scope is wrapped on its own
				return NodeFilter.FILTER_ACCEPT;
			}
		});
		var nodes = [];
		while (walker.nextNode()) nodes.push(walker.currentNode);
		nodes.forEach(function (node) {
			var value = node.nodeValue;
			var frag = null;
			var last = 0;
			var hits = spans(m, value);
			if (!hits.length) return;
			var block = node.parentElement.closest(BLOCK) || root;
			if (!root.contains(block)) block = root;
			if (!paras.has(block)) paras.set(block, evidence(m, block.textContent));
			var para = paras.get(block);
			var sentences = {};
			hits.forEach(function (h) {
				if (h.cands.length === 1 && !needsContext(h.cands[0])) (sentences[sentenceIndex(value, h.start)] = sentences[sentenceIndex(value, h.start)] || {})[h.cands[0]] = true;
			});
			hits.forEach(function (h) {
				var id = resolve(m, value, h, sentences[sentenceIndex(value, h.start)] || {}, para, topics);
				if (!id || (once && seen[id])) return;
				seen[id] = true;
				pageIds[id] = true;
				frag = frag || document.createDocumentFragment();
				frag.append(document.createTextNode(value.slice(last, h.start))); // the lookbehind is zero-width, so the group starts the match
				frag.append(trigger(id, h.text));
				last = h.start + h.text.length;
			});
			if (!frag) return;
			frag.append(document.createTextNode(value.slice(last)));
			node.replaceWith(frag);
		});
	}

	function trigger(id, label) {
		var b = el('button', 'popup-term', label);
		b.type = 'button';
		b.setAttribute('data-term', id);
		b.setAttribute('aria-haspopup', 'dialog');
		b.setAttribute('aria-expanded', 'false');
		var t = text(id);
		if (t && t.short) b.title = t.short; // meaning without JavaScript-driven hover (removed while the card is open)
		return b;
	}

	// explicit markup: <span data-term> becomes a focusable trigger; links and buttons keep their own job
	function upgrade(scope) {
		(scope || document).querySelectorAll('[data-term]:not(.popup-term):not(.popup-pop-chip)').forEach(function (e) {
			if (isAction(e)) return;
			e.classList.add('popup-term');
			if (!/^(BUTTON|A|INPUT|SELECT|TEXTAREA)$/.test(e.tagName)) {
				e.setAttribute('role', 'button');
				e.tabIndex = 0;
			}
			e.setAttribute('aria-haspopup', 'dialog');
			e.setAttribute('aria-expanded', 'false');
			var t = data && text(e.getAttribute('data-term'));
			if (t && t.short && !e.title) e.title = t.short;
			if (e.classList.contains('popup-info') && !e.getAttribute('aria-label') && t) e.setAttribute('aria-label', t.term);
		});
		(scope || document).querySelectorAll('.popup-info:not([data-term])').forEach(function (e) { e.hidden = true; });
	}

	function isAction(e) {
		if (e.classList.contains('popup-info')) return false;
		return e.matches('a[href], button, summary, [role="link"], [role="tab"], [role="menuitem"], [data-term-action]');
	}

	// ── the card ──────────────────────────────────────────────────

	var pop = null;
	var anchor = null;
	var pinned = false;
	var hideTimer = 0;
	var actionTimer = 0;
	var switchTimer = 0;
	var exit = null; // where the mouse left the term — the tip of the way to the card; null once it is back on the term or the card
	var pointerFocus = false;
	var skipFocus = false;

	function build() {
		pop = el('div', 'popup-pop');
		pop.id = 'popup-pop';
		pop.setAttribute('role', 'dialog');
		pop.tabIndex = -1;
		pop.hidden = true;
		pop.addEventListener('pointerenter', function () {
			clearTimeout(hideTimer);
			clearTimeout(switchTimer);
			exit = null;
		});
		pop.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse') leave(); });
		pop.addEventListener('click', function (e) {
			var chip = e.target.closest('.popup-pop-chip');
			if (chip) {
				pinned = true;
				render(chip.getAttribute('data-term'));
				place();
				return;
			}
			if (e.target.closest('.popup-pop-close')) hide(false);
			var copy = e.target.closest('.popup-pop-copy');
			if (copy && navigator.clipboard) {
				navigator.clipboard.writeText(pop.querySelector('.popup-pop-code code').textContent).then(function () {
					copy.textContent = labels.copied;
					setTimeout(function () { copy.textContent = labels.copy; }, 1500);
				});
			}
		});
		document.body.append(pop);
	}

	function render(id, stub) {
		var e = data && entry(id);
		pop.replaceChildren();
		pop.setAttribute('aria-label', labels.dialog);
		pop.setAttribute('data-term', id);
		var top = el('header', 'popup-pop-top');
		top.append(el('strong', 'popup-pop-term', e ? e.term : (stub || id)));
		if (e && e.reading) top.append(el('span', 'popup-pop-reading', e.reading));
		if (e && e.category) top.append(el('span', 'popup-pop-cat', e.category));
		var close = el('button', 'popup-pop-close', '×');
		close.type = 'button';
		close.setAttribute('aria-label', labels.close);
		close.title = labels.close;
		top.append(close);
		pop.append(top);
		if (!e) return;
		if (e.short) pop.append(el('p', 'popup-pop-short', e.short));
		if (e.long) {
			var long = el('div', 'popup-pop-long');
			paragraphs(long, e.long);
			pop.append(long);
		}
		if (e.easy) {
			var easy = el('div', 'popup-pop-easy');
			easy.append(el('span', 'popup-pop-label', labels.easy));
			var easyText = el('span');
			inline(easyText, e.easy);
			easy.append(easyText);
			pop.append(easy);
		}
		if (e.examples.length) {
			var ex = el('div', 'popup-pop-example');
			ex.append(el('span', 'popup-pop-label', labels.example));
			var ul = el('ul', 'popup-pop-examples');
			e.examples.forEach(function (line) {
				var li = el('li');
				if (line.code) {
					var c = el('code', null, line.code);
					c.dir = 'ltr';
					li.append(c);
				}
				if (line.note) {
					var note = el('span');
					inline(note, line.note);
					li.append(note);
				}
				ul.append(li);
			});
			ex.append(ul);
			pop.append(ex);
		}
		if (e.code) {
			var fig = el('figure', 'popup-pop-code');
			var cap = el('figcaption');
			cap.append(el('span', 'popup-pop-label', e.codeLang || labels.code));
			if (navigator.clipboard) {
				var copy = el('button', 'popup-pop-copy', labels.copy);
				copy.type = 'button';
				cap.append(copy);
			}
			fig.append(cap);
			var pre = el('pre');
			pre.dir = 'ltr';
			var code = el('code', null, e.code);
			if (e.codeLang) code.className = 'language-' + e.codeLang;
			pre.append(code);
			fig.append(pre);
			pop.append(fig);
		}
		if (e.related.length) {
			var rel = el('p', 'popup-pop-related');
			rel.append(el('span', 'popup-pop-label', labels.related));
			e.related.forEach(function (r) {
				var chip = el('button', 'popup-pop-chip', r.term);
				chip.type = 'button';
				chip.setAttribute('data-term', r.id);
				rel.append(chip);
			});
			pop.append(rel);
		}
		if (e.href) {
			var more = el('a', 'popup-pop-more', labels.more);
			more.href = e.href;
			more.append(el('span', 'popup-pop-arrow', '→'));
			pop.append(more);
		}
	}

	function show(target, pin) {
		clearTimeout(hideTimer);
		clearTimeout(switchTimer);
		exit = null;
		if (!pop.hidden && anchor === target) {
			if (pin) pinned = true;
			return;
		}
		release();
		anchor = target;
		pinned = !!pin;
		if (!isAction(target)) {
			target.setAttribute('aria-expanded', 'true');
			target.setAttribute('aria-controls', pop.id);
		}
		if (target.title) { // keep the browser's own tooltip from covering the card
			target.setAttribute('data-popup-title', target.title);
			target.removeAttribute('title');
		}
		render(target.getAttribute('data-term'), target.getAttribute('data-term-label') || target.textContent.trim());
		pop.hidden = false;
		place();
	}

	function release() {
		if (!anchor) return;
		if (anchor.getAttribute('aria-expanded') === 'true') anchor.setAttribute('aria-expanded', 'false');
		var title = anchor.getAttribute('data-popup-title');
		if (title) {
			anchor.title = title;
			anchor.removeAttribute('data-popup-title');
		}
	}

	function hide(restoreFocus) {
		clearTimeout(hideTimer);
		clearTimeout(actionTimer);
		clearTimeout(switchTimer);
		exit = null;
		var back = anchor;
		release();
		anchor = null;
		pinned = false;
		if (pop) pop.hidden = true;
		if (restoreFocus && back && back.isConnected) {
			skipFocus = true;
			back.focus({ preventScroll: true });
		}
	}

	function leave() {
		if (pinned) return;
		clearTimeout(hideTimer);
		hideTimer = setTimeout(function () { hide(false); }, HOVER_CLOSE_DELAY);
	}

	// the mouse left the term — remember where; pointermove then decides whether it is heading for the card
	function leaveAnchor(e) {
		exit = { x: e.clientX, y: e.clientY };
		aim();
	}

	// on the way to the card — wait longer, so a slow hand still makes it
	function aim() {
		if (pinned) return;
		clearTimeout(hideTimer);
		hideTimer = setTimeout(function () { hide(false); }, AIM_CLOSE_DELAY);
	}

	// is the mouse on the way to the card — inside the triangle from where it left the term (pulled back a little)
	// to the two ends of the card's near edge
	function aiming(e) {
		if (!exit || !pop || pop.hidden) return false;
		var card = pop.getBoundingClientRect();
		var up = pop.getAttribute('data-side') === 'above';
		var edge = up ? card.bottom : card.top;
		var a = { x: exit.x, y: exit.y + (up ? AIM_SLACK : -AIM_SLACK) };
		var b = { x: card.left - AIM_SLACK, y: edge };
		var c = { x: card.right + AIM_SLACK, y: edge };
		var p = { x: e.clientX, y: e.clientY };
		function cross(o, q) { return (q.x - o.x) * (p.y - o.y) - (q.y - o.y) * (p.x - o.x); }
		var s1 = cross(a, b), s2 = cross(b, c), s3 = cross(c, a);
		return !((s1 < 0 || s2 < 0 || s3 < 0) && (s1 > 0 || s2 > 0 || s3 > 0));
	}

	// is this term on a line between the anchor and the card (below the anchor when the card is below)
	function onCardSide(term) {
		var from = anchor.getBoundingClientRect();
		var box = term.getBoundingClientRect();
		var middle = box.top + box.height / 2;
		return pop.getAttribute('data-side') === 'above' ? middle < from.top : middle > from.bottom;
	}

	// next to the term; flips above when there is no room below; bottom sheet on narrow screens
	function place() {
		if (!pop || pop.hidden || !anchor) return;
		if (!anchor.isConnected) return hide(false);
		if (window.matchMedia(SHEET).matches) {
			pop.style.left = '';
			pop.style.top = '';
			pop.style.removeProperty('--popup-room');
			pop.setAttribute('data-side', 'sheet');
			return;
		}
		var box = anchor.getBoundingClientRect();
		var width = document.documentElement.clientWidth;
		var height = document.documentElement.clientHeight;
		// the card never covers its word: if it fits neither below (preferred) nor above, take the roomier side and cap the height
		// (it scrolls inside) — a covered word can't be pressed again, and a drag started there selects the card's text
		var roomBelow = height - box.bottom - GAP * 2;
		var roomAbove = box.top - GAP * 2;
		pop.style.removeProperty('--popup-room');
		var full = pop.getBoundingClientRect().height;
		var below = full <= roomBelow || (full > roomAbove && roomBelow >= roomAbove);
		var room = below ? roomBelow : roomAbove;
		if (full > room) pop.style.setProperty('--popup-room', Math.max(room, 0) + 'px');
		var card = pop.getBoundingClientRect();
		var left = Math.min(Math.max(GAP, box.left + box.width / 2 - card.width / 2), Math.max(GAP, width - card.width - GAP));
		var top = below ? box.bottom + GAP : box.top - card.height - GAP;
		pop.setAttribute('data-side', below ? 'below' : 'above');
		pop.style.left = left + 'px';
		pop.style.top = top + 'px';
		// pages that overflow sideways (narrow RTL layouts) shift the fixed-position origin — measure and correct
		var placed = pop.getBoundingClientRect();
		if (Math.abs(placed.left - left) > 0.5) pop.style.left = (2 * left - placed.left) + 'px';
		if (Math.abs(placed.top - top) > 0.5) pop.style.top = (2 * top - placed.top) + 'px';
	}

	// ── events: one set on the document serves every trigger ──────

	function termAt(t) { return t instanceof Element ? t.closest('.popup-term[data-term]') : null; }
	function actionAt(t) {
		var e = t instanceof Element ? t.closest('[data-term]:not(.popup-term):not(.popup-pop-chip)') : null;
		return e && isAction(e) ? e : null;
	}

	function listen() {
		document.addEventListener('pointerover', function (e) {
			// a button held down means the reader is selecting text — don't open a card over the next line
			if (e.pointerType !== 'mouse' || e.buttons) return;
			var term = termAt(e.target);
			if (term) {
				clearTimeout(switchTimer);
				if (pinned && anchor !== term) return;
				// a term on another line crossed on the way to the card takes over only if the mouse rests on it;
				// terms on the same line switch at once (a mouse following the text)
				if (pop && !pop.hidden && anchor && anchor !== term && aiming(e) && onCardSide(term)) {
					switchTimer = setTimeout(function () { show(term, false); }, SWITCH_DELAY);
					return;
				}
				show(term, false);
				return;
			}
			var action = actionAt(e.target);
			if (action && !pinned && action !== anchor) {
				clearTimeout(actionTimer);
				actionTimer = setTimeout(function () { show(action, false); }, ACTION_OPEN_DELAY);
			}
		});
		document.addEventListener('pointerout', function (e) {
			var t = termAt(e.target) || actionAt(e.target);
			if (!t || t.contains(e.relatedTarget)) return;
			clearTimeout(actionTimer);
			clearTimeout(switchTimer);
			if (t === anchor && !(pop && pop.contains(e.relatedTarget))) leaveAnchor(e);
		});
		// after leaving the term: keep waiting while the mouse heads for the card, start closing when it goes elsewhere
		document.addEventListener('pointermove', function (e) {
			if (!exit || e.pointerType !== 'mouse') return;
			if (aiming(e)) aim();
			else {
				exit = null;
				leave();
			}
		}, { passive: true });
		// a drag selection has started — close the card so the drag does not select the card's text; selecting inside the card is fine
		document.addEventListener('pointermove', function (e) {
			if (!pop || pop.hidden || e.pointerType !== 'mouse' || !(e.buttons & 1)) return;
			var selection = document.getSelection();
			if (!selection || selection.isCollapsed || pop.contains(selection.anchorNode)) return;
			hide(false);
		}, { passive: true });
		document.addEventListener('pointerdown', function (e) {
			pointerFocus = true;
			if (pop && !pop.hidden && !termAt(e.target) && !pop.contains(e.target)) hide(false);
		});
		document.addEventListener('keydown', function (e) {
			pointerFocus = false;
			if (e.key === 'Escape' && pop && !pop.hidden) {
				hide(true);
				return;
			}
			// role="button" spans: Enter and Space act like a click
			var term = termAt(e.target);
			if (term && term.getAttribute('role') === 'button' && (e.key === 'Enter' || e.key === ' ')) {
				e.preventDefault();
				term.click();
			}
		});
		document.addEventListener('focusin', function (e) {
			var fromPointer = pointerFocus;
			pointerFocus = false;
			var term = termAt(e.target);
			if (term) {
				if (skipFocus) skipFocus = false;
				else if (!fromPointer) show(term, false);
				return;
			}
			if (pop && !pop.hidden && !pop.contains(e.target)) hide(false);
		});
		document.addEventListener('click', function (e) {
			if (actionAt(e.target)) { // the link or button does its own job
				hide(false);
				return;
			}
			var term = termAt(e.target);
			if (!term) return;
			// part of the word was drag-selected and released — the reader wants to copy it, not to press
			var picked = document.getSelection();
			if (picked && !picked.isCollapsed && term.contains(picked.anchorNode)) return;
			e.preventDefault();
			if (!pop.hidden && anchor === term && pinned) {
				hide(false);
				return;
			}
			show(term, true);
			if (e.detail === 0) pop.focus({ preventScroll: true }); // keyboard: move into the card (chips, link)
		});
		window.addEventListener('scroll', place, { capture: true, passive: true });
		window.addEventListener('resize', place, { passive: true });
	}

	// ── start ─────────────────────────────────────────────────────

	function apply(scope) {
		if (!data) return;
		scope = scope || document;
		if (conf.root !== 'none') {
			var roots = [];
			if (scope !== document && scope.matches(conf.root)) roots.push(scope);
			scope.querySelectorAll(conf.root).forEach(function (r) { roots.push(r); });
			// apply(element) on a piece of content that is not itself a root: the element is the root
			if (scope !== document && !roots.length) roots.push(scope);
			// outermost roots only, so a nested <article> inside <main> is not walked twice
			roots.filter(function (r) {
				return !roots.some(function (o) { return o !== r && o.contains(r); });
			}).forEach(wrapRoot);
			// a scope is a root of its own: its scoped terms match only inside it
			if (scope !== document && scope.matches('[data-popup-scope]')) wrapRoot(scope);
			scope.querySelectorAll('[data-popup-scope]').forEach(wrapRoot);
		}
		upgrade(scope === document ? null : scope);
	}

	function fetchGlossary(url) {
		return fetch(url, { headers: { Accept: 'application/json' } }).then(function (r) {
			if (!r.ok) throw new Error('popup: glossary ' + r.status + ' ' + r.url);
			base = r.url;
			return r.json();
		});
	}

	function load(source, wanted) {
		var lang = (wanted || conf.locale || document.documentElement.lang || 'en').split('-')[0].toLowerCase();
		var got = typeof source !== 'string'
			? Promise.resolve(source)
			: fetchGlossary(source.replace(/\{locale\}/g, lang)).catch(function (err) {
				// one file per locale and this language has none yet → the fallback language (data-fallback-locale, default en)
				var fallback = attr('data-fallback-locale') || options.fallbackLocale || 'en';
				if (source.indexOf('{locale}') < 0 || lang === fallback) throw err;
				return fetchGlossary(source.replace(/\{locale\}/g, fallback));
			});
		return got.then(function (json) {
			if (!json || !json.terms) throw new Error('popup: the glossary has no "terms"');
			data = json;
			matchers = {};
			pageIds = {};
			locale = pickLocale(wanted || conf.locale || document.documentElement.lang);
			labels = Object.assign({}, LABELS, (data.labels || {})[data.defaultLocale] || {}, (data.labels || {})[locale] || {});
			if (!pop) {
				build();
				listen();
			}
			apply(document);
		});
	}

	var api = {
		version: '1.0.0',
		apply: apply,
		load: load,
		open: function (id, near) {
			if (!pop || !data.terms[id]) return;
			var target = near || document.querySelector('.popup-term[data-term="' + id + '"]') || document.body;
			if (target === document.body) {
				anchor = null;
				render(id);
				pop.hidden = false;
				pop.setAttribute('data-side', 'sheet');
				return;
			}
			show(target, true);
		},
		close: function () { hide(false); },
		entry: function (id) { return data ? entry(id) : null; },
		ready: null
	};
	window.PopupGlossary = api;

	var start = function () {
		var source = options.data || conf.glossary;
		if (!source) {
			console.warn('popup: no glossary — add data-glossary="…/glossary.json" to the script tag');
			return Promise.resolve();
		}
		return load(source).catch(function (err) { console.error(err); });
	};
	api.ready = document.readyState === 'loading'
		? new Promise(function (resolve) { document.addEventListener('DOMContentLoaded', function () { resolve(start()); }); })
		: start();
})();
