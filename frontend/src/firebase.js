// Firebase Auth — replaces the localStorage clientId with a real, persistent
// identity. Anonymous sign-in keeps "play without an account" working; users
// can later link a Google account to the same uid without losing progress.

import { initializeApp } from 'firebase/app';
import {
  getAuth, onAuthStateChanged, signInAnonymously,
  GoogleAuthProvider, signInWithPopup, linkWithPopup,
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

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
  if (!user.isAnonymous) return signInWithPopup(auth, googleProvider);
  return linkWithPopup(user, googleProvider);
}

function signOutUser() {
  return auth.signOut();
}

export { auth, ensureSignedIn, linkGoogleAccount, signOutUser, onAuthStateChanged };
