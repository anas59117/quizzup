// Direction: QuizUp heritage — the white circled bolt and a compact wordmark.
// Rules: one monochrome mark, optical spacing, no decorative effects.
// Signature: the classic lightning silhouette, drawn cleanly at every size.
import React from 'react';
import './brand.css';

export function BrandMark({ className = '' }) {
  return <img className={`brand-symbol ${className}`} src="/brand-symbol.svg" alt="" aria-hidden="true" />;
}

export function BrandLogo() {
  return <span className="home-brand brand-lockup" role="img" aria-label="QuizzUp">
    <BrandMark /><span className="brand-wordmark" aria-hidden="true">QuizzUp</span>
  </span>;
}
