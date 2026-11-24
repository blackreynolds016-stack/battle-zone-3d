import * as THREE from 'three';

// Estilo visual de cada arma: [rifle, escopeta, pistola]
const STYLES=[
 {flash:0xffa63c,size:.34,tracer:0xffd27a,tw:.04,streak:2.4,speed:230,kick:.08,rot:.05,sparks:4,look:[1,1,1]},
 {flash:0xff6a1a,size:.66,tracer:0xff9a3a,tw:.055,streak:1.2,speed:150,kick:.22,rot:.15,sparks:2,look:[1,1,1]},
 {flash:0xfff0b0,size:.24,tracer:0xfff6d0,tw:.028,streak:1.6,speed:200,kick:.05,rot:.1,sparks:3,look:[1,1,1]},
 {flash:0xffd070,size:.26,tracer:0xffe39a,tw:.03,streak:1.8,speed:210,kick:.04,rot:.12,sparks:3,look:[1,1,1]},
 {flash:0xffe6a0,size:.5,tracer:0xfff0c0,tw:.05,streak:3.4,speed:330,kick:.3,rot:.12,sparks:5,look:[1,1,1]},
 {flash:0xffb050,size:.5,tracer:0xffd890,tw:.045,streak:2,speed:240,kick:.2,rot:.14,sparks:4,look:[1,1,1]}
];
const KINDS={ // color de las partículas según la superficie
 blood:{color:0xb81e1e,puff:0xff4030},
 dirt:{color:0x6d5a3a,puff:0xb89c6a},
 wood:{color:0x8a6a3f,puff:0xd2a86a},
 stone:{color:0xa0a09a,puff:0xdddddd},
 spark:{color:0xffcc66,puff:0xffe29a}
};

