// js/views/fleet-view.js
// Aadesh Tours Udaipur - Gaadi aur Driver Master (All-in-One Fleet View)

import { db } from "../config/firebase-config.js";
import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  getDoc 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { addGallaTransaction } from "../services/galla-service.js";
import { CASHFLOW_CATEGORIES } from "../config/constants.js";

// Helper for Expiry Status
function getPaperStatus(dateStr) {
  if (!dateStr) return { label: "अपंजीकृत", color: "text-slate-500", days: null, isAlert: false };
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expDate = new Date(dateStr);
  expDate.setHours(0, 0, 0, 0);

  const diffTime = expDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { label: `समाप्त (${Math.abs(diffDays)} दिन पूर्व)`, color: "text-rose-400", days: diffDays, isAlert: true };
  } else if (diffDays <= 30) {
    return { label: `${diffDays} दिन शेष`, color: "text-amber-400", days: diffDays, isAlert: true };
  } else {
    return { label: "मान्य (OK)", color: "text-emerald-400", days: diffDays, isAlert: false };
  }
}

export async function renderFleetView(containerEl, onNavigate) {
  let vehicles = [];
  let drivers = [];
  let activeTab = "VEHICLES"; // 'VEHICLES' ya 'DRIVERS'
  let activeFilter = "ALL";

  // 1. Fetch Vehicles
  try {
    const vSnap = await getDocs(collection(db, "vehicles"));
    vehicles = vSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.warn("Vehicles fetch fallback:", err);
    try {
      const cached = localStorage.getItem("aadesh_cached_vehicles");
      if (cached) vehicles = JSON.parse(cached);
    } catch (e) {
      vehicles = [];
    }
  }

  // 2. Fetch Drivers
  try {
    const dSnap = await getDocs(collection(db, "drivers"));
    drivers = dSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.warn("Drivers fetch fallback:", err);
    try {
      const cached = localStorage.getItem("aadesh_cached_drivers");
      if (cached) drivers = JSON.parse(cached);
    } catch (e) {
      drivers = [];
    }
  }

  const renderContent = () => {
    // Alert counts
    let vehAlerts = 0;
    vehicles.forEach(v => {
      const d = v.documents || {};
      const dates = [d.insuranceExpiry, d.fitnessExpiry, d.permitExpiry, d.pucExpiry, d.taxExpiry];
      if (dates.some(dt => dt && getPaperStatus(dt).isAlert)) vehAlerts++;
    });

    let drvAlerts = 0;
    drivers.forEach(dr => {
      if (dr.dlExpiry && getPaperStatus(dr.dlExpiry).isAlert) drvAlerts++;
    });

    const isVeh = activeTab === "VEHICLES";
    const vehTabBtnClass = isVeh ? "bg-amber-500 text-slate-950 font-black shadow-lg" : "bg-slate-800 text-slate-400 font-bold";
    const drvTabBtnClass = !isVeh ? "bg-amber-500 text-slate-950 font-black shadow-lg" : "bg-slate-800 text-slate-400 font-bold";

    const allBtn = activeFilter === "ALL" ? "bg-amber-500 text-slate-950 font-bold" : "bg-slate-800 text-slate-300";
    const activeBtn = activeFilter === "ACTIVE" ? "bg-amber-500 text-slate-950 font-bold" : "bg-slate-800 text-slate-300";
    const alertsBtn = activeFilter === "ALERTS" ? "bg-rose-500 text-white font-bold" : "bg-slate-800 text-slate-300";

    const bodyHtml = isVeh ? renderVehiclesList(vehAlerts) : renderDriversList(drvAlerts);

    containerEl.innerHTML = `
      <!-- TOP TOGGLE BUTTON: GAADIYAAN VS DRIVER -->
      <div class="grid grid-cols-2 gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
        <button id="toggle-tab-vehicles" class="py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all ${vehTabBtnClass}">
          <span class="text-sm">🚘</span> गाड़ियां (${vehicles.length})
          ${vehAlerts > 0 ? `<span class="bg-rose-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold">${vehAlerts}</span>` : ''}
        </button>
        <button id="toggle-tab-drivers" class="py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all ${drvTabBtnClass}">
          <span class="text-sm">👨‍✈️</span> ड्राइवर लिस्ट (${drivers.length})
          ${drvAlerts > 0 ? `<span class="bg-rose-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold">${drvAlerts}</span>` : ''}
        </button>
      </div>

      <!-- HEADER TITLE & ADD BUTTON -->
      <div class="flex items-center justify-between gap-2 pt-1">
        <div>
          <h2 class="text-lg font-black text-white">${isVeh ? 'गाड़ियां व RTO दस्तावेज' : 'ड्राइवर व लाइसेंस लेजर'}</h2>
          <p class="text-[11px] text-slate-400">
            ${isVeh ? `कुल वाहन: <span class="font-mono text-amber-400 font-bold">${vehicles.length}</span> | अलर्ट: <span class="font-mono text-rose-400 font-bold">${vehAlerts}</span>`
                    : `कुल ड्राइवर: <span class="font-mono text-amber-400 font-bold">${drivers.length}</span> | DL अलर्ट: <span class="font-mono text-rose-400 font-bold">${drvAlerts}</span>`}
          </p>
        </div>
        <button id="btn-add-fleet-item" class="btn btn-primary text-xs py-2 px-3 font-bold">
          ${isVeh ? '+ नई गाड़ी जोड़ें' : '+ नया ड्राइवर जोड़ें'}
        </button>
      </div>

      <!-- FILTER PILLS -->
      <div class="flex gap-1.5 overflow-x-auto pb-1 text-xs">
        <button class="fleet-filter-pill px-3 py-1.5 rounded-lg font-semibold ${allBtn}" data-filter="ALL">
          सभी (${isVeh ? vehicles.length : drivers.length})
        </button>
        <button class="fleet-filter-pill px-3 py-1.5 rounded-lg font-semibold ${activeBtn}" data-filter="ACTIVE">
          ${isVeh ? 'सक्रिय गाड़ियां' : 'उपलब्ध ड्राइवर'}
        </button>
        <button class="fleet-filter-pill px-3 py-1.5 rounded-lg font-semibold ${alertsBtn}" data-filter="ALERTS">
          कागज़ात अलर्ट (${isVeh ? vehAlerts : drvAlerts})
        </button>
      </div>

      <!-- CARDS LIST -->
      <div class="space-y-3">
        ${bodyHtml}
      </div>
    `;

    bindEvents();
  };

  // 1. VEHICLES CARDS LIST
  const renderVehiclesList = () => {
    let filtered = vehicles;
    if (activeFilter === "ACTIVE") filtered = vehicles.filter(v => v.status === "ACTIVE" || !v.status);
    if (activeFilter === "ALERTS") {
      filtered = vehicles.filter(v => {
        const d = v.documents || {};
        return [d.insuranceExpiry, d.fitnessExpiry, d.permitExpiry, d.pucExpiry, d.taxExpiry].some(dt => dt && getPaperStatus(dt).isAlert);
      });
    }

    if (filtered.length === 0) {
      return '<div class="vault-card text-center p-8 text-slate-500 text-xs">कोई गाड़ी नहीं मिली। ऊपर "+ नई गाड़ी जोड़ें" बटन दबाएं।</div>';
    }

    return filtered.map(v => {
      const d = v.documents || {};
      const ins = getPaperStatus(d.insuranceExpiry);
      const fit = getPaperStatus(d.fitnessExpiry);
      const pmt = getPaperStatus(d.permitExpiry);
      const puc = getPaperStatus(d.pucExpiry);
      const tax = getPaperStatus(d.taxExpiry);

      const hasAlert = ins.isAlert || fit.isAlert || pmt.isAlert || puc.isAlert || tax.isAlert;
      const borderClass = hasAlert ? "border-l-rose-500" : "border-l-emerald-500";

      return `
        <div class="vault-card space-y-2 border-l-4 ${borderClass} text-xs">
          <div class="flex items-center justify-between">
            <div>
              <span class="font-mono text-base font-black text-amber-400 tracking-wider">${v.regNumber}</span>
              <span class="text-slate-300 font-semibold block text-[11px]">${v.makeModel || "Cab"} (${v.seatingCapacity || 4}+1)</span>
            </div>
            <div class="text-right">
              <span class="badge-status ${v.ownership === 'ATTACHED' ? 'badge-warning' : 'badge-active'}">
                ${v.ownership === 'ATTACHED' ? 'मार्केट अटैच' : 'स्वयं की (OWN)'}
              </span>
              <span class="text-[10px] text-slate-400 block font-mono mt-0.5">${v.currentOdometer || 0} KM</span>
            </div>
          </div>

          <div class="bg-slate-950/60 p-2.5 rounded-xl space-y-1 text-[11px] border border-slate-800">
            <div class="flex justify-between">
              <span class="text-slate-400">बीमा (Insurance):</span>
              <span class="font-mono font-semibold ${ins.color}">${d.insuranceExpiry || '-'} [${ins.label}]</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-400">फिटनेस (Fitness):</span>
              <span class="font-mono font-semibold ${fit.color}">${d.fitnessExpiry || '-'} [${fit.label}]</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-400">परमिट (Permit):</span>
              <span class="font-mono font-semibold ${pmt.color}">${d.permitExpiry || '-'} [${pmt.label}]</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-400">प्रदूषण (PUC):</span>
              <span class="font-mono font-semibold ${puc.color}">${d.pucExpiry || '-'} [${puc.label}]</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-400">रोड टैक्स (Tax):</span>
              <span class="font-mono font-semibold ${tax.color}">${d.taxExpiry || '-'} [${tax.label}]</span>
            </div>
          </div>

          <div class="flex items-center justify-between pt-1 border-t border-slate-800 text-[11px]">
            <span class="text-slate-400">ईंधन: <strong class="text-slate-200">${v.fuelType || 'DIESEL'}</strong></span>
            <button class="btn btn-secondary text-xs py-1 px-3 btn-edit-vehicle" data-reg="${v.regNumber}">
              ✏️ पेपर व डिटेल एडिट
            </button>
          </div>
        </div>
      `;
    }).join("");
  };

  // 2. DRIVERS CARDS LIST
  const renderDriversList = () => {
    let filtered = drivers;
    if (activeFilter === "ACTIVE") filtered = drivers.filter(dr => dr.status === "ACTIVE" || !dr.status);
    if (activeFilter === "ALERTS") filtered = drivers.filter(dr => dr.dlExpiry && getPaperStatus(dr.dlExpiry).isAlert);

    if (filtered.length === 0) {
      return '<div class="vault-card text-center p-8 text-slate-500 text-xs">कोई ड्राइवर नहीं मिला। ऊपर "+ नया ड्राइवर जोड़ें" से नया ड्राइवर रजिस्टर करें।</div>';
    }

    return filtered.map(dr => {
      const dlStat = getPaperStatus(dr.dlExpiry);
      const borderClass = dlStat.isAlert ? "border-l-rose-500" : "border-l-emerald-500";
      const statusBadge = dr.status === "ON_DUTY" 
        ? '<span class="badge-status badge-warning">ड्यूटी पर (On Duty)</span>' 
        : (dr.status === "LEAVE" ? '<span class="badge-status badge-danger">छुट्टी पर</span>' : '<span class="badge-status badge-active">उपलब्ध (Ready)</span>');

      const phoneClean = (dr.phone || "").replace(/\D/g, "");
      const advanceBal = Number(dr.advanceBalance) || 0;

      return `
        <div class="vault-card space-y-2.5 border-l-4 ${borderClass} text-xs">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <div class="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-lg">
                👨‍✈️
              </div>
              <div>
                <span class="font-bold text-white text-sm block">${dr.name}</span>
                <span class="text-slate-400 font-mono text-[11px]">📱 ${dr.phone || 'फोन नहीं'}</span>
              </div>
            </div>
            <div class="text-right">
              ${statusBadge}
              <span class="text-[10px] text-slate-400 block font-mono mt-1">भत्ता: ₹${dr.dailyBhatta || 300}/दिन</span>
            </div>
          </div>

          <div class="bg-slate-950/60 p-2.5 rounded-xl space-y-1 text-[11px] border border-slate-800">
            <div class="flex justify-between items-center">
              <span class="text-slate-400">लाइसेंस नंबर:</span>
              <span class="font-mono font-bold text-amber-400">${dr.dlNumber || 'दर्ज नहीं'}</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-slate-400">लाइसेंस एक्सपायरी:</span>
              <span class="font-mono font-semibold ${dlStat.color}">${dr.dlExpiry || '-'} [${dlStat.label}]</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-slate-400">आधार नंबर:</span>
              <span class="font-mono text-slate-300">${dr.aadhaarNumber || '-'}</span>
            </div>
            <div class="flex justify-between items-center pt-1 border-t border-slate-800/80">
              <span class="text-slate-400 font-bold">ड्राइवर खाता (एडवांस बाकी):</span>
              <span class="font-mono font-black text-xs ${advanceBal > 0 ? 'text-rose-400' : 'text-emerald-400'}">₹${advanceBal.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <div class="flex flex-wrap items-center justify-between gap-1.5 pt-1 border-t border-slate-800">
            <div class="flex gap-1">
              ${phoneClean ? `
                <a href="tel:${phoneClean}" class="btn btn-secondary py-1 px-2 text-[11px] text-emerald-400">
                  📞 कॉल
                </a>
                <a href="https://wa.me/91${phoneClean}" target="_blank" class="btn btn-secondary py-1 px-2 text-[11px] text-sky-400">
                  💬 WhatsApp
                </a>
              ` : ''}
            </div>
            <div class="flex gap-1">
              <button class="btn btn-secondary py-1 px-2 text-[11px] btn-give-driver-advance" data-id="${dr.id}" data-name="${dr.name}">
                💵 एडवांस दें
              </button>
              <button class="btn btn-secondary py-1 px-2 text-[11px] btn-edit-driver-details" data-id="${dr.id}">
                ✏️ एडिट
              </button>
            </div>
          </div>
        </div>
      `;
    }).join("");
  };

  const bindEvents = () => {
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

    // Tab toggle events
    document.getElementById("toggle-tab-vehicles")?.addEventListener("click", () => {
      activeTab = "VEHICLES";
      activeFilter = "ALL";
      renderContent();
    });

    document.getElementById("toggle-tab-drivers")?.addEventListener("click", () => {
      activeTab = "DRIVERS";
      activeFilter = "ALL";
      renderContent();
    });

    // Filter pills
    containerEl.querySelectorAll(".fleet-filter-pill").forEach(btn => {
      btn.addEventListener("click", () => {
        activeFilter = btn.dataset.filter;
        renderContent();
      });
    });

    // Add button
    document.getElementById("btn-add-fleet-item")?.addEventListener("click", () => {
      if (activeTab === "VEHICLES") {
        openVehicleModal(null, openModal, closeModal, containerEl, onNavigate);
      } else {
        openDriverModal(null, openModal, closeModal, containerEl, onNavigate);
      }
    });

    // Edit Vehicle
    containerEl.querySelectorAll(".btn-edit-vehicle").forEach(btn => {
      btn.addEventListener("click", () => {
        const v = vehicles.find(item => item.regNumber === btn.dataset.reg);
        if (v) openVehicleModal(v, openModal, closeModal, containerEl, onNavigate);
      });
    });

    // Edit Driver
    containerEl.querySelectorAll(".btn-edit-driver-details").forEach(btn => {
      btn.addEventListener("click", () => {
        const dr = drivers.find(item => item.id === btn.dataset.id);
        if (dr) openDriverModal(dr, openModal, closeModal, containerEl, onNavigate);
      });
    });

    // Give Advance to Driver (deducts from Galla)
    containerEl.querySelectorAll(".btn-give-driver-advance").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.id;
        const name = btn.dataset.name;
        openModal(`
          <h3 class="text-base font-bold text-white mb-1">ड्राइवर को एडवांस दें</h3>
          <p class="text-xs text-slate-400 mb-3">ड्राइवर: <strong class="text-amber-400">${name}</strong> (गल्ले से निकासी)</p>

          <form id="form-drv-adv" class="space-y-3 text-xs">
            <div>
              <label class="form-label">एडवांस राशि (₹) *</label>
              <input type="number" id="adv-drv-amount" class="form-input text-lg font-mono font-bold text-rose-400" placeholder="उदा. 2000" required autofocus>
            </div>
            <div>
              <label class="form-label">माध्यम</label>
              <select id="adv-drv-mode" class="form-select">
                <option value="CASH">रोकड़ / Cash (गल्ले से निकासी)</option>
                <option value="ONLINE">ऑनलाइन ट्रांसफर / UPI</option>
              </select>
            </div>
            <div>
              <label class="form-label">कारण / विवरण</label>
              <input type="text" id="adv-drv-remark" class="form-input" placeholder="उदा. रास्ते का खर्चा / डीजल">
            </div>
            <div class="flex gap-2 pt-1">
              <button type="submit" class="btn btn-primary flex-1 py-2 font-bold">एडवांस दर्ज करें</button>
              <button type="button" id="btn-cancel-adv" class="btn btn-secondary py-2">रद्द करें</button>
            </div>
          </form>
        `);

        document.getElementById("btn-cancel-adv")?.addEventListener("click", closeModal);
        document.getElementById("form-drv-adv")?.addEventListener("submit", async (e) => {
          e.preventDefault();
          const amt = Number(document.getElementById("adv-drv-amount").value);
          const mode = document.getElementById("adv-drv-mode").value;
          const remarks = document.getElementById("adv-drv-remark").value;

          if (amt <= 0) return;

          try {
            const drRef = doc(db, "drivers", id);
            const drSnap = await getDoc(drRef);
            if (drSnap.exists()) {
              const currentBal = Number(drSnap.data().advanceBalance) || 0;
              await setDoc(drRef, { 
                advanceBalance: currentBal + amt,
                updatedAt: new Date().toISOString()
              }, { merge: true });
            }

            if (mode === "CASH") {
              await addGallaTransaction({
                type: "OUT",
                amount: amt,
                category: CASHFLOW_CATEGORIES.DRIVER_ADVANCE || "DRIVER_EXPENSE",
                referenceId: id,
                remarks: `Driver Advance: ${name} - ${remarks}`
              });
            }

            alert(`₹${amt} का एडवांस सफलतापूर्वक दर्ज हुआ!`);
            closeModal();
            renderFleetView(containerEl, onNavigate);
          } catch (err) {
            alert("एरर: " + err.message);
          }
        });
      });
    });
  };

  renderContent();
}

/**
 * 1. DRIVER MODAL (ADD / EDIT)
 */
function openDriverModal(driver, openModal, closeModal, containerEl, onNavigate) {
  const isEdit = !!driver;

  const html = `
    <div class="max-h-[85vh] overflow-y-auto pr-1 text-xs">
      <h3 class="text-base font-bold text-white mb-1">${isEdit ? 'ड्राइवर व DL विवरण एडिट करें' : 'नया ड्राइवर जोड़ें'}</h3>
      <p class="text-slate-400 text-[11px] mb-3">ड्राइवर की व्यक्तिगत जानकारी, लाइसेंस व दैनिक भत्ता दर्ज करें।</p>

      <form id="form-manage-dr" class="space-y-3">
        <div class="bg-slate-950/50 p-2.5 rounded-xl border border-slate-800 space-y-2">
          <span class="text-amber-400 font-bold block text-[10px] uppercase">1. व्यक्तिगत जानकारी</span>
          
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="form-labe
