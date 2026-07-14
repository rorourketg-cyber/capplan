// ============================================================================
// CapPlan MACRS Data Layer
// Source: IRS Revenue Procedure 87-57, IRS Publication 946 (Appendix A, Table A-1)
// Last verified: June 2026
// These percentage tables are fixed by Rev. Proc. 87-57 and have not changed
// since 1987. What changes periodically is tax policy layered on top (bonus
// depreciation, Section 179 limits) — handled separately below.
// ============================================================================

// ── GDS MACRS PERCENTAGE TABLES (Half-Year Convention) ──────────────────────
// Each array entry is [year, percentage] for years 1 through N+1
// (the half-year convention creates one extra recovery year for all classes)
// Source: IRS Publication 946, Appendix A, Table A-1

var MACRS_TABLES = {
  "3-year": {
    label: "3-Year Property (200% DB)",
    method: "200% Declining Balance",
    examples: "Tractor units (over-the-road), qualified rent-to-own property",
    rates: [33.33, 44.45, 14.81, 7.41]  // 4 rows: years 1-3 + half-year tail
  },
  "5-year": {
    label: "5-Year Property (200% DB)",
    method: "200% Declining Balance",
    examples: "Automobiles, taxis, buses, trucks, computers, office machinery, appliances",
    rates: [20.00, 32.00, 19.20, 11.52, 11.52, 5.76]  // 6 rows
  },
  "7-year": {
    label: "7-Year Property (200% DB)",
    method: "200% Declining Balance",
    examples: "Office furniture & fixtures, agricultural machinery, railroad track",
    rates: [14.29, 24.49, 17.49, 12.49, 8.93, 8.92, 8.93, 4.46]  // 8 rows
  },
  "10-year": {
    label: "10-Year Property (200% DB)",
    method: "200% Declining Balance",
    examples: "Vessels, barges, tugs, single-purpose agricultural structures, fruit/nut trees",
    rates: [10.00, 18.00, 14.40, 11.52, 9.22, 7.37, 6.55, 6.55, 6.56, 6.55, 3.28]  // 11 rows
  },
  "15-year": {
    label: "15-Year Property (150% DB)",
    method: "150% Declining Balance",
    examples: "Land improvements (fences, roads, sidewalks, landscaping), qualified leasehold improvements, retail motor fuels outlets",
    rates: [5.00, 9.50, 8.55, 7.70, 6.93, 6.23, 5.90, 5.90, 5.91, 5.90, 5.91, 5.90, 5.91, 5.90, 5.91, 2.95]  // 16 rows
  },
  "20-year": {
    label: "20-Year Property (150% DB)",
    method: "150% Declining Balance",
    examples: "Farm buildings (not single-purpose), municipal sewers, initial land clearing/grading",
    rates: [3.750, 7.219, 6.677, 6.177, 5.713, 5.285, 4.888, 4.522, 4.462, 4.461,
            4.462, 4.461, 4.462, 4.461, 4.462, 4.461, 4.462, 4.461, 4.462, 4.461, 2.231]  // 21 rows
  },
  "27.5-year": {
    label: "27.5-Year Residential Rental Property (SL)",
    method: "Straight-Line / Mid-Month Convention",
    examples: "Residential rental property (apartments, houses) where 80%+ of income is from dwelling units",
    // Full-year rate = 3.636%. First/last year prorated by month placed in service.
    // For simplicity in capital planning (not tax filing), use the full-year rate.
    fullYearRate: 3.636,
    convention: "mid-month",
    rates: null  // computed dynamically based on month placed in service
  },
  "39-year": {
    label: "39-Year Nonresidential Real Property (SL)",
    method: "Straight-Line / Mid-Month Convention",
    examples: "Office buildings, stores, warehouses, commercial buildings",
    fullYearRate: 2.564,
    convention: "mid-month",
    rates: null  // computed dynamically based on month placed in service
  }
};

// ── ASSET-TO-PROPERTY-CLASS LOOKUP ─────────────────────────────────────────
// Based on IRS Publication 946, Table B-1 and Table B-2
// Grouped by common small business asset categories for the dropdown
// Users can always override; this is a starting-point suggestion only.
// Last updated: June 2026

