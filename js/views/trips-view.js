// js/views/trips-view.js - Trips & Bookings Management with Expanded Categories & Detailed Tax/KM Tracking
window.TripsView = {
    render: function(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = `
            <div class="space-y-4 max-w-6xl mx-auto pb-12">
                <div class="vault-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                        <h2 class="text-base font-bold text-amber-400">🚗 Trips & Bookings Management</h2>
                        <p class="text-xs text-slate-400">Aadesh Tours Udaipur - Detailed KM, Taxes, Times & Categories</p>
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
                                    <th>KM (Start - End = Total)</th>
                                    <th>Toll / Park / Border</th>
                                    <th>Total Amount</th>
                                    <th class="text-right">Actions</th>
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
                <td class="font-mono text-xs">
                    <div>${t.startKm || 0} - ${t.endKm || 0}</div>
                    <div class="text-amber-400 font-bold">Total: ${t.totalKm || 0} km</div>
                    <div class="text-[10px] text-slate-400">${t.startTime || ''} to ${t.endTime || ''}</div>
                </td>
                <td class="text-[11px] font-mono">
                    <div>Toll: ₹${t.toll || 0}</div>
                    <div>Park: ₹${t.parking || 0}</div>
                    <div>Border: ₹${t.borderTax || 0}</div>
                </td>
                <td class="font-mono font-bold text-emerald-400 text-sm">₹${t.grandTotal || 0}</td>
                <td class="text-right space-x-1">
                    <button type="button" onclick="App.navigateTo('dutyslip')" class="btn btn-secondary px-2 py-1 text-[10px] text-amber-400">Slip</button>
                    <button type="button" onclick="TripsView.openTripModal('${t.id}')" class="btn btn-secondary px-2 py-1 text-[10px] text-sky-400">Edit</button>
                    <button type="button" onclick="TripsView.deleteTrip('${t.id}')" class="btn btn-secondary px-2 py-1 text-[10px] text-rose-400">Delete</button>
                </td>
            </tr>
        `).join('') || '<tr><td colspan="8" class="text-center text-slate-500 py-4">Koi trip darj nahi hai.</td></tr>';
    },

    openTripModal: function(id = null) {
        const modal = document.getElementById('modal-container');
        const content = document.getElementById('modal-content');
        if (!modal || !content) return;

        content.className = "vault-card w-full max-w-2xl max-h-[95vh] overflow-y-auto bg-slate-900 border border-slate-700 shadow-2xl";

        const fleet = JSON.parse(localStorage.getItem('aadesh_fleet') || '[]');
        const drivers = JSON.parse(localStorage.getItem('aadesh_drivers') || '[]');
        const today = new Date().toISOString().split('T')[0];

        let trip = { 
            date: today, category: 'Local', vehicle: '', driver: '', 
            guestName: '', guestMob: '', startKm: 0, endKm: 0, totalKm: 0, 
            startTime: '09:00', endTime: '18:00', toll: 0, parking: 0, borderTax: 0, grandTotal: 0 
        };

        if (id) {
            const trips = JSON.parse(localStorage.getItem('aadesh_trips') || '[]');
            const found = trips.find(t => t.id === id);
            if (found) trip = found;
        }

        content.innerHTML = `
            <div class="p-6 space-y-4 bg-slate-900 text-slate-100 rounded-xl">
                <div class="flex justify-between items-center border-b border-slate-800 pb-2">
                    <h3 class="text-sm font-bold text-amber-400">${id ? '✏️ Trip Update Karein' : '➕ Nayi Trip Jodein'}</h3>
                    <button type="button" onclick="document.getElementById('modal-container').classList.add('hidden')" class="text-slate-400">&times;</button>
                </div>
                <form onsubmit="TripsView.saveTrip(event, '${id || ''}')" class="space-y-3 text-xs">
                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <label class="form-label text-slate-300">Trip Date *</label>
                            <input type="date" id="trip-date" required value="${trip.date}" class="form-input bg-slate-950 text-white border-slate-700">
                        </div>
                        <div>
                            <label class="form-label text-slate-300">Category *</label>
                            <select id="trip-cat" class="form-input bg-slate-950 text-white border-slate-700 font-bold">
                                <option value="Local" ${trip.category === 'Local' ? 'selected' : ''}>Local</option>
                                <option value="Outstation" ${trip.category === 'Outstation' ? 'selected' : ''}>Outstation</option>
                                <option value="Airport Pickup" ${trip.category === 'Airport Pickup' ? 'selected' : ''}>Airport Pickup</option>
                                <option value="Airport Drop" ${trip.category === 'Airport Drop' ? 'selected' : ''}>Airport Drop</option>
                                <option value="Railway Station Pickup" ${trip.category === 'Railway Station Pickup' ? 'selected' : ''}>Railway Station Pickup</option>
                                <option value="Railway Station Drop" ${trip.category === 'Railway Station Drop' ? 'selected' : ''}>Railway Station Drop</option>
                                <option value="Hotel to Hotel" ${trip.category === 'Hotel to Hotel' ? 'selected' : ''}>Hotel to Hotel</option>
                                <option value="Multi Day Tour" ${trip.category === 'Multi Day Tour' ? 'selected' : ''}>Multi Day Tour</option>
                            </select>
                        </div>
                    </div>
                    <div class="grid grid-cols-2 gap-3">
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
                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <label class="form-label text-slate-300">Guest Name *</label>
                            <input type="text" id="trip-guest" required value="${trip.guestName}" class="form-input bg-slate-950 text-white border-slate-700" placeholder="Guest Name">
                        </div>
                        <div>
                            <label class="form-label text-slate-300">Guest Mobile *</label>
                            <input type="text" id="trip-mob" required value="${trip.guestMob}" class="form-input bg-slate-950 text-white border-slate-700 font-mono" placeholder="9876543210">
                        </div>
                    </div>
                    <div class="grid grid-cols-3 gap-2 bg-slate-950 p-3 rounded border border-slate-800">
                        <div>
                            <label class="form-label text-slate-300">Start KM</label>
                            <input type="number" id="trip-start-km" value="${trip.startKm}" oninput="TripsView.calcModalTotal()" class="form-input bg-slate-900 text-white font-mono">
                        </div>
                        <div>
                            <label class="form-label text-slate-300">End KM</label>
                            <input type="number" id="trip-end-km" value="${trip.endKm}" oninput="TripsView.calcModalTotal()" class="form-input bg-slate-900 text-white font-mono">
                        </div>
                        <div>
                            <label class="form-label text-slate-300">Total KM</label>
                            <input type="number" id="trip-total-km" readonly value="${trip.totalKm}" class="form-input bg-slate-900 text-amber-400 font-mono font-bold">
                        </div>
                    </div>
                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <label class="form-label text-slate-300">Start Time</label>
                            <input type="time" id="trip-start-time" value="${trip.startTime}" class="form-input bg-slate-950 text-white border-slate-700">
                        </div>
                        <div>
                            <label class="form-label text-slate-300">End Time</label>
                            <input type="time" id="trip-end-time" value="${trip.endTime}" class="form-input bg-slate-950 text-white border-slate-700">
                        </div>
                    </div>
                    <div class="grid grid-cols-4 gap-2 bg-slate-950 p-3 rounded border border-slate-800">
                        <div>
                            <label class="form-label text-slate-300">Toll (₹)</label>
                            <input type="number" id="trip-toll" value="${trip.toll}" oninput="TripsView.calcModalTotal()" class="form-input bg-slate-900 text-white font-mono">
                        </div>
                        <div>
                            <label class="form-label text-slate-300">Parking (₹)</label>
                            <input type="number" id="trip-park" value="${trip.parking}" oninput="TripsView.calcModalTotal()" class="form-input bg-slate-900 text-white font-mono">
                        </div>
                        <div>
                            <label class="form-label text-slate-300">Border Tax (₹)</label>
                            <input type="number" id="trip-border" value="${trip.borderTax}" oninput="TripsView.calcModalTotal()" class="form-input bg-slate-900 text-white font-mono">
                        </div>
                        <div>
                            <label class="form-label text-slate-300">Grand Total (₹)</label>
                            <input type="number" id="trip-grand-total" required value="${trip.grandTotal}" class="form-input bg-slate-900 text-emerald-400 font-mono font-bold">
                        </div>
                    </div>
                    <div class="flex justify-end gap-2 pt-3 border-t border-slate-800">
                        <button type="button" onclick="document.getElementById('modal-container').classList.add('hidden')" class="btn btn-secondary px-3 py-1.5">Radd</button>
                        <button type="submit" class="btn btn-primary px-4 py-1.5 font-bold">${id ? 'Update Karein' : 'Save Karein'}</button>
                    </div>
                </form>
            </div>
        `;
        modal.classList.remove('hidden');
    },

    calcModalTotal: function() {
        const start = parseFloat(document.getElementById('trip-start-km')?.value) || 0;
        const end = parseFloat(document.getElementById('trip-end-km')?.value) || 0;
        const totalKm = Math.max(0, end - start);
        
        const totalKmInput = document.getElementById('trip-total-km');
        if (totalKmInput) totalKmInput.value = totalKm;

        const toll = parseFloat(document.getElementById('trip-toll')?.value) || 0;
        const park = parseFloat(document.getElementById('trip-park')?.value) || 0;
        const border = parseFloat(document.getElementById('trip-border')?.value) || 0;

        // Rate calculation default ₹12 per km + taxes
        const calculatedTotal = (totalKm * 12) + toll + park + border;
        const grandTotalInput = document.getElementById('trip-grand-total');
        if (grandTotalInput && grandTotalInput.value == 0) {
            grandTotalInput.value = calculatedTotal;
        }
    },

    saveTrip: function(event, id) {
        event.preventDefault();
        const date = document.getElementById('trip-date').value;
        const category = document.getElementById('trip-cat').value;
        const vehicle = document.getElementById('trip-vehicle').value;
        const driver = document.getElementById('trip-driver').value;
        const guestName = document.getElementById('trip-guest').value.trim();
        const guestMob = document.getElementById('trip-mob').value.trim();
        const startKm = parseFloat(document.getElementById('trip-start-km').value) || 0;
        const endKm = parseFloat(document.getElementById('trip-end-km').value) || 0;
        const totalKm = parseFloat(document.getElementById('trip-total-km').value) || 0;
        const startTime = document.getElementById('trip-start-time').value;
        const endTime = document.getElementById('trip-end-time').value;
        const toll = parseFloat(document.getElementById('trip-toll').value) || 0;
        const parking = parseFloat(document.getElementById('trip-park').value) || 0;
        const borderTax = parseFloat(document.getElementById('trip-border').value) || 0;
        const grandTotal = parseFloat(document.getElementById('trip-grand-total').value) || 0;

        let trips = JSON.parse(localStorage.getItem('aadesh_trips') || '[]');
        let tripId = id;
        if (id) {
            trips = trips.map(t => t.id === id ? { 
                ...t, date, category, vehicle, driver, guestName, guestMob, 
                startKm, endKm, totalKm, startTime, endTime, toll, parking, borderTax, grandTotal 
            } : t);
        } else {
            tripId = 'TRIP-' + Math.floor(1000 + Math.random() * 9000);
            trips.unshift({ 
                id: tripId, date, category, vehicle, driver, guestName, guestMob, 
                startKm, endKm, totalKm, startTime, endTime, toll, parking, borderTax, grandTotal 
            });

            // Corresponding Duty Slip creation
            let slips = JSON.parse(localStorage.getItem('aadesh_duty_slips') || '[]');
            slips.unshift({
                id: tripId.replace('TRIP-', 'DS-'),
                date, vehicle, driver, guestName, guestMob, company: 'N/A', reporting: 'Udaipur',
                rows: [{ day: 1, date, assignment: category, startKm, endKm, startTime, endTime }]
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
