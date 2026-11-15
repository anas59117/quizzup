import React,{act} from 'react';
import {createRoot} from 'react-dom/client';
import {I18nProvider} from './i18n';
import {ProfileFriends} from './ProfileFriends';
import {useSocial} from './social';
let container,root,social,socket;
function Harness(){social=useSocial(socket,'self');return <ProfileFriends social={social} clientId="self"/>;}
beforeEach(()=>{global.IS_REACT_ACT_ENVIRONMENT=true;localStorage.setItem('quizzup-lang','fr');socket={current:{readyState:1,send:jest.fn()}};container=document.createElement('div');document.body.append(container);root=createRoot(container);act(()=>root.render(<I18nProvider><Harness/></I18nProvider>));act(()=>container.querySelector('.profile-add-friend').click());});
afterEach(()=>{act(()=>root.unmount());container.remove();});
function request(){const input=container.querySelector('input');act(()=>{Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,'friend-code');input.dispatchEvent(new Event('input',{bubbles:true}));});act(()=>container.querySelector('form').dispatchEvent(new Event('submit',{bubbles:true,cancelable:true})));return input;}
test('friend code requests show success only after the server acknowledgement',()=>{
 request();expect(socket.current.send).toHaveBeenCalledWith(JSON.stringify({type:'friend_request',targetId:'friend-code'}));
 expect(container.textContent).not.toContain('Demande envoyée');
 act(()=>social.handleMessage({type:'friend_request_sent',targetId:'friend-code'}));
 expect(container.textContent).toContain('Demande envoyée');expect(container.querySelector('input').value).toBe('');
});
test('rejected friend codes preserve the draft and expose a retry',()=>{
 request();act(()=>social.handleMessage({type:'friend_request_rejected',targetId:'friend-code'}));
 expect(container.querySelector('input').value).toBe('friend-code');
 expect(container.querySelector('form button').disabled).toBe(false);
 expect(container.textContent).toContain('Vérifie le code');
});
test('friend request rate limits release the pending form immediately',()=>{
 request();act(()=>social.handleMessage({type:'rate_limited',code:'FRIEND_REQUEST_RATE_LIMITED'}));
 expect(container.querySelector('input').value).toBe('friend-code');
 expect(container.querySelector('form button').disabled).toBe(false);
 expect(container.textContent).toContain('Trop de demandes');
});
