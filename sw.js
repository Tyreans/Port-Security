// Service worker: deja el sitio disponible sin conexión después de la primera visita.
// Las páginas usan network-first (para que los cambios se vean cuando haya red) y
// el resto de recursos cache-first. Si cambias archivos, sube VERSION para limpiar la caché.
const VERSION = 'ps-v1';
const FONT_CSS = 'https://fonts.googleapis.com/css2?family=Inter:wght@300..800&family=JetBrains+Mono:wght@400;600&display=swap';

const PAGES = [
  './',
  'index.html',
  'modulo-1-fundamentos.html',
  'modulo-2-aprendizaje.html',
  'modulo-3-violaciones.html',
  'modulo-4-buenas-practicas.html',
];
const IMAGES = [
  'icon.svg', 'hero-switch-rack.svg', 'card-m1.svg', 'card-m2.svg', 'card-m3.svg', 'card-m4.svg',
  'm1-defensa-profundidad.svg', 'm1-trama-ethernet.svg', 'm1-tabla-cam-aprendizaje.svg',
  'm1-mac-flooding-macof.svg', 'm1-switch-modo-hub.svg', 'm1-rogue-devices.svg', 'm1-mac-spoofing.svg',
  'm2-metodos-aprendizaje.svg', 'm2-memoria-ram-nvram.svg', 'm2-telefonia-ip-maximum2.svg',
  'm2-aging-absolute-vs-inactivity.svg',
  'm3-flujo-violacion.svg', 'm3-modos-violacion.svg', 'm3-led-err-disabled.svg', 'm3-recuperacion-manual-vs-auto.svg',
  'm4-arquitectura-capa2.svg', 'm4-vlan-blackhole.svg', 'm4-vlan-hopping-dtp.svg',
  'm4-dhcp-snooping-trusted.svg', 'm4-dai-arp.svg',
].map((f) => 'assets/img/' + f);
const ASSETS = [...PAGES, 'assets/css/styles.css', 'assets/js/sw-register.js', 'manifest.webmanifest', ...IMAGES];

// Descarga la hoja de Google Fonts y los .woff2 que referencia, para que la
// tipografía también funcione sin conexión desde la primera visita.
async function cacheFonts(cache) {
  const res = await fetch(FONT_CSS);
  if (!res.ok) return;
  await cache.put(FONT_CSS, res.clone());
  const css = await res.text();
  const urls = [...css.matchAll(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/g)].map((m) => m[1]);
  await cache.addAll(urls);
}

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(VERSION);
    await cache.addAll(ASSETS);
    // Sin red durante la instalación: el sitio funciona con las fuentes del sistema.
    await cacheFonts(cache).catch(() => {});
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  // Páginas: primero red, si falla, caché.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(VERSION).then((c) => c.put(request, copy));
          return res;
        })
        .catch(() => caches.match(request).then((hit) => hit || caches.match('index.html')))
    );
    return;
  }

  // Recursos (CSS, SVG, fuentes): primero caché, si no está, red y se guarda.
  event.respondWith(
    caches.match(request).then((hit) => hit || fetch(request).then((res) => {
      if (res.ok || res.type === 'opaque') {
        const copy = res.clone();
        caches.open(VERSION).then((c) => c.put(request, copy));
      }
      return res;
    }))
  );
});
