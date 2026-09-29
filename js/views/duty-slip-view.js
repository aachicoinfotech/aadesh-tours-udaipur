// js/views/duty-slip-view.js - Aadesh Tours Udaipur Duty Slip Module
window.DutySlipView = {
    render: function(containerId, tripData = null) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const settings = JSON.parse(localStorage.getItem('aadesh_settings') || '{}');
        const companyName = settings.companyName || "AADESH TOURS UDAIPUR";
        const phones = settings.phones || "9602842390 / 7043195007";

        container.innerHTML = `
            <div class="space-y-4">
                <div class="vault-card flex flex-wrap items-center justify-between gap-3 print:hidden">
                    <div>
                        <h2 class="text-base font-bold text-amber-400">📋 Duty Slip / Log Sheet</h2>
                        <p class="text-xs text-slate-400">Physical log sheet format for customer signature</p>
                    </div>
                    <div class="flex items-center gap-2">
                        <button onclick="window.print()" class="btn btn-primary px-3 py-1.5 text-xs">📥 PDF Download</button>
                        <button onclick="DutySlipView.shareWhatsApp()" class="btn btn-success px-3 py-1.5 text-xs">📲 WhatsApp Share</button>
                    </div>
                </div>

                <div class="bg-white text-slate-900 p-6 rounded-xl shadow-xl border-2 border-amber-500 font-sans">
                    <div class="text-center border-b-2 border-slate-900 pb-3 mb-3">
                        <h1 class="text-2xl font-black text-red-700 uppercase">${companyName}</h1>
                        <p class="text-xs font-bold text-slate-700 mt-1">Mob: ${phones}</p>
                    </div>

                    <div class="grid grid-cols-2 gap-3 text-xs mb-3 border-b border-slate-300 pb-3">
                        <div>
                            <span class="font-semibold text-slate-600">Slip No:</span>
                            <span id="ds-slip-no" class="font-bold text-slate-900">${tripData?.slipNo || 'ATU-' + Date.now().toString().slice(-6)}</span>
                        </div>
                        <div class="text-right">
                            <span class="font-semibold text-slate-600">Date:</span>
                            <span id="ds-date" class="font-bold text-slate-900">${tripData?.date || new Date().toISOString().split('T')[0]}</span>
                        </div>
                    </div>

                    <div class="grid grid-cols-2 gap-3 text-xs mb-3 border-b border-slate-300 pb-3">
                        <div>
                            <label class="form-label">Vehicle Number & Type:</label>
                            <input type="text" id="ds-vehicle" value="${tripData?.vehicle || ''}" placeholder="e.g. RJ-27-PA-0000" class="form-input bg-slate-50 text-slate-900">
                        </div>
                        <div class="grid grid-cols-2 gap-2">
                            <div>
                                <label class="form-label">Driver Name:</label>
                                <input type="text" id="ds-driver" value="${tripData?.driver || ''}" placeholder="Driver Name" class="form-input bg-slate-50 text-slate-900">
                            </div>
                            <div>
                                <label class="form-label">Driver Mob:</label>
                                <input type="text" id="ds-driver-mob" value="${tripData?.driverMob || ''}" placeholder="Mobile" class="form-input bg-slate-50 text-slate-900">
                            </div>
                        </div>
                    </div>

                    <div class="grid grid-cols-2 gap-3 text-xs mb-4 border-b-2 border-slate-900 pb-4">
                        <div class="grid grid-cols-2 gap-2">
                            <div>
                                <label class="form-label">Guest Name:</label>
                                <input type="text" id="ds-guest" value="${tripData?.guest || ''}" placeholder="Guest Name" class="form-input bg-slate-50 text-slate-900">
                            </div>
                            <div>
                                <label class="form-label">Guest Mob:</label>
                                <input type="text" id="ds-guest-mob" value="${tripData?.guestMob || ''}" placeholder="Mobile" class="form-input bg-slate-50 text-slate-900">
                            </div>
                        </div>
                        <div class="grid grid-cols-2 gap-2">
                            <div>
                                <label class="form-label">Company Name:</label>
                                <input type="text" id="ds-company" value="${tripData?.company || ''}" placeholder="Company" class="form-input bg-slate-50 text-slate-900">
                            </div>
                            <div>
                                <label class="form-label">Reporting Place:</label>
                                <input type="text" id="ds-reporting" value="${tripData?.reporting || 'Udaipur'}" placeholder="Location" class="form-input bg-slate-50 text-slate-900">
                            </div>
                        </div>
                    </div>

                    <div class="overflow-x-auto mb-4">
                        <table class="w-full border-collapse border border-slate-400 text-xs">
                            <thead>
                                <tr class="bg-slate-200 text-slate-800">
                                    <th class="border border-slate-400 p-1.5">Day</th>
                                    <th class="border border-slate-400 p-1.5">Date</th>
                                    <th class="border border-slate-400 p-1.5">Route / Details</th>
                                    <th class="border border-slate-400 p-1.5">Start KM</th>
                                    <th class="border border-slate-400 p-1.5">End KM</th>
                                    <th class="border border-slate-400 p-1.5">Total KM</th>
                                    <th class="border border-slate-400 p-1.5">Sign</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td class="border border-slate-400 p-1 text-center">1</td>
                                    <td class="border border-slate-400 p-1"><input type="date" class="w-full bg-transparent text-xs text-slate-900" value="${new Date().toISOString().split('T')[0]}"></td>
                                    <td class="border border-slate-400 p-1"><input type="text" class="w-full bg-transparent text-xs text-slate-900" placeholder="Route details"></td>
                                    <td class="border border-slate-400 p-1"><input type="number" class="w-full bg-transparent text-xs text-slate-900 ds-start-km" value="${tripData?.startKm || 0}" oninput="DutySlipView.calcTotal(this)"></td>
                                    <td class="border border-slate-400 p-1"><input type="number" class="w-full bg-transparent text-xs text-slate-900 ds-end-km" value="${tripData?.endKm || 0}" oninput="DutySlipView.calcTotal(this)"></td>
                                    <td class="border border-slate-400 p-1 text-center font-bold ds-total-km">0</td>
                                    <td class="border border-slate-400 p-1 text-center text-slate-400">Sign</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div class="grid grid-cols-3 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-300 text-xs mb-4">
                        <div>
                            <label class="form-label text-slate-700">Toll Tax (₹):</label>
                            <input type="number" id="ds-toll" value="${tripData?.toll || 0}" class="form-input bg-white text-slate-900">
                        </div>
                        <div>
                            <label class="form-label text-slate-700">Parking (₹):</label>
                            <input type="number" id="ds-parking" value="${tripData?.parking || 0}" class="form-input bg-white text-slate-900">
                        </div>
                        <div>
                            <label class="form-label text-slate-700">Border Tax (₹):</label>
                            <input type="number" id="ds-border" value="${tripData?.borderTax || 0}" class="form-input bg-white text-slate-900">
                        </div>
                    </div>

                    <div class="flex justify-between items-end pt-3 border-t border-slate-300 text-xs text-slate-700">
                        <div>
                            <p class="font-semibold">Note: Toll, Parking & Extra charges payable by party.</p>
                            <p class="mt-1">Thanks You For Choosing <strong>Aadesh Tours</strong></p>
                        </div>
                        <div class="text-center">
                            <div class="h-8 border-b border-slate-400 w-28 mb-1"></div>
                            <span class="font-semibold">Customer Signature</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    calcTotal: function(input) {
        const row = input.closest('tr');
        const start = parseFloat(row.querySelector('.ds-start-km').value) || 0;
        const end = parseFloat(row.querySelector('.ds-end-km').value) || 0;
        const totalCell = row.querySelector('.ds-total-km');
        totalCell.textContent = end > start ? end - start : 0;
    },

    shareWhatsApp: function() {
        const slipNo = document.getElementById('ds-slip-no').innerText;
        const guest = document.getElementById('ds-guest').value || 'Guest';
        const text = `*AADESH TOURS UDAIPUR - DUTY SLIP*%0A*Slip No:* ${slipNo}%0A*Guest:* ${guest}%0A*Mob:* 9602842390 / 7043195007`;
        window.open(`https://wa.me/?text=${text}`, '_blank');
    }
};
