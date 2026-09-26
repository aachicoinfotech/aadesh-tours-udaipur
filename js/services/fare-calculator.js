// js/services/fare-calculator.js
// Aadesh Tours Udaipur - Automatic Fare Calculation Engine (Phase 9)

import { TAX_CONFIG } from "../config/constants.js";

/**
 * 1. Calculate Number of Calendar Days Between Dates (Min 1 day)
 */
export function calculateTripDays(startDateStr, endDateStr) {
  if (!startDateStr) return 1;
  const end = endDateStr ? new Date(endDateStr) : new Date(startDateStr);
  const start = new Date(startDateStr);

  const diffTime = end.getTime() - start.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // Include both start and end day
  return diffDays > 0 ? diffDays : 1;
}

/**
 * 2. Calculate Outstation Trip Fare
 * @param {Object} trip - Trip object containing KM, dates, rates, and expenses
 */
export function calculateOutstationFare(trip) {
  const days = calculateTripDays(trip.startDate, trip.endDate);
  const totalKmRun = Number(trip.totalKmRun) || 0;
  const minKmPerDay = Number(trip.minKmPerDay) || 250;
  const ratePerKm = Number(trip.ratePerKm) || 0;
  
  // Udaipur Market Rule: Higher of Actual KM vs Minimum Billed KM
  const minimumQualifyingKm = days * minKmPerDay;
  const billedKm = Math.max(totalKmRun, minimumQualifyingKm);
  const kmCharges = billedKm * ratePerKm;

  // Driver Allowances
  const driverBhattaRate = Number(trip.driverAllowancePerDay) || 300;
  const driverBhattaTotal = days * driverBhattaRate;
  const nightCharges = Number(trip.nightCharges) || 0;

  // On-duty actual expenses
  const tollCharges = Number(trip.tollCharges) || 0;
  const parkingCharges = Number(trip.parkingCharges) || 0;
  const stateTaxPermit = Number(trip.stateTaxPermit) || 0;
  const otherExpense = Number(trip.otherExpense) || 0;

  const subTotal = kmCharges + driverBhattaTotal + nightCharges + 
                   tollCharges + parkingCharges + stateTaxPermit + otherExpense;

  return {
    days,
    actualKm: totalKmRun,
    minimumQualifyingKm,
    billedKm,
    ratePerKm,
    kmCharges,
    driverBhattaRate,
    driverBhattaTotal,
    nightCharges,
    tollCharges,
    parkingCharges,
    stateTaxPermit,
    otherExpense,
    subTotal
  };
}

/**
 * 3. Calculate Local Tour / Airport Transfer Fare
 * @param {Object} trip 
 */
export function calculateLocalFare(trip) {
  const packageBaseAmount = Number(trip.packageAmount) || 0;
  const extraKmRun = Number(trip.extraKmRun) || 0;
  const extraKmRate = Number(trip.extraKmRate) || 12;
  const extraKmCost = extraKmRun * extraKmRate;

  const extraHours = Number(trip.extraHours) || 0;
  const extraHourRate = Number(trip.extraHourRate) || 150;
  const extraHoursCost = extraHours * extraHourRate;

  const tollCharges = Number(trip.tollCharges) || 0;
  const parkingCharges = Number(trip.parkingCharges) || 0;

  const subTotal = packageBaseAmount + extraKmCost + extraHoursCost + tollCharges + parkingCharges;

  return {
    packageBaseAmount,
    extraKmRun,
    extraKmRate,
    extraKmCost,
    extraHours,
    extraHourRate,
    extraHoursCost,
    tollCharges,
    parkingCharges,
    subTotal
  };
}

/**
 * 4. Master Fare Calculator (Combines Outstation/Local + GST + Advance Deduction)
 * @param {Object} tripData - Full Trip record
 * @param {number} gstRatePercent - 0, 5, or 12
 */
export function calculateCompleteTripBilling(tripData, gstRatePercent = 0) {
  const tripType = tripData.tripType || "OUTSTATION";
  let calculationDetails;

  if (tripType === "LOCAL" || tripType === "AIRPORT_TRANSFER") {
    calculationDetails = calculateLocalFare(tripData);
  } else {
    calculationDetails = calculateOutstationFare(tripData);
  }

  const subTotal = calculationDetails.subTotal;
  const appliedGstRate = Number(gstRatePercent);

  // GST Breakdown
  let gstAmount = 0;
  let cgstAmount = 0;
  let sgstAmount = 0;

  if (appliedGstRate > 0) {
    gstAmount = (subTotal * appliedGstRate) / 100;
    cgstAmount = gstAmount / 2;
    sgstAmount = gstAmount / 2;
  }

  // Tally-Style Rounded Grand Total
  const grandTotalExact = subTotal + gstAmount;
  const grandTotalRounded = Math.round(grandTotalExact);
  const roundOffAdjustment = Number((grandTotalRounded - grandTotalExact).toFixed(2));

  // Advance and Balance Due
  const advancePaid = Number(tripData.advancePaid) || 0;
  const balanceDue = grandTotalRounded - advancePaid;

  return {
    ...calculationDetails,
    tripType,
    subTotal,
    gstRatePercent: appliedGstRate,
    cgstAmount: Number(cgstAmount.toFixed(2)),
    sgstAmount: Number(sgstAmount.toFixed(2)),
    gstTotalAmount: Number(gstAmount.toFixed(2)),
    roundOffAdjustment,
    grandTotal: grandTotalRounded,
    advancePaid,
    balanceDue: balanceDue > 0 ? balanceDue : 0,
    refundDue: balanceDue < 0 ? Math.abs(balanceDue) : 0
  };
}
