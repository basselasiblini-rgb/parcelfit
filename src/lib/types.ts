// Domain types for the Investor–Parcel Matching Copilot.
// Field names mirror the challenge dataset exactly so CSV rows map 1:1.

export type InvestorType =
  | "developer"
  | "family_office"
  | "hnwi"
  | "institutional"
  | "private_equity"
  | "reit"
  | "sovereign_fund";

export type Sector =
  | "commercial"
  | "community"
  | "hospitality"
  | "industrial"
  | "logistics" // investor-only; mapped to `industrial` parcels
  | "mixed_use"
  | "residential";

export type LandUse =
  | "commercial"
  | "community"
  | "hospitality"
  | "industrial"
  | "mixed_use"
  | "residential";

export type RiskProfile = "conservative" | "balanced" | "aggressive";
export type Horizon = "short" | "medium" | "long";
export type ParcelStatus =
  | "vacant"
  | "reserved"
  | "under_development"
  | "developed";

export interface Investor {
  investor_id: string;
  investor_type: InvestorType;
  preferred_sector: Sector;
  preferred_district: string;
  capital_range_aed: string; // e.g. "15M-60M", "500M-2B"
  risk_profile: RiskProfile;
  investment_horizon: Horizon;
  strategic_fit_score: number; // 0–100, dataset-provided
}

export interface Parcel {
  parcel_id: string;
  district: string;
  zone: string; // e.g. "Z-RES-01"
  land_use: LandUse;
  parcel_size_sqm: number;
  current_status: ParcelStatus;
  infrastructure_score: number; // 0–100
  development_potential_score: number; // 0–100
  estimated_value_aed: number;
  recommended_use: string; // e.g. "high_rise_residential"
}

// One scored component of a match, with the human-readable reason.
export interface MatchFactor {
  key: string;
  label: string;
  score: number; // 0–1 contribution within this factor
  weight: number; // weight applied to this factor
  detail: string; // plain-language explanation for the UI / rationale
}

export interface ParcelMatch {
  parcel: Parcel;
  total: number; // 0–100 final match score
  factors: MatchFactor[];
  flags: string[]; // notable caveats, e.g. "capital exceeds parcel value"
}

export interface MatchResult {
  investor: Investor;
  capitalMin: number;
  capitalMax: number;
  matches: ParcelMatch[];
  generatedAt: string;
}
