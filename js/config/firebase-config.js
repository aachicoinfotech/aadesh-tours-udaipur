// js/config/firebase-config.js
// Aadesh Tours Udaipur - Firebase Foundation (Phase 1)

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { 
  getFirestore, 
  enableIndexedDbPersistence 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// Firebase Console Credentials (Aapke Notepad se exact match)
const firebaseConfig = {
  apiKey: "AIzaSyCBa61UM5So8d0aTq2GCS46vT8-ZWp6US4",
  authDomain: "aadesh-tours-udaipur.firebaseapp.com",
  projectId: "aadesh-tours-udaipur",
  storageBucket: "aadesh-tours-udaipur.firebasestorage.app",
  messagingSenderId: "451232592122",
  appId: "1:451232592122:web:28be80dbaa31dc6141d943",
  measurementId: "G-WBZQV1S49B"
};

// 1. Initialize Firebase App
const app = initializeApp(firebaseConfig);

// 2. Export Database Instance
export const db = getFirestore(app);

// 3. Offline Cache Persistence (Internet na hone par bhi chalega)
try {
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn("Multiple tabs open; offline cache active in first tab.");
    } else if (err.code === 'unimplemented') {
      console.warn("Browser does not support offline storage.");
    }
  });
} catch (e) {
  console.log("Persistence note:", e);
}

console.log("Aachico Vault: Database connected for Aadesh Tours.");
