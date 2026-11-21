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
[{max:30,auto:true,range:90,falloff:[60,140]},{max:6,auto:false,range:34,falloff:[6,26]},{max:12,auto:false,range:65,falloff:[30,90]}].forEach((x,i)=>Object.assign(player.weapons[i],x));
let active=false,paused=false,health=100,armor=25,elapsed=0,gameClock=0,reloadUntil=0,lastDamage=0,fireHeld=false,fireInterval=0;
const hud=$('#hud'),start=$('#start-screen'),pause=$('#pause-screen'),end=$('#end-screen');
const setMsg=t=>{$('#status-message').textContent=t};
function updateHud(){const w=player.weapon;$('#health').textContent=Math.ceil(health);$('#healthbar').style.width=health+'%';$('#armor').textContent=Math.ceil(armor);$('#armorbar').style.width=armor+'%';$('#weapon').textContent=w.name;$('#weapon-label').textContent=w.label;$('#ammo').textContent=`${w.mag} / ${w.reserve}`;$('#ammo-label').textContent=`${w.mag} / ${w.reserve}`;$('#alive').textContent=world.enemies.filter(e=>e.userData.alive).length+1}
function begin(){active=true;paused=false;health=100;armor=25;elapsed=0;gameClock=0;reloadUntil=0;fireHeld=false;player.reset();world.reset();fx.reset();fx.setWeaponLook(player.weaponIndex);start.classList.add('hidden');pause.classList.add('hidden');end.classList.add('hidden');hud.classList.remove('hidden');$('#zone-warning').classList.add('hidden');setMsg('Busca suministros y sobrevive');updateHud()}
function finish(win){if(!active)return;active=false;fireHeld=false;hud.classList.add('hidden');end.classList.remove('hidden');$('#end-title').textContent=win?'¡VICTORIA!':'HAS SIDO ELIMINADO';$('#end-text').textContent=win?'Eres el último superviviente de Battle Zone.':'La zona te ha vencido. Equípate y vuelve a intentarlo.'}
function damagePlayer(amount){if(!active)return;let rest=amount;if(armor>0){const absorb=Math.min(armor,rest*.7);armor-=absorb;rest-=absorb}health=Math.max(0,health-rest);updateHud();if(health<=0)finish(false)}
function reload(){if(!active||paused||reloadUntil>gameClock)return;const w=player.weapon;if(w.mag===([30,6,12][player.weaponIndex])||w.reserve<=0){setMsg(w.reserve<=0?'Sin munición de reserva':'Cargador completo');return}reloadUntil=gameClock+1.25;setMsg('Recargando...')}
function completeReload(){const w=player.weapon,max=[30,6,12][player.weaponIndex],need=max-w.mag,take=Math.min(need,w.reserve);w.mag+=take;w.reserve-=take;reloadUntil=0;updateHud();setMsg('¡Cargador listo!')}
function switchWeapon(){if(!active||paused)return;const w=player.switchWeapon();reloadUntil=0;fx.setWeaponLook(player.weaponIndex);updateHud();setMsg('Arma equipada: '+w.label)}

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
 aimOrigin.set(player.position.x,player.position.y+1.2,player.position.z);
 aimDir.set(-Math.sin(player.yaw),0,-Math.cos(player.yaw));
 const wi=player.weaponIndex;fx.muzzle(wi);player.muzzle.getWorldPosition(muzzlePos);
 let hitAny=false,killed=false,headshot=false;
 for(let p=0;p<w.pellets;p++){
  ray.set(aimOrigin,aimDir);ray.near=0;ray.far=w.range;
  if(w.spread){const d=ray.ray.direction;d.x+=(Math.random()-.5)*2*w.spread;d.y+=(Math.random()-.5)*2*w.spread;d.z+=(Math.random()-.5)*2*w.spread;d.normalize()}
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
$('#fire').addEventListener('pointerdown',e=>{e.preventDefault();fireHeld=true;shoot()});['pointerup','pointercancel','pointerleave'].forEach(ev=>$('#fire').addEventListener(ev,()=>fireHeld=false));$('#jump').addEventListener('pointerdown',e=>{e.preventDefault();player.jump()});$('#reload').addEventListener('pointerdown',e=>{e.preventDefault();reload()});$('#switch').addEventListener('pointerdown',e=>{e.preventDefault();switchWeapon()});$('#medkit').addEventListener('pointerdown',e=>{e.preventDefault();if(active&&health<100){health=Math.min(100,health+25);updateHud();setMsg('Vendaje aplicado: +25 de vida')}else setMsg('Tu vida ya está completa')});
addEventListener('keydown',e=>{if(e.code==='Space')player.jump();if(e.code==='KeyR')reload();if(e.code==='KeyQ')switchWeapon();if(e.code==='Escape'&&active){paused=!paused;pause.classList.toggle('hidden',!paused)}});
const clock=new THREE.Clock();function loop(){requestAnimationFrame(loop);const dt=Math.min(clock.getDelta(),.04);if(active&&!paused){gameClock+=dt;controls.update();player.update(dt,controls.move);if(fireHeld&&player.weapon.auto)shoot();if(reloadUntil>0&&gameClock>=reloadUntil)completeReload();world.update(dt,player,gameClock);enemyAttacks(dt);collectLoot();updateZone(dt);const offset=new THREE.Vector3(0,3.1,6.6).applyAxisAngle(new THREE.Vector3(0,1,0),player.yaw);camera.position.lerp(player.position.clone().add(offset),1-Math.pow(.001,dt));camera.lookAt(player.position.clone().add(new THREE.Vector3(0,1.2,0)));}fx.update(dt);renderer.render(scene,camera)}
function resize(){camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,1.5))}addEventListener('resize',resize);updateHud();$('#loading').classList.add('hidden');loop();
