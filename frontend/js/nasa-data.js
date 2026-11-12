const mobileMenu = document.getElementById('mobileMenu');
const mainNav = document.getElementById('mainNav');
if (mobileMenu && mainNav) {
  mobileMenu.addEventListener('click', () => {
    const isOpen = !mainNav.classList.contains('open');
    mainNav.classList.toggle('open', isOpen);
    mobileMenu.setAttribute('aria-expanded', String(isOpen));
  });
  mainNav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      mainNav.classList.remove('open');
      mobileMenu.setAttribute('aria-expanded', 'false');
    });
  });
}
const year = document.getElementById('year');
if (year) year.textContent = new Date().getFullYear();
if (window.lucide) window.lucide.createIcons();
