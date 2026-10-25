'use strict';
/* Rodada 5 — Ponte de Vidro. 18 pares de painéis: um temperado, outro comum. */
const R5=(function(){
  const ENV={bg:0x04060b,fog:[0x04060b,30,95],sky:0x8c9cff,ground:0x101010,hemi:.5,sun:.9,sunColor:0xdde8ff,sunPos:[6,30,12],sunTarget:[0,0,-20]};
  const STEPS=18, GAP=2.4, TIME=240, HINT_COST=15;
  const stepZ=k=>-1.6-k*GAP, END_Z=stepZ(STEPS-1)-4, sideX=s=>s?1:-1;
  let w=null, panels=[], shards=[], people=[], S=null;
  const glassMat=()=>new THREE.MeshPhongMaterial({color:0xbfe8ff,transparent:true,opacity:.38,shininess:120,specular:0xffffff});

  function build(){
    w=new THREE.Group();
    const metal=lambert(0x59626b), neon=new THREE.MeshBasicMaterial({color:0xe8336f});
    box(6,1,6,metal,0,-.5,3,w); box(6,1,6,metal,0,-.5,END_Z,w);
    const len=-(stepZ(STEPS-1))+3, mid=(stepZ(0)+stepZ(STEPS-1))/2;
    for(const x of [-1.9,-.1,.1,1.9]) box(.12,.2,len,metal,x,-.16,mid,w);
    for(const z of [6,END_Z-3]) for(const x of [-3,3]){ const p=new THREE.Mesh(new THREE.BoxGeometry(.25,5,.25),neon); p.position.set(x,2.5,z); w.add(p); }
    for(let k=0;k<STEPS;k++){ panels.push([0,1].map(s=>{ const m=new THREE.Mesh(new THREE.BoxGeometry(1.5,.1,1.6),glassMat()); m.position.set(sideX(s),-.05,stepZ(k)); m.receiveShadow=true; w.add(m); return m; })); }
    const pts=[]; for(let i=0;i<500;i++) pts.push(rand(-60,60),rand(-60,-30),rand(-90,30));
    const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(pts,3));
    w.add(new THREE.Points(g,new THREE.PointsMaterial({color:0x9fb4ff,size:.25})));
    guard('^',-2.2,4.5,Math.PI*.15,w); guard('□',2.2,END_Z-1.5,Math.PI,w);
  }

  function start(){
    if(!w) build(); setEnv(ENV); useWorld(w);
    people.forEach(p=>w.remove(p.h)); people=[]; shards.forEach(s=>w.remove(s.m)); shards=[];
    panels.forEach(pair=>pair.forEach(m=>{ m.visible=true; m.material.color.setHex(0xbfe8ff); m.material.opacity=.38; }));
    const n=G.bots.length+1;
    S={phase:'choose',time:TIME,n,correct:Array.from({length:STEPS},()=>Math.random()<.5?0:1),known:Array(STEPS).fill(null),broken:Array.from({length:STEPS},()=>[false,false]),
       order:[],cur:0,wait:0,hint:'',fast:false,endAt:0};
    clearKeys();
    HUD.setup({eyebrow:'Rodada 5',title:'Ponte de Vidro',timer:true,keys:'← → para escolher o vidro · E para olhar o reflexo'});
    HUD.timer(TIME); HUD.sub('');
    const c=HUD.choice(`<p>Escolha seu colete. Ele define a ordem de travessia: quem vai na frente descobre os vidros, quem vai atrás aproveita o caminho.</p>
      <div class="vests">${Array.from({length:n},(_,i)=>`<button type="button" data-v="${i}">${i+1}</button>`).join('')}</div>`);
    c.querySelectorAll('[data-v]').forEach(b=>b.addEventListener('click',()=>begin(+b.dataset.v)));
    camera.position.set(9,7,8); camLook.set(0,0,-16); camera.lookAt(camLook); audio();
  }
  function begin(slot){
    if(S.phase!=='choose') return;
    const bots=shuffle(G.bots.slice()); const nums=bots.slice(); nums.splice(slot,0,G.number);
    nums.forEach((num,i)=>{ const isPlayer=num===G.number, h=makeHuman({number:num,ring:isPlayer}); const col=i%5,row=Math.floor(i/5);
      const p={num,h,isPlayer,pos:-1,x:-2+col,y:0,z:1.6+row*.9,state:'wait',vy:0,hop:null};
      h.position.set(p.x,0,p.z); h.rotation.y=Math.PI; w.add(h); people.push(p); });
    S.phase='run'; S.cur=0; S.wait=.8;
    HUD.choice(''); HUD.sub(`Você é o ${slot+1}º da fila`);
  }
  const current=()=>people[S.cur];

  function playerUI(){
    const p=current(), next=p.pos+1, k=S.known[next];
    let txt=next>=STEPS?'Último salto até a plataforma.':k!=null?'Alguém já passou por aqui. Você lembra qual vidro aguentou?':'Ninguém pisou aqui ainda.';
    const c=HUD.choice(`<p>Degrau ${Math.min(next+1,STEPS)} de ${STEPS}. ${txt}</p>${S.hint?`<p class="cue">${S.hint}</p>`:''}
      <div class="row"><button class="btn" data-s="0" type="button">◀ Esquerda</button><button class="btn" data-s="1" type="button">Direita ▶</button></div>
      ${next<STEPS&&k==null?`<div class="row"><button class="btn ghost" id="look" type="button">Olhar o reflexo (−${HINT_COST}s)</button></div>`:''}`);
    c.querySelectorAll('[data-s]').forEach(b=>b.addEventListener('click',()=>playerJump(+b.dataset.s)));
    const lk=c.querySelector('#look'); if(lk) lk.addEventListener('click',look);
  }
  function look(){ const p=current(); if(!p||!p.isPlayer||p.hop||S.hint) return; const next=p.pos+1; if(next>=STEPS||S.known[next]!=null) return;
    S.time-=HINT_COST; const right=Math.random()<.8, s=right?S.correct[next]:1-S.correct[next];
    S.hint=`Com a luz batendo, o vidro da ${s?'direita':'esquerda'} parece mais grosso.`; tone(990,.08,'sine',.05); playerUI(); }
  function press(a){ const p=current(); if(S.phase!=='run'||!p||!p.isPlayer||p.hop) return;
    if(a==='left') playerJump(0); else if(a==='right') playerJump(1); else if(a==='alt') look(); }
  function playerJump(s){ const p=current(); if(!p||!p.isPlayer||p.hop||p.state!=='go') return; HUD.choice(''); S.hint=''; jump(p,s); }

  function jump(p,s){
    const next=p.pos+1, to=next>=STEPS?V3(rand(-1.5,1.5),0,END_Z+rand(-1.5,1.5)):V3(sideX(s),0,stepZ(next));
    p.hop={from:V3(p.x,p.y,p.z),to,t:0,side:s,next,dur:!p.isPlayer&&(next>=STEPS||S.known[next]!=null)?.26:.45}; tone(300+next*20,.08,'triangle',.05);
  }
  function land(p){
    const {to,side,next}=p.hop; p.hop=null; p.x=to.x; p.z=to.z; p.y=0;
    if(next>=STEPS){ p.state='safe'; if(p.isPlayer){ fanfare(); HUD.flash('ATRAVESSOU!',1800); $('#skip').hidden=false; S.fast=true; } advance(); return; }
    if(S.broken[next][side]){ fall(p); return; }
    if(side===S.correct[next]){ p.pos=next; S.known[next]=side; const m=panels[next][side]; m.material.color.setHex(0xf2fbff); m.material.opacity=.6; S.wait=p.isPlayer?.1:(next+1>=STEPS||S.known[next+1]!=null?.05:rand(.35,.6)); return; }
    S.broken[next][side]=true; S.known[next]=1-side; const m=panels[next][side]; m.visible=false; burst(m.position); fall(p);
  }
  function burst(pos){ noise(.5,.35,6000); for(let i=0;i<14;i++){ const m=new THREE.Mesh(new THREE.BoxGeometry(rand(.15,.4),.04,rand(.15,.4)),glassMat()); m.position.copy(pos).add(V3(rand(-.6,.6),0,rand(-.6,.6))); w.add(m); shards.push({m,v:V3(rand(-1,1),rand(0,2),rand(-1,1)),r:V3(rand(-4,4),rand(-4,4),rand(-4,4))}); } }
  function fall(p){ p.state='fall'; p.vy=0; kill(p.h); G.prize+=PER_HEAD; tone(90,.6,'sine',.15);
    if(p.isPlayer){ setTimeout(()=>{ if(G.R===R5&&G.mode==='play') lose('O vidro era comum. Você caiu da ponte.'); },2200); }
    advance(); }
  function advance(){ S.cur++; S.wait=S.fast?.2:.9; S.hint=''; if(S.cur>=people.length) S.endAt=clock+2; }
  function timeUp(){ if(S.phase!=='run') return; S.phase='over'; HUD.flash('TEMPO ESGOTADO',2000); noise(1,.4,5000);
    people.forEach(p=>{ if(p.state==='wait'||p.state==='go'){ p.state='fall'; p.vy=0; kill(p.h); G.prize+=PER_HEAD; } });
    panels.forEach(pair=>pair.forEach(m=>{ if(m.visible){ m.visible=false; burst(m.position); } }));
    const me=people.find(p=>p.isPlayer); if(me&&me.state==='fall') setTimeout(()=>{ if(G.R===R5) lose('O tempo acabou e os vidros estouraram com você na ponte.'); },2200);
    else S.endAt=clock+2.5; }
  $('#skip').addEventListener('click',()=>{ if(G.R!==R5||G.mode!=='play'||!S) return;
    for(let i=S.cur;i<people.length;i++){ const p=people[i]; let ok=true;
      for(let k=Math.max(0,p.pos+1);k<STEPS;k++){ if(S.known[k]==null){ const g=Math.random()<.5?0:1; if(g!==S.correct[k]){ S.known[k]=1-g; ok=false; break; } S.known[k]=g; } }
      if(ok) p.state='safe'; else { p.state='fall'; G.prize+=PER_HEAD; } }
    S.cur=people.length; finish(); });
  function finish(){ const me=people.find(p=>p.isPlayer); if(!me||me.state!=='safe'){ S.endAt=0; return; } S.phase='done'; const fallen=people.filter(p=>!p.isPlayer&&p.state!=='safe').map(p=>p.num); G.bots=G.bots.filter(n=>!fallen.includes(n)); win({lost:fallen.length}); }

  function update(dtReal){
    const dt=dtReal*(S.fast?2.5:1);
    for(let i=shards.length-1;i>=0;i--){ const s=shards[i]; s.v.y-=20*dtReal; s.m.position.addScaledVector(s.v,dtReal); s.m.rotation.x+=s.r.x*dtReal; s.m.rotation.z+=s.r.z*dtReal; if(s.m.position.y<-45){ w.remove(s.m); shards.splice(i,1); } }
    for(const p of people){
      if(p.hop){ p.hop.t+=dt/p.hop.dur; const t=Math.min(1,p.hop.t), f=p.hop.from, to=p.hop.to; p.x=f.x+(to.x-f.x)*t; p.z=f.z+(to.z-f.z)*t; p.y=Math.sin(Math.PI*t)*.8; if(t>=1) land(p); }
      if(p.state==='fall'){ p.vy-=20*dtReal; p.y+=p.vy*dtReal; p.h.rotation.x+=dtReal*2; }
      p.h.position.set(p.x,p.y,p.z); if(p.y<-60) p.h.visible=false;
    }
    if(S.phase==='run'){
      S.time-=dtReal; if(S.time<=0){ S.time=0; timeUp(); }
      const p=current();
      if(p&&!p.hop&&S.phase==='run'){
        if(p.state==='wait'){ p.state='go'; p.x=0; p.z=.4; p.pos=-1; S.wait=p.isPlayer?0:.6; if(p.isPlayer){ HUD.sub('Sua vez.'); playerUI(); } }
        else if(p.state==='go'){
          if(p.isPlayer){ if(!$('#choice').innerHTML) playerUI(); }
          else { S.wait-=dt; if(S.wait<=0){ const next=p.pos+1; const k=next<STEPS?S.known[next]:0; if(next<STEPS&&k==null&&!p.think){ p.think=true; S.wait=rand(.5,1.2); } else { p.think=false; jump(p,k!=null?k:(Math.random()<.5?0:1)); } } }
        }
      }
      if(S.endAt&&clock>=S.endAt) finish();
    } else if(S.phase==='over'&&S.endAt&&clock>=S.endAt) finish();
    HUD.timer(Math.max(0,S.time)); HUD.stats(alive()-people.filter(p=>!p.isPlayer&&p.state==='fall').length);
  }
  function cam(dt){
    if(S.phase==='choose') return;
    const me=people.find(p=>p.isPlayer); const p=(me&&me.state==='fall')?me:(current()||me); if(!p) return;
    camTo(V3(p.x*.4+2.2,Math.max(p.y,-6)+5,p.z+5.2),V3(p.x*.3,Math.max(p.y,-8)-.5,p.z-6),dt,3);
  }
  return {start,update,cam,press};
})();
