# Problem Statement: Health Outbreak Detection & Alert System
### CodeAstra 2.0 · Problem Code: P8 / WEB-2 · Domain: Web & Product Development
**Project Name:** VARSHA (*Vector-And-Rain-driven Surveillance for Health Alerts*)  
**Target Jurisdiction:** Municipal Corporation of Greater Mumbai (MCGM / BMC), Mumbai, Maharashtra  
**Author Team:** CodeAstra 2.0 Finalist Team  

---

## 1. Official Problem Statement

> **"Analyse real-time health and public-health data to detect unusual disease patterns early and issue timely alerts about potential outbreaks."**  
> — *CodeAstra 2.0 Problem Catalogue, Problem WEB-2 (P8)*

---

## 2. Background & Real-World Context

Mumbai, home to over 12.4 million residents across 24 administrative municipal wards, faces extreme seasonal monsoon deluges annually. Torrential rainfall combined with high tides and low-lying topography causes widespread urban inundation and severe drainage saturation. 

During flood events, sewage overflows and urban runoff contaminate surface waters with zoonotic pathogens—most acutely ***Leptospira interrogans***, excreted in the urine of infected rodents and stray animals.

```
                      THE MONSOON TRANSMISSION LIFECYCLE
                      
   Torrential Deluge (IMD Heavy Rain >64.5mm)
           │
           ▼
   Low-Lying Waterlogging (70 Chronic Flood Bowls)
           │
           ▼
   High-Vulnerability Slum Exposure (52.5% Slum Population)
           │
           ├──────────────────────────────┐
           ▼                              ▼
   Direct Water Contact        Vector Breeding Sites
   (Leptospirosis Golden       (Aedes/Anopheles Mosquitoes:
    Window: 24–72h)             Dengue & Malaria: 2–6 Weeks)
```

### The Clinical Reality: The 24–72 Hour Prophylaxis Golden Window
According to Brihanmumbai Municipal Corporation (BMC) Public Health Guidelines, individuals who wade through contaminated monsoon floodwaters must receive medical evaluation and prophylactic antibiotics (**Doxycycline 200 mg** or **Azithromycin**) **within 24 to 72 hours of water exposure** to effectively prevent the onset of severe leptospirosis, pulmonary hemorrhage syndrome, and renal failure.

However, once symptoms develop after the **7 to 12-day biological incubation lag** (*Supe et al., National Medical Journal of India 2018*), case fatality rates in hospitalized patients surge to 10–20%.

---

## 3. The Core Problem: The Warning-Window Paradox

Existing municipal and national public health surveillance frameworks suffer from three systemic structural failures:

### Failure 1: The Retrospective Advisory Lag
In extreme weather events, civic health alerts have historically been issued **after** the golden prevention window has closed:
* **1–2 July 2026:** Heavy rainfall begins across Mumbai (Santacruz IMD logs 205 mm in 24 hours).
* **4 July 2026:** Chronic low-lying basins (Hindmata, Kurla Kranti Nagar, Milan Subway) report severe waterlogging; thousands wade through floodwaters.
* **6 July 2026 (10:39 PM IST):** BMC issues a retrospective press advisory urging citizens who waded through floodwaters to seek prophylaxis within 72 hours (*Free Press Journal, 6 July 2026*).
* **The Consequence:** For citizens exposed on 1–3 July, the **72-hour prophylaxis window had already expired** before the advisory reached their mobile phones. Consequently, Mumbai leptospirosis cases jumped by **+136%** from 33 in June to 78 in July 2026 (148 cases and 2 fatalities citywide).

### Failure 2: The Multi-Week Reporting Lag of Official Surveillance
* Official surveillance through India’s Integrated Disease Surveillance Programme (IDSP) and National Centre for Disease Control (NCDC) relies on manual data reconciliation from hospital sentinel sites.
* Public IDSP weekly outbreak bulletins are published with a **37 to 51-day publication lag**, rendering them completely non-actionable for acute post-flood intervention.

