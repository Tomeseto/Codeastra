# EARS-Sanjeevani Syndromic Surveillance Implementation Plan

> **For Agent:** REQUIRED SUB-SKILL: Use execution workflow to implement this plan task-by-task with TDD, preserving all existing working features and passing all 51 baseline tests.

**Goal:** Implement **EARS-Sanjeevani (The Dual-Sentinel Syndromic Aberration Engine)** in VARSHA, fusing top-down environmental flood hazard with bottom-up CDC EARS $C_2$ real-time health telemetry across 6,510 retail pharmacies and 5,000 BMC CHVs, an interactive 2D Bivariate Triangulation Matrix, and an authentic vernacular Marathi/Hindi ASHA audio-to-triage telemetry card.

**Architecture:**
- **Backend:** Pydantic v2 schemas (`backend/app/models/syndromic.py`), domain service (`backend/app/services/syndromic_engine.py`), REST API router (`backend/app/routers/syndromic.py`) registered in `backend/app/main.py`.
- **Data Source:** Verified dataset in `data/processed/syndromic_surveillance_ears.json` (6,510 FDA chemists, 5,000 BMC CHVs, 24 wards, 20 days time series, 4 verified field reports).
- **Frontend:** TypeScript definitions (`frontend/src/types/index.ts`), interactive 2D Bivariate Triangulation & Dual-Sentinel chart component (`frontend/src/components/SyndromicTriangulationPanel.tsx`), vernacular ASHA audio telemetry card (`frontend/src/components/AshaTelemetryFeed.tsx`), synchronized with the `TimeMachine.tsx` slider.

**Tech Stack:** Python 3.14, FastAPI, Pydantic v2, Pytest, React 19, TypeScript, Lucide Icons, Vite.

---

### Task 1: Backend Data Models & Pydantic Schemas

**Files:**
- Create: `backend/app/models/syndromic.py`
- Test: `tests/test_syndromic_schemas.py`

**Step 1: Write failing schema tests**
```python
def test_syndromic_point_schema():
    from backend.app.models.syndromic import DailySyndromicPoint
    point = DailySyndromicPoint(
        date="2026-07-05",
        rainfall_mm=111.7,
        otc_antipyretic_sales=2483,
        otc_c2_zscore=15.86,
        asha_fever_cases=223,
        asha_c2_zscore=4.55,
        composite_ears_zscore=10.77,
        syndromic_alert_tier="CRITICAL_ABERRATION",
        triangulation_quadrant="CONVERGENT_ACTIVE_EPIDEMIC"
    )
    assert point.composite_ears_zscore == 10.77
```

**Step 2: Implement schemas in `backend/app/models/syndromic.py`**
- `DailySyndromicPoint`
- `VernacularFieldReport`
- `WardSyndromicProfile`
- `CitywideSyndromicSummary`

**Step 3: Run pytest to verify**
- Command: `python -m pytest tests/test_syndromic_schemas.py`

---

### Task 2: Backend Domain Service (`syndromic_engine.py`)

**Files:**
- Create: `backend/app/services/syndromic_engine.py`
- Test: `tests/test_syndromic_engine.py`

**Step 1: Write tests for service**
- Test ward lookup by canonical ID (`L`, `G-N`, etc.).
- Test normalized ID handling (`G/N` -> `G-N`).
- Test point-in-time extraction by date (`2026-07-05`).
- Test vernacular report retrieval.

**Step 2: Implement service in `backend/app/services/syndromic_engine.py`**
- Cache and load `data/processed/syndromic_surveillance_ears.json`.
- Implement `get_ward_syndromic_profile(ward_id, date)`.
- Implement `get_citywide_syndromic_summary(date)`.
- Implement `get_vernacular_telemetry_feed()`.

**Step 3: Run pytest to verify**
- Command: `python -m pytest tests/test_syndromic_engine.py`

---

### Task 3: Backend REST API Endpoints & Main Integration

**Files:**
- Create: `backend/app/routers/syndromic.py`
- Modify: `backend/app/main.py`
- Test: `tests/test_syndromic_api.py`

**Step 1: Write API integration tests**
- `GET /api/v1/syndromic/ward/L?date=2026-07-05` -> 200 OK with `composite_ears_zscore`.
- `GET /api/v1/syndromic/summary?date=2026-07-05` -> 200 OK with citywide alert wards.
- `GET /api/v1/syndromic/vernacular-feed` -> 200 OK with 4 audio reports.

**Step 2: Implement router and include in `main.py`**
- Register `/api/v1/syndromic` and `/v1/syndromic` routes.
- Update root metadata dictionary in `backend/app/main.py`.

**Step 3: Run pytest across backend**
- Command: `python -m pytest tests/test_syndromic_api.py`
- Ensure all 51 existing tests still pass.

---

### Task 4: Frontend Types & State Integration

**Files:**
- Modify: `frontend/src/types/index.ts`
- Modify: `frontend/src/App.tsx`

**Step 1: Add TypeScript interfaces in `frontend/src/types/index.ts`**
- `DailySyndromicPoint`
- `VernacularFieldReport`
- `WardSyndromicProfile`
- `CitywideSyndromicSummary`

**Step 2: Add syndromic state in `frontend/src/App.tsx`**
- Fetch syndromic profile for selected ward and current timeline date.
- Maintain synced state as the timeline slider moves.

---

### Task 5: Frontend Component — `SyndromicTriangulationPanel.tsx`

**Files:**
- Create: `frontend/src/components/SyndromicTriangulationPanel.tsx`
- Modify: `frontend/src/components/EvidenceDrawer.tsx`

**Features:**
- **Dual-Sentinel Signal Card:** Shows Chemist OTC antipyretic volume and ASHA fever cases with CDC EARS $Z$-score badges ($+3\sigma$ red alert).
- **2D Bivariate Triangulation Quadrant Indicator:** Visually plots the ward in the 2D Phase Space:
  - 🟢 *Stage 4: Baseline Stable*
  - 🟡 *Stage 1: Silent Incubation Window (High Rain, Low Aberration)*
  - 🔴 *Stage 2: Convergent Active Epidemic (High Rain, High Aberration)*
  - 🟠 *Stage 3: Localized Cluster (Low Rain, High Aberration)*
- **Lead-Time Advantage Metric:** Highlights the +48-hour Chemist early lead over tertiary hospitals.

---

### Task 6: Frontend Component — `AshaTelemetryFeed.tsx` (Vernacular Audio & Triage)

**Files:**
- Create: `frontend/src/components/AshaTelemetryFeed.tsx`
- Modify: `frontend/src/components/Header.tsx` or `frontend/src/App.tsx`

**Features:**
- **Vernacular Audio Simulation Card:** Interactive play button playing a realistic synthetic tone/chime or speech demo.
- **Original Marathi & Hindi Audio Transcripts** with English side-by-side translation.
- **Extracted Clinical Entities:** Badges for `Acute High Fever`, `Severe Calf Myalgia (Pathognomonic)`, `Conjunctival Suffusion`.
- **Immediate Triage Directive:** Shows targeted municipal action (e.g., Doxycycline prophylaxis dispatch to Kranti Nagar Community Hall).

---

### Task 7: Full System Verification, Production Build & E2E Validation

**Steps:**
1. Run backend unit tests: `python -m pytest` (Must achieve 100% pass rate).
2. Run frontend production build: `npm --prefix frontend run build` (Must achieve 0 TypeScript errors).
3. Validate live local dev servers (`http://127.0.0.1:8000` & `http://localhost:5173`).
4. Perform live browser usability verification to confirm clean layout and intuitive interaction.
