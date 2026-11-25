import * as THREE from 'three';
import {Player,ACCESSORIES,SLOTS,CHARACTERS} from './player.js';
import {makeLobbyStage} from './lobby.js';
import {Controls} from './controls.js';
import {makeWorld} from './world.js';
import {GRID,HALF,POIS,gridColors} from './terrain.js';
import {createEffects} from './effects.js';
import {createLayout} from './layout.js';

const $=s=>document.querySelector(s),root=$('#game');
const scene=new THREE.Scene();scene.background=new THREE.Color(0x9bb7c0);scene.fog=new THREE.Fog(0x9bb7c0,70,250);
const camera=new THREE.PerspectiveCamera(66,innerWidth/innerHeight,.1,320);
const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setSize(innerWidth,innerHeight);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;root.appendChild(renderer.domElement);
scene.add(new THREE.HemisphereLight(0xd9ecff,0x45543b,1.7));const sun=new THREE.DirectionalLight(0xffe2bb,2.4);sun.position.set(-28,42,20);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-55;sun.shadow.camera.right=55;sun.shadow.camera.top=55;sun.shadow.camera.bottom=-55;sun.shadow.bias=-.00025;scene.add(sun);scene.add(sun.target);const SUN_OFF={x:-28,y:42,z:20};
const world=makeWorld(scene),player=new Player(scene),controls=new Controls(player),ray=new THREE.Raycaster();ray.far=90;
const fx=createEffects(scene,player);
const stage=makeLobbyStage(scene);
// Modo de enemigos: por defecto todos contra todos. Abre el juego con "?equipos" al final del enlace para jugar verdes contra rojos.
const urlTeams=typeof location!=='undefined'&&new URLSearchParams(location.search).has('equipos');let savedTeams=false;try{savedTeams=localStorage.getItem('egozne-mode')==='teams'}catch(e){}
world.teams=urlTeams||savedTeams;
// Las características de cada arma (cargador, daño, alcance, zoom, accesorios...) viven en player.js (player.weapons).
let active=false,paused=false,health=100,armor=25,elapsed=0,gameClock=0,reloadUntil=0,lastDamage=0,fireHeld=false,fireInterval=0;
const hud=$('#hud'),start=$('#start-screen'),pause=$('#pause-screen'),end=$('#end-screen');
const setMsg=t=>{$('#status-message').textContent=t};
// ---- Sensación Free Fire: marcador de impacto, números de daño, bajas con racha, indicador de dirección del daño ----
let fireId=null,fireX=0;const hitEl=$('#hitmark'),feedEl=$('#killfeed'),bannerEl=$('#banner'),dirEl=$('#dmgdir'),hurtEl=$('#hurt'),killsEl=$('#kills'),tv=new THREE.Vector3();
let streak=0,lastKill=-99;
const pulse=(el,cls,ms)=>{if(!el)return;el.classList.add(cls);clearTimeout(el._pt);el._pt=setTimeout(()=>el.classList.remove(cls),ms)};
function dmgNum(pos,amount,head,kill){if(typeof document==='undefined'||!tv.project)return;tv.copy(pos);tv.y+=.45;tv.project(camera);if(tv.z>1||Math.abs(tv.x)>1.1)return;
 const el=document.createElement('div');el.className='dmgnum'+(head?' head':'')+(kill?' kill':'');el.textContent=Math.round(amount);el.style.left=((tv.x*.5+.5)*innerWidth)+'px';el.style.top=((-tv.y*.5+.5)*innerHeight)+'px';hud.appendChild(el);setTimeout(()=>{if(el.remove)el.remove()},800)}
function feed(a,b,me){if(!feedEl||!document.createElement)return;const row=document.createElement('div');row.className='feed-row'+(me?' me':'');row.textContent=a+'  ✕  '+b;feedEl.appendChild(row);
 while(feedEl.children.length>4&&feedEl.removeChild)feedEl.removeChild(feedEl.children[0]);setTimeout(()=>{try{feedEl.removeChild(row)}catch(e){}},5000)}
function killFx(victim,head){streak=gameClock-lastKill<7?streak+1:1;lastKill=gameClock;feed('Tú','Enemigo '+(victim.userData.index+1),true);
 if(bannerEl){bannerEl.textContent=(head?'TIRO A LA CABEZA · ':'')+(streak===1?'ELIMINASTE':streak===2?'DOBLE ELIMINACIÓN':streak===3?'TRIPLE ELIMINACIÓN':'RACHA x'+streak);pulse(bannerEl,'on',1500)}}
function hurtFx(from){pulse(hurtEl,'on',240);if(from&&dirEl){const dx=from.x-player.position.x,dz=from.z-player.position.z,a=Math.atan2(dx*Math.cos(player.yaw)-dz*Math.sin(player.yaw),-dx*Math.sin(player.yaw)-dz*Math.cos(player.yaw));dirEl.style.transform='translate(-50%,-50%) rotate('+a+'rad)';pulse(dirEl,'on',900)}}
// Ayuda de puntería (como en Free Fire): si hay un enemigo casi en la mira, el disparo se desvía un poco hacia él
function assistAim(range){let best=null,bd=.11;for(const e of world.enemies){if(!e.userData.alive)continue;const dx=e.position.x-player.position.x,dz=e.position.z-player.position.z,d=Math.hypot(dx,dz);if(d<4||d>range)continue;
  let diff=Math.atan2(-dx,-dz)-player.yaw;diff=Math.atan2(Math.sin(diff),Math.cos(diff));if(Math.abs(diff)<bd){bd=Math.abs(diff);best=diff}}
 if(best!==null){const y=player.yaw+best*.6;aimDir.set(-Math.sin(y),0,-Math.cos(y))}}
