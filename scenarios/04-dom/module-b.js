/*
 * Сценарій 04 · Ресурс DOM · конфлікт «запис/запис» поза власним піддеревом.
 * Модуль B — «Кошик». Показує модальне вікно, додаючи його в document.body.
 *
 * Без захисту: вікно має id="modal", а модуль знаходить його глобальним пошуком
 *   (getElementById / querySelector). Локація «елемент #modal» спільна для обох модулів:
 *   W(B) ∩ W(A) ∋ #modal. Поки відкрите одне вікно, перетин «не активний».
 * Із захистом: id з префіксом (mf-b-modal) і робота лише через посилання на власний елемент,
 *   тобто W(B) обмежено вузлами, які модуль сам створив.
 */
(function () {
  const TEXT = 'Підтвердити замовлення на 3 товари?';
  let myModal = null;

  function close(ctx) {
    const target = ctx.fix ? myModal : document.getElementById('modal');   // ← глобальний пошук без захисту
    if (!target) return;
    target.remove();
    if (target !== myModal) {
      ctx.log(`кнопка «Закрити» закрила ЧУЖЕ вікно (модуля ${target.dataset.owner.toUpperCase()}); моє лишилося відкритим`, 'error');
    } else {
      ctx.log('закрив своє вікно', 'ok');
      myModal = null;
    }
  }

  function open(ctx) {
    if (myModal && document.body.contains(myModal)) return;
    const el = document.createElement('div');
    el.id = ctx.fix ? 'mf-b-modal' : 'modal';
    el.dataset.owner = 'b';
    el.innerHTML = '<div class="modal-body"></div><button type="button" class="btn" data-close>Закрити</button>';
    document.body.appendChild(el);                                          // ← запис поза власним піддеревом
    myModal = el;

    if (ctx.fix) {
      el.querySelector('.modal-body').textContent = TEXT;
    } else {
      document.querySelector('#modal .modal-body').textContent = TEXT;     // ← глобальний пошук: перший #modal у документі
    }

    if (el.querySelector('.modal-body').textContent !== TEXT) {
      ctx.log('текст потрапив у ЧУЖЕ вікно; моє вікно порожнє', 'error');
    } else {
      ctx.log('відкрив вікно підтвердження', 'ok');
    }
    el.querySelector('[data-close]').addEventListener('click', () => close(ctx));
  }

  window.__registerModule('b', {
    mount(root, ctx) {
      root.innerHTML = '<button type="button" class="btn" data-open>Підтвердити замовлення</button>';
      root.querySelector('[data-open]').addEventListener('click', () => open(ctx));
    },
    unmount(root) {
      if (myModal) { myModal.remove(); myModal = null; }
      root.innerHTML = '';
    },
  });
})();
