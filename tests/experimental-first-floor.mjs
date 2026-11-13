import assert from 'node:assert/strict';
import {APPROVED_HOUSE_V1} from '../shared/approved-house-v1.mjs';
import {architectureGeometry} from '../shared/architecture-geometry.mjs';
import {experimentalFirstFloorGeometry} from '../shared/experimental-first-floor.mjs';

const before=JSON.stringify(APPROVED_HOUSE_V1);
const base=architectureGeometry(APPROVED_HOUSE_V1);
const experimental=experimentalFirstFloorGeometry(APPROVED_HOUSE_V1);
assert.equal(experimental.applied,true);
const mesh=experimental.geometry;
assert.equal(mesh.wallProjection.applied,true);
assert.equal(mesh.wallProjection.duplicateAreaM2,2.053);
assert.equal(mesh.treads.filter(x=>x.flight===3).length,10);
assert.equal(mesh.stairProjection.previewOnly,true);
assert.equal(mesh.stairProjection.ceilingOpeningExtensionM,1.0540000000000003);
assert.equal(mesh.slabs.filter(x=>x.kind==='stair-slab').length,0);
assert.equal(mesh.slabs.filter(x=>x.kind==='upper-slab').length,5);
assert.deepEqual(mesh.openings,base.openings);
assert.deepEqual(mesh.furniture,base.furniture);
assert.deepEqual(mesh.floors,base.floors);
assert.equal(JSON.stringify(APPROVED_HOUSE_V1),before,'approved source unchanged');
const changed=structuredClone(APPROVED_HOUSE_V1);
changed.model.stairs[0].rot=.2;
assert.equal(experimentalFirstFloorGeometry(changed).applied,false,
 'unsupported stairs must not be accepted');
console.log('PASS: experimental wall + stair projection retains openings, rooms and furniture');
