// js/views/fleet-view.js
// Aadesh Tours Udaipur - Gaadi, RTO Papers, Expiry Alert & Driver Controller (Master Phase)

import { db } from "../config/firebase-config.js";
import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  deleteDoc 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// 1. RTO Document Status & Alert Engine
function checkPaperExpiry(dateStr) {
  if (!dateStr) {
    return { label: "अपंजीकृत", color: "text-slate-500", days: null, isAlert: false };
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expDate = new Date(dateStr);
  expDate.setHours(0, 0, 0, 0);

  const diffDays = Math.ceil((expDate - today) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { 
      label: `समाप्त (${Math.abs(diffDays)} दिन पूर्व)`, 
      color: "text-rose-400 font-bold", 
      days: diffDays, 
      isAlert: true,
      alertLevel: "EXPIRED"
    };
  } else if (diffDays <= 30) {
    return { 
      label: `${diffDays} दिन शेष`, 
      color: "text-amber-400 font-bold", 
      days: diffDays, 
      isAlert: true,
      alertLevel: "EXPIRING_SOON"
    };
  } else {
    return { 
      label: "मान्य (OK)", 
      color: "text-emerald-400 font-semibold", 
      days: diffDays, 
      isAlert: false,
      alertLevel: "VALID"
    };
  }
}

export async function renderFleetView(containerEl, onNavigate) {
  let vehicles = [];
  let drivers = [];
  let currentTab = "VEHICLES"; // 'VEHICLES' ya 'DRIVERS'
  let activeFilter = "ALL";     // 'ALL', 'ACTIVE', 'ALERTS'

  // Fetch Vehicles directly from Firestore
  try {
    const vSnap = await getDocs(collection(db, "vehicles"));
    vehicles = vSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.warn("Vehicles fetch error:", err);
    vehicles = [];
  }

  // Fetch Drivers directly from Firestore
  try {
    const dSnap = await getDocs(collection(db, "drivers"));
    drivers = dSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.warn("Drivers fetch error:", err);
    drivers = [];
  }

  const renderContent = () => {
    // 1. Calculate Vehicle Alerts (Insurance, Fitness, Permit, PUC, Road Tax)
    let vehicleAlertCount = 0;
    vehicles.forEach(v => {
      const d = v.documents || {};
      const dates = [d.insuranceExpiry, d.fitnessExpiry, d.permitExpiry, d.pucExpiry, d.taxExpiry];
      const hasAnyAlert = dates.some(dt => dt && checkPaperExpiry(dt).isAlert);
      if (hasAnyAlert) vehicleAlertCount++;
    });

    // 2. Calculate Driver DL Alerts
    let driverAlertCount = 0;
    drivers.forEach(dr => {
      if (dr.dlExpiry && checkPaperExpiry(dr.dlExpiry).isAlert) {
        driverAlertCount++;
      }
    });

    const isVeh = currentTab === "VEHICLES";
    const vehTabClass = isVeh ? "bg-amber-500 text-slate-950 font-black shadow-md" : "bg-slate-800 text-slate-400 font-semibold";
    const drvTabClass = !isVeh ? "bg-amber-500 text-slate-950 font-black shadow-md" : "bg-slate-800 text-slate-400 font-semibold";

    const allBtn = activeFilter === "ALL" ? "bg-amber-500 text-slate-950 font-bold" : "bg-slate-800 text-slate-300";
    const activeBtn = activeFilter === "ACTIVE" ? "bg-amber-500 text-slate-950 font-bold" : "bg-slate-800 text-slate-300";
    const alertsBtn = activeFilter === "ALERTS" ? "bg-rose-500 text-white font-bold" : "bg-slate-800 text-slate-300";

    const currentAlertCount = isVeh ? vehicleAlertCount : driverAlertCount;
    const bodyHtml = isVeh ? renderVehiclesList() : renderDriversList();

    containerEl.innerHTML = `
      <!-- TOP TOGGLE BUTTON: GAADIYAAN VS DRIVERS -->
      <div class="grid grid-cols-2 gap-2 bg-slate-900 p-1.5 rounded-2xl border border-slate-800">
        <button id="fleet-tab-veh" class="py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all ${vehTabClass}">
          <span class="text-sm">🚘</span> गाड़ियां (${vehicles.length})
          ${vehicleAlertCount > 0 ? `<span class="bg-rose-600 text-white text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold">${vehicleAlertCount}</span>` : ''}
        </button>
        <button id="fleet-tab-drv" class="py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all ${drvTabClass}">
          <span class="text-sm">👨‍✈️</span> ड्राइवर लिस्ट (${drivers.length})
          ${driverAlertCount > 0 ? `<span class="bg-rose-600 text-white text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold">${driverAlertCount}</span>` : ''}
        </button>
      </div>

      <!-- HEADER TITLE & ADD BUTTON -->
      <div class="flex items-center justify-between gap-2 pt-1">
        <div>
          <h2 class="text-lg font-black text-white">${isVeh ? 'गाड़ियां व RTO दस्तावेज' : 'ड्राइवर व लाइसेंस लेजर'}</h2>
          <p class="text-[11px] text-slate-400">
            ${isVeh ? `कुल वाहन: <span class="font-mono text-amber-400 font-bold">${vehicles.length}</span> | कागज़ात अलर्ट: <span class="font-mono text-rose-400 font-bold">${vehicleAlertCount}</span>` 
                    : `कुल ड्राइवर: <span class="font-mono text-amber-400 font-bold">${drivers.length}</span> | DL अलर्ट: <span class="font-mono text-rose-400 font-bold">${driverAlertCount}</span>`}
          </p>
        </div>
        <button id="btn-add-item" class="btn btn-primary text-xs py-2 px-3 font-bold shadow-lg">
          ${isVeh ? '+ नई गाड़ी जोड़ें' : '+ नया ड्राइवर जोड़ें'}
        </button>
      </div>

      <!-- FILTER PILLS -->
      <div class="flex gap-1.5 overflow-x-auto pb-1 text-xs">
        <button class="fleet-filter-btn px-3 py-1.5 rounded-lg font-semibold ${allBtn}" data-filter="ALL">
          सभी (${isVeh ? vehicles.length : drivers.length})
        </button>
        <button class="fleet-filter-btn px-3 py-1.5 rounded-lg font-semibold ${activeBtn}" data-filter="ACTIVE">
          ${isVeh ? 'सक्रिय गाड़ियां' : 'उपलब्ध ड्राइवर'}
        </button>
        <button class="fleet-filter-btn px-3 py-1.5 rounded-lg font-semibold ${alertsBtn}" data-filter="ALERTS">
          कागज़ात अलर्ट (${currentAlertCount})
        </button>
      </div>

      <!-- MAIN CARDS LIST -->
      <div class="space-y-3">
        ${bodyHtml}
      </div>
    `;

    bindEvents();
  };

  // 1. VEHICLES LIST WITH FULL 5 RTO PAPERS, ALERT BORDERS & ACTIONS
  const renderVehiclesList = () => {
    let filtered = vehicles;
    if (activeFilter === "ACTIVE") {
      filtered = vehicles.filter(v => v.status === "ACTIVE" || !v.status);
    }
    if (activeFilter === "ALERTS") {
      filtered = vehicles.filter(v => {
        const d = v.documents || {};
        const dates = [d.insuranceExpiry, d.fitnessExpiry, d.permitExpiry, d.pucExpiry, d.taxExpiry];
        return dates.some(dt => dt && checkPaperExpiry(dt).isAlert);
      });
    }

    if (filtered.length === 0) {
      return '<div class="vault-card text-center p-8 text-slate-500 text-xs">कोई गाड़ी रिकॉर्ड नहीं मिला। ऊपर "+ नई गाड़ी जोड़ें" बटन दबाकर गाड़ी दर्ज करें।</div>';
    }

    return filtered.map(v => {
      const d = v.documents || {};
      const ins = checkPaperExpiry(d.insuranceExpiry);
      const fit = checkPaperExpiry(d.fitnessExpiry);
      const pmt = checkPaperExpiry(d.permitExpiry);
      const puc = checkPaperExpiry(d.pucExpiry);
      const tax = checkPaperExpiry(d.taxExpiry);

      const hasAlert = ins.isAlert || fit.isAlert || pmt.isAlert || puc.isAlert || tax.isAlert;
      const borderClass = hasAlert ? "border-l-rose-500 bg-rose-500/5" : "border-l-emerald-500";
      const statusBadge = v.status === "MAINTENANCE" 
        ? '<span class="badge-status badge-danger">वर्कशॉप / मेंटेनेंस</span>' 
        : '<span class="badge-status badge-active">सक्रिय (Active)</span>';

      return `
        <div class="vault-card space-y-2 border-l-4 ${borderClass} text-xs">
          <div class="flex items-center justify-between">
            <div>
              <span class="font-mono text-base font-black text-amber-400 tracking-wider">${v.regNumber}</span>
              <span class="text-slate-300 font-semibold block text-[11px]">${v.makeModel || "Cab"} (${v.seatingCapacity || 4}+1)</span>
            </div>
            <div class="text-right">
              ${statusBadge}
              <span class="badge-status ${v.ownership === 'ATTACHED' ? 'badge-warning' : 'badge-info'} mt-1 block text-right">
                ${v.ownership === 'ATTACHED' ? 'मार्केट अटैच' : 'स्वयं की (OWN)'}
              </span>
              <span class="text-[10px] text-slate-400 font-mono mt-0.5 block">${(v.currentOdometer || 0).toLocaleString('en-IN')} KM</span>
            </div>
          </div>

          <!-- All 5 RTO Documents Expiry Section -->
          <div class="bg-slate-950/70 p-2.5 rounded-xl space-y-1.5 text-[11px] border border-slate-800">
            <div class="flex justify-between items-center">
              <span class="text-slate-400">1. बीमा (Insurance):</span>
              <span class="font-mono ${ins.color}">${d.insuranceExpiry || '-'} [${ins.label}]</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-slate-400">2. फिटनेस (Fitness):</span>
              <span class="font-mono ${fit.color}">${d.fitnessExpiry || '-'} [${fit.label}]</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-slate-400">3. परमिट (Permit):</span>
              <span class="font-mono ${pmt.color}">${d.permitExpiry || '-'} [${pmt.label}]</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-slate-400">4. प्रदूषण (PUC):</span>
              <span class="font-mono ${puc.color}">${d.pucExpiry || '-'} [${puc.label}]</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-slate-400">5. रोड टैक्स (Tax):</span>
              <span class="font-mono ${tax.color}">${d.taxExpiry || '-'} [${tax.label}]</span>
            </div>
          </div>

          <!-- Bottom Action Buttons: Edit and Delete -->
          <div class="flex items-center justify-between pt-1 border-t border-slate-800 text-[11px]">
            <span class="text-slate-400">ईंधन: <strong class="text-slate-200">${v.fuelType || 'DIESEL'}</strong></span>
            <div class="flex gap-1.5">
              <button class="btn btn-secondary text-xs py-1 px-2.5 btn-edit-veh" data-reg="${v.regNumber}">
                ✏️ पेपर व डिटेल एडिट
              </button>
              <button class="btn btn-danger text-xs py-1 px-2.5 btn-delete-veh" data-reg="${v.regNumber}">
                🗑️ डिलीट
              </button>
            </div>
          </div>
        </div>
      `;
    }).join("");
  };

  // 2. DRIVERS LIST WITH DL ALERT & ACTIONS
  const renderDriversList = () => {
    let filtered = drivers;
    if (activeFilter === "ACTIVE") filtered = drivers.filter(dr => dr.status === "ACTIVE" || !dr.status);
    if (activeFilter === "ALERTS") filtered = drivers.filter(dr => dr.dlExpiry && checkPaperExpiry(dr.dlExpiry).isAlert);

    if (filtered.length === 0) {
      return '<div class="vault-card text-center p-8 text-slate-500 text-xs">कोई ड्राइवर रिकॉर्ड नहीं मिला। ऊपर "+ नया ड्राइवर जोड़ें" से नया ड्राइवर रजिस्टर करें।</div>';
    }

    return filtered.map(dr => {
      const dlStat = checkPaperExpiry(dr.dlExpiry);
      const borderClass = dlStat.isAlert ? "border-l-rose-500 bg-rose-500/5" : "border-l-emerald-500";
      const statusBadge = dr.status === "ON_DUTY" 
        ? '<span class="badge-status badge-warning">ड्यूटी पर</span>' 
        : (dr.status === "LEAVE" ? '<span class="badge-status badge-danger">छुट्टी पर</span>' : '<span class="badge-status badge-active">उपलब्ध</span>');

      const phoneClean = (dr.phone || "").replace(/\D/g, "");
      const advBal = Number(dr.advanceBalance) || 0;

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

          <div class="bg-slate-950/70 p-2.5 rounded-xl space-y-1 text-[11px] border border-slate-800">
            <div class="flex justify-between items-center">
              <span class="text-slate-400">लाइसेंस नंबर:</span>
              <span class="font-mono font-bold text-amber-400">${dr.dlNumber || 'दर्ज नहीं'}</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-slate-400">लाइसेंस एक्सपायरी:</span>
              <span class="font-mono ${dlStat.color}">${dr.dlExpiry || '-'} [${dlStat.label}]</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-slate-400">आधार नंबर:</span>
              <span class="font-mono text-slate-300">${dr.aadhaarNumber || '-'}</span>
            </div>
            <div class="flex justify-between items-center pt-1 border-t border-slate-800/80">
              <span class="text-slate-400 font-bold">ड्राइवर एडवांस बाकी:</span>
              <span class="font-mono font-black text-xs ${advBal > 0 ? 'text-rose-400' : 'text-emerald-400'}">₹${advBal.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <div class="flex items-center justify-between pt-1 border-t border-slate-800">
            <div class="flex gap-1">
              ${phoneClean ? `
                <a href="tel:${phoneClean}" class="btn btn-secondary py-1 px-2 text-[11px] text-emerald-400">📞 कॉल</a>
                <a href="https://wa.me/91${phoneClean}" target="_blank" class="btn btn-secondary py-1 px-2 text-[11px] text-sky-400">💬 WA</a>
              ` : ''}
            </div>
            <div class="flex gap-1.5">
              <button class="btn btn-secondary text-xs py-1 px-2.5 btn-edit-drv" data-id="${dr.id}">
                ✏️ एडिट
              </button>
              <button class="btn btn-danger text-xs py-1 px-2 btn-delete-drv" data-id="${dr.id}" data-name="${dr.name}">
                🗑️
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

    // Sub-tab toggles
    document.getElementById("fleet-tab-veh")?.addEventListener("click", () => {
      currentTab = "VEHICLES";
      activeFilter = "ALL";
      renderContent();
    });

    document.getElementById("fleet-tab-drv")?.addEventListener("click", () => {
      currentTab = "DRIVERS";
      activeFilter = "ALL";
      renderContent();
    });

    // Filter pills
    containerEl.querySelectorAll(".fleet-filter-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        activeFilter = btn.dataset.filter;
        renderContent();
      });
    });

    // Add button
    document.getElementById("btn-add-item")?.addEventListener("click", () => {
      if (currentTab === "VEHICLES") {
        openVehicleModal(null, openModal, closeModal, containerEl, onNavigate);
      } else {
        openDriverModal(null, openModal, closeModal, containerEl, onNavigate);
      }
    });

    // Edit Vehicle
    containerEl.querySelectorAll(".btn-edit-veh").forEach(btn => {
      btn.addEventListener("click", () => {
        const v = vehicles.find(item => item.regNumber === btn.dataset.reg);
        if (v) openVehicleModal(v, openModal, closeModal, containerEl, onNavigate);
      });
    });

    // Delete Vehicle
    containerEl.querySelectorAll(".btn-delete-veh").forEach(btn => {
      btn.addEventListener("click", async () => {
        const reg = btn.dataset.reg;
        if (confirm(`क्या आप सच में गाड़ी ${reg} को डिलीट करना चाहते हैं?`)) {
          try {
            await deleteDoc(doc(db, "vehicles", reg));
            alert(`गाड़ी ${reg} सफलतापूर्वक डिलीट हो गई।`);
            renderFleetView(containerEl, onNavigate);
          } catch (err) {
            alert("डिलीट करने में त्रुटि: " + err.message);
          }
        }
      });
    });

    // Edit Driver
    containerEl.querySelectorAll(".btn-edit-drv").forEach(btn => {
      btn.addEventListener("click", () => {
        const dr = drivers.find(item => item.id === btn.dataset.id);
        if (dr) openDriverModal(dr, openModal, closeModal, containerEl, onNavigate);
      });
    });

    // Delete Driver
    containerEl.querySelectorAll(".btn-delete-drv").forEach(btn => {
      btn.addEventListener("click", async () => {
        const id = btn.dataset.id;
        const name = btn.dataset.name;
        if (confirm(`क्या आप ड्राइवर "${name}" को डिलीट करना चाहते हैं?`)) {
          try {
            await deleteDoc(doc(db, "drivers", id));
            alert(`ड्राइवर ${name} सफलतापूर्वक डिलीट हो गया।`);
            renderFleetView(containerEl, onNavigate);
          } catch (err) {
            alert("डिलीट करने में त्रुटि: " + err.message);
          }
        }
      });
    });
  };

  renderContent();
}

/**
 * COMPLETE VEHICLE MODAL (ADD / EDIT ALL 5 RTO PAPERS)
 */
function openVehicleModal(vehicle, openModal, closeModal, containerEl, onNavigate) {
  const isEdit = !!vehicle;
  const docs = (vehicle && vehicle.documents) || {};

  const html = `
    <div class="max-h-[85vh] overflow-y-auto pr-1 text-xs">
      <h3 class="text-base font-bold text-white mb-1">${isEdit ? 'गाड़ी व RTO पेपर एडिट करें' : 'नई गाड़ी जोड़ें'}</h3>
      <p class="text-slate-400 text-[11px] mb-3">वाहन विवरण और 5 मुख्य RTO एक्सपायरी तारीखें दर्ज करें।</p>

      <form id="form-manage-vehicle" class="space-y-3">
        <!-- 1. Basic Info -->
        <div class="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 space-y-2">
          <span class="text-amber-400 font-bold block text-[10px] uppercase tracking-wider">1. वाहन विवरण</span>
          
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="form-label">गाड़ी नंबर *</label>
              <input type="text" id="v-reg" class="form-input font-mono uppercase font-bold text-amber-400" placeholder="RJ27 TA 1234" value="${vehicle ? vehicle.regNumber : ''}" ${isEdit ? 'readonly' : 'required'} autofocus>
            </div>
            <div>
              <label class="form-label">मॉडल (Make & Model) *</label>
              <input type="text" id="v-model" class="form-input font-bold" placeholder="Innova / Dzire" value="${vehicle ? (vehicle.makeModel || '') : ''}" required>
            </div>
          </div>

          <div class="grid grid-cols-3 gap-2">
            <div>
              <label class="form-label">ईंधन (Fuel)</label>
              <select id="v-fuel" class="form-select">
                <option value="DIESEL" ${vehicle && vehicle.fuelType === 'DIESEL' ? 'selected' : ''}>डीजल (Diesel)</option>
                <option value="PETROL" ${vehicle && vehicle.fuelType === 'PETROL' ? 'selected' : ''}>पेट्रोल (Petrol)</option>
                <option value="CNG" ${vehicle && vehicle.fuelType === 'CNG' ? 'selected' : ''}>CNG</option>
              </select>
            </div>
            <div>
              <label class="form-label">सीट क्षमता</label>
              <input type="number" id="v-seats" class="form-input font-mono text-center font-bold" value="${vehicle ? (vehicle.seatingCapacity || 4) : 4}">
            </div>
            <div>
              <label class="form-label">वर्तमान मीटर (KM)</label>
              <input type="number" id="v-odo" class="form-input font-mono font-bold text-emerald-400 text-center" value="${vehicle ? (vehicle.currentOdometer || 0) : 0}">
            </div>
          </div>

          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="form-label">स्वामित्व (Ownership)</label>
              <select id="v-ownership" class="form-select">
                <option value="OWN" ${vehicle && vehicle.ownership === 'OWN' ? 'selected' : ''}>स्वयं की गाड़ी (OWN)</option>
                <option value="ATTACHED" ${vehicle && vehicle.ownership === 'ATTACHED' ? 'selected' : ''}>मार्केट अटैच (Attached)</option>
              </select>
            </div>
            <div>
              <label class="form-label">वाहन स्थिति</label>
              <select id="v-status" class="form-select">
                <option value="ACTIVE" ${!vehicle || vehicle.status === 'ACTIVE' ? 'selected' : ''}>सक्रिय / चलने हेतु तैयार</option>
                <option value="MAINTENANCE" ${vehicle && vehicle.status === 'MAINTENANCE' ? 'selected' : ''}>वर्कशॉप / मेंटेनेंस में</option>
              </select>
            </div>
          </div>
        </div>

        <!-- 2. All 5 RTO Documents Expiry -->
        <div class="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 space-y-2">
          <span class="text-amber-400 font-bold block text-[10px] uppercase tracking-wider">2. RTO दस्तावेज एक्सपायरी तारीखें</span>
          
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="form-label">बीमा समाप्ति (Insurance Expiry)</label>
              <input type="date" id="doc-ins" class="form-input font-mono font-bold" value="${docs.insuranceExpiry || ''}">
            </div>
            <div>
              <label class="form-label">फिटनेस समाप्ति (Fitness Expiry)</label>
              <input type="date" id="doc-fit" class="form-input font-mono font-bold" value="${docs.fitnessExpiry || ''}">
            </div>
          </div>

          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="form-label">परमिट समाप्ति (Permit Expiry)</label>
              <input type="date" id="doc-pmt" class="form-input font-mono font-bold" value="${docs.permitExpiry || ''}">
            </div>
            <div>
              <label class="form-label">प्रदूषण समाप्ति (PUC Expiry)</label>
              <input type="date" id="doc-puc" class="form-input font-mono font-bold" value="${docs.pucExpiry || ''}">
            </div>
          </div>

          <div>
            <label class="form-label">रोड टैक्स समाप्ति (Road Tax Expiry)</label>
            <input type="date" id="doc-tax" class="form-input font-mono font-bold" value="${docs.taxExpiry || ''}">
          </div>
        </div>

        <div class="flex gap-2 pt-1">
          <button type="submit" class="btn btn-primary flex-1 py-2.5 font-bold">
            ${isEdit ? 'बदलाव सुरक्षित करें' : 'गाड़ी व पेपर सेव करें'}
          </button>
          <button type="button" id="btn-cancel-veh-modal" class="btn btn-secondary py-2.5">रद्द करें</button>
        </div>
      </form>
    </div>
  `;

  openModal(html);
  document.getElementById("btn-cancel-veh-modal")?.addEventListener("click", closeModal);

  document.getElementById("form-manage-vehicle")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const regNumber = document.getElementById("v-reg").value.trim().toUpperCase();
    const makeModel = document.getElementById("v-model").value.trim();
    const fuelType = document.getElementById("v-fuel").value;
    const seatingCapacity = Number(document.getElementById("v-seats").value) || 4;
    const currentOdometer = Number(document.getElementById("v-odo").value) || 0;
    const ownership = document.getElementById("v-ownership").value;
    const status = document.getElementById("v-status").value;

    const documents = {
      insuranceExpiry: document.getElementById("doc-ins").value || null,
      fitnessExpiry: document.getElementById("doc-fit").value || null,
      permitExpiry: document.getElementById("doc-pmt").value || null,
      pucExpiry: document.getElementById("doc-puc").value || null,
      taxExpiry: document.getElementById("doc-tax").value || null
    };

    const payload = {
      regNumber,
      makeModel,
      fuelType,
      seatingCapacity,
      currentOdometer,
      ownership,
      status,
      documents,
      updatedAt: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, "vehicles", regNumber), payload, { merge: true });
      alert(`गाड़ी ${regNumber} और उसके कागजात सफलतापूर्वक सेव हो गए!`);
      closeModal();
      renderFleetView(containerEl, onNavigate);
    } catch (err) {
      alert("गाड़ी सेव करने में त्रुटि: " + err.message);
    }
  });
}

