/**
 * ADKH House stage-1 audit: five read-only integrity checks.
 * Model coordinates are metres. These checks do NOT certify construction safety.
 */
import {staircaseLayout} from './architecture-geometry.mjs';
import {layoutSafetyAudit,DEFAULT_PRESENTATION_FURNITURE} from './presentation-furniture.mjs';
import {doorFurnitureAudit} from './furniture-door-clearance.mjs';

const round=n=>Math.round(n*1000)/1000;
const overlap=(a,b)=>Math.max(0,Math.min(a[1],b[1])-Math.max(a[0],b[0]));
const issue=(type,severity,details)=>({type,severity,...details});
const wallLength=w=>Math.hypot(w.x2-w.x1,w.z2-w.z1);

/** 1. Detect crossing apertures, invalid clear heights, and wall-edge conflicts. */
export function auditApertures(model){
 const issues=[],byWall=new Map(model.walls.map(w=>[w.id,[]]));
 for(const o of model.openings){
  const wall=model.walls.find(w=>w.id===o.wall);
  if(!wall){issues.push(issue('orphan-opening','high',{id:o.id}));continue;}
  const len=wallLength(wall);
  if(!Number.isFinite(o.offset)||!Number.isFinite(o.width)||o.width<=0||
   o.offset-o.width/2<-.001||o.offset+o.width/2>len+.001)
   issues.push(issue('opening-out-of-wall','high',{id:o.id}));
  if(!Number.isFinite(o.sill)||!Number.isFinite(o.head)||o.sill<0||
   o.head<=o.sill||o.head>model.height+.001)
   issues.push(issue('opening-invalid-height','high',{id:o.id}));
  byWall.get(wall.id).push(o);
 }
 for(const [wallId,items] of byWall)for(let i=0;i<items.length;i++)
  for(let j=i+1;j<items.length;j++){
   const a=items[i],b=items[j];
   const horizontal=overlap([a.offset-a.width/2,a.offset+a.width/2],
    [b.offset-b.width/2,b.offset+b.width/2]);
   const vertical=overlap([a.sill,a.head],[b.sill,b.head]);
   if(horizontal>.002&&vertical>.002)
    issues.push(issue('opening-volume-overlap','high',{wall:wallId,
     first:a.id,second:b.id,horizontalM:round(horizontal),verticalM:round(vertical)}));
  }
 return issues;
}

/** 2. Verify rectangular room footprints against the exterior extent.
 * Minor geometric overlaps (<0.10m2) can be wall/finish tolerances.
 */
export function auditRoomFootprints(model){
 const issues=[],exterior=model.walls.filter(w=>['front','back','east','west'].includes(w.id));
 if(exterior.length!==4)return [issue('missing-exterior-walls','medium',{found:exterior.length})];
 const xs=exterior.flatMap(w=>[w.x1,w.x2]),zs=exterior.flatMap(w=>[w.z1,w.z2]);
 const envelope={minX:Math.min(...xs),maxX:Math.max(...xs),minZ:Math.min(...zs),maxZ:Math.max(...zs)};
 for(const room of model.rooms){
  if(![room.x,room.z,room.w,room.h].every(Number.isFinite)||room.w<=0||room.h<=0)
   {issues.push(issue('invalid-room-bounds','high',{id:room.id}));continue;}
  if(room.x<envelope.minX-.002||room.z<envelope.minZ-.002||
   room.x+room.w>envelope.maxX+.002||room.z+room.h>envelope.maxZ+.002)
   issues.push(issue('room-outside-envelope','high',{id:room.id}));
 }
 for(let i=0;i<model.rooms.length;i++)for(let j=i+1;j<model.rooms.length;j++){
  const a=model.rooms[i],b=model.rooms[j];
  const area=overlap([a.x,a.x+a.w],[b.x,b.x+b.w])*
   overlap([a.z,a.z+a.h],[b.z,b.z+b.h]);
  if(area>.10)issues.push(issue('room-footprints-overlap','medium',
   {first:a.id,second:b.id,areaM2:round(area)}));
 }
 return issues;
}

/** 3. Stair maths plus advisory comfort checks (not building regulations). */
export function auditStairGeometry(model){
 const issues=[];
 for(const s of model.stairs||[]){
  if(![s.width,s.lower,s.upper,s.back,s.x,s.z].every(Number.isFinite)||
   s.width<=0||s.lower<=0||s.upper<=0)
   {issues.push(issue('invalid-stair-input','high',{id:s.id}));continue;}
  const g=staircaseLayout(s,model.height);
  if(g.lastN<=4||g.visibleLastN<=0||g.rise<=0||
   Math.abs(g.upperStart+g.visibleLastN*g.upperRise-model.height)>.001)
   issues.push(issue('stair-level-continuity','high',{id:s.id}));
  // 2R+G in metres is only a preliminary ergonomic indicator.
  // Winder/return flight geometry and headroom demand on-site measurements.
  const flightDepths=[s.lower/g.firstN,g.bridge/g.midN,(s.returnRun||s.lower)/g.lastN];
  for(let i=0;i<flightDepths.length;i++){
   const comfort=2*g.rise+flightDepths[i];
   if(comfort<.59||comfort>.67)
    issues.push(issue('stair-comfort-review','advisory',{id:s.id,flight:i+1,
     riserM:round(g.rise),treadDepthM:round(flightDepths[i]),twiceRisePlusGoingM:round(comfort)}));
  }
 }
 return issues;
}

/** 4. Check editable staging and swings without changing any coordinates. */
export function auditPresentationClearances(items=DEFAULT_PRESENTATION_FURNITURE,doorConfig={}){
 const issues=[];
 const layout=layoutSafetyAudit(items);
 if(!layout.ok)issues.push(issue('furniture-layout-unsafe','high',{reason:layout.reason}));
 const doors=doorFurnitureAudit(items,doorConfig);
 for(const d of doors.issues)issues.push(issue('door-swing-furniture','high',{...d}));
 return issues;
}

/** 5. Verify identity, pinned sizes and uniqueness of structural records. */
export function auditModelIdentity(model){
 const issues=[],seen=new Set();
 for(const field of ['walls','openings','rooms','furniture','stairs']){
  for(const record of model[field]||[]){
   if(typeof record.id!=='string'||!record.id||seen.has(record.id))
    issues.push(issue('duplicate-or-missing-id','high',{group:field,id:record.id}));
   seen.add(record.id);
  }
 }
 if(!Number.isFinite(model.height)||model.height<=0||
  !Number.isFinite(model.elevation)||model.elevation<0)
  issues.push(issue('invalid-height-datum','high',{}));
 return issues;
}

export function fullFirstFloorSafetyAudit(project,items,doorConfig={}){
 const model=project?.model||project;
 if(!model||!Array.isArray(model.walls)||!Array.isArray(model.openings)||
  !Array.isArray(model.rooms)||!Array.isArray(model.stairs))
  throw new TypeError('Expected an approved architectural model');
 const checks={
  apertures:auditApertures(model),
  rooms:auditRoomFootprints(model),
  stairs:auditStairGeometry(model),
  clearances:auditPresentationClearances(items,doorConfig),
  identity:auditModelIdentity(model)
 };
 return {checks,issues:Object.values(checks).flat(),
  blockers:Object.values(checks).flat().filter(v=>v.severity==='high').length};
}
