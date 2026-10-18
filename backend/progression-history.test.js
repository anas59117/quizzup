const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'progression-'));
const topics = require('./topic-stats');
const { CATEGORIES, questionKey } = require('./questions');
test('unique correct bank coverage, remote exclusion and consecutive streak reset', () => {
 const key = Object.keys(CATEGORIES)[0];
 const questions = CATEGORIES[key].questions.slice(0, 3);
 topics.record('coverage', key, { answers: [{question:questions[0],correct:true},{question:questions[0],correct:true},{question:questions[1],correct:false},{question:questions[2],correct:true},{question:{text:'remote unknown'},correct:true}] });
 let t = topics.getTopic('coverage',key);
 assert.equal(t.bestStreak,2); assert.equal(t.correctCount,2);
 assert.equal(t.questionCount,new Set(CATEGORIES[key].questions.map(questionKey)).size);
 topics.record('coverage',key,{answers:[{question:questions[1],correct:true}]});
 t = topics.getTopic('coverage',key); assert.equal(t.bestStreak,3); assert.equal(t.correctCount,3); assert.ok(t.updatedAt>0);
 assert.equal(topics.getTopic('legacy','missing').completion,null);
});
test('legacy progression has unknown streak and completion', () => {
 const t=topics.normalize({old:{psg:{games:4,wins:2,xp:30}}}).old.psg;
 assert.equal(t.bestStreak,null); assert.equal(t.correctlyAnswered,null);
});
test('history stores bounded safe private cloned and durable records once',async()=>{
 const h=require('./match-history'); const g={id:'match1',categoryKey:'psg',finishedAt:100,players:[{id:'p',clientId:'a',name:'A',score:4},{id:'bot',name:'Bot',avatar:'🐺',score:2,isBot:true}]};
 h.recordMatch(g); h.recordMatch(g); assert.equal(h.list('a').length,1); assert.equal(h.list('b').length,0);
 const row=h.list('a')[0]; assert.equal(row.outcome,'win'); assert.equal(row.opponents[0].id,'bot'); row.opponents[0].name='mutated'; assert.equal(h.list('a')[0].opponents[0].name,'Bot');
 for(let i=0;i<110;i++) h.recordMatch({...g,id:'match'+(i+2),finishedAt:101+i});
 assert.equal(h.list('a',1000).length,100);
 await require('./json-writer').flushAllJsonWriters();
 delete require.cache[require.resolve('./match-history')]; assert.equal(require('./match-history').list('a',1000).length,100);
 for (const [id,scores,outcome] of [['tie',[3,3],'tie'],['loss',[1,3],'loss'],['solo',[3],'solo']]) { const players=scores.map((score,i)=>({id:'p'+i,clientId:i?null:id,score})); h.recordMatch({id,players,mode:id==='solo'?'solo':'bot'}); assert.equal(h.list(id)[0].outcome,outcome); }
 assert.deepEqual(h.normalize({a:[{id:'x',opponents:[],outcome:'win',score:0,createdAt:1,secret:'x'}]}).a[0],{id:'x',category:null,createdAt:1,score:0,opponentScore:0,outcome:'win',opponents:[]});
});
test('endGame computes and records results once including forfeited opponent identity', () => {
 const lifecycle = require('./game'); const history = require('./match-history');
 const messaging = require('./messaging'); const oldHook = messaging.recordMatchResults;
 let calls = 0; messaging.recordMatchResults = (game, results) => { calls++; assert.equal(results[0].outcome,'win'); };
 const oldTimeout = global.setTimeout; global.setTimeout = () => ({unref(){}});
 try {
 const g={id:'end-once',status:'active',mode:'multiplayer',categoryKey:'psg',players:[{id:'human',clientId:'end-user',name:'Human',score:4}],departedPlayers:[{id:'left',clientId:'left-user',name:'Left',score:8}],roundResults:[]};
 lifecycle.endGame(g); lifecycle.endGame(g);
 assert.equal(history.list('end-user').length,1); assert.equal(history.list('end-user')[0].outcome,'win'); assert.equal(history.list('left-user')[0].outcome,'loss'); assert.equal(calls,1);
 } finally {global.setTimeout=oldTimeout; messaging.recordMatchResults=oldHook;}
});
