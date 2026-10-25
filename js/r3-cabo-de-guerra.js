'use strict';
/* Rodada 3 — Cabo de Guerra. Duas plataformas altas; quem for puxado para o vão cai. */
const R3=(function(){
  const ENV={bg:0x0c1720,fog:[0x0c1720,45,110],sky:0x9db8cc,ground:0x222222,hemi:.6,sun:.95,sunPos:[-10,40,30]};
  const PERFECT=[.42,.58], OK=[.32,.68], EDGE=6;
  let w=null, ropeG=null, team=[], S=null;

  function build(){
    w=new THREE.Group();
    const concrete=lambert(0x58707e), pink=lambert(0xe8336f);
    const floor=new THREE.Mesh(new THREE.PlaneGeometry(220,220),lambert(0x0d1318)); floor.rotation.x=-Math.PI/2; floor.position.y=-34; w.add(floor);
    for(const s of [-1,1]){ box(16,34,7,concrete,s*(EDGE+8),-17,0,w); box(.3,.3,7.2,pink,s*(EDGE+.15),-.1,0,w);
      for(let i=0;i<5;i++) box(.12,1.1,.12,lambert(0x9aa7ae),s*(EDGE+2+i*3),.55,-3.3,w);
      box(15,.1,.1,lambert(0x9aa7ae),s*(EDGE+8),1.1,-3.3,w); }
    const wallTex=canvasTex(512,256,(g,cw,h)=>{ g.fillStyle='#123a3f'; g.fillRect(0,0,cw,h); g.strokeStyle='rgba(126,195,232,.18)'; g.lineWidth=2;
      for(let x=0;x<cw;x+=32){ g.beginPath(); g.moveTo(x,0); g.lineTo(x,h); g.stroke(); } for(let y=0;y<h;y+=32){ g.beginPath(); g.moveTo(0,y); g.lineTo(cw,y); g.stroke(); } });
    const back=new THREE.Mesh(new THREE.PlaneGeometry(160,80),new THREE.MeshBasicMaterial({map:wallTex})); back.position.set(0,-4,-26); w.add(back);
    for(const x of [-14,0,14]){ const lamp=new THREE.Mesh(new THREE.CylinderGeometry(.4,1.6,1.2,16,1,true),new THREE.MeshBasicMaterial({color:0xfff2c4,side:THREE.DoubleSide})); lamp.position.set(x,12,0); w.add(lamp); }
    ropeG=new THREE.Group(); w.add(ropeG);
    const rope=new THREE.Mesh(new THREE.CylinderGeometry(.07,.07,46,8),lambert(0xc9a46a)); rope.rotation.z=Math.PI/2; rope.position.y=1.15; rope.castShadow=true; ropeG.add(rope);
    const flag=new THREE.Mesh(new THREE.PlaneGeometry(.5,.8),new THREE.MeshLambertMaterial({color:0xe8336f,side:THREE.DoubleSide})); flag.position.set(0,.7,0); ropeG.add(flag);
    [[-1,'o'],[1,'^']].forEach(([s,sym])=>{ guard(sym,s*(EDGE+12),-2.4,0,w); guard('□',s*(EDGE+4),-2.4,0,w); });
  }

  function member(num,side,i,isPlayer){
    const holder=new THREE.Group(), h=makeHuman({number:num,ring:isPlayer});
    holder.add(h); holder.rotation.y=side<0?Math.PI/2:-Math.PI/2; w.add(holder);
    poseHuman(h,[-.35,.3],[-1.3,-1.25]);
    return {holder,h,num,side,base:side*(EDGE+.8+i*1.05),isPlayer,vy:0,y:0,falling:false,jit:rand(0,6)};
  }

  function start(){
    if(!w) build(); setEnv(ENV); useWorld(w);
    team.forEach(m=>w.remove(m.holder)); team=[];
    const k=clamp(Math.floor((G.bots.length+1)/2),1,10);
    const mates=sampleBots(k-1), foes=sampleBots(k,mates);
    const mineNums=mates.slice(); mineNums.splice(Math.min(2,mineNums.length),0,G.number);
    mineNums.forEach((n,i)=>team.push(member(n,-1,i,n===G.number)));
    foes.forEach((n,i)=>team.push(member(n,1,i,false)));
    S={phase:'intro',t:0,p:0,pd:0,c:0,ph:0,spd:3.2,lock:0,first:true,surge:0,nextSurge:rand(3,5),trick:'no',trickT:0,mates,foes,end:0};
    clearKeys();
    HUD.setup({eyebrow:'Rodada 3',title:'Cabo de Guerra',
      keys:'Espaço quando o cursor estiver no verde · E: três passos à frente (quando aparecer)',
      pad:[{a:'alt',label:'3 PASSOS',cls:'act'},{gap:true},{a:'act',label:'PUXAR',cls:'big'}]});
    HUD.choice(`<div class="cue" id="cue">Pés firmes. Corpo para trás.</div>
      <div class="pullbar"><div class="ok"></div><div class="perfect"></div><div class="cursor" id="pcur"></div></div>
      <div class="rope"><div class="flag" id="pflag" style="left:50%"></div></div>
      <div class="row" style="justify-content:space-between;font-size:12px;color:var(--muted)"><span>Seu time (${mineNums.length})</span><span>Adversários (${foes.length})</span></div>`,'top');
    camera.position.set(-15,5,10); camLook.set(-2,.8,0); audio();
  }
  const cue=(t)=>{ const el=$('#cue'); if(el) el.textContent=t; };

  function press(a){
    if(S.phase==='intro'&&(a==='act'||a==='fwd')){ if(S.t<3){ S.p-=.05; cue('Queimou a largada!'); } return; }
    if(S.phase!=='pull') return;
    if(a==='alt'){ if(S.trick==='ready'){ S.trick='used'; S.trickT=1.3; cue('Um, dois, TRÊS! Eles perdem o equilíbrio!'); fanfare(); } return; }
    if(a!=='act'&&a!=='fwd') return;
    if(S.lock>0) return;
    S.lock=.35;
    if(S.first&&S.t<.5){ S.p+=.1; cue('Largada perfeita!'); S.first=false; tone(660,.12,'triangle',.1); return; }
    S.first=false;
    const c=S.c;
    if(c>=PERFECT[0]&&c<=PERFECT[1]){ S.p+=.09; cue('PERFEITO'); tone(660,.1,'triangle',.1); team.forEach(m=>{ if(m.side<0) m.jerk=.25; }); }
    else if(c>=OK[0]&&c<=OK[1]){ S.p+=.045; cue('Bom'); tone(520,.08,'triangle',.08); }
    else { S.p-=.03; S.lock=.55; cue('Escorregou!'); tone(160,.15,'sawtooth',.06); }
  }

  function update(dt){
    S.t+=dt; S.lock=Math.max(0,S.lock-dt);
    if(S.phase==='intro'){
      const left=3-S.t; HUD.big(left>0?Math.ceil(left):'PUXEM!');
      if(S.t>=3){ S.phase='pull'; S.t=0; tone(880,.3,'square',.06); setTimeout(()=>{ if(S&&S.phase==='pull') HUD.big(''); },700); }
    } else if(S.phase==='pull'){
      S.spd=Math.min(5.2,3.2+S.t*.05); S.ph+=dt*S.spd; S.c=(Math.sin(S.ph)+1)/2;
      S.nextSurge-=dt; if(S.nextSurge<=0){ S.surge=.5; S.nextSurge=rand(3.5,5.5); cue('Eles puxaram forte! Segure!'); noise(.3,.08,400); }
      const surge=S.surge>0?.3:0; S.surge=Math.max(0,S.surge-dt);
      const opp=Math.max(.015,.052-S.t*.001)+surge, mine=.045+(S.trickT>0?.5:0); S.trickT=Math.max(0,S.trickT-dt);
      S.p+=(mine-opp)*dt;
      if(S.trick==='no'&&S.p<-.45){ S.trick='ready'; cue('Agora: três passos à frente! (E)'); tone(440,.1,'square',.06); tone(440,.1,'square',.06,.15); }
      if(S.p>=1){ S.phase='won'; S.t=0; cue('Eles caíram no vão.'); team.forEach(m=>{ if(m.side>0) m.falling=true; }); noise(.8,.3,300); }
      if(S.p<=-1){ S.phase='lost'; S.t=0; cue('Seu time foi arrastado.'); team.forEach(m=>{ if(m.side<0) m.falling=true; }); noise(.8,.3,300); }
    } else if(S.phase==='won'&&S.t>3){
      S.phase='done'; const lost=removeBots(S.foes)+cull(.5,S.mates); win({lost});
    } else if(S.phase==='lost'&&S.t>3){
      S.phase='done'; G.prize+=PER_HEAD*(S.mates.length+1); lose('Seu time perdeu o cabo de guerra e foi puxado para o vão.');
    }
    S.p=clamp(S.p,-1,1); S.pd+=(S.p-S.pd)*Math.min(1,dt*6);
    const cur=$('#pcur'); if(cur) cur.style.left=(S.c*100)+'%';
    const fl=$('#pflag'); if(fl) fl.style.left=(50-S.pd*50)+'%';
    const shift=-S.pd*.9;
    ropeG.position.x=shift+(S.phase==='won'?-Math.min(S.t,2)*4:S.phase==='lost'?Math.min(S.t,2)*4:0);
    if(S.phase==='won'||S.phase==='lost') ropeG.position.y=-Math.max(0,S.t-.6)*S.t*4;
    for(const m of team){
      m.jerk=Math.max(0,(m.jerk||0)-dt);
      if(m.falling){
        const dir=m.side>0?-1:1; m.slide=(m.slide||0)+dt*4.5*dir; let x=m.base+shift+m.slide;
        const over=m.side>0?x<EDGE:x>-EDGE;
        if(over){ m.vy-=22*dt; m.y+=m.vy*dt; m.h.rotation.z+=dt*2*dir; }
        m.holder.position.set(x,m.y,0);
      } else {
        m.holder.position.set(m.base+shift,0,0);
        const lean=.35+(m.side<0?m.jerk*.8:0)+Math.sin(clock*9+m.jit)*.02+(S.phase==='won'&&m.side<0?Math.min(S.t,1)*.5:0);
        m.h.rotation.x=-lean;
      }
    }
  }
  function cam(dt){
    const me=team.find(m=>m.isPlayer); if(!me) return;
    const p=me.holder.position;
    if(me.falling&&me.y<-1) camTo(V3(p.x-6,p.y+6,10),V3(p.x,p.y,0),dt,3);
    else camTo(V3(p.x-6,4.6,9.5),V3(p.x+7,.8,0),dt,3);
  }
  return {start,update,cam,press};
})();
