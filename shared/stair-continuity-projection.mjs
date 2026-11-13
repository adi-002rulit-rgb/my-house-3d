/**
 * OPTIONAL stair render geometry: all final-flight steps retain the uniform
 * source riser. Expands only the left return-flight ceiling opening to avoid
 * hiding four steps. Architectural source objects are untouched.
 *
 * Presentation hypothesis; must be checked against as-built measurements.
 */
import {staircaseLayout} from './architecture-geometry.mjs';

const near=(a,b)=>Math.abs(a-b)<.002;
const rect=(id,kind,x,y,z,w,h,d,more={})=>({id,kind,x,y,z,w,h,d,...more});

export function continuousStairPreview(model,geometry){
 if(!model||!geometry||!Array.isArray(geometry.treads)||!Array.isArray(geometry.slabs))
  throw TypeError('Requires approved model and geometry projection');
 const stairs=model.stairs||[];
 if(stairs.length!==1)return {applied:false,reason:'expected-one-stair'};
 const stair=stairs[0],g=staircaseLayout(stair,model.height);
 if(stair.rot!==0||g.lastN<=4||!Number.isFinite(stair.returnRun))
  return {applied:false,reason:'unsupported-stair-settings'};
 const old=geometry.treads.filter(t=>t.id===stair.id&&t.flight===3);
 const existingSlab=geometry.slabs.filter(t=>t.id===stair.id&&t.kind==='stair-slab');
 const ceilings=geometry.slabs.filter(t=>t.id==='upper-floor'&&t.kind==='upper-slab');
 if(old.length!==g.visibleLastN||existingSlab.length!==1||ceilings.length!==5)
  return {applied:false,reason:'unexpected-upper-flight-layout'};
 const stepRun=stair.returnRun/g.lastN;
 const start=g.front+Math.max(stair.lower,stepRun*g.visibleLastN);
 const finish=g.front+Math.max(stair.lower,stair.returnRun);
 if(finish<=start+.001)return {applied:false,reason:'no-ceiling-extension'};
 // Make sure a single existing upper slab corresponds to the left-return
 // ceiling infill. Otherwise do not touch slab geometry.
 const leftCeiling=ceilings.find(s=>near(s.x,g.left+g.w/2)&&
  near(s.z-s.d/2,start)&&near(s.w,g.w));
 if(!leftCeiling)return {applied:false,reason:'return-slab-not-identified'};
 const lastFlight=Array.from({length:g.lastN},(_,i)=>rect(stair.id,'tread',
  g.left+g.w/2,model.elevation+g.upperStart+(i+1)*g.rise-.02,
  g.front+(i+.5)*stepRun,g.w-.02,.043,Math.max(.01,stepRun-.012),
  {flight:3,step:i+1,continuousPreview:true}));
 const leftEdge=leftCeiling.z-leftCeiling.d/2;
 const rightEdge=leftCeiling.z+leftCeiling.d/2;
 // Expand the opening toward the landing while keeping all other slab
 // footprints identical; leftCeiling begins at the old upper-flight cutout.
 if(!near(leftEdge,start)||rightEdge<finish-.001)
  return {applied:false,reason:'ceiling-boundaries-changed'};
 const after=Math.max(0,rightEdge-finish);
 const replacement=after>.03?rect(leftCeiling.id,leftCeiling.kind,leftCeiling.x,
  leftCeiling.y,(finish+rightEdge)/2,leftCeiling.w,leftCeiling.h,after):null;
 const treads=geometry.treads.filter(t=>!(t.id===stair.id&&t.flight===3)).concat(lastFlight);
 const slabs=geometry.slabs.filter(t=>t!==existingSlab[0]&&t!==leftCeiling);
 if(replacement)slabs.push(replacement);
 const topRise=lastFlight.at(-1).y+.02-model.elevation;
 return {applied:true,treads,slabs,previewOnly:true,sourceStairsUnchanged:true,
  riserM:g.rise,upperRiserM:g.rise,stepCount:g.lastN,
  topHeightM:topRise,ceilingOpeningExtensionM:finish-start,
  warning:'Verify headroom, door paths, intermediate landings and physical as-built dimensions'};
}