// ---- Mira telescópica: solo las armas con "zoom" (el rifle). Cámara en primera persona, FOV reducido y retícula en pantalla ----
const aimBtn=$('#aim'),scopeEl=$('#scope'),crossEl=$('#crosshair'),aimMove=new THREE.Vector2();
let aiming=false,aimBlend=0,aimZoom=1,scopeShown=false;const BASE_FOV=camera.fov,EYE_H=1.62;
player.lookScale=1;
function syncAim(){const can=!!player.weapon.zoom;if(!can)aiming=false;if(aimBtn){aimBtn.classList.toggle('hidden',!can);aimBtn.classList.toggle('on',aiming);const al=$('#aim-label');if(al)al.textContent=aiming?'SALIR MIRA':'APUNTAR'}}
function stopAim(){aiming=false;syncAim()}
const stBtn={sprint:$('#sprint'),crouch:$('#crouch'),prone:$('#prone')};let stKey='';
function syncStance(){const k=player.stance+''+(player.sprinting?1:0);if(k===stKey)return;stKey=k;stBtn.sprint.classList.toggle('on',player.sprinting);stBtn.crouch.classList.toggle('on',player.stance===1);stBtn.prone.classList.toggle('on',player.stance===2)}
function doStance(s){if(!active||paused||player.dropping)return;if(s==='sprint'){if(player.stance!==0){player.stance=0}player.toggleSprint();if(player.sprinting&&aiming)stopAim()}else{player.toggleStance(s==='crouch'?1:2);if(aiming&&player.stance===2)syncAim()}syncStance()}
for(const k of ['sprint','crouch','prone'])stBtn[k].addEventListener('pointerdown',e=>{e.preventDefault();doStance(k)});
function toggleAim(){if(!active||paused||player.dropping)return;if(!player.weapon.zoom){setMsg('Esta arma no tiene mira telescópica');return}aiming=!aiming;if(aiming){aimZoom=player.weapon.zoom;if(player.sprinting){player.sprinting=false;syncStance()}}syncAim();setMsg(aiming?'Mira telescópica activada':'Mira desactivada')}
const ICON={"n4a1": [0.0, 0.0], "ak47": [14.286, 0.0], "scar": [28.571, 0.0], "nps": [42.857, 0.0], "ump": [57.143, 0.0], "p90": [71.429, 0.0], "awm": [85.714, 0.0], "kar98": [100.0, 0.0], "m82b": [0.0, 33.333], "dual": [14.286, 33.333], "deagle": [28.571, 33.333], "pistol": [42.857, 33.333], "scope2": [57.143, 33.333], "scope4": [71.429, 33.333], "thermal": [85.714, 33.333], "reddot": [100.0, 33.333], "silencer": [0.0, 66.667], "mag": [14.286, 66.667], "stock": [28.571, 66.667], "grip": [42.857, 66.667], "extmag": [57.143, 66.667], "bipod": [71.429, 66.667], "laser": [85.714, 66.667], "brake": [100.0, 66.667], "medkit": [0.0, 100.0], "repair": [14.286, 100.0], "gloo": [28.571, 100.0], "inhaler": [42.857, 100.0], "vest1": [57.143, 100.0], "vest2": [71.429, 100.0], "vest3": [85.714, 100.0], "shotgun": [100.0, 100.0]};
function setIco(el,key){const p=ICON[key];if(el&&p)el.style.backgroundPosition=p[0]+'% '+p[1]+'%'}
const WICON={rifle:'ak47',shotgun:'shotgun',pistol:'pistol',smg:'ump',sniper:'awm',revolver:'deagle'},AICON={scope1:'reddot',scope4:'scope4',mag:'extmag',grip:'grip',muzzle:'silencer'};
const lbtn=(cls,icon,txt)=>{const b=document.createElement('button');b.className=cls+' lo-row';if(icon){const i=document.createElement('i');i.className='ico sm';setIco(i,icon);b.appendChild(i)}const t=document.createElement('span');t.textContent=txt;b.appendChild(t);return b};
function updateHud(){const w=player.weapon;if(killsEl)killsEl.textContent=kills;$('#health').textContent=Math.ceil(health);$('#healthbar').style.width=health+'%';$('#armor').textContent=Math.ceil(armor);$('#armorbar').style.width=armor+'%';$('#weapon').textContent=w.name;setIco($('#weapon-ico'),WICON[w.model]);$('#weapon-label').textContent=w.label+(Object.values(w.att).filter(Boolean).length?' +'+Object.values(w.att).filter(Boolean).length:'');$('#ammo').textContent=`${w.mag} / ${w.reserve}`;$('#ammo-label').textContent=`${w.mag} / ${w.reserve}`;$('#alive').textContent=world.enemies.filter(e=>e.userData.alive).length+1}
// ---- Selector de personaje (se recuerda la última elección) ----
let charIndex=0;try{charIndex=Math.min(CHARACTERS.length-1,Math.max(0,parseInt(localStorage.getItem('egozne-char')||'0',10)||0))}catch(e){}
const charList=$('#char-list'),charDesc=$('#char-desc');
function renderChars(){if(!charList)return;charList.textContent='';CHARACTERS.forEach((c,i)=>{const b=document.createElement('button');b.className='char-card'+(i===charIndex?' on':'');b.style.setProperty('--c','#'+c.colors.accent.toString(16).padStart(6,'0'));const n=document.createElement('b');n.textContent=c.name;const r=document.createElement('span');r.textContent=c.role;b.appendChild(n);b.appendChild(r);b.addEventListener('click',()=>{charIndex=i;try{localStorage.setItem('egozne-char',String(i))}catch(e){}player.setCharacter(i);renderChars();if(typeof renderProfile==='function')renderProfile()});charList.appendChild(b)});const c=CHARACTERS[charIndex];if(charDesc)charDesc.textContent=c.desc+' · Velocidad '+c.speed+' · Escudo inicial '+c.armor}
player.setCharacter(charIndex);renderChars();
// ---- Minimapa: zona segura, jugador, botín y enemigos cercanos ----
const mm=$('#minimap'),mmc=mm&&mm.getContext?mm.getContext('2d'):null,LOOT_COL={ammo:'#d5b54b',med:'#55cf85',armor:'#62bce9',weapon:'#b07cff',acc:'#ff9a3c'};let mmT=0;
// Isla pre-dibujada una sola vez (1 celda = 4 px); el minimapa solo recorta y escala esta imagen
const terrImg=(()=>{if(typeof document==='undefined'||!document.createElement)return null;const N=GRID.length,c=document.createElement('canvas');c.width=c.height=N*4;const x=c.getContext&&c.getContext('2d');if(!x)return null;
 for(let j=0;j<N;j++)for(let i=0;i<N;i++){x.fillStyle=gridColors[GRID[j][i]];x.fillRect(i*4,j*4,4,4)}
 x.fillStyle='rgba(200,200,210,.85)';for(const p of POIS){x.beginPath();x.arc((p.x+HALF)/(2*HALF)*N*4,(p.z+HALF)/(2*HALF)*N*4,p.r/(2*HALF)*N*4*.55,0,6.283);x.fill()}return c})();
