import * as THREE from 'three';
import {ACCESSORIES} from './player.js';
const mat=(color,roughness=.9,metalness=0)=>new THREE.MeshStandardMaterial({color,roughness,metalness});
// ---- Texturas procedurales (se dibujan en un canvas al cargar; sin DOM se usa el color liso de siempre) ----
const hex=h=>'#'+h.toString(16).padStart(6,'0');
function texMat(color,kind,rx=1,ry=1){
 if(typeof document==='undefined'||!document.createElement)return mat(color);
 const size=kind==='grass'?256:128,c=document.createElement('canvas');c.width=c.height=size;const x=c.getContext&&c.getContext('2d');if(!x)return mat(color);
 const r=Math.random,sh=(a)=>{const k=1+a;const n=h=>Math.max(0,Math.min(255,Math.round(h*k)));const R=(color>>16)&255,G=(color>>8)&255,B=color&255;return `rgb(${n(R)},${n(G)},${n(B)})`};
 x.fillStyle=hex(color);x.fillRect(0,0,size,size);
 if(kind==='grass'){for(let i=0;i<900;i++){x.fillStyle=sh((r()-.5)*.38);x.fillRect(r()*size,r()*size,1+r()*2,2+r()*4)}for(let i=0;i<14;i++){x.fillStyle=sh(.18);x.beginPath();x.arc(r()*size,r()*size,1+r()*2,0,6.3);x.fill()}}
 else if(kind==='asphalt'){for(let i=0;i<1400;i++){x.fillStyle=sh((r()-.5)*.3);x.fillRect(r()*size,r()*size,1+r()*2,1+r()*2)}x.fillStyle='rgba(235,230,200,.85)';x.fillRect(size/2-3,0,6,size*.5)}
 else if(kind==='wall'){for(let i=0;i<700;i++){x.fillStyle=sh((r()-.5)*.2);x.fillRect(r()*size,r()*size,1+r()*3,1+r()*3)}x.strokeStyle=sh(-.28);x.lineWidth=1.5;for(let y=0;y<=size;y+=32){x.beginPath();x.moveTo(0,y);x.lineTo(size,y);x.stroke()}for(let row=0;row<4;row++){for(let xx=(row%2)*32;xx<=size;xx+=64){x.beginPath();x.moveTo(xx,row*32);x.lineTo(xx,row*32+32);x.stroke()}}}
 else{for(let i=0;i<700;i++){x.fillStyle=sh((r()-.5)*.35);x.fillRect(r()*size,r()*size,2+r()*4,2+r()*4)}}
 const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(rx,ry);t.colorSpace=THREE.SRGBColorSpace;
 return new THREE.MeshStandardMaterial({map:t,roughness:.92,metalness:0})}
