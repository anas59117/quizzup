import fs from 'fs';
import path from 'path';
import { CATEGORIES, FAMILIES } from './ui';
import { getTopicCover } from './topicCovers';
import { localizedTopicTitle } from './topicTitles';

const nativeRoot=path.resolve(__dirname,'../../ios/Sources/QuizzUp');
const catalog=JSON.parse(fs.readFileSync(path.join(nativeRoot,'Resources/topic-catalog.json'),'utf8'));

test('the native app exposes the same topic families in the same order as the website',()=>{
  const swift=fs.readFileSync(path.join(nativeRoot,'Views/NativeCatalog.swift'),'utf8');
  const nativeFamilies=[...swift.matchAll(/\.init\(id: "([^"]+)"/g)].map(match=>match[1]);
  expect(nativeFamilies).toEqual(FAMILIES.map(family=>family.key));
});

test('every web quiz is bundled in the app under its correct family',()=>{
  expect(Object.keys(catalog).sort()).toEqual(CATEGORIES.map(topic=>topic.key).sort());
  for(const topic of CATEGORIES)expect(catalog[topic.key].family).toBe(topic.family || 'culture');
});

test('Who am I quizzes retain the reviewed web titles, descriptions and cover images',()=>{
  const topics=CATEGORIES.filter(topic=>topic.family==='qui_suis_je');
  expect(topics.length).toBeGreaterThan(0);
  for(const topic of topics){
    const bundled=catalog[topic.key],cover=getTopicCover(topic);
    expect(bundled).toBeDefined();
    expect(bundled.label).toBe(localizedTopicTitle(topic,'fr'));
    expect(bundled.englishLabel).toBe(localizedTopicTitle(topic,'en'));
    expect(bundled.description).toBe(topic.desc);
    const preferred=cover?.srcSet?.split(',').map(value=>value.trim()).find(value=>value.endsWith('640w'))?.split(' ')[0];
    expect(bundled.src).toBe(preferred || cover?.src || null);
    expect(bundled.focal).toBe(cover?.focal);
  }
});
