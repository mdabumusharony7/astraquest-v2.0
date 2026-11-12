document.addEventListener('DOMContentLoaded', async () => {
  if (window.lucide) window.lucide.createIcons();

  const rockets = [
    {id:'moon-explorer',name:'Lunar Explorer',short:'Explorer-1',mission:'moon',tier:'Starter',image:'assets/moon-rocket-1.png',cargo:1000,maxCargo:1500,stages:2,crew:4,price:0,owned:true,description:'A dependable starter spacecraft for learning the fundamentals of lunar survival.',status:'Owned',upgradeLevel:0},
    {id:'moon-voyager',name:'Lunar Voyager',short:'Voyager-2',mission:'moon',tier:'Advanced',image:'assets/moon-rocket-2.png',cargo:2000,maxCargo:4000,stages:3,crew:4,price:900,owned:false,description:'A stronger lunar craft with improved cargo capacity and a higher upgrade ceiling.',status:'Locked',upgradeLevel:0},
    {id:'moon-pioneer',name:'Lunar Pioneer',short:'Pioneer-3',mission:'moon',tier:'Elite',image:'assets/moon-rocket-3.png',cargo:4000,maxCargo:9000,stages:4,crew:4,price:1600,owned:false,description:'The top-tier lunar spacecraft, built for ambitious missions and extensive cargo upgrades.',status:'Locked',upgradeLevel:0},
    {id:'mars-explorer',name:'Mars Explorer',short:'Mars-1',mission:'mars',tier:'Starter',image:'assets/mars-rocket-1.png',cargo:1000,maxCargo:1500,stages:2,crew:4,price:0,owned:true,description:'A starter interplanetary spacecraft for first steps toward the Red Planet.',status:'Owned',upgradeLevel:0},
    {id:'mars-voyager',name:'Mars Voyager',short:'Mars-2',mission:'mars',tier:'Advanced',image:'assets/mars-rocket-2.png',cargo:2000,maxCargo:4000,stages:3,crew:4,price:1200,owned:false,description:'An advanced Mars transport with a larger cargo allowance and greater upgrade potential.',status:'Locked',upgradeLevel:0},
    {id:'mars-pathfinder',name:'Mars Pathfinder',short:'Pathfinder-3',mission:'mars',tier:'Elite',image:'assets/mars-rocket-3.png',cargo:4000,maxCargo:9000,stages:4,crew:4,price:2200,owned:false,description:'A premium Mars expedition vehicle with the highest planned cargo ceiling in this lineup.',status:'Locked',upgradeLevel:0}
  ];
  let coinBalance = 1200;
  let diamondBalance = 25;
  let activeMission = 'all';
  let activeView = 'owned';
  let selectedId = 'moon-explorer';
  let pendingPurchaseId = null;
  const api = window.AstraquestApi;
  const accountSession = api.isAuthenticated();
  let backendStoreLoaded = false;
  let backendStoreError = '';

  const grid = document.getElementById('rocketGrid');
  const selectionPanel = document.getElementById('selectionPanel');
  const purchaseDialog = document.getElementById('purchaseDialog');
  const money = n => n.toLocaleString('en-US');
  const getSelected = () => rockets.find(r => r.id === selectedId) || rockets[0];

  function renderGrid() {
    let list = rockets.filter(r => activeMission === 'all' || r.mission === activeMission);
    if (activeView === 'owned') list = list.filter(r => r.owned);
    const sort = document.getElementById('sortSelect').value;
    list.sort((a,b) => sort === 'capacity' ? b.cargo-a.cargo : sort === 'price' ? a.price-b.price : a.name.localeCompare(b.name));
    if (!list.length) {
      grid.innerHTML = '<div class="empty-state"><strong>No owned rockets in this category.</strong><span>Switch to Browse Rockets to see available spacecraft.</span></div>';
      return;
    }
    grid.innerHTML = list.map(r => `
      <button class="rocket-card ${r.id===selectedId?'selected':''} ${r.owned?'':'locked'}" data-rocket="${r.id}" aria-pressed="${r.id===selectedId}" aria-label="Select ${r.name}">
        <div class="rocket-image-wrap"><img class="rocket-image" src="${r.image}" alt="${r.name}" loading="lazy"></div>
        <div class="rocket-card-info">
          <div class="rocket-card-top"><h3>${r.short}</h3><span class="card-status ${r.owned?'':'locked-status'}">${r.owned?'✓ Owned':`${money(r.price)} ◈`}</span></div>
          <div class="rocket-class">${r.mission==='moon'?'Moon':'Mars'} · ${r.tier}</div>
          <div class="rocket-card-stats"><span><i data-lucide="layers"></i> Stages: ${r.stages}</span><span><i data-lucide="package"></i> ${money(r.cargo)} units</span></div>
        </div>
      </button>`).join('');
    grid.querySelectorAll('[data-rocket]').forEach(button => button.addEventListener('click', () => selectRocket(button.dataset.rocket)));
    if (window.lucide) window.lucide.createIcons();
  }

  const metricDefinitions = [
    {id:'engine', name:'Engine Power', icon:'rocket', description:'Increases thrust and acceleration.', cost:180},
    {id:'structure', name:'Structural Strength', icon:'shield', description:'Improves durability and resistance.', cost:160},
    {id:'fuel', name:'Fuel Capacity', icon:'battery-full', description:'Increases total fuel for longer missions.', cost:200},
    {id:'guidance', name:'Guidance Accuracy', icon:'crosshair', description:'Improves navigation and landing precision.', cost:175}
  ];
  // Upgrade levels are stored on each rocket object so spacecraft upgrades do not transfer.
  rockets.forEach(r => {
    r.metrics = r.metrics || {engine:3, structure:2, fuel:4, guidance:1};
  });

  function renderUpgrades(r) {
    const panel = document.getElementById('upgradePanel');
    if (!r.owned) { panel.hidden = true; return; }
    panel.hidden = false;
    document.getElementById('upgradeIntro').textContent = `${r.name} · upgrade levels are tracked separately for each rocket.`;
    document.getElementById('upgradeCurrentCargo').innerHTML = `LEVEL ${Math.max(...Object.values(r.metrics))} <small>/ 5</small>`;
    document.getElementById('upgradeMetrics').innerHTML = metricDefinitions.map(metric => {
      const level = r.metrics[metric.id];
      const percent = level / 5 * 100;
      const cost = metric.cost + (level - 1) * 75;
      const maxed = level >= 5;
      return `<article class="metric-row">
        <div class="metric-icon"><i data-lucide="${metric.icon}"></i></div>
        <div class="metric-main">
          <div class="metric-title-line"><h3>${metric.name}</h3><span>Level&nbsp; ${level} / 5</span></div>
          <div class="metric-slider" role="progressbar" aria-label="${metric.name} level" aria-valuemin="0" aria-valuemax="5" aria-valuenow="${level}"><i style="width:${percent}%"></i><b style="left:${percent}%"></b></div>
          <p><i data-lucide="chart-no-axes-column-increasing"></i>${metric.description}</p>
        </div>
        <button class="metric-upgrade-btn" data-metric-upgrade="${metric.id}" ${maxed || coinBalance < cost ? 'disabled' : ''}><i data-lucide="arrow-up"></i><span>${maxed ? 'MAX LEVEL' : 'UPGRADE'}</span></button>
        <span class="metric-cost">${maxed ? 'MAX' : `${money(cost)} ◈`}</span>
      </article>`;
    }).join('');
    document.getElementById('upgradeList').innerHTML = '';
    document.getElementById('upgradeNote').textContent = 'Each rocket has its own upgrade levels. Costs shown here are provisional UI values because the design document does not specify prices for these four system metrics.';
    document.querySelectorAll('[data-metric-upgrade]').forEach(button => button.addEventListener('click', () => {
      const metric = metricDefinitions.find(item => item.id === button.dataset.metricUpgrade);
      if (!metric || !r.owned) return;
      const level = r.metrics[metric.id];
      const cost = metric.cost + (level - 1) * 75;
      if (level >= 5 || coinBalance < cost) {
        document.getElementById('actionMessage').textContent = level >= 5 ? `${metric.name} is already at maximum level.` : `You need ${money(cost - coinBalance)} more coins to upgrade ${metric.name}.`;
        return;
      }
      coinBalance -= cost;
      r.metrics[metric.id] += 1;
      document.getElementById('coinBalance').textContent = money(coinBalance);
      document.getElementById('actionMessage').textContent = `${r.name}: ${metric.name} upgraded to Level ${r.metrics[metric.id]}.`;
      renderUpgrades(r);
      if (window.lucide) window.lucide.createIcons();
    }));
    if (window.lucide) window.lucide.createIcons();
  }

  function selectRocket(id) {
    selectedId = id;
    const r = getSelected();
    document.getElementById('selectedImage').src = r.image;
    document.getElementById('selectedImage').alt = r.name;
    document.getElementById('selectedMission').textContent = `${r.mission.toUpperCase()} CLASS`;
    document.getElementById('selectedStatus').textContent = r.owned ? 'OWNED' : `LOCKED · ${money(r.price)} COINS`;
    document.getElementById('selectedName').textContent = r.name;
    document.getElementById('selectedDescription').textContent = r.description;
    document.getElementById('selectedCargo').innerHTML = `${money(r.cargo)} <small>units</small>`;
    document.getElementById('selectedStages').innerHTML = `${r.stages} <small>stages</small>`;
    document.getElementById('selectedMaxCargo').innerHTML = `${money(r.maxCargo)} <small>units</small>`;
    document.getElementById('selectedCrew').innerHTML = `${r.crew} <small>members</small>`;
    document.getElementById('actionMessage').textContent = '';
    renderUpgrades(r);
    const primary = document.getElementById('primaryAction');
    primary.disabled = false;
    if (r.owned) {
      primary.innerHTML = '<i data-lucide="check-circle"></i><span>Equip Rocket</span>';
      primary.dataset.action = 'equip';
    } else {
      primary.innerHTML = `<i data-lucide="lock-keyhole"></i><span>Unlock · ${money(r.price)} coins</span>`;
      primary.dataset.action = 'purchase';
    }
    renderGrid();
    if (window.lucide) window.lucide.createIcons();
  }

  document.querySelectorAll('[data-view]').forEach(button => button.addEventListener('click', () => {
    activeView = button.dataset.view;
    document.querySelectorAll('[data-view]').forEach(b => b.classList.toggle('active', b === button));
    if (activeView === 'browse' && !rockets.some(r => r.id === selectedId && (activeMission==='all'||r.mission===activeMission))) selectedId = rockets.find(r => activeMission==='all'||r.mission===activeMission)?.id || rockets[0].id;
    if (activeView === 'owned' && !rockets.find(r => r.id === selectedId)?.owned) selectedId = rockets.find(r => r.owned && (activeMission==='all'||r.mission===activeMission))?.id || 'moon-explorer';
    renderGrid(); selectRocket(selectedId);
  }));

  document.querySelectorAll('[data-mission]').forEach(button => button.addEventListener('click', () => {
    activeMission = button.dataset.mission;
    document.querySelectorAll('[data-mission]').forEach(b => b.classList.toggle('active', b === button));
    const visible = rockets.filter(r => (activeMission==='all'||r.mission===activeMission) && (activeView==='browse'||r.owned));
    if (!visible.some(r => r.id===selectedId)) selectedId = visible[0]?.id || rockets.find(r=>activeMission==='all'||r.mission===activeMission)?.id || rockets[0].id;
    renderGrid(); selectRocket(selectedId);
  }));
  document.getElementById('sortSelect').addEventListener('change', renderGrid);

  document.getElementById('primaryAction').addEventListener('click', () => {
    const r = getSelected();
    if (r.owned) {
      document.getElementById('actionMessage').textContent = `${r.name} selected for your ${r.mission==='moon'?'Moon':'Mars'} mission. Final mission validation happens before launch.`;
      return;
    }
    if (coinBalance < r.price) {
      document.getElementById('actionMessage').textContent = `Not enough coins. You need ${money(r.price-coinBalance)} more coins to unlock this rocket.`;
      return;
    }
    pendingPurchaseId = r.id;
    document.getElementById('dialogTitle').textContent = `Unlock ${r.name}?`;
    document.getElementById('dialogDescription').textContent = 'This rocket will be added to your hangar. Its upgrades belong to this rocket and do not transfer to other spacecraft.';
    document.getElementById('dialogPrice').textContent = `${money(r.price)} ◈`;
    document.getElementById('confirmPurchase').textContent = 'Confirm unlock';
    purchaseDialog.showModal();
  });

  document.getElementById('confirmPurchase').addEventListener('click', async event => {
    event.preventDefault();
    const r = rockets.find(item => item.id === pendingPurchaseId);
    if (!r || r.owned) { purchaseDialog.close(); return; }
    if (accountSession && !backendStoreLoaded) {
      document.getElementById('actionMessage').textContent = backendStoreError || 'Your store inventory could not be loaded. Reload and try again.';
      return;
    }
    if (coinBalance < r.price) { purchaseDialog.close(); document.getElementById('actionMessage').textContent = 'Your coin balance is too low.'; return; }
    if (accountSession) {
      try {
        const result = await api.request('/api/store/purchases/', {
          method: 'POST',
          body: { item_code: r.id }
        });
        coinBalance = result.coins;
      } catch (error) {
        document.getElementById('actionMessage').textContent = error.message || 'The purchase could not be completed.';
        return;
      }
    } else {
      coinBalance -= r.price;
    }
    r.owned = true;
    r.status = 'Owned';
    document.getElementById('coinBalance').textContent = money(coinBalance);
    purchaseDialog.close();
    activeView = 'owned';
    document.querySelectorAll('[data-view]').forEach(b => b.classList.toggle('active', b.dataset.view === 'owned'));
    selectRocket(r.id);
    document.getElementById('actionMessage').textContent = accountSession
      ? `${r.name} unlocked and saved to your account.`
      : `${r.name} unlocked for this page session. Sign in to save store purchases.`;
  });
  document.getElementById('upgradeAction').addEventListener('click', () => {
    const r = getSelected();
    if (!r.owned) { document.getElementById('actionMessage').textContent = 'Unlock this rocket before accessing its rocket-specific upgrades.'; return; }
    renderUpgrades(r);
    document.getElementById('upgradePanel').scrollIntoView({behavior:'smooth',block:'start'});
  });

  // The documentation gives Explorer/Voyager/Pioneer capacity examples and upgrade costs;
  // the rocket unlock prices above are provisional UI values pending confirmation.
  if (accountSession) {
    try {
      const inventory = await api.request('/api/store/inventory/');
      coinBalance = inventory.profile.coins;
      const ownedCodes = new Set(inventory.items.map(purchase => purchase.item.code));
      rockets.forEach(rocket => {
        if (ownedCodes.has(rocket.id)) rocket.owned = true;
      });
      backendStoreLoaded = true;
    } catch (error) {
      backendStoreError = error.message || 'The store inventory could not be loaded.';
    }
  }
  document.getElementById('diamondBalance').textContent = money(diamondBalance);
  document.getElementById('coinBalance').textContent = money(coinBalance);
  renderGrid();
  selectRocket(selectedId);
  if (backendStoreError) document.getElementById('actionMessage').textContent = backendStoreError;
});
