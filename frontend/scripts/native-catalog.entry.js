import { CATEGORIES } from '../src/ui';
import { getTopicCover } from '../src/topicCovers';
import { localizedTopicTitle } from '../src/topicTitles';

export default Object.fromEntries(CATEGORIES.map(category => {
  const cover = getTopicCover(category);
  const preferred = cover?.srcSet?.split(',').map(s => s.trim()).find(s => s.endsWith('640w'))?.split(' ')[0];
  return [category.key, {
    label: localizedTopicTitle(category, 'fr'), englishLabel: localizedTopicTitle(category, 'en'),
    icon: category.icon || '', family: category.family || 'culture', src: preferred || cover?.src || null,
    fit: cover?.fit || 'cover', description: category.desc || null,
  }];
}));
