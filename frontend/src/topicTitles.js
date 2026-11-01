import titles from './internationalTopicTitles.json';

// Translatable editorial titles live in text, independently from the artwork.
// Franchise and club wordmarks retain their existing presentation.
export { titles as INTERNATIONAL_TOPIC_TITLES };
export function localizedTopicTitle(category, lang = 'fr') {
  const title = titles[category.key];
  return title ? title[lang] || title.fr : category.label;
}
