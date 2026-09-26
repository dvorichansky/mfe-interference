/*
 * Сценарій 05 · Ресурс CSS (каскад стилів) · конфлікт «запис/запис», динамічний відбиток.
 * Модуль B — «Кошик». Використовує ті самі імена класів (.btn, .badge) і той самий токен --accent,
 * бо обидві команди колись узяли їх із «загальних рекомендацій».
 *
 * Два різновиди конфлікту з модулем A:
 *   .btn   — обидва модулі задають background і padding тих самих елементів:
 *            W_C(A, σ) ∩ W_C(B, σ) ≠ ∅, «запис/запис», перемагає каскад (за рівної специфічності — порядок);
 *   .badge — кошик не задає display, а правило каталогу задає display: none:
 *            W_C(A, σ′) ∩ R_C(B) ≠ ∅, «читання/запис».
 * Бейдж з’являється лише після «Застосувати промокод», тобто перетин виникає під час роботи,
 * без зміни коду жодного з модулів (відбиток, залежний від стану).
 */
(function () {
  const EXPECTED = { bg: 'rgb(46, 125, 50)', pad: '6px' };
  let styles = [];
  let timer = null;

  function inject(css, target) {
    const st = document.createElement('style');
    st.textContent = css;
    target.appendChild(st);
    styles.push(st);
  }

  window.__registerModule('b', {
    mount(root, ctx) {
      const token = ctx.fix >= 2 ? '--mf-b-accent' : '--accent';
      inject(`:root { ${token}: #2e7d32; }`, document.head);

      const rules = `
        .btn { background: var(${token}); color: #fff; border: 0; padding: 6px 12px;
               border-radius: 16px; font-size: 13px; cursor: pointer; margin-right: 6px; }
        .badge { background: #ffb300; color: #1d232b; padding: 2px 8px;
                 border-radius: 8px; font-size: 12px; }   /* display не задано: кошик покладається на значення за замовчуванням */
        .hint { font-size: 13px; color: #5b6573; }`;

      let host;
      if (ctx.fix >= 1) {
        host = root.shadowRoot || root.attachShadow({ mode: 'open' });
        host.innerHTML = '';
        inject(rules, host);
      } else {
        host = root;
        inject(rules, document.head);
      }

      const content = document.createElement('div');
      content.innerHTML = `
        <p>У кошику 3 товари, разом 7 497 грн <span data-slot></span></p>
        <button class="btn" type="button">Оформити</button>
        <button class="btn" type="button" data-promo>Застосувати промокод</button>
        <p class="hint">Промокод додає бейдж знижки поруч із сумою.</p>`;
      host.appendChild(content);
      ctx.log(`вставив токен ${token} у документ і правила .btn, .badge ${ctx.fix >= 1 ? 'у власний Shadow DOM' : 'у document.head'}`);

      content.querySelector('[data-promo]').addEventListener('click', () => {
        const slot = content.querySelector('[data-slot]');
        slot.innerHTML = '<span class="badge">−10%</span>';      // ← новий елемент у DOM розширює чужий відбиток
        ctx.log('застосував промокод, додав бейдж −10%');
        setTimeout(() => {
          const d = getComputedStyle(slot.querySelector('.badge')).display;
          if (d === 'none') {
            ctx.log('бейдж знижки невидимий: display: none прийшов не з коду кошика', 'error');
          } else {
            ctx.log(`бейдж знижки видно (display: ${d})`, 'ok');
          }
        }, 50);
      });

      timer = setTimeout(() => {
        const cs = getComputedStyle(host.querySelector('.btn'));
        if (cs.backgroundColor !== EXPECTED.bg || cs.paddingTop !== EXPECTED.pad) {
          ctx.log(`мої кнопки виглядають не так, як задумано: фон ${cs.backgroundColor} (очікувано ${EXPECTED.bg}), відступ ${cs.paddingTop} (очікувано ${EXPECTED.pad})`, 'error');
        } else {
          ctx.log('мої кнопки мають задуманий вигляд', 'ok');
        }
      }, 900);
    },
    unmount(root) {
      clearTimeout(timer);
      styles.forEach((s) => s.remove());
      styles = [];
      (root.shadowRoot || root).innerHTML = '';
    },
  });
})();
