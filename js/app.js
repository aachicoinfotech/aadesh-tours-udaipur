// js/app.js
// Aadesh Tours Udaipur - Master Application Orchestrator & PWA Core (Phase 30)

import { 
  loginOwner, 
  isAuthenticated, 
  logoutOwner, 
  initAutoLockWatcher 
} from "./services/auth-service.js";

// Core View Modules
import { renderDashboard } from "./views/dashboard-view.js";
import { renderTripsView } from "./views/trips-view.js";
import { renderBillingView } from "./views/billing-view.js";

// Services for Fleet, Daybook & Reports
import { getAllVehicles, addVehicle } from "./services/fleet-service.js";
import { getAllDrivers, addDriver } from "./services/driver-service.js";
import { getFleetComplianceReport } from "./services/reminder-service.js";
import { getDailyDaybook } from "./services/daybook-service.js";
import { getAllExpenses, addExpense } from "./services/expense-service.js";
import { generateProfitAndLossReport, generateFleetRoiReport } from "./services/reports-service.js";

// Exporters
import { exportDaybookToPdf } from "./exporters/pdf-exporter.js";
import { exportDaybookToSheet, exportTripsToSheet, exportExpensesToSheet } from "./exporters/sheet-exporter.js";
import { exportDatabaseBackupJson, exportDaybookToTallyXml } from "./exporters/data-exporter.js";
import { exportTourQuotationDocx } from "./exporters/docx-exporter.js";

// Global App State
let currentTab = "tab-dashboard";
let currentPinBuffer = "";

/* ==========================================================================
   1. AUTHENTICATION & MASTER PIN PAD CONTROLLER
   ========================================================================== */

function initAuthUI() {
  const overlay = document.getElementById("auth-overlay");
  const appRoot = document.getElementById("app-root");
  const pinDisplay = document.getElementById("pin-display");
  const errorMsg = document.getElementById("auth-error-msg");

  const updateDisplay = () => {
    pinDisplay.value = "•".repeat(currentPinBuffer.length);
  };

  const handleUnlock = async () => {
    if (currentPinBuffer.length < 4) {
      errorMsg.textContent = "कृपया 4 अंकों का पिन दर्ज करें।";
      return;
    }

    errorMsg.textContent = "सत्यापित किया जा रहा है...";
    const res = await loginOwner(currentPinBuffer);

    if (res.success) {
      overlay.classList.add("hidden");
      appRoot.classList.remove("hidden");
      currentPinBuffer = "";
      errorMsg.textContent = "";
      updateDisplay();
      navigateToTab(currentTab);
    } else {
      errorMsg.textContent = res.message || "गलत मास्टर पिन!";
      currentPinBuffer = "";
      updateDisplay();
    }
  };

  // Bind Keypad Buttons
  document.querySelectorAll(".key-btn[data-val]").forEach(btn => {
    btn.addEventListener("click", () => {
      if (currentPinBuffer.length < 4) {
        currentPinBuffer += btn.dataset.val;
        updateDisplay();
        if (currentPinBuffer.length === 4) {
          handleUnlock();
        }
      }
    });
  });

  document.getElementById("btn-pin-clear")?.addEventListener("click", () => {
    currentPinBuffer = "";
    errorMsg.textContent = "";
    updateDisplay();
  });

  document.getElementById("btn-pin-unlock")?.addEventListener("click", handleUnlock);

  // Lock Application Action
  document.getElementById("btn-lock-app")?.addEventListener("click", () => {
    logoutOwner();
    lockAppUI();
  });

  // Watch for session timeout or auto-lock
  window.addEventListener("aadesh-auth-locked", lockAppUI);
  initAutoLockWatcher(lockAppUI);

  // Check initial state on page load
  if (isAuthenticated()) {
    overlay.classList.add("hidden");
    appRoot.classList.remove("hidden");
    navigateToTab(currentTab);
  } else {
    lockAppUI();
  }
}

function lockAppUI() {
  document.getElementById("auth-overlay")?.classList.remove("hidden");
  document.getElementById("app-root")?.classList.add("hidden");
  currentPinBuffer = "";
  const pinDisplay = document.getElementById("pin-display");
  if (pinDisplay) pinDisplay.value = "";
}

