// Fichas técnicas y comparación. Los datos editables están en archivos separados.
const TECH = FICHAS_TECNICAS;
// Cada carga empieza con una comparación vacía.
let compared = [];
const pending = 'Por confirmar';
const basicRows = (c) => [
  ['Año modelo', c.year],
  ['Kilometraje', mileage(c)],
  ['Transmisión', c.transmission],
  ['Color', c.color],
  ['Tipo', c.category],
  ['Condición', c.condition || 'Seminuevo'],
];
const renderSpecList = (rows) =>
  '<dl class="spec-list">' +
  rows
    .map(
      ([k, v]) => /* HTML */ `
        <div>
          <dt>${k}</dt>
          <dd>${v}</dd>
        </div>
      `
    )
    .join('') +
  '</dl>';
const renderEquipmentList = (items) =>
  '<ul class="equipment-list">' +
  items
    .map(
      (x) => /* HTML */ `
        <li>${x}</li>
      `
    )
    .join('') +
  '</ul>';
// Construye las cinco pestañas de especificaciones de una unidad.
function techSections(c) {
  const t = TECH[c.id];
  const groups = [
    ['Datos de la unidad', renderSpecList(basicRows(c))],
    [
      'Motor y desempeño',
      renderSpecList([
        ['Motor', t.engine],
        ['Potencia', t.power],
        ['Torque', t.torque],
        ['Transmisión', t.gearbox],
        ['Tracción', t.drive],
        ['Combustible', t.fuel],
      ]),
    ],
    [
      'Capacidades',
      renderSpecList([
        ['Largo × ancho × alto', t.dimensions],
        ['Pasajeros', t.passengers],
        ['Cajuela / carga', t.trunk],
        ['Tanque de combustible', t.tank],
      ]),
    ],
    ['Seguridad', renderEquipmentList(t.safety)],
    ['Equipamiento', renderEquipmentList(t.equipment)],
  ];
  return `${
    t.note
      ? /* HTML */ `
          <p class="spec-unit-note">${t.note}</p>
        `
      : ''
  }<div class="spec-tabs" role="tablist" aria-label="Especificaciones del vehículo">${groups
    .map(
      ([name], i) => /* HTML */ `
        <button
          role="tab"
          id="spec-tab-${i}"
          data-spec-tab="${i}"
          aria-controls="spec-panel-${i}"
          aria-selected="${i === 0}"
          tabindex="${i === 0 ? 0 : -1}"
        >
          ${name}
        </button>
      `
    )
    .join('')}</div>${groups
    .map(
      ([name, content], i) => /* HTML */ `
        <div
          class="spec-panel"
          role="tabpanel"
          id="spec-panel-${i}"
          aria-labelledby="spec-tab-${i}"
          tabindex="0"
          ${i ? 'hidden' : ''}
        >
          <h4>${name}</h4>
          ${content}
        </div>
      `
    )
    .join(
      ''
    )}<p class="spec-source">Datos de fábrica para la versión o configuración indicada. <a href="${t.source}" target="_blank" rel="noopener">Consultar referencia del fabricante ↗</a>. Confirma el equipo de esta unidad con el asesor.</p>`;
}

// Abre la ficha del auto y conserva el foco para regresar al cerrarla.
function openVehicle(id) {
  const c = INVENTARIO.find((c) => c.id === id);
  if (!c) return;
  $('#detailContent').innerHTML = /* HTML */ `
    <div class="vehicle-detail">
      <div class="vehicle-gallery">
        <img
          class="detail-main"
          id="galleryMain"
          src="${c.photos[0]}"
          alt="${c.name}, fotografía 1"
        />
      </div>
      <div class="detail-body">
        <p class="eyebrow">SEMINUEVO · ${c.brand} · ${c.year}</p>
        <h2 id="vehicleTitle">${c.name}</h2>
        <div class="detail-specs">
          <span>${mileage(c)}</span>
          <span>${c.transmission}</span>
          <span>${c.color}</span>
        </div>
        <p class="price">
          ${money(c.price)}
          <small>MXN</small>
        </p>
        <div class="detail-actions">
          <a class="button" href="${wa(c)}" target="_blank" rel="noopener">
            Me interesa este auto ↗
          </a>
          <a class="detail-trade-in" href="#auto-a-cuenta" data-trade-in>
            <span aria-hidden="true">↔</span>
            Tomamos tu auto a cuenta
          </a>
          <button
            class="compare-toggle"
            data-compare="${c.id}"
            aria-pressed="${compared.includes(c.id)}"
          >
            ${compared.includes(c.id) ? '✓ En comparación' : '＋ Comparar'}
          </button>
        </div>
        <p class="inventory-note">
          Precio de lista sujeto a cambio y disponibilidad. Consulta el precio final, impuestos
          aplicables y condiciones con el asesor.
        </p>
      </div>
    </div>
    <section class="full-specs">
      <div class="full-specs-heading">
        <p class="eyebrow">CONOCE EL AUTO A FONDO</p>
        <h3>Especificaciones y equipamiento</h3>
      </div>
      ${techSections(c)}
    </section>
  `;
  $('#detail').setAttribute('aria-labelledby', 'vehicleTitle');
  $('#detail').showModal();
  $('#detail').scrollTop = 0;
  document.body.style.overflow = 'hidden';
}

