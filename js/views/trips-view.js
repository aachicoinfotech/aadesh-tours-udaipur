// js/views/trips-view.js
// Aadesh Tours Udaipur - Trips & Entry Manager with Choice Popup & Billing Modes

window.TripsView = {
    render: function(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = `
            <div class="max-w-6xl mx-auto p-4 sm:p-6 text-slate-100">
                <!-- Top Action Header -->
                <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-lg">
                    <div>
                        <h2 class="text-xl font-bold text-amber-400 flex items-center gap-2">
                            <span>🚗</span> Trips & Duty Slips Manager
                        </h2>
                        <p class="text-xs text-slate-400 mt-0.5">Aadesh Tours Udaipur - Manage all journeys, duty slips & bills</p>
                    </div>
                    <button onclick="TripsView.openChoiceModal()" class="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-sm flex items-center gap-2 transition shadow-md">
                        <span>➕</span> Nayi Entry / Duty Slip
                    </button>
                </div>

                <!-- Trips Active/History Table -->
                <div class="bg-slate-900 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
                    <div class="p-4 border-b border-slate-800 flex justify-between items-center">
                        <h3 class="font-semibold text-slate-200">Aapki Haal Hi Ki Entries</h3>
                        <span class="text-xs bg-slate-800 text-amber-400 px-3 py-1 rounded-full font-medium">Live Sync Active</span>
                    </div>
                    <div class="overflow-x-auto">
                        <table class="w-full text-left border-collapse text-sm">
                            <thead>
                                <tr class="bg-slate-950/60 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-800">
                                    <th class="p-3">Slip/Bill No</th>
                                    <th class="p-3">Date & Guest</th>
                                    <th class="p-3">Vehicle / Driver</th>
                                    <th class="p-3">Billing Mode</th>
                                    <th class="p-3">Amount / Status</th>
                                    <th class="p-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody id="trips-table-body" class="divide-y divide-slate-800/60 text-slate-300">
                                <!-- Dynamic rows populated via loadTrips() -->
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Modal Container for Choice / Entry Form -->
                <div id="trip-modal" class="fixed inset-0 bg-slate-950/80 backdrop-blur-sm hidden items-center justify-center z-50 p-4">
                    <div id="modal-content-box" class="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
                        <!-- Dynamic Modal Content -->
                    </div>
                </div>
            </div>
        `;

        this.loadTrips();
    },

    openChoiceModal: function() {
        const modal = document.getElementById('trip-modal');
        const box = document.getElementById('modal-content-box');
        
        box.innerHTML = `
            <div class="p-6">
                <div class="flex justify-between items-center mb-6 border-b border-slate-800 pb-3">
                    <h3 class="text-lg font-bold text-amber-400">Kya banana chahte hain aap?</h3>
                    <button onclick="TripsView.closeModal()" class="text-slate-400 hover:text-white text-lg font-bold">&times;</button>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button onclick="TripsView.openEntryForm('duty-slip')" class="p-6 bg-slate-800 hover:bg-slate-750 border-2 border-slate-700 hover:border-amber-500 rounded-xl text-left transition group">
                        <div class="text-2xl mb-2">📋</div>
                        <h4 class="font-bold text-slate-100 group-hover:text-amber-400 text-base">Duty Slip (Log Sheet)</h4>
                        <p class="text-xs text-slate-400 mt-1">Customer se sign karwane ke liye physical log sheet format.</p>
                    </button>
                    <button onclick="TripsView.openEntryForm('final-bill')" class="p-6 bg-slate-800 hover:bg-slate-750 border-2 border-slate-700 hover:border-amber-500 rounded-xl text-left transition group">
                        <div class="text-2xl mb-2">🧾</div>
                        <h4 class="font-bold text-slate-100 group-hover:text-amber-400 text-base">Final Bill / Invoice</h4>
                        <p class="text-xs text-slate-400 mt-1">Yatra khatam hone par pakka red billbook invoice.</p>
                    </button>
                </div>
            </div>
        `;
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    },

    closeModal: function() {
        const modal = document.getElementById('trip-modal');
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    },

    openEntryForm: function(type) {
        if (type === 'duty-slip') {
            this.closeModal();
            if (window.DutySlipView) {
                window.DutySlipView.render('app-container');
            }
            return;
        }

        // Final Bill Form with Billing Modes & Payment Options
        const box = document.getElementById('modal-content-box');
        const slipNo = 'ATU-' + Math.floor(1000 + Math.random() * 9000);
        const today = new Date().toISOString().split('T')[0];

        box.innerHTML = `
            <div class="p-6">
                <div class="flex justify-between items-center mb-4 border-b border-slate-800 pb-3">
                    <h3 class="text-lg font-bold text-amber-400">🧾 Naya Final Bill / Invoice Banayein</h3>
                    <button onclick="TripsView.closeModal()" class="text-slate-400 hover:text-white text-lg font-bold">&times;</button>
                </div>

                <form id="final-bill-form" onsubmit="TripsView.saveFinalBill(event)" class="space-y-4 text-sm">
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label class="block text-xs font-semibold text-slate-400 mb-1">Bill / Slip No</label>
                            <input type="text" id="fb-slip" value="${slipNo}" readonly class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-300 font-mono">
                        </div>
                        <div>
                            <label class="block text-xs font-semibold text-slate-400 mb-1">Date</label>
                            <input type="date" id="fb-date" value="${today}" class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-300">
                        </div>
                    </div>

                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label class="block text-xs font-semibold text-slate-400 mb-1">Party / Guest Name *</label>
                            <input type="text" id="fb-party" required placeholder="Guest or Party Name" class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-300">
                        </div>
                        <div>
                            <label class="block text-xs font-semibold text-slate-400 mb-1">Vehicle Number *</label>
                            <input type="text" id="fb-vehicle" required placeholder="e.g. RJ-27-PA-0000" class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-300">
                        </div>
                    </div>

                    <!-- Billing Mode Selector -->
                    <div class="bg-slate-950 p-3 rounded-xl border border-slate-800">
                        <label class="block text-xs font-semibold text-amber-400 mb-2">Billing Mode (Calculation Tarika):</label>
                        <select id="fb-mode" onchange="TripsView.toggleModeFields()" class="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-300 font-medium">
                            <option value="outstation">🚗 Outstation (KM + Bhatta)</option>
                            <option value="package">📦 Fixed Package (Airport / Local)</option>
                            <option value="corporate">🏢 Corporate / Custom</option>
                        </select>
                    </div>

                    <!-- Dynamic Mode Fields -->
                    <div id="mode-fields-container" class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                            <label class="block text-xs font-semibold text-slate-400 mb-1">Start KM</label>
                            <input type="number" id="fb-start-km" value="0" class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-300">
                        </div>
                        <div>
                            <label class="block text-xs font-semibold text-slate-400 mb-1">End KM</label>
                            <input type="number" id="fb-end-km" value="0" class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-300">
                        </div>
                        <div>
                            <label class="block text-xs font-semibold text-slate-400 mb-1">Rate per KM (₹)</label>
                            <input type="number" id="fb-rate" value="12" class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-300">
                        </div>
                    </div>

                    <!-- Extra Charges -->
                    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div>
                            <label class="block text-xs font-semibold text-slate-400 mb-1">Toll (₹)</label>
                            <input type="number" id="fb-toll" value="0" class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-300">
                        </div>
                        <div>
                            <label class="block text-xs font-semibold text-slate-400 mb-1">Parking (₹)</label>
                            <input type="number" id="fb-parking" value="0" class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-300">
                        </div>
                        <div>
                            <label class="block text-xs font-semibold text-slate-400 mb-1">Border Tax (₹)</label>
                            <input type="number" id="fb-border" value="0" class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-300">
                        </div>
                        <div>
                            <label class="block text-xs font-semibold text-slate-400 mb-1">Advance (₹)</label>
                            <input type="number" id="fb-advance" value="0" class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-300">
                        </div>
                    </div>

                    <!-- Payment Mode & Receiver -->
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800">
                        <div>
                            <label class="block text-xs font-semibold text-slate-400 mb-1">Payment Mode / Receiver</label>
                            <select id="fb-pay-receiver" class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-300">
                                <option value="cash-office">💵 Cash (Office / Galla)</option>
                                <option value="online-bank">📱 Online (SBI Bank / UPI)</option>
                                <option value="driver-cash">👤 Driver ke Paas (Collection)</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-xs font-semibold text-slate-400 mb-1">GST / Tax Invoice?</label>
                            <select id="fb-is-tax" class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-300">
                                <option value="no">Normal Bill (Non-Tax)</option>
                                <option value="yes">GST Tax Invoice (5% / 12%)</option>
                            </select>
                        </div>
                    </div>

                    <div class="flex justify-end gap-3 pt-4 border-t border-slate-800">
                        <button type="button" onclick="TripsView.closeModal()" class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium transition">Radd Karein</button>
                        <button type="submit" class="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl font-bold transition">Bill Save Karein & Dekhein</button>
                    </div>
                </form>
            </div>
        `;
    },

    toggleModeFields: function() {
        const mode = document.getElementById('fb-mode').value;
        const container = document.getElementById('mode-fields-container');

        if (mode === 'package') {
            container.innerHTML = `
                <div class="sm:col-span-3">
                    <label class="block text-xs font-semibold text-amber-400 mb-1">Fixed Package Amount (₹) [Airport / Local]</label>
                    <input type="number" id="fb-package-amount" value="800" class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 font-bold text-lg">
                </div>
            `;
        } else if (mode === 'corporate') {
            container.innerHTML = `
                <div class="sm:col-span-2">
                    <label class="block text-xs font-semibold text-amber-400 mb-1">Corporate Custom Amount (₹)</label>
                    <input type="number" id="fb-corp-amount" value="5000" class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 font-bold text-lg">
                </div>
                <div>
                    <label class="block text-xs font-semibold text-slate-400 mb-1">Company Ref No</label>
                    <input type="text" id="fb-corp-ref" placeholder="PO / Ref No" class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-300">
                </div>
            `;
        } else {
            container.innerHTML = `
                <div>
                    <label class="block text-xs font-semibold text-slate-400 mb-1">Start KM</label>
                    <input type="number" id="fb-start-km" value="0" class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-300">
                </div>
                <div>
                    <label class="block text-xs font-semibold text-slate-400 mb-1">End KM</label>
                    <input type="number" id="fb-end-km" value="0" class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-300">
                </div>
                <div>
                    <label class="block text-xs font-semibold text-slate-400 mb-1">Rate per KM (₹)</label>
                    <input type="number" id="fb-rate" value="12" class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-300">
                </div>
            `;
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
        const receiver = document.getElementById('fb-pay-receiver').value;
        const isTax = document.getElementById('fb-is-tax').value === 'yes';

        let totalAmount = 0;
        let kmRun = 0;

        if (mode === 'package') {
            totalAmount = parseFloat(document.getElementById('fb-package-amount').value) || 0;
        } else if (mode === 'corporate') {
            totalAmount = parseFloat(document.getElementById('fb-corp-amount').value) || 0;
        } else {
            const startKm = parseFloat(document.getElementById('fb-start-km').value) || 0;
            const endKm = parseFloat(document.getElementById('fb-end-km').value) || 0;
            const rate = parseFloat(document.getElementById('fb-rate').value) || 12;
            kmRun = endKm > startKm ? endKm - startKm : 0;
            totalAmount = (kmRun * rate);
        }

        const grandTotal = totalAmount + toll + parking + border;
        const balanceDue = grandTotal - advance;

        const billObj = {
            id: 'BILL-' + Date.now(),
            slipNo,
            date,
            party,
            vehicle,
            mode,
            kmRun,
            totalAmount,
            toll,
            parking,
            border,
            grandTotal,
            advance,
            balanceDue,
            receiver,
            isTax,
            status: balanceDue <= 0 ? 'Paid' : 'Due'
        };

        // Save to localStorage (Billing & Trips sync)
        let trips = JSON.parse(localStorage.getItem('aadesh_trips') || '[]');
        trips.unshift(billObj);
        localStorage.setItem('aadesh_trips', JSON.stringify(trips));

        // Also update Dainik Galla if advance received in cash
        if (advance > 0 && receiver === 'cash-office') {
            let galla = JSON.parse(localStorage.getItem('aadesh_galla') || '{"cashIn": 0, "cashOut": 0}');
            galla.cashIn = (galla.cashIn || 0) + advance;
            localStorage.setItem('aadesh_galla', JSON.stringify(galla));
        }

        this.closeModal();
        this.loadTrips();

        // Open Billing View to show the invoice
        if (window.BillingView) {
            window.BillingView.render('app-container', billObj);
        }
    },

    loadTrips: function() {
        const tbody = document.getElementById('trips-table-body');
        if (!tbody) return;

        const trips = JSON.parse(localStorage.getItem('aadesh_trips') || '[]');
        if (trips.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" class="p-6 text-center text-slate-500">Abhi tak koi trip ya bill darj nahi hai. "+ Nayi Entry" par click karein.</td></tr>`;
            return;
        }

        tbody.innerHTML = trips.map(t => `
            <tr class="hover:bg-slate-800/40 transition">
                <td class="p-3 font-mono font-bold text-amber-400">${t.slipNo} ${t.isTax ? '<span class="text-[10px] bg-red-900 text-red-200 px-1.5 py-0.5 rounded ml-1">TAX</span>' : ''}</td>
                <td class="p-3">
                    <div class="font-semibold text-slate-200">${t.party}</div>
                    <div class="text-xs text-slate-400">${t.date}</div>
                </td>
                <td class="p-3 font-medium text-slate-300">${t.vehicle}</td>
                <td class="p-3 uppercase text-xs font-semibold text-slate-400">${t.mode}</td>
                <td class="p-3">
                    <div class="font-bold text-slate-100">₹${t.grandTotal}</div>
                    <div class="text-xs ${t.balanceDue > 0 ? 'text-amber-400 font-semibold' : 'text-emerald-400'}">
                        ${t.balanceDue > 0 ? 'Due: ₹' + t.balanceDue : 'Paid'}
                    </div>
                </td>
                <td class="p-3 text-right">
                    <button onclick="TripsView.viewBill('${t.id}')" class="bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-300 px-3 py-1.5 rounded-lg text-xs font-semibold transition">
                        Bill Dekhein
                    </button>
                </td>
            </tr>
        `).join('');
    },

    viewBill: function(id) {
        const trips = JSON.parse(localStorage.getItem('aadesh_trips') || '[]');
        const bill = trips.find(t => t.id === id);
        if (bill && window.BillingView) {
            window.BillingView.render('app-container', bill);
        }
    }
};
