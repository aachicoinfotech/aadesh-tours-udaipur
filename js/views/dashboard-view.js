// js/views/dashboard-view.js - Aadesh Tours Udaipur Dashboard Module
window.DashboardView = {
    render: function(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const galla = JSON.parse(localStorage.getItem('aadesh_galla') || '{"cashIn": 0, "cashOut": 0}');
        const netGalla = (galla.cashIn || 0) - (galla.cashOut || 0);
        const trips = JSON.parse(localStorage.getItem('aadesh_trips') || '[]');
        const totalTrips = trips.length;
        const totalRevenue = trips.reduce((acc, t) => acc + (t.grandTotal || 0), 0);
        const totalDue = trips.reduce((acc, t) => acc + (t.balanceDue || 0), 0);

        container.innerHTML = `
            <div class="space-y-4">
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div class="stat-metric">
                        <div class="stat-label">Total Galla (Cash)</div>
                        <div class="stat-value text-amber-400">₹${netGalla}</div>
                    </div>
                    <div class="stat-metric">
                        <div class="stat-label">Total Revenue</div>
                        <div class="stat-value text-emerald-400">₹${totalRevenue}</div>
                    </div>
                    <div class="stat-metric">
                        <div class="stat-label">Pending Dues</div>
                        <div class="stat-value text-rose-400">₹${totalDue}</div>
                    </div>
                    <div class="stat-metric">
                        <div class="stat-label">Total Trips</div>
                        <div class="stat-value text-sky-400">${totalTrips}</div>
                    </div>
                </div>

                <div class="vault-card space-y-3">
                    <h3 class="text-sm font-bold text-amber-400 uppercase tracking-wider">Quick Actions</h3>
                    <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        <button onclick="window.switchTab('tab-trips'); TripsView.openChoiceModal();" class="btn btn-primary py-2.5 text-xs">
                            ➕ Nayi Entry / Bill
                        </button>
                        <button onclick="window.switchTab('tab-billing');" class="btn btn-secondary py-2.5 text-xs">
                            🧾 Billbook / Invoices
                        </button>
                        <button onclick="window.switchTab('tab-fleet');" class="btn btn-secondary py-2.5 text-xs">
                            🚘 Gaadiyaan Management
                        </button>
                    </div>
                </div>

                <div class="vault-card space-y-3">
                    <h3 class="text-sm font-bold text-slate-200 uppercase tracking-wider">Recent Trips & Entries</h3>
                    <div class="overflow-x-auto">
                        <table class="tally-table">
                            <thead>
                                <tr>
                                    <th>Bill No</th>
                                    <th>Party</th>
                                    <th>Vehicle</th>
                                    <th>Amount</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${trips.slice(0, 5).map(t => `
                                    <tr>
                                        <td class="font-mono font-bold text-amber-400">${t.slipNo}</td>
                                        <td>${t.party}</td>
                                        <td>${t.vehicle}</td>
                                        <td class="tally-credit">₹${t.grandTotal}</td>
                                        <td><span class="badge-status ${t.balanceDue > 0 ? 'badge-warning' : 'badge-active'}">${t.balanceDue > 0 ? 'Due' : 'Paid'}</span></td>
                                    </tr>
                                `).join('') || '<tr><td colspan="5" class="text-center text-slate-500 py-4">Koi entry darj nahi hai.</td></tr>'}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    }
};
