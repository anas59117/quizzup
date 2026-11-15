import React, {act} from 'react';
import {createRoot} from 'react-dom/client';
import {I18nProvider} from './i18n';
import {PlayerProgress} from './PlayerProgress';
let root,container;
beforeEach(()=>{global.IS_REACT_ACT_ENVIRONMENT=true;jest.useFakeTimers();localStorage.setItem('quizzup-lang','fr');container=document.createElement('div');document.body.append(container);root=createRoot(container);});
afterEach(()=>{act(()=>root.unmount());container.remove();jest.useRealTimers();});
test('a confirmed level crossing animates to authoritative after progress and names the earned level',()=>{
 act(()=>root.render(<I18nProvider><PlayerProgress result stats={{level:5,xpIntoLevel:120,xpForLevel:3000}} before={{level:4,xpIntoLevel:2300,xpForLevel:2400}} /></I18nProvider>));
 act(()=>jest.runAllTimers());
 expect(container.textContent).toContain('Niveau 5 atteint');
 expect(container.querySelector('progress').value).toBeCloseTo(0.04);
 expect(container.querySelector('.progression-main').textContent).not.toContain('3000');
});
test('older result payloads remain valid without claiming an unconfirmed level-up',()=>{
 act(()=>root.render(<I18nProvider><PlayerProgress result stats={{level:4,xpIntoLevel:500,xpForLevel:2400}} /></I18nProvider>));
 act(()=>jest.runAllTimers());expect(container.textContent).not.toContain('atteint');
 expect(container.querySelector('progress').value).toBeCloseTo(500/2400);
});
