import React from 'react';
import { useI18n } from './i18n';

export function SkipLink() {
  const { t } = useI18n();
  return <a className="skip-link" href="#main-content" tabIndex={0} onClick={event => {
    event.preventDefault();
    const main = document.getElementById('main-content');
    if (!main) return;
    // Focus the heading without adding a fragment to the app's navigation history.
    const target = main.querySelector('h1[tabindex="-1"]') || main;
    target.focus({ preventScroll: true });
    target.scrollIntoView({ block: 'nearest' });
  }}>{t('skipToContent')}</a>;
}
