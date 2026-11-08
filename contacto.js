// Datos pendientes. Mantener vacíos hasta recibir información confirmada.
const CONTACTO = Object.freeze({whatsapp:'', instagram:'', facebook:'', tiktok:'', direccion:"Blvd. Adolfo López Mateos 2004, Col. Peñitas, C.P. 37180, León, Guanajuato", mapa:"https://maps.google.com/maps?q=Blvd.%20Adolfo%20L%C3%B3pez%20Mateos%202004%2C%20Col.%20Pe%C3%B1itas%2C%20C.P.%2037180%2C%20Le%C3%B3n%2C%20Guanajuato&z=16&output=embed", biografia:'', foto:''});
function contactoURL(c) {
  if (!CONTACTO.whatsapp) return '#contacto';
  const message = `Hola Gerardo, me interesa el ${c.name} ${c.year}, color ${c.color}, ${mileage(c)}, con precio de lista de ${money(c.price)}. ¿Sigue disponible?`;
  return 'https://wa.me/' + CONTACTO.whatsapp + '?text=' + encodeURIComponent(message);
}
