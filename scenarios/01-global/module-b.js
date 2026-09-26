/*
 * Сценарій 01 · Ресурс G (глобальна область) · конфлікт «запис/запис».
 * Модуль B — «Кошик». Розроблений іншою командою, має ту саму звичку:
 * конфігурація у window.appConfig.
 *
 * Відбиток без захисту:  W(B) = R(B) = { window.appConfig }   ⇒ W(A) ∩ W(B) ≠ ∅
 * Відбиток із захистом:  W(B) = R(B) = { window.__mf.b }      ⇒ A ⊥ B
 */
(function () {
  const MY_CONFIG = { owner: 'B', currency: 'USD', freeShippingFrom: 100 };

  function configStore(ctx) {
    if (ctx.fix) {
      window.__mf = window.__mf || {};
      return { where: 'window.__mf.b', get: () => window.__mf.b, set: (v) => { window.__mf.b = v; } };
    }
    return { where: 'window.appConfig', get: () => window.appConfig, set: (v) => { window.appConfig = v; } };
  }

  let timer = null;

  window.__registerModule('b', {
    mount(root, ctx) {
      const store = configStore(ctx);
      store.set(MY_CONFIG);
      ctx.log(`записав ${store.where} = { owner: "B", currency: "USD", freeShippingFrom: 100 }`);

      root.innerHTML = `
        <p>Валюта кошика: <b data-cur></b></p>
        <p>Безкоштовна доставка від: <b data-free></b></p>
        <button class="btn" type="button" data-read>Перечитати конфігурацію</button>`;

      const read = () => {
        const cfg = store.get() || {};
        root.querySelector('[data-cur]').textContent = String(cfg.currency);
        root.querySelector('[data-free]').textContent = String(cfg.freeShippingFrom);
        if (cfg.owner !== 'B') {
          ctx.log(`прочитав ЧУЖУ конфігурацію (owner = "${cfg.owner}"): валюта ${cfg.currency}, поріг доставки = ${cfg.freeShippingFrom}`, 'error');
        } else {
          ctx.log('прочитав власну конфігурацію', 'ok');
        }
      };
      root.querySelector('[data-read]').addEventListener('click', read);
      timer = setTimeout(read, 700);
    },
    unmount(root) {
      clearTimeout(timer);
      root.innerHTML = '';
    },
  });
})();
