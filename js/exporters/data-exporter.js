// js/exporters/data-exporter.js
// Aadesh Tours Udaipur - JSON, XML, WhatsApp TXT & Thermal Slip Engine (Phase 24)

/**
 * Low-level text/blob file download trigger
 */
function downloadRawFile(content, filename, mimeType = "text/plain;charset=utf-8") {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * 1. Full Offline System Backup (JSON)
 * Exports complete state/collections to a downloadable JSON file.
 * @param {Object} fullSystemData - Combined snapshot of all collections
 * @param {string} customName - Optional filename prefix
 */
export function exportDatabaseBackupJson(fullSystemData, customName = "AadeshVault_Backup") {
  const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
  const fileName = `${customName}_${timestamp}.json`;
  const jsonString = JSON.stringify(fullSystemData, null, 2);
  downloadRawFile(jsonString, fileName, "application/json;charset=utf-8");
}

/**
 * 2. Tally Prime Compatible XML Exporter
 * Converts daybook vouchers into standard Tally XML envelope structure.
 * @param {Object} daybookData - Vouchers and totals from daybook-service
 */
export function exportDaybookToTallyXml(daybookData) {
  const vouchers = daybookData.vouchers || [];
  const dateFormatted = (daybookData.date || "").replace(/-/g, "");

  let xmlContent = `<?xml version="1.0" encoding="UTF-8"?>\r\n`;
  xmlContent += `<ENVELOPE>\r\n`;
  xmlContent += `  <HEADER>\r\n`;
  xmlContent += `    <TALLYREQUEST>Import Data</TALLYREQUEST>\r\n`;
  xmlContent += `  </HEADER>\r\n`;
  xmlContent += `  <BODY>\r\n`;
  xmlContent += `    <IMPORTDATA>\r\n`;
  xmlContent += `      <REQUESTDESC>\r\n`;
  xmlContent += `        <REPORTNAME>Vouchers</REPORTNAME>\r\n`;
  xmlContent += `      </REQUESTDESC>\r\n`;
  xmlContent += `      <REQUESTDATA>\r\n`;

  vouchers.forEach((v) => {
    xmlContent += `        <TALLYMESSAGE xmlns:UDF="TallyUDF">\r\n`;
    xmlContent += `          <VOUCHER VCHTYPE="${v.voucherType}" ACTION="Create">\r\n`;
    xmlContent += `            <DATE>${dateFormatted}</DATE>\r\n`;
    xmlContent += `            <NARRATION>${v.particulars} [Ref: ${v.voucherNo}]</NARRATION>\r\n`;
    xmlContent += `            <VOUCHERTYPENAME>${v.voucherType}</VOUCHERTYPENAME>\r\n`;
    xmlContent += `            <ALLLEDGERENTRIES.LIST>\r\n`;
    xmlContent += `              <LEDGERNAME>${v.accountHead}</LEDGERNAME>\r\n`;
    xmlContent += `              <ISDEEMEDPOSITIVE>${v.debit > 0 ? "Yes" : "No"}</ISDEEMEDPOSITIVE>\r\n`;
    xmlContent += `              <AMOUNT>${v.debit > 0 ? v.debit : -v.credit}</AMOUNT>\r\n`;
    xmlContent += `            </ALLLEDGERENTRIES.LIST>\r\n`;
    xmlContent += `          </VOUCHER>\r\n`;
    xmlContent += `        </TALLYMESSAGE>\r\n`;
  });

  xmlContent += `      </REQUESTDATA>\r\n`;
  xmlContent += `    </IMPORTDATA>\r\n`;
  xmlContent += `  </BODY>\r\n`;
  xmlContent += `</ENVELOPE>`;

  const fileName = `Tally_Daybook_${daybookData.date || "Export"}.xml`;
  downloadRawFile(xmlContent, fileName, "application/xml;charset=utf-8");
}

/**
 * 3. Generate WhatsApp / SMS Formatted Quick Summary
 * Clean monospaced-style string ready for 1-click clipboard copy or wa.me sharing.
 * @param {Object} trip - Trip object
 * @param {Object} invoice - Optional linked invoice object
 */
export function generateWhatsAppTripSummary(trip, invoice = null) {
  const billing = invoice?.billingBreakdown || {};
  const total = invoice?.totalAmount || trip.finalPayableAmount || 0;
  const advance = invoice?.advancePaid || trip.advancePaid || 0;
  const balance = invoice?.balanceDue || (total - advance) || 0;

  return `*AADESH TOURS UDAIPUR* 🚕
_Duty Slip / Billing Summary_
-----------------------------------
📋 *Duty Slip:* ${trip.dutySlipNumber}
👤 *Guest Name:* ${trip.customerName}
📞 *Contact:* ${trip.customerPhone || 'N/A'}
🚘 *Vehicle:* ${trip.vehicleId || 'Assigned Cab'}
📍 *Route:* ${trip.pickupLocation} ➔ ${trip.dropLocation || 'Local Sightseeing'}
📅 *Date:* ${trip.startDate} to ${trip.endDate || trip.startDate}
🛣 *Total KM Run:* ${trip.totalKmRun || 0} KM
-----------------------------------
💵 *Total Amount:* ₹${total}
💳 *Advance Paid:* ₹${advance}
⚠️ *Balance Due:* ₹${balance}
-----------------------------------
Bank / UPI Transfer:
UPI ID: aadeshtours@upi
Thank you for traveling with us! 🙏`;
}

/**
 * 4. Export WhatsApp Text as .txt File
 */
export function exportTripTextFile(trip, invoice = null) {
  const textContent = generateWhatsAppTripSummary(trip, invoice);
  const fileName = `DutySlip_${trip.dutySlipNumber}.txt`;
  downloadRawFile(textContent, fileName, "text/plain;charset=utf-8");
}

/**
 * 5. Generate 58mm / 80mm Bluetooth Thermal POS Receipt Slip
 * Optimized for mini thermal printers (ESC/POS compatible layout).
 * @param {Object} invoice - Invoice document
 * @param {number} widthMm - 58 or 80
 */
export function printThermalReceipt(invoice, widthMm = 58) {
  const company = invoice.companySnapshot || {};
  const billing = invoice.billingBreakdown || {};

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Receipt_${invoice.invoiceNumber}</title>
  <style>
    @page { margin: 0; size: ${widthMm}mm auto; }
    body {
      width: ${widthMm}mm;
      margin: 0;
      padding: 3mm;
      font-family: 'Courier New', Courier, monospace;
      font-size: 11px;
      color: #000;
      line-height: 1.25;
      background: #fff;
    }
    .center { text-align: center; }
    .right { text-align: right; }
    .bold { font-weight: bold; }
    .divider { border-top: 1px dashed #000; margin: 4px 0; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; }
    td { vertical-align: top; padding: 1px 0; }
  </style>
</head>
<body>
  <div class="center bold" style="font-size: 13px;">${company.name || 'AADESH TOURS UDAIPUR'}</div>
  <div class="center">Phone: ${company.phone || '+91 98765 43210'}</div>
  ${company.gstin ? `<div class="center">GSTIN: ${company.gstin}</div>` : ''}
  <div class="divider"></div>
  
  <div>Inv #: ${invoice.invoiceNumber}</div>
  <div>Date : ${invoice.invoiceDate}</div>
  <div>Slip : ${invoice.dutySlipNumber}</div>
  <div>Guest: ${invoice.customerName}</div>
  <div>Cab  : ${invoice.vehicleNumber || 'Cab'}</div>
  <div>Run  : ${billing.billedKm || 0} KM</div>
  <div class="divider"></div>

  <table>
    <tr><td>Fare Charges:</td><td class="right">₹${billing.kmCharges || billing.packageBaseAmount || 0}</td></tr>
    ${billing.driverBhattaTotal ? `<tr><td>Driver Bhatta:</td><td class="right">₹${billing.driverBhattaTotal}</td></tr>` : ''}
    ${billing.tollCharges || billing.parkingCharges ? `<tr><td>Toll/Parking:</td><td class="right">₹${(billing.tollCharges || 0) + (billing.parkingCharges || 0)}</td></tr>` : ''}
    ${invoice.isGstInvoice ? `<tr><td>GST (${billing.gstRatePercent}%):</td><td class="right">₹${billing.gstTotalAmount}</td></tr>` : ''}
  </table>
  
  <div class="divider"></div>
  <table>
    <tr class="bold"><td>TOTAL:</td><td class="right">₹${invoice.totalAmount}</td></tr>
    <tr><td>Advance:</td><td class="right">-₹${invoice.advancePaid}</td></tr>
    <tr class="bold"><td>BALANCE DUE:</td><td class="right">₹${invoice.balanceDue}</td></tr>
  </table>
  <div class="divider"></div>
  
  <div class="center bold" style="margin-top: 6px;">Thank You! Visit Again.</div>
  <div class="center" style="font-size: 9px;">Subject to Udaipur Jurisdiction</div>
</body>
</html>`;

  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Popup blocked! Please allow popups to print thermal slip.");
    return;
  }
  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.onload = () => {
    printWindow.focus();
    setTimeout(() => printWindow.print(), 300);
  };
}
