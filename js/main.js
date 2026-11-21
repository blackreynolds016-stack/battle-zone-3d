import * as THREE from 'three';
import {Player} from './player.js';
import {Controls} from './controls.js';
import {makeWorld} from './world.js';
import {createEffects} from './effects.js';

const $=s=>document.querySelector(s),root=$('#game');
const scene=new THREE.Scene();scene.background=new THREE.Color(0x9bb7c0);scene.fog=new THREE.Fog(0x9bb7c0,42,105);
const camera=new THREE.PerspectiveCamera(66,innerWidth/innerHeight,.1,180);
const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setSize(innerWidth,innerHeight);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;root.appendChild(renderer.domElement);
scene.add(new THREE.HemisphereLight(0xd9ecff,0x45543b,1.7));const sun=new THREE.DirectionalLight(0xffe2bb,2.4);sun.position.set(-28,42,20);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-55;sun.shadow.camera.right=55;sun.shadow.camera.top=55;sun.shadow.camera.bottom=-55;sun.shadow.bias=-.00025;scene.add(sun);
const world=makeWorld(scene),player=new Player(scene),controls=new Controls(player),ray=new THREE.Raycaster();ray.far=90;
const fx=createEffects(scene,player);
// Características de combate por arma: [rifle, escopeta, pistola]. auto = disparo continuo al mantener pulsado.
[{max:30,auto:true,range:90,falloff:[60,140],zoom:3},{max:6,auto:false,range:34,falloff:[6,26]},{max:12,auto:false,range:65,falloff:[30,90]}].forEach((x,i)=>Object.assign(player.weapons[i],x));
let active=false,paused=false,health=100,armor=25,elapsed=0,gameClock=0,reloadUntil=0,lastDamage=0,fireHeld=false,fireInterval=0;
const hud=$('#hud'),start=$('#start-screen'),pause=$('#pause-screen'),end=$('#end-screen');
const setMsg=t=>{$('#status-message').textContent=t};
// ---- Mira telescópica: solo las armas con "zoom" (el rifle). Cámara en primera persona, FOV reducido y retícula en pantalla ----
const aimBtn=$('#aim'),scopeEl=$('#scope'),crossEl=$('#crosshair'),aimMove=new THREE.Vector2();
let aiming=false,aimBlend=0,aimZoom=1,scopeShown=false;const BASE_FOV=camera.fov,EYE_H=1.62;
player.lookScale=1;
function syncAim(){const can=!!player.weapon.zoom;if(!can)aiming=false;if(aimBtn){aimBtn.classList.toggle('hidden',!can);aimBtn.classList.toggle('on',aiming);aimBtn.textContent=aiming?'SALIR MIRA':'APUNTAR'}}
function stopAim(){aiming=false;syncAim()}
function toggleAim(){if(!active||paused)return;if(!player.weapon.zoom){setMsg('Esta arma no tiene mira telescópica');return}aiming=!aiming;if(aiming)aimZoom=player.weapon.zoom;syncAim();setMsg(aiming?'Mira telescópica activada':'Mira desactivada')}
function updateHud(){const w=player.weapon;$('#health').textContent=Math.ceil(health);$('#healthbar').style.width=health+'%';$('#armor').textContent=Math.ceil(armor);$('#armorbar').style.width=armor+'%';$('#weapon').textContent=w.name;$('#weapon-label').textContent=w.label;$('#ammo').textContent=`${w.mag} / ${w.reserve}`;$('#ammo-label').textContent=`${w.mag} / ${w.reserve}`;$('#alive').textContent=world.enemies.filter(e=>e.userData.alive).length+1}
function begin(){active=true;paused=false;health=100;armor=25;elapsed=0;gameClock=0;reloadUntil=0;fireHeld=false;player.reset();world.reset();fx.reset();fx.setWeaponLook(player.weaponIndex);aimBlend=0;player.group.visible=true;stopAim();start.classList.add('hidden');pause.classList.add('hidden');end.classList.add('hidden');hud.classList.remove('hidden');$('#zone-warning').classList.add('hidden');setMsg('Busca suministros y sobrevive');updateHud()}
function finish(win){if(!active)return;active=false;fireHeld=false;stopAim();hud.classList.add('hidden');end.classList.remove('hidden');$('#end-title').textContent=win?'¡VICTORIA!':'HAS SIDO ELIMINADO';$('#end-text').textContent=win?'Eres el último superviviente de Battle Zone.':'La zona te ha vencido. Equípate y vuelve a intentarlo.'}
function damagePlayer(amount){if(!active)return;let rest=amount;if(armor>0){const absorb=Math.min(armor,rest*.7);armor-=absorb;rest-=absorb}health=Math.max(0,health-rest);updateHud();if(health<=0)finish(false)}
function reload(){if(!active||paused||reloadUntil>gameClock)return;const w=player.weapon;if(w.mag===([30,6,12][player.weaponIndex])||w.reserve<=0){setMsg(w.reserve<=0?'Sin munición de reserva':'Cargador completo');return}reloadUntil=gameClock+1.25;setMsg('Recargando...')}
function completeReload(){const w=player.weapon,max=[30,6,12][player.weaponIndex],need=max-w.mag,take=Math.min(need,w.reserve);w.mag+=take;w.reserve-=take;reloadUntil=0;updateHud();setMsg('¡Cargador listo!')}
function switchWeapon(){if(!active||paused)return;const w=player.switchWeapon();reloadUntil=0;fx.setWeaponLook(player.weaponIndex);stopAim();updateHud();setMsg('Arma equipada: '+w.label)}

