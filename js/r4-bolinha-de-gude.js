'use strict';
/* Rodada 4 — Bolinha de Gude. Par ou ímpar contra o parceiro; quem ficar com as 20 bolinhas vence. */
const R4=(function(){
  const ENV={bg:0xf0a070,fog:[0xf0a070,25,70],sky:0xffd9b0,ground:0x6b5a4a,hemi:.75,sun:.75,sunColor:0xffc890,sunPos:[18,20,10]};
  const COLORS=[0xe63946,0x2a9d8f,0xe9c46a,0x457b9d,0xf4a261,0x8338ec,0x06d6a0,0xff70a6];
  let w=null, me=null, partner=null, pileMine=[], pilePartner=[], S=null;

  function build(){
    w=new THREE.Group();
    const ground=new THREE.Mesh(new THREE.PlaneGeometry(14,70),new THREE.MeshLambertMaterial({map:sandTexture(3,14,'#9b8b78')})); ground.rotation.x=-Math.PI/2; ground.position.z=-10; ground.receiveShadow=true; w.add(ground);
    const walls=[0xe9c46a,0xf4a3a8,0x8fc1d4,0xa8d5a2,0xf1e3c6,0xd9a5c9], dark=lambert(0x3b2f2a), win=new THREE.MeshBasicMaterial({color:0xffe1a8}), roof=lambert(0x47595e);
    for(const s of [-1,1]) for(let i=0;i<9;i++){
      const z=10-i*6, h=rand(3.2,5.2), c=walls[(i*2+(s>0?1:0))%walls.length], x=s*6.5;
      box(5,h,5.6,lambert(c),x,h/2,z,w); box(5.6,.3,6.2,roof,x,h+.15,z,w);
      box(.06,1.9,1.1,dark,s*3.98,.95,z-1.2,w);
      const wn=new THREE.Mesh(new THREE.PlaneGeometry(1,.8),win); wn.position.set(s*3.99,h-1.3,z+1.2); wn.rotation.y=-s*Math.PI/2; w.add(wn);
    }
    for(const z of [4,-8,-20]){ box(.12,3.6,.12,dark,-3.4,1.8,z,w); const bulb=new THREE.Mesh(new THREE.SphereGeometry(.22,10,8),new THREE.MeshBasicMaterial({color:0xfff0c0})); bulb.position.set(-3.1,3.6,z); w.add(bulb); }
    const lamp=new THREE.PointLight(0xffc27a,.7,18); lamp.position.set(-2,3.5,2); w.add(lamp);
    const mg=new THREE.SphereGeometry(.07,10,8);
    for(let i=0;i<20;i++){ pileMine.push(marble(mg,i)); pilePartner.push(marble(mg,i+3)); }
    guard('o',2.6,-5,-.4,w);
  }
  function marble(geo,i){ const m=new THREE.Mesh(geo,new THREE.MeshPhongMaterial({color:COLORS[i%COLORS.length],shininess:90})); m.castShadow=true; w.add(m); return m; }
  function layout(){
    const place=(pile,n,cx,cz)=>pile.forEach((m,i)=>{ m.visible=i<n; const a=i*2.4, r=.08+Math.sqrt(i)*.07; m.position.set(cx+Math.cos(a)*r,.07,cz+Math.sin(a)*r); });
    place(pileMine,S.mine,-.6,1.2); place(pilePartner,S.partner,.6,.2);
  }

  function start(){
    if(!w) build(); setEnv(ENV); useWorld(w);
    if(me) w.remove(me); if(partner) w.remove(partner);
    const pn=sampleBots(1)[0];
    me=makeHuman({number:G.number,ring:true}); me.position.set(-.3,0,2.3); me.rotation.y=Math.PI; w.add(me);
    partner=makeHuman({number:pn}); partner.position.set(.3,0,-.7); w.add(partner);
    S={pn,mine:10,partner:10,turn:'guess',bet:1,hide:1,lastHide:null,busy:false,over:false,turns:0};
    clearKeys(); layout();
    HUD.setup({eyebrow:'Rodada 4',title:'Bolinha de Gude'});
    HUD.sub(`Seu parceiro é o jogador ${pad3(pn)}`);
    camera.position.set(-1.9,2.5,4.6); camLook.set(.7,1,-.8); audio();
    turnUI();
  }
  const dots=n=>'<div class="marbles">'+Array.from({length:n},(_,i)=>`<i style="--c:#${COLORS[i%COLORS.length].toString(16).padStart(6,'0')}"></i>`).join('')+'</div>';
  const scoreHtml=()=>`<div class="score"><div><span class="eyebrow">Você</span><b>${S.mine}</b></div><span class="vs">×</span><div><span class="eyebrow">Jogador ${pad3(S.pn)}</span><b>${S.partner}</b></div></div>`;
  function stepper(id,val,max){ return `<div class="stepper"><button type="button" data-step="-1" aria-label="Menos">−</button><output id="${id}">${val}</output><button type="button" data-step="1" aria-label="Mais">+</button><span class="note">de ${max}</span></div>`; }
  function bindStepper(c,key,max){ c.querySelectorAll('[data-step]').forEach(b=>b.addEventListener('click',()=>{ S[key]=clamp(S[key]+(+b.dataset.step),1,max); c.querySelector('output').textContent=S[key]; tone(700,.04,'square',.03); })); }

  function turnUI(){
    if(S.over) return; S.busy=false;
    if(S.turn==='guess'){
      const max=S.mine; S.bet=clamp(S.bet,1,max);
      const c=HUD.choice(`${scoreHtml()}<p>O jogador ${pad3(S.pn)} escondeu algumas bolinhas na mão fechada. Aposte e diga se é par ou ímpar.</p>
        <div class="row">${stepper('bet',S.bet,max)}</div>
        <div class="row"><button class="btn" data-g="0" type="button">Par</button><button class="btn" data-g="1" type="button">Ímpar</button></div>`);
      bindStepper(c,'bet',max);
      c.querySelectorAll('[data-g]').forEach(b=>b.addEventListener('click',()=>guess(+b.dataset.g)));
    } else {
      const max=S.mine; S.hide=clamp(S.hide,1,max);
      const c=HUD.choice(`${scoreHtml()}<p>Sua vez de esconder. Quantas bolinhas você fecha na mão?</p>
        <div class="row">${stepper('hide',S.hide,max)}</div>
        <div class="row"><button class="btn" id="doHide" type="button">Fechar a mão</button></div>`);
      bindStepper(c,'hide',max);
      c.querySelector('#doHide').addEventListener('click',hide);
    }
  }
  // o parceiro tem uma mania: esconde número ímpar com mais frequência
  function partnerHide(){ const max=Math.min(S.partner,6); const odd=Math.random()<.68; const opts=[]; for(let n=1;n<=max;n++) if((n%2===1)===odd) opts.push(n); return opts.length?opts[randi(0,opts.length-1)]:randi(1,max); }
  // ...e acha que você repete a paridade da última jogada
  function partnerGuess(){ if(S.lastHide==null) return Math.random()<.5?1:0; const p=S.lastHide%2; return Math.random()<.65?p:1-p; }

  function guess(g){
    if(S.busy) return; S.busy=true;
    const n=partnerHide(), right=(n%2)===g, amt=right?Math.min(S.bet,S.partner):Math.min(S.bet,S.mine);
    reveal(`A mão abre: ${n} ${n===1?'bolinha':'bolinhas'}. ${n%2?'Ímpar':'Par'}.`, n, right?amt:-amt, right?`Você acertou e ganhou ${amt}.`:`Você errou e perdeu ${amt}.`);
  }
  function hide(){
    if(S.busy) return; S.busy=true;
    const n=S.hide, bet=randi(1,Math.min(S.partner,Math.max(2,Math.ceil(S.partner/2)))), g=partnerGuess(), right=(n%2)===g;
    S.lastHide=n;
    const amt=right?Math.min(bet,S.mine):Math.min(bet,S.partner);
    reveal(`O jogador ${pad3(S.pn)} aposta ${bet} e diz "${g?'ímpar':'par'}". Você abre a mão: ${n}.`, n, right?-amt:amt, right?`Ele acertou. Você perdeu ${amt}.`:`Ele errou. Você ganhou ${amt}.`);
  }
  function reveal(line,n,delta,verdict){
    HUD.choice(`${scoreHtml()}<p>${line}</p>${dots(n)}<p class="cue">${verdict}</p>`);
    tone(delta>0?660:220,.18,'triangle',.1);
    setTimeout(()=>{
      if(G.R!==R4||G.mode!=='play') return;
      S.mine+=delta; S.partner-=delta; S.turns++; layout();
      if(delta>0) poseHuman(me,[0,0],[-2.6,0]); else poseHuman(partner,[0,0],[-2.6,0]);
      setTimeout(()=>{ poseHuman(me,[0,0],[0,0]); poseHuman(partner,[0,0],[0,0]); },700);
      if(S.mine<=0){ S.over=true; HUD.choice(`${scoreHtml()}<p class="cue">Você perdeu a última bolinha.</p>`); setTimeout(()=>{ shot(); kill(me); G.prize+=PER_HEAD; },900); setTimeout(()=>{ if(G.R===R4) lose(`O jogador ${pad3(S.pn)} ficou com as suas 10 bolinhas.`); },2200); return; }
      if(S.partner<=0){ S.over=true; HUD.choice(`${scoreHtml()}<p class="cue">Você ficou com as 20 bolinhas.</p>`); fanfare(); setTimeout(()=>{ shot(); kill(partner); },900);
        setTimeout(()=>{ if(G.R!==R4) return; const lost=removeBots([S.pn])+cull(.5); win({lost,partner:S.pn}); },2600); return; }
      S.turn=S.turn==='guess'?'hide':'guess'; turnUI();
    },1900);
  }
  function update(){ HUD.stats(); }
  function cam(){ camera.lookAt(camLook); }
  return {start,update,cam};
})();
