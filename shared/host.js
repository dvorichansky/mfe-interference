/*
 * Хост-оболонка демо «Інтерференція незалежно розгорнутих веб-модулів».
 *
 * Що робить:
 *   - завантажує модулі A і B (module-a.js, module-b.js із теки сценарію);
 *   - керує порядком завантаження:  ?order=ab | ba,  ?race=1 (паралельно з випадковими затримками);
 *   - керує рівнем захисту:          ?fix=0 | 1 | 2 (що означає кожен рівень — задає сторінка сценарію);
 *   - дає кнопки монтування/демонтування кожного модуля;
 *   - показує журнал подій і стан спільного ресурсу (window.__inspector, визначає сторінка).
 *
 * Контракт модуля (свідомо мінімальний, без фреймворків):
 *   window.__registerModule('a', { mount(root, ctx) {...}, unmount(root, ctx) {...} })
 *   ctx = { id, fix, log(message, kind), shell }, kind: 'info' | 'ok' | 'error'
 *   shell — необов'язкові сервіси оболонки (window.__shell), якщо сторінка сценарію їх визначає
 *
 * Оболонка сама не пише в ресурси, за які змагаються модулі (усі її імена мають префікс host-).
 */
(function () {
  'use strict';

  const params = new URLSearchParams(location.search);
  const order = params.get('order') === 'ba' ? ['b', 'a'] : ['a', 'b'];
  const race = params.get('race') === '1';
  const fix = Number(params.get('fix') || 0);
  const fixLevels = window.__fixLevels || ['без захисту', 'із захистом'];

  const registry = {};
  const mounted = { a: false, b: false };
  const contexts = {};
  const syncers = {};

  // ---------- журнал ----------
  const logEl = document.getElementById('host-log');
  const t0 = performance.now();
  function log(source, message, kind) {
    const li = document.createElement('li');
    li.className = 'host-log-' + (kind || 'info');
    const ms = String(Math.round(performance.now() - t0)).padStart(5, ' ');
    li.textContent = `[${ms} мс] ${source}: ${message}`;
    logEl.appendChild(li);
    logEl.scrollTop = logEl.scrollHeight;
    refreshInspector();
  }

  // ---------- інспектор спільного ресурсу ----------
  const inspectorEl = document.getElementById('host-inspector');
  function refreshInspector() {
    if (!inspectorEl || typeof window.__inspector !== 'function') return;
    let data;
    try { data = window.__inspector({ fix }); } catch (e) { data = { 'помилка інспектора': String(e) }; }
    inspectorEl.textContent = Object.entries(data)
      .map(([k, v]) => `${k}: ${typeof v === 'string' ? v : JSON.stringify(v)}`)
      .join('\n');
  }
  setInterval(refreshInspector, 300);

  // ---------- панель керування ----------
  function chip(label, overrides, active) {
    const p = new URLSearchParams(location.search);
    for (const [k, v] of Object.entries(overrides)) {
      if (v === null) p.delete(k); else p.set(k, v);
    }
    const a = document.createElement('a');
    a.href = '?' + p.toString();          // без hash: кожен запуск починається з чистого стану
    a.textContent = label;
    a.className = 'host-chip' + (active ? ' host-chip-active' : '');
    return a;
  }
  function group(title, chips) {
    const g = document.createElement('div');
    g.className = 'host-group';
    const s = document.createElement('span');
    s.textContent = title;
    g.appendChild(s);
    chips.forEach((c) => g.appendChild(c));
    return g;
  }
  const toolbar = document.getElementById('host-toolbar');
  if (toolbar) {
    toolbar.appendChild(group('Порядок завантаження:', [
      chip('A, потім B', { order: 'ab', race: null }, !race && order[0] === 'a'),
      chip('B, потім A', { order: 'ba', race: null }, !race && order[0] === 'b'),
      chip('Випадковий (мережа)', { race: '1', order: null }, race),
    ]));
    toolbar.appendChild(group('Захист:', fixLevels.map((label, i) =>
      chip(label, { fix: i === 0 ? null : String(i) }, fix === i))));
    toolbar.appendChild(group('', [chip('Перезапустити', {}, false)]));
  }

  // ---------- монтування ----------
  function ctxFor(id) {
    if (!contexts[id]) {
      contexts[id] = {
        id,
        fix,
        log: (message, kind) => log('Модуль ' + id.toUpperCase(), message, kind),
        shell: window.__shell || null,
      };
    }
    return contexts[id];
  }
  function rootFor(id) { return document.getElementById('root-' + id); }

  function mount(id) {
    if (!registry[id] || mounted[id]) return;
    registry[id].mount(rootFor(id), ctxFor(id));
    mounted[id] = true;
    log('Хост', `змонтовано модуль ${id.toUpperCase()}`, 'host');
    if (syncers[id]) syncers[id]();
  }
  function unmount(id) {
    if (!registry[id] || !mounted[id]) return;
    registry[id].unmount(rootFor(id), ctxFor(id));
    mounted[id] = false;
    log('Хост', `демонтовано модуль ${id.toUpperCase()}`, 'host');
    if (syncers[id]) syncers[id]();
  }

  ['a', 'b'].forEach((id) => {
    const place = document.querySelector(`.host-slot[data-module="${id}"] .host-slot-controls`);
    if (!place) return;
    const btn = document.createElement('button');
    btn.className = 'host-btn';
    btn.type = 'button';
    syncers[id] = () => {
      btn.textContent = mounted[id] ? 'Демонтувати' : 'Змонтувати';
      btn.disabled = !registry[id];
    };
    btn.addEventListener('click', () => (mounted[id] ? unmount(id) : mount(id)));
    syncers[id]();
    place.appendChild(btn);
  });

  // ---------- завантаження ----------
  window.__registerModule = function (id, impl) { registry[id] = impl; };
  window.__host = { fix, log: (m, k) => log('Хост', m, k || 'host') };

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = src;
      s.onload = resolve;
      s.onerror = () => reject(new Error('не вдалося завантажити ' + src));
      document.head.appendChild(s);
    });
  }
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  async function loadModule(id, delay) {
    if (delay) await sleep(delay);
    log('Хост', `завантажую module-${id}.js` + (delay ? ` (імітована затримка мережі ${delay} мс)` : ''), 'host');
    await loadScript(`module-${id}.js`);
    mount(id);
  }

  async function start() {
    log('Хост', (race
      ? 'паралельне завантаження з випадковими затримками'
      : 'послідовне завантаження: ' + order.map((x) => x.toUpperCase()).join(', потім ')) +
      `; захист: ${fixLevels[fix] || fix}`, 'host');
    try {
      if (race) {
        await Promise.all(['a', 'b'].map((id) => loadModule(id, Math.round(Math.random() * 400))));
      } else {
        for (const id of order) await loadModule(id, 0);
      }
      log('Хост', 'композицію зібрано', 'host');
    } catch (e) {
      log('Хост', e.message, 'error');
    }
  }

  start();
})();