// ---- Disparo: un rayo por perdigón, bloqueado por el primer obstáculo o enemigo que toque ----
// El rayo sale en horizontal desde el pecho del jugador hacia donde mira (player.yaw), no desde la cámara:
// la cámara está arriba y detrás, y su rayo central baja ~16° y se hundía en el suelo a pocos metros.
const muzzlePos=new THREE.Vector3(),endPoint=new THREE.Vector3(),aimOrigin=new THREE.Vector3(),aimDir=new THREE.Vector3();
const enemyMeshes=()=>world.enemies.filter(e=>e.userData.alive&&e.visible).flatMap(e=>e.children);
function shoot(){
 if(!active||paused||reloadUntil>gameClock)return;
 const w=player.weapon;
 if(gameClock-player.lastShot<w.rate)return;
 if(w.mag<=0){if(w.reserve>0)reload();else setMsg('Sin balas ni reserva: busca munición');return}
 player.lastShot=gameClock;w.mag--;updateHud();
 player.group.updateMatrixWorld(true);
 world.enemies.forEach(e=>{if(e.userData.alive)e.updateMatrixWorld(true)});
 aimDir.set(-Math.sin(player.yaw),0,-Math.cos(player.yaw));
 // Apuntando: el rayo sale del mismo punto que la cámara (ojo del jugador), así que coincide con el centro de la retícula.
 if(aiming)aimOrigin.set(player.position.x+aimDir.x*.25,player.position.y+EYE_H,player.position.z+aimDir.z*.25);
 else aimOrigin.set(player.position.x,player.position.y+1.2,player.position.z);
 const spreadK=aiming?.25:1;
 const wi=player.weaponIndex;fx.muzzle(wi);player.muzzle.getWorldPosition(muzzlePos);
 let hitAny=false,killed=false,headshot=false;
 for(let p=0;p<w.pellets;p++){
  ray.set(aimOrigin,aimDir);ray.near=0;ray.far=w.range;
  if(w.spread){const sp=w.spread*spreadK,d=ray.ray.direction;d.x+=(Math.random()-.5)*2*sp;d.y+=(Math.random()-.5)*2*sp;d.z+=(Math.random()-.5)*2*sp;d.normalize()}
  const eh=ray.intersectObjects(enemyMeshes(),false)[0],sh=ray.intersectObjects(world.solids,false)[0];
  let kind=null;
  if(eh&&(!sh||eh.distance<=sh.distance)){
   endPoint.copy(eh.point);kind='blood';hitAny=true;
   const owner=eh.object.userData.owner,isHead=eh.object===owner.userData.head,f=w.falloff;
   const mult=Math.max(.15,1-Math.max(0,eh.distance-f[0])/(f[1]-f[0]));
   if(world.damageEnemy(owner,w.damage*mult*(isHead?1.5:1)))killed=true;
   if(isHead)headshot=true;
  }else if(sh){endPoint.copy(sh.point);kind=sh.object.userData.kind||'dirt'}
  else ray.ray.at(w.range,endPoint);
  fx.tracer(muzzlePos,endPoint,wi);
  if(kind)fx.impact(endPoint,kind,wi);
 }
 if(killed){setMsg('¡Enemigo eliminado!');updateHud()}else if(headshot)setMsg('¡Impacto en la cabeza!');else if(hitAny)setMsg('Impacto confirmado');else setMsg('Disparo realizado');
 if(world.enemies.every(e=>!e.userData.alive))finish(true)
}

