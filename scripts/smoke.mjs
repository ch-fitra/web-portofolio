import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {chromium} from '@playwright/test';
const base=process.env.SMOKE_URL||'http://localhost:3000';
for(const route of ['/','/about','/projects','/skills','/contact','/privacy','/admin/login']){
  const response=await fetch(base+route);assert.equal(response.status,200,route);console.log(`200 ${route}`);
}
assert.equal((await fetch(base+'/projects/ai-support-triage')).status,404);
assert.equal((await fetch(base+'/api/media',{method:'POST'})).status,401);
const sitemap=await (await fetch(base+'/sitemap.xml')).text();assert.ok(!sitemap.includes('/projects/ai-support-triage'));
const og=await fetch(base+'/opengraph-image');assert.equal(og.status,200);assert.match(og.headers.get('content-type'),/image\/png/);
const browser=await chromium.launch({channel:'chrome'});
try{
  const context=await browser.newContext({colorScheme:'dark',viewport:{width:1440,height:1000}});
  const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await mkdir('docs/previews',{recursive:true});await page.goto(base);await page.screenshot({path:'docs/previews/home-dark.png',fullPage:true,animations:'disabled'});
  await page.getByRole('button',{name:'Switch to light theme'}).click();await page.screenshot({path:'docs/previews/home-light.png',fullPage:true,animations:'disabled'});
  await page.setViewportSize({width:390,height:844});await page.screenshot({path:'docs/previews/home-mobile.png',fullPage:true,animations:'disabled'});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  assert.deepEqual(errors,[]);console.log('Standalone public/SEO/security smoke and desktop/light/mobile screenshots passed.');
}finally{await browser.close();}
