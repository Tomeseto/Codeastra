# VARSHA — Implementation Plan & Architectural Blueprint (v2.2.0)
**Vector-And-Rain-driven Surveillance for Health Alerts**
*A Hyperlocal Environmental Exposure Surveillance & Historical Replay System for Mumbai*

---

## Document Control & Metadata

| Attribute | Details |
|---|---|
| **Project Code** | VARSHA (CodeAstra 2.0 / Problem WEB-2) |
| **Document Version** | 2.2.0-PROPOSAL (Incorporating Real BMC Ward-Boundary KML Dataset) |
| **Author / Role** | Principal Software Architect & Technical Reviewer |
| **Status** | PENDING ARCHITECTURAL APPROVAL (Planning Stage Only) |
| **Target Implementation Environment** | Windows 11 / Python 3.11+ / Node.js 20+ / Vite + React 18 / Local File-Based Persistence |
| **Date** | 9 October 2026 |
| **Source Documents & Data Reviewed** | `BMC ward-boundary dataset.kml`, `VARSHA_CODEASTRA2_Idea_PPT.pdf`, `CODEASTRA_2_MASTER_RESEARCH.md` |
| **Evidence Tagging Convention** | `[FACT]`: Verified from cited sources, inspection of raw files, or verified API calls.<br>`[INFERENCE]`: Deductive reasoning grounded directly in verified facts.<br>`[PROPOSAL]`: Engineering or architectural decision subject to review.<br>`[UNVERIFIED]`: Plausible claim or assumption requiring empirical verification. |

---

## 1. Executive Summary

### 1.1 Focused MVP Vision
VARSHA (*Vector-And-Rain-driven Surveillance for Health Alerts*) is a decision-support prototype designed to evaluate and visualize **ward-level environmental flood exposure** across Mumbai's 24 municipal administrative wards `[PROPOSAL]`. 

During Mumbai's monsoon season, torrential precipitation coupled with localized drainage constraints causes severe street-level waterlogging, creating acute environmental exposure conditions associated with post-flood waterborne and vector-borne diseases (specifically leptospirosis, dengue, and malaria) `[FACT]`. Public health guidelines from the Brihanmumbai Municipal Corporation (BMC) urge citizens who have waded through floodwaters to seek medical evaluation within a **24 to 72-hour window** `[FACT]`. However, official disease surveillance reports (IDSP) are published with a **37 to 51-day publication lag** `[INFERENCE]`, and civic advisories have historically been issued days after peak rainfall (e.g., BMC's citywide press advisory on 6 July 2026 at 10:39 PM IST following deluges that began on 1 July) `[FACT]`.

The VARSHA MVP addresses this operational gap with an evidence-grounded prototype strictly centered on **three core feature groups**:
1. **Feature 1 — Ward Environmental Exposure Scoring:** A deterministic, explainable environmental exposure score ($E(w, d) \in [0.0, 100.0]$) derived from 24-hour rainfall exceedance and verified ward vulnerability factors `[PROPOSAL]`.
2. **Feature 2 — Interactive 24-Ward Dashboard & Explainability:** A clean, responsive React map-and-list dashboard (Leaflet) displaying ward risk tiers, contributing factors, data freshness, and visible data-quality warnings `[PROPOSAL]`.
3. **Feature 3 — July 2026 Historical Time Machine:** A date-scrubbing historical replay of the 1–10 July 2026 deluge, calculating point-in-time exposure scores without future-data leakage and contrasting them with verified historical benchmark markers `[PROPOSAL]`.

### 1.2 Core Boundaries: What the MVP Will and Will Not Do

| Capability | In Scope for Core MVP (Release 1.0) | Explicitly Excluded from MVP (Deferred to Later Milestones) |
|---|---|---|
| **Product Features** | Exactly 3 features: (1) Exposure Score, (2) Dashboard & Explainability, (3) July 2026 Replay | Automated alert dispatch, PDF action sheets, clinic recommendation engines, resource optimizers |
| **Analytics Scope** | Deterministic environmental exposure scoring ($E(w, d) \in [0.0, 100.0]$) | Numerical disease case counts, Negative Binomial regressions, predicted surge probabilities, dengue/malaria forecasting, EARS anomaly detection |
| **Geographic Scope** | All 24 canonical administrative wards of Mumbai (e.g., `A`, `F-S`, `K-W`, `L`, `T`) | 227 electoral wards, MMRDA regional districts |
| **Starting Spatial Asset** | Actual provided file `BMC ward-boundary dataset.kml` (converted to GeoJSON in Phase 0) | Assuming an arbitrary open GeoJSON already exists without geometric validation |
| **Disease Data Status** | Outputs labeled strictly as **experimental environmental exposure estimates** | Claims of measured, predicted, or validated ward-level clinical incidence `[FACT]` |
| **Clinical Function** | Decision support and environmental risk transparency | Clinical diagnosis, prescription advice, medication dosages |
| **Persistence & Infra** | Local verified JSON/CSV files, pure in-memory Python calculations | PostgreSQL, PostGIS, Docker, background cron daemons, distributed caches |
| **External Messaging** | UI cockpit preview only | Live SMS gateways, WhatsApp Cloud API, Telegram bots |

---

## 2. Workspace & Real-World Dataset Audit

### 2.1 Workspace Inventory & Baseline Verification
Inspection of the workspace root (`c:\Users\Tanmay\OneDrive\Desktop\codeastra`) confirms the following assets:
- `BMC ward-boundary dataset.kml` (644,096 bytes): Official BMC ward boundary dataset provided in KML format, containing 24 distinct ward placemark features with attributes `NAME`, `OBJECTID`, `Shape__Area`, `Shape__Length`, and polygon/multipart coordinates `[FACT]`.
- `CODEASTRA_2_MASTER_RESEARCH.md` (125,335 bytes): Research and reference documentation `[FACT]`.
- `VARSHA_CODEASTRA2_Idea_PPT.pdf` (1,138,648 bytes): Idea presentation deck `[FACT]`.
- `docs/` directory: Planning documentation `[FACT]`.
- **Application Code:** None (0 lines of code, 0 package manifests). Completely greenfield.

### 2.2 Canonical Mumbai Ward Identifiers Audit
The assumption that Mumbai's 24 wards follow a simple sequential alphabetical scheme ("A through T") is **factually incorrect** `[FACT]`. 

Inspection of `BMC ward-boundary dataset.kml` confirms that MCGM divides the city into **24 canonical administrative wards**, with slash notation used for geographically split wards `[FACT]`:
1. **Island City (South Mumbai) — 9 Wards:** `A`, `B`, `C`, `D`, `E`, `F/S`, `F/N`, `G/S`, `G/N`.
2. **Western Suburbs — 9 Wards:** `H/E`, `H/W`, `K/E`, `K/W`, `P/S`, `P/N`, `R/S`, `R/C`, `R/N`.
3. **Eastern Suburbs — 6 Wards:** `L`, `M/E`, `M/W`, `N`, `S`, `T`.

