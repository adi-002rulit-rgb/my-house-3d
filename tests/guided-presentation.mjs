import assert from 'node:assert/strict';
import fs from 'node:fs';
import {APPROVED_HOUSE_V1} from '../shared/approved-house-v1.mjs';
import {architectureGeometry} from '../shared/architecture-geometry.mjs';
const showroom=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const editor=fs.readFileSync(new URL('../editor.html',import.meta.url),'utf8');
const original=new Function(
 'const mkWall=(id,name,x1,z1,x2,z2,t=.25)=>({id,type:"wall",name,x1,z1,x2,z2,t});'+
 'const mkOpen=(id,type,name,wall,offset,width,sill=0,head=2.25,leaves=1)=>({id,type,name,wall,offset,width,sill,head,leaves});'+
 editor.slice(editor.indexOf('function defaultStair(){'),editor.indexOf('let state=original()'))+
 'return original()')();
assert.deepEqual(APPROVED_HOUSE_V1.model,original,'3C must not change approved dimensions');
const before=JSON.stringify(APPROVED_HOUSE_V1),g=architectureGeometry(APPROVED_HOUSE_V1);
assert.equal(JSON.stringify(APPROVED_HOUSE_V1),before);
assert.equal(g.counts.walls,13);assert.equal(g.counts.openings,12);
assert.equal(g.counts.stairs,1);assert.equal(g.treads.length,20);
for(const id of ['guidedBar','guidedLaunch','guidedViews','guidedPrev','guidedNext',
 'guidedPlay','guidedStop','guidedReset','guidedDay','guidedFull','guidedExit','guidedBarTitle']){
 assert.match(showroom,new RegExp('id="'+id+'"'),'missing guided UI '+id);
}
const routeBody=showroom.slice(showroom.indexOf('const guidedRoutes=['),showroom.indexOf('let guidedMode=',showroom.indexOf('const guidedRoutes=[')));
for(const id of ['facade','overview','hallway','living','kitchen','stair','stairUpper',
 'leftPassage','bedroom','secondFloor'])assert.ok(routeBody.includes("id:'"+id+"'"),id);
for(const functionName of ['guidedGo','guidedFrame','guidedStop','setGuidedMode','guidedSync'])
 assert.ok(showroom.includes('function '+functionName+'('),functionName);
assert.match(showroom,/if\(guidedMode\)guidedStop\(\);[\s\S]*?if\(startFurnitureDrag\(e\)\)/,'manual input must stop tour before furniture dragging');
assert.match(showroom,/if\(!guidedTransition\)camera.rotation.set/,'smooth transition must not be overwritten');
assert.match(showroom,/document\.addEventListener\('fullscreenchange'/);
assert.match(showroom,/document\.body\.dataset\.guidedView=/);
console.log('PASS: guided presentation UI/routes/camera interrupts; editor geometry identical');
