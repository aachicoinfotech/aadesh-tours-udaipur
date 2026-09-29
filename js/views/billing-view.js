// js/views/billing-view.js
// Aadesh Tours Udaipur - Complete Billing, Direct Invoice & Ledger Controller (Phase 29 Master)

import * as invoiceService from "../services/invoice-service.js";
import * as customerService from "../services/customer-service.js";
import * as fleetService from "../services/fleet-service.js";
import { addGallaTransaction } from "../services/galla-service.js";
import { CASHFLOW_CATEGORIES } from "../config/constants.js";
import { exportInvoiceToPdf } from "../exporters/pdf-exporter.js";
import { printThermalReceipt } from "../exporters/data-exporter.js";
import { db } from "../config/firebase-config.js";
import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  query, 
  orderBy 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

/**
 * 1. Render Complete Invoicing & Party Ledger View
 * @param {HTMLElement} containerEl - Target element (#tab-billing)
 * @param {Function} onNavigate - Tab navigation callback
 */
export async function renderBillingView(containerEl, onNavigate) {
  // Safe fetch of invoices, customers, and fleet
  let invoices = [];
  try {
    if (typeof invoiceService.getAllInvoices === "function") {
      invoices = await invoiceService.getAllInvoices();
    } else {
      const q = query(collection(db, "invoices"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      invoices = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    }
  } catch (err) {
    console.warn("Error fetching invoices:", err);
    invoices = [];
  }

  let customers = [];
  try {
    if (typeof customerService.getAllCustomers === "function") {
      customers = await customerService.getAllCustomers();
    }
  } catch (err) {
    customers = [];
  }

  let vehicles = [];
  try {
    if (typeof fleetService.getAllVehicles === "function") {
      vehicles = await fleetService.getAllVehicles();
    }
  } catch (err) {
    vehicles = [];
  }

  let activeFilter = "ALL";
  let searchQuery = "";

  const renderContent = () => {
    const totalBilled = invoices.reduce((sum, inv) => sum + (Number(inv.totalAmount) || 0), 0);
    const totalDue = invoices.reduce((sum, inv) => sum + (Number(inv.balanceDue) || 0), 0);
    const totalCollected = totalBilled - totalDue;

    const filteredInvoices = invoices.filter(inv => {
      const q = searchQuery.toLowerCase();
      const num = (inv.invoiceNumber || "").toLowerCase();
      const name = (inv.customerName || "").toLowerCase();
      const slip = (inv.dutySlipNumber || "").toLowerCase();
      const matchesSearch = num.includes(q) || name.includes(q) || slip.includes(q);

      if (!matchesSearch) return false;
      if (activeFilter === "UNPAID") return Number(inv.balanceDue) > 0;
      if (activeFilter === "PAID") return Number(inv.balanceDue) <= 0;
      return true;
    });

    const unpaidCount = invoices.filter(i => Number(i.balanceDue) > 0).length;
    const paidCount = invoices.filter(i => Number(i.balanceDue) <= 0).length;

    const allBtnClass = activeFilter === "ALL" ? "bg-amber-500 text-slate-950 font-bold" : "bg-slate-800 text-slate-300";
    const unpaidBtnClass = activeFilter === "UNPAID" ? "bg-amber-500 text-slate-950 font-bold" : "bg-slate-800 text-slate-300";
    const paidBtnClass = activeFilter === "PAID" ? "bg-amber-500 text-slate-950 font-bold" : "bg-slate-800 text-slate-300";
    const partiesBtnClass = activeFilter === "PARTIES" ? "bg-amber-500 text-slate-950 font-bold" : "bg-slate-800 text-slate-300";

    const mainBodyHtml = activeFilter === "PARTIES" ? renderPartiesLedger(customers) : renderInvoicesList(filteredInvoices);

    containerEl.innerHTML = `
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 class="text-xl font-black text-white tracking-wide">बिलिंग व पार्टी लेजर</h2>
          <p class="text-xs text-slate-400">कुल इनवॉइस: <span class="font-mono text-amber-400 font-bold">${invoices.length}</span></p>
        </div>
        <button id="btn-create-direct-bill" class="btn btn-primary text-xs sm:text-sm py-2 px-3">
          + नया डायरेक्ट बिल (New Invoice)
        </button>
      </div>

      <div class="grid grid-cols-3 gap-3">
        <div class="stat-metric">
          <div class="stat-label">कुल बिलिंग</div>
          <div class="stat-value text-slate-100">₹${totalBilled.toLocaleString("en-IN")}</div>
        </div>
        <div class="stat-metric">
          <div class="stat-label">कुल वसूली</div>
          <div class="stat-value text-emerald-400">₹${totalCollected.toLocaleString("en-IN")}</div>
        </div>
        <div class="stat-metric border-rose-500/30 bg-rose-500/5">
          <div class="stat-label text-rose-400">मार्केट में बकाया</div>
          <div class="stat-value text-rose-400">₹${totalDue.toLocaleString("en-IN")}</div>
        </div>
      </div>

      <div class="vault-card space-y-3 p-3">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <div class="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <button class="bill-filter-btn px-3 py-1.5 rounded-lg text-xs font-semibold ${allBtnClass}" data-filter="ALL">
              सभी बिल (${invoices.length})
            </button>
            <button class="bill-filter-btn px-3 py-1.5 rounded-lg text-xs font-semibold ${unpaidBtnClass}" data-filter="UNPAID">
              बकाया / Due (${unpaidCount})
            </button>
            <button class="bill-filter-btn px-3 py-1.5 rounded-lg text-xs font-semibold ${paidBtnClass}" data-filter="PAID">
              पूर्ण चुकता (${paidCount})
            </button>
            <button class="bill-filter-btn px-3 py-1.5 rounded-lg text-xs font-semibold ${partiesBtnClass}" data-filter="PARTIES">
              होटल लेजर (${customers.length})
            </button>
          </div>

          <div class="w-full sm:w-64">
            <input type="text" id="bill-search-input" class="form-input text-xs py-1.5" placeholder="बिल नंबर या पार्टी खोजें..." value="${searchQuery}">
          </div>
        </div>
      </div>

      ${mainBodyHtml}
    `;

    bindBillingEvents();
  };

  const renderInvoicesList = (list) => {
    if (list.length === 0) {
      return '<div class="vault-card text-center p-8 text-slate-500 text-xs">कोई इनवॉइस रिकॉर्ड नहीं मिला। ऊपर दिए गए बटन से नया बिल बनाएं।</div>';
    }

    const cardsHtml = list.map(inv => {
      const isUnpaid = Number(inv.balanceDue) > 0;
      const billing = inv.billingBreakdown || {};
      const statusBadge = inv.paymentStatus || (isUnpaid ? "DUE" : "PAID");
      const borderClass = isUnpaid ? "border-l-rose-500" : "border-l-emerald-500";
      const badgeColor = isUnpaid ? "badge-danger" : "badge-active";
      const typeBadge = inv.isGstInvoice ? "GST INVOICE" : "BILL OF SUPPLY";
      const typeBadgeColor = inv.isGstInvoice ? "badge-info" : "badge-warning";
      const custPhone = inv.customerPhone || "फोन नहीं";
      const vehNum = inv.vehicleNumber || inv.vehicleId || "टैक्सी";
      const routeText = (inv.pickupLocation || "उदयपुर") + " ➔ " + (inv.dropLocation || "लोकल");
      const billedKm = billing.billedKm || inv.totalKm || 0;
      const days = billing.days || inv.totalDays || 1;
      const ratePerKm = billing.ratePerKm || inv.ratePerKm || 0;
      const balColor = isUnpaid ? "text-rose-400" : "text-slate-400";
      const slipInfo = inv.dutySlipNumber ? ("स्लिप #" + inv.dutySlipNumber) : "डायरेक्ट बिल";

      let payBtnHtml = "";
      if (isUnpaid) {
        payBtnHtml = '<button class="btn btn-success text-xs py-1.5 px-3 btn-record-payment" data-inv="' + inv.invoiceNumber + '">भुगतान दर्ज करें (+ Pay)</button>';
      }

      return `
        <div class="vault-card space-y-3 border-l-4 ${borderClass}">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div class="flex items-center gap-2">
              <span class="font-mono font-bold text-white text-sm">${inv.invoiceNumber}</span>
              <span class="badge-status ${typeBadgeColor}">${typeBadge}</span>
              <span class="badge-status ${badgeColor}">${statusBadge}</span>
            </div>
            <div class="text-xs text-slate-400 font-mono">
              ${inv.invoiceDate || inv.date || "-"} (${slipInfo})
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs bg-slate-950/40 p-2.5 rounded-lg">
            <div>
              <span class="text-slate-400 block text-[11px]">पार्टी / ग्राहक:</span>
              <span class="font-bold text-slate-100 text-sm">${inv.customerName}</span>
              <span class="text-slate-400 block font-mono">${custPhone}</span>
            </div>
            <div>
              <span class="text-slate-400 block text-[11px]">गाड़ी व रूट:</span>
              <span class="font-mono font-bold text-slate-200">${vehNum}</span>
              <span class="text-slate-400 block">${routeText}</span>
            </div>
            <div>
              <span class="text-slate-400 block text-[11px]">किलोमीटर व दिन:</span>
              <span class="font-mono text-slate-200">${billedKm} KM (${days} दिन)</span>
              <span class="text-slate-400 block">दर: ₹${ratePerKm}/KM</span>
            </div>
          </div>

          <div class="flex flex-wrap items-center justify-between gap-3 text-xs px-1">
            <div>
              <span class="text-slate-400">कुल बिल:</span>
              <span class="font-mono font-bold text-slate-100 text-sm">₹${(Number(inv.totalAmount) || 0).toLocaleString("en-IN")}</span>
            </div>
            <div>
              <span class="text-slate-400">जमा एडवांस:</span>
              <span class="font-mono text-emerald-400">₹${(Number(inv.advancePaid) || 0).toLocaleString("en-IN")}</span>
            </div>
            <div>
              <span class="text-slate-400">बकाया राशि:</span>
              <span class="font-mono font-black ${balColor} text-sm">₹${(Number(inv.balanceDue) || 0).toLocaleString("en-IN")}</span>
            </div>
          </div>

          <div class="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-800">
            <button class="btn btn-secondary text-xs py-1.5 px-2.5 btn-thermal-print" data-inv="${inv.invoiceNumber}">
              थर्मल पर्ची
            </button>
            <button class="btn btn-secondary text-xs py-1.5 px-2.5 btn-pdf-print" data-inv="${inv.invoiceNumber}">
              PDF इनवॉइस
            </button>
            ${payBtnHtml}
          </div>
        </div>
      `;
    }).join("");

    return '<div class="space-y-3">' + cardsHtml + '</div>';
  };

  const renderPartiesLedger = (partyList) => {
    if (partyList.length === 0) {
      return '<div class="vault-card text-center p-8 text-slate-500 text-xs">कोई पार्टी या ग्राहक पंजीकृत नहीं है।</div>';
    }

    const rowsHtml = partyList.map(c => {
      const bal = Number(c.outstandingBalance) || 0;
      const balText = bal > 0 ? "बकाया: ₹" + bal.toLocaleString("en-IN") : "जमा: ₹" + Math.abs(bal).toLocaleString("en-IN");
      const balColor = bal > 0 ? "text-rose-400" : "text-emerald-400";
      const businessTag = c.businessName ? '<span class="text-xs text-amber-400">(' + c.businessName + ')</span>' : "";
      const phoneText = c.phone || "-";
      const tripsCount = c.totalTripsCompleted || 0;
      const categoryTag = c.category || "PARTY";

      return `
        <div class="vault-card flex items-center justify-between p-3">
          <div>
            <div class="flex items-center gap-2">
              <span class="font-bold text-white text-sm">${c.name}</span>
              ${businessTag}
              <span class="badge-status badge-info text-[10px]">${categoryTag}</span>
            </div>
            <div class="text-xs text-slate-400 mt-0.5">
              फोन: <span class="font-mono text-slate-300">${phoneText}</span> | 
              कुल ट्रिप्स: <span class="font-mono text-slate-200">${tripsCount}</span>
            </div>
          </div>

          <div class="text-right">
            <span class="text-[11px] text-slate-400 block">वर्तमान बैलेंस:</span>
            <span class="font-mono font-black text-sm ${balColor}">
              ${balText}
            </span>
          </div>
        </div>
      `;
    }).join("");

    return '<div class="space-y-3">' + rowsHtml + '</div>';
  };

  const bindBillingEvents = () => {
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

    containerEl.querySelectorAll(".bill-filter-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        activeFilter = btn.dataset.filter;
        renderContent();
      });
    });

    // 1. OPEN DIRECT BILL MODAL
    const btnDirectBill = containerEl.querySelector("#btn-create-direct-bill");
    if (btnDirectBill) {
      btnDirectBill.addEventListener("click", () => {
        openDirectBillModal(openModal, closeModal, customers, vehicles, containerEl, onNavigate);
      });
    }

    const searchInput = containerEl.querySelector("#bill-search-input");
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        searchQuery = e.target.value;
        const targetList = containerEl.querySelector(".space-y-3:last-child");
        if (targetList && activeFilter !== "PARTIES") {
          const filtered = invoices.filter(inv => {
            const q = searchQuery.toLowerCase();
            const num = (inv.invoiceNumber || "").toLowerCase();
            const name = (inv.customerName || "").toLowerCase();
            const slip = (inv.dutySlipNumber || "").toLowerCase();
            const matches = num.includes(q) || name.includes(q) || slip.includes(q);
            if (!matches) return false;
            if (activeFilter === "UNPAID") return Number(inv.balanceDue) > 0;
            if (activeFilter === "PAID") return Number(inv.balanceDue) <= 0;
            return true;
          });
          targetList.outerHTML = renderInvoicesList(filtered);
          bindCardActions();
        }
      });
    }

    const bindCardActions = () => {
      containerEl.querySelectorAll(".btn-pdf-print").forEach(btn => {
        btn.addEventListener("click", () => {
          const invNum = btn.dataset.inv;
          const invoice = invoices.find(i => i.invoiceNumber === invNum);
          if (invoice && typeof exportInvoiceToPdf === "function") {
            exportInvoiceToPdf(invoice);
          }
        });
      });

      containerEl.querySelectorAll(".btn-thermal-print").forEach(btn => {
        btn.addEventListener("click", () => {
          const invNum = btn.dataset.inv;
          const invoice = invoices.find(i => i.invoiceNumber === invNum);
          if (invoice && typeof printThermalReceipt === "function") {
            printThermalReceipt(invoice, 58);
          }
        });
      });

      containerEl.querySelectorAll(".btn-record-payment").forEach(btn => {
        btn.addEventListener("click", () => {
          const invNum = btn.dataset.inv;
          const invoice = invoices.find(i => i.invoiceNumber === invNum);
          if (!invoice) return;

          openModal(`
            <h3 class="text-base font-bold text-white mb-2">भुगतान प्राप्त करें (Receive Payment)</h3>
            <p class="text-xs text-slate-400 mb-3">
              बिल: <span class="font-mono text-amber-400 font-bold">${invNum}</span> | 
              पार्टी: <span class="text-white">${invoice.customerName}</span>
            </p>

            <div class="p-3 bg-slate-800 rounded-lg mb-3 flex justify-between items-center text-xs">
              <span class="text-slate-300">वर्तमान बकाया राशि:</span>
              <span class="font-mono font-bold text-rose-400 text-sm">₹${invoice.balanceDue}</span>
            </div>

            <form id="form-record-pay" class="space-y-3 text-xs">
              <div>
                <label class="form-label">प्राप्त राशि (Received Amount ₹) *</label>
                <input type="number" id="pay-amount" class="form-input text-lg font-mono font-bold text-emerald-400" 
                       value="${invoice.balanceDue}" max="${invoice.balanceDue}" required autofocus>
              </div>

              <div>
                <label class="form-label">भुगतान माध्यम (Payment Mode)</label>
                <select id="pay-mode" class="form-select">
                  <option value="CASH">रोकड़ / Cash (गल्ले में जमा)</option>
                  <option value="UPI">ऑनलाइन UPI (GPay / PhonePe)</option>
                  <option value="BANK">बैंक ट्रांसफर / NEFT</option>
                  <option value="CHEQUE">चेक (Cheque)</option>
                </select>
              </div>

              <div>
                <label class="form-label">रिमार्क / रेफरेंस (Tx ID)</label>
                <input type="text" id="pay-remarks" class="form-input" placeholder="उदा. UTR नंबर या नकद प्राप्त">
              </div>

              <div class="pt-2 flex gap-2">
                <button type="submit" class="btn btn-success flex-1 py-2.5">जमा दर्ज करें</button>
                <button type="button" id="btn-cancel-pay" class="btn btn-secondary py-2.5">रद्द करें</button>
              </div>
            </form>
          `);

          document.getElementById("btn-cancel-pay")?.addEventListener("click", closeModal);
          document.getElementById("form-record-pay").addEventListener("submit", async (e) => {
            e.preventDefault();
            const payAmt = Number(document.getElementById("pay-amount").value);
            const payMode = document.getElementById("pay-mode").value;
            const remarks = document.getElementById("pay-remarks").value;

            if (payAmt <= 0) return;

            let res = { success: false };
            if (typeof invoiceService.recordInvoicePayment === "function") {
              res = await invoiceService.recordInvoicePayment(invNum, payAmt, payMode);
            } else {
              const invRef = doc(db, "invoices", invNum);
              const newBal = Math.max(0, Number(invoice.balanceDue) - payAmt);
              await setDoc(invRef, {
                balanceDue: newBal,
                paymentStatus: newBal <= 0 ? "PAID" : "PARTIAL",
                paidAmount: (Number(invoice.paidAmount) || 0) + payAmt,
                updatedAt: new Date().toISOString()
              }, { merge: true });
              res = { success: true };
            }
            
            if (payMode === "CASH") {
              await addGallaTransaction({
                type: "IN",
                amount: payAmt,
                category: CASHFLOW_CATEGORIES.TRIP_SETTLEMENT,
                referenceId: invNum,
                remarks: `Bill Payment - ${invoice.customerName} (${invNum})`
              });
            }

            if (res.success) {
              closeModal();
              renderBillingView(containerEl, onNavigate);
            } else {
              alert(res.message || "भुगतान दर्ज नहीं हो सका");
            }
          });
        });
      });
    };

    bindCardActions();
  };

  renderContent();
}

/**
 * 2. New Direct Invoice / Bill Modal with Complete Taxi Calculation Engine
 */
function openDirectBillModal(openModal, closeModal, customers, vehicles, containerEl, onNavigate) {
  const today = new Date().toISOString().slice(0, 10);
  const autoInvNum = "ATU-" + Date.now().toString().slice(-6);

  const customerOptions = customers.map(c => {
    const bName = c.businessName ? ` (${c.businessName})` : "";
    return `<option value="${c.name}">${bName}</option>`;
  }).join("");

  const vehicleOptions = vehicles.map(v => {
    return `<option value="${v.regNumber}">${v.regNumber} (${
