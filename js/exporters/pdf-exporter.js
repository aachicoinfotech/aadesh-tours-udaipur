// js/exporters/pdf-exporter.js
// Aadesh Tours Udaipur - Multi-Document PDF Generator & Print Engine (Phase 21)

/**
 * 1. Base Print & PDF Trigger via In-Memory Print Frame
 * Clean zero-dependency mechanism: Works completely offline on Android & Desktop Chrome.
 * @param {string} printableHtml - Complete styled HTML document
 * @param {string} documentTitle - File title for PDF naming
 */
export function triggerPrintOrPdf(printableHtml, documentTitle = "Document") {
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Popup blocked! Please allow popups for this site to export PDF.");
    return;
  }

  printWindow.document.open();
  printWindow.document.write(printableHtml);
  printWindow.document.title = documentTitle;
  printWindow.document.close();

  // Wait for images/QR code to load before firing print
  printWindow.onload = () => {
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 400);
  };
}

/**
 * 2. Generate Professional Tax Invoice / Cash Bill HTML
 */
export function buildInvoicePrintTemplate(invoice) {
  const company = invoice.companySnapshot || {};
  const billing = invoice.billingBreakdown || {};
  const isGst = invoice.isGstInvoice;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${invoice.invoiceNumber || 'Invoice'}</title>
  <style>
    @page { size: A4 portrait; margin: 12mm; }
    * { box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    body { margin: 0; color: #1e293b; font-size: 13px; line-height: 1.4; background: #fff; }
    .invoice-card { border: 1.5px solid #0f172a; padding: 20px; }
    .header-table { width: 100%; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 15px; }
    .company-title { font-size: 22px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px; }
    .doc-badge { background: #0f172a; color: #fff; padding: 6px 14px; font-size: 13px; font-weight: 700; border-radius: 4px; display: inline-block; }
    .two-col { width: 100%; margin-bottom: 15px; }
    .two-col td { vertical-align: top; width: 50%; }
    .section-title { font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 4px; }
    .line-items { width: 100%; border-collapse: collapse; margin: 15px 0; }
    .line-items th { background: #f1f5f9; border: 1px solid #cbd5e1; padding: 8px 10px; font-size: 12px; text-align: left; }
    .line-items td { border: 1px solid #cbd5e1; padding: 8px 10px; }
    .text-right { text-align: right; }
    .totals-table { width: 100%; margin-top: 10px; }
    .totals-table td { padding: 4px 8px; }
    .grand-total { font-size: 16px; font-weight: 800; background: #f8fafc; border-top: 2px solid #0f172a; }
    .qr-container { text-align: center; border: 1px dashed #94a3b8; padding: 10px; border-radius: 6px; width: 140px; margin: 0 auto; }
    .footer-terms { font-size: 10.5px; color: #475569; margin-top: 15px; border-top: 1px solid #e2e8f0; padding-top: 10px; }
    .signature-area { margin-top: 35px; width: 100%; }
  </style>
</head>
<body>
  <div class="invoice-card">
    <table class="header-table">
      <tr>
        <td>
          <div class="company-title">${company.name || 'AADESH TOURS UDAIPUR'}</div>
          <div>Contact: ${company.phone || '+91 98765 43210'}</div>
          ${company.gstin ? `<div><strong>GSTIN:</strong> ${company.gstin}</div>` : ''}
        </td>
        <td class="text-right">
          <span class="doc-badge">${isGst ? 'TAX INVOICE' : 'BILL OF SUPPLY'}</span>
          <div style="margin-top: 8px;"><strong>Invoice No:</strong> ${invoice.invoiceNumber}</div>
          <div><strong>Date:</strong> ${invoice.invoiceDate}</div>
          <div><strong>Duty Slip:</strong> ${invoice.dutySlipNumber}</div>
        </td>
      </tr>
    </table>

    <table class="two-col">
      <tr>
        <td>
          <div class="section-title">Billed To (Customer):</div>
          <div style="font-size: 15px; font-weight: 700;">${invoice.customerName}</div>
          <div>Phone: ${invoice.customerPhone || 'N/A'}</div>
          ${invoice.customerGstin ? `<div>GSTIN: ${invoice.customerGstin}</div>` : ''}
          <div>Address: ${invoice.billingAddress || 'Udaipur, Rajasthan'}</div>
        </td>
        <td>
          <div class="section-title">Trip & Vehicle Details:</div>
          <div><strong>Vehicle No:</strong> ${invoice.vehicleNumber || 'Standard Fleet'}</div>
          <div><strong>Trip Type:</strong> ${invoice.tripType}</div>
          <div><strong>Route:</strong> ${invoice.pickupLocation} ➔ ${invoice.dropLocation || 'Local Sightseeing'}</div>
          <div><strong>Travel Dates:</strong> ${invoice.startDate} to ${invoice.endDate}</div>
        </td>
      </tr>
    </table>

    <table class="line-items">
      <thead>
        <tr>
          <th>Description</th>
          <th class="text-right">Total Run / Slabs</th>
          <th class="text-right">Rate</th>
          <th class="text-right">Amount (₹)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>
            <strong>Vehicle Rental Charges</strong><br>
            <small>Actual: ${billing.actualKm || 0} KM | Min Billed: ${billing.billedKm || 0} KM</small>
          </td>
          <td class="text-right">${billing.billedKm || 0} KM</td>
          <td class="text-right">₹${billing.ratePerKm || 0}</td>
          <td class="text-right">₹${billing.kmCharges || billing.packageBaseAmount || 0}</td>
        </tr>
        ${(billing.driverBhattaTotal > 0) ? `
        <tr>
          <td>Driver Allowance & Khuraki (${billing.days || 1} Days)</td>
          <td class="text-right">${billing.days} Day(s)</td>
          <td class="text-right">₹${billing.driverBhattaRate}</td>
          <td class="text-right">₹${billing.driverBhattaTotal}</td>
        </tr>` : ''}
        ${(billing.nightCharges > 0) ? `
        <tr>
          <td>Night Driving & Halt Charges</td>
          <td class="text-right">-</td>
          <td class="text-right">-</td>
          <td class="text-right">₹${billing.nightCharges}</td>
        </tr>` : ''}
        ${(billing.tollCharges > 0 || billing.parkingCharges > 0) ? `
        <tr>
          <td>Toll Tax, Fastag & Parking Fees</td>
          <td class="text-right">Actuals</td>
          <td class="text-right">-</td>
          <td class="text-right">₹${(billing.tollCharges || 0) + (billing.parkingCharges || 0)}</td>
        </tr>` : ''}
      </tbody>
    </table>

    <table class="totals-table">
      <tr>
        <td style="width: 55%; vertical-align: top;">
          ${invoice.upiPayment?.qrUrl ? `
          <div class="qr-container">
            <img src="${invoice.upiPayment.qrUrl}" width="110" height="110" alt="UPI QR" style="display:block; margin:0 auto 4px auto;"><br>
            <small style="font-size: 10px; font-weight: 700; color:#0f172a;">Scan to Pay Balance</small>
          </div>` : ''}
        </td>
        <td style="width: 45%;">
          <table style="width: 100%;">
            <tr><td>Sub-Total:</td><td class="text-right">₹${billing.subTotal || 0}</td></tr>
            ${isGst ? `
            <tr><td>CGST (${(billing.gstRatePercent || 5) / 2}%):</td><td class="text-right">₹${billing.cgstAmount || 0}</td></tr>
            <tr><td>SGST (${(billing.gstRatePercent || 5) / 2}%):</td><td class="text-right">₹${billing.sgstAmount || 0}</td></tr>` : ''}
            <tr class="grand-total"><td>Total Amount:</td><td class="text-right">₹${invoice.totalAmount}</td></tr>
            <tr><td>Advance Received:</td><td class="text-right">- ₹${invoice.advancePaid}</td></tr>
            <tr style="font-size: 14px; font-weight: 800; color: #dc2626;">
              <td>Balance Payable:</td><td class="text-right">₹${invoice.balanceDue}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <table class="signature-area">
      <tr>
        <td style="width: 60%; font-size: 11px;">
          <strong>Bank Account:</strong> ${company.bankDetails?.bankName || 'SBI'}, A/C: ${company.bankDetails?.accountNumber || 'N/A'}<br>
          <strong>IFSC:</strong> ${company.bankDetails?.ifscCode || 'N/A'} | <strong>Branch:</strong> ${company.bankDetails?.branch || 'Udaipur'}
        </td>
        <td class="text-right" style="width: 40%; font-size: 11px;">
          For <strong>${company.name || 'Aadesh Tours Udaipur'}</strong><br><br><br>
          Authorized Signatory
        </td>
      </tr>
    </table>

    <div class="footer-terms">
      <strong>Terms & Conditions:</strong><br>
      ${(company.terms || ['Subject to Udaipur jurisdiction only.']).map(t => `• ${t}`).join('<br>')}
    </div>
  </div>
</body>
</html>`;
}

/**
 * 3. Export Single Invoice as PDF
 */
export function exportInvoiceToPdf(invoice) {
  const html = buildInvoicePrintTemplate(invoice);
  triggerPrintOrPdf(html, `Invoice_${invoice.invoiceNumber.replace(/\//g, '_')}`);
}

/**
 * 4. Export Daybook / Daily Ledger as PDF
 */
export function exportDaybookToPdf(daybookData, companyName = "Aadesh Tours Udaipur") {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Daybook_${daybookData.date}</title>
  <style>
    @page { size: A4 landscape; margin: 10mm; }
    * { box-sizing: border-box; font-family: -apple-system, sans-serif; }
    body { font-size: 12px; color: #0f172a; margin: 0; }
    .header { border-bottom: 2px solid #0f172a; padding-bottom: 8px; margin-bottom: 12px; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th { background: #f1f5f9; border: 1px solid #cbd5e1; padding: 7px; text-align: left; }
    td { border: 1px solid #cbd5e1; padding: 6px 8px; }
    .text-right { text-align: right; }
    .credit { color: #15803d; font-weight: 700; }
    .debit { color: #b91c1c; font-weight: 700; }
  </style>
</head>
<body>
  <div class="header">
    <h2 style="margin: 0;">${companyName} - Daily Daybook</h2>
    <div>Date: <strong>${daybookData.date}</strong> | Total Vouchers: ${daybookData.totalVouchers}</div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Voucher #</th>
        <th>Type</th>
        <th>Account Head</th>
        <th>Particulars / Narration</th>
        <th>Mode</th>
        <th class="text-right">Debit (नामे ₹)</th>
        <th class="text-right">Credit (जमा ₹)</th>
      </tr>
    </thead>
    <tbody>
      ${daybookData.vouchers.map(v => `
      <tr>
        <td>${v.voucherNo}</td>
        <td><strong>${v.voucherType}</strong></td>
        <td>${v.accountHead}</td>
        <td>${v.particulars}</td>
        <td>${v.paymentMode}</td>
        <td class="text-right debit">${v.debit > 0 ? '₹' + v.debit : '-'}</td>
        <td class="text-right credit">${v.credit > 0 ? '₹' + v.credit : '-'}</td>
      </tr>`).join('')}
    </tbody>
    <tfoot>
      <tr style="background: #f8fafc; font-weight: 800;">
        <td colspan="5" class="text-right">TOTAL:</td>
        <td class="text-right debit">₹${daybookData.totalDebit}</td>
        <td class="text-right credit">₹${daybookData.totalCredit}</td>
      </tr>
      <tr style="background: #f1f5f9; font-weight: 800;">
        <td colspan="5" class="text-right">NET CASHFLOW SURPLUS / (DEFICIT):</td>
        <td colspan="2" class="text-right" style="font-size: 13px;">₹${daybookData.netBalance}</td>
      </tr>
    </tfoot>
  </table>
</body>
</html>`;

  triggerPrintOrPdf(html, `Daybook_${daybookData.date}`);
}
