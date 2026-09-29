// js/views/billing-view.js
// Aadesh Tours Udaipur - Complete Billing, Edit, Delete & Branded PDF/Print Controller

import { db } from "../config/firebase-config.js";
import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  deleteDoc, 
  query, 
  orderBy 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// Helper to retrieve saved Company Profile from settings
function getCompanyProfile() {
  try {
    const raw = localStorage.getItem("aadesh_master_settings") || localStorage.getItem("aadesh_business_profile");
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn("Company profile parse error:", e);
  }
  return {
    businessName: "Aadesh Tours Udaipur",
    tagline: "Taxi & Tour Operator - Powered by Aachico Infotech",
    phone: "8118878912",
    altPhone: "",
    address: "Udaipur, Rajasthan - 313001",
    gstNumber: "",
    upiId: "8118878912@upi",
    terms: "1. All disputes subject to Udaipur jurisdiction.\n2. Parking and toll tax extra if not included."
  };
}

export async function renderBillingView(containerEl, onNavigate) {
  let invoices = [];
  try {
    const q = query(collection(db, "invoices"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    invoices = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.warn("Invoices fetch error:", err);
    try {
      const snap = await getDocs(collection(db, "invoices"));
      invoices = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (e) {
      invoices = [];
    }
  }

  const totalBilled = invoices.reduce((s, i) => s + (Number(i.totalAmount) || 0), 0);
  const totalDue = invoices.reduce((s, i) => s + (Number(i.balanceDue) || 0), 0);
  const totalCollected = totalBilled - totalDue;

  let invoiceListHtml = "";
  if (invoices.length === 0) {
    invoiceListHtml = '<div class="vault-card text-center p-8 text-slate-500 text-xs">कोई बिल नहीं मिला। "+ नया बिल बनाएं" पर क्लिक करके पहला इनवॉइस बनाएं।</div>';
  } else {
    invoiceListHtml = invoices.map(inv => {
      const isUnpaid = Number(inv.balanceDue) > 0;
      const borderClass = isUnpaid ? "border-l-rose-500 bg-rose-500/5" : "border-l-emerald-500";
      const statusBadge = isUnpaid ? '<span class="badge-status badge-danger">DUE</span>' : '<span class="badge-status badge-active">PAID</span>';
      const bType = inv.isGstInvoice ? '<span class="badge-status badge-info">GST</span>' : '<span class="badge-status badge-warning">BILL</span>';

      return `
        <div class="vault-card space-y-2.5 border-l-4 ${borderClass} text-xs">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-1.5">
              <span class="font-mono font-bold text-white text-sm">${inv.invoiceNumber}</span>
              ${bType}
              ${statusBadge}
            </div>
            <span class="text-slate-400 font-mono text-[11px]">${inv.invoiceDate || ''}</span>
          </div>

          <div class="bg-slate-950/60 p-2.5 rounded-xl grid grid-cols-2 gap-2 text-[11px] border border-slate-800">
            <div>
              <span class="text-slate-400 block text-[10px]">ग्राहक / पार्टी:</span>
              <span class="font-bold text-white text-xs">${inv.customerName}</span>
              <span class="text-slate-400 block font-mono">${inv.customerPhone || '-'}</span>
            </div>
            <div>
              <span class="text-slate-400 block text-[10px]">गाड़ी व रूट:</span>
              <span class="font-mono text-amber-400 font-bold">${inv.vehicleNumber || 'टैक्सी'}</span>
              <span class="text-slate-300 block truncate">${inv.pickupLocation || 'लोकल'}</span>
            </div>
          </div>

          <div class="flex items-center justify-between font-mono bg-slate-900/60 p-2 rounded-lg text-[11px]">
            <div>कुल: <span class="text-white font-bold">₹${(Number(inv.totalAmount) || 0).toLocaleString('en-IN')}</span></div>
            <div>जमा: <span class="text-emerald-400 font-bold">₹${(Number(inv.advancePaid) || 0).toLocaleString('en-IN')}</span></div>
            <div>बकाया: <span class="text-rose-400 font-bold">₹${(Number(inv.balanceDue) || 0).toLocaleString('en-IN')}</span></div>
          </div>

          <!-- All Action Buttons: Share, Print/PDF, Edit, Delete -->
          <div class="flex flex-wrap items-center justify-between gap-1.5 pt-1 border-t border-slate-800">
            <div class="flex gap-1.5">
              <button class="btn btn-secondary py-1 px-2.5 text-[11px] text-emerald-400 btn-share-wa" data-inv="${inv.invoiceNumber}">
                📲 WhatsApp
              </button>
              <button class="btn btn-secondary py-1 px-2.5 text-[11px] text-sky-400 btn-print-invoice" data-inv="${inv.invoiceNumber}">
                🖨️ प्रिंट / PDF
              </button>
            </div>
            <div class="flex gap-1.5">
              <button class="btn btn-secondary py-1 px-2.5 text-[11px] btn-edit-invoice" data-inv="${inv.invoiceNumber}">
                ✏️ एडिट
              </button>
              <button class="btn btn-danger py-1 px-2 text-[11px] btn-delete-invoice" data-inv="${inv.invoiceNumber}">
                🗑️
              </button>
            </div>
          </div>
        </div>
      `;
    }).join("");
  }

  containerEl.innerHTML = `
    <div class="flex items-center justify-between gap-2">
      <div>
        <h2 class="text-lg font-black text-white">बिलिंग व इनवॉइस</h2>
        <p class="text-xs text-slate-400">कुल बिल: <span class="font-mono text-amber-400 font-bold">${invoices.length}</span></p>
      </div>
      <button id="btn-open-direct-bill" class="btn btn-primary text-xs py-2 px-3 font-bold shadow-lg">
        + नया बिल बनाएं
      </button>
    </div>

    <!-- Quick Stats -->
    <div class="grid grid-cols-3 gap-2 text-center">
      <div class="stat-metric p-2">
        <div class="stat-label text-[10px]">कुल बिलिंग</div>
        <div class="stat-value text-sm text-white">₹${totalBilled.toLocaleString('en-IN')}</div>
      </div>
      <div class="stat-metric p-2">
        <div class="stat-label text-[10px]">कुल वसूली</div>
        <div class="stat-value text-sm text-emerald-400">₹${totalCollected.toLocaleString('en-IN')}</div>
      </div>
      <div class="stat-metric p-2 border-rose-500/30">
        <div class="stat-label text-[10px] text-rose-400">बाकी (DUE)</div>
        <div class="stat-value text-sm text-rose-400">₹${totalDue.toLocaleString('en-IN')}</div>
      </div>
    </div>

    <div class="space-y-3">
      ${invoiceListHtml}
    </div>
  `;

  // Bind UI Events
  const modalContainer = document.getElementById("modal-container");
  const modalContent = document.getElementById("modal-content");

  const openModal = (html) => {
    modalContent.innerHTML = html;
    modalContainer.classList.remove("hidden");
  };

  const closeModal = () => {
    modalContainer.classList.add("hidden");
    modalContent.innerHTML = "";
  };

  // 1. Create New Invoice
  document.getElementById("btn-open-direct-bill")?.addEventListener("click", () => {
    openInvoiceModal(null, openModal, closeModal, containerEl, onNavigate);
  });

  // 2. Edit Invoice
  containerEl.querySelectorAll(".btn-edit-invoice").forEach(btn => {
    btn.addEventListener("click", () => {
      const invNum = btn.dataset.inv;
      const inv = invoices.find(i => i.invoiceNumber === invNum);
      if (inv) openInvoiceModal(inv, openModal, closeModal, containerEl, onNavigate);
    });
  });

  // 3. Delete Invoice
  containerEl.querySelectorAll(".btn-delete-invoice").forEach(btn => {
    btn.addEventListener("click", async () => {
      const invNum = btn.dataset.inv;
      if (confirm(`क्या आप सच में बिल #${invNum} को हमेशा के लिए डिलीट करना चाहते हैं?`)) {
        try {
          await deleteDoc(doc(db, "invoices", invNum));
          alert(`बिल #${invNum} सफलतापूर्वक हटा दिया गया!`);
          renderBillingView(containerEl, onNavigate);
        } catch (err) {
          alert("डिलीट करने में त्रुटि: " + err.message);
        }
      }
    });
  });

  // 4. WhatsApp Share
  containerEl.querySelectorAll(".btn-share-wa").forEach(btn => {
    btn.addEventListener("click", () => {
      const invNum = btn.dataset.inv;
      const inv = invoices.find(i => i.invoiceNumber === invNum);
      if (!inv) return;
      const comp = getCompanyProfile();
      const msg = `*${comp.businessName.toUpperCase()}*\n${comp.address}\n📞 संपर्क: ${comp.phone}\n----------------------------------\n*टैक्सी इनवॉइस / बिल*\nबिल नं: *${inv.invoiceNumber}*\nतारीख: ${inv.invoiceDate || ''}\nपार्टी: *${inv.customerName}* (${inv.customerPhone || '-' })\nगाड़ी नं: *${inv.vehicleNumber || 'टैक्सी'}*\nरूट: ${inv.pickupLocation || 'Local'}\nदिन: ${inv.totalDays || 1} | KM: ${inv.totalKm || 0}\n----------------------------------\nकुल किराया: ₹${Number(inv.totalAmount || 0).toLocaleString('en-IN')}\nजमा एडवांस: ₹${Number(inv.advancePaid || 0).toLocaleString('en-IN')}\n*बकाया (Balance): ₹${Number(inv.balanceDue || 0).toLocaleString('en-IN')}*\n----------------------------------\nधन्यवाद! यात्रा मंगलमय हो।`;
      const phoneDigits = inv.customerPhone ? inv.customerPhone.replace(/\D/g, '') : '';
      const url = `https://wa.me/${phoneDigits ? ('91' + phoneDigits) : ''}?text=${encodeURIComponent(msg)}`;
      window.open(url, "_blank");
    });
  });

  // 5. Professional Branded Print & PDF Export (Company Profile Integrated)
  containerEl.querySelectorAll(".btn-print-invoice").forEach(btn => {
    btn.addEventListener("click", () => {
      const invNum = btn.dataset.inv;
      const inv = invoices.find(i => i.invoiceNumber === invNum);
      if (!inv) return;
      printCompanyInvoice(inv);
    });
  });
}

/**
 * GENERATE AND PRINT / DOWNLOAD PROFESSIONAL PDF INVOICE
 */
function printCompanyInvoice(inv) {
  const comp = getCompanyProfile();
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert("कृपया पॉप-अप अनुमति दें ताकि बिल प्रिंट व PDF डाउनलोड हो सके।");
    return;
  }

  const isPaid = Number(inv.balanceDue) <= 0;
  const statusColor = isPaid ? "#10b981" : "#ef4444";
  const statusText = isPaid ? "PAID / चुकता" : `DUE: ₹${Number(inv.balanceDue).toLocaleString('en-IN')}`;

  const html = `
    <!DOCTYPE html>
    <html lang="hi">
    <head>
      <meta charset="UTF-8">
      <title>Invoice - ${inv.invoiceNumber} - ${comp.businessName}</title>
      <style>
        @page { size: A4; margin: 15mm; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1e293b; margin: 0; padding: 20px; font-size: 13px; line-height: 1.5; background: #fff; }
        .invoice-card { max-width: 800px; margin: auto; border: 1px solid #cbd5e1; padding: 24px; border-radius: 8px; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0f172a; padding-bottom: 16px; margin-bottom: 20px; }
        .company-name { font-size: 24px; font-weight: 900; color: #0f172a; text-transform: uppercase; margin: 0; }
        .company-sub { font-size: 11px; font-weight: 600; color: #d97706; margin-top: 2px; }
        .company-meta { font-size: 11px; color: #475569; margin-top: 6px; }
        .inv-badge-box { text-align: right; }
        .inv-title { font-size: 20px; font-weight: 800; color: #0f172a; margin: 0; letter-spacing: 1px; }
        .inv-number { font-family: monospace; font-size: 15px; font-weight: 700; color: #d97706; margin-top: 4px; }
        .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; background: #f8fafc; padding: 14px; border-radius: 6px; margin-bottom: 20px; border: 1px solid #e2e8f0; }
        .meta-title { font-size: 10px; font-weight: 800; text-transform: uppercase; color: #64748b; margin-bottom: 4px; }
        .meta-value { font-weight: 700; font-size: 13px; color: #0f172a; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th { background: #0f172a; color: #fff; text-align: left; padding: 8px 12px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; }
        td { padding: 9px 12px; border-bottom: 1px solid #e2e8f0; font-size: 12px; }
        .text-right { text-align: right; }
        .totals-table { width: 280px; margin-left: auto; margin-bottom: 20px; }
        .totals-table td { padding: 6px 10px; }
        .grand-total { font-size: 15px; font-weight: 900; color: #0f172a; border-top: 2px solid #0f172a; border-bottom: 2px solid #0f172a; }
        .status-badge { display: inline-block; padding: 4px 12px; border-radius: 9999px; font-weight: 800; font-size: 12px; color: #fff; background: ${statusColor}; margin-top: 6px; }
        .footer-grid { display: grid; grid-template-columns: 1.5fr 1fr; gap: 20px; border-top: 1px solid #cbd5e1; padding-top: 14px; margin-top: 10px; font-size: 11px; color: #475569; }
        .sign-box { text-align: right; margin-top: 30px; }
        .sign-line { border-top: 1px solid #94a3b8; display: inline-block; width: 160px; padding-top: 4px; font-weight: 700; font-size: 11px; color: #0f172a; text-align: center; }
        .btn-print-bar { text-align: center; margin-bottom: 20px; }
        .btn-pdf { background: #d97706; color: #fff; border: none; padding: 10px 24px; border-radius: 6px; font-weight: 800; font-size: 14px; cursor: pointer; }
        @media print {
          .btn-print-bar { display: none; }
          body { padding: 0; }
          .invoice-card { border: none; padding: 0; }
        }
      </style>
    </head>
    <body>
      <div class="btn-print-bar">
        <button class="btn-pdf" onclick="window.print()">📥 PDF डाउनलोड / प्रिंट करें</button>
      </div>

      <div class="invoice-card">
        <!-- Header with saved Company Profile -->
        <div class="header">
          <div>
            <h1 class="company-name">${comp.businessName}</h1>
            <div class="company-sub">${comp.tagline || 'Taxi & Travel Service Udaipur'}</div>
            <div class="company-meta">
              📍 ${comp.address}<br>
              📞 फ़ोन: ${comp.phone} ${comp.altPhone ? ('/ ' + comp.altPhone) : ''}<br>
              ${comp.gstNumber ? ('<strong>GSTIN:</strong> ' + comp.gstNumber) : ''}
            </div>
          </div>
          <div class="inv-badge-box">
            <h2 class="inv-title">${inv.isGstInvoice ? 'TAX INVOICE' : 'DUTY SLIP / BILL'}</h2>
            <div class="inv-number"># ${inv.invoiceNumber}</div>
            <div style="font-size: 11px; color: #64748b; margin-top: 2px;">तारीख: <strong>${inv.invoiceDate || ''}</strong></div>
            <div class="status-badge">${statusText}</div>
          </div>
        </div>

        <!-- Billed Party & Journey Meta -->
        <div class="meta-grid">
          <div>
            <div class="meta-title">ग्राहक / पार्टी (Billed To):</div>
            <div class="meta-value">${inv.customerName}</div>
            <div style="font-size: 12px; color: #475569; margin-top: 2px;">फ़ोन: <strong>${inv.customerPhone || '-'}</strong></div>
          </div>
          <div>
            <div class="meta-title">गाड़ी व यात्रा विवरण (Vehicle & Route):</div>
            <div class="meta-value" style="color: #d97706; font-family: monospace;">${inv.vehicleNumber || 'टैक्सी'}</div>
            <div style="font-size: 12px; color: #475569; margin-top: 2px;">रूट: <strong>${inv.pickupLocation || 'लोकल उदयपुर'}</strong></div>
          </div>
        </div>

        <!-- Billing Items Table -->
        <table>
          <thead>
            <tr>
              <th>विवरण (Description)</th>
              <th class="text-right">दिन (Days)</th>
              <th class="text-right">किमी (KM)</th>
              <th class="text-right">दर (Rate)</th>
              <th class="text-right">राशि (Amount)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <strong>टैक्सी किराया (Vehicle Fare)</strong><br>
                <span style="font-size: 11px; color: #64748b;">वाहन: ${inv.vehicleNumber || 'Cab'} (${inv.totalDays || 1} दिन)</span>
              </td>
              <td class="text-right">${inv.totalDays || 1}</td>
              <td class="text-right">${inv.totalKm || 0}</td>
              <td class="text-right">₹${inv.ratePerKm || 0}</td>
              <td class="text-right">₹${Number(inv.totalKm && inv.ratePerKm ? (inv.totalKm * inv.ratePerKm) : (inv.totalAmount || 0)).toLocaleString('en-IN')}</td>
            </tr>
            ${Number(inv.driverBhatta) > 0 ? `
              <tr>
                <td><strong>ड्राइवर भत्ता (Driver Bhatta)</strong></td>
                <td class="text-right">${inv.totalDays || 1}</td>
                <td class="text-right">-</td>
                <td class="text-right">-</td>
                <td class="text-right">₹${Number(inv.driverBhatta).toLocaleString('en-IN')}</td>
              </tr>
            ` : ''}
            ${Number(inv.tollCharges) > 0 ? `
              <tr>
                <td><strong>टोल व पार्किंग (Toll & Parking)</strong></td>
                <td class="text-right">-</td>
                <td class="text-right">-</td>
                <td class="text-right">-</td>
                <td class="text-right">₹${Number(inv.tollCharges).toLocaleString('en-IN')}</td>
              </tr>
            ` : ''}
            ${inv.isGstInvoice ? `
              <tr>
                <td><strong>जीएसटी (GST @ 5%)</strong></td>
                <td class="text-right">-</td>
                <td class="text-right">-</td>
                <td class="text-right">5%</td>
                <td class="text-right">जुड़ा हुआ</td>
              </tr>
            ` : ''}
          </tbody>
        </table>

        <!-- Totals & Payment Breakdown -->
        <table class="totals-table">
          <tr>
            <td class="meta-title">कुल राशि (Total):</td>
            <td class="text-right" style="font-weight: 700;">₹${Number(inv.totalAmount || 0).toLocaleString('en-IN')}</td>
          </tr>
          <tr>
            <td class="meta-title" style="color: #10b981;">जमा एडवांस (Advance):</td>
            <td class="text-right" style="font-weight: 700; color: #10b981;">₹${Number(inv.advancePaid || 0).toLocaleString('en-IN')}</td>
          </tr>
          <tr class="grand-total">
            <td>बकाया (Balance Due):</td>
            <td class="text-right" style="color: ${Number(inv.balanceDue) > 0 ? '#ef4444' : '#10b981'};">₹${Number(inv.balanceDue || 0).toLocaleString('en-IN')}</td>
          </tr>
        </table>

        <!-- Footer / UPI & Bank / Terms -->
        <div class="footer-grid">
          <div>
            <div style="font-weight: 700; color: #0f172a; margin-bottom: 2px;">भुगतान नियम व UPI:</div>
            <div>📲 UPI ID: <strong>${comp.upiId || '8118878912@upi'}</strong></div>
            <div style="margin-top: 6px; font-size: 10px; color: #64748b; white-space: pre-line;">${comp.terms || '1. All disputes subject to Udaipur jurisdiction.'}</div>
          </div>
          <div class="sign-box">
            <div class="sign-line">हस्ताक्षर / Authorised Signatory<br><strong style="font-size: 10px;">${comp.businessName}</strong></div>
          </div>
        </div>
      </div>

      <script>
        window.onload = function() {
          setTimeout(() => { window.print(); }, 400);
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}

/**
 * MODAL: CREATE / EDIT TAXI INVOICE
 */
function openInvoiceModal(invoiceToEdit, openModal, closeModal, containerEl, onNavigate) {
  const isEdit = !!invoiceToEdit;
  const today = new Date().toISOString().slice(0, 10);
  const autoInv = isEdit ? invoiceToEdit.invoiceNumber : ("ATU-" + Date.now().toString().slice(-5));

  const html = `
    <div class="max-h-[85vh] overflow-y-auto pr-1 text-xs">
      <h3 class="text-base font-bold text-white mb-2">${isEdit ? 'बिल विवरण एडिट करें'
