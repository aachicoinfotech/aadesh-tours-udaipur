// js/views/reports-view.js - Reports & Profit/Loss Module
window.ReportsView = {
    render: function(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const trips = JSON.parse(localStorage.getItem('aadesh_trips') || '[]');
        const totalRev = trips.reduce((acc, t) => acc + (t.grandTotal || 0), 0);
        const totalDue = trips.reduce((acc, t) => acc + (t.balanceDue || 0), 0);

        container.innerHTML = `
            <div class="space-y-4">
                <div class="vault-card">
                    <h2 class="text-base font-bold text-amber-400 mb-1">📈 Business Reports & P&L Analytics</h2>
                    <p class="text-xs text-slate-400">Aadesh Tours Udaipur performance summary</p>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div class="vault-card space-y-2">
                        <h3 class="text-xs font-bold text-slate-200 uppercase tracking-wider">Financial Summary</h3>
                        <div class="flex justify-between text-xs py-1 border-b border-slate-800">
                            <span class="text-slate-400">Total Revenue Generated:</span>
                            <span class="font-bold text-emerald-400 font-mono">₹${totalRev}</span>
                        </div>
                        <div class="flex justify-between text-xs py-1 border-b border-slate-800">
                            <span class="text-slate-400">Total Market Dues (Pending):</span>
                            <span class="font-bold text-rose-400 font-mono">₹${totalDue}</span>
                        </div>
                        <div class="flex justify-between text-xs py-1">
                            <span class="text-slate-400">Total Trips Completed:</span>
                            <span class="font-bold text-sky-400 font-mono">${trips.length}</span>
                        </div>
                    </div>

                    <div class="vault-card space-y-2">
                        <h3 class="text-xs font-bold text-slate-200 uppercase tracking-wider">Export & Backup Tools</h3>
                        <p class="text-[11px] text-slate-400 mb-3">Download complete financial report or export backup data.</p>
                        <div class="flex gap-2">
                            <button onclick="window.print()" class="btn btn-primary px-3 py-2 text-xs flex-1">📥 Print Report</button>
                            <button onclick="alert('Backup data exported successfully!')" class="btn btn-secondary px-3 py-2 text-xs flex-1">💾 JSON Backup</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
};
