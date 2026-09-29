// js/views/billing-view.js
// Aadesh Tours Udaipur - Compact, Crash-Proof Billing & Red Billbook PDF

import { db } from "../config/firebase-config.js";
import { 
  collection, doc, setDoc, getDocs, deleteDoc, query, orderBy 
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

export async function renderBillingView(containerEl, onNavigate) {
  let invoices = [];
  try {
    const q = query(collection(db, "invoices"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    invoices = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (e) {
    try {
      const snap = await getDocs(collection(db, "invoices"));
      invoices = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (err) { invoices = []; }
  }

  const totBilled = invoices.reduce((s, i) => s + (Number(i.totalAmount) || 0), 0);
  const totDue = invoices.reduce((s, i) => s + (Number(i.balanceDue) || 0), 0);
  const totCol = totBilled - totDue;

  let cards = invoices.length === 0 
    ? '<div class="vault-card text-center p-6 text-slate-500 text-xs">Koi bill nahi mila. "+ Naya Bill" par click karein.</div>'
    : invoices.map(inv => {
        const isDue = Number(inv.balanceDue) > 0;
        const col = isDue ? "border-l-rose-500" : "border-l-emerald-500";
        const st = isDue ? '<span class="badge-status badge-danger">DUE</span>' : '<span class="badge-status badge-active">PAID</span>';
        return `
          <div class="vault-card space-y-2 border-l-4 ${col} text-xs">
            <div class="flex justify-between items-center font-mono">
              <span class="font-bold text-white">#${inv.invoiceNumber} ${st}</span>
              <span class="text-slate-400 text-[11px]">${inv.invoiceDate || ''}</span>
            </div>
            <div class="bg-slate-950/60 p-2 rounded-xl grid grid-cols-2 gap-2 text-[11px] border border-slate-800">
              <div><span class="text-slate-400 block text-[10px]">Party:</span><strong class="text-white">${inv.customerName}</strong><span class="text-slate-400 block font-mono">${inv.customerPhone || '-'}</span></div>
              <div><span class="text-slate-400 block text-[10px]">Gaadi / Route:</span><strong class="text-amber-400 font-mono">${inv.vehicleNumber || 'Cab'}</strong><span class="text-slate-300 block truncate">${inv.pickupLocation || 'Local'}</span></div>
            </div>
            <div class="flex justify-between font-mono bg-slate-900/60 p-1.5 rounded-lg text-[11px]">
              <div>Total: <strong class="text-white">₹${(Number(inv.totalAmount)||0).toLocaleString('en-IN')}</strong></div>
              <div>Jama: <strong class="text-emerald-400">₹${(Number(inv.advancePaid)||0).toLocaleString('en-IN')}</strong></div>
              <div>Baki: <strong class="text-rose-400">₹${(Number(inv.balanceDue)||0).toLocaleString('en-IN')}</strong></div>
            </div>
            <div class="flex justify-between items-center pt-1 border-t border-slate-800 text-[11px]">
              <div class="flex gap-1.5">
                <button class="btn btn-secondary py-1 px-2.5 text-emerald-400 btn-wa" data-inv="${inv.invoiceNumber}">📲 WA</button>
                <button class="btn btn-secondary py-1 px-2.5 text-amber-400 font-bold btn-print" data-inv="${inv.invoiceNumber}">🖨️ PDF Bill</button>
              </div>
              <div class="flex gap-1">
                <button class="btn btn-secondary py-1 px-2 btn-edit" data-inv="${inv.invoiceNumber}">✏️</button>
                <button class="btn btn-danger py-1 px-2 btn-del" data-inv="${inv.invoiceNumber}">🗑️</button>
              </div>
            </div>
          </div>
        `;
      }).join("");

  containerEl.innerHTML = `
    <div class="flex justify-between items-center gap-2">
      <div>
        <h2 class="text-lg font-black text-white">Billing & Invoices</h2>
        <p class="text-xs text-slate-400">Kul Bill: <span class="font-mono text-amber-400 font-bold">${invoices.length}</span></p>
      </div>
      <button id="btn-add-bill" class="btn btn-primary text-xs py-2 px-3 font-bold shadow-lg">+ Naya Bill Banayein</button>
    </div>
    <div class="grid grid-cols-3 gap-2 text-center text-xs">
      <div class="stat-metric p-2"><div class="stat-label text-[10px]">Total Billing</div><div class="stat-value text-sm text-white">₹${totBilled.toLocaleString('en-IN')}</div></div>
      <div class="stat-metric p-2"><div class="stat-label text-[10px]">Total Jama</div><div class="stat-value text-sm text-emerald-400">₹${totCol.toLocaleString('en-IN')}</div></div>
      <div class="stat-metric p-2 border-rose-500/30"><div class="stat-label text-[10px] text-rose-400">Total Baki</div><div class="stat-value text-sm text-rose-400">₹${totDue.toLocaleString('en-IN')}</div></div>
    </div>
    <div class="space-y-3">${cards}</div>
  `;

  const modal = document.getElementById("modal-container");
  const modalContent = document.getElementById("modal-content");
  const openModal = (h) => { modalContent.innerHTML = h; modal.classList.remove("hidden"); };
  const closeModal = () => { modal.classList.add("hidden"); modalContent.innerHTML = ""; };

  document.getElementById("btn-add-bill")?.addEventListener("click", () => openBillModal(null, openModal, closeModal, containerEl, onNavigate));

  containerEl.querySelectorAll(".btn-edit").forEach(b => {
    b.onclick = () => {
      const inv = invoices.find(i => i.invoiceNumber === b.dataset.inv);
      if (inv) openBillModal(inv, openModal, closeModal, containerEl, onNavigate);
    };
  });

  containerEl.querySelectorAll(".btn-del").forEach(b => {
    b.onclick = async () => {
      const num = b.dataset.inv;
      if (confirm(`Kya aap bill #${num} delete karna chahte hain?`)) {
        await deleteDoc(doc(db, "invoices", num));
        renderBillingView(containerEl, onNavigate);
      }
    };
  });

  containerEl.querySelectorAll(".btn-wa").forEach(b => {
    b.onclick = () => {
      const inv = invoices.find(i => i.invoiceNumber === b.dataset.inv);
      if (!inv) return;
      const msg = `*${BIZ.name} - ${BIZ.sub}*\nBill #${inv.invoiceNumber}\nParty: *${inv.customerName}*\nGaadi: *${inv.vehicleNumber}*\nRoute: ${inv.pickupLocation || 'Local'}\nTotal: ₹${Number(inv.totalAmount||0).toLocaleString('en-IN')}\nJama: ₹${Number(inv.advancePaid||0).toLocaleString('en-IN')}\n*Baki: ₹${Number(inv.balanceDue||0).toLocaleString('en-IN')}*\nDhanyawad! Contact: ${BIZ.mob}`;
      const num = (inv.customerPhone || '').replace(/\D/g, '');
      window.open(`https://wa.me/${num ? ('91' + num) : ''}?text=${encodeURIComponent(msg)}`, "_blank");
    };
  });

  containerEl.querySelectorAll(".btn-print").forEach(b => {
    b.onclick = () => {
      const inv = invoices.find(i => i.invoiceNumber === b.dataset.inv);
      if (inv) printRedBill(inv);
    };
  });
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
          <td><strong style="font-size:13px;">${inv.pickupLocation||'Local Udaipur Tour'}</strong><div style="color:#64748b; font-size:10px; margin-top:3px;">Vehicle: ${inv.vehicleNumber||'Cab'} (${inv.totalDays||1} Day)</div></td>
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

function openBillModal(inv, openModal, closeModal, containerEl, onNavigate) {
  const isEdit = !!inv;
  const today = new Date().toISOString().slice(0, 10);
  const autoNo = isEdit ? inv.invoiceNumber : ("ATU-" + Date.now().toString().slice(-4));

  openModal(`
    <h3 class="text-sm font-bold text-white mb-2">${isEdit ? 'Bill Edit Karein' : 'Naya Bill Banayein'}</h3>
    <form id="f-bill" class="space-y-2.5 text-xs">
      <div class="grid grid-cols-2 gap-2">
        <div><label class="form-label">Bill No</label><input type="text" id="b-num" class="form-input font-mono font-bold text-amber-400" value="${autoNo}" readonly></div>
        <div><label class="form-label">Date</label><input type="date" id="b-date" class="form-input font-mono" value="${isEdit ? inv.invoiceDate : today}" required></div>
      </div>
      <div class="grid grid-cols-2 gap-2">
        <div><label class="form-label">Party Name (M/s) *</label><input type="text" id="b-name" class="form-input font-bold" placeholder="Party Name" value="${isEdit ? inv.customerName : ''}" required></div>
        <div><label class="form-label">Phone</label><input type="tel" id="b-phone" class="form-input font-mono" placeholder="9876543210" value="${isEdit ? (inv.customerPhone||'') : ''}"></div>
      </div>
      <div class="grid grid-cols-2 gap-2">
        <div><label class="form-label">Vehicle No</label><input type="text" id="b-veh" class="form-input font-mono uppercase font-bold" placeholder="RJ27 TA 9869" value="${isEdit ? (inv.vehicleNumber||'') : ''}"></div>
        <div><label class="form-label">Particular / Route</label><input type="text" id="b-route" class="form-input" placeholder="Route details" value="${isEdit ? (inv.pickupLocation||'') : ''}"></div>
      </div>
      <div class="grid grid-cols-3 gap-2">
        <div><label class="form-label">Days</label><input type="number" id="b-days" class="form-input font-mono text-center font-bold" value="${isEdit ? (inv.totalDays||1) : 1}"></div>
        <div><label class="form-label">Total KM</label><input type="number" id="b-km" class="form-input font-mono text-center" value="${isEdit ? (inv.totalKm||250) : 250}"></div>
        <div><label class="form-label">Rate / KM</label><input type="number" id="b-rate" class="form-input font-mono text-center" value="${isEdit ? (inv.ratePerKm||12) : 12}"></div>
      </div>
      <div class="grid grid-cols-2 gap-2">
        <div><label class="form-label">Fare (₹)</label><input type="number" id="b-fare" class="form-input font-mono font-bold text-white" value="${isEdit ? (inv.vehicleFare||3000) : 3000}"></div>
        <div><label class="form-label">Night / Bhatta (₹)</label><input type="number" id="b-bhatta" class="form-input font-mono" value="${isEdit ? (inv.driverBhatta||300) : 300}"></div>
      </div>
      <div class="grid grid-cols-2 gap-2">
        <div><label class="form-label">Toll / Parking (₹)</label><input type="number" id="b-toll" class="form-input font-mono" value="${isEdit ? (inv.tollCharges||0) : 0}"></div>
        <div><label class="form-label">Advance Jama (₹)</label><input type="number" id="b-adv" class="form-input font-mono font-bold text-emerald-400" value="${isEdit ? (inv.advancePaid||0) : 0}"></div>
      </div>
      <div class="bg-amber-500/10 p-2 rounded-lg border border-amber-500/30 flex justify-between font-mono font-bold text-xs">
        <span>Total: <span id="b-tot-disp" class="text-amber-400">₹3,300</span></span>
        <span>Due: <span id="b-bal-disp" class="text-rose-400">₹3,300</span></span>
      </div>
      <div class="flex gap-2 pt-1">
        <button type="submit" class="btn btn-primary flex-1 py-2 font-bold shadow-md">${isEdit ? 'Update Karein' : 'Bill Banayein'}</button>
        <button type="button" id="b-close" class="btn btn-secondary py-2">Radd</button>
      </div>
    </form>
  `);

  const dIn = document.getElementById("b-days");
  const kIn = document.getElementById("b-km");
  const rIn = document.getElementById("b-rate");
  const fIn = document.getElementById("b-fare");
  const bhIn = document.getElementById("b-bhatta");
  const tIn = document.getElementById("b-toll");
  const aIn = document.getElementById("b-adv");
  const totD = document.getElementById("b-tot-disp");
  const balD = document.getElementById("b-bal-disp");

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

  document.getElementById("b-close").onclick = closeModal;

  document.getElementById("f-bill").onsubmit = async (e) => {
    e.preventDefault();
    const tot = (Number(fIn.value)||0) + (Number(bhIn.value)||0) + (Number(tIn.value)||0);
    const adv = Number(aIn.value) || 0;
    const bal = Math.max(0, tot - adv);

    await setDoc(doc(db, "invoices", autoNo), {
      invoiceNumber: autoNo,
      invoiceDate: document.getElementById("b-date").value,
      customerName: document.getElementById("b-name").value.trim(),
      customerPhone: document.getElementById("b-phone").value.trim(),
      vehicleNumber: document.getElementById("b-veh").value.trim().toUpperCase(),
      pickupLocation: document.getElementById("b-route").value.trim(),
      totalDays: Number(dIn.value) || 1,
      totalKm: Number(kIn.value) || 0,
      ratePerKm: Number(rIn.value) || 0,
      vehicleFare: Number(fIn.value) || 0,
      driverBhatta: Number(bhIn.value) || 0,
      tollCharges: Number(tIn.value) || 0,
      totalAmount: tot,
      advancePaid: adv,
      balanceDue: bal,
      createdAt: isEdit ? (inv.createdAt || new Date().toISOString()) : new Date().toISOString()
    }, { merge: true });

    alert(`Bill #${autoNo} successfully save ho gaya!`);
    closeModal();
    renderBillingView(containerEl, onNavigate);
  };
}
