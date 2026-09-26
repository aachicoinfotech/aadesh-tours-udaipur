// js/services/reminder-service.js
// Aadesh Tours Udaipur - Document Expiry & RTO Compliance Alerts (Phase 17)

import { getAllVehicles } from "./fleet-service.js";
import { getAllDrivers } from "./driver-service.js";

/**
 * 1. Calculate Days Remaining until Expiry Date
 * @param {string} expiryDateStr - YYYY-MM-DD
 * @returns {number|null} Days remaining (Negative = Expired, Positive = Days left, Null = Not provided)
 */
export function calculateDaysRemaining(expiryDateStr) {
  if (!expiryDateStr) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const expiry = new Date(expiryDateStr);
  expiry.setHours(0, 0, 0, 0);

  const diffMs = expiry.getTime() - today.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * 2. Evaluate Severity Status based on Days Remaining
 * @param {number|null} daysRemaining 
 * @param {number} warningWindowDays - Default 30 days
 */
export function getComplianceStatus(daysRemaining, warningWindowDays = 30) {
  if (daysRemaining === null) {
    return { status: "MISSING", label: "Not Updated", level: "info" };
  }
  if (daysRemaining < 0) {
    return { status: "EXPIRED", label: `Expired ${Math.abs(daysRemaining)} days ago`, level: "danger" };
  }
  if (daysRemaining <= warningWindowDays) {
    return { status: "EXPIRING_SOON", label: `Expires in ${daysRemaining} days`, level: "warning" };
  }
  return { status: "VALID", label: `Valid (${daysRemaining} days left)`, level: "success" };
}

/**
 * 3. Inspect All Documents for a Single Vehicle
 * @param {Object} vehicle - Fleet vehicle record
 * @param {number} warningWindowDays 
 */
export function checkVehicleCompliance(vehicle, warningWindowDays = 30) {
  const docs = vehicle.documents || {};
  const docTypes = [
    { key: "insuranceExpiry", name: "Insurance" },
    { key: "fitnessExpiry", name: "Fitness Certificate" },
    { key: "permitExpiry", name: "Commercial Permit" },
    { key: "pucExpiry", name: "PUC Certificate" }
  ];

  const results = [];
  let hasCritical = false;
  let hasWarning = false;

  docTypes.forEach(({ key, name }) => {
    const expiryDate = docs[key] || "";
    const days = calculateDaysRemaining(expiryDate);
    const compliance = getComplianceStatus(days, warningWindowDays);

    if (compliance.status === "EXPIRED") hasCritical = true;
    if (compliance.status === "EXPIRING_SOON") hasWarning = true;

    results.push({
      documentKey: key,
      documentName: name,
      expiryDate: expiryDate,
      daysRemaining: days,
      ...compliance
    });
  });

  return {
    vehicleId: vehicle.regNumber,
    makeModel: vehicle.makeModel,
    ownershipType: vehicle.ownershipType,
    hasCritical,
    hasWarning,
    documents: results
  };
}

/**
 * 4. Scan Entire Fleet for Expiring / Expired Documents
 * @param {number} warningWindowDays 
 */
export async function getFleetComplianceReport(warningWindowDays = 30) {
  const vehicles = await getAllVehicles();
  const fleetReport = [];

  for (const vehicle of vehicles) {
    const report = checkVehicleCompliance(vehicle, warningWindowDays);
    fleetReport.push(report);
  }

  return fleetReport;
}

/**
 * 5. Scan Driver Licenses for Expiry
 * @param {number} warningWindowDays 
 */
export async function getDriverComplianceReport(warningWindowDays = 30) {
  const drivers = await getAllDrivers();
  const driverReport = [];

  for (const driver of drivers) {
    const days = calculateDaysRemaining(driver.licenseExpiry);
    const compliance = getComplianceStatus(days, warningWindowDays);

    driverReport.push({
      driverId: driver.id,
      driverName: driver.name,
      phone: driver.phone,
      licenseNumber: driver.licenseNumber,
      expiryDate: driver.licenseExpiry || "",
      daysRemaining: days,
      ...compliance
    });
  }

  return driverReport;
}

/**
 * 6. Quick Dashboard Summary (Badge Counts for header icon)
 */
export async function getDashboardComplianceSummary() {
  const [fleetReport, driverReport] = await Promise.all([
    getFleetComplianceReport(30),
    getDriverComplianceReport(30)
  ]);

  let expiredCount = 0;
  let expiringSoonCount = 0;

  // Tally Vehicle docs
  fleetReport.forEach((v) => {
    v.documents.forEach((doc) => {
      if (doc.status === "EXPIRED") expiredCount++;
      if (doc.status === "EXPIRING_SOON") expiringSoonCount++;
    });
  });

  // Tally Driver DLs
  driverReport.forEach((d) => {
    if (d.status === "EXPIRED") expiredCount++;
    if (d.status === "EXPIRING_SOON") expiringSoonCount++;
  });

  return {
    expiredCount,
    expiringSoonCount,
    totalAlerts: expiredCount + expiringSoonCount,
    hasUrgentAlerts: expiredCount > 0
  };
}
