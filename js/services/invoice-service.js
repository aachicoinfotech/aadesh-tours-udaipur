// js/services/invoice-service.js
// Aadesh Tours Udaipur - GST & Non-GST Invoicing System (Phase 10)

import { db } from "../config/firebase-config.js";
import { COLLECTIONS } from "../config/constants.js";
import { getTripBySlipNumber } from "./trip-service.js";
import { calculateCompleteTripBilling } from "./fare-calculator.js";
import { getCompanyProfile, generateUpiPaymentDetails } from "./company-service.js";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const INVOICE_COLLECTION = "invoices";

/**
 * Generate Sequential Financial Year Invoice Number (e.g. ATU/26-27/0105)
 */
export function generateInvoiceNumber(prefix = "ATU") {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const nextYear = (now.getFullYear() + 1).toString().slice(-2);
  const randomSerial = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}/${year}-${nextYear}/${randomSerial}`;
}

/**
 * 1. Generate Invoice from Completed Duty Slip
 * @param {string} dutySlipNumber - Slip reference to bill
 * @param {Object} invoiceOptions - { isGstInvoice, gstRatePercent, customerGstin, billingAddress }
 */
export async function createInvoiceFromTrip(dutySlipNumber, invoiceOptions = {}) {
  try {
    // 1. Fetch Trip details
    const tripResult = await getTripBySlipNumber(dutySlipNumber);
    if (!tripResult.success) throw new Error(tripResult.message);
    const trip = tripResult.data;

    // 2. Fetch Company Profile & Bank info
    const company = await getCompanyProfile();

    // 3. Compute Fare & GST Breakdown
    const gstRate = invoiceOptions.isGstInvoice ? (invoiceOptions.gstRatePercent || 5) : 0;
    const billingSummary = calculateCompleteTripBilling(trip, gstRate);

    // 4. Generate Invoice ID
    const invoiceNumber = invoiceOptions.customInvoiceNumber || generateInvoiceNumber(invoiceOptions.isGstInvoice ? "TAX" : "INV");
    const docRef = doc(db, INVOICE_COLLECTION, invoiceNumber);

    // 5. Generate Dynamic UPI Payment link
    const upiData = generateUpiPaymentDetails(
      company.upiDetails?.upiId || "",
      company.companyName,
      billingSummary.balanceDue,
      invoiceNumber
    );

    const newInvoice = {
      invoiceNumber: invoiceNumber,
      dutySlipNumber: dutySlipNumber,
      invoiceDate: invoiceOptions.invoiceDate || new Date().toISOString().slice(0, 10),
      isGstInvoice: Boolean(invoiceOptions.isGstInvoice),
      
      // Customer Billed-To Info
      customerName: trip.customerName,
      customerPhone: trip.customerPhone,
      customerGstin: (invoiceOptions.customerGstin || "").trim().toUpperCase(),
      billingAddress: invoiceOptions.billingAddress || trip.dropLocation || "Udaipur",
      
      // Trip Itinerary Snapshot
      vehicleNumber: trip.vehicleId,
      driverName: trip.driverName || "Assigned Driver",
      tripType: trip.tripType,
      pickupLocation: trip.pickupLocation,
      dropLocation: trip.dropLocation,
      startDate: trip.startDate,
      endDate: trip.endDate,
      
      // Commercials & Math
      billingBreakdown: billingSummary,
      totalAmount: billingSummary.grandTotal,
      advancePaid: billingSummary.advancePaid,
      balanceDue: billingSummary.balanceDue,
      
      paymentStatus: billingSummary.balanceDue <= 0 ? "PAID" : (billingSummary.advancePaid > 0 ? "PARTIAL" : "UNPAID"),
      
      // Banking snapshot for print
      companySnapshot: {
        name: company.companyName,
        gstin: company.gstin,
        phone: company.contactNumber,
        bankDetails: company.bankDetails,
        terms: company.invoiceTerms || []
      },
      upiPayment: upiData,
      
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await setDoc(docRef, newInvoice);

    // Mark trip status as BILLED
    const tripDocRef = doc(db, COLLECTIONS.TRIPS, dutySlipNumber);
    await updateDoc(tripDocRef, {
      status: "BILLED",
      invoiceNumber: invoiceNumber,
      finalPayableAmount: billingSummary.grandTotal,
      balanceDue: billingSummary.balanceDue,
      updatedAt: new Date().toISOString()
    });

    return { success: true, message: `Invoice ${invoiceNumber} generated!`, data: newInvoice };
  } catch (error) {
    console.error("Error creating invoice:", error);
    return { success: false, message: error.message };
  }
}

/**
 * 2. Get Single Invoice by Number
 */
export async function getInvoiceById(invoiceNumber) {
  try {
    const docRef = doc(db, INVOICE_COLLECTION, invoiceNumber);
    const snap = await getDoc(docRef);

    if (snap.exists()) {
      return { success: true, data: snap.data() };
    }
    return { success: false, message: "Invoice not found." };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

/**
 * 3. Get All Invoices
 */
export async function getAllInvoices() {
  try {
    const invCol = collection(db, INVOICE_COLLECTION);
    const q = query(invCol, orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);

    const invoices = [];
    snapshot.forEach((d) => invoices.push(d.data()));
    return invoices;
  } catch (error) {
    console.warn("Unable to fetch invoices:", error);
    return [];
  }
}

/**
 * 4. Record Payment Received against Invoice
 */
export async function recordInvoicePayment(invoiceNumber, receivedAmount, paymentMode = "CASH") {
  try {
    const docRef = doc(db, INVOICE_COLLECTION, invoiceNumber);
    const snap = await getDoc(docRef);

    if (!snap.exists()) throw new Error("Invoice does not exist.");

    const inv = snap.data();
    const currentBalance = Number(inv.balanceDue) || 0;
    const payment = Number(receivedAmount);

    const newBalance = Math.max(0, currentBalance - payment);
    const status = newBalance === 0 ? "PAID" : "PARTIAL";

    await updateDoc(docRef, {
      balanceDue: newBalance,
      paymentStatus: status,
      lastPaymentDetails: {
        amount: payment,
        mode: paymentMode,
        date: new Date().toISOString()
      },
      updatedAt: new Date().toISOString()
    });

    return { success: true, message: `Payment recorded. Remaining balance: ₹${newBalance}` };
  } catch (error) {
    return { success: false, message: error.message };
  }
}
