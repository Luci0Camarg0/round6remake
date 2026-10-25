'use strict';
/* Rodada 1 — Batatinha Frita 1, 2, 3. Também serve de cenário para o menu. */
const R1=(function(){
  const START_Z=44, FINISH_Z=-36, TIME=60, VISIBLE=79;
  const ENV={bg:0x8fcbec,fog:[0x9fd2ee,80,180],sky:0xe6f4ff,ground:0xb08a5a,hemi:.8,sun:.8,sunPos:[-20,45,25]};
  const w=new THREE.Group(), crowd=new THREE.Group(); w.add(crowd);

  function skyMural(){ return canvasTex(1024,256,(g,cw,h)=>{
    const gr=g.createLinearGradient(0,0,0,h); gr.addColorStop(0,'#4b9fd6'); gr.addColorStop(1,'#b4e0f5'); g.fillStyle=gr; g.fillRect(0,0,cw,h);
    g.fillStyle='rgba(255,255,255,.95)';
    for(let i=0;i<14;i++){ const x=Math.random()*cw, y=30+Math.random()*h*.5, s=16+Math.random()*26; for(let k=0;k<5;k++){ g.beginPath(); g.ellipse(x+k*s*.7,y+(k%2?-s*.3:0),s,s*.6,0,0,Math.PI*2); g.fill(); } }
    g.fillStyle='#6f9d5b'; g.fillRect(0,h-22,cw,22); g.fillStyle='#5a8a49'; for(let x=0;x<cw;x+=14){ g.beginPath(); g.arc(x,h-22,9,Math.PI,0); g.fill(); }
  }); }
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(46,124),new THREE.MeshLambertMaterial({map:sandTexture(8,24)}));
  ground.rotation.x=-Math.PI/2; ground.position.z=-2; ground.receiveShadow=true; w.add(ground);
  function wall(cw,h,x,z,ry){ const m=new THREE.Mesh(new THREE.PlaneGeometry(cw,h),new THREE.MeshBasicMaterial({map:skyMural(),fog:false})); m.position.set(x,h/2,z); m.rotation.y=ry; w.add(m); }
  wall(124,24,-23,-2,Math.PI/2); wall(124,24,23,-2,-Math.PI/2); wall(46,24,0,-64,0); wall(46,24,0,60,Math.PI);
  function line(z,c){ const m=new THREE.Mesh(new THREE.PlaneGeometry(46,.4),new THREE.MeshBasicMaterial({color:c})); m.rotation.x=-Math.PI/2; m.position.set(0,.02,z); w.add(m); }
  line(START_Z-1.2,0xc22b2b); line(FINISH_Z,0xc22b2b);

  (function tree(){ const bark=lambert(0x6b4a2f), t=new THREE.Group();
    const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.45,.7,10,10),bark); trunk.position.y=5; t.add(trunk);
    [[.9,7,.6],[-.8,8,-.7],[.5,9,.9],[-.6,6,1],[0,9.6,-.3]].forEach(([rz,y,rx])=>{ const b=new THREE.Mesh(new THREE.CylinderGeometry(.12,.25,4,6),bark); b.position.y=y; b.rotation.set(rx*.6,0,rz); b.position.x=Math.sin(rz)*-1.6; t.add(b); });
    t.traverse(o=>{ if(o.isMesh) o.castShadow=true; }); t.position.set(0,0,-56); w.add(t); })();

  const eyeMat=new THREE.MeshLambertMaterial({color:0x111111,emissive:0x000000});
  const doll=(function(){ const d=new THREE.Group();
    const skin=lambert(0xf3d2b5), dress=lambert(0xf08a24), shirt=lambert(0xf7d33c), hair=lambert(0x151515), sock=lambert(0xffffff), shoe=lambert(0x8a5a2b);
    const add=(geo,mat,x,y,z)=>{ const m=new THREE.Mesh(geo,mat); m.position.set(x,y,z); d.add(m); return m; };
    for(const s of [-1,1]){ add(new THREE.BoxGeometry(.75,.4,1.1),shoe,s*.55,.2,.12); add(new THREE.CylinderGeometry(.33,.33,.6,12),sock,s*.55,.7,0); add(new THREE.CylinderGeometry(.3,.3,1.5,12),skin,s*.55,1.7,0);
      add(new THREE.SphereGeometry(.42,12,10),shirt,s*1.0,5.55,0); const arm=add(new THREE.CylinderGeometry(.2,.18,1.7,10),skin,s*1.12,4.7,0); arm.rotation.z=s*.12;
      add(new THREE.SphereGeometry(.48,14,12),hair,s*1.15,7.25,-.25); add(new THREE.SphereGeometry(.14,8,8),shirt,s*.95,7.6,-.1);
      add(new THREE.SphereGeometry(.15,10,10),eyeMat,s*.38,7.05,1.02); }
    add(new THREE.CylinderGeometry(.95,2.0,2.4,24),dress,0,3.4,0);
    add(new THREE.CylinderGeometry(.82,.95,1.3,20),shirt,0,5.2,0);
    add(new THREE.SphereGeometry(1.15,24,18),skin,0,7.0,0);
    const cap=add(new THREE.SphereGeometry(1.21,24,16,0,Math.PI*2,0,Math.PI*.56),hair,0,7.05,-.05); cap.rotation.x=-.55;
    add(new THREE.BoxGeometry(.3,.08,.05),lambert(0xd9576d),0,6.55,1.1);
    d.traverse(o=>{ if(o.isMesh) o.castShadow=true; });
    d.scale.setScalar(1.3); d.position.set(0,0,-48); d.rotation.y=Math.PI; w.add(d); return d; })();

  [[-15,-30,'o'],[-15,-12,'^'],[-15,8,'□'],[15,-30,'□'],[15,-12,'o'],[15,8,'^'],[-6,-46,'^'],[6,-46,'o']].forEach(([x,z,s])=>
    guard(s,x,z,Math.abs(x)>10?(x<0?Math.PI/2:-Math.PI/2):0,w));

  let actors=[], player=null, rl=null, hidden=[];
  function spawn(nums,withPlayer){
    actors.forEach(a=>crowd.remove(a.h)); actors=[]; player=null;
    nums.forEach(n=>{ const h=makeHuman({number:n}); const a={h,num:n,x:rand(-18,18),z:rand(START_Z,START_Z+4),speed:0,lat:0,max:rand(2.2,4.4),delay:rand(0,.5),stopAt:0,state:'run',fall:0};
      if(Math.random()<.12) a.max=rand(1.5,2.1); h.position.set(a.x,0,a.z); h.rotation.y=Math.PI; crowd.add(h); actors.push(a); });
    if(withPlayer){ const h=makeHuman({number:G.number,ring:true}); player={h,num:G.number,x:0,z:START_Z+1,speed:0,lat:0,state:'run',fall:0,isPlayer:true};
      h.position.set(0,0,player.z); h.rotation.y=Math.PI; crowd.add(h); actors.push(player); }
  }
  const living=()=>hidden.length+actors.filter(a=>a.state!=='dead'&&a.state!=='marked').length;

  function menu(){ setEnv(ENV); useWorld(w); spawn(shuffle(freshBots()).slice(0,VISIBLE),false); doll.rotation.y=Math.PI; eyeMat.emissive.setHex(0); }
  function attract(){ const t=clock*.07; camera.position.set(Math.sin(t)*26,9+Math.sin(t*.7)*2,30+Math.cos(t)*14); camLook.set(0,3,-10); camera.lookAt(camLook); doll.rotation.y=Math.PI+Math.sin(clock*.3)*.3; }

  function start(){
    setEnv(ENV); useWorld(w);
    const pick=shuffle(G.bots.slice()); const vis=pick.slice(0,VISIBLE); hidden=pick.slice(VISIBLE);
    spawn(vis,true);
    rl={phase:'intro',t:0,dur:3,time:TIME,syl:0,shown:0,since:0,fast:false,queue:[],lastShot:-9,endAt:null};
    doll.rotation.y=Math.PI; eyeMat.emissive.setHex(0); clearKeys();
    HUD.setup({eyebrow:'Rodada 1',title:'Batatinha Frita 1, 2, 3',timer:true,signal:true,progress:true,
      keys:'Segure ↑ ou W para correr · ← → para desviar · pare quando ela virar',
      pad:[{a:'left',label:'◀',aria:'Esquerda'},{a:'fwd',label:'CORRER',cls:'big'},{a:'right',label:'▶',aria:'Direita'}]});
    setSignal('','AGUARDE'); hud();
    camera.position.set(0,4,START_Z+8); camLook.set(0,2,START_Z-14); audio();
  }
  function setSignal(cls,txt){ $('#signal').className='signal '+cls; $('#signalText').textContent=txt; document.body.classList.toggle('red',cls==='stop'); }
  const SYL=['Ba','ta','ti','nha','fri','ta','1,','2,','3!'], SONG=[392,392,440,392,523,494,440,392,330];
  function go(ph){
    rl.phase=ph; rl.t=0;
    if(ph==='green'){ rl.dur=rand(2.3,5.2)*(rl.time<20?.8:1); rl.syl=rl.dur/9.4; rl.shown=0; HUD.sub(''); setSignal('go','SIGA');
      actors.forEach(a=>{ if(!a.isPlayer) a.delay=rand(0,.45); }); }
    if(ph==='turn'){ rl.since=0; setSignal('stop','PARE'); tone(110,.5,'sawtooth',.06);
      const fate=rl.time<15?.12:.055;
      actors.forEach(a=>{ if(!a.isPlayer&&a.state==='run') a.stopAt=Math.random()<fate?rand(.8,1.3):rand(.05,.4); }); }
    if(ph==='red'){ rl.dur=rand(1.8,3.6); eyeMat.emissive.setHex(0xff2040); tone(880,.12,'square',.05); tone(880,.12,'square',.05,.18); }
    if(ph==='back'){ eyeMat.emissive.setHex(0); setSignal('','…'); }
  }
  function mark(a){ if(a.state==='dead'||a.state==='marked') return; a.state='marked'; const at=Math.max(clock,rl.lastShot+.22); rl.lastShot=at; rl.queue.push({a,at}); }
  function execute(a){ a.state='dead'; a.fall=0; a.speed=0; kill(a.h); shot(); G.prize+=PER_HEAD; hud();
    if(a.isPlayer) setTimeout(()=>{ if(G.R===R1&&G.mode==='play') lose('Você se mexeu quando a boneca olhou.'); },2200); }
  function timeUp(){ if(rl.phase==='over') return; rl.phase='over'; setSignal('stop','TEMPO ESGOTADO'); eyeMat.emissive.setHex(0xff2040);
    actors.forEach(a=>{ if(a.state==='run') mark(a); }); rl.endAt='queue'; }
  function finish(){
    const vis=actors.filter(a=>!a.isPlayer), lost=vis.filter(a=>a.state==='dead').length, rate=clamp(lost/Math.max(1,vis.length)*rand(.9,1.1),0,.8);
    const hiddenLost=Math.round(hidden.length*rate); shuffle(hidden); const survivors=hidden.slice(hiddenLost);
    G.prize+=hiddenLost*PER_HEAD; G.bots=vis.filter(a=>a.state==='safe').map(a=>a.num).concat(survivors); hidden=[];
    win({lost:lost+hiddenLost});
  }
  $('#skip').addEventListener('click',()=>{ if(G.R!==R1||G.mode!=='play'||!rl) return;
    actors.forEach(a=>{ if(a.state==='run'||a.state==='marked'){ if(Math.random()<.4){ a.state='dead'; kill(a.h); a.fall=1; a.h.rotation.x=-Math.PI/2; a.h.position.y=.15; G.prize+=PER_HEAD; } else a.state='safe'; } });
    rl.queue=[]; finish(); });

  function update(dtReal){
    const dt=dtReal*(rl.fast?3:1); rl.t+=dt;
    if(rl.phase!=='intro'&&rl.phase!=='over'){ rl.time-=dt; if(rl.time<=0){ rl.time=0; timeUp(); } }
    switch(rl.phase){
      case 'intro':{ const left=3-rl.t; HUD.big(left>0?Math.ceil(left):''); if(rl.t>=3){ HUD.big(''); go('green'); } break; }
      case 'green':{ const n=Math.min(9,Math.floor(rl.t/rl.syl)+1); while(rl.shown<n){ const s=document.createElement('span'); s.textContent=SYL[rl.shown]+(rl.shown===3?' ':rl.shown<8?' ':''); $('#song').appendChild(s); tone(SONG[rl.shown],.22,'triangle',.1); rl.shown++; }
        if(rl.t>=rl.dur) go('turn'); break; }
      case 'turn': rl.since+=dt; doll.rotation.y=Math.PI*(1-ease(clamp(rl.t/.45,0,1))); if(rl.t>=.45) go('red'); break;
      case 'red': rl.since+=dt; if(rl.t>=rl.dur) go('back'); break;
      case 'back': doll.rotation.y=Math.PI*ease(clamp(rl.t/.45,0,1)); if(rl.t>=.45) go('green'); break;
    }
    const detecting=rl.phase==='red'&&rl.t>.15;
    for(const a of actors){
      if(a.isPlayer){
        const can=(rl.phase==='green'||rl.phase==='turn'||rl.phase==='red'||rl.phase==='back')&&a.state==='run';
        const lr=(keys.right?1:0)-(keys.left?1:0), target=can&&(keys.fwd||keys.act)?5.5:0;
        a.speed+=(target-a.speed)*Math.min(1,dt*(target>a.speed?6:18));
        a.lat+=((can?lr*3:0)-a.lat)*Math.min(1,dt*(can&&lr?8:18));
        if(a.state==='run'||a.state==='safe'){ a.z-=a.speed*dt; a.x=clamp(a.x+a.lat*dt,-19,19); }
        if(detecting&&a.state==='run'&&Math.hypot(a.speed,a.lat)>.3) mark(a);
        if(a.state==='run'&&a.z<FINISH_Z){ a.state='safe'; rl.fast=true; HUD.flash('PASSOU!',1600); $('#skip').hidden=false; fanfare(); }
      } else if(a.state==='run'||a.state==='safe'){
        let moving=false;
        if(a.state==='safe') moving=a.z>FINISH_Z-3-(a.num%5);
        else if(rl.phase==='green') moving=rl.t>a.delay;
        else if(rl.phase==='turn'||rl.phase==='red') moving=rl.since<a.stopAt;
        const target=moving?a.max*(rl.time<12?1.25:1):0;
        a.speed+=(target-a.speed)*Math.min(1,dt*(moving?4:25)); a.z-=a.speed*dt;
        if(detecting&&a.state==='run'&&a.speed>.3) mark(a);
        if(a.state==='run'&&a.z<FINISH_Z) a.state='safe';
      }
      if(a.state==='dead'&&a.fall<1){ a.fall=Math.min(1,a.fall+dt/.5); a.h.rotation.x=-Math.PI/2*ease(a.fall); a.h.position.y=.15*a.fall; }
      else if(a.state!=='dead'){ a.h.position.set(a.x,0,a.z); animHuman(a.h,a.speed,dt); }
    }
    while(rl.queue.length&&rl.queue[0].at<=clock) execute(rl.queue.shift().a);
    if(rl.phase==='over'&&rl.endAt==='queue'&&!rl.queue.length) rl.endAt=clock+2.2;
    if(typeof rl.endAt==='number'&&clock>=rl.endAt&&player.state!=='dead'){ rl.endAt=null; finish(); }
    hud();
  }
  function hud(){ if(!rl) return; HUD.timer(rl.time); HUD.stats(living()); if(player) HUD.progress((START_Z+1-player.z)/(START_Z+1-FINISH_Z)); }
  function cam(dt){
    if(!player) return; let tp,tl;
    if(player.state==='safe'){ tp=V3(0,14,FINISH_Z-10); tl=V3(0,0,12); }
    else if(player.state==='dead'||player.state==='marked'){ tp=V3(player.x+4,5,player.z+5); tl=V3(player.x,.4,player.z); }
    else { tp=V3(player.x*.85,3.4,player.z+6.2); tl=V3(player.x*.6,2.4,player.z-14); }
    camTo(tp,tl,dt);
  }
  return {start,update,cam,menu,attract};
})();
