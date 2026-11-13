/**
 * Unified, explicit experimental geometry, for offline inspector and future
 * render verification. Not used by the current published presentation.
 */
import {architectureGeometry} from './architecture-geometry.mjs';
import {continuousStairPreview} from './stair-continuity-projection.mjs';

export function experimentalFirstFloorGeometry(project){
 const original=architectureGeometry(project,{consolidateOverlappingWalls:true});
 const source=project?.model||project;
 const stair=continuousStairPreview(source,original);
 if(!original.wallProjection?.applied||!stair.applied)
  return {applied:false,reasons:{
   wall:original.wallProjection?.reason||null,stair:stair.reason||null
  },geometry:original};
 return {applied:true,geometry:{...original,treads:stair.treads,slabs:stair.slabs,
  experimental:true,stairProjection:{
   riserM:stair.riserM,stepCount:stair.stepCount,
   ceilingOpeningExtensionM:stair.ceilingOpeningExtensionM,
   previewOnly:true
  }},warnings:[
  'Presentation-only hypothesis: inspect headroom, door swing and actual landing',
  'Not linked to index.html/editor.html or local Warm Premium'
 ]};
}
