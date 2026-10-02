// js/views/billing-view.js - Professional Tax Invoice with Auto-sync from Trips
window.BillingView = {
    render: function(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = `
            <div class="space-y-4 max-w-6xl mx-auto pb-12">
                <div class="vault-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                        <h2 class="text-base font-bold text-amber-400">💰 Billing & Tax Invoice Management</h2>
                        <p class="text-xs text-slate-400">Aadesh Tours Udaipur - Professional Bill Generator matching Physical Format</p>
                    </div>
                    <button type="button" onclick="BillingView.openInvoiceModal()" class="btn btn-primary px-3 py-2 text-xs">
                        ➕ Naya Bill Banayein
                    </button>
                </div>

                <div class="vault-card space-y-3">
                    <h3 class="text-xs font-bold text-slate-200 uppercase tracking-wider">All Generated Invoices</h3>
                    <div class="overflow-x-auto">
                        <table class="tally-table">
                            <thead>
                                <tr>
                                    <th>Bill No / Date</th>
                                    <th>M/s. Client Name</th>
                                    <th>Vehicle No.</th>
                                    <th>Grand Total</th>
                                    <th class="text-right">Actions (Print / Edit / Delete)</th>
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
                <td class="font-bold">${inv.clientName}</td>
                <td class="font-mono text-xs">${inv.vehicle || 'N/A'}</td>
                <td class="font-mono font-bold text-emerald-400 text-sm">₹${inv.grandTotal || 0}</td>
                <td class="text-right space-x-1">
                    <button type="button" onclick="BillingView.viewInvoice('${inv.id}')" class="btn btn-secondary px-2 py-1 text-[10px] text-amber-400">Print</button>
                    <button type="button" onclick="BillingView.openInvoiceModal('${inv.id}')" class="btn btn-secondary px-2 py-1 text-[10px] text-sky-400">Edit</button>
                    <button type="button" onclick="BillingView.deleteInvoice('${inv.id}')" class="btn btn-secondary px-2 py-1 text-[10px] text-rose-400">Delete</button>
                </td>
            </tr>
        `).join('') || '<tr><td colspan="5" class="text-center text-slate-500 py-4">Koi bill darj nahi hai.</td></tr>';
    },

    openInvoiceModal: function(id = null) {
        const modal = document.getElementById('modal-container');
        const content = document.getElementById('modal-content');
        if (!modal || !content) return;

        const trips = JSON.parse(localStorage.getItem('aadesh_trips') || '[]');
        let inv = { 
            clientName: '', vehicle: '', 
            particulars: [{ route: '', rate: 0, km: 0, amount: 0 }],
            toll: 0, nightCh: 0, gst: 0, grandTotal: 0 
        };

        if (id) {
            const invoices = JSON.parse(localStorage.getItem('aadesh_invoices') || '[]');
            const found = invoices.find(i => i.id === id);
            if (found) inv = found;
        }

        content.innerHTML = `
            <div class="p-5 space-y-4 bg-slate-900 text-slate-100 rounded-xl max-h-[90vh] overflow-y-auto">
                <div class="flex justify-between items-center border-b border-slate-800 pb-2">
                    <h3 class="text-sm font-bold text-amber-400">${id ? '✏️ Bill Update Karein' : '💰 Naya Bill Banayein'}</h3>
                    <button type="button" onclick="document.getElementById('modal-container').classList.add('hidden')" class="text-slate-400">&times;</button>
                </div>
                <form onsubmit="BillingView.saveInvoice(event, '${id || ''}')" class="space-y-3 text-xs">
                    <div>
                        <label class="form-label text-slate-300">Select From Trip / Duty Slip (Auto-fill)</label>
                        <select id="inv-trip-select" onchange="BillingView.fillFromTrip(this.value)" class="form-input bg-slate-950 text-white border-slate-700">
                            <option value="">-- Trip Chunein ya Manual Bharein --</option>
                            ${trips.map(t => `<option value="${t.id}">${t.id} -${t.guestName} (${t.vehicle}) [₹${t.grandTotal}]</option>`).join('')}
                        </select>
                    </div>

                    <div class="grid grid-cols-2 gap-2">
                        <div>
                            <label class="form-label text-slate-300">M/s. Client Name *</label>
                            <input type="text" id="inv-client" required value="${inv.clientName}" class="form-input bg-slate-950 text-white border-slate-700" placeholder="Client / Company Name">
                        </div>
                        <div>
                            <label class="form-label text-slate-300">Vehicle No. *</label>
                            <input type="text" id="inv-vehicle" required value="${inv.vehicle}" class="form-input bg-slate-950 text-white border-slate-700 font-mono" placeholder="RJ-27-TA-0000">
                        </div>
                    </div>

                    <!-- Particular Rows -->
                    <div class="space-y-2">
                        <div class="flex justify-between items-center">
                            <label class="form-label text-slate-300">Particulars / Routes</label>
                            <button type="button" onclick="BillingView.addRow()" class="text-amber-400 text-[11px] font-bold">+ Row Jodein</button>
                        </div>
                        <div id="particulars-rows" class="space-y-2">
                            ${inv.particulars.map((p, idx) => `
                                <div class="grid grid-cols-12 gap-1 bg-slate-950 p-2 rounded border border-slate-800 particular-row">
                                    <div class="col-span-5"><input type="text" placeholder="Route Details" value="${p.route}" class="form-input bg-slate-900 text-xs route-input" required></div>
                                    <div class="col-span-2"><input type="number" placeholder="Rate" value="${p.rate}" oninput="BillingView.calcTotal()" class="form-input bg-slate-900 text-xs rate-input"></div>
                                    <div class="col-span-2"><input type="number" placeholder="KM" value="${p.km}" oninput="BillingView.calcTotal()" class="form-input bg-slate-900 text-xs km-input"></div>
                                    <div class="col-span-2"><input type="number" placeholder="Amount" value="${p.amount}" oninput="BillingView.calcTotal()" class="form-input bg-slate-900 text-xs font-bold text-emerald-400 amt-input" required></div>
                                    <div class="col-span-1 flex items-center justify-center"><button type="button" onclick="this.closest('.particular-row').remove(); BillingView.calcTotal();" class="text-rose-500 font-bold text-sm">×</button></div>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <div class="grid grid-cols-3 gap-2 bg-slate-950 p-3 rounded border border-slate-800">
                        <div>
                            <label class="form-label text-slate-300">Toll / Park (₹)</label>
                            <input type="number" id="inv-toll" value="${inv.toll}" oninput="BillingView.calcTotal()" class="form-input bg-slate-900 text-white font-mono">
                        </div>
                        <div>
                            <label class="form-label text-slate-300">Night Ch. (₹)</label>
                            <input type="number" id="inv-night" value="${inv.nightCh}" oninput="BillingView.calcTotal()" class="form-input bg-slate-900 text-white font-mono">
                        </div>
                        <div>
                            <label class="form-label text-slate-300">GST (₹)</label>
                            <input type="number" id="inv-gst" value="${inv.gst}" oninput="BillingView.calcTotal()" class="form-input bg-slate-900 text-white font-mono">
                        </div>
                    </div>

                    <div class="bg-slate-950 p-3 rounded border border-amber-500/30 flex justify-between items-center">
                        <span class="font-bold text-slate-300">Grand Total:</span>
                        <span id="inv-display-total" class="font-mono font-bold text-amber-400 text-base">₹${inv.grandTotal || 0}</span>
                    </div>

                    <div class="flex justify-end gap-2 pt-3 border-t border-slate-800">
                        <button type="button" onclick="document.getElementById('modal-container').classList.add('hidden')" class="btn btn-secondary px-3 py-1.5">Radd</button>
                        <button type="submit" class="btn btn-primary px-4 py-1.5 font-bold">Save & Print</button>
                    </div>
                </form>
            </div>
        `;
        modal.classList.remove('hidden');
    },

    addRow: function(route = '', rate = 0, km = 0, amount = 0) {
        const container = document.getElementById('particulars-rows');
        if (!container) return;
        const div = document.createElement('div');
        div.className = 'grid grid-cols-12 gap-1 bg-slate-950 p-2 rounded border border-slate-800 particular-row';
        div.innerHTML = `
            <div class="col-span-5"><input type="text" placeholder="Route Details" value="${route}" class="form-input bg-slate-900 text-xs route-input" required></div>
            <div class="col-span-2"><input type="number" placeholder="Rate" value="${rate}" oninput="BillingView.calcTotal()" class="form-input bg-slate-900 text-xs rate-input"></div>
            <div class="col-span-2"><input type="number" placeholder="KM" value="${km}" oninput="BillingView.calcTotal()" class="form-input bg-slate-900 text-xs km-input"></div>
            <div class="col-span-2"><input type="number" placeholder="Amount" value="${amount}" oninput="BillingView.calcTotal()" class="form-input bg-slate-900 text-xs font-bold text-emerald-400 amt-input" required></div>
            <div class="col-span-1 flex items-center justify-center"><button type="button" onclick="this.closest('.particular-row').remove(); BillingView.calcTotal();" class="text-rose-500 font-bold text-sm">×</button></div>
        `;
        container.appendChild(div);
    },

    calcTotal: function() {
        let subtotal = 0;
        document.querySelectorAll('.particular-row').forEach(row => {
            const amt = parseFloat(row.querySelector('.amt-input')?.value) || 0;
            subtotal += amt;
        });

        const toll = parseFloat(document.getElementById('inv-toll')?.value) || 0;
        const night = parseFloat(document.getElementById('inv-night')?.value) || 0;
        const gst = parseFloat(document.getElementById('inv-gst')?.value) || 0;

        const grand = subtotal + toll + night + gst;
        const display = document.getElementById('inv-display-total');
        if (display) display.innerText = '₹' + grand;
    },

    fillFromTrip: function(tripId) {
        if (!tripId) return;
        const trips = JSON.parse(localStorage.getItem('aadesh_trips') || '[]');
        const t = trips.find(tr => tr.id === tripId);
        if (!t) return;

        document.getElementById('inv-client').value = t.guestName || '';
        document.getElementById('inv-vehicle').value = t.vehicle || '';
        
        // Auto populate route particulars from trip destination or package
        const container = document.getElementById('particulars-rows');
        if (container) {
            container.innerHTML = '';
            BillingView.addRow(t.destination || t.category || 'Trip Fare', 0, 0, t.grandTotal || 0);
        }
        BillingView.calcTotal();
    },

    saveInvoice: function(event, id) {
        event.preventDefault();
        const clientName = document.getElementById('inv-client').value.trim();
        const vehicle = document.getElementById('inv-vehicle').value.trim();
        const toll = parseFloat(document.getElementById('inv-toll').value) || 0;
        const nightCh = parseFloat(document.getElementById('inv-night').value) || 0;
        const gst = parseFloat(document.getElementById('inv-gst').value) || 0;

        let particulars = [];
        let subtotal = 0;
        document.querySelectorAll('.particular-row').forEach(row => {
            const route = row.querySelector('.route-input').value.trim();
            const rate = parseFloat(row.querySelector('.rate-input').value) || 0;
            const km = parseFloat(row.querySelector('.km-input').value) || 0;
            const amount = parseFloat(row.querySelector('.amt-input').value) || 0;
            particulars.push({ route, rate, km, amount });
            subtotal += amount;
        });

        const grandTotal = subtotal + toll + nightCh + gst;
        const date = new Date().toISOString().split('T')[0];

        let invoices = JSON.parse(localStorage.getItem('aadesh_invoices') || '[]');
        let invId = id;
        if (id) {
            invoices = invoices.map(i => i.id === id ? { ...i, clientName, vehicle, particulars, toll, nightCh, gst, grandTotal } : i);
        } else {
            invId = '8' + Math.floor(10 + Math.random() * 90);
            invoices.unshift({ id: invId, date, clientName, vehicle, particulars, toll, nightCh, gst, grandTotal });
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
        const compName = comp.name || 'AADESH TOURS';
        const compAddress = comp.address || 'Sec. 14, Balicha, Udaipur, (Raj.) 313001';
        const compPhones = comp.phones || '9602842390, 7043195007';
        const bankHolder = comp.holder || 'Chetan Nath Sisodiya';
        const bankName = comp.bankName || 'Union Bank of India';
        const bankIfsc = comp.ifsc || 'UBIN0576018';
        const bankAcc = comp.acc || '310102010460967';

        content.innerHTML = `
            <div class="p-6 space-y-4 bg-white text-slate-900 rounded-xl max-h-[90vh] overflow-y-auto font-sans border-4 border-red-700">
                <div class="flex justify-between items-center border-b-2 border-red-700 pb-2 print:hidden">
                    <h3 class="text-sm font-bold text-red-700">📄 Tax Invoice</h3>
                    <div class="flex gap-2">
                        <button type="button" onclick="window.print()" class="btn btn-primary px-3 py-1 text-xs bg-red-700 text-white">🖨️ Print Bill</button>
                        <button type="button" onclick="document.getElementById('modal-container').classList.add('hidden')" class="text-slate-900 font-bold text-lg">&times;</button>
                    </div>
                </div>

                <div class="text-center border-b-2 border-red-700 pb-2 space-y-0.5">
                    <div class="text-xs font-bold tracking-widest text-red-700 uppercase">INVOICE</div>
                    <h1 class="text-2xl font-black tracking-wider text-red-700">${compName}</h1>
                    <p class="text-base font-black tracking-widest text-red-700">— UDAIPUR —</p>
                    <p class="text-[11px] font-bold text-slate-800">${compAddress}</p>
                    <p class="text-[11px] font-bold text-slate-800">Mob. ${compPhones} | chetannathsisodiya500@gmail.com</p>
                    <p class="text-[10px] font-bold text-red-600 bg-red-50 py-0.5 mt-1 border border-red-200">All Type Of Taxi Tourist Cars (a.c. And Non A.c.) 24 Hours Available</p>
                </div>

                <div class="border-2 border-red-700 text-xs p-2 grid grid-cols-12 gap-2">
                    <div class="col-span-8 space-y-1">
                        <div><strong>M/s.</strong> <span class="border-b border-dotted border-slate-600 pb-0.5 px-1 font-bold">${inv.clientName}</span></div>
                        <div><strong>Vehicle No.</strong> <span class="border-b border-dotted border-slate-600 pb-0.5 px-1 font-mono font-bold">${inv.vehicle || 'N/A'}</span></div>
                    </div>
                    <div class="col-span-4 space-y-1 text-right">
                        <div><strong>Bill No.</strong> <span class="font-mono font-bold text-red-700">${inv.id}</span></div>
                        <div><strong>Date:</strong> <span class="font-mono">${inv.date}</span></div>
                    </div>
                </div>

                <div class="border-2 border-red-700 text-xs">
                    <table class="w-full border-collapse">
                        <thead>
                            <tr class="bg-red-50 text-red-800 border-b-2 border-red-700 text-center font-bold">
                                <th class="p-1.5 border-r border-red-700 text-left w-1/2">PARTICULAR</th>
                                <th class="p-1.5 border-r border-red-700 w-16">RATE</th>
                                <th class="p-1.5 border-r border-red-700 w-20">TOTAL K.M.</th>
                                <th class="p-1.5 w-24">AMOUNT</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${inv.particulars.map(p => `
                                <tr class="border-b border-red-300">
                                    <td class="p-2 border-r border-red-300 font-bold">${p.route}</td>
                                    <td class="p-2 border-r border-red-300 text-center font-mono">${p.rate || ''}</td>
                                    <td class="p-2 border-r border-red-300 text-center font-mono">${p.km || ''}</td>
                                    <td class="p-2 text-right font-mono font-bold">₹${p.amount}</td>
                                </tr>
                            `).join('')}

                            <tr class="border-b border-red-300">
                                <td colspan="3" class="p-1.5 border-r border-red-300 text-right font-bold">TOLL/PARK.</td>
                                <td class="p-1.5 text-right font-mono">₹${inv.toll || 0}</td>
                            </tr>
                            <tr class="border-b border-red-300">
                                <td colspan="3" class="p-1.5 border-r border-red-300 text-right font-bold">NIGHT CH.</td>
                                <td class="p-1.5 text-right font-mono">₹${inv.nightCh || 0}</td>
                            </tr>
                            <tr class="border-b border-red-300">
                                <td colspan="3" class="p-1.5 border-r border-red-300 text-right font-bold">TOTAL</td>
                                <td class="p-1.5 text-right font-mono font-bold">₹${(inv.particulars.reduce((s,p)=>s+p.amount,0) + inv.toll + inv.nightCh)}</td>
                            </tr>
                            <tr class="border-b-2 border-red-700">
                                <td colspan="3" class="p-1.5 border-r border-red-700 text-right font-bold">GST</td>
                                <td class="p-1.5 text-right font-mono">₹${inv.gst || 0}</td>
                            </tr>
                            <tr class="bg-red-50 font-black text-sm">
                                <td colspan="3" class="p-2 border-r border-red-700 text-right text-red-800">G.TOTAL</td>
                                <td class="p-2 text-right font-mono text-red-700">₹${inv.grandTotal}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div class="grid grid-cols-2 gap-2 text-[10px]">
                    <div class="border border-red-700 p-2 space-y-0.5">
                        <div class="font-bold text-red-700 border-b border-red-300 pb-0.5">Bank Details</div>
                        <div>Name : ${bankHolder}</div>
                        <div>Bank : ${bankName}</div>
                        <div>IFSC : ${bankIfsc}</div>
                        <div>A/C No. : ${bankAcc}</div>
                    </div>
                    <div class="border border-red-700 p-2 space-y-0.5">
                        <div class="font-bold text-red-700 border-b border-red-300 pb-0.5">Terms & Conditions</div>
                        <div>• Toll Tax, Border Tax, Parking, No Entry pay by party.</div>
                        <div>• Night Charges Rs.300/- Extra.</div>
                        <div>• Per day Running 300 k.m.</div>
                        <div>• All Subject to Udaipur Jurisdiction Only. E.&O.E.</div>
                    </div>
                </div>

                <div class="flex justify-between items-end pt-4 text-xs font-bold">
                    <div class="border-t border-slate-900 pt-1 px-4 text-center">Customer's Sig.</div>
                    <div class="text-center space-y-2">
                        <div class="text-sm font-script text-red-700">Chetan</div>
                        <div class="border-t border-slate-900 pt-1 px-4 text-center">For ${compName}</div>
                    </div>
                </div>
            </div>
        `;
        modal.classList.remove('hidden');
    },

    deleteInvoice: function(id) {
        if (!confirm('Kya aap is bill ko delete karna chahte hain?')) return;
        let invoices = JSON.parse(localStorage.getItem('aadesh_invoices') || '[]');
        invoices = invoices.filter(i => i.id !== id);
        localStorage.setItem('aadesh_invoices', JSON.stringify(invoices));
        this.loadInvoicesData();
    }
};
