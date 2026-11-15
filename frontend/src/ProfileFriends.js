import React,{useEffect,useState} from 'react';
import {useI18n} from './i18n';
import {Icon} from './ui';
import {PlayerAvatar} from './PlayerAvatar';
import {FriendsScreen} from './social';
import {FriendInviteActions} from './FriendInviteActions';
import {profileCopy} from './PlayerProgress';
const EMPTY=[];

export function ProfileFriends({social,clientId,onOpenMessages,onInviteFriend,onJoinFriend,pending}){
 const {lang,t}=useI18n(),copy=profileCopy(lang);
 const [expanded,setExpanded]=useState(false),[adding,setAdding]=useState(false),[code,setCode]=useState('');
 const [pendingTarget,setPendingTarget]=useState(null),[notice,setNotice]=useState('');
 const friends=social.friends || EMPTY,requests=social.requests || EMPTY;
 useEffect(()=>{
  if(!pendingTarget)return;
  if(social.outgoingRequests?.has(pendingTarget)||friends.some(f=>f.id===pendingTarget)){
   setPendingTarget(null);setNotice(copy.sent);setCode('');return;
  }
  if(social.friendRequestError && (!social.friendRequestError.targetId || social.friendRequestError.targetId===pendingTarget)){
   setPendingTarget(null);setNotice(social.friendRequestError.rateLimited ? (lang==='fr'?'Trop de demandes. Réessaie dans un instant.':lang==='es'?'Demasiadas solicitudes. Inténtalo de nuevo en un momento.':'Too many requests. Try again shortly.') : copy.rejected);return;
  }
  const timer=setTimeout(()=>{setPendingTarget(null);setNotice(copy.offline);},12000);
  return ()=>clearTimeout(timer);
 },[pendingTarget,social.outgoingRequests,social.friendRequestError,friends,copy,lang]);
 const submit=event=>{
  event.preventDefault();const target=code.trim();if(!target||pendingTarget)return;
  if(target===clientId){setNotice(copy.rejected);return;}
  if(social.outgoingRequests?.has(target)){setNotice(copy.sent);return;}
  if(social.addFriend?.(target)){setPendingTarget(target);setNotice('');}else setNotice(copy.offline);
 };
 return <>
  <div className="profile-friends-heading"><h2 className="pf-section-title">{t('myFriendsLabel')}</h2>
   {friends.length>0 && <button className="profile-friends-all" type="button" onClick={()=>setExpanded(v=>!v)} aria-expanded={expanded}>{expanded?copy.lessFriends:copy.allFriends}</button>}
  </div>
  <button className="profile-add-friend" type="button" onClick={()=>setAdding(v=>!v)} aria-expanded={adding}><Icon name="users" size={17}/>{copy.addFriend}</button>
  {adding && <form className="profile-friend-form" onSubmit={submit}>
   <label htmlFor="profile-friend-code">{copy.code}</label><div><input id="profile-friend-code" value={code} onChange={e=>setCode(e.target.value)} maxLength={128} autoCapitalize="none" autoCorrect="off" spellCheck={false} disabled={!!pendingTarget}/>
   <button type="submit" disabled={!code.trim()||!!pendingTarget||typeof social.addFriend!=='function'}>{pendingTarget?copy.pending:t('send')}</button></div>
   {notice && <p role="status">{notice}</p>}
   {clientId && <details><summary>{copy.myCode}</summary><code>{clientId}</code></details>}
  </form>}
  {!expanded && <>
   {friends.length>0 ? <div className="profile-friend-strip">{friends.slice(0,4).map(friend=><button className="profile-friend-portrait" type="button" key={friend.id} title={friend.name} onClick={()=>onOpenMessages?onOpenMessages(friend.id):setExpanded(true)}><PlayerAvatar avatar={friend.avatar}/><span>{friend.name}</span></button>)}</div>
    : <p className="profile-friends-empty">{t('friendsEmptyTitle')}</p>}
   {requests.length>0 && <button type="button" onClick={()=>setExpanded(true)}>{t('friendRequests')} · {requests.length}</button>}
   <FriendInviteActions onInviteFriend={onInviteFriend} onJoinFriend={onJoinFriend} pending={pending}/>
  </>}
  {expanded && <FriendsScreen social={social} onInviteFriend={onInviteFriend} onJoinFriend={onJoinFriend} pending={pending} showContactsFirst/>}
 </>;
}