var MACRS_ASSET_CLASSES = [
  // ── Vehicles & Transportation ──────────────────────────────────────────────
  { name: "— Select asset type for suggested property class —", class: null, note: null },
  { group: "Vehicles & Transportation" },
  { name: "Automobile / Passenger Car", class: "5-year",
    note: "IRS Table B-1 class 00.22. Subject to listed property luxury auto limits." },
  { name: "Light-Duty Truck / Van (≤ 6,000 lbs GVW)", class: "5-year",
    note: "IRS Table B-1 class 00.22. Subject to listed property limits." },
  { name: "Heavy Truck / Commercial Vehicle (> 6,000 lbs)", class: "5-year",
    note: "IRS Table B-1 class 00.23. Not subject to luxury auto limits." },
  { name: "Tractor Unit (over-the-road)", class: "3-year",
    note: "IRS Table B-1 class 00.26." },
  { name: "Trailer / Container", class: "5-year",
    note: "IRS Table B-1 class 00.27." },
  { name: "Aircraft (general aviation)", class: "5-year",
    note: "IRS Table B-2. May be listed property if personal use > 0." },
  { name: "Vessel / Barge / Tug", class: "10-year",
    note: "IRS Table B-1 class 00.28." },
  // ── Computers & Technology ─────────────────────────────────────────────────
  { group: "Computers & Technology" },
  { name: "Computer / Laptop / Tablet", class: "5-year",
    note: "IRS Table B-1 class 00.12. Listed property — business use must be > 50%." },
  { name: "Computer Peripheral / Printer", class: "5-year",
    note: "IRS Table B-1 class 00.12." },
  { name: "Point-of-Sale System / POS Hardware", class: "5-year",
    note: "IRS Table B-1 class 00.12." },
  { name: "Telephone / Communications Equipment", class: "5-year",
    note: "IRS class 00.12. Cell phones no longer listed property after 2010." },
  // ── Office Equipment & Furniture ───────────────────────────────────────────
  { group: "Office Equipment & Furniture" },
  { name: "Office Furniture & Fixtures", class: "7-year",
    note: "IRS Table B-1 class 00.11." },
  { name: "Office Equipment (copiers, fax machines)", class: "5-year",
    note: "IRS Table B-1 class 00.12." },
  { name: "Appliances / Carpeting / Furniture (rental)", class: "5-year",
    note: "Used in residential rental property; IRS Table B-1." },
  // ── Manufacturing & Industrial ─────────────────────────────────────────────
  { group: "Manufacturing & Industrial" },
  { name: "Manufacturing Machinery & Equipment", class: "7-year",
    note: "IRS Table B-2 (varies by industry). 7-year is the default for unclassified property." },
  { name: "Industrial Steam / Electric Generation Equipment", class: "15-year",
    note: "IRS Table B-1 class 00.4." },
  { name: "Distributive Trades / Services Equipment", class: "5-year",
    note: "IRS Table B-2 class 57.0. Includes restaurant/food service equipment." },
  // ── Restaurant & Food Service ──────────────────────────────────────────────
  { group: "Restaurant & Food Service" },
  { name: "Restaurant Equipment (ovens, fryers, refrigerators)", class: "5-year",
    note: "IRS Table B-2 class 57.0 (distributive trades and services)." },
  { name: "Restaurant Furniture / Fixtures", class: "7-year",
    note: "IRS Table B-1 class 00.11. Chairs, tables, bar stools." },
  // ── Agriculture ────────────────────────────────────────────────────────────
  { group: "Agriculture" },
  { name: "Agricultural Machinery & Equipment", class: "7-year",
    note: "IRS Table B-2 class 01.1." },
  { name: "Single-Purpose Agricultural / Horticultural Structure", class: "10-year",
    note: "IRS Table B-1. Structure used only for a specific agricultural purpose." },
  { name: "Farm Building (general-purpose)", class: "20-year",
    note: "IRS Table B-2 class 01.3. Excludes single-purpose structures." },
  { name: "Fruit / Nut-Bearing Trees & Vines", class: "10-year",
    note: "IRS Table B-2 class 01.23–01.25. Placed in service after planting/grafting." },
  // ── Real Property ──────────────────────────────────────────────────────────
  { group: "Real Property" },
  { name: "Residential Rental Property", class: "27.5-year",
    note: "Apartments, houses, mobile homes where 80%+ of rent is from dwelling units. Straight-line, mid-month convention." },
  { name: "Nonresidential Real Property", class: "39-year",
    note: "Office buildings, retail stores, warehouses. Straight-line, mid-month convention." },
  { name: "Qualified Improvement Property (QIP)", class: "15-year",
    note: "Interior improvements to nonresidential buildings placed in service after building. Eligible for bonus depreciation." },
  { name: "Land Improvements (fences, roads, parking lots, landscaping)", class: "15-year",
    note: "IRS Table B-1 class 00.3. Excludes land itself (not depreciable)." },
  // ── HVAC & Mechanical ──────────────────────────────────────────────────────
  { group: "HVAC & Mechanical Systems" },
  { name: "HVAC System (standalone / not structural)", class: "5-year",
    note: "Freestanding units qualify as 5-year. HVAC installed as part of a building = 39-year. Qualified improvement property rules may apply." },
  { name: "HVAC as Qualified Improvement Property", class: "15-year",
    note: "HVAC, roofing, fire protection, alarm/security systems in nonresidential buildings. Eligible for bonus depreciation." },
  // ── Other Common Assets ────────────────────────────────────────────────────
  { group: "Other Common Assets" },
  { name: "Rental Property / Any Property Not Listed Above", class: "7-year",
    note: "IRS default: property with no designated class life defaults to 7-year under MACRS GDS." },
];

