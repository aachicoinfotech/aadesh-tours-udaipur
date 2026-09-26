// js/views/billing-view.js
// Aadesh Tours Udaipur - Billing & Customer Ledger Controller (Phase 29)

import { getAllInvoices, recordInvoicePayment } from "../services/invoice-service.js";
import { getAllCustomers, updateCustomerBalance } from "../services/customer-service.js";
import { addGallaTransaction } from "../services/galla-service.js";
import { CASHFLOW_CATEGORIES } from "../config/constants.js";
import { exportInvoiceToPdf } from "../exporters/pdf-exporter.js";
import { printThermalReceipt } from "../exporters/data-exporter.js";

/**
 * 1. Render Complete Invoicing & Party Ledger View
 * @param {HTMLElement} containerEl - Target element (#tab-billing)
 * @param {Function} onNavigate - Tab navigation callback
 */
export async function renderBillingView(containerEl, onNavigate) {
  const [invoices, customers] = await Promise.all([
    getAllInvoices(),
    getAllCustomers()
  ]);

  let activeFilter = "ALL"; // 'ALL', 'UNPAID', 'PAID', 'PARTIES'
  let searchQuery = "";

  const renderContent = () => {
    // Financial rollups
    const totalBilled = invoices.reduce((sum, inv) => sum + (Number(inv.totalAmount) || 0), 0);
    const totalDue = invoices.reduce((sum, inv) => sum + (Number(inv.balanceDue) || 0), 0);
    const totalCollected = totalBilled - totalDue;

    // Filter logic
    let filteredInvoices = invoices.filter(inv => {
      const matchesSearch = 
        (inv.invoiceNumber || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (inv.customerName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (inv.dutySlipNumber || "").toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;
      if (activeFilter === "UNPAID") return Number(inv.balanceDue) > 0;
      if (activeFilter === "PAID") return Number(inv.balanceDue) <= 0;
      return true;
    });

    containerEl.innerHTML = `
      <!-- Top Metrics Ribbon -->
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 class="text-xl font-black text-white tracking-wide">बिलिंग व पार्टी लेजर</h2>
          <p class="text-xs text-slate-400">कुल इनवॉइस: <span class="font-mono text-amber-400 font-bold">${invoices.length}</span></p>
        </div>
      </div>

      <!-- Financial Metric Cards -->
      <div class="grid grid-cols-3 gap-3">
        <div class="stat-metric">
          <div class="stat-label">कुल बिलिंग</div>
          <div class="stat-value text-slate-100">₹${totalBilled.toLocaleString('en-IN')}</div>
        </div>
        <div class="stat-metric">
          <div class="stat-label">कुल वसूली</div>
          <div class="stat-value text-emerald-400">₹${totalCollected.toLocaleString('en-IN')}</div>
        </div>
        <div class="stat-metric border-rose-500/30 bg-rose-500/5">
          <div class="stat-label text-rose-400">मार्केट में बकाया</div>
          <div class="stat-value text-rose-400">₹${totalDue.toLocaleString('en-IN')}</div>
        </div>
      </div>

      <!-- Search & Segment Toggles -->
      <div class="vault-card space-y-3 p-3">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <div class="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <button class="bill-filter-btn px-3 py-1.5 rounded-lg text-xs font-semibold ${activeFilter === 'ALL' ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-300'}" data-filter="ALL">
              सभी बिल (${invoices.length})
            </button>
            <button class="bill-filter-btn px-3 py-1.5 rounded-lg text-xs font-semibold ${activeFilter === 'UNPAID' ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-300'}" data-filter="UNPAID">
              बकाया / Due (${invoices.filter(i => Number(i.balanceDue) > 0).length})
            </button>
            <button class="bill-filter-btn px-3 py-1.5 rounded-lg text-xs font-semibold ${activeFilter === 'PAID' ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-300'}" data-filter="PAID">
              पूर्ण चुकता (${invoices.filter(i => Number(i.balanceDue) <= 0).length})
            </button>
            <button class="bill-filter-btn px-3 py-1.5 rounded-lg text-xs font-semibold ${activeFilter === 'PARTIES' ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-300'}" data-filter="PARTIES">
              होटल लेजर (${customers.length})
            </button>
          </div>

          <div class="w-full sm:w-64">
            <input type="text" id="bill-search-input" class="form-input text-xs py-1.5" placeholder="बिल नंबर या पार्टी खोजें..." value="${searchQuery}">
          </div>
        </div>
      </div>

      <!-- Main Display Area: Invoices List or Parties Ledger -->
      ${activeFilter === "PARTIES" ? renderPartiesLedger(customers) : renderInvoicesList(filteredInvoices)}
    `;

    bindBillingEvents();
  };

  /**
   * Sub-render: Invoices List
   */
  const renderInvoicesList = (list) => {
    if (list.length === 0) {
      return `
        <div class="vault-card text-center p-8 text-slate-500 text-xs">
          कोई इनवॉइस रिकॉर्ड नहीं मिला।
        </div>
      `;
    }

    return `
      <div class="space-y-3">
        ${list.map(inv => {
          const isUnpaid = Number(inv.balanceDue) > 0;
          const billing = inv.billingBreakdown || {};

          return `
            <div class="vault-card space-y-3 border-l-4 ${isUnpaid ? 'border-l-rose-500' : 'border-l-emerald-500'}">
              <div class="flex flex-wrap items-center justify-between gap-2">
                <div class="flex items-center gap-2">
                  <span class="font-mono font-bold text-white text-sm">${inv.invoiceNumber}</span>
                  <span class="badge-status ${inv.isGstInvoice ? 'badge-info' : 'badge-warning'}">
                    ${inv.isGstInvoice ? 'GST INVOICE' : 'BILL OF SUPPLY'}
                  </span>
                  <span class="badge-status ${isUnpaid ? 'badge-danger' : 'badge-active'}">
                    ${inv.paymentStatus || (isUnpaid ? 'DUE' : 'PAID')}
                  </span>
                </div>
                <div class="text-xs text-slate-400 font-mono">
                  ${inv.invoiceDate} (स्लिप #${inv.dutySlipNumber})
                </div>
              </div>

              <!-- Customer & Trip Spec -->
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs bg-slate-950/40 p-2.5 rounded-lg">
                <div>
                  <span class="text-slate-400 block text-[11px]">पार्टी / ग्राहक:</span>
                  <span class="font-bold text-slate-100 text-sm">${inv.customerName}</span>
                  <span class="text-slate-400 block font-mono">${inv.customerPhone || 'फोन नहीं'}</span>
                </div>
                <div>
                  <span class="text-slate-400 block text-[11px]">गाड़ी व रूट:</span>
                  <span class="font-mono font-bold text-slate-200">${inv.vehicleNumber || 'टैक्सी'}</span>
                  <span class="text-slate-400 block">${inv.pickupLocation} ➔${inv.dropLocation || 'लोकल'}</span>
                </div>
                <div>
                  <span class="text-slate-400 block text-[11px]">किलोमीटर व दिन:</span>
                  <span class="font-mono text-slate-200">${billing.billedKm \vert{}\vert{} 0} KM (${billing.days || 1} दिन)</span>
                  <span class="text-slate-400 block">दर: ₹${billing.ratePerKm || 0}/KM</span>
                </div>
              </div>

              <!-- Financial Summary Bar -->
              <div class="flex flex-wrap items-center justify-between gap-3 text-xs px-1">
                <div>
                  <span class="text-slate-400">कुल बिल:</span>
                  <span class="font-mono font-bold text-slate-100 text-sm">₹${inv.totalAmount}</span>
                </div>
                <div>
                  <span class="text-slate-400">जमा एडवांस:</span>
                  <span class="font-mono text-emerald-400">₹${inv.advancePaid}</span>
                </div>
                <div>
                  <span class="text-slate-400">बकाया राशि:</span>
                  <span class="font-mono font-black ${isUnpaid ? 'text-rose-400' : 'text-slate-400'} text-sm">
                    ₹${inv.balanceDue}
                  </span>
                </div>
              </div>

              <!-- Action Buttons Row -->
              <div class="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button class="btn btn-secondary text-xs py-1.5 px-2.5 btn-thermal-print" data-inv="${inv.invoiceNumber}">
                  थर्मल पर्ची
                </button>
                <button class="btn btn-secondary text-xs py-1.5 px-2.5 btn-pdf-print" data-inv="${inv.invoiceNumber}">
                  PDF इनवॉइस
                </button>
                ${isUnpaid ? `
                  <button class="btn btn-success text-xs py-1.5 px-3 btn-record-payment" data-inv="${inv.invoiceNumber}">
                    भुगतान दर्ज करें (+ Pay)
                  </button>
                ` : ''}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  };

  /**
   * Sub-render: Customer & Hotel Party Ledger
   */
  const renderPartiesLedger = (partyList) => {
    if (partyList.length === 0) {
      return `
        <div class="vault-card text-center p-8 text-slate-500 text-xs">
          कोई पार्टी या ग्राहक पंजीकृत नहीं है।
        </div>
      `;
    }

    return `
      <div class="space-y-3">
        ${partyList.map(c => {
          const bal = Number(c.outstandingBalance) || 0;
          return `
            <div class="vault-card flex items-center justify-between p-3">
              <div>
                <div class="flex items-center gap-2">
                  <span class="font-bold text-white text-sm">${c.name}</span>${c.businessName ? `<span class="text-xs text-amber-400">(${c.businessName})</span>` : ''}
                  <span class="badge-status badge-info text-[10px]">${c.category || 'PARTY'}</span>
                </div>
                <div class="text-xs text-slate-400 mt-0.5">
                  फोन: <span class="font-mono text-slate-300">${c.phone || '-'}</span> | 
                  कुल ट्रिप्स: <span class="font-mono text-slate-200">${c.totalTripsCompleted || 0}</span>
                </div>
              </div>

              <div class="text-right">
                <span class="text-[11px] text-slate-400 block">वर्तमान बैलेंस:</span>
                <span class="font-mono font-black text-sm ${bal > 0 ? 'text-rose-400' : 'text-emerald-400'}">
                  ${bal > 0 ? `बकाया: ₹${bal.toLocaleString('en-IN')}` : `जमा: ₹${Math.abs(bal).toLocaleString('en-IN')}`}
                </span>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  };

  /**
   * Event Bindings
   */
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

    // Filter Buttons
    containerEl.querySelectorAll(".bill-filter-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        activeFilter = btn.dataset.filter;
        renderContent();
      });
    });

    // Search Input
    const searchInput = containerEl.querySelector("#bill-search-input");
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        searchQuery = e.target.value;
        const targetList = containerEl.querySelector(".space-y-3:last-child");
        if (targetList && activeFilter !== "PARTIES") {
          const filtered = invoices.filter(inv => {
            const matches = 
              (inv.invoiceNumber || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
              (inv.customerName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
              (inv.dutySlipNumber || "").toLowerCase().includes(searchQuery.toLowerCase());
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
      // PDF Print Action
      containerEl.querySelectorAll(".btn-pdf-print").forEach(btn => {
        btn.addEventListener("click", () => {
          const invNum = btn.dataset.inv;
          const invoice = invoices.find(i => i.invoiceNumber === invNum);
          if (invoice) exportInvoiceToPdf(invoice);
        });
      });

      // Thermal Receipt Action
      containerEl.querySelectorAll(".btn-thermal-print").forEach(btn => {
        btn.addEventListener("click", () => {
          const invNum = btn.dataset.inv;
          const invoice = invoices.find(i => i.invoiceNumber === invNum);
          if (invoice) printThermalReceipt(invoice, 58);
        });
      });

      // Record Payment Modal
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

          document.getElementById("btn-cancel-pay").addEventListener("click", closeModal);
          document.getElementById("form-record-pay").addEventListener("submit", async (e) => {
            e.preventDefault();
            const payAmt = Number(document.getElementById("pay-amount").value);
            const payMode = document.getElementById("pay-mode").value;
            const remarks = document.getElementById("pay-remarks").value;

            if (payAmt <= 0) return;

            // 1. Record against invoice
            const res = await recordInvoicePayment(invNum, payAmt, payMode);
            
            // 2. If Cash, automatically credit to daily Galla
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
              alert(res.message);
            }
          });
        });
      });
    };

    bindCardActions();
  };

  renderContent();
}
