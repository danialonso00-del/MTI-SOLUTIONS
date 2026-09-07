import puppeteer from 'puppeteer';
const OUT = process.argv[2];
const b = await puppeteer.launch({ headless:'new', args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const p = await b.newPage(); await p.setViewport({width:1600,height:900});
const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
const wait=ms=>new Promise(r=>setTimeout(r,ms));
await p.goto('http://localhost:5181/',{waitUntil:'networkidle2',timeout:300000});
await p.waitForFunction("document.querySelector('.loader.done')!==null",{timeout:300000}).catch(()=>errs.push('no cargó'));
await wait(5000);
await p.evaluate(()=>{const x=[...document.querySelectorAll('button')].find(b=>b.textContent.includes('Explorar la ciudad')); x&&x.click();});
await wait(7000);
await p.evaluate(()=>{const it=[...document.querySelectorAll('.sol-item')].find(x=>x.innerText.includes('Smart Stadium')); it&&it.click();});
// justo cuando el rótulo está en pantalla
await wait(1800);
await p.screenshot({path:`${OUT}/M1-rotulo.png`});
const geo = await p.evaluate(()=>{
  const c=document.querySelector('.scenecard');
  if(!c) return null;
  const r=c.getBoundingClientRect();
  return { rect:[r.x|0,r.y|0,r.width|0,r.height|0], opacity:getComputedStyle(c).opacity };
});
console.log('rótulo:', JSON.stringify(geo));
// y ya con el panel dentro
await wait(9000);
await p.screenshot({path:`${OUT}/M2-panel.png`});
console.log('errores:', errs.slice(0,3).join(' | ')||'ninguno');
await b.close();
