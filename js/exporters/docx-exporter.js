// js/exporters/docx-exporter.js
// Aadesh Tours Udaipur - Word DOCX / Quotation & Agreement Export Engine (Phase 23)

/**
 * 1. Low-Level Browser Word Document Downloader
 * Generates an MS Word compatible XML/HTML document that opens natively in MS Word & Google Docs.
 * @param {string} bodyHtml - Styled HTML content of document
 * @param {string} filename - Output filename
 */
export function triggerDocDownload(bodyHtml, filename = "Document.doc") {
  const wordDocumentHtml = `
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
  <meta charset='utf-8'>
  <title>${filename}</title>
  <!--[if gte mso 9]>
  <xml>
    <w:WordDocument>
      <w:View>Print</w:View>
      <w:Zoom>100</w:Zoom>
      <w:DoNotOptimizeForBrowser/>
    </w:WordDocument>
  </xml>
  <![endif]-->
  <style>
    body { font-family: 'Calibri', 'Segoe UI', Arial, sans-serif; font-size: 11.5pt; color: #1e293b; line-height: 1.5; margin: 1in; }
    h1 { font-size: 18pt; color: #0f172a; margin-bottom: 2pt; text-transform: uppercase; border-bottom: 2pt solid #0f172a; padding-bottom: 4pt; }
    h2 { font-size: 13pt; color: #334155; margin-top: 14pt; margin-bottom: 4pt; }
    p { margin: 0 0 6pt 0; }
    table { width: 100%; border-collapse: collapse; margin: 12pt 0; }
    th { background-color: #f1f5f9; border: 1pt solid #94a3b8; padding: 6pt 8pt; text-align: left; font-size: 11pt; }
    td { border: 1pt solid #cbd5e1; padding: 6pt 8pt; font-size: 10.5pt; }
    .text-right { text-align: right; }
    .badge { background-color: #0f172a; color: #ffffff; padding: 3pt 8pt; font-size: 9.5pt; font-weight: bold; }
    ul { margin: 4pt 0 10pt 18pt; padding: 0; }
    li { margin-bottom: 3pt; }
  </style>
</head>
<body>
  ${bodyHtml}
</body>
</html>`;

  const blob = new Blob([wordDocumentHtml], { type: "application/msword;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".doc") ? filename : `${filename}.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * 2. Generate and Download Formal Tour Quotation / Estimate
 * @param {Object} quote
 */
export function exportTourQuotationDocx(quote) {
  const quoteNumber = quote.quoteNumber || `QT-${Date.now().toString().slice(-6)}`;
  const dateStr = quote.date || new Date().toISOString().slice(0, 10);

  const html = `
  <h1>Aadesh Tours Udaipur</h1>
  <p style="font-size: 10pt; color: #64748b; margin-top: -2pt;">Premium Car Rental & Tour Operator | Udaipur, Rajasthan | Phone: +91 98765 43210</p>
  
  <table style="border: none; margin-top: 15pt;">
    <tr style="border: none;">
      <td style="border: none; width: 60%; vertical-align: top;">
        <strong>Quotation Prepared For:</strong><br>
        <span style="font-size: 13pt; font-weight: bold;">${quote.clientName || 'Valued Guest / Corporate'}</span><br>
        ${quote.clientCompany ? `Company: ${quote.clientCompany}<br>` : ''}
        Phone: ${quote.clientPhone || 'N/A'}<br>
        Destination / Tour: <strong>${quote.tourTitle || 'Rajasthan Tour Package'}</strong>
      </td>
      <td style="border: none; width: 40%; vertical-align: top; text-align: right;">
        <span class="badge">TOUR QUOTATION</span><br><br>
        <strong>Quote Ref:</strong> ${quoteNumber}<br>
        <strong>Date:</strong> ${dateStr}<br>
        <strong>Validity:</strong> 15 Days from Date of Issue
      </td>
    </tr>
  </table>

  <h2>1. Proposed Vehicle & Commercial Estimates</h2>
  <table>
    <thead>
      <tr>
        <th>Vehicle Category</th>
        <th>Seating</th>
        <th>Rate / Day or KM</th>
        <th>Min KM Slabs</th>
        <th class="text-right">Estimated Cost (₹)</th>
      </tr>
    </thead>
    <tbody>
      ${(quote.vehicles || [
        { model: "Swift Dzire / Etios (Sedan)", seating: "4+1", rate: "₹11 / KM", slab: "250 KM / Day", total: quote.totalAmount || "As Per Actual" }
      ]).map(v => `
      <tr>
        <td><strong>${v.model}</strong></td>
        <td>${v.seating}</td>
        <td>${v.rate}</td>
        <td>${v.slab}</td>
        <td class="text-right"><strong>${v.total}</strong></td>
      </tr>`).join('')}
    </tbody>
  </table>

  <h2>2. Inclusions (शामिल हैं)</h2>
  <ul>
    <li>Neat, clean, sanitized and well-maintained commercial AC vehicle with professional chauffeur.</li>
    <li>Driver daily allowance (bhatta) and standard day duty fuel charges.</li>
    <li>Complimentary assistance with local sightseeing itinerary and hotel pick-and-drop.</li>
  </ul>

  <h2>3. Exclusions (अतिरिक्त देय)</h2>
  <ul>
    <li>State border entry tax and special permits (if crossing Rajasthan state borders).</li>
    <li>Fastag toll charges and monument/hotel parking tickets payable as per actual receipts.</li>
    <li>Night driving allowance applicable if vehicle duty extends between 10:00 PM to 06:00 AM.</li>
    <li>Monument entry tickets, guide charges, boat ride fees, or personal travel expenses.</li>
  </ul>

  <h2>4. Commercial Terms & Booking Policy</h2>
  <p>• <strong>Advance:</strong> 25% token advance required to confirm and lock vehicle slot.</p>
  <p>• <strong>Payment Mode:</strong> Bank NEFT/RTGS, UPI (GPay/PhonePe), or Cash settlement.</p>
  <p>• <strong>Jurisdiction:</strong> All legal disputes subject to Udaipur (Rajasthan) jurisdiction only.</p>

  <br><br>
  <table style="border: none; margin-top: 25pt;">
    <tr style="border: none;">
      <td style="border: none; width: 50%;">
        ____________________________<br>
        <strong>Customer Acceptance Signature</strong>
      </td>
      <td style="border: none; width: 50%; text-align: right;">
        <strong>For Aadesh Tours Udaipur</strong><br><br><br>
        Authorized Signatory
      </td>
    </tr>
  </table>
  `;

  triggerDocDownload(html, `Quotation_${quoteNumber}`);
}

/**
 * 3. Generate and Download Vendor Car Attachment Agreement
 * @param {Object} vendor
 * @param {Object} vehicle
 */
export function exportVendorAgreementDocx(vendor, vehicle) {
  const agreementId = `AGR-${Date.now().toString().slice(-6)}`;
  const dateStr = new Date().toISOString().slice(0, 10);

  const html = `
  <h1>Commercial Vehicle Attachment Agreement</h1>
  <p style="font-size: 10pt; color: #64748b;">Aadesh Tours Udaipur | Market Partner Registry</p>

  <p>This Business Agreement is executed on <strong>${dateStr}</strong> at Udaipur, Rajasthan between:</p>

  <p><strong>PARTY OF THE FIRST PART (Operating Agency):</strong><br>
  <strong>Aadesh Tours Udaipur</strong>, represented by Mr. Himmat Puri, having its registered desk at Udaipur, Rajasthan.</p>

  <p><strong>AND</strong></p>

  <p><strong>PARTY OF THE SECOND PART (Vehicle Owner / Vendor):</strong><br>
  <strong>${vendor.agencyName || vendor.name}</strong>, Contact: ${vendor.phone || 'N/A'}, Address: ${vendor.city || 'Udaipur'}.</p>

  <h2>1. Attached Vehicle Particulars</h2>
  <table>
    <tr><td><strong>Registration Number:</strong></td><td>${vehicle.regNumber || 'RJ-27-TA-XXXX'}</td></tr>
    <tr><td><strong>Make & Model:</strong></td><td>${vehicle.makeModel || 'Sedan / SUV'}</td></tr>
    <tr><td><strong>Commission Model:</strong></td><td>${vendor.commissionPercentage || 10}% Deduction on Gross Booking</td></tr>
  </table>

  <h2>2. Operational & Statutory Compliance</h2>
  <p>1. The vehicle owner certifies that the vehicle possesses valid All India / Rajasthan Tourist Permit, Comprehensive Commercial Insurance, Fitness Certificate, and Pollution (PUC) Certificate at all times.</p>
  <p>2. The Chauffeur deployed on duties must hold a valid commercial driving license, maintain decent behavior, and refrain from substance abuse on duty.</p>
  <p>3. Fuel, periodic vehicle maintenance, and tyre repairs shall be the sole responsibility of the vehicle owner.</p>

  <h2>3. Settlements & Payment Policy</h2>
  <p>Trip settlements shall be calculated and released upon submission of closed duty slips and toll receipts within 48 hours of trip completion.</p>

  <br><br>
  <table style="border: none; margin-top: 30pt;">
    <tr style="border: none;">
      <td style="border: none; width: 50%;">
        ____________________________<br>
        <strong>Signature of Vehicle Owner</strong><br>
        (${vendor.agencyName || vendor.name})
      </td>
      <td style="border: none; width: 50%; text-align: right;">
        ____________________________<br>
        <strong>For Aadesh Tours Udaipur</strong><br>
        Authorized Signatory
      </td>
    </tr>
  </table>
  `;

  triggerDocDownload(html, `Agreement_${vendor.agencyName || 'Vendor'}_${agreementId}`);
}
