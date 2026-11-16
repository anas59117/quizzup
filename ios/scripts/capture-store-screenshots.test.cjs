const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {waitForReady,saveFailureDiagnostics}=require('./capture-store-screenshots.cjs');
const expected={screen:'question',language:'fr',appearance:'light',storedAppearance:'light'};

test('allows a slow first render beyond thirty seconds and validates its receipt',()=>{
 let elapsed=0;
 const waited=waitForReady('receipt',expected,{now:()=>elapsed,pause:ms=>elapsed+=ms,exists:()=>elapsed>=45000,read:()=>JSON.stringify(expected)});
 assert.equal(waited,45000);
});
test('missing readiness remains bounded and does not relaunch the app',()=>{
 let elapsed=0;
 assert.throws(()=>waitForReady('receipt',expected,{timeoutMs:1000,now:()=>elapsed,pause:ms=>elapsed+=ms,exists:()=>false}),/did not become ready.*1000ms/);
 assert.equal(elapsed,1000);
});
test('a stale or wrong readiness receipt still fails immediately',()=>{
 assert.throws(()=>waitForReady('receipt',expected,{exists:()=>true,read:()=>JSON.stringify({...expected,screen:'home'})}),/question/);
 assert.throws(()=>waitForReady('receipt',expected,{exists:()=>true,read:()=>'{broken'}),SyntaxError);
});
test('readiness overrides cannot introduce an unbounded wait',()=>{
 for(const timeoutMs of [0,NaN,Infinity,300001])assert.throws(()=>waitForReady('receipt',expected,{timeoutMs}),/timeout/);
});
test('failure diagnostics save screenshot, receipt, app logs and recent crash before cleanup',()=>{
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'quizzup-capture-test-'));
 try{
  const crashes=path.join(temp,'crashes');fs.mkdirSync(crashes);
  fs.writeFileSync(path.join(crashes,'QuizzUp-test.ips'),'fixture crash');
  fs.writeFileSync(path.join(crashes,'Unrelated.ips'),'unrelated');
  const ready=path.join(temp,'ready.json');fs.writeFileSync(ready,JSON.stringify(expected));
  const calls=[];
  const destination=saveFailureDiagnostics({output:temp,udid:'fixture-device',ready,context:{profile:'fixture',screen:'question',language:'fr',plan:'light',startedAt:Date.now()-1000},error:Error('readiness failed'),crashDirectories:[crashes],execute:(command,args,timeout)=>{
   calls.push({command,args,timeout});
   if(args.includes('screenshot'))fs.writeFileSync(args.at(-1),'actual simulator screenshot');
   return 'fixture app diagnostic';
  }});
  assert.equal(fs.readFileSync(path.join(destination,'screen.png'),'utf8'),'actual simulator screenshot');
  assert.equal(fs.readFileSync(path.join(destination,'crashes','QuizzUp-test.ips'),'utf8'),'fixture crash');
  assert.ok(fs.existsSync(path.join(destination,'app.log')));
  assert.ok(fs.existsSync(path.join(destination,'readiness.json')));
  assert.ok(!fs.existsSync(path.join(destination,'crashes','Unrelated.ips')));
  assert.ok(calls.every(call=>call.timeout<=15000));
  assert.ok(calls.every(call=>!call.args.includes('shutdown')&&!call.args.includes('delete')&&!call.args.includes('launch')));
 }finally{fs.rmSync(temp,{recursive:true,force:true});}
});
test('one unavailable diagnostic cannot suppress later evidence or replace original failure',()=>{
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'quizzup-capture-test-'));
 try{
  let attempts=0;
  const destination=saveFailureDiagnostics({output:temp,udid:'fixture-device',context:{profile:'fixture'},error:Error('original timeout'),crashDirectories:[],execute:()=>{attempts++;throw Error('simulator unavailable');}});
  assert.ok(attempts>=3);
  const summary=JSON.parse(fs.readFileSync(path.join(destination,'failure.json'),'utf8'));
  assert.equal(summary.error,'original timeout');
  assert.ok(summary.diagnosticErrors.length>=3);
 }finally{fs.rmSync(temp,{recursive:true,force:true});}
});
