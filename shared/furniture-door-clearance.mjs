// Plan-view conservative door-swing clearance test for editable furniture.
// Uses approved hinge centres, not approximated wall/door placements.
// Samples each moving leaf through its full sweep, with a 3cm buffer.
// Noneditable sanitary/wardrobe staging is outside the test scope.
import {presentationDoorSpecs,doorLeafPose,normalizedDoorSwing} from './presentation-doors.mjs';
import {furnitureBounds} from './presentation-furniture.mjs';
const movableRooms=new Set(['living','kitchen','bedroom']);
export function doorFurnitureAudit(items,doorConfig={}){
 if(!Array.isArray(items))return {ok:false,issues:[{type:'invalid-furniture'}]};
 const issues=[];
 for(const door of presentationDoorSpecs){
  if(!movableRooms.has(door.room))continue;
  const cfg=doorConfig[door.room]||{};
  if(cfg.opening==='closed'||cfg.opening==='hide')continue;
  const setting=normalizedDoorSwing(door.room,cfg);
  const near=items.filter(it=>it.room===door.room);
  if(!near.length||setting.angle===0)continue;
  for(let leaf=0;leaf<door.leafCount;leaf++){
   const {at,mirror,leafW,radians}=doorLeafPose(door,setting,leaf);
   for(const it of near){
    const b=furnitureBounds(it);
    let collision=false;
    // Include the whole sweep for the selected opening angle, not just end pose.
    for(let step=0;step<=24&&!collision;step++){
     const a=radians*(step/24),side=mirror?-1:1;
     for(let sample=0;sample<=20;sample++){
      const t=leafW*sample/20,localX=at+side*t*Math.cos(a);
      const localZ=-side*t*Math.sin(a);
      const x=door.axis==='z'?door.x-localZ:door.x+localX;
      const z=door.axis==='z'?door.z+localX:door.z+localZ;
      if(x>=b.x1-.03&&x<=b.x2+.03&&z>=b.z1-.03&&z<=b.z2+.03){
       collision=true;break;
      }
     }
    }
    if(collision)issues.push({type:'door-furniture',room:door.room,
      opening:door.id,leaf,object:it.id});
   }
  }
 }
 return {ok:issues.length===0,issues};
}
