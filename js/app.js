// js/app.js - Aadesh Tours Udaipur - Fleet OS Main Router & App Controller

import { DashboardView } from './views/dashboard-view.js';
import { FleetView } from './views/fleet-view.js';
import { TripsView } from './views/trips-view.js';
import { BillingView } from './views/billing-view.js';
import { SettingsView } from './views/settings-view.js';

document.addEventListener('DOMContentLoaded', () => {
    // 1. PIN Lock verification handle karein
    setupPinLock();

    // 2. Navigation Tab Listeners setup karein
    setupTabs();
});

function setupPinLock() {
    const pinScreen = document.getElementById('pin-screen');
    const mainApp = document.getElementById('main-app');
    
    // Check if already unlocked in session
    const isUnlocked = sessionStorage.getItem('aadesh_unlocked');
    if (isUnlocked === 'true') {
        pinScreen.classList.add('hidden');
        mainApp.classList.remove('hidden');
        initApp();
    } else {
        // Pin handling logic (Default pin: 2727)
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
                        pinScreen.classList.add('hidden');
                        mainApp.classList.remove('hidden');
                        initApp();
                    } else {
                        errorMsg.textContent = 'गलत पिन! (डिफ़ॉल्ट: 2727)';
                        enteredPin = '';
                        updateDots(dots, 0);
                    }
                }
            });
        });

        document.getElementById('pin-clear').addEventListener('click', () => {
            enteredPin = '';
            updateDots(dots, 0);
            errorMsg.textContent = '';
        });

        document.getElementById('pin-backspace').addEventListener('click', () => {
            enteredPin = enteredPin.slice(0, -1);
            updateDots(dots, enteredPin.length);
        });
    }
}

function updateDots(dots, count) {
    dots.forEach((dot, idx) => {
        if (idx < count) {
            dot.classList.add('bg-amber-400', 'border-amber-400');
        } else {
            dot.classList.remove('bg-amber-400', 'border-amber-400');
        }
    });
}

function initApp() {
    // Default load Dashboard
    const dashPane = document.getElementById('tab-dashboard');
    if (dashPane && DashboardView && typeof DashboardView.render === 'function') {
        DashboardView.render(dashPane);
    }
    
    // Live galla update check
    updateLiveGalla();
}

function setupTabs() {
    const tabButtons = document.querySelectorAll('.nav-tab-btn');
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTabId = btn.getAttribute('data-tab');

            // Hide all tab panes
            document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.add('hidden'));
            
            // Show target pane
            const targetPane = document.getElementById(targetTabId);
            if (targetPane) {
                targetPane.classList.remove('hidden');
                
                // Trigger render based on selected tab
                if (targetTabId === 'tab-dashboard' && DashboardView) DashboardView.render(targetPane);
                if (targetTabId === 'tab-fleet' && FleetView) FleetView.render(targetPane);
                if (targetTabId === 'tab-trips' && TripsView) TripsView.render(targetPane);
                if (targetTabId === 'tab-billing' && BillingView) BillingView.render(targetPane);
                if (targetTabId === 'tab-settings' && SettingsView) SettingsView.render(targetPane);
            }

            // Update active states on nav buttons
            tabButtons.forEach(b => {
                b.classList.remove('text-amber-400');
                b.classList.add('text-slate-400');
            });
            btn.classList.remove('text-slate-400');
            btn.classList.add('text-amber-400');
        });
    });

    // Lock App button
    const lockBtn = document.getElementById('btn-lock-app');
    if (lockBtn) {
        lockBtn.addEventListener('click', () => {
            sessionStorage.removeItem('aadesh_unlocked');
            window.location.reload();
        });
    }
}

function updateLiveGalla() {
    const galla = JSON.parse(localStorage.getItem('aadesh_galla') || '{"cashIn": 0, "cashOut": 0}');
    const netGalla = (galla.cashIn || 0) - (galla.cashOut || 0);
    const gallaElem = document.getElementById('header-galla-amount');
    if (gallaElem) {
        gallaElem.textContent = `₹${netGalla}`;
    }
}
