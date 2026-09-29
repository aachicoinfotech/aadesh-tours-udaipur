// js/views/duty-slip-view.js
window.DutySlipView = {
    render: function(containerId, tripData = null) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const settings = JSON.parse(localStorage.getItem('aadesh_settings') || '{}');
        const companyName = settings.companyName || "AADESH TOURS UDAIPUR";
        const phones = settings.phones || "9602842390 / 7043195007";

        container.innerHTML = `
            <div class="max-w-4xl mx-auto bg-slate-900 text-slate-100 p-4 sm:p-6 rounded-2xl shadow-xl border border-slate-800">
                <div class="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800">
                    <h2 class="text-xl font-bold text-amber-400 flex items-center gap-2">
                        <span>📋</span> Duty Slip / Log Sheet
                    </h2>
                    <div class="flex items-center gap-2">
                        <button onclick="DutySlipView.downloadPDF()" class="bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold px-4 py-2 rounded-lg text-sm flex items-center gap-1.5 transition">
                            <span>📥</span> PDF Download
                        </button>
                        <button onclick="DutySlipView.shareWhatsApp()" class="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2 rounded-lg text-sm flex items-center gap-1.5 transition">
                            <span>📲</span> WhatsApp Share
                        </button>
                    </div>
                </div>

                <div id="duty-slip-print-area" class="bg-white text-slate-900 p-6 rounded-xl shadow-inner border-2 border-amber-500">
                    <div class="text-center border-b-2 border-slate-900 pb-3 mb-4">
                        <h1 class="text-2xl sm:text-3xl font-extrabold tracking-wide text-red-700">${companyName}</h1>
                        <p class="text-sm font-semibold text-slate-700 mt-1">Mob: ${phones}</p>
                    </div>

                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm mb-3 border-b border-slate-300 pb-3">
                        <div class="flex justify-between sm:justify-start gap-2">
                            <span class="font-semibold text-slate-600">Slip No:</span>
                            <span id="ds-slip-no" class="font-bold text-slate-900">${tripData?.slipNo || 'ATU-' + Date.now().toString().slice(-6)}</span>
                        </div>
                        <div class="flex justify-between sm:justify-end gap-2">
                            <span class="font-semibold text-slate-600">Date:</span>
                            <span id="ds-date" class="font-bold text-slate-900">${tripData?.date || new Date().toISOString().split('T')[0]}</span>
                        </div>
                    </div>

                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm mb-3 border-b border-slate-300 pb-3">
                        <div>
                            <label class="block font-semibold text-slate-600 text-xs mb-1">Vehicle Number & Type:</label>
                            <input type="text" id="ds-vehicle" value="${tripData?.vehicle || ''}" placeholder="e.g. RJ-27-PA-0000" class="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1 text-sm font-medium">
                        </div>
                        <div class="grid grid-cols-2 gap-2">
                            <div>
                                <label class="block font-semibold text-slate-600 text-xs mb-1">Driver Name:</label>
                                <input type="text" id="ds-driver" value="${tripData?.driver || ''}" placeholder="Driver Name" class="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1 text-sm">
                            </div>
                            <div>
                                <label class="block font-semibold text-slate-600 text-xs mb-1">Driver Mob:</label>
                                <input type="text" id="ds-driver-mob" value="${tripData?.driverMob || ''}" placeholder="Mobile" class="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1 text-sm">
                            </div>
                        </div>
                    </div>

                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm mb-4 border-b-2 border-slate-900 pb-4">
                        <div class="grid grid-cols-2 gap-2">
                            <div>
                                <label class="block font-semibold text-slate-600 text-xs mb-1">Guest Name:</label>
                                <input type="text" id="ds-guest" value="${tripData?.guest || ''}" placeholder="Guest Name" class="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1 text-sm">
                            </div>
                            <div>
                                <label class="block font-semibold text-slate-600 text-xs mb-1">Guest Mob:</label>
                                <input type="text" id="ds-guest-mob" value="${tripData?.guestMob || ''}" placeholder="Mobile" class="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1 text-sm">
                            </div>
                        </div>
                        <div class="grid grid-cols-2 gap-2">
                            <div>
                                <label class="block font-semibold text-slate-600 text-xs mb-1">Company Name:</label>
                                <input type="text" id="ds-company" value="${tripData?.company || ''}" placeholder="Company" class="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1 text-sm">
                            </div>
                            <div>
                                <label class="block font-semibold text-slate-600 text-xs mb-1">Reporting Place:</label>
                                <input type="text" id="ds-reporting" value="${tripData?.reporting || 'Udaipur'}" placeholder="Location" class="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1 text-sm">
                            </div>
                        </div>
                    </div>

                    <div class="overflow-x-auto mb-4">
                        <table class="w-full border-collapse border border-slate-400 text-xs">
                            <thead>
                                <tr class="bg-slate-200 text-slate-800">
                                    <th class="border border-slate-400 p-1.5">Day</th>
                                    <th class="border border-slate-400 p-1.5">Date</th>
                                    <th class="border border-slate-400 p-1.5">Assignment / Route</th>
                                    <th class="border border-slate-400 p-1.5">Start KM</th>
                                    <th class="border border-slate-400 p-1.5">End KM</th>
                                    <th class="border border-slate-400 p-1.5">Total KM</th>
                                    <th class="border border-slate-400 p-1.5">Start Time</th>
                                    <th class="border border-slate-400 p-1.5">End Time</th>
                                    <th class="border border-slate-400 p-1.5">Sign</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td class="border border-slate-400 p-1 text-center">1</td>
                                    <td class="border border-slate-400 p-1"><input type="date" class="w-full bg-transparent text-xs" value="${new Date().toISOString().split('T')[0]}"></td>
                                    <td class="border border-slate-400 p-1"><input type="text" class="w-full bg-transparent text-xs" placeholder="Route details"></td>
                                    <td class="border border-slate-400 p-1"><input type="number" class="w-full bg-transparent text-xs ds-start-km" value="${tripData?.startKm || 0}" oninput="DutySlipView.calcTotal(this)"></td>
                                    <td class="border border-slate-400 p-1"><input type="number" class="w-full bg-transparent text-xs ds-end-km" value="${tripData?.endKm || 0}" oninput="DutySlipView.calcTotal(this)"></td>
                                    <td class="border border-slate-400 p-1 text-center font-bold ds-total-km">0</td>
                                    <td class="border border-slate-400 p-1"><input type="time" class="w-full bg-transparent text-xs"></td>
                                    <td class="border border-slate-400 p-1"><input type="time" class="w-full bg-transparent text-xs"></td>
                                    <td class="border border-slate-400 p-1 text-center text-slate-400">Sign</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-300 text-sm mb-4">
                        <div>
                            <label class="block font-semibold text-slate-700 text-xs mb-1">Toll Tax (₹):</label>
                            <input type="number" id="ds-toll" value="${tripData?.toll || 0}" class="w-full bg-white border border-slate-300 rounded px-2 py-1 text-sm">
                        </div>
                        <div>
                            <label class="block font-semibold text-slate-700 text-xs mb-1">Parking (₹):</label>
                            <input type="number" id="ds-parking" value="${tripData?.parking || 0}" class="w-full bg-white border border-slate-300 rounded px-2 py-1 text-sm">
                        </div>
                        <div>
                            <label class="block font-semibold text-slate-700 text-xs mb-1">Border Tax (₹):</label>
                            <input type="number" id="ds-border" value="${tripData?.borderTax || 0}" class="w-full bg-white border border-slate-300 rounded px-2 py-1 text-sm">
                        </div>
                    </div>

                    <div class="flex justify-between items-end pt-4 border-t border-slate-300 text-xs text-slate-600">
                        <div>
                            <p class="font-semibold">Note: Toll, Parking & Extra charges payable by party.</p>
                            <p class="mt-1">Thanks You For Choosing <strong>Aadesh Tours</strong></p>
                        </div>
                        <div class="text-center">
                            <div class="h-10 border-b border-slate-400 w-32 mb-1"></div>
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

    downloadPDF: function() { window.print(); },

    shareWhatsApp: function() {
        const slipNo = document.getElementById('ds-slip-no').innerText;
        const guest = document.getElementById('ds-guest').value || 'Guest';
        const text = `*AADESH TOURS UDAIPUR - DUTY SLIP*%0A*Slip No:* ${slipNo}%0A*Guest:* ${guest}%0A*Mob:* 9602842390 / 7043195007`;
        window.open(`https://wa.me/?text=${text}`, '_blank');
    }
};
