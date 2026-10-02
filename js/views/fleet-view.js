// js/views/fleet-view.js - Complete Fleet & Document Management Vault
window.FleetView = {
    render: function(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = `
            <div class="space-y-4">
                <div class="vault-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                        <h2 class="text-base font-bold text-amber-400">🚘 Fleet & Complete Document Operations</h2>
                        <p class="text-xs text-slate-400">Aadesh Tours Udaipur - Cab Management with All Legal Documents</p>
                    </div>
                    <div class="flex gap-2">
                        <button type="button" onclick="FleetView.openVehicleModal()" class="btn btn-primary px-3 py-2 text-xs">
                            ➕ Gaadi Jodein
                        </button>
                        <button type="button" onclick="FleetView.openDriverModal()" class="btn btn-secondary px-3 py-2 text-xs">
                            👤 Driver Jodein
                        </button>
                    </div>
                </div>

                <div class="flex gap-2 border-b border-slate-800 pb-2">
                    <button type="button" id="subtab-cabs-btn" onclick="FleetView.switchSubTab('cabs')" class="btn btn-primary px-3 py-1.5 text-xs">🚘 Gaadiyaan & Documents</button>
                    <button type="button" id="subtab-drivers-btn" onclick="FleetView.switchSubTab('drivers')" class="btn btn-secondary px-3 py-1.5 text-xs">👥 Drivers List</button>
                </div>

                <!-- Cabs Section -->
                <div id="fleet-cabs-section" class="vault-card space-y-3">
                    <h3 class="text-xs font-bold text-slate-200 uppercase tracking-wider">Registered Cabs & Document Expiry Status</h3>
                    <div class="overflow-x-auto">
                        <table class="tally-table">
                            <thead>
                                <tr>
                                    <th>Vehicle Number</th>
                                    <th>Model</th>
                                    <th>Insurance</th>
                                    <th>PUC</th>
                                    <th>Fitness</th>
                                    <th>Permit / Tax</th>
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
                                    <th>Advance (₹)</th>
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
        const fleet = JSON.parse(localStorage.getItem('aadesh_fleet') || '[]');

        tbody.innerHTML = fleet.map(f => `
            <tr>
                <td class="font-mono font-bold text-amber-400">${f.number}</td>
                <td>${f.model}</td>
                <td class="font-mono text-[11px] text-slate-300">${f.insurance || 'N/A'}</td>
                <td class="font-mono text-[11px] text-slate-300">${f.puc || 'N/A'}</td>
                <td class="font-mono text-[11px] text-slate-300">${f.fitness || 'N/A'}</td>
                <td class="font-mono text-[11px] text-slate-300">${f.permit || 'N/A'}</td>
                <td class="text-right space-x-1">
                    <button type="button" onclick="FleetView.openVehicleModal('${f.id}')" class="btn btn-secondary px-2 py-1 text-[10px] text-sky-400">Edit</button>
                    <button type="button" onclick="FleetView.deleteVehicle('${f.id}')" class="btn btn-secondary px-2 py-1 text-[10px] text-rose-400">Delete</button>
                </td>
            </tr>
        `).join('') || '<tr><td colspan="7" class="text-center text-slate-500 py-4">Koi gaadi darj nahi hai.</td></tr>';
    },

    loadDriverData: function() {
        const tbody = document.getElementById('drivers-table-body');
        if (!tbody) return;
        const drivers = JSON.parse(localStorage.getItem('aadesh_drivers') || '[]');

        tbody.innerHTML = drivers.map(d => `
            <tr>
                <td class="font-bold text-slate-200">${d.name}</td>
                <td class="font-mono">${d.mobile}</td>
                <td class="font-mono text-slate-400">${d.license || 'N/A'}</td>
                <td class="font-mono text-amber-400">₹${d.advance || 0}</td>
                <td class="text-right space-x-1">
                    <button type="button" onclick="FleetView.openDriverModal('${d.id}')" class="btn btn-secondary px-2 py-1 text-[10px] text-sky-400">Edit</button>
                    <button type="button" onclick="FleetView.deleteDriver('${d.id}')" class="btn btn-secondary px-2 py-1 text-[10px] text-rose-400">Delete</button>
                </td>
            </tr>
        `).join('') || '<tr><td colspan="5" class="text-center text-slate-500 py-4">Koi driver darj nahi hai.</td></tr>';
    },

    openVehicleModal: function(id = null) {
        const modal = document.getElementById('modal-container');
        const content = document.getElementById('modal-content');
        if (!modal || !content) return;

        const today = new Date().toISOString().split('T')[0];
        let vehicle = { number: '', model: '', insurance: today, puc: today, fitness: today, permit: today };
        if (id) {
            const fleet = JSON.parse(localStorage.getItem('aadesh_fleet') || '[]');
            const found = fleet.find(f => f.id === id);
            if (found) vehicle = found;
        }

        content.innerHTML = `
            <div class="p-5 space-y-3 bg-slate-900 text-slate-100 rounded-xl max-h-[85vh] overflow-y-auto">
                <div class="flex justify-between items-center border-b border-slate-800 pb-2">
                    <h3 class="text-sm font-bold text-amber-400">${id ? '✏️ Gaadi & Documents Update Karein' : '🚘 Nayi Gaadi aur Sabhi Documents Jodein'}</h3>
                    <button type="button" onclick="document.getElementById('modal-container').classList.add('hidden')" class="text-slate-400 hover:text-white text-lg font-bold">&times;</button>
                </div>
                <form onsubmit="FleetView.saveVehicle(event, '${id || ''}')" class="space-y-3 text-xs">
                    <div>
                        <label class="form-label text-slate-300">Vehicle Number *</label>
                        <input type="text" id="fv-number" required value="${vehicle.number}" class="form-input bg-slate-950 text-white border-slate-700 font-mono uppercase" placeholder="RJ-27-PA-0000">
                    </div>
                    <div>
                        <label class="form-label text-slate-300">Vehicle Model / Type *</label>
                        <input type="text" id="fv-model" required value="${vehicle.model}" class="form-input bg-slate-950 text-white border-slate-700" placeholder="Sedan / SUV / Dzire / Ertiga">
                    </div>
                    <div class="grid grid-cols-2 gap-2">
                        <div>
                            <label class="form-label text-slate-300">Insurance Expiry</label>
                            <input type="date" id="fv-insurance" value="${vehicle.insurance}" class="form-input bg-slate-950 text-white border-slate-700">
                        </div>
                        <div>
                            <label class="form-label text-slate-300">PUC Expiry</label>
                            <input type="date" id="fv-puc" value="${vehicle.puc}" class="form-input bg-slate-950 text-white border-slate-700">
                        </div>
                    </div>
                    <div class="grid grid-cols-2 gap-2">
                        <div>
                            <label class="form-label text-slate-300">Fitness Expiry</label>
                            <input type="date" id="fv-fitness" value="${vehicle.fitness}" class="form-input bg-slate-950 text-white border-slate-700">
                        </div>
                        <div>
                            <label class="form-label text-slate-300">All India Permit / Tax Expiry</label>
                            <input type="date" id="fv-permit" value="${vehicle.permit}" class="form-input bg-slate-950 text-white border-slate-700">
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

    saveVehicle: function(event, id) {
        event.preventDefault();
        const number = document.getElementById('fv-number').value.trim();
        const model = document.getElementById('fv-model').value.trim();
        const insurance = document.getElementById('fv-insurance').value;
        const puc = document.getElementById('fv-puc').value;
        const fitness = document.getElementById('fv-fitness').value;
        const permit = document.getElementById('fv-permit').value;

        let fleet = JSON.parse(localStorage.getItem('aadesh_fleet') || '[]');
        if (id) {
            fleet = fleet.map(f => f.id === id ? { ...f, number, model, insurance, puc, fitness, permit } : f);
        } else {
            fleet.push({ id: 'F-' + Date.now(), number, model, insurance, puc, fitness, permit, status: 'Active' });
        }
        localStorage.setItem('aadesh_fleet', JSON.stringify(fleet));

        document.getElementById('modal-container').classList.add('hidden');
        this.loadFleetData();
    },

    deleteVehicle: function(id) {
        if (!confirm('Kya aap is gaadi ko delete karna chahte hain?')) return;
        let fleet = JSON.parse(localStorage.getItem('aadesh_fleet') || '[]');
        fleet = fleet.filter(f => f.id !== id);
        localStorage.setItem('aadesh_fleet', JSON.stringify(fleet));
        this.loadFleetData();
    },

    openDriverModal: function(id = null) {
        const modal = document.getElementById('modal-container');
        const content = document.getElementById('modal-content');
        if (!modal || !content) return;

        let driver = { name: '', mobile: '', license: '', advance: 0 };
        if (id) {
            const drivers = JSON.parse(localStorage.getItem('aadesh_drivers') || '[]');
            const found = drivers.find(d => d.id === id);
            if (found) driver = found;
        }

        content.innerHTML = `
            <div class="p-5 space-y-4 bg-slate-900 text-slate-100 rounded-xl">
                <div class="flex justify-between items-center border-b border-slate-800 pb-2">
                    <h3 class="text-sm font-bold text-amber-400">${id ? '✏️ Driver Update Karein' : '👤 Naya Driver Jodein'}</h3>
                    <button type="button" onclick="document.getElementById('modal-container').classList.add('hidden')" class="text-slate-400 hover:text-white text-lg font-bold">&times;</button>
                </div>
                <form onsubmit="FleetView.saveDriver(event, '${id || ''}')" class="space-y-3 text-xs">
                    <div>
                        <label class="form-label text-slate-300">Driver Name *</label>
                        <input type="text" id="fd-name" required value="${driver.name}" class="form-input bg-slate-950 text-white border-slate-700" placeholder="Full Name">
                    </div>
                    <div>
                        <label class="form-label text-slate-300">Mobile Number *</label>
                        <input type="text" id="fd-mobile" required value="${driver.mobile}" class="form-input bg-slate-950 text-white border-slate-700 font-mono" placeholder="9876543210">
                    </div>
                    <div>
                        <label class="form-label text-slate-300">License Number</label>
                        <input type="text" id="fd-license" value="${driver.license}" class="form-input bg-slate-950 text-white border-slate-700 font-mono" placeholder="RJ27XXXXXXXX">
                    </div>
                    <div>
                        <label class="form-label text-slate-300">Advance / Opening Balance (₹)</label>
                        <input type="number" id="fd-advance" value="${driver.advance}" class="form-input bg-slate-950 text-amber-400 border-slate-700 font-mono">
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

    saveDriver: function(event, id) {
        event.preventDefault();
        const name = document.getElementById('fd-name').value.trim();
        const mobile = document.getElementById('fd-mobile').value.trim();
        const license = document.getElementById('fd-license').value.trim() || 'N/A';
        const advance = parseFloat(document.getElementById('fd-advance').value) || 0;

        let drivers = JSON.parse(localStorage.getItem('aadesh_drivers') || '[]');
        if (id) {
            drivers = drivers.map(d => d.id === id ? { ...d, name, mobile, license, advance } : d);
        } else {
            drivers.push({ id: 'D-' + Date.now(), name, mobile, license, advance });
        }
        localStorage.setItem('aadesh_drivers', JSON.stringify(drivers));

        document.getElementById('modal-container').classList.add('hidden');
        this.loadDriverData();
    },

    deleteDriver: function(id) {
        if (!confirm('Kya aap is driver ko delete karna chahte hain?')) return;
        let drivers = JSON.parse(localStorage.getItem('aadesh_drivers') || '[]');
        drivers = drivers.filter(d => d.id !== id);
        localStorage.setItem('aadesh_drivers', JSON.stringify(drivers));
        this.loadDriverData();
    }
};
