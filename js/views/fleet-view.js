// js/views/fleet-view.js - Aadesh Tours Udaipur Fleet & Driver Manager
window.FleetView = {
    render: function(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = `
            <div class="space-y-4">
                <div class="vault-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                        <h2 class="text-base font-bold text-amber-400">🚘 Fleet & Driver Management Vault</h2>
                        <p class="text-xs text-slate-400">Aadesh Tours Udaipur - Separate management for Cabs and Drivers</p>
                    </div>
                    <div class="flex gap-2">
                        <button type="button" onclick="FleetView.openAddVehicleModal()" class="btn btn-primary px-3 py-2 text-xs">
                            ➕ Gaadi Jodein
                        </button>
                        <button type="button" onclick="FleetView.openAddDriverModal()" class="btn btn-secondary px-3 py-2 text-xs">
                            👤 Driver Jodein
                        </button>
                    </div>
                </div>

                <div class="flex gap-2 border-b border-slate-800 pb-2">
                    <button type="button" id="subtab-cabs-btn" onclick="FleetView.switchSubTab('cabs')" class="btn btn-primary px-3 py-1.5 text-xs">🚘 Gaadiyaan & Documents</button>
                    <button type="button" id="subtab-drivers-btn" onclick="FleetView.switchSubTab('drivers')" class="btn btn-secondary px-3 py-1.5 text-xs">👥 Drivers List & Settlements</button>
                </div>

                <!-- Cabs Section -->
                <div id="fleet-cabs-section" class="vault-card space-y-3">
                    <h3 class="text-xs font-bold text-slate-200 uppercase tracking-wider">Registered Cabs & Document Details</h3>
                    <div class="overflow-x-auto">
                        <table class="tally-table">
                            <thead>
                                <tr>
                                    <th>Vehicle Number</th>
                                    <th>Model</th>
                                    <th>Insurance Expiry</th>
                                    <th>Fitness / PUC</th>
                                    <th>Status</th>
                                    <th class="text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody id="fleet-table-body"></tbody>
                        </table>
                    </div>
                </div>

                <!-- Drivers Section -->
                <div id="fleet-drivers-section" class="vault-card space-y-3 hidden">
                    <h3 class="text-xs font-bold text-slate-200 uppercase tracking-wider">Registered Drivers Management</h3>
                    <div class="overflow-x-auto">
                        <table class="tally-table">
                            <thead>
                                <tr>
                                    <th>Driver Name</th>
                                    <th>Mobile Number</th>
                                    <th>License Number</th>
                                    <th>Advance / Balance</th>
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
                { id: 'F-1', number: 'RJ-27-PA-0000', model: 'Sedan / Dzire', insurance: '2026-12-31', fitness: '2026-10-15', status: 'Active' },
                { id: 'F-2', number: 'RJ-27-TC-1111', model: 'SUV / Ertiga', insurance: '2026-11-20', fitness: '2026-11-10', status: 'Active' }
            ];
            localStorage.setItem('aadesh_fleet', JSON.stringify(fleet));
        }

        tbody.innerHTML = fleet.map(f => `
            <tr>
                <td class="font-mono font-bold text-amber-400">${f.number}</td>
                <td>${f.model}</td>
                <td class="font-mono text-xs text-slate-300">${f.insurance || 'N/A'}</td>
                <td class="font-mono text-xs text-slate-300">${f.fitness || 'N/A'}</td>
                <td><span class="badge-status badge-active">${f.status}</span></td>
                <td class="text-right space-x-1">
                    <button type="button" onclick="FleetView.openEditVehicleModal('${f.id}')" class="btn btn-secondary px-2 py-1 text-[10px]">Edit</button>
                    <button type="button" onclick="FleetView.deleteVehicle('${f.id}')" class="btn btn-secondary px-2 py-1 text-[10px] text-rose-400">Delete</button>
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
                <td class="text-right space-x-1">
                    <button type="button" onclick="FleetView.openEditDriverModal('${d.id}')" class="btn btn-secondary px-2 py-1 text-[10px]">Edit</button>
                    <button type="button" onclick="FleetView.deleteDriver('${d.id}')" class="btn btn-secondary px-2 py-1 text-[10px] text-rose-400">Delete</button>
                </td>
            </tr>
        `).join('');
    },

    openAddVehicleModal: function() {
        const modal = document.getElementById('modal-container');
        const content = document.getElementById('modal-content');
        if (!modal || !content) return;
        const today = new Date().toISOString().split('T')[0];

        content.innerHTML = `
            <div class="p-5 space-y-4 bg-slate-900 text-slate-100 rounded-xl">
                <div class="flex justify-between items-center border-b border-slate-800 pb-2">
                    <h3 class="text-sm font-bold text-amber-400">🚘 Nayi Gaadi aur Documents Jodein</h3>
                    <button type="button" onclick="document.getElementById('modal-container').classList.add('hidden')" class="text-slate-400 hover:text-white text-lg font-bold">&times;</button>
                </div>
                <form onsubmit="FleetView.saveVehicle(event)" class="space-y-3 text-xs">
                    <div>
                        <label class="form-label text-slate-300">Vehicle Number *</label>
                        <input type="text" id="fv-number" required class="form-input bg-slate-950 text-white border-slate-700 font-mono" placeholder="RJ-27-PA-0000">
                    </div>
                    <div>
                        <label class="form-label text-slate-300">Vehicle Model / Type *</label>
                        <input type="text" id="fv-model" required class="form-input bg-slate-950 text-white border-slate-700" placeholder="Sedan / SUV / Dzire">
                    </div>
                    <div class="grid grid-cols-2 gap-2">
                        <div>
                            <label class="form-label text-slate-300">Insurance Expiry Date</label>
                            <input type="date" id="fv-insurance" value="${today}" class="form-input bg-slate-950 text-white border-slate-700">
                        </div>
                        <div>
                            <label class="form-label text-slate-300">Fitness / PUC Expiry</label>
                            <input type="date" id="fv-fitness" value="${today}" class="form-input bg-slate-950 text-white border-slate-700">
                        </div>
                    </div>
                    <div class="flex justify-end gap-2 pt-3 border-t border-slate-800">
                        <button type="button" onclick="document.getElementById('modal-container').classList.add('hidden')" class="btn btn-secondary px-3 py-1.5">Radd</button>
                        <button type="submit" class="btn btn-primary px-4 py-1.5 font-bold">Gaadi Save Karein</button>
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
            <div class="p-5 space-y-4 bg-slate-900 text-slate-100 rounded-xl">
                <div class="flex justify-between items-center border-b border-slate-800 pb-2">
                    <h3 class="text-sm font-bold text-amber-400">👤 Naya Driver Jodein</h3>
                    <button type="button" onclick="document.getElementById('modal-container').classList.add('hidden')" class="text-slate-400 hover:text-white text-lg font-bold">&times;</button>
                </div>
                <form onsubmit="FleetView.saveDriver(event)" class="space-y-3 text-xs">
                    <div>
                        <label class="form-label text-slate-300">Driver Name *</label>
                        <input type="text" id="fd-name" required class="form-input bg-slate-950 text-white border-slate-700" placeholder="Full Name">
                    </div>
                    <div>
                        <label class="form-label text-slate-300">Mobile Number *</label>
                        <input type="text" id="fd-mobile" required class="form-input bg-slate-950 text-white border-slate-700 font-mono" placeholder="9876543210">
                    </div>
                    <div>
                        <label class="form-label text-slate-300">License Number</label>
                        <input type="text" id="fd-license" class="form-input bg-slate-950 text-white border-slate-700 font-mono" placeholder="RJ27XXXXXXXX">
                    </div>
                    <div>
                        <label class="form-label text-slate-300">Advance / Opening Balance (₹)</label>
                        <input type="number" id="fd-advance" value="0" class="form-input bg-slate-950 text-amber-400 border-slate-700 font-mono">
                    </div>
                    <div class="flex justify-end gap-2 pt-3 border-t border-slate-800">
                        <button type="button" onclick="document.getElementById('modal-container').classList.add('hidden')" class="btn btn-secondary px-3 py-1.5">Radd</button>
                        <button type="submit" class="btn btn-primary px-4 py-1.5 font-bold">Driver Save Karein</button>
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
        const insurance = document.getElementById('fv-insurance').value;
        const fitness = document.getElementById('fv-fitness').value;

        let fleet = JSON.parse(localStorage.getItem('aadesh_fleet') || '[]');
        fleet.push({ id: 'F-' + Date.now(), number, model, insurance, fitness, status: 'Active' });
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
