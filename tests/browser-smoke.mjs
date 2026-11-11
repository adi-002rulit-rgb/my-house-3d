import fs from 'node:fs';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';

const host=process.env.TEST_URL||'http://127.0.0.1:8765';
fs.mkdirSync('artifacts',{recursive:true});
const browser=await chromium.launch({
 headless:true,args:['--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']
});
try{
 for(const mode of ['desktop','mobile']){
  const isMobile=mode==='mobile';
  const context=await browser.newContext({
   viewport:isMobile?{width:393,height:852}:{width:1440,height:960},
   deviceScaleFactor:isMobile?2:1,
   isMobile,hasTouch:isMobile,acceptDownloads:true
  });
  const page=await context.newPage(),pageErrors=[];
  page.on('pageerror',e=>pageErrors.push(e.message));
  page.on('dialog',d=>d.accept());
  const response=await page.goto(host+'/editor.html',{waitUntil:'domcontentloaded',timeout:60000});
  assert.equal(response.status(),200,mode+' HTML load');
  await page.waitForFunction(()=>document.querySelectorAll('#objectList button').length>=15,
   null,{timeout:45000});
  await page.screenshot({path:'artifacts/editor-'+mode+'.png',fullPage:true});
  await page.locator('#viewHall').click();
  await page.waitForTimeout(500);
  await page.screenshot({path:'artifacts/hall-'+mode+'.png',fullPage:true});
  const downloaded=page.waitForEvent('download');
  await page.locator('#export').click();
  const download=await downloaded;
  const content=fs.readFileSync(await download.path(),'utf8');
  const model=JSON.parse(content);
  assert.equal(model.openings.find(x=>x.id==='stairArch').type,'passage');
  assert.equal(model.stairs.length,1);
  assert.equal(model.rooms.length,7);

  // Test semantic edits and browser persistence, not just static screenshots.
  const state=()=>page.evaluate(()=>JSON.parse(
   localStorage.getItem('adkh-house-parametric-editor-v1')));
  await page.locator('#objectList button').filter({hasText:'Открытый проход в спальню'}).first().click();
  await page.locator('#duplicate').click();
  let updated=await state();
  assert.equal(updated.openings.filter(o=>o.type==='passage').length,2,
   'duplicate passage must stay in openings, not furniture');
  assert.equal(updated.furniture.length,5,'no invalid passage furniture');
  await page.locator('#undo').click();
  updated=await state();
  assert.equal(updated.openings.filter(o=>o.type==='passage').length,1,
   'undo must restore single passage');
  await page.locator('#redo').click();
  assert.equal((await state()).openings.filter(o=>o.type==='passage').length,2);
  await page.locator('#undo').click();

  await page.locator('#room').selectOption('bed');
  await page.locator('#floorPattern').selectOption('tile');
  assert.equal(await page.locator('#room').inputValue(),'bed',
   'room selection must persist after changing floor finish');
  assert.equal((await state()).rooms.find(r=>r.id==='bed').floorPattern,'tile');
  await page.locator('#snapshot').click();
  await page.locator('#floorPattern').selectOption('plank');
  await page.locator('#restoreSnapshot').click();
  assert.equal((await state()).rooms.find(r=>r.id==='bed').floorPattern,'tile');

  const corrupted=structuredClone(await state());
  corrupted.rooms.find(r=>r.id==='living').w=-1;
  await page.locator('#fileImport').setInputFiles({
   name:'corrupted-house.json',mimeType:'application/json',
   buffer:Buffer.from(JSON.stringify(corrupted))
  });
  assert.notEqual((await state()).rooms.find(r=>r.id==='living').w,-1,
   'invalid JSON must not replace working project');
  await page.locator('#floor2').click();
  await page.locator('#floor1').click();

  if(isMobile){
   await page.locator('#focusView').click();
   assert.ok(await page.evaluate(()=>document.body.classList.contains('focus3d')));
   assert.equal(await page.locator('#pane2d').evaluate(x=>getComputedStyle(x).display),'none');
   await page.screenshot({path:'artifacts/mobile-focus-3d.png'});
  }
  // Focus mode intentionally hides export buttons: leave it before exporting.
  if(isMobile)await page.locator('#focusView').click();
  // Editor publishes an actual shared contract snapshot without changing geometry.
  const shared=await page.evaluate(()=>JSON.parse(localStorage.getItem('adkh-house-shared-project-v1')));
  assert.equal(shared.format,'adkh-house-project');
  assert.equal(shared.model.stairs.length,1);
  assert.equal(shared.model.rooms.length,7);
  const sharedDownload=page.waitForEvent('download',{timeout:10000});
  await page.locator('#sharedExport').click();
  let downloadedShared;
  try{
   downloadedShared=JSON.parse(fs.readFileSync(await (await sharedDownload).path(),'utf8'));
  }catch(err){
   throw Error(mode+' shared export failed: '+await page.locator('#status').innerText()+'; '+err.message);
  }
  assert.equal(downloadedShared.formatVersion,1);
  assert.deepEqual(downloadedShared.model,await state());
  // Showroom reads shared data but must not silently apply its geometry.
  const presentation=await page.goto(host+'/',{waitUntil:'domcontentloaded',timeout:60000});
  assert.equal(presentation.status(),200,mode+' showroom HTML load');
  await page.waitForFunction(()=>document.getElementById('loading').style.display==='none',
   null,{timeout:60000});
  await page.evaluate(()=>document.getElementById('sharedProjectOpen').click());
  assert.match(await page.locator('#sharedProjectSummary').innerText(),/Помещений: 7/);
  assert.match(await page.locator('#sharedProjectPanel').innerText(),/прежнюю геометрию/);
  // From the same editor snapshot, construct a separately rendered architecture.
  await page.evaluate(()=>document.getElementById('syncedArchitecture').click());
  await page.waitForFunction(()=>document.body.dataset.architectureMode==='synced',{timeout:15000}).catch(async err=>{throw Error(mode+' synced mode: '+await page.locator('#toast').innerText()+'; '+err.message)});
  assert.equal(await page.locator('body').getAttribute('data-architecture-wall-count'),'13');
  assert.equal(await page.locator('body').getAttribute('data-architecture-display-y-offset'),'-0.6');
  assert.equal(await page.locator('body').getAttribute('data-architecture-openings'),'12');
  assert.equal(await page.locator('#legacyArchitecture').isHidden(),false);
  await page.screenshot({path:'artifacts/synced-house-'+mode+'.png'});
  // A changed dimension must actually change the rendered source primitives.
  const oldWall=await page.locator('body').getAttribute('data-architecture-first-wall');
  await page.evaluate(()=>{
   const key='adkh-house-shared-project-v1';
   const p=JSON.parse(localStorage.getItem(key));
   p.model.walls.find(w=>w.id==='front').x1=.2;
   localStorage.setItem(key,JSON.stringify(p));
   document.getElementById('sharedProjectOpen').click();
   document.getElementById('syncedArchitecture').click();
  });
  const newWall=await page.locator('body').getAttribute('data-architecture-first-wall');
  assert.notEqual(newWall,oldWall,'architectural coordinates must respond to editor JSON changes');
  await page.evaluate(()=>document.getElementById('legacyArchitecture').click());
  assert.equal(await page.locator('body').getAttribute('data-architecture-mode'),null);
  assert.equal(await page.locator('#syncedArchitecture').isHidden(),false);

  assert.equal(pageErrors.length,0,mode+' page errors: '+pageErrors.join('; '));
  await context.close();
  console.log(mode+': browser smoke passed');
 }
}finally{await browser.close()}
