// Редактор коду: CodeMirror 5 (локально в lib/), автодоповнення, сніпети, авто-дужки.
const SNIPPETS = {
  log:      ['console.log($0);', 'console.log()'],
  logs:     ['console.log(`$0`);', 'console.log із шаблонним рядком'],
  const:    ['const $0 = ;', 'const змінна'],
  let:      ['let $0 = ;', 'let змінна'],
  if:       ['if ($0) {\n  \n}', 'if'],
  ife:      ['if ($0) {\n  \n} else {\n  \n}', 'if / else'],
  elif:     ['else if ($0) {\n  \n}', 'else if'],
  tern:     ['$0 ? a : b', 'тернарний оператор'],
  sw:       ['switch ($0) {\n  case \'a\':\n    \n    break;\n  default:\n    \n}', 'switch'],
  for:      ['for (let i = 0; i < $0.length; i++) {\n  \n}', 'for по індексах'],
  forof:    ['for (const item of $0) {\n  \n}', 'for...of'],
  forin:    ['for (const key in $0) {\n  \n}', 'for...in'],
  while:    ['while ($0) {\n  \n}', 'while'],
  fn:       ['function $0() {\n  \n}', 'function'],
  fe:       ['const $0 = function () {\n  \n};', 'функціональний вираз'],
  af:       ['const $0 = () => {\n  \n};', 'стрілочна функція'],
  arrow:    ['($0) => ', 'стрілка (для колбека)'],
  foreach:  ['$0.forEach((item) => {\n  \n});', 'forEach'],
  map:      ['$0.map((item) => )', 'map'],
  filter:   ['$0.filter((item) => )', 'filter'],
  find:     ['$0.find((item) => )', 'find'],
  reduce:   ['$0.reduce((acc, item) => acc + item, 0)', 'reduce'],
  sort:     ['$0.sort((a, b) => a - b)', 'sort (числа)'],
  class:    ['class $0 {\n  constructor() {\n    \n  }\n}', 'class з конструктором'],
  ext:      ['class $0 extends Parent {\n  constructor() {\n    super();\n  }\n}', 'class extends'],
  qs:       ['document.querySelector(\'$0\')', 'querySelector'],
  qsa:      ['document.querySelectorAll(\'$0\')', 'querySelectorAll'],
  ael:      ['$0.addEventListener(\'click\', (event) => {\n  \n});', 'addEventListener'],
  ce:       ['document.createElement(\'$0\')', 'createElement'],
  sub:      ['form.addEventListener(\'submit\', (event) => {\n  event.preventDefault();\n  $0\n});', 'submit-обробник'],
  des:      ['const { $0 } = obj;', 'деструктуризація об’єкта'],
  desa:     ['const [$0] = arr;', 'деструктуризація масиву'],
  try:      ['try {\n  $0\n} catch (error) {\n  console.log(error.message);\n}', 'try / catch'],
};

function expand(cm, from, to, tpl) {
  const i = tpl.indexOf('$0');
  const text = tpl.replace('$0', '');
  const indent = cm.getLine(from.line).match(/^\s*/)[0];
  const body = text.split('\n').map((l, n) => n ? indent + l : l).join('\n');
  cm.replaceRange(body, from, to);
  const before = (i < 0 ? text : text.slice(0, i)).split('\n').map((l, n) => n ? indent + l : l).join('\n');
  const lines = before.split('\n');
  const pos = lines.length === 1
    ? { line: from.line, ch: from.ch + lines[0].length }
    : { line: from.line + lines.length - 1, ch: lines[lines.length - 1].length };
  cm.setCursor(pos);
}

function wordBefore(cm) {
  const c = cm.getCursor();
  const line = cm.getLine(c.line).slice(0, c.ch);
  const m = line.match(/[A-Za-z]+$/);
  return m ? { word: m[0], from: { line: c.line, ch: c.ch - m[0].length }, to: c } : null;
}

function hint(cm) {
  const w = wordBefore(cm);
  const base = CodeMirror.hint.javascript(cm, {}) || { list: [], from: cm.getCursor(), to: cm.getCursor() };
  const from = base.from, to = base.to;
  const typed = w ? w.word : '';
  const snips = Object.keys(SNIPPETS)
    .filter(k => typed && k.startsWith(typed) && !(base.from.ch < (w ? w.from.ch : 0) ))
    .map(k => ({
      text: k,
      displayText: `${k}  ⟶  ${SNIPPETS[k][1]}`,
      className: 'cm-snip',
      hint: (cm2) => expand(cm2, w.from, w.to, SNIPPETS[k][0]),
    }));
  const rest = (base.list || []).map(x => typeof x === 'string' ? { text: x } : x);
  return { list: snips.concat(rest).slice(0, 40), from, to };
}

function makeEditor(textarea, onRun) {
  if (typeof CodeMirror === 'undefined') return null;   // немає бібліотеки: лишаємо звичайне поле
  const cm = CodeMirror.fromTextArea(textarea, {
    mode: 'javascript',
    theme: 'material-darker',
    lineNumbers: true,
    indentUnit: 2,
    tabSize: 2,
    indentWithTabs: false,
    autoCloseBrackets: true,
    matchBrackets: true,
    lineWrapping: false,
    viewportMargin: Infinity,
    extraKeys: {
      Tab(cm2) {
        const w = wordBefore(cm2);
        if (w && SNIPPETS[w.word] && !cm2.somethingSelected()) { expand(cm2, w.from, w.to, SNIPPETS[w.word][0]); return; }
        if (cm2.somethingSelected()) cm2.indentSelection('add');
        else cm2.replaceSelection('  ', 'end');
      },
      'Shift-Tab': cm2 => cm2.indentSelection('subtract'),
      'Ctrl-Space': cm2 => cm2.showHint({ hint, completeSingle: false }),
      'Cmd-/': cm2 => cm2.toggleComment(),
      'Ctrl-/': cm2 => cm2.toggleComment(),
      'Cmd-Enter': () => onRun && onRun(),
      'Ctrl-Enter': () => onRun && onRun(),
    },
  });
  cm.on('inputRead', (cm2, change) => {
    if (change.origin !== '+input') return;
    const t = change.text[0];
    if (!/^[A-Za-z.]$/.test(t)) return;
    if (cm2.state.completionActive) return;
    cm2.showHint({ hint, completeSingle: false });
  });
  return cm;
}
