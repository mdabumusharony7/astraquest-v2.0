
/* Shared navigation behavior for every ASTRAQUEST page. */
(() => {
  const toggle = document.getElementById('mobileMenu');
  const nav = document.getElementById('mainNav');
  if (toggle && nav && !toggle.dataset.sharedBound) {
    toggle.dataset.sharedBound = 'true';
    toggle.addEventListener('click', () => {
      const open = !nav.classList.contains('open');
      nav.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', String(open));
    });
    nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
      nav.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    }));
  }
  if (window.lucide) window.lucide.createIcons();
})();
