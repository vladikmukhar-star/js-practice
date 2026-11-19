// «Тренажер»: щодня нові завдання на цикли. Передбач (автоперевірка + розбір по колах) і напиши (автотести).
const store = {
  get(k, d) { try { return localStorage.getItem(k) ?? d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch {} }
};
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const app = document.getElementById('app');

// ---------- випадкові числа з «зерна» (щодня один і той самий набір) ----------
function rng(seed) {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) { h = Math.imul(h ^ seed.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
  let a = h >>> 0;
  return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const ri = (r, a, b) => Math.floor(r() * (b - a + 1)) + a;
const pickOne = (r, arr) => arr[Math.floor(r() * arr.length)];

// ---------- генератори завдань «передбач» ----------
const GEN = {
  whileUp(r) {
    const a = ri(r, 1, 6), s = ri(r, 2, 4), op = pickOne(r, ['<=', '<']);
    const b = a + s * ri(r, 2, 4) + ri(r, 0, s - 1);
    const cmp = n => op === '<=' ? n <= b : n < b;
    const out = [], tr = [];
    let n = a;
    while (cmp(n)) { out.push(String(n)); tr.push(`коло ${tr.length + 1}: n = ${n}. Умова ${n} ${op} ${b} — так. Виводимо ${n}. n стає ${n} + ${s} = ${n + s}.`); n += s; }
    tr.push(`n = ${n}. Умова ${n} ${op} ${b} — ні. Цикл зупиняється.`);
    return { title: 'Цикл while: рахуємо вгору', code: `let n = ${a};\nwhile (n ${op} ${b}) {\n  console.log(n);\n  n = n + ${s};\n}`, out, tr };
  },
  whileDown(r) {
    const a = ri(r, 10, 24), s = ri(r, 2, 5), op = pickOne(r, ['>', '>=']);
    const b = a - s * ri(r, 2, 4) - ri(r, 0, s - 1);
    const cmp = n => op === '>' ? n > b : n >= b;
    const out = [], tr = [];
    let n = a;
    while (cmp(n)) { out.push(String(n)); tr.push(`коло ${tr.length + 1}: n = ${n}. Умова ${n} ${op} ${b} — так. Виводимо ${n}. n стає ${n} - ${s} = ${n - s}.`); n -= s; }
    tr.push(`n = ${n}. Умова ${n} ${op} ${b} — ні. Цикл зупиняється.`);
    return { title: 'Цикл while: рахуємо вниз', code: `let n = ${a};\nwhile (n ${op} ${b}) {\n  console.log(n);\n  n = n - ${s};\n}`, out, tr };
  },
  sum(r) {
    const a = ri(r, 1, 4), s = ri(r, 1, 3), b = a + s * ri(r, 2, 4) + ri(r, 0, s);
    let i = a, sum = 0; const tr = [];
    while (i <= b) { tr.push(`коло ${tr.length + 1}: i = ${i}. sum було ${sum}, стало ${sum} + ${i} = ${sum + i}. i стає ${i + s}.`); sum += i; i += s; }
    tr.push(`i = ${i}. Умова ${i} <= ${b} — ні. Цикл зупиняється. Консоль виведе тільки sum.`);
    return { title: 'Накопичення суми (sum)', code: `let i = ${a};\nlet sum = 0;\nwhile (i <= ${b}) {\n  sum = sum + i;\n  i = i + ${s};\n}\nconsole.log(sum);`, out: [String(sum)], tr };
  },
  forMul(r) {
    const a = ri(r, 0, 3), s = ri(r, 1, 3), op = pickOne(r, ['<', '<=']), m = ri(r, 2, 5);
    const b = a + s * ri(r, 3, 5);
    const cmp = i => op === '<' ? i < b : i <= b;
    const out = [], tr = [];
    for (let i = a; cmp(i); i += s) { out.push(String(i * m)); tr.push(`коло ${tr.length + 1}: i = ${i}. Умова ${i} ${op} ${b} — так. Виводимо ${i} * ${m} = ${i * m}. i стає ${i + s}.`); }
    const last = a + s * tr.length;
    tr.push(`i = ${last}. Умова ${last} ${op} ${b} — ні. Цикл зупиняється.`);
    return { title: 'Цикл for', code: `for (let i = ${a}; i ${op} ${b}; i = i + ${s}) {\n  console.log(i * ${m});\n}`, out, tr };
  },
  countLetter(r) {
    const w = pickOne(r, ['banana', 'coffee', 'student', 'balloon', 'success', 'mississippi', 'programming', 'javascript', 'level', 'apple']);
    const ch = w[ri(r, 0, w.length - 1)];
    let c = 0; const tr = [];
    for (let i = 0; i < w.length; i++) {
      const eq = w[i] === ch; if (eq) c++;
      tr.push(`i = ${i}: word[${i}] = '${w[i]}' ${eq ? '=' : '≠'} '${ch}'${eq ? ` — так, count = ${c}` : ' — ні'}`);
    }
    tr.push(`i = ${w.length}: умова ${w.length} < ${w.length} — ні. Цикл зупиняється.`);
    return { title: 'Цикл for по літерах слова', code: `const word = '${w}';\nlet count = 0;\nfor (let i = 0; i < word.length; i = i + 1) {\n  if (word[i] === '${ch}') {\n    count = count + 1;\n  }\n}\nconsole.log(count);`, out: [String(c)], tr };
  },
  breakAt(r) {
    const N = ri(r, 5, 9), K = ri(r, 2, N - 1), m = ri(r, 2, 4);
    const out = [], tr = [];
    for (let i = 1; i <= N; i++) {
      if (i === K) { tr.push(`коло ${i}: i = ${i}. i === ${K} — так, спрацював break. Цикл одразу зупиняється.`); break; }
      out.push(String(i * m)); tr.push(`коло ${i}: i = ${i}. i === ${K} — ні. Виводимо ${i} * ${m} = ${i * m}.`);
    }
    out.push('кінець'); tr.push(`Після циклу: виводимо 'кінець'.`);
    return { title: 'Оператор break', code: `for (let i = 1; i <= ${N}; i = i + 1) {\n  if (i === ${K}) {\n    break;\n  }\n  console.log(i * ${m});\n}\nconsole.log('кінець');`, out, tr };
  }
};
const GEN_KEYS = Object.keys(GEN);

// ---------- завдання «напиши» з автотестами ----------
const WRITE = [
  { id: 'sumTo', fn: 'sumTo', title: 'Сума від 1 до n', text: 'Зроби функцію sumTo з одним параметром n.\nВона повертає (return) суму всіх чисел від 1 до n.\nНаприклад, для n = 3 це 1 + 2 + 3.', hint: 'Усередині функції: let i = 1, let sum = 0, цикл while (i <= n). У циклі: sum = sum + i, потім i = i + 1. Після циклу: return sum.', tests: [[[4], 10], [[1], 1], [[10], 55], [[0], 0]] },
  { id: 'countChar', fn: 'countChar', title: 'Скільки разів літера в слові', text: 'Зроби функцію countChar з двома параметрами: text і char.\nВона повертає, скільки разів літера char є в слові text.', hint: 'let count = 0. Цикл for по всіх літерах: for (let i = 0; i < text.length; i = i + 1). Усередині for: if (text[i] === char) і в ньому count = count + 1. Після for: return count.', tests: [[['banana', 'a'], 3], [['banana', 'n'], 2], [['banana', 'z'], 0], [['', 'a'], 0]] },
  { id: 'sumEven', fn: 'sumEven', title: 'Сума парних до n', text: 'Зроби функцію sumEven з параметром n.\nВона повертає суму всіх парних чисел від 1 до n.\nПарне число ділиться на 2 без остачі: i % 2 === 0.', hint: 'Як у sumTo, але sum = sum + i робиш тільки всередині if (i % 2 === 0).', tests: [[[10], 30], [[1], 0], [[7], 12], [[2], 2]] },
  { id: 'factorial', fn: 'factorial', title: 'Факторіал', text: 'Зроби функцію factorial з параметром n.\nВона повертає добуток усіх чисел від 1 до n (1 * 2 * 3 * ... * n).\nДля 0 результат 1.', hint: 'Як sumTo, але коробка result починається з 1, а не з 0. На кожному колі: result = result * i.', tests: [[[5], 120], [[1], 1], [[0], 1], [[3], 6]] },
  { id: 'firstIndex', fn: 'firstIndex', title: 'Перший індекс літери', text: 'Зроби функцію firstIndex з параметрами text і char.\nВона повертає номер (індекс) першої літери char у слові text.\nЯкщо такої літери нема, поверни -1.', hint: 'Цикл for по літерах. Усередині: if (text[i] === char) і в ньому return i. Після циклу: return -1.', tests: [[['apple', 'p'], 1], [['apple', 'e'], 4], [['apple', 'z'], -1], [['banana', 'n'], 2]] },
  { id: 'repeatText', fn: 'repeatText', title: 'Повторити текст', text: 'Зроби функцію repeatText з параметрами text і times.\nВона повертає рядок, у якому text повторено times разів.\nrepeatText("ab", 3) дає "ababab".', hint: 'let result = "". Цикл for, який робить times кіл: for (let i = 0; i < times; i = i + 1). У циклі result = result + text. Після: return result.', tests: [[['ab', 3], 'ababab'], [['x', 1], 'x'], [['x', 0], ''], [['hi', 2], 'hihi']] },
  { id: 'reverseText', fn: 'reverseText', title: 'Слово навпаки', text: 'Зроби функцію reverseText з параметром text.\nВона повертає слово навпаки: reverseText("abc") дає "cba".', hint: 'let result = "". Цикл for, який іде з кінця: for (let i = text.length - 1; i >= 0; i = i - 1). У циклі result = result + text[i]. Після: return result.', tests: [[['abc'], 'cba'], [['a'], 'a'], [['hello'], 'olleh'], [[''], '']] },
  { id: 'hasDigit', fn: 'hasDigit', title: 'Чи є цифра', text: 'Зроби функцію hasDigit з параметром text.\nВона повертає true, якщо в тексті є хоч одна цифра, і false, якщо нема.', hint: 'Цикл for по літерах. Усередині: if ("0123456789".includes(text[i])) і в ньому return true. Після циклу: return false.', tests: [[['abc1'], true], [['abc'], false], [['7'], true], [[''], false]] },
  { id: 'countVowels', fn: 'countVowels', title: 'Голосні літери', text: 'Зроби функцію countVowels з параметром text.\nВона повертає, скільки голосних (a, e, i, o, u) у тексті. Великі літери теж рахуються.', hint: 'let count = 0. for по літерах. Усередині for: if ("aeiou".includes(text[i].toLowerCase())) і в ньому count = count + 1. Після for: return count.', tests: [[['Education'], 5], [['rhythm'], 0], [['AEIOU'], 5], [['sky'], 0]] },
  { id: 'countSpaces', fn: 'countSpaces', title: 'Скільки пробілів', text: 'Зроби функцію countSpaces з параметром text.\nВона повертає, скільки пробілів у тексті.', hint: 'Як countChar, але порівнюєш text[i] === " " (пробіл у лапках).', tests: [[['a b c'], 2], [['abc'], 0], [['  '], 2], [[''], 0]] }
];

// ---------- запуск тестів у Worker (з таймаутом) ----------
function runTests(code, w) {
  return new Promise(resolve => {
    const src = `self.onmessage = e => {
      const { code, fname, tests } = e.data;
      console.log = () => {}; console.error = () => {}; console.warn = () => {};
      try {
        const f = (0, eval)(code + '\\n;typeof ' + fname + ' === "function" ? ' + fname + ' : null');
        if (!f) { postMessage({ err: 'Функцію ' + fname + ' не знайдено. Перевір назву.' }); return; }
        const out = [];
        for (const [args, exp] of tests) {
          let got; try { got = f(...args); } catch (er) { got = 'ПОМИЛКА: ' + er.message; }
          out.push({ args, exp, got: got === undefined ? 'undefined' : got });
        }
        postMessage({ out });
      } catch (er) { postMessage({ err: er.name + ': ' + er.message }); }
    };`;
    const worker = new Worker(URL.createObjectURL(new Blob([src])));
    const timer = setTimeout(() => { worker.terminate(); resolve({ err: '⏱ Зупинено через 3 с — схоже на нескінченний цикл.' }); }, 3000);
    worker.onmessage = e => { clearTimeout(timer); worker.terminate(); resolve(e.data); };
    worker.postMessage({ code, fname: w.fn, tests: w.tests });
  });
}

// ---------- стан: дні, серія ----------
const dayKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const loadState = () => { try { return JSON.parse(store.get('jsp:train', '{}')); } catch { return {}; } };
const saveState = s => store.set('jsp:train', JSON.stringify(s));
function streak(st) {
  let n = 0; const d = new Date();
  if (!(st.days && st.days[dayKey(d)])) d.setDate(d.getDate() - 1);   // сьогодні ще можна встигнути
  while (st.days && st.days[dayKey(d)]) { n++; d.setDate(d.getDate() - 1); }
  return n;
}
function mark(st, id) {
  st.days = st.days || {}; const k = dayKey();
  st.days[k] = st.days[k] || {}; st.days[k][id] = 1;
  st.total = st.total || {}; st.total[id.split(':')[0]] = (st.total[id.split(':')[0]] || 0) + 1;
  saveState(st);
}

// ---------- відмальовка ----------
function predictCard(g, id, st, doneAlready) {
  const el = document.createElement('div');
  el.className = 'task rev';
  el.innerHTML = `<div class="task-head" style="cursor:default"><span class="lvl">Передбач</span><span class="task-title">${esc(g.title)}</span><span class="tdone">${doneAlready ? '✓ вже зроблено' : ''}</span></div>
  <div class="task-body">
    <div class="col-spec"><div class="blk-label">Що виведе консоль? Код не запускай.</div><pre><code>${esc(g.code)}</code></pre></div>
    <div class="col-work">
      <div class="blk-label">Твоя відповідь (кожен рядок консолі з нового рядка; масив пиши як у консолі: [1,2,3])</div>
      <textarea class="pred" rows="4" spellcheck="false" placeholder="Напиши, що виведе консоль…" style="width:100%;font-family:var(--mono);font-size:17px;padding:10px;border-radius:8px;border:1px solid #cbd5e1"></textarea>
      <div class="actions"><button class="chk-btn">Перевірити</button> <button class="sec show-tr">Показати розбір по колах</button></div>
      <div class="res" style="margin-top:10px;font-weight:600"></div>
      <pre class="trace" hidden style="background:#0f172a;color:#e2e8f0;padding:14px;border-radius:8px;white-space:pre-wrap;font-family:var(--mono);font-size:15px;line-height:1.7">${esc(g.tr.join('\n'))}</pre>
    </div>
  </div>`;
  const ta = el.querySelector('.pred'), res = el.querySelector('.res'), tr = el.querySelector('.trace');
  el.querySelector('.show-tr').onclick = () => { tr.hidden = !tr.hidden; };
  el.querySelector('.chk-btn').onclick = () => {
    const got = ta.value.split('\n').map(x => x.trim()).filter(Boolean);
    const nz = x => String(x).replace(/\s+/g, '').replace(/'/g, '"');
    const ok = got.length === g.out.length && got.every((x, i) => nz(x) === nz(g.out[i]));
    if (ok) {
      res.style.color = '#15803d'; res.textContent = '✓ Правильно!';
      if (!el.dataset.marked) { el.dataset.marked = 1; mark(st, id); refreshHead(st); el.querySelector('.tdone').textContent = '✓ зроблено'; }
    } else {
      res.style.color = '#b91c1c';
      res.textContent = '✗ Не збігається. Ось розбір по колах, прочитай його і спробуй ще раз (відповідь я не показую).';
      tr.hidden = false;
    }
  };
  return el;
}

function writeCard(w, id, st, doneAlready) {
  const el = document.createElement('div');
  el.className = 'task rev';
  el.innerHTML = `<div class="task-head" style="cursor:default"><span class="lvl">Напиши</span><span class="task-title">${esc(w.title)}</span><span class="tdone">${doneAlready ? '✓ вже зроблено' : ''}</span></div>
  <div class="task-body">
    <div class="col-spec"><div class="blk-label">Завдання</div><pre><code>${esc(w.text)}</code></pre></div>
    <div class="col-work">
      <div class="blk-label">Твій код (пиши з порожнього екрана)</div>
      <textarea class="code" spellcheck="false"></textarea>
      <div class="actions"><button class="run">▶ Перевірити тестами</button> <button class="sec hint-btn">Підказка (одна)</button> <small class="kbd-hint">Cmd/Ctrl+Enter — перевірка</small></div>
      <div class="hint-box" hidden style="margin-top:8px;padding:10px 12px;background:#fef9c3;border-radius:8px;color:#713f12"></div>
      <div class="out" style="margin-top:8px"><span class="info">Тут буде результат тестів</span></div>
    </div>
  </div>`;
  const ta = el.querySelector('.code'), out = el.querySelector('.out');
  const CK = `jsp:train:code:${w.id}`;
  let init = store.get(CK, `// Твій код тут\n`); ta.value = init;
  const check = async () => {
    out.textContent = 'Перевіряю…';
    const r = await runTests(cm ? cm.getValue() : ta.value, w);
    out.innerHTML = '';
    const add = (cls, t) => { const d = document.createElement('div'); if (cls) d.className = cls; d.textContent = t; out.appendChild(d); };
    if (r.err) { add('err', r.err); return; }
    let pass = 0;
    r.out.forEach(t => {
      const okk = JSON.stringify(t.got) === JSON.stringify(t.exp); if (okk) pass++;
      const call = `${w.fn}(${t.args.map(a => JSON.stringify(a)).join(', ')})`;
      add(okk ? '' : 'err', `${okk ? '✓' : '✗'} ${call}  →  ${JSON.stringify(t.got)}${okk ? '' : `  (треба ${JSON.stringify(t.exp)})`}`);
    });
    if (pass === r.out.length) {
      add('', '🎉 Усі тести пройдено!');
      if (!el.dataset.marked) { el.dataset.marked = 1; st.wpassed = st.wpassed || {}; st.wpassed[w.id] = 1; mark(st, id); refreshHead(st); el.querySelector('.tdone').textContent = '✓ зроблено'; }
    } else add('info', `Пройдено ${pass} з ${r.out.length}. Виправ і запусти ще раз.`);
  };
  const cm = makeEditor(ta, check);
  if (cm) { setTimeout(() => cm.refresh(), 0); setTimeout(() => cm.refresh(), 300); }
  if (cm) { cm.on('change', () => store.set(CK, cm.getValue())); cm.setCursor(cm.lineCount(), 0); }
  else ta.oninput = () => store.set(CK, ta.value);
  el.querySelector('.run').onclick = check;
  el.querySelector('.hint-btn').onclick = () => { const b = el.querySelector('.hint-box'); b.textContent = w.hint; b.hidden = false; };
  return el;
}

function bugCard(b, id, st, doneAlready) {
  const el = document.createElement('div');
  el.className = 'task rev';
  el.innerHTML = `<div class="task-head" style="cursor:default"><span class="lvl">Знайди помилку${b.level ? ' · ' + b.level : ''}</span><span class="task-title">${esc(b.title)}</span><span class="tdone">${doneAlready ? '✓ вже зроблено' : ''}</span></div>
  <div class="task-body">
    <div class="col-spec"><div class="blk-label">Завдання</div><pre><code>${esc(b.text)}</code></pre></div>
    <div class="col-work">
      <div class="blk-label">Код з помилкою. Виправ його прямо тут</div>
      <textarea class="code" spellcheck="false"></textarea>
      <div class="actions"><button class="run">▶ Перевірити тестами</button> <button class="sec hint-btn">Підказка (одна)</button> <button class="sec reset">Скинути код</button></div>
      <div class="hint-box" hidden style="margin-top:8px;padding:10px 12px;background:#fef9c3;border-radius:8px;color:#713f12"></div>
      <div class="out" style="margin-top:8px"><span class="info">Тут буде результат тестів</span></div>
    </div>
  </div>`;
  const ta = el.querySelector('.code'), out = el.querySelector('.out');
  const CK = `jsp:train:code:${b.id}`;
  ta.value = store.get(CK, b.code);
  const check = async () => {
    out.textContent = 'Перевіряю…';
    const r = await JSPTests.runChecks(cm ? cm.getValue() : ta.value, [{ fn: b.fn, tests: b.tests }]);
    const res = JSPTests.render(out, r, true);
    if (!res.err && res.pass === res.total && !el.dataset.marked) {
      el.dataset.marked = 1; st.bpassed = st.bpassed || {}; st.bpassed[b.id] = 1; mark(st, id); refreshHead(st);
      el.querySelector('.tdone').textContent = '✓ зроблено';
      JSPTests.explainBox(el.querySelector('.col-work'), `jsp:train:explain:${b.id}`, false);
    }
  };
  const cm = makeEditor(ta, check);
  if (cm) { setTimeout(() => cm.refresh(), 0); setTimeout(() => cm.refresh(), 300); }
  if (cm) cm.on('change', () => store.set(CK, cm.getValue())); else ta.oninput = () => store.set(CK, ta.value);
  el.querySelector('.run').onclick = check;
  el.querySelector('.hint-btn').onclick = () => { const h = el.querySelector('.hint-box'); h.textContent = b.hint; h.hidden = false; };
  el.querySelector('.reset').onclick = () => { if (confirm('Повернути код з помилкою?')) { if (cm) cm.setValue(b.code); else ta.value = b.code; store.set(CK, b.code); } };
  return el;
}
function refreshHead(st) {
  const k = dayKey(), today = Object.keys((st.days || {})[k] || {}).length;
  document.getElementById('tr-sum').textContent = `Серія: ${streak(st)} дн. · Сьогодні зроблено: ${today}`;
}

function main() {
  const st = loadState();
  const today = dayKey();
  const topic = store.get('jsp:train:topic', 'loops'); const TP = TRAIN_TOPICS[topic] || TRAIN_TOPICS.loops;
  const r = rng('daily-' + today + (topic === 'loops' ? '' : ':' + topic));
  // 3 різні генератори на день
  const keys = TP.gens.slice().sort(() => r() - 0.5).slice(0, 3);
  const doneToday = (st.days && st.days[today]) || {};
  app.innerHTML = '';
  const add = el => app.appendChild(el);
  const h = t => { const d = document.createElement('h2'); d.textContent = t; d.style.margin = '22px 0 8px'; add(d); };
  const tabs = document.createElement('div'); tabs.className = 'exportbar'; tabs.style.cssText = 'padding:0;margin:0 0 6px';
  tabs.innerHTML = Object.entries(TRAIN_TOPICS).map(([k, v]) => `<button class="${k === topic ? '' : 'sec'}" data-t="${k}" style="${k === topic ? 'outline:3px solid #0f172a;outline-offset:2px' : 'opacity:.75'}">${v.name}</button>`).join(' ');
  tabs.onclick = e => { const b = e.target.closest('button[data-t]'); if (b) { store.set('jsp:train:topic', b.dataset.t); main(); } };
  add(tabs);
  h(`Сьогодні, ${today} · ${TP.name}`);
  keys.forEach((k, i) => { const rr = rng(`${today}:${k}`); const g = GEN[k](rr); const id = `p:${today}:${topic}:${i}`; add(predictCard(g, id, st, !!doneToday[id])); });
  // 1 завдання на написання: спочатку ще не розв'язані
  const wp = st.wpassed || {};
  const WR = WRITE.filter(w => TP.write.includes(w.id));
  const unsolved = WR.filter(w => !wp[w.id]);
  const dayNum = Math.floor(new Date(today).getTime() / 86400000);
  const pool = unsolved.length ? unsolved : WR;
  const w = pool[dayNum % pool.length];
  const wid = `w:${today}:${topic}`;
  add(writeCard(w, wid, st, !!doneToday[wid]));
  // знайди помилку: спершу ті, що ще не пройдені
  const bp = st.bpassed || {};
  const BG = BUGS.filter(b => TP.bugs.includes(b.id));
  const bpool = BG.filter(x => !bp[x.id]).length ? BG.filter(x => !bp[x.id]) : BG;
  const bug = bpool[dayNum % bpool.length];
  const bid = `b:${today}:${topic}`;
  add(bugCard(bug, bid, st, !!doneToday[bid]));
  // додаткові
  const more = document.createElement('div'); more.style.margin = '18px 0'; more.className = 'exportbar'; more.style.padding = '0';
  more.innerHTML = '<button class="more-p">+ Ще одне «передбач»</button> <button class="sec more-w">+ Ще одне «напиши»</button> <button class="sec more-b">+ Ще одне «знайди помилку»</button>';
  add(more);
  const holder = document.createElement('div'); add(holder);
  more.querySelector('.more-p').onclick = () => { const k = pickOne(Math.random, TP.gens); const g = GEN[k](Math.random); holder.prepend(predictCard(g, `px:${Date.now()}`, st, false)); };
  more.querySelector('.more-w').onclick = () => {
    const rest = WR.filter(x => !(st.wpassed || {})[x.id] && x.id !== w.id);
    const x = rest.length ? pickOne(Math.random, rest) : pickOne(Math.random, WR);
    holder.prepend(writeCard(x, `wx:${Date.now()}`, st, false));
  };
  more.querySelector('.more-b').onclick = () => {
    const rest = BG.filter(x => !(st.bpassed || {})[x.id] && x.id !== bug.id);
    const x = rest.length ? pickOne(Math.random, rest) : pickOne(Math.random, BG);
    holder.prepend(bugCard(x, `bx:${Date.now()}`, st, false));
  };
  refreshHead(st);
}
// main() запускається з train-arrays.js (після підключення тем)
