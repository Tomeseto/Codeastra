# VARSHA — Real Data Package Summary

> **Share this ZIP with your teammates:** `VARSHA_Data_Package.zip` (in `c:\Users\SEBIN\Desktop\RGIT\`)  
> **Data folder:** [`varsha_data/`](file:///c:/Users/SEBIN/Desktop/RGIT/varsha_data)

---

## What was fetched — 26 files, ~3.4 MB raw

### Live API Pulls (fetched 9 Oct 2026)

| File | Source | What it contains | Size |
|---|---|---|---|
| [`rain_jul2026_daily.json`](file:///c:/Users/SEBIN/Desktop/RGIT/varsha_data/rain_jul2026_daily.json) | Open-Meteo archive | Daily rain/temp/RH, 20 Jun – 31 Jul 2026. **Key: 1–7 Jul ≈596mm grid** | 5.7 KB |
| [`rain_aug2025_grid.json`](file:///c:/Users/SEBIN/Desktop/RGIT/varsha_data/rain_aug2025_grid.json) | Open-Meteo archive | Aug–Sep 2025 (16 Aug ≈127mm grid, station ≈245mm) | 5.0 KB |
| [`rain_2005deluge_grid.json`](file:///c:/Users/SEBIN/Desktop/RGIT/varsha_data/rain_2005deluge_grid.json) | Open-Meteo archive | Jul 2005 — **grid shows only 69.6mm vs real 944mm** (calibration proof) | 3.7 KB |
| [`rain_training_2010_2025_daily.json`](file:///c:/Users/SEBIN/Desktop/RGIT/varsha_data/rain_training_2010_2025_daily.json) | Open-Meteo archive | **5,601 daily records** (2010–2025) for model training | 651 KB |
| [`forecast_live.json`](file:///c:/Users/SEBIN/Desktop/RGIT/varsha_data/forecast_live.json) | Open-Meteo live | 16-day forecast + hourly, fetched today | 26 KB |
| [`ward_forecasts_live.json`](file:///c:/Users/SEBIN/Desktop/RGIT/varsha_data/ward_forecasts_live.json) | Open-Meteo live | 7-day forecast for 5 ward centroids (run all 24 in production) | 4 KB |
| [`noaa_2005deluge.json`](file:///c:/Users/SEBIN/Desktop/RGIT/varsha_data/noaa_2005deluge.json) | NOAA GSOD station 43003 | **22 station records; 26 Jul 2005 = 18.15in = 461mm** | 5.2 KB |
| [`noaa_aug2025.json`](file:///c:/Users/SEBIN/Desktop/RGIT/varsha_data/noaa_aug2025.json) | NOAA GSOD station 43003 | 24 records; 16 Aug ≈245mm, 20 Aug ≈209mm — matches IMD | 5.7 KB |
| [`noaa_history_2000_2025.json`](file:///c:/Users/SEBIN/Desktop/RGIT/varsha_data/noaa_history_2000_2025.json) | NOAA GSOD station 43003 | **9,355 daily station records** for bias/quantile mapping calibration | 2.2 MB |
| [`noaa_2026.json`](file:///c:/Users/SEBIN/Desktop/RGIT/varsha_data/noaa_2026.json) | NOAA GSOD | Empty — 2026 not yet published by NOAA (documented expected gap) | 0 KB |
| [`who_don_latest100.json`](file:///c:/Users/SEBIN/Desktop/RGIT/varsha_data/who_don_latest100.json) | WHO DON API | 100 latest WHO Disease Outbreak News items | 486 KB |
| `gdelt_lepto_mumbai.json` | GDELT DOC 2.0 | Leptospirosis Mumbai news articles (18 months) | ~varies |
| `gdelt_dengue_mumbai.json` | GDELT DOC 2.0 | Dengue Mumbai 2026 articles | ~varies |
| `gdelt_malaria_mumbai.json` | GDELT DOC 2.0 | Malaria Mumbai flood articles | ~varies |
| `gdelt_flood_outbreak.json` | GDELT DOC 2.0 | Mumbai flood disease outbreak news | ~varies |
| `gdelt_bmc_advisory.json` | GDELT DOC 2.0 | BMC 72-hour advisory articles | ~varies |

### Compiled Static Data

| File | What it contains |
|---|---|
| [`mumbai_wards_24.json`](file:///c:/Users/SEBIN/Desktop/RGIT/varsha_data/mumbai_wards_24.json) | **24 wards**: centroid lat/lon, pop 2011, slum pop, area km², hotspot count, slum_frac, vulnerability_score |
| [`mumbai_wards_24.csv`](file:///c:/Users/SEBIN/Desktop/RGIT/varsha_data/mumbai_wards_24.csv) | Same in CSV — load directly into pandas |
| [`mumbai_wards_centroids.geojson`](file:///c:/Users/SEBIN/Desktop/RGIT/varsha_data/mumbai_wards_centroids.geojson) | GeoJSON point features → drop straight into MapLibre |
| [`waterlogging_hotspots.json`](file:///c:/Users/SEBIN/Desktop/RGIT/varsha_data/waterlogging_hotspots.json) | 25 geocoded BMC flood hotspots (lat/lon/ward/severity). Full 386-spot list needs BMC RTI. |
| [`aapla_dawakhana_clinics.json`](file:///c:/Users/SEBIN/Desktop/RGIT/varsha_data/aapla_dawakhana_clinics.json) | 20 geocoded Aapla Dawakhana clinics + services list + BMC advisory context |
| [`bmc_disease_series.json`](file:///c:/Users/SEBIN/Desktop/RGIT/varsha_data/bmc_disease_series.json) | BMC monsoon case/death counts 2023–2026 per disease, each with source URL |
| [`varsha_alert_tiers.json`](file:///c:/Users/SEBIN/Desktop/RGIT/varsha_data/varsha_alert_tiers.json) | Watch/Warning/Emergency triggers + IMD thresholds + **Marathi/Hindi/English alert messages** |
| [`exposure_model_spec.json`](file:///c:/Users/SEBIN/Desktop/RGIT/varsha_data/exposure_model_spec.json) | Ward Exposure Index formula `E(w,d)`, all parameters, lag kernel spec, NegBin surge model |
| [`research_evidence.json`](file:///c:/Users/SEBIN/Desktop/RGIT/varsha_data/research_evidence.json) | Supe 2018 (7–12 day lag), Costa 2015 (global burden), IITM 2025 (dengue), calibration proof, IDSP lag analysis |
| [`idsp_access_guide.json`](file:///c:/Users/SEBIN/Desktop/RGIT/varsha_data/idsp_access_guide.json) | How to download the 29,433-row IDSP CSV from Dataful + column names + pandas filter script |
| [`tech_stack.json`](file:///c:/Users/SEBIN/Desktop/RGIT/varsha_data/tech_stack.json) | Full stack: FastAPI · PostGIS · statsmodels · LightGBM · OR-Tools · MapLibre · Telegram |
| [`fetch_log.json`](file:///c:/Users/SEBIN/Desktop/RGIT/varsha_data/fetch_log.json) | Per-source status log with timestamps |
| [`README.md`](file:///c:/Users/SEBIN/Desktop/RGIT/varsha_data/README.md) | Full guide for prototype builder |

---

## Critical numbers hardcoded for the Time Machine demo

| Fact | Value | Source file |
|---|---|---|
| 1–7 Jul 2026 rain (grid) | **596 mm** | `rain_jul2026_daily.json` |
| 1–7 Jul 2026 rain (station) | **~984 mm** | `bmc_disease_series.json` / press |
| 26 Jul 2005 (grid) | **69.6 mm** | `rain_2005deluge_grid.json` |
| 26 Jul 2005 (NOAA station) | **461 mm** (18.15 in) | `noaa_2005deluge.json` |
| 26 Jul 2005 (IMD) | **~944 mm** | `research_evidence.json` |
| 16 Aug 2025 (station) | **245 mm** | `noaa_aug2025.json` |
| 20 Aug 2025 (station) | **209 mm** | `noaa_aug2025.json` |
| BMC advisory issued | **6 Jul 2026, 22:39 IST** | `varsha_alert_tiers.json` |
| Leptospirosis June 2026 | **33 cases** | `bmc_disease_series.json` |
| Leptospirosis July 2026 | **78 cases (+136%)** | `bmc_disease_series.json` |
| Case surge lag | **7–12 days post-flood** | `research_evidence.json` (Supe 2018) |
| IDSP bulletin lag | **37–51 days (median 45)** | `research_evidence.json` |

---

## What prototype builder MUST still do manually

> [!IMPORTANT]
> These cannot be auto-fetched — do these before the hackathon

1. **Download IDSP CSV** → go to [dataful.in/datasets/18514](https://dataful.in/datasets/18514) → Download → save as `idsp_master.csv` → run the filter script inside `idsp_access_guide.json`

2. **Get Telegram Bot token** → message `@BotFather` on Telegram → `/newbot` → copy token → `export TELEGRAM_TOKEN=...`

3. **Full ward polygon GeoJSON** → [github.com/mickeykedia/India-Maps](https://github.com/mickeykedia/India-Maps) or [projects.datameet.org/Municipal_Spatial_Data](https://projects.datameet.org/Municipal_Spatial_Data/) — needed for the ward choropleth map

4. **Apply for IMD API** → [city.imd.gov.in/citywx/api_request.php](https://city.imd.gov.in/citywx/api_request.php) — needs a public IP; Open-Meteo is the working fallback

5. **Download full Aapla Dawakhana PDF** → [MCGM Dispensary List](https://crmapp.mcgm.gov.in/irj/go/km/docs/documents/MCGM%20Department%20List/Public%20Health%20Department/Docs/List%20of%20Disp%20English%20version.pdf) — extract all ~200 clinics

---

## Top 5 highest-risk wards (for demo pre-selection)

| Rank | Ward | Why |
|---|---|---|
| 1 | **L — Kurla/Sakinaka** | Highest hotspot density (48 spots / 24 km²), large slum pop (472K) |
| 2 | **K/E — Andheri East** | 42 hotspots, 312K slum pop, flooded 4–6 Jul 2026 |
| 3 | **M/E — Chembur/Govandi** | High slum fraction (57%), 37 hotspots |
| 4 | **G/N — Dharavi/Mahim** | Highest slum density in India, 22 hotspots |
| 5 | **H/E — Bandra East/Kurla W** | 28 chronic hotspots, 201K slum pop |

---

## Unit conversions (CRITICAL)

```python
# NOAA PRCP is in inches — convert to mm
rain_mm = float(record["PRCP"]) * 25.4

# Open-Meteo is already in mm — no conversion needed

# NOAA TEMP is in Fahrenheit — convert to Celsius  
temp_c = (float(record["TEMP"]) - 32) * 5/9
```
