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

  // Підказка про ТИПОВУ причину розбіжності. Готового рішення не дає, лише куди дивитися.
  let _seen = new Set();
  function hintFor(got, exp) {
    const g = String(got), e = String(exp);
    const num = x => x.trim() !== '' && !isNaN(Number(x));
    let h = '';
    if (/is not a function/.test(g)) h = 'Ти викликаєш те, що не є функцією. Перевір назву, дужки та що саме ти викликаєш.';
    else if (/is not defined/.test(g)) h = 'Такої змінної нема: помилка в назві (великі/малі літери!) або вона оголошена не там, де її видно.';
    else if (/Cannot read properties of (undefined|null)/.test(g)) h = 'Ти береш властивість у undefined. Ланцюжок обірвався раніше: перевір ключі й індекси по порядку.';
    else if (/Assignment to constant/.test(g)) h = 'const не можна перезаписати. Для змінюваного значення потрібен let.';
    else if (g === 'undefined') h = 'Вийшло undefined. Типові причини: забув return; звертаєшся до неіснуючого індексу чи ключа; змінна без значення.';
    else if (g === 'NaN') h = 'NaN: десь рахуєш з undefined або з текстом. Виведи проміжні значення й знайди, де воно з’являється.';
    else if (g === '[object Object]') h = 'Об’єкт склеївся з рядком. Бери потрібний ключ: obj.key.';
    else if (num(g) && num(e) && Math.abs(Number(g) - Number(e)) === 1) h = 'Різниця рівно в 1. Це майже завжди межа: < чи <=, старт з 0 чи з 1, length чи length - 1.';
    else if (num(e) && !num(g) && /^["']?\d+["']?$/.test(g.replace(/"/g, ''))) h = 'Це рядок, а треба число. Перетвори через Number().';
    else if (num(g) && num(e) && Number(g) === 0) h = 'Вийшов 0. Лічильник чи сума не змінювалися: чи спрацьовує умова, чи дійшов цикл до потрібних елементів?';
    else if ((g === 'true' && e === 'false') || (g === 'false' && e === 'true')) h = 'Відповідь протилежна. Перевір умову: знак порівняння (>, >=, ===, !==), або що саме ти повертаєш.';
    else if (g.toLowerCase() === e.toLowerCase()) h = 'Відрізняється лише регістр літер (велика/мала).';
    else if (g.replace(/[^\p{L}\p{N}]/gu, '') === e.replace(/[^\p{L}\p{N}]/gu, '')) h = 'Слова збігаються, відрізняється розділовий знак чи пробіл. Порівняй символ за символом.';
    else if (g.startsWith('[') && e.startsWith('[')) {
      let a, b; try { a = JSON.parse(g); b = JSON.parse(e); } catch {}
      if (a && b) h = a.length < b.length ? 'У масиві не вистачає елементів. Чи всі потрапляють у умову? Чи не рано завершується цикл?' : a.length > b.length ? 'У масиві зайві елементи. Умова пропускає більше, ніж треба.' : 'Кількість елементів та сама, але вміст чи порядок інший. Перевір, що кладеш у масив і в якому порядку.';
    } else if (g.length > e.length && g.includes(e)) h = 'У тебе зайвий текст до/після потрібного.';
    else if (e.length > g.length && e.includes(g)) h = 'У тебе не вистачає частини тексту.';
    if (!h || _seen.has(h)) return '';
    _seen.add(h);
    return '\n   💡 ' + h;
  }
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
    out.innerHTML = ''; _seen = new Set();
    const add = (cls, t) => { const d = document.createElement('div'); if (cls) d.className = cls; d.textContent = t; out.appendChild(d); };
    if (r.err) { add('err', r.err); return { pass: 0, total: 0, err: true }; }
    let pass = 0;
    r.out.forEach(t => {
      const ok = !t.bad && same(t.got, t.exp); if (ok) pass++;
      add(ok ? '' : 'err', `${ok ? '✓' : '✗'} ${t.fn}(${argStr(t.args)}) → ${show(t.got)}${ok || !showExpected ? '' : `   (треба ${show(t.exp)})${hintFor(t.bad ? t.got : show(t.got), show(t.exp))}`}`);
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
    out.innerHTML = ''; _seen = new Set();
    const add = (cls, t) => { const d = document.createElement('div'); if (cls) d.className = cls; d.textContent = t; out.appendChild(d); };
    for (const [re, msg] of (tc.must || [])) if (!new RegExp(re).test(code)) { add('err', '✗ ' + msg); return { pass: 0, total: tc.logs.length, err: true }; }
    const r = await runLogs(code);
    if (r.err) { add('err', r.err + hintFor(r.err, '')); return { pass: 0, total: tc.logs.length, err: true }; }
    const got = r.logs;
    const flat = l => l.map(nl).join(' ').trim();
    // правильним вважаємо: збіг по рядках, або той самий текст (напр. console.log(a, b) замість двох рядків), або запасний варіант alt
    const variants = [tc.logs].concat(tc.alt || []);
    const same = variants.find(v => v.length === got.length && v.every((x, i) => nl(x) === nl(got[i]))) ||
                 variants.find(v => flat(v) === flat(got));
    const exp = same || tc.logs;
    let pass = 0;
    const n = Math.max(got.length, exp.length);
    for (let i = 0; i < n; i++) {
      const g = got[i], e = exp[i];
      if (g !== undefined && e !== undefined && nl(g) === nl(e)) { pass++; add('', `✓ рядок ${i + 1}: ${g}`); }
      else if (same && g !== undefined) { pass++; add('', `✓ рядок ${i + 1}: ${g}`); }
      else if (g === undefined) add('err', `✗ рядок ${i + 1}: нічого нема (треба "${e}")`);
      else if (e === undefined) add('err', `✗ рядок ${i + 1}: зайвий вивід "${g}"`);
      else add('err', `✗ рядок ${i + 1}: вийшло "${g}" (треба "${e}")${hintFor(g, e)}`);
    }
    const all = !!same;
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
