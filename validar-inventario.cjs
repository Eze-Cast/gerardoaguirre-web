const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const ctx = vm.createContext({});
for (const name of ['inventario.js', 'fichas-tecnicas.js'])
  vm.runInContext(fs.readFileSync(path.join(__dirname, name), 'utf8'), ctx);
const cars = vm.runInContext('INVENTARIO', ctx),
  specs = vm.runInContext('FICHAS_TECNICAS', ctx);
const errors = [],
  pending = [];
const ids = new Set();
const models = new Set();
const fields = [
  'engine',
  'power',
  'torque',
  'gearbox',
  'drive',
  'fuel',
  'passengers',
  'trunk',
  'tank',
  'dimensions',
  'source',
  'safety',
  'equipment',
];
for (const c of cars) {
  if (ids.has(c.id)) errors.push(`ID repetido: ${c.id}`);
  ids.add(c.id);
  for (const field of [
    'name',
    'brand',
    'model',
    'year',
    'color',
    'price',
    'transmission',
    'category',
  ])
    if (c[field] === undefined || c[field] === null || c[field] === '')
      errors.push(`${c.name}: falta ${field}`);
  const modelKey = (c.brand + '|' + c.model).toLocaleLowerCase('es');
  models.add(modelKey);
  if (c.km === null) pending.push(`${c.name}: kilometraje`);
  if (!(c.price > 0 && (c.km === null || c.km >= 0))) errors.push(`${c.name}: precio/km inválidos`);
  if (
    !Array.isArray(c.photos) ||
    c.photos.length > 1 ||
    Boolean(c.thumbnail) !== Boolean(c.photos?.length)
  )
    errors.push(`${c.name}: imagen y miniatura deben corresponder a la misma unidad`);
  if (!c.thumbnail) pending.push(`${c.name}: fotografía pendiente`);
  for (const p of [...(c.photos || []), ...(c.thumbnail ? [c.thumbnail] : [])])
    if (!p || !fs.existsSync(path.join(__dirname, p))) errors.push(`${c.name}: foto ausente ${p}`);
  const t = specs[c.specId];
  if (!t) {
    if (c.specId) errors.push(`${c.name}: falta la ficha técnica indicada`);
    else pending.push(`${c.name}: ficha del fabricante por confirmar`);
    continue;
  }
  for (const f of fields)
    if (!t[f] || (Array.isArray(t[f]) && !t[f].length))
      errors.push(`${c.name}: falta campo técnico ${f}`);
  for (const [f, v] of Object.entries(t))
    if (typeof v === 'string' && /por confirmar/i.test(v)) pending.push(`${c.name}: ${f}`);
  if (t.note) pending.push(`${c.name}: revisar nota de configuración`);
  if (!/^https:\/\//.test(t.source)) errors.push(`${c.name}: fuente técnica inválida`);
}
console.log(
  `${models.size} modelos · ${cars.length} unidades · ${cars.filter((c) => c.photos.length).length} unidades con foto · ${cars.filter((c) => specs[c.specId]).length} unidades con ficha técnica de referencia`
);
if (errors.length) {
  console.error(errors.join('\n'));
  process.exitCode = 1;
} else console.log('Estructura y archivos correctos.');
if (pending.length)
  console.log(
    `${pending.length} campos/notas necesitan verificación de la unidad. Ejecuta --pendientes para verlos.`
  );
if (process.argv.includes('--pendientes')) console.log(pending.join('\n'));
if (process.argv.includes('--estricto') && pending.length) process.exitCode = 1;
