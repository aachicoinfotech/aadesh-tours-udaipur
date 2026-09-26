// js/services/trip-service.js
// Aadesh Tours Udaipur - Single-Entry Trip Engine & Duty Slip (Phase 8)

import { db } from "../config/firebase-config.js";
import { COLLECTIONS } from "../config/constants.js";
import { updateOdometer } from "./fleet-service.js";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

/**
 * Generate Sequential Duty Slip Reference Number (e.g. ATU-2609-1234)
 */
export function generateDutySlipNumber() {
  const now = new Date();
  const yearMonth = now.toISOString().slice(2, 7).replace('-', '');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `ATU-${yearMonth}-${randomSuffix}`;
}

/**
 * 1. Create / Book New Trip
 */
export async function createTrip(tripData) {
  try {
    const slipNumber = tripData.dutySlipNumber || generateDutySlipNumber();
    const docRef = doc(db, COLLECTIONS.TRIPS, slipNumber);

    const newTrip = {
      dutySlipNumber: slipNumber,
      tripType: tripData.tripType || "OUTSTATION", // 'LOCAL', 'OUTSTATION', 'AIRPORT_TRANSFER'
      
      // Customer Info
      customerName: (tripData.customerName || "Walk-in Guest").trim(),
      customerPhone: (tripData.customerPhone || "").trim(),
      pickupLocation: tripData.pickupLocation || "Udaipur",
      dropLocation: tripData.dropLocation || "",
      
      // Vehicle & Driver Assignment
      vehicleId: tripData.vehicleId || "",         // Vehicle Reg Number
      driverId: tripData.driverId || "",           // Assigned Driver ID
      vendorId: tripData.vendorId || "",           // Blank if own vehicle
      
      // Trip Odometer & Timing
      startDate: tripData.startDate || new Date().toISOString().slice(0, 10),
      startTime: tripData.startTime || "09:00",
      startKm: Number(tripData.startKm) || 0,
      startKmImageBase64: tripData.startKmImageBase64 || "",
      
      endDate: tripData.endDate || tripData.startDate || "",
      endTime: tripData.endTime || "",
      endKm: Number(tripData.endKm) || 0,
      endKmImageBase64: tripData.endKmImageBase64 || "",
      totalKmRun: 0,
      
      // Commercial Rates & Slabs
      ratePerKm: Number(tripData.ratePerKm) || 0,
      minKmPerDay: Number(tripData.minKmPerDay) || 250,
      packageId: tripData.packageId || "",        // For Local/Airport fixed slabs
      packageAmount: Number(tripData.packageAmount) || 0,
      driverAllowancePerDay: Number(tripData.driverAllowancePerDay) || 300,
      nightCharges: Number(tripData.nightCharges) || 0,
      
      // Additional Expenses on duty
      tollCharges: Number(tripData.tollCharges) || 0,
      parkingCharges: Number(tripData.parkingCharges) || 0,
      stateTaxPermit: Number(tripData.stateTaxPermit) || 0,
      otherExpense: Number(tripData.otherExpense) || 0,
      
      // Financial Summary
      advancePaid: Number(tripData.advancePaid) || 0,
      advancePaymentMode: tripData.advancePaymentMode || "CASH", // CASH, UPI, BANK
      finalPayableAmount: 0,
      balanceDue: 0,
      
      // Trip Lifecycle Status
      status: tripData.status || "RUNNING", // SCHEDULED, RUNNING, COMPLETED, BILLED, CANCELLED
      notes: tripData.notes || "",
      
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await setDoc(docRef, newTrip);

    // If trip started with initial KM, keep vehicle odometer synced
    if (newTrip.vehicleId && newTrip.startKm > 0) {
      await updateOdometer(newTrip.vehicleId, newTrip.startKm);
    }

    return { success: true, message: `Trip ${slipNumber} created successfully!`, data: newTrip };
  } catch (error) {
    console.error("Error creating trip:", error);
    return { success: false, message: error.message };
  }
}

/**
 * 2. Close Trip Duty Slip (Record End KM and Calculate Total Distance)
 */
export async function closeTrip(dutySlipNumber, closingData) {
  try {
    const docRef = doc(db, COLLECTIONS.TRIPS, dutySlipNumber);
    const tripSnap = await getDoc(docRef);

    if (!tripSnap.exists()) {
      throw new Error(`Trip duty slip ${dutySlipNumber} not found.`);
    }

    const trip = tripSnap.data();
    const endKm = Number(closingData.endKm);
    const startKm = Number(trip.startKm);

    if (endKm < startKm) {
      throw new Error(`Closing KM (${endKm}) cannot be less than Start KM (${startKm}).`);
    }

    const totalKm = endKm - startKm;

    const payload = {
      endKm: endKm,
      endDate: closingData.endDate || new Date().toISOString().slice(0, 10),
      endTime: closingData.endTime || new Date().toTimeString().slice(0, 5),
      endKmImageBase64: closingData.endKmImageBase64 || trip.endKmImageBase64,
      totalKmRun: totalKm,
      
      tollCharges: Number(closingData.tollCharges !== undefined ? closingData.tollCharges : trip.tollCharges),
      parkingCharges: Number(closingData.parkingCharges !== undefined ? closingData.parkingCharges : trip.parkingCharges),
      stateTaxPermit: Number(closingData.stateTaxPermit !== undefined ? closingData.stateTaxPermit : trip.stateTaxPermit),
      
      status: "COMPLETED",
      updatedAt: new Date().toISOString()
    };

    await updateDoc(docRef, payload);

    // Automatically update master fleet odometer
    if (trip.vehicleId) {
      await updateOdometer(trip.vehicleId, endKm);
    }

    return { success: true, message: `Trip ${dutySlipNumber} closed. Total KM: ${totalKm} KM.` };
  } catch (error) {
    console.error("Error closing trip:", error);
    return { success: false, message: error.message };
  }
}

/**
 * 3. Get All Trips
 */
export async function getAllTrips() {
  try {
    const tripsCol = collection(db, COLLECTIONS.TRIPS);
    const q = query(tripsCol, orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);

    const trips = [];
    snapshot.forEach((docSnap) => trips.push(docSnap.data()));
    return trips;
  } catch (error) {
    console.warn("Unable to fetch trips from Firestore, checking cache:", error);
    return [];
  }
}

/**
 * 4. Get Running Trips (Currently on road)
 */
export async function getRunningTrips() {
  try {
    const tripsCol = collection(db, COLLECTIONS.TRIPS);
    const q = query(tripsCol, where("status", "==", "RUNNING"));
    const snapshot = await getDocs(q);

    const trips = [];
    snapshot.forEach((docSnap) => trips.push(docSnap.data()));
    return trips;
  } catch (error) {
    console.warn("Error fetching running trips:", error);
    return [];
  }
}

/**
 * 5. Get Single Trip Details
 */
export async function getTripBySlipNumber(dutySlipNumber) {
  try {
    const docRef = doc(db, COLLECTIONS.TRIPS, dutySlipNumber);
    const snap = await getDoc(docRef);

    if (snap.exists()) {
      return { success: true, data: snap.data() };
    }
    return { success: false, message: "Duty slip not found." };
  } catch (error) {
    return { success: false, message: error.message };
  }
}
