import {APPROVED_HOUSE_V1} from './approved-house-v1.mjs';

// Each decor leaf is positioned from an immutable architectural opening.
// Presentation decorators must never move or resize the architectural void.
export const PRESENTATION_DOOR_IDS={
 living:'livingD',kitchen:'kitchenD',bedroom:'bedD',
 bathroom:'bathD',wardrobe:'wardrobeD'
};
export const DEFAULT_DOOR_SWINGS={
 living:{hinge:'left',swing:'room',angle:65},
 kitchen:{hinge:'right',swing:'room',angle:65},
 bedroom:{hinge:'left',swing:'room',angle:65},
 bathroom:{hinge:'right',swing:'room',angle:65},
 wardrobe:{hinge:'right',swing:'room',angle:65}
};
export const presentationDoorSpecs=Object.entries(PRESENTATION_DOOR_IDS).map(([room,id])=>{
 const {walls,openings}=APPROVED_HOUSE_V1.model;
 const o=openings.find(x=>x.id===id);
 if(!o||o.type!=='door')throw Error('Approved interior door is missing: '+id);
 const w=walls.find(x=>x.id===o.wall);
 if(!w)throw Error('Missing door wall: '+id);
 const len=Math.hypot(w.x2-w.x1,w.z2-w.z1);
 const x=w.x1+(w.x2-w.x1)*o.offset/len;
 const z=w.z1+(w.z2-w.z1)*o.offset/len;
 const axis=Math.abs(w.x2-w.x1)>Math.abs(w.z2-w.z1)?'x':'z';
 const roomSide=(room==='kitchen'||room==='wardrobe'||room==='bathroom')?-1:1;
 return Object.freeze({room,id,x,z,axis,width:o.width,head:o.head,
  leafCount:o.leaves,roomSide});
});
export function normalizedDoorSwing(door,candidate){
 const defaults=DEFAULT_DOOR_SWINGS[door];
 if(!defaults)throw Error('Unknown room '+door);
 const src=candidate||{};
 const hinge=src.hinge==='right'||src.hinge==='left'?src.hinge:defaults.hinge;
 const swing=src.swing==='hall'||src.swing==='room'?src.swing:defaults.swing;
 const angle=Number.isFinite(src.angle)?Math.max(0,Math.min(105,Math.round(src.angle/5)*5)):defaults.angle;
 return {hinge,swing,angle};
}
export function doorLeafPose(spec,settings,leafIndex){
 const {hinge,swing,angle}=normalizedDoorSwing(spec.room,settings);
 if(!Number.isInteger(leafIndex)||leafIndex<0||leafIndex>=spec.leafCount)
  throw Error('Invalid leaf index');
 const half=spec.width/2,leafW=spec.width/spec.leafCount;
 // Double door hinges are always on *outer* jambs. The second leaf
 // extends inward from +half, not from the centre of the opening.
 const side=spec.leafCount===2?(leafIndex===0?'left':'right'):hinge;
 const at=side==='left'?-half:half;
 const mirror=side==='right';
 // In local coordinates the door wall is X; +Z maps into the room when
 // roomSide=+1, otherwise outward. Both leaves swing to the chosen side.
 const toward=(swing==='room'?1:-1)*spec.roomSide;
 const degrees=(mirror?1:-1)*toward*angle;
 return {at,mirror,leafW,radians:degrees*Math.PI/180};
}
