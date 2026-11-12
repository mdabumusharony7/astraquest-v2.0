(() => {
  const cards = [...document.querySelectorAll('.choice-card')];
  const message = document.getElementById('choiceMessage');
  const startButton = document.getElementById('startMission');
  const data = {
    pioneer: { name: 'Pioneer-1', owned: true },
    explorer: { name: 'Explorer-X', owned: false },
    atlas: { name: 'Atlas Vanguard', owned: false }
  };
  let selected = 'pioneer';

  function choose(id) {
    selected = id;
    cards.forEach(card => {
      const active = card.dataset.rocket === id;
      card.classList.toggle('selected', active);
      card.setAttribute('aria-pressed', String(active));
    });
    const rocket = data[id];
    message.textContent = rocket.owned
      ? `${rocket.name} selected. Ready to start your mission.`
      : `${rocket.name} selected, but it is locked. Choose an owned rocket to begin.`;
    if (window.lucide) window.lucide.createIcons();
  }

  cards.forEach(card => {
    card.setAttribute('aria-pressed', String(card.dataset.rocket === selected));
    card.addEventListener('click', () => choose(card.dataset.rocket));
  });

  startButton.addEventListener('click', () => {
    const rocket = data[selected];
    if (!rocket.owned) {
      message.textContent = `${rocket.name} is locked. Select an owned rocket or unlock this rocket first.`;
      return;
    }
    try {
      localStorage.setItem('astraquestSelectedRocket', selected);
      localStorage.setItem('astraquestRocketName', rocket.name);
    } catch (error) { /* Continue if storage is unavailable. */ }
    window.location.href = 'allocate-resources.html';
  });

  choose(selected);
})();
