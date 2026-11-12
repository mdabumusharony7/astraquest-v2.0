(()=>{'use strict';
const $=id=>document.getElementById(id),read=k=>{try{return localStorage.getItem(k)}catch(_){return null}};
const scene=$('flightScene'),rocket=$('flightRocket'),LY=['lSpace','lSurface','lPad','lCloudA','lCloudB'].map($),[lSpace,lSurface,lPad,lCloudA,lCloudB]=LY,cv=$('fxCanvas'),ctx=cv.getContext('2d');
const title=$('flightTitle'),desc=$('flightDescription'),phaseEl=$('phaseLabel'),step=$('phaseStep'),count=$('countdown'),fill=$('progressFill'),skip=$('skipAnimation'),cont=$('continueMission'),callout=$('callout'),sndBtn=$('soundToggle');
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
let crew=4;try{const p=JSON.parse(read('astraquestSelectedCrew'));crew=Array.isArray(p)?p.length:Number(p&&p.count)||4}catch(_){}
$('flightRocketName').textContent=read('astraquestRocketName')||'Pioneer-1';$('flightCrew').textContent=crew+' MEMBERS';
const dest=(read('astraquestSelectedMission')||read('astraquestMission')||read('astraquestDestination')||'Moon').toUpperCase(),mars=/MARS/.test(dest);$('flightDestination').textContent=dest;
if(mars)scene.setAttribute('data-mars','');
const lerp=(a,b,t)=>a+(b-a)*t,cl=(x,a=0,b=1)=>Math.min(b,Math.max(a,x)),sm=(a,b,x)=>{const t=cl((x-a)/(b-a));return t*t*(3-2*t)},rnd=Math.random;
const D=dest[0]+dest.slice(1).toLowerCase();
const phases=[
{name:'COUNTDOWN',title:'T−10 <span>SECONDS</span>',desc:'Launch clamps engaged. Engines are powering up.',duration:10000,cls:'launchpad',ev:[[0,'Launch director: begin terminal count'],[1000,'Go / No-Go poll — all stations GO'],[4000,'Flight computer has control'],[7000,'Engine start sequence — ignition!'],[9000,'Engines at full thrust, holding for release']]},
{name:'LIFTOFF',title:'WE HAVE <span>LIFTOFF</span>',desc:'Main engines firing. Your rocket is rising from the launchpad.',duration:6500,cls:'liftoff',count:'LIFTOFF',ev:[[0,'Liftoff! Tower clear'],[1800,'Pitch and roll program started'],[3000,'Passing Max-Q — maximum aerodynamic stress'],[4800,'Booster burnout'],[5800,'Main engine cutoff — orbit achieved']]},
{name:'SPACE TRANSIT',title:'EN ROUTE TO <span>'+dest+'</span>',desc:'The spacecraft is traveling through space toward its destination.',duration:7500,cls:'space',count:'IN FLIGHT',ev:[[0,(mars?'Trans-Mars':'Trans-lunar')+' injection burn complete'],[1600,'Engines off — coasting through the vacuum of space'],[4500,'Mid-course correction nominal'],[6200,'Approaching '+D+' — preparing for descent']]},
{name:'DESCENT & LANDING',title:'LANDING <span>SEQUENCE</span>',desc:'Approaching the surface. Thrusters are slowing the spacecraft for touchdown.',duration:7000,cls:'landing',count:'DESCENDING',ev:[[0,'Descent burn started'],[2500,'Powered descent — slowing down'],[5000,'Dust is kicking up — surface in sight'],[6200,'Contact light! Engine shutdown']]},
{name:'LANDING CONFIRMED',title:'TOUCHDOWN <span>CONFIRMED</span>',desc:'Your crew has arrived. The survival mission begins now: monitor supplies and respond to automatic crisis alerts.',duration:0,cls:'landed',count:'TOUCHDOWN',ev:[[0,'Touchdown confirmed — mission survival phase ready']]}];
// ---- sound (synthesized, no files) ----
let ac,master,rum,roar,snd=false;
function audioInit(){if(ac)return;const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;ac=new AC();master=ac.createGain();master.connect(ac.destination);
 const buf=ac.createBuffer(1,ac.sampleRate*2,ac.sampleRate),d=buf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=rnd()*2-1;
 const mk=(t,f,q)=>{const s=ac.createBufferSource();s.buffer=buf;s.loop=true;const fl=ac.createBiquadFilter();fl.type=t;fl.frequency.value=f;fl.Q.value=q;const g=ac.createGain();g.gain.value=0;s.connect(fl);fl.connect(g);g.connect(master);s.start();return g};
 rum=mk('lowpass',130,.8);roar=mk('bandpass',700,.5)}
function beep(f,len){if(!snd||!ac)return;const t=ac.currentTime,o=ac.createOscillator(),g=ac.createGain();o.frequency.value=f;g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.18,t+.01);g.gain.exponentialRampToValueAtTime(.0001,t+len);o.connect(g);g.connect(master);o.start(t);o.stop(t+len+.02)}
sndBtn.addEventListener('click',()=>{snd=!snd;if(snd){audioInit();if(ac)ac.resume()}if(master)master.gain.value=snd?.7:0;sndBtn.textContent=snd?'SOUND ON':'SOUND OFF'});
// ---- state ----
let W=0,H=0,P=[],ph=0,pt=0,last=performance.now(),lastSec=-1,lastEv='',wyPrev=0;
const IA=1672/941;let DW=0,DH=0;
function resize(){const d=Math.min(devicePixelRatio||1,3);W=scene.clientWidth;H=scene.clientHeight;cv.width=Math.round(W*d);cv.height=Math.round(H*d);ctx.setTransform(d,0,0,d,0,0);if(W/H>IA){DW=W;DH=W/IA}else{DH=H;DW=H*IA}for(const e of LY){e.style.width=DW+'px';e.style.height=DH+'px'}}
new ResizeObserver(resize).observe(scene);resize();
const add=(t,x,y,vx,vy,life,size,o)=>{if(P.length<900)P.push(Object.assign({t,x,y,vx,vy,life,age:0,size},o))};
function setPhase(i){ph=i;pt=0;lastSec=-1;lastEv='';const p=phases[i];scene.className='flight-scene '+p.cls;phaseEl.textContent=p.name;step.textContent='SEQUENCE '+String(i+1).padStart(2,'0')+' / 05';title.innerHTML=p.title;desc.textContent=p.desc;
 if(i===4){skip.hidden=true;cont.hidden=false;try{localStorage.setItem('astraquestMissionLanded','true')}catch(_){}}}
function finish(){setPhase(4);pt=2500}
// ---- telemetry ----
const fmtMet=s=>{if(s<3600)return'T+ '+String(Math.floor(s/60)).padStart(2,'0')+':'+String(Math.floor(s%60)).padStart(2,'0');const d=Math.floor(s/86400),h=Math.floor(s%86400/3600);return'T+ '+(d?d+'d ':'')+h+'h'};
const fmtKm=d=>d>=1e6?(d/1e6).toFixed(1)+'M km':Math.round(d).toLocaleString('en-US')+' km';
const SPAN=mars?18144000:259200,gSurf=mars?.38:.16;
function hud(f){let met,alt,vel,fuel,g,lbl='ALTITUDE';
 if(ph===0){met='T− 00:'+String(Math.max(0,Math.ceil(10-pt/1000))).padStart(2,'0');alt='0 m';vel='0 m/s';fuel=100;g=1}
 else if(ph===1){met=fmtMet(f*540);alt=(190*Math.pow(f,1.6)).toFixed(1)+' km';vel=Math.round(7800*Math.pow(f,1.3))+' m/s';fuel=lerp(100,78,f);g=f<.88?1+3.1*Math.pow(f/.88,1.4):4.1*(1-f)/.12}
 else if(ph===2){met=fmtMet(540+f*SPAN);lbl='DISTANCE';alt=fmtKm(lerp(mars?225e6:384400,100,f));vel=Math.round(lerp(mars?11200:10800,1700,f)).toLocaleString('en-US')+' m/s';fuel=lerp(78,55,f);g=0}
 else{const e=ph===3?f:1,m=100000*(1-e)*(1-e);met=fmtMet(540+SPAN+e*7200);alt=m>=10000?Math.round(m/1000)+' km':Math.round(m)+' m';vel=Math.round(1700*(1-e))+' m/s';fuel=lerp(55,38,e);g=gSurf*e}
 $('tMet').textContent=met;$('tAltLbl').textContent=lbl;$('tAlt').textContent=alt;$('tVel').textContent=vel;$('tFuel').textContent=Math.round(fuel)+'%';$('tG').textContent=Math.max(0,g).toFixed(2)+' g'}
// ---- main loop ----
const PF={};function puff(c){if(!PF[c]){const o=document.createElement('canvas');o.width=o.height=64;const x=o.getContext('2d'),g=x.createRadialGradient(32,32,0,32,32,32);g.addColorStop(0,'rgba('+c+',1)');g.addColorStop(.45,'rgba('+c+',.5)');g.addColorStop(1,'rgba('+c+',0)');x.fillStyle=g;x.fillRect(0,0,64,64);PF[c]=o}return PF[c]}
// ---- virtual cameras over the photos (focus x/y are 0-1 image coordinates) ----
// layer(el, zoom, fx, fy, opacity, extraY, clampOn): cover-fit the photo, pan/zoom, keep edges hidden (unless clampOn is false)
function layer(el,sc,fx,fy,op,exY,sx,sy,clampOn=true){const cw=DW*sc,ch=DH*sc;let tx=W/2-fx*cw+sx,ty=H/2-fy*ch+sy;
 if(clampOn){tx=cl(tx,Math.min(0,W-cw),0);ty=cl(ty,Math.min(0,H-ch),0)}else{tx=cl(tx,Math.min(0,W-cw),0);ty=cl(ty,Math.min(0,H-ch),0)}
 el.style.transform='translate3d('+tx+'px,'+(ty+exY)+'px,0) scale('+sc+')';el.style.opacity=op.toFixed(3)}
const bell=(f,a,b,c,d)=>sm(a,b,f)*(1-sm(c,d,f));
function scenery(f,wy,shx,shy){
 // 1) launch pad: static during countdown, scrolls away with the rocket's climb; its top edge softly fades into the sky above
 const padOp=ph===0?1:ph===1?1-sm(.6,.9,f):0;
 layer(lPad,1.1,.475,.55,padOp,ph===1?wy:0,shx,shy);
 const fade=ph===1?Math.min(.35*H,wy*.9):0;const mk=fade>1?'linear-gradient(to bottom,transparent 0,#000 '+(fade/1.1).toFixed(1)+'px)':'none';lPad.style.webkitMaskImage=lPad.style.maskImage=mk;
 // 2) orbit view (Earth + Moon + asteroids): fades in as the sky thins, then flies from Earth toward the Moon
 let sp=0,sc=1.2,fx=.35,fy=.5;
 if(ph===1)sp=sm(.2,.6,f);else if(ph===2){sp=1;const p=sm(0,.85,f);fx=lerp(.35,.88,p);fy=lerp(.5,.4,p);sc=lerp(1.2,3,Math.pow(sm(.2,1,f),1.5))}
 layer(lSpace,sc,fx,fy,ph<=2?sp:0,0,shx,shy);
 // 3) moon surface: dissolves in as the Moon fills the view
 layer(lSurface,1,.5,.5,ph===2?sm(.8,1,f):ph>=3?1:0,0,shx,shy);
 // 4) two cloud banks sweep down past the rocket during ascent
 const cA=ph===1?bell(f,.28,.5,.72,.92):0,cB=ph===1?bell(f,.42,.62,.82,1):0;
 layer(lCloudA,1.25,.5,.5,.7*cA,lerp(-1.1*H,1.1*H,sm(.28,.95,f)),0,0,false);
 layer(lCloudB,1.6,.35,.5,.6*cB,lerp(-1.2*H,1.2*H,sm(.42,1,f)),0,0,false)}
function frame(now){const dt=Math.min(50,now-last);last=now;const k=dt/16.667;pt+=dt;
 if(ph<4&&pt>=phases[ph].duration)setPhase(ph+1);
 const f=ph<4?cl(pt/phases[ph].duration):1,bh=rocket.offsetHeight,bw=rocket.offsetWidth,B0=H-(rocket.offsetTop+bh),G=.2*H,CAP=.2*H;
 let b=B0,s=1,r=0,dx=0,th=0,wy=0,amp=0;
 if(ph===0){th=cl((pt/1000-7)/3)*.55;amp=th*2.5}
 else if(ph===1){const e=Math.pow(f,2.3),disp=H*1.7*e;b=B0+Math.min(disp,CAP);wy=Math.max(0,disp-CAP);s=1-.5*sm(.3,1,f);r=7*sm(.45,1,f);th=1;amp=6*(1-f)+1.2}
 else if(ph===2){const e=sm(0,1,f);b=lerp(B0+CAP,.82*H,e);s=lerp(.5,.26,e);r=lerp(7,40,sm(0,.4,f));dx=lerp(0,.1*W,f);th=0}
 else if(ph===3){b=G+(.82*H-G)*(1-f)*(1-f);s=lerp(.26,.48,f);const m=sm(0,.3,f);r=lerp(40,0,m);dx=lerp(.1*W,0,m);th=f<.97?.8*(1-.5*f):0;amp=th*1.5}
 else{b=G;s=.48}
 if(reduce)amp=0;const shx=(rnd()-.5)*2*amp,shy=(rnd()-.5)*2*amp;
 const dy=b-(B0+bh/2*(1-s));rocket.style.transform='translate(calc(-50% + '+(dx+shx)+'px),'+(-dy+shy)+'px) rotate('+r+'deg) scale('+s+')';
 scenery(f,wy,shx,shy);
 const dWy=ph===1?Math.max(0,wy-wyPrev):0;wyPrev=ph===1?wy:0;
 // smoke only (no flames): launch-pad smoke + a short exhaust smoke trail while in the atmosphere
 const padY=H-B0,rad=r*Math.PI/180,sn=Math.sin(rad),cs=Math.cos(rad),cx=W/2+dx+shx,cy=H-(B0+bh/2)-dy+shy,base=Math.atan2(cs,-sn);
 if(ph===1&&f<.8){const fade=1-sm(.5,.8,f);
  for(const n of[.318,.51,.7]){const lx=(n-.5)*bw*s,ly=.5*bh*s,x=cx+lx*cs-ly*sn,y=cy+lx*sn+ly*cs;
   for(let i=Math.ceil(2*fade);i>0;i--){const a=base+(rnd()-.5)*.35,sp=(1.5+rnd()*2.5)*(.5+.5*s);add('s',x,y,Math.cos(a)*sp,Math.sin(a)*sp,40+rnd()*35,(3+rnd()*4)*(.5+.8*s),{c:'226,230,236',a:.4*fade+.05,gr:2.4,d:.965})}}}
 if((ph===1&&f<.75&&wy<.6*H)||(ph===0&&rnd()<th*1.5)){for(let i=ph===1?3:1;i>0;i--)add('s',W/2+(rnd()-.5)*.1*W,padY+wy,(rnd()<.5?-1:1)*(1+rnd()*5),-rnd()*1.2,120+rnd()*90,8+rnd()*14,{c:'218,224,230',a:.3,gr:2.2,d:.985})}
 // landing dust: thrown outward in flat arcs (Moon, no air) or hazy puffs (Mars)
 const hgt=b-G,gy=H-G;if((ph===3&&hgt<.32*H&&th>0)||(ph===4&&pt<1200)){const n=ph===4?4:Math.round(7*(1-cl(hgt/(.32*H))))+1;
  for(let i=0;i<n;i++)add('s',W/2+(rnd()-.5)*.05*W,gy,(rnd()<.5?-1:1)*(1.5+rnd()*6.5),-rnd()*(mars?1.4:.6),90+rnd()*70,3+rnd()*7,{c:mars?'214,150,110':'190,188,184',a:.5,gr:mars?2:.6,g:mars?-.002:.03,d:mars?.975:1})}
 // update + draw smoke particles
 ctx.clearRect(0,0,W,H);
 for(let i=P.length-1;i>=0;i--){const q=P[i];q.age+=k;if(q.age>=q.life){P.splice(i,1);continue}
  q.x+=q.vx*k;q.y+=q.vy*k+dWy;q.vy+=(q.g||0)*k;if(q.d){const dd=Math.pow(q.d,k);q.vx*=dd;q.vy*=dd}
  const u=1-q.age/q.life,rr=q.size*(1+(1-u)*q.gr)*1.5;ctx.globalAlpha=q.a*u;ctx.drawImage(puff(q.c),q.x-rr,q.y-rr,rr*2,rr*2)}ctx.globalAlpha=1;
 // HUD: countdown, callouts, telemetry, progress
 if(ph===0){const rem=Math.max(0,Math.ceil((10000-pt)/1000));count.textContent=rem>0?'T−'+rem:'IGNITION';if(rem!==lastSec){lastSec=rem;if(rem>0&&rem<=5)beep(880,.08);if(rem===0)beep(440,.5)}}else count.textContent=phases[ph].count;
 let ev='';for(const e of phases[ph].ev)if(pt>=e[0])ev=e[1];if(ev!==lastEv){lastEv=ev;callout.textContent='▸ '+ev;beep(1300,.07)}
 hud(f);fill.style.width=(ph<4?(ph+f)/4*100:100)+'%';
 if(ac&&snd){const t=ac.currentTime;rum.gain.setTargetAtTime(th*.9,t,.1);roar.gain.setTargetAtTime(th*th*.35,t,.1)}
  requestAnimationFrame(frame)}
skip.addEventListener('click',finish);cont.addEventListener('click',()=>{window.location.href='moon-dashboard.html?newMission=1'});
setPhase(0);requestAnimationFrame(frame);if(window.lucide)window.lucide.createIcons();
})();
