import * as THREE from 'three';
import {texMat,mat} from './textures.js';
import {HALF,N,CELL,ROWS,POIS,ROADS} from './mapdata.js';

// ---------- Mapa de la isla ----------
// Todo el terreno es UNA malla con colores por vértice (un solo dibujo), los árboles y rocas son instancias
// (3 dibujos para cientos de objetos) y los edificios se fusionan en 2 mallas. Así el mapa grande sigue siendo ligero.
export {HALF,POIS};
const mkRng=(s=>()=>{s|=0;s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296});
const CLS={'.':0,s:1,g:2,f:3};
const cls=ROWS.map(r=>[...r].map(c=>CLS[c]||0));
const cellAt=(i,j)=>i<0||j<0||i>=N||j>=N?0:cls[j][i];
// Fracción de tierra suavizada: 0 = agua, 1 = tierra firme (la costa queda en 0.5)
let B=Array.from({length:N},(_,j)=>Array.from({length:N},(_,i)=>cellAt(i,j)?1:0));
for(let pass=0;pass<2;pass++){const o=B.map(r=>r.slice());const g=(a,b)=>a<0||b<0||a>=N||b>=N?0:B[b][a];
 for(let j=0;j<N;j++)for(let i=0;i<N;i++){let s=0;for(let dj=-1;dj<=1;dj++)for(let di=-1;di<=1;di++)s+=g(i+di,j+dj)*(di?1:2)*(dj?1:2);o[j][i]=s/16}B=o}
export function landFrac(x,z){const u=(x+HALF)/CELL-.5,v=(z+HALF)/CELL-.5,i=Math.floor(u),j=Math.floor(v),fu=u-i,fv=v-j;
 const g=(a,b)=>a<0||b<0||a>=N||b>=N?0:B[b][a];
 return (g(i,j)*(1-fu)+g(i+1,j)*fu)*(1-fv)+(g(i,j+1)*(1-fu)+g(i+1,j+1)*fu)*fv}
export const isLand=(x,z)=>landFrac(x,z)>=.5;
export const classAt=(x,z)=>cellAt(Math.floor((x+HALF)/CELL),Math.floor((z+HALF)/CELL));
export const gridColors=['#1d5f9a','#d9c58f','#72a14a','#3f7a35'];
export {cls as GRID};

function segDist(px,pz,ax,az,bx,bz){const dx=bx-ax,dz=bz-az,l=dx*dx+dz*dz;let t=l?((px-ax)*dx+(pz-az)*dz)/l:0;t=Math.max(0,Math.min(1,t));return Math.hypot(px-(ax+dx*t),pz-(az+dz*t))}
const roadDist=(x,z)=>{let d=1e9;for(const [a,b] of ROADS){const p=POIS[a],q=POIS[b];d=Math.min(d,segDist(x,z,p.x,p.z,q.x,q.z))}return d};
const poiDist=(x,z)=>{let d=1e9,k=null;for(const p of POIS){const e=Math.hypot(x-p.x,z-p.z)/p.r;if(e<d){d=e;k=p}}return {d,poi:k}};

