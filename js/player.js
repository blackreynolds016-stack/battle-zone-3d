import * as THREE from 'three';

// ---------- Accesorios ----------
// slot = dónde se instala. Cada arma admite solo algunos slots (ver "slots" en WEAPONS).
export const ACCESSORIES={
 scope1:{name:'MIRA PUNTO ROJO',slot:'scope',color:0xff8a4c,desc:'Permite apuntar con zoom 1.8x y mejora la precisión al apuntar'},
 scope4:{name:'MIRA 4X',slot:'scope',color:0xff5a4c,desc:'Zoom 4.5x y gran precisión al apuntar'},
 mag:{name:'CARGADOR AMPLIADO',slot:'mag',color:0xd9e65a,desc:'+50 % de capacidad del cargador'},
 grip:{name:'EMPUÑADURA',slot:'grip',color:0x59d8ff,desc:'-35 % de dispersión al disparar'},
 muzzle:{name:'SILENCIADOR',slot:'muzzle',color:0xb0b4bd,desc:'Fogonazo y ruido reducidos (los enemigos oyen menos); -5 % de daño'}
};
export const SLOTS=[['scope','MIRA'],['mag','CARGADOR'],['grip','EMPUÑADURA'],['muzzle','BOCA DEL CAÑÓN']];

// ---------- Personajes jugables ----------
// speed: velocidad · armor: escudo inicial · reloadMul: multiplicador del tiempo de recarga · dmgTaken: multiplicador del daño recibido
export const CHARACTERS=[
 {id:'zane',name:'ZANE',role:'SOLDADO',desc:'Equilibrado en todo',speed:5.4,armor:25,reloadMul:1,dmgTaken:1,pack:1,extras:['scarf','goggles','hairS'],colors:{uniform:0x4d5b48,dark:0x242c2a,skin:0xb98563,boot:0x171d1a,accent:0xc7f36b,hair:0x3a2a1f}},
 {id:'lyra',name:'LYRA',role:'EXPLORADORA',desc:'Rápida y recarga veloz, sin escudo inicial',speed:6.2,armor:0,reloadMul:.75,dmgTaken:1,pack:.8,extras:['band','hairL','tail'],colors:{uniform:0x8c3a36,dark:0x2a1f22,skin:0xd9a07a,boot:0x1c1416,accent:0xff5a4c,hair:0x2b1a14}},
 {id:'bruno',name:'BRUNO',role:'TANQUE',desc:'Lento pero resistente: +escudo y -15 % de daño recibido',speed:4.8,armor:60,reloadMul:1.1,dmgTaken:.85,pack:1.25,extras:['helmet','vest','knees','shoulders'],colors:{uniform:0x4a5a73,dark:0x1f2630,skin:0x8a5a3c,boot:0x11151b,accent:0x59d8ff,hair:0x151515}}
];

// ---------- Armas (única fuente de datos) ----------
// mag/reserve: munición actual; max: tamaño del cargador; pack: munición que da una caja de balas; reloadT: segundos de recarga
// zoom: aumento al apuntar (0 = sin mira); aimK: multiplicador de dispersión al apuntar; owned: si ya la tienes
const WEAPONS=[
 {name:'RIFLE',label:'RIFLE DE ASALTO',owned:true,mag:30,reserve:120,max:30,damage:26,rate:.13,pellets:1,spread:.012,auto:true,range:90,falloff:[60,140],zoom:3,aimK:.25,pack:45,reloadT:1.25,slots:['scope','mag','grip','muzzle'],model:'rifle'},
 {name:'ESCOPETA',label:'ESCOPETA',owned:true,mag:6,reserve:36,max:6,damage:13,rate:.65,pellets:7,spread:.095,auto:false,range:34,falloff:[6,26],zoom:0,aimK:.25,pack:12,reloadT:1.25,slots:['scope','mag','muzzle'],shortScope:true,model:'shotgun'},
 {name:'PISTOLA',label:'PISTOLA',owned:true,mag:12,reserve:72,max:12,damage:22,rate:.28,pellets:1,spread:.025,auto:false,range:65,falloff:[30,90],zoom:0,aimK:.25,pack:24,reloadT:1.25,slots:['scope','mag','muzzle'],shortScope:true,model:'pistol'},
 {name:'SUBFUSIL',label:'SUBFUSIL',owned:false,mag:25,reserve:100,max:25,damage:14,rate:.075,pellets:1,spread:.03,auto:true,range:50,falloff:[12,50],zoom:0,aimK:.3,pack:40,reloadT:1.3,slots:['scope','mag','grip','muzzle'],model:'smg'},
 {name:'SNIPER',label:'FUSIL DE FRANCOTIRADOR',owned:false,mag:5,reserve:20,max:5,damage:90,rate:1.4,pellets:1,spread:.004,auto:false,range:120,falloff:[100,220],zoom:6,aimK:.1,pack:5,reloadT:2.2,slots:['mag','grip','muzzle'],model:'sniper'},
 {name:'REVÓLVER',label:'REVÓLVER',owned:false,mag:6,reserve:36,max:6,damage:48,rate:.55,pellets:1,spread:.02,auto:false,range:60,falloff:[25,70],zoom:0,aimK:.3,pack:12,reloadT:2,slots:['scope','muzzle'],shortScope:true,model:'revolver'}
];

