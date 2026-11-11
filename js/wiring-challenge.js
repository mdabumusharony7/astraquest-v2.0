(() => {
  const $ = id => document.getElementById(id);
  const read = key => { try { return localStorage.getItem(key); } catch (_) { return null; } };
  const systems = [
    {id:'engine',label:'ENGINE CONTROL',icon:'settings',color:'#ff343b',desc:'Controls rocket engines and thrust.'},
    {id:'navigation',label:'NAVIGATION',icon:'navigation',color:'#00baff',desc:'Handles guidance and trajectory.'},
    {id:'power',label:'POWER SYSTEM',icon:'zap',color:'#ffd21b',desc:'Supplies electrical power to all systems.'},
    {id:'life',label:'LIFE SUPPORT',icon:'heart-pulse',color:'#00f0a0',desc:'Provides oxygen, water and environmental control.'},
    {id:'comms',label:'COMMUNICATION',icon:'radio-tower',color:'#dc52ff',desc:'Maintains communication with Earth.'}
  ];
  let stage = 2, connections = {}, selected = null, pointerWire = null, timer = 90, timerId = null, checked = false, hintUsed = false;
  const stageScreens = {2:'instructionsScreen',3:'connectScreen',4:'reviewScreen',5:'activationScreen'};
  const setText = (id, value) => { const e=$(id); if(e)e.textContent=value; };
  const refreshIcons = () => { if(window.lucide) window.lucide.createIcons(); };
  const getCrewCount = () => { const raw=read('astraquestSelectedCrew'); if(!raw)return 4; try{const v=JSON.parse(raw);return Array.isArray(v)?v.length:Number(v.count)||4;}catch(_){return 4;} };
  setText('railRocket', read('astraquestRocketName') || 'Pioneer-1'); setText('railCrew', `${getCrewCount()} Members`);
  try { const raw=read('astraquestResourceAllocation'); if(raw){const vals=Object.values(JSON.parse(raw)).map(Number);setText('railUnits',`${vals.reduce((a,b)=>a+b,0)} / 1000`);} } catch(_){}
  function showStage(next){
    stage=next; Object.values(stageScreens).forEach(id=>{const el=$(id);if(el)el.hidden=true;});
    const screen=$(stageScreens[next]); if(screen)screen.hidden=false;
    setText('stepText',`STEP ${next} OF 6`);
    document.querySelectorAll('.wire-dots i').forEach((dot,i)=>{dot.classList.toggle('done',i<next-1);dot.classList.toggle('current',i===next-1);});
    if(next===3) startTimer(); else stopTimer();
    if(next===4) buildReview(); if(next===5) buildActivation();
    refreshIcons(); drawWires();
  }
  function startTimer(){stopTimer();timer=90;updateTimer();timerId=setInterval(()=>{timer--;updateTimer();if(timer<=0){stopTimer();setText('wireFeedback','Time expired. Reset the challenge to try again.');$('checkButton').disabled=true;}},1000);}
  function stopTimer(){if(timerId){clearInterval(timerId);timerId=null;}}
  function updateTimer(){const m=String(Math.floor(timer/60)).padStart(2,'0'),s=String(timer%60).padStart(2,'0');setText('timeLeft',`${m}:${s}`);const bar=$('timeBar');if(bar)bar.style.width=`${Math.max(0,timer/90*100)}%`;if(timer<20&&$('timeLeft'))$('timeLeft').style.color='#ff6478';}
  function makeRows(){
    $('sourceRows').innerHTML='';$('targetRows').innerHTML='';
    systems.forEach(sys=>{
      const source=document.createElement('div');source.className='wire-row source';source.dataset.id=sys.id;source.style.setProperty('--wire',sys.color);source.innerHTML=`<i data-lucide="${sys.icon}"></i><b>${sys.label}</b><span class="wire-socket" role="button" tabindex="0" aria-label="Start ${sys.label} wire"></span>`;
      const target=document.createElement('div');target.className='wire-row target';target.dataset.id=sys.id;target.style.setProperty('--wire',sys.color);target.innerHTML=`<span class="wire-socket" role="button" tabindex="0" aria-label="Connect to ${sys.label}"></span><b>${sys.label}</b><i data-lucide="${sys.icon}"></i>`;
      source.addEventListener('pointerdown',e=>beginWire(e,sys.id));source.addEventListener('click',()=>{document.querySelectorAll('.source.selected').forEach(n=>n.classList.remove('selected'));selected=sys.id;source.classList.add('selected');setText('wireFeedback',`Now select the matching ${sys.label} socket on the right.`);});
      source.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();selected=sys.id;setText('wireFeedback',`Now select the matching ${sys.label} socket on the right.`);}});
      target.addEventListener('pointerup',e=>finishWire(e,sys.id));target.addEventListener('click',()=>{if(selected){connect(selected,sys.id);selected=null;document.querySelectorAll('.source.selected').forEach(n=>n.classList.remove('selected'));}});
      target.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&selected){e.preventDefault();connect(selected,sys.id);selected=null;}});
      $('sourceRows').appendChild(source);$('targetRows').appendChild(target);
    }); refreshIcons();
  }
  function beginWire(e,id){if(stage!==3||timer<=0)return;if(e.button!==0)return;selected=id;pointerWire={id,x:e.clientX,y:e.clientY};document.querySelectorAll('.source.selected').forEach(n=>n.classList.remove('selected'));document.querySelector(`.source[data-id="${id}"]`)?.classList.add('selected');setText('wireFeedback',`Connecting ${systems.find(s=>s.id===id).label}… release on a system socket.`);drawWires(e.clientX,e.clientY);}
  function finishWire(e,targetId){if(!pointerWire&& !selected)return;const from=pointerWire?.id||selected;pointerWire=null;if(from){connect(from,targetId);selected=null;document.querySelectorAll('.source.selected').forEach(n=>n.classList.remove('selected'));}}
  document.addEventListener('pointermove',e=>{if(pointerWire)drawWires(e.clientX,e.clientY);});document.addEventListener('pointerup',e=>{if(!pointerWire)return;const target=e.target.closest?.('.target');if(target){finishWire(e,target.dataset.id);}else{pointerWire=null;drawWires();}});
  function connect(from,to){if(stage!==3||timer<=0)return;connections[from]=to;checked=false;setText('wireFeedback',from===to?'Wire connected. Keep going!':'Wire connected. Check the connections when all five are placed.');updateConnectionUi();drawWires();}
  function updateConnectionUi(){setText('connectCount',`${Object.keys(connections).length} / 5`);const ring=$('connectRing');if(ring)ring.style.borderRightColor=Object.keys(connections).length===5?'#00efa5':'#00caff';systems.forEach(sys=>{const src=document.querySelector(`.source[data-id="${sys.id}"]`),targetId=connections[sys.id],tgt=targetId?document.querySelector(`.target[data-id="${targetId}"]`):null;src?.classList.toggle('connected',!!targetId);if(tgt)tgt.classList.add('connected');});}
  function socketPoint(selector,side){const el=document.querySelector(selector+' .wire-socket');if(!el)return null;const board=$('connectionBoard').getBoundingClientRect(),r=el.getBoundingClientRect();return{x:(r.left+r.width/2-board.left),y:(r.top+r.height/2-board.top)};}
  function drawWires(tempX,tempY){const svg=$('wireSvg');if(!svg||!$('connectionBoard'))return;const board=$('connectionBoard').getBoundingClientRect();if(!board.width)return;svg.setAttribute('viewBox',`0 0 ${board.width} ${board.height}`);svg.innerHTML='';systems.forEach(sys=>{const a=socketPoint(`.source[data-id="${sys.id}"]`),to=connections[sys.id],b=to?socketPoint(`.target[data-id="${to}"]`):null;if(a&&b){const path=document.createElementNS('http://www.w3.org/2000/svg','path');const dx=Math.max(25,(b.x-a.x)*.42);path.setAttribute('d',`M ${a.x} ${a.y} C ${a.x+dx} ${a.y}, ${b.x-dx} ${b.y}, ${b.x} ${b.y}`);path.setAttribute('stroke',checked?'#00efa5':sys.color);path.setAttribute('stroke-width','4');path.setAttribute('stroke-linecap','round');path.setAttribute('fill','none');path.style.filter=`drop-shadow(0 0 4px ${checked?'#00efa5':sys.color})`;svg.appendChild(path);const hi=path.cloneNode();hi.setAttribute('stroke','#ffffff');hi.setAttribute('stroke-width','1');hi.setAttribute('opacity','.5');svg.appendChild(hi);}});
    if(pointerWire){const a=socketPoint(`.source[data-id="${pointerWire.id}"]`);if(a){const p=document.createElementNS('http://www.w3.org/2000/svg','path');const x=tempX==null?a.x:tempX-board.left,y=tempY==null?a.y:tempY-board.top,dx=Math.max(20,(x-a.x)*.4);p.setAttribute('d',`M ${a.x} ${a.y} C ${a.x+dx} ${a.y},${x-dx} ${y},${x} ${y}`);p.setAttribute('stroke',systems.find(s=>s.id===pointerWire.id).color);p.setAttribute('stroke-width','4');p.setAttribute('stroke-linecap','round');p.setAttribute('fill','none');p.style.filter='drop-shadow(0 0 4px currentColor)';svg.appendChild(p);}}
  }
  function checkConnections(){if(Object.keys(connections).length<5){setText('wireFeedback','Connect all five wires before checking.');return;}const wrong=systems.filter(s=>connections[s.id]!==s.id);if(wrong.length){setText('wireFeedback',`${wrong.length} connection${wrong.length===1?' is':'s are'} incorrect. Reconnect the highlighted wires and try again.`);wrong.forEach(s=>{document.querySelector(`.source[data-id="${s.id}"]`)?.classList.add('wrong');document.querySelector(`.target[data-id="${connections[s.id]}"]`)?.classList.add('wrong');});setTimeout(()=>document.querySelectorAll('.wire-row.wrong').forEach(e=>e.classList.remove('wrong')),900);return;}checked=true;stopTimer();setText('wireFeedback','All five connections are correct. Reviewing systems…');systems.forEach(s=>{document.querySelector(`.source[data-id="${s.id}"]`)?.classList.add('correct');document.querySelector(`.target[data-id="${s.id}"]`)?.classList.add('correct');});drawWires();setTimeout(()=>showStage(4),350);}
  function buildReview(){const list=$('reviewList'),status=$('statusRows');list.innerHTML='';status.innerHTML='';systems.forEach(sys=>{const row=document.createElement('div');row.className='review-wire-row';row.style.setProperty('--wire',sys.color);row.innerHTML=`<div class="review-chip"><i data-lucide="${sys.icon}"></i>${sys.label}</div><div class="review-line"></div><div class="review-chip"><i data-lucide="${sys.icon}"></i>${sys.label}</div>`;list.appendChild(row);const sr=document.createElement('div');sr.className='status-row';sr.style.setProperty('--wire',sys.color);sr.innerHTML=`<i data-lucide="${sys.icon}"></i><span>${sys.label.replace('ENGINE CONTROL','Engine Control').replace('POWER SYSTEM','Power System').replace('LIFE SUPPORT','Life Support').replace('COMMUNICATION','Communication').replace('NAVIGATION','Navigation')}</span><i data-lucide="check-circle-2"></i>`;status.appendChild(sr);});refreshIcons();}
  function buildActivation(){const box=$('activationSystems');box.innerHTML='';systems.forEach(sys=>{const el=document.createElement('div');el.className='activation-system';el.innerHTML=`<i data-lucide="${sys.icon}"></i><span>${sys.label}</span><b style="margin-left:auto;color:#00efa5">READY</b>`;box.appendChild(el);});refreshIcons();}
  $('startConnecting').addEventListener('click',()=>{makeRows();connections={};checked=false;updateConnectionUi();showStage(3);});
  $('checkButton').addEventListener('click',checkConnections);
  $('resetButton').addEventListener('click',()=>{connections={};selected=null;checked=false;document.querySelectorAll('.wire-row').forEach(e=>e.classList.remove('selected','connected','correct','wrong'));setText('wireFeedback','Connections reset. Start matching the five systems.');updateConnectionUi();drawWires();});
  $('hintButton').addEventListener('click',()=>{const missing=systems.find(s=>connections[s.id]!==s.id);if(!missing){setText('wireFeedback','All connections are already correct.');return;}hintUsed=true;setText('wireFeedback',`Hint: ${missing.label} (the ${missing.color} wire) connects to ${missing.label} on the right.`);const target=document.querySelector(`.target[data-id="${missing.id}"]`);target?.classList.add('correct');setTimeout(()=>target?.classList.remove('correct'),1200);});
  $('recheckButton').addEventListener('click',()=>{showStage(3);setText('wireFeedback','Connections preserved. Recheck or reset if needed.');stopTimer();});
  $('proceedActivation').addEventListener('click',()=>showStage(5));
  $('activateSystems').addEventListener('click',()=>{systems.forEach((_,i)=>{const el=$('activationSystems').children[i];if(el)el.querySelector('b').textContent='ONLINE';});setText('activationFeedback','ALL SYSTEMS ONLINE — INITIATING LAUNCH…');$('activateSystems').textContent='LAUNCH SEQUENCE INITIATED ✓';$('activateSystems').disabled=true;try{localStorage.setItem('astraquestWiringComplete','true');localStorage.setItem('astraquestSystemsActivated','true');}catch(_){}setTimeout(()=>{window.location.href='launch-animation.html';},900);});
  window.addEventListener('resize',()=>drawWires());
  makeRows();showStage(2);refreshIcons();
})();