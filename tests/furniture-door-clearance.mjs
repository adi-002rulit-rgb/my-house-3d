import assert from 'node:assert/strict';
import {doorFurnitureAudit} from '../shared/furniture-door-clearance.mjs';
import {DEFAULT_PRESENTATION_FURNITURE,layoutSafetyAudit} from '../shared/presentation-furniture.mjs';
const copy=()=>DEFAULT_PRESENTATION_FURNITURE.map(x=>({...x}));
assert.ok(layoutSafetyAudit(copy()).ok);
assert.deepEqual(doorFurnitureAudit(copy()).issues,[],
 'approved interior staging must not intersect an open door');
const old=copy();old.find(x=>x.id==='bedroomWardrobe').d=1.55;
assert.equal(doorFurnitureAudit(old).ok,false,
 'previous wardrobe staging corner blocked the bedroom door');
assert.ok(doorFurnitureAudit(old,{bedroom:{opening:'closed'}}).ok,
 'closed leaf should not trigger an open swing collision');
assert.ok(doorFurnitureAudit(old,{bedroom:{swing:'hall',angle:65}}).ok,
 'opposite opening direction should avoid wardrobe');
const intrusion=copy();
const chair=intrusion.find(x=>x.id==='livingChairR');
chair.x=9;chair.z=2;
assert.ok(doorFurnitureAudit(intrusion).issues.some(i=>i.room==='living'),
 'detect furniture moved into living door swing');
console.log('PASS: door sweep clearances checked against all editable furniture, including prior bedroom failure');
