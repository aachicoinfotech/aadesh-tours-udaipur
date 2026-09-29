// js/services/driver-service.js
// Aadesh Tours Udaipur - Driver Master, DL Compliance & Ledger Service

import { db } from "../config/firebase-config.js";
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { addGallaTransaction } from "./galla-service.js";
import { CASHFLOW_CATEGORIES } from "../config/constants.js";

const COLLECTION_NAME = "drivers";

/**
 * 1. Sabhi Drivers ki list lana
 */
export async function getAllDrivers() {
  try {
    const q = query(collection(db, COLLECTION_NAME), orderBy("name", "asc"));
    const snap = await getDocs(q);
    const drivers = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    localStorage.setItem("aadesh_cached_drivers", JSON.stringify(drivers));
    return drivers;
  } catch (err) {
    console.warn("Drivers fetch fallback to cache:", err);
    const cached = localStorage.getItem("aadesh_cached_drivers");
    return cached ? JSON.parse(cached) : [];
  }
}

/**
 * 2. Naya Driver add ya update karna
 */
export async function saveDriver(driverData) {
  try {
    const driverId = driverData.id || ("DRV-" + (driverData.phone || Date.now()).slice(-6));
    const payload = {
      ...driverData,
      id: driverId,
      status: driverData.status || "ACTIVE", // ACTIVE, ON_DUTY, LEAVE
      dailyBhatta: Number(driverData.dailyBhatta) || 300,
      advanceBalance: Number(driverData.advanceBalance) || 0,
      updatedAt: new Date().toISOString()
    };

    await setDoc(doc(db, COLLECTION_NAME, driverId), payload, { merge: true });
    return { success: true, id: driverId };
  } catch (err) {
    console.error("Save driver error:", err);
    return { success: false, message: err.message };
  }
}

/**
 * 3. Driving License (DL) Expiry Status Check karna
 */
export function checkDriverDlStatus(dlExpiryDate) {
  if (!dlExpiryDate) return { status: "UNREGISTERED", label: "DL दर्ज नहीं", isAlert: false, days: null };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expDate = new Date(dlExpiryDate);
  expDate.setHours(0, 0, 0, 0);

  const diffDays = Math.ceil((expDate - today) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { status: "EXPIRED", label: `समाप्त (${Math.abs(diffDays)} दिन पूर्व)`, isAlert: true, days: diffDays, color: "text-rose-400" };
  } else if (diffDays <= 30) {
    return { status: "EXPIRING_SOON", label: `${diffDays} दिन शेष`, isAlert: true, days: diffDays, color: "text-amber-400" };
  } else {
    return { status: "VALID", label: "मान्य (OK)", isAlert: false, days: diffDays, color: "text-emerald-400" };
  }
}

/**
 * 4. Driver ko Raste ka Advance Dena (Galle se Cash Out katna)
 */
export async function giveDriverAdvance(driverId, amount, tripSlipNo = "", remarks = "") {
  try {
    const amt = Number(amount);
    if (amt <= 0) throw new Error("अमान्य राशि");

    const driverRef = doc(db, COLLECTION_NAME, driverId);
    const snap = await getDoc(driverRef);
    if (!snap.exists()) throw new Error("ड्राइवर नहीं मिला");

    const driver = snap.data();
    const newBal = (Number(driver.advanceBalance) || 0) + amt;

    // 1. Driver record me advance jodna
    await setDoc(driverRef, { 
      advanceBalance: newBal,
      updatedAt: new Date().toISOString()
    }, { merge: true });

    // 2. Galle se Cash Out transaction darj karna
    await addGallaTransaction({
      type: "OUT",
      amount: amt,
      category: CASHFLOW_CATEGORIES.DRIVER_ADVANCE || "DRIVER_EXPENSE",
      referenceId: tripSlipNo || driverId,
      remarks: `Driver Advance: ${driver.name} ${tripSlipNo ? `(Slip #${tripSlipNo})` : ''} - ${remarks}`
    });

    return { success: true, newBalance: newBal };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

/**
 * 5. Driver Settlement / Khata Chukta karna
 */
export async function settleDriverAccount(driverId, settledAmount, remarks = "") {
  try {
    const driverRef = doc(db, COLLECTION_NAME, driverId);
    const snap = await getDoc(driverRef);
    if (!snap.exists()) throw new Error("ड्राइवर नहीं मिला");

    const driver = snap.data();
    const currentAdv = Number(driver.advanceBalance) || 0;
    const remainingAdv = Math.max(0, currentAdv - Number(settledAmount));

    await setDoc(driverRef, {
      advanceBalance: remainingAdv,
      lastSettlementDate: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }, { merge: true });

    return { success: true, remainingAdvance: remainingAdv };
  } catch (err) {
    return { success: false, message: err.message };
  }
}
