/*
 * Сценарій 03 · Ресурс H (історія навігації).
 * Модуль B — «Кошик». Маршрути з префіксом #/cart.
 *
 * Рівні захисту (?fix=):
 *   0 — без захисту: початковий маршрут #/cart і правило «будь-який невідомий маршрут → #/cart»
 *       (окремо від каталогу таке правило коректне: сторінка 404 не потрібна);
 *   1 — домовленість про префікси: правило за замовчуванням діє лише в межах #/cart/*,
 *       але модуль, як і раніше, сам встановлює свій початковий маршрут;
 *   2 — посередництво оболонки: жодних записів у location, лише запити до ctx.shell.
 *
 * Відбиток:  рівень 0: R_H(B) ∋ λ (будь-який маршрут), W_H(B) ∋ λ  ⇒ R/W і W/W з A
 *            рівень 1: W_H(B) ∋ λ                                 ⇒ W/W з A залишається (початковий маршрут)
 *            рівень 2: W_H(B) = ∅                                 ⇒ A ⊥ B
 */
(function () {
  const ROUTES = ['#/cart', '#/cart/checkout'];
  let cleanup = [];

  window.__registerModule('b', {
    mount(root, ctx) {
      const viaShell = ctx.fix >= 2 && ctx.shell;
      const go = (path) => (viaShell ? ctx.shell.navigate(path, 'B') : location.replace(path));

      const render = () => {
        const h = location.hash;
        if (h === '#/cart/checkout') {
          root.innerHTML = '<p>Оформлення замовлення</p><a href="#/cart">Назад до кошика</a>';
        } else if (h === '#/cart') {
          root.innerHTML = '<p>У кошику 3 товари</p><a href="#/cart/checkout">Оформити</a>';
        } else {
          root.innerHTML = `<p>Маршрут ${h || '(порожній)'} не належить кошику — модуль неактивний.</p><a href="#/cart">Перейти до кошика</a>`;
        }
      };

      const route = () => {
        const h = location.hash;
        if (ROUTES.includes(h)) return render();
        if (ctx.fix >= 1 && !h.startsWith('#/cart')) return render();   // чужі маршрути не чіпаємо
        ctx.log(`маршрут ${h || '(порожній)'} невідомий — перенаправляю на #/cart`);
        go('#/cart');                                                   // ← запис у λ (або запит до оболонки)
      };

      // Команда кошика теж вважає свій модуль стартовою сторінкою.
      if (!viaShell && ctx.fix === 1) {
        if (!location.hash) {
          location.replace('#/cart');                                   // ← запис у λ
          ctx.log('маршрут не задано — встановив #/cart як початковий');
        } else if (!location.hash.startsWith('#/cart')) {
          ctx.log(`хотів відкрити кошик як початкову сторінку, але λ уже встановлено іншим модулем: ${location.hash}`, 'error');
        }
      }

      const onClick = (e) => {
        const a = e.target.closest('a[href^="#/"]');
        if (!a || !viaShell) return;
        e.preventDefault();
        ctx.shell.navigate(a.getAttribute('href'), 'B');
      };
      root.addEventListener('click', onClick);
      cleanup.push(() => root.removeEventListener('click', onClick));

      if (viaShell) {
        cleanup.push(ctx.shell.subscribe(route));
      } else {
        window.addEventListener('hashchange', route);
        cleanup.push(() => window.removeEventListener('hashchange', route));
      }
      route();
    },
    unmount(root) {
      cleanup.forEach((f) => f());
      cleanup = [];
      root.innerHTML = '';
    },
  });
})();