function collectLoot(){for(const l of world.loot){if(!l.userData.active||l.position.distanceTo(player.position)>1.7)continue;l.userData.active=false;l.visible=false;const type=l.userData.type;if(type==='ammo'){player.weapons[0].reserve+=45;player.weapons[1].reserve+=12;player.weapons[2].reserve+=24;setMsg('Munición recogida')}if(type==='med'){health=Math.min(100,health+30);setMsg('Botiquín: +30 de vida')}if(type==='armor'){armor=Math.min(100,armor+35);setMsg('Placas: +35 de escudo')}updateHud()}}
// Los enemigos solo disparan si están vivos, ven al jugador, no están en retirada ni aturdidos.
const eFrom=new THREE.Vector3(),eTo=new THREE.Vector3();
function enemyAttacks(dt){for(const e of world.enemies){const u=e.userData;if(!u.alive)continue;const d=e.position.distanceTo(player.position);u.cooldown-=dt;if(d<17&&u.cooldown<=0&&u.sees&&u.state!=='cover'&&u.stun<=0){u.cooldown=1.5+Math.random()*1.2;const chance=d<7?.72:.42;const hit=Math.random()<chance;eFrom.set(e.position.x,1.25,e.position.z);eTo.set(player.position.x,1.2,player.position.z);if(!hit){eTo.x+=(Math.random()-.5)*3;eTo.y+=Math.random()*1.5-.4;eTo.z+=(Math.random()-.5)*3}fx.enemyTracer(eFrom,eTo);if(hit){damagePlayer(d<7?9:6);setMsg('¡Te están disparando!')}}if(d<1.55){u.attack+=dt;if(u.attack>.8){u.attack=0;damagePlayer(5)}}else u.attack=0}}
function updateZone(dt){const radius=world.zoneRadius;const dist=Math.hypot(player.position.x,player.position.z);const outside=dist>radius;$('#zone-warning').classList.toggle('hidden',!outside);if(outside){lastDamage+=dt;if(lastDamage>.65){lastDamage=0;damagePlayer(4);setMsg('¡Regresa a la zona segura!')}}else lastDamage=0;const left=Math.max(0,90-gameClock);$('#zone-time').textContent=`${String(Math.floor(left/60)).padStart(2,'0')}:${String(Math.floor(left%60)).padStart(2,'0')}`}
$('#start-button').onclick=begin;$('#again').onclick=begin;$('#restart').onclick=begin;$('#resume').onclick=()=>{paused=false;pause.classList.add('hidden')};$('#pause').onclick=()=>{if(active){paused=true;fireHeld=false;pause.classList.remove('hidden')}};
$('#fire').addEventListener('pointerdown',e=>{e.preventDefault();fireHeld=true;shoot()});['pointerup','pointercancel','pointerleave'].forEach(ev=>$('#fire').addEventListener(ev,()=>fireHeld=false));$('#jump').addEventListener('pointerdown',e=>{e.preventDefault();player.jump()});$('#reload').addEventListener('pointerdown',e=>{e.preventDefault();reload()});$('#switch').addEventListener('pointerdown',e=>{e.preventDefault();switchWeapon()});if(aimBtn)aimBtn.addEventListener('pointerdown',e=>{e.preventDefault();toggleAim()});$('#medkit').addEventListener('pointerdown',e=>{e.preventDefault();if(active&&health<100){health=Math.min(100,health+25);updateHud();setMsg('Vendaje aplicado: +25 de vida')}else setMsg('Tu vida ya está completa')});
addEventListener('keydown',e=>{if(e.code==='Space')player.jump();if(e.code==='KeyR')reload();if(e.code==='KeyQ')switchWeapon();if(e.code==='KeyE')toggleAim();if(e.code==='Escape'&&active){paused=!paused;pause.classList.toggle('hidden',!paused)}});
const clock=new THREE.Clock(),UP=new THREE.Vector3(0,1,0),camPos=new THREE.Vector3(),lookPos=new THREE.Vector3(),eyePos=new THREE.Vector3(),farPos=new THREE.Vector3();
function loop(){requestAnimationFrame(loop);const dt=Math.min(clock.getDelta(),.04);
 // Zoom suave: mezcla 0 (tercera persona) → 1 (mira telescópica). El modelo del jugador se oculta al apuntar.
 aimBlend+=((aiming?1:0)-aimBlend)*Math.min(1,dt*9);if(!aiming&&aimBlend<.002)aimBlend=0;if(aiming&&aimBlend>.995)aimBlend=1;
 const fov=BASE_FOV/(1+(aimZoom-1)*aimBlend);if(Math.abs(camera.fov-fov)>.01){camera.fov=fov;camera.updateProjectionMatrix()}
 player.group.visible=aimBlend<.6;player.lookScale=aiming?.3:1;
 const showScope=aimBlend>.7;if(showScope!==scopeShown){scopeShown=showScope;if(scopeEl)scopeEl.classList.toggle('hidden',!showScope);if(crossEl)crossEl.classList.toggle('hidden',showScope)}
 if(active&&!paused){gameClock+=dt;controls.update();aimMove.set(controls.move.x,controls.move.y).multiplyScalar(aiming?.45:1);player.update(dt,aimMove);if(fireHeld&&player.weapon.auto)shoot();if(reloadUntil>0&&gameClock>=reloadUntil)completeReload();world.update(dt,player,gameClock);enemyAttacks(dt);collectLoot();updateZone(dt);camPos.set(0,3.1,6.6).applyAxisAngle(UP,player.yaw).add(player.position);lookPos.copy(player.position);lookPos.y+=1.2;
  if(aimBlend>0){const fx_=-Math.sin(player.yaw),fz_=-Math.cos(player.yaw);eyePos.set(player.position.x+fx_*.25,player.position.y+EYE_H,player.position.z+fz_*.25);farPos.set(eyePos.x+fx_*30,eyePos.y,eyePos.z+fz_*30);camPos.lerp(eyePos,aimBlend);lookPos.lerp(farPos,aimBlend)}
  if(aimBlend>.97)camera.position.copy(camPos);else camera.position.lerp(camPos,1-Math.pow(.001,dt));
  camera.lookAt(lookPos);}fx.update(dt);renderer.render(scene,camera)}
function resize(){camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,1.5))}addEventListener('resize',resize);syncAim();updateHud();$('#loading').classList.add('hidden');loop();
