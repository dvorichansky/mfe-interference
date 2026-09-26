/*
 * Сценарій 03 · Ресурс H (історія навігації).
 * Модуль A — «Каталог». Власні маршрути з префіксом #/catalog.
 *
 * Рівні захисту (?fix=):
 *   0 — без захисту: модуль сам встановлює початковий маршрут і сам змінює location.hash;
 *   1 — домовленість про префікси: те саме, модуль реагує лише на #/catalog/*;
 *       (домовленість не усуває перетину: обидва модулі досі пишуть у λ)
 *   2 — посередництво оболонки: модуль не пише в location, а просить оболонку (ctx.shell).
 *
 * Відбиток:  рівні 0–1: R_H(A) ∋ λ, W_H(A) ∋ λ;   рівень 2: R_H(A) ∋ λ, W_H(A) = ∅ (пише лише оболонка)
 */
(function () {
  let cleanup = [];

  window.__registerModule('a', {
    mount(root, ctx) {
      const viaShell = ctx.fix >= 2 && ctx.shell;

      // Команда каталогу вважає свій модуль стартовою сторінкою.
      if (!viaShell) {
        if (!location.hash) {
          location.hash = '#/catalog';                     // ← запис у λ
          ctx.log('маршрут не задано — встановив #/catalog як початковий');
        } else if (!location.hash.startsWith('#/catalog')) {
          ctx.log(`хотів відкрити каталог як початкову сторінку, але λ уже встановлено іншим модулем: ${location.hash}`, 'error');
        }
      }

      const render = () => {
        const h = location.hash;
        if (h === '#/catalog/item/42') {
          root.innerHTML = '<p><b>Навушники X</b>, 2 499 грн</p><a href="#/catalog">Назад до каталогу</a>';
        } else if (h.startsWith('#/catalog')) {
          root.innerHTML = '<p>Каталог: 24 товари</p><a href="#/catalog/item/42">Відкрити товар 42</a>';
        } else {
          root.innerHTML = `<p>Маршрут ${h || '(порожній)'} не належить каталогу — модуль неактивний.</p><a href="#/catalog">Перейти до каталогу</a>`;
        }
      };

      const onClick = (e) => {
        const a = e.target.closest('a[href^="#/"]');
        if (!a) return;
        const target = a.getAttribute('href');
        if (viaShell) {
          e.preventDefault();
          ctx.shell.navigate(target, 'A');                 // ← запит до оболонки замість запису в λ
        }
        setTimeout(() => {
          if (location.hash !== target) {
            ctx.log(`навігацію на ${target} перехоплено: поточний маршрут ${location.hash}`, 'error');
          } else {
            ctx.log(`перейшов на ${target}`, 'ok');
          }
        }, 150);
      };
      root.addEventListener('click', onClick);
      cleanup.push(() => root.removeEventListener('click', onClick));

      if (viaShell) {
        cleanup.push(ctx.shell.subscribe(render));         // читання λ через оболонку
      } else {
        window.addEventListener('hashchange', render);     // ← читання λ
        cleanup.push(() => window.removeEventListener('hashchange', render));
      }
      render();
    },
    unmount(root) {
      cleanup.forEach((f) => f());
      cleanup = [];
      root.innerHTML = '';
    },
  });
})();
