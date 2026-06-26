import type { Investor, Parcel } from "./types";

// Minimal CSV parser. The challenge data has no quoted commas, so a split on
// "," per line is safe and dependency-free. Handles CRLF line endings.
export function parseCSV(text: string): Record<string, string>[] {
  const lines = text.replace(/\r/g, "").trim().split("\n");
  const headers = lines[0].split(",");
  return lines.slice(1).map((line) => {
    const cells = line.split(",");
    const row: Record<string, string> = {};
    headers.forEach((h, i) => (row[h] = cells[i]));
    return row;
  });
}

// "15M-60M" -> [15_000_000, 60_000_000]; "500M-2B" -> [500_000_000, 2_000_000_000]
export function parseCapitalRange(range: string): [number, number] {
  const toNumber = (token: string): number => {
    const m = token.trim().match(/^([\d.]+)\s*([MB])$/i);
    if (!m) return Number(token) || 0;
    const value = parseFloat(m[1]);
    const unit = m[2].toUpperCase();
    return unit === "B" ? value * 1_000_000_000 : value * 1_000_000;
  };
  const [lo, hi] = range.split("-");
  return [toNumber(lo), toNumber(hi)];
}

export function toInvestor(row: Record<string, string>): Investor {
  return {
    investor_id: row.investor_id,
    investor_type: row.investor_type as Investor["investor_type"],
    preferred_sector: row.preferred_sector as Investor["preferred_sector"],
    preferred_district: row.preferred_district,
    capital_range_aed: row.capital_range_aed,
    risk_profile: row.risk_profile as Investor["risk_profile"],
    investment_horizon: row.investment_horizon as Investor["investment_horizon"],
    strategic_fit_score: Number(row.strategic_fit_score),
  };
}

export function toParcel(row: Record<string, string>): Parcel {
  return {
    parcel_id: row.parcel_id,
    district: row.district,
    zone: row.zone,
    land_use: row.land_use as Parcel["land_use"],
    parcel_size_sqm: Number(row.parcel_size_sqm),
    current_status: row.current_status as Parcel["current_status"],
    infrastructure_score: Number(row.infrastructure_score),
    development_potential_score: Number(row.development_potential_score),
    estimated_value_aed: Number(row.estimated_value_aed),
    recommended_use: row.recommended_use,
  };
}
