#!/usr/bin/env node
// 용어 단추 글자 복사 검사 — 페이지마다 화면에 보이는 용어 문단을 실제 마우스로 드래그해, 선택 글자에 용어(.glossary-term)가 빠지지 않았는지 본다.
// 용어는 <button> 이고 Web Awesome native.css 가 모든 button 에 user-select: none 을 건다 — glossary.css 의 user-select: text 가 없으면
// 드래그 선택·복사에서 그 글자가 빠진다('Learn  in nine steps'). 드래그 중 용어 위에서 팝업이 열려 아랫줄을 덮는 문제도 진짜 마우스 드래그로만 드러난다.
//
// 준비(한 번): mkdir -p /tmp/pw && cd /tmp/pw && npm i playwright && npx playwright install chromium webkit
// 실행(저장소 루트): PLAYWRIGHT_DIR=/tmp/pw node skills/popup/scripts/sonub/select-check.mjs [주소목록 파일|주소…]
//   주소목록 기본값 storage/app/popup-pages/en/pages.txt(page-crawl.py 의 결과, 줄마다 "번호 /주소")
//   SONUB_BASE(기본 https://sonub.localhost:7843) · ENGINES(기본 chromium,webkit) · JOBS(동시 페이지, 기본 4)
// 결과: 페이지·엔진마다 용어 수·드래그한 문단 수·실패 수. 실패가 있으면 문단 글과 선택 글을 찍고 종료 코드 1.
//   ① 모든 용어(숨은 탭·닫힌 details 포함)의 계산된 user-select 가 text 인가 ② 보이는 문단을 드래그한 선택에 그 문단의 용어 글자가 모두 있는가
import { createRequire } from 'node:module';
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const dir = resolve(process.env.PLAYWRIGHT_DIR || '/tmp/pw');
if (!existsSync(join(dir, 'node_modules/playwright'))) {
	console.error(`playwright 가 없습니다: ${dir} — 맨 위 "준비" 를 먼저 하세요`);
	process.exit(2);
}
const playwright = createRequire(join(dir, 'package.json'))('playwright');
const BASE = process.env.SONUB_BASE || 'https://sonub.localhost:7843';
const ENGINES = (process.env.ENGINES || 'chromium,webkit').split(',');
const JOBS = Number(process.env.JOBS || 4);

const args = process.argv.slice(2);
const list = args.length && !args[0].startsWith('/') ? args[0] : 'storage/app/popup-pages/en/pages.txt';
const paths = args.length && args[0].startsWith('/') ? args : readFileSync(list, 'utf8').split('\n').map((l) => l.trim().split(/\s+/).pop()).filter((p) => p?.startsWith('/'));

// 브라우저 안 — 용어를 모아 문단(블록 조상)별로 묶고, 드래그할 시작·끝 좌표를 문단마다 잰다
// 화면에 보이는 용어인가 — 돌아가는 슬라이드의 숨은 장(visibility: hidden)·투명한 것·팝업 안·상태 알림(로딩 문구처럼 드래그하는 사이 바뀌는 글)은 뺀다
const seenSource = (t) => !!t.offsetParent && !!t.textContent.trim() && !t.closest('.glossary-pop, [aria-hidden="true"], [inert], [aria-live], [role="status"]')
	&& (!t.checkVisibility || t.checkVisibility({ visibilityProperty: true, opacityProperty: true }));
