// Firebase initialisation — modular SDK v10 (ESM, loaded straight from the CDN).
// This is the ONLY place Firebase is initialised. One app, one Firestore handle,
// one auth instance, one anonymous sign-in. Everything else imports from here.

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import {
  getFirestore,
  collection, doc,
  getDoc, getDocs,
  setDoc, updateDoc, deleteDoc, addDoc,
  onSnapshot, query, where, orderBy, limit,
  runTransaction, writeBatch, serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { getAuth, signInAnonymously } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';

const firebaseConfig = {
  apiKey: 'AIzaSyB-qLLcm3_oKk1soGsSQui38dM-9M8BN14',
  authDomain: 'matchpoint-e5b00.firebaseapp.com',
  projectId: 'matchpoint-e5b00',
  storageBucket: 'matchpoint-e5b00.firebasestorage.app',
  messagingSenderId: '145208722794',
  appId: '1:145208722794:web:b6f46e386445321019d113'
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

// Single anonymous sign-in. `firebaseReady` resolves to true on success and
// REJECTS on failure — callers await it and surface a clear error instead of
// silently falling back to a local-only copy.
export const firebaseReady = signInAnonymously(auth).then(() => {
  console.log('✅ Firebase connected and authenticated');
  return true;
});

// Re-export the Firestore functions the app needs, so the rest of the codebase
// imports them from one module at one pinned version.
export {
  collection, doc,
  getDoc, getDocs,
  setDoc, updateDoc, deleteDoc, addDoc,
  onSnapshot, query, where, orderBy, limit,
  runTransaction, writeBatch, serverTimestamp
};
