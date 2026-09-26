// js/services/driver-service.js
// Aadesh Tours Udaipur - Driver Master & Registry (Phase 5)

import { db } from "../config/firebase-config.js";
import { COLLECTIONS } from "../config/constants.js";
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
 * 1. Add New Driver
 */
export async function addDriver(driverData) {
  try {
    const name = (driverData.name || "").trim();
    const phone = (driverData.phone || "").replace(/\s+/g, "").trim();

    if (!name || !phone) {
      throw new Error("Driver name and phone number are required.");
    }

    // Unique Driver ID based on phone or timestamp
    const driverId = `DRV_${phone.slice(-6)}_${Date.now().toString().slice(-4)}`;
    const docRef = doc(db, COLLECTIONS.DRIVERS, driverId);

    const newDriver = {
      id: driverId,
      name: name,
      phone: phone,
      altPhone: (driverData.altPhone || "").trim(),
      licenseNumber: (driverData.licenseNumber || "").toUpperCase().trim(),
      licenseExpiry: driverData.licenseExpiry || "", // Format: YYYY-MM-DD
      assignedVehicleId: driverData.assignedVehicleId || "", // Linked Vehicle Reg No
      
      // Default allowances
      dailyBhatta: Number(driverData.dailyBhatta) || 300,
      nightCharge: Number(driverData.nightCharge) || 250,
      
      status: driverData.status || "ACTIVE", // ACTIVE or INACTIVE
      dlImageBase64: driverData.dlImageBase64 || "", // Compact base64 string
      
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await setDoc(docRef, newDriver);
    return { success: true, message: `Driver ${name} registered successfully!`, data: newDriver };
  } catch (error) {
    console.error("Error adding driver:", error);
    return { success: false, message: error.message };
  }
}

/**
 * 2. Get All Registered Drivers (Sorted Alphabetically)
 */
export async function getAllDrivers() {
  try {
    const driversCol = collection(db, COLLECTIONS.DRIVERS);
    const q = query(driversCol, orderBy("name", "asc"));
    const querySnapshot = await getDocs(q);

    const drivers = [];
    querySnapshot.forEach((docSnap) => {
      drivers.push(docSnap.data());
    });
    return drivers;
  } catch (error) {
    console.warn("Unable to fetch drivers from Firestore, checking cache:", error);
    return [];
  }
}

/**
 * 3. Get Single Driver Details
 */
export async function getDriverById(driverId) {
  try {
    const docRef = doc(db, COLLECTIONS.DRIVERS, driverId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { success: true, data: docSnap.data() };
    }
    return { success: false, message: "Driver not found." };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

/**
 * 4. Update Driver Details
 */
export async function updateDriver(driverId, updatedFields) {
  try {
    const docRef = doc(db, COLLECTIONS.DRIVERS, driverId);

    const payload = {
      ...updatedFields,
      updatedAt: new Date().toISOString()
    };

    if (payload.dailyBhatta !== undefined) payload.dailyBhatta = Number(payload.dailyBhatta);
    if (payload.nightCharge !== undefined) payload.nightCharge = Number(payload.nightCharge);

    await updateDoc(docRef, payload);
    return { success: true, message: "Driver profile updated successfully!" };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

/**
 * 5. Delete Driver
 */
export async function deleteDriver(driverId) {
  try {
    const docRef = doc(db, COLLECTIONS.DRIVERS, driverId);
    await deleteDoc(docRef);
    return { success: true, message: "Driver removed successfully." };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

/**
 * 6. Check Expiring Driving Licenses (Alert utility)
 * @param {number} daysThreshold - Alert window in days (default 30 days)
 */
export async function getExpiringLicenses(daysThreshold = 30) {
  const drivers = await getAllDrivers();
  const today = new Date();
  const targetDate = new Date();
  targetDate.setDate(today.getDate() + daysThreshold);

  return drivers.filter((driver) => {
    if (!driver.licenseExpiry) return false;
    const expiry = new Date(driver.licenseExpiry);
    return expiry >= today && expiry <= targetDate;
  });
}
