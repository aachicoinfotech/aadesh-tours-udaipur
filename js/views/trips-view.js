// js/views/trips-view.js - Aadesh Tours Udaipur Trips Manager
window.TripsView = {
    render: function(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = `
            <div class="space-y-4">
                <div class="vault-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                        <h2 class="text-base font-bold text-amber-400">📋 Trips & Duty Slips Manager</h2>
                        <p class="text-xs text-slate-400">Aadesh Tours Udaipur - Manage all journeys</p>
                    </div>
                    <button onclick="TripsView.openChoiceModal()" class="btn btn-primary px-3 py-2 text-xs">
                        ➕ Nayi Entry / Duty Slip
                    </button>
                </div>

                <div class="vault-card overflow-hidden">
                    <div class="overflow-x-auto">
                        <table class="tally-table">
                            <thead>
                                <tr>
                                    <th>Slip/Bill No</th>
                                    <th>Date & Guest</th>
                                    <th>Vehicle</th>
                                    <th>Mode</th>
                                    <th>Amount</th>
                                    <th class="text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody id="trips-table-body">
                                <!-- Populated dynamically -->
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
        this.loadTrips();
    },

    loadTrips: function() {
        const tbody = document.getElementById('trips-table-body');
        if (!tbody) return;
        const trips = JSON.parse(localStorage.getItem('aadesh_trips') || '[]');
        if (trips.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" class="text-center text-slate-500 py-4">Abhi tak koi trip darj nahi hai.</td></tr>`;
            return;
        }

        tbody.innerHTML = trips.map(t => `
            <tr>
                <td class="font-mono font-bold text-amber-400">${t.slipNo}</td>
                <td>
                    <div class="font-semibold text-slate-200">${t.party}</div>
                    <div class="text-[10px] text-slate-400">${t.date}</div>
                </td>
                <td>${t.vehicle}</td>
                <td class="uppercase text-[10px] text-slate-400">${t.mode}</td>
                <td>
                    <div class="font-bold text-slate-100">₹${t.grandTotal}</div>
                    <div class="text-[10px] ${t.balanceDue > 0 ? 'text-amber-400' : 'text-emerald-400'}">${t.balanceDue > 0 ? 'Due: ₹' + t.balanceDue : 'Paid'}</div>
                </td>
                <td class="text-right">
                    <button onclick="TripsView.viewBill('${t.id}')" class="btn btn-secondary px-2.5 py-1 text-[11px]">Bill Dekhein</button>
                </td>
            </tr>
        `).join('');
    },

    openChoiceModal: function() {
        const modal = document.getElementById('modal-container');
        const content = document.getElementById('modal-content');
        if (!modal || !content) return;

        content.innerHTML = `
            <div class="p-4 space-y-4">
                <div class="flex justify-between items-center border-b border-slate-800 pb-2">
                    <h3 class="text-sm font-bold text-amber-400">Kya banana chahte hain aap?</h3>
                    <button onclick="document.getElementById('modal-container').classList.add('hidden')" class="text-slate-400 hover:text-white">&times;</button>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button onclick="document.getElementById('modal-container').classList.add('hidden'); if(window.DutySlipView) DutySlipView.render('tab-trips');" class="vault-card text-left hover:border-amber-500 transition">
                        <div class="text-xl mb-1">📋</div>
                        <h4 class="font-bold text-slate-100 text-xs">Duty Slip (Log Sheet)</h4>
                        <p class="text-[10px] text-slate-400 mt-0.5">Physical log sheet for customer signature.</p>
                    </button>
                    <button onclick="TripsView.openFinalBillForm()" class="vault-card text-left hover:border-amber-500 transition">
                        <div class="text-xl mb-1">🧾</div>
                        <h4 class="font-bold text-slate-100 text-xs">Final Bill / Invoice</h4>
                        <p class="text-[10px] text-slate-400 mt-0.5">Red billbook professional invoice.</p>
                    </button>
                </div>
            </div>
        `;
        modal.classList.remove('hidden');
    },

    openFinalBillForm: function() {
        const content = document.getElementById('modal-content');
        const slipNo = 'ATU-' + Math.floor(1000 + Math.random() * 9000);
        const today = new Date().toISOString().split('T')[0];

        content.innerHTML = `
            <div class="p-4 space-y-3">
                <div class="flex justify-between items-center border-b border-slate-800 pb-2">
                    <h3 class="text-sm font-bold text-amber-400">🧾 Naya Final Bill / Invoice</h3>
                    <button onclick="document.getElementById('modal-container').classList.add('hidden')" class="text-slate-400 hover:text-white">&times;</button>
                </div>
                <form onsubmit="TripsView.saveFinalBill(event)" class="space-y-3 text-xs">
                    <div class="grid grid-cols-2 gap-2">
                        <div>
                            <label class="form-label">Bill No</label>
                            <input type="text" id="fb-slip" value="${slipNo}" readonly class="form-input font-mono">
                        </div>
                        <div>
                            <label class="form-label">Date</label>
                            <input type="date" id="fb-date" value="${today}" class="form-input">
                        </div>
                    </div>
                    <div class="grid grid-cols-2 gap-2">
                        <div>
                            <label class="form-label">Party / Guest Name *</label>
                            <input type="text" id="fb-party" required class="form-input" placeholder="Guest Name">
                        </div>
                        <div>
                            <label class="form-label">Vehicle Number *</label>
                            <input type="text" id="fb-vehicle" required class="form-input" placeholder="RJ-27-PA-0000">
                        </div>
                    </div>
                    <div>
                        <label class="form-label">Billing Mode</label>
                        <select id="fb-mode" onchange="TripsView.toggleModeFields()" class="form-select">
                            <option value="outstation">Outstation (KM + Bhatta)</option>
                            <option value="package">Fixed Package (Airport/Local)</option>
                            <option value="corporate">Corporate / Custom</option>
                        </select>
                    </div>
                    <div id="mode-fields-container" class="grid grid-cols-3 gap-2">
                        <div>
                            <label class="form-label">Start KM</label>
                            <input type="number" id="fb-start-km" value="0" class="form-input">
                        </div>
                        <div>
                            <label class="form-label">End KM</label>
                            <input type="number" id="fb-end-km" value="0" class="form-input">
                        </div>
                        <div>
                            <label class="form-label">Rate / KM</label>
                            <input type="number" id="fb-rate" value="12" class="form-input">
                        </div>
                    </div>
                    <div class="grid grid-cols-4 gap-2">
                        <div><label class="form-label">Toll</label><input type="number" id="fb-toll" value="0" class="form-input"></div>
                        <div><label class="form-label">Parking</label><input type="number" id="fb-parking" value="0" class="form-input"></div>
                        <div><label class="form-label">Border</label><input type="number" id="fb-border" value="0" class="form-input"></div>
                        <div><label class="form-label">Advance</label><input type="number" id="fb-advance" value="0" class="form-input"></div>
                    </div>
                    <div class="flex justify-end gap-2 pt-2 border-t border-slate-800">
                        <button type="button" onclick="document.getElementById('modal-container').classList.add('hidden')" class="btn btn-secondary px-3 py-1.5">Radd</button>
                        <button type="submit" class="btn btn-primary px-4 py-1.5">Save Bill</button>
                    </div>
                </form>
            </div>
        `;
    },

    toggleModeFields: function() {
        const mode = document.getElementById('fb-mode').value;
        const container = document.getElementById('mode-fields-container');
        if (mode === 'package') {
            container.innerHTML = `<div class="col-span-3"><label class="form-label">Fixed Package Amount (₹)</label><input type="number" id="fb-package-amount" value="800" class="form-input font-bold text-amber-400"></div>`;
        } else if (mode === 'corporate') {
            container.innerHTML = `<div class="col-span-2"><label class="form-label">Corporate Amount (₹)</label><input type="number" id="fb-corp-amount" value="5000" class="form-input font-bold text-amber-400"></div><div><label class="form-label">Ref No</label><input type="text" id="fb-corp-ref" class="form-input"></div>`;
        } else {
            container.innerHTML = `<div><label class="form-label">Start KM</label><input type="number" id="fb-start-km" value="0" class="form-input"></div><div><label class="form-label">End KM</label><input type="number" id="fb-end-km" value="0" class="form-input"></div><div><label class="form-label">Rate / KM</label><input type="number" id="fb-rate" value="12" class="form-input"></div>`;
        }
    },

    saveFinalBill: function(event) {
        event.preventDefault();
        const mode = document.getElementById('fb-mode').value;
        const slipNo = document.getElementById('fb-slip').value;
        const date = document.getElementById('fb-date').value;
        const party = document.getElementById('fb-party').value;
        const vehicle = document.getElementById('fb-vehicle').value;
        const toll = parseFloat(document.getElementById('fb-toll').value) || 0;
        const parking = parseFloat(document.getElementById('fb-parking').value) || 0;
        const border = parseFloat(document.getElementById('fb-border').value) || 0;
        const advance = parseFloat(document.getElementById('fb-advance').value) || 0;

        let totalAmount = 0, kmRun = 0;
        if (mode === 'package') totalAmount = parseFloat(document.getElementById('fb-package-amount').value) || 0;
        else if (mode === 'corporate') totalAmount = parseFloat(document.getElementById('fb-corp-amount').value) || 0;
        else {
            const startKm = parseFloat(document.getElementById('fb-start-km').value) || 0;
            const endKm = parseFloat(document.getElementById('fb-end-km').value) || 0;
            kmRun = endKm > startKm ? endKm - startKm : 0;
            totalAmount = kmRun * (parseFloat(document.getElementById('fb-rate').value) || 12);
        }

        const grandTotal = totalAmount + toll + parking + border;
        const balanceDue = grandTotal - advance;

        const billObj = {
            id: 'BILL-' + Date.now(), slipNo, date, party, vehicle, mode, kmRun,
            totalAmount, toll, parking, border, grandTotal, advance, balanceDue, receiver: 'cash-office', isTax: false
        };

        let trips = JSON.parse(localStorage.getItem('aadesh_trips') || '[]');
        trips.unshift(billObj);
        localStorage.setItem('aadesh_trips', JSON.stringify(trips));

        if (advance > 0) {
            let galla = JSON.parse(localStorage.getItem('aadesh_galla') || '{"cashIn": 0, "cashOut": 0}');
            galla.cashIn = (galla.cashIn || 0) + advance;
            localStorage.setItem('aadesh_galla', JSON.stringify(galla));
        }

        document.getElementById('modal-container').classList.add('hidden');
        window.switchTab('tab-billing');
        if (window.BillingView) window.BillingView.render('tab-billing', billObj);
    },

    viewBill: function(id) {
        const trips = JSON.parse(localStorage.getItem('aadesh_trips') || '[]');
        const bill = trips.find(t => t.id === id);
        if (bill && window.BillingView) {
            window.switchTab('tab-billing');
            window.BillingView.render('tab-billing', bill);
        }
    }
};
