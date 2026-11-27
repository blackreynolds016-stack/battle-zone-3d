import * as THREE from 'three';
import {ACCESSORIES} from './player.js';
import {mat,texMat} from './textures.js';
import {makeTerrain,isLand,landFrac,HALF,POIS} from './terrain.js';
export {mat,texMat};
function soldier(scene,x,z,index){const g=new THREE.Group();const uniform=mat(index%2?0x7b493e:0x4b5848),skin=mat(0x9c7056),dark=mat(0x252b29);const torso=new THREE.Mesh(new THREE.CapsuleGeometry(.32,.68,4,8),uniform);torso.position.y=1;torso.castShadow=true;g.add(torso);const head=new THREE.Mesh(new THREE.SphereGeometry(.21,12,10),skin);head.position.y=1.72;head.castShadow=true;g.add(head);const pack=new THREE.Mesh(new THREE.BoxGeometry(.4,.5,.22),dark);pack.position.set(0,1,-.3);g.add(pack);const limbs=[];for(const s of [-1,1]){const lg=new THREE.CapsuleGeometry(.1,.5,3,7),ag=new THREE.CapsuleGeometry(.09,.42,3,7);if(lg.translate){lg.translate(0,-.35,0);ag.translate(0,-.3,0)}const leg=new THREE.Mesh(lg,dark);leg.position.set(s*.18,lg.translate?.73:.38,0);leg.castShadow=true;g.add(leg);const arm=new THREE.Mesh(ag,uniform);arm.position.set(s*.37,ag.translate?1.35:1.05,-.05);arm.castShadow=true;g.add(arm);limbs.push(leg,arm)}g.position.set(x,0,z);
 // team: 0 = verdes (índice par), 1 = rojos (índice impar). target: null | 'player' | otro enemigo.
 g.userData={limbs,alive:true,hp:100,cooldown:1+Math.random()*2,attack:0,index,team:index%2,
  state:'chase',stun:0,flash:0,flashOn:false,alert:0,sees:false,dying:0,coverPt:null,coverT:0,coverCd:0,last:new THREE.Vector3(x,0,z),head,mats:[uniform,skin],
  target:null,tgtT:Math.random()*.3,wp:null,wpT:0,repoT:3+Math.random()*5,phase:Math.random()*6,
  wantMove:false,moveTime:0,stuckT:0,sx:x,sz:z,dirX:0,dirZ:1,detour:0,detourN:0,detourAge:99,sideSign:1};
 g.children.forEach(c=>{c.userData.owner=g});
 // barra de vida sobre la cabeza (siempre mira a la cámara)
 {const bg=new THREE.Sprite(new THREE.SpriteMaterial({color:0x000000,transparent:true,opacity:.6,depthWrite:false})),fg=new THREE.Sprite(new THREE.SpriteMaterial({color:0x7be05a,transparent:true,depthWrite:false}));
  bg.scale.set(1.04,.15,1);bg.position.y=2.25;fg.scale.set(1,.1,1);if(fg.center)fg.center.set(0,.5);fg.position.set(-.5,2.25,0);bg.visible=fg.visible=false;g.add(bg);g.add(fg);g.userData.bar=[bg,fg]}
 scene.add(g);return g}