### Failure 3: Purely Media-Reactive Outbreak Surveillance
* Existing AI solutions (such as Wadhwani AI / NCDC *Health Sentinel*) scan news media and online publications in multiple languages.
* While effective for media monitoring, news articles appear only **after** patients develop acute symptoms, seek hospital admission, and are reported by journalists. By definition, media-based alerting fires 10–14 days too late for acute flood prophylaxis.

### Failure 4: Spatial Blindness and Uniform Citywide Bulletins
* Mumbai's 24 wards exhibit extreme variation in built infrastructure, drainage capacity, and socioeconomic vulnerability:
  * Slum population proportion varies from **10.0%** in Ward D (Malabar Hill / Grant Road) to **84.9%** in Ward M-East (Govandi / Mankhurd).
  * Population density spans from **7,566 / km²** in Ward T (Mulund) to **86,859 / km²** in Ward C (Bhuleshwar).
  * 70 chronic flood hotspots are clustered heavily in specific low basins (Wards F-North, F-South, L, and H-East).
* Broad, non-spatial citywide alerts produce civic alert fatigue while failing to mobilize municipal resources (medical vans, doxycycline distribution camps) to the specific wards facing the highest environmental hazard.

---

## 4. Target Users & Stakeholders

| User Group | Organization | Operational Need |
| :--- | :--- | :--- |
| **Ward Medical Officers of Health (MOH)** | BMC Public Health Dept (24 Wards) | Immediate notification when their ward crosses hazardous exposure thresholds to deploy local fever clinics and pre-position prophylaxis. |
| **Epidemiology Cell Officers** | BMC Disaster Management & Kasturba Hospital | Spatial visualization of which wards are accumulating flood exposure 7–14 days before patient surge lands at tertiary hospitals. |
| **Dispensary Doctors & Clinics** | ~200 BMC *Aapla Dawakhana* Clinics | Advance warning to stock oral Doxycycline / Azithromycin blister packs and anticipate walk-in patients. |
| **Community Health Workers (ASHAs)** | Community Volunteers in Slum Pockets | Targeted ward-level alerts to conduct door-to-door prophylaxis mobilization in high-exposure slum settlements. |
| **Citizens & Commuters** | Public in High-Risk Flood Basins | Transparent, explainable awareness of local flood risk and prompt guidance to seek medical evaluation within the 72-hour window. |

---

## 5. The Solution: VARSHA

**VARSHA** (*Vector-And-Rain-driven Surveillance for Health Alerts*) shifts municipal public health response from **reactive disease counting** to **predictive environmental exposure surveillance**.

Rather than waiting for hospital admission logs or news reports, VARSHA fuses real-time meteorological precipitation exceedance with verified municipal spatial vulnerabilities to compute a transparent, deterministic **Ward Environmental Exposure Score**:

$$E(w, d) = \min\Big(100.0, \; \text{round}\big(H(R(w, d)) \times M(w), \; 1\big)\Big)$$

Where:
* **$H(R) \in [0.0, 100.0]$:** Piecewise continuous meteorological hazard function mapped directly to official **India Meteorological Department (IMD)** 24-hour rainfall classification thresholds ($35.5, 64.5, 115.6, 204.5\text{ mm}$).
* **$M(w) \in [0.70, 1.30]$:** Ward susceptibility multiplier derived from verified Census 2011 demographic vulnerability ($V_{\text{norm}}$) and 70 BMC chronic flood hotspots ($F_{\text{norm}}$):
  $$M(w) = 0.70 + 0.30 \cdot F_{\text{norm}}(w) + 0.30 \cdot V_{\text{norm}}(w)$$