// ── CURRENT TAX POLICY (as of June 2026) ────────────────────────────────────
// This section captures the policy layer — things that change with legislation.
// Update this section when tax law changes; the MACRS tables above do not change.

var MACRS_POLICY = {
  // One Big Beautiful Bill Act (OBBBA), signed July 4, 2025
  bonusDepreciation: {
    rate: 1.00,  // 100% for qualified property acquired and placed in service after Jan 19, 2025
    qualifiedDate: "January 20, 2025",
    note: "100% bonus depreciation restored by OBBBA. Applies to most new and used tangible personal property. Does NOT apply to 27.5-year or 39-year real property (except qualified improvement property).",
    canElectOut: true,  // taxpayer can elect out on a class-by-class basis
    phasedown: [
      { year: 2023, rate: 0.80 },
      { year: 2024, rate: 0.60 },
      // 2025 pre-OBBBA: 40% for property acquired before Jan 20, 2025
      // 2025 post-OBBBA: 100% for property acquired after Jan 19, 2025
    ]
  },
  section179: {
    limit: 2500000,  // OBBBA doubled from $1,250,000 to $2,500,000
    phaseoutThreshold: null,  // check current pub 946 for exact phaseout start
    note: "Section 179 limit doubled to $2,500,000 by OBBBA. Cannot exceed taxable income from active business. Applies to tangible personal property and qualified real property improvements."
  },
  lastUpdated: "June 2026",
  source: "IRS Publication 946 (2025), OBBBA (P.L. 119-21, July 4, 2025)"
};

// ── HELPER FUNCTIONS ────────────────────────────────────────────────────────

// Get MACRS depreciation schedule for a given property class and cost
// Returns array of {year, rate, amount} for each recovery year
function getMACRSSchedule(propertyClass, cost, bonusElected, monthPlacedInService) {
  var table = MACRS_TABLES[propertyClass];
  if (!table) return [];

  // Bonus depreciation (year 1 full expensing if elected)
  if (bonusElected && table.convention !== "mid-month") {
    return [{ year: 1, rate: 100.00, amount: cost }];
  }

  // Real property: straight-line with mid-month convention
  if (table.convention === "mid-month") {
    var schedule = [];
    var fullRate = table.fullYearRate / 100;
    var life = propertyClass === "27.5-year" ? 27.5 : 39;
    var month = monthPlacedInService || 1;  // default to January
    // First year: prorated by month (mid-month: months remaining + 0.5)
    var firstYearMonths = (12 - month + 0.5) / 12;
    var firstYearRate = firstYearMonths / life;
    schedule.push({ year: 1, rate: +(firstYearRate * 100).toFixed(3), amount: cost * firstYearRate });
    // Full years
    var fullYears = Math.floor(life);
    for (var y = 2; y <= fullYears; y++) {
      schedule.push({ year: y, rate: table.fullYearRate, amount: cost * fullRate });
    }
    // Last partial year (remaining months)
    var lastYearMonths = 1 - firstYearMonths;
    if (lastYearMonths > 0.001) {
      var lastRate = lastYearMonths / life;
      schedule.push({ year: fullYears + 1, rate: +(lastRate * 100).toFixed(3), amount: cost * lastRate });
    }
    return schedule;
  }

  // Standard MACRS table lookup (personal property, half-year convention)
  var rates = table.rates;
  return rates.map(function(rate, i) {
    return { year: i + 1, rate: rate, amount: +(cost * rate / 100).toFixed(2) };
  });
}

// Get property class info for display
function getMACRSClass(propertyClass) {
  return MACRS_TABLES[propertyClass] || null;
}

// Get suggested property class from asset type name
function suggestPropertyClass(assetTypeName) {
  var match = MACRS_ASSET_CLASSES.find(function(a) {
    return a.name === assetTypeName && a.class;
  });
  return match ? match.class : "7-year";  // default to 7-year if not found
}

// Get all property classes as options for a select dropdown
function getMACRSClassOptions(includeRealProperty) {
  var classes = ["3-year", "5-year", "7-year", "10-year", "15-year", "20-year"];
  if (includeRealProperty) {
    classes.push("27.5-year", "39-year");
  }
  return classes;
}
