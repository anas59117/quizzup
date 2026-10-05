// Google H5 Games Ads (Ad Placement API).
// Ads stay fully off until REACT_APP_ADSENSE_CLIENT (ca-pub-...) is set on
// Vercel, so nothing changes for players before the AdSense account is
// approved. REACT_APP_ADS_TEST=on shows Google's test ads.
// Docs: https://developers.google.com/ad-placement/apis

const CLIENT = (process.env.REACT_APP_ADSENSE_CLIENT || '').trim();
const TEST = process.env.REACT_APP_ADS_TEST === 'on';
// One interstitial at most every N finished games (Google may show fewer).
export const GAMES_PER_INTERSTITIAL = 5;
const COUNTER_KEY = 'qz_games_since_ad';

let loaded = false;

export function adsEnabled() {
  return !!CLIENT;
}

function adBreak(options) {
  if (!loaded || typeof window === 'undefined') return false;
  window.adsbygoogle.push(options);
  return true;
}

export function initAds() {
  if (!CLIENT || loaded || typeof document === 'undefined') return;
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(CLIENT)}`;
  script.crossOrigin = 'anonymous';
  script.setAttribute('data-ad-frequency-hint', '120s');
  if (TEST) script.setAttribute('data-adbreak-test', 'on');
  document.head.appendChild(script);
  window.adsbygoogle = window.adsbygoogle || [];
  loaded = true;
  window.adsbygoogle.push({ preloadAdBreaks: 'on', sound: 'on' }); // adConfig
}

function readCounter() {
  try { return Math.max(0, Number(window.localStorage.getItem(COUNTER_KEY)) || 0); } catch { return 0; }
}

function writeCounter(n) {
  try { window.localStorage.setItem(COUNTER_KEY, String(n)); } catch { /* private mode */ }
}

// Call once per finished game.
export function countFinishedGame() {
  writeCounter(readCounter() + 1);
}

// Any ad actually shown (interstitial or rewarded) restarts the count.
function resetCounter() {
  writeCounter(0);
}

// Interstitial between games: runs `next` right away when no ad is due,
// otherwise after the ad. If the ad script never answers (blocked, offline),
// `next` still runs after a short delay so the player is never stuck.
export function interstitialThen(next, { beforeAd, afterAd } = {}) {
  if (!adsEnabled() || readCounter() < GAMES_PER_INTERSTITIAL) { next(); return; }
  let finished = false;
  let started = false;
  const finish = () => { if (finished) return; finished = true; next(); };
  const pushed = adBreak({
    type: 'next',
    name: 'between_games',
    beforeAd: () => { started = true; resetCounter(); beforeAd?.(); },
    afterAd: () => { afterAd?.(); },
    adBreakDone: finish,
  });
  if (!pushed) { finish(); return; }
  setTimeout(() => { if (!started) finish(); }, 1500);
}

// Rewarded ad offer. `onOffer(showAdFn)` fires only when Google has an ad
// ready; the game shows its button and calls showAdFn on click.
export function requestRewardOffer({ onOffer, onViewed, onDismissed, beforeAd, afterAd }) {
  if (!adsEnabled()) return;
  adBreak({
    type: 'reward',
    name: 'double_coins',
    beforeReward: (showAdFn) => onOffer?.(showAdFn),
    beforeAd: () => { resetCounter(); beforeAd?.(); },
    afterAd: () => { afterAd?.(); },
    adViewed: () => onViewed?.(),
    adDismissed: () => onDismissed?.(),
    adBreakDone: () => {},
  });
}
