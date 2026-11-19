// Прогрес: резервна копія (експорт/імпорт) і теплова карта тем.
(function () {
  const ls = { get: k => { try { return localStorage.getItem(k); } catch { return null; } },
               set: (k, v) => { try { localStorage.setItem(k, v); } catch {} } };
  const J = (k, d) => { try { return JSON.parse(ls.get(k)) || d; } catch { return d; } };

  // ---- теплова карта ----
  function taskState(N, id, revStats) {
    const done = ls.get(`jsp:${N}:${id}:done`) === '1';
    const ts = J(`jsp:${N}:${id}:tstat`, null);
    const rs = revStats[`${N}:${id}`] || null;
    const hasCode = (ls.get(`jsp:${N}:${id}:code`) || '').trim() !== '';
    const failing = (ts && ts.passed === false) || (rs && rs.fail > rs.ok);
    const confirmed = (ts && ts.passed === true) || (rs && rs.ok > 0 && rs.ok >= rs.fail);
    if (failing) return 'red';
    if (done && confirmed) return 'green';
    if (done || hasCode || ts || rs) return 'yellow';
    return 'grey';
  }
  function topicState(N, topic) {
    const rev = J('jsp:rev:stats', {});
    const st = topic.tasks.map(t => taskState(N, t.id, rev));
    const c = k => st.filter(x => x === k).length;
    let color;
    const allDone = topic.tasks.every(t => ls.get(`jsp:${N}:${t.id}:done`) === '1');
    if (c('red')) color = 'red';
    else if (allDone && c('green') >= st.length / 2) color = 'green';
    else if (c('yellow') || c('green')) color = 'yellow';
    else color = 'grey';
    return { color, red: c('red'), green: c('green'), yellow: c('yellow'), total: st.length };
  }
  const LABEL = { grey: 'не починав', yellow: 'зроблено, але не підтверджено перевіркою', green: 'добре: зроблено і підтверджено', red: 'слабко: є невдалі спроби' };
  const dot = (color, tip) => `<span class="hm hm-${color}" title="${tip}"></span>`;

  // ---- резервна копія ----
  function exportAll() {
    const data = {};
    for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k.startsWith('jsp:')) data[k] = localStorage.getItem(k); }
    ls.set('jsp:backup:last', String(Date.now()));
    const blob = new Blob([JSON.stringify({ app: 'js-practice', date: new Date().toISOString(), data }, null, 1)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `js-practice-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    return Object.keys(data).length;
  }
  function importAll(text) {
    const o = JSON.parse(text);
    if (!o || o.app !== 'js-practice' || !o.data) throw new Error('Це не файл копії js-practice');
    let n = 0;
    for (const [k, v] of Object.entries(o.data)) if (k.startsWith('jsp:')) { ls.set(k, v); n++; }
    return n;
  }
  function backupPanel(host) {
    const last = +ls.get('jsp:backup:last') || 0;
    const days = last ? Math.floor((Date.now() - last) / 86400000) : null;
    const old = days === null || days >= 7;
    const box = document.createElement('div');
    box.className = 'backup';
    box.innerHTML = `<h3>💾 Резервна копія прогресу</h3>
      <p class="${old ? 'warn' : ''}">${days === null ? 'Копії ще не було.' : `Остання копія: ${days === 0 ? 'сьогодні' : days + ' дн. тому'}.`} ${old ? 'Зроби копію: якщо очистиш браузер, прогрес пропаде.' : ''}</p>
      <button id="bk-exp">⬇ Зберегти копію</button> <button id="bk-imp" class="sec">⬆ Відновити з файлу</button>
      <input type="file" id="bk-file" accept=".json,application/json" hidden> <span id="bk-msg"></span>`;
    host.appendChild(box);
    const msg = box.querySelector('#bk-msg');
    box.querySelector('#bk-exp').onclick = () => { msg.textContent = `Збережено, записів: ${exportAll()}. Поклади файл у надійне місце.`; };
    const f = box.querySelector('#bk-file');
    box.querySelector('#bk-imp').onclick = () => f.click();
    f.onchange = async () => {
      try { msg.textContent = `Відновлено записів: ${importAll(await f.files[0].text())}. Онови сторінку.`; }
      catch (e) { msg.textContent = 'Помилка: ' + e.message; }
    };
  }

  // ---- карта на головній ----
  async function indexMap(host) {
    const box = document.createElement('div');
    box.className = 'heatmap';
    box.innerHTML = '<h2 style="margin-top:48px">🗺 Карта прогресу</h2><p class="hm-legend">' +
      ['grey', 'yellow', 'green', 'red'].map(c => dot(c, LABEL[c]) + ' ' + LABEL[c]).join(' &nbsp;·&nbsp; ') + '</p><div class="hm-list"></div>';
    host.appendChild(box);
    const list = box.querySelector('.hm-list');
    for (let N = 1; N <= 8; N++) {
      try {
        const m = await (await fetch(`data/module-${N}.json`)).json();
        const row = document.createElement('div');
        row.className = 'hm-row';
        row.innerHTML = `<a href="module.html?m=${N}">Модуль ${N}</a> <span class="hm-dots">` +
          m.topics.map(tp => { const s = topicState(N, tp); return `<a href="module.html?m=${N}#${tp.id}">${dot(s.color, tp.title + ' — ' + LABEL[s.color])}</a>`; }).join('') + '</span>';
        list.appendChild(row);
      } catch {}
    }
  }
  window.JSPProgress = { topicState, LABEL, dot, exportAll, importAll, backupPanel, indexMap };
})();