*Resolution:* During Phase 0, ward identifiers are normalized to canonical web-safe codes (`F-S`, `K-W`, `G-S`, etc.) to prevent URL and file-path escaping bugs, while preserving the raw `NAME` (e.g., `"F/S"`) and `OBJECTID` (e.g., `1`) as immutable properties `[PROPOSAL]`.

### 2.3 Real-World Dataset Audit & Comparative Feasibility Matrix

To prioritize real observed data over mock or hardcoded values, the availability, license, resolution, retrieval method, and usability of all candidate sources have been audited:

| Dataset | Source / Authority | Coverage & Date Range | Spatial / Temporal Resolution | Access Method & License | Usability Assessment for MVP |
|---|---|---|---|---|---|
| **BMC Administrative Ward Boundaries** | MCGM / BMC Official GIS | 24 Wards, Mumbai | Vector Polygons (24 Placemarks) | **Actual file provided in workspace:** `BMC ward-boundary dataset.kml` (644 KB) `[FACT]` | **PRIMARY SPATIAL BASE:** Validated starting source. Phase 0 converts this KML to GeoJSON, validates all 24 geometries, and normalizes identifiers. |
| **Open-Meteo Weather API (ERA5 / ECMWF)** | Open-Meteo / ECMWF | Global (1940–Present) | $\sim 0.1^\circ \times 0.1^\circ$ ($\sim 9\text{–}11\text{ km}$), Hourly | Programmatic REST API, no auth required, non-commercial CC-BY 4.0 `[FACT]` | **PRIMARY WEATHER SOURCE:** High availability, verified historical archive for July 2026, scriptable. |
| **IMD Historical Gridded Rainfall** | National Climate Centre, IMD Pune | India (1901–Recent) | $0.25^\circ \times 0.25^\circ$ ($\sim 27\text{–}30\text{ km}$), Daily | Manual offline order / binary `.grd` format; multi-month latency `[FACT]` | **UNSUITABLE FOR MVP PIPELINE:** Entire Mumbai fits in only 1–2 grid cells; binary format and delivery delay preclude operational use. |
| **NASA GPM IMERG (Satellite Rain)** | NASA GES DISC | Global ($60^\circ\text{N}\text{–}60^\circ\text{S}$, 2000–Present) | $0.1^\circ \times 0.1^\circ$ ($\sim 10\text{ km}$), Half-Hourly | HTTPS / OPeNDAP (NetCDF4/HDF5), requires free Earthdata token `[FACT]` | **RESERVED FOR VALIDATION:** 12 grid cells across Mumbai; high complexity to parse HDF5 in initial prototype. Used as cross-reference. |
| **Bhuvan / NRSC Flood Inundation Layers** | ISRO NRSC Disaster Support | Episodic disaster events | Thematic vector shapefiles / WMS | Web portal download; event-specific `[FACT]` | **HISTORICAL REFERENCE ONLY:** Inundation maps are published post-disaster, not as continuous daily operational feeds. |
| **Copernicus Sentinel-1 SAR Imagery** | European Space Agency (ESA) | Global | $10\text{ m}$ spatial, 6–12 day revisit | Copernicus Data Space, open access `[FACT]` | **UNSUITABLE FOR DAILY MONITORING:** 6–12 day revisit gap cannot capture 24–72 hour urban flood inundation cycles. |
| **MCGM Census 2011 Ward Statistics** | MCGM Public Health Dept | 24 Wards, Mumbai | Ward level (Total pop & slum pop) | Official Census FAQ PDF; public domain `[FACT]` | **USABLE WITH AUDIT:** Static demographic vulnerability baseline. Audited and joined separately; KML does not provide population data `[FACT]`. |
| **BMC Chronic Flooding Hotspots** | BMC Disaster Management (2022) | 386 text spot descriptions | Un-geocoded locality strings | BMC municipal documents / press releases `[FACT]` | **USABLE SUBSET ONLY:** Coordinates are not in the KML file. Phase 0 audits and geocodes a verified subset separately `[FACT]`. |
| **BMC & IDSP Public Health Records** | NCDC / MoHFW (IDSP) & BMC | 2009–2026 (IDSP), Periodic press (BMC) | District-level weekly (IDSP), Citywide monthly (BMC) | IDSP PDFs via Dataful mirror; BMC press releases `[FACT]` | **HISTORICAL BENCHMARK ONLY:** No public ward-level daily case data exists. Used strictly as contextual historical markers. |

---

## 3. Spatial Rainfall Methodology

### 3.1 Limitation of Single-Coordinate Queries
Querying a single geographic coordinate (e.g., Santacruz $19.086^\circ\text{N}, 72.853^\circ\text{E}$) and applying that rainfall reading across all 24 wards is **scientifically invalid** `[FACT]`. Mumbai extends over 43 kilometers from Colaba in the south to Dahisar in the north, and cloudburst downpours often inundate the suburbs while South Mumbai receives moderate rain `[FACT]`.

### 3.2 Ward Centroid Ingestion Strategy
To capture real spatial gradients within the limits of public data:
1. **Representative Ward Coordinates:** Phase 0 derives the geographic centroid $(\text{lat}_w, \text{lon}_w)$ from the converted 24-ward GeoJSON polygons `[PROPOSAL]`.
2. **Multi-Point Retrieval:** The ingestion engine queries Open-Meteo for each unique ward centroid.
3. **Underlying Grid Cell Disclosure:** Because the underlying reanalysis/forecast grid operates at $\sim 9\text{–}11\text{ km}$ resolution, small adjacent wards (e.g., Island City Wards `B`, `C`, and `D`, each covering only 2–4 $\text{km}^2$) map to the **same underlying grid cell** `[FACT]`. 
4. **Transparency Mandate:** The API response and UI evidence drawer must explicitly disclose:
   - The ward centroid queried.
   - The resolved grid point coordinates.
   - The spatial resolution limitation ($\sim 10\text{ km}$).
   - Any comparative point ground-truth from the Santacruz or Colaba IMD/NOAA stations where available `[PROPOSAL]`.

---

## 4. Product Scope and Prioritization

