// js/views/fleet-view.js - Fleet & Driver Operations Vault
window.FleetView = {
    render: function(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = `
            <div class="space-y-4">
                <div class="vault-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                        <h2 class="text-base font-bold text-amber-400">🚘 Fleet & Driver Operations Vault</h2>
                        <p class="text-xs text-slate-400">Aadesh Tours Udaipur - Separate management for Cabs and Drivers</p>
                    </div>
                    <div class="flex gap-2">
                        <button onclick="FleetView.openAddVehicleModal()" class="btn btn-primary px-3 py-2 text-xs">
                            ➕ Gaadi Jodein
                        </button>
                        <button onclick="FleetView.openAddDriverModal()" class="btn btn-secondary px-3 py-2 text-xs">
                            👤 Driver Jodein
                        </button>
                    </div>
                </div>

                <div class="flex gap-2 border-b border-slate-800 pb-2">
                    <button type="button" id="subtab-cabs-btn" onclick="FleetView.switchSubTab('cabs')" class="btn btn-primary px-3 py-1.5 text-xs">🚘 Gaadiyaan (Cabs)</button>
                    <button type="button" id="subtab-drivers-btn" onclick="FleetView.switchSubTab('drivers')" class="btn btn-secondary px-3 py-1.5 text-xs">👥 Drivers & Settlements</button>
                </div>

                <div id="fleet-cabs-section" class="vault-card space-y-3">
                    <h3 class="text-xs font-bold text-slate-200 uppercase tracking-wider">Registered Cabs & Vehicles</h3>
                    <div class="overflow-x-auto">
                        <table class="tally-table">
                            <thead>
                                <tr>
                                    <th>Vehicle Number</th>
                                    <th>Model / Type</th>
                                    <th>Assigned Driver</th>
                                    <th>Status</th>
                                    <th class="text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody id="fleet-table-body"></tbody>
                        </table>
                    </div>
                </div>

                <div id="fleet-drivers-section" class="vault-card space-y-3 hidden">
                    <h3 class="text-xs font-bold text-slate-200 uppercase tracking-wider">Registered Drivers & Advances</h3>
                    <div class="overflow-x-auto">
                        <table class="tally-table">
                            <thead>
                                <tr>
                                    <th>Driver Name</th>
                                    <th>Mobile Number</th>
                                    <th>License No</th>
                                    <th>Advance Taken</th>
                                    <th class="text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody id="drivers-table-body"></tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
        this.loadFleetData();
        this.loadDriverData();
    },

    switchSubTab: function(tab) {
        const cabsSec = document.getElementById('fleet-cabs-section');
        const driversSec = document.getElementById('fleet-drivers-section');
        const cabsBtn = document.getElementById('subtab-cabs-btn');
        const driversBtn = document.getElementById('subtab-drivers-btn');

        if (tab === 'cabs') {
            cabsSec?.classList.remove('hidden');
            driversSec?.classList.add('hidden');
            cabsBtn?.classList.replace('btn-secondary', 'btn-primary');
            driversBtn?.classList.replace('btn-primary', 'btn-secondary');
        } else {
            cabsSec?.classList.add('hidden');
            driversSec?.classList.remove('hidden');
            driversBtn?.classList.replace('btn-secondary', 'btn-primary');
            cabsBtn?.classList.replace('btn-primary', 'btn-secondary');
        }
    },

    loadFleetData: function() {
        const tbody = document.getElementById('fleet-table-body');
        if (!tbody) return;
        let fleet = JSON.parse(localStorage.getItem('aadesh_fleet') || '[]');
        if (fleet.length === 0) {
            fleet = [
                { id: 'F-1', number: 'RJ-27-PA-0000', model: 'Sedan / Dzire', driver: 'Chetan Nath', status: 'Active' },
                { id: 'F-2', number: 'RJ-27-TC-1111', model: 'SUV / Ertiga', driver: 'Driver', status: 'Active' }
            ];
            localStorage.setItem('aadesh_fleet', JSON.stringify(fleet));
        }

        tbody.innerHTML = fleet.map(f => `
            <tr>
                <td class="font-mono font-bold text-amber-400">${f.number}</td>
                <td>${f.model}</td>
                <td>${f.driver}</td>
                <td><span class="badge-status badge-active">${f.status}</span></td>
                <td class="text-right">
                    <button onclick="FleetView.deleteVehicle('${f.id}')" class="btn btn-secondary px-2.5 py-1 text-[11px] text-rose-400">Hataeinj</button>
                </td>
            </tr>
        `).join('');
    },

    loadDriverData: function() {
        const tbody = document.getElementById('drivers-table-body');
        if (!tbody) return;
        let drivers = JSON.parse(localStorage.getItem('aadesh_drivers') || '[]');
        if (drivers.length === 0) {
            drivers = [
                { id: 'D-1', name: 'Chetan Nath', mobile: '9602842390', license: 'RJ27-XXXXX', advance: 0 }
            ];
            localStorage.setItem('aadesh_drivers', JSON.stringify(drivers));
        }

        tbody.innerHTML = drivers.map(d => `
            <tr>
                <td class="font-bold text-slate-200">${d.name}</td>
                <td class="font-mono">${d.mobile}</td>
                <td class="font-mono text-slate-400">${d.license}</td>
                <td class="font-mono text-amber-400">₹${d.advance || 0}</td>
                <td class="text-right">
                    <button onclick="FleetView.deleteDriver('${d.id}')" class="btn btn-secondary px-2.5 py-1 text-[11px] text-rose-400">Hataeinj</button>
                </td>
            </tr>
        `).join('');
    },

    openAddVehicleModal: function() {
        const modal = document.getElementById('modal-container');
        const content = document.getElementById('modal-content');
        if (!modal || !content) return;

        content.innerHTML = `
            <div class="p-4 space-y-3">
                <div class="flex justify-between items-center border-b border-slate-800 pb-2">
                    <h3 class="text-sm font-bold text-amber-400">🚘 Nayi Gaadi Darj Karein</h3>
                    <button onclick="document.getElementById('modal-container').classList.add('hidden')" class="text-slate-400">&times;</button>
                </div>
                <form onsubmit="FleetView.saveVehicle(event)" class="space-y-3 text-xs">
                    <div>
                        <label class="form-label">Vehicle Number *</label>
                        <input type="text" id="fv-number" required class="form-input font-mono" placeholder="RJ-27-PA-0000">
                    </div>
                    <div>
                        <label class="form-label">Vehicle Model / Type *</label>
                        <input type="text" id="fv-model" required class="form-input" placeholder="Sedan / SUV / Dzire / Ertiga">
                    </div>
                    <div>
                        <label class="form-label">Assigned Driver Name</label>
                        <input type="text" id="fv-driver" class="form-input" placeholder="Driver Name">
                    </div>
                    <div class="flex justify-end gap-2 pt-2 border-t border-slate-800">
                        <button type="button" onclick="document.getElementById('modal-container').classList.add('hidden')" class="btn btn-secondary px-3 py-1.5">Radd</button>
                        <button type="submit" class="btn btn-primary px-4 py-1.5">Gaadi Save Karein</button>
                    </div>
                </form>
            </div>
        `;
        modal.classList.remove('hidden');
    },

    openAddDriverModal: function() {
        const modal = document.getElementById('modal-container');
        const content = document.getElementById('modal-content');
        if (!modal || !content) return;

        content.innerHTML = `
            <div class="p-4 space-y-3">
                <div class="flex justify-between items-center border-b border-slate-800 pb-2">
                    <h3 class="text-sm font-bold text-amber-400">👤 Naya Driver Jodein</h3>
                    <button onclick="document.getElementById('modal-container').classList.add('hidden')" class="text-slate-400">&times;</button>
                </div>
                <form onsubmit="FleetView.saveDriver(event)" class="space-y-3 text-xs">
                    <div>
                        <label class="form-label">Driver Name *</label>
                        <input type="text" id="fd-name" required class="form-input" placeholder="Full Name">
                    </div>
                    <div>
                        <label class="form-label">Mobile Number *</label>
                        <input type="text" id="fd-mobile" required class="form-input font-mono" placeholder="9876543210">
                    </div>
                    <div>
                        <label class="form-label">License Number</label>
                        <input type="text" id="fd-license" class="form-input font-mono" placeholder="RJ27XXXXXXXX">
                    </div>
                    <div>
                        <label class="form-label">Advance Taken (₹)</label>
                        <input type="number" id="fd-advance" value="0" class="form-input font-mono text-amber-400">
                    </div>
                    <div class="flex justify-end gap-2 pt-2 border-t border-slate-800">
                        <button type="button" onclick="document.getElementById('modal-container').classList.add('hidden')" class="btn btn-secondary px-3 py-1.5">Radd</button>
                        <button type="submit" class="btn btn-primary px-4 py-1.5">Driver Save Karein</button>
                    </div>
                </form>
            </div>
        `;
        modal.classList.remove('hidden');
    },

    saveVehicle: function(event) {
        event.preventDefault();
        const number = document.getElementById('fv-number').value.trim();
        const model = document.getElementById('fv-model').value.trim();
        const driver = document.getElementById('fv-driver').value.trim() || 'Self';

        let fleet = JSON.parse(localStorage.getItem('aadesh_fleet') || '[]');
        fleet.push({ id: 'F-' + Date.now(), number, model, driver, status: 'Active' });
        localStorage.setItem('aadesh_fleet', JSON.stringify(fleet));

        document.getElementById('modal-container').classList.add('hidden');
        this.loadFleetData();
    },

    saveDriver: function(event) {
        event.preventDefault();
        const name = document.getElementById('fd-name').value.trim();
        const mobile = document.getElementById('fd-mobile').value.trim();
        const license = document.getElementById('fd-license').value.trim() || 'N/A';
        const advance = parseFloat(document.getElementById('fd-advance').value) || 0;

        let drivers = JSON.parse(localStorage.getItem('aadesh_drivers') || '[]');
        drivers.push({ id: 'D-' + Date.now(), name, mobile, license, advance });
        localStorage.setItem('aadesh_drivers', JSON.stringify(drivers));

        document.getElementById('modal-container').classList.add('hidden');
        this.loadDriverData();
    },

    deleteVehicle: function(id) {
        let fleet = JSON.parse(localStorage.getItem('aadesh_fleet') || '[]');
        fleet = fleet.filter(f => f.id !== id);
        localStorage.setItem('aadesh_fleet', JSON.stringify(fleet));
        this.loadFleetData();
    },

    deleteDriver: function(id) {
        let drivers = JSON.parse(localStorage.getItem('aadesh_drivers') || '[]');
        drivers = drivers.filter(d => d.id !== id);
        localStorage.setItem('aadesh_drivers', JSON.stringify(drivers));
        this.loadDriverData();
    }
};
