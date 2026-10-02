// js/views/trips-view.js - Trips & Bookings Management with Duty Slip Integration
window.TripsView = {
    render: function(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = `
            <div class="space-y-4 max-w-6xl mx-auto pb-12">
                <div class="vault-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                        <h2 class="text-base font-bold text-amber-400">🚗 Trips & Bookings Management</h2>
                        <p class="text-xs text-slate-400">Aadesh Tours Udaipur - Create Trips, Calculate KM & Taxes with Full CRUD</p>
                    </div>
                    <button type="button" onclick="TripsView.openTripModal()" class="btn btn-primary px-3 py-2 text-xs">
                        ➕ Nayi Trip / Booking Jodein
                    </button>
                </div>

                <div class="vault-card space-y-3">
                    <h3 class="text-xs font-bold text-slate-200 uppercase tracking-wider">All Booked Trips & Duties</h3>
                    <div class="overflow-x-auto">
                        <table class="tally-table">
                            <thead>
                                <tr>
                                    <th>Trip ID / Date</th>
                                    <th>Category</th>
                                    <th>Vehicle & Driver</th>
                                    <th>Guest Details</th>
                                    <th>KM & Fare</th>
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
        const trips = JSON.parse(localStorage.getItem('aadesh_trips') || '[]');

        tbody.innerHTML = trips.map(t => `
            <tr>
                <td>
                    <div class="font-bold text-amber-400 font-mono">${t.id}</div>
                    <div class="text-[10px] text-slate-400">${t.date}</div>
                </td>
                <td><span class="badge-status bg-amber-500/20 text-amber-400">${t.category}</span></td>
                <td>
                    <div class="font-mono font-bold text-xs">${t.vehicle || 'N/A'}</div>
                    <div class="text-[10px] text-slate-400">${t.driver || 'N/A'}</div>
                </td>
                <td>
                    <div class="font-bold">${t.guestName}</div>
                    <div class="text-[10px] text-slate-400 font-mono">${t.guestMob}</div>
                </td>
                <td>
                    <div class="font-mono text-xs">KM: ${t.totalKm || 0} km</div>
                    <div class="text-[10px] text-slate-400">Toll/Park: ₹${t.toll || 0}</div>
                </td>
                <td class="font-mono font-bold text-emerald-400 text-sm">₹${t.grandTotal || 0}</td>
                <td class="text-right space-x-1">
                    <button type="button" onclick="App.navigateTo('dutyslip')" class="btn btn-secondary px-2 py-1 text-[10px] text-amber-400">Duty Slip</button>
                    <button type="button" onclick="TripsView.openTripModal('${t.id}')" class="btn btn-secondary px-2 py-1 text-[10px] text-sky-400">Edit</button>
                    <button type="button" onclick="TripsView.deleteTrip('${t.id}')" class="btn btn-secondary px-2 py-1 text-[10px] text-rose-400">Delete</button>
                </td>
            </tr>
        `).join('') || '<tr><td colspan="7" class="text-center text-slate-500 py-4">Koi trip darj nahi hai.</td></tr>';
    },

    openTripModal: function(id = null) {
        const modal = document.getElementById('modal-container');
        const content = document.getElementById('modal-content');
        if (!modal || !content) return;

        const fleet = JSON.parse(localStorage.getItem('aadesh_fleet') || '[]');
        const drivers = JSON.parse(localStorage.getItem('aadesh_drivers') || '[]');
        const today = new Date().toISOString().split('T')[0];

        let trip = { 
            date: today, category: 'Multi Day Tour', vehicle: '', driver: '', 
            guestName: '', guestMob: '', destination: '', totalKm: 0, ratePerKm: 12, toll: 0, grandTotal: 0 
        };

        if (id) {
            const trips = JSON.parse(localStorage.getItem('aadesh_trips') || '[]');
            const found = trips.find(t => t.id === id);
            if (found) trip = found;
        }

        content.innerHTML = `
            <div class="p-5 space-y-4 bg-slate-900 text-slate-100 rounded-xl max-h-[90vh] overflow-y-auto">
                <div class="flex justify-between items-center border-b border-slate-800 pb-2">
                    <h3 class="text-sm font-bold text-amber-400">${id ? '✏️ Trip Update Karein' : '➕ Nayi Trip Jodein'}</h3>
                    <button type="button" onclick="document.getElementById('modal-container').classList.add('hidden')" class="text-slate-400">&times;</button>
                </div>
                <form onsubmit="TripsView.saveTrip(event, '${id || ''}')" class="space-y-3 text-xs">
                    <div class="grid grid-cols-2 gap-2">
                        <div>
                            <label class="form-label text-slate-300">Trip Date *</label>
                            <input type="date" id="trip-date" required value="${trip.date}" class="form-input bg-slate-950 text-white border-slate-700">
                        </div>
                        <div>
                            <label class="form-label text-slate-300">Category *</label>
                            <select id="trip-cat" class="form-input bg-slate-950 text-white border-slate-700">
                                <option value="Multi Day Tour" ${trip.category === 'Multi Day Tour' ? 'selected' : ''}>Multi Day Tour</option>
                                <option value="Local / Outstation" ${trip.category === 'Local / Outstation' ? 'selected' : ''}>Local / Outstation</option>
                                <option value="Airport Drop" ${trip.category === 'Airport Drop' ? 'selected' : ''}>Airport Drop</option>
                            </select>
                        </div>
                    </div>
                    <div class="grid grid-cols-2 gap-2">
                        <div>
                            <label class="form-label text-slate-300">Vehicle *</label>
                            <select id="trip-vehicle" required class="form-input bg-slate-950 text-white border-slate-700 font-mono">
                                <option value="">-- Gaadi Chunein --</option>
                                ${fleet.map(f => `<option value="${f.number} (${f.model})" ${trip.vehicle === `${f.number} (${f.model})` ? 'selected' : ''}>${f.number} -${f.model}</option>`).join('')}
                            </select>
                        </div>
                        <div>
                            <label class="form-label text-slate-300">Driver *</label>
                            <select id="trip-driver" required class="form-input bg-slate-950 text-white border-slate-700">
                                <option value="">-- Driver Chunein --</option>
                                ${drivers.map(d => `<option value="${d.name}" ${trip.driver === d.name ? 'selected' : ''}>${d.name}</option>`).join('')}
                            </select>
                        </div>
                    </div>
                    <div class="grid grid-cols-2 gap-2">
                        <div>
                            <label class="form-label text-slate-300">Guest Name *</label>
                            <input type="text" id="trip-guest" required value="${trip.guestName}" class="form-input bg-slate-950 text-white border-slate-700" placeholder="Guest Name">
                        </div>
                        <div>
                            <label class="form-label text-slate-300">Guest Mobile *</label>
                            <input type="text" id="trip-mob" required value="${trip.guestMob}" class="form-input bg-slate-950 text-white border-slate-700 font-mono" placeholder="9876543210">
                        </div>
                    </div>
                    <div class="grid grid-cols-3 gap-2">
                        <div>
                            <label class="form-label text-slate-300">Total KM</label>
                            <input type="number" id="trip-km" value="${trip.totalKm}" oninput="TripsView.calcModalTotal()" class="form-input bg-slate-950 text-white border-slate-700 font-mono">
                        </div>
                        <div>
                            <label class="form-label text-slate-300">Toll / Parking (₹)</label>
                            <input type="number" id="trip-toll" value="${trip.toll}" oninput="TripsView.calcModalTotal()" class="form-input bg-slate-950 text-white border-slate-700 font-mono">
                        </div>
                        <div>
                            <label class="form-label text-slate-300">Grand Total (₹)</label>
                            <input type="number" id="trip-total" required value="${trip.grandTotal}" class="form-input bg-slate-950 text-amber-400 border-slate-700 font-mono font-bold">
                        </div>
                    </div>
                    <div class="flex justify-end gap-2 pt-3 border-t border-slate-800">
                        <button type="button" onclick="document.getElementById('modal-container').classList.add('hidden')" class="btn btn-secondary px-3 py-1.5">Radd</button>
                        <button type="submit" class="btn btn-primary px-4 py-1.5 font-bold">${id ? 'Update' : 'Save'}</button>
                    </div>
                </form>
            </div>
        `;
        modal.classList.remove('hidden');
    },

    calcModalTotal: function() {
        const km = parseFloat(document.getElementById('trip-km')?.value) || 0;
        const toll = parseFloat(document.getElementById('trip-toll')?.value) || 0;
        // Estimated calculation or manual override
        const total = (km * 12) + toll;
        const totalInput = document.getElementById('trip-total');
        if (totalInput && totalInput.value == 0) totalInput.value = total;
    },

    saveTrip: function(event, id) {
        event.preventDefault();
        const date = document.getElementById('trip-date').value;
        const category = document.getElementById('trip-cat').value;
        const vehicle = document.getElementById('trip-vehicle').value;
        const driver = document.getElementById('trip-driver').value;
        const guestName = document.getElementById('trip-guest').value.trim();
        const guestMob = document.getElementById('trip-mob').value.trim();
        const totalKm = parseFloat(document.getElementById('trip-km').value) || 0;
        const toll = parseFloat(document.getElementById('trip-toll').value) || 0;
        const grandTotal = parseFloat(document.getElementById('trip-total').value) || 0;

        let trips = JSON.parse(localStorage.getItem('aadesh_trips') || '[]');
        let tripId = id;
        if (id) {
            trips = trips.map(t => t.id === id ? { ...t, date, category, vehicle, driver, guestName, guestMob, totalKm, toll, grandTotal } : t);
        } else {
            tripId = 'TRIP-' + Math.floor(1000 + Math.random() * 9000);
            trips.unshift({ id: tripId, date, category, vehicle, driver, guestName, guestMob, totalKm, toll, grandTotal });

            // Also create corresponding duty slip
            let slips = JSON.parse(localStorage.getItem('aadesh_duty_slips') || '[]');
            slips.unshift({
                id: tripId.replace('TRIP-', 'DS-'),
                date, vehicle, driver, guestName, guestMob, company: 'N/A', reporting: 'Udaipur',
                rows: [{ day: 1, date, assignment: category, startKm: 0, endKm: totalKm, startTime: '09:00', endTime: '18:00' }]
            });
            localStorage.setItem('aadesh_duty_slips', JSON.stringify(slips));
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

        let slips = JSON.parse(localStorage.getItem('aadesh_duty_slips') || '[]');
        const slipId = id.replace('TRIP-', 'DS-');
        slips = slips.filter(s => s.id !== slipId);
        localStorage.setItem('aadesh_duty_slips', JSON.stringify(slips));

        this.loadTripsData();
    }
};