/* ==========================================================================
   2. TAB ROUTING & CONTAINER DISPATCHER
   ========================================================================== */

export function navigateToTab(tabId) {
  currentTab = tabId;

  // Toggle active class on bottom nav
  document.querySelectorAll(".nav-tab-btn").forEach(btn => {
    if (btn.dataset.target === tabId) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });

  // Toggle visibility of panes
  document.querySelectorAll(".tab-pane").forEach(pane => {
    if (pane.id === tabId) {
      pane.classList.remove("hidden");
    } else {
      pane.classList.add("hidden");
    }
  });

  // Dispatch renderer based on selected tab
  const container = document.getElementById(tabId);
  if (!container) return;

  switch (tabId) {
    case "tab-dashboard":
      renderDashboard(container, navigateToTab);
      break;
    case "tab-trips":
      renderTripsView(container, navigateToTab);
      break;
    case "tab-billing":
      renderBillingView(container, navigateToTab);
      break;
    case "tab-fleet":
      renderFleetView(container);
      break;
    case "tab-daybook":
      renderDaybookView(container);
      break;
    case "tab-reports":
      renderReportsView(container);
      break;
  }
}

function initNavBindings() {
  document.querySelectorAll(".nav-tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const target = btn.dataset.target;
      if (target) navigateToTab(target);
    });
  });

  document.getElementById("btn-compliance-alert")?.addEventListener("click", () => {
    navigateToTab("tab-fleet");
  });
}

/* ==========================================================================
   3. FLEET, DRIVERS & COMPLIANCE VIEW (tab-fleet)
   ========================================================================== */

