// js/views/fleet-view.js
// Aadesh Tours Udaipur - Fleet & RTO Documents Master (Phase 26 - Full Papers Update)

import * as fleetService from "../services/fleet-service.js";

/**
 * Helper to calculate paper status & days left
 */
function getPaperStatus(dateStr) {
  if (!dateStr) return { label: "अपंजीकृत", color: "text-slate-500", bg: "bg-slate-800", days: null, isAlert: false };
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expDate = new Date(dateStr);
  expDate.setHours(0, 0, 0, 0);

  const diffTime = expDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { label: `समाप्त (${Math.abs(diffDays)} दिन पूर्व)`, color: "text-rose-400", bg: "bg-rose-500/10 border-rose-500/30", days: diffDays, status: "EXPIRED", isAlert: true };
  } else if (diffDays <= 30) {
    return { label: `${diffDays} दिन शेष`, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/30", days: diffDays, status: "EXPIRING_SOON", isAlert: true };
  } else {
    return { label: "मान्य (OK)", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/30", days: diffDays, status: "VALID", isAlert: false };
  }
}

/**
 * 1. Render Complete Fleet & Vehicle Management View
 */
export async function renderFleetView(containerEl, onNavigate) {
  const fetchFn = fleetService.getAllVehicles || fleetService.getVehicles;
  const vehiclesResult = fetchFn ? await fetchFn().catch(() => []) : [];
  const vehicles = Array.isArray(vehiclesResult) ? vehiclesResult : [];

  let activeFilter = "ALL"; // 'ALL', 'ACTIVE', 'ALERTS'

  const renderContent = () => {
    // Check total alerts across all vehicles
    let totalRtoAlerts = 0;
    vehicles.forEach(v => {
      const papers = v.documents || {};
      const checks = [papers.insuranceExpiry, papers.fitnessExpiry, papers.permitExpiry, papers.pucExpiry, papers.taxExpiry];
      const hasIssue = checks.some(d => {
        if (!d) return false;
        const st = getPaperStatus(d);
        return st.isAlert;
      });
      if (hasIssue) totalRtoAlerts++;
    });

    let filtered = vehicles;
    if (activeFilter === "ACTIVE") filtered = vehicles.filter(v => v.status === "ACTIVE" || !v.status);
    if (activeFilter === "ALERTS") {
      filtered = vehicles.filter(v => {
        const papers = v.documents || {};
        const checks = [papers.insuranceExpiry, papers.fitnessExpiry, papers.permitExpiry, papers.pucExpiry, papers.taxExpiry];
        return checks.some(d => d && getPaperStatus(d).isAlert);
      });
    }

    const allBtnClass = activeFilter === "ALL" ? "bg-amber-500 text-slate-950 font-bold" : "bg-slate-800 text-slate-300";
    const activeBtnClass = activeFilter === "ACTIVE" ? "bg-amber-500 text-slate-950 font-bold" : "bg-slate-800 text-slate-300";
    const alertsBtnClass = activeFilter === "ALERTS" ? "bg-rose-500 text-white font-bold" : "bg-slate-800 text-slate-300";

    let vehicleCardsHtml = "";
    if (filtered.length === 0) {
      vehicleCardsHtml = '<div class="vault-card text-center p-8 text-slate-500 text-xs">कोई गाड़ी रिकॉर्ड नहीं मिला। ऊपर दिए गए बटन से नई गाड़ी जोड़ें।</div>';
    } else {
      vehicleCardsHtml = '<div class="grid grid-cols-1 md:grid-cols-2 gap-3">' + filtered.map(v => {
        const docs = v.documents || {};
        const insStatus = getPaperStatus(docs.insuranceExpiry);
        const fitStatus = getPaperStatus(docs.fitnessExpiry);
        const pmtStatus = getPaperStatus(docs.permitExpiry);
        const pucStatus = getPaperStatus(docs.pucExpiry);
        const taxStatus = getPaperStatus(docs.taxExpiry);

        const hasAnyAlert = insStatus.isAlert || fitStatus.isAlert || pmtStatus.isAlert || pucStatus.isAlert || taxStatus.isAlert;
        const borderClass = hasAnyAlert ? "border-l-4 border-l-rose-500" : "border-l-4 border-l-emerald-500";

        return `
          <div class="vault-card space-y-3 ${borderClass}">
            <div class="flex items-center justify-between">
              <div>
                <span class="font-mono text-base font-black text-amber-400 tracking-wider">${v.regNumber}</span>
                <span class="text-xs text-slate-300 font-semibold block">${v.makeModel || "Taxi Vehicle"} (${v.seatingCapacity || 4}+1)</span>
              </div>
              <div class="text-right">
                <span class="badge-status ${v.ownership === 'ATTACHED' ? 'badge-warning' : 'badge-active'}">
                  ${v.ownership === 'ATTACHED' ? 'मार्केट अटैच' : 'स्वयं की (OWN)'}
                </span>
                <span class="text-[11px] text-slate-400 block font-mono mt-1">${v.currentOdometer || 0} KM</span>
              </div>
            </div>

            <!-- Paper Expiry Grid -->
            <div class="p-2.5 bg-slate-950/60 rounded-xl space-y-1.5 text-xs border border-slate-800/80">
              <div class="flex items-center justify-between">
                <span class="text-slate-400">बीमा (Insurance):</span>
                <span class="font-mono font-semibold ${insStatus.color}">${docs.insuranceExpiry || '-'} [${insStatus.label}]</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-slate-400">फिटनेस (Fitness):</span>
                <span class="font-mono font-semibold ${fitStatus.color}">${docs.fitnessExpiry || '-'} [${fitStatus.label}]</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-slate-400">परमिट (Permit):</span>
                <span class="font-mono font-semibold ${pmtStatus.color}">${docs.permitExpiry || '-'} [${pmtStatus.label}]</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-slate-400">प्रदूषण (PUC):</span>
                <span class="font-mono font-semibold ${pucStatus.color}">${docs.pucExpiry || '-'} [${pucStatus.label}]</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-slate-400">रोड टैक्स (Tax):</span>
                <span class="font-mono font-semibold ${taxStatus.color}">${docs.taxExpiry || '-'} [${taxStatus.label}]</span>
              </div>
            </div>

            <!-- Footer Action Row -->
            <div class="flex items-center justify-between pt-1 border-t border-slate-800/80 text-xs">
              <span class="text-slate-400 font-mono text-[11px]">ईंधन: ${v.fuelType || 'DIESEL'}</span>
              <div class="flex gap-2">
                <button class="btn btn-secondary text-xs py-1 px-2.5 btn-edit-vehicle" data-reg="${v.regNumber}">
                  पेपर व डिटेल एडिट
                </button>
              </div>
            </div>
          </div>
        `;
      }).join("") + '</div>';
    }

    containerEl.innerHTML = `
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 class="text-xl font-black text-white tracking-wide">गाड़ियां व RTO दस्तावेज</h2>
          <p class="text-xs text-slate-400">कुल वाहन: <span class="font-mono text-amber-400 font-bold">${vehicles.length}</span> | पेपर एक्सपायरी अलर्ट: <span class="font-mono text-rose-400 font-bold">${totalRtoAlerts}</span></p>
        </div>
        <button id="btn-add-vehicle" class="btn btn-primary text-xs sm:text-sm py-2 px-3">
          + नई गाड़ी जोड़ें (Add Vehicle)
        </button>
      </div>

      <!-- Filter Buttons -->
      <div class="flex gap-2 border-b border-slate-800 pb-2">
        <button class="fleet-filter-btn px-3 py-1.5 rounded-lg text-xs font-semibold ${allBtnClass}" data-filter="ALL">
          सभी गाड़ियां (${vehicles.length})
        </button>
        <button class="fleet-filter-btn px-3 py-1.5 rounded-lg text-xs font-semibold ${activeBtnClass}" data-filter="ACTIVE">
          सक्रिय गाड़ियां
        </button>
        <button class="fleet-filter-btn px-3 py-1.5 rounded-lg text-xs font-semibold ${alertsBtnClass}" data-filter="ALERTS">
          कागज़ात अलर्ट (${totalRtoAlerts})
        </button>
      </div>

      ${vehicleCardsHtml}
    `;

    bindFleetEvents();
  };

  const bindFleetEvents = () => {
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

    containerEl.querySelectorAll(".fleet-filter-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        activeFilter = btn.dataset.filter;
        renderContent();
      });
    });

    // 1. ADD NEW VEHICLE MODAL (WITH COMPLETE RTO PAPERS)
    const btnAdd = containerEl.querySelector("#btn-add-vehicle");
    if (btnAdd) {
      btnAdd.addEventListener("click", () => {
        openVehicleModal(null, openModal, closeModal, containerEl, onNavigate);
      });
    }

    // 2. EDIT VEHICLE & PAPERS
    containerEl.querySelectorAll(".btn-edit-vehicle").forEach(btn => {
      btn.addEventListener("click", () => {
        const reg = btn.dataset.reg;
        const vehicle = vehicles.find(v => v.regNumber === reg);
        if (vehicle) {
          openVehicleModal(vehicle, openModal, closeModal, containerEl, onNavigate);
        }
      });
    });
  };

  renderContent();
}

