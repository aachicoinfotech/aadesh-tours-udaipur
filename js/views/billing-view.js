// js/views/billing-view.js
// Aadesh Tours Udaipur - Red Billbook Invoice & PDF Generator

window.BillingView = {
    render: function(containerId, billData = null) {
        const container = document.getElementById(containerId);
        if (!container) return;

        // Settings / Profile se exact data uthana (Never undefined)
        const settings = JSON.parse(localStorage.getItem('aadesh_settings') || '{}');
        const companyName = settings.companyName || "AADESH TOURS UDAIPUR";
        const phones = settings.phones || "9602842390 / 7043195007";
        const bankName = "State Bank of India (SBI)";
        const accountHolder = "Chetan Nath";
        const accountNumber = "44936542535";
        const ifscCode = "SBIN0016178";

        // Agar billData nahi hai, toh localstorage se aakhri bill uthao ya blank rakho
        if (!billData) {
            const trips = JSON.parse(localStorage.getItem('aadesh_trips') || '[]');
            billData = trips.length > 0 ? trips[0] : {
                slipNo: 'ATU-' + Math.floor(1000 + Math.random() * 9000),
                date: new Date().toISOString().split('T')[0],
                party: 'Keval Party',
                vehicle: 'RJ-27-PA-0000',
                mode: 'outstation',
                kmRun: 0,
                totalAmount: 0,
                toll: 0,
                parking: 0,
                border: 0,
                grandTotal: 0,
                advance: 0,
                balanceDue: 0,
                isTax: false
            };
        }

        container.innerHTML = `
            <div class="max-w-4xl mx-auto p-4 sm:p-6 text-slate-100">
                <!-- Top Action Bar -->
                <div class="flex flex-wrap items-center justify-between gap-4 mb-6 bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-lg print:hidden">
                    <div>
                        <h2 class="text-xl font-bold text-amber-400 flex items-center gap-2">
                            <span>🧾</span> Red Billbook Invoice / Tax Bill
                        </h2>
                        <p class="text-xs text-slate-400 mt-0.5">Professional Invoice ready for download or WhatsApp share</p>
                    </div>
                    <div class="flex items-center gap-2">
                        <button onclick="window.print()" class="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-4 py-2 rounded-xl text-sm flex items-center gap-1.5 transition">
                            <span>📥</span> PDF Download
                        </button>
                        <button onclick="BillingView.shareWhatsApp('${billData.slipNo}', '${billData.party}', '${billData.grandTotal}', '${billData.balanceDue}')" class="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-sm flex items-center gap-1.5 transition">
                            <span>📲</span> WhatsApp Share
                        </button>
                    </div>
                </div>

                <!-- Printable Red Border Billbook Box -->
                <div id="invoice-print-area" class="bg-white text-slate-900 p-6 sm:p-8 rounded-2xl shadow-2xl border-4 border-red-700 font-sans">
                    <!-- Header -->
                    <div class="text-center border-b-2 border-red-700 pb-4 mb-4">
                        <h1 class="text-3xl font-extrabold tracking-wider text-red-700 uppercase">${companyName}</h1>
                        <p class="text-xs font-bold text-slate-700 mt-1">Taxi Service, Outstation Tour & Corporate Cab Provider</p>
                        <p class="text-sm font-bold text-slate-900 mt-1">Contact: ${phones}</p>
                    </div>

                    <!-- Bill Meta Details -->
                    <div class="grid grid-cols-2 gap-4 text-sm mb-4 border-b border-slate-300 pb-4">
                        <div>
                            <p class="font-semibold text-slate-600">Bill No: <span class="font-bold text-slate-900">${billData.slipNo}</span> ${billData.isTax ? '<span class="bg-red-700 text-white text-[10px] px-1.5 py-0.5 rounded ml-1">GST TAX INVOICE</span>' : ''}</p>
                            <p class="font-semibold text-slate-600 mt-1">Party Name: <span class="font-bold text-slate-900">${billData.party}</span></p>
                        </div>
                        <div class="text-right">
                            <p class="font-semibold text-slate-600">Date: <span class="font-bold text-slate-900">${billData.date}</span></p>
                            <p class="font-semibold text-slate-600 mt-1">Vehicle No: <span class="font-bold text-slate-900">${billData.vehicle}</span></p>
                        </div>
                    </div>

                    <!-- Particulars Table -->
                    <div class="overflow-x-auto mb-6">
                        <table class="w-full border-collapse border border-slate-400 text-sm">
                            <thead>
                                <tr class="bg-red-700 text-white">
                                    <th class="border border-slate-400 p-2 text-left">Particulars / Description</th>
                                    <th class="border border-slate-400 p-2 text-center">Billing Mode</th>
                                    <th class="border border-slate-400 p-2 text-right">Amount (₹)</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td class="border border-slate-400 p-2.5 font-medium">
                                        Taxi Rental Charges (${billData.mode.toUpperCase()})
                                        ${billData.kmRun > 0 ? '<br><span class="text-xs text-slate-500">Total KM Run: ' + billData.kmRun + ' KM</span>' : ''}
                                    </td>
                                    <td class="border border-slate-400 p-2.5 text-center uppercase text-xs font-bold text-slate-700">${billData.mode}</td>
                                    <td class="border border-slate-400 p-2.5 text-right font-bold">₹${billData.totalAmount}</td>
                                </tr>
                                ${billData.toll > 0 ? `<tr><td colspan="2" class="border border-slate-400 p-2">Toll Tax</td><td class="border border-slate-400 p-2 text-right">₹${billData.toll}</td></tr>` : ''}
                                ${billData.parking > 0 ? `<tr><td colspan="2" class="border border-slate-400 p-2">Parking Charges</td><td class="border border-slate-400 p-2 text-right">₹${billData.parking}</td></tr>` : ''}
                                ${billData.border > 0 ? `<tr><td colspan="2" class="border border-slate-400 p-2">Border Tax</td><td class="border border-slate-400 p-2 text-right">₹${billData.border}</td></tr>` : ''}
                            </tbody>
                        </table>
                    </div>

                    <!-- Totals & Balance Summary -->
                    <div class="flex justify-end mb-6">
                        <div class="w-full sm:w-72 space-y-2 text-sm border-t-2 border-slate-900 pt-3">
                            <div class="flex justify-between font-semibold">
                                <span class="text-slate-600">Grand Total:</span>
                                <span class="text-slate-900 font-bold text-base">₹${billData.grandTotal}</span>
                            </div>
                            <div class="flex justify-between font-semibold">
                                <span class="text-slate-600">Advance Paid:</span>
                                <span class="text-emerald-700 font-bold">- ₹${billData.advance}</span>
                            </div>
                            <div class="flex justify-between font-bold text-base pt-2 border-t border-slate-300">
                                <span class="text-red-700">Balance Due (Baki):</span>
                                <span class="${billData.balanceDue > 0 ? 'text-red-600' : 'text-emerald-600'}">₹${billData.balanceDue}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Bank Details Box (Chetan Nath & SBI - No Undefined) -->
                    <div class="bg-slate-50 p-4 rounded-xl border border-slate-300 text-xs text-slate-800 mb-6">
                        <h4 class="font-bold text-red-700 mb-1 uppercase tracking-wide">Bank Details for Online Payment / UPI:</h4>
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                            <p><strong>Account Holder:</strong> ${accountHolder}</p>
                            <p><strong>Bank Name:</strong> ${bankName}</p>
                            <p><strong>Account Number:</strong> <span class="font-mono font-bold">${accountNumber}</span></p>
                            <p><strong>IFSC Code:</strong> <span class="font-mono font-bold">${ifscCode}</span></p>
                        </div>
                    </div>

                    <!-- Footer Signature -->
                    <div class="flex justify-between items-end pt-4 border-t border-slate-300 text-xs text-slate-700">
                        <div>
                            <p class="font-semibold">Thank you for traveling with ${companyName}!</p>
                            <p class="mt-0.5 text-slate-500">Subject to Udaipur Jurisdiction.</p>
                        </div>
                        <div class="text-center">
                            <div class="h-10 border-b border-slate-400 w-36 mb-1"></div>
                            <span class="font-bold">Authorised Signatory</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    shareWhatsApp: function(slipNo, party, grandTotal, balanceDue) {
        const text = `*AADESH TOURS UDAIPUR - TAX INVOICE*%0A*Bill No:* ${slipNo}%0A*Party:* ${party}%0A*Grand Total:* ₹${grandTotal}%0A*Balance Due:* ₹${balanceDue}%0A*Bank:* SBI A/C 44936542535 (Chetan Nath)%0A*IFSC:* SBIN0016178%0A%0AThank you for your business!`;
        window.open(`https://wa.me/?text=${text}`, '_blank');
    }
};