let mmBig=false;
function drawMap(){if(!mmc)return;const S=mm.width,WIN=mmBig?2*HALF+16:110,k=S/WIN,c=S/2,px=player.position.x,pz=player.position.z,cx=mmBig?0:px,cz=mmBig?0:pz;
 mmc.imageSmoothingEnabled=true;mmc.fillStyle='#1d5f9a';mmc.fillRect(0,0,S,S);
 if(terrImg)mmc.drawImage(terrImg,c+(-HALF-cx)*k,c+(-HALF-cz)*k,2*HALF*k,2*HALF*k);
 const X=x=>c+(x-cx)*k,Z=z=>c+(z-cz)*k;
 mmc.strokeStyle='#67c8ff';mmc.lineWidth=2;mmc.beginPath();mmc.arc(X(world.zoneCenter.x),Z(world.zoneCenter.y),Math.max(1,world.zoneRadius*k),0,6.283);mmc.stroke();
 const lr=mmBig?0:36,sz=mmBig?3:4;
 if(lr)for(const l of world.loot){if(!l.userData.active)continue;if(Math.hypot(l.position.x-px,l.position.z-pz)>lr)continue;mmc.fillStyle=LOOT_COL[l.userData.type]||'#fff';mmc.fillRect(X(l.position.x)-sz/2,Z(l.position.z)-sz/2,sz,sz)}
 mmc.fillStyle='#ff4d4d';for(const e of world.enemies){if(!e.userData.alive)continue;if(!mmBig&&Math.hypot(e.position.x-px,e.position.z-pz)>34)continue;if(mmBig)continue;mmc.beginPath();mmc.arc(X(e.position.x),Z(e.position.z),3,0,6.283);mmc.fill()}
 mmc.save();mmc.translate(X(px),Z(pz));mmc.rotate(Math.atan2(-Math.cos(player.yaw),-Math.sin(player.yaw)));mmc.fillStyle='#c7f36b';mmc.strokeStyle='#10200a';mmc.lineWidth=1.5;const A=mmBig?9:7;mmc.beginPath();mmc.moveTo(A,0);mmc.lineTo(-A*.7,-A*.65);mmc.lineTo(-A*.7,A*.65);mmc.closePath();mmc.fill();mmc.stroke();mmc.restore()}
