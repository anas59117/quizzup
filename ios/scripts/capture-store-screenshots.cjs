const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {profiles,scenarios,validatePng,jpegInfo}=require('./store-assets.cjs');
const run=(command,args,timeout=180000)=>cp.execFileSync(command,args,{encoding:'utf8',timeout,killSignal:'SIGKILL',stdio:['ignore','pipe','pipe']}).trim();
const pause=ms=>Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0,ms);
function waitForReady(ready,expected,{timeoutMs=120000,now=()=>performance.now(),pause:wait=pause,exists=fs.existsSync,read=file=>fs.readFileSync(file,'utf8')}={}){
 assert.ok(Number.isInteger(timeoutMs)&&timeoutMs>=1000&&timeoutMs<=300000,'Readiness timeout must be 1000–300000ms');
 const started=now(),deadline=started+timeoutMs;
 while(!exists(ready)&&now()<deadline)wait(Math.min(200,deadline-now()));
 assert.ok(exists(ready),`View did not become ready within ${timeoutMs}ms: ${expected.language}/${expected.screen}`);
 // A marker from another launch or appearance must never count as ready.
 assert.deepEqual(JSON.parse(read(ready)),expected);
 return Math.round(now()-started);
}
function saveFailureDiagnostics({output,udid,ready,context={},error,execute=run,crashDirectories}){
 const directory=path.join(output,'failure-diagnostics',context.profile||'setup',context.plan||'setup',context.language||'unknown',context.screen||'setup');
 fs.mkdirSync(directory,{recursive:true});
 const diagnosticErrors=[];
 const attempt=(name,action)=>{try{action();}catch(failure){diagnosticErrors.push({name,error:failure.message});}};
 // Capture the actual failed view before shutdown; never relaunch to hide it.
 attempt('screenshot',()=>execute('xcrun',['simctl','io',udid,'screenshot','--type=png',path.join(directory,'screen.png')],15000));
 attempt('readiness',()=>fs.writeFileSync(path.join(directory,'readiness.json'),ready&&fs.existsSync(ready)?fs.readFileSync(ready):JSON.stringify({missing:true})));
 attempt('app-log',()=>fs.writeFileSync(path.join(directory,'app.log'),execute('xcrun',['simctl','spawn',udid,'log','show','--style','compact','--last','5m','--predicate','process == "QuizzUp" OR eventMessage CONTAINS[c] "com.quizzup.app"'],15000)));
 attempt('app-process',()=>{
  const processes=execute('xcrun',['simctl','spawn',udid,'launchctl','list'],5000);
  fs.writeFileSync(path.join(directory,'app-process.txt'),processes.split('\n').filter(line=>/QuizzUp|com\.quizzup\.app/i.test(line)).join('\n')||'No QuizzUp process found.');
 });
 attempt('device-state',()=>fs.writeFileSync(path.join(directory,'device-state.json'),execute('xcrun',['simctl','list','devices','--json'],5000)));
 const home=require('node:os').homedir();
 const crashRoots=crashDirectories||[path.join(home,'Library/Logs/DiagnosticReports'),path.join(home,'Library/Developer/CoreSimulator/Devices',udid,'data/Library/Logs/CrashReporter')];
 for(const source of crashRoots)attempt('crash-reports',()=>{
  if(!fs.existsSync(source))return;
  const reports=fs.readdirSync(source).filter(name=>/^QuizzUp.*\.(ips|crash)$/i.test(name))
   .map(name=>({name,stat:fs.statSync(path.join(source,name))}))
   .filter(({stat})=>stat.isFile()&&stat.mtimeMs>=(context.startedAt||Date.now()-300000)-5000&&stat.size<=5*1024*1024)
   .sort((a,b)=>b.stat.mtimeMs-a.stat.mtimeMs).slice(0,10);
  for(const {name} of reports){fs.mkdirSync(path.join(directory,'crashes'),{recursive:true});fs.copyFileSync(path.join(source,name),path.join(directory,'crashes',name));}
 });
 fs.writeFileSync(path.join(directory,'failure.json'),JSON.stringify({context,error:error?.message||String(error),collectedAt:new Date().toISOString(),diagnosticErrors},null,2)+'\n');
 console.error(`Saved failed capture evidence: ${directory}`);
 return directory;
}
function main(){
const root=path.resolve(__dirname,'../..');
if(process.platform!=='darwin')throw Error('Native captures require macOS with Xcode and an iOS Simulator');
const app=path.resolve(process.argv[2]||'');
assert.ok(app.endsWith('.app')&&fs.existsSync(app),'Pass the compiled STORE_CAPTURE simulator .app');
const output=path.resolve(process.argv[3]||path.join(root,'ios/AppStoreMetadata/screenshots'));
const visualReview=process.argv.includes('--visual-review');
const audioReview=visualReview&&process.argv.includes('--duel-audio-review');
const audioFeedbackReview=visualReview&&process.argv.includes('--audio-feedback-review');
const communityReview=visualReview&&process.argv.includes('--community-review');
const profileReview=visualReview&&process.argv.includes('--profile-review');
const appearanceReview=visualReview&&process.argv.includes('--appearance-review');
const appearanceSettingsReview=appearanceReview&&process.argv.includes('--appearance-settings-review');
const reviewProfiles=[profiles.find(profile=>profile.type==='iPhone-15'),{key:'iphone-compact-home-button',type:'iPhone-SE-3rd-generation',width:750,height:1334}];
const captureProfiles=profileReview ? [reviewProfiles[process.argv.includes('--profile-compact')?1:0]] : communityReview ? reviewProfiles : visualReview ? profiles.filter(profile=>profile.type==='iPhone-15') : profiles;
const captureLanguages=visualReview ? ['fr'] : ['fr','en'];
const captureScreens=profileReview ? ['profile','profile-help','profile-friends','personal-posts','result-level-up'] : communityReview ? ['community','community-discussion','community-compose','community-empty'] : audioFeedbackReview ? ['answer','result'] : appearanceSettingsReview ? ['settings','settings-live'] : appearanceReview
 ? ['home','themes','family','profile','messages','thread','community','community-compose','settings','play','auth','auth-email','join','detail','room','profile-edit','settings-live']
 : audioReview
 ? ['waiting','faceoff','question','question-photo','answer','question-muted','settings','community','community-suggestion','community-compose']
 : visualReview
 ? ['home','home-empty','home-return','themes','family','detail','detail-scrolled','messages','messages-empty','community','community-compose','settings','profile','profile-empty','waiting','faceoff','question','question-photo','answer','result','auth','auth-restoring','auth-email','auth-email-keyboard','auth-email-create','auth-email-reset']
 : scenarios;
const capturePlans=communityReview||profileReview ? [
 {key:'light',preference:'light',system:'light',screens:captureScreens},
 {key:'dark',preference:'dark',system:'dark',screens:captureScreens},
] : appearanceReview ? [
 {key:'light',preference:'light',system:'dark',screens:captureScreens},
 {key:'dark',preference:'dark',system:'light',screens:captureScreens},
 {key:'system-light',preference:'system',system:'light',screens:['home','settings']},
 {key:'system-dark',preference:'system',system:'dark',screens:['home','settings']},
] : [{key:'light',preference:'light',system:'light',screens:captureScreens}];
const rawDirectory=path.join(process.env.RUNNER_TEMP||require('node:os').tmpdir(),'quizzup-native-capture-raw');
fs.mkdirSync(output,{recursive:true});fs.mkdirSync(rawDirectory,{recursive:true});
validatePng(fs.readFileSync(path.join(root,'ios/Sources/QuizzUp/Resources/Assets.xcassets/AppIcon.appiconset/icon-1024.png')),1024,1024,true);
const runtime=JSON.parse(run('xcrun',['simctl','list','runtimes','--json'])).runtimes
 .filter(r=>r.isAvailable&&r.identifier.includes('.iOS-'))
 .sort((a,b)=>b.version.localeCompare(a.version,undefined,{numeric:true}))[0];
assert.ok(runtime,'No available iOS Simulator runtime');
const types=JSON.parse(run('xcrun',['simctl','list','devicetypes','--json'])).devicetypes;
const captures=[];
const readyTimeoutMs=Number(process.env.QUIZZUP_CAPTURE_READY_TIMEOUT_MS||120000);
assert.ok(Number.isInteger(readyTimeoutMs)&&readyTimeoutMs>=1000&&readyTimeoutMs<=300000,'Readiness timeout must be 1000–300000ms');
for(const profile of captureProfiles){
 const type=types.find(t=>t.identifier===`com.apple.CoreSimulator.SimDeviceType.${profile.type}`);
 assert.ok(type,`Simulator type not installed: ${profile.type}`);
 const udid=run('xcrun',['simctl','create',`QuizzUp-${profile.key}`,type.identifier,runtime.identifier]);
 let ready,context={profile:profile.key,startedAt:Date.now()};
 try{
  console.log(`Booting ${profile.key} on ${runtime.identifier}; first-boot migration may take several minutes.`);
  run('xcrun',['simctl','boot',udid]);
  run('xcrun',['simctl','bootstatus',udid,'-b'],600000);
  console.log(`Ready: ${profile.key}`);
  run('xcrun',['simctl','status_bar',udid,'override','--time','09:41','--dataNetwork','wifi','--wifiMode','active','--wifiBars','3','--batteryState','charged','--batteryLevel','100']);
  run('xcrun',['simctl','install',udid,app]);
  const data=run('xcrun',['simctl','get_app_container',udid,'com.quizzup.app','data']);
  ready=path.join(data,'Documents/store-capture-ready.json');
  for(const plan of capturePlans){
  run('xcrun',['simctl','ui',udid,'appearance',plan.system]);
  for(const language of captureLanguages)for(const screen of plan.screens){
   context={profile:profile.key,plan:plan.key,screen,language,startedAt:Date.now()};
   if(fs.existsSync(ready))fs.unlinkSync(ready);
   context.launchOutput=run('xcrun',['simctl','launch','--terminate-running-process',udid,'com.quizzup.app','--store-capture-screen',screen,'--store-capture-language',language,'--store-capture-appearance',plan.preference]);
   const finalPreference=screen==='settings-live' ? (plan.preference==='dark' ? 'light' : 'dark') : plan.preference;
   const waited=waitForReady(ready,{screen,language,appearance:plan.preference,storedAppearance:finalPreference},{timeoutMs:readyTimeoutMs});
   console.log(`View ready: ${profile.key}/${language}/${screen} after ${waited}ms`);
   const name=`${String(captureScreens.indexOf(screen)+1).padStart(2,'0')}-${screen}`;
   const relative=`${appearanceReview||communityReview||profileReview ? plan.key+'/' : ''}${language}/${profile.key}/${name}.jpg`;
   const saveCapture=(relative,expectedAppearance,suffix='')=>{
   const raw=path.join(rawDirectory,`${profile.key}-${language}-${name}${suffix}.png`);
   const destination=path.join(output,relative);
   fs.mkdirSync(path.dirname(destination),{recursive:true});
   run('xcrun',['simctl','io',udid,'screenshot','--type=png',raw]);
   validatePng(fs.readFileSync(raw),profile.width,profile.height);
   // JPEG is accepted by App Store Connect and cannot contain an alpha channel.
   // Only the format is converted; native pixel dimensions are never resized.
   run('sips',['-s','format','jpeg','-s','formatOptions','100',raw,'--out',destination]);
   const bytes=fs.readFileSync(destination),info=jpegInfo(bytes);
   assert.deepEqual(info,{width:profile.width,height:profile.height,components:3});
   captures.push({screen,language,appearance:plan.key,expectedAppearance,profile:profile.key,path:relative,...info,sha256:crypto.createHash('sha256').update(bytes).digest('hex')});
   console.log(`CAPTURED ${relative} ${info.width}x${info.height}`);
   };
   const duelScreen=['waiting','faceoff','question','question-photo','question-muted','answer','result','result-level-up'].includes(screen);
   saveCapture(relative,duelScreen ? 'dark' : finalPreference==='system' ? plan.system : finalPreference);
   if(appearanceReview&&plan.preference==='system'&&screen==='settings'){
    const changed=plan.system==='dark'?'light':'dark';
    run('xcrun',['simctl','ui',udid,'appearance',changed]);pause(1500);
    saveCapture(`${plan.key}-live/${language}/${profile.key}/${name}.jpg`,changed,'-live');
   }
  }
  }
 }catch(error){
  try{saveFailureDiagnostics({output,udid,ready,context,error});}
  catch(diagnosticError){console.warn(`Unable to save capture diagnostics: ${diagnosticError.message}`);}
  throw error;
 }finally{
  // Cleanup must not mask a failed capture or stall the ephemeral CI runner.
  for(const action of ['shutdown','delete']){
   try{run('xcrun',['simctl',action,udid],15000);}
   catch{console.warn(`Simulator cleanup warning: ${action} ${udid}`);}
  }
 }
}
assert.equal(captures.length,captureProfiles.length * captureLanguages.length * (capturePlans.reduce((n,plan)=>n+plan.screens.length,0)+(appearanceReview?2:0)));
const commit=process.env.GITHUB_SHA||run('git',['-C',root,'rev-parse','HEAD']);
fs.writeFileSync(path.join(output,'manifest.json'),JSON.stringify({commit,runtime:runtime.identifier,capturedAt:new Date().toISOString(),nativeViews:true,contentLanguage:'Original French question bank; FR/EN interface chrome only',captures},null,2)+'\n');
console.log(`Verified ${captures.length} native, opaque App Store captures; no resizing.`);
}
module.exports={waitForReady,saveFailureDiagnostics};
if(require.main===module)main();
