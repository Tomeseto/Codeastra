# VARSHA — Complete Consolidated Project & Codebase Dossier

> **Hackathon:** CODEASTRA 2.0 · Rajiv Gandhi Institute of Technology (RGIT), Mumbai  
> **Domain:** WEB-2 — Health Outbreak Detection & Alert System  
> **Product:** **VARSHA** (*Vector-And-Rain-driven Surveillance for Health Alerts*)  
> **Primary Executable File:** [`varsha_all_in_one.py`](file:///c:/Users/SEBIN/Desktop/RGIT/varsha_all_in_one.py)  
> **Data Package ZIP:** [`VARSHA_Data_Package.zip`](file:///c:/Users/SEBIN/Desktop/RGIT/VARSHA_Data_Package.zip)  
> **Presentation Deck:** [`VARSHA_CODEASTRA2_V3.pptx`](file:///c:/Users/SEBIN/Desktop/RGIT/VARSHA_CODEASTRA2_V3.pptx)  

---

## 1. Executive Summary & Core Value Proposition

| Metric / Dimension | Traditional Public Health Response | VARSHA Early Warning System |
|---|---|---|
| **Primary Trigger** | Waits for clinical cases / hospital admissions | Predicts risk directly from **calibrated rainfall & flood hotspots** |
| **Notification Lead Time** | ~6 to 8 weeks after initial exposure (IDSP bulletins) | **Same day** of flood event; **5 days earlier** than BMC advisory |
| **Spatial Resolution** | Single advisory for the entire city of Mumbai | Granular, per-ward risk scoring for all **24 municipal wards** |
| **Targeting the Window** | Advisory issued after high-risk wading window has shut | Alerts issued within the critical **24–72 hour chemoprophylaxis window** |
| **Resource Allocation** | Static, legacy deployment of field workers | Priority-driven dispatch of fever camps, clinics & Doxycycline |
| **Linguistic Reach** | English / official press releases | Targeted citizen alerts in **Marathi, Hindi, and English** |

---

## 2. Mathematical Framework & Epidemiological Formulations

### 2.1 Ward Exposure Index $E(w, d)$
The daily exposure index for ward $w$ on day $d$ is given by:

$$E(w, d) = H(R_{\text{calibrated}}(w, d)) \times (1 + \kappa \times \text{Tide}(d)) \times F(w) \times V(w)$$

Where:
- $R_{\text{calibrated}}(w, d)$: Gauge-calibrated rainfall (mm) for ward $w$.
- $H(R)$: Rainfall hazard function:
  $$H(R) = \begin{cases} 0.05 & \text{if } R \le 15\text{ mm} \\ 0.2 + 0.3 \times \frac{R - 15}{64.5 - 15} & \text{if } 15 < R \le 64.5\text{ mm} \\ 0.5 + \min\left(1.5, \frac{R - 64.5}{64.5}\right) & \text{if } R > 64.5\text{ mm (IMD Heavy)} \end{cases}$$
- $\kappa$: High-tide amplification parameter ($\kappa = 0.30$). High tides ($\ge 4.5\text{ m}$) prevent gravitational outflow through storm outfalls into the Arabian Sea.
- $F(w)$: Normalized flood propensity of ward $w$:
  $$F(w) = \min\left(1.0, \frac{\text{Hotspots}(w) / \text{Area}_{\text{km}^2}(w)}{2.0}\right)$$
- $V(w)$: Socio-environmental vulnerability (Census 2011 slum fraction):
  $$V(w) = \frac{\text{Slum Population}(w)}{\text{Total Population}(w)}$$

### 2.2 Leptospirosis Incubation & Clinical Surge Lag Kernel
Following clinical surveillance findings from **Supe et al. (NMJI 2018)** from Mumbai's 2005 deluge:
- Mode of clinical presentation occurs **7–12 days post-flood event**.
- Gamma-shaped lag kernel:
  $$K(k) \propto k^{3.5} \exp(-k / 2.2)$$
  peaking at day 9–10 post-wading.

### 2.3 Rainfall Quantile Mapping Calibration
Global reanalysis grids (e.g., Open-Meteo ERA5) notoriously underestimate hyper-localized convective cloudbursts (e.g. 26 July 2005 recorded 69.6 mm in grid vs. 944 mm at Santacruz station). VARSHA calibrates raw grid predictions using empirical transfer functions derived from 25 years of NOAA GSOD Santacruz Station 43003 records.

---

## 3. Master Datasets Embedded in the Single-File Engine

### 3.1 All 24 Mumbai Administrative Wards
| Ward | Name / Major Areas | Pop (2011) | Slum Pop | Slum % | Area (km²) | Hotspots | Density (/km²) | Vulnerability Score |
|---|---|---|---|---|---|---|---|---|
| **A** | Colaba / Fort / Nariman Pt | 153,000 | 9,000 | 5.9% | 5.2 | 8 | 1.54 | 0.045 |
| **B** | Mazgaon / Dongri / Umerkhadi | 154,000 | 42,000 | 27.3% | 3.8 | 12 | 3.16 | 0.431 |
| **C** | Mandvi / Marine Lines / Bhuleshwar | 112,000 | 28,000 | 25.0% | 2.9 | 10 | 3.45 | 0.431 |
| **D** | Malabar Hill / Grant Rd / Walkeshwar | 167,000 | 30,000 | 18.0% | 5.6 | 7 | 1.25 | 0.112 |
| **E** | Byculla / Agripada / Madanpura | 365,000 | 161,000 | 44.1% | 6.8 | 18 | 2.65 | 0.584 |
| **F/N** | Sion / Matunga / Dharavi East | 558,000 | 374,000 | 67.0% | 11.2 | 31 | 2.77 | 0.928 |
| **F/S** | Parel / Sewri / Naigaon | 325,000 | 102,000 | 31.4% | 9.4 | 14 | 1.49 | 0.234 |
| **G/N** | Dharavi / Mahim / Dadar West | 387,000 | 224,000 | 57.9% | 6.3 | 22 | 3.49 | 1.010 |
| **G/S** | Worli / Prabhadevi / Lower Parel | 318,000 | 85,000 | 26.7% | 7.1 | 11 | 1.55 | 0.207 |
| **H/E** | Bandra East / Santacruz East / Vakola | 427,000 | 201,000 | 47.1% | 12.8 | 28 | 2.19 | 0.516 |
| **H/W** | Bandra West / Khar / Santacruz West | 178,000 | 34,000 | 19.1% | 6.9 | 9 | 1.30 | 0.124 |
| **K/E** | Andheri East / Jogeshwari East / Marol | 669,000 | 312,000 | 46.6% | 25.1 | 42 | 1.67 | 0.389 |
| **K/W** | Andheri West / Versova / Juhu | 603,000 | 201,000 | 33.3% | 22.3 | 35 | 1.57 | 0.261 |
| **L** | Kurla / Sakinaka / Asalpha | 800,000 | 472,000 | 59.0% | 24.0 | 48 | 2.00 | 0.590 |
| **M/E** | Chembur East / Govandi / Mankhurd | 564,000 | 321,000 | 56.9% | 21.4 | 37 | 1.73 | 0.492 |
| **M/W** | Chembur West / Tilak Nagar | 368,000 | 148,000 | 40.2% | 14.2 | 21 | 1.48 | 0.297 |
| **N** | Ghatkopar / Vikhroli West | 617,000 | 218,000 | 35.3% | 18.6 | 29 | 1.56 | 0.275 |
| **P/N** | Malad / Marve / Malvani | 683,000 | 289,000 | 42.3% | 28.4 | 33 | 1.16 | 0.245 |
| **P/S** | Goregaon / Aarey Colony | 496,000 | 174,000 | 35.1% | 18.9 | 24 | 1.27 | 0.223 |
| **R/C** | Borivali Central / Kandivali East | 516,000 | 161,000 | 31.2% | 29.7 | 19 | 0.64 | 0.100 |
| **R/N** | Dahisar / Dahisar East | 367,000 | 112,000 | 30.5% | 38.2 | 15 | 0.39 | 0.059 |
| **R/S** | Kandivali West / Charkop | 412,000 | 134,000 | 32.5% | 19.1 | 17 | 0.89 | 0.145 |
| **S** | Bhandup / Kanjurmarg / Powai | 537,000 | 168,000 | 31.3% | 32.1 | 22 | 0.69 | 0.108 |
| **T** | Mulund / Nahur | 372,000 | 89,000 | 23.9% | 28.8 | 14 | 0.49 | 0.059 |

---

## 4. How to Use the Single-File Engine: `varsha_all_in_one.py`

The script has **zero external dependencies** required for its core engine, simulations, APIs, and Web Dashboard.

```bash
# 1. Run the Interactive Web Application & Prototype Server (Default Port: 8000)
python varsha_all_in_one.py --serve
# Then open: http://localhost:8000 in any browser

# 2. Run the July 2026 Flood Time Machine in terminal
python varsha_all_in_one.py --simulate

# 3. Pull latest real data from Open-Meteo, NOAA, and WHO
python varsha_all_in_one.py --fetch

# 4. Export all structured datasets (JSON, CSV, GeoJSON) to folder
python varsha_all_in_one.py --export varsha_data

# 5. Automatically edit / generate the hackathon PPT deck (Slide 3-6)
python varsha_all_in_one.py --edit-ppt VARSHA_CODEASTRA2_Idea_PPT.pptx_V2.pptx VARSHA_CODEASTRA2_V3.pptx icon_cache
```

---

## 5. Web Prototype Architecture

The built-in web server provides a complete GUI and REST API:
- `GET /` — Full responsive dark-themed dashboard with glassmorphism design.
- `GET /api/wards` — JSON feed of all 24 wards with coordinates and vulnerability scores.
- `GET /api/simulate` — Replay data for the July 2026 flood event with daily surge cases.
- `GET /api/alerts` — Watch / Warning / Emergency alert texts in English, Hindi, and Marathi.
- `GET /api/plan` — Algorithmic resource allocations for fever camps, clinics, and Doxycycline.
- `GET /api/forecast` — Real-time live weather forecast integration from Open-Meteo.