// Sincroniza los tres espacios y la tabla, sin guardar selecciones entre recargas.
function refreshCompare() {
  $('#navCompareCount').textContent = compared.length;
  const clear = $('#clearComparison');
  if (clear) clear.disabled = !compared.length;
  document.querySelectorAll('[data-compare]').forEach((b) => {
    const selected = compared.includes(Number(b.dataset.compare));
    b.setAttribute('aria-pressed', String(selected));
    b.textContent = selected ? '✓ En comparación' : '＋ Comparar';
  });
  $('#compareSelectors').innerHTML = [0, 1, 2]
    .map((slot) => {
      const c = INVENTARIO.find((c) => c.id === compared[slot]);
      return /* HTML */ `
        <div class="compare-slot">
          <div class="slot-top">
            <span class="slot-label">0${slot + 1} / TU SELECCIÓN</span>
            ${
              c
                ? /* HTML */ `
                    <button
                      class="slot-remove"
                      data-remove="${c.id}"
                      aria-label="Quitar ${c.name} de la selección"
                    >
                      Quitar ×
                    </button>
                  `
                : ''
            }
          </div>
          <button
            class="vehicle-picker-trigger"
            data-pick-slot="${slot}"
            aria-haspopup="dialog"
            aria-label="Elegir vehículo ${slot + 1} para comparar"
          >
            ${
              c
                ? /* HTML */ `
                    <img src="${c.thumbnail}" alt="" />
                    <span>
                      <strong>${c.name}</strong>
                      <small>${c.year} · ${money(c.price)}</small>
                    </span>
                  `
                : '<span class="slot-plus">＋</span><span><strong>Elige un seminuevo</strong><small>Explora nuestra selección</small></span>'
            }
            <span class="picker-arrow">${c ? 'Cambiar ↗' : 'Elegir ↗'}</span>
          </button>
        </div>
      `;
    })
    .join('');

  const selected = compared.map((id) => INVENTARIO.find((c) => c.id === id));
  $('#compareStatus').textContent =
    selected.length < 2
      ? selected.length === 1
        ? 'Elige un auto más y abriremos tu comparativa automáticamente.'
        : 'Selecciona dos vehículos para ver su comparativa.'
      : `${selected.length} seminuevos en comparación. Desliza la tabla en teléfono para ver todas las columnas.`;
  if (selected.length < 2) {
    $('#comparisonContent').innerHTML = /* HTML */ `
      <div class="compare-empty">
        <span>＋</span>
        <h3>Dos opciones. Una decisión mejor.</h3>
        <p>Elige arriba o pulsa “Comparar” en las tarjetas del inventario.</p>
        <a href="#inventario">Explorar seminuevos ↗</a>
      </div>
    `;
    return;
  }
  const rows = [
    ['Precio de lista', (c) => money(c.price)],
    ['Año', (c) => c.year],
    ['Kilometraje', (c) => mileage(c)],
    ['Transmisión', (c) => c.transmission],
    ['Color', (c) => c.color],
    ['Tipo', (c) => c.category],
    ['Motor', (c) => TECH[c.id]?.engine || pending],
    ['Potencia', (c) => TECH[c.id]?.power || pending],
    ['Torque', (c) => TECH[c.id]?.torque || pending],
    ['Caja', (c) => TECH[c.id]?.gearbox || pending],
    ['Tracción', (c) => TECH[c.id]?.drive || pending],
    ['Combustible', (c) => TECH[c.id]?.fuel || pending],
    ['Pasajeros', (c) => TECH[c.id]?.passengers || pending],
    ['Cajuela', (c) => TECH[c.id]?.trunk || pending],
    ['Seguridad', (c) => (TECH[c.id] ? TECH[c.id].safety.join(' · ') : pending)],
    ['Equipamiento', (c) => (TECH[c.id] ? TECH[c.id].equipment.join(' · ') : pending)],
  ];
  const minPrice = Math.min(...selected.map((c) => c.price));
  const minKm = Math.min(...selected.filter((c) => c.km != null).map((c) => c.km));
  $('#comparisonContent').innerHTML = /* HTML */ `
    <div
      class="comparison-scroll"
      role="region"
      aria-label="Tabla de comparación de seminuevos"
      tabindex="0"
    >
      <table class="compare-table">
        <caption>Comparación de seminuevos seleccionados</caption>
        <thead>
          <tr>
            <th scope="col">Compara tus opciones</th>
            ${selected
              .map(
                (c) => /* HTML */ `
                  <th scope="col">
                    <button
                      class="remove-compare"
                      data-remove="${c.id}"
                      aria-label="Quitar ${c.name} de la comparación"
                    >
                      ✕
                    </button>
                    <img src="${c.thumbnail}" alt="${c.name}" />
                    <span>${c.year} · ${c.brand}</span>
                    <h3>${c.name}</h3>
                    <button class="compare-details" data-open="${c.id}">
                      Ver ficha completa ↗
                    </button>
                  </th>
                `
              )
              .join('')}
          </tr>
        </thead>
        <tbody>
          ${rows
            .map(
              ([label, value], i) => /* HTML */ `
                <tr>
                  <th scope="row">${label}</th>
                  ${selected
                    .map(
                      (c) => /* HTML */ `
                        <td
                          class="${(i === 0 && c.price === minPrice) || (i === 2 && c.km === minKm) ? 'highlight-cell' : ''}"
                        >
                          ${value(c)}${i === 0 && c.price === minPrice ? '<small>Menor precio de la selección</small>' : i === 2 && c.km === minKm ? '<small>Menor kilometraje de la selección</small>' : ''}
                        </td>
                      `
                    )
                    .join('')}
                </tr>
              `
            )
            .join('')}
          <tr>
            <th scope="row">Atención personal</th>
            ${selected
              .map(
                (c) => /* HTML */ `
                  <td>
                    <a class="button" href="${wa(c)}" target="_blank" rel="noopener">Consultar ↗</a>
                  </td>
                `
              )
              .join('')}
          </tr>
        </tbody>
      </table>
    </div>
  `;
}
// Al completar la segunda opción, muestra la tabla después de cerrar cualquier ficha.
function showComparisonIfReady(previousCount) {
  if (previousCount >= 2 || compared.length < 2) return;
  const detail = $('#detail');
  if (detail.open) detail.close();
  requestAnimationFrame(() => {
    history.replaceState(null, '', '#comparar');
    $('#comparisonContent').scrollIntoView({
      behavior: reduced.matches ? 'instant' : 'smooth',
      block: 'start',
    });
    $('#comparar').focus({ preventScroll: true });
  });
}