if(mm)mm.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();mmBig=!mmBig;mm.classList.toggle('big',mmBig);mm.width=mm.height=mmBig?440:120;drawMap()});
// ---- Lobby: el personaje elegido se muestra en 3D girando sobre la isla, junto al menú ----
let lobby=true,lobbyT=0;
const modeBtn=$('#btn-mode'),modeLbl=$('#mode-label');
function renderMode(){if(modeLbl)modeLbl.textContent=world.teams?'MODO EQUIPOS':'MODO CLÁSICO'}
function setMode(t){world.teams=t;try{localStorage.setItem('egozne-mode',t?'teams':'ffa')}catch(e){}renderMode()}
if(modeBtn)modeBtn.addEventListener('click',()=>setMode(!world.teams));renderMode();
// ---- Perfil (nombre y nivel guardados en el teléfono), configuración y paneles del lobby ----
let pname='JUGADOR',xp=0,quality='mid',sens=1,kills=0,dropOn=true,assistOn=true,autoRunOn=true,pickAuto=true,vibOn=true,pickReq=false;
try{pname=localStorage.getItem('egozne-name')||pname;xp=parseInt(localStorage.getItem('egozne-xp')||'0',10)||0;quality=localStorage.getItem('egozne-quality')||quality;dropOn=localStorage.getItem('egozne-drop')!=='0';assistOn=localStorage.getItem('egozne-assist')!=='0';autoRunOn=localStorage.getItem('egozne-auto')!=='0';pickAuto=localStorage.getItem('egozne-pick')!=='manual';vibOn=localStorage.getItem('egozne-vib')!=='0';sens=parseFloat(localStorage.getItem('egozne-sens')||'1')||1}catch(e){}
const XPL=200,save=(k,v)=>{try{localStorage.setItem(k,String(v))}catch(e){}};
function renderProfile(){$('#lb-name').textContent=pname;$('#lb-level').textContent='Nvl. '+(1+Math.floor(xp/XPL));$('#lb-xpbar').style.width=(xp%XPL)/XPL*100+'%';const av=$('#lb-avatar');if(av)av.style.borderColor='#'+player.character.colors.accent.toString(16).padStart(6,'0');setIco($('#lb-gunico'),'ak47')}
function addXp(n){xp+=n;save('egozne-xp',xp);renderProfile()}
function applyQuality(){const dpr=typeof devicePixelRatio==='number'?devicePixelRatio:1;renderer.setPixelRatio(quality==='low'?1:quality==='high'?Math.min(dpr,2):Math.min(dpr,1.25));renderer.setSize(innerWidth,innerHeight);sun.castShadow=quality!=='low';const sz=quality==='high'?2048:1024;if(sun.shadow.mapSize.x!==sz){sun.shadow.mapSize.set(sz,sz);if(sun.shadow.map){sun.shadow.map.dispose();sun.shadow.map=null}}}
player.sens=sens;player.autoRun=autoRunOn;applyQuality();renderProfile();
const charsScr=$('#chars-screen'),gunsScr=$('#guns-screen'),setScr=$('#settings-screen');
const layout=createLayout(hud);layout.setVibration(vibOn);
const closePanels=()=>{[charsScr,gunsScr,setScr].forEach(p=>p.classList.add('hidden'))};
const anyPanel=()=>[charsScr,gunsScr,setScr].some(p=>!p.classList.contains('hidden'));
function renderGuns(){const L=$('#guns-list');L.textContent='';player.weapons.forEach((w,i)=>{const card=document.createElement('div');card.className='gun-card';const ic=document.createElement('i');ic.className='ico';setIco(ic,WICON[w.model]);const box=document.createElement('div');const t=document.createElement('b');t.textContent=w.label;const d=document.createElement('small');d.textContent=`Daño ${Math.round(w.base.damage)}${w.pellets>1?' x'+w.pellets:''} · Cargador ${w.base.max} · Alcance ${w.base.range} m\nAcepta: ${w.slots.map(s=>(SLOTS.find(x=>x[0]===s)||[0,s])[1].toLowerCase()).join(', ')}\n${i<3?'Arma inicial':'Se encuentra en el mapa'}`;d.style.whiteSpace='pre-line';box.appendChild(t);box.appendChild(d);card.appendChild(ic);card.appendChild(box);L.appendChild(card)})}
$('#btn-chars').addEventListener('click',()=>{closePanels();renderChars();charsScr.classList.remove('hidden')});
$('#chars-close').addEventListener('click',closePanels);
$('#btn-guns').addEventListener('click',()=>{closePanels();renderGuns();gunsScr.classList.remove('hidden')});
$('#guns-close').addEventListener('click',closePanels);
$('#btn-settings').addEventListener('click',()=>{closePanels();$('#set-name').value=pname;$('#set-quality').value=quality;$('#set-drop').value=dropOn?'1':'0';$('#set-assist').value=assistOn?'1':'0';$('#set-auto').value=autoRunOn?'1':'0';$('#set-pick').value=pickAuto?'auto':'manual';$('#set-vib').value=vibOn?'1':'0';$('#set-sens').value=Math.round(sens*100);$('#set-sens-val').textContent=sens.toFixed(1);setScr.classList.remove('hidden')});
$('#set-layout').addEventListener('click',()=>{closePanels();start.classList.add('hidden');hud.classList.remove('hidden');layout.edit(()=>{hud.classList.add('hidden');start.classList.remove('hidden')})});
$('#set-sens').addEventListener('input',()=>{$('#set-sens-val').textContent=(Number($('#set-sens').value)/100).toFixed(1)});
$('#settings-close').addEventListener('click',()=>{pname=($('#set-name').value||'').trim().toUpperCase().slice(0,12)||'JUGADOR';quality=$('#set-quality').value||'mid';sens=Math.min(2,Math.max(.5,Number($('#set-sens').value)/100||1));save('egozne-name',pname);save('egozne-quality',quality);save('egozne-sens',sens);dropOn=$('#set-drop').value!=='0';assistOn=$('#set-assist').value!=='0';autoRunOn=$('#set-auto').value!=='0';pickAuto=$('#set-pick').value!=='manual';vibOn=$('#set-vib').value!=='0';save('egozne-pick',pickAuto?'auto':'manual');save('egozne-vib',vibOn?1:0);layout.setVibration(vibOn);save('egozne-drop',dropOn?1:0);save('egozne-assist',assistOn?1:0);save('egozne-auto',autoRunOn?1:0);player.autoRun=autoRunOn;player.sens=sens;applyQuality();renderProfile();closePanels()});
// Modelos 3D realistas opcionales: si subes models/zane.glb, models/lyra.glb o models/bruno.glb, sustituyen al personaje básico
async function loadCustomModels(){if(typeof fetch==='undefined')return;try{let loader=null;for(const c of CHARACTERS){const r=await fetch('./models/'+c.id+'.glb',{method:'HEAD'}).catch(()=>null);if(!r||!r.ok)continue;if(!loader){const m=await import('three/addons/loaders/GLTFLoader.js');loader=new m.GLTFLoader()}const g=await loader.loadAsync('./models/'+c.id+'.glb');g.scene.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true}});player.setCustomModel(c.id,g.scene,g.animations)}}catch(e){console.warn('Modelos .glb no cargados:',e)}}
loadCustomModels();
function begin(){lobby=false;kills=0;player.gun.visible=true;closePanels();active=true;paused=false;player.setCharacter(charIndex);health=100;armor=player.character.armor;elapsed=0;gameClock=0;reloadUntil=0;fireHeld=false;player.reset();world.reset();world.spawnPlayer(player,dropOn);camera.position.set(player.position.x,player.position.y+3.1,player.position.z+6.6);streak=0;lastKill=-99;if(feedEl&&feedEl.children&&feedEl.children.length)feedEl.textContent='';fx.reset();fx.setWeaponLook(player.weaponIndex);aimBlend=0;player.group.visible=true;stopAim();start.classList.add('hidden');pause.classList.add('hidden');end.classList.add('hidden');hud.classList.remove('hidden');layout.fit();loadout.classList.add('hidden');$('#zone-warning').classList.add('hidden');setMsg(dropOn?'Paracaídas abierto: mueve el joystick para planear (adelante = picada)':player.character.name+' · '+(world.teams?'Equipos: verdes contra rojos':'Todos contra todos')+' · busca suministros');updateHud()}
function finish(win){if(!active)return;active=false;fireHeld=false;stopAim();hud.classList.add('hidden');end.classList.remove('hidden');$('#end-title').textContent=win?'¡VICTORIA!':'HAS SIDO ELIMINADO';const gain=kills*25+Math.floor(elapsed/10)+(win?150:0);addXp(gain);$('#end-text').textContent=(win?'Eres el último superviviente de EGO ZNE.':'Has sido eliminado. Equípate y vuelve a intentarlo.')+' Eliminaciones: '+kills+' · +'+gain+' XP'}
function damagePlayer(amount,from){if(!active||player.dropping)return;hurtFx(from);player.playHit();let rest=amount*player.character.dmgTaken;if(armor>0){const absorb=Math.min(armor,rest*.7);armor-=absorb;rest-=absorb}health=Math.max(0,health-rest);updateHud();if(health<=0){player.playDeath();finish(false)}}
function reload(){if(!active||paused||reloadUntil>gameClock)return;const w=player.weapon;if(w.mag===w.max||w.reserve<=0){setMsg(w.reserve<=0?'Sin munición de reserva':'Cargador completo');return}reloadUntil=gameClock+(w.reloadT||1.25)*player.character.reloadMul;setMsg('Recargando...');player.playReload(reloadUntil-gameClock)}
function completeReload(){const w=player.weapon,max=w.max,need=max-w.mag,take=Math.min(need,w.reserve);w.mag+=take;w.reserve-=take;reloadUntil=0;updateHud();setMsg('¡Cargador listo!')}
function switchWeapon(){if(!active||paused)return;const w=player.switchWeapon();reloadUntil=0;player.playSwitch();fx.setWeaponLook(player.weaponIndex);stopAim();updateHud();setMsg('Arma equipada: '+w.label)}

