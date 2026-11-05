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
// Combina los filtros activos y vuelve a dibujar las tarjetas visibles.
function renderInventory() {
  const term = $('#search').value.trim().toLocaleLowerCase('es');
  let list = INVENTARIO.filter(
    (c) =>
      (c.name + ' ' + c.year).toLocaleLowerCase('es').includes(term) &&
      (!$('#brand').value || c.brand === $('#brand').value) &&
      (!$('#category').value || c.category === $('#category').value)
  );
  const sort = $('#sort').value;
  list.sort((a, b) =>
    sort === 'low'
      ? a.price - b.price
      : sort === 'high'
        ? b.price - a.price
        : sort === 'year'
          ? b.year - a.year
          : (featured.includes(a.id) ? featured.indexOf(a.id) : a.id + 10) -
            (featured.includes(b.id) ? featured.indexOf(b.id) : b.id + 10)
  );
  $('#count').textContent =
    `${list.length} ${list.length === 1 ? 'vehículo' : 'vehículos'} en esta selección`;
  $('#grid').innerHTML = list.length
    ? list
        .map(
          (c, i) => /* HTML */ `
            <article class="card" style="--delay:${Math.min(i, 5) * 45}ms">
              <button
                class="card-photo"
                data-car="${c.id}"
                aria-label="Ver ficha de ${c.name} ${c.year}"
              >
                <img
                  src="${c.thumbnail}"
                  alt="${c.name} ${c.year}, ${c.color}"
                  loading="lazy"
                  decoding="async"
                />
                <span class="badge">${c.category}</span>
              </button>
              <div class="card-body">
                <span class="card-year">${c.year} · ${c.color}</span>
                <h3>${c.name}</h3>
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
                  <button class="view-car" data-car="${c.id}" aria-label="Ver ficha de ${c.name}">
                    ↗
                  </button>
                </div>
                <button class="compare-toggle" data-compare="${c.id}" aria-pressed="false">
                  ＋ Comparar
                </button>
                <div class="card-contact-row">
                  <a class="card-wa" href="${wa(c)}" target="_blank" rel="noopener">
                    Me interesa ↗
                  </a>
                  <a class="card-trade-in" href="#auto-a-cuenta">
                    <span aria-hidden="true">↔</span>
                    Tomamos tu auto a cuenta
                  </a>
                </div>
              </div>
            </article>
          `
        )
        .join('')
    : '<p class="empty">El inventario estará disponible próximamente.</p>';
}
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