// ---------- Modelos 3D del arma (dirección de disparo = -Z) ----------
// partes: k = 'b' caja [ancho,alto,largo] | 'c' cilindro [radio,largo] (eje Z); p = posición; m = material; mag = parte que crece con el cargador ampliado
// top = [altura, z] donde va la mira; gripZ = dónde va la empuñadura; muzzleZ = punta del cañón
const MODELS={
 rifle:{muzzleZ:-1.1,top:[.1,-.2],gripZ:-.64,parts:[
  {k:'b',s:[.16,.17,.72],p:[0,0,-.2],m:'metal'},{k:'c',s:[.035,.65],p:[0,.01,-.78],m:'dark'},{k:'b',s:[.13,.14,.32],p:[0,-.02,.28],m:'dark'},
  {k:'b',s:[.12,.12,.3],p:[0,-.01,-.62],m:'dark'},{k:'b',s:[.1,.26,.14],p:[0,-.2,-.12],m:'dark',mag:1}]},
 shotgun:{muzzleZ:-1.2,top:[.12,-.1],gripZ:-.7,parts:[
  {k:'b',s:[.16,.18,.6],p:[0,0,-.1],m:'metal'},{k:'c',s:[.05,.85],p:[0,.03,-.78],m:'dark'},{k:'b',s:[.17,.1,.3],p:[0,-.09,-.78],m:'dark'},
  {k:'b',s:[.14,.15,.4],p:[0,-.02,.35],m:'dark'},{k:'c',s:[.032,.7],p:[0,-.06,-.7],m:'metal',mag:1}]},
 pistol:{muzzleZ:-.41,top:[.1,-.1],gripZ:-.3,parts:[
  {k:'b',s:[.1,.13,.42],p:[0,.03,-.1],m:'metal'},{k:'b',s:[.09,.2,.13],p:[0,-.14,.06],m:'dark'},{k:'c',s:[.03,.1],p:[0,.04,-.36],m:'dark'},
  {k:'b',s:[.085,.1,.12],p:[0,-.28,.06],m:'metal',mag:1}]},
 smg:{muzzleZ:-.66,top:[.09,-.1],gripZ:-.45,parts:[
  {k:'b',s:[.15,.16,.5],p:[0,0,-.1],m:'metal'},{k:'c',s:[.03,.3],p:[0,.02,-.5],m:'dark'},{k:'b',s:[.1,.1,.25],p:[0,-.01,.3],m:'dark'},
  {k:'b',s:[.08,.34,.1],p:[0,-.26,-.05],m:'dark',mag:1}]},
 sniper:{muzzleZ:-1.56,top:[.12,-.2],gripZ:-.8,parts:[
  {k:'b',s:[.15,.16,.8],p:[0,0,-.1],m:'metal'},{k:'c',s:[.03,1.1],p:[0,.01,-1.0],m:'dark'},{k:'b',s:[.14,.18,.5],p:[0,-.02,.4],m:'dark'},
  {k:'c',s:[.05,.5],p:[0,.14,-.2],m:'dark'},{k:'c',s:[.062,.06],p:[0,.14,-.5],m:'dark'},{k:'c',s:[.05,.012],p:[0,.14,-.535],m:'lens'},
  {k:'b',s:[.1,.14,.16],p:[0,-.12,-.05],m:'dark',mag:1}]},
 revolver:{muzzleZ:-.58,top:[.09,-.1],gripZ:-.35,parts:[
  {k:'b',s:[.09,.15,.3],p:[0,0,-.05],m:'metal'},{k:'c',s:[.075,.16],p:[0,0,-.12],m:'dark'},{k:'c',s:[.03,.35],p:[0,.03,-.4],m:'dark'},
  {k:'b',s:[.08,.22,.12],p:[0,-.16,.12],m:'dark'}]}
};
const GUN_MATS={metal:new THREE.MeshStandardMaterial({color:0x30383a,roughness:.35,metalness:.65}),dark:new THREE.MeshStandardMaterial({color:0x242c2a,roughness:.82}),
 lens:new THREE.MeshStandardMaterial({color:0x66b7ff,roughness:.1,metalness:.5,emissive:0x1a4f8a,emissiveIntensity:.6}),
 dot:new THREE.MeshStandardMaterial({color:0xff2a20,roughness:.2,emissive:0xff2a20,emissiveIntensity:1.2})};