### 4.1 The Three Core MVP Feature Groups

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                             VARSHA CORE MVP                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│  FEATURE 1: Ward Environmental Exposure Scoring                             │
│  - Deterministic formula: Hazard(Rain) × Susceptibility(Ward)               │
│  - Configurable weights and transparent IMD threshold breakpoints          │
│  - Outputs strictly labeled as experimental environmental exposure          │
├─────────────────────────────────────────────────────────────────────────────┤
│  FEATURE 2: Interactive 24-Ward Dashboard & Explainability                  │
│  - Leaflet 24-ward choropleth map + responsive list view                   │
│  - Selected ward drawer: score, factors, provenance, freshness, warnings    │
│  - Reusable React components and separated API/data layer                  │
├─────────────────────────────────────────────────────────────────────────────┤
│  FEATURE 3: July 2026 Historical Time Machine                               │
│  - Interactive date slider (30 June to 10 July 2026)                       │
│  - Point-in-time exposure calculation (strictly no future data leakage)    │
│  - Historical timeline markers: verified BMC advisory & city monthly counts │
└─────────────────────────────────────────────────────────────────────────────┘
```

*Supporting Engineering Requirements (Not Features):* Local data conversion and ingestion, schema validation, mathematical unit testing, API error handling, and cryptographic provenance logging.

### 4.2 Explicitly Deferred Capabilities Matrix

| Deferred Capability | Justification for Deferral | Target Roadmap Milestone |
|---|---|---|
| **Numerical Leptospirosis Forecasting** | Ward-level case data is unavailable. Monthly citywide data cannot reliably fit daily distributed lag models without severe overfitting. | Milestone 2 (Research / Pilot) |
| **Dengue & Malaria Bioclimatic Models** | Operates on 2–8 week lagged climatic non-linearities; tangential to immediate acute flood exposure surveillance. | Milestone 2 |
| **EARS / Farrington Aberration Detection** | Official IDSP reporting suffers from a 37–51 day publication lag, making it non-actionable for acute flood response. | Milestone 2 |
| **Resource Optimizer & Van Scheduling** | Optimizing allocations requires operational feedback and validated exposure-to-need transfer functions. | Milestone 3 |
| **Clinic Routing & PDF Action Sheets** | Complex dispatch artifacts distract from validating core environmental exposure accuracy. | Milestone 3 |
| **Multilingual Generated Alerts (SMS/WhatsApp)** | Generative or automated public messaging introduces public-health liability without human municipal review. | Milestone 3 |
| **PostgreSQL, PostGIS & Docker Infrastructure** | 24 wards and local static series do not justify server daemon overhead for a prototype. | Milestone 3 (Productionization) |
| **Live Cron Background Daemons** | Unnecessary runtime failure points during prototype demonstrations. | Milestone 3 |

---

## 5. Analytics, Reconciled Mathematics & Replay Verification

### 5.1 Reconciled Environmental Exposure Formulation

The exposure scoring formula is explicitly designed to be **simple, bounded, monotonic, and explainable** `[PROPOSAL]`:

$$E(w, d) = \min\left(100.0, \; \text{round}\left(H(R(w, d)) \times M(w), \; 1\right)\right)$$

#### 1. Piecewise Rainfall Hazard Function $H(R) \in [0.0, 100.0]$
Directly mapped from official India Meteorological Department (IMD) 24-hour rainfall classification thresholds:

$$H(R) = \begin{cases}
0.0 & \text{if } R = 0.0 \\
\frac{R}{35.5} \times 20.0 & \text{if } 0.0 < R < 35.5\text{ mm (Negligible / Light)} \\
20.0 + \frac{R - 35.5}{64.5 - 35.5} \times 20.0 & \text{if } 35.5 \le R < 64.5\text{ mm (IMD Moderate)} \\
40.0 + \frac{R - 64.5}{115.6 - 64.5} \times 25.0 & \text{if } 64.5 \le R < 115.6\text{ mm (IMD Heavy)} \\
65.0 + \frac{R - 115.6}{204.5 - 115.6} \times 25.0 & \text{if } 115.6 \le R < 204.5\text{ mm (IMD Very Heavy)} \\
90.0 + \min\left(10.0, \frac{R - 204.5}{100.0} \times 10.0\right) & \text{if } R \ge 204.5\text{ mm (IMD Extremely Heavy)}
\end{cases}$$

- **Evidence-Based Components:** Cutoffs ($35.5, 64.5, 115.6, 204.5\text{ mm}$) are `[FACT]` from IMD official meteorological standards.
- **Provisional Components:** The hazard score range assignments ($[0, 20, 40, 65, 90, 100]$) are `[PROPOSAL]` engineering design decisions.

#### 2. Ward Susceptibility Multiplier $M(w) \in [0.70, 1.30]$
Modulates base hazard according to verified localized environmental flood retention and demographic vulnerability:

$$M(w) = 0.70 + w_F \cdot F_{\text{norm}}(w) + w_V \cdot V_{\text{norm}}(w)$$

Where:
- $w_F = 0.30$ and $w_V = 0.30$ (configurable provisional weights `[PROPOSAL]`).
- $F_{\text{norm}}(w) \in [0.0, 1.0]$: Normalized verified flood spot density ($\text{spots} / \text{km}^2$).
- $V_{\text{norm}}(w) \in [0.0, 1.0]$: Slum population proportion ($\text{slum\_pop} / \text{total\_pop}$).
- **Range Behavior:** A well-drained ward with low slum density has $M(w) \approx 0.70$. An average ward has $M(w) \approx 1.00$. A chronic waterlogging ward with high slum density has $M(w) \approx 1.15\text{–}1.30$.

#### 3. Strict Missing-Data Handling Protocol
**Under no circumstances will missing data be silently replaced by artificial defaults (such as $F_{\text{norm}} = 0.50$) `[PROPOSAL]`.**
- If verified flood spot data is unavailable for ward $w$:
  - $F_{\text{norm}}(w)$ is set to `None`.
  - The composite score is marked as **`PROVISIONAL_PARTIAL`**.
  - Susceptibility is computed using only verified census vulnerability: $M(w) = 0.70 + 0.60 \cdot V_{\text{norm}}(w)$ (preserving scale $[0.70, 1.30]$).
  - The score payload sets `data_status: "PROVISIONAL_PARTIAL"` and appends an explicit warning: `"Verified flood-hotspot mapping missing for this ward; score reflects hazard and demographic vulnerability only"`.
  - In the UI, the ward badge displays a visible warning icon: ⚠️ `PARTIAL DATA`.
- Every value returned by the system carries an explicit lineage tag: `OBSERVED`, `DERIVED`, `ESTIMATED`, or `MISSING`.

#### 4. Risk Tier Thresholds
- `NORMAL`: $E(w, d) < 30.0$
- `WATCH`: $30.0 \le E(w, d) < 55.0$
- `WARNING`: $55.0 \le E(w, d) < 75.0$
- `EMERGENCY`: $E(w, d) \ge 75.0$

#### 5. Step-by-Step Mathematical Validation Examples

##### Example 1: Boundary Condition — Zero Rain
- Input: $R = 0.0\text{ mm}$ for any ward.
- $H(0.0) = 0.0$.
- $E(w, d) = \min(100.0, \text{round}(0.0 \times M(w), 1)) = \mathbf{0.0}$ (`NORMAL`).

##### Example 2: Moderate Rain
- Input: $R = 45.0\text{ mm}$, $F_{\text{norm}} = 0.50, V_{\text{norm}} = 0.50$.
- $H(45.0) = 20.0 + \frac{45.0 - 35.5}{64.5 - 35.5} \times 20.0 = 20.0 + \frac{9.5}{29.0} \times 20.0 = 20.0 + 6.5517 = 26.5517$.
- $M(w) = 0.70 + 0.30(0.50) + 0.30(0.50) = 0.70 + 0.15 + 0.15 = 1.000$.
- $E(w, d) = \text{round}(26.5517 \times 1.000, 1) = \mathbf{26.6}$ (`NORMAL`).

##### Example 3: Heavy Rain on High-Susceptibility Ward (Corrected Exact Value)
- Input: $R = 85.0\text{ mm}$, $F_{\text{norm}} = 0.75, V_{\text{norm}} = 0.80$.
- $H(85.0) = 40.0 + \frac{85.0 - 64.5}{115.6 - 64.5} \times 25.0 = 40.0 + \frac{20.5}{51.1} \times 25.0 = 40.0 + 10.02935 = 50.02935$.
- $M(w) = 0.70 + 0.30(0.75) + 0.30(0.80) = 0.70 + 0.225 + 0.240 = 1.165$.
- $E(w, d) = \text{round}(50.02935 \times 1.165, 1) = \text{round}(58.28419, 1) = \mathbf{58.3}$ (`WARNING`).

##### Example 4: Very Heavy Rain on High-Susceptibility Ward
- Input: $R = 135.0\text{ mm}$, $F_{\text{norm}} = 0.75, V_{\text{norm}} = 0.80$.
- $H(135.0) = 65.0 + \frac{135.0 - 115.6}{204.5 - 115.6} \times 25.0 = 65.0 + \frac{19.4}{88.9} \times 25.0 = 65.0 + 5.45557 = 70.45557$.
- $M(w) = 1.165$.
- $E(w, d) = \text{round}(70.45557 \times 1.165, 1) = \text{round}(82.08074, 1) = \mathbf{82.1}$ (`EMERGENCY`).

##### Example 5: Extreme Deluge on Vulnerable Ward
- Input: $R = 300.0\text{ mm}$, $F_{\text{norm}} = 0.80, V_{\text{norm}} = 0.85$.
- $H(300.0) = 90.0 + \min\left(10.0, \frac{300.0 - 204.5}{100.0} \times 10.0\right) = 90.0 + 9.55 = 99.55$.
- $M(w) = 0.70 + 0.30(0.80) + 0.30(0.85) = 0.70 + 0.240 + 0.255 = 1.195$.
- Product: $99.55 \times 1.195 = 118.96225$.
- Clamping: $E(w, d) = \min(100.0, 118.962) = \mathbf{100.0}$ (`EMERGENCY`).

---

### 5.2 Verification & Timeline Analysis of the July 2026 Historical Replay

All claims regarding the July 2026 episode are strictly anchored to verified records, with clear distinctions between verified facts, press-reported numbers, and derived inferences:

| Event Date & Time (IST) | Metric / Event | Reported Value | Source Record & Reference | Evidence Tag |
|---|---|---|---|---|
| **2026-06-30 08:30 to 2026-07-01 08:30** | Daily Gridded Rain | $57.5\text{ mm}$ | Open-Meteo Archive API (19.086°N, 72.853°E) `[FACT]` | `[FACT: API_VERIFIED]` |
| **2026-07-01 08:30 to 2026-07-02 08:30** | Daily Gridded Rain | $86.6\text{ mm}$ | Open-Meteo Archive API (19.086°N, 72.853°E) `[FACT]` | `[FACT: API_VERIFIED]` |
| **2026-07-04 08:30 to 2026-07-05 08:30** | Daily Gridded Rain | $78.1\text{ mm}$ | Open-Meteo Archive API (19.086°N, 72.853°E) `[FACT]` | `[FACT: API_VERIFIED]` |
| **2026-07-05 08:30 to 2026-07-06 08:30** | Daily Gridded Rain | $136.9\text{ mm}$ | Open-Meteo Archive API (19.086°N, 72.853°E) `[FACT]` | `[FACT: API_VERIFIED]` |
| **1–7 July 2026 Cumulative** | Gridded Rain Sum | $596.2\text{ mm}$ | Open-Meteo Archive API `[FACT]` | `[FACT: API_VERIFIED]` |
| **1–7 July 2026 Cumulative** | Santacruz Gauge Total | $\sim 984\text{–}988\text{ mm}$ | Local press reports / meteorological blogs `[UNVERIFIED: PRESS_REPORTED]` | `[UNVERIFIED]` (NOAA GSOD 2026 returned 404 on 8 Oct 2026) |
| **2026-07-06 22:39:00 IST** | BMC Civic Advisory | Citywide advisory | Free Press Journal (6 July 2026, 10:39 PM IST): *"BMC issues leptospirosis alert for Mumbai residents amid heavy rains, advises preventive treatment within 72 hours"* `[FACT]` | `[FACT: OFFICIAL_ADVISORY]` |
| **July 2026 Monthly Total** | Leptospirosis Cases | 78 cases (up from 33 in June) | BMC Epidemiology Cell review via press (Free Press Journal, 15 July 2026) `[FACT]` | `[FACT: OFFICIAL_AGGREGATE]` |

#### Time-Difference & Lead-Time Analysis
All lead-time calculations are evaluated strictly from standardized timestamps:
- **Case A: Evaluation at 5 July 08:30 IST (End of 4 July Met-Day):**
  - Input: 24-hour rainfall $78.1\text{ mm}$ (cumulative $> 250\text{ mm}$).
  - Low-lying wards reach `WARNING` ($58.3$).
  - Lead time to BMC Advisory (6 July 22:39 IST): **38 hours and 9 minutes** `[INFERENCE]`.
- **Case B: Evaluation at 6 July 08:30 IST (End of 5 July Deluge Day):**
  - Input: 24-hour rainfall $136.9\text{ mm}$.
  - Low-lying wards reach `EMERGENCY` ($82.1$).
  - Lead time to BMC Advisory (6 July 22:39 IST): **14 hours and 9 minutes** `[INFERENCE]`.

*Scientific Disclaimers:*
1. Monthly case totals (33 in June $\rightarrow$ 78 in July) are citywide monthly summaries. They do **not** establish the exact daily epidemic curve or prove individual ward incidence `[FACT]`.
2. VARSHA demonstrates an **exposure lead-time advantage**, not proven clinical case prevention `[INFERENCE]`.

---

## 6. Simplified Technical Architecture

### 6.1 Selected Architecture Stack

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           SELECTED ARCHITECTURE                             │
├─────────────────────┬───────────────────────────────────────────────────────┤
│ Frontend            │ React 18 + Vite + TypeScript                          │
│ Backend             │ Python 3.11+ + FastAPI                                │
│ Mapping Engine      │ Leaflet (`react-leaflet`)                             │
│ Persistence Layer   │ Local static files (`.json`, `.csv`, `.geojson`)      │
│ Styling             │ Modular Vanilla CSS Design Tokens (`tokens.css`)      │
│ Weather Ingestion   │ Open-Meteo REST API (behind `WeatherProvider` interface)│
└─────────────────────┴───────────────────────────────────────────────────────┘
```

