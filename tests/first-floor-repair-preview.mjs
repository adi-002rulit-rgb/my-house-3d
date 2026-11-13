import assert from 'node:assert/strict';
import {APPROVED_HOUSE_V1} from '../shared/approved-house-v1.mjs';
import {overlappingWallUnionPreview,upperStairContinuityPreview}
 from '../shared/first-floor-repair-preview.mjs';
const snapshot=JSON.stringify(APPROVED_HOUSE_V1);
const m=APPROVED_HOUSE_V1.model;
const union=overlappingWallUnionPreview(m,'livingBack','bedFront');
assert.deepEqual(union.sourceWalls,['livingBack','bedFront']);
assert.equal(union.strips.length,2);
assert.equal(union.duplicateAreaM2,2.053);
assert.ok(Math.abs(union.unionAreaM2-3.908)<.002);
assert.deepEqual(union.strips[0],{x1:.4,x2:9.525,z1:-1.125,z2:-.7});
assert.deepEqual(union.strips[1],{x1:9.525,x2:9.6,z1:-1.1,z2:-.7});
assert.equal(union.requiresApproval,true);
assert.throws(()=>overlappingWallUnionPreview(m,'front','back'),/containing apertures/);
const plan=upperStairContinuityPreview(m.stairs[0],m.height);
assert.equal(plan.totalSteps,24);
assert.equal(plan.visibleN,6);
assert.equal(plan.uniformRiseM,.156);
assert.equal(plan.unresolvedHeightM,.623);
assert.equal(plan.visibleStepHeightsM.length,6);
assert.equal(plan.requiresApproval,true);
assert.throws(()=>upperStairContinuityPreview(m.stairs[0],m.height,
 {hiddenUpperSteps:11}),/Not enough visible/);
assert.equal(JSON.stringify(APPROVED_HOUSE_V1),snapshot,'source must not mutate');
console.log('PASS: wall union preserves plan-view envelope; stair preview exposes landing gap');
