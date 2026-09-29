// js/app.js - Aadesh Tours Udaipur - Fleet OS Main Router & App Controller

document.addEventListener("DOMContentLoaded", function() {
    // App shuru hote hi Dashboard load karein
    navigateTo('dashboard');
    
    // Bottom Navigation Bar ke clicks handle karna
    setupNavigationListeners();
});

function navigateTo(viewName) {
    const containerId = 'app-container';
    const container = document.getElementById(containerId);
    
    if (!container) {
        console.error("Error: 'app-container' element nahi mila HTML me!");
        return;
    }

    // Har view par jaane se pehle container saaf karein
    container.innerHTML = '';

    // Switch ke zariye check karein kaun sa view kholna hai
    switch(viewName) {
        case 'dashboard':
            if (window.DashboardView && typeof window.DashboardView.render === 'function') {
                window.DashboardView.render(containerId);
            } else {
                container.innerHTML = `<div class="p-6 text-center text-slate-400">Dashboard load ho raha hai...</div>`;
            }
            break;

        case 'trips':
            if (window.TripsView && typeof window.TripsView.render === 'function') {
                window.TripsView.render(containerId);
            } else {
                container.innerHTML = `<div class="p-6 text-center text-red-400">Error: TripsView file load nahi hui hai. Kripya script check karein.</div>`;
            }
            break;

        case 'billing':
            if (window.BillingView && typeof window.BillingView.render === 'function') {
                window.BillingView.render(containerId);
            } else {
                container.innerHTML = `<div class="p-6 text-center text-red-400">Error: BillingView file load nahi hui hai.</div>`;
            }
            break;

        case 'settings':
            if (window.SettingsView && typeof window.SettingsView.render === 'function') {
                window.SettingsView.render(containerId);
            } else {
                container.innerHTML = `<div class="p-6 text-center text-slate-400">Settings view jald hi aayega.</div>`;
            }
            break;

        default:
            if (window.DashboardView) {
                window.DashboardView.render(containerId);
            }
    }
}

function setupNavigationListeners() {
    // Agar aapke HTML me footer nav buttons hain jo data-target ya onclick use karte hain
    // Yeh function ensure karega ki click par sahi view khule.
    window.switchTab = function(tabName) {
        navigateTo(tabName);
    };
}
