import * as THREE from 'three';
import {skinFor,crownTex} from './skins.js';

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
 {id:'zane',name:'ZANE',role:'SOLDADO',desc:'Equilibrado en todo',speed:5.4,armor:25,reloadMul:1,dmgTaken:1,pack:1,extras:['hairSpike','mask','trim','pockets','knees','decals','chain','collar'],colors:{uniform:0x16161c,dark:0x0c0c10,skin:0xcf9e7e,boot:0xf0f0f4,accent:0xb04cff,hair:0xf2f2f7,pants:0x3b3f3a}},
 {id:'lyra',name:'LYRA',role:'EXPLORADORA',desc:'Rápida y recarga veloz, sin escudo inicial',speed:6.2,armor:0,reloadMul:.75,dmgTaken:1,pack:.8,extras:['ponytail','mask','trim','decals','chain','collar'],colors:{uniform:0x241638,dark:0x0e0c14,skin:0xe3ae8c,boot:0x1b1a24,accent:0xc65cff,hair:0x5a2fb0,pants:0x15141c}},
 {id:'bruno',name:'BRUNO',role:'TANQUE',desc:'Lento pero resistente: +escudo y -15 % de daño recibido',speed:4.8,armor:60,reloadMul:1.1,dmgTaken:.85,pack:1.25,extras:['helmet','vest','shoulders','knees'],colors:{uniform:0x3a404c,dark:0x1a1d24,skin:0x8a5a3c,boot:0x11151b,accent:0xffc933,hair:0x15151a,pants:0x2b303a}}
];
// Posturas: 0 de pie · 1 agachado · 2 acostado. Altura de ojos, de pecho (origen de disparo) y multiplicador de velocidad
export const STANCE={eye:[1.62,1.2,.5],chest:[1.2,.85,.4],speed:[1,.55,.28],sprint:1.5};

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
   const mats=this.mats={uniform:M(.62,.05),dark:M(.75,.1),skin:M(.6),boot:M(.8),accent:M(.35,.3),hair:M(.85),pants:M(.85),metal:M(.3,.9)};mats.metal.color.setHex(0xc9ced6);const {uniform,dark,skin,boot,accent,hair,pants,metal}=mats;
   const rig=this.rig=new THREE.Group();this.group.add(rig);const parts=this.bodyParts=[];
   const mk=(geo,ma,par,x,y,z)=>{const o=new THREE.Mesh(geo,ma);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;par.add(o);parts.push(o);return o};
   const piv=(par,x,y,z)=>{const g=new THREE.Group();g.position.set(x,y,z);par.add(g);return g};
   const cap=(r,l)=>new THREE.CapsuleGeometry(r,l,4,10),box=(a,b,c)=>new THREE.BoxGeometry(a,b,c),sph=(r,a=14,b=10)=>new THREE.SphereGeometry(r,a,b);
   const E=this.extras={};this.legs=[];this.arms=[];
   // piernas: cadera → rodilla (cada una es un pivote para caminar y agacharse)
   for(const s of [-1,1]){const hip=piv(rig,s*.13,.92,0),knee=piv(hip,0,-.44,0);
    mk(cap(.095,.3),pants,hip,0,-.22,0);mk(cap(.078,.3),pants,knee,0,-.22,0);
    mk(box(.15,.1,.31),boot,knee,0,-.41,-.05);mk(box(.158,.045,.32),dark,knee,0,-.46,-.05);mk(box(.12,.03,.03),accent,knee,0,-.42,-.205);
    E[s<0?'knees':'knees2']=mk(box(.15,.14,.07),dark,knee,0,-.02,-.08);
    E[s<0?'pockets':'pockets2']=mk(box(.07,.2,.16),dark,hip,s*.105,-.24,-.02);
    this.legs.push({hip,knee})}
   // torso: pecho, cinturón, cuello y cabeza
   const torso=this.torso=piv(rig,0,.92,0);
   const chest=mk(cap(.24,.34),uniform,torso,0,.3,0);chest.scale.set(1.2,1,.82);
   mk(box(.52,.08,.3),dark,torso,0,.02,0);mk(box(.1,.08,.03),accent,torso,0,.02,-.16);
   const trim=E.trim=piv(torso,0,0,0);for(const s of [-1,1]){mk(box(.028,.55,.02),accent,trim,s*.12,.33,-.205);mk(box(.12,.028,.2),accent,trim,s*.33,.62,0)}
   E.vest=mk(box(.6,.42,.38),accent,torso,0,.3,-.01);E.vest.material=mats.accent;
   this.pack=mk(box(.5,.55,.22),dark,torso,0,.3,.24);
   const chain=E.chain=piv(torso,0,0,0);const ring=mk(new THREE.TorusGeometry(.118,.012,6,18),metal,chain,0,.67,-.015);ring.rotation.x=Math.PI/2;mk(box(.035,.055,.012),metal,chain,0,.6,-.125);
   const collar=E.collar=mk(new THREE.TorusGeometry(.19,.055,8,16),accent,torso,0,.7,.05);collar.rotation.x=Math.PI/2;collar.scale.set(1,1,.8);
   const head=this.head=piv(torso,0,.72,0);mk(cap(.055,.08),skin,head,0,-.03,0);mk(sph(.19),skin,head,0,.1,0);
   for(const s of [-1,1])mk(box(.065,.03,.03),accent,head,s*.075,.14,-.17);
   E.mask=mk(box(.34,.14,.2),dark,head,0,.02,-.09);
   const hs=E.hairSpike=piv(head,0,.1,0);mk(new THREE.SphereGeometry(.2,14,10,0,Math.PI*2,0,Math.PI*.55),hair,hs,0,0,.01);
   for(const [x,z,r] of [[0,-.08,-.5],[-.1,-.02,-.35],[.1,-.02,-.35],[-.06,.07,.3],[.06,.07,.3],[0,0,0]]){const sp=mk(new THREE.ConeGeometry(.055,.2,6),hair,hs,x,.2,z);sp.rotation.x=r;sp.rotation.z=x*-3}
   const pt=E.ponytail=piv(head,0,.1,0);mk(new THREE.SphereGeometry(.205,14,10,0,Math.PI*2,0,Math.PI*.6),hair,pt,0,0,.02);mk(new THREE.TorusGeometry(.03,.015,6,10),accent,pt,0,.05,.2);
   this.tail=piv(pt,0,.05,.2);const tl=mk(cap(.06,.38),hair,this.tail,0,-.22,0);tl.scale.set(1,1,.8);
   E.helmet=mk(new THREE.SphereGeometry(.22,16,10,0,Math.PI*2,0,Math.PI/2),dark,head,0,.12,0);
   // hombros y brazos: hombro → codo
   for(const s of [-1,1]){const sh=piv(torso,s*.34,.55,0),el=piv(sh,0,-.36,0);
    mk(sph(.1),uniform,sh,0,0,0);mk(cap(.07,.2),uniform,sh,0,-.18,0);mk(cap(.06,.2),uniform,el,0,-.17,0);mk(sph(.065,10,8),dark,el,0,-.34,0);mk(box(.125,.025,.125),accent,el,0,-.04,0);
    E[s<0?'shoulders':'shoulders2']=mk(sph(.14,10,8),accent,sh,0,.02,0);
    this.arms.push({sh,el})}
   // logo de corona: pecho, bolsillo, mochila (brillante) y zapatillas
   {const ct=crownTex('#ffffff'),cg=crownTex('#e3c2ff','#b04cff'),ds=[];
    if(ct&&cg){const dm=(t,w,h,par,x,y,z,ry=0,rx=0)=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:t,transparent:true,alphaTest:.05,depthWrite:false}));m.position.set(x,y,z);m.rotation.set(rx,ry,0);par.add(m);ds.push(m);return m};
     dm(ct,.1,.075,torso,.13,.46,-.206,Math.PI);dm(cg,.27,.2,this.pack,0,0,.113);dm(ct,.09,.068,this.legs[1].hip,.143,-.24,-.02,Math.PI/2);
     for(const L of this.legs)dm(ct,.07,.052,L.knee,0,-.357,-.12,0,-Math.PI/2)}
    E.decals={set visible(v){ds.forEach(d=>d.visible=v)},get visible(){return ds.length?ds[0].visible:false}}}
   // el arma es un grupo fijo (this.gun) cuyo contenido cambia según el arma y sus accesorios (buildGun); this.muzzle es la boca del cañón
   const gun=new THREE.Group();gun.position.set(.27,1.12,-.37);this.group.add(gun);this.gun=gun;this.muzzle=new THREE.Object3D();this.muzzle.position.set(0,.01,-1.1);gun.add(this.muzzle);this.custom={};
   this.ranT=0;this.idleT=0;this.autoT=0;this.autoRun=true;this.running=false;this.dropping=false;this.stance=0;this.sb=0;this.sprinting=false;this.sprB=0;this.ph=0;this.mv=0;this.relaxed=false;this.t=0;
   const chute=this.chute=new THREE.Group();chute.visible=false;this.group.add(chute);
   const cm=new THREE.MeshStandardMaterial({color:0xe8e4d8,roughness:.8,side:THREE.DoubleSide}),cl=new THREE.MeshBasicMaterial({color:0x222222});
   const dome=new THREE.Mesh(new THREE.SphereGeometry(2.4,16,8,0,Math.PI*2,0,Math.PI/2),cm);dome.position.y=3.6;dome.scale.y=.7;chute.add(dome);
   for(const [x,z] of [[-1.4,-1.4],[1.4,-1.4],[-1.4,1.4],[1.4,1.4]]){const l=new THREE.Mesh(new THREE.CylinderGeometry(.015,.015,2.9,3),cl);l.position.set(x*.55,2.1,z*.55);l.rotation.z=-x*.16;l.rotation.x=z*.16;chute.add(l)}
   this.setCharacter(this.charIndex);this.buildGun()}
  get character(){return CHARACTERS[this.charIndex]}
  // Alturas según la postura (se suavizan al cambiar)
  get eyeH(){const t=this.sb,a=STANCE.eye;return t<=1?a[0]+(a[1]-a[0])*t:a[1]+(a[2]-a[1])*(t-1)}
  get chestH(){const t=this.sb,a=STANCE.chest;return t<=1?a[0]+(a[1]-a[0])*t:a[1]+(a[2]-a[1])*(t-1)}
  // Aplica colores, detalles y habilidades del personaje elegido (ver CHARACTERS)
  setCharacter(i){const c=CHARACTERS[i]||CHARACTERS[0];this.charIndex=CHARACTERS.indexOf(c);const m=this.mats;for(const k of Object.keys(c.colors))m[k].color.setHex(c.colors[k]);
   if(m.accent.emissive&&m.accent.emissive.setHex){m.accent.emissive.setHex(c.colors.accent);m.accent.emissiveIntensity=.8}
   const sk=skinFor(c),U=m.uniform,Pm=m.pants;
   for(const [mt,map,glow] of [[U,sk&&sk.uniform,sk&&sk.uniformGlow],[Pm,sk&&sk.pants,sk&&sk.pantsGlow]]){mt.map=map||null;mt.emissiveMap=glow||null;if(map)mt.color.setHex(0xffffff);if(mt.emissive&&mt.emissive.setHex){mt.emissive.setHex(glow?0xffffff:0x000000);mt.emissiveIntensity=glow?1:0}mt.needsUpdate=true}
   const custom=this.custom[c.id];
   for(const [k,o] of Object.entries(this.extras))o.visible=c.extras.includes(k.replace(/2$/,''));
   this.rig.visible=!custom;
   for(const [id,o] of Object.entries(this.custom))o.visible=(id===c.id);
   this.pack.scale.set(c.pack,c.pack,c.pack);this.speed=c.speed}
  // Cambia de postura: pulsar la misma otra vez vuelve a ponerse de pie. Devuelve la postura resultante
  toggleStance(s){this.stance=this.stance===s?0:s;this.sprinting=false;return this.stance}
  toggleSprint(){if(this.stance!==0)return false;this.sprinting=!this.sprinting;return this.sprinting}
  // Anima el cuerpo: caminar/correr, respirar, agacharse y acostarse. spd = velocidad real (m/s)
  animate(dt,spd=0){this.t+=dt;const d=this.stance-this.sb;this.sb+=Math.sign(d)*Math.min(Math.abs(d),dt*4.5);
   const c=Math.min(this.sb,1),p=Math.max(0,Math.min(this.sb-1,1)),cs=c*(1-p);
   this.mv+=((Math.min(1,spd/6))-this.mv)*Math.min(1,dt*10);const mv=this.mv;
   this.sprB+=((this.running&&mv>.15?1:0)-this.sprB)*Math.min(1,dt*8);const sp=this.sprB;
   this.ph+=dt*(5+8*mv+4*sp)*(mv>.02?1:0);const ph=this.ph;
   const amp=mv*(.7-.3*c+.25*sp)*(1-p),rig=this.rig;
   rig.rotation.x=-Math.PI/2*p;rig.position.y=-.37*cs+.22*p;rig.position.z=.144*cs+.9*p;
   this.legs.forEach((L,i)=>{const o=i?Math.PI:0,s=Math.sin(ph+o),k=Math.cos(ph+o);
    L.hip.rotation.x=1.25*cs+s*amp+Math.sin(ph+o)*.22*mv*p;L.knee.rotation.x=-1.9*cs-Math.max(0,k)*amp*1.2-Math.max(0,k)*.3*mv*p});
   this.torso.rotation.x=-.05-.25*cs-.28*sp;this.torso.position.y=.92+Math.sin(this.t*2.2)*.006;
   this.head.rotation.x=.12*sp+Math.sin(this.t*1.1)*.01;
   const [aL,aR]=this.arms,g=this.relaxed?0:1-sp,sw=Math.sin(ph)*(this.relaxed?.55:1.0)*Math.max(mv,.0)*1.1;
   const lerp=(a,b,t)=>a+(b-a)*t;
   aR.sh.rotation.set(lerp(lerp(sw,.45,g),2.9,p),0,this.relaxed?.08:0);aR.el.rotation.x=lerp(lerp(.15+Math.max(0,sw)*.4,.9,g),.3,p);
   aL.sh.rotation.set(lerp(lerp(-sw,1.1,g),2.9,p),0,lerp(this.relaxed?-.08:0,.25,g));aL.el.rotation.x=lerp(lerp(.15+Math.max(0,-sw)*.4,.35,g),.3,p);
   // el arma sigue a las manos según la postura
   const gp=this.gun.position,u=this.sb<=1?this.sb:1,q=Math.max(0,this.sb-1);
   gp.set(.27+(-.0)*u+.03*q,1.12-.34*u-.48*q-.08*sp,-.37-.08*u-.55*q);this.gun.rotation.x=.45*sp;
   this.tail.rotation.x=.35+Math.sin(ph)*.25*mv+Math.sin(this.t*1.7)*.04+.3*sp}
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
  reset(){this.group.position.set(0,0,15);this.group.rotation.set(0,Math.PI,0);this.yaw=Math.PI;this.vy=0;this.grounded=true;this.stance=0;this.sb=0;this.sprinting=false;this.running=false;this.ranT=0;this.idleT=0;this.autoT=0;this.dropping=false;this.chute.visible=false;this.sprB=0;this.weaponIndex=0;this.inv={};this.weapons.forEach((w,i)=>{w.owned=i<3;w.att={scope:null,mag:null,grip:null,muzzle:null};this.applyStats(w);w.mag=w.start.mag;w.reserve=w.start.reserve});this.lastShot=0;this.buildGun()}
  jump(){if(this.dropping)return;if(this.stance!==0){this.stance=0;return}if(this.grounded){this.vy=7.2;this.grounded=false}}
  // Cambia al siguiente arma que tengas (las que aún no has recogido se saltan)
  switchWeapon(){let i=this.weaponIndex;for(let k=0;k<this.weapons.length;k++){i=(i+1)%this.weapons.length;if(this.weapons[i].owned)break}this.weaponIndex=i;this.buildGun();return this.weapon}
  update(dt,input){const forward=new THREE.Vector3(-Math.sin(this.yaw),0,-Math.cos(this.yaw)),right=new THREE.Vector3(Math.cos(this.yaw),0,-Math.sin(this.yaw));const dir=right.multiplyScalar(input.x).add(forward.multiplyScalar(input.y));if(dir.lengthSq()>1)dir.normalize();
   const fwd=input.y>.3;
   // Correr: el botón lo deja "armado" aunque sueltes el joystick un instante; se apaga al detenerte (o a los 8 s sin moverte)
   if(this.sprinting){if(this.stance!==0||this.dropping)this.sprinting=false;else if(fwd){this.ranT+=dt;this.idleT=0}else{this.idleT+=dt;if((this.ranT>.25&&this.idleT>.4)||this.idleT>8)this.sprinting=false}}else{this.ranT=0;this.idleT=0}
   // Correr automático: joystick al máximo hacia delante durante .6 s
   if(this.autoRun&&!this.sprinting&&this.stance===0&&!this.dropping&&input.y>.92&&Math.abs(input.x)<.6){this.autoT+=dt;if(this.autoT>.6){this.sprinting=true;this.ranT=0;this.idleT=0}}else if(!(input.y>.92))this.autoT=0;
   this.running=this.sprinting&&fwd&&this.stance===0&&!this.dropping;
   if(this.dropping){ // paracaídas: planea o se lanza en picada hacia delante
    const dive=input.y>.6,v=dive?16:9*Math.min(1,dir.length()),fall=dive?15:6.5;
    this.group.position.addScaledVector(dir,v*dt);this.group.position.y-=fall*dt;if(dir.lengthSq()>.01)this.group.rotation.y=this.yaw;
    this.chute.visible=this.group.position.y>3;
    if(this.group.position.y<=0){this.group.position.y=0;this.vy=0;this.grounded=true;this.dropping=false;this.chute.visible=false}
    this.group.position.x=THREE.MathUtils.clamp(this.group.position.x,-118,118);this.group.position.z=THREE.MathUtils.clamp(this.group.position.z,-118,118);
    this.animate(dt,dir.length()*6);return}
   const v=this.speed*STANCE.speed[this.stance]*(this.running?STANCE.sprint:1);
   this.group.position.addScaledVector(dir,v*dt);if(dir.lengthSq()>.01)this.group.rotation.y=this.yaw;this.vy-=19*dt;this.group.position.y+=this.vy*dt;if(this.group.position.y<=0){this.group.position.y=0;this.vy=0;this.grounded=true}this.group.position.x=THREE.MathUtils.clamp(this.group.position.x,-118,118);this.group.position.z=THREE.MathUtils.clamp(this.group.position.z,-118,118);
   this.animate(dt,dir.length()*v)}
}
