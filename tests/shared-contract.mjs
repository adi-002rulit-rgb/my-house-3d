import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createSharedProject,parseSharedProject,getSharedSummary,SHARED_FORMAT_VERSION,SHARED_STORAGE_KEY} from '../shared/project-contract.mjs';

const model={
 version:1,title:'Мой дом',height:3.74,elevation:.6,
 walls:[{id:'w1',type:'wall',name:'Стена',x1:0,z1:0,x2:5,z2:0,t:.25}],
 openings:[{id:'op1',type:'passage',name:'Проход',wall:'w1',offset:2,width:.95,sill:0,head:2.99,leaves:1}],
 rooms:[{id:'r1',name:'Комната',x:0,z:0,w:4,h:4,wall:'#aabbcc',floor:'#ddeeff'}],
 stairs:[{id:'s1',name:'Лестница',type:'stair',x:1,z:1,back:-2,width:1.05,lower:1.23,upper:1.65,returnRun:2.635,rot:0}],
 furniture:[{id:'f1',name:'Диван',type:'sofa',x:1,z:2,w:2,d:1,h:.8,rot:0}]
};
const raw=JSON.stringify(model);
const envelope=createSharedProject(model);
assert.equal(envelope.formatVersion,SHARED_FORMAT_VERSION);
assert.deepEqual(envelope.model,model);
assert.equal(JSON.stringify(model),raw,'export must not mutate source geometry');
model.rooms[0].w=9;
assert.equal(envelope.model.rooms[0].w,4,'export must detach model data');
assert.deepEqual(parseSharedProject(JSON.parse(JSON.stringify(envelope))),envelope);
assert.equal(getSharedSummary(envelope).walls,1);
assert.equal(getSharedSummary(envelope).rooms,1);
assert.match(SHARED_STORAGE_KEY,/shared/);
function fails(update){
 const bad=structuredClone(envelope);update(bad);
 assert.throws(()=>parseSharedProject(bad));
}
fails(x=>x.formatVersion=999);
fails(x=>x.model.version=999);
fails(x=>x.model.walls[0].id=123);
fails(x=>x.model.openings[0].wall='missing');
fails(x=>x.model.rooms[0].wall='invalid');
fails(x=>x.model.rooms[0].w=-1);
fails(x=>x.model.stairs[0].lower=-2);
fails(x=>x.model.furniture[0].h=Infinity);
fails(x=>x.model.walls.push({...x.model.walls[0],name:'duplicate'}));
const editor=fs.readFileSync(new URL('../editor.html',import.meta.url),'utf8');
const showroom=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
assert.match(editor,/import \{createSharedProject,SHARED_STORAGE_KEY\} from '\.\/shared\/project-contract\.mjs'/);
assert.match(showroom,/import \{parseSharedProject,getSharedSummary,SHARED_STORAGE_KEY,MAX_SHARED_BYTES\} from '\.\/shared\/project-contract\.mjs'/);
assert.match(showroom,/По умолчанию презентация сохраняет прежнюю геометрию/);
console.log('PASS: shared versioned format, unmodified source geometry, strict validation, both applications import contract');
