'use strict';
/* Base compartilhada: utilitários, som, cena 3D, bonecos, HUD e entrada. */

const $=s=>document.querySelector(s);
const rand=(a,b)=>a+Math.random()*(b-a);
const randi=(a,b)=>Math.floor(rand(a,b+1));
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const ease=t=>t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;
const fmtW=n=>'₩ '+Math.round(n).toLocaleString('pt-BR');
const pad3=n=>String(n).padStart(3,'0');
const shuffle=a=>{ for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; };
const V3=(x,y,z)=>new THREE.Vector3(x,y,z);
const PER_HEAD=100000000, PLAYERS=456, JACKPOT=45600000000;
const coarse=matchMedia('(pointer: coarse)').matches;

/* ---------- som ---------- */
let AC=null, muted=false;
function audio(){ if(muted) return null; if(!AC){ try{ AC=new (window.AudioContext||window.webkitAudioContext)(); }catch(e){ AC=null; } } if(AC&&AC.state==='suspended') AC.resume(); return AC; }
function tone(f,dur,type,vol,when){ const a=audio(); if(!a) return; const t=a.currentTime+(when||0); const o=a.createOscillator(), g=a.createGain();
  o.type=type||'triangle'; o.frequency.value=f; g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(vol||.12,t+.01); g.gain.exponentialRampToValueAtTime(.0001,t+dur);
  o.connect(g); g.connect(a.destination); o.start(t); o.stop(t+dur+.05); }
function noise(dur,vol,freq){ const a=audio(); if(!a) return; const n=Math.floor(a.sampleRate*dur), b=a.createBuffer(1,n,a.sampleRate), d=b.getChannelData(0);
  for(let i=0;i<n;i++) d[i]=(Math.random()*2-1)*Math.pow(1-i/n,3);
  const s=a.createBufferSource(); s.buffer=b; const f=a.createBiquadFilter(); f.type='lowpass'; f.frequency.value=freq||1800; const g=a.createGain(); g.gain.value=vol||.3;
  s.connect(f); f.connect(g); g.connect(a.destination); s.start(); }
const shot=()=>{ noise(.35,.45,2400); tone(70,.25,'sine',.25); };
const fanfare=()=>{ tone(523,.15,'triangle',.12); tone(659,.15,'triangle',.12,.15); tone(784,.3,'triangle',.12,.3); };
function setMute(m){ muted=m; document.querySelectorAll('.mute').forEach(b=>b.textContent=m?'Som desligado':'Som ligado'); }
document.querySelectorAll('.mute').forEach(b=>b.addEventListener('click',()=>setMute(!muted)));

/* ---------- cena ---------- */
const stage=$('#stage');
const renderer=new THREE.WebGLRenderer({antialias:true});
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
renderer.shadowMap.enabled=true; renderer.shadowMap.type=THREE.PCFSoftShadowMap;
stage.appendChild(renderer.domElement);
const scene=new THREE.Scene();
const camera=new THREE.PerspectiveCamera(60,1,.1,400);
const camLook=V3(0,3,-20);
const hemi=new THREE.HemisphereLight(0xe6f4ff,0xb08a5a,.8); scene.add(hemi);
const sun=new THREE.DirectionalLight(0xfff2dd,.8);
sun.castShadow=true; sun.shadow.mapSize.set(2048,2048);
Object.assign(sun.shadow.camera,{left:-60,right:60,top:70,bottom:-70,near:1,far:200});
scene.add(sun); scene.add(sun.target);
function setEnv(o){
  scene.background=new THREE.Color(o.bg);
  scene.fog=o.fog?new THREE.Fog(o.fog[0],o.fog[1],o.fog[2]):null;
  hemi.color.setHex(o.sky); hemi.groundColor.setHex(o.ground); hemi.intensity=o.hemi;
  sun.color.setHex(o.sunColor||0xfff2dd); sun.intensity=o.sun; sun.position.set(...o.sunPos); sun.target.position.set(...(o.sunTarget||[0,0,0]));
}
let world=null;
function useWorld(w){ if(world&&world!==w) scene.remove(world); world=w; if(w&&!w.parent) scene.add(w); }
function camTo(pos,look,dt,speed){ const k=dt==null?1:1-Math.exp(-dt*(speed||4)); camera.position.lerp(pos,k); camLook.lerp(look,k); camera.lookAt(camLook); }
function resize(){ const w=stage.clientWidth||innerWidth, h=stage.clientHeight||innerHeight; renderer.setSize(w,h,false); camera.aspect=w/h; camera.updateProjectionMatrix(); if(G.R&&G.R.resize) G.R.resize(); }

