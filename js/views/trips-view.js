// js/views/trips-view.js
// Aadesh Tours Udaipur - Trips & Direct Billing Controller

import { db } from "../config/firebase-config.js";
import { 
  collection, doc, setDoc, getDocs, updateDoc 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const BIZ = {
  name: "AADESH TOURS",
  sub: "— UDAIPUR —",
  addr: "Sec. 14, Balicha, Udaipur, (Raj.) 313001",
  mob: "9602842390, 7043195007",
  email: "chetannathsisodiya500@gmail.com",
  tag: "All Type Of Taxi Tourist Cars (a.c. And Non A.c.) 24 Hours Available",
  holder: "CHETAN NATH",
  bank: "State Bank of India",
  acc: "44936542535",
  ifsc: "SBIN0016178",
  upi: "9602842390@upi"
};

export async function renderTripsView(containerEl, onNavigate) {
  let trips = [];
  let vehicles = [];
  let drivers = [];

  try {
    const tSnap = await getDocs(collection(db, "trips"));
    trips = tSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (e) { trips = []; }

  try {
    const vSnap = await getDocs(collection(db, "vehicles"));
    vehicles = vSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (e) { vehicles = []; }

  try {
    const dSnap = await getDocs(collection(db, "drivers"));
    drivers = dSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (e) { drivers = []; }

  let filter = "ALL"; // ALL, ACTIVE, BILLED

  const renderContent = () => {
    let activeTrips = trips.filter(t => t.status === "ACTIVE");
    let billedTrips = trips.filter(t => t.status === "BILLED" || t.status === "COMPLETED");

    let filtered = trips;
    if (filter === "ACTIVE") filtered = activeTrips;
    if (filter === "BILLED") filtered = billedTrips;

    const allBtn = filter === "ALL" ? "bg-amber-500 text-slate-950 font-bold" : "bg-slate-800 text-slate-300";
    const actBtn = filter === "ACTIVE" ? "bg-amber-500 text-slate-950 font-bold" : "bg-slate-800 text-slate-300";
    const billBtn = filter === "BILLED" ? "bg-amber-500 text-slate-950 font-bold" : "bg-slate-800 text-slate-300";

    let cards = filtered.length === 0
      ? '<div class="vault-card text-center p-8 text-slate-500 text-xs">कोई ट्रिप रिकॉर्ड नहीं मिला। ऊपर "+ नई ड्यूटी स्लिप" से ट्रिप शुरू करें।</div>'
      : filtered.map(t => {
          const isActive = t.status === "ACTIVE";
          const isBilled = t.status === "BILLED";
          const borderClass = isActive ? "border-l-emerald-500" : (isBilled ? "border-l-sky-500" : "border-l-amber-500");
          const statusBadge = isActive 
            ? '<span class="badge-status badge-active">चालू (ACTIVE)</span>'
            : (isBilled ? '<span class="badge-status badge-info">BILLED</span>' : '<span class="badge-status badge-warning">पूर्ण</span>');

          const routeStr = (t.pickupLocation || 'Udaipur') + ' ➔ ' + (t.dropLocation || 'Local');
          const kmRun = t.totalKmRun || (t.endKm ? (Number(t.endKm) - Number(t.startKm || 0)) : 0);

          return `
            <div class="vault-card space-y-2.5 border-l-4 ${borderClass} text-xs">
              <div class="flex justify-between items-center">
                <div class="flex items-center gap-1.5 font-mono">
                  <span class="font-bold text-white text-sm">#${t.dutySlipNumber}</span>
                  ${statusBadge}
                </div>
                <span class="text-slate-400 font-mono text-[11px]">${t.startDate || ''}</span>
              </div>

              <div class="bg-slate-950/60 p-2.5 rounded-xl space-y-1.5 text-[11px] border border-slate-800">
                <div class="grid grid-cols-2 gap-2">
                  <div>
                    <span class="text-slate-400 block text-[10px]">ग्राहक / पार्टी:</span>
                    <strong class="text-white text-xs">${t.customerName}</strong>
                    <span class="text-slate-400 block font-mono">${t.customerPhone || 'फोन नहीं'}</span>
                  </div>
                  <div>
                    <span class="text-slate-400 block text-[10px]">गाड़ी व चालक:</span>
                    <strong class="text-amber-400 font-mono text-xs">${t.vehicleId || 'टैक्सी'}</strong>
                    <span class="text-slate-300 block">${t.driverName || 'ड्राइवर तय नहीं'}</span>
                  </div>
                </div>

                <div class="pt-1 border-t border-slate-800/80">
                  <span class="text-slate-400 text-[10px] block">रूट व रनिंग:</span>
                  <span class="text-slate-200 block truncate">${routeStr}</span>
                  <span class="text-amber-400 font-mono font-bold">${isActive ? ('शुरू KM: ' + (t.startKm||0)) : ('कुल रन: ' + kmRun + ' KM')}</span>
                </div>
              </div>

              <div class="flex justify-between font-mono bg-slate-900/60 p-1.5 rounded-lg text-[11px]">
                <div>एडवांस: <strong class="text-emerald-400">₹${t.advancePaid || 0}</strong></div>
                <div>दर: <strong class="text-slate-300">₹${t.ratePerKm || 12}/KM</strong></div>
                <div>अंतिम बिल: <strong class="text-amber-400">₹${t.finalPayableAmount || 0}</strong></div>
              </div>

              <div class="flex flex-wrap items-center justify-between gap-1.5 pt-1 border-t border-slate-800">
                <button class="btn btn-secondary py-1 px-2.5 text-[11px] text-emerald-400 btn-wa-trip" data-slip="${t.dutySlipNumber}">
                  📲 WhatsApp
                </button>
                <div class="flex gap-1.5">
                  ${isActive ? `
                    <button class="btn btn-secondary py-1 px-2.5 text-[11px] text-amber-400 btn-close-trip" data-slip="${t.dutySlipNumber}">
                      🏁 मीटर बंद करें
                    </button>
                  ` : ''}
                  <button class="btn btn-primary py-1 px-3 text-[11px] font-bold shadow-md btn-direct-bill" data-slip="${t.dutySlipNumber}">
                    🧾 ${isBilled ? '🖨️ बिल देखें / PDF' : 'सीधा बिल बनाएं'}
                  </button>
                </div>
              </div>
            </div>
          `;
        }).join("");

    containerEl.innerHTML = `
      <div class="flex justify-between items-center gap-2">
        <div>
          <h2 class="text-lg font-black text-white">ड्यूटी स्लिप व ट्रिप्स</h2>
          <p class="text-xs text-slate-400">कुल ट्रिप्स: <span class="font-mono text-amber-400 font-bold">${trips.length}</span> (चालू: ${activeTrips.length})</p>
        </div>
        <button id="btn-new-trip" class="btn btn-primary text-xs py-2 px-3 font-bold shadow-lg">
          + नई ड्यूटी स्लिप (Trip)
        </button>
      </div>

      <div class="flex gap-1.5 overflow-x-auto pb-1 text-xs">
        <button class="trip-filter-btn px-3 py-1.5 rounded-lg font-semibold ${allBtn}" data-f="ALL">सभी (${trips.length})</button>
        <button class="trip-filter-btn px-3 py-1.5 rounded-lg font-semibold ${actBtn}" data-f="ACTIVE">चालू (${activeTrips.length})</button>
        <button class="trip-filter-btn px-3 py-1.5 rounded-lg font-semibold ${billBtn}" data-f="BILLED">पूर्ण / Billed (${billedTrips.length})</button>
      </div>

      <div class="space-y-3">${cards}</div>
    `;

    bindEvents();
  };

  const bindEvents = () => {
    const modal = document.getElementById("modal-container");
    const modalContent = document.getElementById("modal-content");
    const openModal = (h) => { modalContent.innerHTML = h; modal.classList.remove("hidden"); };
    const closeModal = () => { modal.classList.add("hidden"); modalContent.innerHTML = ""; };

    containerEl.querySelectorAll(".trip-filter-btn").forEach(b => {
      b.onclick = () => { filter = b.dataset.f; renderContent(); };
    });

    // 1. New Trip
    document.getElementById("btn-new-trip")?.addEventListener("click", () => {
      openNewTripModal(vehicles, drivers, openModal, closeModal, containerEl, onNavigate);
    });

    // 2. Direct Bill from Trip
    containerEl.querySelectorAll(".btn-direct-bill").forEach(b => {
      b.onclick = () => {
        const slip = b.dataset.slip;
        const trip = trips.find(t => t.dutySlipNumber === slip);
        if (trip) openTripBillingModal(trip, openModal, closeModal, containerEl, onNavigate);
      };
    });

    // 3. Close Trip Meter
    containerEl.querySelectorAll(".btn-close-trip").forEach(b => {
      b.onclick = () => {
        const slip = b.dataset.slip;
        const trip = trips.find(t => t.dutySlipNumber === slip);
        if (trip) openCloseMeterModal(trip, openModal, closeModal, containerEl, onNavigate);
      };
    });

    // 4. WhatsApp Share
    containerEl.querySelectorAll(".btn-wa-trip").forEach(b => {
      b.onclick = () => {
        const slip = b.dataset.slip;
        const t = trips.find(item => item.dutySlipNumber === slip);
        if (!t) return;
        const txt = `*${BIZ.name} - DUTY SLIP*\nSlip #: ${t.dutySlipNumber}\nParty: ${t.customerName}\nVehicle: ${t.vehicleId}\nDriver: ${t.driverName || 'Assigned'}\nRoute: ${t.pickupLocation} -> ${t.dropLocation}\nAdvance: ₹${t.advancePaid || 0}\nContact: ${BIZ.mob}`;
        const num = (t.customerPhone || '').replace(/\D/g, '');
        window.open(`https://wa.me/${num ? ('91' + num) : ''}?text=${encodeURIComponent(txt)}`, "_blank");
      };
    });
  };

  renderContent();
}

/**
 * MODAL: NEW TRIP CREATION
 */
function openNewTripModal(vehicles, drivers, openModal, closeModal, containerEl, onNavigate) {
  const autoSlip = "ATU-" + new Date().toISOString().slice(2, 7).replace('-', '') + "-" + Math.floor(1000 + Math.random() * 9000);
  const today = new Date().toISOString().slice(0, 10);

  const vehOpts = vehicles.map(v => `<option value="${v.regNumber}" data-odo="${v.currentOdometer || 0}">${v.regNumber} (${v.makeModel || 'Cab'})</option>`).join("");
  const drvOpts = drivers.map(d => `<option value="${d.name}">${d.name} (${d.phone || ''})</option>`).join("");

  openModal(`
    <h3 class="text-sm font-bold text-white mb-2">नई ड्यूटी स्लिप खोलें</h3>
    <form id="f-new-trip" class="space-y-2.5 text-xs">
      <div class="grid grid-cols-2 gap-2">
        <div><label class="form-label">स्लिप नंबर</label><input type="text" id="t-slip" class="form-input font-mono font-bold text-amber-400" value="${autoSlip}" readonly></div>
        <div><label class="form-label">तारीख</label><input type="date" id="t-date" class="form-input font-mono" value="${today}" required></div>
      </div>
      <div class="grid grid-cols-2 gap-2">
        <div><label class="form-label">ग्राहक / पार्टी नाम *</label><input type="text" id="t-cust" class="form-input font-bold" placeholder="पार्टी का नाम" required autofocus></div>
        <div><label class="form-label">मोबाइल नंबर</label><input type="tel" id="t-phone" class="form-input font-mono" placeholder="9876543210"></div>
      </div>
      <div class="grid grid-cols-2 gap-2">
        <div><label class="form-label">गाड़ी चुनें *</label><select id="t-veh" class="form-select" required><option value="">-- गाड़ी चुनें --</option>${vehOpts}</select></div>
        <div><label class="form-label">ड्राइवर चुनें</label><select id="t-drv" class="form-select"><option value="">-- ड्राइवर चुनें --</option>${drvOpts}</select></div>
      </div>
      <div class="grid grid-cols-3 gap-2">
        <div><label class="form-label">प्रारंभिक KM</label><input type="number" id="t-km" class="form-input font-mono font-bold" value="0"></div>
        <div><label class="form-label">दर / KM (₹)</label><input type="number" id="t-rate" class="form-input font-mono" value="12"></div>
        <div><label class="form-label">एडवांस प्राप्त (₹)</label><input type="number" id="t-adv" class="form-input font-mono font-bold text-emerald-400" value="0"></div>
      </div>
      <div class="grid grid-cols-2 gap-2">
        <div><label class="form-label">पिकअप स्थान</label><input type="text" id="t-pick" class="form-input" value="Udaipur"></div>
        <div><label class="form-label">ड्रॉप स्थान / रूट</label><input type="text" id="t-drop" class="form-input" placeholder="उदा. Kumbhalgarh / Airport"></div>
      </div>
      <div class="flex gap-2 pt-2">
        <button type="submit" class="btn btn-primary flex-1 py-2 font-bold shadow-md">ड्यूटी स्लिप शुरू करें</button>
        <button type="button" id="t-cancel" class="btn btn-secondary py-2">रद्द करें</button>
      </div>
    </form>
  `);

  const vSel = document.getElementById("t-veh");
  vSel.onchange = () => {
    const odo = vSel.options[vSel.selectedIndex]?.dataset.odo;
    if (odo) document.getElementById("t-km").value = odo;
  };

  document.getElementById("t-cancel").onclick = closeModal;

  document.getElementById("f-new-trip").onsubmit = async (e) => {
    e.preventDefault();
    const slip = document.getElementById("t-slip").value;
    const tripData = {
      dutySlipNumber: slip,
      startDate: document.getElementById("t-date").value,
      customerName: document.getElementById("t-cust").value.trim(),
      customerPhone: document.getElementById("t-phone").value.trim(),
      vehicleId: document.getElementById("t-veh").value,
      driverName: document.getElementById("t-drv").value,
      startKm: Number(document.getElementById("t-km").value) || 0,
      ratePerKm: Number(document.getElementById("t-rate").value) || 12,
      advancePaid: Number(document.getElementById("t-adv").value) || 0,
      pickupLocation: document.getElementById("t-pick").value.trim(),
      dropLocation: document.getElementById("t-drop").value.trim(),
      status: "ACTIVE",
      createdAt: new Date().toISOString()
    };

    await setDoc(doc(db, "trips", slip), tripData);

    const makeBillNow = confirm(`ट्रिप #${slip} शुरू हो गई!\n\nक्या आप इस ट्रिप का बिल अभी तुरंत बनाना / पर्ची निकालना चाहते हैं?`);
    closeModal();

    if (makeBillNow) {
      openTripBillingModal(tripData, openModal, closeModal, containerEl, onNavigate);
    } else {
      renderTripsView(containerEl, onNavigate);
    }
  };
}

/**
 * MODAL: CLOSE TRIP METER
 */
function openCloseMeterModal(trip, openModal, closeModal, containerEl, onNavigate) {
  const today = new Date().toISOString().slice(0, 10);
  const startKm = Number(trip.startKm) || 0;

  openModal(`
    <h3 class="text-sm font-bold text-white mb-2">ट्रिप मीटर बंद करें - #${trip.dutySlipNumber}</h3>
    <form id="f-close-m" class="space-y-2.5 text-xs">
      <div class="grid grid-cols-2 gap-2">
        <div><label class="form-label">प्रारंभिक KM</label><input type="number" class="form-input font-mono bg-slate-800" value="${startKm}" readonly></div>
        <div><label class="form-label">समाप्ति KM *</label><input type="number" id="m-end" class="form-input font-mono font-bold text-emerald-400" placeholder="रीडिंग डालें" required autofocus></div>
      </div>
      <div class="grid grid-cols-3 gap-2">
        <div><label class="form-label">कुल KM रन</label><input type="text" id="m-tot-km" class="form-input font-mono font-bold text-amber-400" value="0 KM" readonly></div>
        <div><label class="form-label">टोल चार्ज (₹)</label><input type="number" id="m-toll" class="form-input font-mono" value="0"></div>
        <div><label class="form-label">पार्किंग (₹)</label><input type="number" id="m-park" class="form-input font-mono" value="0"></div>
      </div>
      <div class="flex gap-2 pt-2">
        <button type="submit" class="btn btn-primary flex-1 py-2 font-bold shadow-md">मीटर बंद करें व बिल बनाएं</button>
        <button type="button" id="m-cancel" class="btn btn-secondary py-2">रद्द</button>
      </div>
    </form>
  `);

  const endIn = document.getElementById("m-end");
  const totKmD = document.getElementById("m-tot-km");

  endIn.oninput = () => {
    const endVal = Number(endIn.value) || 0;
    const diff = Math.max(0, endVal - startKm);
    totKmD.value = diff + " KM";
  };

  document.getElementById("m-cancel").onclick = closeModal;

  document.getElementById("f-close-m").onsubmit = async (e) => {
    e.preventDefault();
    const endKm = Number(endIn.value) || startKm;
    const totalKmRun = Math.max(0, endKm - startKm);
    const toll = (Number(document.getElementById("m-toll").value) || 0) + (Number(document.getElementById("m-park").value) || 0);

    const updatedTrip = {
      ...trip,
      endKm,
      totalKmRun,
      tollCharges: toll,
      endDate: today,
      status: "COMPLETED",
      updatedAt: new Date().toISOString()
    };

    await updateDoc(doc(db, "trips", trip.dutySlipNumber), {
      endKm,
      totalKmRun,
      tollCharges: toll,
      endDate: today,
      status: "COMPLETED",
      updatedAt: new Date().toISOString()
    });

    closeModal();
    // Directly open the Bill Modal prefilled with completed KM!
    openTripBillingModal(updatedTrip, openModal, closeModal, containerEl, onNavigate);
  };
}

/**
 * MODAL: SEAMLESS TRIP-TO-BILL GENERATOR & PRINT
 */
function openTripBillingModal(trip, openModal, closeModal, containerEl, onNavigate) {
  const today = new Date().toISOString().slice(0, 10);
  const autoInv = trip.invoiceNumber || ("ATU-" + (trip.dutySlipNumber.split("-").pop() || Date.now().toString().slice(-4)));

  const kmRun = Number(trip.totalKmRun) || (trip.endKm ? Math.max(0, Number(trip.endKm) - Number(trip.startKm||0)) : 250);
  const rate = Number(trip.ratePerKm) || 12;
  const initialFare = (kmRun > 0 && rate > 0) ? (kmRun * rate) : 3000;
  const toll = Number(trip.tollCharges) || 0;
  const advance = Number(trip.advancePaid) || 0;
  const bhatta = Number(trip.driverAllowancePerDay) || 300;

  openModal(`
    <h3 class="text-sm font-bold text-white mb-2">ट्रिप से सीधा बिल बनाएं / पर्ची निकालें</h3>
    <p class="text-[11px] text-slate-400 mb-2">स्लिप: <strong class="text-amber-400">#${trip.dutySlipNumber}</strong> | गाड़ी: <strong class="text-white">${trip.vehicleId}</strong></p>

    <form id="f-trip-bill" class="space-y-2.5 text-xs">
      <div class="grid grid-cols-2 gap-2">
        <div><label class="form-label">बिल नंबर (Bill No)</label><input type="text" id="tb-inv" class="form-input font-mono font-bold text-amber-400" value="${autoInv}" readonly></div>
        <div><label class="form-label">तारीख</label><input type="date" id="tb-date" class="form-input font-mono" value="${today}" required></div>
      </div>
      <div class="grid grid-cols-2 gap-2">
        <div><label class="form-label">पार्टी (M/s) *</label><input type="text" id="tb-name" class="form-input font-bold" value="${trip.customerName || ''}" required></div>
        <div><label class="form-label">मोबाइल नंबर</label><input type="tel" id="tb-phone" class="form-input font-mono" value="${trip.customerPhone || ''}"></div>
      </div>
      <div class="grid grid-cols-2 gap-2">
        <div><label class="form-label">गाड़ी नंबर</label><input type="text" id="tb-veh" class="form-input font-mono uppercase font-bold" value="${trip.vehicleId || ''}"></div>
        <div><label class="form-label">विवरण / रूट</label><input type="text" id="tb-route" class="form-input" value="${(trip.pickupLocation||'') + ' ➔ ' + (trip.dropLocation||'')}"></div>
      </div>
      <div class="grid grid-cols-3 gap-2">
        <div><label class="form-label">दिन (Days)</label><input type="number" id="tb-days" class="form-input font-mono text-center font-bold" value="1" min="1"></div>
        <div><label class="form-label">बिलिंग KM</label><input type="number" id="tb-km" class="form-input font-mono text-center font-bold" value="${kmRun}"></div>
        <div><label class="form-label">दर / KM (₹)</label><input type="number" id="tb-rate" class="form-input font-mono text-center" value="${rate}"></div>
      </div>
      <div class="grid grid-cols-2 gap-2">
        <div><label class="form-label">गाड़ी किराया (₹)</label><input type="number" id="tb-fare" class="form-input font-mono font-bold text-white" value="${initialFare}"></div>
        <div><label class="form-label">ड्राइवर / नाइट चार्ज (₹)</label><input type="number" id="tb-bhatta" class="form-input font-mono" value="${bhatta}"></div>
      </div>
      <div class="grid grid-cols-2 gap-2">
        <div><label class="form-label">टोल + पार्किंग (₹)</label><input type="number" id="tb-toll" class="form-input font-mono" value="${toll}"></div>
        <div><label class="form-label">जमा एडवांस (₹)</label><input type="number" id="tb-adv" class="form-input font-mono font-bold text-emerald-400" value="${advance}"></div>
      </div>
      <div class="bg-amber-500/10 p-2 rounded-lg border border-amber-500/30 flex justify-between font-mono font-bold text-xs">
        <span>कुल बिल: <span id="tb-tot-disp" class="text-amber-400">₹0</span></span>
        <span>बकाया (Due): <span id="tb-bal-disp" class="text-rose-400">₹0</span></span>
      </div>
      <div class="flex gap-2 pt-1">
        <button type="submit" class="btn btn-primary flex-1 py-2 font-bold shadow-md">💾 बिल सेव व PDF डाउनलोड करें</button>
        <button type="button" id="tb-cancel" class="btn btn-secondary py-2">रद्द</button>
      </div>
    </form>
  `);

  const dIn = document.getElementById("tb-days");
  const kIn = document.getElementById("tb-km");
  const rIn = document.getElementById("tb-rate");
  const fIn = document.getElementById("tb-fare");
  const bhIn = document.getElementById("tb-bhatta");
  const tIn = document.getElementById("tb-toll");
  const aIn = document.getElementById("tb-adv");
  const totD = document.getElementById("tb-tot-disp");
  const balD = document.getElementById("tb-bal-disp");

  const calc = (updateFare = false) => {
    if (updateFare) {
      fIn.value = (Number(kIn.value)||0) * (Number(rIn.value)||0);
      bhIn.value = (Number(dIn.value)||1) * 300;
    }
    const tot = (Number(fIn.value)||0) + (Number(bhIn.value)||0) + (Number(tIn.value)||0);
    const bal = Math.max(0, tot - (Number(aIn.value)||0));
    totD.textContent = "₹" + tot.toLocaleString('en-IN');
    balD.textContent = "₹" + bal.toLocaleString('en-IN');
  };

  [dIn, kIn, rIn].forEach(el => el.oninput = () => calc(true));
  [fIn, bhIn, tIn, aIn].forEach(el => el.oninput = () => calc(false));
  calc(false);

  document.getElementById("tb-cancel").onclick = closeModal;

  document.getElementById("f-trip-bill").onsubmit = async (e) => {
    e.preventDefault();
    const tot = (Number(fIn.value)||0) + (Number(bhIn.value)||0) + (Number(tIn.value)||0);
    const adv = Number(aIn.value) || 0;
    const bal = Math.max(0, tot - adv);

    const invoicePayload = {
      invoiceNumber: autoInv,
      dutySlipNumber: trip.dutySlipNumber,
      invoiceDate: document.getElementById("tb-date").value,
      customerName: document.getElementById("tb-name").value.trim(),
      customerPhone: document.getElementById("tb-phone").value.trim(),
      vehicleNumber: document.getElementById("tb-veh").value.trim().toUpperCase(),
      pickupLocation: document.getElementById("tb-route").value.trim(),
      totalDays: Number(dIn.value) || 1,
      totalKm: Number(kIn.value) || 0,
      ratePerKm: Number(rIn.value) || 0,
      vehicleFare: Number(fIn.value) || 0,
      driverBhatta: Number(bhIn.value) || 0,
      tollCharges: Number(tIn.value) || 0,
      totalAmount: tot,
      advancePaid: adv,
      balanceDue: bal,
      createdAt: new Date().toISOString()
    };

    // 1. Save directly into `invoices` collection with clean docId!
    await setDoc(doc(db, "invoices", autoInv), invoicePayload, { merge: true });

    // 2. Update trip status to BILLED
    await updateDoc(doc(db, "trips", trip.dutySlipNumber), {
      status: "BILLED",
      invoiceNumber: autoInv,
      finalPayableAmount: tot,
      balanceDue: bal,
      updatedAt: new Date().toISOString()
    });

    closeModal();
    alert(`बिल #${autoInv} सुरक्षित हो गया! अब प्रिंट / PDF डाउनलोड हो रहा है...`);
    
    // 3. Immediately trigger authentic red billbook print!
    printRedBill(invoicePayload);

    renderTripsView(containerEl, onNavigate);
  };
}

function printRedBill(inv) {
  const w = window.open("", "_blank");
  if (!w) { alert("Popup allow karein"); return; }
  const f = Number(inv.vehicleFare) || Number(inv.totalAmount) || 0;
  const t = Number(inv.tollCharges) || 0;
  const n = Number(inv.driverBhatta) || 0;
  const tot = Number(inv.totalAmount) || 0;
  const adv = Number(inv.advancePaid) || 0;
  const bal = Number(inv.balanceDue) || 0;

  w.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Bill #${inv.invoiceNumber}</title>
  <style>
    @page { size: A4 portrait; margin: 8mm; }
    body { font-family: Arial, sans-serif; background: #fff; margin: 0; padding: 10px; color: #111; }
    .btn-bar { text-align: center; margin-bottom: 12px; }
    .pbtn { background: #b91c1c; color: #fff; border: none; padding: 8px 20px; font-size: 14px; font-weight: bold; border-radius: 6px; cursor: pointer; }
    .box { max-width: 720px; margin: auto; border: 3px double #b91c1c; padding: 14px 18px; }
    .top-tag { text-align: center; margin-top: -6px; }
    .top-tag span { border: 1px solid #b91c1c; color: #b91c1c; font-size: 10px; font-weight: bold; padding: 1px 12px; border-radius: 10px; }
    .head { text-align: center; border-bottom: 1.5px solid #b91c1c; padding-bottom: 6px; margin-bottom: 8px; }
    .h1 { font-size: 28px; font-weight: 900; color: #b91c1c; margin: 2px 0 0 0; }
    .h2 { font-size: 14px; font-weight: bold; color: #b91c1c; letter-spacing: 3px; margin: 2px 0; }
    .addr { font-size: 11px; font-weight: bold; color: #334155; }
    .mob { font-size: 11px; font-weight: bold; color: #b91c1c; margin: 2px 0; }
    .tag { font-size: 10.5px; font-weight: bold; color: #b91c1c; border-top: 1px dashed #fca5a5; padding-top: 2px; }
    .meta { display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 8px; }
    .dot { border-bottom: 1px dotted #475569; font-weight: bold; display: inline-block; padding: 0 4px; }
    table { width: 100%; border-collapse: collapse; border: 1.5px solid #b91c1c; font-size: 12px; }
    th { border: 1.5px solid #b91c1c; color: #b91c1c; padding: 5px; font-size: 11px; }
    td { border-left: 1.5px solid #b91c1c; border-right: 1.5px solid #b91c1c; padding: 6px; vertical-align: top; }
    .r { text-align: right; } .c { text-align: center; }
    .crow td { border: 1.5px solid #b91c1c; padding: 4px 6px; font-weight: bold; }
    .clbl { color: #b91c1c; font-size: 11px; }
    .bank { border: 1px solid #b91c1c; padding: 4px 8px; font-size: 10px; background: #fffaf0; border-radius: 4px; line-height: 1.5; }
    .terms { font-size: 9.5px; color: #334155; line-height: 1.4; margin-top: 4px; }
    .sign { display: flex; justify-content: space-between; margin-top: 24px; font-size: 11px; font-weight: bold; }
    @media print { .btn-bar { display: none; } body { padding: 0; } }
  </style></head><body>
  <div class="btn-bar"><button class="pbtn" onclick="window.print()">📥 Download PDF / Print</button></div>
  <div class="box">
    <div class="top-tag"><span>INVOICE</span></div>
    <div class="head">
      <div class="h1">${BIZ.name}</div>
      <div class="h2">${BIZ.sub}</div>
      <div class="addr">${BIZ.addr}</div>
      <div class="mob">Mob. ${BIZ.mob} | ${BIZ.email}</div>
      <div class="tag">${BIZ.tag}</div>
    </div>
    <div class="meta">
      <div>M/s. <span class="dot" style="min-width:200px;">${inv.customerName}</span><br>Vehicle No. <span class="dot" style="min-width:160px; text-transform:uppercase;">${inv.vehicleNumber||'Cab'}</span></div>
      <div class="r">Bill No. <span class="dot" style="color:#b91c1c; min-width:70px;">${inv.invoiceNumber}</span><br>Date : <span class="dot" style="min-width:80px;">${inv.invoiceDate||''}</span></div>
    </div>
    <table>
      <thead><tr><th style="width:50%;">PARTICULAR</th><th class="c" style="width:16%;">RATE</th><th class="c" style="width:16%;">TOTAL K.M.</th><th class="r" style="width:18%;">AMOUNT</th></tr></thead>
      <tbody>
        <tr style="height:110px;">
          <td><strong style="font-size:13px;">${inv.pickupLocation||'Local Tour'}</strong><div style="color:#64748b; font-size:10px; margin-top:3px;">Vehicle: ${inv.vehicleNumber||'Cab'} (${inv.totalDays||1} Day)</div></td>
          <td class="c">₹${inv.ratePerKm||'-'}</td>
          <td class="c">${inv.totalKm||'-'}</td>
          <td class="r font-bold">₹${f.toLocaleString('en-IN')}</td>
        </tr>
        <tr class="crow">
          <td colspan="2" rowspan="5" style="vertical-align:top; border:1.5px solid #b91c1c;">
            <div class="bank">
              <strong style="color:#b91c1c; font-size:9.5px;">Bank Details:</strong><br>
              <strong>Name:</strong> ${BIZ.holder} | <strong>Bank:</strong> ${BIZ.bank}<br>
              <strong>A/C:</strong> ${BIZ.acc} | <strong>IFSC:</strong> ${BIZ.ifsc}<br>
              <strong>UPI ID:</strong> ${BIZ.upi}
            </div>
            <div style="font-size:10px; margin-top:6px;"><strong>Rupees:</strong> <span class="dot">₹${tot.toLocaleString('en-IN')} Only</span></div>
          </td>
          <td class="clbl">TOLL/PARK.</td><td class="r">${t ? ('₹' + t.toLocaleString('en-IN')) : '-'}</td>
        </tr>
        <tr class="crow"><td class="clbl">NIGHT CH.</td><td class="r">${n ? ('₹' + n.toLocaleString('en-IN')) : '-'}</td></tr>
        <tr class="crow"><td class="clbl">TOTAL</td><td class="r">₹${tot.toLocaleString('en-IN')}</td></tr>
        <tr class="crow"><td class="clbl" style="color:#15803d;">ADVANCE</td><td class="r" style="color:#15803d;">₹${adv.toLocaleString('en-IN')}</td></tr>
        <tr class="crow" style="background:#fef2f2;"><td class="clbl" style="color:#b91c1c; font-size:12px;">G.TOTAL / DUE</td><td class="r" style="color:#b91c1c; font-size:14px;">₹${(bal > 0 ? bal : tot).toLocaleString('en-IN')}</td></tr>
      </tbody>
    </table>
    <div class="terms">
      • Toll Tax, Border Tax, Parking, No Entry Charges pay by party.<br>
      • Night Charges / Driver Allowance Rs.300/- Extra.<br>
      • Per day Running 300 k.m. | All Subject To Udaipur Jurisdiction Only. | E.&O.E.
    </div>
    <div class="sign">
      <div style="border-top:1px dashed #64748b; padding-top:4px; width:120px; text-align:center;">Customer's Sig.</div>
      <div style="color:#b91c1c; text-align:center;"><br><span style="border-top:1px solid #b91c1c; padding-top:2px;">For: AADESH TOURS</span></div>
    </div>
  </div>
  <script>setTimeout(function(){window.print();},400);</script>
  </body></html>`);
  w.document.close();
}
