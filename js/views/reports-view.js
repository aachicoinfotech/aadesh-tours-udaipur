// js/views/reports-view.js - Business Reports & Performance Analytics
window.ReportsView = {
    render: function(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const trips = JSON.parse(localStorage.getItem('aadesh_trips') || '[]');
        const invoices = JSON.parse(localStorage.getItem('aadesh_invoices') || '[]');
        const txns = JSON.parse(localStorage.getItem('aadesh_transactions') || '[]');

        const totalRevenue = trips.reduce((sum, t) => sum + (t.grandTotal || 0), 0);
        const totalInvoiced = invoices.reduce((sum, i) => sum + (i.grandTotal || 0), 0);
        const cashIn = txns.filter(t => t.type === 'Cash In').reduce((sum, t) => sum + (t.amount || 0), 0);
        const cashOut = txns.filter(t => t.type === 'Cash Out').reduce((sum, t) => sum + (t.amount || 0), 0);

        container.innerHTML = `
            <div class="space-y-4 max-w-6xl mx-auto pb-12">
                <div class="vault-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                        <h2 class="text-base font-bold text-amber-400">📈 Business Reports & P&L Analytics</h2>
                        <p class="text-xs text-slate-400">Aadesh Tours Udaipur - Fleet Performance & Financial Overview</p>
                    </div>
                    <button type="button" onclick="window.print()" class="btn btn-primary px-3 py-2 text-xs">
                        🖨️ Print Report
                    </button>
                </div>

                <!-- Summary Cards Grid -->
                <div class="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div class="vault-card bg-slate-900/90 border-l-4 border-amber-500">
                        <div class="text-[11px] text-slate-400 uppercase font-bold">Total Trips Booked</div>
                        <div class="text-xl font-mono font-bold text-white mt-1">${trips.length}</div>
                    </div>
                    <div class="vault-card bg-slate-900/90 border-l-4 border-emerald-500">
                        <div class="text-[11px] text-slate-400 uppercase font-bold">Total Trip Revenue</div>
                        <div class="text-xl font-mono font-bold text-emerald-400 mt-1">₹${totalRevenue}</div>
                    </div>
                    <div class="vault-card bg-slate-900/90 border-l-4 border-sky-500">
                        <div class="text-[11px] text-slate-400 uppercase font-bold">Total Invoiced Amount</div>
                        <div class="text-xl font-mono font-bold text-sky-400 mt-1">₹${totalInvoiced}</div>
                    </div>
                    <div class="vault-card bg-slate-900/90 border-l-4 border-indigo-500">
                        <div class="text-[11px] text-slate-400 uppercase font-bold">Net Cash Flow (In - Out)</div>
                        <div class="text-xl font-mono font-bold text-amber-400 mt-1">₹${cashIn - cashOut}</div>
                    </div>
                </div>

                <!-- Detailed Summary Table -->
                <div class="vault-card space-y-3">
                    <h3 class="text-xs font-bold text-slate-200 uppercase tracking-wider">Recent Trip Summary Log</h3>
                    <div class="overflow-x-auto">
                        <table class="tally-table">
                            <thead>
                                <tr>
                                    <th>Trip ID</th>
                                    <th>Date</th>
                                    <th>Category</th>
                                    <th>Guest & Vehicle</th>
                                    <th class="text-right">Amount (₹)</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${trips.map(t => `
                                    <tr>
                                        <td class="font-mono font-bold text-amber-400">${t.id}</td>
                                        <td class="font-mono text-xs">${t.date}</td>
                                        <td><span class="badge-status bg-amber-500/20 text-amber-400">${t.category}</span></td>
                                        <td>${t.guestName} (${t.vehicle || 'N/A'})</td>
                                        <td class="text-right font-mono font-bold text-emerald-400">₹${t.grandTotal || 0}</td>
                                    </tr>
                                `).join('') || '<tr><td colspan="5" class="text-center text-slate-500 py-4">Koi trip record uplabdh nahi hai.</td></tr>'}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    }
};
