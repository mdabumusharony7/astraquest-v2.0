(() => {
  const $ = (selector) => document.querySelector(selector);
  const state = { crew: 4, days: 14, units: 1000, objective: 'Survive' };
  const crewOutput = $('#crewCount');
  const unitsInput = $('#totalUnits');
  const summary = $('#prepSummary');
  const message = $('#formMessage');

  function updateSummary() {
    summary.innerHTML = `<i data-lucide="info"></i> ${state.crew} crew · ${state.days} days · ${state.units.toLocaleString()} cargo units`;
    if (window.lucide) window.lucide.createIcons();
  }
  function setObjective(value) {
    state.objective = value;
    document.querySelectorAll('[data-objective]').forEach(button => {
      const selected = button.dataset.objective === value;
      button.classList.toggle('selected', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
    document.querySelectorAll('[data-card-objective]').forEach(card => {
      const selected = card.dataset.cardObjective === value;
      card.classList.toggle('active', selected);
      card.setAttribute('aria-pressed', String(selected));
    });
  }
  $('#crewMinus').addEventListener('click', () => { state.crew = Math.max(4, state.crew - 1); crewOutput.value = state.crew; crewOutput.textContent = state.crew; updateSummary(); });
  $('#crewPlus').addEventListener('click', () => { state.crew = Math.min(6, state.crew + 1); crewOutput.value = state.crew; crewOutput.textContent = state.crew; updateSummary(); });
  document.querySelectorAll('[data-days]').forEach(button => button.addEventListener('click', () => {
    state.days = Number(button.dataset.days);
    document.querySelectorAll('[data-days]').forEach(item => { const selected = item === button; item.classList.toggle('selected', selected); item.setAttribute('aria-pressed', String(selected)); });
    updateSummary();
  }));
  unitsInput.addEventListener('input', () => {
    const value = Number(unitsInput.value);
    state.units = Number.isFinite(value) ? value : 0;
    message.textContent = '';
    updateSummary();
  });
  document.querySelectorAll('[data-objective]').forEach(button => button.addEventListener('click', () => setObjective(button.dataset.objective)));
  document.querySelectorAll('[data-card-objective]').forEach(card => card.addEventListener('click', () => setObjective(card.dataset.cardObjective)));
  $('#continueMission').addEventListener('click', async () => {
    const units = Number(unitsInput.value);
    if (!Number.isInteger(units) || units < 1000 || units > 1500) {
      message.textContent = 'Enter total cargo units from 1,000 to 1,500.';
      unitsInput.focus();
      return;
    }
    state.units = units;
    const config = { mission: 'Moon', crewSize: state.crew, durationDays: state.days, totalUnits: state.units, objective: state.objective };
    try { sessionStorage.setItem('astraquestMissionConfig', JSON.stringify(config)); localStorage.setItem('astraquestMissionConfig', JSON.stringify(config)); localStorage.setItem('astraquestMissionDurationDays', String(state.days)); } catch (_) {}
    const missionId = Number(localStorage.getItem('astraquestMissionId'));
    if (window.AstraquestApi.isAuthenticated() && missionId > 0) {
      try {
        await window.AstraquestApi.request(`/api/missions/${missionId}/`, {
          method: 'PATCH',
          body: {
            duration_days: state.days,
            crew_size: state.crew,
            config
          }
        });
      } catch (error) {
        message.textContent = `Mission settings could not be saved: ${error.message}`;
        return;
      }
    }
    const next = new URL('crew-selection.html', window.location.href);
    next.searchParams.set('mission', 'Moon');
    next.searchParams.set('crew', String(state.crew));
    next.searchParams.set('days', String(state.days));
    next.searchParams.set('units', String(state.units));
    next.searchParams.set('objective', state.objective);
    window.location.href = next.toString();
  });
  updateSummary();
  setObjective(state.objective);
})();