const accMat=c=>new THREE.MeshStandardMaterial({color:c,roughness:.6,metalness:.2});

export class Player{
  constructor(scene){this.group=new THREE.Group();this.group.position.set(0,0,15);this.yaw=Math.PI;this.vy=0;this.grounded=true;this.speed=5.4;this.charIndex=0;this.weaponIndex=0;
   this.weapons=WEAPONS.map(d=>{const w={...d,falloff:[...d.falloff],slots:[...d.slots]};w.base={max:w.max,spread:w.spread,zoom:w.zoom,aimK:w.aimK,range:w.range,damage:w.damage};w.start={mag:w.mag,reserve:w.reserve};w.att={scope:null,mag:null,grip:null,muzzle:null};w.quiet=false;return w});
   this.inv={};this.lastShot=0;this.buildModel();scene.add(this.group)}
  buildModel(){const M=(r=.82,m=0)=>new THREE.MeshStandardMaterial({color:0x888888,roughness:r,metalness:m});
   const mats=this.mats={uniform:M(),dark:M(),skin:M(),boot:M(.9),accent:M(.5,.2),hair:M(.95),eye:M(.3)};const {uniform,dark,skin,boot,accent,hair,eye}=mats;
   const parts=this.bodyParts=[];
   const add=(geo,ma,x,y,z)=>{const o=new THREE.Mesh(geo,ma);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;this.group.add(o);parts.push(o);return o};
   add(new THREE.CapsuleGeometry(.34,.76,5,10),uniform,0,1.05,0);add(new THREE.SphereGeometry(.235,16,12),skin,0,1.78,0);add(new THREE.BoxGeometry(.43,.28,.35),dark,0,1.45,.03);this.pack=add(new THREE.BoxGeometry(.52,.58,.25),dark,0,1.02,.34);
   for(const s of [-1,1]){add(new THREE.CapsuleGeometry(.105,.55,4,8),uniform,s*.2,.43,0);add(new THREE.BoxGeometry(.19,.2,.38),boot,s*.2,.13,-.05);add(new THREE.CapsuleGeometry(.09,.48,4,8),uniform,s*.4,1.05,-.03);add(new THREE.SphereGeometry(.115,10,8),dark,s*.4,.78,.04); // guantes
    add(new THREE.SphereGeometry(.032,8,6),eye,s*.085,1.81,-.215)} // ojos
   add(new THREE.BoxGeometry(.72,.09,.42),dark,0,.72,0);add(new THREE.BoxGeometry(.12,.1,.05),accent,0,.72,-.22); // cinturón y hebilla
   // Detalles que distinguen a cada personaje (se muestran u ocultan en setCharacter)
   const E=this.extras={};
   E.band=add(new THREE.TorusGeometry(.225,.04,6,16),accent,0,1.86,0);E.band.rotation.x=Math.PI/2;
   E.helmet=add(new THREE.SphereGeometry(.27,16,10,0,Math.PI*2,0,Math.PI/2),accent,0,1.8,0);
   E.vest=add(new THREE.BoxGeometry(.6,.42,.4),accent,0,1.1,-.02);
   E.scarf=add(new THREE.BoxGeometry(.4,.1,.36),accent,0,1.6,0);
   E.goggles=add(new THREE.BoxGeometry(.38,.09,.07),accent,0,1.88,-.2);
   E.hairS=add(new THREE.SphereGeometry(.245,16,10,0,Math.PI*2,0,Math.PI*.55),hair,0,1.8,.01);
   E.hairL=add(new THREE.SphereGeometry(.25,16,10,0,Math.PI*2,0,Math.PI*.62),hair,0,1.79,.03);
   E.tail=add(new THREE.CapsuleGeometry(.065,.42,4,8),hair,0,1.62,.3);E.tail.rotation.x=-.35;
   E.knees=add(new THREE.BoxGeometry(.5,.16,.2),accent,0,.46,-.12);
   E.shoulders=add(new THREE.SphereGeometry(.16,10,8),accent,-.43,1.52,0);E.shoulders2=add(new THREE.SphereGeometry(.16,10,8),accent,.43,1.52,0);
   // el arma es un grupo fijo (this.gun) cuyo contenido cambia según el arma y sus accesorios (buildGun); this.muzzle es la boca del cañón
   const gun=new THREE.Group();gun.position.set(.27,1.12,-.37);this.group.add(gun);this.gun=gun;this.muzzle=new THREE.Object3D();this.muzzle.position.set(0,.01,-1.1);gun.add(this.muzzle);this.custom={};this.setCharacter(this.charIndex);this.buildGun()}
  get character(){return CHARACTERS[this.charIndex]}
  // Aplica colores, detalles y habilidades del personaje elegido (ver CHARACTERS)
  setCharacter(i){const c=CHARACTERS[i]||CHARACTERS[0];this.charIndex=CHARACTERS.indexOf(c);const m=this.mats;for(const k of Object.keys(c.colors))m[k].color.setHex(c.colors[k]);
   const custom=this.custom[c.id];
   for(const [k,o] of Object.entries(this.extras)){const on=c.extras.includes(k)||(k==='shoulders2'&&c.extras.includes('shoulders'));o.visible=!custom&&on}
   this.bodyParts.forEach(o=>{if(!Object.values(this.extras).includes(o))o.visible=!custom});
   for(const [id,o] of Object.entries(this.custom))o.visible=(id===c.id);
   this.pack.scale.set(c.pack,c.pack,c.pack);this.speed=c.speed}
  // Modelo 3D propio (.glb) para un personaje: sustituye al modelo hecho con formas básicas. Ver loadCustomModels en main.js
  setCustomModel(id,obj){const box=new THREE.Box3().setFromObject(obj),h=box.max.y-box.min.y;if(h>0)obj.scale.multiplyScalar(1.8/h);obj.position.y-=box.min.y*(1.8/h||1);obj.rotation.y=Math.PI;this.group.add(obj);this.custom[id]=obj;this.setCharacter(this.charIndex)}
  // Reconstruye el modelo 3D del arma actual con sus accesorios instalados
  buildGun(){const g=this.gun,w=this.weapon,att=w.att,M=MODELS[w.model];
   for(const c of [...g.children]){if(c===this.muzzle)continue;g.remove(c);if(c.geometry)c.geometry.dispose()}
   const put=(geo,mat,x,y,z,rotZ)=>{const o=new THREE.Mesh(geo,mat);o.position.set(x,y,z);if(rotZ)o.rotation.x=Math.PI/2;o.castShadow=true;g.add(o);return o};
   const mesh=(p)=>{const m=GUN_MATS[p.m];if(p.k==='b')return put(new THREE.BoxGeometry(...p.s),m,...p.p);const o=put(new THREE.CylinderGeometry(p.s[0],p.s[0],p.s[1],10),m,...p.p,true);return o};
   for(const p of M.parts){const o=mesh(p);
    if(p.mag&&att.mag){ // cargador ampliado: más largo
     if(p.k==='b'){o.scale.y=1.6;o.position.y-=p.s[1]*.3}else o.scale.y=1.45}}
   const [ty,tz]=M.top;
   if(att.scope==='scope1'){put(new THREE.BoxGeometry(.07,.04,.14),GUN_MATS.dark,0,ty+.03,tz);put(new THREE.BoxGeometry(.055,.06,.012),GUN_MATS.dot,0,ty+.08,tz-.06)}
   if(att.scope==='scope4'){put(new THREE.CylinderGeometry(.04,.04,.34,10),GUN_MATS.dark,0,ty+.07,tz,true);put(new THREE.CylinderGeometry(.052,.052,.07,10),GUN_MATS.dark,0,ty+.07,tz-.19,true);put(new THREE.CylinderGeometry(.045,.045,.012,10),GUN_MATS.lens,0,ty+.07,tz-.226,true)}
   if(att.grip)put(new THREE.BoxGeometry(.05,.17,.06),accMat(ACCESSORIES.grip.color),0,-.14,M.gripZ);
   let mz=M.muzzleZ;
   if(att.muzzle){put(new THREE.CylinderGeometry(.045,.045,.28,12),GUN_MATS.dark,0,.02,M.muzzleZ-.1,true);mz=M.muzzleZ-.24}
   this.muzzle.position.set(0,.01,mz)}
  get position(){return this.group.position}get weapon(){return this.weapons[this.weaponIndex]}
  // --- estadísticas reales = valores base + efecto de los accesorios instalados ---
  applyStats(w){const b=w.base,a=w.att;let max=b.max,spread=b.spread,zoom=b.zoom,aimK=b.aimK,damage=b.damage;w.quiet=false;
   if(a.mag)max=Math.ceil(b.max*1.5);
   if(a.grip)spread*=.65;
   if(a.scope==='scope1'){zoom=Math.max(zoom,1.8);aimK*=.8}
   if(a.scope==='scope4'){zoom=Math.max(zoom,4.5);aimK*=.6}
   if(a.muzzle){damage*=.95;w.quiet=true}
   w.max=max;w.spread=spread;w.zoom=zoom;w.aimK=aimK;w.damage=damage;
   if(w.mag>w.max){w.reserve+=w.mag-w.max;w.mag=w.max}}
  canEquip(w,key){const a=ACCESSORIES[key];return !!a&&w.slots.includes(a.slot)&&!(key==='scope4'&&w.shortScope)}
  // Recoger un accesorio: va a la mochila y, si el arma actual tiene ese hueco libre y es compatible, se equipa solo. Devuelve true si se equipó.
  addAccessory(key){this.inv[key]=(this.inv[key]||0)+1;const w=this.weapon;if(this.canEquip(w,key)&&!w.att[ACCESSORIES[key].slot])return this.equip(key);return false}
  equip(key){const w=this.weapon,a=ACCESSORIES[key];if(!this.canEquip(w,key)||!(this.inv[key]>0))return false;const old=w.att[a.slot];if(old)this.inv[old]=(this.inv[old]||0)+1;this.inv[key]--;w.att[a.slot]=key;this.applyStats(w);this.buildGun();return true}
  unequip(slot){const w=this.weapon,k=w.att[slot];if(!k)return false;w.att[slot]=null;this.inv[k]=(this.inv[k]||0)+1;this.applyStats(w);this.buildGun();return true}
  // Recoger un arma nueva: queda en tu poder, con su cargador lleno y su munición inicial, y pasa a ser el arma activa
  giveWeapon(i){const w=this.weapons[i];w.owned=true;w.mag=w.max;w.reserve=w.start.reserve;this.weaponIndex=i;this.buildGun();return w}
  selectWeapon(i){if(!this.weapons[i]||!this.weapons[i].owned)return false;this.weaponIndex=i;this.buildGun();return true}
  reset(){this.group.position.set(0,0,15);this.group.rotation.set(0,Math.PI,0);this.yaw=Math.PI;this.vy=0;this.grounded=true;this.weaponIndex=0;this.inv={};this.weapons.forEach((w,i)=>{w.owned=i<3;w.att={scope:null,mag:null,grip:null,muzzle:null};this.applyStats(w);w.mag=w.start.mag;w.reserve=w.start.reserve});this.lastShot=0;this.buildGun()}
  jump(){if(this.grounded){this.vy=7.2;this.grounded=false}}
  // Cambia al siguiente arma que tengas (las que aún no has recogido se saltan)
  switchWeapon(){let i=this.weaponIndex;for(let k=0;k<this.weapons.length;k++){i=(i+1)%this.weapons.length;if(this.weapons[i].owned)break}this.weaponIndex=i;this.buildGun();return this.weapon}
  update(dt,input){const forward=new THREE.Vector3(-Math.sin(this.yaw),0,-Math.cos(this.yaw)),right=new THREE.Vector3(Math.cos(this.yaw),0,-Math.sin(this.yaw));const dir=right.multiplyScalar(input.x).add(forward.multiplyScalar(input.y));if(dir.lengthSq()>1)dir.normalize();this.group.position.addScaledVector(dir,this.speed*dt);if(dir.lengthSq()>.01)this.group.rotation.y=this.yaw;this.vy-=19*dt;this.group.position.y+=this.vy*dt;if(this.group.position.y<=0){this.group.position.y=0;this.vy=0;this.grounded=true}this.group.position.x=THREE.MathUtils.clamp(this.group.position.x,-39,39);this.group.position.z=THREE.MathUtils.clamp(this.group.position.z,-39,39)}
}
