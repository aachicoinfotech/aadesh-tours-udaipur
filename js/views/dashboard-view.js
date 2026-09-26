// js/views/dashboard-view.js
// Aadesh Tours Udaipur - Dashboard & Galla Live Controller (Phase 27)

import { 
  getDailyGalla, 
  addGallaTransaction, 
  openDailyGalla, 
  closeDailyGalla,
  getTodayDateString 
} from "../services/galla-service.js";
import { getActiveTrips } from "../services/trip-service.js";
import { getAllExpenses } from "../services/expense-service.js";
import { getDashboardComplianceSummary } from "../services/reminder-service.js";

/**
 * 1. Render Complete Dashboard Screen
 * @param {HTMLElement} containerEl - Target element (#tab-dashboard)
 * @param {Function} onNavigate - Optional tab switch callback
 */
export async function renderDashboard(containerEl, onNavigate) {
  const todayStr = getTodayDateString();
  
  // Fetch initial data in parallel
  const [gallaResult, activeTrips, allExpenses, compliance] = await Promise.all([
    getDailyGalla(todayStr),
    getActiveTrips(),
    getAllExpenses(),
    getDashboardComplianceSummary()
  ]);

  const galla = gallaResult.success ? gallaResult.data : {
    openingBalance: 0,
    totalCashIn: 0,
    totalCashOut: 0,
    expectedCashBalance: 0,
    status: "NOT_OPENED",
    transactions: []
  };

  // Calculate today's total expenses
  const todayExpensesTotal = allExpenses
    .filter(e => e.date === todayStr)
    .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  // Update Top Global Header live indicators
  const headerGallaAmount = document.getElementById("header-galla-amount");
  if (headerGallaAmount) {
    headerGallaAmount.textContent = `₹${galla.expectedCashBalance.toLocaleString('en-IN')}`;
  }
  const complianceBadge = document.getElementById("compliance-badge");
  if (complianceBadge) {
    if (compliance.totalAlerts > 0) {
      complianceBadge.textContent = compliance.totalAlerts;
      complianceBadge.classList.remove("hidden");
      complianceBadge.classList.add("flex");
    } else {
      complianceBadge.classList.add("hidden");
    }
  }

  containerEl.innerHTML = `
    <!-- Top Greeting & Date Ribbon -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-xl font-black text-white tracking-wide">दैनिक गल्ला व स्थिति</h2>
        <p class="text-xs text-slate-400">तारीख: <span class="text-amber-400 font-mono">${todayStr}</span></p>
      </div>
      <span class="badge-status ${galla.status === 'CLOSED' ? 'badge-danger' : 'badge-active'}">
        ${galla.status === 'CLOSED' ? 'गल्ला बंद (CLOSED)' : 'गल्ला चालू (ACTIVE)'}
      </span>
    </div>

    <!-- 1. LIVE GALLA CASH METRICS (4 Slabs) -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div class="stat-metric">
        <div class="stat-label">ओपनिंग रोकड़</div>
        <div class="stat-value text-slate-200">₹${galla.openingBalance.toLocaleString('en-IN')}</div>
      </div>
      <div class="stat-metric">
        <div class="stat-label">कुल आवक (+ IN)</div>
        <div class="stat-value text-emerald-400">+₹${galla.totalCashIn.toLocaleString('en-IN')}</div>
      </div>
      <div class="stat-metric">
        <div class="stat-label">कुल जावक (- OUT)</div>
        <div class="stat-value text-rose-400">-₹${galla.totalCashOut.toLocaleString('en-IN')}</div>
      </div>
      <div class="stat-metric border-amber-500/40 bg-amber-500/5">
        <div class="stat-label text-amber-400">गल्ला बैलेंस</div>
        <div class="stat-value text-amber-400">₹${galla.expectedCashBalance.toLocaleString('en-IN')}</div>
      </div>
    </div>

    <!-- 2. QUICK GALLA ACTION BUTTONS -->
    <div class="vault-card flex flex-wrap gap-2 items-center justify-between">
      <div class="flex gap-2">
        <button id="btn-quick-cash-in" class="btn btn-success text-xs sm:text-sm py-2 px-3">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
          कैश जमा (+ IN)
        </button>
        <button id="btn-quick-cash-out" class="btn btn-danger text-xs sm:text-sm py-2 px-3">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"/></svg>
          कैश निकासी (- OUT)
        </button>
      </div>

      <div class="flex gap-2">
        ${galla.status !== 'CLOSED' ? `
          <button id="btn-close-galla" class="btn btn-secondary text-xs sm:text-sm py-2 px-3 border border-slate-700">
            गल्ला मिलान व क्लोजिंग
          </button>
        ` : `
          <span class="text-xs text-slate-400 py-2">आज का गल्ला बंद किया जा चुका है</span>
        `}
      </div>
    </div>

    <!-- 3. SECONDARY QUICK STATS -->
    <div class="grid grid-cols-3 gap-3">
      <div class="stat-metric text-center cursor-pointer" id="kpi-active-trips">
        <div class="stat-label">चालू गाड़ियां</div>
        <div class="stat-value text-sky-400">${activeTrips.length}</div>
      </div>
      <div class="stat-metric text-center">
        <div class="stat-label">आज का कुल खर्च</div>
        <div class="stat-value text-rose-300">₹${todayExpensesTotal.toLocaleString('en-IN')}</div>
      </div>
      <div class="stat-metric text-center cursor-pointer" id="kpi-rto-alerts">
        <div class="stat-label">दस्तावेज अलर्ट</div>
        <div class="stat-value ${compliance.hasUrgentAlerts ? 'text-rose-500' : 'text-amber-400'}">
          ${compliance.totalAlerts}
        </div>
      </div>
    </div>

    <!-- 4. ACTIVE RUNNING FLEET TRIPS -->
    <div class="vault-card space-y-3">
      <div class="flex items-center justify-between">
        <h3 class="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <span class="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
          सड़क पर चालू गाड़ियां (${activeTrips.length})
        </h3>
        <button id="btn-dashboard-new-trip" class="btn btn-primary text-xs py-1 px-2.5">
          + नई ट्रिप
        </button>
      </div>

      ${activeTrips.length === 0 ? `
        <div class="p-6 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-lg">
          वर्तमान में कोई भी गाड़ी रनिंग में नहीं है।
        </div>
      ` : `
        <div class="space-y-2">
          ${activeTrips.map(trip => `
            <div class="p-3 bg-slate-800/60 border border-slate-700/60 rounded-xl flex items-center justify-between hover:border-slate-600 transition-colors">
              <div>
                <div class="flex items-center gap-2">
                  <span class="font-mono font-bold text-white text-sm">${trip.vehicleId}</span>
                  <span class="badge-status badge-info">${trip.tripType}</span>
                </div>
                <div class="text-xs text-slate-400 mt-1">
                  चालक: <span class="text-slate-200">${trip.driverName || 'निर्धारित नहीं'}</span> | 
                  पार्टी: <span class="text-amber-300 font-medium">${trip.customerName}</span>
                </div>
                <div class="text-[11px] text-slate-500 mt-0.5">
                  रूट: ${trip.pickupLocation} ➔ ${trip.dropLocation || 'लोकल'} | 
                  पर्ची: #${trip.dutySlipNumber}
                </div>
              </div>
              <div class="text-right">
                <span class="text-xs text-slate-400">मीटर शुरू:</span>
                <div class="font-mono font-bold text-slate-200 text-sm">${trip.startKm} KM</div>
                <span class="badge-status badge-active mt-1">ON TRIP</span>
              </div>
            </div>
          `).join('')}
        </div>
      `}
    </div>

    <!-- 5. TODAY'S GALLA CASH TRANSACTIONS LEDGER -->
    <div class="vault-card space-y-3">
      <h3 class="text-sm font-bold text-white uppercase tracking-wider">
        आज के गल्ला लेन-देन (Galla Log)
      </h3>

      ${(!galla.transactions || galla.transactions.length === 0) ? `
        <div class="p-4 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-lg">
          आज अभी तक कोई नकद लेन-देन दर्ज नहीं हुआ है।
        </div>
      ` : `
        <div class="overflow-x-auto">
          <table class="tally-table">
            <thead>
              <tr>
                <th>विवरण / श्रेणी</th>
                <th>रिमार्क</th>
                <th style="text-align: right;">रकम (₹)</th>
              </tr>
            </thead>
            <tbody>
              ${galla.transactions.slice().reverse().map(tx => `
                <tr>
                  <td>
                    <span class="font-semibold text-slate-200">${tx.category}</span>
                    <span class="text-[10px] text-slate-400 block">${new Date(tx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </td>
                  <td class="text-xs text-slate-400">${tx.remarks || '-'}</td>
                  <td style="text-align: right;" class="${tx.type === 'IN' ? 'tally-credit' : 'tally-debit'}">
                    ${tx.type === 'IN' ? '+' : '-'}₹${tx.amount.toLocaleString('en-IN')}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `}
    </div>
  `;

  // Attach Dashboard Event Listeners
  attachDashboardEvents(containerEl, galla, onNavigate);
}

/**
 * 2. Attach Interactive Modal Listeners
 */
function attachDashboardEvents(containerEl, galla, onNavigate) {
  const modalContainer = document.getElementById("modal-container");
  const modalContent = document.getElementById("modal-content");

  // Helper to open modal
  const openModal = (htmlContent) => {
    modalContent.innerHTML = htmlContent;
    modalContainer.classList.remove("hidden");
  };

  // Helper to close modal
  const closeModal = () => {
    modalContainer.classList.add("hidden");
    modalContent.innerHTML = "";
  };

  // Quick Cash In Button (+ IN)
  const btnIn = containerEl.querySelector("#btn-quick-cash-in");
  if (btnIn) {
    btnIn.addEventListener("click", () => {
      openModal(`
        <h3 class="text-base font-bold text-white mb-3 flex items-center gap-2">
          <span class="text-emerald-400 font-black">+</span> गल्ले में कैश जमा (Cash In)
        </h3>
        <form id="form-cash-in" class="space-y-3">
          <div>
            <label class="form-label">रकम (Amount ₹) *</label>
            <input type="number" id="in-amount" class="form-input text-lg font-mono font-bold text-emerald-400" placeholder="0" required autofocus>
          </div>
          <div>
            <label class="form-label">श्रेणी (Category)</label>
            <select id="in-category" class="form-select">
              <option value="Trip Advance">ट्रिप एडवांस (Trip Advance)</option>
              <option value="Trip Settlement">ट्रिप बाकी वसूली (Guest Collection)</option>
              <option value="Owner Capital">मालिक जमा (Self Deposit)</option>
              <option value="Vendor Refund">वेंडर रिफंड</option>
              <option value="Other Inflow">अन्य आवक</option>
            </select>
          </div>
          <div>
            <label class="form-label">विवरण / टिप्पणी (Remarks)</label>
            <input type="text" id="in-remarks" class="form-input" placeholder="उदा. उदयपुर-माउंट आबू एडवांस">
          </div>
          <div class="flex gap-2 pt-2">
            <button type="submit" class="btn btn-success flex-1 py-2.5">जमा करें</button>
            <button type="button" id="btn-modal-cancel" class="btn btn-secondary py-2.5">रद्द करें</button>
          </div>
        </form>
      `);

      document.getElementById("btn-modal-cancel").addEventListener("click", closeModal);
      document.getElementById("form-cash-in").addEventListener("submit", async (e) => {
        e.preventDefault();
        const amt = Number(document.getElementById("in-amount").value);
        const cat = document.getElementById("in-category").value;
        const rem = document.getElementById("in-remarks").value;

        if (amt > 0) {
          await addGallaTransaction({
            type: "IN",
            amount: amt,
            category: cat,
            remarks: rem
          });
          closeModal();
          renderDashboard(containerEl, onNavigate);
        }
      });
    });
  }

  // Quick Cash Out Button (- OUT)
  const btnOut = containerEl.querySelector("#btn-quick-cash-out");
  if (btnOut) {
    btnOut.addEventListener("click", () => {
      openModal(`
        <h3 class="text-base font-bold text-white mb-3 flex items-center gap-2">
          <span class="text-rose-400 font-black">-</span> गल्ले से कैश निकासी (Cash Out)
        </h3>
        <form id="form-cash-out" class="space-y-3">
          <div>
            <label class="form-label">रकम (Amount ₹) *</label>
            <input type="number" id="out-amount" class="form-input text-lg font-mono font-bold text-rose-400" placeholder="0" required autofocus>
          </div>
          <div>
            <label class="form-label">श्रेणी (Category)</label>
            <select id="out-category" class="form-select">
              <option value="Fuel / Diesel">डीज़ल खर्च (Diesel)</option>
              <option value="Driver Bhatta">ड्राइवर खोराकी / भत्ता</option>
              <option value="Toll & Parking">टोल व पार्किंग</option>
              <option value="Vehicle Maintenance">गाड़ी मेंटेनेंस / पंचर</option>
              <option value="Office Expense">ऑफिस चाय-पानी व खर्च</option>
              <option value="Owner Withdrawal">मालिक निकासी (Self Withdrawal)</option>
            </select>
          </div>
          <div>
            <label class="form-label">विवरण / गाड़ी नंबर</label>
            <input type="text" id="out-remarks" class="form-input" placeholder="उदा. RJ27-TA-1234 डीज़ल">
          </div>
          <div class="flex gap-2 pt-2">
            <button type="submit" class="btn btn-danger flex-1 py-2.5">निकासी दर्ज करें</button>
            <button type="button" id="btn-modal-cancel" class="btn btn-secondary py-2.5">रद्द करें</button>
          </div>
        </form>
      `);

      document.getElementById("btn-modal-cancel").addEventListener("click", closeModal);
      document.getElementById("form-cash-out").addEventListener("submit", async (e) => {
        e.preventDefault();
        const amt = Number(document.getElementById("out-amount").value);
        const cat = document.getElementById("out-category").value;
        const rem = document.getElementById("out-remarks").value;

        if (amt > 0) {
          await addGallaTransaction({
            type: "OUT",
            amount: amt,
            category: cat,
            remarks: rem
          });
          closeModal();
          renderDashboard(containerEl, onNavigate);
        }
      });
    });
  }

  // Evening Close Galla Button
  const btnCloseGalla = containerEl.querySelector("#btn-close-galla");
  if (btnCloseGalla) {
    btnCloseGalla.addEventListener("click", () => {
      openModal(`
        <h3 class="text-base font-bold text-white mb-2">शाम का गल्ला मिलान (Galla Closing)</h3>
        <p class="text-xs text-slate-400 mb-4">दुकान/ऑफिस बढ़ाते समय गल्ले के भौतिक नोट गिनकर यहाँ दर्ज करें।</p>
        <div class="p-3 bg-slate-800 rounded-lg mb-3 flex justify-between items-center text-xs">
          <span class="text-slate-300">सिस्टम अनुसार होना चाहिए:</span>
          <span class="font-mono font-bold text-amber-400 text-sm">₹${galla.expectedCashBalance.toLocaleString('en-IN')}</span>
        </div>
        <form id="form-close-galla" class="space-y-3">
          <div>
            <label class="form-label">हाथ में असली कैश (Physical Cash Counted ₹) *</label>
            <input type="number" id="physical-cash" class="form-input text-lg font-mono font-bold text-white" placeholder="0" required autofocus>
          </div>
          <div>
            <label class="form-label">क्लोजिंग रिमार्क / अंतर का कारण</label>
            <input type="text" id="close-remarks" class="form-input" placeholder="सब हिसाब बराबर">
          </div>
          <div class="flex gap-2 pt-2">
            <button type="submit" class="btn btn-primary flex-1 py-2.5">गल्ला बंद करें (Lock Galla)</button>
            <button type="button" id="btn-modal-cancel" class="btn btn-secondary py-2.5">रद्द करें</button>
          </div>
        </form>
      `);

      document.getElementById("btn-modal-cancel").addEventListener("click", closeModal);
      document.getElementById("form-close-galla").addEventListener("submit", async (e) => {
        e.preventDefault();
        const physical = Number(document.getElementById("physical-cash").value);
        const notes = document.getElementById("close-remarks").value;

        const res = await closeDailyGalla(physical, notes);
        if (res.success) {
          alert(res.message);
          closeModal();
          renderDashboard(containerEl, onNavigate);
        }
      });
    });
  }

  // Navigation shortcuts
  const btnNewTrip = containerEl.querySelector("#btn-dashboard-new-trip");
  if (btnNewTrip && typeof onNavigate === "function") {
    btnNewTrip.addEventListener("click", () => onNavigate("tab-trips"));
  }

  const kpiTrips = containerEl.querySelector("#kpi-active-trips");
  if (kpiTrips && typeof onNavigate === "function") {
    kpiTrips.addEventListener("click", () => onNavigate("tab-trips"));
  }

  const kpiRto = containerEl.querySelector("#kpi-rto-alerts");
  if (kpiRto && typeof onNavigate === "function") {
    kpiRto.addEventListener("click", () => onNavigate("tab-fleet"));
  }
}