document.addEventListener('click', (e) => {
  if (e.target.closest('[data-trade-in]')) {
    e.preventDefault();
    $('#detail').close();
    requestAnimationFrame(() => {
      history.replaceState(null, '', '#auto-a-cuenta');
      $('#auto-a-cuenta').scrollIntoView({ behavior: reduced.matches ? 'instant' : 'smooth' });
    });
    return;
  }
  if (e.target.closest('#clearComparison')) {
    compared = [];
    refreshCompare();
    return;
  }
  const b = e.target.closest('[data-compare],[data-remove],[data-open]');
  if (!b) return;
  if (b.dataset.open) {
    lastTrigger = b;
    openVehicle(Number(b.dataset.open));
    return;
  }
  const previousCount = compared.length;
  const id = Number(b.dataset.compare || b.dataset.remove);
  if (compared.includes(id)) compared = compared.filter((x) => x !== id);
  else if (compared.length < 3) compared.push(id);
  else {
    const notice = $('#compareNotice');
    notice.textContent = 'Ya seleccionaste 3 autos. Retira uno en el comparador para agregar otro.';
    notice.hidden = false;
    clearTimeout(window.compareNoticeTimeout);
    window.compareNoticeTimeout = setTimeout(() => (notice.hidden = true), 5000);
    return;
  }
  refreshCompare();
  showComparisonIfReady(previousCount);
});
$('#compareSelectors').addEventListener('change', (e) => {
  const s = e.target.closest('[data-slot]');
  if (!s) return;
  const previousCount = compared.length;
  const slot = Number(s.dataset.slot);
  const id = Number(s.value);
  const next = [...compared];
  if (id) next[slot] = id;
  else next.splice(slot, 1);
  compared = next.filter(Boolean);
  refreshCompare();
  showComparisonIfReady(previousCount);
});
const notice = document.createElement('div');
notice.id = 'compareNotice';
notice.className = 'compare-notice';
notice.setAttribute('role', 'status');
notice.hidden = true;
document.body.append(notice);
$('#inventoryStats').innerHTML = '';
const gridObserver = new MutationObserver(() =>
  document.querySelectorAll('#grid [data-compare]').forEach((b) => {
    const selected = compared.includes(Number(b.dataset.compare));
    if (b.getAttribute('aria-pressed') !== String(selected)) {
      b.setAttribute('aria-pressed', String(selected));
      b.textContent = selected ? '✓ En comparación' : '＋ Comparar';
    }
  })
);
gridObserver.observe($('#grid'), { childList: true });
refreshCompare();

