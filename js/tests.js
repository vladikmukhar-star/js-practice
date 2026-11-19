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
  window.JSPTests = { runChecks, render };
})();
