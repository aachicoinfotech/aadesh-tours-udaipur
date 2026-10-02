// js/views/trips-view.js - Trips & Duty Slip Manager with Category & Full CRUD
window.TripsView = {
    render: function(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = `
            <div class="space-y-4">
                <div class="vault-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                        <h2 class="text-base font-bold text-amber-400">📋 Trips & Duty Slips Management Vault</h2>
                        <p class="text-xs text-slate-400">Aadesh Tours Udaipur - Manage Categories (One Day, Tour Package, Corporate)</p>
                    </div>
                    <button type="button" onclick="TripsView.openTripCategoryModal()" class="btn btn-primary px-3 py-2 text-xs">
                        ➕ Nayi Trip / Duty Jodein
                    </button>
                </div>

                <!-- Trips List Table with Full CRUD -->
                <div class="vault-card space-y-3">
                    <h3 class="text-xs font-bold text-slate-200 uppercase tracking-wider">All Booked Trips & Duty Slips</h3>
                    <div class="overflow-x-auto">
                        <table class="tally-table">
                            <thead>
                                <tr>
                                    <th>Trip ID / Date</th>
                                    <th>Category</th>
                                    <th>Vehicle & Driver</th>
                                    <th>Guest Name</th>
                                    <th>Total Amount</th>
                                    <th class="text-right">Actions (Edit / Delete / Duty Slip)</th>
                                </tr>
                            </thead>
                            <tbody id="trips-table-body"></tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
        this.loadTripsData();
    },

    loadTripsData: function() {
        const tbody = document.getElementById('trips-table-body');
        if (!tbody) return;
        let trips = JSON.parse(localStorage.getItem('aadesh_trips') || '[]');

        tbody.innerHTML = trips.map(t => `
            <tr>
                <td>
                    <div class="font-bold text-amber-400 font-mono">${t.id}</div>
                    <div class="text-[10px] text-slate-400">${t.date}</div>
                </td>
                <td><span class="badge-status bg-amber-500/20 text-amber-400">${t.category}</span></td>
                <td>
                    <div class="font-bold">${t.vehicle || 'N/A'}</div>
                    <div class="text-[10px] text-slate-400">${t.driver || 'N/A'}</div>
                </td>
                <td>
                    <div>${t.guestName}</div>
                    <div class="text-[10px] text-slate-400">${t.guestMob}</div>
                </td>
                <td class="font-mono font-bold text-emerald-400">₹${t.grandTotal || 0}</td>
                <td class="text-right space-x-1">
                    <button type="button" onclick="TripsView.openDutySlipModal('${t.id}')" class="btn btn-secondary px-2 py-1 text-[10px] text-amber-400">Duty Slip</button>
                    <button type="button" onclick="TripsView.openTripCategoryModal('${t.id}')" class="btn btn-secondary px-2 py-1 text-[10px] text-sky-400">Edit</button>
                    <button type="button" onclick="TripsView.deleteTrip('${t.id}')" class="btn btn-secondary px-2 py-1 text-[10px] text-rose-400">Delete</button>
                </td>
            </tr>
        `).join('') || '<tr><td colspan="6" class="text-center text-slate-500 py-4">Koi trip darj nahi hai. Nayi trip jodein.</td></tr>';
    },

    openTripCategoryModal: function(id = null) {
        const modal = document.getElementById('modal-container');
        const content = document.getElementById('modal-content');
        if (!modal || !content) return;

        let trip = { category: 'One Day Local/Outstation', vehicle: '', driver: '', guestName: '', guestMob: '', company: '', grandTotal: 0 };
        if (id) {
            const trips = JSON.parse(localStorage.getItem('aadesh_trips') || '[]');
            const found = trips.find(t => t.id === id);
            if (found) trip = found;
        }

        content.innerHTML = `
            <div class="p-5 space-y-4 bg-slate-900 text-slate-100 rounded-xl max-h-[90vh] overflow-y-auto">
                <div class="flex justify-between items-center border-b border-slate-800 pb-2">
                    <h3 class="text-sm font-bold text-amber-400">${id ? '✏️ Trip Update Karein' : '🚘 Nayi Trip / Duty Category Chunein'}</h3>
                    <button type="button" onclick="document.getElementById('modal-container').classList.add('hidden')" class="text-slate-400 hover:text-white text-lg font-bold">&times;</button>
                </div>
                <form onsubmit="TripsView.saveTrip(event, '${id || ''}')" class="space-y-3 text-xs">
                    <div>
                        <label class="form-label text-slate-300">Trip Category *</label>
                        <select id="trip-category" class="form-input bg-slate-950 text-white border-slate-700">
                            <option value="One Day" ${trip.category === 'One Day' ? 'selected' : ''}>One Day Local / Outstation</option>
                            <option value="Multi Day Tour" ${trip.category === 'Multi Day Tour' ? 'selected' : ''}>Multi Day Tour Package</option>
                            <option value="Corporate Duty" ${trip.category === 'Corporate Duty' ? 'selected' : ''}>Corporate Duty</option>
                        </select>
                    </div>
                    <div class="grid grid-cols-2 gap-2">
                        <div>
                            <label class="form-label text-slate-300">Vehicle Number</label>
                            <input type="text" id="trip-vehicle" value="${trip.vehicle}" class="form-input bg-slate-950 text-white border-slate-700 font-mono uppercase" placeholder="RJ-27-PA-0000">
                        </div>
                        <div>
                            <label class="form-label text-slate-300">Driver Name</label>
                            <input type="text" id="trip-driver" value="${trip.driver}" class="form-input bg-slate-950 text-white border-slate-700" placeholder="Driver Name">
                        </div>
                    </div>
                    <div class="grid grid-cols-2 gap-2">
                        <div>
                            <label class="form-label text-slate-300">Guest Name *</label>
                            <input type="text" id="trip-guest" required value="${trip.guestName}" class="form-input bg-slate-950 text-white border-slate-700" placeholder="Guest Name">
                        </div>
                        <div>
                            <label class="form-label text-slate-300">Guest Mobile *</label>
                            <input type="text" id="trip-guest-mob" required value="${trip.guestMob}" class="form-input bg-slate-950 text-white border-slate-700 font-mono" placeholder="Mobile">
                        </div>
                    </div>
                    <div>
                        <label class="form-label text-slate-300">Company Name (Optional)</label>
                        <input type="text" id="trip-company" value="${trip.company}" class="form-input bg-slate-950 text-white border-slate-700" placeholder="Company Name">
                    </div>
                    <div>
                        <label class="form-label text-slate-300">Total Amount / Estimated Fare (₹)</label>
                        <input type="number" id="trip-amount" value="${trip.grandTotal}" class="form-input bg-slate-950 text-amber-400 border-slate-700 font-mono font-bold" placeholder="0">
                    </div>
                    <div class="flex justify-end gap-2 pt-3 border-t border-slate-800">
                        <button type="button" onclick="document.getElementById('modal-container').classList.add('hidden')" class="btn btn-secondary px-3 py-1.5">Radd</button>
                        <button type="submit" class="btn btn-primary px-4 py-1.5 font-bold">${id ? 'Update Trip' : 'Save & Create Slip'}</button>
                    </div>
                </form>
            </div>
        `;
        modal.classList.remove('hidden');
    },

    saveTrip: function(event, id) {
        event.preventDefault();
        const category = document.getElementById('trip-category').value;
        const vehicle = document.getElementById('trip-vehicle').value.trim();
        const driver = document.getElementById('trip-driver').value.trim();
        const guestName = document.getElementById('trip-guest').value.trim();
        const guestMob = document.getElementById('trip-guest-mob').value.trim();
        const company = document.getElementById('trip-company').value.trim();
        const grandTotal = parseFloat(document.getElementById('trip-amount').value) || 0;
        const date = new Date().toISOString().split('T')[0];

        let trips = JSON.parse(localStorage.getItem('aadesh_trips') || '[]');
        if (id) {
            trips = trips.map(t => t.id === id ? { ...t, category, vehicle, driver, guestName, guestMob, company, grandTotal } : t);
        } else {
            const newTrip = {
                id: 'TRIP-' + Math.floor(1000 + Math.random() * 9000),
                date,
                category,
                vehicle,
                driver,
                guestName,
                guestMob,
                company,
                grandTotal,
                rows: [
                    { day: 1, date, assignment: 'Local / Reporting Udaipur', startKm: 0, endKm: 0, startTime: '09:00', endTime: '18:00' }
                ]
            };
            trips.unshift(newTrip);
        }
        localStorage.setItem('aadesh_trips', JSON.stringify(trips));

        document.getElementById('modal-container').classList.add('hidden');
        this.loadTripsData();
    },

    deleteTrip: function(id) {
        if (!confirm('Kya aap is trip ko delete karna chahte hain?')) return;
        let trips = JSON.parse(localStorage.getItem('aadesh_trips') || '[]');
        trips = trips.filter(t => t.id !== id);
        localStorage.setItem('aadesh_trips', JSON.stringify(trips));
        this.loadTripsData();
    },

    openDutySlipModal: function(tripId) {
        const modal = document.getElementById('modal-container');
        const content = document.getElementById('modal-content');
        if (!modal || !content) return;

        const trips = JSON.parse(localStorage.getItem('aadesh_trips') || '[]');
        const trip = trips.find(t => t.id === tripId);
        if (!trip) return;

        if (!trip.rows) {
            trip.rows = [{ day: 1, date: trip.date, assignment: '', startKm: 0, endKm: 0, startTime: '09:00', endTime: '18:00' }];
        }

        window.activeDutyTripId = tripId;

        content.innerHTML = `
            <div class="p-6 space-y-4 bg-white text-slate-900 rounded-xl max-h-[90vh] overflow-y-auto font-sans">
                <div class="flex justify-between items-center border-b-2 border-slate-900 pb-3 print:hidden">
                    <h3 class="text-sm font-bold text-orange-600">📋 Duty Slip & Multi-Day Log Sheet</h3>
                    <div class="flex gap-2">
                        <button type="button" onclick="window.print()" class="btn btn-primary px-3 py-1 text-xs">🖨️ Print</button>
                        <button type="button" onclick="TripsView.addDutyRow('${trip.id}')" class="btn btn-secondary px-3 py-1 text-xs">➕ Din Jodein (Add Day)</button>
                        <button type="button" onclick="document.getElementById('modal-container').classList.add('hidden')" class="text-slate-900 font-bold text-lg">&times;</button>
                    </div>
                </div>

                <!-- Physical Log Sheet Header -->
                <div class="text-center border-b-2 border-slate-900 pb-2 space-y-1">
                    <h1 class="text-xl font-black tracking-wider text-orange-600">AADESH TOURS UDAIPUR</h1>
                    <p class="text-xs font-bold tracking-widest text-slate-800">9602842390 / 7043195007</p>
                </div>

                <div class="flex justify-between items-center text-xs border-b border-slate-400 pb-2 font-bold">
                    <div>Slip No: <span class="font-mono">${trip.id}</span></div>
                    <div>Date: <span class="font-mono">${trip.date}</span></div>
                </div>

                <!-- Info Box -->
                <div class="border border-slate-900 text-xs">
                    <div class="grid grid-cols-2 border-b border-slate-900 p-1.5">
                        <div><strong class="font-bold">Vehicle:</strong> ${trip.vehicle || 'N/A'}</div>
                        <div><strong class="font-bold">Driver:</strong> ${trip.driver || 'N/A'}</div>
                    </div>
                    <div class="grid grid-cols-2 border-b border-slate-900 p-1.5">
                        <div><strong class="font-bold">Guest:</strong> ${trip.guestName} (${trip.guestMob})</div>
                        <div><strong class="font-bold">Company:</strong> ${trip.company || 'N/A'}</div>
                    </div>
                </div>

                <!-- Multi-Day Rows Table with Add/Delete -->
                <div class="overflow-x-auto border border-slate-900">
                    <table class="w-full text-center text-[11px] border-collapse">
                        <thead>
                            <tr class="bg-slate-200 border-b border-slate-900 font-bold">
                                <th class="border-r border-slate-900 p-1">Days</th>
                                <th class="border-r border-slate-900 p-1">Date</th>
                                <th class="border-r border-slate-900 p-1">Assignment</th>
                                <th class="border-r border-slate-900 p-1">Start-Km</th>
                                <th class="border-r border-slate-900 p-1">End-Km</th>
                                <th class="border-r border-slate-900 p-1">Total Km</th>
                                <th class="border-r border-slate-900 p-1">Start Time</th>
                                <th class="border-r border-slate-900 p-1">End Time</th>
                                <th class="p-1 print:hidden">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${trip.rows.map((r, idx) => `
                                <tr class="border-b border-slate-400">
                                    <td class="border-r border-slate-400 p-1 font-mono font-bold">${idx + 1}</td>
                                    <td class="border-r border-slate-400 p-1"><input type="date" value="${r.date}" class="bg-transparent text-center font-mono text-[10px]" onchange="TripsView.updateDutyRow('${trip.id}',${idx}, 'date', this.value)"></td>
                                    <td class="border-r border-slate-400 p-1"><input type="text" value="${r.assignment}" class="w-full bg-transparent px-1 text-[11px]" placeholder="Route details" onchange="TripsView.updateDutyRow('${trip.id}',${idx}, 'assignment', this.value)"></td>
                                    <td class="border-r border-slate-400 p-1"><input type="number" value="${r.startKm}" class="w-16 bg-transparent text-center font-mono" onchange="TripsView.updateDutyRow('${trip.id}',${idx}, 'startKm', this.value)"></td>
                                    <td class="border-r border-slate-400 p-1"><input type="number" value="${r.endKm}" class="w-16 bg-transparent text-center font-mono" onchange="TripsView.updateDutyRow('${trip.id}',${idx}, 'endKm', this.value)"></td>
                                    <td class="border-r border-slate-400 p-1 font-mono font-bold bg-slate-50">${Math.max(0, (r.endKm || 0) - (r.startKm || 0))}</td>
                                    <td class="border-r border-slate-400 p-1"><input type="time" value="${r.startTime || '09:00'}" class="bg-transparent text-center text-[10px]" onchange="TripsView.updateDutyRow('${trip.id}',${idx}, 'startTime', this.value)"></td>
                                    <td class="border-r border-slate-400 p-1"><input type="time" value="${r.endTime || '18:00'}" class="bg-transparent text-center text-[10px]" onchange="TripsView.updateDutyRow('${trip.id}',${idx}, 'endTime', this.value)"></td>
                                    <td class="p-1 print:hidden">
                                        <button type="button" onclick="TripsView.deleteDutyRow('${trip.id}',${idx})" class="text-rose-600 font-bold px-1">×</button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>

                <div class="flex justify-between items-end pt-4 text-xs font-bold">
                    <div>Thanks You For Choosing Aadesh Tours</div>
                    <div class="border-t border-slate-900 pt-1 px-6 text-center">Customer Signature</div>
                </div>
            </div>
        `;
        modal.classList.remove('hidden');
    },

    addDutyRow: function(tripId) {
        let trips = JSON.parse(localStorage.getItem('aadesh_trips') || '[]');
        let trip = trips.find(t => t.id === tripId);
        if (!trip) return;

        if (!trip.rows) trip.rows = [];
        trip.rows.push({
            day: trip.rows.length + 1,
            date: new Date().toISOString().split('T')[0],
            assignment: '',
            startKm: 0,
            endKm: 0,
            startTime: '09:00',
            endTime: '18:00'
        });

        localStorage.setItem('aadesh_trips', JSON.stringify(trips));
        this.openDutySlipModal(tripId);
    },

    updateDutyRow: function(tripId, index, field, value) {
        let trips = JSON.parse(localStorage.getItem('aadesh_trips') || '[]');
        let trip = trips.find(t => t.id === tripId);
        if (!trip || !trip.rows[index]) return;

        trip.rows[index][field] = field.includes('Km') ? parseFloat(value) || 0 : value;
        localStorage.setItem('aadesh_trips', JSON.stringify(trips));
    },

    deleteDutyRow: function(tripId, index) {
        let trips = JSON.parse(localStorage.getItem('aadesh_trips') || '[]');
        let trip = trips.find(t => t.id === tripId);
        if (!trip || trip.rows.length <= 1) {
            alert('Kam se kam ek row hona anivarya hai.');
            return;
        }

        trip.rows.splice(index, 1);
        localStorage.setItem('aadesh_trips', JSON.stringify(trips));
        this.openDutySlipModal(tripId);
    }
};
