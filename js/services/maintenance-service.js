// js/services/maintenance-service.js
// Aadesh Tours Udaipur - Vehicle Maintenance & Garage Logs (Phase 16)

import { db } from "../config/firebase-config.js";
import { COLLECTIONS, CASHFLOW_CATEGORIES } from "../config/constants.js";
import { addExpense } from "./expense-service.js";
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

const MAINTENANCE_COLLECTION = "maintenance_logs";

/**
 * Generate Sequential Maintenance Log ID (e.g. MNT-2609-321)
 */
export function generateMaintenanceId() {
  const now = new Date();
  const dateStr = now.toISOString().slice(2, 10).replace(/-/g, '');
  const rand = Math.floor(100 + Math.random() * 900);
  return `MNT-${dateStr}-${rand}`;
}

/**
 * 1. Record New Maintenance / Garage Service
 * @param {Object} logData
 * @param {boolean} recordToExpense - If true, automatically logs to central expense registry
 */
export async function addMaintenanceRecord(logData, recordToExpense = true) {
  try {
    const vehicleId = (logData.vehicleId || "").toUpperCase().replace(/\s+/g, "").trim();
    if (!vehicleId) throw new Error("Vehicle Registration Number is required.");

    const logId = logData.logId || generateMaintenanceId();
    const docRef = doc(db, MAINTENANCE_COLLECTION, logId);

    const partsCost = Number(logData.partsCost) || 0;
    const laborCost = Number(logData.laborCost) || 0;
    const totalAmount = Number(logData.totalAmount) || (partsCost + laborCost);

    const newRecord = {
      logId: logId,
      vehicleId: vehicleId,
      date: logData.date || new Date().toISOString().slice(0, 10),
      
      // Maintenance Classification
      // 'PERIODIC_SERVICE', 'OIL_CHANGE', 'TYRE_REPLACEMENT', 'BATTERY', 'BRAKES', 'AC_SERVICE', 'BODY_REPAIR', 'OTHER'
      serviceType: logData.serviceType || "PERIODIC_SERVICE",
      description: logData.description || "General periodic maintenance and checkup",
      
      // Workshop Details
      garageName: logData.garageName || "Authorized Service Center",
      mechanicContact: logData.mechanicContact || "",
      
      // Odometer Tracking
      odometerAtService: Number(logData.odometerAtService) || 0,
      nextServiceDueKm: Number(logData.nextServiceDueKm) || (Number(logData.odometerAtService || 0) + 10000), // Default 10,000 KM interval
      nextServiceDueDate: logData.nextServiceDueDate || "",
      
      // Financials
      partsCost: partsCost,
      laborCost: laborCost,
      totalAmount: totalAmount,
      paymentMode: logData.paymentMode || "CASH", // CASH, UPI, BANK
      
      billImageBase64: logData.billImageBase64 || "", // Compact base64 string
      status: logData.status || "COMPLETED",           // COMPLETED, IN_PROGRESS
      remarks: logData.remarks || "",
      
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await setDoc(docRef, newRecord);

    // Auto-create an entry in general expenses
    if (recordToExpense && totalAmount > 0) {
      await addExpense({
        category: CASHFLOW_CATEGORIES.VEHICLE_MAINTENANCE,
        amount: totalAmount,
        paymentMode: newRecord.paymentMode,
        vehicleId: vehicleId,
        date: newRecord.date,
        receiptImageBase64: newRecord.billImageBase64,
        remarks: `${newRecord.serviceType} at ${newRecord.garageName} (KM: ${newRecord.odometerAtService})`
      }, newRecord.paymentMode.toUpperCase() === "CASH");
    }

    return { 
      success: true, 
      message: `Maintenance entry ${logId} saved for vehicle ${vehicleId}!`, 
      data: newRecord 
    };
  } catch (error) {
    console.error("Error logging vehicle maintenance:", error);
    return { success: false, message: error.message };
  }
}

/**
 * 2. Get All Maintenance Logs for a Specific Vehicle
 * @param {string} vehicleId
 */
export async function getMaintenanceByVehicle(vehicleId) {
  try {
    const cleanId = (vehicleId || "").toUpperCase().replace(/\s+/g, "").trim();
    const colRef = collection(db, MAINTENANCE_COLLECTION);
    const q = query(colRef, where("vehicleId", "==", cleanId));
    const snapshot = await getDocs(q);

    const logs = [];
    snapshot.forEach((d) => logs.push(d.data()));
    return logs.sort((a, b) => new Date(b.date) - new Date(a.date));
  } catch (error) {
    console.error("Failed to fetch vehicle maintenance history:", error);
    return [];
  }
}

/**
 * 3. Get All Maintenance Logs across Fleet
 */
export async function getAllMaintenanceRecords() {
  try {
    const colRef = collection(db, MAINTENANCE_COLLECTION);
    const q = query(colRef, orderBy("date", "desc"));
    const snapshot = await getDocs(q);

    const records = [];
    snapshot.forEach((d) => records.push(d.data()));
    return records;
  } catch (error) {
    console.warn("Unable to fetch maintenance history:", error);
    return [];
  }
}

/**
 * 4. Check Upcoming Service Due for a Vehicle
 * @param {Object} vehicle - Fleet vehicle object containing regNumber and currentOdometer
 * @param {number} kmBuffer - Alert threshold before due KM (default 500 KM)
 */
export async function checkServiceDueStatus(vehicle, kmBuffer = 500) {
  const history = await getMaintenanceByVehicle(vehicle.regNumber);
  if (history.length === 0) {
    return { isDue: false, message: "No prior service logs found." };
  }

  const latestService = history[0];
  const currentKm = Number(vehicle.currentOdometer) || 0;
  const dueKm = Number(latestService.nextServiceDueKm) || 0;
  const kmRemaining = dueKm - currentKm;

  const isDueKm = dueKm > 0 && kmRemaining <= kmBuffer;
  const isOverdueKm = dueKm > 0 && kmRemaining <= 0;

  return {
    vehicleId: vehicle.regNumber,
    lastServiceDate: latestService.date,
    lastServiceKm: latestService.odometerAtService,
    nextServiceDueKm: dueKm,
    currentKm: currentKm,
    kmRemaining: kmRemaining,
    isDue: isDueKm,
    isOverdue: isOverdueKm,
    message: isOverdueKm 
      ? `Overdue by ${Math.abs(kmRemaining)} KM!` 
      : (isDueKm ? `Service due in ${kmRemaining} KM.` : `Next service in ${kmRemaining} KM.`)
  };
}

/**
 * 5. Delete Maintenance Log
 */
export async function deleteMaintenanceRecord(logId) {
  try {
    const docRef = doc(db, MAINTENANCE_COLLECTION, logId);
    await deleteDoc(docRef);
    return { success: true, message: `Record ${logId} removed.` };
  } catch (error) {
    return { success: false, message: error.message };
  }
}
