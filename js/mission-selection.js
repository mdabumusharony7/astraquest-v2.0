const menuToggle = document.getElementById('mobileMenu');
const missionNav = document.getElementById('mainNav');
if (menuToggle && missionNav) {
  menuToggle.addEventListener('click', () => {
    const open = missionNav.classList.toggle('open');
    menuToggle.setAttribute('aria-expanded', String(open));
  });
}
const toast = document.getElementById('missionToast');
function showMissionToast(message) {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  window.setTimeout(() => toast.classList.remove('show'), 2200);
}
document.querySelectorAll('.select-mission').forEach((button) => {
  button.addEventListener('click', () => {
    const mission = button.dataset.mission;
    try { localStorage.setItem('astraquestSelectedMission', mission); } catch (error) { /* Continue without persistence if storage is unavailable. */ }
    button.disabled = true;
    button.innerHTML = '<i data-lucide="check-circle"></i> MISSION SELECTED';
    if (window.lucide) window.lucide.createIcons();
    showMissionToast(`${mission} mission selected. Preparing your mission…`);
    const nextPage = mission === 'Moon' ? 'moon-preparation.html' : 'rocket-hangar.html?mission=Mars';
    window.setTimeout(() => { window.location.href = nextPage; }, 450);
  });
});
document.querySelectorAll('[data-placeholder="true"]').forEach((link) => {
  link.addEventListener('click', (event) => { event.preventDefault(); showMissionToast('This section is coming soon.'); });
});
if (window.lucide) window.lucide.createIcons();
