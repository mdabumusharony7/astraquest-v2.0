(() => {
 'use strict';
 // ASTRAQUEST oxygen-routing puzzle (v2). Public API is unchanged:
 //   initAstraOxygenPuzzle({onSolved}) / stopAstraOxygenPuzzleTimer()
 // Rules: any unbroken pipeline from the Oxygen Container to Life Support wins. Unused openings on T- and
 // cross-junctions are capped automatically; a straight pipe or elbow with a loose end leaks (costs bonus points).
 const BASE='assets/oxygen-puzzle/tiles/';
 const TIME_LIMIT=120;
 const DIRS=['N','E','S','W'];
 const V={N:[-1,0],E:[0,1],S:[1,0],W:[0,-1]};
 const OPP={N:'S',E:'W',S:'N',W:'E'};
 const PORTS={straight:['W','E'],elbow:['W','S'],tee:['W','E','S'],cross:['N','E','S','W'],source:['E'],target:['W']};
 const IMGS={source:'oxygen-container.png',target:'life-support-container.png',straight:'straight-pipe.png',elbow:'elbow-pipe.png',tee:'t-junction.png',cross:'cross-junction.png'};
 const NAMES={source:'Oxygen Container',target:'Life-Support Container',straight:'Straight pipe',elbow:'Elbow pipe',tee:'T-junction',cross:'Cross-junction'};
 // Guaranteed route pieces (always present) + their starting scramble and their "designed" solved rotation.
 const LAYOUT=[
  {id:'source',type:'source',r:0,c:0,rot:0,fixed:true},
  {id:'cross',type:'cross',r:0,c:1,rot:1,solved:0},
  {id:'elbow1',type:'elbow',r:0,c:2,rot:2,solved:0},
  {id:'straight',type:'straight',r:1,c:2,rot:0,solved:1},
  {id:'tee',type:'tee',r:2,c:2,rot:0,solved:1},
  {id:'elbow2',type:'elbow',r:3,c:2,rot:3,solved:2},
  {id:'target',type:'target',r:3,c:3,rot:0,fixed:true}
 ];
 const DECOYS=['straight','straight','elbow','elbow','elbow','tee','tee','cross'];
 let pieces=[],root,feedback,stats,solvedCb=()=>{},expired=false,done=false,seconds=TIME_LIMIT,timer=null,started=false,hintOn=false;

 const rotate=(d,n)=>DIRS[(DIRS.indexOf(d)+n+4)%4];
 const ports=p=>PORTS[p.type].map(d=>rotate(d,p.rot));
 const at=(r,c)=>pieces.find(p=>p.r===r&&p.c===c);
 const neighbor=(p,d)=>{const [dr,dc]=V[d];return at(p.r+dr,p.c+dc)};
 const linked=(p,d)=>{const n=neighbor(p,d);return !!n&&ports(n).includes(OPP[d])};
 const isJunction=p=>p.type==='tee'||p.type==='cross';
 const isFixed=p=>!!p.fixed;
 const fmt=s=>`${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;

 function analyze(){
  const src=pieces.find(p=>p.type==='source'),seen=new Set([src.id]),queue=[src];
  while(queue.length){const p=queue.shift();for(const d of ports(p)){if(!linked(p,d))continue;const n=neighbor(p,d);if(!seen.has(n.id)){seen.add(n.id);queue.push(n)}}}
  let leaks=0;const sealed=new Set(),loose=new Set();
  for(const id of seen){const p=pieces.find(x=>x.id===id);if(isFixed(p))continue;
   for(const d of ports(p)){if(linked(p,d))continue;if(isJunction(p))sealed.add(`${id}:${d}`);else{leaks++;loose.add(id)}}}
  const connected=seen.has('target');
  const score=connected?Math.min(100,70+Math.round(seconds/TIME_LIMIT*20)+(leaks===0?10:0)):Math.round(Math.min(1,(seen.size-1)/6)*50);
  return {seen,leaks,sealed,loose,connected,score};
 }
 function hasCleanSolution(){
  const saved=pieces.map(p=>p.rot);
  pieces.forEach(p=>{if(p.solved!==undefined)p.rot=p.solved});
  const a=analyze();pieces.forEach((p,i)=>p.rot=saved[i]);
  return a.connected&&a.leaks===0;
 }
 function build(){
  for(let tries=0;tries<40;tries++){
   pieces=LAYOUT.map(p=>({...p}));
   for(let r=0;r<4;r++)for(let c=0;c<4;c++){
    if(pieces.some(p=>p.r===r&&p.c===c))continue;
    pieces.push({id:`decoy-${r}-${c}`,type:DECOYS[Math.floor(Math.random()*DECOYS.length)],r,c,rot:Math.floor(Math.random()*4)});
   }
   if(analyze().connected)continue;      // never start already solved
   if(hasCleanSolution())break;          // a perfect 100/100 solution always exists
  }
 }
 // Fewest-click route from the current board (used by the hint).
 function clicksFor(p,a,b){let best=null;for(let k=0;k<4;k++){const ps=PORTS[p.type].map(d=>rotate(d,k));if(ps.includes(a)&&ps.includes(b)){const c=(k-p.rot+4)%4;if(best===null||c<best)best=c}}return best}
 function bestRoute(){
  const src=pieces.find(p=>p.type==='source'),tgt=pieces.find(p=>p.type==='target');let best=null;
  const walk=(p,inD,path,cost,seen)=>{for(const outD of DIRS){if(outD===inD)continue;const c=clicksFor(p,inD,outD);if(c===null)continue;
    const n=neighbor(p,outD);if(!n||seen.has(n.id))continue;const step={p,c},total=cost+c;
    if(n===tgt){if(PORTS.target.map(d=>d).includes(OPP[outD])){const full=[...path,step];if(!best||total<best.cost)best={cost:total,steps:full}}continue}
    if(isFixed(n))continue;seen.add(n.id);walk(n,OPP[outD],[...path,step],total,seen);seen.delete(n.id)}};
  const first=neighbor(src,'E');if(first&&!isFixed(first))walk(first,'W',[],0,new Set([first.id]));
  return best?best.steps:null;
 }

 function createBoard(){
  const board=root.querySelector('#routeBoard');board.innerHTML='';
  for(let r=0;r<4;r++)for(let c=0;c<4;c++){
   const p=at(r,c),cell=document.createElement('div');cell.className='oxygen-route-cell';
   const b=document.createElement(p.fixed?'div':'button');if(!p.fixed)b.type='button';
   b.className='oxygen-route-tile'+(p.fixed?' fixed':'');b.dataset.id=p.id;
   b.setAttribute('aria-label',p.fixed?NAMES[p.type]:`${NAMES[p.type]}, click to rotate clockwise`);
   const img=document.createElement('img');img.src=BASE+IMGS[p.type];img.alt='';img.draggable=false;b.appendChild(img);
   p.deg=p.rot*90;
   if(!p.fixed){
    const deg=document.createElement('span');deg.className='tile-degree';b.appendChild(deg);
    DIRS.forEach(d=>{const cap=document.createElement('span');cap.className=`port-cap ${d.toLowerCase()} off`;cap.dataset.dir=d;cap.title='Safety cap — sealed opening';b.appendChild(cap)});
    b.addEventListener('click',()=>rotatePiece(p));
   }else{
    const lab=document.createElement('span');lab.className='tile-label';lab.textContent=p.type==='source'?'O₂ SOURCE':'LIFE SUP.';b.appendChild(lab);
   }
   cell.appendChild(b);board.appendChild(cell);
  }
  render();
 }
 function rotatePiece(p){
  if(expired||done||p.fixed)return;
  p.rot=(p.rot+1)%4;p.deg+=90;
  if(!started){started=true;startTimer()}
  render();
  const a=analyze();
  if(a.connected&&a.leaks===0)setTimeout(()=>{if(!done&&!expired&&analyze().connected)complete()},450); // perfect seal completes automatically
 }
 function render(){
  const a=analyze(),route=hintOn?bestRoute():null,need=new Set(route?route.filter(s=>s.c>0).map(s=>s.p.id):[]);
  for(const p of pieces){
   const b=root.querySelector(`[data-id="${p.id}"]`);if(!b)continue;
   b.querySelector('img').style.transform=`rotate(${p.deg}deg)`;
   const dg=b.querySelector('.tile-degree');if(dg)dg.textContent=`${p.rot*90}°`;
   b.classList.toggle('reached',a.connected&&a.seen.has(p.id));
   b.classList.toggle('leaking',a.loose.has(p.id));
   b.classList.toggle('hint',need.has(p.id));
   b.querySelectorAll('.port-cap').forEach(cap=>cap.classList.toggle('off',!a.sealed.has(`${p.id}:${cap.dataset.dir}`)));
  }
  stats.flow.textContent=a.connected?'CONNECTED':'OFFLINE';stats.flow.style.color=a.connected?'#00e6b1':'#cde5f7';
  stats.leaks.textContent=String(a.leaks);stats.route.textContent=a.connected?'YES':'NO';stats.score.textContent=`${a.score}`;
  if(!done&&!expired){
   feedback.className='oxygen-route-feedback'+(a.connected&&a.leaks===0?' success':a.leaks?' error':'');
   feedback.textContent=a.connected&&a.leaks===0?'Sealed route detected — completing…':a.connected?`Oxygen reaches life support, but ${a.leaks} loose end${a.leaks>1?'s are':' is'} leaking (red tiles). Fix them for full points, or press Check Connection to continue.`:`Not connected yet — oxygen reaches ${a.seen.size-1} pipe${a.seen.size-1===1?'':'s'}. Any unbroken route from the source to life support works.`;
  }
 }
 function setTimerText(){const t=fmt(Math.max(0,seconds));const el=root.querySelector('#routeTimer');if(el)el.textContent=t;const g=document.getElementById('timer');if(g)g.textContent=t}
 function stopTimer(){if(timer)clearInterval(timer);timer=null}
 function startTimer(){stopTimer();timer=setInterval(()=>{seconds--;setTimerText();if(seconds<=0){seconds=0;expired=true;stopTimer();setTimerText();const btn=document.getElementById('checkPuzzle');if(btn)btn.disabled=true;feedback.className='oxygen-route-feedback error';feedback.textContent='Time expired. Press “Reset Pipe Layout” to try again.'}},1000)}
 function complete(){
  const a=analyze();done=true;stopTimer();
  feedback.className='oxygen-route-feedback success';
  feedback.textContent=a.leaks?`SUCCESS: oxygen reaches life support (${a.leaks} loose end${a.leaks>1?'s':''} cost bonus points).`:'SUCCESS: oxygen reaches life support with no active leaks.';
  const btn=document.getElementById('checkPuzzle');if(btn)btn.disabled=true;
  try{localStorage.setItem('astraquestOxygenPuzzleScore',String(a.score))}catch(_){}
  solvedCb({score:a.score,leaks:a.leaks,secondsLeft:seconds});
 }
 function reset(){
  stopTimer();seconds=TIME_LIMIT;started=false;expired=false;done=false;hintOn=false;
  build();createBoard();setTimerText();
  const btn=document.getElementById('checkPuzzle');if(btn)btn.disabled=false;
  root.querySelector('#routeHint').textContent='Show hint';
 }
 function init(opts={}){
  root=document.getElementById('oxygenRoutePuzzle');if(!root)return;
  solvedCb=opts.onSolved||(()=>{});
  root.innerHTML=`<div class="oxygen-route-layout"><div><div class="oxygen-route-board" id="routeBoard" aria-label="Four by four oxygen pipe grid"></div><div class="oxygen-route-legend"><span><i class="oxygen-route-dot flow"></i> Oxygen-connected</span><span><i class="oxygen-route-dot leak"></i> Loose end (leak)</span><span><i class="oxygen-route-dot cap"></i> Auto-sealed junction port</span></div></div><div><div class="info-card"><h3>ROUTE DIAGNOSTICS</h3><p class="oxygen-route-help">Click a pipe to rotate it 90° clockwise. Any unbroken route from the Oxygen Container to Life Support works. Junction openings you don’t use are capped automatically; a straight pipe or elbow with a loose end leaks.</p><p class="oxygen-route-help">Time remaining: <b id="routeTimer">${fmt(TIME_LIMIT)}</b> <small>(starts on your first rotation)</small></p><div class="oxygen-route-stats"><div class="oxygen-route-stat"><small>Destination</small><strong id="routeReached">NO</strong></div><div class="oxygen-route-stat"><small>Leaks</small><strong id="routeLeaks">0</strong></div><div class="oxygen-route-stat"><small>Score</small><strong id="routeScore">0</strong></div></div><p class="oxygen-route-help">Oxygen flow: <b id="routeFlow">OFFLINE</b></p><div class="oxygen-route-feedback" id="routeFeedback" role="status"></div><div style="display:flex;gap:8px;margin-top:12px"><button class="game-btn" id="routeHint" style="flex:1">Show hint</button><button class="game-btn" id="routeReset" style="flex:1">Reset Pipe Layout</button></div></div></div></div>`;
  feedback=root.querySelector('#routeFeedback');
  stats={flow:root.querySelector('#routeFlow'),leaks:root.querySelector('#routeLeaks'),route:root.querySelector('#routeReached'),score:root.querySelector('#routeScore')};
  root.querySelector('#routeReset').addEventListener('click',reset);
  root.querySelector('#routeHint').addEventListener('click',e=>{hintOn=!hintOn;e.target.textContent=hintOn?'Hide hint':'Show hint';render()});
  seconds=TIME_LIMIT;started=false;expired=false;done=false;hintOn=false;
  build();createBoard();setTimerText();
  const check=document.getElementById('checkPuzzle');
  if(check){check.disabled=false;check.onclick=()=>{
   if(done||expired)return;const a=analyze();
   if(a.connected)complete();
   else{feedback.className='oxygen-route-feedback error';feedback.textContent=`Connection failed: oxygen reaches ${a.seen.size-1} pipe${a.seen.size-1===1?'':'s'} but not life support yet. Keep rotating pipes.`}
  }}
 }
 window.initAstraOxygenPuzzle=init;window.stopAstraOxygenPuzzleTimer=stopTimer;
})();
