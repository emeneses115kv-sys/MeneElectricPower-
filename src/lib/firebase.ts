import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';

const firebaseConfig = {
  projectId: "aqueous-mode-d6pck",
  appId: "1:1086838421812:web:82725540f3f9456bd44d61",
  apiKey: "AIzaSyDn1d4R--5xahyccCQKvhzVrU3uQKK7mgg",
  authDomain: "aqueous-mode-d6pck.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-remixdiagramacon-748430ae-325d-4ff2-bdd2-8537661cd9db",
  storageBucket: "aqueous-mode-d6pck.firebasestorage.app",
  messagingSenderId: "1086838421812"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

export const signInWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error) {
    console.error("Error signing in with Google:", error);
    return null;
  }
};

export const signOutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out:", error);
  }
};
