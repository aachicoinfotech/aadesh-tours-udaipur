// js/views/fleet-view.js - Aadesh Tours Udaipur Fleet Manager
window.FleetView = {
    render: function(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = `
            <div class="space-y-4">
                <div class="vault-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                        <h2 class="text-base font-bold text-amber-400">🚘 Gaadiyaan (Fleet) Manager</h2>
                        <p class="text-xs text-slate-400">Aadesh Tours Udaipur - Manage all cabs & vehicles</p>
                    </div>
                    <button onclick="FleetView.openAddVehicleModal()" class="btn btn-primary px-3 py-2 text-xs">
                        ➕ Nayi Gaadi Jodein
                    </button>
                </div>

                <div class="vault-card overflow-hidden">
                    <div class="overflow-x-auto">
                        <table class="tally-table">
                            <thead>
                                <tr>
                                    <th>Vehicle Number</th>
                                    <th>Model / Type</th>
                                    <th>Driver Name</th>
                                    <th>Status</th>
                                    <th class="text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody id="fleet-table-body"></tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
        this.loadFleet();
    },

    loadFleet: function() {
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

    openAddVehicleModal: function() {
        const modal = document.getElementById('modal-container');
        const content = document.getElementById('modal-content');
        if (!modal || !content) return;

        content.innerHTML = `
            <div class="p-4 space-y-3">
                <div class="flex justify-between items-center border-b border-slate-800 pb-2">
                    <h3 class="text-sm font-bold text-amber-400">🚘 Nayi Gaadi Darj Karein</h3>
                    <button onclick="document.getElementById('modal-container').classList.add('hidden')" class="text-slate-400 hover:text-white">&times;</button>
                </div>
                <form onsubmit="FleetView.saveVehicle(event)" class="space-y-3 text-xs">
                    <div>
                        <label class="form-label">Vehicle Number *</label>
                        <input type="text" id="fv-number" required class="form-input font-mono" placeholder="e.g. RJ-27-AB-1234">
                    </div>
                    <div>
                        <label class="form-label">Vehicle Model / Type</label>
                        <input type="text" id="fv-model" required class="form-input" placeholder="e.g. Maruti Dzire / Toyota Innova">
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

    saveVehicle: function(event) {
        event.preventDefault();
        const number = document.getElementById('fv-number').value.trim();
        const model = document.getElementById('fv-model').value.trim();
        const driver = document.getElementById('fv-driver').value.trim() || 'Self';

        let fleet = JSON.parse(localStorage.getItem('aadesh_fleet') || '[]');
        fleet.push({ id: 'F-' + Date.now(), number, model, driver, status: 'Active' });
        localStorage.setItem('aadesh_fleet', JSON.stringify(fleet));

        document.getElementById('modal-container').classList.add('hidden');
        this.loadFleet();
    },

    deleteVehicle: function(id) {
        let fleet = JSON.parse(localStorage.getItem('aadesh_fleet') || '[]');
        fleet = fleet.filter(f => f.id !== id);
        localStorage.setItem('aadesh_fleet', JSON.stringify(fleet));
        this.loadFleet();
    }
};