const collect = () => {
	document.querySelectorAll('wa-dialog[open]').forEach((d) => d.remove()); // 가입 안내 같은 덮개
	const terms = [...document.querySelectorAll('.glossary-term:not(.glossary-info)')];
	const notText = terms.filter((t) => (getComputedStyle(t).userSelect || getComputedStyle(t).webkitUserSelect) !== 'text').map((t) => t.textContent.trim());
	const blocks = new Set();
	for (const t of terms) {
		if (!seen(t)) continue;
		blocks.add(t.closest('p, li, td, th, dd, dt, figcaption, blockquote, summary, caption, div') || t.parentElement);
	}
	return { total: terms.length, notText, blocks: blocks.size };
};
const measure = async (i) => {
	const blocks = [...new Set([...document.querySelectorAll('.glossary-term:not(.glossary-info)')]
		.filter(seen)
		.map((t) => t.closest('p, li, td, th, dd, dt, figcaption, blockquote, summary, caption, div') || t.parentElement))];
	const block = blocks[i];
	if (!block) return null; // 그사이 화면이 바뀌어 문단 수가 줄었다
	// 즉시 스크롤하고 한 프레임 기다린 뒤 잰다 — 사이트의 scroll-behavior: smooth 가 도는 중에 재면 좌표가 엉뚱한 문단을 가리킨다(WebKit)
	block.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'instant' });
	await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
	// 첫 글자·끝 글자의 사각형 — range.getClientRects() 는 안쪽 블록 요소의 상자 전체도 돌려줘 시작점이 둘째 줄에 찍힌다
	const texts = [];
	const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT);
	while (walker.nextNode()) if (walker.currentNode.data.trim() && walker.currentNode.parentElement.checkVisibility?.() !== false) texts.push(walker.currentNode);
	if (!texts.length) return null;
	const charRect = (node, fromEnd) => {
		const data = node.data;
		const i = fromEnd ? data.trimEnd().length - 1 : data.length - data.trimStart().length;
		const range = document.createRange();
		range.setStart(node, i);
		range.setEnd(node, i + 1);
		const rect = [...range.getClientRects()].find((r) => r.width > 0 && r.height > 0);
		// 그 글자의 방향 — 아랍어 문단 속 'Python' 의 P 는 왼→오다. 문단 방향으로 재면 첫·끝 글자 하나가 빠진다
		const ch = data[i];
		const rtl = /[\u0590-\u08FF\uFB1D-\uFDFF\uFE70-\uFEFF]/.test(ch) || (!/[A-Za-z0-9\u00C0-\u024F\u0370-\u03FF\u0400-\u04FF\u0900-\u0DFF\u0E00-\u0FFF\u1100-\u11FF\u3040-\u30FF\u3400-\u9FFF\uAC00-\uD7AF]/.test(ch) && getComputedStyle(node.parentElement).direction === 'rtl');
		return rect && { rect, rtl };
	};
	const head = charRect(texts[0], false);
	const tail = charRect(texts[texts.length - 1], true);
	if (!head || !tail) return null;
	// 사람처럼 첫 줄의 화면상 시작 끝에서 마지막 줄의 화면상 끝 끝까지 — 양방향 글은 논리 순서의 첫·끝 글자가 줄 가운데에 있을 수 있다
	const lineEnds = (nodes, a, b, rtl) => {
		const rects = nodes.flatMap((node) => { const r = document.createRange(); r.selectNodeContents(node); return [...r.getClientRects()]; }).filter((r) => r.width > 0);
		const on = (line) => rects.filter((r) => Math.abs(r.top + r.height / 2 - (line.top + line.height / 2)) < line.height / 2);
		const top = on(a), bottom = on(b);
		if (!top.length || !bottom.length) return [];
		return [{
			x1: rtl ? Math.max(...top.map((r) => r.right)) - 1 : Math.min(...top.map((r) => r.left)) + 1,
			x2: rtl ? Math.min(...bottom.map((r) => r.left)) + 1 : Math.max(...bottom.map((r) => r.right)) - 1,
		}];
	};
	const first = head.rect;
	const last = tail.rect;
	return {
		terms: [...block.querySelectorAll('.glossary-term:not(.glossary-info)')].filter(seen).map((t) => t.textContent.trim()).filter(Boolean),
		text: block.innerText.slice(0, 160),
		y1: first.top + first.height / 2,
		y2: last.top + last.height / 2,
		// 시작은 첫 글자의 앞 가장자리, 끝은 마지막 글자의 3/4 지점(가운데를 넘어야 그 글자가 들어가고, 글 끝 바깥의 빈 곳은 WebKit 이 문단 앞으로 잡아 선택이 뒤집힌다).
		// 앞·뒤는 그 글자의 방향으로 정한다. 양방향 글의 중립 문자(%·-)는 방향을 짐작하기 어려워 반대쪽도 차례로 해 본다
		tries: [[head.rtl, tail.rtl], [!head.rtl, tail.rtl], [head.rtl, !tail.rtl], [!head.rtl, !tail.rtl]].map(([a, b]) => ({
			x1: a ? first.right - 1 : first.left + 1,
			x2: b ? last.left + last.width / 4 : last.right - last.width / 4,
		})).concat(lineEnds(texts, first, last, getComputedStyle(block).direction === 'rtl')),
	};
};
// 공백·줄바꿈 차이는 보지 않는다(드래그 선택은 줄 끝 공백을 다르게 다룬다)
const squash = (s) => s.replace(/\s+/g, '');