// ---- Disparo: un rayo por perdigón, bloqueado por el primer obstáculo o enemigo que toque ----
// El rayo sale en horizontal desde el pecho del jugador hacia donde mira (player.yaw), no desde la cámara:
// la cámara está arriba y detrás, y su rayo central baja ~16° y se hundía en el suelo a pocos metros.
const muzzlePos=new THREE.Vector3(),endPoint=new THREE.Vector3(),aimOrigin=new THREE.Vector3(),aimDir=new THREE.Vector3();
const enemyMeshes=()=>world.enemies.filter(e=>e.userData.alive&&e.visible&&Math.hypot(e.position.x-player.position.x,e.position.z-player.position.z)<160).flatMap(e=>e.children.filter(c=>c.isMesh));
function shoot(){
 if(!active||paused||player.dropping||reloadUntil>gameClock)return;
 const w=player.weapon;
 if(gameClock-player.lastShot<w.rate)return;
 if(player.sprinting){player.sprinting=false;syncStance()}
 if(w.mag<=0){if(w.reserve>0)reload();else setMsg('Sin balas ni reserva: busca munición');return}
 player.lastShot=gameClock;player.playShoot();w.mag--;updateHud();
 player.group.updateMatrixWorld(true);
 world.enemies.forEach(e=>{if(e.userData.alive)e.updateMatrixWorld(true)});
 aimDir.set(-Math.sin(player.yaw),0,-Math.cos(player.yaw));if(assistOn)assistAim(w.range);
 // Apuntando: el rayo sale del mismo punto que la cámara (ojo del jugador), así que coincide con el centro de la retícula.
 if(aiming)aimOrigin.set(player.position.x+aimDir.x*.25,player.position.y+player.eyeH,player.position.z+aimDir.z*.25);
 else aimOrigin.set(player.position.x,player.position.y+player.chestH,player.position.z);
 const spreadK=aiming?w.aimK:1;
 const wi=player.weaponIndex;fx.muzzle(wi,w.quiet);player.muzzle.getWorldPosition(muzzlePos);world.alertNear(player.position,w.quiet?8:32);
 let hitAny=false,killed=false,headshot=false,lastVictim=null;const dealt=new Map();
 for(let p=0;p<w.pellets;p++){
  ray.set(aimOrigin,aimDir);ray.near=0;ray.far=w.range;
  if(w.spread){const sp=w.spread*spreadK,d=ray.ray.direction;d.x+=(Math.random()-.5)*2*sp;d.y+=(Math.random()-.5)*2*sp;d.z+=(Math.random()-.5)*2*sp;d.normalize()}
  const eh=ray.intersectObjects(enemyMeshes(),false)[0],sh=world.hitSolids(ray.ray.origin,ray.ray.direction,w.range);
  let kind=null;
  if(eh&&(!sh||eh.distance<=sh.distance)){
   endPoint.copy(eh.point);kind='blood';hitAny=true;
   const owner=eh.object.userData.owner,isHead=eh.object===owner.userData.head,f=w.falloff;
   const mult=Math.max(.15,1-Math.max(0,eh.distance-f[0])/(f[1]-f[0]));
   const dmg=w.damage*mult*(isHead?1.5:1),was=owner.userData.hp;if(world.damageEnemy(owner,dmg)){killed=true;kills++;lastVictim=owner}
   const dd=dealt.get(owner)||{n:0,head:false,pos:eh.point.clone()};dd.n+=Math.min(dmg,was);dd.head=dd.head||isHead;if(isHead)dd.pos.copy(eh.point);dealt.set(owner,dd);
   if(isHead)headshot=true;
  }else if(sh){endPoint.copy(sh.point);kind=sh.kind||'dirt'}
  else ray.ray.at(w.range,endPoint);
  fx.tracer(muzzlePos,endPoint,wi);
  if(kind)fx.impact(endPoint,kind,wi);
 }
 dealt.forEach((dd,o)=>dmgNum(dd.pos,dd.n,dd.head,!o.userData.alive));
 if(hitAny)pulse(hitEl,killed?'kill':headshot?'head':'on',killed?260:150);
 if(killed&&lastVictim)killFx(lastVictim,headshot);
 if(killed){setMsg('¡Enemigo eliminado!');updateHud()}else if(headshot)setMsg('¡Impacto en la cabeza!');else if(hitAny)setMsg('Impacto confirmado');else setMsg('Disparo realizado');
 if(world.enemies.every(e=>!e.userData.alive))finish(true)
}

