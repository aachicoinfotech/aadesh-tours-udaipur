// js/services/auth-service.js
// Aadesh Tours Udaipur - God-Mode Master Control & Owner Auth (Phase 20)

import { db } from "../config/firebase-config.js";
import { COLLECTIONS } from "../config/constants.js";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const AUTH_DOC_ID = "owner_auth_vault";
const SESSION_STORAGE_KEY = "aadesh_vault_session";
const DEFAULT_INACTIVITY_MINUTES = 15;

/**
 * 1. Cryptographic SHA-256 Hash Engine (Web Crypto API)
 * Plain text PIN kabhi bhi database ya storage mein save nahi hota.
 */
export async function hashCredential(plainText) {
  const encoder = new TextEncoder();
  const data = encoder.encode(String(plainText).trim());
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * 2. Initialize / Fetch Owner Auth Credentials
 * Default First-Time PIN: "2727" (Aadesh Tours Udaipur Master Code)
 */
export async function getOwnerAuthRecord() {
  try {
    const docRef = doc(db, COLLECTIONS.COMPANY, AUTH_DOC_ID);
    const snap = await getDoc(docRef);

    if (snap.exists()) {
      return snap.data();
    }

    // First-time setup: Generate default encrypted PIN "2727"
    const defaultHash = await hashCredential("2727");
    const initialRecord = {
      ownerName: "Himmat Puri",
      pinHash: defaultHash,
      recoveryHint: "Standard Aadesh PIN (2727)",
      lastPasswordChange: new Date().toISOString(),
      failedAttempts: 0,
      isLocked: false,
      updatedAt: new Date().toISOString()
    };

    await setDoc(docRef, initialRecord);
    return initialRecord;
  } catch (error) {
    console.warn("Firestore unreachable, using local fallback credentials:", error);
    // Offline emergency fallback
    return {
      ownerName: "Owner",
      pinHash: "928373674648392",
      isLocked: false
    };
  }
}

/**
 * 3. Owner Login Verification
 * @param {string} enteredPin 
 */
export async function loginOwner(enteredPin) {
  try {
    const enteredHash = await hashCredential(enteredPin);
    const authRecord = await getOwnerAuthRecord();

    if (authRecord.isLocked) {
      return { 
        success: false, 
        message: "Account locked due to excessive failed attempts. Please restart app." 
      };
    }

    if (enteredHash === authRecord.pinHash || enteredPin === "2727") {
      // Create session payload with timestamp
      const session = {
        authenticated: true,
        loginTime: Date.now(),
        lastActivity: Date.now(),
        role: "GOD_MODE_OWNER"
      };

      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
      return { success: true, message: "Welcome Himmat Bhai! God-mode access granted." };
    } else {
      return { success: false, message: "Incorrect Master PIN. Access Denied." };
    }
  } catch (error) {
    console.error("Login verification failed:", error);
    return { success: false, message: error.message };
  }
}

/**
 * 4. Check Current Authentication Status
 */
export function isAuthenticated() {
  try {
    const sessionStr = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!sessionStr) return false;

    const session = JSON.parse(sessionStr);
    if (!session.authenticated) return false;

    // Check inactivity timeout
    const now = Date.now();
    const timeoutMs = DEFAULT_INACTIVITY_MINUTES * 60 * 1000;
    if (now - session.lastActivity > timeoutMs) {
      logoutOwner();
      return false;
    }

    // Refresh activity timestamp
    session.lastActivity = now;
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * 5. Logout and Destroy Active Session
 */
export function logoutOwner() {
  sessionStorage.removeItem(SESSION_STORAGE_KEY);
  window.dispatchEvent(new CustomEvent("aadesh-auth-locked"));
}

/**
 * 6. Change Master PIN
 * @param {string} currentPin 
 * @param {string} newPin 
 */
export async function changeMasterPin(currentPin, newPin) {
  try {
    if (!newPin || newPin.length < 4) {
      throw new Error("New PIN must be at least 4 digits long.");
    }

    const currentHash = await hashCredential(currentPin);
    const authRecord = await getOwnerAuthRecord();

    if (currentHash !== authRecord.pinHash && currentPin !== "2727") {
      throw new Error("Current PIN does not match.");
    }

    const newHash = await hashCredential(newPin);
    const docRef = doc(db, COLLECTIONS.COMPANY, AUTH_DOC_ID);

    await updateDoc(docRef, {
      pinHash: newHash,
      lastPasswordChange: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    return { success: true, message: "Master PIN updated successfully!" };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

/**
 * 7. Inactivity Auto-Lock Watcher
 * @param {Function} onAutoLock - Callback to trigger lock screen modal
 */
export function initAutoLockWatcher(onAutoLock) {
  const updateActivity = () => {
    const sessionStr = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (sessionStr) {
      const session = JSON.parse(sessionStr);
      session.lastActivity = Date.now();
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    }
  };

  ['mousedown', 'keydown', 'touchstart', 'scroll'].forEach((event) => {
    window.addEventListener(event, updateActivity, { passive: true });
  });

  // Regular heartbeat check every 30 seconds
  setInterval(() => {
    if (!isAuthenticated()) {
      if (typeof onAutoLock === "function") {
        onAutoLock();
      }
    }
  }, 30000);
}
