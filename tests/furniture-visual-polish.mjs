import assert from 'node:assert/strict';
import fs from 'node:fs';
import {FURNITURE_PROFILES,furnitureProfile,furnitureDesignIds,furnitureFinish}
 from '../shared/furniture-designs.mjs';
import {DEFAULT_PRESENTATION_FURNITURE,layoutSafetyAudit} from '../shared/presentation-furniture.mjs';
import {APPROVED_HOUSE_V1} from '../shared/approved-house-v1.mjs';
assert.deepEqual(furnitureDesignIds,['minimal','warm','classic','graphite']);
for(const category of ['seat','table','bed','cabinet']){
 const silhouettes=new Set(furnitureDesignIds.map(id=>furnitureProfile(id)[category]));
 assert.equal(silhouettes.size,4,category+' must offer four distinct shapes');
}
assert.throws(()=>furnitureProfile('fake'));
for(const id of furnitureDesignIds)for(const item of DEFAULT_PRESENTATION_FURNITURE){
 const finish=furnitureFinish(item,id);
 assert.equal(finish.style,id);
}
assert.equal(DEFAULT_PRESENTATION_FURNITURE.length,13);
assert.equal(layoutSafetyAudit(DEFAULT_PRESENTATION_FURNITURE).ok,true);
assert.equal(APPROVED_HOUSE_V1.model.walls.length,13);
const src=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
for(const signature of [
 "profile.seat==='low-modular'",
 "profile.seat==='rounded-cushions'",
 "profile.seat==='framed-rolled'",
 "profile.table==='pedestal'",
 "profile.table==='apron'",
 "profile.table==='sled'",
 "profile.bed==='upholstered'",
 "profile.bed==='panelled'",
 "profile.bed==='platform'",
 "profile.cabinet==='fine-wood'",
 "profile.cabinet==='inset'",
 "profile.cabinet==='ribbon'",
 'document.body.dataset.furnitureProfile=furnitureProfile(id).seat'
])assert.ok(src.includes(signature),signature);
assert.match(src,/for\(const piece of presentationFurniture\)drawPresentationFurniture\(piece\)/);
assert.ok(!src.includes('setLayoutGeometryFromFurnitureProfile'));
console.log('PASS: four visibly different silhouettes, valid 13-piece model, unchanged house');
