// Controles visuales conectados con los filtros y el restablecimiento del formulario.
(() => {
  const form = document.querySelector('#filters');
  const widgets = [];
  const escapeHTML = (s) =>
    s.replace(
      /[&<>"']/g,
      (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]
    );
  const icon = (value, brand) =>
    brand && value
      ? /* HTML */ `
          <img src="assets/marcas/${value.toLowerCase()}.webp" alt="" width="42" height="28" />
        `
      : /* HTML */ `
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <rect x="3" y="3" width="6" height="6" rx="1" />
            <rect x="15" y="3" width="6" height="6" rx="1" />
            <rect x="3" y="15" width="6" height="6" rx="1" />
            <rect x="15" y="15" width="6" height="6" rx="1" />
          </svg>
        `;
  function closeAll(except) {
    widgets.forEach((w) => {
      if (w !== except) w.close();
    });
  }
  ['brand', 'category', 'sort'].forEach((id) => {
    const select = document.getElementById(id),
      label = select.parentElement;
    const name = label.firstChild.textContent.trim();
    const wrapper = document.createElement('div');
    wrapper.className = `filter-menu filter-menu-${id}`;
    wrapper.innerHTML = /* HTML */ `
      <span class="filter-caption" id="${id}Caption">${name}</span>
      <button
        class="filter-trigger"
        type="button"
        aria-haspopup="listbox"
        aria-expanded="false"
        aria-controls="${id}Options"
        aria-label="${name}"
      ></button>
      <div class="filter-popover" hidden>
        <p class="filter-menu-title">
          ${id === 'brand' ? 'Explora por marca' : id === 'category' ? 'Elige tu estilo' : 'Ordena tu selección'}
        </p>
        <div
          class="filter-options"
          role="listbox"
          id="${id}Options"
          aria-labelledby="${id}Caption"
        ></div>
      </div>
    `;
    label.replaceWith(wrapper);
    wrapper.prepend(select);
    select.hidden = true;
    const trigger = wrapper.querySelector('.filter-trigger'),
      popover = wrapper.querySelector('.filter-popover'),
      list = wrapper.querySelector('.filter-options');
    list.innerHTML = [...select.options]
      .map((option, i) => {
        const value = escapeHTML(option.value),
          text = escapeHTML(option.textContent);
        const count =
          id === 'brand'
            ? INVENTARIO.filter((c) => !option.value || c.brand === option.value).length
            : null;
        return /* HTML */ `
          <button type="button" role="option" tabindex="-1" data-index="${i}" aria-selected="false">
            ${icon(value, id === 'brand')}
            <span>${text}</span>
            ${
              count !== null
                ? /* HTML */ `
                    <small>${count}</small>
                  `
                : ''
            }
            <b class="filter-check" aria-hidden="true">✓</b>
          </button>
        `;
      })
      .join('');
    const options = [...list.querySelectorAll('[role=option]')];
    const sync = () => {
      const selected = select.options[select.selectedIndex];
      trigger.innerHTML = `${id === 'brand' ? icon(escapeHTML(select.value), true) : ''}<span>${escapeHTML(selected.textContent)}</span><svg class="filter-chevron" viewBox="0 0 16 16" aria-hidden="true"><path d="m4 6 4 4 4-4"/></svg>`;
      trigger.setAttribute('aria-label', `${name}: ${selected.textContent}`);
      options.forEach((option, i) =>
        option.setAttribute('aria-selected', String(i === select.selectedIndex))
      );
    };
    const widget = {
      close() {
        popover.hidden = true;
        trigger.setAttribute('aria-expanded', 'false');
      },
    };
    const open = () => {
      closeAll(widget);
      popover.hidden = false;
      trigger.setAttribute('aria-expanded', 'true');
      options[select.selectedIndex].focus({ preventScroll: true });
    };
    widgets.push(widget);
    trigger.addEventListener('click', () => (popover.hidden ? open() : widget.close()));
    trigger.addEventListener('keydown', (e) => {
      if (['ArrowDown', 'ArrowUp'].includes(e.key)) {
        e.preventDefault();
        open();
      }
    });
    list.addEventListener('click', (e) => {
      const option = e.target.closest('[data-index]');
      if (!option) return;
      select.selectedIndex = Number(option.dataset.index);
      select.dispatchEvent(new Event('change', { bubbles: true }));
      widget.close();
      trigger.focus({ preventScroll: true });
    });
    list.addEventListener('keydown', (e) => {
      const current = options.indexOf(document.activeElement);
      let next;
      if (e.key === 'ArrowDown') next = (current + 1) % options.length;
      if (e.key === 'ArrowUp') next = (current + options.length - 1) % options.length;
      if (e.key === 'Home') next = 0;
      if (e.key === 'End') next = options.length - 1;
      if (next !== undefined) {
        e.preventDefault();
        options[next].focus();
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        widget.close();
        trigger.focus();
      }
      if (e.key === 'Tab') widget.close();
    });
    select.addEventListener('change', sync);
    form.addEventListener('reset', () =>
      requestAnimationFrame(() => {
        sync();
        widget.close();
      })
    );
    wrapper.addEventListener('focusout', (e) => {
      if (!wrapper.contains(e.relatedTarget)) widget.close();
    });
    sync();
  });
  document.addEventListener('pointerdown', (e) => {
    if (!e.target.closest('.filter-menu')) closeAll();
  });
})();