// Selector visual con fotos y búsqueda; el diálogo admite Escape y controla el foco.
const vehiclePicker = document.createElement('dialog');
vehiclePicker.id = 'vehiclePicker';
vehiclePicker.setAttribute('aria-labelledby', 'pickerTitle');
vehiclePicker.innerHTML = /* HTML */ `
  <div class="picker-heading">
    <div>
      <p class="eyebrow">ENCUENTRA TU OPCIÓN</p>
      <h2 id="pickerTitle">Elige un seminuevo</h2>
    </div>
    <button id="closePicker" aria-label="Cerrar selector de autos">✕</button>
  </div>
  <div class="picker-search">
    <input
      id="pickerSearch"
      type="search"
      placeholder="Buscar por marca o modelo"
      aria-label="Buscar auto para comparar"
    />
  </div>
  <div id="pickerResults" class="picker-results"></div>
`;
document.body.append(vehiclePicker);
let pickerSlot = 0,
  pickerTrigger;
function renderPicker() {
  const query = $('#pickerSearch').value.toLocaleLowerCase('es').trim();
  const available = INVENTARIO.filter((c) =>
    (c.name + ' ' + c.year).toLocaleLowerCase('es').includes(query)
  );
  $('#pickerResults').innerHTML = available.length
    ? available
        .map((c) => {
          const unavailable = compared.includes(c.id) && compared[pickerSlot] !== c.id;
          return /* HTML */ `
            <button class="picker-option" data-pick-car="${c.id}" ${unavailable ? 'disabled' : ''}>
              <img src="${c.thumbnail}" alt="" loading="lazy" />
              <span>
                <strong>${c.name}</strong>
                <small>${c.year} · ${mileage(c)} · ${c.transmission}</small>
                <b>
                  ${money(c.price)}
                  <em>MXN</em>
                </b>
              </span>
              <span class="pick-check">
                ${unavailable ? 'Ya elegido' : compared[pickerSlot] === c.id ? '✓' : '↗'}
              </span>
            </button>
          `;
        })
        .join('')
    : '<p class="picker-no-results">No hay coincidencias. Prueba con otra marca o modelo.</p>';
}
document.addEventListener('click', (e) => {
  const trigger = e.target.closest('[data-pick-slot]');
  if (trigger) {
    pickerSlot = Number(trigger.dataset.pickSlot);
    pickerTrigger = trigger;
    $('#pickerSearch').value = '';
    renderPicker();
    vehiclePicker.showModal();
    document.body.style.overflow = 'hidden';
    $('#pickerSearch').focus();
  }
});
$('#pickerSearch').addEventListener('input', renderPicker);
$('#closePicker').onclick = () => vehiclePicker.close();
vehiclePicker.addEventListener('close', () => {
  document.body.style.overflow = '';
  document.querySelector(`[data-pick-slot="${pickerSlot}"]`)?.focus();
});
$('#pickerResults').onclick = (e) => {
  const b = e.target.closest('[data-pick-car]');
  if (!b || b.disabled) return;
  const previousCount = compared.length;
  const id = Number(b.dataset.pickCar);
  if (compared[pickerSlot] !== id) {
    const next = [...compared];
    next[pickerSlot] = id;
    compared = next.filter(Boolean);
    refreshCompare();
  }
  vehiclePicker.close();
  showComparisonIfReady(previousCount);
};

function selectSpecTab(button) {
  const tabs = [...document.querySelectorAll('[data-spec-tab]')];
  tabs.forEach((t) => {
    const active = t === button;
    t.setAttribute('aria-selected', String(active));
    t.tabIndex = active ? 0 : -1;
    document.getElementById('spec-panel-' + t.dataset.specTab).hidden = !active;
  });
}
$('#detailContent').addEventListener('click', (e) => {
  const button = e.target.closest('[data-spec-tab]');
  if (button) selectSpecTab(button);
});
$('#detailContent').addEventListener('keydown', (e) => {
  const button = e.target.closest('[data-spec-tab]');
  if (!button) return;
  const tabs = [...document.querySelectorAll('[data-spec-tab]')];
  let index = tabs.indexOf(button);
  if (e.key === 'ArrowRight') index = (index + 1) % tabs.length;
  else if (e.key === 'ArrowLeft') index = (index + tabs.length - 1) % tabs.length;
  else if (e.key === 'Home') index = 0;
  else if (e.key === 'End') index = tabs.length - 1;
  else return;
  e.preventDefault();
  selectSpecTab(tabs[index]);
  tabs[index].focus();
});
