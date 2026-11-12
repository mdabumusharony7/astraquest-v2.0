(() => {
  const cards = [...document.querySelectorAll('.crew-card')];
  const count = document.getElementById('selectedCount');
  const names = document.getElementById('selectedNames');
  const confirm = document.getElementById('confirmButton');
  const note = document.getElementById('crewNote');
  const selected = new Set();
  const crewNames = new Map(cards.map(card => [card.dataset.id, card.querySelector('strong').textContent]));

  function render() {
    count.textContent = selected.size;
    names.textContent = selected.size ? [...selected].map(id => crewNames.get(id)).join(', ') : 'No members selected';
    confirm.disabled = selected.size !== 4;
    note.textContent = selected.size < 4 ? `Select ${4 - selected.size} more crew member${4 - selected.size === 1 ? '' : 's'} to continue.` : selected.size === 4 ? 'Crew complete. Confirm to continue to rocket selection.' : 'Select exactly four crew members.';
    cards.forEach(card => {
      const active = selected.has(card.dataset.id);
      card.setAttribute('aria-pressed', String(active));
      card.disabled = !active && selected.size >= 4;
    });
  }

  cards.forEach(card => card.addEventListener('click', () => {
    const id = card.dataset.id;
    if (selected.has(id)) selected.delete(id);
    else if (selected.size < 4) selected.add(id);
    render();
  }));

  document.getElementById('backButton').addEventListener('click', () => {
    window.location.href = 'moon-preparation.html';
  });

  confirm.addEventListener('click', () => {
    if (selected.size !== 4) return;
    const manifest = cards.filter(card => selected.has(card.dataset.id)).map(card => ({
      id: card.dataset.id,
      name: card.querySelector('strong').textContent,
      role: card.querySelector('small').textContent
    }));
    try { sessionStorage.setItem('astraquestSelectedCrew', JSON.stringify(manifest)); } catch (_) {}
    window.location.href = 'choose-rocket.html';
  });
  render();
  if (window.lucide) window.lucide.createIcons();
})();
