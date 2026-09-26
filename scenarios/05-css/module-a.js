/*
 * Сценарій 05 · Ресурс CSS (каскад стилів) · конфлікт «запис/запис», динамічний відбиток.
 * Модуль A — «Каталог».
 *
 * Правило стилю пише в пари (елемент, властивість) для ВСІХ елементів, що збігаються з селектором:
 *   W_CSS(A) = { (e, p) | e ∈ match(".btn, .badge", DOM), p ∈ властивості правила }
 * Тому відбиток A залежить від того, що інші модулі поклали в DOM.
 *
 * Рівні захисту (?fix=):
 *   0 — правила й токен --accent глобальні;
 *   1 — правила в Shadow DOM модуля, токен --accent досі глобальний (типова «напівізоляція»);
 *   2 — правила в Shadow DOM, токен з префіксом --mf-a-accent.
 */
(function () {
  const EXPECTED = { bg: 'rgb(198, 40, 40)', pad: '10px' };
  let styles = [];
  let timer = null;

  function inject(css, target) {
    const st = document.createElement('style');
    st.textContent = css;
    target.appendChild(st);
    styles.push(st);
  }

  window.__registerModule('a', {
    mount(root, ctx) {
      const token = ctx.fix >= 2 ? '--mf-a-accent' : '--accent';
      // Токени дизайн-системи оголошуються на рівні документа — так зазвичай і роблять.
      inject(`:root { ${token}: #c62828; }`, document.head);

      const rules = `
        .card { padding: 4px 0; }
        .btn { background: var(${token}); color: #fff; border: 0; padding: 10px 18px;
               border-radius: 4px; font-size: 16px; cursor: pointer; }
        .badge { display: none; background: #1d232b; color: #fff; padding: 2px 8px;
                 border-radius: 3px; font-size: 12px; margin-left: 8px; }
        .card:hover .badge { display: inline-block; }   /* у каталозі бейдж видно лише при наведенні */
        .hint { font-size: 13px; color: #5b6573; }`;

      let host;
      if (ctx.fix >= 1) {
        host = root.shadowRoot || root.attachShadow({ mode: 'open' });
        host.innerHTML = '';
        inject(rules, host);
      } else {
        host = root;
        inject(rules, document.head);                   // ← запис у глобальний каскад
      }

      const content = document.createElement('div');
      content.innerHTML = `
        <div class="card">
          <b>Навушники X</b><span class="badge">хіт продажів</span>
          <p>2 499 грн</p>
          <button class="btn" type="button">Купити</button>
        </div>
        <p class="hint">Бейдж «хіт продажів» з’являється при наведенні на картку.</p>`;
      host.appendChild(content);
      ctx.log(`вставив токен ${token} у документ і правила .btn, .badge ${ctx.fix >= 1 ? 'у власний Shadow DOM' : 'у document.head'}`);

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