// ---- Equipamiento (mochila): ver estadísticas, instalar/quitar accesorios y elegir arma ----
const loadout=$('#loadout'),bagBtn=$('#bag');
function renderLoadout(){
 const w=player.weapon,el=(t,c,txt)=>{const n=document.createElement(t);if(c)n.className=c;if(txt!=null)n.textContent=txt;return n};
 $('#lo-weapon').textContent=w.label;
 $('#lo-stats').textContent=`Daño ${Math.round(w.damage)}${w.pellets>1?' x'+w.pellets:''} · Cargador ${w.max} · Alcance ${w.range} m · Dispersión ${(w.spread*100).toFixed(1)} · Zoom ${w.zoom?w.zoom.toFixed(1)+'x':'sin mira'}`;
 const slots=$('#lo-slots');slots.textContent='';
 for(const [slot,label] of SLOTS){if(!w.slots.includes(slot))continue;const k=w.att[slot],b=lbtn('lo-btn'+(k?' on':''),k?AICON[k]:null,label+': '+(k?ACCESSORIES[k].name+'  ✕':'vacío'));b.disabled=!k;b.addEventListener('click',()=>{if(player.unequip(slot)){afterGearChange('Accesorio guardado en la mochila')}});slots.appendChild(b)}
 const bag=$('#lo-bag');bag.textContent='';const keys=Object.keys(player.inv).filter(k=>player.inv[k]>0);
 if(!keys.length)bag.appendChild(el('p','lo-empty','Mochila vacía: busca cajas naranjas en el mapa'));
 for(const k of keys){const a=ACCESSORIES[k],ok=player.canEquip(w,k),b=lbtn('lo-btn',AICON[k],`${a.name} x${player.inv[k]}${ok?'':' (no compatible)'}`);b.title=a.desc;b.disabled=!ok;b.addEventListener('click',()=>{if(player.equip(k))afterGearChange(a.name+' instalado')});bag.appendChild(b);bag.appendChild(el('small','lo-desc',a.desc))}
 const guns=$('#lo-guns');guns.textContent='';
 player.weapons.forEach((x,i)=>{if(!x.owned)return;const b=lbtn('lo-btn'+(i===player.weaponIndex?' on':''),WICON[x.model],`${x.label}  ${x.mag}/${x.reserve}`);b.addEventListener('click',()=>{if(i!==player.weaponIndex&&player.selectWeapon(i)){reloadUntil=0;fx.setWeaponLook(i);afterGearChange('Arma equipada: '+x.label)}});guns.appendChild(b)})}
function afterGearChange(msg){stopAim();fx.setWeaponLook(player.weaponIndex);updateHud();setMsg(msg);renderLoadout()}
function openLoadout(){if(!active||paused)return;paused=true;fireHeld=false;stopAim();renderLoadout();loadout.classList.remove('hidden')}
function closeLoadout(){loadout.classList.add('hidden');paused=false}
if(bagBtn)bagBtn.addEventListener('pointerdown',e=>{e.preventDefault();openLoadout()});
$('#lo-close').addEventListener('click',closeLoadout);
function take(l){l.userData.active=false;l.visible=false;const type=l.userData.type;if(type==='ammo'){player.weapons.forEach(x=>{if(x.owned)x.reserve+=x.pack});setMsg('Munición recogida para todas tus armas')}
 if(type==='weapon'){const wi=l.userData.weapon,ww=player.weapons[wi];if(ww.owned){ww.reserve+=ww.pack*2;setMsg('Ya tienes '+ww.label+': +'+ww.pack*2+' balas')}else{player.giveWeapon(wi);reloadUntil=0;fx.setWeaponLook(wi);stopAim();setMsg('¡Nueva arma: '+ww.label+'!')}}
 if(type==='acc'){const k=l.userData.acc,a=ACCESSORIES[k],ok=player.addAccessory(k);stopAim();setMsg(ok?a.name+' instalado en '+player.weapon.name:a.name+' guardado en la mochila (🎒)')}
 if(type==='med'){health=Math.min(100,health+30);setMsg('Botiquín: +30 de vida')}if(type==='armor'){armor=Math.min(100,armor+35);setMsg('Placas: +35 de escudo')}updateHud()}
