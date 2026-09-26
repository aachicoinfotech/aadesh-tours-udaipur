// js/services/company-service.js
// Aadesh Tours Udaipur - Company Profile & Branding Vault (Phase 3)

import { db } from "../config/firebase-config.js";
import { COLLECTIONS } from "../config/constants.js";
import { 
  doc, 
  getDoc, 
  setDoc 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// 1. Default Company Profile Fallback (Offline / First Time Use)
export const DEFAULT_COMPANY_PROFILE = {
  companyName: "Aadesh Tours Udaipur",
  tagline: "Premium Car Rental & Tour Operator",
  ownerName: "Himmat Puri",
  contactNumber: "+91 98765 43210",
  altContactNumber: "",
  email: "aadeshtoursudaipur@gmail.com",
  officeAddress: "Udaipur, Rajasthan, India - 313001",
  gstin: "",
  panNumber: "",
  bankDetails: {
    bankName: "State Bank of India",
    accountHolderName: "Aadesh Tours",
    accountNumber: "",
    ifscCode: "",
    branch: "Udaipur Branch"
  },
  upiDetails: {
    upiId: "", // e.g. mobile@upi ya business@icici
    payeeName: "Aadesh Tours Udaipur"
  },
  invoiceTerms: [
    "Toll tax, parking charges, and border permits are payable as per actual receipts.",
    "Driver allowance is applicable for outstation duties and night drives after 10:00 PM.",
    "Garage-to-garage kilometers and time will be computed for final billing calculation.",
    "Subject to Udaipur (Rajasthan) jurisdiction only."
  ],
  logoBase64: "", // Compressed base64 string
  updatedAt: new Date().toISOString()
};

const PROFILE_DOC_ID = "primary_profile";

/**
 * 2. Get Company Profile from Firestore (with automatic fallback)
 */
export async function getCompanyProfile() {
  try {
    const docRef = doc(db, COLLECTIONS.COMPANY, PROFILE_DOC_ID);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { ...DEFAULT_COMPANY_PROFILE, ...docSnap.data() };
    } else {
      // First-time setup: Save default profile to database
      await setDoc(docRef, DEFAULT_COMPANY_PROFILE);
      return DEFAULT_COMPANY_PROFILE;
    }
  } catch (error) {
    console.warn("Unable to fetch company profile from Firestore, using offline fallback:", error);
    return DEFAULT_COMPANY_PROFILE;
  }
}

/**
 * 3. Save or Update Company Profile
 * @param {Object} updatedProfile - Full or partial profile fields to update
 */
export async function saveCompanyProfile(updatedProfile) {
  try {
    const docRef = doc(db, COLLECTIONS.COMPANY, PROFILE_DOC_ID);
    const dataToSave = {
      ...updatedProfile,
      updatedAt: new Date().toISOString()
    };

    await setDoc(docRef, dataToSave, { merge: true });
    return { success: true, message: "Company profile updated successfully!" };
  } catch (error) {
    console.error("Failed to save company profile:", error);
    return { success: false, message: error.message };
  }
}

/**
 * 4. Generate Dynamic UPI Payment URL & QR Link for Invoices
 * @param {string} upiId - Beneficiary UPI ID
 * @param {string} payeeName - Beneficiary Name
 * @param {number} amount - Invoice total balance payable
 * @param {string} invoiceNumber - Bill / Invoice reference
 */
export function generateUpiPaymentDetails(upiId, payeeName, amount = 0, invoiceNumber = "") {
  if (!upiId) return { upiUrl: "", qrUrl: "" };

  const cleanName = encodeURIComponent(payeeName || "Aadesh Tours");
  const note = encodeURIComponent(`Bill ${invoiceNumber}`);
  const formattedAmount = Number(amount) > 0 ? Number(amount).toFixed(2) : "";

  // Standard UPI Intent URI scheme
  let upiUrl = `upi://pay?pa=${upiId}&pn=${cleanName}&tn=${note}&cu=INR`;
  if (formattedAmount) {
    upiUrl += `&am=${formattedAmount}`;
  }

  // Google Chart API / QR generator (No backend required)
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiUrl)}`;

  return { upiUrl, qrUrl };
}
