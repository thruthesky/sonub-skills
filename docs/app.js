// sonub-skills homepage — language switching and the install helper.
// English lives in index.html (every [data-i18n] element). Other languages
// come from i18n/<lang>.json; a missing key falls back to the English text.
(function () {
  'use strict';

  var LANGS = [
    ['en', 'English'], ['ko', '한국어'], ['zh', '中文'], ['ja', '日本語'],
    ['es', 'Español'], ['pt', 'Português'], ['fr', 'Français'], ['de', 'Deutsch'],
    ['ru', 'Русский'], ['vi', 'Tiếng Việt'], ['id', 'Bahasa Indonesia'], ['th', 'ไทย'],
    ['tr', 'Türkçe'], ['hi', 'हिन्दी'], ['bn', 'বাংলা'], ['ar', 'العربية'], ['ur', 'اردو']
  ];
  var RTL = { ar: 1, ur: 1 };
  var LANG_KEY = 'sonub-skills.lang';
  var PICK_KEY = 'sonub-skills.picks';
  var REPO = 'thruthesky/sonub-skills';
  var SKILLS = {
    'gp': { plugin: 'gp', script: 'gp.py' },
    'claude-skill': { plugin: 'cc-skill', script: 'cc.py' }
  };

  var base = {};      // English, read from the page
  var dict = {};      // current language
  var cache = {};
  var lang = window.__LANG || 'en';
  var picks = { skill: 'gp', agent: 'claude', scope: 'global' };

  function store(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function load(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function $(s) { return document.querySelector(s); }
  function $$(s) { return Array.prototype.slice.call(document.querySelectorAll(s)); }

  // t() returns HTML; values are escaped. text() returns plain text for <pre>.
  function t(key, vars) {
    var s = dict[key] != null ? dict[key] : (base[key] != null ? base[key] : key);
    if (vars) s = s.replace(/\{(\w+)\}/g, function (m, k) { return vars[k] != null ? vars[k] : m; });
    return s;
  }
  function plain(html) { var d = document.createElement('div'); d.innerHTML = html; return d.textContent; }
  function text(key, vars) {
    var v = {};
    if (vars) Object.keys(vars).forEach(function (k) { v[k] = esc(vars[k]); });
    return plain(t(key, v));
  }
  function code(s) { return '<code>' + esc(s) + '</code>'; }

  function readBase() {
    $$('[data-i18n]').forEach(function (el) { base[el.getAttribute('data-i18n')] = el.innerHTML.trim(); });
    $$('[data-i18n-content]').forEach(function (el) { base[el.getAttribute('data-i18n-content')] = el.getAttribute('content'); });
  }

  function applyStrings() {
    $$('[data-i18n]').forEach(function (el) { el.innerHTML = t(el.getAttribute('data-i18n')); });
    $$('[data-i18n-content]').forEach(function (el) { el.setAttribute('content', plain(t(el.getAttribute('data-i18n-content')))); });
    var root = document.documentElement;
    root.lang = lang;
    root.dir = RTL[lang] ? 'rtl' : 'ltr';
    var sel = $('#lang-select');
    sel.value = lang;
    sel.setAttribute('aria-label', plain(t('lang.label')));
    $('#readme-link').href = 'https://github.com/' + REPO + '/blob/main/README.' + lang + '.md';
    render();
    root.classList.remove('i18n-loading');
  }

  function setLang(next, remember) {
    lang = next;
    if (remember) store(LANG_KEY, next);
    if (next === 'en') { dict = {}; applyStrings(); return; }
    if (cache[next]) { dict = cache[next]; applyStrings(); return; }
    fetch('i18n/' + next + '.json', { cache: 'no-cache' })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (j) { cache[next] = j; if (lang === next) { dict = j; applyStrings(); } })
      .catch(function () { if (lang === next) { dict = {}; applyStrings(); } });
  }

  // ---- install helper -------------------------------------------------------

  function skillDir(agent, scope) {
    var root = agent === 'claude' ? '.claude/skills' : '.agents/skills';
    return scope === 'global' ? '~/' + root : root;
  }
  function curlLine(dir, skill) {
    return 'mkdir -p ' + dir + ' && rm -rf ' + dir + '/' + skill +
      ' && curl -fsSL https://codeload.github.com/' + REPO + '/tar.gz/refs/heads/main | tar -xz -C ' + dir +
      ' --strip-components=2 sonub-skills-main/skills/' + skill;
  }

  function buildPrompt(p) {
    var s = SKILLS[p.skill];
    var scope = text(p.scope === 'global' ? 'prompt.scopeGlobal' : 'prompt.scopeProject');
    var install = 'claude plugin install ' + s.plugin + '@sonub-skills' + (p.scope === 'project' ? ' --scope project' : '');
    var doctor = 'python3 ' + text('prompt.skillFolder') + '/scripts/' + s.script + ' doctor';
    var lines = [
      text('prompt.intro', { skill: p.skill, scope: scope }),
      text('prompt.what', { url: 'https://github.com/' + REPO + '/tree/main/skills/' + p.skill }),
      ''
    ];
    if (p.agent === 'claude') {
      lines.push('1. ' + text('prompt.plugin'),
        '   claude plugin marketplace add ' + REPO,
        '   claude plugin marketplace update sonub-skills',
        '   ' + install,
        '   ' + text('prompt.already', { cmd: 'claude plugin update ' + s.plugin + '@sonub-skills' }));
    } else {
      var dir = skillDir(p.agent, p.scope);
      lines.push('1. ' + text('prompt.folder', { dir: dir }), '   ' + curlLine(dir, p.skill));
    }
    lines.push('2. ' + text(p.skill === 'gp' ? 'prompt.doctorGp' : 'prompt.doctor', { cmd: doctor }),
      '3. ' + text('prompt.report'));
    return lines.join('\n');
  }

  function buildTerminal(p) {
    var s = SKILLS[p.skill], out = [];
    if (p.scope === 'project') out.push('cd path/to/your-project');
    if (p.agent === 'claude') {
      out.push('claude plugin marketplace add ' + REPO,
        'claude plugin install ' + s.plugin + '@sonub-skills' + (p.scope === 'project' ? ' --scope project' : ''));
    } else {
      var dir = skillDir(p.agent, p.scope);
      out.push('DIR=' + dir,
        'mkdir -p "$DIR" && rm -rf "$DIR/' + p.skill + '" && curl -fsSL https://codeload.github.com/' + REPO +
        '/tar.gz/refs/heads/main | tar -xz -C "$DIR" --strip-components=2 "sonub-skills-main/skills/' + p.skill + '"');
    }
    return out.join('\n');
  }

  function buildNotes(p) {
    var s = SKILLS[p.skill], n = [t(p.skill === 'gp' ? 'note.reqGp' : 'note.reqCs')];
    if (p.scope === 'project') n.push(t('note.project'));
    if (p.agent === 'claude') {
      if (p.scope === 'project') n.push(t('note.teamShared'));
      n.push(t('note.reload'), t('note.inChat', { plugin: esc(s.plugin) }));
    } else {
      n.push(t('note.folderUpdate', { path: esc(skillDir(p.agent, p.scope) + '/' + p.skill) }), t('note.newSession'));
    }
    return n;
  }

  // How to call the skill: a slash command in Claude Code, $name in Codex, plain words elsewhere.
  function invoke(agent, cmd, sayKey) {
    if (agent === 'claude') return code('/' + cmd) + ' ' + t('say.or') + ' ' + t(sayKey);
    if (agent === 'codex') return code('$' + cmd) + ' ' + t('say.or') + ' ' + t(sayKey);
    return t(sayKey);
  }

  function buildStart(p) {
    var a = p.agent;
    if (p.skill === 'gp') {
      return [
        t('start.gp1', { cmd: invoke(a, 'gp', 'say.gpSetup') }),
        t('start.gp2', { cmd: invoke(a, 'gp init <board URL>', 'say.gpInit') }),
        t('start.gp3')
      ];
    }
    return [
      t('start.cs1', { cmd: invoke(a, 'claude-skill', 'say.csStart') }),
      t('start.cs2', { cmd: invoke(a, 'claude-skill doctor', 'say.csDoctor') }),
      t('start.cs3', { cmd: invoke(a, 'claude-skill new', 'say.csNew') })
    ];
  }

  function render() {
    $$('[data-pick]').forEach(function (group) {
      var key = group.getAttribute('data-pick');
      $$('[data-pick="' + key + '"] button').forEach(function (b) {
        b.setAttribute('aria-pressed', b.getAttribute('data-val') === picks[key] ? 'true' : 'false');
      });
    });
    $('#out-prompt').textContent = buildPrompt(picks);
    $('#out-term').textContent = buildTerminal(picks);
    $('#out-notes').innerHTML = buildNotes(picks).map(function (h) { return '<li>' + h + '</li>'; }).join('');
    $('#out-start').innerHTML = buildStart(picks).map(function (h) { return '<li>' + h + '</li>'; }).join('');
  }

  function copy(btn) {
    var target = document.getElementById(btn.getAttribute('data-copy'));
    var value = target.textContent;
    var done = function () {
      btn.innerHTML = t('ui.copied');
      btn.classList.add('done');
      clearTimeout(btn._t);
      btn._t = setTimeout(function () { btn.innerHTML = t('ui.copy'); btn.classList.remove('done'); }, 1600);
    };
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(value).then(done, function () { fallback(value); done(); });
    } else { fallback(value); done(); }
  }
  function fallback(value) {
    var ta = document.createElement('textarea');
    ta.value = value; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); } catch (e) {}
    document.body.removeChild(ta);
  }

  function init() {
    readBase();

    var saved = load(PICK_KEY);
    if (saved) {
      try {
        var j = JSON.parse(saved);
        if (SKILLS[j.skill]) picks.skill = j.skill;
        if (/^(claude|codex|gemini|copilot)$/.test(j.agent)) picks.agent = j.agent;
        if (/^(global|project)$/.test(j.scope)) picks.scope = j.scope;
      } catch (e) {}
    }
    var qs = new URLSearchParams(location.search).get('skill');
    if (SKILLS[qs]) picks.skill = qs;

    var sel = $('#lang-select');
    LANGS.forEach(function (l) {
      var o = document.createElement('option');
      o.value = l[0]; o.textContent = l[1]; o.lang = l[0];
      sel.appendChild(o);
    });
    sel.addEventListener('change', function () {
      setLang(sel.value, true);
      var u = new URL(location.href);
      if (u.searchParams.has('lang')) { u.searchParams.set('lang', sel.value); history.replaceState(null, '', u); }
    });

    $$('[data-pick] button').forEach(function (b) {
      b.addEventListener('click', function () {
        picks[b.parentNode.getAttribute('data-pick')] = b.getAttribute('data-val');
        store(PICK_KEY, JSON.stringify(picks));
        render();
      });
    });
    $$('[data-install]').forEach(function (b) {
      b.addEventListener('click', function () {
        picks.skill = b.getAttribute('data-install');
        store(PICK_KEY, JSON.stringify(picks));
        render();
        $('#install').scrollIntoView({ behavior: 'smooth' });
      });
    });
    $$('.copy').forEach(function (b) { b.addEventListener('click', function () { copy(b); }); });

    setLang(lang, false);
    setTimeout(function () { document.documentElement.classList.remove('i18n-loading'); }, 3000);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
