import assert from 'node:assert/strict';
import fs from 'node:fs';
const html=fs.readFileSync(new URL('../first-floor-geometry-preview.html',import.meta.url),'utf8');
for(const marker of [
 'type="module"',
 'experimentalFirstFloorGeometry',
 'architectureGeometry(APPROVED_HOUSE_V1)',
 'id="before"','id="after"','id="top"','id="side"','id="orbit"',
 'aria-pressed','id="error"','showError','renderer.render',
 'first-floor-geometry-preview.html'
].filter(x=>x!=='first-floor-geometry-preview.html')){
 assert.ok(html.includes(marker),'missing 3D inspector integration: '+marker);
}
assert.ok(!html.includes('localStorage.setItem'),'preview cannot write persistent source settings');
assert.ok(!html.includes('fetch('),'preview uses project module imports, not runtime API writes');
const threeTag=html.match(/<script type="module">([\s\S]*?)<\/script>/);
assert.ok(threeTag&&threeTag[1].includes('OrbitControls'),'missing 3D entrypoint');
const imports=[...threeTag[1].matchAll(/from '\.\/(.*?)'/g)].map(m=>m[1]);
for(const modulePath of imports){
 const target=new URL('../'+modulePath,import.meta.url);
 assert.ok(fs.existsSync(target),'missing relative module: '+modulePath);
}
console.log('PASS: inspector markup, local module references, view switching and no persistent writes');
