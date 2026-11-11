/**
 * ADKH House shared project contract v1.
 * Pure data module consumed by both editor and showroom.
 * The showroom's independent presentation meshes are NOT automatically rebuilt.
 */
export const SHARED_FORMAT='adkh-house-project';
export const SHARED_FORMAT_VERSION=1;
export const SHARED_STORAGE_KEY='adkh-house-shared-project-v1';
export const MAX_SHARED_BYTES=2_000_000;

const isObj=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
const num=value=>typeof value==='number'&&Number.isFinite(value);
const bounded=(value,min,max)=>num(value)&&value>=min&&value<=max;

export function validateEditorModel(model){
 if(!isObj(model)||model.version!==1||typeof model.title!=='string'||model.title.length>150)
  throw Error('Неподдерживаемая версия или название модели');
 const limits={walls:150,openings:150,rooms:50,furniture:150,stairs:20};
 for(const [key,max] of Object.entries(limits)){
  if(!Array.isArray(model[key])||model[key].length>max)throw Error('Неверный список: '+key);
 }
 if(!bounded(model.height,2.5,5)||!bounded(model.elevation,0,1.5))
  throw Error('Некорректные высотные отметки');
 const ids=new Set(),walls=new Map();
 for(const [collection,items] of Object.entries(limits)){
  for(const item of model[collection]){
   if(!isObj(item)||typeof item.id!=='string'||!item.id||item.id.length>100
    ||ids.has(item.id)||typeof item.name!=='string'||item.name.length>100)
    throw Error('Некорректный или повторяющийся ID');
   ids.add(item.id);
   if(collection==='walls'){
    if(item.type!=='wall'||!['x1','z1','x2','z2'].every(k=>bounded(item[k],-200,200))
     ||!bounded(item.t,.05,1.5)||Math.hypot(item.x2-item.x1,item.z2-item.z1)<.15)
     throw Error('Некорректная стена');
    walls.set(item.id,item);
   }
   if(collection==='rooms'){
    if(!bounded(item.x,-200,200)||!bounded(item.z,-200,200)
     ||!bounded(item.w,.1,100)||!bounded(item.h,.1,100)
     ||!/^#[0-9a-fA-F]{6}$/.test(item.wall)||!/^#[0-9a-fA-F]{6}$/.test(item.floor)
     ||(item.floorPattern!==undefined&&!['solid','tile','plank','eng_herringbone','fr_herringbone'].includes(item.floorPattern)))
     throw Error('Некорректная комната');
   }
   if(collection==='furniture'){
    if(!['sofa','table','bed','cabinet','chair','island','rug','plant'].includes(item.type)
     ||!bounded(item.x,-200,200)||!bounded(item.z,-200,200)
     ||!['w','d','h'].every(k=>bounded(item[k],.01,30))
     ||!bounded(item.rot,-100,100))throw Error('Некорректная мебель');
   }
   if(collection==='stairs'){
    if(item.type!=='stair'||!['x','z','back'].every(k=>bounded(item[k],-200,200))
     ||!bounded(item.width,.55,4)||!bounded(item.lower,.25,20)
     ||!bounded(item.upper,.25,20)||!bounded(item.rot,-100,100)
     ||(item.returnRun!==undefined&&!bounded(item.returnRun,.25,20)))
     throw Error('Некорректная лестница');
   }
  }
 }
 for(const op of model.openings){
  const w=walls.get(op.wall);
  if(!['door','window','passage'].includes(op.type)||!w
   ||!bounded(op.width,.31,20)||!bounded(op.offset,0,200)
   ||!bounded(op.sill,0,model.height)||!bounded(op.head,op.sill+.2,model.height)
   ||(op.leaves!==undefined&&![1,2].includes(op.leaves))
   ||op.offset-op.width/2<-.001
   ||op.offset+op.width/2>Math.hypot(w.x2-w.x1,w.z2-w.z1)+.001)
   throw Error('Некорректный проём');
 }
 return true;
}

export function createSharedProject(model){
 validateEditorModel(model);
 // JSON round trip yields a detached snapshot and rejects unsupported values.
 const detached=JSON.parse(JSON.stringify(model));
 const result={format:SHARED_FORMAT,formatVersion:SHARED_FORMAT_VERSION,model:detached};
 if(JSON.stringify(result).length>MAX_SHARED_BYTES)throw Error('Слишком большой проект');
 return result;
}

export function parseSharedProject(input){
 if(!isObj(input)||input.format!==SHARED_FORMAT||input.formatVersion!==SHARED_FORMAT_VERSION)
  throw Error('Неподдерживаемый формат общего проекта');
 validateEditorModel(input.model);
 if(JSON.stringify(input).length>MAX_SHARED_BYTES)throw Error('Слишком большой проект');
 return createSharedProject(input.model);
}

export function getSharedSummary(input){
 const shared=parseSharedProject(input),m=shared.model;
 return {
  title:m.title,height:m.height,elevation:m.elevation,
  walls:m.walls.length,openings:m.openings.length,
  rooms:m.rooms.length,stairs:m.stairs.length,furniture:m.furniture.length,
  roomNames:m.rooms.map(r=>r.name)
 };
}
