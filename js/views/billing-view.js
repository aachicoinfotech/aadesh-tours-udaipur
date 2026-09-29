// js/views/billing-view.js
// Aadesh Tours Udaipur - Rock-Solid Billing & Direct Invoice Controller

import { db } from "../config/firebase-config.js";
import { collection, doc, setDoc, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

export async function renderBillingView(containerEl, onNavigate) {
  let invoices = [];
  try {
    const q = query(collection(db, "invoices"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    invoices = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.warn("Invoices fetch error:", err);
    try {
      const snap = await getDocs(collection(db, "invoices"));
      invoices = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (e) {
      invoices = [];
    }
  }

  const totalBilled = invoices.reduce((s, i) => s + (Number(i.totalAmount) || 0), 0);
  const totalDue = invoices.reduce((s, i) => s + (Number(i.balanceDue) || 0), 0);
  const totalCollected = totalBilled - totalDue;

  let invoiceListHtml = "";
  if (invoices.length === 0) {
    invoiceListHtml = '<div class="vault-card text-center p-8 text-slate-500 text-xs">कोई बिल नहीं मिला। "+ नया बिल बनाएं" पर क्लिक करके पहला इनवॉइस बनाएं।</div>';
  } else {
    invoiceListHtml = invoices.map(inv => {
      const isUnpaid = Number(inv.balanceDue) > 0;
      const borderClass = isUnpaid ? "border-l-rose-500" : "border-l-emerald-500";
      const statusBadge = isUnpaid ? '<span class="badge-status badge-danger">DUE</span>' : '<span class="badge-status badge-active">PAID</span>';
      const bType = inv.isGstInvoice ? '<span class="badge-status badge-info">GST</span>' : '<span class="badge-status badge-warning">BILL</span>';

      return `
        <div class="vault-card space-y-2 border-l-4 ${borderClass} text-xs">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-1.5">
              <span class="font-mono font-bold text-white">${inv.invoiceNumber}</span>
              ${bType}
              ${statusBadge}
            </div>
            <span class="text-slate-400 font-mono text-[11px]">${inv.invoiceDate || ''}</span>
          </div>

          <div class="bg-slate-950/50 p-2 rounded-lg grid grid-cols-2 gap-2 text-[11px]">
            <div>
              <span class="text-slate-400 block">ग्राहक / पार्टी:</span>
              <span class="font-bold text-white text-xs">${inv.customerName}</span>
              <span class="text-slate-400 block font-mono">${inv.customerPhone || '-'}</span>
            </div>
            <div>
              <span class="text-slate-400 block">गाड़ी व रूट:</span>
              <span class="font-mono text-amber-400 font-bold">${inv.vehicleNumber || 'टैक्सी'}</span>
              <span class="text-slate-300 block truncate">${inv.pickupLocation || 'लोकल'}</span>
            </div>
          </div>

          <div class="flex items-center justify-between font-mono pt-1 text-[11px]">
            <div>कुल: <span class="text-white font-bold">₹${(Number(inv.totalAmount) || 0).toLocaleString('en-IN')}</span></div>
            <div>जमा: <span class="text-emerald-400">₹${(Number(inv.advancePaid) || 0).toLocaleString('en-IN')}</span></div>
            <div>बकाया: <span class="text-rose-400 font-bold">₹${(Number(inv.balanceDue) || 0).toLocaleString('en-IN')}</span></div>
          </div>

          <div class="flex justify-end gap-2 pt-1 border-t border-slate-800">
            <button class="btn btn-secondary py-1 px-2.5 text-[11px] btn-share-wa" data-inv="${inv.invoiceNumber}">
              📲 WhatsApp शेयर
            </button>
            <button class="btn btn-secondary py-1 px-2.5 text-[11px] btn-print-thermal" data-inv="${inv.invoiceNumber}">
              🖨️ पर्ची
            </button>
          </div>
        </div>
      `;
    }).join("");
  }

  containerEl.innerHTML = `
    <div class="flex items-center justify-between gap-2">
      <div>
        <h2 class="text-lg font-black text-white">बिलिंग व इनवॉइस</h2>
        <p class="text-xs text-slate-400">कुल बिल: <span class="font-mono text-amber-400 font-bold">${invoices.length}</span></p>
      </div>
      <button id="btn-open-direct-bill" class="btn btn-primary text-xs py-2 px-3 font-bold">
        + नया बिल बनाएं
      </button>
    </div>

    <!-- Quick Stats -->
    <div class="grid grid-cols-3 gap-2 text-center">
      <div class="stat-metric p-2">
        <div class="stat-label text-[10px]">कुल बिलिंग</div>
        <div class="stat-value text-sm text-white">₹${totalBilled.toLocaleString('en-IN')}</div>
      </div>
      <div class="stat-metric p-2">
        <div class="stat-label text-[10px]">कुल वसूली</div>
        <div class="stat-value text-sm text-emerald-400">₹${totalCollected.toLocaleString('en-IN')}</div>
      </div>
      <div class="stat-metric p-2 border-rose-500/30">
        <div class="stat-label text-[10px] text-rose-400">बाकी (Due)</div>
        <div class="stat-value text-sm text-rose-400">₹${totalDue.toLocaleString('en-IN')}</div>
      </div>
    </div>

    <div class="space-y-2.5">
      ${invoiceListHtml}
    </div>
  `;

  // Bind Events
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

  document.getElementById("btn-open-direct-bill")?.addEventListener("click", () => {
    openInvoiceModal(openModal, closeModal, containerEl, onNavigate);
  });

  containerEl.querySelectorAll(".btn-share-wa").forEach(btn => {
    btn.addEventListener("click", () => {
      const invNum = btn.dataset.inv;
      const inv = invoices.find(i => i.invoiceNumber === invNum);
      if (!inv) return;
      const msg = `*AADESH TOURS UDAIPUR*\nबिल नंबर: ${inv.invoiceNumber}\nपार्टी: ${inv.customerName}\nगाड़ी: ${inv.vehicleNumber}\nकुल राशि: ₹${inv.totalAmount}\nजमा: ₹${inv.advancePaid}\n*बकाया: ₹${inv.balanceDue}*\nधन्यवाद!`;
      const url = `https://wa.me/${inv.customerPhone ? ('91' + inv.customerPhone.replace(/\D/g,'')) : ''}?text=${encodeURIComponent(msg)}`;
      window.open(url, "_blank");
    });
  });

  containerEl.querySelectorAll(".btn-print-thermal").forEach(btn => {
    btn.addEventListener("click", () => {
      const invNum = btn.dataset.inv;
      const inv = invoices.find(i => i.invoiceNumber === invNum);
      if (!inv) return;
      window.print();
    });
  });
}

function openInvoiceModal(openModal, closeModal, containerEl, onNavigate) {
  const today = new Date().toISOString().slice(0, 10);
  const autoInv = "ATU-" + Date.now().toString().slice(-5);

  const html = `
    <div class="max-h-[85vh] overflow-y-auto pr-1 text-xs">
      <h3 class="text-base font-bold text-white mb-2">नया टैक्सी बिल बनाएं</h3>
      
      <form id="form-create-bill" class="space-y-3">
        <div class="bg-slate-950/50 p-2.5 rounded-xl border border-slate-800 space-y-2">
          <span class="text-amber-400 font-bold block text-[10px] uppercase">1. ग्राहक व गाड़ी</span>
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="form-label">बिल नंबर</label>
              <input type="text" id="mb-inv-num" class="form-input font-mono font-bold text-amber-400" value="${autoInv}" required>
            </div>
            <div>
              <label class="form-label">तारीख</label>
              <input type="date" id="mb-date" class="form-input font-mono" value="${today}" required>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="form-label">ग्राहक / पार्टी का नाम *</label>
              <input type="text" id="mb-cust-name" class="form-input font-bold" placeholder="पार्टी का नाम" required autofocus>
            </div>
            <div>
              <label class="form-label">मोबाइल नंबर</label>
              <input type="tel" id="mb-cust-phone" class="form-input font-mono" placeholder="9876543210">
            </div>
          </div>

          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="form-label">गाड़ी नंबर</label>
              <input type="text" id="mb-veh-num" class="form-input font-mono uppercase" placeholder="RJ27 TA 1234">
            </div>
            <div>
              <label class="form-label">रूट / विवरण</label>
              <input type="text" id="mb-route" class="form-input" placeholder="उदा. Udaipur Local / Kumbhalgarh">
            </div>
          </div>
        </div>

        <div class="bg-slate-950/50 p-2.5 rounded-xl border border-slate-800 space-y-2">
          <span class="text-amber-400 font-bold block text-[10px] uppercase">2. दिन व मीटर गणना</span>
          <div class="grid grid-cols-3 gap-2">
            <div>
              <label class="form-label">कुल दिन (Days)</label>
              <input type="number" id="mb-days" class="form-input font-mono text-center font-bold text-amber-400" value="1" min="1">
            </div>
            <div>
              <label class="form-label">बिलिंग KM</label>
              <input type="number" id="mb-km" class="form-input font-mono text-center font-bold text-emerald-400" value="250">
            </div>
            <div>
              <label class="form-label">दर / KM (₹)</label>
              <input type="number" id="mb-rate" class="form-input font-mono text-center font-bold" value="12">
            </div>
          </div>

          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="form-label">गाड़ी किराया (₹)</label>
              <input type="number" id="mb-fare" class="form-input font-mono font-bold text-white" value="3000">
            </div>
            <div>
              <label class="form-label">ड्राइवर भत्ता (₹)</label>
              <input type="number" id="mb-bhatta" class="form-input font-mono" value="300">
            </div>
          </div>

          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="form-label">टोल + पार्किंग (₹)</label>
              <input type="number" id="mb-toll" class="form-input font-mono" value="0">
            </div>
            <div class="flex items-center pt-4">
              <label class="flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" id="mb-gst-toggle" class="rounded bg-slate-900 border-slate-700 text-amber-500">
                <span class="text-[11px] font-bold text-slate-300">+5% GST बिल</span>
              </label>
            </div>
          </div>
        </div>

        <!-- Total Box -->
        <div class="bg-amber-500/10 border border-amber-500/30 p-2.5 rounded-xl space-y-1.5">
          <div class="flex justify-between items-center text-xs">
            <span class="text-slate-300 font-bold">कुल बिल (Grand Total):</span>
            <span id="mb-disp-total" class="font-mono font-black text-amber-400 text-base">₹3,300</span>
          </div>
          <div class="grid grid-cols-2 gap-2 pt-1 border-t border-amber-500/20">
            <div>
              <label class="form-label">जमा एडवांस (₹)</label>
              <input type="number" id="mb-advance" class="form-input font-mono font-bold text-emerald-400" value="0">
            </div>
            <div>
              <label class="form-label">बाकी (Balance Due)</label>
              <div id="mb-disp-bal" class="font-mono font-black text-rose-400 text-base pt-1">₹3,300</div>
            </div>
          </div>
        </div>

        <div class="flex gap-2 pt-1">
          <button type="submit" class="btn btn-primary flex-1 py-2 font-bold">बिल सुरक्षित करें</button>
          <button type="button" id="mb-btn-cancel" class="btn btn-secondary py-2">रद्द करें</button>
        </div>
      </form>
    </div>
  `;

  openModal(html);

  const daysIn = document.getElementById("mb-days");
  const kmIn = document.getElementById("mb-km");
  const rateIn = document.getElementById("mb-rate");
  const fareIn = document.getElementById("mb-fare");
  const bhattaIn = document.getElementById("mb-bhatta");
  const tollIn = document.getElementById("mb-toll");
  const gstCheck = document.getElementById("mb-gst-toggle");
  const advIn = document.getElementById("mb-advance");
  const dispTot = document.getElementById("mb-disp-total");
  const dispBal = document.getElementById("mb-disp-bal");

  const calc = (updateFare = false) => {
    const days = Math.max(1, Number(daysIn.value) || 1);
    if (updateFare) {
      const km = Number(kmIn.value) || 0;
      const rate = Number(rateIn.value) || 0;
      fareIn.value = km * rate;
      bhattaIn.value = days * 300;
    }
    const fare = Number(fareIn.value) || 0;
    const bhatta = Number(bhattaIn.value) || 0;
    const toll = Number(tollIn.value) || 0;
    let sub = fare + bhatta + toll;
    if (gstCheck.checked) sub = Math.round(sub * 1.05);

    dispTot.textContent = `₹${sub.toLocaleString('en-IN')}`;
    const adv = Number(advIn.value) || 0;
    const bal = Math.max(0, sub - adv);
    dispBal.textContent = `₹${bal.toLocaleString('en-IN')}`;
  };

  [daysIn, kmIn, rateIn].forEach(el => el.addEventListener("input", () => calc(true)));
  [fareIn, bhattaIn, tollIn, advIn].forEach(el => el.addEventListener("input", () => calc(false)));
  gstCheck.addEventListener("change", () => calc(false));

  document.getElementById("mb-btn-cancel")?.addEventListener("click", closeModal);

  document.getElementById("form-create-bill")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const invNum = document.getElementById("mb-inv-num").value.trim();
    const invDate = document.getElementById("mb-date").value;
    const custName = document.getElementById("mb-cust-name").value.trim();
    const custPhone = document.getElementById("mb-cust-phone").value.trim();
    const vehNum = document.getElementById("mb-veh-num").value.trim();
    const route = document.getElementById("mb-route").value.trim();

    const days = Number(daysIn.value) || 1;
    const km = Number(kmIn.value) || 0;
    const rate = Number(rateIn.value) || 0;
    const fare = Number(fareIn.value) || 0;
    const bhatta = Number(bhattaIn.value) || 0;
    const toll = Number(tollIn.value) || 0;
    const isGst = gstCheck.checked;
    let total = fare + bhatta + toll;
    if (isGst) total = Math.round(total * 1.05);
    const advance = Number(advIn.value) || 0;
    const balance = Math.max(0, total - advance);

    const docData = {
      invoiceNumber: invNum,
      invoiceDate: invDate,
      customerName: custName,
      customerPhone: custPhone,
      vehicleNumber: vehNum,
      pickupLocation: route || "Local",
      totalDays: days,
      totalKm: km,
      ratePerKm: rate,
      totalAmount: total,
      advancePaid: advance,
      balanceDue: balance,
      isGstInvoice: isGst,
      paymentStatus: balance <= 0 ? "PAID" : "DUE",
      createdAt: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, "invoices", invNum), docData);
      alert(`बिल #${invNum} सफलतापूर्वक बन गया!`);
      closeModal();
      renderBillingView(containerEl, onNavigate);
    } catch (err) {
      alert("एरर: " + err.message);
    }
  });
}
