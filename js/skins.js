import * as THREE from 'three';
// ---- Texturas de los personajes (dibujadas en canvas al cargar; sin canvas se usan los colores lisos) ----
// Cada personaje tiene: tela de la chaqueta y del pantalón con trama, costuras y franjas de neón (mapa emisivo que brilla aunque haya sombra)
// y un logo de corona para los decals (pecho, bolsillo, mochila y zapatillas).
const hex=h=>'#'+h.toString(16).padStart(6,'0');
const rgba=(h,a)=>`rgba(${(h>>16)&255},${(h>>8)&255},${h&255},${a})`;
const has=()=>typeof document!=='undefined'&&!!document.createElement;
function cv(w,h=w){if(!has())return null;const c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext&&c.getContext('2d');return x?{c,x,w,h}:null}
function tex(k,rx=1,ry=1){const t=new THREE.CanvasTexture(k.c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(rx,ry);t.colorSpace=THREE.SRGBColorSpace;if(t.anisotropy!==undefined)t.anisotropy=4;return t}
// tela: trama cruzada fina, granos y vetas de uso
function weave(k,base){const {x,w,h}=k;x.fillStyle=base;x.fillRect(0,0,w,h);x.lineWidth=1;
 x.strokeStyle='rgba(255,255,255,.055)';for(let i=0;i<w;i+=3){x.beginPath();x.moveTo(i+.5,0);x.lineTo(i+.5,h);x.stroke()}
 x.strokeStyle='rgba(0,0,0,.09)';for(let i=0;i<h;i+=3){x.beginPath();x.moveTo(0,i+.5);x.lineTo(w,i+.5);x.stroke()}
 for(let i=0;i<500;i++){x.fillStyle=Math.random()<.5?'rgba(0,0,0,.08)':'rgba(255,255,255,.04)';x.fillRect(Math.random()*w,Math.random()*h,1+Math.random()*2,1)}
 for(let i=0;i<14;i++){const px=Math.random()*w,py=Math.random()*h,r=10+Math.random()*30,g=x.createRadialGradient(px,py,0,px,py,r);g.addColorStop(0,'rgba(0,0,0,.14)');g.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=g;x.fillRect(px-r,py-r,r*2,r*2)}}
function neon(ctx,col,lw,blur,paths){ctx.save();ctx.shadowColor=col;ctx.shadowBlur=blur;ctx.strokeStyle=col;ctx.lineWidth=lw;ctx.lineJoin='round';ctx.lineCap='round';for(const p of paths){ctx.beginPath();p.forEach(([a,b],i)=>i?ctx.lineTo(a,b):ctx.moveTo(a,b));ctx.stroke()}ctx.restore()}
// corona: base ancha, cinco picos y bolitas en las puntas (fondo transparente)
export function crownTex(fill='#ffffff',glow=null){const k=cv(128,96);if(!k)return null;const {x}=k;x.clearRect(0,0,128,96);
 if(glow){x.shadowColor=glow;x.shadowBlur=14}
 x.fillStyle=fill;x.beginPath();x.moveTo(16,76);x.lineTo(20,30);x.lineTo(46,54);x.lineTo(64,18);x.lineTo(82,54);x.lineTo(108,30);x.lineTo(112,76);x.closePath();x.fill();
 for(const [px,py] of [[20,26],[64,14],[108,26]]){x.beginPath();x.arc(px,py,7,0,6.3);x.fill()}
 x.shadowBlur=0;x.fillStyle='rgba(0,0,0,.35)';x.fillRect(16,70,96,4);
 const t=tex(k);t.wrapS=t.wrapT=THREE.ClampToEdgeWrapping;return t}

const cache=new Map();
export function skinFor(ch){
 if(!has())return null;if(cache.has(ch.id))return cache.get(ch.id);
 const C=ch.colors,A=hex(C.accent);let skin=null;
 const S=256,jk=cv(S),jg=cv(S),pk=cv(S),pg=cv(S);
 if(jk&&jg&&pk&&pg){
  // ---- chaqueta ----
  weave(jk,hex(C.uniform));jg.x.fillStyle='#000';jg.x.fillRect(0,0,S,S);
  if(ch.id==='bruno'){ // chaleco táctico: franjas de seguridad amarillas y negras
   for(const k of [jk]){const {x}=k;x.fillStyle=rgba(C.accent,.95);for(let i=-S;i<S*2;i+=44){x.beginPath();x.moveTo(i,S*.78);x.lineTo(i+22,S*.78);x.lineTo(i+22-S*.18,S);x.lineTo(i-S*.18,S);x.closePath();x.fill()}
    x.fillStyle='rgba(0,0,0,.35)';x.fillRect(0,S*.2,S,5);x.fillRect(0,S*.5,S,5);x.strokeStyle='rgba(255,255,255,.1)';x.lineWidth=2;x.strokeRect(10,10,S-20,S-20)}
  }else{
   const zig=[[[0,.3],[.125,.42],[.25,.3],[.375,.42],[.5,.3],[.625,.42],[.75,.3],[.875,.42],[1,.3]],[[0,.66],[.125,.54],[.25,.66],[.375,.54],[.5,.66],[.625,.54],[.75,.66],[.875,.54],[1,.66]]].map(p=>p.map(([a,b])=>[a*S,b*S]));
   for(const k of [jk,jg]){const {x}=k;x.save();x.fillStyle=rgba(C.accent,k===jk?.32:.5);for(const a of [0,.5]){x.beginPath();x.moveTo(a*S,.35*S);x.lineTo((a+.25)*S,.62*S);x.lineTo((a+.5)*S,.35*S);x.lineTo((a+.25)*S,.48*S);x.closePath();x.fill()}x.restore();
    neon(x,A,k===jk?7:9,k===jk?10:14,zig)}
   jk.x.strokeStyle='rgba(255,255,255,.12)';jk.x.lineWidth=2;jk.x.beginPath();jk.x.moveTo(S*.5,0);jk.x.lineTo(S*.5,S);jk.x.stroke();
  }
  // ---- pantalón ----
  weave(pk,hex(C.pants));pg.x.fillStyle='#000';pg.x.fillRect(0,0,S,S);
  if(ch.id==='bruno'){ // camuflaje
   const {x}=pk;for(let i=0;i<70;i++){x.fillStyle=['rgba(70,85,60,.6)','rgba(30,36,30,.6)','rgba(110,120,90,.5)'][i%3];x.beginPath();x.ellipse(Math.random()*S,Math.random()*S,10+Math.random()*26,6+Math.random()*14,Math.random()*3,0,6.3);x.fill()}
  }else{
   for(const k of [pk,pg]){const {x}=k;for(const u of [.25,.75]){neon(x,A,k===pk?6:8,k===pk?8:12,[[[u*S,0],[u*S+10,S*.35],[u*S-6,S*.65],[u*S+8,S]]])}}
   pk.x.strokeStyle='rgba(255,255,255,.1)';pk.x.lineWidth=2;for(const v of [.35,.7]){pk.x.beginPath();pk.x.moveTo(0,v*S);pk.x.lineTo(S,v*S);pk.x.stroke()}
  }
  skin={uniform:tex(jk),uniformGlow:ch.id==='bruno'?null:tex(jg),pants:tex(pk),pantsGlow:ch.id==='bruno'?null:tex(pg)}}
 cache.set(ch.id,skin);return skin}
