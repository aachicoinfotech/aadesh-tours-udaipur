// js/views/duty-slip-view.js - Aadesh Tours Udaipur Duty Slip / Log Sheet Manager
window.DutySlipView = {
    render: function(containerId, slipData = null) {
        const container = document.getElementById(containerId);
        if (!container) return;

        // Default or passed slip details
        const slip = slipData || {
            id: 'ATU-' + Math.floor(100000 + Math.random() * 900000),
            date: new Date().toISOString().split('T')[0],
            vehicle: '',
            driverName: '',
            driverMob: '',
            guestName: '',
            guestMob: '',
            company: '',
            reporting: 'Udaipur',
            rows: [
                { id: 1, day: 1, date: new Date().toISOString().split('T')[0], assignment: '', startKm: 0, endKm: 0, startTime: '', endTime: '' }
            ]
        };

        container.innerHTML = `
            <div class="space-y-4 max-w-4xl mx-auto pb-12">
                <div class="vault-card flex items-center justify-between print:hidden">
                    <div>
                        <h2 class="text-base font-bold text-amber-400">📋 Duty Slip & Multi-Day Log Sheet</h2>
                        <p class="text-xs text-slate-400">Aadesh Tours Udaipur - Physical Log Sheet format with Full CRUD</p>
                    </div>
                    <div class="flex gap-2">
                        <button type="button" onclick="window.print()" class="btn btn-primary px-3 py-1.5 text-xs">🖨️ Print Slip</button>
                        <button type="button" onclick="DutySlipView.addRow('${slip.id}')" class="btn btn-secondary px-3 py-1.5 text-xs">➕ Row Jodein</button>
                    </div>
                </div>

                <!-- Duty Slip Physical Format Box -->
                <div class="bg-white text-slate-900 p-6 rounded-xl shadow-2xl border-2 border-slate-300 space-y-4 font-sans">
                    <!-- Header -->
                    <div class="text-center border-b-2 border-slate-900 pb-3 space-y-1">
                        <h1 class="text-2xl font-black tracking-wider text-orange-600">AADESH TOURS UDAIPUR</h1>
                        <p class="text-sm font-bold tracking-widest text-slate-800">9602842390 / 7043195007</p>
                    </div>

                    <!-- Top Meta Info Grid -->
                    <div class="flex justify-between items-center text-xs border-b border-slate-400 pb-2 font-bold">
                        <div>No.: <span class="font-mono text-slate-700">${slip.id}</span></div>
                        <div>Date: <span class="font-mono text-slate-700">${slip.date}</span></div>
                    </div>

                    <!-- Form Fields Table -->
                    <div class="border border-slate-900 text-xs">
                        <div class="grid grid-cols-2 border-b border-slate-900">
                            <div class="p-1.5 border-r border-slate-900 flex items-center gap-1">
                                <span class="font-bold whitespace-nowrap">Vehicle Number & Type:</span>
                                <input type="text" id="ds-vehicle" value="${slip.vehicle}" class="w-full bg-transparent outline-none px-1 font-mono" placeholder="RJ-27-PA-0000">
                            </div>
                            <div class="p-1.5 flex items-center gap-1">
                                <span class="font-bold whitespace-nowrap">Driver Name:</span>
                                <input type="text" id="ds-driver" value="${slip.driverName}" class="w-full bg-transparent outline-none px-1" placeholder="Name">
                                <span class="font-bold whitespace-nowrap border-l border-slate-400 pl-1">Mob:</span>
                                <input type="text" id="ds-driver-mob" value="${slip.driverMob}" class="w-24 bg-transparent outline-none px-1 font-mono" placeholder="Mobile">
                            </div>
                        </div>

                        <div class="grid grid-cols-2 border-b border-slate-900 bg-slate-100">
                            <div class="p-1.5 border-r border-slate-900 font-bold text-center text-slate-700 uppercase tracking-wider text-[10px]">User Details</div>
                            <div class="p-1.5 font-bold text-center text-slate-700 uppercase tracking-wider text-[10px]">Booking Details</div>
                        </div>

                        <div class="grid grid-cols-2 border-b border-slate-900">
                            <div class="p-1.5 border-r border-slate-900 flex items-center gap-1">
                                <span class="font-bold whitespace-nowrap">Guest Name:</span>
                                <input type="text" id="ds-guest" value="${slip.guestName}" class="w-full bg-transparent outline-none px-1" placeholder="Guest Name">
                                <span class="font-bold whitespace-nowrap border-l border-slate-400 pl-1">Mob:</span>
                                <input type="text" id="ds-guest-mob" value="${slip.guestMob}" class="w-24 bg-transparent outline-none px-1 font-mono" placeholder="Mobile">
                            </div>
                            <div class="p-1.5 flex items-center gap-1">
                                <span class="font-bold whitespace-nowrap">Company Name:</span>
                                <input type="text" id="ds-company" value="${slip.company}" class="w-full bg-transparent outline-none px-1" placeholder="Company (Optional)">
                            </div>
                        </div>

                        <div class="p-1.5 flex items-center gap-1">
                            <span class="font-bold whitespace-nowrap">Reporting Place:</span>
                            <input type="text" id="ds-reporting" value="${slip.reporting}" class="w-full bg-transparent outline-none px-1" placeholder="Udaipur">
                        </div>
                    </div>

                    <!-- Multi-Day Log Sheet Table -->
                    <div class="overflow-x-auto border border-slate-900">
                        <table class="w-full text-center text-[11px] border-collapse">
                            <thead>
                                <tr class="bg-slate-200 border-b border-slate-900 text-slate-900 font-bold">
                                    <th class="border-r border-slate-900 p-1">Days</th>
                                    <th class="border-r border-slate-900 p-1">Date</th>
                                    <th class="border-r border-slate-900 p-1">Assignment</th>
                                    <th class="border-r border-slate-900 p-1">Start-Km</th>
                                    <th class="border-r border-slate-900 p-1">End-Km</th>
                                    <th class="border-r border-slate-900 p-1">Total Km</th>
                                    <th class="border-r border-slate-900 p-1">Start Time</th>
                                    <th class="border-r border-slate-900 p-1">End Time</th>
                                    <th class="border-r border-slate-900 p-1">Total Time</th>
                                    <th class="border-r border-slate-900 p-1">Signature</th>
                                    <th class="p-1 print:hidden">Action</th>
                                </tr>
                            </thead>
                            <tbody id="duty-rows-body">
                                ${slip.rows.map((r, idx) => `
                                    <tr class="border-b border-slate-400">
                                        <td class="border-r border-slate-400 p-1 font-mono">${idx + 1}</td>
                                        <td class="border-r border-slate-400 p-1"><input type="date" value="${r.date}" class="w-28 bg-transparent text-center outline-none font-mono text-[10px]" onchange="DutySlipView.updateRow(${idx}, 'date', this.value)"></td>
                                        <td class="border-r border-slate-400 p-1"><input type="text" value="${r.assignment}" class="w-full bg-transparent outline-none px-1 text-[11px]" placeholder="Route / Details" onchange="DutySlipView.updateRow(${idx}, 'assignment', this.value)"></td>
                                        <td class="border-r border-slate-400 p-1"><input type="number" value="${r.startKm}" class="w-16 bg-transparent text-center outline-none font-mono" onchange="DutySlipView.updateRow(${idx}, 'startKm', this.value)"></td>
                                        <td class="border-r border-slate-400 p-1"><input type="number" value="${r.endKm}" class="w-16 bg-transparent text-center outline-none font-mono" onchange="DutySlipView.updateRow(${idx}, 'endKm', this.value)"></td>
                                        <td class="border-r border-slate-400 p-1 font-mono font-bold bg-slate-50">${Math.max(0, (r.endKm || 0) - (r.startKm || 0))}</td>
                                        <td class="border-r border-slate-400 p-1"><input type="time" value="${r.startTime || '09:00'}" class="bg-transparent text-center outline-none text-[10px]" onchange="DutySlipView.updateRow(${idx}, 'startTime', this.value)"></td>
                                        <td class="border-r border-slate-400 p-1"><input type="time" value="${r.endTime || '18:00'}" class="bg-transparent text-center outline-none text-[10px]" onchange="DutySlipView.updateRow(${idx}, 'endTime', this.value)"></td>
                                        <td class="border-r border-slate-400 p-1 font-mono text-[10px]">--</td>
                                        <td class="border-r border-slate-400 p-1 h-8"></td>
                                        <td class="p-1 print:hidden">
                                            <button type="button" onclick="DutySlipView.deleteRow(${idx})" class="text-rose-600 font-bold px-1 text-xs">×</button>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>

                    <!-- Footer Note -->
                    <div class="flex justify-between items-end pt-8 text-xs font-bold">
                        <div>Thanks You For Choosing aadesh tours</div>
                        <div class="border-t border-slate-900 pt-1 px-4 text-center">Customer Signature</div>
                    </div>
                </div>
            </div>
        `;
        window.currentActiveSlip = slip;
    },

    addRow: function() {
        if (!window.currentActiveSlip) return;
        window.currentActiveSlip.rows.push({
            id: Date.now(),
            date: new Date().toISOString().split('T')[0],
            assignment: '',
            startKm: 0,
            endKm: 0,
            startTime: '09:00',
            endTime: '18:00'
        });
        this.render('tab-trips', window.currentActiveSlip);
    },

    updateRow: function(index, field, value) {
        if (!window.currentActiveSlip || !window.currentActiveSlip.rows[index]) return;
        window.currentActiveSlip.rows[index][field] = field.includes('Km') ? parseFloat(value) || 0 : value;
        // Re-render to update Total KM calculation instantly
        this.render('tab-trips', window.currentActiveSlip);
    },

    deleteRow: function(index) {
        if (!window.currentActiveSlip || window.currentActiveSlip.rows.length <= 1) {
            alert('Kam se kam ek row hona anivarya hai.');
            return;
        }
        window.currentActiveSlip.rows.splice(index, 1);
        this.render('tab-trips', window.currentActiveSlip);
    }
};
