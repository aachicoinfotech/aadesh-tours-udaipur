// js/app.js - Main Router Controller
document.addEventListener('DOMContentLoaded', () => {
    setupPinLock();
    setupTabs();
});

function setupPinLock() {
    const pinScreen = document.getElementById('pin-screen');
    const mainApp = document.getElementById('main-app');
    
    if (sessionStorage.getItem('aadesh_unlocked') === 'true') {
        pinScreen?.classList.add('hidden');
        mainApp?.classList.remove('hidden');
        initApp();
    } else {
        let enteredPin = '';
        const dots = document.querySelectorAll('.pin-dot');
        const errorMsg = document.getElementById('pin-error-msg');

        document.querySelectorAll('.pin-key').forEach(btn => {
            btn.addEventListener('click', () => {
                if (enteredPin.length < 4) {
                    enteredPin += btn.getAttribute('data-val');
                    updateDots(dots, enteredPin.length);
                }
                if (enteredPin.length === 4) {
                    if (enteredPin === '2727') {
                        sessionStorage.setItem('aadesh_unlocked', 'true');
                        pinScreen?.classList.add('hidden');
                        mainApp?.classList.remove('hidden');
                        initApp();
                    } else {
                        if (errorMsg) errorMsg.textContent = 'Galat PIN! (Default: 2727)';
                        enteredPin = '';
                        updateDots(dots, 0);
                    }
                }
            });
        });

        document.getElementById('pin-clear')?.addEventListener('click', () => {
            enteredPin = '';
            updateDots(dots, 0);
            if (errorMsg) errorMsg.textContent = '';
        });

        document.getElementById('pin-backspace')?.addEventListener('click', () => {
            enteredPin = enteredPin.slice(0, -1);
            updateDots(dots, enteredPin.length);
        });
    }
}

function updateDots(dots, count) {
    dots.forEach((dot, idx) => {
        if (idx < count) dot.classList.add('bg-amber-400', 'border-amber-400');
        else dot.classList.remove('bg-amber-400', 'border-amber-400');
    });
}

function initApp() {
    window.DashboardView?.render('tab-dashboard');
    updateLiveGalla();
}

function setupTabs() {
    const tabButtons = document.querySelectorAll('.nav-tab-btn');
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTabId = btn.getAttribute('data-tab');
            document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.add('hidden'));
            
            const targetPane = document.getElementById(targetTabId);
            if (targetPane) {
                targetPane.classList.remove('hidden');
                if (targetTabId === 'tab-dashboard') window.DashboardView?.render('tab-dashboard');
                else if (targetTabId === 'tab-fleet') window.FleetView?.render('tab-fleet');
                else if (targetTabId === 'tab-trips') window.TripsView?.render('tab-trips');
                else if (targetTabId === 'tab-billing') window.BillingView?.render('tab-billing');
                else if (targetTabId === 'tab-daybook') window.DaybookView?.render('tab-daybook');
                else if (targetTabId === 'tab-reports') window.ReportsView?.render('tab-reports');
                else if (targetTabId === 'tab-settings') window.SettingsView?.render('tab-settings');
            }

            tabButtons.forEach(b => {
                b.classList.remove('text-amber-400');
                b.classList.add('text-slate-400');
            });
            btn.classList.remove('text-slate-400');
            btn.classList.add('text-amber-400');
        });
    });

    document.getElementById('btn-lock-app')?.addEventListener('click', () => {
        sessionStorage.removeItem('aadesh_unlocked');
        window.location.reload();
    });
}

function updateLiveGalla() {
    try {
        const galla = JSON.parse(localStorage.getItem('aadesh_galla') || '{"cashIn": 0, "cashOut": 0}');
        const netGalla = (galla.cashIn || 0) - (galla.cashOut || 0);
        const gallaElem = document.getElementById('header-galla-amount');
        if (gallaElem) gallaElem.textContent = `₹${netGalla}`;
    } catch(e) { console.error("Galla error:", e); }
}
