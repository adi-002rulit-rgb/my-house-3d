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
  if(isMobile){
   await page.locator('#focusView').click();
   assert.ok(await page.evaluate(()=>document.body.classList.contains('focus3d')));
   assert.equal(await page.locator('#pane2d').evaluate(x=>getComputedStyle(x).display),'none');
   await page.screenshot({path:'artifacts/mobile-focus-3d.png'});
  }
  assert.equal(pageErrors.length,0,mode+' page errors: '+pageErrors.join('; '));
  await context.close();
  console.log(mode+': browser smoke passed');
 }
}finally{await browser.close()}
