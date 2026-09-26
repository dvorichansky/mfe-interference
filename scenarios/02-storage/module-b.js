/*
 * Сценарій 02 · Ресурс S (сховище) · конфлікт «читання/запис».
 * Модуль B — «Кошик для гостей». Під час старту перевіряє, чи є «його» сесія,
 * і якщо знаходить дані іншого формату — вважає їх пошкодженими й видаляє.
 * Окремо така логіка цілком розумна; в композиції вона видаляє чужу сесію.
 *
 * Відбиток без захисту:  R(B) = W(B) = { (localStorage, "session") }   ⇒ W(B) ∩ R(A) ≠ ∅
 * Відбиток із захистом:  R(B) = W(B) = { (localStorage, "mf:b:cart") } ⇒ A ⊥ B
 */
(function () {
  let timer = null;

  window.__registerModule('b', {
    mount(root, ctx) {
      const KEY = ctx.fix ? 'mf:b:cart' : 'session';

      const existing = localStorage.getItem(KEY);                       // ← читання
      if (existing) {
        const s = JSON.parse(existing);
        if (s.issuedBy !== 'B') {
          localStorage.removeItem(KEY);                                  // ← запис (видалення)
          ctx.log(`знайшов у localStorage["${KEY}"] дані невідомого формату — видалив як пошкоджені`);
        }
      }
      if (!localStorage.getItem(KEY)) {
        localStorage.setItem(KEY, JSON.stringify({ issuedBy: 'B', cartId: 'c-17', items: 3 }));   // ← запис
        ctx.log(`створив гостьовий кошик у localStorage["${KEY}"]`);
      }

      root.innerHTML = `
        <p>Кошик: <b data-state></b></p>
        <button class="btn" type="button" data-check>Перевірити кошик</button>`;

      const check = () => {
        const raw = localStorage.getItem(KEY);
        const s = raw ? JSON.parse(raw) : null;
        const state = root.querySelector('[data-state]');
        if (s && s.issuedBy === 'B') {
          state.textContent = `${s.items} товари (${s.cartId})`;
          ctx.log('кошик на місці', 'ok');
        } else {
          state.textContent = 'кошик зник';
          ctx.log(`кошик зник: localStorage["${KEY}"] = ${raw === null ? 'null' : raw}`, 'error');
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
