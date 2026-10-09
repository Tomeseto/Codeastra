# VARSHA — Scientific & Data Validation Report
### Forensic Audit, Lineage Traceability & Verification Record
**Document Version:** 1.0.0 · **Date:** 9 October 2026  
**Status:** ALL INTEGRITY TESTS PASSING (26/26 Automated Tests in `tests/`)

---

## 1. Executive Summary

This report documents the forensic data audit, mathematical reconciliation, spatial containment verification, and mode separation guards implemented for **VARSHA** (*Vector-And-Rain-driven Surveillance for Health Alerts*).

Every value rendered in the dashboard has been audited to its primary underlying source file, API contract, or deterministic calculation.

---

## 2. Lineage Traceability Matrix (Source-by-Source)

| Entity / Metric | Dashboard Presentation | Primary Raw Source File | Processed File | Verification Status | Notes & Spatial Resolution |
| :--- | :--- | :--- | :--- | :---: | :--- |
| **Ward Polygons** | 24 Choropleth Polygons | `data/raw/BMC_ward_boundary_dataset.kml` | `data/processed/mumbai_wards_24.geojson` | **VERIFIED (FACT)** | Exactly 24 administrative wards; closed rings; multipart geometry preserved for Ward `P-S`. Total area: 474.40 km². |
| **Demographics (Total, Slum, Non-slum)** | Ward total pop, slum pop, and slum ratio in Evidence Drawer & Rankings Table | `data/raw/SlumNonslum.pdf` (Murad Banaji, Middlesex University London, quoting official MCGM Census 2011 Marathi release, Table 1) | `data/processed/ward_census_vulnerability.csv` | **VERIFIED (FACT)** | All 24 wards match Table 1 to the exact digit (City Total: 12,442,373 total pop, 6,534,460 slum pop; 52.52% slum ratio). |
| **Demographic Vulnerability ($V_{\text{norm}}$)** | $V_{\text{norm}}$ in Susceptibility Multiplier | Derived from Census 2011 Table 1 | `data/processed/ward_census_vulnerability.csv` | **DERIVED (PROPOSAL)** | Computed as $(0.60 \cdot \text{slum\_ratio} + 0.40 \cdot \text{density\_norm}) / \max$. Weights reflect housing vulnerability & density exposure. |
| **Chronic Flood Hotspots** | 70 Point Markers on Map & Ward Lists | BMC Flood Preparedness Guidelines & Mumbai Traffic Police annual monsoon action records | `data/processed/verified_flood_hotspots.json` | **VERIFIED (FACT)** | All 70 spots geocoded and confirmed 100% strictly contained within assigned ward polygons via ray-casting geometry. |
| **Flood Propensity ($F_{\text{norm}}$)** | $F_{\text{norm}}$ in Susceptibility Multiplier | Derived from 70 verified hotspots and ward area | `data/processed/verified_flood_hotspots.json` | **DERIVED (PROPOSAL)** | $F_{\text{norm}}(w) = \text{density}(w) / \max(\text{density})$, where $\text{density} = \text{spots} / \text{area\_sq\_km}$. |
| **Rainfall Time Series** | Daily rainfall (mm) on Time Machine slider & Evidence Drawer | Open-Meteo ERA5 hourly reanalysis archive | `data/processed/weather_july_2026_ist.json` | **OBSERVED (FACT)** | Open-Meteo ERA5 reanalysis queried across 24 ward centroids in `Asia/Kolkata` IST. Clustered into **6 unique ERA5 meteorological grid points** ($\sim 9\text{ km}$ spacing). |
| **Hazard Score $H(R)$** | $H(R) \in [0, 100]$ | IMD 24h meteorological rainfall classification | `backend/app/services/exposure_engine.py` | **PROVISIONAL (GROUNDED)** | Breakpoints ($0, 35.5, 64.5, 115.6, 204.5\text{ mm}$) are official IMD standards `[FACT]`; piecewise score mapping $[0, 20, 40, 65, 90, 100]$ is a provisional design `[PROPOSAL]`. |
| **Susceptibility $M(w)$** | $M(w) \in [0.70, 1.30]$ | Deterministic formula: $0.70 + 0.30 F_{\text{norm}} + 0.30 V_{\text{norm}}$ | `backend/app/services/exposure_engine.py` | **PROVISIONAL (PROPOSAL)** | Base multiplier $0.70$ discounts low-vulnerability wards by 30%; $1.30$ amplifies chronic flood & slum pockets by 30%. |
| **Exposure Score $E(w, d)$** | Bounded score $[0.0, 100.0]$ | $E = \min(100.0, \text{round}(H \cdot M, 1))$ | `backend/app/services/exposure_engine.py` | **PROVISIONAL (PROPOSAL)** | Deterministic, monotonic, explainable environmental index. Clamped strictly at $100.0$. |
| **Historical Milestones** | July 2026 timeline callouts | BMC press releases & Free Press Journal articles cited in `CODEASTRA_2_MASTER_RESEARCH.md` | `backend/app/services/exposure_engine.py` | **VERIFIED (FACT)** | 6 July 22:39 IST retrospective advisory; 33 to 78 July case surge; 5 July +38.15h early warning trigger. |

---

## 3. Mathematical Rationale & Normalization

