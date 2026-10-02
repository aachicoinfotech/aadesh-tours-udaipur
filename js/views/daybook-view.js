// js/views/daybook-view.js - Cash, Bank & Daybook Management with Full CRUD
window.DaybookView = {
    render: function(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = `
            <div class="space-y-4 max-w-6xl mx-auto pb-12">
                <div class="vault-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                        <h2 class="text-base font-bold text-amber-400">📖 Daybook, Cash & Bank Ledger</h2>
                        <p class="text-xs text-slate-400">Aadesh Tours Udaipur - Daily Cash Book, Bank Entries & Party Dues</p>
                    </div>
                    <div class="flex gap-2">
                        <button type="button" onclick="DaybookView.openTransactionModal('Cash In')" class="btn btn-primary px-3 py-2 text-xs">
                            ➕ Cash In (Jama)
                        </button>
                        <button type="button" onclick="DaybookView.openTransactionModal('Cash Out')" class="btn btn-secondary px-3 py-2 text-xs">
                            ➖ Cash Out (Kharch)
                        </button>
                    </div>
                </div>

                <!-- Tabs -->
                <div class="flex gap-2 border-b border-slate-800 pb-2">
                    <button type="button" id="db-tab-txn" onclick="DaybookView.switchTab('txn')" class="btn btn-primary px-3 py-1.5 text-xs">💵 Cash / Bank Entries</button>
                    <button type="button" id="db-tab-dues" onclick="DaybookView.switchTab('dues')" class="btn btn-secondary px-3 py-1.5 text-xs">👥 Party Outstanding Dues</button>
                </div>

                <!-- Transactions Section -->
                <div id="db-sec-txn" class="vault-card space-y-3">
                    <h3 class="text-xs font-bold text-slate-200 uppercase tracking-wider">All Daybook Transactions</h3>
                    <div class="overflow-x-auto">
                        <table class="tally-table">
                            <thead>
                                <tr>
                                    <th>Date / ID</th>
                                    <th>Type</th>
                                    <th>Particulars / Party</th>
                                    <th>Mode</th>
                                    <th>Amount (₹)</th>
                                    <th class="text-right">Actions (Edit / Delete)</th>
                                </tr>
                            </thead>
                            <tbody id="daybook-table-body"></tbody>
                        </table>
                    </div>
                </div>

                <!-- Dues Section -->
                <div id="db-sec-dues" class="vault-card space-y-3 hidden">
                    <h3 class="text-xs font-bold text-slate-200 uppercase tracking-wider">Customer, Vendor & Driver Balances</h3>
                    <div class="overflow-x-auto">
                        <table class="tally-table">
                            <thead>
                                <tr>
                                    <th>Party Name</th>
                                    <th>Category</th>
                                    <th>Mobile Number</th>
                                    <th>Pending Balance (₹)</th>
                                </tr>
                            </thead>
                            <tbody id="daybook-dues-body"></tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
        this.loadTransactions();
        this.loadDues();
    },

    switchTab: function(tab) {
        const txnSec = document.getElementById('db-sec-txn');
        const duesSec = document.getElementById('db-sec-dues');
        const txnBtn = document.getElementById('db-tab-txn');
        const duesBtn = document.getElementById('db-tab-dues');

        if (tab === 'txn') {
            txnSec?.classList.remove('hidden');
            duesSec?.classList.add('hidden');
            txnBtn?.classList.replace('btn-secondary', 'btn-primary');
            duesBtn?.classList.replace('btn-primary', 'btn-secondary');
        } else {
            txnSec?.classList.add('hidden');
            duesSec?.classList.remove('hidden');
            duesBtn?.classList.replace('btn-secondary', 'btn-primary');
            txnBtn?.classList.replace('btn-primary', 'btn-secondary');
        }
    },

    loadTransactions: function() {
        const tbody = document.getElementById('daybook-table-body');
        if (!tbody) return;
        const txns = JSON.parse(localStorage.getItem('aadesh_transactions') || '[]');

        tbody.innerHTML = txns.map(t => `
            <tr>
                <td>
                    <div class="font-bold text-amber-400 font-mono">${t.id}</div>
                    <div class="text-[10px] text-slate-400">${t.date}</div>
                </td>
                <td><span class="badge-status ${t.type === 'Cash In' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}">${t.type}</span></td>
                <td class="font-bold">${t.party}</td>
                <td class="font-mono text-xs">${t.mode}</td>
                <td class="font-mono font-bold text-sm ${t.type === 'Cash In' ? 'text-emerald-400' : 'text-rose-400'}">₹${t.amount}</td>
                <td class="text-right space-x-1">
                    <button type="button" onclick="DaybookView.openTransactionModal('${t.type}', '${t.id}')" class="btn btn-secondary px-2 py-1 text-[10px] text-sky-400">Edit</button>
                    <button type="button" onclick="DaybookView.deleteTransaction('${t.id}')" class="btn btn-secondary px-2 py-1 text-[10px] text-rose-400">Delete</button>
                </td>
            </tr>
        `).join('') || '<tr><td colspan="6" class="text-center text-slate-500 py-4">Koi transaction darj nahi hai.</td></tr>';
    },

    loadDues: function() {
        const tbody = document.getElementById('daybook-dues-body');
        if (!tbody) return;
        const vendors = JSON.parse(localStorage.getItem('aadesh_vendors') || '[]');
        const drivers = JSON.parse(localStorage.getItem('aadesh_drivers') || '[]');

        let combined = [
            ...vendors.map(v => ({ name: v.name, cat: 'Vendor', mob: v.mobile, bal: v.balance })),
            ...drivers.map(d => ({ name: d.name, cat: 'Driver (Advance)', mob: d.mobile, bal: d.advance }))
        ];

        tbody.innerHTML = combined.map(p => `
            <tr>
                <td class="font-bold text-slate-200">${p.name}</td>
                <td><span class="badge-status bg-sky-500/20 text-sky-400">${p.cat}</span></td>
                <td class="font-mono">${p.mob}</td>
                <td class="font-mono font-bold text-amber-400">₹${p.bal || 0}</td>
            </tr>
        `).join('') || '<tr><td colspan="4" class="text-center text-slate-500 py-4">Koi dues maujood nahi hain.</td></tr>';
    },

    openTransactionModal: function(defaultType = 'Cash In', id = null) {
        const modal = document.getElementById('modal-container');
        const content = document.getElementById('modal-content');
        if (!modal || !content) return;

        let txn = { type: defaultType, party: '', mode: 'Cash', amount: 0 };
        if (id) {
            const txns = JSON.parse(localStorage.getItem('aadesh_transactions') || '[]');
            const found = txns.find(t => t.id === id);
            if (found) txn = found;
        }

        content.innerHTML = `
            <div class="p-5 space-y-4 bg-slate-900 text-slate-100 rounded-xl">
                <div class="flex justify-between items-center border-b border-slate-800 pb-2">
                    <h3 class="text-sm font-bold text-amber-400">${id ? '✏️️ Transaction Update' : '💵 Nayi Daybook Entry'}</h3>
                    <button type="button" onclick="document.getElementById('modal-container').classList.add('hidden')" class="text-slate-400">&times;</button>
                </div>
                <form onsubmit="DaybookView.saveTransaction(event, '${id || ''}')" class="space-y-3 text-xs">
                    <div>
                        <label class="form-label text-slate-300">Transaction Type *</label>
                        <select id="db-type" class="form-input bg-slate-950 text-white border-slate-700 font-bold">
                            <option value="Cash In" ${txn.type === 'Cash In' ? 'selected' : ''}>Cash In (Jama / Income)</option>
                            <option value="Cash Out" ${txn.type === 'Cash Out' ? 'selected' : ''}>Cash Out (Kharch / Payment)</option>
                        </select>
                    </div>
                    <div>
                        <label class="form-label text-slate-300">Party / Particular Name *</label>
                        <input type="text" id="db-party" required value="${txn.party}" class="form-input bg-slate-950 text-white border-slate-700" placeholder="Client, Vendor or Expense Name">
                    </div>
                    <div>
                        <label class="form-label text-slate-300">Payment Mode</label>
                        <select id="db-mode" class="form-input bg-slate-950 text-white border-slate-700">
                            <option value="Cash" ${txn.mode === 'Cash' ? 'selected' : ''}>Cash</option>
                            <option value="Bank Transfer" ${txn.mode === 'Bank Transfer' ? 'selected' : ''}>Bank Transfer / UPI</option>
                        </select>
                    </div>
                    <div>
                        <label class="form-label text-slate-300">Amount (₹) *</label>
                        <input type="number" id="db-amount" required value="${txn.amount}" class="form-input bg-slate-950 text-amber-400 border-slate-700 font-mono font-bold" placeholder="0">
                    </div>
                    <div class="flex justify-end gap-2 pt-3 border-t border-slate-800">
                        <button type="button" onclick="document.getElementById('modal-container').classList.add('hidden')" class="btn btn-secondary px-3 py-1.5">Radd</button>
                        <button type="submit" class="btn btn-primary px-4 py-1.5 font-bold">${id ? 'Update' : 'Save'}</button>
                    </div>
                </form>
            </div>
        `;
        modal.classList.remove('hidden');
    },

    saveTransaction: function(event, id) {
        event.preventDefault();
        const type = document.getElementById('db-type').value;
        const party = document.getElementById('db-party').value.trim();
        const mode = document.getElementById('db-mode').value;
        const amount = parseFloat(document.getElementById('db-amount').value) || 0;
        const date = new Date().toISOString().split('T')[0];

        let txns = JSON.parse(localStorage.getItem('aadesh_transactions') || '[]');
        if (id) {
            txns = txns.map(t => t.id === id ? { ...t, type, party, mode, amount } : t);
        } else {
            txns.unshift({ id: 'TXN-' + Math.floor(1000 + Math.random() * 9000), date, type, party, mode, amount });
        }
        localStorage.setItem('aadesh_transactions', JSON.stringify(txns));

        document.getElementById('modal-container').classList.add('hidden');
        this.loadTransactions();
    },

    deleteTransaction: function(id) {
        if (!confirm('Kya aap is transaction ko delete karna chahte hain?')) return;
        let txns = JSON.parse(localStorage.getItem('aadesh_transactions') || '[]');
        txns = txns.filter(t => t.id !== id);
        localStorage.setItem('aadesh_transactions', JSON.stringify(txns));
        this.loadTransactions();
    }
};
