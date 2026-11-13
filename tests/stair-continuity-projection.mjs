import assert from 'node:assert/strict';
import {APPROVED_HOUSE_V1} from '../shared/approved-house-v1.mjs';
import {architectureGeometry} from '../shared/architecture-geometry.mjs';
import {continuousStairPreview} from '../shared/stair-continuity-projection.mjs';
const before=JSON.stringify(APPROVED_HOUSE_V1);
const model=APPROVED_HOUSE_V1.model;
const geometry=architectureGeometry(APPROVED_HOUSE_V1,{consolidateOverlappingWalls:true});
const original=JSON.stringify(geometry);
const candidate=continuousStairPreview(model,geometry);
assert.equal(candidate.applied,true,'stair option must be generated');
assert.equal(candidate.stepCount,10);
assert.equal(candidate.treads.filter(x=>x.flight===3).length,10);
assert.ok(Math.abs(candidate.riserM-model.height/24)<1e-10);
assert.ok(Math.abs(candidate.topHeightM-model.height)<1e-10);
assert.ok(Math.abs(candidate.ceilingOpeningExtensionM-1.054)<.002);
assert.equal(candidate.slabs.filter(x=>x.kind==='stair-slab').length,0);
assert.equal(candidate.slabs.filter(x=>x.kind==='upper-slab').length,5);
assert.equal(candidate.treads.length,geometry.treads.length+4);
assert.equal(candidate.slabs.length,geometry.slabs.length-1);
assert.equal(JSON.stringify(APPROVED_HOUSE_V1),before,'approved model immutable');
assert.equal(JSON.stringify(geometry),original,'previous projected geometry immutable');
const changed=structuredClone(model);changed.stairs[0].rot=.2;
assert.equal(continuousStairPreview(changed,geometry).applied,false,
 'rotated stair must fail closed');
const incomplete=structuredClone(geometry);incomplete.slabs=[];
assert.equal(continuousStairPreview(model,incomplete).applied,false,
 'missing slabs must fail closed');
console.log('PASS: uniform risers, full ten-tread return, upper floor opening and no source mutation');
