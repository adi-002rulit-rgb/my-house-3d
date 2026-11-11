import assert from 'node:assert/strict';
import fs from 'node:fs';
import {APPROVED_HOUSE_V1} from '../shared/approved-house-v1.mjs';
import {architectureGeometry,staircaseLayout} from '../shared/architecture-geometry.mjs';
import {parseSharedProject} from '../shared/project-contract.mjs';
const editor=fs.readFileSync(new URL('../editor.html',import.meta.url),'utf8');
const showroom=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const start=editor.indexOf('function defaultStair(){'),end=editor.indexOf('let state=original()',start);
assert.ok(start>=0&&end>start);
const original=new Function(
 'const mkWall=(id,name,x1,z1,x2,z2,t=.25)=>({id,type:"wall",name,x1,z1,x2,z2,t});'+
 'const mkOpen=(id,type,name,wall,offset,width,sill=0,head=2.25,leaves=1)=>({id,type,name,wall,offset,width,sill,head,leaves});'+
 editor.slice(start,end)+'return original()')();
assert.deepEqual(parseSharedProject(APPROVED_HOUSE_V1).model,original,
 'public showroom snapshot must exactly match approved editor default, not an earlier stair');
assert.equal(original.stairs[0].id,'stair1');
assert.equal(original.stairs[0].width,1.05);
assert.equal(original.stairs[0].lower,1.23);
assert.equal(original.stairs[0].upper,1.65);
assert.equal(original.stairs[0].returnRun,2.635);
assert.equal(original.stairs[0].back,-4.755);
const before=JSON.stringify(APPROVED_HOUSE_V1);
const g=architectureGeometry(APPROVED_HOUSE_V1);
assert.equal(JSON.stringify(APPROVED_HOUSE_V1),before);
assert.equal(g.treads.length,20);
assert.equal(g.treads.filter(t=>t.kind==='winder').length,6);
assert.equal(g.treads.filter(t=>t.flight===3).length,6);
assert.equal(g.slabs.filter(t=>t.kind==='stair-slab').length,1);
assert.match(showroom,/stairsGroup\.visible=false/);
assert.match(showroom,/document\.body\.dataset\.presentationStair='editor-approved'/);
assert.match(showroom,/import \{APPROVED_HOUSE_V1\} from '\.\/shared\/approved-house-v1\.mjs'/);
console.log('PASS: cold-start presentation uses exact editor staircase snapshot, no geometry drift');
