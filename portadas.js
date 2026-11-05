// Un solo coche por carga. El ciclo barajado recorre los diez antes de repetir.
const PORTADAS = [
  { id: 9, name: 'CUPRA León VZ 300 gris Taiga', scene: 'circuit', base: 'leon' },
  { id: 13, name: 'Mazda MX-5 gris', scene: 'circuit', base: 'mx5' },
  { id: 11, name: 'BMW M135 xDrive negro', scene: 'circuit', base: 'bmw' },
  { id: 8, name: 'CUPRA Terramar VZ negro', scene: 'circuit', base: 'terramar' },
  { id: 7, name: 'CUPRA Formentor PHEV gris', scene: 'circuit', base: 'formentor' },
  { id: 12, name: 'BYD Sealion 7 negro', scene: 'road', base: 'byd' },
  { id: 18, name: 'Audi Q5 Sportback blanco', scene: 'road', base: 'audi' },
  { id: 36, name: 'Jeep Wrangler Unlimited Sahara plata', scene: 'offroad', base: 'wrangler' },
  { id: 4, name: 'Volkswagen Taos verde', scene: 'offroad', base: 'taos' },
  { id: 5, name: 'Volkswagen Tera azul', scene: 'road', base: 'tera' },
];
function elegirPortada(active, saved = {}, random = Math.random) {
  const signature = active.map((p) => p.id).join(',');
  let remaining =
    saved.signature === signature && Array.isArray(saved.remaining)
      ? [...new Set(saved.remaining)].filter((id) => active.some((p) => p.id === id))
      : [];
  if (!remaining.length) {
    remaining = active.map((p) => p.id);
    for (let i = remaining.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [remaining[i], remaining[j]] = [remaining[j], remaining[i]];
    }
    if (remaining.length > 1 && remaining.at(-1) === saved.previous) {
      [remaining[0], remaining[remaining.length - 1]] = [remaining.at(-1), remaining[0]];
    }
  }
  const id = remaining.pop();
  return { chosen: active.find((p) => p.id === id), state: { signature, remaining, previous: id } };
}
(function () {
  const active = PORTADAS.filter((p) => INVENTARIO.some((c) => c.id === p.id));
  const image = document.querySelector('.editorial-car');
  if (!image || !active.length) return;
  let saved = {};
  try {
    saved = JSON.parse(sessionStorage.getItem('ga-hero-cycle-v2') || '{}') || {};
  } catch {}
  const { chosen, state } = elegirPortada(active, saved);
  try {
    sessionStorage.setItem('ga-hero-cycle-v2', JSON.stringify(state));
  } catch {}
  const stage = document.querySelector('.editorial-car-stage');
  stage.dataset.scene = chosen.scene;
  // La sombra sigue la base común de las llantas en todos los tamaños de pantalla.
  const alignGround = () => {
    stage.style.setProperty(
      '--car-ground-y',
      `${image.offsetTop + image.clientHeight * (929 / 1080)}px`
    );
  };
  image.addEventListener('load', alignGround);
  addEventListener('resize', alignGround, { passive: true });
  requestAnimationFrame(alignGround);

  image.addEventListener('load', () => image.classList.add('ready'), { once: true });
  image.addEventListener(
    'error',
    () => {
      image.removeAttribute('srcset');
      image.src = INVENTARIO.find((c) => c.id === chosen.id).photos[0];
      image.classList.add('ready');
    },
    { once: true }
  );
  image.alt = chosen.name + ' · seminuevo';
  image.sizes = '(max-width:650px) 96vw, 57vw';
  const base = 'assets/portadas/seleccion/' + chosen.base;
  image.srcset = base + '-mobile.webp 960w, ' + base + '.webp 1920w, ' + base + '-4k.webp 3840w';
  image.src = base + '.webp';
  const scene = document.createElement('img');
  scene.className = 'hero-scene';
  scene.alt = '';
  scene.setAttribute('aria-hidden', 'true');
  scene.decoding = 'async';
  scene.sizes = '(max-width:650px) 100vw, 65vw';
  const sceneBase = 'assets/escenarios/' + chosen.scene;
  scene.srcset =
    sceneBase + '-mobile.webp 960w, ' + sceneBase + '.webp 1920w, ' + sceneBase + '-4k.webp 3840w';
  scene.src = sceneBase + '.webp';
  stage.prepend(scene);
  if (image.complete && image.naturalWidth) image.classList.add('ready');
})();
