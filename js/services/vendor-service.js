// js/services/vendor-service.js
// Aadesh Tours Udaipur - Vendor & Market Partner Master (Phase 6)

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
 * 1. Add New Vendor / Travel Partner
 */
export async function addVendor(vendorData) {
  try {
    const agencyName = (vendorData.agencyName || vendorData.name || "").trim();
    const phone = (vendorData.phone || "").replace(/\s+/g, "").trim();

    if (!agencyName || !phone) {
      throw new Error("Agency/Vendor Name and phone number are required.");
    }

    // Unique Vendor ID
    const vendorId = `VND_${phone.slice(-6)}_${Date.now().toString().slice(-4)}`;
    const docRef = doc(db, COLLECTIONS.VENDORS, vendorId);

    const newVendor = {
      id: vendorId,
      name: (vendorData.name || "").trim(),
      agencyName: agencyName,
      phone: phone,
      altPhone: (vendorData.altPhone || "").trim(),
      city: vendorData.city || "Udaipur",
      
      // Settlement & Banking Details
      commissionPercentage: Number(vendorData.commissionPercentage) || 0, // e.g. 10% commission on booking
      upiId: (vendorData.upiId || "").trim(),
      bankDetails: {
        bankName: vendorData.bankName || "",
        accountNumber: vendorData.accountNumber || "",
        ifscCode: vendorData.ifscCode || ""
      },

      // Attached vehicle numbers under this vendor
      attachedVehicles: vendorData.attachedVehicles || [], // Array of reg numbers
      
      // Financial Balance: Positive = We owe them, Negative = They owe us
      outstandingBalance: Number(vendorData.openingBalance) || 0,
      
      status: vendorData.status || "ACTIVE", // ACTIVE or INACTIVE
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await setDoc(docRef, newVendor);
    return { success: true, message: `Vendor ${agencyName} registered successfully!`, data: newVendor };
  } catch (error) {
    console.error("Error adding vendor:", error);
    return { success: false, message: error.message };
  }
}

/**
 * 2. Get All Registered Vendors
 */
export async function getAllVendors() {
  try {
    const vendorsCol = collection(db, COLLECTIONS.VENDORS);
    const q = query(vendorsCol, orderBy("agencyName", "asc"));
    const querySnapshot = await getDocs(q);

    const vendors = [];
    querySnapshot.forEach((docSnap) => {
      vendors.push(docSnap.data());
    });
    return vendors;
  } catch (error) {
    console.warn("Unable to fetch vendors from Firestore, checking cache:", error);
    return [];
  }
}

/**
 * 3. Get Single Vendor by ID
 */
export async function getVendorById(vendorId) {
  try {
    const docRef = doc(db, COLLECTIONS.VENDORS, vendorId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { success: true, data: docSnap.data() };
    }
    return { success: false, message: "Vendor not found." };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

/**
 * 4. Update Vendor Profile
 */
export async function updateVendor(vendorId, updatedFields) {
  try {
    const docRef = doc(db, COLLECTIONS.VENDORS, vendorId);

    const payload = {
      ...updatedFields,
      updatedAt: new Date().toISOString()
    };

    if (payload.commissionPercentage !== undefined) {
      payload.commissionPercentage = Number(payload.commissionPercentage);
    }
    if (payload.outstandingBalance !== undefined) {
      payload.outstandingBalance = Number(payload.outstandingBalance);
    }

    await updateDoc(docRef, payload);
    return { success: true, message: "Vendor details updated successfully!" };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

/**
 * 5. Update Vendor Ledger Balance (Called automatically during trip settlement)
 * @param {string} vendorId 
 * @param {number} deltaAmount - Positive to increase balance, negative to decrease
 */
export async function updateVendorBalance(vendorId, deltaAmount) {
  try {
    const docRef = doc(db, COLLECTIONS.VENDORS, vendorId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      throw new Error("Vendor does not exist.");
    }

    const currentBal = Number(docSnap.data().outstandingBalance) || 0;
    const newBal = currentBal + Number(deltaAmount);

    await updateDoc(docRef, {
      outstandingBalance: newBal,
      updatedAt: new Date().toISOString()
    });

    return { success: true, newBalance: newBal };
  } catch (error) {
    console.error("Failed to update vendor balance:", error);
    return { success: false, message: error.message };
  }
}

/**
 * 6. Delete Vendor
 */
export async function deleteVendor(vendorId) {
  try {
    const docRef = doc(db, COLLECTIONS.VENDORS, vendorId);
    await deleteDoc(docRef);
    return { success: true, message: "Vendor removed successfully." };
  } catch (error) {
    return { success: false, message: error.message };
  }
}
