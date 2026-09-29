// js/views/billing-view.js - Aadesh Tours Udaipur Red Billbook Invoice Module
window.BillingView = {
    render: function(containerId, billData = null) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const settings = JSON.parse(localStorage.getItem('aadesh_settings') || '{}');
        const companyName = settings.companyName || "AADESH TOURS UDAIPUR";
        const phones = settings.phones || "9602842390 / 7043195007";
        const bankName = "State Bank of India (SBI)";
        const accountHolder = "Chetan Nath";
        const accountNumber = "44936542535";
        const ifscCode = "SBIN0016178";

        if (!billData) {
            const trips = JSON.parse(localStorage.getItem('aadesh_trips') || '[]');
            billData = trips.length > 0 ? trips[0] : {
                slipNo: 'ATU-0000',
                date: new Date().toISOString().split('T')[0],
                party: 'Sample Party',
                vehicle: 'RJ-27-PA-0000',
                mode: 'outstation',
                kmRun: 0,
                totalAmount: 0,
                toll: 0,
                parking: 0,
                border: 0,
                grandTotal: 0,
                advance: 0,
                balanceDue: 0
            };
        }

        container.innerHTML = `
            <div class="space-y-4">
                <div class="vault-card flex flex-wrap items-center justify-between gap-3 print:hidden">
                    <div>
                        <h2 class="text-base font-bold text-amber-400">🧾 Red Billbook Invoice</h2>
                        <p class="text-xs text-slate-400">Professional Tax Invoice</p>
                    </div>
                    <div class="flex items-center gap-2">
                        <button onclick="window.print()" class="btn btn-primary px-3 py-1.5 text-xs">📥 Print / PDF</button>
                        <button onclick="BillingView.shareWhatsApp('${billData.slipNo}', '${billData.party}', '${billData.grandTotal}', '${billData.balanceDue}')" class="btn btn-success px-3 py-1.5 text-xs">📲 WhatsApp</button>
                    </div>
                </div>

                <div class="bg-white text-slate-900 p-6 rounded-xl shadow-xl border-4 border-red-700 font-sans">
                    <div class="text-center border-b-2 border-red-700 pb-3 mb-3">
                        <h1 class="text-2xl font-black text-red-700 uppercase">${companyName}</h1>
                        <p class="text-[11px] font-bold text-slate-700">Taxi Service, Outstation Tour & Corporate Cab Provider</p>
                        <p class="text-xs font-bold text-slate-900 mt-1">Contact: ${phones}</p>
                    </div>

                    <div class="grid grid-cols-2 gap-2 text-xs mb-3 border-b border-slate-300 pb-3">
                        <div>
                            <p class="font-semibold text-slate-600">Bill No: <span class="font-bold text-slate-900">${billData.slipNo}</span></p>
                            <p class="font-semibold text-slate-600 mt-0.5">Party: <span class="font-bold text-slate-900">${billData.party}</span></p>
                        </div>
                        <div class="text-right">
                            <p class="font-semibold text-slate-600">Date: <span class="font-bold text-slate-900">${billData.date}</span></p>
                            <p class="font-semibold text-slate-600 mt-0.5">Vehicle: <span class="font-bold text-slate-900">${billData.vehicle}</span></p>
                        </div>
                    </div>

                    <div class="overflow-x-auto mb-4">
                        <table class="w-full border-collapse border border-slate-400 text-xs">
                            <thead>
                                <tr class="bg-red-700 text-white">
                                    <th class="border border-slate-400 p-2 text-left">Particulars / Description</th>
                                    <th class="border border-slate-400 p-2 text-center">Mode</th>
                                    <th class="border border-slate-400 p-2 text-right">Amount (₹)</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td class="border border-slate-400 p-2 font-medium">Taxi Rental (${billData.mode.toUpperCase()})</td>
                                    <td class="border border-slate-400 p-2 text-center uppercase text-[10px] font-bold text-slate-700">${billData.mode}</td>
                                    <td class="border border-slate-400 p-2 text-right font-bold">₹${billData.totalAmount}</td>
                                </tr>
                                ${billData.toll > 0 ? `<tr><td colspan="2" class="border border-slate-400 p-2">Toll Tax</td><td class="border border-slate-400 p-2 text-right">₹${billData.toll}</td></tr>` : ''}
                                ${billData.parking > 0 ? `<tr><td colspan="2" class="border border-slate-400 p-2">Parking Charges</td><td class="border border-slate-400 p-2 text-right">₹${billData.parking}</td></tr>` : ''}
                                ${billData.border > 0 ? `<tr><td colspan="2" class="border border-slate-400 p-2">Border Tax</td><td class="border border-slate-400 p-2 text-right">₹${billData.border}</td></tr>` : ''}
                            </tbody>
                        </table>
                    </div>

                    <div class="flex justify-end mb-4">
                        <div class="w-64 space-y-1 text-xs border-t-2 border-slate-900 pt-2">
                            <div class="flex justify-between font-semibold"><span class="text-slate-600">Grand Total:</span><span class="font-bold text-slate-900">₹${billData.grandTotal}</span></div>
                            <div class="flex justify-between font-semibold"><span class="text-slate-600">Advance Paid:</span><span class="font-bold text-emerald-700">- ₹${billData.advance}</span></div>
                            <div class="flex justify-between font-bold text-sm pt-1 border-t border-slate-300"><span class="text-red-700">Balance Due:</span><span class="${billData.balanceDue > 0 ? 'text-red-600' : 'text-emerald-600'}">₹${billData.balanceDue}</span></div>
                        </div>
                    </div>

                    <div class="bg-slate-50 p-3 rounded-lg border border-slate-300 text-[11px] text-slate-800 mb-4">
                        <h4 class="font-bold text-red-700 mb-1 uppercase">Bank Details for UPI / Online Payment:</h4>
                        <div class="grid grid-cols-2 gap-1">
                            <p><strong>Holder:</strong> ${accountHolder}</p>
                            <p><strong>Bank:</strong> ${bankName}</p>
                            <p><strong>A/C No:</strong> <span class="font-mono font-bold">${accountNumber}</span></p>
                            <p><strong>IFSC:</strong> <span class="font-mono font-bold">${ifscCode}</span></p>
                        </div>
                    </div>

                    <div class="flex justify-between items-end pt-3 border-t border-slate-300 text-[11px] text-slate-700">
                        <div><p class="font-semibold">Thank you for traveling with ${companyName}!</p></div>
                        <div class="text-center"><div class="h-8 border-b border-slate-400 w-28 mb-1"></div><span class="font-bold">Authorised Signatory</span></div>
                    </div>
                </div>
            </div>
        `;
    },

    shareWhatsApp: function(slipNo, party, grandTotal, balanceDue) {
        const text = `*AADESH TOURS UDAIPUR - TAX INVOICE*%0A*Bill No:* ${slipNo}%0A*Party:* ${party}%0A*Grand Total:* ₹${grandTotal}%0A*Balance Due:* ₹${balanceDue}%0A*Bank:* SBI A/C 44936542535 (Chetan Nath)%0A*IFSC:* SBIN0016178`;
        window.open(`https://wa.me/?text=${text}`, '_blank');
    }
};
