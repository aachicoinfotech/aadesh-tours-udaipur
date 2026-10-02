// js/views/daybook-view.js - Tally Daybook & Ledger
window.DaybookView = {
    render: function(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const daybookEntries = JSON.parse(localStorage.getItem('aadesh_daybook') || '[]');

        container.innerHTML = `
            <div class="space-y-4">
                <div class="vault-card flex items-center justify-between">
                    <div>
                        <h2 class="text-base font-bold text-amber-400">📖 Tally-Style Daybook & Cash Ledger</h2>
                        <p class="text-xs text-slate-400">Daily office cash transactions & ledger book</p>
                    </div>
                    <button onclick="DaybookView.openAddEntryModal()" class="btn btn-primary px-3 py-2 text-xs">➕ Nayi Entry</button>
                </div>

                <div class="vault-card overflow-hidden">
                    <table class="tally-table">
                        <thead>
                            <tr>
                                <th>Date & Particulars</th>
                                <th>Type</th>
                                <th class="text-right">Debit / Out (₹)</th>
                                <th class="text-right">Credit / In (₹)</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${daybookEntries.map(e => `
                                <tr>
                                    <td>
                                        <div class="font-bold text-slate-200">${e.narration}</div>
                                        <div class="text-[10px] text-slate-400">${e.date}</div>
                                    </td>
                                    <td><span class="badge-status ${e.type === 'IN' ? 'badge-active' : 'bg-rose-500/20 text-rose-400'}">${e.type}</span></td>
                                    <td class="text-right text-rose-400 font-mono">${e.type === 'OUT' ? '₹' + e.amount : '-'}</td>
                                    <td class="text-right text-emerald-400 font-mono">${e.type === 'IN' ? '₹' + e.amount : '-'}</td>
                                </tr>
                            `).join('') || '<tr><td colspan="4" class="text-center text-slate-500 py-4">Koi daybook entry nahi hai.</td></tr>'}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    },

    openAddEntryModal: function() {
        const modal = document.getElementById('modal-container');
        const content = document.getElementById('modal-content');
        if (!modal || !content) return;

        content.innerHTML = `
            <div class="p-4 space-y-3">
                <div class="flex justify-between items-center border-b border-slate-800 pb-2">
                    <h3 class="text-sm font-bold text-amber-400">📖 Daybook Cash Entry</h3>
                    <button onclick="document.getElementById('modal-container').classList.add('hidden')" class="text-slate-400">&times;</button>
                </div>
                <form onsubmit="DaybookView.saveEntry(event)" class="space-y-3 text-xs">
                    <div>
                        <label class="form-label">Transaction Type</label>
                        <select id="db-type" class="form-select">
                            <option value="IN">Cash In (Galla Jama)</option>
                            <option value="OUT">Cash Out (Kharcha / Nikaasi)</option>
                        </select>
                    </div>
                    <div>
                        <label class="form-label">Amount (₹) *</label>
                        <input type="number" id="db-amount" required class="form-input font-bold text-amber-400" placeholder="0">
                    </div>
                    <div>
                        <label class="form-label">Narration / Description *</label>
                        <input type="text" id="db-narration" required class="form-input" placeholder="e.g. Office tea expense / Advance received">
                    </div>
                    <div class="flex justify-end gap-2 pt-2 border-t border-slate-800">
                        <button type="button" onclick="document.getElementById('modal-container').classList.add('hidden')" class="btn btn-secondary px-3 py-1.5">Radd</button>
                        <button type="submit" class="btn btn-primary px-4 py-1.5">Save Entry</button>
                    </div>
                </form>
            </div>
        `;
        modal.classList.remove('hidden');
    },

    saveEntry: function(event) {
        event.preventDefault();
        const type = document.getElementById('db-type').value;
        const amount = parseFloat(document.getElementById('db-amount').value) || 0;
        const narration = document.getElementById('db-narration').value.trim();
        const date = new Date().toISOString().split('T')[0];

        let daybook = JSON.parse(localStorage.getItem('aadesh_daybook') || '[]');
        daybook.unshift({ id: 'DB-' + Date.now(), date, type, amount, narration });
        localStorage.setItem('aadesh_daybook', JSON.stringify(daybook));

        let galla = JSON.parse(localStorage.getItem('aadesh_galla') || '{"cashIn": 0, "cashOut": 0}');
        if (type === 'IN') galla.cashIn += amount;
        else galla.cashOut += amount;
        localStorage.setItem('aadesh_galla', JSON.stringify(galla));

        document.getElementById('modal-container').classList.add('hidden');
        this.render('tab-daybook');
        updateLiveGalla?.();
    }
};
