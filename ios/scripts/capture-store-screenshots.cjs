const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {profiles,scenarios,validatePng,jpegInfo}=require('./store-assets.cjs');
const run=(command,args,timeout=180000)=>cp.execFileSync(command,args,{encoding:'utf8',timeout,killSignal:'SIGKILL',stdio:['ignore','pipe','pipe']}).trim();
const pause=ms=>Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0,ms);
const root=path.resolve(__dirname,'../..');
if(process.platform!=='darwin')throw Error('Native captures require macOS with Xcode and an iOS Simulator');
const app=path.resolve(process.argv[2]||'');
assert.ok(app.endsWith('.app')&&fs.existsSync(app),'Pass the compiled STORE_CAPTURE simulator .app');
const output=path.resolve(process.argv[3]||path.join(root,'ios/AppStoreMetadata/screenshots'));
const rawDirectory=path.join(process.env.RUNNER_TEMP||require('node:os').tmpdir(),'quizzup-native-capture-raw');
fs.mkdirSync(output,{recursive:true});fs.mkdirSync(rawDirectory,{recursive:true});
validatePng(fs.readFileSync(path.join(root,'ios/Sources/QuizzUp/Resources/Assets.xcassets/AppIcon.appiconset/icon-1024.png')),1024,1024,true);
const runtime=JSON.parse(run('xcrun',['simctl','list','runtimes','--json'])).runtimes
 .filter(r=>r.isAvailable&&r.identifier.includes('.iOS-'))
 .sort((a,b)=>b.version.localeCompare(a.version,undefined,{numeric:true}))[0];
assert.ok(runtime,'No available iOS Simulator runtime');
const types=JSON.parse(run('xcrun',['simctl','list','devicetypes','--json'])).devicetypes;
const captures=[];
for(const profile of profiles){
 const type=types.find(t=>t.identifier===`com.apple.CoreSimulator.SimDeviceType.${profile.type}`);
 assert.ok(type,`Simulator type not installed: ${profile.type}`);
 const udid=run('xcrun',['simctl','create',`QuizzUp-${profile.key}`,type.identifier,runtime.identifier]);
 try{
  console.log(`Booting ${profile.key} on ${runtime.identifier}; first-boot migration may take several minutes.`);
  run('xcrun',['simctl','boot',udid]);
  run('xcrun',['simctl','bootstatus',udid,'-b'],600000);
  console.log(`Ready: ${profile.key}`);
  run('xcrun',['simctl','status_bar',udid,'override','--time','09:41','--dataNetwork','wifi','--wifiMode','active','--wifiBars','3','--batteryState','charged','--batteryLevel','100']);
  run('xcrun',['simctl','install',udid,app]);
  const data=run('xcrun',['simctl','get_app_container',udid,'com.quizzup.app','data']);
  const ready=path.join(data,'Documents/store-capture-ready.json');
  for(const language of ['fr','en'])for(const screen of scenarios){
   if(fs.existsSync(ready))fs.unlinkSync(ready);
   run('xcrun',['simctl','launch','--terminate-running-process',udid,'com.quizzup.app','--store-capture-screen',screen,'--store-capture-language',language]);
   const deadline=Date.now()+30000;
   while(!fs.existsSync(ready)&&Date.now()<deadline)pause(200);
   assert.ok(fs.existsSync(ready),`View did not become ready: ${profile.key}/${language}/${screen}`);
   assert.deepEqual(JSON.parse(fs.readFileSync(ready,'utf8')),{screen,language});
   const name=`${String(scenarios.indexOf(screen)+1).padStart(2,'0')}-${screen}`;
   const raw=path.join(rawDirectory,`${profile.key}-${language}-${name}.png`);
   const relative=`${language}/${profile.key}/${name}.jpg`;
   const destination=path.join(output,relative);
   fs.mkdirSync(path.dirname(destination),{recursive:true});
   run('xcrun',['simctl','io',udid,'screenshot','--type=png',raw]);
   validatePng(fs.readFileSync(raw),profile.width,profile.height);
   // JPEG is accepted by App Store Connect and cannot contain an alpha channel.
   // Only the format is converted; native pixel dimensions are never resized.
   run('sips',['-s','format','jpeg','-s','formatOptions','100',raw,'--out',destination]);
   const bytes=fs.readFileSync(destination),info=jpegInfo(bytes);
   assert.deepEqual(info,{width:profile.width,height:profile.height,components:3});
   captures.push({screen,language,profile:profile.key,path:relative,...info,sha256:crypto.createHash('sha256').update(bytes).digest('hex')});
   console.log(`CAPTURED ${relative} ${info.width}x${info.height}`);
  }
 }finally{
  // Cleanup must not mask a failed capture or stall the ephemeral CI runner.
  for(const action of ['shutdown','delete']){
   try{run('xcrun',['simctl',action,udid],15000);}
   catch{console.warn(`Simulator cleanup warning: ${action} ${udid}`);}
  }
 }
}
assert.equal(captures.length,profiles.length * scenarios.length * 2);
const commit=process.env.GITHUB_SHA||run('git',['-C',root,'rev-parse','HEAD']);
fs.writeFileSync(path.join(output,'manifest.json'),JSON.stringify({commit,runtime:runtime.identifier,capturedAt:new Date().toISOString(),nativeViews:true,contentLanguage:'Original French question bank; FR/EN interface chrome only',captures},null,2)+'\n');
console.log(`Verified ${captures.length} native, opaque App Store captures; no resizing.`);
