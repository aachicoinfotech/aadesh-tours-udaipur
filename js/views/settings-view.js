// js/views/settings-view.js
// Aadesh Tours Udaipur - Business Profile, Logo, UPI & Settings Master

import { db } from "../config/firebase-config.js";
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const DEFAULT_PROFILE = {
  businessName: "Aadesh Tours Udaipur",
  tagline: "Fleet & Luxury Taxi Services",
  ownerName: "Owner",
  phone: "9876543210",
  altPhone: "",
  email: "aadeshtours@gmail.com",
  address: "Udaipur, Rajasthan - 313001",
  gstin: "",
  upiId: "aadesh@upi",
  logoUrl: "",
  termsAndConditions: "1. Toll, parking and state tax extra as applicable.\n2. Minimum billing 250 KM/Day.\n3. AC will be switched off on hilly roads."
};

/**
 * Fetch profile data (from LocalStorage first, then Firestore)
 */
export async function getBusinessProfile() {
  try {
    const cached = localStorage.getItem("aadesh_business_profile");
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (e) {
    // Ignore cache error
  }

  try {
    const docRef = doc(db, "settings", "business_profile");
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = { ...DEFAULT_PROFILE, ...snap.data() };
      localStorage.setItem("aadesh_business_profile", JSON.stringify(data));
      return data;
    }
  } catch (err) {
    console.warn("Could not load profile from Firestore:", err);
  }

  return DEFAULT_PROFILE;
}

/**
 * 1. Render Complete Settings / Business Profile View
 * @param {HTMLElement} containerEl - Target element (#tab-settings or modal)
 */
