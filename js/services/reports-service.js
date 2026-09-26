// js/services/reports-service.js
// Aadesh Tours Udaipur - Profit & Loss and Vehicle ROI Reports (Phase 19)

import { db } from "../config/firebase-config.js";
import { COLLECTIONS } from "../config/constants.js";
import { getAllVehicles } from "./fleet-service.js";
import {
  collection,
  getDocs,
  query,
  where
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

/**
 * 1. Generate Comprehensive Profit & Loss (P&L) Report
 * @param {string} fromDate - YYYY-MM-DD
 * @param {string} toDate - YYYY-MM-DD
 */
export async function generateProfitAndLossReport(fromDate, toDate) {
  try {
    // 1. Fetch all Invoices in date range (Revenue)
    const invCol = collection(db, "invoices");
    const invSnap = await getDocs(invCol);

    let totalRevenue = 0;
    let totalTaxCollected = 0;
    let billedTripsCount = 0;

    invSnap.forEach((docSnap) => {
      const inv = docSnap.data();
      const invDate = inv.invoiceDate;
      if (invDate >= fromDate && invDate <= toDate) {
        totalRevenue += Number(inv.totalAmount) || 0;
        totalTaxCollected += Number(inv.billingBreakdown?.gstTotalAmount) || 0;
        billedTripsCount++;
      }
    });

    // 2. Fetch all Expenses in date range (Direct & Indirect Costs)
    const expCol = collection(db, COLLECTIONS.EXPENSES);
    const expSnap = await getDocs(expCol);

    let fuelExpenses = 0;
    let maintenanceExpenses = 0;
    let tollAndParking = 0;
    let driverBhattaTotal = 0;
    let officeAndMisc = 0;

    expSnap.forEach((docSnap) => {
      const exp = docSnap.data();
      const expDate = exp.date;
      if (expDate >= fromDate && expDate <= toDate) {
        const amt = Number(exp.amount) || 0;
        const cat = exp.category || "";

        if (cat.includes("Diesel") || cat.includes("Fuel")) {
          fuelExpenses += amt;
        } else if (cat.includes("Garage") || cat.includes("Maintenance")) {
          maintenanceExpenses += amt;
        } else if (cat.includes("Toll") || cat.includes("Parking")) {
          tollAndParking += amt;
        } else if (cat.includes("Driver")) {
          driverBhattaTotal += amt;
        } else {
          officeAndMisc += amt;
        }
      }
    });

    const totalDirectExpenses = fuelExpenses + maintenanceExpenses + tollAndParking + driverBhattaTotal;
    const grossProfit = totalRevenue - totalDirectExpenses;
    const totalExpenses = totalDirectExpenses + officeAndMisc;
    const netProfit = totalRevenue - totalExpenses;
    const profitMarginPercentage = totalRevenue > 0 ? Number(((netProfit / totalRevenue) * 100).toFixed(1)) : 0;

    return {
      success: true,
      period: { fromDate, toDate },
      revenue: {
        totalRevenue: Math.round(totalRevenue),
        taxCollected: Math.round(totalTaxCollected),
        billedTripsCount
      },
      expenses: {
        fuel: Math.round(fuelExpenses),
        maintenance: Math.round(maintenanceExpenses),
        tollAndParking: Math.round(tollAndParking),
        driverBhatta: Math.round(driverBhattaTotal),
        officeMisc: Math.round(officeAndMisc),
        totalExpenses: Math.round(totalExpenses)
      },
      summary: {
        grossProfit: Math.round(grossProfit),
        netProfit: Math.round(netProfit),
        profitMarginPercentage
      }
    };
  } catch (error) {
    console.error("Error generating P&L Report:", error);
    return { success: false, message: error.message };
  }
}

/**
 * 2. Generate Vehicle-Wise ROI & Performance Report
 * Analyzes which vehicle brings the highest return per KM.
 * @param {string} fromDate - YYYY-MM-DD
 * @param {string} toDate - YYYY-MM-DD
 */
export async function generateFleetRoiReport(fromDate, toDate) {
  try {
    const vehicles = await getAllVehicles();

    // Fetch all trips in range
    const tripCol = collection(db, COLLECTIONS.TRIPS);
    const tripSnap = await getDocs(tripCol);
    const trips = [];
    tripSnap.forEach((d) => trips.push(d.data()));

    // Fetch all expenses in range
    const expCol = collection(db, COLLECTIONS.EXPENSES);
    const expSnap = await getDocs(expCol);
    const expenses = [];
    expSnap.forEach((d) => expenses.push(d.data()));

    const vehicleReports = [];

    for (const vehicle of vehicles) {
      const regNo = vehicle.regNumber;

      // Filter trips for this vehicle in period
      const vehicleTrips = trips.filter(
        (t) => t.vehicleId === regNo && t.startDate >= fromDate && t.startDate <= toDate
      );

      let totalKmRun = 0;
      let totalRevenue = 0;
      vehicleTrips.forEach((t) => {
        totalKmRun += Number(t.totalKmRun) || 0;
        totalRevenue += Number(t.finalPayableAmount || t.packageAmount) || 0;
      });

      // Filter expenses for this vehicle in period
      const vehicleExpenses = expenses.filter(
        (e) => e.vehicleId === regNo && e.date >= fromDate && e.date <= toDate
      );

      let fuelCost = 0;
      let maintenanceCost = 0;
      let otherCost = 0;

      vehicleExpenses.forEach((e) => {
        const amt = Number(e.amount) || 0;
        const cat = e.category || "";
        if (cat.includes("Diesel") || cat.includes("Fuel")) {
          fuelCost += amt;
        } else if (cat.includes("Garage") || cat.includes("Maintenance")) {
          maintenanceCost += amt;
        } else {
          otherCost += amt;
        }
      });

      const totalCost = fuelCost + maintenanceCost + otherCost;
      const netEarnings = totalRevenue - totalCost;
      const earningsPerKm = totalKmRun > 0 ? Number((netEarnings / totalKmRun).toFixed(2)) : 0;
      const fuelCostPerKm = totalKmRun > 0 ? Number((fuelCost / totalKmRun).toFixed(2)) : 0;

      vehicleReports.push({
        vehicleId: regNo,
        makeModel: vehicle.makeModel,
        ownershipType: vehicle.ownershipType,
        tripsCompleted: vehicleTrips.length,
        totalKmRun,
        totalRevenue: Math.round(totalRevenue),
        costs: {
          fuelCost: Math.round(fuelCost),
          maintenanceCost: Math.round(maintenanceCost),
          otherCost: Math.round(otherCost),
          totalCost: Math.round(totalCost)
        },
        netEarnings: Math.round(netEarnings),
        earningsPerKm,
        fuelCostPerKm
      });
    }

    return {
      success: true,
      period: { fromDate, toDate },
      vehicles: vehicleReports
    };
  } catch (error) {
    console.error("Error generating Fleet ROI:", error);
    return { success: false, message: error.message };
  }
}
