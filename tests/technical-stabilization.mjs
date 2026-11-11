import assert from 'node:assert/strict';
import fs from 'node:fs';
import {DEFAULT_PRESENTATION_FURNITURE,layoutSafetyAudit,validateFurnitureLayout,
 migrateFurnitureLayout,kitchenLayoutAudit,furnitureCollisionAudit,furnitureBounds}
 from '../shared/presentation-furniture.mjs';
import {APPROVED_HOUSE_V1} from '../shared/approved-house-v1.mjs';
const copy=()=>DEFAULT_PRESENTATION_FURNITURE.map(x=>({...x}));
assert.ok(layoutSafetyAudit(copy()).ok,'approved staging remains safe');
const dining=copy();dining.find(x=>x.id==='kitchenDining').z=2.1;
assert.ok(validateFurnitureLayout(dining),'existing room-only validator missed crossing');
assert.equal(layoutSafetyAudit(dining).ok,false,'clearance now protected');
assert.equal(migrateFurnitureLayout(dining),null,'unsafe saved JSON cannot be restored');
for(const id of ['kitchenRear','kitchenLeft','kitchenRight']){
 const bad=copy();bad.find(x=>x.id===id).rot=180;
 assert.equal(kitchenLayoutAudit(bad).orientation,false,'rotated appliance faces wrong wall');
 assert.equal(layoutSafetyAudit(bad).ok,false,id+' rotation prevented');
 assert.equal(migrateFurnitureLayout(bad),null);
}
const overlap=copy();
const chair=overlap.find(x=>x.id==='livingChairL'),sofa=overlap.find(x=>x.id==='livingSofa');
chair.x=sofa.x;chair.z=sofa.z;
assert.equal(layoutSafetyAudit(overlap).reason,'furniture-overlap');
assert.equal(migrateFurnitureLayout(overlap),null);
const rotated=copy();const table=rotated.find(x=>x.id==='kitchenDining');
const a=furnitureBounds(table);table.rot=90;const b=furnitureBounds(table);
assert.ok(a.x2-a.x1>b.x2-b.x1,'rotated bounding box width changed');
assert.ok(a.z2-a.z1<b.z2-b.z1,'rotated bounding box depth changed');
const corners=furnitureCollisionAudit(copy());
assert.equal(corners.issues.length,0,'U kitchen corner joints must remain allowed');
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
assert.match(html,/function furnitureSnapshot\(/);
assert.match(html,/furnitureDesign:activeFurnitureDesign,furnitureLayout:furnitureSnapshot\(\)/);
assert.match(html,/if\(d.furnitureLayout\)/);
assert.match(html,/if\(d.furnitureDesign!==undefined\)applyFurnitureDesign\(d.furnitureDesign,false\)/);
assert.match(html,/if\(!layoutSafetyAudit\(proposed\)\.ok\|\|!doorFurnitureAudit\(proposed,doorAssignments\)\.ok\)return false/);
assert.match(html,/if\(!imported\|\|!layoutSafetyAudit\(imported\)\.ok\|\|!doorFurnitureAudit\(imported,doorAssignments\)\.ok\)/);
assert.match(html,/document\.body\.dataset\.furnitureSafety=/);
assert.equal(APPROVED_HOUSE_V1.model.walls.length,13);
assert.equal(APPROVED_HOUSE_V1.model.openings.length,12);
console.log('PASS: kitchen facing, overlaps, JSON restore rejection, full design snapshots and pinned structure');
