// js/views/duty-slip-view.js - Dedicated Duty Slip & Multi-Day Log Sheet Generator
window.DutySlipView = {
    render: function(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = `
            <div class="space-y-4 max-w-5xl mx-auto pb-12">
                <div class="vault-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                        <h2 class="text-base font-bold text-amber-400">📋 Dedicated Duty Slip & Log Sheet Generator</h2>
                        <p class="text-xs text-slate-400">Aadesh Tours Udaipur - Create, Print & Manage Standalone Duty Slips</p>
                    </div>
                    <button type="button" onclick="DutySlipView.openNewDutyModal()" class="btn btn-primary px-3 py-2 text-xs">
                        ➕ Nayi Duty Slip Banayein
                    </button>
                </div>

                <div class="vault-card space-y-3">
                    <h3 class="text-xs font-bold text-slate-200 uppercase tracking-wider">Generated Duty Slips History</h3>
                    <div class="overflow-x-auto">
                        <table class="tally-table">
                            <thead>
                                <tr>
                                    <th>Slip ID / Date</th>
                                    <th>Vehicle</th>
                                    <th>Driver Name</th>
                                    <th>Guest Name</th>
                                    <th>Reporting Place</th>
                                    <th class="text-right">Actions (View / Print / Delete)</th>
                                </tr>
                            </thead>
                            <tbody id="duty-slips-table-body"></tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
        this.loadDutySlipsData();
    },

    loadDutySlipsData: function() {
        const tbody = document.getElementById('duty-slips-table-body');
        if (!tbody) return;
        const slips = JSON.parse(localStorage.getItem('aadesh_duty_slips') || '[]');

        tbody.innerHTML = slips.map(s => `
            <tr>
                <td>
                    <div class="font-bold text-amber-400 font-mono">${s.id}</div>
                    <div class="text-[10px] text-slate-400">${s.date}</div>
                </td>
                <td class="font-mono font-bold text-xs">${s.vehicle || 'N/A'}</td>
                <td>${s.driver || 'N/A'}</td>
                <td>
                    <div class="font-bold">${s.guestName}</div>
                    <div class="text-[10px] text-slate-400 font-mono">${s.guestMob}</div>
                </td>
                <td>${s.reporting || 'Udaipur'}</td>
                <td class="text-right space-x-1">
                    <button type="button" onclick="DutySlipView.viewSlip('${s.id}')" class="btn btn-secondary px-2 py-1 text-[10px] text-amber-400">View / Print</button>
                    <button type="button" onclick="DutySlipView.deleteSlip('${s.id}')" class="btn btn-secondary px-2 py-1 text-[10px] text-rose-400">Delete</button>
                </td>
            </tr>
        `).join('') || '<tr><td colspan="6" class="text-center text-slate-500 py-4">Koi duty slip darj nahi hai. Nayi slip banayein.</td></tr>';
    },

    openNewDutyModal: function() {
        const modal = document.getElementById('modal-container');
        const content = document.getElementById('modal-content');
        if (!modal || !content) return;

        const fleet = JSON.parse(localStorage.getItem('aadesh_fleet') || '[]');
        const drivers = JSON.parse(localStorage.getItem('aadesh_drivers') || '[]');
        const today = new Date().toISOString().split('T')[0];

        content.innerHTML = `
            <div class="p-5 space-y-4 bg-slate-900 text-slate-100 rounded-xl max-h-[90vh] overflow-y-auto">
                <div class="flex justify-between items-center border-b border-slate-800 pb-2">
                    <h3 class="text-sm font-bold text-amber-400">📋 Nayi Duty Slip Darj Karein</h3>
                    <button type="button" onclick="document.getElementById('modal-container').classList.add('hidden')" class="text-slate-400">&times;</button>
                </div>
                <form onsubmit="DutySlipView.saveNewSlip(event)" class="space-y-3 text-xs">
                    <div class="grid grid-cols-2 gap-2">
                        <div>
                            <label class="form-label text-slate-300">Vehicle Number *</label>
                            <select id="ds-vehicle" required class="form-input bg-slate-950 text-white border-slate-700 font-mono">
                                <option value="">-- Gaadi Chunein --</option>
                                ${fleet.map(f => `<option value="${f.number} (${f.model})">${f.number} -${f.model}</option>`).join('')}
                            </select>
                        </div>
                        <div>
                            <label class="form-label text-slate-300">Driver Name *</label>
                            <select id="ds-driver" required class="form-input bg-slate-950 text-white border-slate-700">
                                <option value="">-- Driver Chunein --</option>
                                ${drivers.map(d => `<option value="${d.name}">${d.name} (${d.mobile})</option>`).join('')}
                            </select>
                        </div>
                    </div>
                    <div class="grid grid-cols-2 gap-2">
                        <div>
                            <label class="form-label text-slate-300">Guest Name *</label>
                            <input type="text" id="ds-guest" required class="form-input bg-slate-950 text-white border-slate-700" placeholder="Guest Name">
                        </div>
                        <div>
                            <label class="form-label text-slate-300">Guest Mobile *</label>
                            <input type="text" id="ds-guest-mob" required class="form-input bg-slate-950 text-white border-slate-700 font-mono" placeholder="9876543210">
                        </div>
                    </div>
                    <div class="grid grid-cols-2 gap-2">
                        <div>
                            <label class="form-label text-slate-300">Company Name</label>
                            <input type="text" id="ds-company" class="form-input bg-slate-950 text-white border-slate-700" placeholder="Company Name">
                        </div>
                        <div>
                            <label class="form-label text-slate-300">Reporting Place</label>
                            <input type="text" id="ds-reporting" value="Udaipur" class="form-input bg-slate-950 text-white border-slate-700" placeholder="Reporting Place">
                        </div>
                    </div>
                    <div class="flex justify-end gap-2 pt-3 border-t border-slate-800">
                        <button type="button" onclick="document.getElementById('modal-container').classList.add('hidden')" class="btn btn-secondary px-3 py-1.5">Radd</button>
                        <button type="submit" class="btn btn-primary px-4 py-1.5 font-bold">Slip Banayein</button>
                    </div>
                </form>
            </div>
        `;
        modal.classList.remove('hidden');
    },

    saveNewSlip: function(event) {
        event.preventDefault();
        const vehicle = document.getElementById('ds-vehicle').value;
        const driver = document.getElementById('ds-driver').value;
        const guestName = document.getElementById('ds-guest').value.trim();
        const guestMob = document.getElementById('ds-guest-mob').value.trim();
        const company = document.getElementById('ds-company').value.trim() || 'N/A';
        const reporting = document.getElementById('ds-reporting').value.trim() || 'Udaipur';
        const date = new Date().toISOString().split('T')[0];

        const newSlip = {
            id: 'DS-' + Math.floor(100000 + Math.random() * 900000),
            date,
            vehicle,
            driver,
            guestName,
            guestMob,
            company,
            reporting,
            rows: [
                { day: 1, date, assignment: 'Local / Outstation', startKm: 0, endKm: 0, startTime: '09:00', endTime: '18:00' }
            ]
        };

        let slips = JSON.parse(localStorage.getItem('aadesh_duty_slips') || '[]');
        slips.unshift(newSlip);
        localStorage.setItem('aadesh_duty_slips', JSON.stringify(slips));

        document.getElementById('modal-container').classList.add('hidden');
        this.loadDutySlipsData();
        this.viewSlip(newSlip.id);
    },

    viewSlip: function(slipId) {
        const modal = document.getElementById('modal-container');
        const content = document.getElementById('modal-content');
        if (!modal || !content) return;

        const slips = JSON.parse(localStorage.getItem('aadesh_duty_slips') || '[]');
        const slip = slips.find(s => s.id === slipId);
        if (!slip) return;

        content.innerHTML = `
            <div class="p-6 space-y-4 bg-white text-slate-900 rounded-xl max-h-[90vh] overflow-y-auto font-sans">
                <div class="flex justify-between items-center border-b-2 border-slate-900 pb-3 print:hidden">
                    <h3 class="text-sm font-bold text-orange-600">📋 Duty Slip Log Sheet</h3>
                    <div class="flex gap-2">
                        <button type="button" onclick="window.print()" class="btn btn-primary px-3 py-1 text-xs">🖨️ Print Slip</button>
                        <button type="button" onclick="DutySlipView.addRow('${slip.id}')" class="btn btn-secondary px-3 py-1 text-xs">➕ Din Jodein</button>
                        <button type="button" onclick="document.getElementById('modal-container').classList.add('hidden')" class="text-slate-900 font-bold text-lg">&times;</button>
                    </div>
                </div>

                <div class="text-center border-b-2 border-slate-900 pb-2 space-y-1">
                    <h1 class="text-xl font-black tracking-wider text-orange-600">AADESH TOURS UDAIPUR</h1>
                    <p class="text-xs font-bold tracking-widest text-slate-800">9602842390 / 7043195007</p>
                </div>

                <div class="flex justify-between items-center text-xs border-b border-slate-400 pb-2 font-bold">
                    <div>Slip No: <span class="font-mono">${slip.id}</span></div>
                    <div>Date: <span class="font-mono">${slip.date}</span></div>
                </div>

                <div class="border border-slate-900 text-xs">
                    <div class="grid grid-cols-2 border-b border-slate-900 p-1.5">
                        <div><strong class="font-bold">Vehicle:</strong> ${slip.vehicle}</div>
                        <div><strong class="font-bold">Driver:</strong> ${slip.driver}</div>
                    </div>
                    <div class="grid grid-cols-2 border-b border-slate-900 p-1.5">
                        <div><strong class="font-bold">Guest:</strong> ${slip.guestName} (${slip.guestMob})</div>
                        <div><strong class="font-bold">Company:</strong> ${slip.company}</div>
                    </div>
                    <div class="p-1.5">
                        <strong class="font-bold">Reporting Place:</strong> ${slip.reporting}
                    </div>
                </div>

                <div class="overflow-x-auto border border-slate-900">
                    <table class="w-full text-center text-[11px] border-collapse">
                        <thead>
                            <tr class="bg-slate-200 border-b border-slate-900 font-bold text-slate-900">
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
                            ${slip.rows.map((r, idx) => `
                                <tr class="border-b border-slate-400">
                                    <td class="border-r border-slate-400 p-1 font-mono font-bold">${idx + 1}</td>
                                    <td class="border-r border-slate-400 p-1"><input type="date" value="${r.date}" class="bg-transparent text-center font-mono text-[10px]" onchange="DutySlipView.updateRow('${slip.id}',${idx}, 'date', this.value)"></td>
                                    <td class="border-r border-slate-400 p-1"><input type="text" value="${r.assignment}" class="w-full bg-transparent px-1 text-[11px]" placeholder="Route details" onchange="DutySlipView.updateRow('${slip.id}',${idx}, 'assignment', this.value)"></td>
                                    <td class="border-r border-slate-400 p-1"><input type="number" value="${r.startKm}" class="w-16 bg-transparent text-center font-mono" onchange="DutySlipView.updateRow('${slip.id}',${idx}, 'startKm', this.value)"></td>
                                    <td class="border-r border-slate-400 p-1"><input type="number" value="${r.endKm}" class="w-16 bg-transparent text-center font-mono" onchange="DutySlipView.updateRow('${slip.id}',${idx}, 'endKm', this.value)"></td>
                                    <td class="border-r border-slate-400 p-1 font-mono font-bold bg-slate-50">${Math.max(0, (r.endKm || 0) - (r.startKm || 0))}</td>
                                    <td class="border-r border-slate-400 p-1"><input type="time" value="${r.startTime || '09:00'}" class="bg-transparent text-center text-[10px]" onchange="DutySlipView.updateRow('${slip.id}',${idx}, 'startTime', this.value)"></td>
                                    <td class="border-r border-slate-400 p-1"><input type="time" value="${r.endTime || '18:00'}" class="bg-transparent text-center text-[10px]" onchange="DutySlipView.updateRow('${slip.id}',${idx}, 'endTime', this.value)"></td>
                                    <td class="p-1 print:hidden">
                                        <button type="button" onclick="DutySlipView.deleteRow('${slip.id}',${idx})" class="text-rose-600 font-bold px-1">×</button>
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

    addRow: function(slipId) {
        let slips = JSON.parse(localStorage.getItem('aadesh_duty_slips') || '[]');
        let slip = slips.find(s => s.id === slipId);
        if (!slip) return;

        slip.rows.push({
            day: slip.rows.length + 1,
            date: new Date().toISOString().split('T')[0],
            assignment: '',
            startKm: 0,
            endKm: 0,
            startTime: '09:00',
            endTime: '18:00'
        });

        localStorage.setItem('aadesh_duty_slips', JSON.stringify(slips));
        this.viewSlip(slipId);
    },

    updateRow: function(slipId, index, field, value) {
        let slips = JSON.parse(localStorage.getItem('aadesh_duty_slips') || '[]');
        let slip = slips.find(s => s.id === slipId);
        if (!slip || !slip.rows[index]) return;

        slip.rows[index][field] = field.includes('Km') ? parseFloat(value) || 0 : value;
        localStorage.setItem('aadesh_duty_slips', JSON.stringify(slips));
    },

    deleteRow: function(slipId, index) {
        let slips = JSON.parse(localStorage.getItem('aadesh_duty_slips') || '[]');
        let slip = slips.find(s => s.id === slipId);
        if (!slip || slip.rows.length <= 1) {
            alert('Kam se kam ek row hona anivarya hai.');
            return;
        }

        slip.rows.splice(index, 1);
        localStorage.setItem('aadesh_duty_slips', JSON.stringify(slips));
        this.viewSlip(slipId);
    },

    deleteSlip: function(slipId) {
        if (!confirm('Kya aap is duty slip ko delete karna chahte hain?')) return;
        let slips = JSON.parse(localStorage.getItem('aadesh_duty_slips') || '[]');
        slips = slips.filter(s => s.id !== slipId);
        localStorage.setItem('aadesh_duty_slips', JSON.stringify(slips));
        this.loadDutySlipsData();
    }
};
