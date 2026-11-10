import { CATEGORIES } from '../src/ui';
import { getTopicCover } from '../src/topicCovers';
import { localizedTopicTitle } from '../src/topicTitles';
import { topicDetailPresentation } from '../src/topicDetailPresentation';

export default Object.fromEntries(CATEGORIES.map(category => {
  const cover = getTopicCover(category);
  const detail = topicDetailPresentation(category, cover);
  const preferred = cover?.srcSet?.split(',').map(s => s.trim()).find(s => s.endsWith('640w'))?.split(' ')[0];
  return [category.key, {
    label: localizedTopicTitle(category, 'fr'), englishLabel: localizedTopicTitle(category, 'en'),
    icon: category.icon || '', family: category.family || 'culture', src: preferred || cover?.src || null,
    fit: cover?.fit || 'cover', description: category.desc || null, focal: cover?.focal,
    detailTint: detail.tint, detailFit: detail.fit, detailFocal: detail.focal,
    detailSrc: preferred && preferred !== cover?.src ? cover?.src : undefined,
    detailEyebrow: detail.eyebrow, detailDescription: detail.description,
    detailEnglishDescription: detail.englishDescription !== detail.description ? detail.englishDescription : undefined,
  }];
}));
