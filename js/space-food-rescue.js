(() => {
  const $ = id => document.getElementById(id);
  const read = (key, fallback = null) => {
    try { return localStorage.getItem(key) ?? fallback; } catch (_) { return fallback; }
  };
  const write = (key, value) => { try { localStorage.setItem(key, String(value)); } catch (_) {} };
  const destination = /mars/i.test(read('astraquestSelectedMission', read('astraquestMission', 'Moon'))) ? 'Mars' : 'Moon';
  let allocation = { food: 250, shielding: 250, lifeSupport: 300, power: 200 };
  try { allocation = { ...allocation, ...JSON.parse(read('astraquestResourceAllocation', '{}')) }; } catch (_) {}
  const savedFood = Number(read('astraquestFoodUnits', allocation.food));
  $('destinationTitle').textContent = `${destination.toUpperCase()} MISSION`;
  $('rocketName').textContent = read('astraquestRocketName', 'Pioneer-1');
  let crew = [];
  try { crew = JSON.parse(sessionStorage.getItem('astraquestSelectedCrew') || read('astraquestSelectedCrew', '[]')); } catch (_) {}
  if (!Array.isArray(crew) || !crew.length) crew = [{ name: 'Crew member 1', role: 'Commander' }, { name: 'Crew member 2', role: 'Engineer' }, { name: 'Crew member 3', role: 'Scientist' }, { name: 'Crew member 4', role: 'Medical officer' }];
  $('crewCount').textContent = `${crew.length} Members`;
  $('foodStock').textContent = `${Number.isFinite(savedFood) ? savedFood : 250} units`;
  const missionState = (() => { try { return JSON.parse(read('astraquestMissionState', '{}')); } catch (_) { return {}; } })();
  $('crisisMissionDay').textContent = read('astraquestActiveCrisisDay', missionState.day || 2);
  $('foodCrewList').innerHTML = crew.slice(0, 4).map((person, i) => `<article class="crew-member"><div class="crew-avatar crew-portrait portrait-${(i % 4) + 1}" role="img" aria-label="Crew portrait"></div><div class="crew-info"><strong>${String(person.name || `Crew member ${i + 1}`).replace(/[&<>"']/g, '')}</strong><small>${String(person.role || 'Mission specialist').replace(/[&<>"']/g, '')}</small><div class="mini-bars">Health <i><em style="width:${[92,85,88,96][i]}%"></em></i></div></div></article>`).join('');
  $('foodCrewNote').textContent = 'Crew status stable';
  const resourceSet = [{ key: 'food', label: 'Food', icon: 'utensils', color: '#ffd51d' }, { key: 'shielding', label: 'Radiation Shielding', icon: 'radiation', color: '#00efad' }, { key: 'lifeSupport', label: 'Life Support', icon: 'heart-pulse', color: '#08d5ff' }, { key: 'power', label: 'Power', icon: 'zap', color: '#d54aff' }];
  const renderShellResources = () => {
    const values = { ...allocation, food: Number(read('astraquestFoodUnits', allocation.food)) };
    $('foodResourceTotal').textContent = resourceSet.reduce((sum, item) => sum + (Number(values[item.key]) || 0), 0);
    $('foodResourceGrid').innerHTML = resourceSet.map(item => { const value = Math.max(0, Number(values[item.key]) || 0); return `<article class="resource-card" style="--resource:${item.color}"><div class="resource-card-title"><i data-lucide="${item.icon}"></i><strong>${item.label}</strong></div><strong class="resource-amount">${value}<small> units</small></strong><div class="resource-meter"><span style="width:${Math.min(100,value/3)}%"></span></div></article>`; }).join('');
  };
  renderShellResources();
  $('caughtTop').textContent = '0'; $('timerTop').textContent = '00:20';

  const questions = [
    { q: 'Why do crews need a balanced variety of foods?', options: ['Different foods provide different nutrients', 'Every food contains the same nutrients', 'Variety makes food weigh nothing'], answer: 0, why: 'A varied diet helps provide the nutrients the body needs.' },
    { q: 'Why are crumbs a problem inside a spacecraft?', options: ['They can float into equipment or vents', 'They make the spacecraft heavier than Earth', 'They stop plants from growing outside'], answer: 0, why: 'Loose crumbs can float in microgravity and enter equipment or air vents.' },
    { q: 'What helps keep packaged space food safe to eat?', options: ['Careful preparation and sealed packaging', 'Leaving it open to the cabin air', 'Storing every food in sunlight'], answer: 0, why: 'Food is prepared and packaged to help preserve it and keep it safe.' },
    { q: 'Why might a spacecraft crew grow some plants?', options: ['Plants can provide fresh food and support research', 'Plants replace every life-support system', 'Plants produce food instantly without care'], answer: 0, why: 'Growing plants can add fresh food and help scientists study life-support systems.' },
    { q: 'What is a useful way to reduce food waste on a mission?', options: ['Plan meals and track supplies', 'Open every package at the start', 'Use more food than the crew needs'], answer: 0, why: 'Planning and tracking supplies helps the crew use food carefully.' }
  ];
  let stage = 'intro';
  let playVisualStage = '';
  let caught = 0;
  let packetIndex = 0;
  let basketX = 50;
  let quizIndex = 0;
  let quizScore = 0;
  let chosen = false;
  let timerId = null;
  let packetTimers = [];
  let startAt = 0;
  let remaining = 20;

  function icons() { if (window.lucide) window.lucide.createIcons(); }
  function setGameHeader(step, title, visual = '') {
    $('gameStepLabel').textContent = step; $('gameTitle').textContent = title;
    document.querySelector('.food-game').classList.remove('final-countdown', 'final-moments', 'game-complete');
    if (visual) document.querySelector('.food-game').classList.add(visual);
    if (step.includes('FINAL COUNTDOWN')) document.querySelector('.food-game').classList.add('final-countdown');
    if (step.includes('FINAL MOMENTS')) document.querySelector('.food-game').classList.add('final-moments');
    if (step.includes('COMPLETE')) document.querySelector('.food-game').classList.add('game-complete');
  }
  function showIntro() {
    stage = 'intro';
    playVisualStage = '';
    setGameHeader('STEP 0 · MINI-GAME INSTRUCTIONS', 'FOOD SUPPLY');
    $('gameContent').innerHTML = `<div class="food-instructions">
      <div class="instruction-scene"><div class="instruction-alert"><i data-lucide="package-open"></i><span>FOOD SUPPLY EMERGENCY</span></div><div class="instruction-copy"><h3>Rescue the floating meal packets</h3><p>Ten sealed meals have drifted loose inside the habitat. Move the catch basket to collect them before they escape.</p><div class="instruction-stats"><span><b>10</b> packets</span><span><b>20</b> seconds</span><span><b>8+</b> target catch</span></div></div></div>
      <div class="instruction-side"><h3>HOW TO PLAY</h3><ol><li>Move the basket under each incoming packet.</li><li>Catch as many as possible before the timer ends.</li><li>Catch at least 8 packets for a strong score.</li></ol><div class="controls-note"><span>Arrow keys / A–D</span><span>Drag or tap the scene</span></div><p class="science-note"><i data-lucide="info"></i> Game values are simulated; this is not a NASA food-handling procedure.</p></div>
      <div class="instruction-footer"><span>CRISIS OBJECTIVE <b>Recover 8 of 10 meal packs</b></span><button class="food-button" id="beginGame" type="button">Start Game <i data-lucide="arrow-right"></i></button></div>
    </div>`;
    $('beginGame').addEventListener('click', startGame);
    icons();
  }

  function startGame() {
    stage = 'play'; caught = 0; packetIndex = 0; basketX = 50; remaining = 20;
    playVisualStage = 'play';
    setGameHeader('STEP 1 · GAMEPLAY IN PROGRESS', 'FOOD SUPPLY');
    startAt = Date.now(); packetTimers.forEach(clearTimeout); packetTimers = [];
    $('gameContent').innerHTML = `<div class="play-hud"><div class="hud-pill"><i data-lucide="timer"></i><span>TIME LEFT</span><strong id="timeLeft">20</strong><span>sec</span></div><div class="hud-pill"><i data-lucide="package-check"></i><span>FOOD SAVED</span><strong id="caughtCount">0</strong><span>/ 10</span></div><div class="hud-pill"><i data-lucide="target"></i><span>TARGET</span><strong>8</strong><span>packs</span></div></div>
      <div class="food-arena" id="arena" role="application" aria-label="Food rescue arena. Use left and right arrow keys, A and D, or drag to move the basket."><div class="arena-topline"><span>MEAL PACKETS INBOUND</span><span id="packetsLeft">10 packets</span></div><div class="lane-flash"></div><div class="basket" id="basket" aria-label="Rescue bowl"><img src="assets/food-rescue-bowl.png" alt="ASTRAQUEST transparent rescue bowl"></div></div>
      <p class="play-hint">Move the basket under each packet · Arrow keys, A / D, or touch controls</p>`;
    icons();
    const arena = $('arena');
    const moveTo = clientX => {
      const rect = arena.getBoundingClientRect();
      basketX = Math.max(7, Math.min(93, ((clientX - rect.left) / rect.width) * 100));
      $('basket').style.left = `${basketX}%`;
    };
    arena.addEventListener('pointerdown', event => { arena.setPointerCapture?.(event.pointerId); moveTo(event.clientX); });
    arena.addEventListener('pointermove', event => { if (event.buttons || event.pointerType === 'touch') moveTo(event.clientX); });
    window.addEventListener('keydown', onKeyMove);
    for (let i = 0; i < 10; i++) packetTimers.push(setTimeout(() => spawnPacket(i), i * 1900));
    timerId = setInterval(() => {
      if (stage !== 'play') return;
      remaining = Math.max(0, 20 - Math.floor((Date.now() - startAt) / 1000));
      $('timeLeft').textContent = remaining;
      $('timerTop').textContent = `00:${String(remaining).padStart(2,'0')}`;
      if (remaining <= 2 && playVisualStage !== 'final-moments') { playVisualStage = 'final-moments'; setGameHeader('STEP 1 · FINAL MOMENTS', 'FINAL MOMENTS'); }
      else if (remaining <= 5 && playVisualStage === 'play') { playVisualStage = 'final-countdown'; setGameHeader('STEP 1 · FINAL COUNTDOWN', 'FINAL COUNTDOWN'); }
      if (remaining <= 0) finishMiniGame();
    }, 100);
  }

  function onKeyMove(event) {
    if (stage !== 'play') return;
    const key = event.key.toLowerCase();
    if (['arrowleft', 'arrowright', 'a', 'd'].includes(key)) event.preventDefault();
    if (key === 'arrowleft' || key === 'a') basketX = Math.max(7, basketX - 7);
    if (key === 'arrowright' || key === 'd') basketX = Math.min(93, basketX + 7);
    const basket = $('basket'); if (basket) basket.style.left = `${basketX}%`;
  }

  function spawnPacket(index) {
    if (stage !== 'play') return;
    const lanes = [16, 78, 42, 90, 27, 62, 10, 52, 84, 34];
    const x = lanes[index];
    const arena = $('arena');
    if (!arena) return;
    const packet = document.createElement('span');
    const meals = [
      ['food-packet-chicken.png', 'Chicken meal'],
      ['food-packet-vegetable.png', 'Vegetable mix'],
      ['food-packet-rice.png', 'Rice meal'],
      ['food-packet-fruit.png', 'Fruit mix'],
      ['food-packet-pasta.png', 'Pasta meal']
    ];
    const [image, meal] = meals[index % meals.length];
    packet.className = `packet packet-${index % meals.length}`;
    packet.innerHTML = `<img src="assets/${image}" alt="${meal}" draggable="false">`;
    packet.setAttribute('aria-label', `${meal} packet ${index + 1}`);
    packet.style.left = `${x}%`;
    arena.append(packet);
    // Force the initial offscreen position to paint before starting the fall transition.
    void packet.offsetHeight;
    requestAnimationFrame(() => requestAnimationFrame(() => packet.classList.add('drop')));
    packetIndex++;
    $('packetsLeft').textContent = `${10 - packetIndex} packets left`;
    packetTimers.push(setTimeout(() => {
      if (stage !== 'play') return;
      if (Math.abs(basketX - x) <= 15) { caught++; packet.classList.add('caught'); $('caughtCount').textContent = caught; $('caughtTop').textContent = caught; }
      else packet.remove();
    }, 2120));
  }

  function miniGameMarks(n) {
    if (n === 10) return 5;
    if (n >= 8) return 4;
    if (n === 7) return 3;
    if (n === 6) return 2;
    if (n >= 4) return 1;
    return 0;
  }

  function finishMiniGame() {
    if (stage !== 'play') return;
    stage = 'mini-complete'; clearInterval(timerId); packetTimers.forEach(clearTimeout); packetTimers = [];
    window.removeEventListener('keydown', onKeyMove);
    showMiniGameComplete();
  }

  function showMiniGameComplete() {
    setGameHeader('STEP 1 · MINI-GAME COMPLETE', 'GAME COMPLETE');
    const marks = miniGameMarks(caught);
    $('gameContent').innerHTML = `<div class="mini-complete"><div class="complete-icon"><i data-lucide="badge-check"></i></div><p class="brief-kicker">FOOD RESCUE · ROUND COMPLETE</p><h3>${caught >= 8 ? 'SUPPLIES SECURED' : 'RESCUE ROUND COMPLETE'}</h3><p>You caught <b>${caught} of 10</b> meal packets.</p><div class="mini-score-grid"><div><span>Packets caught</span><strong>${caught} / 10</strong></div><div><span>Mini-game score</span><strong>${marks} / 5</strong></div><div><span>Next</span><strong>Science quiz</strong></div></div><div class="instruction-footer"><span>Continue to the 5-question science check.</span><button class="food-button" id="continueToQuiz" type="button">Start Quiz <i data-lucide="arrow-right"></i></button></div></div>`;
    $('continueToQuiz').addEventListener('click', () => { quizIndex = 0; quizScore = 0; renderQuiz(); });
    icons();
  }

  function renderQuiz() {
    stage = 'quiz'; chosen = false;
    setGameHeader(`STEP 2 · SCIENCE QUIZ · ${quizIndex + 1} / 5`, 'FOOD SUPPLY QUIZ');
    const q = questions[quizIndex]; let seconds = 15;
    $('gameContent').innerHTML = `<div class="quiz-wrap"><div class="quiz-progress"><span>SCIENCE CHECK · QUESTION ${quizIndex + 1} OF 5</span><span>Time: <b id="quizTimer">15</b>s</span></div><h2>${q.q}</h2><div class="quiz-options">${q.options.map((option, i) => `<button class="quiz-option" data-answer="${i}" type="button"><span class="letter">${String.fromCharCode(65 + i)}</span><span>${option}</span></button>`).join('')}</div><p class="quiz-feedback" id="quizFeedback" role="status" aria-live="polite">Choose the best answer.</p><div class="quiz-next"><button class="food-button" id="nextQuestion" type="button" disabled>${quizIndex === 4 ? 'See Results' : 'Next Question'} <i data-lucide="arrow-right"></i></button></div></div>`;
    const tick = setInterval(() => {
      if (stage !== 'quiz' || chosen) { clearInterval(tick); return; }
      seconds--; const el = $('quizTimer'); if (el) el.textContent = seconds;
      if (seconds <= 0) { clearInterval(tick); selectAnswer(null); }
    }, 1000);
    document.querySelectorAll('[data-answer]').forEach(button => button.addEventListener('click', () => selectAnswer(Number(button.dataset.answer))));
    $('nextQuestion').addEventListener('click', () => {
      if (!chosen) return;
      if (quizIndex < questions.length - 1) { quizIndex++; renderQuiz(); }
      else showResult();
    });
    icons();
    function selectAnswer(index) {
      if (chosen || stage !== 'quiz') return;
      chosen = true; clearInterval(tick);
      const correct = index === q.answer;
      if (correct) quizScore++;
      document.querySelectorAll('[data-answer]').forEach((button, i) => {
        button.disabled = true;
        if (i === q.answer) button.classList.add('correct');
        else if (i === index) button.classList.add('incorrect');
      });
      $('quizFeedback').textContent = `${index === null ? 'Time is up. ' : correct ? 'Correct! ' : 'Not quite. '}${q.why}`;
      $('nextQuestion').disabled = false;
      icons();
    }
  }

  function showResult() {
    stage = 'result';
    setGameHeader('CRISIS COMPLETE', 'FOOD SUPPLY RESULTS');
    const mini = miniGameMarks(caught);
    const total = mini + quizScore;
    const resolved = total >= 6;
    const cap = Math.max(0, Number(read('astraquestFoodStorageCap', 300)) || 300);
    let stock = Number(read('astraquestFoodUnits', allocation.food));
    if (!Number.isFinite(stock)) stock = 0;
    let effect = 'No change to Food supplies.';
    if (total <= 5) {
      stock = Math.max(0, Math.round(stock * 0.75));
      effect = `Failed crisis: Food stock reduced by 25% to ${stock} units.`;
    } else if (total >= 7) {
      const percent = (total - 6) * 5;
      const before = stock;
      stock = Math.min(cap, stock + Math.round(cap * percent / 100));
      effect = `Food supplies increased by ${percent}% of storage capacity (${stock - before} units).`;
    }
    write('astraquestFoodUnits', stock);
    try {
      const current = JSON.parse(read('astraquestResourceAllocation', '{}'));
      current.food = stock;
      localStorage.setItem('astraquestResourceAllocation', JSON.stringify(current));
    } catch (_) {}
    $('foodStock').textContent = `${stock} units`;
    renderShellResources();
    write('astraquestLastCrisis', 'Space Food Rescue');
    write('astraquestLastCrisisScore', total);
    write('astraquestLastCrisisOutcome', resolved ? (total === 10 ? 'Perfect' : 'Resolved') : 'Failed');
    write('astraquestLastCrisisResourceEffect', effect);
    write('astraquestFoodRescueMiniGameScore', mini);
    write('astraquestFoodRescueQuizScore', quizScore);
    if (resolved) write('astraquestCrisesCompleted', Number(read('astraquestCrisesCompleted', '0')) + 1);
    const missionFailed = stock <= 0;
    const title = missionFailed ? 'FOOD SUPPLIES DEPLETED' : resolved ? 'FOOD SUPPLIES SECURED' : 'CRISIS NOT RESOLVED';
    $('gameContent').innerHTML = `<div class="result-wrap ${resolved ? '' : 'failed'}"><div class="result-symbol">${missionFailed ? '🆘' : resolved ? '🥫' : '⚠️'}</div><p class="brief-kicker">CRISIS COMPLETE</p><h2>${title}</h2><p>${missionFailed ? 'Food has reached zero. The mission can no longer continue.' : resolved ? 'Your crew secured the food packets and completed the science check.' : 'The combined score was below 6. The mission continues if all required resources remain above zero.'}</p><div class="score-cards"><div class="score-card"><span>Packets caught</span><strong>${caught} / 10</strong></div><div class="score-card"><span>Mini-game marks</span><strong>${mini} / 5</strong></div><div class="score-card"><span>Science quiz</span><strong>${quizScore} / 5</strong></div></div><div class="resource-effect">Combined crisis score: <b>${total} / 10</b><br>${effect}<br>Food remaining: <b>${stock} / ${cap}</b> units</div><div class="result-actions"><button class="food-button" id="returnDashboard" type="button">${missionFailed ? 'View Mission Results' : 'Return to Dashboard'} <i data-lucide="arrow-right"></i></button></div></div>`;
    $('returnDashboard').addEventListener('click', () => { location.href = 'moon-dashboard.html?crisisComplete=1'; });
    icons();
  }

  $('exitGame').addEventListener('click', () => {
    if (stage === 'play' || stage === 'quiz') {
      if (!confirm('Leave this crisis? Your current attempt will be lost.')) return;
    }
    location.href = 'moon-dashboard.html';
  });
  icons();
  showIntro();
})();
