// Генерує сторінку модуля з data/module-N.json. Відповідей тут немає — тільки ТЗ.
const N = new URLSearchParams(location.search).get('m') || '1';
const app = document.getElementById('app');
const store = {
  get(k, d) { try { return localStorage.getItem(k) ?? d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch {} }
};
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// мінімальний markdown: ```код```, `код`, **жирний**, списки, абзаци
function md(src) {
  const parts = src.split(/```[a-z]*\n?([\s\S]*?)```/);
  return parts.map((p, i) => {
    if (i % 2) return `<pre><code>${esc(p.trimEnd())}</code></pre>`;
    return esc(p)
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>')
      .split(/\n{2,}/).map(b => {
        const lines = b.trim().split('\n');
        if (lines.length && lines.every(l => /^\s*[-*] /.test(l)))
          return '<ul>' + lines.map(l => `<li>${l.replace(/^\s*[-*] /, '')}</li>`).join('') + '</ul>';
        return b.trim() ? `<p>${b.trim().replace(/\n/g, '<br>')}</p>` : '';
      }).join('');
  }).join('');
}

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

function taskHTML(t) {
  return `<div class="task" data-id="${t.id}">
    <span class="lvl">${t.level}</span>
    <input type="checkbox" class="chk done" title="Зроблено"> <small>Зроблено</small>
    <pre><code>${esc(t.description)}</code></pre>
    <details class="predbox"><summary>Моє передбачення (необов'язково)</summary>
    <textarea class="pred" placeholder="Напиши, що очікуєш у консолі…"></textarea></details>
    <label>Мій код</label>
    <textarea class="code" spellcheck="false"></textarea>
    <button class="run">▶ Запустити</button>
    <button class="sec reset">Скинути код</button>
    <div class="out"><span class="info">Тут буде консоль</span></div>
    <details><summary>Приклад такого ж формату (інші значення)</summary><pre><code>${esc(t.example || '')}</code></pre></details>
  </div>`;
}

async function main() {
  const res = await fetch(`data/module-${N}.json`);
  if (!res.ok) { app.innerHTML = `<p>Модуль ${N} ще не додано.</p>`; document.getElementById('title').textContent = `Модуль ${N}`; return; }
  const m = await res.json();
  document.title = m.title;
  document.getElementById('title').textContent = m.title;
  app.innerHTML = m.topics.map(tp => `
    <section class="topic"><h2>${esc(tp.title)}</h2>
    <div class="intro">${md(tp.intro || '')}</div>
    ${tp.tasks.map(taskHTML).join('')}</section>`).join('');

  const byId = {};
  m.topics.forEach(tp => tp.tasks.forEach(t => byId[t.id] = t));
  app.querySelectorAll('.task').forEach(el => {
    const id = el.dataset.id, t = byId[id];
    const code = el.querySelector('.code'), pred = el.querySelector('.pred'), chk = el.querySelector('.chk');
    const K = k => `jsp:${N}:${id}:${k}`;
    code.value = store.get(K('code'), t.starter || '');
    pred.value = store.get(K('pred'), '');
    chk.checked = store.get(K('done'), '') === '1';
    code.oninput = () => store.set(K('code'), code.value);
    pred.oninput = () => store.set(K('pred'), pred.value);
    chk.onchange = () => store.set(K('done'), chk.checked ? '1' : '');
    code.onkeydown = e => { if (e.key === 'Tab') { e.preventDefault(); document.execCommand('insertText', false, '  '); } };
    el.querySelector('.run').onclick = () => runCode(code.value, el.querySelector('.out'));
    el.querySelector('.reset').onclick = () => { if (confirm('Скинути код до початкового?')) { code.value = t.starter || ''; store.set(K('code'), code.value); } };
  });
}
main();
