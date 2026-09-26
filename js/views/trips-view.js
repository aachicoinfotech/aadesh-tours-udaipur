// js/views/trips-view.js
// Aadesh Tours Udaipur - Trips & Duty Slip Manager (Phase 28 - Resilient Fix)

import * as tripService from "../services/trip-service.js";
import * as fleetService from "../services/fleet-service.js";
import * as driverService from "../services/driver-service.js";
import * as customerService from "../services/customer-service.js";
import * as invoiceService from "../services/invoice-service.js";
import * as dataExporter from "../exporters/data-exporter.js";

/**
 * 1. Render Complete Trips & Duty Slips Management View
 * @param {HTMLElement} containerEl - Target element (#tab-trips)
 * @param {Function} onNavigate - Tab switch callback
 */
export async function renderTripsView(containerEl, onNavigate) {
  // Fetch required data in parallel safely
  const [tripsResult, vehiclesResult, driversResult, customersResult] = await Promise.all([
    (tripService.getAllTrips ? tripService.getAllTrips() : Promise.resolve([])).catch(() => []),
    (fleetService.getAllVehicles ? fleetService.getAllVehicles() : Promise.resolve([])).catch(() => []),
    (driverService.getAllDrivers ? driverService.getAllDrivers() : Promise.resolve([])).catch(() => []),
    (customerService.getAllCustomers ? customerService.getAllCustomers() : Promise.resolve([])).catch(() => [])
  ]);

  const trips = Array.isArray(tripsResult) ? tripsResult : [];
  const vehicles = Array.isArray(vehiclesResult) ? vehiclesResult : [];
  const drivers = Array.isArray(driversResult) ? driversResult : [];
  const customers = Array.isArray(customersResult) ? customersResult : [];

  let activeFilter = "ALL"; // 'ALL', 'ACTIVE', 'COMPLETED'

  const getFilteredTrips = () => {
    if (activeFilter === "ACTIVE") return trips.filter(t => t.status === "ACTIVE");
    if (activeFilter === "COMPLETED") return trips.filter(t => t.status === "COMPLETED" || t.status === "BILLED");
    return trips;
  };

  const renderContent = () => {
    const filtered = getFilteredTrips();
    const activeCount = trips.filter(t => t.status === "ACTIVE").length;

    const allBtnClass = activeFilter === "ALL" ? "bg-amber-500 text-slate-950 font-bold" : "bg-slate-800 text-slate-300";
    const activeBtnClass = activeFilter === "ACTIVE" ? "bg-amber-500 text-slate-950 font-bold" : "bg-slate-800 text-slate-300";
    const completedBtnClass = activeFilter === "COMPLETED" ? "bg-amber-500 text-slate-950 font-bold" : "bg-slate-800 text-slate-300";

    let tripsListHtml = "";
    if (filtered.length === 0) {
      tripsListHtml = '<div class="vault-card text-center p-8 text-slate-500 text-xs">इस श्रेणी में कोई ट्रिप रिकॉर्ड नहीं मिला।</div>';
    } else {
      const cards = filtered.map(t => {
        const isActive = t.status === "ACTIVE";
        const isBilled = t.status === "BILLED";
        const borderClass = isActive ? "border-l-emerald-400" : "border-l-slate-600";
        const badgeClass = isActive ? "badge-active" : (isBilled ? "badge-info" : "badge-warning");
        const dateStr = (t.startDate || "") + (t.endDate && t.endDate !== t.startDate ? " से " + t.endDate : "");
        const custPhone = t.customerPhone || "फोन नहीं";
        const driverName = t.driverName || "ड्राइवर तय नहीं";
        const dropLoc = t.dropLocation || "लोकल";
        const kmInfo = isActive ? ("शुरू मीटर: " + (t.startKm || 0) + " KM") : ("कुल रन: " + (t.totalKmRun || 0) + " KM");

        let finalBillHtml = "";
        if (!isActive) {
          finalBillHtml = '<div><span class="text-slate-400">अंतिम बिल:</span> <span class="font-mono font-bold text-amber-400">₹' + (t.finalPayableAmount || 0) + '</span></div>';
        }

        let actionBtnHtml = "";
        if (isActive) {
          actionBtnHtml = '<button class="btn btn-success text-xs py-1.5 px-3 btn-close-trip" data-slip="' + t.dutySlipNumber + '">ट्रिप बंद करें (Close KM)</button>';
        } else if (!isBilled) {
          actionBtnHtml = '<button class="btn btn-primary text-xs py-1.5 px-3 btn-generate-bill" data-slip="' + t.dutySlipNumber + '">इनवॉइस बनाएं (Bill)</button>';
        } else {
          actionBtnHtml = '<span class="text-[11px] text-emerald-400 font-bold px-2 py-1 bg-emerald-500/10 rounded">बिल # ' + (t.invoiceNumber || "BILLED") + '</span>';
        }

        return `
          <div class="vault-card space-y-3 border-l-4 ${borderClass}">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <div class="flex items-center gap-2">
                <span class="font-mono font-bold text-amber-400 text-sm">#${t.dutySlipNumber}</span>
                <span class="badge-status ${badgeClass}">${t.status}</span>
                <span class="badge-status badge-info text-[10px]">${t.tripType || "OUTSTATION"}</span>
              </div>
              <div class="text-xs text-slate-400 font-mono">${dateStr}</div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs bg-slate-950/40 p-2.5 rounded-lg">
              <div>
                <span class="text-slate-400 block text-[11px]">ग्राहक / पार्टी:</span>
                <span class="font-bold text-slate-100 text-sm">${t.customerName}</span>
                <span class="text-slate-400 block font-mono">${custPhone}</span>
              </div>
              <div>
                <span class="text-slate-400 block text-[11px]">गाड़ी व चालक:</span>
                <span class="font-mono font-bold text-slate-100">${t.vehicleId}</span>
                <span class="text-slate-300 block">${driverName}</span>
              </div>
              <div>
                <span class="text-slate-400 block text-[11px]">रूट व किलोमीटर:</span>
                <span class="text-slate-200">${t.pickupLocation} ➔ ${dropLoc}</span>
                <span class="text-amber-400 block font-mono font-bold">${kmInfo}</span>
              </div>
            </div>

            <div class="flex items-center justify-between text-xs px-1">
              <div>
                <span class="text-slate-400">एडवांस:</span>
                <span class="font-mono font-bold text-emerald-400">₹${t.advancePaid || 0}</span>
              </div>
              <div>
                <span class="text-slate-400">दर/KM:</span>
                <span class="font-mono text-slate-200">₹${t.ratePerKm || 0}</span>
              </div>
              ${finalBillHtml}
            </div>

            <div class="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button class="btn btn-secondary text-xs py-1.5 px-2.5 btn-share-wa" data-slip="${t.dutySlipNumber}">
                WhatsApp शेयर
              </button>
              ${actionBtnHtml}
            </div>
          </div>
        `;
      });
      tripsListHtml = '<div class="space-y-3">' + cards.join("") + '</div>';
    }

    containerEl.innerHTML = `
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 class="text-xl font-black text-white tracking-wide">ड्यूटी स्लिप व ट्रिप्स</h2>
          <p class="text-xs text-slate-400">कुल ट्रिप्स: <span class="font-mono text-amber-400 font-bold">${trips.length}</span> (चालू: ${activeCount})</p>
        </div>
        <button id="btn-create-trip" class="btn btn-primary text-xs sm:text-sm py-2 px-3">
          + नई ड्यूटी स्लिप (New Trip)
        </button>
      </div>

      <div class="flex gap-2 border-b border-slate-800 pb-2">
        <button class="trip-filter-btn px-3 py-1.5 rounded-lg text-xs font-semibold ${allBtnClass}" data-filter="ALL">
          सभी ट्रिप्स (${trips.length})
        </button>
        <button class="trip-filter-btn px-3 py-1.5 rounded-lg text-xs font-semibold ${activeBtnClass}" data-filter="ACTIVE">
          चालू / On-Duty (${activeCount})
        </button>
        <button class="trip-filter-btn px-3 py-1.5 rounded-lg text-xs font-semibold ${completedBtnClass}" data-filter="COMPLETED">
          पूर्ण / Billed (${trips.length - activeCount})
        </button>
      </div>

      ${tripsListHtml}
    `;

    bindTripEvents();
  };

  const bindTripEvents = () => {
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

    containerEl.querySelectorAll(".trip-filter-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        activeFilter = btn.dataset.filter;
        renderContent();
      });
    });

    // 1. OPEN NEW TRIP MODAL
    const btnNew = containerEl.querySelector("#btn-create-trip");
    if (btnNew) {
      btnNew.addEventListener("click", () => {
        const defaultSlip = tripService.generateDutySlipNumber 
          ? tripService.generateDutySlipNumber() 
          : ("DS-" + Date.now().toString().slice(-6));
        const today = new Date().toISOString().slice(0, 10);

        const customerOptions = customers.map(c => {
          const bName = c.businessName ? " (" + c.businessName + ")" : "";
          return '<option value="' + c.name + '">' + bName + '</option>';
        }).join("");

        const vehicleOptions = vehicles.map(v => {
          return '<option value="' + v.regNumber + '" data-odo="' + (v.currentOdometer || 0) + '">' + v.regNumber + ' (' + (v.makeModel || "Cab") + ')</option>';
        }).join("");

        const driverOptions = drivers.map(d => {
          return '<option value="' + d.name + '">' + d.name + ' (' + (d.phone || "") + ')</option>';
        }).join("");

        openModal(`
          <h3 class="text-base font-bold text-white mb-3">नई ड्यूटी स्लिप खोलें (New Trip)</h3>
          <form id="form-new-trip" class="space-y-3 text-xs">
            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="form-label">ड्यूटी स्लिप #</label>
                <input type="text" id="trip-slip-no" class="form-input font-mono font-bold text-amber-400" value="${defaultSlip}" required>
              </div>
              <div>
                <label class="form-label">तारीख (Start Date)</label>
                <input type="date" id="trip-start-date" class="form-input" value="${today}" required>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="form-label">ग्राहक / पार्टी नाम *</label>
                <input type="text" id="trip-cust-name" list="customer-list" class="form-input" placeholder="नाम लिखें या चुनें" required>
                <datalist id="customer-list">
                  ${customerOptions}
                </datalist>
              </div>
              <div>
                <label class="form-label">मोबाइल नंबर</label>
                <input type="tel" id="trip-cust-phone" class="form-input" placeholder="9876543210">
              </div>
            </div>

            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="form-label">गाड़ी चुनें (Vehicle) *</label>
                <select id="trip-vehicle" class="form-select" required>
                  <option value="">-- गाड़ी चुनें --</option>
                  ${vehicleOptions}
                </select>
              </div>
              <div>
                <label class="form-label">ड्राइवर चुनें (Driver)</label>
                <select id="trip-driver" class="form-select">
                  <option value="">-- ड्राइवर चुनें --</option>
                  ${driverOptions}
                </select>
              </div>
            </div>

            <div class="grid grid-cols-3 gap-2">
              <div>
                <label class="form-label">ट्रिप प्रकार</label>
                <select id="trip-type" class="form-select">
                  <option value="OUTSTATION">Outstation</option>
                  <option value="LOCAL">Local Tour</option>
                  <option value="AIRPORT_TRANSFER">Airport Transfer</option>
                </select>
              </div>
              <div>
                <label class="form-label">शुरू मीटर (KM) *</label>
                <input type="number" id="trip-start-km" class="form-input font-mono font-bold" placeholder="0" required>
              </div>
              <div>
                <label class="form-label">दर / KM (₹)</label>
                <input type="number" id="trip-rate-km" class="form-input font-mono" value="12" required>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="form-label">पिकअप स्थान</label>
                <input type="text" id="trip-pickup" class="form-input" value="Udaipur" required>
              </div>
              <div>
                <label class="form-label">ड्रॉप स्थान / रूट</label>
                <input type="text" id="trip-drop" class="form-input" placeholder="उदा. Kumbhalgarh - Ranakpur">
              </div>
            </div>

            <div class="grid grid-cols-3 gap-2">
              <div>
                <label class="form-label">मिनिमम KM/दिन</label>
                <input type="number" id="trip-min-km" class="form-input font-mono" value="250">
              </div>
              <div>
                <label class="form-label">ड्राइवर भत्ता/दिन (₹)</label>
                <input type="number" id="trip-bhatta" class="form-input font-mono" value="300">
              </div>
              <div>
                <label class="form-label">एडवांस प्राप्त (₹)</label>
                <input type="number" id="trip-advance" class="form-input font-mono font-bold text-emerald-400" value="0">
              </div>
            </div>

            <div class="pt-2 flex gap-2">
              <button type="submit" class="btn btn-primary flex-1 py-2.5">ड्यूटी स्लिप शुरू करें</button>
              <button type="button" id="btn-cancel-modal" class="btn btn-secondary py-2.5">रद्द करें</button>
            </div>
          </form>
        `);

        const vehSelect = document.getElementById("trip-vehicle");
        const startKmInput = document.getElementById("trip-start-km");
        vehSelect.addEventListener("change", () => {
          const opt = vehSelect.options[vehSelect.selectedIndex];
          const odo = opt.getAttribute("data-odo");
          if (odo) startKmInput.value = odo;
        });

        document.getElementById("btn-cancel-modal")?.addEventListener("click", closeModal);
        document.getElementById("form-new-trip")?.addEventListener("submit", async (e) => {
          e.preventDefault();
          const payload = {
            dutySlipNumber: document.getElementById("trip-slip-no").value,
            startDate: document.getElementById("trip-start-date").value,
            customerName: document.getElementById("trip-cust-name").value,
            customerPhone: document.getElementById("trip-cust-phone").value,
            vehicleId: document.getElementById("trip-vehicle").value,
            driverName: document.getElementById("trip-driver").value,
            tripType: document.getElementById("trip-type").value,
            startKm: Number(document.getElementById("trip-start-km").value),
            ratePerKm: Number(document.getElementById("trip-rate-km").value),
            pickupLocation: document.getElementById("trip-pickup").value,
            dropLocation: document.getElementById("trip-drop").value,
            minKmPerDay: Number(document.getElementById("trip-min-km").value),
            driverAllowancePerDay: Number(document.getElementById("trip-bhatta").value),
            advancePaid: Number(document.getElementById("trip-advance").value)
          };

          const createFn = tripService.createTrip || tripService.addTrip;
          if (createFn) {
            const res = await createFn(payload, payload.advancePaid > 0);
            if (res && res.success) {
              closeModal();
              renderTripsView(containerEl, onNavigate);
            } else {
              alert(res ? res.message : "त्रुटि: ट्रिप सेव नहीं हो सकी");
            }
          }
        });
      });
    }

    // 2. CLOSE TRIP MODAL
    containerEl.querySelectorAll(".btn-close-trip").forEach(btn => {
      btn.addEventListener("click", () => {
        const slip = btn.dataset.slip;
        const trip = trips.find(t => t.dutySlipNumber === slip);
        if (!trip) return;

        const today = new Date().toISOString().slice(0, 10);

        openModal(`
          <h3 class="text-base font-bold text-white mb-2">ट्रिप पूरी करें / मीटर बंद करें</h3>
          <p class="text-xs text-slate-400 mb-3">स्लिप: <span class="font-mono text-amber-400 font-bold">#${slip}</span> | गाड़ी: ${trip.vehicleId}</p>

          <form id="form-close-trip" class="space-y-3 text-xs">
            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="form-label">समाप्ति तारीख (End Date)</label>
                <input type="date" id="close-end-date" class="form-input" value="${today}" required>
              </div>
              <div>
                <label class="form-label">प्रारंभिक मीटर (Start KM)</label>
                <input type="text" class="form-input bg-slate-800 font-mono text-slate-400" value="${trip.startKm}" readonly>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="form-label">अंतिम मीटर (End KM) *</label>
                <input type="number" id="close-end-km" class="form-input font-mono font-bold text-emerald-400 text-sm" placeholder="मीटर रीडिंग डालें" required autofocus>
              </div>
              <div>
                <label class="form-label">कुल रनिंग (Total KM)</label>
                <input type="text" id="close-total-km" class="form-input font-mono font-bold text-amber-400" value="0 KM" readonly>
              </div>
            </div>

            <div class="grid grid-cols-3 gap-2">
              <div>
                <label class="form-label">टोल चार्ज (₹)</label>
                <input type="number" id="close-toll" class="form-input font-mono" value="0">
              </div>
              <div>
                <label class="form-label">पार्किंग चार्ज (₹)</label>
                <input type="number" id="close-parking" class="form-input font-mono" value="0">
              </div>
              <div>
                <label class="form-label">नाइट चार्ज (₹)</label>
                <input type="number" id="close-night" class="form-input font-mono" value="0">
              </div>
            </div>

            <div class="pt-2 flex gap-2">
              <button type="submit" class="btn btn-success flex-1 py-2.5">मीटर लॉक व ट्रिप पूर्ण करें</button>
              <button type="button" id="btn-cancel-close" class="btn btn-secondary py-2.5">रद्द करें</button>
            </div>
          </form>
        `);

        const endKmInput = document.getElementById("close-end-km");
        const totalKmInput = document.getElementById("close-total-km");

        endKmInput.addEventListener("input", () => {
          const endVal = Number(endKmInput.value) || 0;
          const diff = endVal - Number(trip.startKm);
          totalKmInput.value = (diff > 0 ? diff : 0) + " KM";
        });

        document.getElementById("btn-cancel-close")?.addEventListener("click", closeModal);
        document.getElementById("form-close-trip")?.addEventListener("submit", async (e) => {
          e.preventDefault();
          const closingData = {
            endDate: document.getElementById("close-end-date").value,
            endKm: Number(document.getElementById("close-end-km").value),
            tollCharges: Number(document.getElementById("close-toll").value),
            parkingCharges: Number(document.getElementById("close-parking").value),
            nightCharges: Number(document.getElementById("close-night").value)
          };

          const completeFn = tripService.completeTrip || tripService.closeTrip || tripService.updateTrip;
          if (completeFn) {
            const res = await completeFn(slip, closingData);
            if (res && res.success) {
              closeModal();
              renderTripsView(containerEl, onNavigate);
            } else {
              alert(res ? res.message : "त्रुटि: ट्रिप पूर्ण नहीं हो सकी");
            }
          }
        });
      });
    });

    // 3. GENERATE INVOICE MODAL
    containerEl.querySelectorAll(".btn-generate-bill").forEach(btn => {
      btn.addEventListener("click", async () => {
        const slip = btn.dataset.slip;
        const confirmGst = confirm("स्लिप #" + slip + " के लिए GST इनवॉइस बनाना चाहते हैं?\\n(OK = GST इनवॉइस, Cancel = Regular Bill of Supply)");
        
        const invoiceFn = invoiceService.createInvoiceFromTrip || invoiceService.generateInvoiceFromTrip;
        if (invoiceFn) {
          const res = await invoiceFn(slip, {
            isGstInvoice: confirmGst,
            gstRatePercent: confirmGst ? 5 : 0
          });

          if (res && res.success) {
            alert("बिल तैयार हो गया! इनवॉइस नंबर: " + (res.data ? res.data.invoiceNumber : ""));
            renderTripsView(containerEl, onNavigate);
          } else {
            alert("त्रुटि: " + (res ? res.message : "इनवॉइस नहीं बन सका"));
          }
        }
      });
    });

    // 4. WHATSAPP SHARE ACTION
    containerEl.querySelectorAll(".btn-share-wa").forEach(btn => {
      btn.addEventListener("click", () => {
        const slip = btn.dataset.slip;
        const trip = trips.find(t => t.dutySlipNumber === slip);
        if (!trip) return;

        if (typeof dataExporter.generateWhatsAppTripSummary === "function") {
          const summary = dataExporter.generateWhatsAppTripSummary(trip);
          const encoded = encodeURIComponent(summary);
          const waUrl = trip.customerPhone 
            ? "https://wa.me/91" + trip.customerPhone.slice(-10) + "?text=" + encoded
            : "https://wa.me/?text=" + encoded;
          
          window.open(waUrl, "_blank");
        }
      });
    });
  };

  renderContent();
}
