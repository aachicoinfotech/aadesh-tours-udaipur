// js/views/settings-view.js - Aadesh Tours Udaipur Settings & Profile
window.SettingsView = {
    render: function(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const settings = JSON.parse(localStorage.getItem('aadesh_settings') || '{}');
        const companyName = settings.companyName || "AADESH TOURS UDAIPUR";
        const phones = settings.phones || "9602842390 / 7043195007";

        container.innerHTML = `
            <div class="space-y-4 max-w-2xl mx-auto">
                <div class="vault-card">
                    <h2 class="text-base font-bold text-amber-400 mb-1">⚙️ Company & Profile Settings</h2>
                    <p class="text-xs text-slate-400 mb-4">Update business details & bank account info for invoices</p>

                    <form onsubmit="SettingsView.saveSettings(event)" class="space-y-3 text-xs">
                        <div>
                            <label class="form-label">Business / Company Name</label>
                            <input type="text" id="set-company" value="${companyName}" required class="form-input font-bold text-amber-400">
                        </div>
                        <div>
                            <label class="form-label">Contact Numbers (Bill Footer)</label>
                            <input type="text" id="set-phones" value="${phones}" required class="form-input">
                        </div>
                        <div class="vault-card bg-slate-950/50 space-y-2 mt-4">
                            <h3 class="font-bold text-amber-400 text-xs">Bank Details (Fixed for SBI / UPI)</h3>
                            <div class="grid grid-cols-2 gap-2 text-slate-300">
                                <p><strong>Holder:</strong> Chetan Nath</p>
                                <p><strong>Bank:</strong> State Bank of India (SBI)</p>
                                <p><strong>A/C No:</strong> 44936542535</p>
                                <p><strong>IFSC:</strong> SBIN0016178</p>
                            </div>
                        </div>
                        <div class="pt-2">
                            <button type="submit" class="btn btn-primary px-4 py-2 text-xs font-bold w-full">Settings Save Karein</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
    },

    saveSettings: function(event) {
        event.preventDefault();
        const companyName = document.getElementById('set-company').value.trim();
        const phones = document.getElementById('set-phones').value.trim();

        const settings = { companyName, phones };
        localStorage.setItem('aadesh_settings', JSON.stringify(settings));

        alert('Settings safaltapurvak save ho gayi hain!');
        window.location.reload();
    }
};
