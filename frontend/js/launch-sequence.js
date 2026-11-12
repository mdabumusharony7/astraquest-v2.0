(() => {
  const get = key => { try { return localStorage.getItem(key); } catch (_) { return null; } };
  const setText = (id, value) => { const el = document.getElementById(id); if (el && value) el.textContent = value; };
  setText('rocketName', get('astraquestRocketName') || 'Pioneer-1');
  const crew = get('astraquestSelectedCrew');
  if (crew) {
    try { const parsed = JSON.parse(crew); const count = Array.isArray(parsed) ? parsed.length : Number(parsed.count); if (count) setText('crewCount', `${count} Members`); } catch (_) {}
  }
  const allocationRaw = get('astraquestResourceAllocation');
  if (allocationRaw) {
    try { const values = Object.values(JSON.parse(allocationRaw)).map(Number); const total = values.reduce((sum, value) => sum + value, 0); setText('resourceCount', `${total} / 1000`); } catch (_) {}
  }
  const button = document.getElementById('startSequence');
  if (button) button.addEventListener('click', () => {
    try { localStorage.setItem('astraquestLaunchSequenceStarted', 'true'); } catch (_) {}
    window.location.href = 'wiring-challenge.html';
  });
})();
