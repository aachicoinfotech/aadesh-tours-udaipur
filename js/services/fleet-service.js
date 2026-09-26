// js/services/fleet-service.js
// Aadesh Tours Udaipur - Fleet Master & Vehicle Registry (Phase 4)

import { db } from "../config/firebase-config.js";
import { COLLECTIONS, VEHICLE_TYPES } from "../config/constants.js";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

/**
 * Clean vehicle number (e.g. "rj 27 ta 1234" -> "RJ27TA1234")
 */
export function normalizeRegNumber(regNo = "") {
  return regNo.toUpperCase().replace(/\s+/g, "").trim();
}

/**
 * 1. Add New Vehicle (Own or Market Attached)
 */
export async function addVehicle(vehicleData) {
  try {
    const regNo = normalizeRegNumber(vehicleData.regNumber);
    if (!regNo) throw new Error("Vehicle Registration Number is required.");

    const docRef = doc(db, COLLECTIONS.FLEET, regNo);
    
    // Check if vehicle already exists
    const existing = await getDoc(docRef);
    if (existing.exists()) {
      return { success: false, message: `Vehicle ${regNo} is already registered.` };
    }

    const newVehicle = {
      id: regNo,
      regNumber: regNo,
      makeModel: vehicleData.makeModel || "Swift Dzire",
      category: vehicleData.category || VEHICLE_TYPES.SEDAN.id,
      ownershipType: vehicleData.ownershipType || "OWN", // 'OWN' or 'VENDOR'
      vendorId: vehicleData.vendorId || "",              // If attached/market
      defaultDriverId: vehicleData.defaultDriverId || "",
      fuelType: vehicleData.fuelType || "DIESEL",        // DIESEL, PETROL, CNG
      currentOdometer: Number(vehicleData.currentOdometer) || 0,
      status: vehicleData.status || "ACTIVE",            // ACTIVE, MAINTENANCE, INACTIVE
      
      // Expiry tracking for alerts
      documents: {
        insuranceExpiry: vehicleData.insuranceExpiry || "",
        fitnessExpiry: vehicleData.fitnessExpiry || "",
        permitExpiry: vehicleData.permitExpiry || "",
        pucExpiry: vehicleData.pucExpiry || ""
      },
      
      rcImageBase64: vehicleData.rcImageBase64 || "", // Stored directly in Firestore
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await setDoc(docRef, newVehicle);
    return { success: true, message: `Vehicle ${regNo} added successfully!`, data: newVehicle };
  } catch (error) {
    console.error("Error adding vehicle:", error);
    return { success: false, message: error.message };
  }
}

/**
 * 2. Get All Vehicles (Sorted by registration)
 */
export async function getAllVehicles() {
  try {
    const fleetCol = collection(db, COLLECTIONS.FLEET);
    const q = query(fleetCol, orderBy("regNumber", "asc"));
    const querySnapshot = await getDocs(q);

    const vehicles = [];
    querySnapshot.forEach((docSnap) => {
      vehicles.push(docSnap.data());
    });
    return vehicles;
  } catch (error) {
    console.warn("Error fetching fleet from Firestore, checking offline cache:", error);
    return [];
  }
}

/**
 * 3. Get Single Vehicle Details
 */
export async function getVehicleById(vehicleId) {
  try {
    const cleanId = normalizeRegNumber(vehicleId);
    const docRef = doc(db, COLLECTIONS.FLEET, cleanId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { success: true, data: docSnap.data() };
    }
    return { success: false, message: "Vehicle not found." };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

/**
 * 4. Update Vehicle Details
 */
export async function updateVehicle(vehicleId, updatedFields) {
  try {
    const cleanId = normalizeRegNumber(vehicleId);
    const docRef = doc(db, COLLECTIONS.FLEET, cleanId);

    const payload = {
      ...updatedFields,
      updatedAt: new Date().toISOString()
    };

    if (payload.currentOdometer !== undefined) {
      payload.currentOdometer = Number(payload.currentOdometer);
    }

    await updateDoc(docRef, payload);
    return { success: true, message: `Vehicle ${cleanId} updated successfully!` };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

/**
 * 5. Quick Odometer Update (Triggered automatically after trip closing)
 */
export async function updateOdometer(vehicleId, endKm) {
  try {
    const cleanId = normalizeRegNumber(vehicleId);
    const docRef = doc(db, COLLECTIONS.FLEET, cleanId);

    await updateDoc(docRef, {
      currentOdometer: Number(endKm),
      updatedAt: new Date().toISOString()
    });
    return { success: true };
  } catch (error) {
    console.error("Failed to update odometer:", error);
    return { success: false, message: error.message };
  }
}

/**
 * 6. Delete Vehicle
 */
export async function deleteVehicle(vehicleId) {
  try {
    const cleanId = normalizeRegNumber(vehicleId);
    const docRef = doc(db, COLLECTIONS.FLEET, cleanId);
    await deleteDoc(docRef);
    return { success: true, message: `Vehicle ${cleanId} removed successfully.` };
  } catch (error) {
    return { success: false, message: error.message };
  }
}
