import * as THREE from 'three';
export const mat=(color,roughness=.9,metalness=0)=>new THREE.MeshStandardMaterial({color,roughness,metalness});
// ---- Texturas procedurales (se dibujan en un canvas al cargar; sin DOM se usa el color liso de siempre) ----
const hex=h=>'#'+h.toString(16).padStart(6,'0');
export function texMat(color,kind,rx=1,ry=1){
 if(typeof document==='undefined'||!document.createElement)return mat(color);
 const size=kind==='grass'?256:128,c=document.createElement('canvas');c.width=c.height=size;const x=c.getContext&&c.getContext('2d');if(!x)return mat(color);
 const r=Math.random,sh=(a)=>{const k=1+a;const n=h=>Math.max(0,Math.min(255,Math.round(h*k)));const R=(color>>16)&255,G=(color>>8)&255,B=color&255;return `rgb(${n(R)},${n(G)},${n(B)})`};
 x.fillStyle=hex(color);x.fillRect(0,0,size,size);
 if(kind==='grass'){for(let i=0;i<900;i++){x.fillStyle=sh((r()-.5)*.38);x.fillRect(r()*size,r()*size,1+r()*2,2+r()*4)}for(let i=0;i<14;i++){x.fillStyle=sh(.18);x.beginPath();x.arc(r()*size,r()*size,1+r()*2,0,6.3);x.fill()}}
 else if(kind==='asphalt'){for(let i=0;i<1400;i++){x.fillStyle=sh((r()-.5)*.3);x.fillRect(r()*size,r()*size,1+r()*2,1+r()*2)}x.fillStyle='rgba(235,230,200,.85)';x.fillRect(size/2-3,0,6,size*.5)}
 else if(kind==='wall'){for(let i=0;i<700;i++){x.fillStyle=sh((r()-.5)*.2);x.fillRect(r()*size,r()*size,1+r()*3,1+r()*3)}x.strokeStyle=sh(-.28);x.lineWidth=1.5;for(let y=0;y<=size;y+=32){x.beginPath();x.moveTo(0,y);x.lineTo(size,y);x.stroke()}for(let row=0;row<4;row++){for(let xx=(row%2)*32;xx<=size;xx+=64){x.beginPath();x.moveTo(xx,row*32);x.lineTo(xx,row*32+32);x.stroke()}}}
 else{for(let i=0;i<700;i++){x.fillStyle=sh((r()-.5)*.35);x.fillRect(r()*size,r()*size,2+r()*4,2+r()*4)}}
 if(kind==='wall'){x.fillStyle='rgba(40,60,70,.95)';x.fillRect(size*.5-15,size*.26,30,36);x.fillStyle='rgba(150,190,210,.35)';x.fillRect(size*.5-15,size*.26,30,10);x.strokeStyle='rgba(20,24,24,.9)';x.lineWidth=3;x.strokeRect(size*.5-15,size*.26,30,36)}
 const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(rx,ry);t.colorSpace=THREE.SRGBColorSpace;
 return new THREE.MeshStandardMaterial({map:t,roughness:.92,metalness:0})}
