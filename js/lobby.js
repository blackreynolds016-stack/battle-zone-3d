import * as THREE from 'three';
import {texMat,mat} from './world.js';
// Escenario del lobby: un campamento militar construido lejos del mapa de juego (el personaje elegido se muestra aquí).
export const STAGE={x:600,z:600};
export function makeLobbyStage(scene){
 const g=new THREE.Group();g.position.set(STAGE.x,0,STAGE.z);
 const add=(o,x,y,z,ry=0)=>{o.position.set(x,y,z);o.rotation.y=ry;o.castShadow=true;o.receiveShadow=true;g.add(o);return o};
 const ground=new THREE.Mesh(new THREE.CircleGeometry(70,48),texMat(0x8c7350,'rock',18,18));ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;g.add(ground);
 const grass=new THREE.Mesh(new THREE.RingGeometry(26,70,48),texMat(0x4f7a3c,'grass',14,14));grass.rotation.x=-Math.PI/2;grass.position.y=.01;grass.receiveShadow=true;g.add(grass);
 // piedras del camino
 const stone=texMat(0x7d7a70,'rock',1,1);for(let i=0;i<46;i++){const r=.12+Math.random()*.22,s=new THREE.Mesh(new THREE.DodecahedronGeometry(r,0),stone);s.scale.y=.5;add(s,(Math.random()-.5)*22,r*.3,(Math.random()-.4)*14)}
 // tiendas de campaña
 const cloth=texMat(0x5c6844,'rock',2,2),dark=mat(0x1b1f1a);
 const tent=(x,z,s,ry)=>{const t=new THREE.Group();const body=new THREE.Mesh(new THREE.ConeGeometry(2.7*s,2.3*s,4),cloth);body.rotation.y=Math.PI/4;body.position.y=1.15*s;body.castShadow=true;body.receiveShadow=true;t.add(body);const door=new THREE.Mesh(new THREE.PlaneGeometry(1.1*s,1.5*s),dark);door.position.set(0,.75*s,1.34*s);t.add(door);t.position.set(x,0,z);t.rotation.y=ry;g.add(t);return t};
 tent(-11,-11,1.5,.4);tent(-4.5,-17,1.4,.1);tent(12,-14,1.6,-.5);tent(1,-26,1.8,0);
 // jeep
 const olive=mat(0x4a5638,.7),jg=new THREE.Group();
 const body=new THREE.Mesh(new THREE.BoxGeometry(3.4,.8,1.7),olive);body.position.y=.85;jg.add(body);
 const cab=new THREE.Mesh(new THREE.BoxGeometry(1.7,.75,1.55),olive);cab.position.set(-.3,1.55,0);jg.add(cab);
 const glass=new THREE.Mesh(new THREE.BoxGeometry(.06,.55,1.35),mat(0x2a3d45,.2,.4));glass.position.set(.56,1.58,0);glass.rotation.z=-.3;jg.add(glass);
 const hood=new THREE.Mesh(new THREE.BoxGeometry(1.1,.12,1.6),mat(0x414c32));hood.position.set(1.1,1.28,0);jg.add(hood);
 for(const sx of [-1.1,1.15])for(const sz of [-.85,.85]){const wh=new THREE.Mesh(new THREE.CylinderGeometry(.42,.42,.3,14),mat(0x15181a,.95));wh.rotation.x=Math.PI/2;wh.position.set(sx,.42,sz);jg.add(wh)}
 jg.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true}});jg.position.set(9.5,0,-7);jg.rotation.y=-.55;g.add(jg);
 // cajas, barriles y sacos
 const wood=texMat(0x8a6a3c,'rock',1,1);
 [[5.5,.4,-5.5,.8,.2],[6.5,.4,-6.6,.8,-.3],[6,1.2,-6,.8,.5],[-7,.4,-6,.9,.1],[-5.8,.4,-7.2,.8,.6]].forEach(c=>add(new THREE.Mesh(new THREE.BoxGeometry(c[3],c[3],c[3]),wood),c[0],c[1]-(.8-c[3])/2,c[2],c[4]));
 const army=mat(0x445036,.6,.2);[[-8.5,-4.5],[-8.9,-3.5],[-7.9,-3.8]].forEach(b=>add(new THREE.Mesh(new THREE.CylinderGeometry(.34,.34,.9,12),army),b[0],.45,b[1]));
 const crate=mat(0x3d4a35,.6,.1);add(new THREE.Mesh(new THREE.BoxGeometry(1.5,.6,.7),crate),-6,.3,-3,.3);add(new THREE.Mesh(new THREE.BoxGeometry(1.3,.55,.7),crate),-5.2,.88,-3.2,.5);
 // arbustos y palmeras
 const leaf=mat(0x3f7a35,.9),leaf2=mat(0x2f6a2c,.9);
 const bush=(x,z,s)=>{for(let i=0;i<5;i++){const a=new THREE.Mesh(new THREE.ConeGeometry(.12*s,1*s,5),i%2?leaf:leaf2);a.position.set(x+(Math.random()-.5)*.6*s,.45*s,z+(Math.random()-.5)*.6*s);a.rotation.set((Math.random()-.5)*.9,0,(Math.random()-.5)*.9);a.castShadow=true;g.add(a)}};
 [[-4.8,.8,1.6],[-6.5,1.4,1.3],[4.6,.2,1.4],[6.2,1.2,1.7],[-13,-3,1.6],[14,-4,1.5],[-2,-5,1],[3,-8,1.1]].forEach(b=>bush(b[0],b[1],b[2]));
 const palm=(x,z,h,lean)=>{const t=new THREE.Group();const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.16,.24,h,8),mat(0x6b5236));trunk.position.y=h/2;trunk.castShadow=true;t.add(trunk);for(let i=0;i<7;i++){const f=new THREE.Mesh(new THREE.ConeGeometry(.35,2.4,4),leaf);f.scale.set(1,1,.22);f.position.y=h;f.rotation.set(0,0,0);const a=i/7*Math.PI*2;f.position.x=Math.cos(a)*.8;f.position.z=Math.sin(a)*.8;f.rotation.z=-Math.cos(a)*1.25;f.rotation.x=Math.sin(a)*1.25;f.castShadow=true;t.add(f)}t.position.set(x,0,z);t.rotation.z=lean;g.add(t)};
 palm(-15,-14,6.5,.12);palm(16,-9,7,-.1);palm(-2,-12,5.5,.05);palm(21,-20,8,.1);
 // árboles lejanos
 for(let i=0;i<22;i++){const a=Math.PI+(Math.random()-.5)*2.6,r=26+Math.random()*16,x=Math.cos(a)*r*1.1,z=Math.sin(a)*r-6;const s=1.4+Math.random()*1.2;const tr=new THREE.Group();const k=new THREE.Mesh(new THREE.CylinderGeometry(.25*s,.35*s,2.6*s,7),mat(0x5a4530));k.position.y=1.3*s;tr.add(k);for(let j=0;j<3;j++){const c=new THREE.Mesh(new THREE.SphereGeometry((1.7-j*.3)*s,8,6),j%2?leaf2:leaf);c.position.y=(3+j*.9)*s;c.scale.y=.8;c.castShadow=true;tr.add(c)}tr.position.set(x,0,z);g.add(tr)}
 scene.add(g);return {group:g,x:STAGE.x,z:STAGE.z};
}
