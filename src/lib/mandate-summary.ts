import type { Investor } from "./types";

const TYPE_LABEL: Record<string, string> = {
  developer: "Developer",
  family_office: "Family office",
  hnwi: "HNWI",
  institutional: "Institutional investor",
  private_equity: "Private equity fund",
  reit: "REIT",
  sovereign_fund: "Sovereign investor",
};

const HORIZON_LABEL: Record<string, string> = {
  short: "short-term horizon",
  medium: "medium-term horizon",
  long: "long-term horizon",
};

export function mandateSummary(inv: Investor): string {
  const type = TYPE_LABEL[inv.investor_type] ?? inv.investor_type.replace(/_/g, " ");
  const sector = inv.preferred_sector.replace(/_/g, " ");
  const horizon =
    HORIZON_LABEL[inv.investment_horizon] ?? `${inv.investment_horizon} horizon`;

  return `${type} · ${sector} in ${inv.preferred_district} · AED ${inv.capital_range_aed} · ${inv.risk_profile} risk · ${horizon}`;
}
