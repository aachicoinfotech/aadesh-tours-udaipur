// js/services/expense-service.js
// Aadesh Tours Udaipur - Expense Management & Cost Tracking (Phase 13)

import { db } from "../config/firebase-config.js";
import { COLLECTIONS, CASHFLOW_CATEGORIES } from "../config/constants.js";
import { addGallaTransaction } from "./galla-service.js";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

/**
 * Generate Sequential Expense Voucher ID (e.g. EXP-2609-0412)
 */
export function generateExpenseVoucherId() {
  const now = new Date();
  const datePart = now.toISOString().slice(2, 10).replace(/-/g, '');
  const rand = Math.floor(100 + Math.random() * 900);
  return `EXP-${datePart}-${rand}`;
}

/**
 * 1. Record New Business Expense
 * @param {Object} expenseData
 * @param {boolean} deductFromGalla - If true and paid via CASH, deducts from today's cash drawer
 */
export async function addExpense(expenseData, deductFromGalla = true) {
  try {
    const amount = Number(expenseData.amount);
    if (!amount || amount <= 0) {
      throw new Error("Please enter a valid expense amount.");
    }

    const voucherId = expenseData.voucherId || generateExpenseVoucherId();
    const docRef = doc(db, COLLECTIONS.EXPENSES, voucherId);

    const newExpense = {
      voucherId: voucherId,
      date: expenseData.date || new Date().toISOString().slice(0, 10),
      category: expenseData.category || CASHFLOW_CATEGORIES.FUEL_EXPENSE,
      amount: amount,
      paymentMode: expenseData.paymentMode || "CASH", // CASH, UPI, FASTAG_WALLET, PETROL_CARD
      
      // Associations
      vehicleId: (expenseData.vehicleId || "").toUpperCase().trim(), // Vehicle Reg No
      dutySlipNumber: (expenseData.dutySlipNumber || "").trim(),      // If linked to a trip
      driverId: (expenseData.driverId || "").trim(),                  // Driver who paid/claimed
      
      // Fuel details (If category is Fuel)
      fuelDetails: {
        liters: Number(expenseData.fuelLiters) || 0,
        ratePerLiter: Number(expenseData.fuelRatePerLiter) || 0,
        odometerReading: Number(expenseData.odometerReading) || 0
      },

      receiptImageBase64: expenseData.receiptImageBase64 || "", // Compact base64 string
      remarks: expenseData.remarks || "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await setDoc(docRef, newExpense);

    // Auto-reflect in Daily Galla if paid in cash
    if (deductFromGalla && newExpense.paymentMode.toUpperCase() === "CASH") {
      await addGallaTransaction({
        type: "OUT",
        amount: amount,
        category: newExpense.category,
        referenceId: voucherId,
        remarks: `${newExpense.category} - ${newExpense.vehicleId || newExpense.remarks || 'General'}`,
        dateStr: newExpense.date
      });
    }

    return { 
      success: true, 
      message: `Expense voucher ${voucherId} of ₹${amount} saved!`, 
      data: newExpense 
    };
  } catch (error) {
    console.error("Error logging expense:", error);
    return { success: false, message: error.message };
  }
}

/**
 * 2. Get All Expenses (Sorted by date descending)
 */
export async function getAllExpenses() {
  try {
    const expCol = collection(db, COLLECTIONS.EXPENSES);
    const q = query(expCol, orderBy("date", "desc"));
    const snapshot = await getDocs(q);

    const expenses = [];
    snapshot.forEach((d) => expenses.push(d.data()));
    return expenses;
  } catch (error) {
    console.warn("Unable to fetch expenses from Firestore:", error);
    return [];
  }
}

/**
 * 3. Get Expenses Filtered by Vehicle (For vehicle maintenance/fuel analysis)
 * @param {string} vehicleId - Vehicle registration number
 */
export async function getExpensesByVehicle(vehicleId) {
  try {
    const cleanId = (vehicleId || "").toUpperCase().trim();
    const expCol = collection(db, COLLECTIONS.EXPENSES);
    const q = query(expCol, where("vehicleId", "==", cleanId));
    const snapshot = await getDocs(q);

    const vehicleExpenses = [];
    snapshot.forEach((d) => vehicleExpenses.push(d.data()));
    
    // Sort in memory by date desc
    return vehicleExpenses.sort((a, b) => new Date(b.date) - new Date(a.date));
  } catch (error) {
    console.error("Failed to fetch vehicle expenses:", error);
    return [];
  }
}

/**
 * 4. Get Expenses Linked to a Specific Trip
 * @param {string} dutySlipNumber
 */
export async function getExpensesByTrip(dutySlipNumber) {
  try {
    const expCol = collection(db, COLLECTIONS.EXPENSES);
    const q = query(expCol, where("dutySlipNumber", "==", dutySlipNumber));
    const snapshot = await getDocs(q);

    const tripExpenses = [];
    snapshot.forEach((d) => tripExpenses.push(d.data()));
    return tripExpenses;
  } catch (error) {
    console.error("Failed to fetch trip expenses:", error);
    return [];
  }
}

/**
 * 5. Delete Expense Voucher
 */
export async function deleteExpense(voucherId) {
  try {
    const docRef = doc(db, COLLECTIONS.EXPENSES, voucherId);
    await deleteDoc(docRef);
    return { success: true, message: `Voucher ${voucherId} deleted.` };
  } catch (error) {
    return { success: false, message: error.message };
  }
}
