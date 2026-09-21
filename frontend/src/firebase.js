// Firebase Auth — replaces the localStorage clientId with a real, persistent
// identity. Anonymous sign-in keeps "play without an account" working; users
// can later link a Google account to the same uid without losing progress.

import { initializeApp } from 'firebase/app';
import {
  getAuth, onAuthStateChanged, signInAnonymously,
  GoogleAuthProvider, linkWithPopup,
} from 'firebase/auth';

// Firebase's web config is public client configuration (not a service-account
// secret). Keep a checked-in fallback so the Vercel build cannot be bricked by
// a missing/placeholder REACT_APP_* variable. A complete valid environment
// config can still override this for previews or future migrations.
const DEFAULT_FIREBASE_CONFIG = {
  apiKey: 'AIzaSyAQhrcbG2-1YujgQbmJSykNda_fgUpvz0o',
  authDomain: 'quizzup-ae633.firebaseapp.com',
  projectId: 'quizzup-ae633',
  storageBucket: 'quizzup-ae633.firebasestorage.app',
  messagingSenderId: '825347964948',
  appId: '1:825347964948:web:cfbb51e27eb3224253e701',
};

const envFirebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

const hasValidEnvConfig = (
  /^AIza[0-9A-Za-z_-]{30,}$/.test(envFirebaseConfig.apiKey || '')
  && Object.values(envFirebaseConfig).every((value) => typeof value === 'string' && value.trim())
);

const firebaseConfig = hasValidEnvConfig ? envFirebaseConfig : DEFAULT_FIREBASE_CONFIG;

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Ensures a signed-in user (anonymous if nobody has signed in yet) and
// resolves with the Firebase user. Safe to call on every app load.
function ensureSignedIn() {
  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      if (user) { resolve(user); return; }
      signInAnonymously(auth).then((cred) => resolve(cred.user)).catch(reject);
    }, reject);
  });
}

// Upgrades the current anonymous session to a Google account, keeping the
// same uid (so friends/stats tied to that uid carry over automatically).
async function linkGoogleAccount() {
  const user = auth.currentUser;
  if (!user) throw new Error('Not signed in');

  // Never sign into a different uid here: stats/friends are keyed by uid and
  // the backend binds one WebSocket to one verified identity. If Google is
  // already linked, return the current user; otherwise link the provider to
  // this exact account (anonymous or otherwise).
  if (user.providerData.some((provider) => provider.providerId === 'google.com')) {
    return { user };
  }
  return linkWithPopup(user, googleProvider);
}

function signOutUser() {
  return auth.signOut();
}

export { auth, ensureSignedIn, linkGoogleAccount, signOutUser, onAuthStateChanged };
