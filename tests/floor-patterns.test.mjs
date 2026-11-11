import test from 'node:test';
import assert from 'node:assert/strict';
import {floorRepeatForRoom,drawFloorPattern,FLOOR_PATTERN_TYPES} from '../shared/floor-patterns.mjs';

test('metric repeat matches physical dimensions',()=>{
  assert.deepEqual(floorRepeatForRoom(6,3,2),[3,1.5]);
  assert.throws(()=>floorRepeatForRoom(0,4),/Invalid/);
});
test('all patterns draw without invalid canvas operations',()=>{
  const operations=[];
  const ctx=new Proxy({},{
    get(target,key){
      if(key in target)return target[key];
      if(['fillRect','strokeRect','save','restore','beginPath','rect','clip','moveTo','lineTo','bezierCurveTo','stroke','fill','closePath'].includes(key))
        return (...args)=>{for(const a of args)assert.ok(Number.isFinite(a));operations.push(key)};
    },
    set(target,key,value){target[key]=value;return true}
  });
  for(const kind of FLOOR_PATTERN_TYPES){
    operations.length=0;
    drawFloorPattern(ctx,kind,'#b58e63',256);
    assert.ok(operations.length>10,kind);
  }
  assert.throws(()=>drawFloorPattern(ctx,'unknown','#ffffff'),/Invalid/);
});
