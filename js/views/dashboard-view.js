// js/views/dashboard-view.js - Dashboard Overview & Quick Operations
window.DashboardView = {
    render: function(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const trips = JSON.parse(localStorage.getItem('aadesh_trips') || '[]');
        const fleet = JSON.parse(localStorage.getItem('aadesh_fleet') || '[]');
        const drivers = JSON.parse(localStorage.getItem('aadesh_drivers') || '[]');
        const txns = JSON.parse(localStorage.getItem('aadesh_transactions') || '[]');

        const totalRevenue = trips.reduce((sum, t) => sum + (t.grandTotal || 0), 0);
        const cashIn = txns.filter(t => t.type === 'Cash In').reduce((sum, t) => sum + (t.amount || 0), 0);
        const cashOut = txns.filter(t => t.type === 'Cash Out').reduce((sum, t) => sum + (t.amount || 0), 0);
        const netGalla = cashIn - cashOut;

        container.innerHTML = `
            <div class="space-y-6 max-w-6xl mx-auto pb-12">
                <!-- Welcome Banner -->
                <div class="vault-card bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-l-4 border-amber-500 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h2 class="text-lg font-bold text-amber-400">👋 Welcome to Aadesh Tours Udaipur Fleet OS</h2>
                        <p class="text-xs text-slate-400">Professional Cab Management, Duty Slips, Billing & Accounting Vault</p>
                    </div>
                    <div class="flex gap-2">
                        <button type="button" onclick="App.navigateTo('trips')" class="btn btn-primary px-3 py-2 text-xs font-bold">
                            ➕ Nayi Trip Jodein
                        </button>
                        <button type="button" onclick="App.navigateTo('dutyslip')" class="btn btn-secondary px-3 py-2 text-xs font-bold">
                            📋 Duty Slip Banayein
                        </button>
                    </div>
                </div>

                <!-- Live Key Metrics Grid -->
                <div class="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div class="vault-card bg-slate-900 border-t-2 border-amber-500">
                        <div class="text-[11px] text-slate-400 uppercase font-bold">Total Fleet / Cars</div>
                        <div class="text-2xl font-mono font-bold text-white mt-1">${fleet.length}</div>
                        <div class="text-[10px] text-amber-400 mt-1">Active Registered Cabs</div>
                    </div>
                    <div class="vault-card bg-slate-900 border-t-2 border-sky-500">
                        <div class="text-[11px] text-slate-400 uppercase font-bold">Total Drivers</div>
                        <div class="text-2xl font-mono font-bold text-sky-400 mt-1">${drivers.length}</div>
                        <div class="text-[10px] text-sky-300 mt-1">On Duty / Available</div>
                    </div>
                    <div class="vault-card bg-slate-900 border-t-2 border-emerald-500">
                        <div class="text-[11px] text-slate-400 uppercase font-bold">Total Trip Revenue</div>
                        <div class="text-2xl font-mono font-bold text-emerald-400 mt-1">₹${totalRevenue}</div>
                        <div class="text-[10px] text-emerald-300 mt-1">${trips.length} Booked Trips</div>
                    </div>
                    <div class="vault-card bg-slate-900 border-t-2 border-indigo-500">
                        <div class="text-[11px] text-slate-400 uppercase font-bold">Net Galla / Cash Balance</div>
                        <div class="text-2xl font-mono font-bold text-amber-400 mt-1">₹${netGalla}</div>
                        <div class="text-[10px] text-slate-400 mt-1">Cash In - Cash Out</div>
                    </div>
                </div>

                <!-- Recent Activity Section -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <!-- Recent Trips -->
                    <div class="vault-card space-y-3">
                        <div class="flex justify-between items-center border-b border-slate-800 pb-2">
                            <h3 class="text-xs font-bold text-slate-200 uppercase tracking-wider">Recent Trips & Bookings</h3>
                            <button type="button" onclick="App.navigateTo('trips')" class="text-amber-400 text-[11px] hover:underline">Sabhi Dekhein &rarr;</button>
                        </div>
                        <div class="overflow-x-auto">
                            <table class="tally-table">
                                <thead>
                                    <tr>
                                        <th>Trip ID</th>
                                        <th>Guest Name</th>
                                        <th>Vehicle</th>
                                        <th class="text-right">Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${trips.slice(0, 5).map(t => `
                                        <tr>
                                            <td class="font-mono font-bold text-amber-400">${t.id}</td>
                                            <td>${t.guestName}</td>
                                            <td class="font-mono text-xs">${t.vehicle || 'N/A'}</td>
                                            <td class="text-right font-mono font-bold text-emerald-400">₹${t.grandTotal || 0}</td>
                                        </tr>
                                    `).join('') || '<tr><td colspan="4" class="text-center text-slate-500 py-3">Koi trip darj nahi hai.</td></tr>'}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <!-- Quick Links / Actions -->
                    <div class="vault-card space-y-3">
                        <h3 class="text-xs font-bold text-slate-200 uppercase tracking-wider border-b border-slate-800 pb-2">Quick Navigation Modules</h3>
                        <div class="grid grid-cols-2 gap-3 pt-1">
                            <button type="button" onclick="App.navigateTo('trips')" class="btn btn-secondary p-3 text-left space-y-1 hover:border-amber-500 transition-colors">
                                <div class="font-bold text-amber-400 text-xs">🚗 Trips & Bookings</div>
                                <div class="text-[10px] text-slate-400">Manage all cab bookings & fares</div>
                            </button>
                            <button type="button" onclick="App.navigateTo('dutyslip')" class="btn btn-secondary p-3 text-left space-y-1 hover:border-amber-500 transition-colors">
                                <div class="font-bold text-amber-400 text-xs">📋 Duty Slip Generator</div>
                                <div class="text-[10px] text-slate-400">Print multi-day log sheets</div>
                            </button>
                            <button type="button" onclick="App.navigateTo('billing')" class="btn btn-secondary p-3 text-left space-y-1 hover:border-amber-500 transition-colors">
                                <div class="font-bold text-amber-400 text-xs">💰 Billing & Invoices</div>
                                <div class="text-[10px] text-slate-400">Generate professional tax invoices</div>
                            </button>
                            <button type="button" onclick="App.navigateTo('daybook')" class="btn btn-secondary p-3 text-left space-y-1 hover:border-amber-500 transition-colors">
                                <div class="font-bold text-amber-400 text-xs">📖 Daybook & Accounts</div>
                                <div class="text-[10px] text-slate-400">Cash, bank & party dues ledger</div>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
};
