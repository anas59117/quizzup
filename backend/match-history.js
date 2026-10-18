const { createJsonWriter, readJsonFileSync } = require('./json-writer');
const { getStorePath } = require('./store-path');
const { cleanDisplayName, cleanAvatar } = require('./sanitize');
const MAX_MATCHES = 100;
const validId = id => typeof id === 'string' && id.length > 0 && id.length <= 128;
const count = n => Number.isFinite(n) ? Math.max(0,Math.min(Number.MAX_SAFE_INTEGER,Math.floor(n))) : 0;
function cleanMatch(m) {
 if (!m || !validId(m.id) || !['win','loss','tie','solo'].includes(m.outcome)) return null;
 return {id:m.id,category:typeof m.category==='string' && /^[A-Za-z0-9_-]{1,64}$/.test(m.category)?m.category:null,createdAt:count(m.createdAt),score:count(m.score),opponentScore:count(m.opponentScore),outcome:m.outcome,opponents:(Array.isArray(m.opponents)?m.opponents:[]).slice(0,3).filter(p=>p && validId(p.id)).map(p=>({id:p.id,name:cleanDisplayName(p.name),avatar:cleanAvatar(p.avatar),score:count(p.score)}))};
}
function normalize(raw) {
 const out=Object.create(null);
 if (!raw || typeof raw!=='object' || Array.isArray(raw)) return out;
 for(const [id,rows] of Object.entries(raw)) {
  if(!validId(id)||!Array.isArray(rows)) continue;
  const seen=new Set(); out[id]=rows.map(cleanMatch).filter(m=>m&&!seen.has(m.id)&&seen.add(m.id)).sort((a,b)=>b.createdAt-a.createdAt).slice(0,MAX_MATCHES);
 }
 return out;
}
const store=normalize(readJsonFileSync(getStorePath('match-history.json'),{}));
const persist=createJsonWriter(getStorePath('match-history.json'),()=>store);
function resultsFor(game) {
 const players=[...(game.players||[]),...(game.departedPlayers||[])];
 const top=Math.max(...(game.players||[]).map(p=>p.score));
 const tied=(game.players||[]).filter(p=>p.score===top).length>1;
 return players.filter(p=>validId(p.clientId)&&!p.isBot).map(p=>{
  const opponents=players.filter(o=>o!==p).map(o=>({id:o.clientId||o.id,name:o.name,avatar:o.avatar,score:o.score}));
  const departed=(game.departedPlayers||[]).includes(p);
  return {clientId:p.clientId,playerId:p.id,score:p.score,opponentScore:Math.max(0,...opponents.map(o=>o.score)),outcome:game.mode==='solo'?'solo':departed?'loss':tied?'tie':p.score===top?'win':'loss',opponents};
 });
}
function recordMatch(game,results=resultsFor(game)) {
 if(!game||!validId(game.id)) return [];
 for(const r of results) {
  if(!validId(r.clientId)) continue;
  const rows=store[r.clientId]||(store[r.clientId]=[]);
  if(rows.some(m=>m.id===game.id)) continue;
  const m=cleanMatch({id:game.id,category:game.categoryKey,createdAt:game.finishedAt||Date.now(),...r});
  if(m) {rows.unshift(m);rows.sort((a,b)=>b.createdAt-a.createdAt);rows.splice(MAX_MATCHES);persist();}
 }
 return results;
}
function list(clientId,limit=30) {
 const n=Math.max(1,Math.min(MAX_MATCHES,Math.floor(Number(limit)||30)));
 return validId(clientId)?JSON.parse(JSON.stringify((store[clientId]||[]).slice(0,n))):[];
}
module.exports={list,recordMatch,resultsFor,normalize,MAX_MATCHES};
