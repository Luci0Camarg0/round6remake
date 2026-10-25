'use strict';
/* Rodada 2 — Dalgona. Minijogo em canvas 2D: recortar a forma com a agulha. */
const R2=(function(){
  const cv=$('#dgCanvas'), ctx=cv.getContext('2d'), candy=document.createElement('canvas');
  const arc=(cx,cy,r,a0,a1,n)=>{ const p=[]; for(let i=0;i<=n;i++){ const a=a0+(a1-a0)*i/n; p.push([cx+Math.cos(a)*r,cy+Math.sin(a)*r]); } return p; };
  const poly=(n,rf,off)=>{ const p=[]; for(let i=0;i<=n;i++){ const a=off+i*Math.PI*2/n, r=rf(i%n); p.push([Math.cos(a)*r,Math.sin(a)*r]); } return p; };
  const SHAPES={
    circle:{name:'Círculo',diff:.8,subs:()=>[arc(0,0,.55,0,Math.PI*2,120)]},
    triangle:{name:'Triângulo',diff:1,subs:()=>[poly(3,()=>.62,-Math.PI/2).map(([x,y])=>[x,y+.08])]},
    star:{name:'Estrela',diff:1.2,subs:()=>[poly(10,i=>i%2?.27:.64,-Math.PI/2)]},
    umbrella:{name:'Guarda-chuva',diff:1.4,subs:()=>{ const top=arc(0,0,.62,Math.PI,Math.PI*2,80), w=1.24/3, sc=[];
      for(let k=0;k<3;k++){ const cx=.62-w/2-k*w; arc(cx,0,w/2,0,Math.PI,24).forEach(p=>sc.push(p)); }
      const handle=[[0,w/2],[0,.58]].concat(arc(-.12,.58,.12,0,Math.PI,24)).concat([[-.24,.5]]);
      return [top.concat(sc),handle]; }}
  };
  function resample(p,step){ const out=[p[0]]; let acc=0; for(let i=1;i<p.length;i++){ const [x0,y0]=p[i-1],[x1,y1]=p[i], seg=Math.hypot(x1-x0,y1-y0); if(!seg) continue; let d=step-acc; while(d<=seg){ const t=d/seg; out.push([x0+(x1-x0)*t,y0+(y1-y0)*t]); d+=step; } acc=seg-(d-step); } return out; }
  const DG={};

  function start(shape){
    DG.shapeKey=shape; const s=SHAPES[shape]; DG.diff=s.diff; DG.subs=s.subs(); DG.pts=[]; DG.edges=[];
    DG.subs.forEach(sub=>{ const base=DG.pts.length; resample(sub,.018).forEach(p=>DG.pts.push({x:p[0],y:p[1],c:false})); for(let i=base+1;i<DG.pts.length;i++) DG.edges.push([i-1,i]); });
    Object.assign(DG,{crack:0,time:90,done:false,broken:false,win:false,press:false,pos:null,last:null,vs:0,pop:0,off:0,carved:0});
    DG.cracks=[]; for(let j=0;j<7;j++){ let a=rand(0,Math.PI*2), r=.86; const p=[[Math.cos(a)*r,Math.sin(a)*r]]; for(let k=0;k<12;k++){ a+=rand(-.25,.25); r-=rand(.03,.07); p.push([Math.cos(a)*r,Math.sin(a)*r]); } DG.cracks.push(p); }
    DG.specks=[]; for(let i=0;i<260;i++){ const a=rand(0,Math.PI*2), r=Math.sqrt(Math.random())*.82; DG.specks.push([Math.cos(a)*r,Math.sin(a)*r,rand(.004,.018),Math.random()]); }
    $('#dgShape').textContent=s.name; show('#dalgona'); resize();
  }
  function resize(){ const wrap=$('#dgWrap'); const s=Math.max(200,Math.floor(Math.min(wrap.clientWidth,wrap.clientHeight-20))); cv.style.width=cv.style.height=s+'px';
    const d=Math.min(window.devicePixelRatio||1,2); cv.width=cv.height=Math.round(s*d); candy.width=candy.height=cv.width; DG.S=s; DG.d=d; buildCandy(); }
  function unitT(g){ const R=DG.S/2/1.08*DG.d; g.setTransform(R,0,0,R,cv.width/2,cv.height/2); }
  function pathSubs(g){ g.beginPath(); DG.subs.forEach(sub=>{ sub.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y)); }); }
  function buildCandy(){ const g=candy.getContext('2d'); g.setTransform(1,0,0,1,0,0); g.clearRect(0,0,candy.width,candy.height); unitT(g);
    let gr=g.createRadialGradient(-.2,-.3,.1,0,0,1.02); gr.addColorStop(0,'#e9edf0'); gr.addColorStop(1,'#7f8a91'); g.fillStyle=gr; g.beginPath(); g.arc(0,0,1.02,0,Math.PI*2); g.fill();
    g.fillStyle='#5f6a70'; g.beginPath(); g.arc(0,0,.93,0,Math.PI*2); g.fill();
    gr=g.createRadialGradient(-.15,-.2,.05,0,0,.88); gr.addColorStop(0,'#f2c26b'); gr.addColorStop(.7,'#d98e33'); gr.addColorStop(1,'#a85f1c'); g.fillStyle=gr; g.beginPath(); g.arc(0,0,.88,0,Math.PI*2); g.fill();
    DG.specks.forEach(([x,y,r,v])=>{ g.fillStyle=v<.5?'rgba(120,60,10,.35)':'rgba(255,230,170,.45)'; g.beginPath(); g.arc(x,y,r,0,Math.PI*2); g.fill(); });
    g.lineJoin=g.lineCap='round'; g.strokeStyle='rgba(110,55,12,.6)'; g.lineWidth=.014; pathSubs(g); g.stroke();
    g.strokeStyle='rgba(255,226,160,.5)'; g.lineWidth=.006; g.save(); g.translate(.006,.006); pathSubs(g); g.stroke(); g.restore(); }
  function toU(e){ const r=cv.getBoundingClientRect(), R=DG.S/2/1.08; return {x:(e.clientX-r.left-DG.S/2)/R, y:(e.clientY-r.top-DG.S/2)/R+DG.off}; }
  const active=()=>G.R===R2&&G.mode==='play';
  cv.addEventListener('pointerdown',e=>{ if(!active()||DG.done) return; DG.off=e.pointerType==='touch'?-.16:0; try{ cv.setPointerCapture(e.pointerId); }catch(_){} DG.press=true; DG.pos=toU(e); DG.last={...DG.pos}; audio(); });
  cv.addEventListener('pointermove',e=>{ if(!active()) return; if(!DG.press) DG.off=e.pointerType==='touch'?-.16:0; DG.pos=toU(e); });
  ['pointerup','pointercancel','lostpointercapture'].forEach(ev=>cv.addEventListener(ev,()=>{ DG.press=false; }));
  cv.addEventListener('pointerleave',()=>{ if(!DG.press) DG.pos=null; });
  function carveAt(x,y){ let m=Infinity; for(const p of DG.pts){ const d=Math.hypot(p.x-x,p.y-y); if(d<m) m=d; if(d<.034&&!p.c){ p.c=true; DG.carved++; } } return m; }

  function update(dt){
    if(DG.done){ DG.pop=Math.min(1,DG.pop+dt/.8); draw(); return; }
    DG.time-=dt; if(DG.time<=0){ DG.time=0; fail('O tempo acabou antes de você soltar a forma.'); }
    if(DG.press&&DG.pos&&DG.last){
      const a=DG.last,b=DG.pos, dist=Math.hypot(b.x-a.x,b.y-a.y), steps=Math.max(1,Math.ceil(dist/.01));
      for(let i=1;i<=steps;i++) carveAt(a.x+(b.x-a.x)*i/steps,a.y+(b.y-a.y)*i/steps);
      const dCur=carveAt(b.x,b.y); DG.vs=DG.vs*.85+(dist/Math.max(dt,1e-3))*.15;
      if(Math.hypot(b.x,b.y)<.88){ if(dCur>.065) DG.crack+=34*dt*DG.diff; if(DG.vs>.65) DG.crack+=(DG.vs-.65)*24*dt*DG.diff; }
      if(dist>.003&&dCur<.04&&Math.random()<.35) noise(.03,.05,5000);
      DG.last={...b};
    }
    if(DG.crack>=100&&!DG.done){ DG.crack=100; fail('O doce rachou. Um guarda se aproxima da sua mesa.'); }
    const prog=DG.carved/DG.pts.length;
    if(prog>=.97&&!DG.done){ DG.pts.forEach(p=>p.c=true); DG.carved=DG.pts.length; DG.done=true; DG.win=true; DG.press=false; tone(523,.15,'triangle',.12); tone(784,.4,'triangle',.12,.15);
      setTimeout(()=>{ if(!active()) return; const lost=cull(.27); win({lost,shape:SHAPES[DG.shapeKey].name}); },1700); }
    $('#dgTimer').textContent=DG.time.toFixed(1); $('#dgTimer').classList.toggle('low',DG.time<15);
    $('#crackBar').style.width=DG.crack+'%'; $('#carveBar').style.width=Math.min(100,prog/.97*100)+'%';
    draw();
  }
  function draw(){
    const g=ctx; g.setTransform(1,0,0,1,0,0); g.clearRect(0,0,cv.width,cv.height); g.drawImage(candy,0,0); unitT(g);
    g.lineCap=g.lineJoin='round';
    g.strokeStyle='#4a2508'; g.lineWidth=.024; g.beginPath(); DG.edges.forEach(([i,j])=>{ const a=DG.pts[i],b=DG.pts[j]; if(a.c&&b.c){ g.moveTo(a.x,a.y); g.lineTo(b.x,b.y); } }); g.stroke();
    g.strokeStyle='rgba(60,25,5,.85)'; g.lineWidth=.008;
    DG.cracks.forEach((c,j)=>{ const f=clamp((DG.crack-j*9)/35,0,1); if(f<=0) return; const n=Math.max(2,Math.round(c.length*f)); g.beginPath(); for(let k=0;k<n;k++) k?g.lineTo(c[k][0],c[k][1]):g.moveTo(c[k][0],c[k][1]); g.stroke(); });
    if(DG.broken){ g.strokeStyle='#06110f'; g.lineWidth=.03; g.beginPath(); g.moveTo(-.9,-.1); g.lineTo(-.3,.05); g.lineTo(.1,-.12); g.lineTo(.5,.08); g.lineTo(.92,-.02); g.stroke(); }
    if(DG.win){ const p=ease(DG.pop); g.save(); g.translate(0,-.05*p); g.shadowColor='rgba(0,0,0,.45)'; g.shadowBlur=20*p; g.shadowOffsetY=10*p;
      g.fillStyle='#f0bd62'; pathSubs(g); g.fill('evenodd'); g.strokeStyle='#f0bd62'; g.lineWidth=.05; g.stroke(); g.restore(); }
    if(DG.pos&&!DG.done){ const {x,y}=DG.pos; g.save(); g.strokeStyle=DG.press?'#ffffff':'#c9d3d8'; g.lineWidth=.012; g.beginPath(); g.moveTo(x,y); g.lineTo(x+.22,y-.34); g.stroke();
      g.lineWidth=.03; g.beginPath(); g.moveTo(x+.2,y-.31); g.lineTo(x+.26,y-.4); g.stroke(); g.fillStyle=DG.press?'#ec2f6b':'#fff'; g.beginPath(); g.arc(x,y,.01,0,Math.PI*2); g.fill(); g.restore(); }
  }
  function fail(msg){ DG.done=true; DG.broken=true; DG.press=false; noise(.4,.35,900); setTimeout(()=>{ shot(); G.prize+=PER_HEAD; },900); setTimeout(()=>{ if(active()) lose(msg); },2000); }
  return {start,update,resize,no3d:true};
})();