export function makeTerrain(scene){
 const covers=[],rng=mkRng(20240611); // misma isla en cada partida
 // ---- suelo: una sola malla con color por vértice + textura de detalle repetida ----
 const SEG=128,SIZE=2*HALF+24,geo=new THREE.PlaneGeometry(SIZE,SIZE,SEG,SEG);geo.rotateX(-Math.PI/2);
 const pos=geo.attributes&&geo.attributes.position;
 if(pos){const col=new Float32Array(pos.count*3),c=new THREE.Color(),c2=new THREE.Color();
  const PAL={sand:0xdac690,grass:0x79a84c,forest:0x4a8a3a,deep:0x2e6f8c,road:0x9b8f76,plaza:0x8d9088,dirt:0x8a7a58};
  for(let k=0;k<pos.count;k++){const x=pos.getX(k),z=pos.getZ(k),l=landFrac(x,z);
   const n=Math.sin(x*.21)*Math.cos(z*.17)*.5+Math.sin(x*.07+z*.11)*.5; // ruido suave
   pos.setY(k,l<.5?-(.5-l)*6:0);
   if(l<.5)c.setHex(PAL.deep);
   else{const cl=classAt(x,z);c.setHex(cl===3?PAL.forest:cl===1?PAL.sand:PAL.grass);
    if(l<.66)c.lerp(c2.setHex(PAL.sand),Math.min(1,(.66-l)/.12));
    const pd=poiDist(x,z);if(pd.d<.85&&pd.poi.kind!=='military')c.lerp(c2.setHex(pd.d<.55?PAL.plaza:PAL.dirt),pd.d<.55?.85:(.85-pd.d)/.3*.6);
    if(pd.d<.8&&pd.poi.kind==='military')c.lerp(c2.setHex(PAL.dirt),.7);
    const rd=roadDist(x,z);if(rd<2.4)c.lerp(c2.setHex(PAL.road),rd<1.4?.9:.55);}
   const sh=1+n*.07;col[k*3]=c.r*sh;col[k*3+1]=c.g*sh;col[k*3+2]=c.b*sh}
  geo.setAttribute('color',new THREE.BufferAttribute(col,3));geo.computeVertexNormals()}
 const gm=texMat(0xffffff,'grass',64,64);gm.vertexColors=true;
 const ground=new THREE.Mesh(geo,gm);ground.receiveShadow=true;scene.add(ground);
 // ---- agua ----
 const water=new THREE.Mesh(new THREE.PlaneGeometry(1400,1400),new THREE.MeshStandardMaterial({color:0x2a8bc8,roughness:.2,metalness:.1,transparent:true,opacity:.9}));
 water.rotation.x=-Math.PI/2;water.position.y=-.5;scene.add(water);
 // ---- caminos libres: no se ponen árboles ni edificios sobre ellos ----
 const nearPoi=(x,z,k=1)=>{for(const p of POIS)if(Math.hypot(x-p.x,z-p.z)<p.r*k)return true;return false};
 const onRoad=(x,z,w=5)=>roadDist(x,z)<w;
 // ---- edificios ----
 const items=[];const PALETTE=[0xd8cdb4,0xc9d4cf,0xd9bfa4,0xcfc3d6,0xb8c9d9,0xe0d6a8];
 const free=(x,z,hw,hd,pad=3.2)=>{for(const c of covers)if(Math.abs(x-c.x)<hw+c.hw+pad&&Math.abs(z-c.z)<hd+c.hd+pad)return false;
  for(const [dx,dz] of [[-1,-1],[1,-1],[-1,1],[1,1],[0,0]])if(landFrac(x+dx*hw,z+dz*hd)<.85)return false;return true};
 const addBox=(x,z,w,d,h,color,kind='stone',roof=true)=>{items.push({x,z,w,d,h,y:h/2,c:new THREE.Color(color),roof});covers.push({x,z,hw:w/2,hd:d/2,h,kind})};
 for(const p of POIS){
  if(p.kind==='military'){ // fortaleza: edificio central, muros bajos con huecos y dos torres
   const cx=p.x,cz=p.z;addBox(cx,cz,12,9,4.2,0x8d9088);
   const R=13;for(const [sx,sz,w,d] of [[0,-R,16,1],[0,R,16,1],[-R,0,1,16],[R,0,1,16]]){for(const o of [-1,1])addBox(cx+sx+(w>d?o*(w/2+3):0),cz+sz+(w>d?0:o*(d/2+3)),w>d?w:1,w>d?1:d,2.4,0x777a73,'stone',false)}
   for(const [sx,sz] of [[-R,-R],[R,R]])addBox(cx+sx,cz+sz,3.4,3.4,8,0x7a7d76);
   continue}
  let placed=0,tries=0;const maxTry=p.n*60;
  while(placed<p.n&&tries++<maxTry){const a=rng()*6.283,r=Math.sqrt(rng())*p.r*.95,x=p.x+Math.cos(a)*r,z=p.z+Math.sin(a)*r;
   const w=6+Math.floor(rng()*6),d=5+Math.floor(rng()*5),tall=p.kind==='town'&&rng()<.35,h=tall?6.6:3.4;
   if(onRoad(x,z,w/2+1.5)&&rng()<.85)continue;if(!free(x,z,w/2,d/2))continue;
   addBox(x,z,w,d,h,PALETTE[Math.floor(rng()*PALETTE.length)]);placed++}}
 // fusiona todos los cuerpos y todos los techos en una malla cada uno
 const wallMat=texMat(0xffffff,'wall',1,1);wallMat.vertexColors=true;const roofMat=mat(0x3b4140,.75);roofMat.vertexColors=true;
 function merge(list,material,roof){
  const probe=new THREE.BoxGeometry(1,1,1);
  if(!probe.attributes||!probe.attributes.position){for(const b of list){const m=new THREE.Mesh(new THREE.BoxGeometry(b.w,b.h,b.d),material);m.position.set(b.x,roof?b.h+.15:b.y,b.z);scene.add(m)}return}
  const P=[],Nn=[],U=[],C=[],I=[];let off=0;
  for(const b of list){const w=roof?b.w+.3:b.w,h=roof?.3:b.h,d=roof?b.d+.3:b.d,cy=roof?b.h+.15:b.y;const g=new THREE.BoxGeometry(w,h,d),pa=g.attributes.position,na=g.attributes.normal,ua=g.attributes.uv,ia=g.index;
   const col=roof?{r:.2,g:.22,b:.22}:b.c;
   for(let k=0;k<pa.count;k++){P.push(pa.getX(k)+b.x,pa.getY(k)+cy,pa.getZ(k)+b.z);const nx=na.getX(k),nz=na.getZ(k);Nn.push(nx,na.getY(k),nz);
    let u=ua.getX(k),v=ua.getY(k);if(Math.abs(nx)>.5){u*=d/3;v*=h/3.2}else if(Math.abs(nz)>.5){u*=w/3;v*=h/3.2}else{u*=w/3;v*=d/3}
    U.push(u,v);C.push(col.r,col.g,col.b)}
   for(let k=0;k<ia.count;k++)I.push(ia.getX(k)+off);off+=pa.count;g.dispose()}
  const G=new THREE.BufferGeometry();G.setAttribute('position',new THREE.Float32BufferAttribute(P,3));G.setAttribute('normal',new THREE.Float32BufferAttribute(Nn,3));G.setAttribute('uv',new THREE.Float32BufferAttribute(U,2));G.setAttribute('color',new THREE.Float32BufferAttribute(C,3));G.setIndex(I);
  const m=new THREE.Mesh(G,material);m.castShadow=true;m.receiveShadow=true;scene.add(m)}
 merge(items,wallMat,false);merge(items.filter(b=>b.roof),roofMat,true);
 // ---- árboles y rocas: instancias ----
 const trees=[];
 for(let gx=-HALF;gx<HALF;gx+=3.3)for(let gz=-HALF;gz<HALF;gz+=3.3){const x=gx+rng()*3.3,z=gz+rng()*3.3,l=landFrac(x,z);if(l<.8)continue;
  const cl=classAt(x,z),pr=cl===3?.62:cl===2?.08:0;if(rng()>pr)continue;
  if(nearPoi(x,z,.8)&&rng()<.85)continue;if(onRoad(x,z,4.5))continue;
  let bad=false;for(const c of covers)if(Math.abs(x-c.x)<c.hw+2&&Math.abs(z-c.z)<c.hd+2){bad=true;break}if(bad)continue;
  trees.push([x,z,.8+rng()*.7]);if(trees.length>=1300)break}
 const tmp=new THREE.Object3D(),inst=(g,m,n,cast)=>{const o=new THREE.InstancedMesh(g,m,n);o.castShadow=cast;o.receiveShadow=true;scene.add(o);return o};
 const tn=trees.length;
 if(tn&&THREE.InstancedMesh){
  const trunk=inst(new THREE.CylinderGeometry(.18,.3,2.4,6),mat(0x5a4330),tn,true),cA=inst(new THREE.ConeGeometry(1.6,2.8,7),mat(0x2f6b34,.95),tn,true),cB=inst(new THREE.ConeGeometry(1.15,2.3,7),mat(0x3b7d3b,.95),tn,false);
  const gc=new THREE.Color();
  trees.forEach(([x,z,s],i)=>{const put=(m,y,sc)=>{tmp.position.set(x,y*s,z);tmp.scale.set(s*sc,s,s*sc);tmp.rotation.y=i*1.7;tmp.updateMatrix();m.setMatrixAt(i,tmp.matrix)};
   put(trunk,1.2,1);put(cA,3.4,1);put(cB,4.55,1);
   if(cA.setColorAt){gc.setHex(0x2f6b34).offsetHSL((rng()-.5)*.04,0,(rng()-.5)*.1);cA.setColorAt(i,gc);gc.offsetHSL(.01,0,.04);cB.setColorAt(i,gc)}
   covers.push({x,z,hw:.35,hd:.35,h:7,kind:'wood'})});
  for(const m of [trunk,cA,cB]){m.instanceMatrix.needsUpdate=true;if(m.instanceColor)m.instanceColor.needsUpdate=true}}
 const rocks=[];
 for(let i=0,t=0;i<110&&t<2000;t++){const x=(rng()*2-1)*(HALF-8),z=(rng()*2-1)*(HALF-8);if(landFrac(x,z)<.85||nearPoi(x,z,.7)||onRoad(x,z,3))continue;
  const r=.7+rng()*.9;let bad=false;for(const c of covers)if(Math.abs(x-c.x)<c.hw+r+1&&Math.abs(z-c.z)<c.hd+r+1){bad=true;break}if(bad)continue;rocks.push([x,z,r]);i++}
 if(rocks.length&&THREE.InstancedMesh){const rm=inst(new THREE.DodecahedronGeometry(1,0),mat(0x7b7f79,.95),rocks.length,true);rm.material.flatShading=true;
  rocks.forEach(([x,z,r],i)=>{tmp.position.set(x,r*.55,z);tmp.scale.set(r,r*.75,r);tmp.rotation.y=i*2.3;tmp.updateMatrix();rm.setMatrixAt(i,tmp.matrix);covers.push({x,z,hw:r*.85,hd:r*.85,h:r*1.2,kind:'stone'})});rm.instanceMatrix.needsUpdate=true}
 return {covers,ground,water,pois:POIS}
}
