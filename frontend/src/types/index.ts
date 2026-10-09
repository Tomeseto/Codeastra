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

export interface ClinicInfo {
  clinic_id: string;
  name: string;
  ward_id: string;
  locality?: string;
  address: string;
  operating_hours: string;
  contact?: string;
  services: string;
  lat?: number;
  lon?: number;
  stock_status?: string;
  prophylaxis_available?: boolean;
}

export interface ProphylaxisDemand {
  slum_population: number;
  exposure_score: number;
  risk_tier: RiskTier;
  exposure_factor: number;
  doxycycline_packs_recommended: number;
  mobile_fever_vans_required: number;
  priority_level: string;
  target_protocol: string;
}

export interface MultiLingualAdvisory {
  marathi: string;
  hindi: string;
  english: string;
}

export interface WardMunicipalDirective {
  ward_id: string;
  ward_name: string;
  locality: string;
  zone: string;
  exposure_score: number;
  risk_tier: RiskTier;
  prophylaxis: ProphylaxisDemand;
  advisory: MultiLingualAdvisory;
  clinics: ClinicInfo[];
  generated_at: string;
}