#### Why Local File-Based Persistence over PostgreSQL/PostGIS?
For 24 administrative wards and a single 10-day historical replay series, total data volume is under 2 megabytes. Introducing PostgreSQL and PostGIS adds database installation hurdles, connection pool handling, Docker runtime dependencies, and potential Windows permission errors without providing functional benefit for a prototype `[PROPOSAL]`. 

*Trigger for Adopting a Database:* Database storage will only be introduced post-MVP if requirements expand to multi-user concurrent writes, dynamic user authentication, or spatial querying across $>10,000$ real-time geometries.

### 6.2 Data Directory Organization & Separation of Concerns

```
data/
├── raw/                              # Immutable raw input assets
│   ├── BMC_ward_boundary_dataset.kml # Original raw KML dataset (preserved as provided)
│   ├── census_2011_raw.pdf           # Original MCGM Census FAQ document
│   └── weather_openmeteo_raw.json    # Exact raw API responses
├── processed/                        # Normalized, audited, canonical assets
│   ├── mumbai_wards_24.geojson       # Converted from KML; validated 24 geometries
│   ├── ward_census_vulnerability.csv # Reconciled population & slum ratios
│   ├── verified_flood_hotspots.json  # Audited subset of chronic flood points
│   └── weather_july_2026_ist.json    # Standardized 08:30 IST daily series by centroid
└── provenance_ledger.json            # Cryptographic SHA-256 audit trail
```

