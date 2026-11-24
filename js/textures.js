import * as THREE from 'three';
export const mat=(color,roughness=.9,metalness=0)=>new THREE.MeshStandardMaterial({color,roughness,metalness});
// ---- Texturas procedurales (se dibujan en un canvas al cargar; sin DOM se usa el color liso de siempre) ----
const hex=h=>'#'+h.toString(16).padStart(6,'0');
const SIZES={grass:512,rock:512,wall:256,tiles:256,bark:128,foliage:256,water:256,asphalt:128};
// Dibuja los detalles de cada tipo de superficie. x = contexto 2D, s = tamaño, sh(a) = el color base más claro/oscuro, r = aleatorio
function paint(kind,x,s,sh,r,color){
 const blob=(n,amp,rmin,rmax)=>{for(let i=0;i<n;i++){const px=r()*s,py=r()*s,rad=rmin+r()*(rmax-rmin),a=(r()-.5)*amp;const g=x.createRadialGradient(px,py,0,px,py,rad);g.addColorStop(0,sh(a).replace('rgb','rgba').replace(')',',.5)'));g.addColorStop(1,sh(a).replace('rgb','rgba').replace(')',',0)'));x.fillStyle=g;x.fillRect(px-rad,py-rad,rad*2,rad*2)}};
 if(kind==='grass'){ // pasto/tierra: manchas grandes, briznas y granitos
  blob(46,.5,30,90);
  x.lineWidth=1;for(let i=0;i<2600;i++){x.strokeStyle=sh((r()-.5)*.5);const px=r()*s,py=r()*s,l=3+r()*7,a=-1.57+(r()-.5)*.9;x.beginPath();x.moveTo(px,py);x.lineTo(px+Math.cos(a)*l,py+Math.sin(a)*l);x.stroke()}
  for(let i=0;i<500;i++){x.fillStyle=sh((r()-.5)*.35);x.fillRect(r()*s,r()*s,1+r()*2,1+r()*2)}
  for(let i=0;i<10;i++){x.fillStyle=sh(.25);x.beginPath();x.arc(r()*s,r()*s,1+r()*1.8,0,6.3);x.fill()}
 }else if(kind==='rock'){ // suelo pedregoso / roca: piedras con borde oscuro y grietas
  blob(30,.4,30,80);
  for(let i=0;i<150;i++){const px=r()*s,py=r()*s,rx=4+r()*12,ry=rx*(.5+r()*.5),a=(r()-.5)*.5;x.save();x.translate(px,py);x.rotate(r()*3);const g=x.createLinearGradient(-rx,-ry,rx,ry);g.addColorStop(0,sh(.22+a));g.addColorStop(1,sh(-.25+a));x.fillStyle=g;x.beginPath();x.ellipse(0,0,rx,ry,0,0,6.3);x.fill();x.strokeStyle=sh(-.45);x.lineWidth=1.2;x.stroke();x.restore()}
  x.strokeStyle=sh(-.4);x.lineWidth=1;for(let i=0;i<14;i++){let px=r()*s,py=r()*s;x.beginPath();x.moveTo(px,py);for(let k=0;k<5;k++){px+=(r()-.5)*26;py+=(r()-.3)*20;x.lineTo(px,py)}x.stroke()}
  for(let i=0;i<700;i++){x.fillStyle=sh((r()-.5)*.4);x.fillRect(r()*s,r()*s,1+r()*2,1+r()*2)}
 }else if(kind==='asphalt'){
  for(let i=0;i<1400;i++){x.fillStyle=sh((r()-.5)*.3);x.fillRect(r()*s,r()*s,1+r()*2,1+r()*2)}x.fillStyle='rgba(235,230,200,.85)';x.fillRect(s/2-3,0,6,s*.5);
 }else if(kind==='wall'){ // revoque desgastado, vetas de humedad, zócalo y ventana con marco, vidrio y alféizar
  blob(26,.25,20,60);for(let i=0;i<1100;i++){x.fillStyle=sh((r()-.5)*.2);x.fillRect(r()*s,r()*s,1+r()*2,1+r()*2)}
  for(let i=0;i<22;i++){const px=r()*s,w=2+r()*5,g=x.createLinearGradient(0,0,0,s);g.addColorStop(0,'rgba(40,36,30,0)');g.addColorStop(.5,'rgba(40,36,30,.12)');g.addColorStop(1,'rgba(40,36,30,0)');x.fillStyle=g;x.fillRect(px,0,w,s)}
  x.strokeStyle=sh(-.22);x.lineWidth=1;for(let y=0;y<=s;y+=32){x.beginPath();x.moveTo(0,y+.5);x.lineTo(s,y+.5);x.stroke()}
  x.fillStyle=sh(-.3);x.fillRect(0,s-22,s,22); // zócalo
  const wx=s*.5-24,wy=s*.2,ww=48,wh=62;x.fillStyle='rgba(30,28,26,.9)';x.fillRect(wx-5,wy-5,ww+10,wh+10);
  const g=x.createLinearGradient(wx,wy,wx+ww,wy+wh);g.addColorStop(0,'rgba(120,170,200,.95)');g.addColorStop(.5,'rgba(50,80,100,.97)');g.addColorStop(1,'rgba(25,40,55,.97)');x.fillStyle=g;x.fillRect(wx,wy,ww,wh);
  x.strokeStyle='rgba(215,215,205,.95)';x.lineWidth=3;x.strokeRect(wx,wy,ww,wh);x.beginPath();x.moveTo(wx+ww/2,wy);x.lineTo(wx+ww/2,wy+wh);x.moveTo(wx,wy+wh/2);x.lineTo(wx+ww,wy+wh/2);x.stroke();
  x.fillStyle='rgba(210,205,190,.95)';x.fillRect(wx-8,wy+wh+5,ww+16,5);
 }else if(kind==='tiles'){ // tejas en hileras
  for(let row=0;row<8;row++){const y=row*s/8,off=(row%2)*s/16;for(let c=-1;c<9;c++){const px=c*s/8+off;const g=x.createLinearGradient(0,y,0,y+s/8);g.addColorStop(0,sh(.18+(r()-.5)*.15));g.addColorStop(1,sh(-.28));x.fillStyle=g;x.beginPath();x.moveTo(px,y);x.lineTo(px+s/8-1.5,y);x.lineTo(px+s/8-1.5,y+s/8*.7);x.quadraticCurveTo(px+s/16,y+s/8*1.15,px,y+s/8*.7);x.closePath();x.fill()}}
  for(let i=0;i<400;i++){x.fillStyle=sh((r()-.5)*.3);x.fillRect(r()*s,r()*s,1+r()*2,1+r()*2)}
 }else if(kind==='bark'){
  for(let i=0;i<70;i++){const px=r()*s,w=1+r()*4;x.fillStyle=sh((r()-.5)*.6);x.fillRect(px,0,w,s)}
  for(let i=0;i<40;i++){x.fillStyle=sh(-.4);x.fillRect(r()*s,r()*s,1+r()*3,6+r()*14)}
 }else if(kind==='foliage'){ // racimos de hojas claras y oscuras
  for(let i=0;i<650;i++){const px=r()*s,py=r()*s,rx=3+r()*6,a=(r()-.5)*.75;x.fillStyle=sh(a);x.beginPath();x.ellipse(px,py,rx,rx*.55,r()*3,0,6.3);x.fill()}
  for(let i=0;i<120;i++){x.fillStyle=sh(-.5);x.fillRect(r()*s,r()*s,2,2)}
 }else if(kind==='water'){ // reflejos ondulados
  x.lineWidth=1.5;for(let i=0;i<46;i++){x.strokeStyle='rgba(255,255,255,'+(.05+r()*.12)+')';let px=r()*s,py=r()*s;x.beginPath();x.moveTo(px,py);for(let k=0;k<7;k++){px+=10+r()*10;py+=(r()-.5)*8;x.lineTo(px,py)}x.stroke()}
  blob(20,.3,20,60);
 }else{for(let i=0;i<900;i++){x.fillStyle=sh((r()-.5)*.35);x.fillRect(r()*s,r()*s,2+r()*4,2+r()*4)}}
}
const cache=new Map();
export function texMat(color,kind,rx=1,ry=1,opts={}){
 if(typeof document==='undefined'||!document.createElement)return mat(color);
 const size=SIZES[kind]||128,key=kind+color;let tex=cache.get(key);
 if(!tex){const c=document.createElement('canvas');c.width=c.height=size;const x=c.getContext&&c.getContext('2d');if(!x)return mat(color);
  const r=Math.random,sh=a=>{const k=1+a,n=h=>Math.max(0,Math.min(255,Math.round(h*k)));return `rgb(${n((color>>16)&255)},${n((color>>8)&255)},${n(color&255)})`};
  x.fillStyle=hex(color);x.fillRect(0,0,size,size);paint(kind,x,size,sh,r,color);
  tex=new THREE.CanvasTexture(c);tex.wrapS=tex.wrapT=THREE.RepeatWrapping;tex.colorSpace=THREE.SRGBColorSpace;
  if(tex.anisotropy!==undefined)tex.anisotropy=4;cache.set(key,tex)}
 // las texturas se comparten entre materiales; cada material solo cambia su repetición mediante su propia copia ligera
 const t=tex.clone?tex.clone():tex;if(t!==tex){t.needsUpdate=true;t.source=tex.source}t.repeat.set(rx,ry);
 return new THREE.MeshStandardMaterial({map:t,roughness:opts.roughness??.92,metalness:opts.metalness??0})}
