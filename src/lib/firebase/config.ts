import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getStorage, type FirebaseStorage } from "firebase/storage";
import { getFirestore, type Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let _app: FirebaseApp | undefined;
let _auth: Auth | undefined;
let _storage: FirebaseStorage | undefined;
let _db: Firestore | undefined;

function getOrInitApp(): FirebaseApp {
  if (_app) return _app;
  _app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  return _app;
}

export function getFirebaseAuth(): Auth {
  if (!_auth) _auth = getAuth(getOrInitApp());
  return _auth;
}

export function getFirebaseStorage(): FirebaseStorage {
  if (!_storage) _storage = getStorage(getOrInitApp());
  return _storage;
}

export function getFirebaseDb(): Firestore {
  if (!_db) _db = getFirestore(getOrInitApp());
  return _db;
}