---

## 7. Data Model and API Contracts

### 7.1 Core Logical Entities

```typescript
// Canonical Ward Entity (derived from KML and Census audit)
interface Ward {
  ward_id: string;             // Canonical code: "A", "F-S", "K-W", "L", etc.
  original_name: string;       // Preserved from KML: e.g. "F/S", "K/W", "G/S"
  object_id: number;           // Preserved from KML OBJECTID: e.g. 1, 2, ...
  ward_name: string;           // Common descriptive name, e.g. "Kurla", "Elphinstone / Worli"
  zone: 'Island City' | 'Western Suburbs' | 'Eastern Suburbs';
  shape_area: number;          // Preserved from KML Shape__Area
  shape_length: number;        // Preserved from KML Shape__Length
  area_sq_km: number;          // Computed geographic area
  total_population_2011: number; // Joined from separate Census 2011 audit
  slum_population_2011: number;  // Joined from separate Census 2011 audit
  slum_ratio: number;
  centroid_lat: number;
  centroid_lon: number;
  verified_hotspots_count: number;
  hotspot_data_status: 'VERIFIED_SUBSET' | 'MISSING_UNVERIFIED';
}

// Ward Exposure Score Entity
interface WardExposureScore {
  ward_id: string;
  date_ist: string;            // YYYY-MM-DD (08:30 IST window)
  rainfall_24h_mm: number;
  rainfall_source: 'OPEN_METEO_GRID' | 'STATION_OBSERVED';
  grid_point: { lat: number; lon: number };
  hazard_score: number;        // H(R) in [0, 100]
  susceptibility_multiplier: number; // M(w) in [0.70, 1.30]
  exposure_score: number;      // E(w, d) in [0, 100]
  risk_tier: 'NORMAL' | 'WATCH' | 'WARNING' | 'EMERGENCY';
  data_status: 'OBSERVED_COMPLETE' | 'PROVISIONAL_PARTIAL';
  data_lineage: {
    rainfall: 'OBSERVED' | 'DERIVED';
    hotspots: 'OBSERVED' | 'MISSING';
    census: 'OBSERVED';
  };
  data_quality_warnings: string[];
}
```

### 7.2 REST API Contracts

#### Endpoint 1: `GET /api/v1/wards`
- **Description:** Returns GeoJSON FeatureCollection of all 24 administrative wards with baseline attributes converted from the KML.
- **Properties in each feature:**
  - `ward_id`: `"F-S"`, `"K-W"`, etc.
  - `original_name`: `"F/S"`, `"K/W"`, etc.
  - `object_id`: integer from KML
  - `Shape__Area`: float from KML
  - `Shape__Length`: float from KML
  - `total_population_2011`: integer (from Census join)
  - `slum_population_2011`: integer (from Census join)

#### Endpoint 2: `GET /api/v1/exposure`
- **Description:** Returns exposure scores for all 24 wards for a specified date.
- **Query Parameters:** `date` (string `YYYY-MM-DD`, default: latest available date).
- **Response Schema (`200 OK`):**
```json
{
  "status": "success",
  "observation_date_ist": "2026-07-04",
  "mode": "historical_replay",
  "disclaimer": "Experimental Environmental Exposure Estimate — Not Validated Disease Incidence",
  "summary": {
    "total_wards": 24,
    "emergency_count": 2,
    "warning_count": 4,
    "watch_count": 5,
    "normal_count": 13,
    "provisional_count": 3
  },
  "wards": [
    {
      "ward_id": "L",
      "original_name": "L",
      "object_id": 14,
      "ward_name": "Kurla",
      "rainfall_24h_mm": 78.1,
      "rainfall_source": "OPEN_METEO_GRID",
      "grid_point": { "lat": 19.065, "lon": 72.879 },
      "hazard_score": 50.0,
      "susceptibility_multiplier": 1.165,
      "exposure_score": 58.3,
      "risk_tier": "WARNING",
      "data_status": "OBSERVED_COMPLETE",
      "data_lineage": {
        "rainfall": "DERIVED",
        "hotspots": "OBSERVED",
        "census": "OBSERVED"
      },
      "data_quality_warnings": []
    }
  ]
}
```

#### Endpoint 3: `GET /api/v1/replay/july2026`
- **Description:** Returns July 2026 date-series metadata and historical benchmark markers.
- **Response Schema (`200 OK`):**
```json
{
  "scenario_id": "july_2026",
  "title": "July 2026 Deluge Replay",
  "date_range": { "start": "2026-06-30", "end": "2026-07-10" },
  "historical_benchmarks": [
    {
      "timestamp_ist": "2026-07-06T22:39:00+05:30",
      "event_type": "OFFICIAL_CIVIC_ADVISORY",
      "authority": "BMC Public Health Department",
      "description": "Citywide advisory urging citizens with floodwater contact to seek medical care within 72 hours",
      "source_reference": "Free Press Journal, 6 July 2026, 10:39 PM IST"
    },
    {
      "period": "July 2026",
      "event_type": "OFFICIAL_MONTHLY_TOTAL",
      "authority": "BMC Epidemiology Cell",
      "description": "Citywide monthly leptospirosis cases reported as 78 (up from 33 in June)",
      "reporting_nature": "Monthly aggregate citywide total; no daily or ward-level breakdown"
    }
  ],
  "available_dates": ["2026-06-30", "2026-07-01", "2026-07-02", "2026-07-03", "2026-07-04", "2026-07-05", "2026-07-06", "2026-07-07", "2026-07-08", "2026-07-09", "2026-07-10"]
}
```

---

## 8. Frontend Implementation Blueprint

### 8.1 Modular Component Architecture

