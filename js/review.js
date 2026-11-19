// Режим «Повторення»: випадкові вже зроблені завдання, які треба написати з порожнього екрана.
const store = {
  get(k, d) { try { return localStorage.getItem(k) ?? d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch {} }
};
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const MODULES = [1, 2, 3, 4, 5, 6, 7, 8];
const app = document.getElementById('app');

// виконання коду у Web Worker із таймаутом 3 с (захист від нескінченних циклів)
function runCode(code, out) {
  out.innerHTML = '';
  const add = (cls, text) => { const d = document.createElement('div'); if (cls) d.className = cls; d.textContent = text; out.appendChild(d); };
  const src = `
    const fmt = v => typeof v === 'string' ? v : (typeof v === 'function' ? String(v) : (()=>{try{return JSON.stringify(v) ?? String(v)}catch{return String(v)}})());
    const send = (t, a) => postMessage({t, s: a.map(x => (x === undefined ? 'undefined' : fmt(x))).join(' ')});
    console.log = (...a) => send('log', a);
    console.error = (...a) => send('err', a);
    console.warn = (...a) => send('log', a);
    self.onmessage = e => {
      try { (0, eval)(e.data); } catch (err) { postMessage({t:'err', s: err.name + ': ' + err.message}); }
      postMessage({t:'end'});
    };`;
  const w = new Worker(URL.createObjectURL(new Blob([src])));
  const timer = setTimeout(() => { w.terminate(); add('err', '⏱ Зупинено через 3 с — схоже на нескінченний цикл.'); }, 3000);
  w.onmessage = e => {
    if (e.data.t === 'end') { clearTimeout(timer); w.terminate(); if (!out.children.length) add('info', '(консоль порожня)'); }
    else add(e.data.t === 'err' ? 'err' : '', e.data.s);
  };
  w.postMessage(code);
}


const loadStats = () => { try { return JSON.parse(store.get('jsp:rev:stats', '{}')); } catch { return {}; } };
const saveStats = s => store.set('jsp:rev:stats', JSON.stringify(s));

async function loadAll() {
  const out = [];
  for (const n of MODULES) {
    try {
      const r = await fetch(`data/module-${n}.json`);
      if (!r.ok) continue;
      const m = await r.json();
      m.topics.forEach(tp => tp.tasks.forEach(t => out.push({ ...t, mod: n, topic: tp.title, key: `${n}:${t.id}` })));
    } catch {}
  }
  return out;
}

function weight(t, stats) {
  const st = stats[t.key] || { ok: 0, fail: 0, last: 0 };
  // дні від останнього УСПІШНОГО повторення; ніколи не виходило / не повторював = як 10 днів
  const days = st.lastOk ? Math.min(30, (Date.now() - st.lastOk) / 86400000) : 10;
  // старі невдачі «згасають», якщо після них був успіх
  const failW = st.fail * (st.lastOk && st.lastOk > (st.lastFail || 0) ? 1.5 : 3);
  let w = 1 + failW + days / 3 - Math.min(st.ok, 5) * 0.3;
  try { const ts = JSON.parse(localStorage.getItem('jsp:' + t.key + ':tstat') || 'null'); if (ts && ts.passed === false) w += 3; } catch {}
  if (/передбач/i.test(t.description)) w *= 0.3;      // задачі «передбач» менш корисні для письма
  if (/підсумков|фінальн/i.test(t.topic)) w *= 1.3;   // підсумкові — цінніші
  return Math.max(w, 0.2);
}

function pick(pool, n, stats) {
  const chosen = [], rest = pool.slice(), usedTopics = new Set();
  while (chosen.length < n && rest.length) {
    const pref = rest.filter(t => !usedTopics.has(t.topic));
    const src = pref.length ? pref : rest;
    const total = src.reduce((a, t) => a + weight(t, stats), 0);
    let r = Math.random() * total, idx = 0;
    for (; idx < src.length; idx++) { r -= weight(src[idx], stats); if (r <= 0) break; }
    const t = src[Math.min(idx, src.length - 1)];
    chosen.push(t); usedTopics.add(t.topic);
    rest.splice(rest.indexOf(t), 1);
  }
  return chosen;
}

function taskHTML(t) {
  return `<div class="task rev" data-key="${t.key}">
    <div class="task-head" style="cursor:default">
      <span class="lvl">${esc(t.level)}</span>
      <span class="task-title">${esc(t.topic)}</span>
    </div>
    <div class="task-body">
      <div class="col-spec"><div class="blk-label">Завдання (ТЗ)</div><pre><code>${esc(t.description)}</code></pre></div>
      <div class="col-work">
        <div class="blk-label">Пиши з порожнього екрана</div>
        <textarea class="code" spellcheck="false"></textarea>
        <div class="actions"><button class="run">▶ Запустити</button> <small class="kbd-hint">Cmd/Ctrl+Enter — запуск</small></div>
        <div class="out"><span class="info">Тут буде консоль</span></div>
      </div>
      <div class="col-example">
        <div class="rev-help">
          <button class="sec show-ex">Показати приклад (після спроби!)</button>
          <button class="sec show-old">Показати моє старе рішення</button>
        </div>
        <div class="ex-box" hidden><div class="blk-label">Приклад такої ж форми</div><pre><code>${esc(t.example || '')}</code></pre></div>
        <div class="old-box" hidden><div class="blk-label">Моє старе рішення</div><pre><code class="old-code"></code></pre></div>
        <div class="rev-result">
          <span>Результат:</span>
          <button class="res-ok">✅ Вийшло сам</button>
          <button class="res-fail sec">❌ Не вийшло / з підказкою</button>
          <span class="res-state"></span>
        </div>
      </div>
    </div>
  </div>`;
}

function summary(stats) {
  let ok = 0, fail = 0;
  Object.values(stats).forEach(s => { ok += s.ok; fail += s.fail; });
  return `Усього повторень: ${ok + fail} · вийшло сам: ${ok} · не вийшло: ${fail}`;
}

function exportText(tasks, stats) {
  const lines = ['# Повторення', `Експорт: ${new Date().toLocaleString('uk-UA')}`, ''];
  tasks.forEach(t => {
    const code = store.get(`jsp:rev:code:${t.key}`, '');
    const st = stats[t.key] || { ok: 0, fail: 0 };
    lines.push(`--- ${t.topic} (${t.level}) · успіхів ${st.ok}, невдач ${st.fail} ---`, '```js', code || '(порожньо)', '```', '');
  });
  return lines.join('\n');
}

async function main() {
  const all = await loadAll();
  const pool = all.filter(t => !t.html && store.get(`jsp:${t.mod}:${t.id}:done`, '') === '1');
  const stats = loadStats();
  const head = document.getElementById('rev-head');
  if (!pool.length) {
    app.innerHTML = '<div class="topic"><div class="topic-body"><p>Повторювати поки нічого: познач кілька завдань як «Зроблено» на сторінках модулів.</p></div></div>';
    return;
  }
  let n = parseInt(store.get('jsp:rev:n', '3'), 10) || 3;
  let ids; try { ids = JSON.parse(store.get('jsp:rev:current', '[]')); } catch { ids = []; }
  let tasks = ids.map(k => pool.find(t => t.key === k)).filter(Boolean);
  const render = () => {
    app.innerHTML = tasks.map(taskHTML).join('');
    head.querySelector('.sum').textContent = summary(loadStats());
    app.querySelectorAll('.task').forEach(el => {
      const t = tasks.find(x => x.key === el.dataset.key);
      const ta = el.querySelector('.code'), out = el.querySelector('.out');
      const CK = `jsp:rev:code:${t.key}`;
      let init = store.get(CK, t.starter || '// Твій код тут');
      if (!init.endsWith('\n')) init += '\n';
      ta.value = init;
      const run = () => runCode(cm ? cm.getValue() : ta.value, out);
      const cm = makeEditor(ta, run);
      if (cm) { cm.on('change', () => store.set(CK, cm.getValue())); cm.setCursor(cm.lineCount(), 0); }
      else ta.oninput = () => store.set(CK, ta.value);
      el.querySelector('.run').onclick = run;
      el.querySelector('.show-ex').onclick = () => el.querySelector('.ex-box').hidden = !el.querySelector('.ex-box').hidden;
      el.querySelector('.show-old').onclick = () => {
        const box = el.querySelector('.old-box');
        el.querySelector('.old-code').textContent = store.get(`jsp:${t.mod}:${t.id}:code`, '(старого рішення нема)');
        box.hidden = !box.hidden;
      };
      const mark = ok => {
        const s = loadStats(); const st = s[t.key] || { ok: 0, fail: 0, last: 0 };
        ok ? st.ok++ : st.fail++; st.last = Date.now(); if (ok) st.lastOk = st.last; else st.lastFail = st.last; s[t.key] = st; saveStats(s);
        el.querySelector('.res-state').textContent = ok ? ' записано: вийшло ✓' : ' записано: ще повторимо';
        head.querySelector('.sum').textContent = summary(s);
      };
      el.querySelector('.res-ok').onclick = () => mark(true);
      el.querySelector('.res-fail').onclick = () => mark(false);
    });
  };
  const fresh = () => {
    tasks = pick(pool, Math.min(n, pool.length), loadStats());
    store.set('jsp:rev:current', JSON.stringify(tasks.map(t => t.key)));
    render(); window.scrollTo(0, 0);
  };
  head.querySelector('.new').onclick = () => { if (!tasks.length || confirm('Взяти нову добірку? Поточна зникне зі сторінки (код збережеться).')) fresh(); };
  const sel = head.querySelector('.cnt'); sel.value = String(n);
  sel.onchange = () => { n = parseInt(sel.value, 10); store.set('jsp:rev:n', String(n)); fresh(); };
  head.querySelector('.exp').onclick = () => {
    const blob = new Blob([exportText(tasks, loadStats())], { type: 'text/plain;charset=utf-8' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'review.txt'; a.click();
  };
  head.querySelector('.cp').onclick = async e => {
    try { await navigator.clipboard.writeText(exportText(tasks, loadStats())); e.target.textContent = 'Скопійовано ✓'; setTimeout(() => e.target.textContent = '📋 Копіювати код', 1500); } catch {}
  };
  if (!tasks.length) fresh(); else render();
}
main();