export async function renderSettingsView(containerEl) {
  const profile = await getBusinessProfile();

  containerEl.innerHTML = `
    <div class="max-w-3xl mx-auto space-y-4">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-xl font-black text-white tracking-wide">बिजनेस प्रोफाइल व सेटिंग्स</h2>
          <p class="text-xs text-slate-400">बिल, पर्ची और QR कोड पर दिखने वाली फर्म की जानकारी अपडेट करें।</p>
        </div>
      </div>

      <form id="form-business-profile" class="space-y-4 text-xs">
        <!-- 1. Business Branding & Logo -->
        <div class="vault-card space-y-3">
          <span class="text-amber-400 font-bold block uppercase tracking-wider text-[11px]">1. फर्म का नाम व लोगो (Branding)</span>
          
          <div class="flex flex-col sm:flex-row items-center gap-4 p-3 bg-slate-950/60 rounded-xl border border-slate-800">
            <div class="w-24 h-24 rounded-2xl bg-slate-800 border-2 border-dashed border-slate-700 flex items-center justify-center overflow-hidden flex-shrink-0 relative group">
              <img id="logo-preview-img" src="${profile.logoUrl || ''}" alt="Logo" class="${profile.logoUrl ? '' : 'hidden'} w-full h-full object-cover">
              <span id="logo-placeholder" class="${profile.logoUrl ? 'hidden' : ''} text-[11px] text-slate-500 text-center px-1">लोगो नहीं है</span>
            </div>
            <div class="space-y-2 flex-1 w-full">
              <label class="form-label">लोगो इमेज (Logo Upload)</label>
              <input type="file" id="logo-file-input" accept="image/*" class="form-input text-xs py-1.5 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-amber-500 file:text-slate-950 file:font-bold cursor-pointer">
              <p class="text-[10px] text-slate-400">PNG या JPG फोटो चुनें। यह बिल, thermal पर्ची और PDF में सबसे ऊपर छपेगा।</p>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="form-label">फर्म / ट्रेवल्स का नाम *</label>
              <input type="text" id="prof-biz-name" class="form-input font-bold text-white text-sm" value="${profile.businessName}" required>
            </div>
            <div>
              <label class="form-label">टैगलाइन / उप-नाम</label>
              <input type="text" id="prof-tagline" class="form-input" value="${profile.tagline}">
            </div>
          </div>
        </div>

        <!-- 2. Contact & Address -->
        <div class="vault-card space-y-3">
          <span class="text-amber-400 font-bold block uppercase tracking-wider text-[11px]">2. संपर्क सूत्र व ऑफिस पता</span>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label class="form-label">संचालक / मालिक का नाम</label>
              <input type="text" id="prof-owner-name" class="form-input" value="${profile.ownerName}">
            </div>
            <div>
              <label class="form-label">मुख्य मोबाइल नंबर *</label>
              <input type="tel" id="prof-phone" class="form-input font-mono font-bold text-emerald-400" value="${profile.phone}" required>
            </div>
            <div>
              <label class="form-label">व्हाट्सएप / अन्य नंबर</label>
              <input type="tel" id="prof-alt-phone" class="form-input font-mono" value="${profile.altPhone}">
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="form-label">ऑफिस का पूरा पता (बिल प्रिंट हेतु) *</label>
              <textarea id="prof-address" class="form-input h-16 resize-none" required>${profile.address}</textarea>
            </div>
            <div>
              <label class="form-label">ईमेल (Email ID)</label>
              <input type="email" id="prof-email" class="form-input" value="${profile.email}">
            </div>
          </div>
        </div>

        <!-- 3. GST & Online Payment UPI (Dynamic QR Code) -->
        <div class="vault-card space-y-3 border-l-4 border-l-amber-500">
          <span class="text-amber-400 font-bold block uppercase tracking-wider text-[11px]">3. पेमेंट UPI व टैक्स विवरण (GST / UPI QR)</span>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="form-label">UPI ID (PhonePe / GPay / Paytm ID) *</label>
              <input type="text" id="prof-upi-id" class="form-input font-mono font-bold text-amber-400" placeholder="yourname@upi" value="${profile.upiId}" required>
              <p class="text-[10px] text-slate-400 mt-1">थर्मल पर्ची और बिल पर इसी UPI का बारकोड (QR Code) छपेगा ताकि ग्राहक स्कैन करके पैसे दे सके।</p>
            </div>
            <div>
              <label class="form-label">GSTIN नंबर (यदि लागू हो)</label>
              <input type="text" id="prof-gstin" class="form-input font-mono uppercase" placeholder="08AAAAA0000A1Z5" value="${profile.gstin}">
            </div>
          </div>

          <div>
            <label class="form-label">बिल के नियम व शर्तें (Terms & Conditions)</label>
            <textarea id="prof-terms" class="form-input h-16 resize-none">${profile.termsAndConditions}</textarea>
          </div>
        </div>

        <!-- 4. Security PIN Change -->
        <div class="vault-card space-y-3">
          <span class="text-amber-400 font-bold block uppercase tracking-wider text-[11px]">4. ऐप सुरक्षा पिन बदलें (Change Master PIN)</span>
          
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="form-label">नया 4-अंकों का PIN</label>
              <input type="password" id="prof-new-pin" maxlength="4" class="form-input font-mono tracking-widest text-center text-sm" placeholder="उदा. 2727">
            </div>
            <div>
              <label class="form-label">PIN की पुनः पुष्टि करें (Confirm PIN)</label>
              <input type="password" id="prof-confirm-pin" maxlength="4" class="form-input font-mono tracking-widest text-center text-sm" placeholder="उदा. 2727">
            </div>
          </div>
          <p class="text-[10px] text-slate-500">पिन खाली छोड़ने पर आपका मौजूदा पिन यथावत रहेगा।</p>
        </div>

        <!-- Submit Button -->
        <div class="pt-2">
          <button type="submit" id="btn-save-profile" class="btn btn-primary w-full py-3 text-sm font-bold shadow-lg shadow-amber-500/20">
            प्रोफाइल व सेटिंग्स सुरक्षित करें (Save Profile)
          </button>
        </div>
      </form>
    </div>
  `;

  bindSettingsEvents(containerEl, profile);
}

/**
 * 2. Event Handlers for Logo, Image compression & Firestore saving
 */