```
frontend/src/
├── assets/
│   └── mumbai_wards_24.geojson       # Converted from BMC ward KML
├── components/
│   ├── dashboard/
│   │   ├── DashboardLayout.tsx       # Map + Sidebar container
│   │   ├── WardListTable.tsx         # Sortable list of 24 wards & scores
│   │   └── SummaryCards.tsx          # Tier count chips (Normal/Watch/Warn/Emerg)
│   ├── map/
│   │   ├── WardMap.tsx               # Leaflet map component
│   │   └── MapLegend.tsx             # Visual tier color key
│   ├── drawer/
│   │   ├── EvidenceDrawer.tsx        # Selected ward inspection panel
│   │   ├── FactorBreakdown.tsx       # Hazard vs Susceptibility components
│   │   ├── MissingDataBadge.tsx      # Visible warning for partial data
│   │   └── ProvenanceBadge.tsx       # Source URL, timestamp, SHA-256
│   └── replay/
│       ├── TimeMachineBanner.tsx     # Prominent replay indicator
│       ├── DateScrubber.tsx          # 30 Jun - 10 Jul slider control
│       └── HistoricalMarkersView.tsx # Verified BMC advisory & case notes
├── hooks/
│   ├── useWardsGeoJSON.ts            # Loads & caches 24-ward geometry
│   ├── useExposureScores.ts          # Fetches scores for active date
│   └── useReplayState.ts             # Manages scrubber date and mode
├── styles/
│   └── tokens.css                    # Design tokens (colors, spacing, typography)
└── App.tsx                           # Root layout provider
```

### 8.2 Decoupling & Redesign Guarantee
All data fetching and calculation interfaces are isolated in `hooks/` and `services/api.ts`. The UI components consume sanitized data objects. Any future visual redesign (e.g., switching from Leaflet to MapLibre, or changing themes) can be accomplished by editing presentation components without altering calculation logic or API contracts `[PROPOSAL]`.

---

## 9. Revised 6-Phase Implementation Roadmap

The implementation is structured into **6 sequential, dependency-aware phases**. No phase may begin without explicit human review and approval of the preceding phase's exit gate.

---

### Phase 0: Feasibility, Dataset Ingestion & Real-Data Audit

#### 1. Objective & Justification
Audit the real starting assets in the workspace—specifically validating the raw `BMC ward-boundary dataset.kml`, converting it to clean GeoJSON, normalizing identifiers, and auditing the separate census, hotspot, and weather records. Confirm all source timestamps, spatial resolutions, and licenses before scaffolding application code.

#### 2. Scope & Exact Deliverables
- **Spatial Processing of `BMC ward-boundary dataset.kml`:**
  1. Validate all 24 ward geometries and inspect their attributes (`NAME`, `OBJECTID`, `Shape__Area`, `Shape__Length`).
  2. Convert the KML to GeoJSON while preserving polygon and multipart (MultiPolygon) geometry without data corruption.
  3. Normalize ward identifiers to canonical BMC codes, mapping slash formats (e.g., `F/S` $\rightarrow$ `F-S`, `K/W` $\rightarrow$ `K-W`, `G/S` $\rightarrow$ `G-S`, `H/E` $\rightarrow$ `H-E`, etc.), while preserving the original ward name and `OBJECTID`.
  4. Verify that the converted GeoJSON contains exactly 24 distinct wards and that no geometries were lost or corrupted.
  5. Compute geographic centroids $(\text{lat}_w, \text{lon}_w)$ for all 24 wards.
- **Separate Dataset Audits (Do not assume KML provides these):**
  - Census 2011: Audit ward population and slum population tables, documenting row-level reconciliation.
  - Flood Hotspots: Audit BMC 2022 list, geocode verified chronic locations, and record missing coverage.
  - Weather: Ingest Open-Meteo hourly weather for all 24 centroids (1–10 July 2026) aggregated strictly into 08:30 IST windows.
- **`docs/DATA_AUDIT_REPORT.md`:** Comprehensive audit documenting:
  1. Source inventory (URLs, licenses, date ranges, resolution, retrieval method, verification status).
  2. KML conversion method, original filename, and geometric validation results.
  3. Record of raw assets preserved in `data/raw/` and normalized assets in `data/processed/`.
  4. Missing-data and coverage report across all 24 wards.
  5. Final proposed scoring methodology based on verified inputs.
  6. List of unresolved issues and honest fallbacks.
- **`data/provenance_ledger.json`:** Cryptographic SHA-256 hashes and metadata for all raw and processed files.

#### 3. Features Explicitly Excluded
- No application code, server processes, or UI rendering.

#### 4. Prerequisites & Dependencies
- User approval of this revised implementation plan.
- Presence of `BMC ward-boundary dataset.kml` in the workspace `[FACT: ALREADY_VERIFIED]`.

#### 5. Expected Files Affected
- `data/raw/BMC_ward_boundary_dataset.kml` (copied to raw store)
- `data/processed/mumbai_wards_24.geojson` (converted GeoJSON)
- `data/processed/ward_census_vulnerability.csv`
- `data/processed/verified_flood_hotspots.json`
- `data/processed/weather_july_2026_ist.json`
- `data/provenance_ledger.json`
- `docs/DATA_AUDIT_REPORT.md`

#### 6. Ordered Technical Tasks
1. Parse and validate `BMC ward-boundary dataset.kml` using Python's standard `xml.etree.ElementTree` or `fastkml`/`shapely` parser.
2. Inspect Placemarks, confirm 24 features exist, and verify polygon coordinate rings.
3. Convert geometries to standard GeoJSON format (`Polygon` / `MultiPolygon`), preserving `NAME`, `OBJECTID`, `Shape__Area`, `Shape__Length`.
4. Apply identifier normalization: map slash codes to hyphen codes (`F/S` $\rightarrow$ `F-S`, `K/W` $\rightarrow$ `K-W`), generating canonical `ward_id`.
5. Compute geometric centroid coordinates $(\text{lat}_w, \text{lon}_w)$ for each of the 24 wards.
6. Verify converted GeoJSON validates with standard GIS tools and contains exactly 24 features.
7. Transcribe and audit 2011 Census population and slum population figures into `ward_census_vulnerability.csv`.
8. Audit BMC 2022 chronic flood hotspots; geocode verified locations.
9. Fetch and normalize Open-Meteo July 2026 hourly weather for all 24 ward centroids into 08:30 IST daily totals.
10. Generate cryptographic SHA-256 digests for all files and compile `docs/DATA_AUDIT_REPORT.md`.

#### 7. Verification Tests
- Check converted GeoJSON contains exactly 24 features with canonical IDs (`A` through `T`, `K-W`, etc.).
- Confirm no geometries were lost or corrupted during KML conversion.
- Verify `OBJECTID` and original `NAME` are preserved in GeoJSON feature properties.
- Confirm 0 wards have missing population or negative land area.
- Verify 08:30 IST rainfall sums match recorded hourly sums.
- Re-hash raw assets and verify SHA-256 match.

#### 8. Acceptance Criteria
- Converted `mumbai_wards_24.geojson` parses cleanly and renders 24 valid polygons.
- Complete data audit report signed off with no fabricated records.
- KML conversion method, original filename, and validation results fully documented.

#### 9. Risks & Fallbacks
- *Risk:* KML contains multipart geometries (`<MultiGeometry>`) that fail standard single-polygon parsers.
- *Fallback:* Handle both `<Polygon>` and `<MultiGeometry>` explicitly, mapping to GeoJSON `MultiPolygon`.

#### 10. Exit Gate
- **EXIT GATE 0:** Data audit report and normalized datasets reviewed and approved by user.

