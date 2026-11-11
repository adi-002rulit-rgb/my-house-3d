import assert from 'node:assert/strict';
import fs from 'node:fs';
import {APPROVED_HOUSE_V1} from '../shared/approved-house-v1.mjs';
import {presentationDoorSpecs,doorLeafPose,normalizedDoorSwing,PRESENTATION_DOOR_IDS} from '../shared/presentation-doors.mjs';
import {approvedOpeningsAudit} from '../shared/presentation-openings.mjs';
const main=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const approved=approvedOpeningsAudit(),source=APPROVED_HOUSE_V1.model;
assert.equal(presentationDoorSpecs.length,5);
assert.equal(new Set(presentationDoorSpecs.map(x=>x.id)).size,5);
assert.equal(Object.keys(PRESENTATION_DOOR_IDS).length,5);
for(const spec of presentationDoorSpecs){
 const o=approved.find(x=>x.id===spec.id);
 assert.equal(spec.width,o.width);assert.equal(spec.head,o.head);
 assert.ok(Math.hypot(spec.x-o.x,spec.z-o.z)<1e-10,spec.id+' source centre');
 assert.equal(spec.leafCount,source.openings.find(x=>x.id===spec.id).leaves);
 assert.equal(spec.leafCount===2,spec.room==='living'||spec.room==='kitchen');
 const setting=normalizedDoorSwing(spec.room);
 const first=doorLeafPose(spec,setting,0);
 assert.equal(first.at,-spec.width/2,'first leaf anchored on outer left frame');
 assert.equal(first.mirror,false);
 if(spec.leafCount===2){
  const second=doorLeafPose(spec,setting,1);
  assert.equal(second.at,spec.width/2,'right hinge must be at right outer frame');
  assert.equal(second.mirror,true,'second leaf must extend toward centre');
  const side=spec.roomSide;
  assert.equal(Math.sign(-Math.sin(first.radians)),side,
   'left leaf swings toward designated room');
  assert.equal(Math.sign(Math.sin(second.radians)),side,
   'right leaf swings toward same room side');
 }else{
  const alternate=doorLeafPose(spec,{hinge:'right',swing:'hall',angle:45},0);
  assert.equal(alternate.at,spec.width/2);
  assert.equal(alternate.mirror,true);
 }
}
assert.equal(normalizedDoorSwing('living',{angle:300}).angle,105);
assert.equal(normalizedDoorSwing('living',{angle:-30}).angle,0);
assert.equal(normalizedDoorSwing('living',{angle:33}).angle,35);
for(const id of ['clientDoorHinge','clientDoorSwing','clientDoorAngle','clientDoorAngleLabel'])
 assert.ok(main.includes('id="'+id+'"'),'missing UI '+id);
assert.match(main,/const roomDoorSpecs=presentationDoorSpecs/);
assert.match(main,/const pose=doorLeafPose\(spec,cfg,i\)/);
assert.match(main,/panel\.scale\.x=pose\.mirror\?-1:1/);
assert.match(main,/const frameHeight=Math\.min\(spec\.head-\.025,2\.20\)/);
assert.match(main,/document\.body\.dataset\.presentationStair='editor-approved'/);
const editor=fs.readFileSync(new URL('../editor.html',import.meta.url),'utf8');
const original=new Function('const mkWall=(id,name,x1,z1,x2,z2,t=.25)=>({id,type:"wall",name,x1,z1,x2,z2,t});'+
 'const mkOpen=(id,type,name,wall,offset,width,sill=0,head=2.25,leaves=1)=>({id,type,name,wall,offset,width,sill,head,leaves});'+
 editor.slice(editor.indexOf('function defaultStair(){'),editor.indexOf('let state=original()'))+
 'return original()')();
assert.deepEqual(source,original,'immutable editor model must remain unchanged');
console.log('PASS: all five door hinges/angles/architectural anchors; immutable editor architecture');