function bindSettingsEvents(containerEl, currentProfile) {
  let logoBase64 = currentProfile.logoUrl || "";

  // Logo file selection and image conversion
  const fileInput = containerEl.querySelector("#logo-file-input");
  const logoImg = containerEl.querySelector("#logo-preview-img");
  const logoPlaceholder = containerEl.querySelector("#logo-placeholder");

  if (fileInput) {
    fileInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) {
        if (file.size > 2 * 1024 * 1024) {
          alert("लोगो फाइल 2MB से कम साइज की होनी चाहिए।");
          return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
          logoBase64 = event.target.result;
          logoImg.src = logoBase64;
          logoImg.classList.remove("hidden");
          logoPlaceholder.classList.add("hidden");
        };
        reader.readAsDataURL(file);
      }
    });
  }

  // Form submission handler
  const form = containerEl.querySelector("#form-business-profile");
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const btnSave = containerEl.querySelector("#btn-save-profile");
      btnSave.disabled = true;
      btnSave.textContent = "सहेज रहे हैं...";

      const newPin = containerEl.querySelector("#prof-new-pin").value.trim();
      const confirmPin = containerEl.querySelector("#prof-confirm-pin").value.trim();

      if (newPin) {
        if (newPin.length !== 4 || isNaN(newPin)) {
          alert("पिन केवल 4 अंकों की संख्या होनी चाहिए!");
          btnSave.disabled = false;
          btnSave.textContent = "प्रोफाइल व सेटिंग्स सुरक्षित करें (Save Profile)";
          return;
        }
        if (newPin !== confirmPin) {
          alert("दोनों पिन एक जैसे नहीं हैं। कृपया पुनः चेक करें!");
          btnSave.disabled = false;
          btnSave.textContent = "प्रोफाइल व सेटिंग्स सुरक्षित करें (Save Profile)";
          return;
        }

        // Update Master PIN in localStorage
        try {
          const enc = new TextEncoder();
          const hashBuffer = await crypto.subtle.digest("SHA-256", enc.encode(newPin));
          const hashArray = Array.from(new Uint8Array(hashBuffer));
          const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
          localStorage.setItem("aadesh_vault_pin_hash", hashHex);
          localStorage.setItem("aadesh_vault_pin", newPin);
        } catch (pinErr) {
          localStorage.setItem("aadesh_vault_pin", newPin);
        }
      }

      const updatedData = {
        businessName: containerEl.querySelector("#prof-biz-name").value.trim(),
        tagline: containerEl.querySelector("#prof-tagline").value.trim(),
        ownerName: containerEl.querySelector("#prof-owner-name").value.trim(),
        phone: containerEl.querySelector("#prof-phone").value.trim(),
        altPhone: containerEl.querySelector("#prof-alt-phone").value.trim(),
        address: containerEl.querySelector("#prof-address").value.trim(),
        email: containerEl.querySelector("#prof-email").value.trim(),
        upiId: containerEl.querySelector("#prof-upi-id").value.trim(),
        gstin: containerEl.querySelector("#prof-gstin").value.trim().toUpperCase(),
        termsAndConditions: containerEl.querySelector("#prof-terms").value.trim(),
        logoUrl: logoBase64,
        updatedAt: new Date().toISOString()
      };

      try {
        // 1. Save to LocalStorage for instant offline availability
        localStorage.setItem("aadesh_business_profile", JSON.stringify(updatedData));

        // 2. Sync to Firebase Firestore
        const docRef = doc(db, "settings", "business_profile");
        await setDoc(docRef, updatedData, { merge: true });

        alert("प्रोफाइल और सेटिंग्स सफलतापूर्वक सुरक्षित हो गईं!");
        renderSettingsView(containerEl);
      } catch (err) {
        alert("सेटिंग्स सेव करने में त्रुटि: " + err.message);
      } finally {
        btnSave.disabled = false;
        btnSave.textContent = "प्रोफाइल व सेटिंग्स सुरक्षित करें (Save Profile)";
      }
    });
  }
}