export function createEffects(scene,player){
 const additive={transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,fog:false};
 const unit=new THREE.BoxGeometry(1,1,1);

 // --- Fogonazo (un único grupo pegado a la boca del arma) ---
 const flashMat=new THREE.MeshBasicMaterial({color:0xffa63c,...additive});
 const flash=new THREE.Group();
 const core=new THREE.Mesh(new THREE.SphereGeometry(.5,8,6),flashMat);
 const cone=new THREE.Mesh(new THREE.ConeGeometry(.28,1.6,6),flashMat);cone.rotation.x=-Math.PI/2;cone.position.z=-.75;
 flash.add(core,cone);flash.visible=false;player.muzzle.add(flash);
 let flashT=0;

 // --- Trazadoras (pool) ---
 const TR=20,tracers=[];
 for(let i=0;i<TR;i++){const m=new THREE.Mesh(unit,new THREE.MeshBasicMaterial({color:0xffd27a,...additive,opacity:.95}));m.visible=false;scene.add(m);tracers.push({m,on:false,from:new THREE.Vector3(),dir:new THREE.Vector3(),len:0,age:0,streak:2,speed:200,w:.04})}
 let trI=0;
 const _a=new THREE.Vector3(),_b=new THREE.Vector3();
 function tracer(from,to,style,speedMul=1){
  const t=tracers[trI];trI=(trI+1)%TR;
  t.from.copy(from);t.dir.subVectors(to,from);t.len=t.dir.length();if(t.len<.05){t.on=false;t.m.visible=false;return}t.dir.divideScalar(t.len);
  t.age=0;t.streak=style.streak;t.speed=style.speed*speedMul;t.w=style.tw;t.m.material.color.setHex(style.tracer);t.on=true;t.m.visible=true;
 }

 // --- Partículas (pool) ---
 const PN=64,parts=[];
 const pmats={};for(const k in KINDS)pmats[k]=new THREE.MeshBasicMaterial({color:KINDS[k].color});
 for(let i=0;i<PN;i++){const m=new THREE.Mesh(unit,pmats.dirt);m.visible=false;scene.add(m);parts.push({m,on:false,v:new THREE.Vector3(),life:0,max:.4,size:.07})}
 let pI=0;
 // --- Destellos de impacto (pool) ---
 const FN=10,puffs=[];
 const puffGeo=new THREE.SphereGeometry(.5,8,6);
 for(let i=0;i<FN;i++){const m=new THREE.Mesh(puffGeo,new THREE.MeshBasicMaterial({color:0xffffff,...additive,opacity:.85}));m.visible=false;scene.add(m);puffs.push({m,on:false,age:0,max:.14,size:.3})}
 let fI=0;
 function impact(point,kind,style){
  const K=KINDS[kind]?kind:'dirt';
  const f=puffs[fI];fI=(fI+1)%FN;f.m.material.color.setHex(KINDS[K].puff);f.m.material.opacity=.85;f.m.position.copy(point);f.age=0;f.size=kind==='blood'?.34:.26;f.on=true;f.m.visible=true;f.m.scale.setScalar(.05);
  const n=(style.sparks||3)+(kind==='blood'?1:0);
  for(let i=0;i<n;i++){const p=parts[pI];pI=(pI+1)%PN;p.m.material=(i===0&&kind!=='blood')?pmats.spark:pmats[K];p.m.position.copy(point);p.v.set((Math.random()-.5)*4,1.2+Math.random()*3,(Math.random()-.5)*4);p.max=p.life=.28+Math.random()*.25;p.size=.05+Math.random()*.05;p.on=true;p.m.visible=true;p.m.scale.setScalar(p.size)}
 }

 // --- Polvo al correr y al aterrizar (pool de bolitas que crecen y se desvanecen) ---
 const DN=14,dusts=[],dustGeo=new THREE.SphereGeometry(.5,6,4);
 for(let i=0;i<DN;i++){const m=new THREE.Mesh(dustGeo,new THREE.MeshBasicMaterial({color:0xb5a583,transparent:true,depthWrite:false,opacity:.4}));m.visible=false;scene.add(m);dusts.push({m,on:false,age:0,max:.6,size:.5,vx:0,vz:0})}
 let dI=0;
 function dust(x,z,power=4){const n=power>6?5:1;
  for(let i=0;i<n;i++){const d=dusts[dI];dI=(dI+1)%DN;const a=Math.random()*6.28,s=n>1?.8+power*.18:.35;
   d.m.position.set(x+Math.cos(a)*.25,.14,z+Math.sin(a)*.25);d.vx=Math.cos(a)*s;d.vz=Math.sin(a)*s;d.age=0;d.max=.45+Math.random()*.25;d.size=n>1?.55+power*.05:.3;d.on=true;d.m.visible=true;d.m.scale.setScalar(.1)}}

 // --- Retroceso y aspecto del arma ---
 const g=player.gun,base={z:g.position.z};let kick=0,kickStyle=STYLES[0];
 function setWeaponLook(i){const s=STYLES[i]||STYLES[0];kickStyle=s;g.scale.set(s.look[0],s.look[1],s.look[2]);flashMat.color.setHex(s.flash)}
 function muzzle(i,quiet){const s=STYLES[i]||STYLES[0];kickStyle=s;kick=1;flashT=.055;flashMat.color.setHex(s.flash);flash.scale.setScalar(s.size*(.85+Math.random()*.3)*(quiet?.3:1));flash.rotation.z=Math.random()*6.28;flash.visible=true}
 function shotTracer(from,to,i){tracer(from,to,STYLES[i]||STYLES[0])}
 function enemyTracer(from,to){tracer(from,to,{tracer:0xff6a5a,tw:.04,streak:1.6,speed:90})}
 function shotImpact(point,kind,i){impact(point,kind,STYLES[i]||STYLES[0])}

 function update(dt){
  if(flash.visible){flashT-=dt;if(flashT<=0)flash.visible=false}
  if(kick>0){kick=Math.max(0,kick-dt*9);g.position.z=base.z+kick*kickStyle.kick;g.rotation.x=-kick*kickStyle.rot}else if(g.rotation.x!==0||g.position.z!==base.z){g.position.z=base.z;g.rotation.x=0}
  for(const t of tracers){if(!t.on)continue;t.age+=dt;const head=Math.min(t.len,t.speed*t.age),tail=Math.max(0,head-t.streak);if(tail>=t.len||t.speed*t.age>t.len+t.streak){t.on=false;t.m.visible=false;continue}
   const seg=Math.max(.02,head-tail);_a.copy(t.from).addScaledVector(t.dir,(head+tail)/2);t.m.position.copy(_a);_b.copy(_a).add(t.dir);t.m.lookAt(_b);t.m.scale.set(t.w,t.w,seg)}
  for(const p of parts){if(!p.on)continue;p.life-=dt;if(p.life<=0||p.m.position.y<0){p.on=false;p.m.visible=false;continue}p.v.y-=11*dt;p.m.position.addScaledVector(p.v,dt);p.m.scale.setScalar(p.size*(p.life/p.max))}
  for(const f of puffs){if(!f.on)continue;f.age+=dt;const k=f.age/f.max;if(k>=1){f.on=false;f.m.visible=false;continue}f.m.scale.setScalar(f.size*(.4+k*.9));f.m.material.opacity=.85*(1-k)}
  for(const d of dusts){if(!d.on)continue;d.age+=dt;const k=d.age/d.max;if(k>=1){d.on=false;d.m.visible=false;continue}d.m.position.x+=d.vx*dt*(1-k);d.m.position.z+=d.vz*dt*(1-k);d.m.position.y+=.5*dt;d.m.scale.setScalar(d.size*(.25+k*.85));d.m.material.opacity=.4*(1-k)}
 }
 function reset(){flash.visible=false;kick=0;g.position.z=base.z;g.rotation.x=0;for(const t of tracers){t.on=false;t.m.visible=false}for(const p of parts){p.on=false;p.m.visible=false}for(const f of puffs){f.on=false;f.m.visible=false}for(const d of dusts){d.on=false;d.m.visible=false}}
 setWeaponLook(0);
 return{dust,muzzle,tracer:shotTracer,enemyTracer,impact:shotImpact,setWeaponLook,update,reset}
}