function canvasTex(w,h,draw){ const c=document.createElement('canvas'); c.width=w; c.height=h; draw(c.getContext('2d'),w,h); const t=new THREE.CanvasTexture(c); t.anisotropy=4; return t; }
function sandTexture(rx,ry,base){ const t=canvasTex(256,256,(g,w,h)=>{ g.fillStyle=base||'#d6b685'; g.fillRect(0,0,w,h); for(let i=0;i<3200;i++){ g.fillStyle=Math.random()<.5?'rgba(120,85,45,.12)':'rgba(255,240,210,.18)'; g.fillRect(Math.random()*w,Math.random()*h,2,2); } });
  t.wrapS=t.wrapT=THREE.RepeatWrapping; t.repeat.set(rx,ry); return t; }
const lambert=c=>new THREE.MeshLambertMaterial({color:c});
function box(w,h,d,mat,x,y,z,parent){ const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat); m.position.set(x||0,y||0,z||0); m.castShadow=m.receiveShadow=true; if(parent) parent.add(m); return m; }

/* ---------- bonecos ---------- */
const GEO={ torso:new THREE.BoxGeometry(.55,.66,.32), leg:new THREE.BoxGeometry(.22,.68,.24), arm:new THREE.BoxGeometry(.16,.6,.18),
  head:new THREE.SphereGeometry(.2,12,10), hair:new THREE.SphereGeometry(.212,12,8,0,Math.PI*2,0,Math.PI*.5), hood:new THREE.SphereGeometry(.235,12,10),
  shoe:new THREE.BoxGeometry(.22,.1,.32), hand:new THREE.SphereGeometry(.08,8,6), legStripe:new THREE.BoxGeometry(.02,.66,.09), armStripe:new THREE.BoxGeometry(.02,.56,.08),
  plate:new THREE.PlaneGeometry(.3,.17), chest:new THREE.PlaneGeometry(.14,.08), mask:new THREE.PlaneGeometry(.22,.22), tee:new THREE.BoxGeometry(.2,.3,.01),
  ring:new THREE.RingGeometry(.45,.6,28) };
const MAT={ suit:lambert(0x13705f), dead:lambert(0x3b4744), stripe:lambert(0xf1f1e8), skin:lambert(0xe2b48f), hair:lambert(0x1a1410), shoe:lambert(0xf3f3f3),
  pink:lambert(0xe8336f), black:lambert(0x111111), tee:lambert(0xf6f6f6),
  ring:new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.85,side:THREE.DoubleSide}) };
const numMats={};
function numMat(n){ if(numMats[n]) return numMats[n]; const t=canvasTex(128,72,(g,w,h)=>{ g.fillStyle='#f4f4ee'; g.fillRect(0,0,w,h); g.fillStyle='#111'; g.font='bold 52px "DM Mono", monospace'; g.textAlign='center'; g.textBaseline='middle'; g.fillText(pad3(n),w/2,h/2+3); }); return numMats[n]=new THREE.MeshLambertMaterial({map:t}); }
const maskMats={};
function maskMat(sym){ if(maskMats[sym]) return maskMats[sym]; const t=canvasTex(64,64,(g)=>{ g.fillStyle='#0c0c0c'; g.fillRect(0,0,64,64); g.strokeStyle='#fff'; g.lineWidth=5; g.beginPath();
  if(sym==='o') g.arc(32,32,17,0,Math.PI*2); else if(sym==='^'){ g.moveTo(32,13); g.lineTo(51,47); g.lineTo(13,47); g.closePath(); } else g.rect(15,15,34,34); g.stroke(); }); return maskMats[sym]=new THREE.MeshBasicMaterial({map:t}); }
