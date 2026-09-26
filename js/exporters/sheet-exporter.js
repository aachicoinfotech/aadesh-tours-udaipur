// js/exporters/sheet-exporter.js
// Aadesh Tours Udaipur - Excel & CSV Export Engine (Phase 22)

/**
 * 1. Low-Level Browser File Downloader Trigger
 * @param {Blob} blob - Binary data blob
 * @param {string} filename - Output filename with extension
 */
function triggerFileDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

/**
 * 2. Export Any Data to Universal CSV (With UTF-8 BOM for MS Excel compatibility)
 * @param {string} filename - e.g. "Trips_September_2026.csv"
 * @param {Array<string>} headers - Header column titles
 * @param {Array<Array<any>>} rows - 2D Array of row cell values
 */
export function exportToCsv(filename, headers = [], rows = []) {
  const formatCell = (cell) => {
    if (cell === null || cell === undefined) return '""';
    const stringVal = String(cell).replace(/"/g, '""'); // Escape double quotes
    return `"${stringVal}"`;
  };

  const csvContent = [
    headers.map(formatCell).join(","),
    ...rows.map((row) => row.map(formatCell).join(","))
  ].join("\r\n");

  // UTF-8 Byte Order Mark (\uFEFF) ensures Excel displays ₹ and Hindi characters cleanly
  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
  triggerFileDownload(blob, filename.endsWith(".csv") ? filename : `${filename}.csv`);
}

/**
 * 3. Export Data to Native Excel Spreadsheet (.xls with HTML Table structure)
 * Allows formatted headers and cell alignment directly in Excel.
 * @param {string} filename 
 * @param {string} sheetTitle 
 * @param {Array<string>} headers 
 * @param {Array<Array<any>>} rows 
 */
export function exportToExcel(filename, sheetTitle, headers = [], rows = []) {
  const tableHtml = `
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="utf-8">
  <style>
    th { background-color: #0f172a; color: #ffffff; font-weight: bold; text-align: left; padding: 6px 10px; border: 0.5pt solid #cbd5e1; }
    td { padding: 5px 8px; border: 0.5pt solid #cbd5e1; font-family: Calibri, sans-serif; font-size: 11pt; }
    .num { text-align: right; }
  </style>
</head>
<body>
  <h3>${sheetTitle || 'Aadesh Tours Udaipur Report'}</h3>
  <table>
    <thead>
      <tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr>
    </thead>
    <tbody>
      ${rows.map((r) => `<tr>${r.map((c) => `<td>${c !== undefined && c !== null ? c : ''}</td>`).join("")}</tr>`).join("")}
    </tbody>
  </table>
</body>
</html>`;

  const blob = new Blob([tableHtml], { type: "application/vnd.ms-excel;charset=utf-8" });
  triggerFileDownload(blob, filename.endsWith(".xls") ? filename : `${filename}.xls`);
}

/**
 * 4. Helper: Export All Trips to Excel
 * @param {Array<Object>} tripsList 
 */
export function exportTripsToSheet(tripsList = [], format = "EXCEL") {
  const headers = [
    "Duty Slip #", "Trip Type", "Customer Name", "Phone",
    "Vehicle Reg #", "Start Date", "End Date", "Start KM",
    "End KM", "Total KM", "Rate/KM", "Toll/Parking", "Advance Paid", "Status"
  ];

  const rows = tripsList.map((t) => [
    t.dutySlipNumber,
    t.tripType,
    t.customerName,
    t.customerPhone,
    t.vehicleId,
    t.startDate,
    t.endDate || t.startDate,
    t.startKm,
    t.endKm || "-",
    t.totalKmRun || 0,
    t.ratePerKm,
    (t.tollCharges || 0) + (t.parkingCharges || 0),
    t.advancePaid || 0,
    t.status
  ]);

  const fileName = `Aadesh_Trips_${new Date().toISOString().slice(0, 10)}`;
  if (format.toUpperCase() === "CSV") {
    exportToCsv(fileName, headers, rows);
  } else {
    exportToExcel(fileName, "Trip Registry & Duty Slips", headers, rows);
  }
}

/**
 * 5. Helper: Export Daybook to Excel
 * @param {Object} daybookData 
 */
export function exportDaybookToSheet(daybookData, format = "EXCEL") {
  const headers = ["Voucher #", "Type", "Account Head", "Narration", "Payment Mode", "Debit (₹)", "Credit (₹)"];
  const rows = (daybookData.vouchers || []).map((v) => [
    v.voucherNo,
    v.voucherType,
    v.accountHead,
    v.particulars,
    v.paymentMode,
    v.debit > 0 ? v.debit : 0,
    v.credit > 0 ? v.credit : 0
  ]);

  // Add Summary Total row at end
  rows.push(["", "", "", "TOTAL", "", daybookData.totalDebit, daybookData.totalCredit]);
  rows.push(["", "", "", "NET SURPLUS / (DEFICIT)", "", "", daybookData.netBalance]);

  const fileName = `Daybook_${daybookData.date}`;
  if (format.toUpperCase() === "CSV") {
    exportToCsv(fileName, headers, rows);
  } else {
    exportToExcel(fileName, `Daybook - ${daybookData.date}`, headers, rows);
  }
}

/**
 * 6. Helper: Export All Expenses to Excel
 * @param {Array<Object>} expensesList 
 */
export function exportExpensesToSheet(expensesList = [], format = "EXCEL") {
  const headers = ["Voucher ID", "Date", "Category", "Amount (₹)", "Payment Mode", "Vehicle Reg #", "Duty Slip #", "Remarks"];
  const rows = expensesList.map((e) => [
    e.voucherId,
    e.date,
    e.category,
    e.amount,
    e.paymentMode,
    e.vehicleId || "Office",
    e.dutySlipNumber || "-",
    e.remarks
  ]);

  const fileName = `Expenses_${new Date().toISOString().slice(0, 10)}`;
  if (format.toUpperCase() === "CSV") {
    exportToCsv(fileName, headers, rows);
  } else {
    exportToExcel(fileName, "Expense Vouchers Log", headers, rows);
  }
}