* **Four Standard Actionable Risk Tiers:**
  * 🟢 **NORMAL** ($0.0 \le E < 30.0$): Standard baseline hygiene surveillance.
  * 🟡 **WATCH** ($30.0 \le E < 55.0$): Heightened awareness; monitor local waterlogging.
  * 🟠 **WARNING** ($55.0 \le E < 75.0$): Mobilize *Aapla Dawakhana* inventory; alert community health workers.
  * 🔴 **EMERGENCY** ($75.0 \le E \le 100.0$): Trigger acute 72-hour prophylaxis window; deploy mobile outreach.

---

## 6. Real-World Datasets Grounding

VARSHA relies exclusively on verified, authentic civic and meteorological datasets with zero synthetic placeholders:

1. **BMC Ward Boundaries:** 24 canonical administrative polygons converted from official MCGM KML boundaries with valid closed geometries and multipart polygons preserved (Total municipal area: $474.40\text{ km}^2$).
2. **Census 2011 Demographics:** 12,442,373 total population and 6,534,460 slum population across all 24 wards verified against official MCGM Table 1 (*Banaji 2020*).
3. **Chronic Flood Hotspots:** 70 geocoded chronic waterlogging locations from BMC Disaster Management Guidelines and Mumbai Traffic Police annual monsoon action records, with 100% strict polygon containment verified.
4. **ERA5 Meteorological Reanalysis:** High-resolution Open-Meteo ERA5 hourly reanalysis in `Asia/Kolkata` IST, supporting both standard Calendar Day and official IMD 24-hour (08:30 IST to 08:30 IST) observation windows.

---

## 7. Solution Capabilities (Delivered MVP)

1. **Interactive 24-Ward Choropleth GIS Map:** Visualizes live exposure across Mumbai on an Esri World Dark Gray Basemap with toggleable chronic flood hotspot markers.
2. **Ward Evidence & Explainability Drawer:** Clicking any ward displays the complete mathematical derivation ($H \times M$), contributing factors, verified Census statistics, localized flood points, and data lineage tags.
3. **July 2026 Historical Time Machine:** Replays the real 30 June – 10 July 2026 Mumbai monsoon crisis point-in-time without future-data leakage, validating that VARSHA’s algorithmic emergency threshold fired on **5 July at 08:30 IST**—providing a **+38.15-hour advance lead time** before the BMC retrospective public advisory was issued on 6 July at 10:39 PM IST.
4. **Scenario Simulation Sandbox:** Allows civic planners to simulate uniform or ward-specific rainfall stress tests ($0\text{ to }350\text{ mm}$) to test drainage resilience without contaminating historical baseline records.

---

## 8. Explicit Non-Goals & Scope Boundaries

To maintain scientific rigor and avoid deceptive clinical claims:
* **No Unverified Clinical Case Forecasting:** VARSHA models *environmental exposure to flood hazard and demographic vulnerability*. It does not claim to predict daily patient bed occupancy or individual pathogen titers, as ward-level daily clinical data is not published by civic hospitals due to patient confidentiality.
* **No Black-Box Machine Learning:** The scoring engine is deterministic, monotonic, and auditable by public health officers.
* **No Automated Public SMS/WhatsApp Blasts:** Public health alerts require human medical officer review to prevent panic and ensure liability controls.

---

## 9. Expected Civic Impact

* **+38.1 Hour Advance Warning Lead Time:** Replaces retrospective press alerts with real-time early warning triggered at the moment rainfall exceedance occurs.
* **Preservation of the 72-Hour Prophylaxis Golden Window:** Enables targeted prophylaxis distribution before the biological incubation period ends.
* **Precision Civic Resource Allocation:** Allows municipal health authorities to deploy medical vans, vector-control squads, and doxycycline supplies to the specific wards facing Critical exposure rather than diffusing resources uniformly.
* **Zero-Cost, Keyless Civic Infrastructure:** Requires zero third-party API keys, paid subscriptions, or complex database servers—enabling immediate deployment on municipal workstations and lightweight cloud hosting.
