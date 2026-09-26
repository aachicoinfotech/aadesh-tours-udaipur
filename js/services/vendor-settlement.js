// js/services/vendor-settlement.js
// Aadesh Tours Udaipur - Market Vehicle & Vendor Settlement Engine (Phase 15)

import { db } from "../config/firebase-config.js";
import { COLLECTIONS, CASHFLOW_CATEGORIES } from "../config/constants.js";
import { updateVendorBalance } from "./vendor-service.js";
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

const VENDOR_SETTLEMENT_COLLECTION = "vendor_settlements";

/**
 * Generate Sequential Vendor Settlement Voucher ID (e.g. VS-2609-512)
 */
export function generateVendorSettlementId() {
  const now = new Date();
  const dateStr = now.toISOString().slice(2, 10).replace(/-/g, '');
  const rand = Math.floor(100 + Math.random() * 900);
  return `VS-${dateStr}-${rand}`;
}

/**
 * 1. Calculate Vendor Settlement Commercials
 * @param {Object} params
 */
export function computeVendorSettlementMath({
  model = "COMMISSION",         // 'COMMISSION' or 'NET_RATE'
  totalBilledAmount = 0,        // Total amount billed to customer
  commissionPercent = 10,       // Our commission % (if commission model)
  vendorAgreedAmount = 0,       // Fixed agreed cost payable to vendor (if NET_RATE model)
  advancePaidToVendor = 0,      // Advance sent to vendor by office
  cashCollectedByVendor = 0     // Cash collected directly by vendor driver from guest
}) {
  const billed = Number(totalBilledAmount) || 0;
  let ourCommission = 0;
  let vendorGrossPayable = 0;

  if (model === "NET_RATE") {
    vendorGrossPayable = Number(vendorAgreedAmount) || 0;
    ourCommission = Math.max(0, billed - vendorGrossPayable);
  } else {
    // Percentage Commission Model
    ourCommission = (billed * (Number(commissionPercent) || 0)) / 100;
    vendorGrossPayable = billed - ourCommission;
  }

  // Deductions already received by vendor
  const advance = Number(advancePaidToVendor) || 0;
  const collectedByDriver = Number(cashCollectedByVendor) || 0;
  const totalVendorDeductions = advance + collectedByDriver;

  // Net Balance:
  // Positive = Aadesh Tours must pay vendor
  // Negative = Vendor must refund money to Aadesh Tours
  const netPayableToVendor = vendorGrossPayable - totalVendorDeductions;

  return {
    model,
    totalBilledAmount: billed,
    commissionPercent: Number(commissionPercent),
    ourCommission: Math.round(ourCommission),
    vendorGrossPayable: Math.round(vendorGrossPayable),
    advancePaidToVendor: advance,
    cashCollectedByVendor: collectedByDriver,
    totalVendorDeductions,
    netPayableToVendor: Math.round(netPayableToVendor),
    payableByOffice: netPayableToVendor > 0 ? Math.round(netPayableToVendor) : 0,
    recoveryFromVendor: netPayableToVendor < 0 ? Math.round(Math.abs(netPayableToVendor)) : 0
  };
}

/**
 * 2. Record Completed Vendor Settlement
 * @param {Object} settlementData
 * @param {boolean} recordToGalla - If cash, auto-reflect in daily cash drawer
 */
export async function createVendorSettlement(settlementData, recordToGalla = true) {
  try {
    const vendorId = (settlementData.vendorId || "").trim();
    if (!vendorId) throw new Error("Vendor ID is required for settlement.");

    const settlementId = settlementData.settlementId || generateVendorSettlementId();
    const docRef = doc(db, VENDOR_SETTLEMENT_COLLECTION, settlementId);

    const math = computeVendorSettlementMath(settlementData);

    const settlementRecord = {
      settlementId: settlementId,
      date: settlementData.date || new Date().toISOString().slice(0, 10),
      vendorId: vendorId,
      agencyName: settlementData.agencyName || "Market Vendor",
      dutySlipNumber: settlementData.dutySlipNumber || "",
      vehicleNumber: (settlementData.vehicleNumber || "").toUpperCase().trim(),
      
      // Commercial Math
      breakdown: math,
      paymentMode: settlementData.paymentMode || "BANK", // BANK, UPI, CASH
      paymentReference: settlementData.paymentReference || "", // UTR / Tx ID
      status: "SETTLED",
      remarks: settlementData.remarks || "",
      
      createdAt: new Date().toISOString()
    };

    await setDoc(docRef, settlementRecord);

    // Update vendor ledger running balance
    // Positive math.netPayableToVendor means we owed, paying it zeroes it out
    await updateVendorBalance(vendorId, -math.netPayableToVendor);

    // Auto-reflect cash exchange in Galla if applicable
    if (recordToGalla && settlementRecord.paymentMode.toUpperCase() === "CASH") {
      if (math.payableByOffice > 0) {
        await addGallaTransaction({
          type: "OUT",
          amount: math.payableByOffice,
          category: CASHFLOW_CATEGORIES.OFFICE_EXPENSE,
          referenceId: settlementId,
          remarks: `Vendor Settlement Paid - ${settlementRecord.agencyName} (${settlementRecord.dutySlipNumber})`,
          dateStr: settlementRecord.date
        });
      } else if (math.recoveryFromVendor > 0) {
        await addGallaTransaction({
          type: "IN",
          amount: math.recoveryFromVendor,
          category: CASHFLOW_CATEGORIES.TRIP_SETTLEMENT,
          referenceId: settlementId,
          remarks: `Vendor Commission/Refund Received - ${settlementRecord.agencyName}`,
          dateStr: settlementRecord.date
        });
      }
    }

    return { 
      success: true, 
      message: `Vendor settlement ${settlementId} recorded successfully!`, 
      data: settlementRecord 
    };
  } catch (error) {
    console.error("Error creating vendor settlement:", error);
    return { success: false, message: error.message };
  }
}

/**
 * 3. Get All Settlements for a Specific Vendor
 * @param {string} vendorId
 */
export async function getSettlementsByVendor(vendorId) {
  try {
    const colRef = collection(db, VENDOR_SETTLEMENT_COLLECTION);
    const q = query(colRef, where("vendorId", "==", vendorId));
    const snapshot = await getDocs(q);

    const records = [];
    snapshot.forEach((d) => records.push(d.data()));
    return records.sort((a, b) => new Date(b.date) - new Date(a.date));
  } catch (error) {
    console.error("Failed to fetch vendor settlements:", error);
    return [];
  }
}

/**
 * 4. Get All Vendor Settlements History
 */
export async function getAllVendorSettlements() {
  try {
    const colRef = collection(db, VENDOR_SETTLEMENT_COLLECTION);
    const q = query(colRef, orderBy("date", "desc"));
    const snapshot = await getDocs(q);

    const records = [];
    snapshot.forEach((d) => records.push(d.data()));
    return records;
  } catch (error) {
    console.warn("Unable to fetch vendor settlement history:", error);
    return [];
  }
}
