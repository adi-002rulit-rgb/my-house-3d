import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const load = name => fs.readFileSync(new URL('../'+name, import.meta.url),'utf8');
const editor=load('editor.html'),showroom=load('index.html');
const inlineScript=(html,name)=>{
 const match=html.match(/<script type="module">([\s\S]*?)<\/script>/);
 assert.ok(match,name+' must contain a module script');
 return match[1].replace(/^\s*import .*;\s*$/gm,'');
};
for(const [name,html] of [['editor',editor],['showroom',showroom]]){
 const js=inlineScript(html,name);
 new vm.Script(js,{filename:name+'.js'});
 const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
 assert.equal(ids.length,new Set(ids).size,name+': duplicate DOM id');
 const referenced=[...js.matchAll(/\$\('([^']+)'\)/g)].map(m=>m[1]);
 for(const id of referenced)assert.ok(ids.includes(id),name+': missing DOM id '+id);
}
const part=(start,end)=>{
 const from=editor.indexOf(start);
 assert.ok(from>=0,'missing '+start);
 const to=editor.indexOf(end,from+start.length);
 assert.ok(to>from,'missing '+end);
 return editor.slice(from,to);
};
const original=new Function(
 'const mkWall=(id,name,x1,z1,x2,z2,t=.25)=>({id,type:"wall",name,x1,z1,x2,z2,t});'+
 'const mkOpen=(id,type,name,wall,offset,width,sill=0,head=2.25,leaves=1)=>({id,type,name,wall,offset,width,sill,head,leaves});'+
 part('function defaultStair(){','let state=original()')+'return original()')();
const validate=new Function('wallLength','const PROJECT_SCHEMA_VERSION=1;'+part('function validate(s){','function writeVerified(')+'return validate')(
 w=>Math.hypot(w.x2-w.x1,w.z2-w.z1)
);
assert.doesNotThrow(()=>validate(original));
assert.equal(original.openings.find(o=>o.id==='stairArch').type,'passage');
assert.equal(original.openings.find(o=>o.id==='stairArch').head,2.99);
assert.equal(original.stairs.length,1);
assert.equal(original.rooms.length,7);
const errors=[
 ['negative room width',s=>s.rooms[0].w=-2],
 ['negative return flight',s=>s.stairs[0].returnRun=-2],
 ['negative first flight',s=>s.stairs[0].lower=-1],
 ['wall too thin',s=>s.walls[0].t=-.4],
 ['opening over ceiling',s=>s.openings[0].head=100],
 ['unsupported floor pattern',s=>s.rooms[0].floorPattern='invalid'],
 ['passage incorrectly moved into furniture',s=>s.furniture[0].type='passage'],
 ['opening too wide for wall',s=>s.openings[0].width=100],
 ['invalid title',s=>s.title=42],
 ['nonstring object ID',s=>s.walls[0].id=123]
];
for(const [name,change] of errors){
 const copy=structuredClone(original);change(copy);
 assert.throws(()=>validate(copy),undefined,'must reject '+name);
}

const storageTestCode=part('function writeVerified(key,value){','function saveState(){');
function storageHarness(failKey=null){
 const items=new Map();
 const localStorage={
  getItem:key=>items.has(key)?items.get(key):null,
  setItem:(key,value)=>{if(key===failKey)throw Error('QuotaExceededError');items.set(key,value)},
  removeItem:key=>items.delete(key)
 };
 const ctor=new Function('localStorage','validate','original',`
  const STORAGE='house-test',CHECKPOINT='house-checkpoint',BEFORE_IMPORT='house-before-import';
  let state=structuredClone(original),selected='room',history=[JSON.stringify(state)],historyAt=0;
  const syncActions=()=>{},refreshAll=()=>{},fitPlan=()=>{};
  ${storageTestCode}
  return {replaceProjectSafely,getState:()=>state, getHistory:()=>history};
 `);
 return {localStorage,items,...ctor(localStorage,validate,original)};
}
{
 const h=storageHarness();
 const next=structuredClone(original());next.title='Новая версия';
 h.replaceProjectSafely(next,'house-before-import');
 assert.equal(h.getState().title,'Новая версия');
 assert.equal(JSON.parse(h.items.get('house-before-import')).title,'Мой дом');
 assert.equal(JSON.parse(h.items.get('house-test')).title,'Новая версия');
}
for(const failKey of ['house-before-import','house-test']){
 const h=storageHarness(failKey);
 const next=structuredClone(original());next.title='Не должно примениться';
 assert.throws(()=>h.replaceProjectSafely(next,'house-before-import'),/QuotaExceededError/);
 assert.equal(h.getState().title,'Мой дом','failed storage must not change live state');
 assert.equal(h.getHistory().length,1,'failed storage must not reset undo history');
 assert.equal(h.items.has('house-test'),false,'failed write must not leave new project in storage');
}

const stairGeometry=new Function('state',
 part('function stairGeometry(o){','function stairPolygon(')+'return stairGeometry')(
 {height:original.height}
);
const g=stairGeometry(original.stairs[0]);
assert.equal(g.visibleLastN,6);
assert.equal(g.lastN,10);
const actualEnd=g.front+g.backRun*g.visibleLastN/g.lastN;
const floorOpeningEnd=g.front+Math.max(original.stairs[0].lower,g.backRun*g.visibleLastN/g.lastN);
assert.ok(floorOpeningEnd>=actualEnd);
const rise=original.height/g.total;
const upperRise=(original.height-(g.firstN+g.midN+2*g.turnN)*rise)/g.visibleLastN;
assert.ok(upperRise>.21,'as-built upper steps remain unverified');
assert.match(editor,/const thirdEnd=g\.front\+g\.backRun\*g\.visibleLastN\/g\.lastN/);
assert.match(editor,/\['door','window','passage'\]\.includes\(p\.type\)/);
assert.match(editor,/function restoreEmergency\(\)/);
assert.match(editor,/function makeCheckpoint\(\)/);
console.log('PASS: two JavaScript modules, unique HTML IDs, DOM references, model data, ten invalid JSON cases and transactional storage failure cases, stair footprint, emergency recovery');
