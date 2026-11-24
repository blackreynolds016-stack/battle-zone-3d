// Botones en pantalla: efecto y vibración al pulsar, y tamaño/posición configurables (se guardan en el teléfono).
// Cada botón se mueve con las variables CSS --dx/--dy (desplazamiento respecto a su sitio de siempre) y se agranda con --bs.
const IDS=['fire','jump','reload','medkit','switch','aim','interact','sprint','crouch','prone','joy'];
const KEY='egozne-layout',SKEY='egozne-bsize';
const rd=(k,d)=>{try{const v=localStorage.getItem(k);return v===null?d:v}catch(e){return d}};
const wr=(k,v)=>{try{localStorage.setItem(k,String(v))}catch(e){}};
export function createLayout(hud){
 const items=IDS.map(id=>({id,el:document.querySelector('#'+id)})).filter(o=>o.el);
 let pos={},size=100,vib=true,editing=false,drag=null,onExit=null;
 try{pos=JSON.parse(rd(KEY,'{}'))||{}}catch(e){pos={}}
 if(typeof pos!=='object'||Array.isArray(pos))pos={};
 size=Math.min(140,Math.max(70,parseInt(rd(SKEY,'100'),10)||100));
 const bar=document.querySelector('#layout-bar'),slider=document.querySelector('#layout-size');
 const slot=o=>{const p=pos[o.id];if(!Array.isArray(p)||!isFinite(p[0])||!isFinite(p[1]))pos[o.id]=[0,0];return pos[o.id]};
 const put=o=>{const p=slot(o);o.el.style.setProperty('--dx',p[0]+'px');o.el.style.setProperty('--dy',p[1]+'px')};
 const apply=()=>{hud.style.setProperty('--bs',String(size/100));items.forEach(put)};
 // mantiene el botón dentro de la pantalla (también al girar el teléfono)
 const clamp=o=>{if(!o.el.getBoundingClientRect)return;const r=o.el.getBoundingClientRect();if(!r||!r.width)return;const p=slot(o),m=4;
  if(r.left<m)p[0]+=m-r.left;if(r.right>innerWidth-m)p[0]-=r.right-(innerWidth-m);if(r.top<m)p[1]+=m-r.top;if(r.bottom>innerHeight-m)p[1]-=r.bottom-(innerHeight-m);put(o)};
 const fit=()=>items.forEach(clamp);
 const hit=e=>items.find(o=>o.el===e.target||(o.el.contains&&o.el.contains(e.target)));
 // --- efecto al pulsar (el botón se hunde, brilla y sale una onda) ---
 const held=new Map();
 hud.addEventListener('pointerdown',e=>{if(editing)return;const o=hit(e);if(!o||o.id==='joy')return;o.el.classList.add('pressed');held.set(e.pointerId,o);
  if(vib&&o.id!=='fire'&&typeof navigator!=='undefined'&&navigator.vibrate){try{navigator.vibrate(8)}catch(_){}}});
 const rel=e=>{const o=held.get(e.pointerId);if(o){o.el.classList.remove('pressed');held.delete(e.pointerId)}};
 // --- modo "colocar botones": arrastrar para moverlos; no se dispara nada mientras tanto ---
 document.addEventListener('pointerdown',e=>{if(!editing)return;const o=hit(e);if(!o)return;e.preventDefault();e.stopPropagation();const p=slot(o);drag={o,id:e.pointerId,sx:e.clientX,sy:e.clientY,px:p[0],py:p[1]};o.el.classList.add('dragging')},true);
 document.addEventListener('pointermove',e=>{if(!drag||e.pointerId!==drag.id)return;e.preventDefault();const p=slot(drag.o);p[0]=drag.px+e.clientX-drag.sx;p[1]=drag.py+e.clientY-drag.sy;put(drag.o);clamp(drag.o)},true);
 const end=e=>{rel(e);if(!drag||e.pointerId!==drag.id)return;drag.o.el.classList.remove('dragging');drag=null;wr(KEY,JSON.stringify(pos))};
 document.addEventListener('pointerup',end,true);document.addEventListener('pointercancel',end,true);
 document.addEventListener('click',e=>{if(!editing)return;const t=e.target;if(hit(e)||(t&&t.closest&&t.closest('.pause,#minimap'))){e.stopPropagation();e.preventDefault()}},true);
 function edit(done){editing=true;onExit=done||null;hud.classList.add('editing');if(bar)bar.classList.remove('hidden');if(slider)slider.value=String(size);fit()}
 function finish(){editing=false;drag=null;hud.classList.remove('editing');if(bar)bar.classList.add('hidden');wr(KEY,JSON.stringify(pos));wr(SKEY,size);const f=onExit;onExit=null;if(f)f()}
 function reset(){pos={};size=100;if(slider)slider.value='100';apply();wr(KEY,'{}');wr(SKEY,100)}
 const doneBtn=document.querySelector('#layout-done'),resetBtn=document.querySelector('#layout-reset');
 if(doneBtn)doneBtn.addEventListener('click',finish);if(resetBtn)resetBtn.addEventListener('click',reset);
 if(slider)slider.addEventListener('input',()=>{size=Math.min(140,Math.max(70,parseInt(slider.value,10)||100));apply();fit()});
 addEventListener('resize',()=>{if(!hud.classList.contains('hidden'))fit()});
 apply();
 return{edit,finish,reset,fit,apply,setVibration(v){vib=!!v},get editing(){return editing},get size(){return size},get positions(){return pos}}
}
