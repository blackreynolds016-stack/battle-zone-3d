import * as THREE from 'three';
const mat=(color,roughness=.9,metalness=0)=>new THREE.MeshStandardMaterial({color,roughness,metalness});
function box(scene,x,y,z,sx,sy,sz,material){const m=new THREE.Mesh(new THREE.BoxGeometry(sx,sy,sz),material);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;scene.add(m);return m}
function makeTree(scene,x,z,scale=1){const g=new THREE.Group();const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.18*scale,.28*scale,2.2*scale,8),mat(0x59432e));trunk.position.y=1.1*scale;trunk.castShadow=true;g.add(trunk);for(let i=0;i<3;i++){const crown=new THREE.Mesh(new THREE.ConeGeometry((1.35-i*.2)*scale,2.3*scale,8),mat(i===1?0x315a39:0x3d6b40));crown.position.y=(2.1+i*.72)*scale;crown.castShadow=true;g.add(crown)}g.position.set(x,0,z);scene.add(g);return g}
function makeBuilding(scene,x,z,w,d,color){const g=new THREE.Group();const wall=mat(color),roof=mat(0x333b3a,.7),trim=mat(0x242a29);const body=new THREE.Mesh(new THREE.BoxGeometry(w,3.2,d),wall);body.position.y=1.6;body.castShadow=true;body.receiveShadow=true;g.add(body);const top=new THREE.Mesh(new THREE.BoxGeometry(w+.25,.25,d+.25),roof);top.position.y=3.25;top.castShadow=true;g.add(top);for(let s of [-1,1]){const win=new THREE.Mesh(new THREE.BoxGeometry(.9,.9,.08),mat(0x304d56,.25,.3));win.position.set(s*w*.27,2,-d/2-.045);g.add(win)}const door=new THREE.Mesh(new THREE.BoxGeometry(.85,1.9,.1),trim);door.position.set(0,.95,-d/2-.06);g.add(door);g.position.set(x,0,z);scene.add(g);return g}
function soldier(scene,x,z,index){const g=new THREE.Group();const uniform=mat(index%2?0x7b493e:0x4b5848),skin=mat(0x9c7056),dark=mat(0x252b29);const torso=new THREE.Mesh(new THREE.CapsuleGeometry(.32,.68,4,8),uniform);torso.position.y=1;torso.castShadow=true;g.add(torso);const head=new THREE.Mesh(new THREE.SphereGeometry(.21,12,10),skin);head.position.y=1.72;head.castShadow=true;g.add(head);const pack=new THREE.Mesh(new THREE.BoxGeometry(.4,.5,.22),dark);pack.position.set(0,1,-.3);g.add(pack);for(const s of [-1,1]){const leg=new THREE.Mesh(new THREE.CapsuleGeometry(.1,.5,3,7),dark);leg.position.set(s*.18,.38,0);g.add(leg);const arm=new THREE.Mesh(new THREE.CapsuleGeometry(.09,.42,3,7),uniform);arm.position.set(s*.37,1.05,-.05);g.add(arm)}g.position.set(x,0,z);
 g.userData={alive:true,hp:100,cooldown:1+Math.random()*2,attack:0,index,
  state:'chase',stun:0,flash:0,flashOn:false,alert:0,losT:0,sees:false,dying:0,coverPt:null,coverT:0,coverCd:0,last:new THREE.Vector3(x,0,z),head,mats:[uniform,skin]};
 g.children.forEach(c=>{c.userData.owner=g});
 scene.add(g);return g}

