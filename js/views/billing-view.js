// js/views/billing-view.js - Professional Billing & Invoice Manager with Full CRUD
window.BillingView = {
    render: function(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = `
            <div class="space-y-4 max-w-6xl mx-auto pb-12">
                <div class="vault-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                        <h2 class="text-base font-bold text-amber-400">💰 Billing & Invoice Management</h2>
                        <p class="text-xs text-slate-400">Aadesh Tours Udaipur - Generate Tax Invoices from Trips with Full CRUD</p>
                    </div>
                    <button type="button" onclick="BillingView.openInvoiceModal()" class="btn btn-primary px-3 py-2 text-xs">
                        ➕ Naya Bill / Invoice Banayein
                    </button>
                </div>

                <div class="vault-card space-y-3">
                    <h3 class="text-xs font-bold text-slate-200 uppercase tracking-wider">All Generated Invoices & Bills</h3>
                    <div class="overflow-x-auto">
                        <table class="tally-table">
                            <thead>
                                <tr>
                                    <th>Invoice No / Date</th>
                                    <th>Client / Guest Name</th>
                                    <th>Vehicle Details</th>
                                    <th>Subtotal</th>
                                    <th>Grand Total</th>
                                    <th class="text-right">Actions (View / Print / Edit / Delete)</th>
                                </tr>
                            </thead>
                            <tbody id="invoices-table-body"></tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
        this.loadInvoicesData();
    },

    loadInvoicesData: function() {
        const tbody = document.getElementById('invoices-table-body');
        if (!tbody) return;
        const invoices = JSON.parse(localStorage.getItem('aadesh_invoices') || '[]');

        tbody.innerHTML = invoices.map(inv => `
            <tr>
                <td>
                    <div class="font-bold text-amber-400 font-mono">${inv.id}</div>
                    <div class="text-[10px] text-slate-400">${inv.date}</div>
                </td>
                <td>
                    <div class="font-bold">${inv.clientName}</div>
                    <div class="text-[10px] text-slate-400 font-mono">${inv.clientMob || ''}</div>
                </td>
                <td class="font-mono text-xs">${inv.vehicle || 'N/A'}</td>
                <td class="font-mono text-xs">₹${inv.subtotal || 0}</td>
                <td class="font-mono font-bold text-emerald-400 text-sm">₹${inv.grandTotal || 0}</td>
                <td class="text-right space-x-1">
                    <button type="button" onclick="BillingView.viewInvoice('${inv.id}')" class="btn btn-secondary px-2 py-1 text-[10px] text-amber-400">Print</button>
                    <button type="button" onclick="BillingView.openInvoiceModal('${inv.id}')" class="btn btn-secondary px-2 py-1 text-[10px] text-sky-400">Edit</button>
                    <button type="button" onclick="BillingView.deleteInvoice('${inv.id}')" class="btn btn-secondary px-2 py-1 text-[10px] text-rose-400">Delete</button>
                </td>
            </tr>
        `).join('') || '<tr><td colspan="6" class="text-center text-slate-500 py-4">Koi invoice darj nahi hai. Naya bill banayein.</td></tr>';
    },

    openInvoiceModal: function(id = null) {
        const modal = document.getElementById('modal-container');
        const content = document.getElementById('modal-content');
        if (!modal || !content) return;

        const trips = JSON.parse(localStorage.getItem('aadesh_trips') || '[]');
        let inv = { clientName: '', clientMob: '', vehicle: '', subtotal: 0, tax: 0, grandTotal: 0 };
        if (id) {
            const invoices = JSON.parse(localStorage.getItem('aadesh_invoices') || '[]');
            const found = invoices.find(i => i.id === id);
            if (found) inv = found;
        }

        content.innerHTML = `
            <div class="p-5 space-y-4 bg-slate-900 text-slate-100 rounded-xl max-h-[90vh] overflow-y-auto">
                <div class="flex justify-between items-center border-b border-slate-800 pb-2">
                    <h3 class="text-sm font-bold text-amber-400">${id ? '✏️ Invoice Update Karein' : '💰 Naya Bill / Invoice Banayein'}</h3>
                    <button type="button" onclick="document.getElementById('modal-container').classList.add('hidden')" class="text-slate-400">&times;</button>
                </div>
                <form onsubmit="BillingView.saveInvoice(event, '${id || ''}')" class="space-y-3 text-xs">
                    <div>
                        <label class="form-label text-slate-300">Select From Trip (Optional)</label>
                        <select id="inv-trip-select" onchange="BillingView.fillFromTrip(this.value)" class="form-input bg-slate-950 text-white border-slate-700">
                            <option value="">-- Trip Chunein ya Manual Bharein --</option>
                            ${trips.map(t => `<option value="${t.id}">${t.id} -${t.guestName} (${t.vehicle}) [₹${t.grandTotal}]</option>`).join('')}
                        </select>
                    </div>
                    <div class="grid grid-cols-2 gap-2">
                        <div>
                            <label class="form-label text-slate-300">Client / Guest Name *</label>
                            <input type="text" id="inv-client" required value="${inv.clientName}" class="form-input bg-slate-950 text-white border-slate-700" placeholder="Client Name">
                        </div>
                        <div>
                            <label class="form-label text-slate-300">Client Mobile</label>
                            <input type="text" id="inv-mob" value="${inv.clientMob}" class="form-input bg-slate-950 text-white border-slate-700 font-mono" placeholder="Mobile">
                        </div>
                    </div>
                    <div>
                        <label class="form-label text-slate-300">Vehicle Number & Type</label>
                        <input type="text" id="inv-vehicle" value="${inv.vehicle}" class="form-input bg-slate-950 text-white border-slate-700 font-mono" placeholder="RJ-27-PA-0000">
                    </div>
                    <div class="grid grid-cols-3 gap-2">
                        <div>
                            <label class="form-label text-slate-300">Subtotal Fare (₹)</label>
                            <input type="number" id="inv-sub" value="${inv.subtotal}" oninput="BillingView.calcInvTotal()" class="form-input bg-slate-950 text-white border-slate-700 font-mono" placeholder="0">
                        </div>
                        <div>
                            <label class="form-label text-slate-300">Extra / Tax (₹)</label>
                            <input type="number" id="inv-tax" value="${inv.tax}" oninput="BillingView.calcInvTotal()" class="form-input bg-slate-950 text-white border-slate-700 font-mono" placeholder="0">
                        </div>
                        <div>
                            <label class="form-label text-slate-300">Grand Total (₹)</label>
                            <input type="number" id="inv-total" value="${inv.grandTotal}" class="form-input bg-slate-950 text-amber-400 border-slate-700 font-mono font-bold" placeholder="0">
                        </div>
                    </div>
                    <div class="flex justify-end gap-2 pt-3 border-t border-slate-800">
                        <button type="button" onclick="document.getElementById('modal-container').classList.add('hidden')" class="btn btn-secondary px-3 py-1.5">Radd</button>
                        <button type="submit" class="btn btn-primary px-4 py-1.5 font-bold">${id ? 'Update Invoice' : 'Save & Print Invoice'}</button>
                    </div>
                </form>
            </div>
        `;
        modal.classList.remove('hidden');
    },

    fillFromTrip: function(tripId) {
        if (!tripId) return;
        const trips = JSON.parse(localStorage.getItem('aadesh_trips') || '[]');
        const t = trips.find(tr => tr.id === tripId);
        if (!t) return;

        document.getElementById('inv-client').value = t.guestName || '';
        document.getElementById('inv-mob').value = t.guestMob || '';
        document.getElementById('inv-vehicle').value = t.vehicle || '';
        document.getElementById('inv-sub').value = t.grandTotal || 0;
        document.getElementById('inv-tax').value = 0;
        document.getElementById('inv-total').value = t.grandTotal || 0;
    },

    calcInvTotal: function() {
        const sub = parseFloat(document.getElementById('inv-sub')?.value) || 0;
        const tax = parseFloat(document.getElementById('inv-tax')?.value) || 0;
        const total = sub + tax;
        const totalInput = document.getElementById('inv-total');
        if (totalInput) totalInput.value = total;
    },

    saveInvoice: function(event, id) {
        event.preventDefault();
        const clientName = document.getElementById('inv-client').value.trim();
        const clientMob = document.getElementById('inv-mob').value.trim();
        const vehicle = document.getElementById('inv-vehicle').value.trim();
        const subtotal = parseFloat(document.getElementById('inv-sub').value) || 0;
        const tax = parseFloat(document.getElementById('inv-tax').value) || 0;
        const grandTotal = parseFloat(document.getElementById('inv-total').value) || 0;
        const date = new Date().toISOString().split('T')[0];

        let invoices = JSON.parse(localStorage.getItem('aadesh_invoices') || '[]');
        let invId = id;
        if (id) {
            invoices = invoices.map(i => i.id === id ? { ...i, clientName, clientMob, vehicle, subtotal, tax, grandTotal } : i);
        } else {
            invId = 'INV-' + Math.floor(1000 + Math.random() * 9000);
            invoices.unshift({ id: invId, date, clientName, clientMob, vehicle, subtotal, tax, grandTotal });
        }
        localStorage.setItem('aadesh_invoices', JSON.stringify(invoices));

        document.getElementById('modal-container').classList.add('hidden');
        this.loadInvoicesData();
        this.viewInvoice(invId);
    },

    viewInvoice: function(invId) {
        const modal = document.getElementById('modal-container');
        const content = document.getElementById('modal-content');
        if (!modal || !content) return;

        const invoices = JSON.parse(localStorage.getItem('aadesh_invoices') || '[]');
        const inv = invoices.find(i => i.id === invId);
        if (!inv) return;

        const comp = JSON.parse(localStorage.getItem('aadesh_company_profile') || '{}');

        content.innerHTML = `
            <div class="p-6 space-y-4 bg-white text-slate-900 rounded-xl max-h-[90vh] overflow-y-auto font-sans">
                <div class="flex justify-between items-center border-b-2 border-slate-900 pb-3 print:hidden">
                    <h3 class="text-sm font-bold text-orange-600">💰 Tax Invoice Preview</h3>
                    <div class="flex gap-2">
                        <button type="button" onclick="window.print()" class="btn btn-primary px-3 py-1 text-xs">🖨️ Print Invoice</button>
                        <button type="button" onclick="document.getElementById('modal-container').classList.add('hidden')" class="text-slate-900 font-bold text-lg">&times;</button>
                    </div>
                </div>

                <div class="text-center border-b-2 border-slate-900 pb-3 space-y-1">
                    <h1 class="text-2xl font-black tracking-wider text-orange-600">${comp.name || 'AADESH TOURS UDAIPUR'}</h1>
                    <p class="text-xs font-bold text-slate-700">${comp.address || 'Udaipur, Rajasthan'} | Mob: ${comp.phones || '9602842390'}</p>
                </div>

                <div class="flex justify-between items-center text-xs border-b border-slate-400 pb-2 font-bold">
                    <div>Invoice No: <span class="font-mono">${inv.id}</span></div>
                    <div>Date: <span class="font-mono">${inv.date}</span></div>
                </div>

                <div class="border border-slate-900 text-xs p-3 space-y-1">
                    <div><strong>Bill To Client:</strong> ${inv.clientName} (${inv.clientMob || 'N/A'})</div>
                    <div><strong>Vehicle Number:</strong> ${inv.vehicle || 'N/A'}</div>
                </div>

                <div class="border border-slate-900 text-xs">
                    <table class="w-full text-left border-collapse">
                        <thead>
                            <tr class="bg-slate-200 border-b border-slate-900 font-bold">
                                <th class="p-2 border-r border-slate-900">Description</th>
                                <th class="p-2 text-right">Amount (₹)</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr class="border-b border-slate-400">
                                <td class="p-2 border-r border-slate-400">Cab Rental & Trip Charges</td>
                                <td class="p-2 text-right font-mono">₹${inv.subtotal}</td>
                            </tr>
                            <tr class="border-b border-slate-400">
                                <td class="p-2 border-r border-slate-400">Toll, Parking & Taxes / Extra</td>
                                <td class="p-2 text-right font-mono">₹${inv.tax}</td>
                            </tr>
                            <tr class="bg-slate-100 font-bold">
                                <td class="p-2 border-r border-slate-900 text-right">Grand Total:</td>
                                <td class="p-2 text-right font-mono text-emerald-600">₹${inv.grandTotal}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div class="border border-slate-300 p-3 text-[11px] bg-slate-50 space-y-1">
                    <div class="font-bold text-slate-800">Bank Details for Payment:</div>
                    <div>Account Name: ${comp.holder || 'N/A'} | A/C No: ${comp.acc || 'N/A'}</div>
                    <div>IFSC Code: ${comp.ifsc || 'N/A'} | Bank: ${comp.bankName || 'N/A'}</div>
                </div>

                <div class="flex justify-between items-end pt-6 text-xs font-bold">
                    <div>Thank You For Your Business!</div>
                    <div class="border-t border-slate-900 pt-1 px-6 text-center">Authorized Signatory</div>
                </div>
            </div>
        `;
        modal.classList.remove('hidden');
    },

    deleteInvoice: function(id) {
        if (!confirm('Kya aap is invoice ko delete karna chahte hain?')) return;
        let invoices = JSON.parse(localStorage.getItem('aadesh_invoices') || '[]');
        invoices = invoices.filter(i => i.id !== id);
        localStorage.setItem('aadesh_invoices', JSON.stringify(invoices));
        this.loadInvoicesData();
    }
};
