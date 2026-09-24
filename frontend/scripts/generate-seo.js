// Runs automatically before `npm run build` (npm "prebuild" hook).
// Resolves the public site URL once and derives every absolute SEO URL from
// it, so moving from the temporary Vercel address to a custom domain needs
// no code change:
//   1. REACT_APP_SITE_URL, if set (e.g. https://quizzup.fr)
//   2. else Vercel's VERCEL_PROJECT_PRODUCTION_URL — the project's production
//      domain, which becomes the custom domain as soon as one is attached
//   3. else http://localhost:3000 (local builds)
// Outputs (all git-ignored, regenerated on every build):
//   - .env.production.local  -> REACT_APP_SITE_URL used by public/index.html
//   - public/robots.txt, public/sitemap.xml

const fs = require('fs');
const path = require('path');

function resolveSiteUrl(env = process.env) {
  const raw = env.REACT_APP_SITE_URL
    || (env.VERCEL_PROJECT_PRODUCTION_URL && `https://${env.VERCEL_PROJECT_PRODUCTION_URL}`)
    || 'http://localhost:3000';
  const url = new URL(raw.trim());
  return url.origin;
}

function robotsTxt(site) {
  return `User-agent: *\nAllow: /\n\nSitemap: ${site}/sitemap.xml\n`;
}

function sitemapXml(site) {
  const pages = [
    ['/', 'weekly', '1.0'],
    ['/privacy.html', 'yearly', '0.2'],
    ['/image-credits.html', 'monthly', '0.2'],
  ];
  const urls = pages
    .map(([p, freq, prio]) => `  <url><loc>${site}${p}</loc><changefreq>${freq}</changefreq><priority>${prio}</priority></url>`)
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

function main() {
  const root = path.resolve(__dirname, '..');
  const site = resolveSiteUrl();
  fs.writeFileSync(path.join(root, '.env.production.local'), `REACT_APP_SITE_URL=${site}\n`);
  fs.writeFileSync(path.join(root, 'public', 'robots.txt'), robotsTxt(site));
  fs.writeFileSync(path.join(root, 'public', 'sitemap.xml'), sitemapXml(site));
  console.log(`[seo] site URL: ${site}`);
}

if (require.main === module) main();

module.exports = { resolveSiteUrl, robotsTxt, sitemapXml };
