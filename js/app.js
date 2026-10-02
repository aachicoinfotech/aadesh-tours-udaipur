// js/app.js - Main Application Router & Controller for Aadesh Tours Fleet OS
document.addEventListener('DOMContentLoaded', () => {
    // Initialize App Navigation and Default View
    App.init();
});

window.App = {
    currentTab: 'dashboard',

    init: function() {
        this.setupNavigation();
        this.navigateTo('dashboard');
    },

    setupNavigation: function() {
        // Map navigation buttons/links to view renderers
        const navItems = [
            { id: 'nav-dashboard', tab: 'dashboard', render: () => DashboardView?.render('main-content') },
            { id: 'nav-trips', tab: 'trips', render: () => TripsView?.render('main-content') },
            { id: 'nav-dutyslip', tab: 'dutyslip', render: () => DutySlipView?.render('main-content') },
            { id: 'nav-billing', tab: 'billing', render: () => BillingView?.render('main-content') },
            { id: 'nav-daybook', tab: 'daybook', render: () => DaybookView?.render('main-content') },
            { id: 'nav-reports', tab: 'reports', render: () => ReportsView?.render('main-content') },
            { id: 'nav-settings', tab: 'settings', render: () => SettingsView?.render('main-content') }
        ];

        navItems.forEach(item => {
            const el = document.getElementById(item.id);
            if (el) {
                el.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.navigateTo(item.tab, item.render);
                });
            }
        });
    },

    navigateTo: function(tabName, renderCallback) {
        this.currentTab = tabName;

        // Highlight active nav item if applicable
        document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
        const activeNav = document.getElementById(`nav-${tabName}`);
        if (activeNav) activeNav.classList.add('active');

        // Render appropriate view based on tab
        const container = document.getElementById('main-content');
        if (!container) return;

        container.innerHTML = '';

        switch (tabName) {
            -case 'dashboard':
                if (window.DashboardView) DashboardView.render('main-content');
                else container.innerHTML = `<div class="vault-card text-center text-slate-400 py-10">Dashboard View Loading...</div>`;
                break;
            case 'trips':
                if (window.TripsView) TripsView.render('main-content');
                break;
            case 'dutyslip':
                if (window.DutySlipView) DutySlipView.render('main-content');
                break;
            case 'billing':
                if (window.BillingView) BillingView.render('main-content');
                break;
            case 'daybook':
                if (window.DaybookView) DaybookView.render('main-content');
                break;
            case 'reports':
                if (window.ReportsView) ReportsView.render('main-content');
                break;
            case 'settings':
                if (window.SettingsView) SettingsView.render('main-content');
                break;
            default:
                container.innerHTML = `<div class="vault-card text-center text-slate-400 py-10">Module not found.</div>`;
        }
    }
};
