// js/views/billing-view.js
// Aadesh Tours Udaipur - Authentic Billbook Print & PDF Generator

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

function getBizProfile() {
  try {
    const raw = localStorage.getItem("aadesh_master_settings") || localStorage.getItem("aadesh_business_profile");
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return {
    businessName: "AADESH TOURS",
    city: "UDAIPUR",
    address: "Sec. 14, Balicha, Udaipur, (Raj.) 313001",
    phone: "9602842390",
    altPhone: "7043195007",
    email: "chetannathsisodiya500@gmail.com",
    tagline: "All Type Of Taxi Tourist Cars (a.c. And Non A.c.) 24 Hours Available",
    bankName: "State Bank of India",
    accountHolder: "CHETAN NATH",
    accountNo: "44936542535",
    ifsc: "SBIN0016178",
    upiId: "9602842390@upi"
  };
}

export async function renderBillingView(containerEl, onNavigate) {
  let invoices = [];
  try {
    const q = query(collection(db, "invoices"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    invoices = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (err) {
    try {
      const snap = await getDocs(collection(db, "invoices"));
      invoices = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (e) {
      invoices = [];
    }
  }

  const totalBilled = invoices.reduce((s, i) => s + (Number(i.totalAmount) || 0), 0);
  const totalDue = invoices.reduce((s, i) => s + (Number(i.balanceDue) || 0), 0);
  const totalCol = totalBilled - totalDue;

  let listHtml = "";
  if (invoices.length === 0) {
    listHtml = '<div class="vault-card text-center p-6 text-slate-500 text-xs">कोई बिल नहीं मिला। "+ नया बिल बनाएं" पर क्लिक करें।</div>';
  } else {
    listHtml = invoices.map(inv => {
      const isDue = Number(inv.balanceDue) > 0;
      const bColor = isDue ? "border-l-rose-500" : "border-l-emerald-500";
      const badge = isDue ? '<span class="badge-status badge-danger">DUE</span>' : '<span class="badge-status badge-active">PAID</span>';

      return `
        <div class="vault-card space-y-2 border-l-4 ${bColor} text-xs">
          <div class="flex justify-between items-center">
            <div class="flex items-center gap-1.5 font-mono font-bold text-white">
              <span>#${inv.invoiceNumber}</span>
              ${badge}
            </div>
            <span class="text-slate-400 font-mono text-[11px]">${inv.invoiceDate || ''}</span>
          </div>

          <div class="bg-slate-950/60 p-2.5 rounded-xl grid grid-cols-2 gap-2 text-[11px] border border-slate-800">
            <div>
              <span class="text-slate-400 block text-[10px]">पार्टी (Party):</span>
              <span class="font-bold text-white">${inv.customerName}</span>
              <span class="text-slate-400 block font-mono">${inv.customerPhone || '-'}</span>
            </div>
            <div>
              <span class="text-slate-400 block text-[10px]">गाड़ी व रूट:</span>
              <span class="font-mono text-amber-400 font-bold">${inv.vehicleNumber || 'टैक्सी'}</span>
              <span class="text-slate-300 block truncate">${inv.pickupLocation || 'लोकल'}</span>
            </div>
          </div>

          <div class="flex justify-between font-mono bg-slate-900/60 p-1.5 rounded-lg text-[11px]">
            <div>कुल: <span class="text-white font-bold">₹${(Number(inv.totalAmount)||0).toLocaleString('en-IN')}</span></div>
            <div>जमा: <span class="text-emerald-400 font-bold">₹${(Number(inv.advancePaid)||0).toLocaleString('en-IN')}</span></div>
            <div>बाकी: <span class="text-rose-400 font-bold">₹${(Number(inv.balanceDue)||0).toLocaleString('en-IN')}</span></div>
          </div>

          <div class="flex justify-between items-center pt-1 border-t border-slate-800 text-[11px]">
            <div class="flex gap-1.5">
              <button class="btn btn-secondary py-1 px-2.5 text-emerald-400 btn-wa" data-inv="${inv.invoiceNumber}">📲 WhatsApp</button>
              <button class="btn btn-secondary py-1 px-2.5 text-amber-400 btn-print-billbook font-bold" data-inv="${inv.invoiceNumber}">🖨️ ओरिजिनल बिल (PDF)</button>
            </div>
            <div class="flex gap-1">
              <button class="btn btn-secondary py-1 px-2 btn-edit" data-inv="${inv.invoiceNumber}">✏️</button>
              <button class="btn btn-danger py-1 px-2 btn-del" data-inv="${inv.invoiceNumber}">🗑️</button>
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
      <button id="btn-add-bill" class="btn btn-primary text-xs py-2 px-3 font-bold shadow-lg">
        + नया बिल बनाएं
      </button>
    </div>

    <div class="grid grid-cols-3 gap-2 text-center">
      <div class="stat-metric p-2"><div class="stat-label text-[10px]">कुल बिलिंग</div><div class="stat-value text-sm text-white">₹${totalBilled.toLocaleString('en-IN')}</div></div>
      <div class="stat-metric p-2"><div class="stat-label text-[10px]">कुल जमा</div><div class="stat-value text-sm text-emerald-400">₹${totalCol.toLocaleString('en-IN')}</div></div>
      <div class="stat-metric p-2 border-rose-500/30"><div class="stat-label text-[10px] text-rose-400">बाकी (DUE)</div><div class="stat-value text-sm text-rose-400">₹${totalDue.toLocaleString('en-IN')}</div></div>
    </div>

    <div class="space-y-3">
      ${listHtml}
    </div>
  `;

  const modal = document.getElementById("modal-container");
  const modalContent = document.getElementById("modal-content");
  const openModal = (h) => { modalContent.innerHTML = h; modal.classList.remove("hidden"); };
  const closeModal = () => { modal.classList.add("hidden"); modalContent.innerHTML = ""; };

  document.getElementById("btn-add-bill")?.addEventListener("click", () => openBillForm(null, openModal, closeModal, containerEl, onNavigate));

  containerEl.querySelectorAll(".btn-edit").forEach(b => {
    b.onclick = () => {
      const inv = invoices.find(i => i.invoiceNumber === b.dataset.inv);
      if (inv) openBillForm(inv, openModal, closeModal, containerEl, onNavigate);
    };
  });

  containerEl.querySelectorAll(".btn-del").forEach(b => {
    b.onclick = async () => {
      const num = b.dataset.inv;
      if (confirm(`क्या आप बिल #${num} को सच में डिलीट करना चाहते हैं?`)) {
        await deleteDoc(doc(db, "invoices", num));
        renderBillingView(containerEl, onNavigate);
      }
    };
  });

  containerEl.querySelectorAll(".btn-wa").forEach(b => {
    b.onclick = () => {
      const inv = invoices.find(i => i.invoiceNumber === b.dataset.inv);
      if (!inv) return;
      const biz = getBizProfile();
      const txt = `*${biz.businessName} - ${biz.city}*\nबिल नं: #${inv.invoiceNumber}\nपार्टी: *${inv.customerName}*\nगाड़ी नं: *${inv.vehicleNumber}*\nरूट: ${inv.pickupLocation || 'लोकल'}\nकुल राशि: ₹${Number(inv.totalAmount||0).toLocaleString('en-IN')}\nजमा: ₹${Number(inv.advancePaid||0).toLocaleString('en-IN')}\n*बकाया: ₹${Number(inv.balanceDue||0).toLocaleString('en-IN')}*\nसंपर्क: ${biz.phone}\nधन्यवाद!`;
      const num = (inv.customerPhone || '').replace(/\D/g, '');
      window.open(`https://wa.me/${num ? ('91' + num) : ''}?text=${encodeURIComponent(txt)}`, "_blank");
    };
  });

  containerEl.querySelectorAll(".btn-print-billbook").forEach(b => {
    b.onclick = () => {
      const inv = invoices.find(i => i.invoiceNumber === b.dataset.inv);
      if (!inv) return;
      generateAuthenticBillbookPdf(inv);
    };
  });
}

/**
 * EXACT BILLBOOK PRINT & PDF DOWNLOAD GENERATOR
 * Recreates the authentic AADESH TOURS red-bordered billbook format
 */
function generateAuthenticBillbookPdf(inv) {
  const biz = getBizProfile();
  const printWin = window.open("", "_blank");
  if (!printWin) {
    alert("कृपया पॉप-अप की अनुमति दें ताकि बिल PDF डाउनलोड हो सके।");
    return;
  }

  const fareAmt = Number(inv.vehicleFare) || Number(inv.totalAmount) || 0;
  const tollAmt = Number(inv.tollCharges) || 0;
  const nightAmt = Number(inv.driverBhatta) || 0;
  const grandTot = Number(inv.totalAmount) || 0;
  const advance = Number(inv.advancePaid) || 0;
  const balance = Number(inv.balanceDue) || 0;

  printWin.document.write(`
    <!DOCTYPE html>
    <html lang="hi">
    <head>
      <meta charset="UTF-8">
      <title>Bill #${inv.invoiceNumber} - ${biz.businessName}</title>
      <style>
        @page { size: A4 portrait; margin: 10mm; }
        * { box-sizing: border-box; }
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 10px;
          background: #f1f5f9;
          color: #1a1a1a;
        }
        .action-bar {
          text-align: center;
          margin-bottom: 15px;
        }
        .btn-download {
          background: linear-gradient(135deg, #b91c1c, #991b1b);
          color: #fff;
          border: none;
          padding: 10px 24px;
          font-size: 15px;
          font-weight: bold;
          border-radius: 8px;
          cursor: pointer;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.2);
        }
        /* MAIN RED BILLBOOK CONTAINER */
        .billbook {
          max-width: 760px;
          margin: 0 auto;
          background: #ffffff;
          border: 3px double #b91c1c;
          padding: 16px 20px;
          position: relative;
        }
        /* Top Badge */
        .top-badge-wrap {
          text-align: center;
          margin-top: -6px;
          margin-bottom: 2px;
        }
        .top-badge {
          display: inline-block;
          border: 1px solid #b91c1c;
          color: #b91c1c;
          padding: 1px 16px;
          font-size: 11px;
          font-weight: bold;
          border-radius: 12px;
          text-transform: uppercase;
          letter-spacing: 2px;
        }
        /* Header Title */
        .header-box {
          text-align: center;
          border-bottom: 1.5px solid #b91c1c;
          padding-bottom: 8px;
          margin-bottom: 12px;
        }
        .brand-title {
          font-size: 32px;
          font-weight: 900;
          color: #b91c1c;
          letter-spacing: 1px;
          margin: 2px 0 0 0;
          text-transform: uppercase;
        }
        .brand-sub {
          font-size: 16px;
          font-weight: bold;
          color: #b91c1c;
          letter-spacing: 4px;
          margin: 2px 0 4px 0;
        }
        .brand-address {
          font-size: 12px;
          font-weight: bold;
          color: #334155;
          margin: 1px 0;
        }
        .brand-contact {
          font-size: 12px;
          font-weight: bold;
          color: #b91c1c;
          margin: 2px 0;
        }
        .brand-tagline {
          font-size: 12px;
          font-weight: bold;
          color: #b91c1c;
          margin-top: 4px;
          padding-top: 2px;
          border-top: 1px dashed #fca5a5;
        }
        /* Meta Info Grid */
        .meta-grid {
          display: flex;
          justify-content: space-between;
          margin-bottom: 10px;
          font-size: 13px;
        }
        .meta-col-left {
          flex: 1.4;
          line-height: 1.8;
        }
        .meta-col-right {
          flex: 0.8;
          text-align: right;
          line-height: 1.8;
        }
        .dotted-line {
          border-bottom: 1px dotted #475569;
          display: inline-block;
          font-weight: bold;
          color: #0f172a;
          padding: 0 4px;
        }
        /* RED BILL TABLE */
        .bill-table {
          width: 100%;
          border-collapse: collapse;
          border: 1.5px solid #b91c1c;
          font-size: 13px;
          margin-bottom: 10px;
        }
        .bill-table th {
          border: 1.5px solid #b91c1c;
          background: #fff;
          color: #b91c1c;
          padding: 7px 6px;
          font-size: 12px;
          font-weight: bold;
          text-transform: uppercase;
        }
        .bill-table td {
          border-left: 1.5px solid #b91c1c;
          border-right: 1.5px solid #b91c1c;
          padding: 8px 6px;
          vertical-align: top;
        }
        .right { text-align: right; }
        .center { text-align: center; }
        .item-row {
          height: 140px;
        }
        /* Summary Calculation Table */
        .calc-row td {
          border: 1.5px solid #b91c1c;
          padding: 4px 8px;
          font-weight: bold;
        }
        .calc-label {
          color: #b91c1c;
          text-transform: uppercase;
          font-size: 12px;
        }
        .calc-val {
          font-size: 14px;
          font-weight: bold;
          text-align: right;
        }
        /* Footer Bank & Terms */
        .bottom-section {
          display: flex;
          gap: 12px;
          margin-top: 8px;
        }
        .bank-box {
          border: 1px solid #b91c1c;
          padding: 6px 10px;
          font-size: 11px;
          border-radius: 4px;
          background: #fffaf0;
          line-height: 1.6;
        }
        .bank-title {
          font-weight: bold;
          color: #b91c1c;
          border-bottom: 1px solid #fca5a5;
          margin-bottom: 3px;
          text-transform: uppercase;
          font-size: 10px;
        }
        .terms-list {
          font-size: 10px;
          color: #475569;
          margin-top: 6px;
          line-height: 1.4;
          padding-left: 14px;
        }
        .sign-area {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-top: 30px;
          padding-top: 10px;
        }
        .sign-cust {
          font-size: 11px;
          font-weight: bold;
          color: #475569;
          border-top: 1px dashed #64748b;
          padding-top: 4px;
          width: 140px;
          text-align: center;
        }
        .sign-owner {
          font-size: 12px;
          font-weight: bold;
          color: #b91c1c;
          text-align: center;
        }
        @media print {
          .action-bar { display: none; }
          body { background: #fff; padding: 0; }
          .billbook { border: 2.5px solid #b91c1c; box-shadow: none; max-width: 100%; }
        }
      </style>
    </head>
    <body>
      <div class="action-bar">
        <button class="btn-download" onclick="window.print()">📥 PDF डाउनलोड / प्रिंट करें</button>
      </div>

      <div class="billbook">
        <div class="top-badge-wrap">
          <span class="top-badge">INVOICE / बिल</span>
        </div>

        <!-- Authentic Red Header -->
        <div class="header-box">
          <h1 class="brand-title">AADESH TOURS</h1>
          <div class="brand-sub">— UDAIPUR —</div>
          <div class="brand-address">${biz.address}</div>
          <div class="brand-contact">Mob. ${biz.phone}, ${biz.altPhone} | ${biz.email}</div>
          <div class="brand-tagline">${biz.tagline}</div>
        </div>

        <!-- Meta Details: M/s & Vehicle & Date -->
        <div class="meta-grid">
          <div class="meta-col-left">
            <div>M/s. <span class="dotted-line" style="min-width: 250px;">${inv.customerName}</span></div>
            <div>Vehicle No. <span class="dotted-line" style="min-width: 215px; text-transform: uppercase;">${inv.vehicleNumber || 'टैक्सी'}</span></div>
          </div>
          <div class="meta-col-right">
            <div>Bill No. <span class="dotted-line" style="min-width: 90px; color:#b91c1c;">${inv.invoiceNumber}</span></div>
            <div>Date : <span class="dotted-line" style="min-width: 100px;">${inv.invoiceDate || ''}</span></div>
          </div>
        </div>

        <!-- Main Particulars Table -->
        <table class="bill-table">
          <thead>
            <tr>
              <th style="width: 52%;">PARTICULAR</th>
              <th style="width: 16%;" class="center">RATE</th>
              <th style="width: 14%;" class="center">TOTAL K.M.</th>
              <th style="width: 18%;" class="right">AMOUNT</th>
            </tr>
          </thead>
          <tbody>
            <tr class="item-row">
              <td>
                <strong style="font-size: 14px;">${inv.pickupLocation || 'लोकल उदयपुर व यात्रा'}</strong>
                <div style="font-size: 11px; color: #64748b; margin-top: 4px;">
                  वाहन: ${inv.vehicleNumber || 'टैक्सी'} (${inv.totalDays || 1} दिन)
                </div>
                ${inv.customerPhone ? `<div style="font-size: 11px; color: #64748b;">मो: ${inv.customerPhone}</div>` : ''}
              </td>
              <td class="center font-mono">₹${inv.ratePerKm || '-'}</td>
              <td class="center font-mono">${inv.totalKm || '-'}</td>
              <td class="right font-mono" style="font-size: 14px; font-weight: bold;">${fareAmt.toLocaleString('en-IN')}</td>
            </tr>

            <!-- Calculations Matching Physical Billbook -->
            <tr class="calc-row">
              <td colspan="2" rowspan="5" style="border: 1.5px solid #b91c1c; vertical-align: top; padding: 6px;">
                <!-- Bank Details Box Inside Table -->
                <div class="bank-box">
                  <div class="bank-title">Bank Details</div>
                  <div><strong>Name :</strong> ${biz.accountHolder}</div>
                  <div><strong>Bank :</strong> ${biz.bankName}</div>
                  <div><strong>A/C No. :</strong> ${biz.accountNo}</div>
                  <div><strong>IFSC :</strong> ${biz.ifsc}</div>
                  <div><strong>UPI ID :</strong> ${biz.upiId}</div>
                </div>

                <div style="font-size: 11px; margin-top: 8px;">
                  <strong>Rupees (in words) :</strong> 
                  <span class="dotted-line" style="min-width: 200px;">₹${grandTot.toLocaleString('en-IN')} Only</span>
                </div>
              </td>
              <td class="calc-label">TOLL/PARK.</td>
              <td class="calc-val">${tollAmt ? ('₹' + tollAmt.toLocaleString('en-IN')) : '-'}</td>
            </tr>

            <tr class="calc-row">
              <td class="calc-label">NIGHT / BHATTA</td>
              <td class="calc-val">${nightAmt ? ('₹' + nightAmt.toLocaleString('en-IN')) : '-'}</td>
            </tr>

            <tr class="calc-row">
              <td class="calc-label">TOTAL</td>
              <td class="calc-val">₹${grandTot.toLocaleString('en-IN')}</td>
            </tr>

            <tr class="calc-row">
              <td class="calc-label" style="color: #15803d;">ADVANCE PAID</td>
              <td class="calc-val" style="color: #15803d;">₹${advance.toLocaleString('en-IN')}</td>
            </tr>

            <tr class="calc-row" style="background: #fef2f2;">
              <td class="calc-label" style="font-size: 13px; color: #b91c1c;">G. TOTAL / DUE</td>
              <td class="calc-val" style="font-size: 16px; color: #b91c1c;">₹${(balance > 0 ? balance : grandTot).toLocaleString('en-IN')}</td>
            </tr>
          </tbody>
        </table>

        <!-- Terms and Conditions Exactly as physical book -->
        <div style="font-size: 10px; color: #334155; line-height: 1.5; margin-top: 4px;">
          <div>• Toll Tax, Border Tax, Parking, No Entry Charges pay by party.</div>
          <div>• Night Charges / Driver Allowance Rs.300/- Extra.</div>
          <div>• Per day Running 300 k.m.</div>
          <div>• All Subject To Udaipur Jurisdiction Only.</div>
          <div>• E.&O.E.</div>
        </div>

        <!-- Signatures -->
        <div class="sign-area">
          <div class="sign-cust">Customer's Sig.</div>
          <div class="sign-owner">
            <div 
