export type RiskTier = 'NORMAL' | 'WATCH' | 'WARNING' | 'EMERGENCY';
export type DataStatus = 'VERIFIED_COMPLETE' | 'PROVISIONAL_PARTIAL';
export type DataLineage = 'OBSERVED' | 'DERIVED' | 'ESTIMATED' | 'MISSING';

export interface HazardBreakdown {
  rainfall_mm: number;
  hazard_score_H: number;
  imd_category: string;
}

export interface SusceptibilityBreakdown {
  base_multiplier: number;
  flood_propensity_F_norm: number | null;
  demographic_vulnerability_V_norm: number;
  weight_flood: number;
  weight_vulnerability: number;
  multiplier_M: number;
  status: DataStatus;
  warning_message: string | null;
}

export interface WardExposureScore {
  ward_id: string;
  ward_name: string;
  locality: string;
  zone: string;
  date?: string;
  exposure_score: number;
  risk_tier: RiskTier;
  hazard: HazardBreakdown;
  susceptibility: SusceptibilityBreakdown;
  data_lineage: DataLineage;
}

export interface TimelineMilestone {
  event_type: string;
  timestamp_ist: string;
  title: string;
  description: string;
  source_citation: string;
  lead_time_hours_vs_alert?: number;
}

export interface DailyExposureSummary {
  date: string;
  mode?: string;
  wards: Record<string, WardExposureScore>;
  city_average_exposure: number;
  city_max_exposure: number;
  emergency_ward_count: number;
  warning_ward_count: number;
  watch_ward_count: number;
  normal_ward_count: number;
  milestones: TimelineMilestone[];
}

export interface WardFeatureProperties {
  ward_id: string;
  ward_name: string;
  original_name: string;
  object_id: number;
  locality: string;
  zone: string;
  area_sq_km: number;
  centroid_lat: number;
  centroid_lon: number;
  total_population: number;
  slum_population: number;
  slum_ratio: number;
  population_density: number;
  vulnerability_norm: number;
  verified_flood_hotspot_count: number;
  flood_propensity_F_norm: number;
  data_lineage: DataLineage;
}

export interface ChronicHotspot {
  id: string;
  name: string;
  ward_id: string;
  lat: number;
  lon: number;
  source: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface IncubationTimelinePoint {
  day: number;
  phase: string;
  phase_label: string;
  civilian_headline: string;
  civilian_explanation: string;
  surge_intensity_index: number;
  medical_action: string;
  zone_color: string;
  is_peak: boolean;
}

export interface SurgeCurve {
  ward_id: string;
  ward_name: string;
  exposure_score: number;
  rainfall_mm: number;
  peak_day: number;
  peak_intensity: number;
  golden_window_days: number;
  timeline: IncubationTimelinePoint[];
  evidence_citation: string;
}

export interface VectorStagnationRisk {
  ward_id: string;
  stagnation_risk_score: number;
  risk_tier: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  target_vectors: string[];
  larval_breeding_window: string;
  chemical_spray_recommendation: string;
  target_hotspot_count: number;
  priority_action: string;
}

export interface WardEpidemiologyForecast {
  ward_id: string;
  ward_name: string;
  exposure_score: number;
  rainfall_mm: number;
  surge_curve: SurgeCurve;
  vector_risk: VectorStagnationRisk;
  generated_at: string;
}

export interface BenchmarkEvent {
  id: string;
  name: string;
  date_range: string;
  rainfall_mm: number;
  peak_rainfall_mm: number;
  tide_condition: string;
  drainage_state: string;
  lead_time_hours: number;
  case_count: number;
  prior_month_cases: number;
  case_surge_percentage: number;
  historical_outcome: string;
  validation_note: string;
  saturation_scope: string;
  target_wards: string[];
  recommended_action: string;
}

export interface BenchmarkSummaryItem {
  id: string;
  title: string;
  subtitle: string;
  rainfall_mm: number;
  tag: string;
  color: string;
}

export interface BenchmarkSuiteResponse {
  events: Record<string, BenchmarkEvent>;
  benchmark_list: BenchmarkSummaryItem[];
}