async function checkPage(browser, path) {
	const page = await browser.newPage({ ignoreHTTPSErrors: true, viewport: { width: 1400, height: 1000 }, reducedMotion: 'reduce' }); // 등장 움직임이 자리를 옮기지 않게
	const fails = [];
	try {
		await page.goto(BASE + path, { waitUntil: 'load', timeout: 60000 });
		await page.waitForTimeout(800);
		await page.evaluate(`window.seen = ${seenSource.toString()}`);
		const info = await page.evaluate(collect);
		for (const word of info.notText) fails.push({ kind: 'user-select', word });
		for (let i = 0; i < info.blocks; i++) {
			const m = await page.evaluate(measure, i);
			if (!m || !m.terms.length) continue;
			// 스크롤하는 동안 멈춘 마우스 밑으로 지나간 용어가 연 팝업을 닫는다 — 그 팝업이 시작점을 덮으면 드래그가 팝업 글을 고른다
			// 드래그 한 번 — 고른 글에서 빠진 용어를 돌려준다. 하나라도 되면 통과(로딩 글처럼 그사이 바뀐 글도 다시 해 본다)
			let missing = m.terms;
			let sel = '';
			for (const { x1, x2 } of m.tries) {
				await page.keyboard.press('Escape');
				await page.mouse.move(x1, m.y1);
				await page.mouse.down();
				await page.mouse.move(x2, m.y2, { steps: 6 });
				await page.mouse.up();
				sel = squash(await page.evaluate(() => getSelection().toString()));
				missing = m.terms.filter((w) => !sel.includes(squash(w)));
				await page.evaluate(() => getSelection().removeAllRanges());
				await page.keyboard.press('Escape'); // 드래그 끝에 열린 팝업을 닫는다
				if (!missing.length || !sel.length) break;
			}
			// 선택이 아예 안 된 문단(카드 전체가 링크라 드래그가 끌기로 바뀐 곳 등)은 용어 문제가 아니므로 세지 않는다
			if (missing.length && sel.length > 0) fails.push({ kind: 'drag', missing, text: m.text, sel: sel.slice(0, 160) });
		}
		return { path, total: info.total, blocks: info.blocks, fails };
	} catch (error) {
		return { path, error: String(error).split('\n')[0], fails };
	} finally {
		await page.close();
	}
}

let failed = 0;
for (const engine of ENGINES) {
	const browser = await playwright[engine].launch();
	const queue = [...paths];
	let pages = 0, terms = 0, blocks = 0;
	await Promise.all(Array.from({ length: JOBS }, async () => {
		while (queue.length) {
			const r = await checkPage(browser, queue.shift());
			if (r.error) { console.log(`${engine} ERROR ${r.path} ${r.error}`); continue; }
			if (!r.total) continue;
			pages++; terms += r.total; blocks += r.blocks;
			console.log(`${engine} ${r.fails.length ? 'FAIL' : 'ok  '} ${r.path} 용어 ${r.total} · 문단 ${r.blocks}${r.fails.length ? ` · 실패 ${r.fails.length}` : ''}`);
			for (const f of r.fails.slice(0, 5)) console.log('   ', JSON.stringify(f));
			failed += r.fails.length;
		}
	}));
	console.log(`== ${engine}: 용어가 있는 페이지 ${pages} · 용어 ${terms} · 드래그한 문단 ${blocks}`);
	await browser.close();
}
console.log(failed ? `실패 ${failed}건` : '모두 통과 — 용어 글자가 드래그 선택·복사에 들어간다');
process.exit(failed ? 1 : 0);
