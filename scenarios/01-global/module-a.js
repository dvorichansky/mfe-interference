/*
 * Сценарій 01 · Ресурс G (глобальна область) · конфлікт «запис/запис».
 * Модуль A — «Каталог». Зберігає свою конфігурацію в глобальній змінній.
 *
 * Відбиток без захисту:  W(A) = R(A) = { window.appConfig }
 * Відбиток із захистом:  W(A) = R(A) = { window.__mf.a }
 */
(function () {
  const MY_CONFIG = { owner: 'A', currency: 'UAH', pageSize: 12 };

  function configStore(ctx) {
    if (ctx.fix) {
      // Захист «простір імен»: кожен модуль пише лише у власну локацію.
      window.__mf = window.__mf || {};
      return { where: 'window.__mf.a', get: () => window.__mf.a, set: (v) => { window.__mf.a = v; } };
    }
    return { where: 'window.appConfig', get: () => window.appConfig, set: (v) => { window.appConfig = v; } };
  }

  let timer = null;

  window.__registerModule('a', {
    mount(root, ctx) {
      const store = configStore(ctx);
      store.set(MY_CONFIG);                                   // ← запис у спільну локацію
      ctx.log(`записав ${store.where} = { owner: "A", currency: "UAH", pageSize: 12 }`);

      root.innerHTML = `
        <p>Ціни у валюті: <b data-cur></b></p>
        <p>Товарів на сторінці: <b data-size></b></p>
        <button class="btn" type="button" data-read>Перечитати конфігурацію</button>`;

      const read = () => {
        const cfg = store.get() || {};                        // ← читання спільної локації
        root.querySelector('[data-cur]').textContent = String(cfg.currency);
        root.querySelector('[data-size]').textContent = String(cfg.pageSize);
        if (cfg.owner !== 'A') {
          ctx.log(`прочитав ЧУЖУ конфігурацію (owner = "${cfg.owner}"): ціни в ${cfg.currency}, кількість товарів = ${cfg.pageSize}`, 'error');
        } else {
          ctx.log('прочитав власну конфігурацію', 'ok');
        }
      };
      root.querySelector('[data-read]').addEventListener('click', read);
      // Як і в реальному застосунку, конфігурація читається не одразу, а пізніше (перший запит даних).
      timer = setTimeout(read, 700);
    },
    unmount(root) {
      clearTimeout(timer);
      root.innerHTML = '';
    },
  });
})();
