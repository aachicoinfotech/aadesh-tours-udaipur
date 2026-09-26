// js/config/constants.js
// Aadesh Tours Udaipur - System Rates, Defaults & Slabs (Phase 2)

// 1. Database Collections (डेटाबेस के पन्नों के नाम)
export const COLLECTIONS = {
  COMPANY: 'company_profile',
  FLEET: 'fleet_vehicles',
  DRIVERS: 'drivers',
  VENDORS: 'vendors',
  TRIPS: 'trips',
  GALLA: 'daily_cashflow',
  EXPENSES: 'expenses',
  CUSTOMERS: 'customers'
};

// 2. Vehicle Categories & Standard Udaipur Market Rates
export const VEHICLE_TYPES = {
  SEDAN: {
    id: 'sedan',
    label: 'Sedan (Dzire / Etios / Aura)',
    minKmPerDay: 250,
    defaultPerKmRate: 11,
    driverAllowancePerDay: 300,
    nightCharge: 250
  },
  SUV_ERTIGA: {
    id: 'suv_ertiga',
    label: 'SUV (Ertiga / Rumion)',
    minKmPerDay: 250,
    defaultPerKmRate: 14,
    driverAllowancePerDay: 350,
    nightCharge: 300
  },
  SUV_CRYSTA: {
    id: 'suv_crysta',
    label: 'Premium SUV (Innova Crysta / Hycross)',
    minKmPerDay: 300,
    defaultPerKmRate: 19,
    driverAllowancePerDay: 400,
    nightCharge: 350
  },
  TEMPO_TRAVELLER: {
    id: 'tempo_traveller',
    label: 'Tempo Traveller (12 / 17 Seater)',
    minKmPerDay: 300,
    defaultPerKmRate: 24,
    driverAllowancePerDay: 500,
    nightCharge: 400
  }
};

// 3. Local Udaipur Tour Packages (फिक्स पैकेज)
export const LOCAL_PACKAGES = {
  AIRPORT_TRANSFER: {
    id: 'pkg_airport',
    label: 'Airport Drop / Pick (Dabok Airport)',
    defaultSedan: 900,
    defaultErtiga: 1400,
    defaultCrysta: 2000
  },
  HALF_DAY: {
    id: 'pkg_4hr_40km',
    label: 'Local Sightseeing (4 Hours / 40 KM)',
    extraKmRate: 12,
    extraHourRate: 150
  },
  FULL_DAY: {
    id: 'pkg_8hr_80km',
    label: 'Local Sightseeing (8 Hours / 80 KM)',
    extraKmRate: 12,
    extraHourRate: 150
  },
  FULL_DAY_EXTENDED: {
    id: 'pkg_12hr_120km',
    label: 'Kumbhalgarh / Haldi Ghati Special (12 Hours / 120 KM)',
    extraKmRate: 12,
    extraHourRate: 150
  }
};

// 4. GST Settings
export const TAX_CONFIG = {
  GST_EXEMPT: 0,
  GST_TOUR_RCM: 5,   // 5% Standard Tour & Travel GST
  GST_REGULAR: 12    // 12% with ITC
};

// 5. Daily Galla Categories (गल्ले की आवक-जावक)
export const CASHFLOW_CATEGORIES = {
  TRIP_ADVANCE: 'Customer Advance Cash',
  TRIP_SETTLEMENT: 'Customer Final Cash',
  FUEL_EXPENSE: 'Diesel / Petrol Expense',
  TOLL_PARKING: 'Fastag / Toll / Parking',
  DRIVER_BHATTA: 'Driver Bhatta / Khuraki',
  VEHICLE_MAINTENANCE: 'Garage / Service / Tyre',
  OFFICE_EXPENSE: 'Office / Chai / Miscellaneous',
  OWNER_WITHDRAWAL: 'Owner Personal Withdrawal'
};

// 6. 8 Supported Export Formats
export const EXPORT_FORMATS = {
  PDF: 'pdf',
  EXCEL: 'xlsx',
  CSV: 'csv',
  WORD: 'docx',
  JSON: 'json',
  XML: 'xml',
  TXT: 'txt',
  PRINT: 'print'
};
