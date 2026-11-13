/**
 * Conservative PREVIEW plans only. Approved walls and stairs remain immutable.
 * Never automatically render a plan until materials, door clearances, and
 * author-approved floor connection have been verified.
 */
const finite=n=>typeof n==='number'&&Number.isFinite(n);
const r=n=>Math.round(n*1000)/1000;

export function overlappingWallUnionPreview(model,firstId,secondId){
 const first=model.walls.find(w=>w.id===firstId);
 const second=model.walls.find(w=>w.id===secondId);
 if(!first||!second)throw Error('Unknown wall id');
 if(model.openings.some(o=>o.wall===firstId||o.wall===secondId))
  throw Error('Cannot preview-merge walls containing apertures');
 for(const w of [first,second]){
  if(![w.x1,w.x2,w.z1,w.z2,w.t].every(finite)||w.t<=0||
   Math.abs(w.z1-w.z2)>1e-8||Math.abs(w.x2-w.x1)<.001)
   throw Error('Only parallel horizontal non-zero-length walls supported');
 }
 const walls=[first,second],xs=[...new Set(walls.flatMap(w=>[w.x1,w.x2]))].sort((a,b)=>a-b);
 const strips=[];
 for(let i=0;i<xs.length-1;i++){
  const a=xs[i],b=xs[i+1],mid=(a+b)/2;
  const candidates=walls.filter(w=>mid>=Math.min(w.x1,w.x2)&&mid<=Math.max(w.x1,w.x2))
   .map(w=>[w.z1-w.t/2,w.z1+w.t/2]).sort((u,v)=>u[0]-v[0]);
  if(!candidates.length)continue;
  const merged=[];
  for(const interval of candidates){
   const prev=merged.at(-1);
   if(prev&&interval[0]<=prev[1]+1e-8)prev[1]=Math.max(prev[1],interval[1]);
   else merged.push([...interval]);
  }
  for(const z of merged)strips.push({x1:r(a),x2:r(b),z1:r(z[0]),z2:r(z[1])});
 }
 const oldArea=walls.reduce((sum,w)=>sum+Math.abs(w.x2-w.x1)*w.t,0);
 const unionArea=strips.reduce((sum,s)=>sum+(s.x2-s.x1)*(s.z2-s.z1),0);
 return {sourceWalls:[firstId,secondId],strips,unionAreaM2:r(unionArea),
  duplicateAreaM2:r(oldArea-unionArea),requiresApproval:true,
  warning:'Geometry-only preview; painted faces and room semantics unresolved'};
}

export function upperStairContinuityPreview(stair,height,{hiddenUpperSteps=4}={}){
 if(!Number.isInteger(hiddenUpperSteps)||hiddenUpperSteps<0)throw Error('Invalid hiddenUpperSteps');
 if(!finite(height)||height<=0)throw Error('Invalid floor height');
 const total=Math.max(16,Math.round(height/.156)),turnN=3,straight=total-2*turnN;
 const firstN=Math.max(3,Math.round(straight*.28));
 const midN=Math.max(2,Math.round(straight*.17));
 const lastN=straight-firstN-midN,visibleN=lastN-hiddenUpperSteps;
 if(visibleN<1)throw Error('Not enough visible treads');
 const uniformRise=height/total,upperStart=(firstN+midN+2*turnN)*uniformRise;
 const heights=Array.from({length:visibleN},(_,i)=>r(upperStart+(i+1)*uniformRise));
 const visibleTop=upperStart+visibleN*uniformRise;
 return {totalSteps:total,upperStepCount:lastN,visibleN,hiddenUpperSteps,
  uniformRiseM:r(uniformRise),visibleStepHeightsM:heights,
  visibleTopM:r(visibleTop),unresolvedHeightM:r(height-visibleTop),
  requiresApproval:true,
  warning:'Preview only: unresolved climb must be reconciled with actual slab and upper landing'};
}
