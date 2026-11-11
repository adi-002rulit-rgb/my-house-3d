import assert from 'node:assert/strict';
import fs from 'node:fs';
import {APPROVED_HOUSE_V1} from '../shared/approved-house-v1.mjs';
import {DEFAULT_PRESENTATION_FURNITURE,freshFurnitureLayout,validateFurnitureLayout,
 normalizedFurnitureLayout,furnitureFitsRoom,FURNITURE_ROOM_BOUNDS} from '../shared/presentation-furniture.mjs';
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
assert.equal(DEFAULT_PRESENTATION_FURNITURE.length,11);
assert.equal(new Set(DEFAULT_PRESENTATION_FURNITURE.map(x=>x.id)).size,11);
assert.ok(validateFurnitureLayout(freshFurnitureLayout()));
for(const item of DEFAULT_PRESENTATION_FURNITURE){
 assert.ok(furnitureFitsRoom(item),item.id+' must fit its presentation room');
 assert.ok(FURNITURE_ROOM_BOUNDS[item.room],item.room);
}
const saved=DEFAULT_PRESENTATION_FURNITURE.map(({id,type,room,x,z,rot})=>({id,type,room,x,z,rot}));
assert.deepEqual(normalizedFurnitureLayout(saved),freshFurnitureLayout());
const moved=structuredClone(saved);moved[0].x+=.1;
assert.ok(validateFurnitureLayout(moved));
const outside=structuredClone(saved);outside[0].x=17;
assert.equal(validateFurnitureLayout(outside),false);
const corrupted=structuredClone(saved);corrupted[0].x=Infinity;
assert.equal(validateFurnitureLayout(corrupted),false);
assert.equal(validateFurnitureLayout(saved.slice(1)),false);
const duplicates=structuredClone(saved);duplicates[0].id=duplicates[1].id;
assert.equal(validateFurnitureLayout(duplicates),false);
const beyond=structuredClone(saved);beyond[0].rot=360;
assert.ok(validateFurnitureLayout(beyond));
const wrongRoom=structuredClone(saved);wrongRoom[0].room='kitchen';
assert.equal(validateFurnitureLayout(wrongRoom),false);
for(const id of ['furnitureLaunch','furniturePanel','furnitureChoice','furnitureX','furnitureZ',
 'furnitureRotation','furnitureReset','furnitureExport','furnitureImport','furnitureImportFile']){
 assert.ok(html.includes('id="'+id+'"'),'furniture panel missing '+id);
}
for(const fn of ['startFurnitureDrag','updateFurnitureDrag','endFurnitureDrag',
 'savePresentationFurniture','changePresentationFurniture']){
 assert.ok(html.includes('function '+fn+'('),fn);
}
assert.match(html,/if\(startFurnitureDrag\(e\)\)/);
assert.match(html,/if\(updateFurnitureDrag\(e\)\)return/);
assert.match(html,/if\(endFurnitureDrag\(\)\)return/);
assert.match(html,/localStorage\.setItem\(furnitureStorageKey/);
const editor=fs.readFileSync(new URL('../editor.html',import.meta.url),'utf8');
const original=new Function('const mkWall=(id,name,x1,z1,x2,z2,t=.25)=>({id,type:"wall",name,x1,z1,x2,z2,t});'+
 'const mkOpen=(id,type,name,wall,offset,width,sill=0,head=2.25,leaves=1)=>({id,type,name,wall,offset,width,sill,head,leaves});'+
 editor.slice(editor.indexOf('function defaultStair(){'),editor.indexOf('let state=original()'))+
 'return original()')();
assert.deepEqual(original,APPROVED_HOUSE_V1.model,'approved architecture frozen');
console.log('PASS: 11 movable room-fitted items, validated transfer JSON and protected architecture');