/**
 * COMPLETE DRIVER MODAL (ADD / EDIT)
 */
function openDriverModal(driver, openModal, closeModal, containerEl, onNavigate) {
  const isEdit = !!driver;

  const html = `
    <div class="max-h-[85vh] overflow-y-auto pr-1 text-xs">
      <h3 class="text-base font-bold text-white mb-1">${isEdit ? 'ड्राइवर व DL विवरण एडिट करें' : 'नया ड्राइवर जोड़ें'}</h3>
      <p class="text-slate-400 text-[11px] mb-3">ड्राइवर की व्यक्तिगत जानकारी, लाइसेंस एक्सपायरी व दैनिक भत्ता दर्ज करें।</p>

      <form id="form-manage-driver" class="space-y-3">
        <div class="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 space-y-2">
          <span class="text-amber-400 font-bold block text-[10px] uppercase tracking-wider">1. व्यक्तिगत जानकारी</span>
          
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="form-label">ड्राइवर का नाम *</label>
              <input type="text" id="dr-name" class="form-input font-bold" placeholder="उदा. रमेश कुमार" value="${driver ? driver.name : ''}" required autofocus>
            </div>
            <div>
              <label class="form-label">मोबाइल नंबर *</label>
              <input type="tel" id="dr-phone" class="form-input font-mono font-bold text-emerald-400" placeholder="9876543210" value="${driver ? (driver.phone || '') : ''}" required>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="form-label">व्हाट्सएप / अन्य नंबर</label>
              <input type="tel" id="dr-alt" class="form-input font-mono" placeholder="वैकल्पिक नंबर" value="${driver ? (driver.altPhone || '') : ''}">
            </div>
            <div>
              <label class="form-label">आधार कार्ड नंबर</label>
              <input type="text" id="dr-aadhaar" class="form-input font-mono" placeholder="XXXX XXXX XXXX" value="${driver ? (driver.aadhaarNumber || '') : ''}">
            </div>
          </div>

          <div>
            <label class="form-label">स्थायी पता (Home Address)</label>
            <textarea id="dr-addr" class="form-input h-12 resize-none" placeholder="घर का पता">${driver ? (driver.address || '') : ''}</textarea>
          </div>
        </div>

        <div class="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 space-y-2">
          <span class="text-amber-400 font-bold block text-[10px] uppercase tracking-wider">2. ड्राइविंग लाइसेंस व RTO एक्सपायरी</span>
          
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="form-label">ड्राइविंग लाइसेंस (DL No.) *</label>
              <input type="text" id="dr-dl" class="form-input font-mono uppercase font-bold text-amber-400" placeholder="RJ27 20180012345" value="${driver ? (driver.dlNumber || '') : ''}" required>
            </div>
            <div>
              <label class="form-label">लाइसेंस समाप्ति (DL Expiry) *</label>
              <input type="date" id="dr-exp" class="form-input font-mono font-bold" value="${driver ? (driver.dlExpiry || '') : ''}" required>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="form-label">बैज नंबर (यदि कॉमर्शियल हो)</label>
              <input type="text" id="dr-badge" class="form-input font-mono uppercase" placeholder="बैज नंबर" value="${driver ? (driver.badgeNumber || '') : ''}">
            </div>
            <div>
              <label class="form-label">स्थिति (Status)</label>
              <select id="dr-stat" class="form-select">
                <option value="ACTIVE" ${!driver || driver.status === 'ACTIVE' ? 'selected' : ''}>उपलब्ध (Ready)</option>
                <option value="ON_DUTY" ${driver && driver.status === 'ON_DUTY' ? 'selected' : ''}>ड्यूटी पर (On Duty)</option>
                <option value="LEAVE" ${driver && driver.status === 'LEAVE' ? 'selected' : ''}>छुट्टी पर (On Leave)</option>
              </select>
            </div>
          </div>
        </div>

        <div class="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 space-y-2">
          <span class="text-amber-400 font-bold block text-[10px] uppercase tracking-wider">3. दैनिक भत्ता व खाता</span>
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="form-label">दैनिक ड्राइवर भत्ता (₹/दिन)</label>
              <input type="number" id="dr-bhatta" class="form-input font-mono font-bold text-amber-400" value="${driver ? (driver.dailyBhatta || 300) : 300}">
            </div>
            <div>
              <label class="form-label">वर्तमान एडवांस बाकी (₹)</label>
              <input type="number" id="dr-adv" class="form-input font-mono font-bold text-rose-400" value="${driver ? (driver.advanceBalance || 0) : 0}">
            </div>
          </div>
        </div>

        <div class="flex gap-2 pt-1">
          <button type="submit" class="btn btn-primary flex-1 py-2.5 font-bold">
            ${isEdit ? 'बदलाव सुरक्षित करें' : 'ड्राइवर सेव करें'}
          </button>
          <button type="button" id="btn-cancel-dr-modal" class="btn btn-secondary py-2.5">रद्द करें</button>
        </div>
      </form>
    </div>
  `;

  openModal(html);
  document.getElementById("btn-cancel-dr-modal")?.addEventListener("click", closeModal);

  document.getElementById("form-manage-driver")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("dr-name").value.trim();
    const phone = document.getElementById("dr-phone").value.trim();
    const altPhone = document.getElementById("dr-alt").value.trim();
    const aadhaarNumber = document.getElementById("dr-aadhaar").value.trim();
    const address = document.getElementById("dr-addr").value.trim();
    const dlNumber = document.getElementById("dr-dl").value.trim().toUpperCase();
    const dlExpiry = document.getElementById("dr-exp").value;
    const badgeNumber = document.getElementById("dr-badge").value.trim();
    const status = document.getElementById("dr-stat").value;
    const dailyBhatta = Number(document.getElementById("dr-bhatta").value) || 300;
    const advanceBalance = Number(document.getElementById("dr-adv").value) || 0;

    const id = driver ? (driver.id || phone) : ("DRV-" + phone.slice(-6));

    const payload = {
      id,
      name,
      phone,
      altPhone,
      aadhaarNumber,
      address,
      dlNumber,
      dlExpiry,
      badgeNumber,
      status,
      dailyBhatta,
      advanceBalance,
      updatedAt: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, "drivers", id), payload, { merge: true });
      alert(`ड्राइवर ${name} का डेटा सुरक्षित हो गया!`);
      closeModal();
      renderFleetView(containerEl, onNavigate);
    } catch (err) {
      alert("एरर: " + err.message);
    }
  });
}
