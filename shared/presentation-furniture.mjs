// Independent, presentation-only furnishing arrangements.
// No walls, approved apertures, stairs or structural editor JSON are altered.
export const FURNITURE_LAYOUT_VERSION=2;
export const FURNITURE_ROOM_BOUNDS={
 living:[.64,9.14,-.61,5.12],
 kitchen:[13.88,18.54,-.58,5.13],
 bedroom:[.58,5.40,-5.10,-1.20]
};
// Coordinates are in metres; designs are proposals, not field measurements.
export const DEFAULT_PRESENTATION_FURNITURE=[
 {id:'livingSofa',name:'Диван зала',room:'living',type:'sofa',x:4.72,z:3.80,w:3.45,d:1.06,h:.85,rot:180,color:'#d8cbbb'},
 {id:'livingCoffee',name:'Журнальный стол',room:'living',type:'table',x:4.72,z:2.18,w:1.55,d:.84,h:.46,rot:0,color:'#ad9b86'},
 {id:'livingChairL',name:'Кресло слева',room:'living',type:'chair',x:1.62,z:2.35,w:.82,d:.86,h:.83,rot:270,color:'#b8b5ad'},
 {id:'livingChairR',name:'Кресло справа',room:'living',type:'chair',x:7.85,z:2.40,w:.82,d:.86,h:.83,rot:90,color:'#b8b5ad'},
 {id:'livingTV',name:'ТВ-консоль',room:'living',type:'tv',x:4.74,z:-.29,w:2.55,d:.35,h:.58,rot:0,color:'#67564b'},
 // The rear wall is opposite the 3-m courtyard window. The two side runs
 // face each other without blocking the kitchen door on x=13.52.
 {id:'kitchenRear',name:'Кухня · задняя секция с мойкой',room:'kitchen',type:'kitchen-run',x:16.23,z:-.22,w:3.10,d:.62,h:.93,rot:0,color:'#d2c5b5'},
 {id:'kitchenLeft',name:'Кухня · левая секция / холодильник',room:'kitchen',type:'kitchen-run',x:14.68,z:1.04,w:.62,d:2.00,h:.93,rot:0,color:'#d2c5b5'},
 {id:'kitchenRight',name:'Кухня · правая секция / варочная',room:'kitchen',type:'kitchen-run',x:17.78,z:1.04,w:.62,d:2.00,h:.93,rot:0,color:'#d2c5b5'},
 {id:'kitchenDining',name:'Обеденный стол',room:'kitchen',type:'table',x:16.20,z:3.87,w:2.05,d:1.02,h:.75,rot:0,color:'#bca994'},
 {id:'bedroomBed',name:'Кровать спальни',room:'bedroom',type:'bed',x:2.95,z:-3.54,w:2.24,d:2.16,h:.65,rot:0,color:'#d4c9bd'},
 {id:'bedroomNightL',name:'Тумба слева',room:'bedroom',type:'cabinet',x:1.16,z:-4.19,w:.57,d:.47,h:.52,rot:0,color:'#a99882'},
 {id:'bedroomNightR',name:'Тумба справа',room:'bedroom',type:'cabinet',x:4.64,z:-4.19,w:.57,d:.47,h:.52,rot:0,color:'#a99882'},
 {id:'bedroomWardrobe',name:'Шкаф спальни',room:'bedroom',type:'cabinet',x:5.05,z:-3.15,w:.56,d:1.50,h:2.10,rot:0,color:'#c3ad98'}
];
const round=n=>Math.round(n*1000)/1000;
// Rotation-aware bounding boxes for exact top-down room and furniture checks.
export function furnitureBounds(item){
 const a=(item.rot||0)*Math.PI/180,c=Math.abs(Math.cos(a)),v=Math.abs(Math.sin(a));
 const hw=(item.w*c+item.d*v)/2,hz=(item.d*c+item.w*v)/2;
 return {x1:item.x-hw,x2:item.x+hw,z1:item.z-hz,z2:item.z+hz};
}
const uJoint=(a,b)=>{
 const pair=[a.id,b.id].sort().join('|');
 return pair==='kitchenLeft|kitchenRear'||pair==='kitchenRear|kitchenRight';
};
export function furnitureCollisionAudit(items){
 const issues=[];
 if(!Array.isArray(items))return {ok:false,issues:[{type:'invalid'}]};
 for(let i=0;i<items.length;i++)for(let j=i+1;j<items.length;j++){
  const a=items[i],b=items[j];if(a.room!==b.room)continue;
  const A=furnitureBounds(a),B=furnitureBounds(b);
  const dx=Math.min(A.x2,B.x2)-Math.max(A.x1,B.x1);
  const dz=Math.min(A.z2,B.z2)-Math.max(A.z1,B.z1);
  // Two 5cm rear/side corner joins are deliberate: continuous U-shaped joinery.
  if(dx<=.002||dz<=.002)continue;
  if(uJoint(a,b)&&dx<=.40&&dz<=.085)continue;
  issues.push({type:'furniture-overlap',a:a.id,b:b.id,
   overlapX:round(dx),overlapZ:round(dz)});
 }
 return {ok:issues.length===0,issues};
}
export function layoutSafetyAudit(items){
 if(!validateFurnitureLayout(items))return {ok:false,reason:'invalid-furniture'};
 const kitchen=kitchenLayoutAudit(items);
 if(!kitchen.ok)return {ok:false,reason:'kitchen-clearances',kitchen};
 const collisions=furnitureCollisionAudit(items);
 if(!collisions.ok)return {ok:false,reason:'furniture-overlap',collisions};
 return {ok:true,kitchen,collisions};
}
export function validateFurnitureLayout(items){
 if(!Array.isArray(items)||items.length!==DEFAULT_PRESENTATION_FURNITURE.length)return false;
 const ids=new Set();
 for(const item of items){
  if(!item||typeof item!=='object'||ids.has(item.id))return false;
  ids.add(item.id);
  const original=DEFAULT_PRESENTATION_FURNITURE.find(v=>v.id===item.id);
  if(!original||item.type!==original.type||item.room!==original.room)return false;
  for(const key of ['x','z','rot'])
   if(typeof item[key]!=='number'||!Number.isFinite(item[key]))return false;
  if(!Number.isInteger(item.rot)||item.rot%15!==0)return false;
  if(!furnitureFitsRoom({...original,x:item.x,z:item.z,rot:item.rot}))return false;
 }
 return true;
}
export function furnitureFitsRoom(item){
 const room=FURNITURE_ROOM_BOUNDS[item.room];
 if(!room)return false;
 const b=furnitureBounds(item);
 return b.x1>=room[0]-1e-5&&b.x2<=room[1]+1e-5&&
  b.z1>=room[2]-1e-5&&b.z2<=room[3]+1e-5;
}
export function normalizedFurnitureLayout(items){
 if(!validateFurnitureLayout(items))throw Error('Invalid or out-of-bounds furniture layout');
 return DEFAULT_PRESENTATION_FURNITURE.map(def=>{
  const item=items.find(v=>v.id===def.id);
  return {...def,x:round(item.x),z:round(item.z),rot:item.rot};
 });
}
// Keep the existing household's individually adjusted living/bedroom pieces
// when upgrading from the 11-piece presentation layout. Old kitchen counter
// is replaced by the new three runs; dining moves out of their circulation.
export function migrateFurnitureLayout(items){
 if(validateFurnitureLayout(items)){
  // Saved JSON contains only IDs, positions and angles. Reattach the immutable
  // catalogue dimensions BEFORE any width/depth dependent safety checks.
  const normalized=normalizedFurnitureLayout(items);
  return kitchenLayoutAudit(normalized).ok&&furnitureCollisionAudit(normalized).ok?
   normalized:null;
 }
 if(!Array.isArray(items)||items.length!==11)return null;
 const oldIds=new Set(['livingSofa','livingCoffee','livingChairL','livingChairR','livingTV',
  'kitchenCounter','kitchenDining','bedroomBed','bedroomNightL','bedroomNightR','bedroomWardrobe']);
 if(new Set(items.map(x=>x?.id)).size!==11||items.some(x=>!oldIds.has(x?.id)))return null;
 const migrated=freshFurnitureLayout();
 for(const item of migrated){
  if(item.room==='kitchen')continue;
  const previous=items.find(x=>x.id===item.id);
  if(previous?.type!==item.type||previous?.room!==item.room||
    !Number.isFinite(previous.x)||!Number.isFinite(previous.z)||
    !Number.isInteger(previous.rot)||previous.rot%15!==0)return null;
  const candidate={...item,x:previous.x,z:previous.z,rot:previous.rot};
  if(!furnitureFitsRoom(candidate))return null;
  Object.assign(item,{x:previous.x,z:previous.z,rot:previous.rot});
 }
 return kitchenLayoutAudit(migrated).ok&&furnitureCollisionAudit(migrated).ok?
  normalizedFurnitureLayout(migrated):null;
}
export function kitchenLayoutAudit(items=DEFAULT_PRESENTATION_FURNITURE){
 const get=id=>items.find(x=>x.id===id);
 const rear=get('kitchenRear'),left=get('kitchenLeft'),right=get('kitchenRight'),dining=get('kitchenDining');
 if(!rear||!left||!right||!dining)return {ok:false,reason:'missing section'};
 const B=furnitureBounds(rear),L=furnitureBounds(left),R=furnitureBounds(right),D=furnitureBounds(dining);
 // Kitchen units have fixed appliance/facing directions. Reorienting an entire
 // side run would place the hob, sink or fronts on the wrong wall.
 const orientation=[rear,left,right].every(v=>v.rot===0);
 const aisle=R.x1-L.x2;
 const diningGap=D.z1-Math.max(L.z2,R.z2);
 const doorClear=L.x1-13.52;
 const windowClear=5.5-D.z2;
 return {ok:orientation&&aisle>=1.1&&diningGap>=.9&&doorClear>=.8&&windowClear>=.75&&
  Math.abs(B.x1-left.x)<.08&&Math.abs(B.x2-right.x)<.08&&
  L.z1<=B.z2&&R.z1<=B.z2&&
  [rear,left,right,dining].every(furnitureFitsRoom),
  orientation,aisle,diningGap,doorClear,windowClear};
}
export const freshFurnitureLayout=()=>DEFAULT_PRESENTATION_FURNITURE.map(item=>({...item}));
