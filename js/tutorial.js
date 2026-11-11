const menuButton = document.getElementById('mobileMenu');
const mainNav = document.getElementById('mainNav');
if (menuButton && mainNav) {
  menuButton.addEventListener('click', () => {
    const isOpen = mainNav.classList.toggle('open');
    menuButton.setAttribute('aria-expanded', String(isOpen));
  });
}
const beginButton = document.getElementById('beginTutorial');
if (beginButton) {
  beginButton.addEventListener('click', () => {
    const firstStep = document.querySelector('.step-card');
    firstStep?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    if (firstStep) {
      firstStep.classList.add('tutorial-highlight');
      firstStep.style.borderColor = '#31d4ff';
      firstStep.style.boxShadow = '0 0 0 2px #1599ff55, 0 0 28px #1599ff35';
      window.setTimeout(() => {
        firstStep.style.borderColor = '';
        firstStep.style.boxShadow = '';
      }, 1800);
    }
  });
}
if (window.lucide) window.lucide.createIcons();