function mesh(geo,mat){ const m=new THREE.Mesh(geo,mat); m.castShadow=true; return m; }
// Frente do boneco = +z local. Pés na origem.
function makeHuman(o){
  const g=new THREE.Group(), suit=o.guard?MAT.pink:MAT.suit, legs=[], arms=[];
  const torso=mesh(GEO.torso,suit); torso.position.y=1.05; g.add(torso);
  for(const s of [-1,1]){
    const hip=new THREE.Group(); hip.position.set(s*.14,.72,0); const leg=mesh(GEO.leg,suit); leg.position.y=-.34; hip.add(leg);
    if(!o.guard){ const st=mesh(GEO.legStripe,MAT.stripe); st.position.set(s*.112,-.34,0); hip.add(st); }
    const sh=mesh(GEO.shoe,o.guard?MAT.black:MAT.shoe); sh.position.set(0,-.67,.04); hip.add(sh); g.add(hip); legs.push(hip);
    const sp=new THREE.Group(); sp.position.set(s*.36,1.34,0); const arm=mesh(GEO.arm,suit); arm.position.y=-.29; sp.add(arm);
    if(!o.guard){ const st=mesh(GEO.armStripe,MAT.stripe); st.position.set(s*.082,-.29,0); sp.add(st); }
    const hd=mesh(GEO.hand,o.guard?MAT.black:MAT.skin); hd.position.y=-.63; sp.add(hd); g.add(sp); arms.push(sp);
  }
  if(o.guard){ const hood=mesh(GEO.hood,suit); hood.position.set(0,1.62,-.05); g.add(hood); const head=mesh(GEO.head,MAT.black); head.position.y=1.6; g.add(head);
    const mk=new THREE.Mesh(GEO.mask,maskMat(o.symbol)); mk.position.set(0,1.6,.205); g.add(mk); }
  else { const head=mesh(GEO.head,MAT.skin); head.position.y=1.6; g.add(head); const hr=mesh(GEO.hair,MAT.hair); hr.position.set(0,1.63,-.02); hr.rotation.x=-.35; g.add(hr);
    const tee=new THREE.Mesh(GEO.tee,MAT.tee); tee.position.set(0,1.2,.161); g.add(tee); }
  if(o.number){ const back=new THREE.Mesh(GEO.plate,numMat(o.number)); back.position.set(0,1.12,-.165); back.rotation.y=Math.PI; g.add(back);
    const ch=new THREE.Mesh(GEO.chest,numMat(o.number)); ch.position.set(.17,1.22,.163); g.add(ch); }
  if(o.ring){ const ring=new THREE.Mesh(GEO.ring,MAT.ring); ring.rotation.x=-Math.PI/2; ring.position.y=.03; g.add(ring); }
  g.userData={legs,arms,phase:Math.random()*6};
  return g;
}
function animHuman(h,speed,dt){ if(speed<.05) return; const u=h.userData; u.phase+=dt*(3+speed*1.6); const a=Math.sin(u.phase)*.75;
  u.legs[0].rotation.x=a; u.legs[1].rotation.x=-a; u.arms[0].rotation.x=-a*.8; u.arms[1].rotation.x=a*.8; }
function poseHuman(h,legs,arms){ const u=h.userData; u.legs[0].rotation.x=legs[0]; u.legs[1].rotation.x=legs[1]; u.arms[0].rotation.x=arms[0]; u.arms[1].rotation.x=arms[1]; }
function kill(h){ h.traverse(o=>{ if(o.isMesh&&o.material===MAT.suit) o.material=MAT.dead; }); }
function guard(sym,x,z,ry,parent){ const g=makeHuman({guard:true,symbol:sym}); g.position.set(x,0,z); g.rotation.y=ry; g.scale.setScalar(1.06); parent.add(g); return g; }

/* ---------- estado do jogo ---------- */
const G={ mode:'menu', number:456, bots:[], prize:0, round:0, snap:null, R:null, arg:null };
function freshBots(){ const out=[]; for(let i=1;i<=PLAYERS;i++) if(i!==G.number) out.push(i); return out; }
function alive(){ return G.bots.length+1; }
// elimina uma fração dos outros jogadores (fora de cena); keep = números que não podem cair
function cull(frac,keep){ const pool=G.bots.filter(n=>!keep||!keep.includes(n)); const k=Math.round(pool.length*frac); const gone=new Set(shuffle(pool).slice(0,k));
  G.bots=G.bots.filter(n=>!gone.has(n)); G.prize+=k*PER_HEAD; return k; }
