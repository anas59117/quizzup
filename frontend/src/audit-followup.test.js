import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { I18nProvider } from './i18n';
import { CategoriesContent, ProfileContent } from './screens';
import { CategoryTile } from './ui';
import { CategoryTileV4 } from './CategoryTileV4';
import { HomeLoading } from './HomeLoading';

let root, container;
beforeEach(()=>{global.IS_REACT_ACT_ENVIRONMENT=true;localStorage.setItem('quizzup-lang','fr');container=document.createElement('div');document.body.append(container);root=createRoot(container);});
afterEach(()=>{act(()=>root.unmount());container.remove();});
const render=element=>act(()=>root.render(<I18nProvider>{element}</I18nProvider>));
const social={friends:[],requests:[],outgoingRequests:new Set()};
const profileProps={name:'Alex',avatar:'robot',clientId:'self',stats:{level:4,topics:[{key:'rap_fr',level:3},{key:'minecraft',level:2}]},social};

test('profile themes identify the quiz and level and open the chosen quiz',()=>{
 const open=jest.fn();render(<ProfileContent {...profileProps} onOpenTopic={open} />);
 const topics=container.querySelectorAll('.pf-theme-tile');
 expect(topics[0].textContent).toContain('Rap Français');expect(topics[0].textContent).toContain('Niveau 3');
 expect(topics[1].textContent).toContain('Minecraft');act(()=>topics[1].click());expect(open).toHaveBeenCalledWith('minecraft');
});

test('account saving is visible before the progress sections and uses the existing callback',()=>{
 const link=jest.fn();render(<ProfileContent {...profileProps} linkGoogle={link} />);
 const button=container.querySelector('.profile-account-action');expect(button.disabled).toBe(false);expect(button.textContent).toContain('Sauvegarder ma progression avec Google');
 expect(button.compareDocumentPosition(container.querySelector('.pf-level-card')) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
 act(()=>button.click());expect(link).toHaveBeenCalledTimes(1);
 render(<ProfileContent {...profileProps} linkGoogle={link} linking />);expect(container.querySelector('.profile-account-action').disabled).toBe(true);
 render(<ProfileContent {...profileProps} linkGoogle={link} isGoogleLinked googleEmail="alex@example.test" />);
 expect(container.querySelector('.profile-account-action')).toBeNull();expect(container.querySelector('.profile-account-linked').textContent).toContain('alex@example.test');
});

test('one category Back clears a global search and returns to all categories',()=>{
 function Browse(){const [family,setFamily]=React.useState('music');return <CategoriesContent family={family} onSelectFamily={setFamily} startWithCategory={jest.fn()} />;}
 render(<Browse />);expect(container.querySelectorAll('.back-link')).toHaveLength(1);expect(container.querySelector('.back-to-topics')).toBeNull();
 const input=container.querySelector('input[type=search]');expect(input.getAttribute('aria-describedby')).toBe('themes-search-scope');
 act(()=>{Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,'Minecraft');input.dispatchEvent(new Event('input',{bubbles:true}));});
 expect(container.querySelector('.tile-v4[data-topic=minecraft]')).not.toBeNull();
 act(()=>container.querySelector('.back-link').click());expect(input.value).toBe('');expect(container.querySelectorAll('.family-tile')).toHaveLength(9);expect(container.querySelector('.back-link')).toBeNull();
});

test('legacy tags do not fabricate popularity or quiz-photo badges',()=>{
 for(const tag of ['🔥','📸']){render(<><CategoryTile c={{key:'booba',label:'Booba',family:'music',tag}} /><CategoryTileV4 c={{key:'booba',label:'Booba',family:'music',tag}} /></>);expect(container.querySelector('.tile-tag-badge,.tile-v4__badge')).toBeNull();expect(container.textContent).not.toMatch(/TOP|PHOTO/);}
});

test('session loading describes its state and offers no actions before recovery completes',()=>{
 render(<HomeLoading />);expect(container.querySelector('[aria-busy=true]')).not.toBeNull();expect(container.querySelector('[role=status]').textContent).toContain('Connexion');expect(container.querySelectorAll('button,a,input')).toHaveLength(0);
});
