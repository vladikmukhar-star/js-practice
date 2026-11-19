// Спільна автоперевірка: запускає код у Web Worker і викликає функції з тестів.
// checks = [{ fn: 'name', tests: [[args, expected], ...] }]; аргумент {"$fn":"n => n + 1"} стає функцією.
(function () {
  const WORKER = `self.onmessage = e => {
    const { code, checks } = e.data;
    console.log = () => {}; console.error = () => {}; console.warn = () => {};
    const rev = a => (a && typeof a === 'object' && '$fn' in a) ? (0, eval)('(' + a.$fn + ')') : a;
    const out = [];
    let fns;
    try {
      const names = checks.map(c => c.fn);
      fns = (0, eval)(code + '\\n;({' + names.map(n => JSON.stringify(n) + ': (typeof ' + n + ' === "function" ? ' + n + ' : null)').join(',') + '})');
    } catch (er) { postMessage({ err: er.name + ': ' + er.message }); return; }
    for (const c of checks) {
      const f = fns[c.fn];
      if (!f) { postMessage({ err: 'Функцію ' + c.fn + ' не знайдено. Перевір назву й що вона оголошена в коді.' }); return; }
      for (const [args, exp] of c.tests) {
        let got, bad = false;
        try { const a = JSON.parse(JSON.stringify(args)).map(rev); got = f(...a); } catch (er) { got = 'ПОМИЛКА: ' + er.message; bad = true; }
        out.push({ fn: c.fn, args, exp, got: got === undefined ? '__undef__' : got, bad });
      }
    }
    postMessage({ out });
  };`;
  const norm = v => typeof v === 'string' ? v.replace(/[ʼ’]/g, "'") : v;
  const same = (a, b) => JSON.stringify(a, (k, v) => norm(v)) === JSON.stringify(b, (k, v) => norm(v));
  const show = v => v === '__undef__' ? 'undefined' : JSON.stringify(v);
  const argStr = a => a.map(x => (x && typeof x === 'object' && '$fn' in x) ? x.$fn : JSON.stringify(x)).join(', ');

  function runChecks(code, checks) {
    return new Promise(resolve => {
      const w = new Worker(URL.createObjectURL(new Blob([WORKER])));
      const timer = setTimeout(() => { w.terminate(); resolve({ err: '⏱ Зупинено через 3 с — схоже на нескінченний цикл.' }); }, 3000);
      w.onmessage = e => { clearTimeout(timer); w.terminate(); resolve(e.data); };
      w.postMessage({ code, checks });
    });
  }

  // малює результат у панель out, повертає {pass,total}
  function render(out, r, showExpected) {
    out.innerHTML = '';
    const add = (cls, t) => { const d = document.createElement('div'); if (cls) d.className = cls; d.textContent = t; out.appendChild(d); };
    if (r.err) { add('err', r.err); return { pass: 0, total: 0, err: true }; }
    let pass = 0;
    r.out.forEach(t => {
      const ok = !t.bad && same(t.got, t.exp); if (ok) pass++;
      add(ok ? '' : 'err', `${ok ? '✓' : '✗'} ${t.fn}(${argStr(t.args)}) → ${show(t.got)}${ok || !showExpected ? '' : `   (треба ${show(t.exp)})`}`);
    });
    add(pass === r.out.length ? '' : 'info', pass === r.out.length ? `🎉 Усі ${pass} тести пройдено!` : `Пройдено ${pass} з ${r.out.length}. Виправ і перевір ще раз.`);
    return { pass, total: r.out.length, err: false };
  }

  // ---- перевірка виводу консолі (цикли без функцій) ----
  const LOGW = `const fmt = v => typeof v === 'string' ? v : (typeof v === 'function' ? String(v) : (()=>{try{return JSON.stringify(v) ?? String(v)}catch{return String(v)}})());
    const L = [];
    const grab = (...a) => L.push(a.map(x => x === undefined ? 'undefined' : fmt(x)).join(' '));
    console.log = grab; console.warn = grab; console.error = grab;
    self.onmessage = e => {
      try { (0, eval)(e.data); } catch (er) { postMessage({ err: er.name + ': ' + er.message, logs: L }); return; }
      postMessage({ logs: L });
    };`;
  function runLogs(code) {
    return new Promise(resolve => {
      const w = new Worker(URL.createObjectURL(new Blob([LOGW])));
      const timer = setTimeout(() => { w.terminate(); resolve({ err: '⏱ Зупинено через 3 с — схоже на нескінченний цикл.', logs: [] }); }, 3000);
      w.onmessage = e => { clearTimeout(timer); w.terminate(); resolve(e.data); };
      w.postMessage(code);
    });
  }
  const nl = x => String(x).replace(/\s+/g, ' ').trim().replace(/[\u02BC\u2019]/g, "'");
  // tc = { logs:[...], must:[[regex,msg],...] }; повертає {pass,total,err}
  async function checkLogs(code, tc, out) {
    out.innerHTML = '';
    const add = (cls, t) => { const d = document.createElement('div'); if (cls) d.className = cls; d.textContent = t; out.appendChild(d); };
    for (const [re, msg] of (tc.must || [])) if (!new RegExp(re).test(code)) { add('err', '✗ ' + msg); return { pass: 0, total: tc.logs.length, err: true }; }
    const r = await runLogs(code);
    if (r.err) { add('err', r.err); return { pass: 0, total: tc.logs.length, err: true }; }
    const got = r.logs, exp = tc.logs;
    let pass = 0;
    const n = Math.max(got.length, exp.length);
    for (let i = 0; i < n; i++) {
      const g = got[i], e = exp[i];
      if (g !== undefined && e !== undefined && nl(g) === nl(e)) { pass++; add('', `✓ рядок ${i + 1}: ${g}`); }
      else if (g === undefined) add('err', `✗ рядок ${i + 1}: нічого нема (треба "${e}")`);
      else if (e === undefined) add('err', `✗ рядок ${i + 1}: зайвий вивід "${g}"`);
      else add('err', `✗ рядок ${i + 1}: вийшло "${g}" (треба "${e}")`);
    }
    const all = pass === exp.length && got.length === exp.length;
    add(all ? '' : 'info', all ? `🎉 Усі ${exp.length} рядків збіглися!` : `Збіглося ${pass} з ${exp.length}. Виправ і перевір ще раз.`);
    return { pass: all ? exp.length : pass, total: exp.length, err: false };
  }

  // ---- перевірка стану сторінки (DOM-завдання) ----
  // tc.dom = { steps:[js...], assert:[{d:'опис', e:'вираз true/false', g:'що показати, якщо не збіглося'}] }
  function checkDom(code, html, dom, out) {
    out.innerHTML = '';
    const add = (cls, t) => { const d = document.createElement('div'); if (cls) d.className = cls; d.textContent = t; out.appendChild(d); };
    return new Promise(resolve => {
      const token = 'dom' + Math.random().toString(36).slice(2);
      const fr = document.createElement('iframe');
      fr.setAttribute('sandbox', 'allow-scripts'); fr.style.cssText = 'position:absolute;left:-9999px;width:600px;height:400px;border:0';
      const bridge = `<script>window.__logs=[];window.__errs=[];
        (function(){var f=function(v){if(typeof v==='string')return v;if(v instanceof Element)return '<'+v.tagName.toLowerCase()+(v.id?'#'+v.id:'')+'>';if(v===undefined)return 'undefined';try{return JSON.stringify(v)}catch(e){return String(v)}};
        console.log=console.warn=function(){window.__logs.push(Array.prototype.map.call(arguments,f).join(' '))};
        console.error=function(){window.__errs.push(Array.prototype.map.call(arguments,f).join(' '))};
        window.addEventListener('error',function(e){window.__errs.push(e.message)});})();
        var $=function(s){return document.querySelector(s)},$$=function(s){return document.querySelectorAll(s)};
        var rgb=function(el){var m=getComputedStyle(el).color.match(/\\d+/g)||[0,0,0];return m.map(Number)};
        var isRed=function(el){var c=rgb(el);return c[0]>150&&c[1]<100&&c[2]<100},isGreen=function(el){var c=rgb(el);return c[1]>100&&c[0]<100&&c[2]<100},isBlack=function(el){var c=rgb(el);return c[0]<70&&c[1]<70&&c[2]<70};
      <\/script>`;
      const final = `<script>setTimeout(function(){var res=[],stepErr=null;
        try{ ${JSON.stringify(dom.steps || [])}.forEach(function(s){ (0,eval)(s) }); }catch(e){stepErr=String(e)}
        ${JSON.stringify(dom.assert)}.forEach(function(a){var ok=false,g='';try{ok=!!(0,eval)(a.e)}catch(e){g='помилка: '+e.message}
          if(!ok&&a.g&&!g){try{g=String((0,eval)(a.g))}catch(e){}} res.push({d:a.d,ok:ok,g:g})});
        parent.postMessage({T:${JSON.stringify(token)},res:res,errs:window.__errs,stepErr:stepErr},'*')},30);<\/script>`;
      const page = '<!doctype html><html><head><meta charset="utf-8"></head><body>' + bridge + html +
        '<script>\n' + code.replace(/<\/script/gi, '<\\/script') + '\n<\/script>' + final + '</body></html>';
      const done = r => { clearTimeout(timer); window.removeEventListener('message', onMsg); fr.remove(); resolve(r); };
      const onMsg = e => { if (e.source === fr.contentWindow && e.data && e.data.T === token) done(e.data); };
      const timer = setTimeout(() => done({ timeout: true }), 3000);
      window.addEventListener('message', onMsg);
      fr.srcdoc = page; document.body.appendChild(fr);
    }).then(r => {
      if (r.timeout) { add('err', '⏱ Нема відповіді за 3 с. Схоже на нескінченний цикл або помилку.'); return { pass: 0, total: dom.assert.length, err: true }; }
      let pass = 0;
      if (r.errs && r.errs.length) add('err', 'Помилка в коді: ' + r.errs[0]);
      if (r.stepErr) add('err', 'Не вдалося «натиснути» елементи: ' + r.stepErr);
      r.res.forEach(a => { if (a.ok) pass++; add(a.ok ? '' : 'err', `${a.ok ? '✓' : '✗'} ${a.d}${a.ok || !a.g ? '' : `   (зараз: ${a.g})`}`); });
      const all = pass === r.res.length && !(r.errs && r.errs.length);
      add(all ? '' : 'info', all ? `🎉 Усі ${pass} перевірок пройдено!` : `Пройдено ${pass} з ${r.res.length}. Виправ і перевір ще раз.`);
      return { pass, total: r.res.length, err: !all && pass === 0 && !!(r.errs && r.errs.length) };
    });
  }

  // «Поясни своїми словами»: нічого не перевіряється, лише зберігається. force=true: показати завжди.
  function explainBox(host, key, force) {
    let old = ''; try { old = localStorage.getItem(key) || ''; } catch {}
    if (!old && !force && Math.random() > 0.35) return;
    if (host.querySelector('.explain')) return;
    const d = document.createElement('div');
    d.className = 'explain';
    d.innerHTML = '<div class="blk-label">Поясни своїми словами: що робить твій код? (1–2 речення, ніхто не перевіряє)</div><textarea rows="2" style="width:100%;font:inherit;padding:8px"></textarea><small class="saved"></small>';
    const ta = d.querySelector('textarea'); ta.value = old;
    ta.oninput = () => { try { localStorage.setItem(key, ta.value); d.querySelector('.saved').textContent = ' збережено'; } catch {} };
    host.appendChild(d);
  }
  window.JSPTests = { explainBox, runChecks, render, checkLogs, checkDom };
})();
