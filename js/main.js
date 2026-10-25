'use strict';
/* Fluxo do jogo: menu, sequência de rodadas, intervalos no dormitório, resultado e loop de quadros. */
const ROUNDS=[R1,R2,R3,R4,R5,R6];
const INFO=[
  ['Batatinha Frita 1, 2, 3','Corra só quando a boneca estiver de costas.'],
  ['Dalgona','Recorte a forma do doce com uma agulha.'],
  ['Cabo de Guerra','Puxe no ritmo certo no alto das plataformas.'],
  ['Bolinha de Gude','Par ou ímpar contra o seu parceiro.'],
  ['Ponte de Vidro','Vidro comum ou temperado?'],
  ['Jogo da Lula','O duelo final, na areia e na chuva.']
];
// quantos jogadores costumam chegar vivos ao começo de cada rodada (usado no modo treino)
const PRACTICE_ALIVE=[456,250,120,40,17,2];
let clock=0;

function roundsHtml(won){ return INFO.map((r,i)=>`<li class="${i<won?'won':''}"><span class="num">${i+1}</span><div><b>${r[0]}</b><small>${r[1]}</small></div><span class="chip ${i<won?'done':'on'}">${i<won?'Vencida':'Jogável'}</span></li>`).join(''); }
$('#menuRounds').innerHTML=INFO.map((r,i)=>`<li><span class="num">${i+1}</span><div><b>${r[0]}</b><small>${r[1]}</small></div><button class="chip on" type="button" data-practice="${i}" style="border:0">Treinar</button></li>`).join('');

function startRound(i,arg){ G.round=i+1; G.arg=arg; G.snap={bots:G.bots.slice(),prize:G.prize}; G.R=ROUNDS[i]; G.mode='play'; clearKeys(); ROUNDS[i].start(arg); }
function readNumber(){ const n=parseInt($('#num').value,10); G.number=clamp(isNaN(n)?456:n,1,456); $('#num').value=G.number; }
function newGame(){ readNumber(); G.prize=0; G.bots=freshBots(); startRound(0); }
function practice(i){ readNumber(); G.bots=shuffle(freshBots()).slice(0,PRACTICE_ALIVE[i]-1); G.prize=(PLAYERS-PRACTICE_ALIVE[i])*PER_HEAD; if(i===1) chooseShape('Modo treino. '); else startRound(i); }
function toMenu(){ G.mode='menu'; G.R=null; document.body.classList.remove('red'); R1.menu(); show('#menu'); }
$('#playSolo').addEventListener('click',newGame);
document.querySelectorAll('[data-practice]').forEach(b=>b.addEventListener('click',()=>practice(+b.dataset.practice)));

/* ---------- dormitório ---------- */
function dorm(o){
  G.mode='dorm'; G.R=null; document.body.classList.remove('red');
  $('#dEyebrow').textContent=o.eyebrow||'Dormitório · intervalo'; $('#dTitle').textContent=o.title; $('#dText').textContent=o.text;
  $('#dAlive').textContent=alive(); $('#dPrize').textContent=fmtW(G.prize);
  $('#dExtra').innerHTML=o.extra||''; $('#dGo').hidden=!o.go; $('#dGo').textContent=o.go||''; dormGo=o.onGo||null;
  show("#dorm");
}
let dormGo=null;
$('#dGo').addEventListener('click',()=>{ if(dormGo) dormGo(); });
const SHAPE_BTNS=`<div class="shapes">
  <button class="shape" type="button" data-shape="circle" aria-label="Círculo"><svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="3"><circle cx="20" cy="20" r="13"/></svg></button>
  <button class="shape" type="button" data-shape="triangle" aria-label="Triângulo"><svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="3"><path d="M20 6 34 31H6z"/></svg></button>
  <button class="shape" type="button" data-shape="star" aria-label="Estrela"><svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="3"><path d="M20 5l4.3 10 10.7.6-8.3 7 2.7 10.4L20 27.3 10.6 33l2.7-10.4-8.3-7 10.7-.6z"/></svg></button>
  <button class="shape" type="button" data-shape="umbrella" aria-label="Guarda-chuva"><svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="3"><path d="M5 20a15 15 0 0 1 30 0q-2.5-3-5 0-2.5-3-5 0-2.5-3-5 0-2.5-3-5 0-2.5-3-5 0-2.5-3-5 0zM20 20v12a3 3 0 0 1-6 0"/></svg></button>
</div><p class="note" style="margin-top:12px">Círculo é o mais fácil. Guarda-chuva é o mais difícil.</p>`;
function chooseShape(prefix){
  dorm({title:'Escolha um símbolo',text:(prefix||'')+'Um guarda entra com uma bandeja. "Escolha um símbolo." Ninguém sabe ainda qual será o próximo jogo.',extra:SHAPE_BTNS});
  document.querySelectorAll('#dExtra [data-shape]').forEach(b=>b.addEventListener('click',()=>startRound(1,b.dataset.shape)));
}