async function renderFleetView(containerEl) {
  const [vehicles, drivers, complianceList] = await Promise.all([
    getAllVehicles(),
    getAllDrivers(),
    getFleetComplianceReport(30)
  ]);

  containerEl.innerHTML = `
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 class="text-xl font-black text-white tracking-wide">फ्लीट व ड्राइवर मास्टर्स</h2>
        <p class="text-xs text-slate-400">कुल गाड़ियां: <span class="font-mono text-amber-400 font-bold">${vehicles.length}</span> | ड्राइवर्स: ${drivers.length}</p>
      </div>
      <div class="flex gap-2">
        <button id="btn-add-vehicle" class="btn btn-primary text-xs py-2 px-3">+ नई गाड़ी</button>
        <button id="btn-add-driver" class="btn btn-secondary text-xs py-2 px-3">+ नया ड्राइवर</button>
      </div>
    </div>

    <!-- RTO Document Expiry Warnings -->
    <div class="vault-card space-y-3">
      <h3 class="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
        <span class="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
        RTO दस्तावेज अनुपालन स्थिति (Insurance, Fitness, Permit, PUC)
      </h3>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
        ${complianceList.map(comp => `
          <div class="p-3 bg-slate-950/50 border border-slate-800 rounded-lg space-y-2">
            <div class="flex justify-between items-center">
              <span class="font-mono font-bold text-amber-400">${comp.vehicleId}</span>
              <span class="text-slate-400 font-medium">${comp.makeModel || 'Cab'}</span>
            </div>
            <div class="grid grid-cols-2 gap-1.5 text-[11px]">
              ${comp.documents.map(doc => `
                <div class="p-1.5 rounded bg-slate-900 border border-slate-800/80">
                  <span class="text-slate-400 block">${doc.documentName}:</span>
                  <span class="font-semibold ${doc.status === 'EXPIRED' ? 'text-rose-400' : (doc.status === 'EXPIRING_SOON' ? 'text-amber-400' : 'text-emerald-400')}">
                    ${doc.label}
                  </span>
                </div>
              `).join('')}
            </div>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- Vehicles Registry Table -->
    <div class="vault-card space-y-3">
      <h3 class="text-sm font-bold text-white uppercase tracking-wider">गाड़ियों की सूची (Registered Fleet)</h3>
      <div class="space-y-2">
        ${vehicles.map(v => `
          <div class="p-3 bg-slate-800/60 border border-slate-700/60 rounded-xl flex items-center justify-between text-xs">
            <div>
              <span class="font-mono font-bold text-white text-sm">${v.regNumber}</span>
              <span class="badge-status badge-info text-[10px] ml-2">${v.ownershipType}</span>
              <div class="text-slate-400 mt-1">${v.makeModel} (${v.fuelType}) \vert{} मीटर: ${v.currentOdometer || 0} KM</div>
            </div>
            <div class="text-right">
              <span class="badge-status ${v.status === 'AVAILABLE' ? 'badge-active' : 'badge-warning'}">${v.status}</span>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  // Bind Add Vehicle Modal
  containerEl.querySelector("#btn-add-vehicle")?.addEventListener("click", () => {
    openMasterModal(`
      <h3 class="text-base font-bold text-white mb-3">नई गाड़ी जोड़ें (Add Vehicle)</h3>
      <form id="form-new-vehicle" class="space-y-3 text-xs">
        <div>
          <label class="form-label">गाड़ी नंबर (Registration No) *</label>
          <input type="text" id="v-reg" class="form-input font-mono font-bold uppercase" placeholder="RJ27TA1234" required>
        </div>
        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="form-label">मॉडल (Make & Model) *</label>
            <input type="text" id="v-model" class="form-input" placeholder="Swift Dzire / Innova" required>
          </div>
          <div>
            <label class="form-label">स्वामित्व (Ownership)</label>
            <select id="v-owner" class="form-select">
              <option value="OWN">अपनी गाड़ी (Own)</option>
              <option value="MARKET_VENDOR">मार्केट / वेंडर (Vendor)</option>
            </select>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="form-label">शुरुआती ओडोमीटर (KM)</label>
            <input type="number" id="v-odo" class="form-input font-mono" placeholder="0">
          </div>
          <div>
            <label class="form-label">ईंधन प्रकार (Fuel)</label>
            <select id="v-fuel" class="form-select">
              <option value="DIESEL">Diesel</option>
              <option value="PETROL">Petrol</option>
              <option value="CNG">CNG</option>
            </select>
          </div>
        </div>
        <div class="pt-2 flex gap-2">
          <button type="submit" class="btn btn-primary flex-1 py-2.5">सुरक्षित करें</button>
          <button type="button" class="btn btn-secondary py-2.5 btn-close-modal">रद्द करें</button>
        </div>
      </form>
    `);

    document.getElementById("form-new-vehicle")?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const payload = {
        regNumber: document.getElementById("v-reg").value,
        makeModel: document.getElementById("v-model").value,
        ownershipType: document.getElementById("v-owner").value,
        currentOdometer: Number(document.getElementById("v-odo").value) || 0,
        fuelType: document.getElementById("v-fuel").value
      };
      const res = await addVehicle(payload);
      if (res.success) {
        closeMasterModal();
        renderFleetView(containerEl);
      } else {
        alert(res.message);
      }
    });
  });

  // Bind Add Driver Modal
  containerEl.querySelector("#btn-add-driver")?.addEventListener("click", () => {
    openMasterModal(`
      <h3 class="text-base font-bold text-white mb-3">नया ड्राइवर जोड़ें (Add Driver)</h3>
      <form id="form-new-driver" class="space-y-3 text-xs">
        <div>
          <label class="form-label">ड्राइवर का पूरा नाम *</label>
          <input type="text" id="d-name" class="form-input" placeholder="उदा. Ramesh Kumar" required>
        </div>
        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="form-label">मोबाइल नंबर *</label>
            <input type="tel" id="d-phone" class="form-input" placeholder="9876543210" required>
          </div>
          <div>
            <label class="form-label">ड्राइविंग लाइसेंस (DL) #</label>
            <input type="text" id="d-dl" class="form-input font-mono uppercase" placeholder="RJ27 20200001234">
          </div>
        </div>
        <div class="pt-2 flex gap-2">
          <button type="submit" class="btn btn-primary flex-1 py-2.5">ड्राइवर जोड़ें</button>
          <button type="button" class="btn btn-secondary py-2.5 btn-close-modal">रद्द करें</button>
        </div>
      </form>
    `);

    document.getElementById("form-new-driver")?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const payload = {
        name: document.getElementById("d-name").value,
        phone: document.getElementById("d-phone").value,
        licenseNumber: document.getElementById("d-dl").value
      };
      const res = await addDriver(payload);
      if (res.success) {
        closeMasterModal();
        renderFleetView(containerEl);
      } else {
        alert(res.message);
      }
    });
  });
}

/* ==========================================================================
   4. DAYBOOK & EXPENSES VIEW (tab-daybook)
   ========================================================================== */

async function renderDaybookView(containerEl) {
  const today = new Date().toISOString().slice(0, 10);
  const daybook = await getDailyDaybook(today);
  const expenses = await getAllExpenses();

  containerEl.innerHTML = `
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 class="text-xl font-black text-white tracking-wide">टैली डे-बुक व रोज़नामचा</h2>
        <p class="text-xs text-slate-400">दिनांक: <span class="font-mono text-amber-400 font-bold">${today}</span></p>
      </div>
      <div class="flex gap-2">
        <button id="btn-add-expense" class="btn btn-danger text-xs py-2 px-3">+ खर्च वाउचर</button>
        <button id="btn-export-daybook-pdf" class="btn btn-secondary text-xs py-2 px-2.5">PDF</button>
        <button id="btn-export-daybook-xls" class="btn btn-secondary text-xs py-2 px-2.5">Excel</button>
        <button id="btn-export-daybook-xml" class="btn btn-secondary text-xs py-2 px-2.5">Tally XML</button>
      </div>
    </div>

    <!-- Daybook Summary Cards -->
    <div class="grid grid-cols-3 gap-3">
      <div class="stat-metric">
        <div class="stat-label">कुल जमा (+ Credit)</div>
        <div class="stat-value text-emerald-400">₹${daybook.totalCredit.toLocaleString('en-IN')}</div>
      </div>
      <div class="stat-metric">
        <div class="stat-label">कुल नामे (- Debit)</div>
        <div class="stat-value text-rose-400">₹${daybook.totalDebit.toLocaleString('en-IN')}</div>
      </div>
      <div class="stat-metric border-amber-500/30 bg-amber-500/5">
        <div class="stat-label text-amber-400">शुद्ध सरप्लस/कैशफ्लो</div>
        <div class="stat-value text-amber-400">₹${daybook.netBalance.toLocaleString('en-IN')}</div>
      </div>
    </div>

    <!-- Tally Vouchers Table -->
    <div class="vault-card space-y-3">
      <h3 class="text-sm font-bold text-white uppercase tracking-wider">आज के वाउचर्स (Daily Vouchers)</h3>
      ${daybook.vouchers.length === 0 ? `
        <div class="p-6 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-lg">
          आज की तारीख में कोई वाउचर प्रविष्टि नहीं है।
        </div>
      ` : `
        <div class="overflow-x-auto">
          <table class="tally-table">
            <thead>
              <tr>
                <th>वाउचर #</th>
                <th>प्रकार</th>
                <th>खाता (Account Head)</th>
                <th>विवरण (Narration)</th>
                <th style="text-align: right;">नामे (Debit ₹)</th>
                <th style="text-align: right;">जमा (Credit ₹)</th>
              </tr>
            </thead>
            <tbody>
              ${daybook.vouchers.map(v => `
                <tr>
                  <td class="font-mono text-slate-400 text-xs">${v.voucherNo}</td>
                  <td><span class="badge-status ${v.voucherType === 'RECEIPT' ? 'badge-active' : 'badge-danger'} text-[10px]">${v.voucherType}</span></td>
                  <td class="font-semibold text-slate-200">${v.accountHead}</td>
                  <td class="text-xs text-slate-400">${v.particulars}</td>
                  <td style="text-align: right;" class="tally-debit">${v.debit > 0 ? '₹' + v.debit.toLocaleString('en-IN') : '-'}</td>
                  <td style="text-align: right;" class="tally-credit">${v.credit > 0 ? '₹' + v.credit.toLocaleString('en-IN') : '-'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `}
    </div>
  `;

  // Bind Export Actions
  containerEl.querySelector("#btn-export-daybook-pdf")?.addEventListener("click", () => exportDaybookToPdf(daybook));
  containerEl.querySelector("#btn-export-daybook-xls")?.addEventListener("click", () => exportDaybookToSheet(daybook, "EXCEL"));
  containerEl.querySelector("#btn-export-daybook-xml")?.addEventListener("click", () => exportDaybookToTallyXml(daybook));

  // Bind Add Expense Modal
  containerEl.querySelector("#btn-add-expense")?.addEventListener("click", () => {
    openMasterModal(`
      <h3 class="text-base font-bold text-white mb-3">नया खर्च वाउचर दर्ज करें (Add Expense)</h3>
      <form id="form-new-exp" class="space-y-3 text-xs">
        <div>
          <label class="form-label">खर्च राशि (Amount ₹) *</label>
          <input type="number" id="e-amt" class="form-input text-lg font-mono font-bold text-rose-400" placeholder="0" required autofocus>
        </div>
        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="form-label">खर्च श्रेणी (Category)</label>
            <select id="e-cat" class="form-select">
              <option value="Fuel / Diesel">डीज़ल खर्च (Diesel)</option>
              <option value="Toll & Parking">टोल व पार्किंग</option>
              <option value="Vehicle Maintenance">गाड़ी गैराज व सर्विस</option>
              <option value="Driver Bhatta">ड्राइवर खोराकी</option>
              <option value="Office Expense">ऑफिस खर्च</option>
            </select>
          </div>
          <div>
            <label class="form-label">भुगतान माध्यम (Mode)</label>
            <select id="e-mode" class="form-select">
              <option value="CASH">CASH (गल्ले से कटा)</option>
              <option value="UPI">UPI / Online</option>
              <option value="FASTAG">Fastag Wallet</option>
            </select>
          </div>
        </div>
        <div>
          <label class="form-label">गाड़ी नंबर / विवरण</label>
          <input type="text" id="e-rem" class="form-input" placeholder="उदा. RJ27-TA-1234 40L Diesel">
        </div>
        <div class="pt-2 flex gap-2">
          <button type="submit" class="btn btn-danger flex-1 py-2.5">वाउचर सेव करें</button>
          <button type="button" class="btn btn-secondary py-2.5 btn-close-modal">रद्द करें</button>
        </div>
      </form>
    `);

    document.getElementById("form-new-exp")?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const payload = {
        amount: Number(document.getElementById("e-amt").value),
        category: document.getElementById("e-cat").value,
        paymentMode: document.getElementById("e-mode").value,
        remarks: document.getElementById("e-rem").value
      };
      await addExpense(payload, payload.paymentMode === "CASH");
      closeMasterModal();
      renderDaybookView(containerEl);
    });
  });
}

/* ==========================================================================
   5. REPORTS, PROFIT & LOSS AND ROI VIEW (tab-reports)
   ========================================================================== */

async function renderReportsView(containerEl) {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  const today = now.toISOString().slice(0, 10);

  const [pnl, roi] = await Promise.all([
    generateProfitAndLossReport(firstDay, today),
    generateFleetRoiReport(firstDay, today)
  ]);

  containerEl.innerHTML = `
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 class="text-xl font-black text-white tracking-wide">P&L लाभ-हानि व ROI रिपोर्ट्स</h2>
        <p class="text-xs text-slate-400">अवधि: ${firstDay} से ${today} (चालू माह)</p>
      </div>
      <div class="flex flex-wrap gap-2">
        <button id="btn-export-backup" class="btn btn-primary text-xs py-2 px-3">
          1-क्लिक ऑल डेटा बैकअप (JSON)
        </button>
        <button id="btn-sample-quotation" class="btn btn-secondary text-xs py-2 px-3">
          Word टूर कोटेशन
        </button>
      </div>
    </div>

    <!-- P&L Financial Snapshot -->
    <div class="vault-card space-y-4">
      <h3 class="text-sm font-bold text-white uppercase tracking-wider">मासिक लाभ-हानि समीक्षा (Profit & Loss)</h3>
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div class="stat-metric">
          <div class="stat-label">कुल रेवेन्यू (Revenue)</div>
          <div class="stat-value text-emerald-400">₹${pnl.revenue.totalRevenue.toLocaleString('en-IN')}</div>
        </div>
        <div class="stat-metric">
          <div class="stat-label">कुल खर्चे (Expenses)</div>
          <div class="stat-value text-rose-400">₹${pnl.expenses.totalExpenses.toLocaleString('en-IN')}</div>
        </div>
        <div class="stat-metric border-emerald-500/30 bg-emerald-500/5">
          <div class="stat-label text-emerald-400">शुद्ध मुनाफ़ा (Net Profit)</div>
          <div class="stat-value text-emerald-400">₹${pnl.summary.netProfit.toLocaleString('en-IN')}</div>
        </div>
        <div class="stat-metric">
          <div class="stat-label">प्रॉफ़िट मार्जिन %</div>
          <div class="stat-value text-amber-400">${pnl.summary.profitMarginPercentage}%</div>
        </div>
      </div>
    </div>

    <!-- Vehicle-wise ROI Breakdown -->
    <div class="vault-card space-y-3">
      <h3 class="text-sm font-bold text-white uppercase tracking-wider">गाड़ी-वार ROI व प्रति KM शुद्ध कमाई</h3>
      <div class="space-y-2">
        ${roi.vehicles.map(v => `
          <div class="p-3 bg-slate-950/40 border border-slate-800 rounded-xl flex flex-wrap items-center justify-between gap-2 text-xs">
            <div>
              <span class="font-mono font-bold text-amber-400 text-sm">${v.vehicleId}</span>
              <span class="text-slate-300 ml-2 font-medium">${v.makeModel}</span>
              <div class="text-slate-400 mt-1">
                कुल रन: <span class="font-mono text-white font-bold">${v.totalKmRun} KM</span> \vert{} ट्रिप्स: ${v.tripsCompleted}
              </div>
            </div>
            <div class="text-right">
              <span class="text-slate-400 block">शुद्ध बचत / रिटर्न:</span>
              <span class="font-mono font-black text-sm ${v.netEarnings >= 0 ? 'text-emerald-400' : 'text-rose-400'}">
                ₹${v.netEarnings.toLocaleString('en-IN')}
              </span>
              <span class="text-[10px] text-slate-400 block">₹${v.earningsPerKm}/KM</span>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  // Bind Master JSON Full Backup Action
  containerEl.querySelector("#btn-export-backup")?.addEventListener("click", async () => {
    const [allV, allD, allT, allE] = await Promise.all([
      getAllVehicles(),
      getAllDrivers(),
      getAllExpenses()
    ]);
    const backupPayload = {
      app: "Aadesh Tours Udaipur Vault",
      version: "2.0",
      timestamp: new Date().toISOString(),
      vehicles: allV,
      drivers: allD,
      expenses: allE
    };
    exportDatabaseBackupJson(backupPayload);
  });

  // Bind Sample Word Quotation Generator
  containerEl.querySelector("#btn-sample-quotation")?.addEventListener("click", () => {
    exportTourQuotationDocx({
      clientName: "Royal Rajasthan Tours Guest",
      tourTitle: "3 Days Udaipur - Kumbhalgarh - Ranakpur Tour",
      vehicles: [
        { model: "Swift Dzire (Sedan)", seating: "4+1", rate: "₹12 / KM", slab: "250 KM / Day", total: "₹9,000 Estimated" }
      ]
    });
  });
}

/* ==========================================================================
   6. GLOBAL MODAL HELPER
   ========================================================================== */

function openMasterModal(html) {
  const container = document.getElementById("modal-container");
  const content = document.getElementById("modal-content");
  if (!container || !content) return;

  content.innerHTML = html;
  container.classList.remove("hidden");

  content.querySelectorAll(".btn-close-modal").forEach(b => {
    b.addEventListener("click", closeMasterModal);
  });
}

function closeMasterModal() {
  const container = document.getElementById("modal-container");
  const content = document.getElementById("modal-content");
  if (container) container.classList.add("hidden");
  if (content) content.innerHTML = "";
}

/* ==========================================================================
   7. INITIALIZATION LIFECYCLE & PWA REGISTRATION
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  initAuthUI();
  initNavBindings();

  // Register PWA Service Worker for Offline Execution
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("./sw.js")
        .then(reg => console.log("PWA Service Worker registered:", reg.scope))
        .catch(err => console.warn("PWA Service Worker registration skipped:", err));
    });
  }
});
