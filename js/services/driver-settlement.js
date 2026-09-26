// js/services/driver-settlement.js
// Aadesh Tours Udaipur - Driver Allowance & Trip Settlement (Phase 14)

import { db } from "../config/firebase-config.js";
import { COLLECTIONS, CASHFLOW_CATEGORIES } from "../config/constants.js";
import { addGallaTransaction } from "./galla-service.js";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  query,
  where,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const SETTLEMENT_COLLECTION = "driver_settlements";

/**
 * Generate Sequential Settlement Voucher ID (e.g. DS-2609-842)
 */
export function generateSettlementId() {
  const now = new Date();
  const dateStr = now.toISOString().slice(2, 10).replace(/-/g, '');
  const rand = Math.floor(100 + Math.random() * 900);
  return `DS-${dateStr}-${rand}`;
}

/**
 * 1. Compute Settlement Breakdown Math
 * @param {Object} params
 */
export function computeDriverSettlementMath({
  bhattaDays = 1,
  bhattaRatePerDay = 300,
  nightHaltDays = 0,
  nightHaltRate = 250,
  driverPaidExpenses = 0, // Expenses paid by driver from his own pocket (fuel/toll)
  advanceGiven = 0,       // Cash advance taken from office prior to trip
  cashCollectedFromGuest = 0 // Cash collected directly by driver from customer
}) {
  const totalBhatta = Number(bhattaDays) * Number(bhattaRatePerDay);
  const totalNightCharges = Number(nightHaltDays) * Number(nightHaltRate);
  
  // Total money driver earned/spent
  const totalDriverEntitlement = totalBhatta + totalNightCharges + Number(driverPaidExpenses);
  
  // Total money driver already received/held
  const totalDriverDeductions = Number(advanceGiven) + Number(cashCollectedFromGuest);

  // Net Balance: Positive = Office must pay driver, Negative = Driver must return money to office
  const netAmount = totalDriverEntitlement - totalDriverDeductions;

  return {
    totalBhatta,
    totalNightCharges,
    driverPaidExpenses: Number(driverPaidExpenses),
    totalDriverEntitlement,
    advanceGiven: Number(advanceGiven),
    cashCollectedFromGuest: Number(cashCollectedFromGuest),
    totalDriverDeductions,
    netAmount,
    payoutRequired: netAmount > 0 ? netAmount : 0,    // Office pays driver
    recoveryRequired: netAmount < 0 ? Math.abs(netAmount) : 0 // Driver refunds office
  };
}

/**
 * 2. Record Completed Driver Settlement
 * @param {Object} settlementData
 * @param {boolean} recordToGalla - Auto-reflect final settlement payment/recovery in cash drawer
 */
export async function createDriverSettlement(settlementData, recordToGalla = true) {
  try {
    const driverId = (settlementData.driverId || "").trim();
    if (!driverId) throw new Error("Driver ID is required for settlement.");

    const settlementId = settlementData.settlementId || generateSettlementId();
    const docRef = doc(db, SETTLEMENT_COLLECTION, settlementId);

    const math = computeDriverSettlementMath(settlementData);

    const settlementRecord = {
      settlementId: settlementId,
      date: settlementData.date || new Date().toISOString().slice(0, 10),
      driverId: driverId,
      driverName: settlementData.driverName || "Driver",
      dutySlipNumber: settlementData.dutySlipNumber || "",
      vehicleId: settlementData.vehicleId || "",
      
      // Math Breakdown
      breakdown: math,
      finalPaidAmount: Number(settlementData.finalPaidAmount !== undefined ? settlementData.finalPaidAmount : math.payoutRequired),
      paymentMode: settlementData.paymentMode || "CASH", // CASH, UPI, BANK
      status: "SETTLED",
      remarks: settlementData.remarks || "",
      
      createdAt: new Date().toISOString()
    };

    await setDoc(docRef, settlementRecord);

    // Reflect net cash exchange in Galla if applicable
    if (recordToGalla && settlementRecord.paymentMode.toUpperCase() === "CASH") {
      if (math.payoutRequired > 0) {
        // Cash paid to driver from drawer
        await addGallaTransaction({
          type: "OUT",
          amount: math.payoutRequired,
          category: CASHFLOW_CATEGORIES.DRIVER_BHATTA,
          referenceId: settlementId,
          remarks: `Driver Bhatta Settled - ${settlementRecord.driverName} (${settlementRecord.dutySlipNumber})`,
          dateStr: settlementRecord.date
        });
      } else if (math.recoveryRequired > 0) {
        // Driver deposited remaining customer cash into drawer
        await addGallaTransaction({
          type: "IN",
          amount: math.recoveryRequired,
          category: CASHFLOW_CATEGORIES.TRIP_SETTLEMENT,
          referenceId: settlementId,
          remarks: `Driver Cash Refund - ${settlementRecord.driverName} (${settlementRecord.dutySlipNumber})`,
          dateStr: settlementRecord.date
        });
      }
    }

    return { 
      success: true, 
      message: `Settlement ${settlementId} completed successfully!`, 
      data: settlementRecord 
    };
  } catch (error) {
    console.error("Error creating driver settlement:", error);
    return { success: false, message: error.message };
  }
}

/**
 * 3. Get All Settlements for a Specific Driver
 * @param {string} driverId
 */
export async function getSettlementsByDriver(driverId) {
  try {
    const colRef = collection(db, SETTLEMENT_COLLECTION);
    const q = query(colRef, where("driverId", "==", driverId));
    const snapshot = await getDocs(q);

    const records = [];
    snapshot.forEach((d) => records.push(d.data()));
    return records.sort((a, b) => new Date(b.date) - new Date(a.date));
  } catch (error) {
    console.error("Failed to fetch driver settlements:", error);
    return [];
  }
}

/**
 * 4. Get All Settlements History
 */
export async function getAllDriverSettlements() {
  try {
    const colRef = collection(db, SETTLEMENT_COLLECTION);
    const q = query(colRef, orderBy("date", "desc"));
    const snapshot = await getDocs(q);

    const records = [];
    snapshot.forEach((d) => records.push(d.data()));
    return records;
  } catch (error) {
    console.warn("Unable to fetch settlement history:", error);
    return [];
  }
}
