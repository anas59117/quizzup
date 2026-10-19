import React from 'react';
import { BrandLogo } from './Brand';
import { useI18n } from './i18n';

// The real session still gates gameplay and recovery. These shapes describe
// the incoming layout without exposing stale progress or interactive actions.
export function HomeLoading() {
  const { lang } = useI18n();
  return <main className="container wide home-v4 home-refined home-loading" aria-busy="true">
    <header className="home-head"><BrandLogo /><span className="home-loading-controls" aria-hidden="true"><i /><i /></span></header>
    <p className="home-loading-status" role="status">{lang === 'fr' ? 'Connexion à ta session…' : 'Connecting to your session…'}</p>
    <div className="home-loading-content" aria-hidden="true">
      <div className="home-loading-heading" />
      <div className="home-loading-grid">{[0,1,2,3].map(index => <div key={index} className="home-loading-card" />)}</div>
      <div className="home-loading-heading is-short" />
      <div className="home-loading-discovery"><div /><div /></div>
      <div className="home-loading-community" />
    </div>
  </main>;
}
