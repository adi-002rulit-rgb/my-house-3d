import assert from 'node:assert/strict';
import fs from 'node:fs';
import {APPROVED_HOUSE_V1} from '../shared/approved-house-v1.mjs';
import {approvedOpeningSpec,openingWorldCenterFromSpec,approvedOpeningsAudit} from '../shared/presentation-openings.mjs';
import {architectureGeometry,staircaseLayout} from '../shared/architecture-geometry.mjs';

const base=JSON.stringify(APPROVED_HOUSE_V1),audit=approvedOpeningsAudit();
const specs=[
 ['livingW1',.2,5.5,18.83,5.5],
 ['livingW2',.2,5.5,18.83,5.5],
 ['kitchenW',.2,5.5,18.83,5.5],
 ['frontEntry',.2,5.5,18.83,5.5],
 ['stairWindow',.2,-5.5,18.83,-5.5],
 ['bedWindow',.2,-5.5,.2,5.5],
 ['stairArch',9.525,-5.5,9.525,-1.05],
 ['livingD',9.6,-1.05,9.6,5.5],
 ['wardrobeD',13.595,-5.5,13.595,-1.05],
 ['kitchenD',13.52,-1.05,13.52,5.5],
 ['bedD',5.725,-5.5,5.725,-1.05],
 ['bathD',5.85,-2.675,9.4,-2.675]
];
for(const [id,x1,z1,x2,z2] of specs){
 const spec=approvedOpeningSpec(id,x1,z1,x2,z2);
 const actual=openingWorldCenterFromSpec(spec,x1,z1,x2,z2),expected=audit.find(o=>o.id===id);
 assert.ok(Math.hypot(actual.x-expected.x,actual.z-expected.z)<1e-10,'center '+id);
 assert.equal(spec.width,expected.width,id+' width');
 assert.equal(spec.kind,expected.type,id+' type');
 assert.equal(spec.head,expected.head,id+' head');
 assert.equal(spec.sill,expected.sill,id+' sill');
}
// Explicit regressions from code audit: old "at" interpreted as START rather than center.
const former={
 livingD:2.70,kitchenD:2.00,stairArch:-1.805,
 wardrobeD:-1.80,bedD:-1.595,bathD:7.80
};
for(const [id,wrong] of Object.entries(former)){
 const expected=audit.find(x=>x.id===id);
 const actual=(id==='bathD'?expected.x:expected.z);
 assert.ok(Math.abs(wrong-actual)>.2,'old '+id+' should be demonstrably wrong');
}
assert.equal(approvedOpeningSpec('stairArch',9.525,-5.5,9.525,-1.05).width,.95);
assert.equal(approvedOpeningSpec('stairArch',9.525,-5.5,9.525,-1.05).head,2.99);
const house=architectureGeometry(APPROVED_HOUSE_V1);
const g=staircaseLayout(APPROVED_HOUSE_V1.model.stairs[0],APPROVED_HOUSE_V1.model.height);
const transitionZ=g.front+Math.max(APPROVED_HOUSE_V1.model.stairs[0].lower,
  g.backRun*g.visibleLastN/g.lastN);
assert.ok(Number.isFinite(transitionZ));
assert.equal(house.slabs.filter(p=>p.kind==='stair-slab').length,1);
assert.equal(house.treads.filter(p=>p.flight===3).length,6);
const index=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
assert.match(index,/if\(o\.kind==='passage'\)continue/,'passage must not have decorative door jambs');
assert.match(index,/approvedOpeningSpec\('stairArch'/,'left passage linked to approved editor source');
assert.match(index,/upper-stair-transition/,'upper floor stair transition edge installed');
assert.equal(JSON.stringify(APPROVED_HOUSE_V1),base,'approved source must be unchanged');
const invalid=()=>approvedOpeningSpec('livingD',8,-2,9,-2);
assert.throws(invalid,/Wall axis mismatch/);
console.log('PASS: 12 openings match approved centers/types/heights, left passage clear and upper stair exit matches source');
