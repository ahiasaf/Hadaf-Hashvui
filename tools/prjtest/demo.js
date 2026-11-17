// ההדגמה במקרן (/hatzaga, prj.js): הבית, וואטסאפ, המדריך, הזוכים, החשבון האמיתי לא נוגע, טלפון.
// node tools/prjtest/srv.js &  ואז  NODE_PATH=$(npm root -g) node tools/prjtest/demo.js <תיקייה לצילומים>
const {chromium}=require('playwright');
const SP=process.argv[2];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:1280,height:800},serviceWorkers:'block'});
const bad=[];
c.on('request',r=>{const u=r.url();if(r.method()!=='GET')bad.push(r.method()+' '+u.slice(0,90));if(/wa\.me|whatsapp/.test(u))bad.push('WA '+u.slice(0,60));});
await c.route(/script\.google\.com/,async r=>{const u=r.request().url();const q=new URL(u).searchParams;const cb=q.get('callback');
  if(q.get('challenge')==='my')return r.fulfill({contentType:'text/javascript',body:cb+'('+JSON.stringify({status:'ok',on:true,pub:false,pv:3,me:null,dates:[]})+')'});
  if(q.get('challenge'))bad.push('CH '+u.slice(-60));
  if(q.get('raffle')==='all')return r.fulfill({contentType:'application/json',body:JSON.stringify({status:'ok',list:[{wk:7,day:'15.11',w:[{name:'פלוני אלמוני',inst:'ישיבה'}],ch:[{w:[{name:'א ב',inst:'י'},{name:'ג ד',inst:'י'},{name:'ה ו',inst:'י'},{name:'ז ח',inst:'י'}]}]}]})});
  return r.abort();});
await c.route(/docs\.google\.com/,r=>r.abort());
// חשבון אמיתי בדפדפן
const p0=await c.newPage();await p0.goto('http://localhost:8899/info',{waitUntil:'domcontentloaded'});
await p0.evaluate(()=>localStorage.setItem('df:me',JSON.stringify({id:'REALID',first:'R'})));
const p=await c.newPage();p.on('pageerror',e=>console.log('ERR',e.message));
await p.goto('http://localhost:8899/hatzaga',{waitUntil:'domcontentloaded'});await p.waitForTimeout(2500);
console.log('name',await p.textContent('#d-name'));
await p.click('#ch-wa');await p.waitForTimeout(400);
console.log('wa preview',await p.locator('#prj-wa').isVisible(), (await p.textContent('#prj-wa')).slice(0,120));
await p.locator('#prj-wa').screenshot({path:SP+'/wa.png'});
await p.click('#prj-wa-x');
await p.click('.prj-gk button[data-k=droid]');await p.waitForTimeout(300);
console.log('guide droid',(await p.textContent('#prj-gu')).slice(0,80));
await p.click('.prj-go');await p.waitForTimeout(2500);
console.log('zochim',p.url(),(await p.textContent('#res')).slice(0,160));
await p.screenshot({path:SP+'/z.png'});
await p.goBack();await p.waitForTimeout(2000);
console.log('back',p.url(),await p.textContent('#d-name'));
const p2=await c.newPage();await p2.goto('http://localhost:8899/info',{waitUntil:'domcontentloaded'});
console.log('real account',await p2.evaluate(()=>localStorage.getItem('df:me')+' keys='+localStorage.length));
console.log('BAD',bad.join('\n')||'none');
// phone width
const m=await b.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});await m.route(/google\.com/,r=>r.abort());
const pm=await m.newPage();await pm.goto('http://localhost:8899/hatzaga',{waitUntil:'domcontentloaded'});await pm.waitForTimeout(2000);
console.log('phone scrollW',await pm.evaluate(()=>document.documentElement.scrollWidth));
await pm.screenshot({path:SP+'/m.png'});
await b.close();})();
