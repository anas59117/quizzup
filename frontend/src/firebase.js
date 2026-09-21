// Identity bootstrap.
//
// Gameplay does not depend on Firebase Anonymous Auth. Every visitor gets a
// backend-signed QuizzUp guest identity from Railway. Firebase is contacted
// only when the player explicitly links a Google account.

import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  linkWithPopup,
  signInWithPopup,
} from 'firebase/auth';
import { getBackendOrigin } from './backend';

const GUEST_TOKEN_KEY = 'quizzup-guest-token-v1';
const GOOGLE_LINKED_KEY = 'quizzup-google-linked-v1';
const GOOGLE_EMAIL_KEY = 'quizzup-google-email-v1';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

let authInstance = null;

function firebaseConfigReady() {
  return (
    /^AIza[0-9A-Za-z_-]{30,}$/.test(firebaseConfig.apiKey || '')
    && Object.values(firebaseConfig).every(
      (value) => typeof value === 'string' && value.trim()
    )
  );
}

function getFirebaseAuth() {
  if (!firebaseConfigReady()) {
    const err = new Error('Firebase Web configuration is unavailable');
    err.code = 'auth/firebase-config-unavailable';
    throw err;
  }
  if (authInstance) return authInstance;
  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  authInstance = getAuth(app);
  return authInstance;
}

function readLocal(key) {
  try {
    return localStorage.getItem(key) || '';
  } catch {
    return '';
  }
}

function writeLocal(key, value) {
  try {
    if (value) localStorage.setItem(key, value);
    else localStorage.removeItem(key);
  } catch {}
}

function readStoredGuestToken() {
  return readLocal(GUEST_TOKEN_KEY);
}

function makeGuestUser(uid, token) {
  const googleLinked = readLocal(GOOGLE_LINKED_KEY) === '1';
  const email = googleLinked ? readLocal(GOOGLE_EMAIL_KEY) || null : null;
  return {
    uid,
    isAnonymous: !googleLinked,
    email,
    providerData: googleLinked ? [{ providerId: 'google.com', email }] : [],
    _quizzupGuest: true,
    getIdToken: async () => token,
  };
}

async function requestGuestIdentity() {
  const existingToken = readStoredGuestToken();
  const headers = {};
  if (existingToken) headers.Authorization = `Bearer ${existingToken}`;

  let response;
  try {
    response = await fetch(`${getBackendOrigin()}/auth/guest`, {
      method: 'POST',
      headers,
      cache: 'no-store',
    });
  } catch (cause) {
    const err = new Error('Guest identity service is unreachable');
    err.code = 'auth/guest-service-unreachable';
    err.cause = cause;
    throw err;
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.uid || !data.token) {
    const err = new Error(data.code || 'Guest identity request failed');
    err.code = `auth/${String(data.code || 'guest-request-failed').toLowerCase()}`;
    throw err;
  }

  writeLocal(GUEST_TOKEN_KEY, data.token);
  return makeGuestUser(data.uid, data.token);
}

// The backend-signed guest token is always the gameplay identity. This keeps
// startup independent from Firebase even after a Google account has been
// linked. Google remains an account-recovery/linking provider, not a boot
// dependency.
async function ensureSignedIn() {
  return requestGuestIdentity();
}

// Link Google to the existing canonical guest account. The frontend continues
// using the guest token after linking, so a later Firebase outage cannot knock
// the player out of the game. The backend persists Firebase UID -> guest UID
// for future account-recovery flows.
async function linkGoogleAccount() {
  const guestToken = readStoredGuestToken();
  if (!guestToken) {
    const err = new Error('Guest identity is missing');
    err.code = 'auth/guest-token-missing';
    throw err;
  }

  const auth = getFirebaseAuth();
  const googleProvider = new GoogleAuthProvider();

  let result;
  const current = auth.currentUser;
  if (current?.providerData?.some((provider) => provider.providerId === 'google.com')) {
    result = { user: current };
  } else if (current?.isAnonymous) {
    result = await linkWithPopup(current, googleProvider);
  } else {
    result = await signInWithPopup(auth, googleProvider);
  }

  const firebaseToken = await result.user.getIdToken(true);
  const response = await fetch(`${getBackendOrigin()}/auth/link-google`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${guestToken}`,
      'X-Firebase-ID-Token': firebaseToken,
    },
    cache: 'no-store',
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok || !data.ok || !data.uid) {
    try { await auth.signOut(); } catch {}
    const err = new Error(data.code || 'Google account link failed');
    err.code = `auth/${String(data.code || 'google-link-failed').toLowerCase()}`;
    throw err;
  }

  writeLocal(GOOGLE_LINKED_KEY, '1');
  writeLocal(GOOGLE_EMAIL_KEY, result.user.email || '');
  return { user: makeGuestUser(data.uid, guestToken) };
}

async function signOutUser() {
  writeLocal(GUEST_TOKEN_KEY, '');
  writeLocal(GOOGLE_LINKED_KEY, '');
  writeLocal(GOOGLE_EMAIL_KEY, '');
  if (authInstance) await authInstance.signOut();
}

export {
  ensureSignedIn,
  linkGoogleAccount,
  signOutUser,
  firebaseConfigReady,
};
