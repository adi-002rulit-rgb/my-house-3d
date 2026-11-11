// Presentation furniture finishes, independent of floor plan and architecture.
// Four design concepts intentionally vary upholstery, joinery, counter stone
// and accents; changing a concept never edits coordinates or room boundaries.
export const FURNITURE_DESIGNS=Object.freeze({
 minimal:{name:'01 · Светлый минимализм',description:'Молочный текстиль, ясень, белый камень',
  fabric:'#dfdfd9',fabricAccent:'#f2f0e9',wood:'#bda98f',woodDark:'#837263',
  cabinetry:'#dfdcd4',counter:'#e7e5df',metal:'#343e42',glass:'#293537',
  rug:'#d2c6b8',roughness:.74,leg:'straight',handle:'hidden'},
 warm:{name:'02 · Тёплый премиум',description:'Кашемир, орех, тёплый травертин',
  fabric:'#c7b4a0',fabricAccent:'#e8dccd',wood:'#95704e',woodDark:'#674d3d',
  cabinetry:'#c6b5a1',counter:'#d2c0a8',metal:'#a58b61',glass:'#303b39',
  rug:'#b8a48e',roughness:.59,leg:'taper',handle:'brass'},
 classic:{name:'03 · Современная классика',description:'Айвори, филёнки, светлый дуб, латунь',
  fabric:'#e7ded1',fabricAccent:'#f6eee3',wood:'#b5a187',woodDark:'#8a7864',
  cabinetry:'#e5ddce',counter:'#e6dfd3',metal:'#a58d6d',glass:'#343538',
  rug:'#cec4b7',roughness:.65,leg:'classic',handle:'brass'},
 graphite:{name:'04 · Графит и камень',description:'Антрацит, дымчатый дуб, светлый мрамор',
  fabric:'#696b69',fabricAccent:'#a7a7a0',wood:'#565049',woodDark:'#353535',
  cabinetry:'#636765',counter:'#c8c5c0',metal:'#171d20',glass:'#13191a',
  rug:'#8e8a82',roughness:.49,leg:'slim',handle:'black'}
});
// Explicit profiles ensure the four options differ in geometry, not only hue.
export const FURNITURE_PROFILES=Object.freeze({
 minimal:Object.freeze({seat:'low-modular',table:'four-straight',bed:'platform',cabinet:'flush'}),
 warm:Object.freeze({seat:'rounded-cushions',table:'pedestal',bed:'upholstered',cabinet:'fine-wood'}),
 classic:Object.freeze({seat:'framed-rolled',table:'apron',bed:'panelled',cabinet:'inset'}),
 graphite:Object.freeze({seat:'floating-linear',table:'sled',bed:'floating',cabinet:'ribbon'})
});
export function furnitureProfile(id){
 if(!isFurnitureDesign(id))throw Error('Invalid furniture profile');
 return FURNITURE_PROFILES[id];
}
export const DEFAULT_FURNITURE_DESIGN='minimal';
export const furnitureDesignIds=Object.keys(FURNITURE_DESIGNS);
export function isFurnitureDesign(id){
 return typeof id==='string'&&Object.hasOwn(FURNITURE_DESIGNS,id);
}
export function furnitureFinish(item,id){
 if(!isFurnitureDesign(id))throw Error('Unsupported furniture design');
 if(!item||!['living','bedroom','kitchen'].includes(item.room))
  throw Error('Unrecognized furniture');
 const p=FURNITURE_DESIGNS[id],isKitchen=item.room==='kitchen';
 return {
  main:isKitchen?p.cabinetry:item.type==='sofa'||item.type==='chair'||item.type==='bed'?p.fabric:p.wood,
  accent:p.fabricAccent,wood:p.wood,woodDark:p.woodDark,
  counter:p.counter,metal:p.metal,screen:p.glass,rug:p.rug,
  roughness:p.roughness,leg:p.leg,handle:p.handle,style:id
 };
}
