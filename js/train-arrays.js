// Тренажер: теми «Масиви і методи» та «Об'єкти». Відповіді «передбач» рахуються реальним запуском коду.
(function () {
  const sh = v => v === undefined ? 'undefined' : typeof v === 'string' ? v : JSON.stringify(v);
  const arr = a => JSON.stringify(a);
  const nums = (r, n, lo = 1, hi = 9) => Array.from({ length: n }, () => ri(r, lo, hi));
  const WORDS = ['кіт', 'собака', 'риба', 'птах', 'лис', 'ведмідь', 'бобер', 'їжак', 'олень', 'слон'];

  const G = {
    arrMap(r) {
      const a = nums(r, ri(r, 4, 5)), k = ri(r, 2, 4);
      const op = pickOne(r, [['n * ' + k, n => n * k, n => `${n} * ${k} = ${n * k}`], ['n + ' + k, n => n + k, n => `${n} + ${k} = ${n + k}`], ['n * n', n => n * n, n => `${n} * ${n} = ${n * n}`]]);
      const res = a.map(op[1]);
      return { title: 'map: нові значення', code: `const nums = ${arr(a)};\nconst result = nums.map(n => ${op[0]});\nconsole.log(result);\nconsole.log(nums);`,
        out: [arr(res), arr(a)], tr: a.map((n, i) => `елемент ${i}: n = ${n} → ${op[2](n)}`).concat(['map повертає НОВИЙ масив із результатів.', 'Масив nums map не змінює: другий рядок консолі це старий масив.']) };
    },
    arrFilter(r) {
      const a = nums(r, ri(r, 5, 6), 1, 12);
      const c = pickOne(r, [() => { const t = ri(r, 4, 8); return [`n > ${t}`, n => n > t, n => `${n} > ${t}`]; }, () => ['n % 2 === 0', n => n % 2 === 0, n => `${n} % 2 = ${n % 2}, треба 0`], () => ['n % 3 === 0', n => n % 3 === 0, n => `${n} % 3 = ${n % 3}, треба 0`]])();
      const res = a.filter(c[1]);
      return { title: 'filter: що залишиться', code: `const nums = ${arr(a)};\nconst result = nums.filter(n => ${c[0]});\nconsole.log(result);\nconsole.log(result.length);`,
        out: [arr(res), String(res.length)], tr: a.map((n, i) => `елемент ${i}: n = ${n}. Умова ${c[2](n)}? ${c[1](n) ? 'так, лишається' : 'ні, відпадає'}`).concat([`У результаті ${res.length} ел.`]) };
    },
    arrReduce(r) {
      const a = nums(r, ri(r, 4, 5));
      const kind = pickOne(r, ['sum', 'max']);
      let acc = kind === 'sum' ? 0 : a[0]; const tr = [`старт: acc = ${acc}`];
      const items = kind === 'sum' ? a : a.slice(1);
      items.forEach(n => { const nx = kind === 'sum' ? acc + n : (n > acc ? n : acc); tr.push(kind === 'sum' ? `n = ${n}: acc = ${acc} + ${n} = ${nx}` : `n = ${n}: ${n} > ${acc}? ${n > acc ? 'так, acc = ' + n : 'ні, acc лишається ' + acc}`); acc = nx; });
      return { title: 'reduce: збираємо одне значення', code: kind === 'sum' ? `const nums = ${arr(a)};\nconst total = nums.reduce((acc, n) => acc + n, 0);\nconsole.log(total);` : `const nums = ${arr(a)};\nconst top = nums.reduce((acc, n) => (n > acc ? n : acc), nums[0]);\nconsole.log(top);`,
        out: [String(acc)], tr: tr.concat([`Результат reduce: ${acc}`]) };
    },
    arrFind(r) {
      const a = nums(r, ri(r, 5, 6), 1, 20), t = ri(r, 6, 14);
      const m = pickOne(r, ['find', 'findIndex', 'some', 'every']);
      const cond = m === 'every' ? n => n < t + 6 : n => n > t, txt = m === 'every' ? `n < ${t + 6}` : `n > ${t}`;
      const res = a[m](cond); const tr = []; let stop = false;
      for (let i = 0; i < a.length && !stop; i++) {
        const ok = cond(a[i]);
        tr.push(`елемент ${i}: n = ${a[i]}. Умова ${txt}? ${ok ? 'так' : 'ні'}`);
        if (m !== 'every' && ok) { tr.push('Знайшов, далі не дивимось.'); stop = true; }
        if (m === 'every' && !ok) { tr.push('Один не підійшов: every зупиняється, результат false.'); stop = true; }
      }
      const expl = { find: 'find повертає ПЕРШИЙ елемент, що підійшов, або undefined.', findIndex: 'findIndex повертає НОМЕР першого, що підійшов, або -1.', some: 'some: true, якщо хоч один підійшов.', every: 'every: true, тільки якщо підійшли ВСІ.' }[m];
      return { title: `${m}: пошук і перевірка`, code: `const nums = ${arr(a)};\nconst result = nums.${m}(n => ${txt});\nconsole.log(result);`, out: [sh(res)], tr: tr.concat([expl]) };
    },
    arrMutate(r) {
      const a = nums(r, 3); const b = a.slice(); const code = [`const a = ${arr(a)};`]; const out = [], tr = [];
      const ops = ['push', 'pop', 'shift', 'unshift'];
      for (let i = 0; i < 3; i++) {
        const op = pickOne(r, ops), x = ri(r, 1, 9);
        if (op === 'push') { b.push(x); code.push(`a.push(${x});\nconsole.log(a);`); out.push(arr(b)); tr.push(`push(${x}): додає В КІНЕЦЬ → ${arr(b)}`); }
        else if (op === 'unshift') { b.unshift(x); code.push(`a.unshift(${x});\nconsole.log(a);`); out.push(arr(b)); tr.push(`unshift(${x}): додає НА ПОЧАТОК → ${arr(b)}`); }
        else if (!b.length) { code.push(`console.log(a.${op}());`); out.push('undefined'); tr.push(`${op}() з порожнього масиву дає undefined`); }
        else { const v = b[op === 'pop' ? 'pop' : 'shift'](); code.push(`console.log(a.${op}());\nconsole.log(a);`); out.push(sh(v), arr(b)); tr.push(`${op}(): ${op === 'pop' ? 'забирає ОСТАННІЙ' : 'забирає ПЕРШИЙ'} (${v}) і повертає його. Лишилось ${arr(b)}`); }
      }
      return { title: 'push, pop, shift, unshift', code: code.join('\n'), out, tr };
    },
    arrObjs(r) {
      const names = WORDS.slice().sort(() => r() - 0.5).slice(0, 4);
      const a = names.map(n => ({ name: n, age: ri(r, 10, 40) })); const lim = ri(r, 15, 28);
      const res = a.filter(u => u.age >= lim).map(u => u.name);
      return { title: 'Масив об’єктів: filter + map', code: `const users = ${JSON.stringify(a)};\nconst result = users\n  .filter(u => u.age >= ${lim})\n  .map(u => u.name);\nconsole.log(result);`,
        out: [arr(res)], tr: a.map(u => `${u.name}, вік ${u.age}: ${u.age} >= ${lim}? ${u.age >= lim ? 'так, лишається' : 'ні, відпадає'}`).concat([`Після filter лишились: ${arr(a.filter(u => u.age >= lim).map(u => u.name))}.`, 'map бере з кожного лише name.']) };
    },
    objRef(r) {
      const x = ri(r, 1, 9), y = ri(r, 1, 9), z = ri(r, 10, 19); const copy = r() < 0.5;
      const code = `const a = { x: ${x}, y: ${y} };\nconst b = ${copy ? 'a' : '{ x: a.x, y: a.y }'};\nb.x = ${z};\nconsole.log(a.x);\nconsole.log(b.x);\nconsole.log(a === b);`;
      return { title: copy ? 'Об’єкти: друга назва' : 'Об’єкти: справжня копія', code, out: [String(copy ? z : x), String(z), String(copy)],
        tr: copy ? ['const b = a: це НЕ копія, а друга назва ТОГО Ж об’єкта.', `b.x = ${z} змінює спільний об’єкт, тому a.x теж ${z}.`, 'a і b це один об’єкт, тому a === b: true.'] : ['{ x: a.x, y: a.y }: це НОВИЙ об’єкт зі значеннями з a.', `b.x = ${z} змінює лише b, a.x лишається ${x}.`, 'Це два різні об’єкти: a === b дає false.'] };
    },
    objKeys(r) {
      const keys = ['mon', 'tue', 'wed', 'thu', 'fri'].sort(() => r() - 0.5).slice(0, 3); const o = {}; keys.forEach(k => o[k] = ri(r, 1, 9) * 10);
      const s = Object.values(o).reduce((a, b) => a + b, 0);
      return { title: 'Object.keys, Object.values', code: `const o = ${JSON.stringify(o)};\nconsole.log(Object.keys(o));\nconsole.log(Object.values(o));\nlet sum = 0;\nfor (const v of Object.values(o)) {\n  sum = sum + v;\n}\nconsole.log(sum);\nconsole.log(o.${keys[0]});`,
        out: [arr(keys), arr(Object.values(o)), String(s), String(o[keys[0]])], tr: ['Object.keys: масив назв ключів (у порядку запису).', 'Object.values: масив значень у тому ж порядку.', `Сума значень: ${Object.values(o).join(' + ')} = ${s}.`, `o.${keys[0]} це значення за ключем ${keys[0]}.`] };
    },
    objAccess(r) {
      const k = pickOne(r, ['name', 'city', 'color']), v = pickOne(r, ['Оля', 'Київ', 'синій']), n = ri(r, 2, 9);
      const o = { [k]: v, count: n }; const key = k;
      return { title: 'Доступ до властивостей', code: `const o = ${JSON.stringify(o)};\nconst key = "${key}";\nconsole.log(o.${key});\nconsole.log(o[key]);\nconsole.log(o.key);\nconsole.log("count" in o);\nconsole.log("size" in o);\nconsole.log(o.count + 1);`,
        out: [v, v, 'undefined', 'true', 'false', String(n + 1)], tr: [`o.${key}: крапка, ключ ${key} → "${v}".`, `o[key]: у квадратних дужках змінна key = "${key}", тож це те саме → "${v}".`, 'o.key: крапка шукає ключ із назвою key. Такого нема → undefined.', '"count" in o: ключ є → true.', '"size" in o: ключа нема → false.', `o.count + 1 = ${n} + 1 = ${n + 1}.`] };
    },
  };

  const W = [
    { id: 'doubleAll', fn: 'doubleAll', title: 'Подвоїти всі числа', text: 'Зроби функцію doubleAll з параметром nums (масив чисел).\nВона повертає НОВИЙ масив, де кожне число помножене на 2.\ndoubleAll([1, 2, 3]) дає [2, 4, 6].', hint: 'Метод map. У стрілки з фігурними дужками потрібен return, без дужок він неявний.', tests: [[[[1, 2, 3]], [2, 4, 6]], [[[]], []], [[[5]], [10]]] },
    { id: 'onlyBig', fn: 'onlyBig', title: 'Лише більші за межу', text: 'Зроби функцію onlyBig з параметрами nums і limit.\nВона повертає новий масив тільки з тих чисел, що БІЛЬШІ за limit.', hint: 'Метод filter, умова n > limit.', tests: [[[[5, 12, 30, 8], 10], [12, 30]], [[[1, 2], 5], []], [[[10, 10, 11], 10], [11]]] },
    { id: 'sumArr', fn: 'sumArr', title: 'Сума масиву', text: 'Зроби функцію sumArr з параметром nums.\nВона повертає суму всіх чисел масиву. Для порожнього масиву це 0.', hint: 'Метод reduce з початковим значенням 0, або цикл for-of і змінна sum.', tests: [[[[1, 2, 3]], 6], [[[]], 0], [[[10, -4]], 6]] },
    { id: 'userNames', fn: 'userNames', title: 'Імена користувачів', text: 'Зроби функцію userNames з параметром users (масив об’єктів з ключем name).\nВона повертає масив лише з імен.\nuserNames([{ name: "Аня" }, { name: "Віка" }]) дає ["Аня", "Віка"].', hint: 'Метод map: з кожного об’єкта бери u.name.', tests: [[[[{ name: 'Аня' }, { name: 'Віка' }]], ['Аня', 'Віка']], [[[]], []]] },
    { id: 'adultNames', fn: 'adultNames', title: 'Імена дорослих', text: 'Зроби функцію adultNames з параметром users (об’єкти з name і age).\nВона повертає масив імен тих, кому 18 і більше.', hint: 'Спочатку filter за віком, потім map на імена.', tests: [[[[{ name: 'Аня', age: 17 }, { name: 'Богдан', age: 18 }, { name: 'Віка', age: 30 }]], ['Богдан', 'Віка']], [[[{ name: 'Тимко', age: 10 }]], []]] },
    { id: 'findById', fn: 'findById', title: 'Знайти за id', text: 'Зроби функцію findById з параметрами list (масив об’єктів з id) і id.\nВона повертає об’єкт з таким id. Якщо такого нема, повертає null.', hint: 'Метод find дає undefined, якщо нема. Як замінити undefined на null?', tests: [[[[{ id: 1, n: 'a' }, { id: 2, n: 'b' }], 2], { id: 2, n: 'b' }], [[[{ id: 1 }], 9], null]] },
    { id: 'totalPrice', fn: 'totalPrice', title: 'Сума кошика', text: 'Зроби функцію totalPrice з параметром items (об’єкти з price і qty).\nВона повертає суму price * qty по всіх товарах.', hint: 'reduce з acc + item.price * item.qty, початкове значення 0.', tests: [[[[{ price: 10, qty: 2 }, { price: 5, qty: 3 }]], 35], [[[]], 0], [[[{ price: 100, qty: 1 }]], 100]] },
    { id: 'cheapFirst', fn: 'cheapFirst', title: 'Назви від дешевих', text: 'Зроби функцію cheapFirst з параметром goods (об’єкти з title і price).\nВона повертає масив назв, відсортований за зростанням ціни.\nПочатковий масив goods змінювати НЕ можна.', hint: 'Спершу зроби копію (slice), потім sort за price, потім map на title.', tests: [[[[{ title: 'Кава', price: 150 }, { title: 'Чай', price: 80 }, { title: 'Сік', price: 60 }]], ['Сік', 'Чай', 'Кава']], [[[]], []]] },
    { id: 'hasNegative', fn: 'hasNegative', title: 'Чи є від’ємне', text: 'Зроби функцію hasNegative з параметром nums.\nВона повертає true, якщо в масиві є хоч одне число менше за 0, інакше false.', hint: 'Метод some з умовою n < 0.', tests: [[[[1, -2, 3]], true], [[[1, 2]], false], [[[]], false]] },
    { id: 'allPositive', fn: 'allPositive', title: 'Усі додатні', text: 'Зроби функцію allPositive з параметром nums.\nВона повертає true, якщо ВСІ числа більші за 0. Для порожнього масиву true.', hint: 'Метод every з умовою n > 0.', tests: [[[[1, 2, 3]], true], [[[1, 0]], false], [[[]], true]] },
    { id: 'longestWord', fn: 'longestWord', title: 'Найдовше слово', text: 'Зроби функцію longestWord з параметром words (непорожній масив рядків).\nВона повертає найдовше слово. Якщо таких кілька, перше з них.', hint: 'Змінна best = words[0], перебір, і якщо word.length > best.length, замінюй best. Або reduce.', tests: [[[['кіт', 'собака', 'лис']], 'собака'], [[['a']], 'a'], [[['ab', 'cd', 'e']], 'ab']] },
    { id: 'sumValues', fn: 'sumValues', title: 'Сума значень об’єкта', text: 'Зроби функцію sumValues з параметром obj (об’єкт, усі значення числа).\nВона повертає суму всіх значень.\nsumValues({ a: 1, b: 2 }) дає 3.', hint: 'Object.values(obj) дає масив значень. Далі як sumArr.', tests: [[[{ a: 1, b: 2 }], 3], [[{}], 0], [[{ x: 10, y: 20, z: 30 }], 60]] },
    { id: 'toggleDone', fn: 'toggleDone', title: 'Перемкнути done', text: 'Зроби функцію toggleDone з параметрами tasks (об’єкти з id і done) і id.\nВона змінює done на протилежне в задачі з таким id і повертає масив tasks.\nЯкщо такого id нема, масив лишається як був.', hint: 'Знайди задачу (find). Якщо знайшла, task.done = !task.done. Наприкінці return tasks.', tests: [[[[{ id: 1, done: false }, { id: 2, done: true }], 1], [{ id: 1, done: true }, { id: 2, done: true }]], [[[{ id: 1, done: true }], 5], [{ id: 1, done: true }]]] },
  ];
  Object.assign(GEN, G);
  WRITE.push(...W);
  window.TRAIN_TOPICS = {
    loops: { name: 'Цикли', gens: ['whileUp', 'whileDown', 'sum', 'forMul', 'countLetter', 'breakAt'], write: WRITE.filter(w => !W.includes(w)).map(w => w.id), bugs: BUGS.filter(b => +b.id.slice(1) <= 12).map(b => b.id) },
    arrays: { name: 'Масиви і методи', gens: ['arrMap', 'arrFilter', 'arrReduce', 'arrFind', 'arrMutate', 'arrObjs'], write: ['doubleAll', 'onlyBig', 'sumArr', 'userNames', 'adultNames', 'findById', 'totalPrice', 'cheapFirst', 'hasNegative', 'allPositive', 'longestWord'], bugs: BUGS.filter(b => +b.id.slice(1) >= 13 && !['b16', 'b17'].includes(b.id)).map(b => b.id) },
    objects: { name: 'Об’єкти', gens: ['objRef', 'objKeys', 'objAccess', 'arrObjs'], write: ['userNames', 'findById', 'sumValues', 'toggleDone', 'totalPrice'], bugs: ['b16', 'b17', 'b24'] },
  };
})();
main();
