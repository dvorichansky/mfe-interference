/*
 * Сценарій 06 · Ресурс E (події й таймери) · темпоральне порушення володіння.
 * Модуль A — «Живі ціни». Під час монтування запускає таймер і глобальний обробник клавіатури.
 *
 * Модель: відбиток модуля має бути порожнім поза інтервалом [mount, unmount].
 * Без захисту unmount лише очищає розмітку: таймер і обробник живуть далі,
 *   а таймер шукає .price глобально й після демонтажу пише в елемент кошика.
 * Із захистом (контракт життєвого циклу): clearInterval + AbortController + пошук лише у власному піддереві.
 */
(function () {
  let current = null;

  window.__registerModule('a', {
    mount(root, ctx) {
      const life = { mounted: true, timer: null, controller: new AbortController() };
      current = life;

      root.innerHTML = `
        <p>Навушники X: <b class="price">2 499 грн</b></p>
        <p style="font-size:13px;color:#5b6573">Ціна оновлюється щосекунди. Клавіша «/» відкриває пошук каталогу.</p>`;

      life.timer = setInterval(() => {
        const price = 2400 + Math.round(Math.random() * 200);
        const el = ctx.fix ? root.querySelector('.price') : document.querySelector('.price');   // ← глобальний пошук
        if (!el) return;
        el.textContent = price + ' грн';
        if (!life.mounted) {
          window.__demoStats.zombieTicks++;
          const owner = (el.closest('[data-module]') || { dataset: {} }).dataset.module || '?';
          ctx.log(`(після демонтажу) таймер записав ціну ${price} грн в елемент модуля ${owner.toUpperCase()}`, 'error');
        }
      }, 1000);

      const onKey = (e) => {
        if (e.key !== '/') return;
        e.preventDefault();
        if (!life.mounted) {
          window.__demoStats.zombieKeys++;
          ctx.log('(після демонтажу) спрацював обробник «/»: відкриваю пошук, якого вже немає', 'error');
        } else {
          ctx.log('відкриваю пошук каталогу');
        }
      };
      window.addEventListener('keydown', onKey, ctx.fix ? { signal: life.controller.signal } : undefined);
      ctx.log('запустив таймер цін і глобальний обробник клавіші «/»');
    },
    unmount(root, ctx) {
      current.mounted = false;
      if (ctx.fix) {
        clearInterval(current.timer);
        current.controller.abort();
        ctx.log('зупинив таймер і зняв обробник (контракт життєвого циклу)', 'ok');
      }
      // Без захисту модуль «забуває» прибрати свої ефекти — типова помилка.
      root.innerHTML = '';
    },
  });
})();