---

### Phase 1: Minimal Application Foundation

#### 1. Objective & Justification
Establish the core Python backend (FastAPI) and frontend (React 18 + Vite + TypeScript) foundation, configuration management, and basic UI container.

#### 2. Scope & Exact Deliverables
- `backend/pyproject.toml` and minimal FastAPI server (`backend/app/main.py`) with `/api/v1/health` endpoint.
- `frontend/package.json`, Vite configuration, and responsive layout shell (`frontend/src/App.tsx`).
- Basic design token stylesheet (`frontend/src/styles/tokens.css`).
- Cross-origin communication working between Vite dev server and FastAPI.

#### 3. Features Explicitly Excluded
- Exposure calculation logic or interactive map rendering.

#### 4. Prerequisites & Dependencies
- Approval of Exit Gate 0.

#### 5. Expected Files Affected
- `backend/app/main.py`, `backend/pyproject.toml`
- `frontend/package.json`, `frontend/src/App.tsx`, `frontend/src/styles/tokens.css`

#### 6. Ordered Technical Tasks
1. Scaffold Python environment and install FastAPI, Uvicorn, Pydantic.
2. Build FastAPI health check endpoint returning JSON status.
3. Scaffold Vite React TypeScript project.
4. Establish design token variables in `tokens.css`.
5. Connect frontend API client to fetch `/api/v1/health` on initial load.

#### 7. Verification Tests
- `pytest` verifying `/api/v1/health` returns HTTP 200.
- Frontend test verifying application shell mounts without console errors.

#### 8. Acceptance Criteria
- Concurrent execution of backend and frontend displays a healthy connected application shell.

#### 9. Risks & Fallbacks
- *Risk:* Port conflicts on default development ports.
- *Fallback:* Configure fallback ports in `.env`.

#### 10. Exit Gate
- **EXIT GATE 1:** Baseline dual-process application shell running and approved.

---

### Phase 2: Exposure Score Engine (Feature 1)

#### 1. Objective & Justification
Implement the pure, deterministic environmental exposure scoring function, input validators, strict missing-data handlers, and mathematical unit tests.

#### 2. Scope & Exact Deliverables
- `backend/app/analytics/exposure.py`: Implementation of $H(R)$, $M(w)$, and $E(w, d)$.
- `backend/app/models/schemas.py`: Pydantic schemas for Ward, Weather, and Exposure entities.
- Mathematical test suite (`backend/tests/test_exposure.py`) validating all boundary and piecewise cases.
- Endpoint `GET /api/v1/exposure` returning calculated scores for all 24 wards.

#### 3. Features Explicitly Excluded
- Frontend map rendering or historical date scrubber.

#### 4. Prerequisites & Dependencies
- Approval of Exit Gate 1.

#### 5. Expected Files Affected
- `backend/app/analytics/exposure.py`
- `backend/app/models/schemas.py`
- `backend/app/api/routes_exposure.py`
- `backend/tests/test_exposure.py`

#### 6. Ordered Technical Tasks
1. Implement Pydantic models with strict type validation.
2. Code piecewise linear IMD hazard function $H(R)$.
3. Code ward susceptibility multiplier $M(w)$ with missing-data fallback handling.
4. Code composite $E(w, d)$ function with rounding and clamping.
5. Write and execute complete unit test suite matching documented mathematical cases.
6. Wire calculation into FastAPI route `GET /api/v1/exposure`.

#### 7. Verification Tests
- Test 0 mm rain yields $E(w, d) = 0.0$ (`NORMAL`).
- Test 85 mm rain with $F=0.75, V=0.80$ yields $E(w, d) = 58.3$ (`WARNING`).
- Test 135 mm rain with $F=0.75, V=0.80$ yields $E(w, d) = 82.1$ (`EMERGENCY`).
- Test missing hotspot input yields `PROVISIONAL_PARTIAL` with explicit warning flag.

#### 8. Acceptance Criteria
- 100% of mathematical unit tests pass without assertion errors.
- API endpoint returns validated JSON payloads in $< 20\text{ ms}$.

#### 9. Risks & Fallbacks
- *Risk:* Floating-point rounding discrepancies.
- *Fallback:* Explicitly enforce `round(val, 1)` at score boundary.

#### 10. Exit Gate
- **EXIT GATE 2:** Mathematical engine and unit tests passing and approved.

---

### Phase 3: Basic Ward Dashboard & Explainability (Feature 2)

#### 1. Objective & Justification
Connect the exposure engine to a clean, responsive Leaflet map-and-list dashboard with an auditable "Why This Alert?" evidence drawer and visible missing-data flags.

#### 2. Scope & Exact Deliverables
- `frontend/src/components/map/WardMap.tsx`: Leaflet choropleth coloring 24 wards by risk tier.
- `frontend/src/components/dashboard/WardListTable.tsx`: Sortable list of wards, rainfall, and tiers.
- `frontend/src/components/drawer/EvidenceDrawer.tsx`: Selected ward drawer showing factor breakdowns, provenance hash, data warnings, and experimental disclaimers.

#### 3. Features Explicitly Excluded
- Time Machine date scrubber (handled in Phase 4).

#### 4. Prerequisites & Dependencies
- Approval of Exit Gate 2.

#### 5. Expected Files Affected
- `frontend/src/components/map/*`
- `frontend/src/components/dashboard/*`
- `frontend/src/components/drawer/*`
- `frontend/src/App.tsx`

#### 6. Ordered Technical Tasks
1. Integrate `react-leaflet` and bind the converted 24-ward GeoJSON boundaries.
2. Implement choropleth styling mapped to exposure tiers.
3. Implement `WardListTable` displaying sortable ward exposure metrics.
4. Implement `EvidenceDrawer` opening on ward click, rendering $H(R)$, $M(w)$, provenance, and disclaimers.
5. Render visible ⚠️ `PARTIAL DATA` badge for wards with incomplete inputs.

#### 7. Verification Tests
- Clicking Ward `L` renders drawer with Ward `L` details.
- Verifying non-diagnostic disclaimer text is present in drawer.
- Verifying missing-data warning renders for wards with partial inputs.

#### 8. Acceptance Criteria
- Dashboard renders all 24 wards legibly on standard desktop and tablet viewports.
- Evidence drawer clearly attributes score factors.

#### 9. Risks & Fallbacks
- *Risk:* Leaflet tile server network timeouts.
- *Fallback:* Bundle local fallback basemap tiles or provide vector-only choropleth mode.

#### 10. Exit Gate
- **EXIT GATE 3:** Dashboard and explainability drawer operational and approved.

---

### Phase 4: July 2026 Historical Replay (Feature 3)

#### 1. Objective & Justification
Build the interactive Time Machine date scrubber for the 1–10 July 2026 deluge, calculating point-in-time exposure without future-data leakage, and contrasting results with verified historical benchmarks.