function box(scene,x,y,z,sx,sy,sz,material){const m=new THREE.Mesh(new THREE.BoxGeometry(sx,sy,sz),material);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;scene.add(m);return m}
function makeTree(scene,x,z,scale=1){const g=new THREE.Group();const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.18*scale,.28*scale,2.2*scale,8),mat(0x59432e));trunk.position.y=1.1*scale;trunk.castShadow=true;g.add(trunk);for(let i=0;i<3;i++){const crown=new THREE.Mesh(new THREE.ConeGeometry((1.35-i*.2)*scale,2.3*scale,8),mat(i===1?0x315a39:0x3d6b40));crown.position.y=(2.1+i*.72)*scale;crown.castShadow=true;g.add(crown)}g.position.set(x,0,z);scene.add(g);return g}
function makeBuilding(scene,x,z,w,d,color){const g=new THREE.Group();const wall=texMat(color,'wall',Math.max(1,Math.round(w/3)),1),roof=mat(0x333b3a,.7),trim=mat(0x242a29);const body=new THREE.Mesh(new THREE.BoxGeometry(w,3.2,d),wall);body.position.y=1.6;body.castShadow=true;body.receiveShadow=true;g.add(body);const top=new THREE.Mesh(new THREE.BoxGeometry(w+.25,.25,d+.25),roof);top.position.y=3.25;top.castShadow=true;g.add(top);for(let s of [-1,1]){const win=new THREE.Mesh(new THREE.BoxGeometry(.9,.9,.08),mat(0x304d56,.25,.3));win.position.set(s*w*.27,2,-d/2-.045);g.add(win)}const door=new THREE.Mesh(new THREE.BoxGeometry(.85,1.9,.1),trim);door.position.set(0,.95,-d/2-.06);g.add(door);g.position.set(x,0,z);scene.add(g);return g}
function soldier(scene,x,z,index){const g=new THREE.Group();const uniform=mat(index%2?0x7b493e:0x4b5848),skin=mat(0x9c7056),dark=mat(0x252b29);const torso=new THREE.Mesh(new THREE.CapsuleGeometry(.32,.68,4,8),uniform);torso.position.y=1;torso.castShadow=true;g.add(torso);const head=new THREE.Mesh(new THREE.SphereGeometry(.21,12,10),skin);head.position.y=1.72;head.castShadow=true;g.add(head);const pack=new THREE.Mesh(new THREE.BoxGeometry(.4,.5,.22),dark);pack.position.set(0,1,-.3);g.add(pack);for(const s of [-1,1]){const leg=new THREE.Mesh(new THREE.CapsuleGeometry(.1,.5,3,7),dark);leg.position.set(s*.18,.38,0);g.add(leg);const arm=new THREE.Mesh(new THREE.CapsuleGeometry(.09,.42,3,7),uniform);arm.position.set(s*.37,1.05,-.05);g.add(arm)}g.position.set(x,0,z);
 // team: 0 = verdes (índice par), 1 = rojos (índice impar). target: null | 'player' | otro enemigo.
 g.userData={alive:true,hp:100,cooldown:1+Math.random()*2,attack:0,index,team:index%2,
  state:'chase',stun:0,flash:0,flashOn:false,alert:0,sees:false,dying:0,coverPt:null,coverT:0,coverCd:0,last:new THREE.Vector3(x,0,z),head,mats:[uniform,skin],
  target:null,tgtT:Math.random()*.3,wp:null,wpT:0,repoT:3+Math.random()*5,phase:Math.random()*6,
  wantMove:false,moveTime:0,stuckT:0,sx:x,sz:z,dirX:0,dirZ:1,detour:0,detourN:0,detourAge:99,sideSign:1};
 g.children.forEach(c=>{c.userData.owner=g});
 scene.add(g);return g}