// Recoger: automático al acercarte (1.7 m) o, si lo eliges en Configuración, con el botón RECOGER (aparece a menos de 2.6 m de un objeto)
const interactBtn=$('#interact'),interactLbl=$('#interact-label');let interactShown=null;
const LOOT_NAME={ammo:'MUNICIÓN',med:'BOTIQUÍN',armor:'PLACAS'};
function lootName(l){const t=l.userData.type;if(t==='weapon'){const w=player.weapons[l.userData.weapon];return w?w.label:'ARMA'}if(t==='acc'){const a=ACCESSORIES[l.userData.acc];return a?a.name:'OBJETO'}return LOOT_NAME[t]||'OBJETO'}
function collectLoot(){if(pickAuto){if(interactShown){interactShown=null;interactBtn.classList.add('hidden')}for(const l of world.loot){if(!l.userData.active||l.position.distanceTo(player.position)>1.7)continue;take(l)}pickReq=false;return}
 let best=null,bd=2.6;for(const l of world.loot){if(!l.userData.active)continue;const d=l.position.distanceTo(player.position);if(d<bd){bd=d;best=l}}
 if(best!==interactShown){interactShown=best;interactBtn.classList.toggle('hidden',!best);if(best)interactLbl.textContent=lootName(best)}
 if(best&&pickReq){take(best)}pickReq=false}
// Los enemigos solo disparan si están vivos, ven al jugador, no están en retirada ni aturdidos.
const eFrom=new THREE.Vector3(),eTo=new THREE.Vector3();
// Cada enemigo dispara a su objetivo (el jugador u otro enemigo hostil) solo si lo ve, no está en retirada ni aturdido. Contra el jugador: igual que antes.
function enemyAttacks(dt){let killed=false;for(const e of world.enemies){const u=e.userData;if(!u.alive)continue;const d=e.position.distanceTo(player.position);u.cooldown-=dt;const tg=u.target;
 if(tg&&u.sees&&u.state!=='cover'&&u.stun<=0&&u.cooldown<=0){
  if(tg==='player'){if(d<17){u.cooldown=1.5+Math.random()*1.2;const chance=(d<7?.72:.42)*[1,.75,.5][player.stance];const hit=Math.random()<chance;eFrom.set(e.position.x,1.25,e.position.z);eTo.set(player.position.x,player.chestH,player.position.z);if(!hit){eTo.x+=(Math.random()-.5)*3;eTo.y+=Math.random()*1.5-.4;eTo.z+=(Math.random()-.5)*3}fx.enemyTracer(eFrom,eTo);if(hit){damagePlayer(d<7?9:6,e.position);setMsg('¡Te están disparando!')}}}
  else if(tg.userData.alive){const dd=e.position.distanceTo(tg.position);if(dd<17){u.cooldown=1.5+Math.random()*1.2;const hit=Math.random()<(dd<7?.72:.42);eFrom.set(e.position.x,1.25,e.position.z);eTo.set(tg.position.x,1.2,tg.position.z);if(!hit){eTo.x+=(Math.random()-.5)*3;eTo.y+=Math.random()*1.5-.4;eTo.z+=(Math.random()-.5)*3}fx.enemyTracer(eFrom,eTo);if(hit){fx.impact(eTo,'blood',2);if(world.damageEnemy(tg,12,e)){killed=true;feed('Enemigo '+(e.userData.index+1),'Enemigo '+(tg.userData.index+1),false)}}}}
 }
 if(d<1.55){u.attack+=dt;if(u.attack>.8){u.attack=0;damagePlayer(5,e.position)}}else u.attack=0}
 if(killed){setMsg('¡Los enemigos se están matando entre ellos!');updateHud();if(world.enemies.every(x=>!x.userData.alive))finish(true)}}
