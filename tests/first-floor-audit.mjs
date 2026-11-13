import assert from 'node:assert/strict';
import {APPROVED_HOUSE_V1} from '../shared/approved-house-v1.mjs';
import {firstFloorAudit,parallelWallOverlaps} from '../shared/first-floor-audit.mjs';
const before=JSON.stringify(APPROVED_HOUSE_V1);
const audit=firstFloorAudit(APPROVED_HOUSE_V1);
assert.deepEqual(audit.counts,{walls:13,openings:12,rooms:7,stairs:1});
assert.equal(audit.issues.filter(i=>i.type==='orphan-opening').length,0);
assert.equal(audit.issues.filter(i=>i.type==='opening-out-of-wall').length,0);
const documented=audit.issues.filter(i=>i.type==='wall-volume-overlap');
assert.ok(documented.some(i=>i.first==='livingBack'&&i.second==='bedFront'&&i.runM>9),
 'Known wall overlap must remain visible to the audit until structural approval');
const sample={walls:[
 {id:'a',x1:0,z1:0,x2:3,z2:0,t:.2},
 {id:'b',x1:1,z1:2,x2:4,z2:2,t:.2}
]};
assert.deepEqual(parallelWallOverlaps(sample),[]);
sample.walls[1].z1=.09;sample.walls[1].z2=.09;
assert.equal(parallelWallOverlaps(sample).length,1);
assert.equal(JSON.stringify(APPROVED_HOUSE_V1),before,'Audit must be read-only');
console.log('PASS: first-floor structural audit, 12 opening anchors, documented wall overlap; source unchanged');
