// Read-only audit of parallel wall volumes in a shared approved house model.
// Detects overlapping wall centre-lines with overlapping physical thickness.
// Does not alter wall coordinates or infer which approved wall to remove.
const r3=n=>Math.round(n*1000)/1000;
export function parallelWallOverlaps(model,{tolerance=0.001,minRun=0.2}={}){
 if(!model||!Array.isArray(model.walls))throw new TypeError('Expected model with walls');
 const result=[];
 for(let i=0;i<model.walls.length;i++)for(let j=i+1;j<model.walls.length;j++){
  const a=model.walls[i],b=model.walls[j];
  const ax=a.x2-a.x1,az=a.z2-a.z1,bx=b.x2-b.x1,bz=b.z2-b.z1;
  const al=Math.hypot(ax,az),bl=Math.hypot(bx,bz);
  if(al<=0||bl<=0)continue;
  if(Math.abs(ax*bz-az*bx)/(al*bl)>tolerance)continue;
  const offset=Math.abs(ax*(b.z1-a.z1)-az*(b.x1-a.x1))/al;
  const combinedThickness=(a.t+b.t)/2;
  if(offset>=combinedThickness-tolerance)continue;
  const along=(x,z)=>((x-a.x1)*ax+(z-a.z1)*az)/al;
  const s=[along(b.x1,b.z1),along(b.x2,b.z2)].sort((x,y)=>x-y);
  const run=Math.min(al,s[1])-Math.max(0,s[0]);
  if(run<=minRun)continue;
  result.push({first:a.id,second:b.id,runM:r3(run),offsetM:r3(offset),
   physicalOverlapM:r3(combinedThickness-offset)});
 }
 return result;
}
export function firstFloorAudit(project){
 const model=project?.model||project;
 if(!model||!Array.isArray(model.openings)||!Array.isArray(model.rooms))
  throw new TypeError('Expected architectural model');
 const walls=new Map(model.walls.map(w=>[w.id,w]));
 const issues=parallelWallOverlaps(model).map(v=>({severity:'high',type:'wall-volume-overlap',...v}));
 for(const o of model.openings){
  const wall=walls.get(o.wall);
  if(!wall){issues.push({severity:'high',type:'orphan-opening',id:o.id});continue;}
  const len=Math.hypot(wall.x2-wall.x1,wall.z2-wall.z1);
  if(o.offset-o.width/2<-.001||o.offset+o.width/2>len+.001)
   issues.push({severity:'high',type:'opening-out-of-wall',id:o.id});
 }
 return {counts:{walls:model.walls.length,openings:model.openings.length,
  rooms:model.rooms.length,stairs:model.stairs?.length||0},
  issues,requiresReview:issues.length>0};
}