export function makeWorld(scene){
 const solids=[],blockers=[],covers=[];
 const addSolid=(mesh,kind,blocks)=>{mesh.userData.kind=kind;solids.push(mesh);if(blocks)blockers.push(mesh)};
 const ground=new THREE.Mesh(new THREE.PlaneGeometry(100,100,1,1),mat(0x526b43));ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;scene.add(ground);addSolid(ground,'dirt',false);
 const patch=new THREE.Mesh(new THREE.PlaneGeometry(80,80),mat(0x667b4d));patch.rotation.x=-Math.PI/2;patch.position.y=.012;scene.add(patch);
 const road=new THREE.Mesh(new THREE.PlaneGeometry(8,100),mat(0x555b56));road.rotation.x=-Math.PI/2;road.position.y=.025;scene.add(road);
 for(let i=0;i<90;i++){let x=(Math.random()-.5)*92,z=(Math.random()-.5)*92;if(Math.abs(x)<6)continue;const t=makeTree(scene,x,z,.75+Math.random()*.55);t.children.forEach((c,k)=>addSolid(c,'wood',k===0));covers.push({x,z,hw:.4,hd:.4})}
 for(let i=0;i<35;i++){const rock=new THREE.Mesh(new THREE.DodecahedronGeometry(.3+Math.random()*.65,0),mat(0x686d68));rock.position.set((Math.random()-.5)*88,.25,(Math.random()-.5)*88);rock.scale.y=.55;rock.castShadow=true;scene.add(rock);addSolid(rock,'stone',true);const rr=(rock.geometry.parameters.radius||.5)*.8;covers.push({x:rock.position.x,z:rock.position.z,hw:rr,hd:rr})}
 [[-13,-12,8,7,0x9b927e],[13,-18,9,7,0x8d9b98],[-19,14,7,8,0x8d806d],[19,13,8,7,0x9b927e]].forEach(b=>{const g=makeBuilding(scene,b[0],b[1],b[2],b[3],b[4]);addSolid(g.children[0],'stone',true);addSolid(g.children[1],'stone',true);covers.push({x:b[0],z:b[1],hw:b[2]/2,hd:b[3]/2})});
 const mountainMat=mat(0x66766d);for(let i=0;i<18;i++){const a=i/18*Math.PI*2,r=49+Math.random()*5,h=8+Math.random()*13;const m=new THREE.Mesh(new THREE.ConeGeometry(7+Math.random()*5,h,6),mountainMat);m.position.set(Math.cos(a)*r,h/2-1,Math.sin(a)*r);m.castShadow=true;scene.add(m)}
 const enemies=[];const spots=[[-9,-4],[10,-7],[-22,-20],[23,-3],[-25,25],[5,27],[28,25],[-3,-29]];spots.forEach((p,i)=>enemies.push(soldier(scene,p[0],p[1],i)));
 const loot=[];const lootDefs=[{type:'ammo',color:0xd5b54b},{type:'med',color:0x55cf85},{type:'armor',color:0x62bce9},{type:'ammo',color:0xd5b54b},{type:'med',color:0x55cf85},{type:'ammo',color:0xd5b54b}];const lootSpots=[[-5,7],[8,8],[-18,-2],[17,-22],[1,-17],[24,5]];lootDefs.forEach((d,i)=>{const g=new THREE.Group();const cube=new THREE.Mesh(new THREE.BoxGeometry(.65,.5,.65),new THREE.MeshStandardMaterial({color:d.color,metalness:.25,roughness:.45,emissive:d.color,emissiveIntensity:.12}));cube.position.y=.35;cube.castShadow=true;g.add(cube);const ring=new THREE.Mesh(new THREE.TorusGeometry(.48,.035,6,20),mat(d.color));ring.rotation.x=Math.PI/2;ring.position.y=.04;g.add(ring);g.position.set(lootSpots[i][0],0,lootSpots[i][1]);g.userData={type:d.type,active:true};scene.add(g);loot.push(g)});
 const zone=new THREE.Mesh(new THREE.RingGeometry(0,1,96),new THREE.MeshBasicMaterial({color:0x55d9ff,side:THREE.DoubleSide,transparent:true,opacity:.18,depthWrite:false}));zone.rotation.x=-Math.PI/2;zone.position.y=.09;scene.add(zone);const edge=new THREE.Mesh(new THREE.TorusGeometry(1,.075,8,128),new THREE.MeshBasicMaterial({color:0x69ddff,transparent:true,opacity:.85}));edge.rotation.x=Math.PI/2;edge.position.y=.12;scene.add(edge);

 // ---- IA de enemigos ----
 const playerPos=new THREE.Vector3(0,0,15),losRay=new THREE.Raycaster(),_o=new THREE.Vector3(),_t=new THREE.Vector3();
 function hasLOS(e){_o.set(e.position.x,1.4,e.position.z);_t.set(playerPos.x,1.2,playerPos.z).sub(_o);const dist=_t.length();if(dist<.01)return true;_t.divideScalar(dist);losRay.set(_o,_t);losRay.far=dist;return losRay.intersectObjects(blockers,false).length===0}
 function pushOut(p){for(const c of covers){const dx=p.x-c.x,dz=p.z-c.z,px=c.hw+.45-Math.abs(dx);if(px<=0)continue;const pz=c.hd+.45-Math.abs(dz);if(pz<=0)continue;if(px<pz)p.x+=(dx<0?-1:1)*px;else p.z+=(dz<0?-1:1)*pz}}
 function findCover(e){let best=null,bd=1e9;for(const c of covers){const ex=c.x-e.position.x,ez=c.z-e.position.z;if(ex*ex+ez*ez>400)continue;let ax=c.x-playerPos.x,az=c.z-playerPos.z;const al=Math.hypot(ax,az)||1;ax/=al;az/=al;const off=Math.max(c.hw,c.hd)+1.1;const px=c.x+ax*off,pz=c.z+az*off;if(Math.abs(px)>40||Math.abs(pz)>40)continue;if(Math.hypot(px-playerPos.x,pz-playerPos.z)<5)continue;const d=Math.hypot(px-e.position.x,pz-e.position.z);if(d<bd){bd=d;best={x:px,z:pz}}}return best}
 function moveTo(e,tx,tz,speed,dt){const dx=tx-e.position.x,dz=tz-e.position.z,l=Math.hypot(dx,dz);if(l<.05)return l;const s=Math.min(l,speed*dt);e.position.x+=dx/l*s;e.position.z+=dz/l*s;pushOut(e.position);return l-s}
 function face(e,x,z){e.lookAt(x,e.position.y,z)}

 return{enemies,loot,zone,edge,solids,blockers,ground,zoneRadius:43,zoneCenter:new THREE.Vector2(0,0),phase:0,
  reset(){enemies.forEach(e=>{const u=e.userData;e.visible=true;e.rotation.set(0,0,0);e.position.set(spots[u.index][0],0,spots[u.index][1]);u.alive=true;u.hp=100;u.state='chase';u.stun=0;u.flash=0;u.alert=0;u.losT=0;u.sees=false;u.dying=0;u.coverPt=null;u.coverT=0;u.coverCd=0;u.attack=0;u.cooldown=1+Math.random()*2;u.mats.forEach(m=>m.emissive.setHex(0));u.flashOn=false});loot.forEach(l=>{l.visible=true;l.userData.active=true});this.zoneRadius=43;this.phase=0;this.zone.scale.setScalar(43);this.edge.scale.setScalar(43)},
  // Aplica daño a un enemigo. Devuelve true si muere.
  damageEnemy(e,amount){const u=e.userData;if(!u.alive)return false;u.hp-=amount;if(u.hp<=0){u.hp=0;u.alive=false;u.state='dead';u.dying=.9;u.sees=false;u.flash=0;u.mats.forEach(m=>m.emissive.setHex(0));return true}
   u.flash=.09;u.stun=.14;u.alert=8;u.last.set(playerPos.x,0,playerPos.z);
   if(u.state!=='cover'&&u.hp<55&&u.coverCd<=0&&Math.random()<.5){const c=findCover(e);if(c){u.coverPt=c;u.coverT=3+Math.random()*2;u.state='cover'}}
   return false},
  update(dt,player,elapsed){this.phase=Math.min(1,elapsed/100);this.zoneRadius=43-25*this.phase;this.zone.scale.setScalar(this.zoneRadius);this.edge.scale.setScalar(this.zoneRadius);this.loot.forEach(l=>{if(l.userData.active)l.rotation.y+=dt*.8});
   playerPos.copy(player.position);
   enemies.forEach(e=>{const u=e.userData;
    if(!u.alive){if(u.dying>0){u.dying=Math.max(0,u.dying-dt);const k=1-u.dying/.9;e.rotation.x=-k*Math.PI/2;e.position.y=-k*.3;if(u.dying<=0)e.visible=false}return}
    u.flash=Math.max(0,u.flash-dt);u.stun=Math.max(0,u.stun-dt);u.alert=Math.max(0,u.alert-dt);u.coverCd=Math.max(0,u.coverCd-dt);
    const on=u.flash>0;if(on!==u.flashOn){u.flashOn=on;u.mats.forEach(m=>m.emissive.setHex(on?0xff2a00:0))}
    const dx=player.position.x-e.position.x,dz=player.position.z-e.position.z,dist=Math.hypot(dx,dz);
    u.losT-=dt;if(u.losT<=0){u.losT=.2+Math.random()*.1;u.sees=dist<30&&hasLOS(e)}
    if(u.sees&&dist<27){u.alert=5;u.last.set(player.position.x,0,player.position.z)}
    if(u.stun>0)return;
    if(u.state==='cover'){u.coverT-=dt;const left=u.coverPt?moveTo(e,u.coverPt.x,u.coverPt.z,3,dt):0;face(e,player.position.x,player.position.z);if(left<.6||u.coverT<=0){u.state='chase';u.coverPt=null;u.coverCd=7}return}
    if(dist<27){if(dist>1.8){moveTo(e,player.position.x,player.position.z,dist>8?1.8:1.1,dt)}face(e,player.position.x,player.position.z)}
    else if(u.alert>0){const left=moveTo(e,u.last.x,u.last.z,2,dt);face(e,u.last.x,u.last.z);if(left<1)u.alert=0}
   })}}
}
