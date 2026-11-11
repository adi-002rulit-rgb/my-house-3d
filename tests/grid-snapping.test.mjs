import test from 'node:test';
import assert from 'node:assert/strict';
import {GridSnappingManager} from '../shared/grid-snapping.mjs';

test('snap to 5, 10 and 25 centimetres',()=>{
 const m=new GridSnappingManager(0.25);
 assert.equal(m.snap(1.13),1.25);
 m.setStep(0.1);assert.ok(Math.abs(m.snap(1.13)-1.1)<1e-9);
 m.setStep(0.05);assert.ok(Math.abs(m.snap(-0.12)+0.1)<1e-9);
});
test('disabled snap preserves coordinates and Y',()=>{
 const m=new GridSnappingManager(0);
 const point={x:1.134,y:1.6,z:-2.371};
 assert.equal(m.snapPosition(point),point);
 assert.deepEqual(point,{x:1.134,y:1.6,z:-2.371});
 m.setStep(.25);m.snapPosition(point);
 assert.deepEqual(point,{x:1.25,y:1.6,z:-2.25});
});
test('reject nonfinite steps and coordinates',()=>{
 const m=new GridSnappingManager();
 assert.throws(()=>m.setStep(-1));
 assert.throws(()=>m.snap(NaN));
});
