// js/app.js
// Aadesh Tours Udaipur - Master Bootstrap & Lifecycle Controller

import { renderDashboard } from "./views/dashboard-view.js";
import { renderFleetView } from "./views/fleet-view.js";
import { renderTripsView } from "./views/trips-view.js";
import { renderBillingView } from "./views/billing-view.js";
import { renderSettingsView, getMasterSettings } from "./views/settings-view.js";

// 1. PIN Security & Lock Management
let enteredPin = "";

function initPinLock() {
  const pinDots = document.querySelectorAll(".pin-dot");
  const errorMsg = document.getElementById("pin-error-msg");
  const pinScreen = document.getElementById("pin-screen");
  const mainApp = document.getElementById("main-app");

  const updateDots = () => {
    pinDots.forEach((dot, idx) => {
      if (idx < enteredPin.length) {
        dot.classList.add("bg-amber-400", "border-amber-400");
        dot.classList.remove("bg-transparent", "border-slate-700");
      } else {
        dot.classList.remove("bg-amber-400", "border-amber-400");
        dot.classList.add("bg-transparent", "border-slate-700");
      }
    });
  };

  const verifyPin = () => {
    const savedPin = localStorage.getItem("aadesh_vault_pin") || "2727";
    if (enteredPin === savedPin) {
      pinScreen.classList.add("hidden");
      mainApp.classList.remove("hidden");
      enteredPin = "";
      updateDots();
      errorMsg.textContent = "";
      // Initialize First Tab
      switchTab("tab-dashboard");
    } else {
      errorMsg.textContent = "गलत पिन! कृपया पुनः प्रयास करें।";
      enteredPin = "";
      updateDots();
      navigator.vibrate?.([100, 50, 100]);
    }
  };

  document.querySelectorAll(".pin-key").forEach(btn => {
    btn.addEventListener("click", () => {
      if (enteredPin.length < 4) {
        enteredPin += btn.dataset.val;
        updateDots();
        if (enteredPin.length === 4) {
          setTimeout(verifyPin, 150);
        }
      }
    });
  });

  document.getElementById("pin-clear")?.addEventListener("click", () => {
    enteredPin = "";
    errorMsg.textContent = "";
    updateDots();
  });

  document.getElementById("pin-backspace")?.addEventListener("click", () => {
    enteredPin = enteredPin.slice(0, -1);
    errorMsg.textContent = "";
    updateDots();
  });

  // Lock App Action
  document.getElementById("btn-lock-app")?.addEventListener("click", () => {
    mainApp.classList.add("hidden");
    pinScreen.classList.remove("hidden");
    enteredPin = "";
    updateDots();
  });
}

// 2. Tab Navigation Router
export function switchTab(tabId) {
  const panes = document.querySelectorAll(".tab-pane");
  const navBtns = document.querySelectorAll(".nav-tab-btn");

  panes.forEach(p => p.classList.add("hidden"));
  navBtns.forEach(b => {
    if (b.dataset.tab === tabId) {
      b.classList.remove("text-slate-400");
      b.classList.add("text-amber-400");
    } else {
      b.classList.remove("text-amber-400");
      b.classList.add("text-slate-400");
    }
  });

  const activePane = document.getElementById(tabId);
  if (activePane) {
    activePane.classList.remove("hidden");
    
    // Render Corresponding View
    if (tabId === "tab-dashboard") renderDashboard(activePane, switchTab);
    else if (tabId === "tab-fleet") renderFleetView(activePane, switchTab);
    else if (tabId === "tab-trips") renderTripsView(activePane, switchTab);
    else if (tabId === "tab-billing") renderBillingView(activePane, switchTab);
    else if (tabId === "tab-settings") renderSettingsView(activePane, switchTab);
  }
}

// 3. Language Toggle (Hindi / English)
function initLanguageToggle() {
  const langBtn = document.getElementById("btn-toggle-lang");
  let currentLang = localStorage.getItem("aadesh_lang") || "hi";
  
  if (langBtn) {
    langBtn.textContent = currentLang === "hi" ? "EN" : "हिं";
    langBtn.addEventListener("click", () => {
      currentLang = currentLang === "hi" ? "en" : "hi";
      localStorage.setItem("aadesh_lang", currentLang);
      langBtn.textContent = currentLang === "hi" ? "EN" : "हिं";
      // Refresh current tab view
      const activeBtn = document.querySelector(".nav-tab-btn.text-amber-400");
      if (activeBtn) switchTab(activeBtn.dataset.tab);
    });
  }
}

// 4. Update Header with Saved Business Name
async function applyBranding() {
  try {
    const cfg = await getMasterSettings();
    const titleEl = document.getElementById("header-biz-title");
    if (titleEl && cfg.businessName) {
      titleEl.textContent = cfg.businessName.toUpperCase();
    }
  } catch (e) {
    console.warn("Branding load:", e);
  }
}

// 5. PWA Service Worker Registration
function registerPwa() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js")
      .then(reg => console.log("PWA Service Worker registered:", reg.scope))
      .catch(err => console.warn("PWA SW registration failed:", err));
  }
}

// Application Init
document.addEventListener("DOMContentLoaded", () => {
  initPinLock();
  initLanguageToggle();
  applyBranding();
  registerPwa();

  // Bottom Nav Clicks
  document.querySelectorAll(".nav-tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      switchTab(btn.dataset.tab);
    });
  });
});
