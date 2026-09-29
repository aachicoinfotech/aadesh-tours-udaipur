// js/app.js
// Aadesh Tours Udaipur - Crash-Proof Master Bootstrap Controller

let enteredPin = "";

// 1. PIN Security & Keypad (Supports Mouse Click + Mobile Touch + Physical Keyboard)
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
    // Always allow 2727 as master PIN bypass
    if (enteredPin === savedPin || enteredPin === "2727") {
      if (pinScreen) pinScreen.classList.add("hidden");
      if (mainApp) mainApp.classList.remove("hidden");
      enteredPin = "";
      updateDots();
      if (errorMsg) errorMsg.textContent = "";
      switchTab("tab-dashboard");
    } else {
      if (errorMsg) errorMsg.textContent = "गलत पिन! (डिफ़ॉल्ट पिन: 2727)";
      enteredPin = "";
      updateDots();
      if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
    }
  };

  const handleInputDigit = (digit) => {
    if (enteredPin.length < 4) {
      enteredPin += digit;
      updateDots();
      if (enteredPin.length === 4) {
        setTimeout(verifyPin, 100);
      }
    }
  };

  // Screen Keypad Click Listener
  document.querySelectorAll(".pin-key").forEach(btn => {
    btn.onclick = (e) => {
      e.preventDefault();
      handleInputDigit(btn.dataset.val);
    };
  });

  const clearBtn = document.getElementById("pin-clear");
  if (clearBtn) {
    clearBtn.onclick = (e) => {
      e.preventDefault();
      enteredPin = "";
      if (errorMsg) errorMsg.textContent = "";
      updateDots();
    };
  }

  const backspaceBtn = document.getElementById("pin-backspace");
  if (backspaceBtn) {
    backspaceBtn.onclick = (e) => {
      e.preventDefault();
      enteredPin = enteredPin.slice(0, -1);
      if (errorMsg) errorMsg.textContent = "";
      updateDots();
    };
  }

  // Physical Keyboard Support (Numbers 0-9, Backspace, Enter)
  window.addEventListener("keydown", (e) => {
    if (pinScreen && !pinScreen.classList.contains("hidden")) {
      if (e.key >= "0" && e.key <= "9") {
        handleInputDigit(e.key);
      } else if (e.key === "Backspace") {
        enteredPin = enteredPin.slice(0, -1);
        if (errorMsg) errorMsg.textContent = "";
        updateDots();
      } else if (e.key === "Escape") {
        enteredPin = "";
        if (errorMsg) errorMsg.textContent = "";
        updateDots();
      }
    }
  });

  // Lock App Action
  document.getElementById("btn-lock-app")?.addEventListener("click", () => {
    if (mainApp) mainApp.classList.add("hidden");
    if (pinScreen) pinScreen.classList.remove("hidden");
    enteredPin = "";
    updateDots();
  });
}

// 2. Safe Dynamic Tab Router (Never crashes if any view file is missing)
export async function switchTab(tabId) {
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
  if (!activePane) return;

  activePane.classList.remove("hidden");

  // Dynamic import prevents whole app from crashing if any one module fails
  try {
    if (tabId === "tab-dashboard") {
      const mod = await import("./views/dashboard-view.js");
      if (mod.renderDashboard) mod.renderDashboard(activePane, switchTab);
    } else if (tabId === "tab-fleet") {
      const mod = await import("./views/fleet-view.js");
      if (mod.renderFleetView) mod.renderFleetView(activePane, switchTab);
    } else if (tabId === "tab-trips") {
      const mod = await import("./views/trips-view.js");
      if (mod.renderTripsView) mod.renderTripsView(activePane, switchTab);
    } else if (tabId === "tab-billing") {
      const mod = await import("./views/billing-view.js");
      if (mod.renderBillingView) mod.renderBillingView(activePane, switchTab);
    } else if (tabId === "tab-settings") {
      const mod = await import("./views/settings-view.js");
      if (mod.renderSettingsView) mod.renderSettingsView(activePane, switchTab);
    }
  } catch (err) {
    console.error(`Error loading ${tabId}:`, err);
    activePane.innerHTML = `
      <div class="vault-card text-center p-6 space-y-2 border-rose-500/40">
        <div class="text-rose-400 font-bold text-sm">स्क्रीन लोड करने में तकनीकी समस्या आई</div>
        <p class="text-slate-400 text-xs">${err.message}</p>
        <button onclick="location.reload()" class="btn btn-secondary text-xs py-1.5 px-3 mt-2">पेज रीलोड करें</button>
      </div>
    `;
  }
}

// 3. Language Toggle (Hindi / English)
function initLanguageToggle() {
  const langBtn = document.getElementById("btn-toggle-lang");
  let currentLang = localStorage.getItem("aadesh_lang") || "hi";

  if (langBtn) {
    langBtn.textContent = currentLang === "hi" ? "EN" : "हिं";
    langBtn.onclick = () => {
      currentLang = currentLang === "hi" ? "en" : "hi";
      localStorage.setItem("aadesh_lang", currentLang);
      langBtn.textContent = currentLang === "hi" ? "EN" : "हिं";
      const activeBtn = document.querySelector(".nav-tab-btn.text-amber-400");
      if (activeBtn) switchTab(activeBtn.dataset.tab);
    };
  }
}

// 4. Update Header with Saved Business Name
function applyBranding() {
  try {
    const cached = localStorage.getItem("aadesh_master_settings") || localStorage.getItem("aadesh_business_profile");
    if (cached) {
      const cfg = JSON.parse(cached);
      const titleEl = document.getElementById("header-biz-title");
      if (titleEl && cfg.businessName) {
        titleEl.textContent = cfg.businessName.toUpperCase();
      }
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

// 6. Safe App Initialization
function initApp() {
  initPinLock();
  initLanguageToggle();
  applyBranding();
  registerPwa();

  // Bottom Navigation Clicks
  document.querySelectorAll(".nav-tab-btn").forEach(btn => {
    btn.onclick = () => {
      switchTab(btn.dataset.tab);
    };
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initApp);
} else {
  initApp();
      }
