import assert from 'node:assert/strict';
import fs from 'node:fs';
import {FURNITURE_DESIGNS,furnitureDesignIds,isFurnitureDesign,furnitureFinish,DEFAULT_FURNITURE_DESIGN} from '../shared/furniture-designs.mjs';
import {DEFAULT_PRESENTATION_FURNITURE,kitchenLayoutAudit} from '../shared/presentation-furniture.mjs';
import {APPROVED_HOUSE_V1} from '../shared/approved-house-v1.mjs';
assert.equal(furnitureDesignIds.length,4);
assert.equal(DEFAULT_FURNITURE_DESIGN,'minimal');
assert.equal(new Set(furnitureDesignIds).size,4);
assert.equal(isFurnitureDesign('__proto__'),false);
assert.equal(isFurnitureDesign('graphite'),true);
assert.ok(kitchenLayoutAudit().ok);
const keys=['main','accent','wood','woodDark','counter','metal','screen','rug','roughness','leg','handle','style'];
for(const id of furnitureDesignIds){
 assert.ok(FURNITURE_DESIGNS[id].name&&FURNITURE_DESIGNS[id].description);
 for(const item of DEFAULT_PRESENTATION_FURNITURE){
  const finish=furnitureFinish(item,id);
  for(const k of keys)assert.ok(finish[k]!==undefined,id+' '+item.id+' missing '+k);
  for(const k of ['main','accent','wood','woodDark','counter','metal','screen','rug'])
   assert.match(finish[k],/^#[0-9a-fA-F]{6}$/);
 }
}
assert.equal(new Set(furnitureDesignIds.map(id=>furnitureFinish(DEFAULT_PRESENTATION_FURNITURE.find(x=>x.id==='livingSofa'),id).main)).size,4);
assert.equal(new Set(furnitureDesignIds.map(id=>furnitureFinish(DEFAULT_PRESENTATION_FURNITURE.find(x=>x.id==='kitchenRear'),id).main)).size,4);
assert.equal(new Set(furnitureDesignIds.map(id=>furnitureFinish(DEFAULT_PRESENTATION_FURNITURE.find(x=>x.id==='bedroomBed'),id).main)).size,4);
assert.throws(()=>furnitureFinish(DEFAULT_PRESENTATION_FURNITURE[0],'invalid'));
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
assert.match(html,/id="furnitureDesign"/);
assert.match(html,/function applyFurnitureDesign\(id,save=true\)/);
assert.match(html,/for\(const piece of presentationFurniture\)drawPresentationFurniture\(piece\)/);
assert.match(html,/document\.body\.dataset\.furnitureDesign=id/);
assert.match(html,/localStorage\.setItem\(furnitureDesignStorageKey,id\)/);
assert.match(html,/furnitureThemeSelect\.onchange=/);
assert.match(html,/const selected=selectedFurnitureId/);
assert.match(html,/furnitureRoots\.clear\(\);furnitureRayTargets\.length=0/);
assert.ok(!html.includes('wall.position.set(activeFurnitureDesign)'), 'styles cannot move architecture');
const editor=fs.readFileSync(new URL('../editor.html',import.meta.url),'utf8');
const original=new Function('const mkWall=(id,name,x1,z1,x2,z2,t=.25)=>({id,type:"wall",name,x1,z1,x2,z2,t});'+
 'const mkOpen=(id,type,name,wall,offset,width,sill=0,head=2.25,leaves=1)=>({id,type,name,wall,offset,width,sill,head,leaves});'+
 editor.slice(editor.indexOf('function defaultStair(){'),editor.indexOf('let state=original()'))+'return original()')();
assert.deepEqual(original,APPROVED_HOUSE_V1.model);
console.log('PASS: four distinct global furniture styles, kitchen/living/bedroom finishes, preserved approved geometry');
