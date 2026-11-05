// Datos pendientes. Mantener vacíos hasta recibir información confirmada.
const CONTACTO = Object.freeze({whatsapp:'', instagram:'', facebook:'', tiktok:'', direccion:'', mapa:'', biografia:'', foto:''});
function contactoURL(c) { if (!CONTACTO.whatsapp) return '#contacto'; return 'https://wa.me/'+CONTACTO.whatsapp+'?text='+encodeURIComponent('Hola Gerardo, me interesa '+c.name+' '+c.year); }
