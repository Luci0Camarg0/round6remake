'use strict';
/* Rodada 6 — Jogo da Lula. Duelo final: o atacante precisa tocar a cabeça da lula sem ser empurrado para fora. */
const R6=(function(){
  const ENV={bg:0x3a4350,fog:[0x3a4350,18,60],sky:0xb8c4d4,ground:0x4a4038,hemi:.65,sun:.5,sunColor:0xd8e0ea,sunPos:[-8,30,14]};
  const WAIST=3, GOAL={x:0,z:-14};
  const inCircle=(x,z,cx,cz,r)=>(x-cx)**2+(z-cz)**2<=r*r;
  const inCourt=(x,z)=>inCircle(x,z,0,13,3)||(Math.abs(x)<5&&z>-3&&z<10.5)||(z>=-12&&z<=-3&&Math.abs(x)<=8*(z+12)/9)||inCircle(x,z,GOAL.x,GOAL.z,2.6);
  let w=null, rain=null, me=null, foe=null, S=null;

  function build(){
    w=new THREE.Group();
    const big=new THREE.Mesh(new THREE.PlaneGeometry(140,140),new THREE.MeshLambertMaterial({map:sandTexture(20,20,'#8a7660')})); big.rotation.x=-Math.PI/2; big.position.y=-.01; big.receiveShadow=true; w.add(big);
    const tex=canvasTex(1024,1024,(g,cw)=>{ const s=cw/40, X=x=>(x+20)*s, Y=z=>(z+20)*s;
      g.fillStyle='#8f7b63'; g.fillRect(0,0,cw,cw); for(let i=0;i<9000;i++){ g.fillStyle=Math.random()<.5?'rgba(60,40,20,.12)':'rgba(255,240,210,.12)'; g.fillRect(Math.random()*cw,Math.random()*cw,3,3); }
      g.strokeStyle='rgba(245,240,230,.92)'; g.lineWidth=9; g.lineJoin='round';
      g.beginPath(); g.arc(X(0),Y(13),3*s,0,Math.PI*2); g.stroke();
      g.strokeRect(X(-5),Y(-3),10*s,13.5*s);
      g.beginPath(); g.moveTo(X(-8),Y(-3)); g.lineTo(X(0),Y(-12)); g.lineTo(X(8),Y(-3)); g.closePath(); g.stroke();
      g.beginPath(); g.arc(X(0),Y(-14),2.6*s,0,Math.PI*2); g.stroke();
      g.setLineDash([24,18]); g.beginPath(); g.moveTo(X(-5),Y(WAIST)); g.lineTo(X(5),Y(WAIST)); g.stroke(); g.setLineDash([]);
      g.fillStyle='rgba(232,51,111,.55)'; g.beginPath(); g.arc(X(0),Y(-14),1.1*s,0,Math.PI*2); g.fill(); });
    const court=new THREE.Mesh(new THREE.PlaneGeometry(40,40),new THREE.MeshLambertMaterial({map:tex})); court.rotation.x=-Math.PI/2; court.receiveShadow=true; w.add(court);
    const syms=['o','^','□'];
    for(let i=0;i<10;i++){ const a=i/10*Math.PI*2, r=17; guard(syms[i%3],Math.cos(a)*r,Math.sin(a)*r,Math.atan2(-Math.cos(a),-Math.sin(a)),w); }
    const n=1400, pos=new Float32Array(n*6);
    for(let i=0;i<n;i++){ const x=rand(-25,25), y=rand(0,22), z=rand(-25,25); pos.set([x,y,z,x+.05,y-.6,z],i*6); }
    const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.BufferAttribute(pos,3));
    rain=new THREE.LineSegments(g,new THREE.LineBasicMaterial({color:0xc8d4e4,transparent:true,opacity:.45})); w.add(rain);
  }

  function start(){
    if(!w) build(); setEnv(ENV); useWorld(w);
    if(me) w.remove(me.h); if(foe) w.remove(foe.h);
    const fn=G.bots[0]||randi(1,455);
    me={h:makeHuman({number:G.number,ring:true}),x:0,z:13,kx:0,kz:0,cd:0,face:Math.PI,push:0};
    foe={h:makeHuman({number:fn}),x:0,z:-8,kx:0,kz:0,cd:1.2,face:0,push:0,num:fn};
    w.add(me.h); w.add(foe.h);
    S={phase:'intro',t:0,crossed:false,end:0};
    clearKeys();
    HUD.setup({eyebrow:'Rodada 6 · Final',title:'Jogo da Lula',progress:true,
      keys:'Setas ou WASD para mover · Espaço para empurrar',
      pad:[{a:'left',label:'◀',aria:'Esquerda'},{a:'fwd',label:'▲',aria:'Frente'},{a:'back',label:'▼',aria:'Trás'},{a:'right',label:'▶',aria:'Direita'},{gap:true},{a:'act',label:'EMPURRAR',cls:'act'}]});
    HUD.sub(`Você contra o jogador ${pad3(fn)}. Pule num pé só até cruzar a cintura.`);
    camera.position.set(0,8,22); camLook.set(0,0,4); audio();
  }
  function press(a){ if(a!=='act'||S.phase!=='play'||me.cd>0) return; me.cd=.8; me.push=.3; shove(me,foe,9.5); }
  function shove(from,to,force){ const dx=to.x-from.x, dz=to.z-from.z, d=Math.hypot(dx,dz);
    if(d<1.7&&d>0){ to.kx+=dx/d*force; to.kz+=dz/d*force; noise(.12,.25,500); tone(90,.12,'sine',.15); } else tone(200,.05,'triangle',.03); }
  function move(o,vx,vz,dt){ o.kx*=Math.exp(-dt*4); o.kz*=Math.exp(-dt*4); o.x+=(vx+o.kx)*dt; o.z+=(vz+o.kz)*dt; o.cd=Math.max(0,o.cd-dt); o.push=Math.max(0,o.push-dt); }
  function face(o,vx,vz){ if(Math.hypot(vx,vz)>.2) o.face=Math.atan2(vx,vz); o.h.rotation.y=o.face; }

  function update(dt){
    S.t+=dt;
    const pos=rain.geometry.attributes.position, arr=pos.array;
    for(let i=0;i<arr.length;i+=6){ arr[i+1]-=24*dt; arr[i+4]-=24*dt; if(arr[i+4]<0){ arr[i+1]+=22; arr[i+4]+=22; } }
    pos.needsUpdate=true;
    if(S.phase==='intro'){ const left=3-S.t; HUD.big(left>0?Math.ceil(left):'JÁ!'); if(S.t>=3){ S.phase='play'; S.t=0; setTimeout(()=>{ if(S.phase==='play') HUD.big(''); },600); } }
    let vx=0,vz=0;
    if(S.phase==='play'){
      const ix=(keys.right?1:0)-(keys.left?1:0), iz=(keys.back?1:0)-(keys.fwd?1:0), il=Math.hypot(ix,iz)||1, sp=S.crossed?4.6:2.4;
      vx=ix/il*sp; vz=iz/il*sp;
      // defensor: fica entre você e a cabeça; se você chegar perto, parte para cima
      const dx=me.x-foe.x, dz=me.z-foe.z, d=Math.hypot(dx,dz);
      let tx=GOAL.x+(me.x-GOAL.x)*.42, tz=GOAL.z+(me.z-GOAL.z)*.42;
      if(d<3.2){ tx=me.x; tz=me.z; }
      if(!inCourt(tx,tz)){ tx*=.5; tz=clamp(tz,-10,8); }
      let bx=tx-foe.x, bz=tz-foe.z; const bl=Math.hypot(bx,bz); const bsp=bl>.3?3.5:0; bx=bl?bx/bl*bsp:0; bz=bl?bz/bl*bsp:0;
      if(!inCourt(foe.x+bx*.4,foe.z+bz*.4)){ bx=0; bz=0; }
      if(d<1.45&&foe.cd<=0){ foe.cd=rand(1,1.5); foe.push=.3; const side=Math.sign(me.x)||1; me.kx+=(dx/d*.7+side*.5)*8.5; me.kz+=dz/d*.7*8.5; noise(.12,.25,500); tone(80,.12,'sine',.15); }
      move(foe,bx,bz,dt); face(foe,dx,dz);
      if(d<.7&&d>0){ const push=(.7-d)/2; me.x+=dx/d*push; me.z+=dz/d*push; foe.x-=dx/d*push; foe.z-=dz/d*push; }
    }
    move(me,vx,vz,dt); face(me,vx,vz);
    if(!S.crossed&&me.z<WAIST&&S.phase==='play'){ S.crossed=true; HUD.sub('Duas pernas! Corra até a cabeça da lula.'); fanfare(); }
    const moving=Math.hypot(vx,vz)>.1;
    if(!S.crossed){ poseHuman(me.h,[0,-1.3],[-.6,-.6]); me.h.position.set(me.x,moving?Math.abs(Math.sin(clock*9))*.28:0,me.z); }
    else { animHuman(me.h,moving?4:0,dt); me.h.position.set(me.x,0,me.z); }
    if(me.push>0) poseHuman(me.h,[0,0],[-1.5,-1.5]);
    animHuman(foe.h,3,dt); if(foe.push>0) poseHuman(foe.h,[0,0],[-1.5,-1.5]); foe.h.position.set(foe.x,0,foe.z);
    HUD.progress((13-me.z)/27);
    if(S.phase==='play'){
      if(!inCourt(me.x,me.z)){ S.phase='lost'; S.t=0; HUD.sub('Você pisou fora da linha.'); setTimeout(()=>{ shot(); kill(me.h); me.h.rotation.x=-Math.PI/2; me.h.position.y=.15; },700); setTimeout(()=>{ if(G.R===R6) lose(`O jogador ${pad3(foe.num)} empurrou você para fora da lula.`); },2400); }
      else if(!inCourt(foe.x,foe.z)){ S.phase='won'; S.t=0; HUD.sub(`O jogador ${pad3(foe.num)} pisou fora da linha.`); setTimeout(()=>{ shot(); kill(foe.h); foe.h.rotation.x=-Math.PI/2; foe.h.position.y=.15; },700); setTimeout(victory,2600); }
      else if(S.crossed&&Math.hypot(me.x-GOAL.x,me.z-GOAL.z)<1.1){ S.phase='won'; S.t=0; HUD.flash('VITÓRIA',3000); HUD.sub('Você tocou a cabeça da lula.'); fanfare(); setTimeout(victory,2600); }
    }
    HUD.stats(S.phase==='won'?1:2);
  }
  function victory(){ if(G.R!==R6) return; G.bots=[]; G.prize=JACKPOT; win({final:true,foe:foe.num}); }
  function cam(dt){ camTo(V3(me.x*.5,7,me.z+8),V3(me.x*.7,0,me.z-6),dt,3); }
  return {start,update,cam,press};
})();
