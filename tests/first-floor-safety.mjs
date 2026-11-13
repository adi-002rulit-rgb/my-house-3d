import assert from 'node:assert/strict';
import {APPROVED_HOUSE_V1} from '../shared/approved-house-v1.mjs';
import {DEFAULT_PRESENTATION_FURNITURE} from '../shared/presentation-furniture.mjs';
import {auditApertures,auditRoomFootprints,auditStairGeometry,
 auditPresentationClearances,auditModelIdentity,fullFirstFloorSafetyAudit}
 from '../shared/first-floor-safety.mjs';

const original=JSON.stringify(APPROVED_HOUSE_V1);
const baseline=fullFirstFloorSafetyAudit(APPROVED_HOUSE_V1);
assert.deepEqual(Object.keys(baseline.checks),
 ['apertures','rooms','stairs','clearances','identity']);
assert.equal(baseline.checks.apertures.length,0,'12 approved openings must be separate');
assert.equal(baseline.checks.identity.length,0,'all source records have unique IDs');
assert.equal(baseline.checks.rooms.filter(x=>x.severity==='high').length,0,
 'room footprints must stay inside the pinned exterior');
assert.ok(baseline.checks.stairs.some(x=>x.type==='visible-stair-riser-discontinuity'&&x.severity==='high'),
 'Known stretched last flight must remain visible to safety audit');
assert.ok(baseline.checks.stairs.filter(x=>x.type==='stair-comfort-review')
 .every(x=>x.severity==='advisory'),'Ergonomic commentary is advisory');
assert.equal(JSON.stringify(APPROVED_HOUSE_V1),original,'audit is read-only');

// 1. Volumetric opening collisions (same wall, both horizontal and vertical).
const crossing=structuredClone(APPROVED_HOUSE_V1.model);
crossing.openings.push({...crossing.openings[0],id:'testCross',offset:3.4});
assert.equal(auditApertures(crossing).filter(x=>x.type==='opening-volume-overlap').length,1);
const stacked=structuredClone(APPROVED_HOUSE_V1.model);
stacked.openings.push({...stacked.openings[0],id:'testStacked',offset:3.2,
 sill:3.22,head:3.4});
assert.equal(auditApertures(stacked).filter(x=>x.type==='opening-volume-overlap').length,0);
stacked.openings.at(-1).head=5;
assert.ok(auditApertures(stacked).some(x=>x.type==='opening-invalid-height'));

// 2. Room crossing / exterior bounds.
const spill=structuredClone(APPROVED_HOUSE_V1.model);
spill.rooms[0].w=30;
assert.ok(auditRoomFootprints(spill).some(x=>x.type==='room-outside-envelope'));
const overlap=structuredClone(APPROVED_HOUSE_V1.model);
overlap.rooms[0].x=11;overlap.rooms[0].w=2;
assert.ok(auditRoomFootprints(overlap).some(x=>x.type==='room-footprints-overlap'));

// 3. Stair input and explanatory ergonomic warnings.
const invalidStair=structuredClone(APPROVED_HOUSE_V1.model);
invalidStair.stairs[0].width=0;
assert.ok(auditStairGeometry(invalidStair).some(x=>x.type==='invalid-stair-input'));
assert.ok(auditStairGeometry(APPROVED_HOUSE_V1.model)
 .some(x=>x.type==='stair-comfort-review'));

// 4. Presentation circulation and changed furniture.
const shifted=DEFAULT_PRESENTATION_FURNITURE.map(item=>({...item}));
shifted.find(x=>x.id==='livingChairL').x=4.72;
shifted.find(x=>x.id==='livingChairL').z=3.8;
assert.ok(auditPresentationClearances(shifted)
 .some(x=>x.type==='furniture-layout-unsafe'));

// 5. Duplicate IDs and height datum.
const duplicate=structuredClone(APPROVED_HOUSE_V1.model);
duplicate.rooms[0].id=duplicate.walls[0].id;
assert.ok(auditModelIdentity(duplicate).some(x=>x.type==='duplicate-or-missing-id'));
duplicate.height=-1;
assert.ok(auditModelIdentity(duplicate).some(x=>x.type==='invalid-height-datum'));
console.log('PASS: five independent first-floor checks, injected defects, source unchanged');
