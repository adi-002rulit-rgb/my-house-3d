/**
 * Optional presentation projection for the one confirmed pair of overlapping
 * parallel walls. The editor source, room boundaries and openings are unchanged.
 * This is NOT a construction change or a general purpose boolean wall solver.
 */
import {overlappingWallUnionPreview} from './first-floor-repair-preview.mjs';

const r=n=>Math.round(n*1e6)/1e6;

/**
 * Replaces overlapping livingBack/bedFront render segments with a disjoint
 * union of rectangular strips. The source JSON is never mutated.
 *
 * The positive (courtyard/living) paint is read from livingBack; the negative
 * (bedroom) paint from bedFront. Separate semantic source wall IDs are kept
 * in the metadata for future editing/inspection.
 */
export function consolidatedPinnedWallProjection(model,segments){
 if(!model||!Array.isArray(model.walls)||!Array.isArray(segments))
  throw TypeError('Expected model and render segments');
 const first=model.walls.find(w=>w.id==='livingBack');
 const second=model.walls.find(w=>w.id==='bedFront');
 if(!first||!second)return {segments:[...segments],applied:false,reason:'walls-absent'};
 if(model.openings.some(o=>o.wall===first.id||o.wall===second.id))
  return {segments:[...segments],applied:false,reason:'apertures-require-review'};
 const sourceA=segments.filter(x=>x.sourceWall===first.id);
 const sourceB=segments.filter(x=>x.sourceWall===second.id);
 if(sourceA.length!==1||sourceB.length!==1)
  return {segments:[...segments],applied:false,reason:'segmented-walls-require-review'};
 // Restrict to uninterrupted full-height spans; do not accidentally remove windows.
 if(sourceA.some(s=>Math.abs(s.h-model.height)>.001)||
    sourceB.some(s=>Math.abs(s.h-model.height)>.001))
  return {segments:[...segments],applied:false,reason:'partial-height-walls'};
 const preview=overlappingWallUnionPreview(model,first.id,second.id);
 if(preview.duplicateAreaM2<=.001)
  return {segments:[...segments],applied:false,reason:'no-overlap-to-fix'};
 if(!sourceA[0].sideColors?.positive||!sourceB[0].sideColors?.negative)
  return {segments:[...segments],applied:false,reason:'missing-wall-face-materials'};
 const colorPlus=sourceA[0].sideColors.positive;
 const colorMinus=sourceB[0].sideColors.negative;
 const merged=preview.strips.map((s,index)=>({
  id:'living-bed-union-'+index,kind:'wall',
  x:r((s.x1+s.x2)/2),y:r(model.elevation+model.height/2),
  z:r((s.z1+s.z2)/2),w:r(s.x2-s.x1),h:model.height,d:r(s.z2-s.z1),
  angle:0,sourceWall:'livingBack+bedFront',sourceWallIds:[first.id,second.id],
  start:s.x1,end:s.x2,from:0,to:model.height,
  sideColors:{positive:colorPlus,negative:colorMinus},
  presentationOnly:true
 }));
 const replacement=segments.filter(s=>s.sourceWall!==first.id&&s.sourceWall!==second.id);
 return {segments:[...replacement,...merged],applied:true,
  sourceWallIds:[first.id,second.id],renderSegmentCount:merged.length,
  unionAreaM2:preview.unionAreaM2,duplicateAreaM2:preview.duplicateAreaM2};
}
