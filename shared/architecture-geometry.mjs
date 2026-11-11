/**
 * ADKH House v2B: deterministic, render-library-independent architectural primitives.
 * The editor JSON is the sole authority for dimensions. All units are metres.
 * No writes or mutations to source objects.
 */
import {parseSharedProject} from './project-contract.mjs';
const rect=(id,kind,x,y,z,w,h,d,meta={})=>({id,kind,x,y,z,w,h,d,...meta});
const between=(n,min,max)=>Math.max(min,Math.min(max,n));
export function staircaseLayout(o,height){
 const w=o.width,right=o.x+w/2,bridge=o.upper,left=right-2*w-bridge;
 const rear=o.back-w/2,front=o.back+w/2,backRun=o.returnRun||o.lower;
 const total=Math.max(16,Math.round(height/.156)),turnN=3,straight=total-2*turnN;
 const firstN=Math.max(3,Math.round(straight*.28)),midN=Math.max(2,Math.round(straight*.17));
 const lastN=straight-firstN-midN,visibleLastN=Math.max(1,lastN-4);
 const rise=height/total,upperStart=(firstN+midN+2*turnN)*rise;
 const cast=(cx,cz,angle)=>{
  const dx=Math.cos(angle),dz=Math.sin(angle),r=w/Math.max(Math.abs(dx),Math.abs(dz));
  return [cx+dx*r,cz+dz*r];
 };
 const fan=(cx,cz,start)=>Array.from({length:turnN},(_,i)=>{
  const a=start-i*Math.PI/(2*turnN),b=start-(i+1)*Math.PI/(2*turnN);
  return [[cx,cz],cast(cx,cz,a),cast(cx,cz,(a+b)/2),cast(cx,cz,b)];
 });
 return {w,right,left,bridge,rear,front,backRun,total,turnN,firstN,midN,lastN,
  visibleLastN,rise,upperStart,upperRise:(height-upperStart)/visibleLastN,
  firstTurn:fan(right-w,front,0),secondTurn:fan(left+w,front,-Math.PI/2)};
}
export function architectureGeometry(input){
 const {model:m}=parseSharedProject(input),segments=[],openings=[],floors=[],treads=[],slabs=[];
 const eps=1e-9;
 for(const r of m.rooms)floors.push(rect(r.id,'floor',r.x+r.w/2,m.elevation+.015,r.z+r.h/2,r.w,.13,r.h,{color:r.floor}));
 for(const wall of m.walls){
  const len=Math.hypot(wall.x2-wall.x1,wall.z2-wall.z1);
  const angle=-Math.atan2(wall.z2-wall.z1,wall.x2-wall.x1);
  const entries=m.openings.filter(o=>o.wall===wall.id).map(o=>({...o,start:o.offset-o.width/2,end:o.offset+o.width/2}))
    .sort((a,b)=>a.start-b.start);
  // Reject unsupported crossing apertures rather than generating overlapping solids.
  let cursor=0;
  for(const o of entries){
   if(o.start<cursor-0.001)throw Error('Пересекаются проёмы в стене: '+wall.id);
   const piece=(a,b,lo,hi)=>{
    if(b-a<=.01||hi-lo<=.02)return;
    segments.push(rect(wall.id,'wall',wall.x1+Math.cos(-angle)*(a+b)/2,
     m.elevation+(lo+hi)/2,wall.z1-Math.sin(angle)*(a+b)/2,b-a,hi-lo,wall.t,
     {angle,sourceWall:wall.id,start:a,end:b,from:lo,to:hi}));
   };
   piece(cursor,o.start,0,m.height);
   piece(o.start,o.end,0,o.sill);
   piece(o.start,o.end,o.head,m.height);
   const c=o.offset;
   openings.push({id:o.id,type:o.type,wall:o.wall,width:o.width,sill:o.sill,head:o.head,
    leaves:o.leaves||1,angle,x:wall.x1+(wall.x2-wall.x1)*c/len,
    z:wall.z1+(wall.z2-wall.z1)*c/len,y:m.elevation});
   cursor=o.end;
  }
  if(cursor<len-eps){
   const a=cursor,b=len;
   segments.push(rect(wall.id,'wall',wall.x1+(wall.x2-wall.x1)*(a+b)/(2*len),
    m.elevation+m.height/2,wall.z1+(wall.z2-wall.z1)*(a+b)/(2*len),
    b-a,m.height,wall.t,{angle,sourceWall:wall.id,start:a,end:b,from:0,to:m.height}));
  }
 }
 for(const s of m.stairs){
  if(Math.abs(s.rot)>1e-8)throw Error('Поворот лестницы пока не поддерживается в синхронном режиме');
  const g=staircaseLayout(s,m.height);
  if(g.bridge<=.15||g.lastN<=0)throw Error('Недостаточные размеры лестницы');
  const d1=s.lower/g.firstN,d2=g.bridge/g.midN,d3=g.backRun/g.lastN;
  for(let i=0;i<g.firstN;i++)treads.push(rect(s.id,'tread',g.right-g.w/2,
   m.elevation+(i+1)*g.rise-.02,g.front+s.lower-(i+.5)*d1,g.w-.02,.043,Math.max(.01,d1-.012),{flight:1,step:i+1}));
  let level=g.firstN;
  for(const [turn,polys] of [[1,g.firstTurn],[2,g.secondTurn]]){
   for(const poly of polys){
    level++;
    treads.push({id:s.id,kind:'winder',turn,step:level,
     polygon:poly.map(p=>[...p]),y:m.elevation+level*g.rise-.036,thickness:.042});
   }
   if(turn===1){
    for(let i=0;i<g.midN;i++)treads.push(rect(s.id,'tread',
     g.right-g.w-(i+.5)*d2,m.elevation+(level+i+1)*g.rise-.02,(g.rear+g.front)/2,
     Math.max(.01,d2-.012),.043,g.w-.02,{flight:2,step:i+1}));
    level+=g.midN;
   }
  }
  for(let i=0;i<g.visibleLastN;i++)treads.push(rect(s.id,'tread',g.left+g.w/2,
    m.elevation+g.upperStart+(i+1)*g.upperRise-.02,g.front+(i+.5)*d3,
    g.w-.02,.043,Math.max(.01,d3-.012),{flight:3,step:i+1}));
  // Synced return slab: same four hidden upper treads and last visible tread position as editor.
  const from=g.front+d3*g.visibleLastN,to=g.front+g.backRun;
  if(to-from>.02)slabs.push(rect(s.id,'stair-slab',g.left+g.w/2,
   m.elevation+m.height-.09,(from+to)/2,g.w,.18,to-from));
 }
 return {schema:1,sourceHeight:m.height,elevation:m.elevation,
  segments,openings,floors,treads,slabs,counts:{
   walls:m.walls.length,openings:m.openings.length,rooms:m.rooms.length,stairs:m.stairs.length
  }};
}
