/*
 * Сценарій 06 · Ресурс E (події й таймери) · темпоральне порушення володіння.
 * Модуль B — «Кошик». Показує суму до сплати і стежить, щоб вона не змінювалась без його участі.
 * Сам кошик свої ефекти прибирає коректно.
 */
(function () {
  const TOTAL = '7 497 грн';
  let timer = null;

  window.__registerModule('b', {
    mount(root, ctx) {
      root.innerHTML = `
        <p>Разом до сплати: <b class="price">${TOTAL}</b></p>
        <p style="font-size:13px;color:#5b6573">3 товари</p>`;
      let reported = false;
      timer = setInterval(() => {
        const now = root.querySelector('.price').textContent;
        if (now !== TOTAL && !reported) {
          reported = true;
          ctx.log(`сума до сплати змінилася без участі кошика: «${now}»`, 'error');
        }
      }, 500);
    },
    unmount(root) {
      clearInterval(timer);
      root.innerHTML = '';
    },
  });
})();