### 3.1 Piecewise Rainfall Hazard $H(R)$
- **Input:** $R \ge 0.0\text{ mm}$ (24-hour rainfall).
- **IMD Breakpoints:**
  - $R = 0.0\text{ mm} \implies H = 0.0$ (`Zero / Dry`)
  - $0.0 < R < 35.5\text{ mm} \implies H = \frac{R}{35.5} \times 20.0$ (`IMD Light Rain`)
  - $35.5 \le R < 64.5\text{ mm} \implies H = 20.0 + \frac{R - 35.5}{29.0} \times 20.0$ (`IMD Moderate Rain`)
  - $64.5 \le R < 115.6\text{ mm} \implies H = 40.0 + \frac{R - 64.5}{51.1} \times 25.0$ (`IMD Heavy Rain`)
  - $115.6 \le R < 204.5\text{ mm} \implies H = 65.0 + \frac{R - 115.6}{88.9} \times 25.0$ (`IMD Very Heavy Rain`)
  - $R \ge 204.5\text{ mm} \implies H = 90.0 + \min\left(10.0, \frac{R - 204.5}{100.0} \times 10.0\right)$ (`IMD Extremely Heavy Deluge`)
- **Rationale:** Prevents arbitrary step jumps at classification borders by ensuring $H(R)$ is continuous and monotonic.

### 3.2 Susceptibility Multiplier $M(w)$
- **Formula:** $M(w) = 0.70 + 0.30 \cdot F_{\text{norm}}(w) + 0.30 \cdot V_{\text{norm}}(w)$
- **Range:** $M(w) \in [0.70, 1.30]$.
- **Rationale for Bounds:**
  - An affluent, elevated, well-drained ward (e.g. Ward D, Malabar Hill) has $F_{\text{norm}} \approx 0.23, V_{\text{norm}} \approx 0.33 \implies M \approx 0.87$.
  - An average municipal ward has $F_{\text{norm}} \approx 0.50, V_{\text{norm}} \approx 0.50 \implies M = 1.000$ (hazard score passes through unscaled).
  - A chronic low-lying slum basin (e.g. Ward L, Kurla) has $F_{\text{norm}} \approx 0.31, V_{\text{norm}} \approx 1.00 \implies M = 1.093$, scaling heavy deluges into Critical thresholds.
- **Strict Missing Data Protocol:** If flood hotspot data is missing, $M(w) = 0.70 + 0.60 \cdot V_{\text{norm}}$, and the response carries `status: "PROVISIONAL_PARTIAL"`.

---

## 4. Spatial Resolution & Grid Analysis

Open-Meteo ERA5 reanalysis resolves the 24 ward centroids into exactly **6 unique regional meteorological grid cells** ($\sim 9\text{ km}$ spacing):

| ERA5 Grid Point (Lat, Lon) | Wards Covered | Regional Description |
| :--- | :--- | :--- |
| `(19.0158, 72.8698)` | A, B, C, D, E, F-S, F-N, G-S, G-N, M-W (10 wards) | South Mumbai & Island City Basin |
| `(19.0861, 72.8529)` | H-W, H-E, K-E, L (4 wards) | Western & Central Suburbs (Mithi River Basin) |
| `(19.0861, 72.9418)` | M-E, N (2 wards) | Eastern Suburbs (Govandi / Ghatkopar) |
| `(19.1564, 72.8360)` | P-S, P-N, K-W (3 wards) | Northwest Suburbs (Andheri / Malad / Goregaon) |
| `(19.1564, 72.9249)` | T, S (2 wards) | Northeast Suburbs (Bhandup / Mulund) |
| `(19.2267, 72.8190)` | R-S, R-C, R-N (3 wards) | Northern Suburbs (Kandivali / Borivali / Dahisar) |

> **Operational Disclosure:** ERA5 models broad atmospheric fields across $9\text{ km}$ cells and does not capture hyper-local cloudbursts detectable only by physical municipal ground gauges (Automatic Weather Stations).

---

## 5. Mode Separation & Tamper-Prevention

1. **Independent State:** The historical baseline (`timelineDays`) is immutable and loaded on startup from `weather_july_2026_ist.json`.
2. **Explicit Mode Tagging:**
   - Historical requests return `mode: "HISTORICAL_OBSERVED"` with `data_lineage: "DERIVED"`.
   - Scenario requests return `mode: "SIMULATED_SCENARIO"` with `data_lineage: "ESTIMATED"`.
3. **Visual Banner Guard:** When Scenario Sandbox is active, an amber status banner appears across the viewport:
   `⚠️ SCENARIO SIMULATION ACTIVE — Hypothetical sandbox test (Historical records untouched)`.
4. **Boundary Validation:** Replay endpoint `/api/v1/exposure/timeline/{date_str}` strictly rejects out-of-range dates with HTTP 404, preventing silent zero-rainfall fabrication.

---

## 6. What Remains Unverified

1. **Ward-Level Case Incidence:** BMC publishes aggregate citywide epidemic figures (e.g. 148 cases, 2 deaths in July 2026), but does not release daily ward-level patient hospital admissions due to privacy regulations.
2. **Post-2011 Micro-Demographics:** Official slum percentages are benchmarked to Census 2011 (the latest available national census). Intra-ward informal settlement changes since 2011 are not reflected in official published tables.
