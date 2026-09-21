// Identity bootstrap.
//
// Gameplay no longer depends on Firebase Anonymous Auth. Every visitor can get
// a backend-signed QuizzUp guest identity from Railway. Firebase is used only
// when the player explicitly links a Google account.

import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  onAuthStateChanged,
  GoogleAuthProvider,
  linkWithPopup,
  signInWithPopup,
} from 'firebase/auth';
import { getBackendOrigin } from './backend';

const GUEST_TOKEN_KEY = 'quizzup-guest-token-v1';
const GOOGLE_LINKED_KEY = 'quizzup-google-linked-v1';

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

function readStoredGuestToken() {
  try {
    return localStorage.getItem(GUEST_TOKEN_KEY) || '';
  } catch {
    return '';
  }
}

function storeGuestToken(token) {
  try {
    if (token) localStorage.setItem(GUEST_TOKEN_KEY, token);
    else localStorage.removeItem(GUEST_TOKEN_KEY);
  } catch {}
}

function hasLinkedGoogleMarker() {
  try {
    return localStorage.getItem(GOOGLE_LINKED_KEY) === '1';
  } catch {
    return false;
  }
}

function setLinkedGoogleMarker(value) {
  try {
    if (value) localStorage.setItem(GOOGLE_LINKED_KEY, '1');
    else localStorage.removeItem(GOOGLE_LINKED_KEY);
  } catch {}
}

function makeGuestUser(uid, token) {
  return {
    uid,
    isAnonymous: true,
    email: null,
    providerData: [],
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

  storeGuestToken(data.token);
  return makeGuestUser(data.uid, data.token);
}

async function existingLinkedFirebaseUser() {
  if (!hasLinkedGoogleMarker() || !firebaseConfigReady()) return null;

  let auth;
  try {
    auth = getFirebaseAuth();
  } catch {
    return null;
  }

  return new Promise((resolve) => {
    let settled = false;
    let unsubscribe = () => {};
    const finish = (user) => {
      if (settled) return;
      settled = true;
      unsubscribe();
      resolve(user || null);
    };

    const timer = setTimeout(() => finish(null), 1500);
    unsubscribe = onAuthStateChanged(
      auth,
      async (user) => {
        clearTimeout(timer);
        if (!user || user.isAnonymous) {
          finish(null);
          return;
        }
        try {
          await user.getIdToken();
          finish(user);
        } catch {
          finish(null);
        }
      },
      () => {
        clearTimeout(timer);
        finish(null);
      }
    );
  });
}

// Prefer a previously-linked Google session when it is healthy. Otherwise,
// issue/refresh a signed guest identity. Firebase outages therefore cannot
// prevent a player from reaching the game.
async function ensureSignedIn() {
  const linkedUser = await existingLinkedFirebaseUser();
  if (linkedUser) return linkedUser;
  return requestGuestIdentity();
}

// Links the current QuizzUp guest identity to a Firebase Google account.
// The backend stores Firebase UID -> guest UID, so stats/friends remain on the
// same canonical QuizzUp account after the transport switches to Firebase.
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

  if (!response.ok || !data.ok) {
    try { await auth.signOut(); } catch {}
    const err = new Error(data.code || 'Google account link failed');
    err.code = `auth/${String(data.code || 'google-link-failed').toLowerCase()}`;
    throw err;
  }

  setLinkedGoogleMarker(true);
  return result;
}

async function signOutUser() {
  storeGuestToken('');
  setLinkedGoogleMarker(false);
  if (authInstance) await authInstance.signOut();
}

export {
  ensureSignedIn,
  linkGoogleAccount,
  signOutUser,
  onAuthStateChanged,
  firebaseConfigReady,
};
