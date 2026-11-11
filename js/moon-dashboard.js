(() => {
  const $ = id => document.getElementById(id);
  const DAY_MS = 30_000;
  const RESOURCE_KEYS = ['food', 'shielding', 'lifeSupport', 'power'];
  const RESOURCE_LABELS = { food: 'Food', shielding: 'Radiation Shielding', lifeSupport: 'Life Support', power: 'Power' };
  const read = (key, fallback = null, session = false) => {
    try { return (session ? sessionStorage : localStorage).getItem(key) ?? fallback; } catch (_) { return fallback; }
  };
  const write = (key, value) => { try { localStorage.setItem(key, String(value)); } catch (_) {} };
  const saveState = () => { try { localStorage.setItem('astraquestMissionState', JSON.stringify(state)); } catch (_) {} };
  const escapeHtml = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  let crew = [];
  try { crew = JSON.parse(read('astraquestSelectedCrew', null, true) || read('astraquestSelectedCrew', '[]') || '[]'); } catch (_) {}
  if (!Array.isArray(crew)) crew = [];
  const fallback = [{ name: 'Crew member 1', role: 'Mission specialist' }, { name: 'Crew member 2', role: 'Engineer' }, { name: 'Crew member 3', role: 'Scientist' }, { name: 'Crew member 4', role: 'Medical officer' }];
  const displayCrew = crew.length ? crew : fallback;
  $('crewCount').textContent = `${displayCrew.length} Members`;
  $('crewList').innerHTML = displayCrew.map((person, i) => {
    const name = person.name || 'Crew member'; const role = person.role || 'Crew specialist';
    return `<article class="crew-member"><div class="crew-avatar crew-portrait portrait-${(i % 4) + 1}" role="img" aria-label="Crew portrait for ${escapeHtml(name)}"></div><div class="crew-info"><strong>${escapeHtml(name)}</strong><small>${escapeHtml(role)}</small><div class="mini-bars">Health <i><em style="width:${[92, 85, 88, 96][i % 4]}%"></em></i></div><div class="mini-bars">Morale <i><em style="width:${[82, 90, 78, 88][i % 4]}%"></em></i></div></div></article>`;
  }).join('');
  $('crewNote').textContent = crew.length ? 'Showing the crew selected for this mission.' : 'No saved crew selection was found; sample crew slots are shown until you complete crew selection.';
  $('rocketName').textContent = read('astraquestRocketName', 'Pioneer-1');

  const destination = /mars/i.test(read('astraquestSelectedMission', read('astraquestMission', 'Moon'))) ? 'Mars' : 'Moon';
  $('destination').textContent = destination;
  $('dashboardMissionTitle').innerHTML = `${destination.toUpperCase()} MISSION <span>DASHBOARD</span>`;
  document.querySelector('.dashboard-title p').textContent = `Manage your resources, keep your crew healthy, and survive the challenges on ${destination}.`;
  const overviewMoon = $('overviewMoon'); if (overviewMoon) { overviewMoon.src = destination === 'Mars' ? 'assets/mars.png' : 'assets/moon.png'; overviewMoon.alt = destination; }
  const phaseImage = document.querySelector('.phase-card img'); if (phaseImage) { phaseImage.src = overviewMoon?.src || 'assets/moon.png'; phaseImage.alt = destination; }
  const missionHero = document.querySelector('.dashboard-page .hero-image'); if (missionHero) missionHero.setAttribute('aria-label', `${destination} mission base with astronaut and habitat`);

  let allocation = { food: 250, shielding: 250, lifeSupport: 300, power: 200 };
  try { allocation = { ...allocation, ...JSON.parse(read('astraquestResourceAllocation', '{}')) }; } catch (_) {}
  const resources = [
    { key: 'food', icon: 'utensils', color: '#ffd51d' },
    { key: 'shielding', icon: 'radiation', color: '#00efad' },
    { key: 'lifeSupport', icon: 'heart-pulse', color: '#08d5ff' },
    { key: 'power', icon: 'zap', color: '#d54aff' }
  ];

  const countByDuration = { '7': 3, '14': 5, '21': 7, '30': 8, '60': 12, '90': 16 };
  const crisisCatalog = [
    { type: 'food', name: 'Space Food Rescue', target: 'Food', page: 'space-food-rescue.html', icon: 'utensils', image: 'assets/moon-food-production.png', imageAlt: 'Space food growing inside a lunar habitat', description: 'Meal packets are drifting through the habitat. Catch the supplies and answer the science check.' },
    { type: 'oxygen', name: 'Oxygen Pipe Repair', target: 'Life Support', page: 'oxygen-pipe-repair.html', icon: 'wind', image: 'assets/oxygen-pipe-puzzle-bg.png', imageAlt: 'Life-support oxygen pipes inside the habitat', description: 'A life-support pipe is leaking. Repair the oxygen route and stabilize the system.' }
  ];

  function readMissionConfig() {
    for (const raw of [read('astraquestMissionConfig', null, true), read('astraquestMissionConfig')]) {
      if (!raw) continue;
      try { const config = JSON.parse(raw); if (config && Number(config.durationDays) > 0) return config; } catch (_) {}
    }
    return null;
  }
  function chooseDuration(config) {
    const configured = Number(config?.durationDays || read('astraquestMissionDurationDays'));
    const allowed = destination === 'Mars' ? [30, 60, 90] : [7, 14, 21];
    return allowed.includes(configured) ? configured : (destination === 'Mars' ? 30 : 7);
  }
  function makeSchedule(duration) {
    const count = countByDuration[String(duration)] || Math.max(1, Math.round(duration * (destination === 'Mars' ? 0.18 : 0.35)));
    const possibleDays = Array.from({ length: Math.max(0, duration - 1) }, (_, i) => i + 2);
    for (let i = possibleDays.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1)); [possibleDays[i], possibleDays[j]] = [possibleDays[j], possibleDays[i]];
    }
    // Open the mission with its first scheduled crisis so the alert is immediately visible.
    const days = [1, ...possibleDays.slice(0, Math.max(0, count - 1))].sort((a, b) => a - b);
    let previous = '';
    return days.map((day, index) => {
      const choices = crisisCatalog.filter(item => item.type !== previous);
      const item = choices[Math.floor(Math.random() * choices.length)];
      previous = item.type;
      return { id: index + 1, day, type: item.type, completed: false };
    });
  }
  function newMissionState(duration) {
    const schedule = makeSchedule(duration);
    return { version: 1, destination, durationDays: duration, day: 1, remainingMs: DAY_MS, paused: true, activeCrisisId: schedule[0]?.id ?? null, failed: false, completed: false, schedule };
  }
  function loadMissionState() {
    try { const value = JSON.parse(read('astraquestMissionState', 'null')); if (value && value.destination === destination && Array.isArray(value.schedule)) return value; } catch (_) {}
    return null;
  }
  let state = loadMissionState();
  const params = new URLSearchParams(location.search);
  const freshLanding = read('astraquestMissionLanded') === 'true' || params.get('newMission') === '1';
  const resetMission = freshLanding || !state;
  if (resetMission) {
    state = newMissionState(chooseDuration(readMissionConfig()));
    write('astraquestMissionLanded', 'false');
    write('astraquestFoodUnits', Number(allocation.food) || 0);
    write('astraquestOxygenUnits', Number(allocation.lifeSupport) || 0);
    write('astraquestCrisesCompleted', '0');
    saveState();
    if (params.has('newMission')) history.replaceState(null, '', location.pathname);
  }
  if (!Number.isFinite(Number(state.remainingMs)) || Number(state.remainingMs) <= 0 || Number(state.remainingMs) > DAY_MS) state.remainingMs = DAY_MS;
  if (state.paused && (!state.activeCrisisId || !state.schedule.some(item => item.id === state.activeCrisisId && !item.completed))) state.paused = false;

  function getCrisis(id) { return state.schedule.find(item => item.id === id); }
  function getCrisisDetails(item) { return crisisCatalog.find(def => def.type === item?.type) || crisisCatalog[0]; }
  function getAllocation() {
    try { allocation = { ...allocation, ...JSON.parse(read('astraquestResourceAllocation', '{}')) }; } catch (_) {}
    const savedFood = Number(read('astraquestFoodUnits', allocation.food));
    if (Number.isFinite(savedFood)) allocation.food = savedFood;
    return allocation;
  }
  function renderResources() {
    const values = getAllocation();
    const total = resources.reduce((sum, r) => sum + (Number(values[r.key]) || 0), 0);
    $('resourceTotal').textContent = total;
    $('resourceGrid').innerHTML = resources.map(r => {
      const value = Math.max(0, Number(values[r.key]) || 0);
      return `<article class="resource-card" style="--resource:${r.color}"><div class="resource-card-title"><i data-lucide="${r.icon}"></i><strong>${RESOURCE_LABELS[r.key]}</strong></div><strong class="resource-amount">${value}<small> units</small></strong><div class="resource-meter"><span style="width:${Math.min(100, value / 3)}%"></span></div><span class="resource-foot">Available · −25 per day</span></article>`;
    }).join('');
    if (window.lucide) window.lucide.createIcons();
  }
  function updateEventMonitor() {
    const active = state.activeCrisisId ? getCrisis(state.activeCrisisId) : null;
    const next = state.schedule.find(item => !item.completed && item.day >= state.day);
    const name = $('eventName'), summary = $('eventSummary'), countdown = $('eventCountdown');
    const image = $('eventImage');
    if (active) {
      const crisis = getCrisisDetails(active); name.textContent = crisis.name; summary.textContent = crisis.description; image.src = crisis.image; image.alt = crisis.imageAlt;
      countdown.textContent = `Automatic alert active · Day ${active.day}. Respond to continue the mission.`;
    } else if (next) {
      const crisis = getCrisisDetails(next); name.textContent = crisis.name; summary.textContent = crisis.description; image.src = crisis.image; image.alt = crisis.imageAlt;
      const daysAway = next.day - state.day;
      countdown.textContent = daysAway === 0 ? 'This day’s crisis is about to begin.' : `Next automatic alert in ${daysAway} mission day${daysAway === 1 ? '' : 's'} · Day ${next.day}.`;
    } else if (state.completed) {
      name.textContent = 'Mission complete'; summary.textContent = 'Your crew survived the full mission.'; countdown.textContent = 'All scheduled crises resolved.';
    } else if (state.failed) {
      name.textContent = 'Mission ended'; summary.textContent = 'A required resource reached zero.'; countdown.textContent = 'Mission resources depleted.';
    } else {
      name.textContent = 'Systems nominal'; summary.textContent = 'No further crises are scheduled. Keep your crew and supplies safe.'; countdown.textContent = 'Monitoring mission systems…';
    }
  }
  function renderClock() {
    const left = Math.max(0, Math.min(DAY_MS, state.remainingMs));
    $('missionDay').textContent = `${state.day} / ${state.durationDays}`;
    $('dayCountdown').textContent = state.paused ? 'Clock paused during crisis' : `Next day in 00:${String(Math.ceil(left / 1000)).padStart(2, '0')}`;
    $('dayProgressBar').style.width = `${((DAY_MS - left) / DAY_MS) * 100}%`;
    document.body.classList.toggle('mission-clock-paused', state.paused);
    updateEventMonitor();
  }
  function showCrisisAlert(item) {
    if (!item || item.completed) return;
    const details = getCrisisDetails(item);
    $('crisisDay').textContent = item.day;
    $('crisisTitle').textContent = details.name.toUpperCase();
    $('crisisDescription').textContent = details.description;
    $('crisisTarget').textContent = details.target;
    const icon = $('crisisModal').querySelector('.crisis-alert-icon');
    icon.innerHTML = `<i data-lucide="${details.icon}"></i>`;
    $('crisisModal').classList.add('open'); $('crisisModal').setAttribute('aria-hidden', 'false');
    $('respondCrisis').focus();
    if (window.lucide) window.lucide.createIcons();
  }

  function recordResourceValues(values) {
    try { localStorage.setItem('astraquestResourceAllocation', JSON.stringify(values)); } catch (_) {}
    write('astraquestFoodUnits', Number(values.food) || 0);
    write('astraquestOxygenUnits', Number(values.lifeSupport) || 0);
  }
  function finishMission(outcome) {
    state.paused = true;
    state.completed = outcome === 'success'; state.failed = outcome === 'failed';
    write('astraquestMissionOutcome', outcome); saveState();
    location.href = `mission-results.html?outcome=${outcome}`;
  }
  function processDayEnd() {
    const values = getAllocation();
    for (const key of RESOURCE_KEYS) values[key] = Math.max(0, (Number(values[key]) || 0) - 25);
    recordResourceValues(values); renderResources();
    const depleted = RESOURCE_KEYS.find(key => Number(values[key]) <= 0);
    if (depleted) { finishMission('failed'); return; }
    if (state.day >= state.durationDays) { finishMission('success'); return; }
    state.day++;
    state.remainingMs += DAY_MS;
    const todaysCrisis = state.schedule.find(item => !item.completed && item.day === state.day);
    if (todaysCrisis) {
      state.activeCrisisId = todaysCrisis.id; state.paused = true;
      $('crisisModal').dataset.active = 'true';
      saveState(); renderClock(); showCrisisAlert(todaysCrisis); return;
    }
    saveState(); renderClock();
  }

  function completeActiveCrisis() {
    const item = state.activeCrisisId ? getCrisis(state.activeCrisisId) : null;
    if (item) item.completed = true;
    state.activeCrisisId = null; state.paused = false; state.remainingMs = Math.min(DAY_MS, Math.max(0, Number(state.remainingMs) || DAY_MS));
    $('crisisModal').classList.remove('open'); $('crisisModal').setAttribute('aria-hidden', 'true');
    $('crisisModal').dataset.active = 'false';
    const values = getAllocation();
    const depleted = RESOURCE_KEYS.find(key => Number(values[key]) <= 0);
    saveState(); renderResources(); renderClock();
    if (depleted) finishMission('failed');
  }

  function handleReturnFromCrisis() {
    const params = new URLSearchParams(location.search);
    if (params.get('crisisComplete') !== '1') return;
    completeActiveCrisis();
    history.replaceState(null, '', location.pathname);
  }
  handleReturnFromCrisis();
  if (state.failed) { finishMission('failed'); return; }
  if (state.completed) { finishMission('success'); return; }

  $('respondCrisis').addEventListener('click', () => {
    const item = state.activeCrisisId ? getCrisis(state.activeCrisisId) : null;
    if (!item) return;
    const crisis = getCrisisDetails(item);
    write('astraquestActiveCrisisType', item.type); write('astraquestActiveCrisisDay', item.day);
    saveState(); location.href = `${crisis.page}?scheduled=1`;
  });

  $('viewCrew').addEventListener('click', () => {
    $('manifestList').innerHTML = displayCrew.map(person => `<div class="manifest-member"><strong>${escapeHtml(person.name || 'Crew member')}</strong><span>${escapeHtml(person.role || 'Crew specialist')}</span></div>`).join('');
    $('crewModal').classList.add('open'); $('crewModal').setAttribute('aria-hidden', 'false');
  });
  const closeCrew = () => { $('crewModal').classList.remove('open'); $('crewModal').setAttribute('aria-hidden', 'true'); };
  $('closeCrew').addEventListener('click', closeCrew); $('crewModal').addEventListener('click', event => { if (event.target === $('crewModal')) closeCrew(); });
  document.querySelectorAll('[data-action]').forEach(button => button.addEventListener('click', () => {
    const action = button.dataset.action;
    if (action === 'crew') $('viewCrew').click();
    else if (action === 'resources') location.href = 'allocate-resources.html';
    else if (action === 'log') location.href = 'mission-results.html';
    else alert('Research module is coming in a future mission update.');
  }));

  let lastTickAt = Date.now();
  let lastSavedAt = lastTickAt;
  function tick() {
    const now = Date.now();
    if (document.hidden || state.paused) {
      lastTickAt = now; renderClock(); return;
    }
    state.remainingMs -= now - lastTickAt; lastTickAt = now;
    while (state.remainingMs <= 0 && !state.paused && !state.failed && !state.completed) processDayEnd();
    renderClock();
    if (now - lastSavedAt >= 1000) { saveState(); lastSavedAt = now; }
  }
  document.addEventListener('visibilitychange', () => { lastTickAt = Date.now(); saveState(); });
  window.addEventListener('pagehide', () => { tick(); saveState(); });
  renderResources(); renderClock();
  if (state.activeCrisisId) { state.paused = true; saveState(); showCrisisAlert(getCrisis(state.activeCrisisId)); }
  setInterval(tick, 200);
  if (window.lucide) window.lucide.createIcons();
})();
