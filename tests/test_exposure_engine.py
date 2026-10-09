import pytest
from backend.app.services.exposure_engine import exposure_engine
from backend.app.models.exposure import RiskTierEnum, DataStatusEnum

class TestExposureEngine:
    def test_benchmark_1_zero_rain(self):
        """Boundary condition: Zero rainfall produces zero hazard and zero exposure."""
        H, cat = exposure_engine.calculate_hazard_H(0.0)
        assert H == 0.0
        assert "Zero" in cat
        
        M, status, _ = exposure_engine.calculate_susceptibility_M(0.50, 0.50)
        assert M == 1.0
        assert status == DataStatusEnum.VERIFIED_COMPLETE
        
        res = exposure_engine.calculate_ward_exposure("A", 0.0)
        assert res.exposure_score == 0.0
        assert res.risk_tier == RiskTierEnum.NORMAL

    def test_benchmark_2_moderate_rain(self):
        """Moderate rainfall R=45mm with median susceptibility M=1.0 gives E=26.6."""
        H, cat = exposure_engine.calculate_hazard_H(45.0)
        assert pytest.approx(H, 0.001) == 26.5517
        assert "Moderate" in cat
        
        M, status, _ = exposure_engine.calculate_susceptibility_M(0.50, 0.50)
        assert pytest.approx(M, 0.001) == 1.000
        
        # Test piecewise direct calculation
        raw = H * M
        score = min(100.0, round(raw, 1))
        assert score == 26.6

    def test_benchmark_3_heavy_rain_high_susceptibility(self):
        """Heavy rainfall R=85mm, F=0.75, V=0.80 gives H=50.029, M=1.165, E=58.3 (WARNING)."""
        H, cat = exposure_engine.calculate_hazard_H(85.0)
        assert pytest.approx(H, 0.001) == 50.0293
        assert "Heavy" in cat
        
        M, status, _ = exposure_engine.calculate_susceptibility_M(0.75, 0.80)
        assert pytest.approx(M, 0.001) == 1.165
        assert status == DataStatusEnum.VERIFIED_COMPLETE
        
        raw = H * M
        score = min(100.0, round(raw, 1))
        assert score == 58.3

    def test_benchmark_4_very_heavy_rain(self):
        """Very heavy rainfall R=135mm, F=0.75, V=0.80 gives H=70.456, M=1.165, E=82.1 (EMERGENCY)."""
        H, cat = exposure_engine.calculate_hazard_H(135.0)
        assert pytest.approx(H, 0.001) == 70.4556
        assert "Very Heavy" in cat
        
        M, status, _ = exposure_engine.calculate_susceptibility_M(0.75, 0.80)
        assert pytest.approx(M, 0.001) == 1.165
        
        raw = H * M
        score = min(100.0, round(raw, 1))
        assert score == 82.1

    def test_benchmark_5_extreme_deluge_clamping(self):
        """Extreme deluge R=300mm clamps exposure score strictly to 100.0."""
        H, cat = exposure_engine.calculate_hazard_H(300.0)
        assert pytest.approx(H, 0.01) == 99.55
        
        M, status, _ = exposure_engine.calculate_susceptibility_M(0.80, 0.85)
        assert pytest.approx(M, 0.001) == 1.195
        
        raw = H * M
        assert raw > 100.0  # 99.55 * 1.195 = 118.96
        score = min(100.0, round(raw, 1))
        assert score == 100.0

    def test_benchmark_6_missing_flood_protocol(self):
        """Missing flood data must trigger strict fallback M = 0.70 + 0.60 * V and PROVISIONAL_PARTIAL."""
        M, status, warning = exposure_engine.calculate_susceptibility_M(None, 0.80)
        assert pytest.approx(M, 0.001) == 1.180  # 0.70 + 0.60 * 0.80 = 1.18
        assert status == DataStatusEnum.PROVISIONAL_PARTIAL
        assert warning is not None
        assert "missing" in warning.lower()

    def test_monotonicity(self):
        """Exposure score must be monotonically non-decreasing with increasing rainfall."""
        rainfalls = [0.0, 10.0, 30.0, 35.5, 50.0, 64.5, 90.0, 115.6, 150.0, 204.5, 250.0, 400.0]
        scores = []
        for r in rainfalls:
            res = exposure_engine.calculate_ward_exposure("L", r)
            scores.append(res.exposure_score)
            assert 0.0 <= res.exposure_score <= 100.0
            
        for i in range(len(scores) - 1):
            assert scores[i] <= scores[i+1], f"Monotonicity failed between {rainfalls[i]}mm ({scores[i]}) and {rainfalls[i+1]}mm ({scores[i+1]})"

    def test_all_24_wards_exist_and_calculate(self):
        """All 24 administrative wards must compute valid scores on test deluge."""
        for wid in ["A", "B", "C", "D", "E", "F-S", "F-N", "G-S", "G-N", "H-E", "H-W", "K-E", "K-W", "P-S", "P-N", "R-S", "R-C", "R-N", "L", "M-E", "M-W", "N", "S", "T"]:
            res = exposure_engine.calculate_ward_exposure(wid, 85.0)
            assert res.ward_id == wid
            assert 0.0 <= res.exposure_score <= 100.0
            assert res.hazard.rainfall_mm == 85.0
