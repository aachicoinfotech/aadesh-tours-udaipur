// js/services/daybook-service.js
// Aadesh Tours Udaipur - Tally-Style Daybook & General Ledger Engine (Phase 18)

import { db } from "../config/firebase-config.js";
import { COLLECTIONS } from "../config/constants.js";
import {
  collection,
  getDocs,
  query,
  where
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

/**
 * Standard Voucher Formatter for Tally-style ledger view
 */
function createVoucherEntry({
  voucherNo = "",
  date = "",
  time = "",
  voucherType = "PAYMENT", // 'RECEIPT', 'PAYMENT', 'JOURNAL'
  accountHead = "",        // Customer, Vendor, Fuel, Driver Bhatta, etc.
  particulars = "",        // Narration / Details
  paymentMode = "CASH",    // CASH, UPI, BANK
  debit = 0,               // Outgoing money (नामे)
  credit = 0,              // Incoming money (जमा)
  referenceId = ""
}) {
  return {
    voucherNo,
    date,
    time,
    voucherType,
    accountHead,
    particulars,
    paymentMode,
    debit: Math.round(Number(debit) || 0),
    credit: Math.round(Number(credit) || 0),
    referenceId
  };
}

/**
 * 1. Fetch Tally-Style Daybook for a Single Specific Date
 * @param {string} targetDate - YYYY-MM-DD
 */
export async function getDailyDaybook(targetDate = "") {
  const dateStr = targetDate || new Date().toISOString().slice(0, 10);
  const vouchers = [];

  try {
    // 1. Fetch Expenses of this date (Debits)
    const expCol = collection(db, COLLECTIONS.EXPENSES);
    const expQuery = query(expCol, where("date", "==", dateStr));
    const expSnap = await getDocs(expQuery);

    expSnap.forEach((docSnap) => {
      const exp = docSnap.data();
      vouchers.push(createVoucherEntry({
        voucherNo: exp.voucherId,
        date: exp.date,
        voucherType: "PAYMENT",
        accountHead: exp.category,
        particulars: `${exp.remarks || exp.category} ${exp.vehicleId ? '(' + exp.vehicleId + ')' : ''}`,
        paymentMode: exp.paymentMode || "CASH",
        debit: exp.amount,
        credit: 0,
        referenceId: exp.dutySlipNumber || ""
      }));
    });

    // 2. Fetch Invoices generated on this date (Credits / Advances)
    const invCol = collection(db, "invoices");
    const invQuery = query(invCol, where("invoiceDate", "==", dateStr));
    const invSnap = await getDocs(invQuery);

    invSnap.forEach((docSnap) => {
      const inv = docSnap.data();
      // Record advance or full payment received
      const received = Number(inv.advancePaid) || 0;
      if (received > 0) {
        vouchers.push(createVoucherEntry({
          voucherNo: inv.invoiceNumber,
          date: inv.invoiceDate,
          voucherType: "RECEIPT",
          accountHead: inv.customerName,
          particulars: `Advance/Bill Collection - Slip #${inv.dutySlipNumber}`,
          paymentMode: "ONLINE/CASH",
          debit: 0,
          credit: received,
          referenceId: inv.dutySlipNumber
        }));
      }
    });

    // 3. Fetch Driver Settlements of this date
    const dsCol = collection(db, "driver_settlements");
    const dsQuery = query(dsCol, where("date", "==", dateStr));
    const dsSnap = await getDocs(dsQuery);

    dsSnap.forEach((docSnap) => {
      const ds = docSnap.data();
      const payout = ds.breakdown?.payoutRequired || 0;
      const recovery = ds.breakdown?.recoveryRequired || 0;

      if (payout > 0) {
        vouchers.push(createVoucherEntry({
          voucherNo: ds.settlementId,
          date: ds.date,
          voucherType: "PAYMENT",
          accountHead: `Driver: ${ds.driverName}`,
          particulars: `Driver Bhatta Settled (${ds.dutySlipNumber || 'General'})`,
          paymentMode: ds.paymentMode,
          debit: payout,
          credit: 0,
          referenceId: ds.dutySlipNumber
        }));
      } else if (recovery > 0) {
        vouchers.push(createVoucherEntry({
          voucherNo: ds.settlementId,
          date: ds.date,
          voucherType: "RECEIPT",
          accountHead: `Driver: ${ds.driverName}`,
          particulars: `Driver Cash Handover/Settlement (${ds.dutySlipNumber || 'General'})`,
          paymentMode: ds.paymentMode,
          debit: 0,
          credit: recovery,
          referenceId: ds.dutySlipNumber
        }));
      }
    });

    // 4. Fetch Vendor Settlements of this date
    const vsCol = collection(db, "vendor_settlements");
    const vsQuery = query(vsCol, where("date", "==", dateStr));
    const vsSnap = await getDocs(vsQuery);

    vsSnap.forEach((docSnap) => {
      const vs = docSnap.data();
      const payable = vs.breakdown?.payableByOffice || 0;
      const recovery = vs.breakdown?.recoveryFromVendor || 0;

      if (payable > 0) {
        vouchers.push(createVoucherEntry({
          voucherNo: vs.settlementId,
          date: vs.date,
          voucherType: "PAYMENT",
          accountHead: `Vendor: ${vs.agencyName}`,
          particulars: `Vehicle Duty Settlement (${vs.vehicleNumber})`,
          paymentMode: vs.paymentMode,
          debit: payable,
          credit: 0,
          referenceId: vs.dutySlipNumber
        }));
      } else if (recovery > 0) {
        vouchers.push(createVoucherEntry({
          voucherNo: vs.settlementId,
          date: vs.date,
          voucherType: "RECEIPT",
          accountHead: `Vendor: ${vs.agencyName}`,
          particulars: `Vendor Commission Recovery (${vs.vehicleNumber})`,
          paymentMode: vs.paymentMode,
          debit: 0,
          credit: recovery,
          referenceId: vs.dutySlipNumber
        }));
      }
    });

    // 5. Compute Daybook Totals
    let totalDebit = 0;
    let totalCredit = 0;

    vouchers.forEach((v) => {
      totalDebit += v.debit;
      totalCredit += v.credit;
    });

    const netBalance = totalCredit - totalDebit;

    return {
      success: true,
      date: dateStr,
      totalVouchers: vouchers.length,
      totalDebit,
      totalCredit,
      netBalance, // Positive = Surplus, Negative = Deficit
      vouchers
    };
  } catch (error) {
    console.error("Error generating daybook:", error);
    return {
      success: false,
      date: dateStr,
      message: error.message,
      totalVouchers: 0,
      totalDebit: 0,
      totalCredit: 0,
      netBalance: 0,
      vouchers: []
    };
  }
}

/**
 * 2. Get Date Range General Ledger Summary
 * @param {string} fromDate - YYYY-MM-DD
 * @param {string} toDate - YYYY-MM-DD
 */
export async function getGeneralLedger(fromDate, toDate) {
  const start = new Date(fromDate);
  const end = new Date(toDate);
  const allVouchers = [];

  let grandDebit = 0;
  let grandCredit = 0;

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const curDateStr = d.toISOString().slice(0, 10);
    const dayResult = await getDailyDaybook(curDateStr);

    if (dayResult.vouchers && dayResult.vouchers.length > 0) {
      allVouchers.push(...dayResult.vouchers);
      grandDebit += dayResult.totalDebit;
      grandCredit += dayResult.totalCredit;
    }
  }

  return {
    fromDate,
    toDate,
    totalRecords: allVouchers.length,
    grandDebit,
    grandCredit,
    netProfitOrCashflow: grandCredit - grandDebit,
    vouchers: allVouchers
  };
}
