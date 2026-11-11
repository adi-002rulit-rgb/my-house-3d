import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createSharedProject} from '../shared/project-contract.mjs';
import {architectureGeometry,staircaseLayout} from '../shared/architecture-geometry.mjs';
const editor=fs.readFileSync(new URL('../editor.html',import.meta.url),'utf8');
const start=editor.indexOf('function defaultStair(){');
const end=editor.indexOf('let state=original()',start);
assert.ok(start>0&&end>start,'source fixture must exist');
const original=new Function(
 'const mkWall=(id,name,x1,z1,x2,z2,t=.25)=>({id,type:"wall",name,x1,z1,x2,z2,t});'+
 'const mkOpen=(id,type,name,wall,offset,width,sill=0,head=2.25,leaves=1)=>({id,type,name,wall,offset,width,sill,head,leaves});'+
 editor.slice(start,end)+'return original()')();
const before=JSON.stringify(original);
const geometry=architectureGeometry(createSharedProject(original));
assert.equal(JSON.stringify(original),before,'never mutate approved architecture');
assert.deepEqual(geometry.counts,{walls:13,openings:12,rooms:7,stairs:1,furniture:5});
assert.equal(geometry.floors.length,7);
assert.equal(geometry.furniture.length,original.furniture.length);
assert.deepEqual(geometry.furniture.map(x=>x.id),original.furniture.map(x=>x.id));
for(const item of original.furniture){
 const projected=geometry.furniture.find(x=>x.id===item.id);
 assert.ok(projected, 'missing furniture '+item.id);
 for(const key of ['x','z','w','d','h','rot'])assert.equal(projected[key],item[key],item.id+' '+key);
 assert.equal(projected.y,original.elevation);
 assert.equal(projected.color,item.color);
}
for(const room of original.rooms){
 const floor=geometry.floors.find(x=>x.id===room.id);
 assert.equal(floor.color,room.floor);
 assert.equal(floor.w,room.w);assert.equal(floor.d,room.h);
}
assert.ok(geometry.segments.every(w=>w.sideColors&&w.sideColors.positive.startsWith('#')
 &&w.sideColors.negative.startsWith('#')), 'all wall faces carry editor paint colors');
const newFurniture=structuredClone(original);newFurniture.furniture[0].x+=.35;
const moved=architectureGeometry(createSharedProject(newFurniture));
assert.equal(moved.furniture[0].x,original.furniture[0].x+.35);
assert.equal(geometry.furniture[0].x,original.furniture[0].x,
 'moving an item must not mutate previous snapshots');

assert.ok(geometry.segments.length>13);
assert.equal(geometry.openings.length,12);
assert.equal(geometry.openings.find(x=>x.id==='stairArch').type,'passage');
assert.equal(geometry.openings.find(x=>x.id==='stairArch').head,2.99);
assert.equal(geometry.openings.find(x=>x.id==='stairWindow').sill,1.82);
assert.equal(geometry.openings.find(x=>x.id==='stairWindow').head,3.52);
const front=original.walls.find(x=>x.id==='front');
const window=original.openings.find(x=>x.id==='livingW1');
const actual=geometry.openings.find(x=>x.id===window.id);
const len=Math.hypot(front.x2-front.x1,front.z2-front.z1);
assert.ok(Math.abs(actual.x-(front.x1+(front.x2-front.x1)*window.offset/len))<1e-10);
assert.ok(Math.abs(actual.z-front.z1)<1e-10);
const g=staircaseLayout(original.stairs[0],original.height);
const editorGeometryBody=editor.slice(editor.indexOf('function stairGeometry(o){'),editor.indexOf('function stairPolygon(',editor.indexOf('function stairGeometry(o){')));
assert.match(editorGeometryBody,/const visibleLastN=Math.max\(1,lastN-4\)/);
assert.equal(g.visibleLastN,6);
assert.equal(g.lastN,10);
assert.equal(geometry.treads.filter(t=>t.flight===3).length,6);
assert.equal(geometry.treads.filter(t=>t.kind==='winder').length,6);
assert.equal(geometry.slabs.filter(t=>t.kind==='upper-slab').length,5);
assert.ok(geometry.slabs.filter(t=>t.kind==='upper-slab').every(p=>p.w>.03&&p.d>.03));
assert.ok(geometry.slabs.some(t=>t.kind==='stair-slab'));
assert.ok(Math.abs(g.upperStart+g.visibleLastN*g.upperRise-original.height)<1e-10);
// All missing and rotated staircase geometries should fail closed.
const crossed=structuredClone(original);
crossed.openings.push({...crossed.openings[0],id:'overlap',offset:crossed.openings[0].offset+.2});
assert.throws(()=>architectureGeometry(createSharedProject(crossed)),/Пересекаются проёмы/);
const rotated=structuredClone(original);rotated.stairs[0].rot=.3;
assert.throws(()=>architectureGeometry(createSharedProject(rotated)),/Поворот лестницы/);
console.log('PASS: shared geometry matches editor dimensions, opening positions and stair counts; no source mutations');
