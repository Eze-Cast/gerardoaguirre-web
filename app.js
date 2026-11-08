// Inventario: búsqueda, filtros, tarjetas y acceso a fichas.
const $ = (s) => document.querySelector(s);
const money = (n) =>
  new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 0,
  }).format(n);
const number = (n) => new Intl.NumberFormat('es-MX').format(n);
const mileage = (c) => (c.km == null ? 'Kilometraje por confirmar' : number(c.km) + ' km');
const wa = (c) => contactoURL(c);
const featured = [9, 5, 4, 6, 7, 11, 13];
[...new Set(INVENTARIO.map((c) => c.brand))]
  .sort()
  .forEach((b) => $('#brand').add(new Option(b, b)));
// Cada grupo contiene todas las unidades de una misma marca y modelo.
const modelKey = (c) => `${c.brand}|${c.model}`;
const editionKey = (c) => `${c.version || ''}|${c.year}|${c.transmission}`;
const chosenUnits = new Map();
let visibleGroups = new Map();
const isCompared = (id) => typeof comparisonHasUnit === 'function' && comparisonHasUnit(id);
const escapeText = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (char) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
      })[char]
  );

function carPhoto(car, thumbnail = false, className = '') {
  const src = thumbnail ? car.thumbnail : car.photos[0];
  if (!src) return '<span class="photo-pending">Fotografía pendiente</span>';
  return `<img class="${className}" src="${src}" alt="${escapeText(`${car.name} ${car.year}, ${car.color}`)}" ${thumbnail ? 'loading="lazy"' : ''} decoding="async" />`;
}

function groupBy(units, key) {
  const groups = new Map();
  for (const unit of units) {
    const value = key(unit);
    if (!groups.has(value)) groups.set(value, []);
    groups.get(value).push(unit);
  }
  return groups;
}

const defaultUnit = (units) =>
  [...units].sort(
    (a, b) =>
      Number(Boolean(b.thumbnail)) - Number(Boolean(a.thumbnail)) ||
      (a.km ?? Infinity) - (b.km ?? Infinity) ||
      a.price - b.price ||
      a.id - b.id
  )[0];

function chooseUnit(units) {
  const featuredUnit = featured.map((id) => units.find((c) => c.id === id)).find(Boolean);
  if (featuredUnit) return featuredUnit;
  const editions = [...groupBy(units, editionKey).values()];
  const colorCount = (edition) => new Set(edition.map((c) => c.color)).size;
  editions.sort((a, b) => colorCount(b) - colorCount(a) || b[0].year - a[0].year);
  return defaultUnit(editions[0]);
}

function colorTone(color) {
  const tones = {
    blanco: '#f7f7f5',
    plata: '#aab0b6',
    gris: '#626b74',
    negro: '#262a30',
    rojo: '#a32536',
    azul: '#2a5888',
    verde: '#6c8c51',
    ceramic: '#d9d8d1',
  };
  return tones[color.toLowerCase().split(' ')[0]] || '#8799aa';
}

function variantControls(group, active) {
  const editions = [...groupBy(group.units, editionKey).values()];
  const edition = editions.find((units) => editionKey(units[0]) === editionKey(active));
  const colors = groupBy(edition, (unit) => unit.color);
  const sameColor = colors.get(active.color);
  if (group.units.length === 1) return '';
  const option = (unit, label, selected) =>
    `<option value="${unit.id}" ${selected ? 'selected' : ''}>${escapeText(label)}</option>`;
  return `<div class="card-variants" aria-label="Opciones de ${escapeText(active.model)}">
    ${
      editions.length > 1
        ? `<label>Versión y año<select data-variant-control="edition">${editions
            .map((units) => {
              const unit = defaultUnit(units);
              return option(
                unit,
                [unit.version, unit.year, unit.transmission].filter(Boolean).join(' · '),
                editionKey(unit) === editionKey(active)
              );
            })
            .join('')}</select></label>`
        : ''
    }
    ${colors.size > 1 ? `<div class="color-options" role="group" aria-label="Colores disponibles">${[...colors].map(([color, units]) => `<button type="button" class="color-option" data-color-unit="${defaultUnit(units).id}" aria-pressed="${color === active.color}" title="${escapeText(color)}"><span style="--paint:${colorTone(color)}" aria-hidden="true"></span>${escapeText(color)}</button>`).join('')}</div>` : ''}
    ${sameColor.length > 1 ? `<label>Unidad de este color<select data-variant-control="unit">${sameColor.map((unit) => option(unit, `${mileage(unit)} · ${money(unit.price)}`, unit.id === active.id)).join('')}</select></label>` : ''}
  </div>`;
}

