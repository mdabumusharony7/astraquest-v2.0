(() => {
  const rows = [...document.querySelectorAll('.resource-row')];
  const totalEl = document.getElementById('currentTotal');
  const message = document.getElementById('allocationMessage');
  const save = document.getElementById('saveResources');
  const budget = 1000;
  const initial = { food: 250, shielding: 250, lifeSupport: 300, power: 200 };

  function values() {
    return Object.fromEntries(rows.map(row => [row.dataset.resource, Number(row.querySelector('.resource-number').value) || 0]));
  }
  function total() { return Object.values(values()).reduce((sum, value) => sum + value, 0); }
  function update(row, source) {
    const slider = row.querySelector('.resource-slider');
    const number = row.querySelector('.resource-number');
    let value = Math.round((Number(source.value) || 0) / 25) * 25;
    value = Math.max(0, Math.min(budget, value));
    slider.value = number.value = value;
    const percent = value / budget * 100;
    slider.style.setProperty('--fill', `${percent}%`);
    refresh();
  }
  function refresh() {
    const sum = total();
    totalEl.textContent = `${sum} / ${budget}`;
    const valid = sum === budget;
    save.disabled = !valid;
    rows.forEach(row => row.classList.remove('invalid'));
    if (valid) {
      message.innerHTML = 'Total allocation must equal <strong>1000 units</strong> to continue.';
    } else {
      message.textContent = sum < budget ? `Allocate ${budget - sum} more units to continue.` : `Reduce allocation by ${sum - budget} units to continue.`;
    }
  }
  rows.forEach(row => {
    const slider = row.querySelector('.resource-slider');
    const number = row.querySelector('.resource-number');
    slider.addEventListener('input', () => update(row, slider));
    number.addEventListener('change', () => update(row, number));
    number.addEventListener('input', () => { if (number.value !== '') update(row, number); });
    update(row, number);
  });
  document.getElementById('resetResources').addEventListener('click', () => {
    rows.forEach(row => { const input = row.querySelector('.resource-number'); input.value = initial[row.dataset.resource]; update(row, input); });
  });
  save.addEventListener('click', async () => {
    if (total() !== budget) return;
    const allocation = values();
    try { localStorage.setItem('astraquestResourceAllocation', JSON.stringify(allocation)); } catch (e) { /* Keep the page usable without storage. */ }
    message.textContent = 'Allocation saved. Continuing to the mission launch preparation…';
    const missionId = Number(localStorage.getItem('astraquestMissionId'));
    if (window.AstraquestApi.isAuthenticated() && missionId > 0) {
      save.disabled = true;
      try {
        const config = JSON.parse(localStorage.getItem('astraquestMissionConfig') || '{}');
        await window.AstraquestApi.request(`/api/missions/${missionId}/`, {
          method: 'PATCH',
          body: {
            resources: allocation,
            selected_rocket: localStorage.getItem('astraquestSelectedRocket') || '',
            config,
          },
        });
      } catch (error) {
        message.textContent = `Resources could not be saved: ${error.message}`;
        save.disabled = false;
        return;
      }
    }
    window.location.href = 'launch-sequence.html';
  });
  refresh();
})();
