// js/views/fleet-view.js
// Aadesh Tours Udaipur - Fleet & Driver Master (Ultra-Safe Compact Mode)

import { db } from "../config/firebase-config.js";
import { 
  collection, 
  doc, 
  setDoc, 
  getDocs 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

function getStatus(dateStr) {
  if (!dateStr) return { label: "दर्ज नहीं", color: "text-slate-500", isAlert: false };
  const today = new Date(); today.setHours(0,0,0,0);
  const exp = new Date(dateStr); exp.setHours(0,0,0,0);
  const diff = Math.ceil((exp - today) / (1000 * 60 * 60 * 24));
  if (diff < 0) return { label: `समाप्त (${Math.abs(diff)} दिन पूर्व)`, color: "text-rose-400", isAlert: true };
  if (diff <= 30) return { label: `${diff} दिन शेष`, color: "text-amber-400", isAlert: true };
  return { label: "मान्य (OK)", color: "text-emerald-400", isAlert: false };
}

export async function renderFleetView(containerEl, onNavigate) {
  let vehicles = [];
  let drivers = [];
  let currentTab = "VEHICLES";

  try {
    const vSnap = await getDocs(collection(db, "vehicles"));
    vehicles = vSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (e) { vehicles = []; }

  try {
    const dSnap = await getDocs(collection(db, "drivers"));
    drivers = dSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (e) { drivers = []; }

  const render = () => {
    const isVeh = currentTab === "VEHICLES";
    const vehBtn = isVeh ? "bg-amber-500 text-slate-950 font-bold" : "bg-slate-800 text-slate-400";
    const drvBtn = !isVeh ? "bg-amber-500 text-slate-950 font-bold" : "bg-slate-800 text-slate-400";

    let listHtml = "";
    if (isVeh) {
      listHtml = vehicles.length === 0 
        ? '<div class="vault-card text-center p-6 text-slate-500 text-xs">कोई गाड़ी नहीं मिली।</div>'
        : vehicles.map(v => {
            const d = v.documents || {};
            const ins = getStatus(d.insuranceExpiry);
            const fit = getStatus(d.fitnessExpiry);
            return `
              <div class="vault-card space-y-2 border-l-4 border-l-amber-500 text-xs">
                <div class="flex justify-between items-center">
                  <span class="font-mono font-bold text-amber-400 text-sm">${v.regNumber}</span>
                  <span class="badge-status badge-active">${v.ownership === 'ATTACHED' ? 'अटैच' : 'स्वयं की'}</span>
                </div>
                <div class="bg-slate-950/60 p-2 rounded-lg space-y-1 text-[11px]">
                  <div class="flex justify-between"><span>बीमा (Insurance):</span><span class="${ins.color}">${d.insuranceExpiry || '-'} [${ins.label}]</span></div>
                  <div class="flex justify-between"><span>फिटनेस (Fitness):</span><span class="${fit.color}">${d.fitnessExpiry || '-'} [${fit.label}]</span></div>
                </div>
              </div>
            `;
          }).join("");
    } else {
      listHtml = drivers.length === 0 
        ? '<div class="vault-card text-center p-6 text-slate-500 text-xs">कोई ड्राइवर नहीं मिला। "+ नया ड्राइवर" पर क्लिक करें।</div>'
        : drivers.map(dr => {
            const dl = getStatus(dr.dlExpiry);
            return `
              <div class="vault-card space-y-2 border-l-4 border-l-emerald-500 text-xs">
                <div class="flex justify-between items-center">
                  <span class="font-bold text-white text-sm">👨‍✈️ ${dr.name}</span>
                  <span class="badge-status badge-info">📱 ${dr.phone}</span>
                </div>
                <div class="bg-slate-950/60 p-2 rounded-lg space-y-1 text-[11px]">
                  <div class="flex justify-between"><span>लाइसेंस (DL No):</span><span class="font-mono text-amber-400">${dr.dlNumber || '-'}</span></div>
                  <div class="flex justify-between"><span>DL एक्सपायरी:</span><span class="${dl.color}">${dr.dlExpiry || '-'} [${dl.label}]</span></div>
                  <div class="flex justify-between"><span>दैनिक भत्ता:</span><span class="text-slate-200">₹${dr.dailyBhatta || 300}/दिन</span></div>
                </div>
                <div class="flex justify-end gap-2 pt-1 border-t border-slate-800">
                  <a href="tel:${dr.phone}" class="btn btn-secondary py-1 px-2.5 text-[11px] text-emerald-400">📞 कॉल</a>
                  <a href="https://wa.me/91${(dr.phone||'').replace(/\D/g,'')}" target="_blank" class="btn btn-secondary py-1 px-2.5 text-[11px] text-sky-400">💬 WhatsApp</a>
                </div>
              </div>
            `;
          }).join("");
    }

    containerEl.innerHTML = `
      <div class="grid grid-cols-2 gap-2 bg-slate-900 p-1 rounded-xl">
        <button id="btn-tab-veh" class="py-2 rounded-lg text-xs ${vehBtn}">🚘 गाड़ियां (${vehicles.length})</button>
        <button id="btn-tab-drv" class="py-2 rounded-lg text-xs ${drvBtn}">👨‍✈️ ड्राइवर लिस्ट (${drivers.length})</button>
      </div>

      <div class="flex justify-between items-center pt-1">
        <h2 class="text-base font-black text-white">${isVeh ? 'गाड़ियां सूची' : 'ड्राइवर सूची'}</h2>
        <button id="btn-add-item" class="btn btn-primary text-xs py-1.5 px-3">
          ${isVeh ? '+ नई गाड़ी जोड़ें' : '+ नया ड्राइवर जोड़ें'}
        </button>
      </div>

      <div class="space-y-2.5">${listHtml}</div>
    `;

    document.getElementById("btn-tab-veh")?.addEventListener("click", () => { currentTab = "VEHICLES"; render(); });
    document.getElementById("btn-tab-drv")?.addEventListener("click", () => { currentTab = "DRIVERS"; render(); });
    document.getElementById("btn-add-item")?.addEventListener("click", () => {
      if (currentTab === "VEHICLES") openVehModal(containerEl, onNavigate);
      else openDrvModal(containerEl, onNavigate);
    });
  };

  render();
}

function openVehModal(containerEl, onNavigate) {
  const modal = document.getElementById("modal-container");
  const content = document.getElementById("modal-content");
  modal.classList.remove("hidden");
  content.innerHTML = `
    <h3 class="text-sm font-bold text-white mb-2">नई गाड़ी जोड़ें</h3>
    <form id="f-veh" class="space-y-2 text-xs">
      <div><label class="form-label">गाड़ी नंबर *</label><input type="text" id="v-no" class="form-input font-mono uppercase" placeholder="RJ27 TA 1234" required></div>
      <div><label class="form-label">मॉडल *</label><input type="text" id="v-mod" class="form-input" placeholder="Dzire / Innova" required></div>
      <div class="grid grid-cols-2 gap-2">
        <div><label class="form-label">बीमा एक्सपायरी</label><input type="date" id="v-ins" class="form-input font-mono"></div>
        <div><label class="form-label">फिटनेस एक्सपायरी</label><input type="date" id="v-fit" class="form-input font-mono"></div>
      </div>
      <div class="flex gap-2 pt-2">
        <button type="submit" class="btn btn-primary flex-1 py-2">सेव करें</button>
        <button type="button" onclick="document.getElementById('modal-container').classList.add('hidden')" class="btn btn-secondary py-2">रद्द</button>
      </div>
    </form>
  `;
  document.getElementById("f-veh").onsubmit = async (e) => {
    e.preventDefault();
    const reg = document.getElementById("v-no").value.trim().toUpperCase();
    await setDoc(doc(db, "vehicles", reg), {
      regNumber: reg,
      makeModel: document.getElementById("v-mod").value.trim(),
      documents: {
        insuranceExpiry: document.getElementById("v-ins").value || null,
        fitnessExpiry: document.getElementById("v-fit").value || null
      },
      updatedAt: new Date().toISOString()
    }, { merge: true });
    modal.classList.add("hidden");
    renderFleetView(containerEl, onNavigate);
  };
}

function openDrvModal(containerEl, onNavigate) {
  const modal = document.getElementById("modal-container");
  const content = document.getElementById("modal-content");
  modal.classList.remove("hidden");
  content.innerHTML = `
    <h3 class="text-sm font-bold text-white mb-2">नया ड्राइवर जोड़ें</h3>
    <form id="f-drv" class="space-y-2 text-xs">
      <div><label class="form-label">ड्राइवर का नाम *</label><input type="text" id="d-name" class="form-input" placeholder="ड्राइवर नाम" required></div>
      <div><label class="form-label">मोबाइल नंबर *</label><input type="tel" id="d-phone" class="form-input font-mono" placeholder="9876543210" required></div>
      <div class="grid grid-cols-2 gap-2">
        <div><label class="form-label">लाइसेंस नंबर (DL)</label><input type="text" id="d-dl" class="form-input font-mono uppercase" placeholder="DL नंबर"></div>
        <div><label class="form-label">DL एक्सपायरी तारीख</label><input type="date" id="d-exp" class="form-input font-mono"></div>
      </div>
      <div><label class="form-label">दैनिक भत्ता (₹/दिन)</label><input type="number" id="d-bhatta" class="form-input font-mono" value="300"></div>
      <div class="flex gap-2 pt-2">
        <button type="submit" class="btn btn-primary flex-1 py-2">सेव करें</button>
        <button type="button" onclick="document.getElementById('modal-container').classList.add('hidden')" class="btn btn-secondary py-2">रद्द</button>
      </div>
    </form>
  `;
  document.getElementById("f-drv").onsubmit = async (e) => {
    e.preventDefault();
    const phone = document.getElementById("d-phone").value.trim();
    const id = "DRV-" + phone.slice(-6);
    await setDoc(doc(db, "drivers", id), {
      id,
      name: document.getElementById("d-name").value.trim(),
      phone,
      dlNumber: document.getElementById("d-dl").value.trim().toUpperCase(),
      dlExpiry: document.getElementById("d-exp").value || null,
      dailyBhatta: Number(document.getElementById("d-bhatta").value) || 300,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    modal.classList.add("hidden");
    renderFleetView(containerEl, onNavigate);
  };
}
