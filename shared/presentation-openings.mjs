/**
 * Architectural opening projection for the LEGACY styled showroom.
 * Coordinates and aperture dimensions come only from the pinned editor model.
 * Presentation wall segments may be inset relative to editor wall endpoints;
 * therefore convert the source world-space centre to local segmented() "at".
 * "at" is aperture START, not centre.
 */
import {APPROVED_HOUSE_V1} from './approved-house-v1.mjs';

export function approvedOpeningSpec(id,x1,z1,x2,z2,extra={}){
 const {walls,openings}=APPROVED_HOUSE_V1.model;
 const aperture=openings.find(o=>o.id===id);
 if(!aperture)throw Error('Unknown approved opening '+id);
 const wall=walls.find(w=>w.id===aperture.wall);
 if(!wall)throw Error('Missing approved wall for '+id);
 const dx=wall.x2-wall.x1,dz=wall.z2-wall.z1;
 const len=Math.hypot(dx,dz),ux=dx/len,uz=dz/len;
 const cx=wall.x1+ux*aperture.offset,cz=wall.z1+uz*aperture.offset;
 const sx=x2-x1,sz=z2-z1,segLen=Math.hypot(sx,sz);
 const vx=sx/segLen,vz=sz/segLen;
 if(Math.abs(ux*vz-uz*vx)>1e-5)
  throw Error('Wall axis mismatch for '+id);
 const distance=(cx-x1)*vx+(cz-z1)*vz;
 const perpendicular=Math.abs((cx-x1)*vz-(cz-z1)*vx);
 if(perpendicular>.23)throw Error('Wall plane mismatch for '+id);
 const at=distance-aperture.width/2;
 if(at<-.001||at+aperture.width>segLen+.001)
  throw Error('Approved opening falls outside presentation wall: '+id);
 return {
  ...extra,id,at,width:aperture.width,kind:aperture.type,
  sill:aperture.sill,head:aperture.head,leaves:aperture.leaves
 };
}

export function openingWorldCenterFromSpec(spec,x1,z1,x2,z2){
 const length=Math.hypot(x2-x1,z2-z1);
 const t=(spec.at+spec.width/2)/length;
 return {x:x1+(x2-x1)*t,z:z1+(z2-z1)*t};
}

export function approvedOpeningsAudit(){
 const walls=APPROVED_HOUSE_V1.model.walls,openings=APPROVED_HOUSE_V1.model.openings;
 return openings.map(o=>{
  const w=walls.find(v=>v.id===o.wall),length=Math.hypot(w.x2-w.x1,w.z2-w.z1);
  return {id:o.id,wall:o.wall,type:o.type,width:o.width,sill:o.sill,head:o.head,
   x:w.x1+(w.x2-w.x1)*o.offset/length,z:w.z1+(w.z2-w.z1)*o.offset/length};
 });
}
