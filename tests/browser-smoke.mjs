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
  // Cold open directly on the public presentation, without visiting editor.
  // This is exactly the visitor flow on a different laptop/device.
  const cold=await page.goto(host+'/',{waitUntil:'domcontentloaded',timeout:60000});
  assert.equal(cold.status(),200,mode+' standalone showroom');
  await page.waitForFunction(()=>document.getElementById('loading').style.display==='none',
   null,{timeout:18000}).catch(async error=>{
    const debug=await page.evaluate(()=>({
     loading:document.getElementById('loading')?.style.display,
     error:document.getElementById('error')?.style.display,
     status:document.getElementById('status')?.textContent,
     ready:document.readyState
    }));
    throw Error(mode+' showroom failed to load: '+JSON.stringify(debug)+
      '; browser errors='+pageErrors.join(' | ')+'; '+error.message);
   });
  // Architectural door positions are unchanged. Test per-room hinge, angle and
  // swing controls without relying on a particular initial design tab.
  await page.locator('#clientDoorTarget').evaluate(el=>{
   el.value='bedroom';el.dispatchEvent(new Event('change',{bubbles:true}));
  });
  assert.equal(await page.locator('#clientDoorHinge').isDisabled(),false);
  await page.locator('#clientDoorHinge').evaluate(el=>{
   el.value='right';el.dispatchEvent(new Event('change',{bubbles:true}));
  });
  await page.locator('#clientDoorSwing').evaluate(el=>{
   el.value='hall';el.dispatchEvent(new Event('change',{bubbles:true}));
  });
  await page.locator('#clientDoorAngle').evaluate(el=>{
   el.value='45';el.dispatchEvent(new Event('input',{bubbles:true}));
  });
  assert.equal(await page.locator('#clientDoorHinge').inputValue(),'right');
  assert.equal(await page.locator('#clientDoorSwing').inputValue(),'hall');
  assert.equal(await page.locator('#clientDoorAngleLabel').innerText(),'45°');
  await page.locator('#clientDoorTarget').evaluate(el=>{
   el.value='living';el.dispatchEvent(new Event('change',{bubbles:true}));
  });
  assert.equal(await page.locator('#clientDoorHinge').isDisabled(),true,
   'double doors have fixed outer hinges');
  await page.screenshot({path:'artifacts/approved-door-presentation-'+mode+'.png'});
  // Editable showroom furniture must work without opening the technical editor.
  assert.equal(await page.locator('body').getAttribute('data-furniture-layout'),'editable-v1');
  assert.equal(await page.locator('body').getAttribute('data-furniture-count'),'11');
  await page.locator('#furnitureLaunch').click();
  assert.equal(await page.locator('#furniturePanel').isHidden(),false);
  assert.equal(await page.locator('#furnitureChoice option').count(),11);
  await page.locator('#furnitureChoice').selectOption('livingSofa');
  assert.equal(await page.locator('#furnitureXLabel').innerText(),'4.72 м');
  await page.locator('#furnitureX').evaluate(el=>{
   el.value='4.82';el.dispatchEvent(new Event('input',{bubbles:true}));
  });
  const storage=()=>page.evaluate(()=>JSON.parse(
    localStorage.getItem('adkh-house-presentation-furniture-v1')));
  assert.equal((await storage()).items.find(x=>x.id==='livingSofa').x,4.82);
  await page.locator('#furnitureRotation').evaluate(el=>{
   el.value='195';el.dispatchEvent(new Event('input',{bubbles:true}));
  });
  assert.equal((await storage()).items.find(x=>x.id==='livingSofa').rot,195);
  const layoutDownload=page.waitForEvent('download');
  await page.locator('#furnitureExport').click();
  const exportedFurniture=JSON.parse(fs.readFileSync(await (await layoutDownload).path(),'utf8'));
  assert.equal(exportedFurniture.format,'adkh-presentation-furniture');
  assert.equal(exportedFurniture.items.length,11);
  await page.locator('#furnitureReset').click();
  assert.equal((await storage()).items.find(x=>x.id==='livingSofa').x,4.72);
  await page.locator('#furnitureImportFile').setInputFiles({
   name:'my-furniture.json',mimeType:'application/json',
   buffer:Buffer.from(JSON.stringify(exportedFurniture))
  });
  await page.waitForFunction(()=>
   JSON.parse(localStorage.getItem('adkh-house-presentation-furniture-v1'))
    ?.items.find(x=>x.id==='livingSofa')?.x===4.82);
  const invalidFurniture=structuredClone(exportedFurniture);
  invalidFurniture.items.find(x=>x.id==='livingSofa').x=40;
  await page.locator('#furnitureImportFile').setInputFiles({
   name:'invalid-furniture.json',mimeType:'application/json',
   buffer:Buffer.from(JSON.stringify(invalidFurniture))
  });
  assert.equal((await storage()).items.find(x=>x.id==='livingSofa').x,4.82,
   'invalid furniture JSON cannot corrupt working arrangement');
  await page.screenshot({path:'artifacts/editable-furniture-'+mode+'.png'});
  await page.locator('#furnitureReset').click();
  await page.locator('#furnitureClose').click();
  assert.equal(await page.locator('#furniturePanel').isHidden(),true);
  // Stage 3C: a visitor can start a clean, guided presentation immediately.
  await page.locator('#guidedLaunch').click();
  assert.equal(await page.locator('body').getAttribute('data-guided-view'),'overview');
  assert.equal(await page.locator('#guidedBar').isHidden(),false);
  assert.equal(await page.locator('#showroom').evaluate(e=>getComputedStyle(e).display),'none');
  assert.equal(await page.locator('#guidedViews option').count(),10);
  await page.locator('#guidedViews').selectOption('stair');
  await page.waitForFunction(()=>document.body.dataset.guidedTransition==='false',
   null,{timeout:12000}).catch(async err=>{
    const debug=await page.evaluate(()=>({
     view:document.body.dataset.guidedView,
     transition:document.body.dataset.guidedTransition,
     tour:document.body.dataset.guidedTour,
     loading:document.getElementById('loading').style.display,
     bar:document.getElementById('guidedBarTitle').textContent
    }));
    throw Error(mode+' guided transition stalled: '+JSON.stringify(debug)+
     '; JS errors: '+pageErrors.join(' | ')+'; '+err.message);
   });
  assert.equal(await page.locator('body').getAttribute('data-guided-view'),'stair');
  await page.screenshot({path:'artifacts/3c-guided-stair-'+mode+'.png'});
  await page.locator('#guidedNext').click();
  assert.equal(await page.locator('body').getAttribute('data-guided-view'),'stairUpper');
  await page.waitForFunction(()=>document.body.dataset.guidedTransition==='false',
   null,{timeout:12000}).catch(async err=>{
    const debug=await page.evaluate(()=>({
     view:document.body.dataset.guidedView,
     transition:document.body.dataset.guidedTransition,
     tour:document.body.dataset.guidedTour,
     loading:document.getElementById('loading').style.display,
     bar:document.getElementById('guidedBarTitle').textContent
    }));
    throw Error(mode+' guided transition stalled: '+JSON.stringify(debug)+
     '; JS errors: '+pageErrors.join(' | ')+'; '+err.message);
   });
  await page.locator('#guidedReset').click();
  assert.equal(await page.locator('body').getAttribute('data-guided-view'),'overview');
  await page.locator('#guidedPlay').click();
  assert.equal(await page.locator('body').getAttribute('data-guided-tour'),'true');
  await page.waitForFunction(()=>document.body.dataset.guidedView==='hallway',
   null,{timeout:14000});
  assert.equal(await page.locator('body').getAttribute('data-guided-tour'),'true',
   'autotour should advance to the entrance and continue');
  if(isMobile)await page.touchscreen.tap(340,240);
  else await page.mouse.click(700,250);
  assert.equal(await page.locator('body').getAttribute('data-guided-tour'),'false',
   'manual interaction should interrupt guided autoplay');
  await page.locator('#guidedPlay').click();
  assert.equal(await page.locator('body').getAttribute('data-guided-tour'),'true');
  await page.locator('#guidedStop').click();
  assert.equal(await page.locator('body').getAttribute('data-guided-tour'),'false');
  await page.locator('#guidedDay').click();
  assert.match(await page.locator('#guidedDay').innerText(),/День/);
  await page.locator('#guidedDay').click();
  assert.match(await page.locator('#guidedDay').innerText(),/Вечер/);
  if(isMobile){
   const bounds=await page.locator('#guidedBar').evaluate(el=>({
    width:el.getBoundingClientRect().width,viewport:innerWidth,
    scrollWidth:el.scrollWidth,clientWidth:el.clientWidth
   }));
   assert.ok(bounds.width<=bounds.viewport,'mobile bar must fit screen');
   assert.ok(bounds.scrollWidth>=bounds.clientWidth,'mobile toolbar may scroll horizontally');
  }
  await page.locator('#guidedExit').click();
  assert.equal(await page.locator('#guidedBar').isHidden(),true);
  assert.equal(await page.locator('#showroom').evaluate(e=>getComputedStyle(e).display)!=='none',true);
  assert.equal(await page.locator('body').getAttribute('data-presentation-stair'),'editor-approved');
  assert.equal(await page.locator('body').getAttribute('data-presentation-stair-source'),'stair1');
  assert.equal(await page.locator('body').getAttribute('data-presentation-stair-treads'),'20');
  assert.equal(await page.locator('body').getAttribute('data-presentation-stair-finish'),'stone-satin-v1');
  assert.equal(await page.locator('body').getAttribute('data-presentation-stair-details'),'14');

  assert.equal(await page.locator('body').getAttribute('data-approved-door-count'),'6');
  assert.equal(await page.locator('body').getAttribute('data-approved-passage-width'),'0.95');
  assert.equal(await page.locator('body').getAttribute('data-approved-passage-head'),'2.99');
  assert.equal(await page.locator('body').getAttribute('data-showroom-door-error'),'0.0000',
   'Legacy presentation openings must align with the approved door centers');
  // Named camera poses capture architectural issues at useful scale.
  // No internal scene edits: public UI camera routes only.
  for(const cameraView of ['stair','stairDoor','leftPassage','bedroomWindowInside','bedroomWindowOutside','kitchenWindow']){
   await page.evaluate(view=>{
    const select=document.getElementById('clientView');
    select.value=view;select.dispatchEvent(new Event('change',{bubbles:true}));
   },cameraView);
   await page.waitForTimeout(350);
   await page.screenshot({path:'artifacts/3a-'+mode+'-'+cameraView+'.png'});
   if(cameraView==='stair'||cameraView==='leftPassage')
    await page.screenshot({path:'artifacts/3b-stair-finish-'+mode+'-'+cameraView+'.png'});

  }
  await page.evaluate(()=>document.getElementById('overview').click());

  assert.equal(await page.evaluate(()=>localStorage.getItem('adkh-house-shared-project-v1')),null,
   'new visitors must see the updated stair without importing any JSON');
  await page.screenshot({path:'artifacts/default-presentation-stair-'+mode+'.png'});
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
  assert.equal(await page.locator('body').getAttribute('data-architecture-furniture'),'5');
  assert.equal(await page.locator('body').getAttribute('data-architecture-finish-mode'),'editor');
  const renderDetails=await page.evaluate(()=>{
   const raw=JSON.parse(localStorage.getItem('adkh-house-shared-project-v1'));
   return {furniture:raw.model.furniture.map(x=>({id:x.id,color:x.color,x:x.x,z:x.z})),
    floor:raw.model.rooms.map(x=>({id:x.id,color:x.floor}))};
  });
  assert.equal(renderDetails.furniture[0].color,'#d6c9b9');
  assert.equal(renderDetails.floor[0].color,'#c4b098');
  await page.screenshot({path:'artifacts/synced-editor-finishes-'+mode+'.png'});
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