function removeBots(nums){ const s=new Set(nums); const before=G.bots.length; G.bots=G.bots.filter(n=>!s.has(n)); const k=before-G.bots.length; G.prize+=k*PER_HEAD; return k; }
function sampleBots(n,except){ return shuffle(G.bots.filter(x=>!except||!except.includes(x))).slice(0,n); }

/* ---------- telas e HUD ---------- */
const SCREENS=['#menu','#dorm','#result','#dalgona','#hud'];
function show(...ids){ SCREENS.forEach(s=>{ $(s).hidden=!ids.includes(s); }); }
const HUD={
  setup(o){
    $('#hEyebrow').textContent=o.eyebrow; $('#hTitle').textContent=o.title;
    $('#timer').hidden=!o.timer; $('#signal').hidden=!o.signal; $('#progress').style.visibility=o.progress?'visible':'hidden';
    $('#keys').textContent=o.keys||''; $('#keys').hidden=coarse||!o.keys;
    $('#song').textContent=''; $('#big').textContent=''; HUD.choice(''); setPad(o.pad||[]); $('#skip').hidden=true;
    document.body.classList.remove('red'); show('#hud'); HUD.stats();
  },
  timer(t){ const el=$('#timer'); el.textContent=t>=60?Math.floor(t/60)+':'+String(Math.floor(t%60)).padStart(2,'0'):t.toFixed(1); el.classList.toggle('low',t<10); },
  big(t){ $('#big').textContent=t; },
  sub(t){ $('#song').textContent=t; },
  choice(html,pos){ const c=$('#choice'); c.className='choice '+(pos||'bottom'); c.innerHTML=html; c.hidden=!html; return c; },
  stats(n){ $('#alive').textContent=n==null?alive():n; $('#prize').textContent=fmtW(G.prize); },
  progress(f){ $('#progFill').style.width=clamp(f,0,1)*100+'%'; },
  flash(t,ms){ HUD.big(t); clearTimeout(HUD._f); HUD._f=setTimeout(()=>{ if($('#big').textContent===t) HUD.big(''); },ms||1400); }
};

/* ---------- entrada ---------- */
const keys={fwd:false,back:false,left:false,right:false,act:false,alt:false};
const KEYMAP={ArrowUp:'fwd',KeyW:'fwd',ArrowDown:'back',KeyS:'back',ArrowLeft:'left',KeyA:'left',ArrowRight:'right',KeyD:'right',Space:'act',KeyE:'alt'};
function clearKeys(){ for(const k in keys) keys[k]=false; document.querySelectorAll('#pad button.on').forEach(b=>b.classList.remove('on')); }
addEventListener('keydown',e=>{ if(G.mode!=='play') return; const k=KEYMAP[e.code]; if(!k) return; e.preventDefault(); if(!keys[k]&&!e.repeat&&G.R&&G.R.press) G.R.press(k); keys[k]=true; });
addEventListener('keyup',e=>{ const k=KEYMAP[e.code]; if(k) keys[k]=false; });
addEventListener('blur',clearKeys);
// botões de toque: [{a:'fwd',label:'CORRER',cls:'big'}] ou {gap:true} para separar grupos
function setPad(list){
  const pad=$('#pad'); pad.innerHTML=''; pad.hidden=!coarse||!list.length; pad.className='pad'+(list.some(b=>b.gap)?' wide':'');
  let cluster=document.createElement('div'); cluster.className='cluster'; pad.appendChild(cluster);
  list.forEach(o=>{
    if(o.gap){ cluster=document.createElement('div'); cluster.className='cluster'; pad.appendChild(cluster); return; }
    const b=document.createElement('button'); b.type='button'; b.textContent=o.label; if(o.cls) b.className=o.cls; if(o.aria) b.setAttribute('aria-label',o.aria);
    const on=e=>{ e.preventDefault(); if(!keys[o.a]&&G.R&&G.R.press) G.R.press(o.a); keys[o.a]=true; b.classList.add('on'); try{ b.setPointerCapture(e.pointerId); }catch(_){} };
    const off=()=>{ keys[o.a]=false; b.classList.remove('on'); };
    b.addEventListener('pointerdown',on); ['pointerup','pointercancel','lostpointercapture'].forEach(ev=>b.addEventListener(ev,off)); b.addEventListener('contextmenu',e=>e.preventDefault());
    cluster.appendChild(b);
  });
}
