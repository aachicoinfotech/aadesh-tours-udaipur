// js/views/settings-view.js - Master Settings & Data Management (Company, Cars, Drivers, Vendors)
window.SettingsView = {
    render: function(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = `
            <div class="space-y-6 max-w-5xl mx-auto pb-12">
                <div class="vault-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                        <h2 class="text-base font-bold text-amber-400">⚙️ Master Settings & Vault Management</h2>
                        <p class="text-xs text-slate-400">Aadesh Tours Udaipur - Company, Cars, Drivers & Vendors Control</p>
                    </div>
                </div>

                <!-- Sub Navigation Tabs for Settings -->
                <div class="flex flex-wrap gap-2 border-b border-slate-800 pb-2">
                    <button type="button" id="set-tab-comp" onclick="SettingsView.switchTab('company')" class="btn btn-primary px-3 py-1.5 text-xs">🏢 Company & Bank</button>
                    <button type="button" id="set-tab-cars" onclick="SettingsView.switchTab('cars')" class="btn btn-secondary px-3 py-1.5 text-xs">🚘 Cars (Fleet & Docs)</button>
                    <button type="button" id="set-tab-drivers" onclick="SettingsView.switchTab('drivers')" class="btn btn-secondary px-3 py-1.5 text-xs">👥 Drivers List</button>
                    <button type="button" id="set-tab-vendors" onclick="SettingsView.switchTab('vendors')" class="btn btn-secondary px-3 py-1.5 text-xs">🤝 Vendors</button>
                </div>

                <!-- 1. Company & Bank Section -->
                <div id="sec-company" class="vault-card space-y-4">
                    <div class="flex justify-between items-center border-b border-slate-800 pb-2">
                        <h3 class="text-xs font-bold text-slate-200 uppercase tracking-wider">Company Profile & Bank Details (Billing & Duty Slip Header)</h3>
                        <button type="button" onclick="SettingsView.saveCompanyDetails(event)" class="btn btn-primary px-3 py-1 text-xs">💾 Save Company Info</button>
                    </div>
                    <form id="company-form" class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                        <div>
                            <label class="form-label text-slate-300">Company Name</label>
                            <input type="text" id="comp-name" class="form-input bg-slate-950 text-white border-slate-700" value="AADESH TOURS UDAIPUR">
                        </div>
                        <div>
                            <label class="form-label text-slate-300">Primary & Secondary Contact Nos</label>
                            <input type="text" id="comp-phones" class="form-input bg-slate-950 text-white border-slate-700 font-mono" value="9602842390 / 7043195007">
                        </div>
                        <div class="sm:col-span-2">
                            <label class="form-label text-slate-300">Office Address / Reporting Place</label>
                            <input type="text" id="comp-address" class="form-input bg-slate-950 text-white border-slate-700" value="Udaipur, Rajasthan">
                        </div>
                        <div>
                            <label class="form-label text-slate-300">Bank Account Name</label>
                            <input type="text" id="bank-holder" class="form-input bg-slate-950 text-white border-slate-700" placeholder="Account Holder Name">
                        </div>
                        <div>
                            <label class="form-label text-slate-300">Bank Account Number</label>
                            <input type="text" id="bank-acc" class="form-input bg-slate-950 text-white border-slate-700 font-mono" placeholder="Account Number">
                        </div>
                        <div>
                            <label class="form-label text-slate-300">IFSC Code</label>
                            <input type="text" id="bank-ifsc" class="form-input bg-slate-950 text-white border-slate-700 font-mono" placeholder="IFSC Code">
                        </div>
                        <div>
                            <label class="form-label text-slate-300">Bank Name & Branch</label>
                            <input type="text" id="bank-name" class="form-input bg-slate-950 text-white border-slate-700" placeholder="Bank Name">
                        </div>
                    </form>
                </div>

                <!-- 2. Cars Section -->
                <div id="sec-cars" class="vault-card space-y-4 hidden">
                    <div class="flex justify-between items-center border-b border-slate-800 pb-2">
                        <h3 class="text-xs font-bold text-slate-200 uppercase tracking-wider">Cars & Legal Documents Management</h3>
                        <button type="button" onclick="SettingsView.openCarModal()" class="btn btn-primary px-3 py-1 text-xs">➕ Nayi Gaadi Jodein</button>
                    </div>
                    <div class="overflow-x-auto">
                        <table class="tally-table">
                            <thead>
                                <tr>
                                    <th>Vehicle No & Model</th>
                                    <th>Insurance</th>
                                    <th>PUC</th>
                                    <th>Fitness</th>
                                    <th>Permit</th>
                                    <th>Tax</th>
                                    <th class="text-right">Actions (Edit / Delete)</th>
                                </tr>
                            </thead>
                            <tbody id="settings-cars-body"></tbody>
                        </table>
                    </div>
                </div>

                <!-- 3. Drivers Section -->
                <div id="sec-drivers" class="vault-card space-y-4 hidden">
                    <div class="flex justify-between items-center border-b border-slate-800 pb-2">
                        <h3 class="text-xs font-bold text-slate-200 uppercase tracking-wider">Drivers Management</h3>
                        <button type="button" onclick="SettingsView.openDriverModal()" class="btn btn-primary px-3 py-1 text-xs">➕ Naya Driver Jodein</button>
                    </div>
                    <div class="overflow-x-auto">
                        <table class="tally-table">
                            <thead>
                                <tr>
                                    <th>Driver Name</th>
                                    <th>Mobile Number</th>
                                    <th>License Number</th>
                                    <th>Advance (₹)</th>
                                    <th class="text-right">Actions (Edit / Delete)</th>
                                </tr>
                            </thead>
                            <tbody id="settings-drivers-body"></tbody>
                        </table>
                    </div>
                </div>

                <!-- 4. Vendors Section -->
                <div id="sec-vendors" class="vault-card space-y-4 hidden">
                    <div class="flex justify-between items-center border-b border-slate-800 pb-2">
                        <h3 class="text-xs font-bold text-slate-200 uppercase tracking-wider">Vendors Management</h3>
                        <button type="button" onclick="SettingsView.openVendorModal()" class="btn btn-primary px-3 py-1 text-xs">➕ Naya Vendor Jodein</button>
                    </div>
                    <div class="overflow-x-auto">
                        <table class="tally-table">
                            <thead>
                                <tr>
                                    <th>Vendor Name</th>
                                    <th>Mobile Number</th>
                                    <th>Agency / Company</th>
                                    <th>Opening Balance (₹)</th>
                                    <th class="text-right">Actions (Edit / Delete)</th>
                                </tr>
                            </thead>
                            <tbody id="settings-vendors-body"></tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
        this.loadCompanyDetails();
        this.loadCarsData();
        this.loadDriversData();
        this.loadVendorsData();
    },

    switchTab: function(tabName) {
        ['company', 'cars', 'drivers', 'vendors'].forEach(t => {
            document.getElementById(`sec-${t}`)?.classList.add('hidden');
            document.getElementById(`set-tab-${t}`)?.classList.replace('btn-primary', 'btn-secondary');
        });
        document.getElementById(`sec-${tabName}`)?.classList.remove('hidden');
        document.getElementById(`set-tab-${tabName}`)?.classList.replace('btn-secondary', 'btn-primary');
    },

    loadCompanyDetails: function() {
        const comp = JSON.parse(localStorage.getItem('aadesh_company_profile') || '{}');
        if (comp.name) document.getElementById('comp-name').value = comp.name;
        if (comp.phones) document.getElementById('comp-phones').value = comp.phones;
        if (comp.address) document.getElementById('comp-address').value = comp.address;
        if (comp.holder) document.getElementById('bank-holder').value = comp.holder;
        if (comp.acc) document.getElementById('bank-acc').value = comp.acc;
        if (comp.ifsc) document.getElementById('bank-ifsc').value = comp.ifsc;
        if (comp.bankName) document.getElementById('bank-name').value = comp.bankName;
    },

    saveCompanyDetails: function(event) {
        event.preventDefault();
        const comp = {
            name: document.getElementById('comp-name').value.trim(),
            phones: document.getElementById('comp-phones').value.trim(),
            address: document.getElementById('comp-address').value.trim(),
            holder: document.getElementById('bank-holder').value.trim(),
            acc: document.getElementById('bank-acc').value.trim(),
            ifsc: document.getElementById('bank-ifsc').value.trim(),
            bankName: document.getElementById('bank-name').value.trim()
        };
        localStorage.setItem('aadesh_company_profile', JSON.stringify(comp));
        alert('Company aur Bank details safalta-poorvak save ho gayi hain!');
    },

    loadCarsData: function() {
        const tbody = document.getElementById('settings-cars-body');
        if (!tbody) return;
        const fleet = JSON.parse(localStorage.getItem('aadesh_fleet') || '[]');

        tbody.innerHTML = fleet.map(f => `
            <tr>
                <td>
                    <div class="font-mono font-bold text-amber-400">${f.number}</div>
                    <div class="text-[10px] text-slate-400">${f.model}</div>
                </td>
                <td class="font-mono text-[11px]">${f.insurance || 'N/A'}</td>
                <td class="font-mono text-[11px]">${f.puc || 'N/A'}</td>
                <td class="font-mono text-[11px]">${f.fitness || 'N/A'}</td>
                <td class="font-mono text-[11px]">${f.permit || 'N/A'}</td>
                <td class="font-mono text-[11px]">${f.tax || 'N/A'}</td>
                <td class="text-right space-x-1">
                    <button type="button" onclick="SettingsView.openCarModal('${f.id}')" class="btn btn-secondary px-2 py-1 text-[10px] text-sky-400">Edit</button>
                    <button type="button" onclick="SettingsView.deleteCar('${f.id}')" class="btn btn-secondary px-2 py-1 text-[10px] text-rose-400">Delete</button>
                </td>
            </tr>
        `).join('') || '<tr><td colspan="7" class="text-center text-slate-500 py-4">Koi gaadi darj nahi hai.</td></tr>';
    },

    openCarModal: function(id = null) {
        const modal = document.getElementById('modal-container');
        const content = document.getElementById('modal-content');
        if (!modal || !content) return;

        const today = new Date().toISOString().split('T')[0];
        let car = { number: '', model: '', insurance: today, puc: today, fitness: today, permit: today, tax: today };
        if (id) {
            const fleet = JSON.parse(localStorage.getItem('aadesh_fleet') || '[]');
            const found = fleet.find(f => f.id === id);
            if (found) car = found;
        }

        content.innerHTML = `
            <div class="p-5 space-y-3 bg-slate-900 text-slate-100 rounded-xl max-h-[90vh] overflow-y-auto">
                <div class="flex justify-between items-center border-b border-slate-800 pb-2">
                    <h3 class="text-sm font-bold text-amber-400">${id ? '✏️️ Gaadi Update Karein' : '🚘 Nayi Gaadi aur Documents Jodein'}</h3>
                    <button type="button" onclick="document.getElementById('modal-container').classList.add('hidden')" class="text-slate-400">&times;</button>
                </div>
                <form onsubmit="SettingsView.saveCar(event, '${id || ''}')" class="space-y-3 text-xs">
                    <div>
                        <label class="form-label text-slate-300">Vehicle Number *</label>
                        <input type="text" id="car-num" required value="${car.number}" class="form-input bg-slate-950 text-white border-slate-700 font-mono uppercase" placeholder="RJ-27-PA-0000">
                    </div>
                    <div>
                        <label class="form-label text-slate-300">Model / Type *</label>
                        <input type="text" id="car-model" required value="${car.model}" class="form-input bg-slate-950 text-white border-slate-700" placeholder="Sedan / SUV / Dzire / Ertiga">
                    </div>
                    <div class="grid grid-cols-2 gap-2">
                        <div>
                            <label class="form-label text-slate-300">Insurance Expiry</label>
                            <input type="date" id="car-ins" value="${car.insurance}" class="form-input bg-slate-950 text-white border-slate-700">
                        </div>
                        <div>
                            <label class="form-label text-slate-300">PUC Expiry</label>
                            <input type="date" id="car-puc" value="${car.puc}" class="form-input bg-slate-950 text-white border-slate-700">
                        </div>
                    </div>
                    <div class="grid grid-cols-2 gap-2">
                        <div>
                            <label class="form-label text-slate-300">Fitness Expiry</label>
                            <input type="date" id="car-fit" value="${car.fitness}" class="form-input bg-slate-950 text-white border-slate-700">
                        </div>
                        <div>
                            <label class="form-label text-slate-300">Permit Expiry</label>
                            <input type="date" id="car-per" value="${car.permit}" class="form-input bg-slate-950 text-white border-slate-700">
                        </div>
                    </div>
                    <div>
                        <label class="form-label text-slate-300">Road Tax Expiry</label>
                        <input type="date" id="car-tax" value="${car.tax}" class="form-input bg-slate-950 text-white border-slate-700">
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

    saveCar: function(event, id) {
        event.preventDefault();
        const number = document.getElementById('car-num').value.trim();
        const model = document.getElementById('car-model').value.trim();
        const insurance = document.getElementById('car-ins').value;
        const puc = document.getElementById('car-puc').value;
        const fitness = document.getElementById('car-fit').value;
        const permit = document.getElementById('car-per').value;
        const tax = document.getElementById('car-tax').value;

        let fleet = JSON.parse(localStorage.getItem('aadesh_fleet') || '[]');
        if (id) {
            fleet = fleet.map(f => f.id === id ? { ...f, number, model, insurance, puc, fitness, permit, tax } : f);
        } else {
            fleet.push({ id: 'F-' + Date.now(), number, model, insurance, puc, fitness, permit, tax });
        }
        localStorage.setItem('aadesh_fleet', JSON.stringify(fleet));
        document.getElementById('modal-container').classList.add('hidden');
        this.loadCarsData();
    },

    deleteCar: function(id) {
        if (!confirm('Kya aap is gaadi ko delete karna chahte hain?')) return;
        let fleet = JSON.parse(localStorage.getItem('aadesh_fleet') || '[]');
        fleet = fleet.filter(f => f.id !== id);
        localStorage.setItem('aadesh_fleet', JSON.stringify(fleet));
        this.loadCarsData();
    },

    loadDriversData: function() {
        const tbody = document.getElementById('settings-drivers-body');
        if (!tbody) return;
        const drivers = JSON.parse(localStorage.getItem('aadesh_drivers') || '[]');

        tbody.innerHTML = drivers.map(d => `
            <tr>
                <td class="font-bold text-slate-200">${d.name}</td>
                <td class="font-mono">${d.mobile}</td>
                <td class="font-mono text-slate-400">${d.license || 'N/A'}</td>
                <td class="font-mono text-amber-400">₹${d.advance || 0}</td>
                <td class="text-right space-x-1">
                    <button type="button" onclick="SettingsView.openDriverModal('${d.id}')" class="btn btn-secondary px-2 py-1 text-[10px] text-sky-400">Edit</button>
                    <button type="button" onclick="SettingsView.deleteDriver('${d.id}')" class="btn btn-secondary px-2 py-1 text-[10px] text-rose-400">Delete</button>
                </td>
            </tr>
        `).join('') || '<tr><td colspan="5" class="text-center text-slate-500 py-4">Koi driver darj nahi hai.</td></tr>';
    },

    openDriverModal: function(id = null) {
        const modal = document.getElementById('modal-container');
        const content = document.getElementById('modal-content');
        if (!modal || !content) return;

        let driver = { name: '', mobile: '', license: '', advance: 0 };
        if (id) {
            const drivers = JSON.parse(localStorage.getItem('aadesh_drivers') || '[]');
            const found = drivers.find(d => d.id === id);
            if (found) driver = found;
        }

        content.innerHTML = `
            <div class="p-5 space-y-4 bg-slate-900 text-slate-100 rounded-xl">
                <div class="flex justify-between items-center border-b border-slate-800 pb-2">
                    <h3 class="text-sm font-bold text-amber-400">${id ? '✏️ Driver Update' : '👤 Naya Driver'}</h3>
                    <button type="button" onclick="document.getElementById('modal-container').classList.add('hidden')" class="text-slate-400">&times;</button>
                </div>
                <form onsubmit="SettingsView.saveDriver(event, '${id || ''}')" class="space-y-3 text-xs">
                    <div>
                        <label class="form-label text-slate-300">Driver Name *</label>
                        <input type="text" id="drv-name" required value="${driver.name}" class="form-input bg-slate-950 text-white border-slate-700" placeholder="Full Name">
                    </div>
                    <div>
                        <label class="form-label text-slate-300">Mobile Number *</label>
                        <input type="text" id="drv-mob" required value="${driver.mobile}" class="form-input bg-slate-950 text-white border-slate-700 font-mono" placeholder="9876543210">
                    </div>
                    <div>
                        <label class="form-label text-slate-300">License Number</label>
                        <input type="text" id="drv-lic" value="${driver.license}" class="form-input bg-slate-950 text-white border-slate-700 font-mono" placeholder="RJ27XXXXXXXX">
                    </div>
                    <div>
                        <label class="form-label text-slate-300">Advance / Opening Balance (₹)</label>
                        <input type="number" id="drv-adv" value="${driver.advance}" class="form-input bg-slate-950 text-amber-400 border-slate-700 font-mono">
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

    saveDriver: function(event, id) {
        event.preventDefault();
        const name = document.getElementById('drv-name').value.trim();
        const mobile = document.getElementById('drv-mob').value.trim();
        const license = document.getElementById('drv-lic').value.trim() || 'N/A';
        const advance = parseFloat(document.getElementById('drv-adv').value) || 0;

        let drivers = JSON.parse(localStorage.getItem('aadesh_drivers') || '[]');
        if (id) {
            drivers = drivers.map(d => d.id === id ? { ...d, name, mobile, license, advance } : d);
        } else {
            drivers.push({ id: 'D-' + Date.now(), name, mobile, license, advance });
        }
        localStorage.setItem('aadesh_drivers', JSON.stringify(drivers));
        document.getElementById('modal-container').classList.add('hidden');
        this.loadDriversData();
    },

    deleteDriver: function(id) {
        if (!confirm('Kya aap is driver ko delete karna chahte hain?')) return;
        let drivers = JSON.parse(localStorage.getItem('aadesh_drivers') || '[]');
        drivers = drivers.filter(d => d.id !== id);
        localStorage.setItem('aadesh_drivers', JSON.stringify(drivers));
        this.loadDriversData();
    },

    loadVendorsData: function() {
        const tbody = document.getElementById('settings-vendors-body');
        if (!tbody) return;
        const vendors = JSON.parse(localStorage.getItem('aadesh_vendors') || '[]');

        tbody.innerHTML = vendors.map(v => `
            <tr>
                <td class="font-bold text-slate-200">${v.name}</td>
                <td class="font-mono">${v.mobile}</td>
                <td>${v.agency || 'N/A'}</td>
                <td class="font-mono text-amber-400">₹${v.balance || 0}</td>
                <td class="text-right space-x-1">
                    <button type="button" onclick="SettingsView.openVendorModal('${v.id}')" class="btn btn-secondary px-2 py-1 text-[10px] text-sky-400">Edit</button>
                    <button type="button" onclick="SettingsView.deleteVendor('${v.id}')" class="btn btn-secondary px-2 py-1 text-[10px] text-rose-400">Delete</button>
                </td>
            </tr>
        `).join('') || '<tr><td colspan="5" class="text-center text-slate-500 py-4">Koi vendor darj nahi hai.</td></tr>';
    },

    openVendorModal: function(id = null) {
        const modal = document.getElementById('modal-container');
        const content = document.getElementById('modal-content');
        if (!modal || !content) return;

        let vendor = { name: '', mobile: '', agency: '', balance: 0 };
        if (id) {
            const vendors = JSON.parse(localStorage.getItem('aadesh_vendors') || '[]');
            const found = vendors.find(v => v.id === id);
            if (found) vendor = found;
        }

        content.innerHTML = `
            <div class="p-5 space-y-4 bg-slate-900 text-slate-100 rounded-xl">
                <div class="flex justify-between items-center border-b border-slate-800 pb-2">
                    <h3 class="text-sm font-bold text-amber-400">${id ? '✏️ Vendor Update' : '🤝 Naya Vendor'}</h3>
                    <button type="button" onclick="document.getElementById('modal-container').classList.add('hidden')" class="text-slate-400">&times;</button>
                </div>
                <form onsubmit="SettingsView.saveVendor(event, '${id || ''}')" class="space-y-3 text-xs">
                    <div>
                        <label class="form-label text-slate-300">Vendor Name *</label>
                        <input type="text" id="ven-name" required value="${vendor.name}" class="form-input bg-slate-950 text-white border-slate-700" placeholder="Vendor Name">
                    </div>
                    <div>
                        <label class="form-label text-slate-300">Mobile Number *</label>
                        <input type="text" id="ven-mob" required value="${vendor.mobile}" class="form-input bg-slate-950 text-white border-slate-700 font-mono" placeholder="9876543210">
                    </div>
                    <div>
                        <label class="form-label text-slate-300">Agency / Company Name</label>
                        <input type="text" id="ven-agency" value="${vendor.agency}" class="form-input bg-slate-950 text-white border-slate-700" placeholder="Agency Name">
                    </div>
                    <div>
                        <label class="form-label text-slate-300">Opening Balance / Dues (₹)</label>
                        <input type="number" id="ven-bal" value="${vendor.balance}" class="form-input bg-slate-950 text-amber-400 border-slate-700 font-mono">
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

    saveVendor: function(event, id) {
        event.preventDefault();
        const name = document.getElementById('ven-name').value.trim();
        const mobile = document.getElementById('ven-mob').value.trim();
        const agency = document.getElementById('ven-agency').value.trim() || 'N/A';
        const balance = parseFloat(document.getElementById('ven-bal').value) || 0;

        let vendors = JSON.parse(localStorage.getItem('aadesh_vendors') || '[]');
        if (id) {
            vendors = vendors.map(v => v.id === id ? { ...v, name, mobile, agency, balance } : v);
        } else {
            vendors.push({ id: 'V-' + Date.now(), name, mobile, agency, balance });
        }
        localStorage.setItem('aadesh_vendors', JSON.stringify(vendors));
        document.getElementById('modal-container').classList.add('hidden');
        this.loadVendorsData();
    },

    deleteVendor: function(id) {
        if (!confirm('Kya aap is vendor ko delete karna chahte hain?')) return;
        let vendors = JSON.parse(localStorage.getItem('aadesh_vendors') || '[]');
        vendors = vendors.filter(v => v.id !== id);
        localStorage.setItem('aadesh_vendors', JSON.stringify(vendors));
        this.loadVendorsData();
    }
};
