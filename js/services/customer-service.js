// js/services/customer-service.js
// Aadesh Tours Udaipur - Customer CRM & Party Ledger (Phase 11)

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
 * 1. Add or Register New Customer / Party
 */
export async function addCustomer(customerData) {
  try {
    const name = (customerData.name || "").trim();
    const phone = (customerData.phone || "").replace(/\s+/g, "").trim();

    if (!name && !phone) {
      throw new Error("Customer name or contact number is required.");
    }

    // Unique Customer ID based on phone or unique hash
    const cleanPhone = phone ? phone.slice(-10) : "WALKIN";
    const customerId = `CUST_${cleanPhone}_${Date.now().toString().slice(-4)}`;
    const docRef = doc(db, COLLECTIONS.CUSTOMERS, customerId);

    const newCustomer = {
      id: customerId,
      name: name,
      businessName: (customerData.businessName || "").trim(), // e.g. "Hotel Lake Palace" or "Taj Aravali Desk"
      category: customerData.category || "DIRECT_TOURIST",     // HOTEL, CORPORATE, REGULAR_GUEST, DIRECT_TOURIST
      phone: phone,
      altPhone: (customerData.altPhone || "").trim(),
      email: (customerData.email || "").trim().toLowerCase(),
      gstin: (customerData.gstin || "").trim().toUpperCase(),
      billingAddress: customerData.billingAddress || "Udaipur, Rajasthan",
      
      // Financial Ledger
      outstandingBalance: Number(customerData.openingBalance) || 0, // Positive = Due from customer
      totalTripsCompleted: 0,
      totalBusinessValue: 0,
      
      notes: customerData.notes || "",
      status: "ACTIVE",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await setDoc(docRef, newCustomer);
    return { success: true, message: `Party ${name} added successfully!`, data: newCustomer };
  } catch (error) {
    console.error("Error adding customer:", error);
    return { success: false, message: error.message };
  }
}

/**
 * 2. Get All Customers / Parties (Sorted by name)
 */
export async function getAllCustomers() {
  try {
    const custCol = collection(db, COLLECTIONS.CUSTOMERS);
    const q = query(custCol, orderBy("name", "asc"));
    const snapshot = await getDocs(q);

    const customers = [];
    snapshot.forEach((d) => customers.push(d.data()));
    return customers;
  } catch (error) {
    console.warn("Unable to fetch customers:", error);
    return [];
  }
}

/**
 * 3. Get Single Customer Details
 */
export async function getCustomerById(customerId) {
  try {
    const docRef = doc(db, COLLECTIONS.CUSTOMERS, customerId);
    const snap = await getDoc(docRef);

    if (snap.exists()) {
      return { success: true, data: snap.data() };
    }
    return { success: false, message: "Customer profile not found." };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

/**
 * 4. Update Customer Profile
 */
export async function updateCustomer(customerId, updatedFields) {
  try {
    const docRef = doc(db, COLLECTIONS.CUSTOMERS, customerId);
    const payload = {
      ...updatedFields,
      updatedAt: new Date().toISOString()
    };

    if (payload.outstandingBalance !== undefined) {
      payload.outstandingBalance = Number(payload.outstandingBalance);
    }

    await updateDoc(docRef, payload);
    return { success: true, message: "Customer details updated!" };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

/**
 * 5. Update Customer Ledger Balance (Automatic adjustment on billing or payment)
 * @param {string} customerId 
 * @param {number} deltaAmount - Positive adds to outstanding due, Negative reduces balance
 * @param {number} tripTotalAmount - Optional: Adds to lifetime business volume
 */
export async function updateCustomerBalance(customerId, deltaAmount, tripTotalAmount = 0) {
  try {
    const docRef = doc(db, COLLECTIONS.CUSTOMERS, customerId);
    const snap = await getDoc(docRef);

    if (!snap.exists()) return { success: false, message: "Customer not found." };

    const current = snap.data();
    const newBal = (Number(current.outstandingBalance) || 0) + Number(deltaAmount);
    const updatedTrips = (Number(current.totalTripsCompleted) || 0) + (tripTotalAmount > 0 ? 1 : 0);
    const updatedVolume = (Number(current.totalBusinessValue) || 0) + Number(tripTotalAmount);

    await updateDoc(docRef, {
      outstandingBalance: newBal,
      totalTripsCompleted: updatedTrips,
      totalBusinessValue: updatedVolume,
      updatedAt: new Date().toISOString()
    });

    return { success: true, newBalance: newBal };
  } catch (error) {
    console.error("Failed to update party ledger:", error);
    return { success: false, message: error.message };
  }
}

/**
 * 6. Delete Customer
 */
export async function deleteCustomer(customerId) {
  try {
    const docRef = doc(db, COLLECTIONS.CUSTOMERS, customerId);
    await deleteDoc(docRef);
    return { success: true, message: "Customer removed successfully." };
  } catch (error) {
    return { success: false, message: error.message };
  }
}
