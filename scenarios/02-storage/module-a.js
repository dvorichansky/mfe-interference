/*
 * Сценарій 02 · Ресурс S (сховище) · конфлікт «читання/запис».
 * Модуль A — «Особистий кабінет». Після входу зберігає сесію в localStorage.
 *
 * Відбиток без захисту:  W(A) = R(A) = { (localStorage, "session") }
 * Відбиток із захистом:  W(A) = R(A) = { (localStorage, "mf:a:session") }
 */
(function () {
  let timer = null;

  window.__registerModule('a', {
    mount(root, ctx) {
      const KEY = ctx.fix ? 'mf:a:session' : 'session';
      localStorage.setItem(KEY, JSON.stringify({ issuedBy: 'A', user: 'olena', role: 'customer' }));
      ctx.log(`користувачка olena увійшла; записав localStorage["${KEY}"]`);

      root.innerHTML = `
        <p>Стан: <b data-state></b></p>
        <button class="btn" type="button" data-check>Перевірити сесію</button>`;

      const check = () => {
        const raw = localStorage.getItem(KEY);
        const s = raw ? JSON.parse(raw) : null;
        const state = root.querySelector('[data-state]');
        if (s && s.issuedBy === 'A') {
          state.textContent = `увійшла ${s.user}`;
          ctx.log('сесія на місці', 'ok');
        } else {
          state.textContent = 'сесію втрачено — вимагається повторний вхід';
          ctx.log(`сесію втрачено: localStorage["${KEY}"] = ${raw === null ? 'null' : raw}. Код модуля A не змінювався.`, 'error');
        }
      };
      root.querySelector('[data-check]').addEventListener('click', check);
      timer = setTimeout(check, 700);
    },
    unmount(root) {
      clearTimeout(timer);
      root.innerHTML = '';
    },
  });
})();