/**
 * 2. Unified Modal for Adding & Editing Vehicle with Full Paper Details
 */
function openVehicleModal(vehicle, openModal, closeModal, containerEl, onNavigate) {
  const isEdit = !!vehicle;
  const docs = (vehicle && vehicle.documents) || {};

  const modalHtml = `
    <div class="max-h-[85vh] overflow-y-auto pr-1">
      <h3 class="text-base font-bold text-white mb-2">
        ${isEdit ? 'गाड़ी व पेपर एडिट करें' : 'नई गाड़ी पंजीकृत करें'}
      </h3>
      <p class="text-xs text-slate-400 mb-3">वाहन की बेसिक जानकारी और RTO एक्सपायरी तारीखें दर्ज करें।</p>

      <form id="form-vehicle-manage" class="space-y-3 text-xs">
        <!-- 1. Basic Vehicle Info -->
        <div class="bg-slate-950/40 p-3 rounded-xl border border-slate-800 space-y-2">
          <span class="text-amber-400 font-bold block uppercase tracking-wider text-[11px]">1. बेसिक वाहन विवरण</span>
          
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="form-label">गाड़ी नंबर (Reg Number) *</label>
              <input type="text" id="veh-reg" class="form-input uppercase font-mono font-bold text-amber-400" 
                     placeholder="RJ27 TA 1234" value="${vehicle ? vehicle.regNumber : ''}" ${isEdit ? 'readonly' : 'required'} autofocus>
            </div>
            <div>
              <label class="form-label">मॉडल (Make & Model) *</label>
              <input type="text" id="veh-model" class="form-input" placeholder="उदा. Innova Crysta / Dzire" 
                     value="${vehicle ? (vehicle.makeModel || '') : ''}" required>
            </div>
          </div>

          <div class="grid grid-cols-3 gap-2">
            <div>
              <label class="form-label">ईंधन प्रकार (Fuel)</label>
              <select id="veh-fuel" class="form-select">
                <option value="DIESEL" ${vehicle && vehicle.fuelType === 'DIESEL' ? 'selected' : ''}>Diesel</option>
                <option value="PETROL" ${vehicle && vehicle.fuelType === 'PETROL' ? 'selected' : ''}>Petrol</option>
                <option value="CNG" ${vehicle && vehicle.fuelType === 'CNG' ? 'selected' : ''}>CNG</option>
                <option value="ELECTRIC" ${vehicle && vehicle.fuelType === 'ELECTRIC' ? 'selected' : ''}>Electric</option>
              </select>
            </div>
            <div>
              <label class="form-label">सीट क्षमता (Seats)</label>
              <input type="number" id="veh-seats" class="form-input font-mono" value="${vehicle ? (vehicle.seatingCapacity || 4) : 4}">
            </div>
            <div>
              <label class="form-label">वर्तमान मीटर (KM)</label>
              <input type="number" id="veh-odo" class="form-input font-mono font-bold text-emerald-400" 
                     value="${vehicle ? (vehicle.currentOdometer || 0) : 0}">
            </div>
          </div>

          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="form-label">स्वामित्व (Ownership)</label>
              <select id="veh-ownership" class="form-select">
                <option value="OWN" ${vehicle && vehicle.ownership === 'OWN' ? 'selected' : ''}>स्वयं की गाड़ी (Self Owned)</option>
                <option value="ATTACHED" ${vehicle && vehicle.ownership === 'ATTACHED' ? 'selected' : ''}>मार्केट अटैच (Attached)</option>
              </select>
            </div>
            <div>
              <label class="form-label">गाड़ी की स्थिति (Status)</label>
              <select id="veh-status" class="form-select">
                <option value="ACTIVE" ${!vehicle || vehicle.status === 'ACTIVE' ? 'selected' : ''}>सक्रिय (Active)</option>
                <option value="MAINTENANCE" ${vehicle && vehicle.status === 'MAINTENANCE' ? 'selected' : ''}>मेंटेनेंस में (Workshop)</option>
                <option value="INACTIVE" ${vehicle && vehicle.status === 'INACTIVE' ? 'selected' : ''}>निष्क्रिय (Inactive)</option>
              </select>
            </div>
          </div>
        </div>

        <!-- 2. RTO Documents & Expiry Dates -->
        <div class="bg-slate-950/40 p-3 rounded-xl border border-slate-800 space-y-2">
          <span class="text-amber-400 font-bold block uppercase tracking-wider text-[11px]">2. RTO कागजात व समाप्ति तारीखें (Paper Expiry)</span>
          
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="form-label">बीमा समाप्ति (Insurance Expiry)</label>
              <input type="date" id="doc-ins-exp" class="form-input font-mono" value="${docs.insuranceExpiry || ''}">
            </div>
            <div>
              <label class="form-label">बीमा पॉलिसी नंबर</label>
              <input type="text" id="doc-ins-no" class="form-input font-mono" placeholder="पॉलिसी नंबर" value="${docs.insurancePolicyNumber || ''}">
            </div>
          </div>

          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="form-label">फिटनेस समाप्ति (Fitness Expiry)</label>
              <input type="date" id="doc-fit-exp" class="form-input font-mono" value="${docs.fitnessExpiry || ''}">
            </div>
            <div>
              <label class="form-label">परमिट समाप्ति (Permit Expiry)</label>
              <input type="date" id="doc-pmt-exp" class="form-input font-mono" value="${docs.permitExpiry || ''}">
            </div>
          </div>

          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="form-label">प्रदूषण समाप्ति (PUC Expiry)</label>
              <input type="date" id="doc-puc-exp" class="form-input font-mono" value="${docs.pucExpiry || ''}">
            </div>
            <div>
              <label class="form-label">रोड टैक्स समाप्ति (Tax Expiry)</label>
              <input type="date" id="doc-tax-exp" class="form-input font-mono" value="${docs.taxExpiry || ''}">
            </div>
          </div>
        </div>

        <!-- Submit & Cancel Buttons -->
        <div class="flex gap-2 pt-2">
          <button type="submit" class="btn btn-primary flex-1 py-2.5">
            ${isEdit ? 'बदलाव सुरक्षित करें' : 'गाड़ी व पेपर सेव करें'}
          </button>
          <button type="button" id="btn-cancel-veh" class="btn btn-secondary py-2.5">रद्द करें</button>
        </div>
      </form>
    </div>
  `;

  openModal(modalHtml);

  document.getElementById("btn-cancel-veh")?.addEventListener("click", closeModal);

  document.getElementById("form-vehicle-manage")?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const regNumber = document.getElementById("veh-reg").value.trim().toUpperCase();
    const makeModel = document.getElementById("veh-model").value.trim();
    const fuelType = document.getElementById("veh-fuel").value;
    const seatingCapacity = Number(document.getElementById("veh-seats").value) || 4;
    const currentOdometer = Number(document.getElementById("veh-odo").value) || 0;
    const ownership = document.getElementById("veh-ownership").value;
    const status = document.getElementById("veh-status").value;

    const documents = {
      insuranceExpiry: document.getElementById("doc-ins-exp").value || null,
      insurancePolicyNumber: document.getElementById("doc-ins-no").value.trim() || null,
      fitnessExpiry: document.getElementById("doc-fit-exp").value || null,
      permitExpiry: document.getElementById("doc-pmt-exp").value || null,
      pucExpiry: document.getElementById("doc-puc-exp").value || null,
      taxExpiry: document.getElementById("doc-tax-exp").value || null
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
      let res;
      if (isEdit) {
        const updateFn = fleetService.updateVehicle || fleetService.editVehicle;
        res = updateFn ? await updateFn(regNumber, payload) : { success: false, message: "अपडेट फंक्शन नहीं मिला" };
      } else {
        payload.createdAt = new Date().toISOString();
        const addFn = fleetService.addVehicle || fleetService.createVehicle;
        res = addFn ? await addFn(payload) : { success: false, message: "सेव फंक्शन नहीं मिला" };
      }

      if (res && (res.success || res.id)) {
        closeModal();
        renderFleetView(containerEl, onNavigate);
      } else {
        alert(res ? res.message : "त्रुटि: गाड़ी डेटा सेव नहीं हो सका");
      }
    } catch (err) {
      alert("एरर: " + err.message);
    }
  });
          }
    
