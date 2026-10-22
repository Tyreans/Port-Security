// Registro del service worker (archivo externo para no necesitar 'unsafe-inline' en la CSP).
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {
      // Sin service worker (p. ej. abierto como file://) el sitio sigue funcionando en línea.
    });
  });
}
