// js/services/galla-service.js
// Aadesh Tours Udaipur - Daily Cashflow & Galla Tracker (Phase 12)

import { db } from "../config/firebase-config.js";
import { COLLECTIONS, CASHFLOW_CATEGORIES } from "../config/constants.js";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  orderBy,
  limit
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

/**
 * Format date to standard string YYYY-MM-DD
 */
export function getTodayDateString() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * 1. Open Today's Galla (Set Morning Opening Balance)
 * @param {number} openingBalance - Cash present in drawer at start of day
 * @param {string} dateStr - Optional date YYYY-MM-DD (Defaults to today)
 */
export async function openDailyGalla(openingBalance = 0, dateStr = "") {
  try {
    const targetDate = dateStr || getTodayDateString();
    const docRef = doc(db, COLLECTIONS.GALLA, targetDate);
    const existingSnap = await getDoc(docRef);

    if (existingSnap.exists()) {
      return { 
        success: false, 
        message: `Galla for ${targetDate} is already opened.`, 
        data: existingSnap.data() 
      };
    }

    const newGalla = {
      date: targetDate,
      openingBalance: Number(openingBalance) || 0,
      totalCashIn: 0,
      totalCashOut: 0,
      expectedCashBalance: Number(openingBalance) || 0,
      actualPhysicalCash: 0,
      cashDifference: 0, // 0 = Matched, Negative = Shortage, Positive = Excess
      status: "OPEN",    // OPEN or CLOSED
      transactions: [],  // Array of in/out entries
      notes: "",
      openedAt: new Date().toISOString(),
      closedAt: null,
      updatedAt: new Date().toISOString()
    };

    await setDoc(docRef, newGalla);
    return { success: true, message: `Galla opened for ${targetDate} with ₹${openingBalance}`, data: newGalla };
  } catch (error) {
    console.error("Error opening galla:", error);
    return { success: false, message: error.message };
  }
}

/**
 * 2. Get Daily Galla Record
 */
export async function getDailyGalla(dateStr = "") {
  try {
    const targetDate = dateStr || getTodayDateString();
    const docRef = doc(db, COLLECTIONS.GALLA, targetDate);
    const snap = await getDoc(docRef);

    if (snap.exists()) {
      return { success: true, data: snap.data() };
    }
    return { success: false, message: `No galla record found for ${targetDate}.` };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

/**
 * 3. Record Cash In / Out Transaction in Galla
 * @param {string} type - 'IN' (Incoming Cash) or 'OUT' (Expense/Cash Paid)
 * @param {number} amount - Amount in Rupees
 * @param {string} category - Value from CASHFLOW_CATEGORIES or custom text
 * @param {string} referenceId - Optional Trip Slip No / Expense Voucher ID
 * @param {string} remarks - Short description
 * @param {string} dateStr - Target date
 */
export async function addGallaTransaction({
  type = "IN",
  amount = 0,
  category = CASHFLOW_CATEGORIES.TRIP_ADVANCE,
  referenceId = "",
  remarks = "",
  dateStr = ""
}) {
  try {
    const targetDate = dateStr || getTodayDateString();
    const docRef = doc(db, COLLECTIONS.GALLA, targetDate);
    const snap = await getDoc(docRef);

    // Auto-open with 0 balance if not explicitly opened
    let gallaData;
    if (!snap.exists()) {
      const openResult = await openDailyGalla(0, targetDate);
      gallaData = openResult.data;
    } else {
      gallaData = snap.data();
    }

    if (gallaData.status === "CLOSED") {
      throw new Error(`Galla for ${targetDate} has already been closed for the day.`);
    }

    const txAmount = Math.abs(Number(amount));
    const isCashIn = type.toUpperCase() === "IN";

    const newTx = {
      id: `TX_${Date.now().toString().slice(-6)}`,
      type: isCashIn ? "IN" : "OUT",
      amount: txAmount,
      category: category,
      referenceId: referenceId,
      remarks: remarks,
      timestamp: new Date().toISOString()
    };

    const updatedTransactions = [...(gallaData.transactions || []), newTx];
    const newTotalCashIn = (Number(gallaData.totalCashIn) || 0) + (isCashIn ? txAmount : 0);
    const newTotalCashOut = (Number(gallaData.totalCashOut) || 0) + (!isCashIn ? txAmount : 0);
    const newExpectedBalance = (Number(gallaData.openingBalance) || 0) + newTotalCashIn - newTotalCashOut;

    await updateDoc(docRef, {
      transactions: updatedTransactions,
      totalCashIn: newTotalCashIn,
      totalCashOut: newTotalCashOut,
      expectedCashBalance: newExpectedBalance,
      updatedAt: new Date().toISOString()
    });

    return { 
      success: true, 
      message: `Cash ${newTx.type} of ₹${txAmount} recorded. Current Drawer: ₹${newExpectedBalance}`,
      data: newTx 
    };
  } catch (error) {
    console.error("Error adding galla transaction:", error);
    return { success: false, message: error.message };
  }
}

/**
 * 4. Close Evening Galla (Galla Milana & Shortage Check)
 * @param {number} physicalCount - Physical cash notes counted in drawer
 * @param {string} closingNotes - Any explanation or remarks
 * @param {string} dateStr - Target date
 */
export async function closeDailyGalla(physicalCount, closingNotes = "", dateStr = "") {
  try {
    const targetDate = dateStr || getTodayDateString();
    const docRef = doc(db, COLLECTIONS.GALLA, targetDate);
    const snap = await getDoc(docRef);

    if (!snap.exists()) {
      throw new Error(`No galla entry found for ${targetDate} to close.`);
    }

    const galla = snap.data();
    const counted = Number(physicalCount) || 0;
    const expected = Number(galla.expectedCashBalance) || 0;
    const diff = counted - expected; // Negative = Shortage, Positive = Excess

    await updateDoc(docRef, {
      actualPhysicalCash: counted,
      cashDifference: diff,
      status: "CLOSED",
      notes: closingNotes,
      closedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    return {
      success: true,
      message: `Galla closed! Expected: ₹${expected}, Counted: ₹${counted}, Difference: ₹${diff}`,
      summary: {
        expectedCash: expected,
        physicalCash: counted,
        difference: diff,
        isMatched: diff === 0
      }
    };
  } catch (error) {
    console.error("Error closing galla:", error);
    return { success: false, message: error.message };
  }
}

/**
 * 5. Get Recent Galla History (For audit and accounting logs)
 */
export async function getGallaHistory(limitDays = 15) {
  try {
    const gallaCol = collection(db, COLLECTIONS.GALLA);
    const q = query(gallaCol, orderBy("date", "desc"), limit(limitDays));
    const snapshot = await getDocs(q);

    const records = [];
    snapshot.forEach((d) => records.push(d.data()));
    return records;
  } catch (error) {
    console.warn("Unable to fetch galla history:", error);
    return [];
  }
}