export function makeWorld(scene){
 const solids=[],blockers=[],covers=[];
 const addSolid=(mesh,kind,blocks)=>{mesh.userData.kind=kind;solids.push(mesh);if(blocks)blockers.push(mesh)};
 const ground=new THREE.Mesh(new THREE.PlaneGeometry(100,100,1,1),texMat(0x526b43,'grass',24,24));ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;scene.add(ground);addSolid(ground,'dirt',false);
 const patch=new THREE.Mesh(new THREE.PlaneGeometry(80,80),texMat(0x667b4d,'grass',20,20));patch.rotation.x=-Math.PI/2;patch.position.y=.012;scene.add(patch);
 const road=new THREE.Mesh(new THREE.PlaneGeometry(8,100),texMat(0x555b56,'asphalt',1,12));road.rotation.x=-Math.PI/2;road.position.y=.025;scene.add(road);
 for(let i=0;i<90;i++){let x=(Math.random()-.5)*92,z=(Math.random()-.5)*92;if(Math.abs(x)<6)continue;const t=makeTree(scene,x,z,.75+Math.random()*.55);t.children.forEach((c,k)=>addSolid(c,'wood',k===0));covers.push({x,z,hw:.4,hd:.4})}
 const rockMat=texMat(0x686d68,'rock',1,1);for(let i=0;i<35;i++){const rock=new THREE.Mesh(new THREE.DodecahedronGeometry(.3+Math.random()*.65,0),rockMat);rock.position.set((Math.random()-.5)*88,.25,(Math.random()-.5)*88);rock.scale.y=.55;rock.castShadow=true;scene.add(rock);addSolid(rock,'stone',true);const rr=(rock.geometry.parameters.radius||.5)*.8;covers.push({x:rock.position.x,z:rock.position.z,hw:rr,hd:rr})}
 [[-13,-12,8,7,0x9b927e],[13,-18,9,7,0x8d9b98],[-19,14,7,8,0x8d806d],[19,13,8,7,0x9b927e]].forEach(b=>{const g=makeBuilding(scene,b[0],b[1],b[2],b[3],b[4]);addSolid(g.children[0],'stone',true);addSolid(g.children[1],'stone',true);covers.push({x:b[0],z:b[1],hw:b[2]/2,hd:b[3]/2})});
 const mountainMat=mat(0x66766d);for(let i=0;i<18;i++){const a=i/18*Math.PI*2,r=49+Math.random()*5,h=8+Math.random()*13;const m=new THREE.Mesh(new THREE.ConeGeometry(7+Math.random()*5,h,6),mountainMat);m.position.set(Math.cos(a)*r,h/2-1,Math.sin(a)*r);m.castShadow=true;scene.add(m)}
 const enemies=[];const spots=[[-9,-4],[10,-7],[-22,-20],[23,-3],[-25,25],[5,27],[28,25],[-3,-29]];spots.forEach((p,i)=>enemies.push(soldier(scene,p[0],p[1],i)));
 const loot=[];
 // Etiqueta de texto flotante sobre cada caja (se dibuja en un canvas; si no hay DOM, simplemente no se crea)
 function makeLabel(text,color){if(typeof document==='undefined'||!document.createElement)return null;const c=document.createElement('canvas');c.width=256;c.height=64;const x=c.getContext&&c.getContext('2d');if(!x)return null;x.fillStyle='rgba(0,0,0,.55)';x.fillRect(0,0,256,64);x.fillStyle='#'+color.toString(16).padStart(6,'0');x.font='bold 26px sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText(text,128,34);const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(c),transparent:true,depthWrite:false}));sp.scale.set(1.9,.48,1);sp.position.y=1.25;return sp}
 // Aspecto de cada tipo de botín
 const LOOK={ammo:[0xd5b54b,'MUNICIÓN'],med:[0x55cf85,'BOTIQUÍN'],armor:[0x62bce9,'ESCUDO'],weapon:[0xb07cff,'ARMA']};
 // Una caja de botín reutilizable: configure() cambia su tipo, color y etiqueta
 function addLoot(x,z,type,data){const g=new THREE.Group();const cm=new THREE.MeshStandardMaterial({color:0xffffff,metalness:.25,roughness:.45,emissiveIntensity:.12});const cube=new THREE.Mesh(new THREE.BoxGeometry(.65,.5,.65),cm);cube.position.y=.35;cube.castShadow=true;g.add(cube);const rm=mat(0xffffff);const ring=new THREE.Mesh(new THREE.TorusGeometry(.48,.035,6,20),rm);ring.rotation.x=Math.PI/2;ring.position.y=.04;g.add(ring);g.position.set(x,0,z);g.userData={};
  g.userData.configure=(t,d={})=>{const lk=t==='acc'?[ACCESSORIES[d.acc].color,ACCESSORIES[d.acc].name]:t==='weapon'?[LOOK.weapon[0],d.label]:LOOK[t];const col=lk[0];g.userData.type=t;g.userData.active=true;g.userData.weapon=d.weapon;g.userData.acc=d.acc;cm.color.setHex(col);cm.emissive.setHex(col);rm.color.setHex(col);
   const old=g.userData.label;if(old){g.remove(old);if(old.material&&old.material.map&&old.material.map.dispose)old.material.map.dispose()}g.userData.label=null;const lb=makeLabel(lk[1],col);if(lb){g.add(lb);g.userData.label=lb}};
  g.userData.configure(type,data||{});scene.add(g);loot.push(g);return g}
 // Suministros fijos originales
 const lootDefs=['ammo','med','armor','ammo','med','ammo'],lootSpots=[[-5,7],[8,8],[-18,-2],[17,-22],[1,-17],[24,5]];
 lootDefs.forEach((t,i)=>addLoot(lootSpots[i][0],lootSpots[i][1],t));
 // Armas nuevas (índice en player.weapons): subfusil, francotirador, revólver
 [[-13,-18.5,3,'SUBFUSIL'],[31,-27,4,'SNIPER'],[-19,7,5,'REVÓLVER']].forEach(d=>addLoot(d[0],d[1],'weapon',{weapon:d[2],label:d[3]}));
 // Cajas de accesorios fijas: el tipo se sortea en cada partida (reparto equilibrado de los 5 accesorios)
 const accKeys=Object.keys(ACCESSORIES),accSpots=[[-4,-6],[6,-12],[15,0],[-12,3],[-5,-23],[24,-8],[-26,-10],[9,22],[-30,20],[2,-30]];
 const accLoot=accSpots.map(p=>addLoot(p[0],p[1],'acc',{acc:accKeys[0]}));
 // Botín disperso por todo el mapa: 32 cajas que cambian de lugar y de contenido en cada partida
 const scatter=[];for(let i=0;i<32;i++)scatter.push(addLoot(0,0,'ammo'));
 const lootFree=(x,z)=>{for(const c of covers){if(Math.abs(x-c.x)<c.hw+1.3&&Math.abs(z-c.z)<c.hd+1.3)return false}return true};
 function rollLoot(){
  const pool=accSpots.map((_,i)=>accKeys[i%accKeys.length]);for(let i=pool.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]]}accLoot.forEach((g,i)=>g.userData.configure('acc',{acc:pool[i]}));
  const taken=loot.filter(g=>!scatter.includes(g)).map(g=>[g.position.x,g.position.z]);
  scatter.forEach(g=>{let x=0,z=0,tries=0;do{const a=Math.random()*Math.PI*2,r=4+Math.sqrt(Math.random())*33;x=Math.cos(a)*r;z=Math.sin(a)*r;tries++}while(tries<60&&(!lootFree(x,z)||taken.some(p=>Math.hypot(p[0]-x,p[1]-z)<3.5)));taken.push([x,z]);g.position.set(x,0,z);
   const r=Math.random();if(r<.34)g.userData.configure('ammo');else if(r<.56)g.userData.configure('med');else if(r<.72)g.userData.configure('armor');else g.userData.configure('acc',{acc:accKeys[Math.floor(Math.random()*accKeys.length)]})})}
 rollLoot();
 const zone=new THREE.Mesh(new THREE.RingGeometry(0,1,96),new THREE.MeshBasicMaterial({color:0x55d9ff,side:THREE.DoubleSide,transparent:true,opacity:.18,depthWrite:false}));zone.rotation.x=-Math.PI/2;zone.position.y=.09;scene.add(zone);const edge=new THREE.Mesh(new THREE.TorusGeometry(1,.075,8,128),new THREE.MeshBasicMaterial({color:0x69ddff,transparent:true,opacity:.85}));edge.rotation.x=Math.PI/2;edge.position.y=.12;scene.add(edge);

 // ======== IA de enemigos ========
 // Objetivos posibles: el jugador y otros enemigos hostiles. Solo se detecta lo que está a distancia y con línea de visión libre.
 const DETECT_PLAYER=30,DETECT_ENEMY=26,MAP=38;
 const playerPos=new THREE.Vector3(0,0,15),losRay=new THREE.Raycaster(),_o=new THREE.Vector3(),_t=new THREE.Vector3();
 let W=null; // el objeto del mundo (se asigna abajo); W.teams = true → equipos verdes vs rojos; false → todos contra todos
 const hostile=(a,b)=>!W.teams||a.userData.team!==b.userData.team;
 function hasLOSTo(e,x,z){_o.set(e.position.x,1.4,e.position.z);_t.set(x,1.2,z).sub(_o);const dist=_t.length();if(dist<.01)return true;_t.divideScalar(dist);losRay.set(_o,_t);losRay.far=dist;return losRay.intersectObjects(blockers,false).length===0}
 // Empuja un punto fuera de edificios, rocas y troncos (los enemigos no atraviesan obstáculos)
 function pushOut(p){for(const c of covers){const dx=p.x-c.x,dz=p.z-c.z,px=c.hw+.45-Math.abs(dx);if(px<=0)continue;const pz=c.hd+.45-Math.abs(dz);if(pz<=0)continue;if(px<pz)p.x+=(dx<0?-1:1)*px;else p.z+=(dz<0?-1:1)*pz}}
 function blockedPoint(x,z){for(const c of covers){if(Math.abs(x-c.x)<c.hw+.9&&Math.abs(z-c.z)<c.hd+.9)return true}return false}
 // Punto de cobertura: detrás de un obstáculo, en el lado contrario a "from" (de dónde vienen los disparos)
 function findCover(e,from){let best=null,bd=1e9;for(const c of covers){const ex=c.x-e.position.x,ez=c.z-e.position.z;if(ex*ex+ez*ez>400)continue;let ax=c.x-from.x,az=c.z-from.z;const al=Math.hypot(ax,az)||1;ax/=al;az/=al;
  const tx=Math.abs(ax)>1e-6?(c.hw+1.3)/Math.abs(ax):1e9,tz=Math.abs(az)>1e-6?(c.hd+1.3)/Math.abs(az):1e9,off=Math.min(tx,tz);
  const px=c.x+ax*off,pz=c.z+az*off;if(Math.abs(px)>MAP||Math.abs(pz)>MAP)continue;if(Math.hypot(px-from.x,pz-from.z)<5)continue;if(blockedPoint(px,pz))continue;const d=Math.hypot(px-e.position.x,pz-e.position.z);if(d<bd){bd=d;best={x:px,z:pz}}}return best}
 // Mueve al enemigo. Si lleva un rato sin avanzar (atascado), rodea el obstáculo andando de lado (detour).
 function drive(e,vx,vz,dt,travel){const u=e.userData,sp=Math.hypot(vx,vz);if(sp<.01)return;
  if(travel){u.wantMove=true;u.dirX=vx/sp;u.dirZ=vz/sp;if(u.detour>0){const px=-u.dirZ*u.sideSign,pz=u.dirX*u.sideSign;vx=px*sp*.9+vx*.3;vz=pz*sp*.9+vz*.3}}
  e.position.x+=vx*dt;e.position.z+=vz*dt;pushOut(e.position);e.position.x=Math.max(-MAP,Math.min(MAP,e.position.x));e.position.z=Math.max(-MAP,Math.min(MAP,e.position.z))}
 function moveTo(e,tx,tz,speed,dt){const dx=tx-e.position.x,dz=tz-e.position.z,l=Math.hypot(dx,dz);if(l<.05)return l;const s=Math.min(speed,l/dt);drive(e,dx/l*s,dz/l*s,dt,true);return Math.hypot(tx-e.position.x,tz-e.position.z)}
 function face(e,x,z){e.lookAt(x,e.position.y,z)}
 // Elige el objetivo hostil más cercano con línea de visión (el actual tiene ventaja para no cambiar a cada rato)
 function pickTarget(e){const u=e.userData,cands=[];
  const dp=Math.hypot(playerPos.x-e.position.x,playerPos.z-e.position.z);if(dp<DETECT_PLAYER)cands.push({t:'player',d:u.target==='player'?dp*.75:dp,x:playerPos.x,z:playerPos.z});
  for(const o of enemies){if(o===e||!o.userData.alive||!hostile(e,o))continue;const d=Math.hypot(o.position.x-e.position.x,o.position.z-e.position.z);if(d<DETECT_ENEMY)cands.push({t:o,d:u.target===o?d*.75:d,x:o.position.x,z:o.position.z})}
  cands.sort((a,b)=>a.d-b.d);
  for(const c of cands){if(hasLOSTo(e,c.x,c.z)){u.target=c.t;u.sees=true;return}}
  u.target=null;u.sees=false}
 function pickWaypoint(e){const u=e.userData,lim=Math.max(8,Math.min(34,W.zoneRadius-5));for(let i=0;i<8;i++){let x,z;if(Math.random()<.3){x=playerPos.x+(Math.random()-.5)*24;z=playerPos.z+(Math.random()-.5)*24}else{const a=Math.random()*6.283,r=Math.sqrt(Math.random())*lim;x=Math.cos(a)*r;z=Math.sin(a)*r}if(Math.hypot(x,z)>lim||blockedPoint(x,z))continue;u.wp={x,z};u.wpT=12;return}u.wp={x:0,z:0};u.wpT=12}

 W={enemies,loot,zone,edge,solids,blockers,ground,teams:false,zoneRadius:43,zoneCenter:new THREE.Vector2(0,0),phase:0,
  reset(){enemies.forEach(e=>{const u=e.userData;e.visible=true;e.rotation.set(0,0,0);e.position.set(spots[u.index][0],0,spots[u.index][1]);u.alive=true;u.hp=100;u.state='chase';u.stun=0;u.flash=0;u.alert=0;u.sees=false;u.dying=0;u.coverPt=null;u.coverT=0;u.coverCd=0;u.attack=0;u.cooldown=1+Math.random()*2;u.mats.forEach(m=>m.emissive.setHex(0));u.flashOn=false;
   u.target=null;u.tgtT=Math.random()*.3;u.wp=null;u.wpT=0;u.repoT=3+Math.random()*5;u.wantMove=false;u.moveTime=0;u.stuckT=0;u.sx=e.position.x;u.sz=e.position.z;u.detour=0;u.detourN=0;u.detourAge=99;u.last.set(e.position.x,0,e.position.z)});loot.forEach(l=>{l.visible=true;l.userData.active=true});rollLoot();this.zoneRadius=43;this.phase=0;this.zone.scale.setScalar(43);this.edge.scale.setScalar(43)},
  // Aplica daño a un enemigo. attacker: 'player' (por defecto) u otro enemigo. Devuelve true si muere.
  damageEnemy(e,amount,attacker){const u=e.userData;if(!u.alive)return false;u.hp-=amount;if(u.hp<=0){u.hp=0;u.alive=false;u.state='dead';u.dying=.9;u.sees=false;u.flash=0;u.target=null;u.mats.forEach(m=>m.emissive.setHex(0));return true}
   const byEnemy=attacker&&attacker!=='player',ap=byEnemy?attacker.position:playerPos;
   u.flash=.09;u.stun=.14;u.alert=8;u.last.set(ap.x,0,ap.z);u.tgtT=0;
   if(u.state!=='cover'&&u.hp<55&&u.coverCd<=0&&Math.random()<.5){const c=findCover(e,ap);if(c){u.coverPt=c;u.coverT=3+Math.random()*2;u.state='cover'}}
   return false},
  // Un ruido (disparo del jugador) alerta a los enemigos cercanos que aún no tienen objetivo: van a investigar.
  alertNear(pos,radius){for(const e of enemies){const u=e.userData;if(!u.alive||u.target)continue;if(Math.hypot(pos.x-e.position.x,pos.z-e.position.z)<radius){u.alert=6;u.last.set(pos.x,0,pos.z)}}},
  update(dt,player,elapsed){this.phase=Math.min(1,elapsed/100);this.zoneRadius=43-25*this.phase;this.zone.scale.setScalar(this.zoneRadius);this.edge.scale.setScalar(this.zoneRadius);this.loot.forEach(l=>{if(l.userData.active)l.rotation.y+=dt*.8});
   playerPos.copy(player.position);
   enemies.forEach(e=>{const u=e.userData;
    if(!u.alive){if(u.dying>0){u.dying=Math.max(0,u.dying-dt);const k=1-u.dying/.9;e.rotation.x=-k*Math.PI/2;e.position.y=-k*.3;if(u.dying<=0)e.visible=false}return}
    u.flash=Math.max(0,u.flash-dt);u.stun=Math.max(0,u.stun-dt);u.alert=Math.max(0,u.alert-dt);u.coverCd=Math.max(0,u.coverCd-dt);u.detour=Math.max(0,u.detour-dt);u.detourAge+=dt;u.phase+=dt;
    const on=u.flash>0;if(on!==u.flashOn){u.flashOn=on;u.mats.forEach(m=>m.emissive.setHex(on?0xff2a00:0))}
    // detección de atasco: si intentó avanzar casi todo el segundo y se movió menos de 0.4 m, rodea el obstáculo (cada vez más tiempo y siempre hacia el mismo lado)
    if(u.wantMove)u.moveTime+=dt;u.wantMove=false;u.stuckT+=dt;
    if(u.stuckT>=1){const moved=Math.hypot(e.position.x-u.sx,e.position.z-u.sz);u.sx=e.position.x;u.sz=e.position.z;
     if(u.moveTime>.7&&moved<.4&&u.detour<=0){if(u.detourAge<6){u.detourN=Math.min(5,u.detourN+1)}else{u.detourN=0;u.sideSign=Math.random()<.5?-1:1}u.detour=Math.min(6,1.3*(1+u.detourN*.8));u.detourAge=0;u.wp=null}
     else if(moved>1.5)u.detourN=0;
     u.stuckT=0;u.moveTime=0}
    // objetivo: se revalúa cada ~0.3 s; si el objetivo murió se deja de inmediato
    if(u.target&&u.target!=='player'&&!u.target.userData.alive){u.target=null;u.sees=false;u.tgtT=0}
    u.tgtT-=dt;if(u.tgtT<=0){u.tgtT=.25+Math.random()*.1;pickTarget(e)}
    let tp=null;if(u.target==='player')tp=player.position;else if(u.target)tp=u.target.position;
    if(tp&&u.sees){u.alert=5;u.last.set(tp.x,0,tp.z)}
    if(u.stun>0)return;
    // separación entre enemigos para que no se apilen
    for(const o of enemies){if(o===e||!o.userData.alive)continue;const sx=e.position.x-o.position.x,sz=e.position.z-o.position.z,sd=Math.hypot(sx,sz);if(sd<.9&&sd>.001){const k=(.9-sd)*.5;e.position.x+=sx/sd*k;e.position.z+=sz/sd*k}}
    // retirada a cobertura
    if(u.state==='cover'){u.coverT-=dt;const left=u.coverPt?moveTo(e,u.coverPt.x,u.coverPt.z,3,dt):0;face(e,u.last.x,u.last.z);if(left<.6||u.coverT<=0){u.state='chase';u.coverPt=null;u.coverCd=7}return}
    if(tp&&u.sees){
     const dx=tp.x-e.position.x,dz=tp.z-e.position.z,D=Math.hypot(dx,dz)||1,ux=dx/D,uz=dz/D;
     // cambiar de posición durante el combate: cada 5-10 s puede ir a otra cobertura
     u.repoT-=dt;if(u.repoT<=0){u.repoT=5+Math.random()*5;if(u.coverCd<=0&&Math.random()<.6){const c=findCover(e,tp);if(c){u.coverPt=c;u.coverT=2.5+Math.random()*2;u.state='cover';return}}}
     let s=0,lat=0;
     if(u.target==='player'){ // persigue al jugador como antes (hasta contacto), zigzagueando mientras dispara
      if(D>1.8){s=D>8?1.8:1.1;if(D<17&&D>3)lat=Math.sin(u.phase*1.6)*s*.5}
     }else{ // contra otro enemigo: se acerca hasta ~10 m, retrocede si está a menos de 6 m, y se mueve de lado
      if(D>10)s=1.6;else if(D<6)s=-1;lat=Math.sin(u.phase*1.4)*.8}
     if(s!==0||lat!==0)drive(e,ux*s-uz*lat,uz*s+ux*lat,dt,Math.abs(s)>.3);
     face(e,tp.x,tp.z);return}
    // sin objetivo visible: ir a la última posición conocida; si no hay, patrullar
    if(u.alert>0){const left=moveTo(e,u.last.x,u.last.z,2,dt);face(e,u.last.x,u.last.z);if(left<1)u.alert=0;return}
    if(Math.hypot(e.position.x,e.position.z)>this.zoneRadius-1){u.wp={x:0,z:0};u.wpT=8}
    if(!u.wp||u.wpT<=0)pickWaypoint(e);u.wpT-=dt;
    const left=moveTo(e,u.wp.x,u.wp.z,1.3,dt);face(e,u.wp.x,u.wp.z);if(left<1.5)u.wp=null
   })}};
 return W}