function renderCard(group, c) {
  return /* HTML */ `
    <article class="card" data-model="${group.key}">
      <button class="card-photo" data-car="${c.id}" aria-label="Ver ficha de ${c.name} ${c.year}">
        ${carPhoto(c, true)}
        <span class="badge">${c.category}</span>
      </button>
      <div class="card-body">
        ${variantControls(group, c)}
        ${c.photoNote ? `<p class="variant-photo-note">${c.photoNote}</p>` : ''}
        <span class="card-year">${c.year} · ${c.color}</span>
        <h3>${c.brand} ${c.model}</h3>
        ${c.version ? `<span class="card-version">${c.version}</span>` : ''}
        <div class="specs">
          <span>${mileage(c)}</span>
          <span>·</span>
          <span>${c.transmission}</span>
        </div>
        <div class="card-bottom">
          <span class="price">
            ${money(c.price)}
            <small>MXN</small>
          </span>
          <button class="view-car" data-car="${c.id}" aria-label="Ver ficha de ${c.name}">↗</button>
        </div>
        <button class="compare-toggle" data-compare="${c.id}" aria-pressed="${isCompared(c.id)}">
          ${isCompared(c.id) ? '✓ En comparación' : '＋ Comparar'}
        </button>
        <div class="card-contact-row">
          <a class="card-wa" href="${wa(c)}" target="_blank" rel="noopener">Me interesa ↗</a>
          <a class="card-trade-in" href="#auto-a-cuenta">
            <span aria-hidden="true">↔</span>
            Tomamos tu auto a cuenta
          </a>
        </div>
      </div>
    </article>
  `;
}

// Ordena y filtra por las unidades coincidentes, con una sola tarjeta por modelo.
function renderInventory() {
  const term = $('#search').value.trim().toLocaleLowerCase('es');
  const units = INVENTARIO.filter(
    (c) =>
      `${c.name} ${c.year} ${c.color}`.toLocaleLowerCase('es').includes(term) &&
      (!$('#brand').value || c.brand === $('#brand').value) &&
      (!$('#category').value || c.category === $('#category').value)
  );
  const sort = $('#sort').value;
  const groups = [...groupBy(units, modelKey).values()].map((matches) => {
    const key = matches[0].id;
    const chosen = matches.find((c) => c.id === chosenUnits.get(modelKey(matches[0])));
    const active =
      chosen ||
      (sort === 'low'
        ? matches.reduce((a, b) => (a.price <= b.price ? a : b))
        : sort === 'high'
          ? matches.reduce((a, b) => (a.price >= b.price ? a : b))
          : sort === 'year'
            ? matches.reduce((a, b) => (a.year >= b.year ? a : b))
            : chooseUnit(matches));
    return { key, units: matches, active };
  });
  const rank = ({ units }) =>
    Math.min(...units.map(({ id }) => (featured.includes(id) ? featured.indexOf(id) : id + 10)));
  groups.sort((a, b) =>
    sort === 'low'
      ? a.active.price - b.active.price
      : sort === 'high'
        ? b.active.price - a.active.price
        : sort === 'year'
          ? b.active.year - a.active.year
          : rank(a) - rank(b)
  );
  visibleGroups = new Map(groups.map((g) => [g.key, g]));
  $('#count').textContent =
    `${groups.length} ${groups.length === 1 ? 'modelo' : 'modelos'} · ${units.length} ${units.length === 1 ? 'unidad disponible' : 'unidades disponibles'}`;
  $('#grid').innerHTML = groups.length
    ? groups.map((g) => renderCard(g, g.active)).join('')
    : '<p class="empty">No encontramos autos con esos filtros. Prueba otra marca o limpia la búsqueda.</p>';
}