export function makeWorld(scene){
 const terr=makeTerrain(scene),covers=terr.covers;
 const ENEMIES=14,ZONE0=105,ZONE_T=330,MAP=HALF-4;
 // Rejilla espacial: cada obstáculo (caja con altura h) se guarda en las celdas de 8 m que toca, así colisiones y rayos solo miran lo cercano
 const GC=8,gridMap=new Map(),EMPTY=[],gk=(i,j)=>(i+64)*256+(j+64);
 for(const c of covers){const i0=Math.floor((c.x-c.hw-1.6)/GC),i1=Math.floor((c.x+c.hw+1.6)/GC),j0=Math.floor((c.z-c.hd-1.6)/GC),j1=Math.floor((c.z+c.hd+1.6)/GC);
  for(let i=i0;i<=i1;i++)for(let j=j0;j<=j1;j++){const k=gk(i,j);let a=gridMap.get(k);if(!a)gridMap.set(k,a=[]);a.push(c)}}
 const cellList=(x,z)=>gridMap.get(gk(Math.floor(x/GC),Math.floor(z/GC)))||EMPTY;
 let stamp=0;
 // Rayo contra las cajas: devuelve {t,c} del primer obstáculo, o null
 function castRay(ox,oy,oz,dx,dy,dz,far){stamp++;let best=null,bt=far;const step=GC*.3;
  for(let s=0;s<=far+step;s+=step){if(best&&s>bt+GC)break;const q=Math.min(s,far);
   for(const c of cellList(ox+dx*q,oz+dz*q)){if(c.st===stamp)continue;c.st=stamp;let a=0,b=bt;
    if(Math.abs(dx)<1e-9){if(ox<c.x-c.hw||ox>c.x+c.hw)continue}else{let p=(c.x-c.hw-ox)/dx,r=(c.x+c.hw-ox)/dx;if(p>r){const t=p;p=r;r=t}if(p>a)a=p;if(r<b)b=r;if(a>b)continue}
    if(Math.abs(dy)<1e-9){if(oy<0||oy>c.h)continue}else{let p=(0-oy)/dy,r=(c.h-oy)/dy;if(p>r){const t=p;p=r;r=t}if(p>a)a=p;if(r<b)b=r;if(a>b)continue}
    if(Math.abs(dz)<1e-9){if(oz<c.z-c.hd||oz>c.z+c.hd)continue}else{let p=(c.z-c.hd-oz)/dz,r=(c.z+c.hd-oz)/dz;if(p>r){const t=p;p=r;r=t}if(p>a)a=p;if(r<b)b=r;if(a>b)continue}
    if(a<bt){bt=a;best=c}}}
  return best?{t:bt,c:best}:null}
 // Primer impacto de un rayo (origen, dirección normalizada, alcance) contra obstáculos o el suelo
 function hitSolids(o,d,far,tmp){const h=castRay(o.x,o.y,o.z,d.x,d.y,d.z,far);let t=h?h.t:Infinity,kind=h?h.c.kind:null;
  if(d.y<-1e-6){const tg=-o.y/d.y;if(tg>0&&tg<t&&tg<far){t=tg;kind='dirt'}}
  if(t>far||!isFinite(t))return null;if(tmp){tmp.distance=t;tmp.point.set(o.x+d.x*t,o.y+d.y*t,o.z+d.z*t);tmp.kind=kind;return tmp}return {distance:t,point:new THREE.Vector3(o.x+d.x*t,o.y+d.y*t,o.z+d.z*t),kind}}
 const enemies=[];for(let i=0;i<ENEMIES;i++)enemies.push(soldier(scene,0,0,i));
 // Puntos de aparición: tierra firme y libres de obstáculos
 const freeSpot=(x,z,m=1.4)=>{if(landFrac(x,z)<.82)return false;for(const c of cellList(x,z))if(Math.abs(x-c.x)<c.hw+m&&Math.abs(z-c.z)<c.hd+m)return false;return true};
 function poiSpot(from){for(let i=0;i<60;i++){const p=POIS[Math.floor(Math.random()*POIS.length)],a=Math.random()*6.283,r=Math.sqrt(Math.random())*p.r*.9,x=p.x+Math.cos(a)*r,z=p.z+Math.sin(a)*r;if(freeSpot(x,z,2)&&(!from||Math.hypot(x-from.x,z-from.z)>55))return {x,z}}return randomSpot(55,from)}
 function randomSpot(minFrom,from,rad=HALF-10){for(let i=0;i<300;i++){const x=(Math.random()*2-1)*rad,z=(Math.random()*2-1)*rad;if(!freeSpot(x,z,2))continue;if(from&&Math.hypot(x-from.x,z-from.z)<minFrom)continue;return {x,z}}return {x:0,z:0}}
 const loot=[];
 // Etiqueta de texto flotante sobre cada caja (se dibuja en un canvas; si no hay DOM, simplemente no se crea)
 const labelTex=new Map();
 function makeLabel(text,color){if(typeof document==='undefined'||!document.createElement)return null;const key=text+color;let tex=labelTex.get(key);if(!tex){const c=document.createElement('canvas');c.width=256;c.height=64;const x=c.getContext&&c.getContext('2d');if(!x)return null;x.fillStyle='rgba(0,0,0,.55)';x.fillRect(0,0,256,64);x.fillStyle='#'+color.toString(16).padStart(6,'0');x.font='bold 26px sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText(text,128,34);tex=new THREE.CanvasTexture(c);labelTex.set(key,tex)}const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,transparent:true,depthWrite:false}));sp.scale.set(1.9,.48,1);sp.position.y=1.25;return sp}
 // Aspecto de cada tipo de botín
 const LOOK={ammo:[0xd5b54b,'MUNICIÓN'],med:[0x55cf85,'BOTIQUÍN'],armor:[0x62bce9,'ESCUDO'],weapon:[0xb07cff,'ARMA']};
 // Una caja de botín reutilizable: configure() cambia su tipo, color y etiqueta
 function addLoot(x,z,type,data){const g=new THREE.Group();const cm=new THREE.MeshStandardMaterial({color:0xffffff,metalness:.25,roughness:.45,emissiveIntensity:.12});const cube=new THREE.Mesh(new THREE.BoxGeometry(.65,.5,.65),cm);cube.position.y=.35;cube.castShadow=true;g.add(cube);const rm=mat(0xffffff);const ring=new THREE.Mesh(new THREE.TorusGeometry(.48,.035,6,20),rm);ring.rotation.x=Math.PI/2;ring.position.y=.04;g.add(ring);g.position.set(x,0,z);g.userData={};
  g.userData.configure=(t,d={})=>{const lk=t==='acc'?[ACCESSORIES[d.acc].color,ACCESSORIES[d.acc].name]:t==='weapon'?[LOOK.weapon[0],d.label]:LOOK[t];const col=lk[0];g.userData.type=t;g.userData.active=true;g.userData.weapon=d.weapon;g.userData.acc=d.acc;cm.color.setHex(col);cm.emissive.setHex(col);rm.color.setHex(col);
   const old=g.userData.label;if(old){g.remove(old);if(old.material&&old.material.dispose)old.material.dispose()}g.userData.label=null;const lb=makeLabel(lk[1],col);if(lb){g.add(lb);g.userData.label=lb}};
  g.userData.configure(type,data||{});scene.add(g);loot.push(g);return g}
 // Botín por zonas (como en Free Fire): la fortaleza tiene armas y escudos; ciudad y pueblos, munición, botiquines y accesorios; y cajas sueltas por toda la isla
 const accKeys=Object.keys(ACCESSORIES),WLAB={3:'SUBFUSIL',4:'SNIPER',5:'REVÓLVER'};
 const PROFILE={town:['weapon:5','weapon:3','ammo','ammo','ammo','med','med','armor','armor','acc','acc','acc'],military:['weapon:4','weapon:3','weapon:5','armor','armor','ammo','ammo','med','acc','acc'],village:['ammo','med','armor','acc','acc','ammo']};
 const slots=[];POIS.forEach((p,pi)=>PROFILE[p.kind].forEach(t=>slots.push({t,poi:pi})));for(let i=0;i<70;i++)slots.push({t:null,poi:-1});
 slots.forEach(()=>addLoot(0,0,'ammo'));
 function rollLoot(){const taken=[];
  slots.forEach((sl,i)=>{const g=loot[i];let x=0,z=0,ok=false;
   for(let tries=0;tries<80&&!ok;tries++){if(sl.poi>=0){const p=POIS[sl.poi],a=Math.random()*6.283,r=Math.sqrt(Math.random())*p.r;x=p.x+Math.cos(a)*r;z=p.z+Math.sin(a)*r}else{x=(Math.random()*2-1)*(HALF-8);z=(Math.random()*2-1)*(HALF-8)}
    ok=freeSpot(x,z,1.5)&&!taken.some(q=>Math.hypot(q[0]-x,q[1]-z)<3)}
   taken.push([x,z]);g.position.set(x,0,z);
   let t=sl.t;if(!t){const r=Math.random();t=r<.34?'ammo':r<.56?'med':r<.72?'armor':'acc'}
   if(t.startsWith('weapon')){const wi=+t.split(':')[1];g.userData.configure('weapon',{weapon:wi,label:WLAB[wi]})}
   else if(t==='acc')g.userData.configure('acc',{acc:accKeys[Math.floor(Math.random()*accKeys.length)]})
   else g.userData.configure(t)})}
 rollLoot();
 const zone=new THREE.Mesh(new THREE.RingGeometry(0,1,96),new THREE.MeshBasicMaterial({color:0x55d9ff,side:THREE.DoubleSide,transparent:true,opacity:.18,depthWrite:false}));zone.rotation.x=-Math.PI/2;zone.position.y=.09;scene.add(zone);const edge=new THREE.Mesh(new THREE.TorusGeometry(1,.075,8,128),new THREE.MeshBasicMaterial({color:0x69ddff,transparent:true,opacity:.85}));edge.rotation.x=Math.PI/2;edge.position.y=.12;scene.add(edge);

 // ======== IA de enemigos ========
 // Objetivos posibles: el jugador y otros enemigos hostiles. Solo se detecta lo que está a distancia y con línea de visión libre.
 const DETECT_PLAYER=34,DETECT_ENEMY=28;
 const playerPos=new THREE.Vector3(0,0,15),losRay=new THREE.Raycaster(),_o=new THREE.Vector3(),_t=new THREE.Vector3();
 let W=null; // el objeto del mundo (se asigna abajo); W.teams = true → equipos verdes vs rojos; false → todos contra todos
 const hostile=(a,b)=>!W.teams||a.userData.team!==b.userData.team;
 function hasLOSTo(e,x,z,y=1.2){const ox=e.position.x,oz=e.position.z,dx=x-ox,dz=z-oz,dy=y-1.4,dist=Math.hypot(dx,dy,dz);if(dist<.01)return true;return !castRay(ox,1.4,oz,dx/dist,dy/dist,dz/dist,dist)}
 // Empuja un punto fuera de edificios, rocas y troncos (los enemigos no atraviesan obstáculos)
 function pushOut(p,r=.45){for(const c of cellList(p.x,p.z)){const dx=p.x-c.x,dz=p.z-c.z,px=c.hw+r-Math.abs(dx);if(px<=0)continue;const pz=c.hd+r-Math.abs(dz);if(pz<=0)continue;if(px<pz)p.x+=(dx<0?-1:1)*px;else p.z+=(dz<0?-1:1)*pz}}
 function blockedPoint(x,z){for(const c of cellList(x,z)){if(Math.abs(x-c.x)<c.hw+.9&&Math.abs(z-c.z)<c.hd+.9)return true}return false}
 // Punto de cobertura: detrás de un obstáculo, en el lado contrario a "from" (de dónde vienen los disparos)
 function findCover(e,from){let best=null,bd=1e9;stamp++;const cx=Math.floor(e.position.x/GC),cz=Math.floor(e.position.z/GC);
  for(let i=cx-2;i<=cx+2;i++)for(let j=cz-2;j<=cz+2;j++)for(const c of (gridMap.get(gk(i,j))||EMPTY)){if(c.st2===stamp)continue;c.st2=stamp;if(c.h<1.2)continue;
   const ex=c.x-e.position.x,ez=c.z-e.position.z;if(ex*ex+ez*ez>400)continue;let ax=c.x-from.x,az=c.z-from.z;const al=Math.hypot(ax,az)||1;ax/=al;az/=al;
   const tx=Math.abs(ax)>1e-6?(c.hw+1.3)/Math.abs(ax):1e9,tz=Math.abs(az)>1e-6?(c.hd+1.3)/Math.abs(az):1e9,off=Math.min(tx,tz);
   const px=c.x+ax*off,pz=c.z+az*off;if(!isLand(px,pz))continue;if(Math.hypot(px-from.x,pz-from.z)<5)continue;if(blockedPoint(px,pz))continue;const d=Math.hypot(px-e.position.x,pz-e.position.z);if(d<bd){bd=d;best={x:px,z:pz}}}
  return best}
 // Mueve al enemigo. Si lleva un rato sin avanzar (atascado), rodea el obstáculo andando de lado (detour).
 function drive(e,vx,vz,dt,travel){const u=e.userData,sp=Math.hypot(vx,vz);if(sp<.01)return;
  if(travel){u.wantMove=true;u.dirX=vx/sp;u.dirZ=vz/sp;if(u.detour>0){const px=-u.dirZ*u.sideSign,pz=u.dirX*u.sideSign;vx=px*sp*.9+vx*.3;vz=pz*sp*.9+vz*.3}}
  const ox=e.position.x,oz=e.position.z;e.position.x+=vx*dt;e.position.z+=vz*dt;pushOut(e.position);if(!isLand(e.position.x,e.position.z)){e.position.x=ox;e.position.z=oz}}
 function moveTo(e,tx,tz,speed,dt){const dx=tx-e.position.x,dz=tz-e.position.z,l=Math.hypot(dx,dz);if(l<.05)return l;const s=Math.min(speed,l/dt);drive(e,dx/l*s,dz/l*s,dt,true);return Math.hypot(tx-e.position.x,tz-e.position.z)}
 function face(e,x,z){e.lookAt(x,e.position.y,z)}
 // Elige el objetivo hostil más cercano con línea de visión (el actual tiene ventaja para no cambiar a cada rato)
 function pickTarget(e){const u=e.userData,cands=[];
  const dp=Math.hypot(playerPos.x-e.position.x,playerPos.z-e.position.z);if(dp<DETECT_PLAYER)if(!W.dropping)cands.push({t:'player',d:u.target==='player'?dp*.75:dp,x:playerPos.x,z:playerPos.z,y:W.playerH});
  for(const o of enemies){if(o===e||!o.userData.alive||!hostile(e,o))continue;const d=Math.hypot(o.position.x-e.position.x,o.position.z-e.position.z);if(d<DETECT_ENEMY)cands.push({t:o,d:u.target===o?d*.75:d,x:o.position.x,z:o.position.z,y:1.2})}
  cands.sort((a,b)=>a.d-b.d);
  for(const c of cands){if(hasLOSTo(e,c.x,c.z,c.y)){u.target=c.t;u.sees=true;return}}
  u.target=null;u.sees=false}
 function pickWaypoint(e){const u=e.userData,lim=Math.max(10,Math.min(MAP-4,W.zoneRadius-5));
  for(let i=0;i<10;i++){let x,z;const r=Math.random();
   if(r<.3){x=playerPos.x+(Math.random()-.5)*40;z=playerPos.z+(Math.random()-.5)*40}
   else if(r<.65){const p=POIS[Math.floor(Math.random()*POIS.length)];x=p.x+(Math.random()-.5)*p.r;z=p.z+(Math.random()-.5)*p.r}
   else{const a=Math.random()*6.283,rr=Math.sqrt(Math.random())*lim;x=Math.cos(a)*rr;z=Math.sin(a)*rr}
   if(Math.hypot(x,z)>lim||!freeSpot(x,z,.9))continue;u.wp={x,z};u.wpT=25;return}
  u.wp={x:0,z:0};u.wpT=12}

 W={enemies,loot,zone,edge,hitSolids,covers,isLand,ground:terr.ground,teams:false,playerH:1.2,zoneTotal:ZONE_T,playerSpawn:{x:0,z:0},dropping:false,zoneRadius:ZONE0,zoneCenter:new THREE.Vector2(0,0),phase:0,
  reset(){this.playerSpawn=randomSpot(0,null,HALF-14);enemies.forEach(e=>{const u=e.userData;e.visible=true;e.rotation.set(0,0,0);u.px=undefined;const sp=u.index%5<3?poiSpot(this.playerSpawn):randomSpot(55,this.playerSpawn);e.position.set(sp.x,0,sp.z);u.alive=true;u.hp=100;u.state='chase';u.stun=0;u.flash=0;u.alert=0;u.sees=false;u.dying=0;u.coverPt=null;u.coverT=0;u.coverCd=0;u.attack=0;u.cooldown=1+Math.random()*2;u.mats.forEach(m=>m.emissive.setHex(0));u.flashOn=false;
   u.target=null;u.tgtT=Math.random()*.3;u.wp=null;u.wpT=0;u.repoT=3+Math.random()*5;u.wantMove=false;u.moveTime=0;u.stuckT=0;u.sx=e.position.x;u.sz=e.position.z;u.detour=0;u.detourN=0;u.detourAge=99;u.last.set(e.position.x,0,e.position.z)});loot.forEach(l=>{l.visible=true;l.userData.active=true});rollLoot();this.zoneRadius=ZONE0;this.phase=0;this.zone.scale.setScalar(ZONE0);this.edge.scale.setScalar(ZONE0)},
  // Sitúa al jugador en un punto libre de la isla, mirando hacia el centro
  spawnPlayer(player,drop){const p=this.playerSpawn;player.group.position.set(p.x,drop?72:0,p.z);player.yaw=Math.atan2(p.x,p.z);player.group.rotation.y=player.yaw;player.dropping=!!drop;player.vy=0;player.grounded=!drop;this.dropping=!!drop},
  // Animación de caminar y barra de vida de los enemigos
  animateEnemies(dt,player){enemies.forEach(e=>{const u=e.userData,bar=u.bar;if(!u.alive){if(bar)bar[0].visible=bar[1].visible=false;return}
   const dx=e.position.x-(u.px===undefined?e.position.x:u.px),dz=e.position.z-(u.pz===undefined?e.position.z:u.pz);u.px=e.position.x;u.pz=e.position.z;
   const sp=dt>0?Math.hypot(dx,dz)/dt:0;u.walk=(u.walk||0)+sp*dt*2.4;const k=Math.min(1,sp/2.2)*.75,s=Math.sin(u.walk)*k,L=u.limbs;
   if(L){L[0].rotation.x=s;L[2].rotation.x=-s;L[1].rotation.x=-s*.8;L[3].rotation.x=s*.8}
   if(bar){const d=Math.hypot(e.position.x-player.position.x,e.position.z-player.position.z),show=d<48&&!player.dropping;bar[0].visible=bar[1].visible=show;if(show){bar[1].scale.x=Math.max(.001,u.hp/100);if(bar[1].material.color&&bar[1].material.color.setHex)bar[1].material.color.setHex(u.hp>55?0x7be05a:u.hp>25?0xf0c43a:0xe5483c)}}})},
  // Colisión del jugador: lo saca de edificios/árboles/rocas y le impide entrar al agua (px,pz = posición anterior)
  constrain(p,px,pz){pushOut(p,.4);if(!isLand(p.x,p.z)){if(isLand(p.x,pz))p.z=pz;else if(isLand(px,p.z))p.x=px;else{p.x=px;p.z=pz}}},
  // Aplica daño a un enemigo. attacker: 'player' (por defecto) u otro enemigo. Devuelve true si muere.
  damageEnemy(e,amount,attacker){const u=e.userData;if(!u.alive)return false;u.hp-=amount;if(u.hp<=0){u.hp=0;u.alive=false;u.state='dead';u.dying=.9;u.sees=false;u.flash=0;u.target=null;u.mats.forEach(m=>m.emissive.setHex(0));return true}
   const byEnemy=attacker&&attacker!=='player',ap=byEnemy?attacker.position:playerPos;
   u.flash=.09;u.stun=.14;u.alert=8;u.last.set(ap.x,0,ap.z);u.tgtT=0;
   if(u.state!=='cover'&&u.hp<55&&u.coverCd<=0&&Math.random()<.5){const c=findCover(e,ap);if(c){u.coverPt=c;u.coverT=3+Math.random()*2;u.state='cover'}}
   return false},
  // Un ruido (disparo del jugador) alerta a los enemigos cercanos que aún no tienen objetivo: van a investigar.
  alertNear(pos,radius){for(const e of enemies){const u=e.userData;if(!u.alive||u.target)continue;if(Math.hypot(pos.x-e.position.x,pos.z-e.position.z)<radius){u.alert=6;u.last.set(pos.x,0,pos.z)}}},
  update(dt,player,elapsed){this.phase=Math.min(1,elapsed/ZONE_T);this.zoneRadius=ZONE0-80*this.phase;this.playerH=player.chestH;const wmap=terr.water.material.map;if(wmap&&wmap.offset){wmap.offset.x+=dt*.003;wmap.offset.y+=dt*.0015}this.dropping=!!player.dropping;this.animateEnemies(dt,player);this.zone.scale.setScalar(this.zoneRadius);this.edge.scale.setScalar(this.zoneRadius);this.cullT=(this.cullT||0)-dt;const doCull=this.cullT<=0;if(doCull)this.cullT=.25;this.loot.forEach(l=>{if(!l.userData.active)return;l.rotation.y+=dt*.8;if(doCull)l.visible=Math.hypot(l.position.x-player.position.x,l.position.z-player.position.z)<60});
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
    if(u.alert>0){const left=moveTo(e,u.last.x,u.last.z,3.2,dt);face(e,u.last.x,u.last.z);if(left<1)u.alert=0;return}
    if(Math.hypot(e.position.x,e.position.z)>this.zoneRadius-1){u.wp={x:0,z:0};u.wpT=8}
    if(!u.wp||u.wpT<=0)pickWaypoint(e);u.wpT-=dt;
    const left=moveTo(e,u.wp.x,u.wp.z,2.6,dt);face(e,u.wp.x,u.wp.z);if(left<1.5)u.wp=null
   })}};
 return W}