function updateZone(dt){const radius=world.zoneRadius;const dist=Math.hypot(player.position.x,player.position.z);const outside=dist>radius;$('#zone-warning').classList.toggle('hidden',!outside);if(outside){lastDamage+=dt;if(lastDamage>.65){lastDamage=0;damagePlayer(4);setMsg('¡Regresa a la zona segura!')}}else lastDamage=0;const left=Math.max(0,world.zoneTotal-gameClock);$('#zone-time').textContent=`${String(Math.floor(left/60)).padStart(2,'0')}:${String(Math.floor(left%60)).padStart(2,'0')}`}
function toMenu(){lobby=true;active=false;paused=false;fireHeld=false;stopAim();hud.classList.add('hidden');pause.classList.add('hidden');end.classList.add('hidden');loadout.classList.add('hidden');start.classList.remove('hidden')}
$('#to-menu').onclick=toMenu;$('#to-menu2').onclick=toMenu;$('#start-button').onclick=begin;$('#again').onclick=begin;$('#restart').onclick=begin;$('#resume').onclick=()=>{paused=false;pause.classList.add('hidden')};$('#pause').onclick=()=>{if(active){paused=true;fireHeld=false;pause.classList.remove('hidden')}};
$('#fire').addEventListener('pointerdown',e=>{e.preventDefault();fireHeld=true;fireId=e.pointerId;fireX=e.clientX;try{$('#fire').setPointerCapture(e.pointerId)}catch(_){}shoot()});$('#fire').addEventListener('pointermove',e=>{if(e.pointerId!==fireId)return;player.yaw-=(e.clientX-fireX)*.006*(player.lookScale||1)*(player.sens||1);fireX=e.clientX});['pointerup','pointercancel','pointerleave'].forEach(ev=>$('#fire').addEventListener(ev,()=>fireHeld=false));$('#jump').addEventListener('pointerdown',e=>{e.preventDefault();player.jump();syncStance()});interactBtn.addEventListener('pointerdown',e=>{e.preventDefault();if(active&&!paused)pickReq=true});$('#reload').addEventListener('pointerdown',e=>{e.preventDefault();reload()});$('#switch').addEventListener('pointerdown',e=>{e.preventDefault();switchWeapon()});if(aimBtn)aimBtn.addEventListener('pointerdown',e=>{e.preventDefault();toggleAim()});$('#medkit').addEventListener('pointerdown',e=>{e.preventDefault();if(active&&health<100){health=Math.min(100,health+25);updateHud();setMsg('Vendaje aplicado: +25 de vida')}else setMsg('Tu vida ya está completa')});
addEventListener('keydown',e=>{if(e.code==='Space'){player.jump();syncStance()}if(e.code==='ShiftLeft'||e.code==='ShiftRight')doStance('sprint');if(e.code==='KeyC')doStance('crouch');if(e.code==='KeyZ')doStance('prone');if(e.code==='KeyR')reload();if(e.code==='KeyQ')switchWeapon();if(e.code==='KeyF'&&active&&!paused)pickReq=true;if(e.code==='KeyE')toggleAim();if(e.code==='KeyB')openLoadout();if(e.code==='Escape'&&anyPanel()){closePanels();return}if(e.code==='Escape'&&active){if(!loadout.classList.contains('hidden'))closeLoadout();else{paused=!paused;pause.classList.toggle('hidden',!paused)}}});
const clock=new THREE.Clock(),UP=new THREE.Vector3(0,1,0),camPos=new THREE.Vector3(),lookPos=new THREE.Vector3(),eyePos=new THREE.Vector3(),farPos=new THREE.Vector3();
function loop(){requestAnimationFrame(loop);const dt=Math.min(clock.getDelta(),.04);
 // Zoom suave: mezcla 0 (tercera persona) → 1 (mira telescópica). El modelo del jugador se oculta al apuntar.
 aimBlend+=((aiming?1:0)-aimBlend)*Math.min(1,dt*9);if(!aiming&&aimBlend<.002)aimBlend=0;if(aiming&&aimBlend>.995)aimBlend=1;
 const fov=BASE_FOV/(1+(aimZoom-1)*aimBlend);if(Math.abs(camera.fov-fov)>.01){camera.fov=fov;camera.updateProjectionMatrix()}
 player.group.visible=aimBlend<.6;player.lookScale=aiming?.3:1;player.aiming=aiming;
 const showScope=aimBlend>.7;if(showScope!==scopeShown){scopeShown=showScope;if(scopeEl)scopeEl.classList.toggle('hidden',!showScope);if(crossEl)crossEl.classList.toggle('hidden',showScope)}
 if(lobby){lobbyT+=dt;const portrait=innerWidth<innerHeight;player.gun.visible=false;player.relaxed=true;player.animate(dt,0);player.group.position.set(stage.x,0,stage.z);player.group.rotation.y=Math.PI+Math.sin(lobbyT*.5)*.35;camPos.set(stage.x,portrait?1.5:1.35,stage.z+(portrait?4.6:3.5));lookPos.set(stage.x,portrait?.95:1.05,stage.z);camera.position.lerp(camPos,1-Math.pow(.001,dt));camera.lookAt(lookPos)}
 player.relaxed=lobby||player.dropping;if(active&&!paused){gameClock+=dt;controls.update();aimMove.set(controls.move.x,controls.move.y).multiplyScalar(aiming?.45:1);{const _px=player.position.x,_pz=player.position.z;player.update(dt,aimMove);world.constrain(player.position,_px,_pz)}
  if(player.landImpact){fx.dust(player.position.x,player.position.z,player.landImpact);player.landImpact=0}if(player.runDust){fx.dust(player.position.x,player.position.z,2);player.runDust=false}syncStance();if(fireHeld&&player.weapon.auto)shoot();if(reloadUntil>0&&gameClock>=reloadUntil)completeReload();world.update(dt,player,gameClock);enemyAttacks(dt);collectLoot();updateZone(dt);camPos.set(0,2.4+.7*player.eyeH/1.62,6.6).applyAxisAngle(UP,player.yaw).add(player.position);lookPos.copy(player.position);lookPos.y+=player.chestH;
  if(aimBlend>0){const fx_=-Math.sin(player.yaw),fz_=-Math.cos(player.yaw);eyePos.set(player.position.x+fx_*.25,player.position.y+player.eyeH,player.position.z+fz_*.25);farPos.set(eyePos.x+fx_*30,eyePos.y,eyePos.z+fz_*30);camPos.lerp(eyePos,aimBlend);lookPos.lerp(farPos,aimBlend)}
  if(aimBlend>.97)camera.position.copy(camPos);else camera.position.lerp(camPos,1-Math.pow(.001,dt));
  camera.lookAt(lookPos);}{const fp=lobby?stage:player.position;sun.target.position.set(fp.x,0,fp.z);sun.position.set(fp.x+SUN_OFF.x,SUN_OFF.y,fp.z+SUN_OFF.z)}
 fx.update(dt);mmT+=dt;if(mmT>.1){mmT=0;if(active)drawMap()}renderer.render(scene,camera)}
function resize(){camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,1.5))}addEventListener('resize',resize);syncAim();updateHud();$('#loading').classList.add('hidden');loop();