// o que acontece depois de vencer cada rodada
const INTERLUDE=[
  info=>chooseShape(`Você cruzou a linha. ${info.lost} jogadores ficaram no campo. `),
  info=>{ const riot=cull(rand(.35,.5));
    dorm({title:'A noite do motim',text:`Você soltou o ${String(info.shape||'doce').toLowerCase()} inteiro, mas ${info.lost} jogadores não conseguiram. Naquela noite, as luzes do dormitório se apagam e começa uma briga. Quando os guardas entram, ${riot} jogadores não se levantam mais.`,
      go:'Ir para a rodada 3',onGo:()=>startRound(2)}); },
  info=>dorm({title:'Seu time não soltou a corda',text:`O outro time caiu no vão. Somando todas as disputas, ${info.lost} jogadores ficaram pelo caminho. De manhã, o alto-falante anuncia: "Formem duplas."`,go:'Ir para a rodada 4',onGo:()=>startRound(3)}),
  info=>dorm({title:'Vinte bolinhas',text:`Você ficou com todas as bolinhas do jogador ${pad3(info.partner)}. Ele não volta para o dormitório. Na sala seguinte, ${alive()} coletes numerados esperam por vocês.`,go:'Ir para a rodada 5',onGo:()=>startRound(4)}),
  info=>{
    if(!G.bots.length){ victory('Ninguém mais atravessou a ponte. Sem adversário para a final, o prêmio é seu.'); return; }
    const rival=G.bots[randi(0,G.bots.length-1)], others=G.bots.filter(n=>n!==rival), gone=removeBots(others);
    dorm({eyebrow:'Última noite',title:'Só restam dois',text:`${info.lost} jogadores caíram da ponte.${gone?` Durante a última noite, ${gone===1?'mais um jogador desaparece':`mais ${gone} jogadores desaparecem`}.`:''} De manhã, só o jogador ${pad3(rival)} está de pé ao seu lado. A final vai ser na areia, sob chuva.`,
      go:'Ir para a final',onGo:()=>startRound(5)}); },
  ()=>victory(`Você chegou à cabeça da lula. O cofrinho gigante desce do teto e as notas caem sobre você.`)
];
function win(info){ INTERLUDE[G.round-1](info||{}); }
function lose(msg){ G.mode='dead'; document.body.classList.remove('red');
  result({eyebrow:`Jogador ${pad3(G.number)} · rodada ${G.round}`,title:'Eliminado',text:msg,alive:G.bots.length,retry:`Repetir rodada ${G.round}`,
    onRetry:()=>{ G.bots=G.snap.bots.slice(); G.prize=G.snap.prize; if(G.round===2) chooseShape(); else startRound(G.round-1,G.arg); }}); }
function victory(text){ G.mode='end'; G.R=null; G.bots=[]; G.prize=JACKPOT; fanfare();
  result({eyebrow:`Jogador ${pad3(G.number)} · 6 de 6 rodadas`,title:'Você venceu',text:text+` Prêmio: ${fmtW(JACKPOT)}.`,alive:1,rounds:roundsHtml(6),retry:'Jogar de novo',onRetry:newGame}); }

/* ---------- resultado ---------- */
let retryFn=null;
function result(o){
  $('#rEyebrow').textContent=o.eyebrow; $('#rTitle').textContent=o.title; $('#rText').textContent=o.text;
  $('#rAlive').textContent=o.alive; $('#rPrize').textContent=fmtW(G.prize);
  $('#rRounds').hidden=!o.rounds; $('#rRounds').innerHTML=o.rounds||''; $('#rRetry').textContent=o.retry; retryFn=o.onRetry;
  show("#result");
}
$('#rRetry').addEventListener('click',()=>{ if(retryFn) retryFn(); });
$('#rMenu').addEventListener('click',toMenu);

/* ---------- loop ---------- */
let last=performance.now();
function frame(now){
  requestAnimationFrame(frame);
  const dt=Math.min(.05,(now-last)/1000); last=now; clock+=dt;
  if(G.mode==='play'&&G.R) G.R.update(dt);
  if(G.mode==='menu') R1.attract();
  if(G.mode==='play'&&G.R&&G.R.no3d) return;
  if(G.mode==='play'&&G.R&&G.R.cam) G.R.cam(dt);
  renderer.render(scene,camera);
}
addEventListener('resize',resize); resize();
toMenu();
requestAnimationFrame(frame);