#### 2. Scope & Exact Deliverables
- `backend/app/api/routes_replay.py`: Serves historical date slices (30 June to 10 July 2026).
- `frontend/src/components/replay/DateScrubber.tsx`: Interactive date slider driving active replay date.
- `frontend/src/components/replay/HistoricalMarkersView.tsx`: Displays verified BMC advisory timestamp (6 July 22:39) and monthly case totals as separate reference context.

#### 3. Features Explicitly Excluded
- Replay across other years (2005, 2025).

#### 4. Prerequisites & Dependencies
- Approval of Exit Gate 3.

#### 5. Expected Files Affected
- `backend/app/api/routes_replay.py`
- `frontend/src/components/replay/*`
- `frontend/src/App.tsx`

#### 6. Ordered Technical Tasks
1. Build backend replay route slicing weather series strictly by requested date.
2. Build frontend `DateScrubber` slider updating application state.
3. Add prominent `HISTORICAL REPLAY MODE` visual indicator.
4. Add static historical benchmark annotations to the timeline.

#### 7. Verification Tests
- Scrubbing to 3 July verifies only weather up to 3 July is utilized.
- Verify lead-time between 5 July alert and 6 July BMC advisory is calculated as $\approx 38$ hours `[INFERENCE]`.

#### 8. Acceptance Criteria
- Scrubbing the slider smoothly updates map choropleths across the 1–10 July 2026 timeline.
- Historical benchmarks clearly distinguish observed facts from modeled scores.

#### 9. Risks & Fallbacks
- *Risk:* UI lag during rapid slider scrubbing.
- *Fallback:* Debounce slider change handler by 50 ms.

#### 10. Exit Gate
- **EXIT GATE 4:** Historical replay verified and approved.

---

### Phase 5: Integration, Failure Handling & MVP Verification

#### 1. Objective & Justification
Harden the entire end-to-end system: test failure modes (stale data, missing hotspots, API disconnection), verify setup instructions, and rehearse the demonstration script.

#### 2. Scope & Exact Deliverables
- Graceful degradation: offline fallback toggle serving local cached JSON.
- Data-quality warnings displayed when hotspots or weather feeds are incomplete.
- Comprehensive end-to-end regression testing.
- Clean `README.md` containing simple setup and run instructions.

#### 3. Features Explicitly Excluded
- Any new product features.

#### 4. Prerequisites & Dependencies
- Approval of Exit Gate 4.

#### 5. Expected Files Affected
- `README.md`
- `frontend/src/services/api.ts`
- Root test suites

#### 6. Ordered Technical Tasks
1. Test and verify offline mode (disconnect network; verify complete dashboard and replay function).
2. Test missing-hotspot fallback flags in UI.
3. Validate complete clean build (`npm run build` and `pytest`).
4. Write clear setup instructions in `README.md`.

#### 7. Verification Tests
- Automated test suite executes and passes 100%.
- System launches on clean terminal in under 2 minutes following `README.md`.

#### 8. Acceptance Criteria
- All criteria in the Definition of MVP Completion (Section 11) are satisfied.

#### 9. Risks & Fallbacks
- *Risk:* Unhandled API errors crashing frontend.
- *Fallback:* Global React ErrorBoundary wrapping root layout.

#### 10. Exit Gate
- **FINAL EXIT GATE:** Final MVP sign-off and demonstration verification.

---

## 10. Testing and Quality Assurance

### 10.1 Test Matrix

| Category | Test Target | Precondition / Input | Expected Assertion |
|---|---|---|---|
| **KML Geometry** | Ward Polygons | `BMC ward-boundary dataset.kml` | Parses exactly 24 placemarks; all geometries valid without null rings. |
| **KML Conversion** | GeoJSON Conversion | Processed `mumbai_wards_24.geojson` | 24 distinct features, preserves `OBJECTID` and original `NAME`, maps slash codes to canonical `ward_id`. |
| **Math Unit** | `HazardScore` | $R = 0.0\text{ mm}$ | Returns $0.0$ (`NORMAL`). |
| **Math Unit** | `HazardScore` | $R = 85.0\text{ mm}$ | Returns $50.029... \approx 50.0$. |
| **Math Unit** | `HazardScore` | $R = 135.0\text{ mm}$ | Returns $70.455... \approx 70.5$. |
| **Math Unit** | `HazardScore` | $R = 300.0\text{ mm}$ | Returns $99.55 \approx 99.6$. |
| **Math Unit** | `Susceptibility` | Ward with $F=0.75, V=0.80$ | Returns $1.165$. |
| **Math Unit** | `ExposureScore` | $R = 85.0\text{ mm}$, $F=0.75, V=0.80$ | Returns $58.3$ (`WARNING`). |
| **Math Unit** | `ExposureScore` | $R = 135.0\text{ mm}$, $F=0.75, V=0.80$ | Returns $82.1$ (`EMERGENCY`). |
| **Missing Data**| `ExposureScore` | Missing $F_{\text{norm}}$ | Returns $M=0.70+0.60V$, sets status `PROVISIONAL_PARTIAL` + warning. |
| **Replay Integrity**| Time Machine | Scrub to `2026-07-04` | Returned payload uses no data beyond `2026-07-04`. |
| **Safety Guard** | Disclaimers | Rendered Evidence Drawer | Text confirms *"Experimental Environmental Exposure Estimate"*; no clinical prescriptions. |
| **Resilience** | Offline Fallback | Network disconnected | Application loads and replays July 2026 without errors. |

---

## 11. Definition of MVP Completion

The VARSHA MVP is complete when and only when:
- [ ] **KML Conversion Verified:** Conversion and validation of `BMC ward-boundary dataset.kml` to GeoJSON successfully produces 24 distinct wards with canonical identifiers and preserved geometries/attributes.
- [ ] **Documented & Reconciled Mathematics:** The exposure scoring formula is implemented, and 100% of unit tests match its written mathematical logic (including $85\text{ mm} \rightarrow 58.3$).
- [ ] **Traceable Inputs & Honest Missing Data:** Scores derive strictly from traceable weather and ward inputs; missing flood spots are flagged with visible `PROVISIONAL_PARTIAL` warnings rather than silently filled defaults.
- [ ] **Functional Dashboard & Explainability:** The Leaflet map and list view render all 24 canonical wards, and selecting any ward opens the evidence drawer detailing contributing factors and disclaimers.
- [ ] **Deterministic Historical Replay:** The July 2026 Time Machine slider scrubs smoothly without future-data leakage, correctly showing point-in-time exposure progression alongside verified historical benchmarks.
- [ ] **Strict Visual Distinction:** Observed historical facts, modeled exposure scores, and replay modes are distinctly labeled and cannot be confused.
- [ ] **Automated Tests & Reproducible Setup:** All unit and integration tests pass, and the application launches cleanly on a new machine following documented setup instructions.

---

## 12. Architecture Review Sign-Off & Next Steps

This revised plan reflects the highest standard of scientific integrity, mathematical precision, and real-data transparency.

In accordance with non-negotiable instructions:
- **No application code has been generated.**
- **No packages have been installed.**
- **No database schemas or scaffolding have been created.**

Implementation will proceed strictly one phase at a time following explicit human review and approval.

**Awaiting approval to begin Phase 0.**