function changeVariant(control, id) {
  const card = control.closest('[data-model]');
  const group = visibleGroups.get(Number(card.dataset.model));
  const selected = group.units.find((c) => c.id === id);
  if (!selected) return;
  chosenUnits.set(modelKey(selected), id);
  group.active = selected;
  card.outerHTML = renderCard(group, selected);
  const focusTarget = control.dataset.variantControl
    ? `[data-variant-control="${control.dataset.variantControl}"]`
    : `[data-color-unit="${id}"]`;
  document
    .querySelector(`[data-model="${group.key}"] ${focusTarget}`)
    ?.focus({ preventScroll: true });
}

$('#grid').addEventListener('click', (event) => {
  const button = event.target.closest('[data-color-unit]');
  if (button && button.getAttribute('aria-pressed') !== 'true') {
    changeVariant(button, Number(button.dataset.colorUnit));
  }
});
$('#grid').addEventListener('change', (event) => {
  const select = event.target.closest('[data-variant-control]');
  if (select) changeVariant(select, Number(select.value));
});
$('#filters').addEventListener('submit', (e) => e.preventDefault());
['search', 'brand', 'category', 'sort'].forEach((id) =>
  $('#' + id).addEventListener(id === 'search' ? 'input' : 'change', renderInventory)
);
$('#reset').onclick = () => {
  $('#filters').reset();
  renderInventory();
};
let lastTrigger;
$('#grid').onclick = (e) => {
  const trigger = e.target.closest('[data-car]');
  if (!trigger) return;
  lastTrigger = trigger;
  openVehicle(Number(trigger.dataset.car));
};
$('#closeDialog').onclick = () => $('#detail').close();
$('#detail').addEventListener('click', (e) => {
  if (e.target === $('#detail')) {
    const r = $('#detail').getBoundingClientRect();
    if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom)
      $('#detail').close();
  }
});
$('#detail').addEventListener('close', () => {
  document.body.style.overflow = '';
  lastTrigger?.focus();
});
$('#year').textContent = new Date().getFullYear();
renderInventory();
const observer = new IntersectionObserver(
  (entries) =>
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        observer.unobserve(e.target);
      }
    }),
  { threshold: 0.1 }
);
document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
// Progreso suavizado del acercamiento; sin respuesta al cursor ni giros.
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
let displayedProgress = 0,
  targetProgress = 0,
  motionFrame = 0;
function smoothHero() {
  displayedProgress += (targetProgress - displayedProgress) * 0.14;
  if (Math.abs(targetProgress - displayedProgress) < 0.0005) displayedProgress = targetProgress;
  document.documentElement.style.setProperty('--p', displayedProgress.toFixed(4));
  motionFrame = displayedProgress !== targetProgress ? requestAnimationFrame(smoothHero) : 0;
}
function updateHeroTarget() {
  if (reduced.matches) {
    cancelAnimationFrame(motionFrame);
    motionFrame = 0;
    displayedProgress = targetProgress = 0;
    document.documentElement.style.setProperty('--p', 0);
    return;
  }
  targetProgress = Math.min(
    1,
    Math.max(0, scrollY / Math.max(1, $('.hero-track').offsetHeight - innerHeight))
  );
  if (!motionFrame) motionFrame = requestAnimationFrame(smoothHero);
}
addEventListener('scroll', updateHeroTarget, { passive: true });
addEventListener('resize', updateHeroTarget, { passive: true });
reduced.addEventListener('change', updateHeroTarget);
updateHeroTarget();
