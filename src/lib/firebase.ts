import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { getFirestore, setLogLevel } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Exact Firebase project configuration requested
export const firebaseConfig = {
  apiKey: "AIzaSyChex6LVImnOrUS94SgvhRJ5-Ugjpybevg",
  authDomain: "hisaab-kitaab-27e3f.firebaseapp.com",
  projectId: "hisaab-kitaab-27e3f",
  storageBucket: "hisaab-kitaab-27e3f.firebasestorage.app",
  messagingSenderId: "130568215824",
  appId: "1:130568215824:web:dec9dec4ac252011581995",
  measurementId: "G-6V5FRYTS4W"
};

let app: any;
let auth: any;
let db: any;
let storage: any;
let googleProvider: any;

try {
  // Silence unreachable offline logs to maintain clean console
  setLogLevel('silent');
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
  googleProvider = new GoogleAuthProvider();
  console.log("🔥 Firebase Auth, Firestore & Storage initialized for:", firebaseConfig.projectId);
} catch (e) {
  console.warn("Firebase initialization notice:", e);
}

export { app, auth, db, storage, googleProvider, signInWithPopup };
export const isFirebaseEnabled = () => !!db;
export const isFirebaseConfigured = () => !!db;
