import type {
  Investor,
  Parcel,
  ParcelMatch,
  MatchFactor,
  Sector,
  LandUse,
  RiskProfile,
  Horizon,
} from "./types";
import { parseCapitalRange } from "./csv";

// ----- Configuration: every weight is explicit so the score is inspectable. -----
// These sum to 1.0. Tuning them is a deliberate product decision, not a black box.
export const WEIGHTS = {
  sector: 0.28, // does the parcel's land use match what the investor wants?
  capital: 0.24, // does the parcel value sit inside the investor's budget?
  district: 0.18, // is it in (or near) the investor's preferred district?
  risk: 0.16, // does the parcel's status/potential suit the risk appetite?
  horizon: 0.14, // does development timeline suit the investment horizon?
} as const;

// logistics is an investor preference with no parcel land_use; nearest fit is industrial.
const SECTOR_TO_LANDUSE: Record<Sector, LandUse> = {
  commercial: "commercial",
  community: "community",
  hospitality: "hospitality",
  industrial: "industrial",
  logistics: "industrial",
  mixed_use: "mixed_use",
  residential: "residential",
};

// mixed_use parcels partially satisfy most sector preferences — a real-world nuance.
function sectorScore(inv: Investor, parcel: Parcel): MatchFactor {
  const target = SECTOR_TO_LANDUSE[inv.preferred_sector];
  let score = 0;
  let detail = "";
  if (parcel.land_use === target) {
    score = 1;
    detail =
      inv.preferred_sector === "logistics"
        ? `Industrial land use is the closest fit for a logistics mandate.`
        : `Land use (${parcel.land_use}) directly matches the ${inv.preferred_sector} mandate.`;
  } else if (parcel.land_use === "mixed_use") {
    score = 0.6;
    detail = `Mixed-use parcel partially accommodates a ${inv.preferred_sector} mandate.`;
  } else if (target === "mixed_use" && parcel.land_use === "commercial") {
    score = 0.5;
    detail = `Commercial land use partially serves a mixed-use mandate.`;
  } else {
    score = 0.1;
    detail = `Land use (${parcel.land_use}) is outside the ${inv.preferred_sector} mandate.`;
  }
  return {
    key: "sector",
    label: "Sector fit",
    score,
    weight: WEIGHTS.sector,
    detail,
  };
}

// Capital fit: full marks if parcel value sits inside the range; graceful falloff outside.
function capitalScore(
  parcel: Parcel,
  capMin: number,
  capMax: number,
): { factor: MatchFactor; flag?: string } {
  const v = parcel.estimated_value_aed;
  let score: number;
  let detail: string;
  let flag: string | undefined;
  if (v >= capMin && v <= capMax) {
    score = 1;
    detail = `AED ${fmt(v)} sits inside the AED ${fmt(capMin)}–${fmt(capMax)} budget.`;
  } else if (v < capMin) {
    // Below budget: deployable but may be too small to move the needle.
    const ratio = v / capMin;
    score = 0.4 + 0.4 * ratio; // 0.4–0.8
    detail = `AED ${fmt(v)} is below the floor of AED ${fmt(capMin)}; capital may be under-deployed.`;
    flag = "Parcel value below investor's capital floor";
  } else {
    // Above budget: out of reach without co-investment.
    const ratio = capMax / v;
    score = Math.max(0, 0.5 * ratio);
    detail = `AED ${fmt(v)} exceeds the ceiling of AED ${fmt(capMax)}; would need co-investment.`;
    flag = "Parcel value exceeds investor's capital ceiling";
  }
  return {
    factor: {
      key: "capital",
      label: "Capital fit",
      score,
      weight: WEIGHTS.capital,
      detail,
    },
    flag,
  };
}

function districtScore(inv: Investor, parcel: Parcel): MatchFactor {
  const match = inv.preferred_district === parcel.district;
  return {
    key: "district",
    label: "District fit",
    score: match ? 1 : 0.3,
    weight: WEIGHTS.district,
    detail: match
      ? `In the investor's preferred district (${parcel.district}).`
      : `Outside the preferred district (${inv.preferred_district}); located in ${parcel.district}.`,
  };
}

// Risk alignment: conservative investors favour developed/high-infrastructure parcels;
// aggressive investors favour vacant/high-development-potential parcels.
function riskScore(inv: Investor, parcel: Parcel): MatchFactor {
  const dev = parcel.development_potential_score / 100;
  const infra = parcel.infrastructure_score / 100;
  const settled =
    parcel.current_status === "developed" ||
    parcel.current_status === "under_development";

  const map: Record<RiskProfile, { score: number; detail: string }> = {
    conservative: {
      score: 0.5 * infra + 0.5 * (settled ? 1 : 0.3),
      detail: settled
        ? `Settled, well-serviced parcel suits a conservative profile.`
        : `Undeveloped status carries more risk than a conservative profile prefers.`,
    },
    aggressive: {
      score: 0.6 * dev + 0.4 * (parcel.current_status === "vacant" ? 1 : 0.4),
      detail:
        parcel.current_status === "vacant"
          ? `Vacant parcel with ${parcel.development_potential_score}/100 upside suits an aggressive profile.`
          : `Limited greenfield upside for an aggressive value-add strategy.`,
    },
    balanced: {
      score: 0.5 * dev + 0.5 * infra,
      detail: `Balanced infrastructure (${parcel.infrastructure_score}) and upside (${parcel.development_potential_score}) suit a balanced profile.`,
    },
  };
  const r = map[inv.risk_profile];
  return {
    key: "risk",
    label: "Risk alignment",
    score: r.score,
    weight: WEIGHTS.risk,
    detail: r.detail,
  };
}

// Horizon: long horizons tolerate vacant/under-development; short horizons want income-ready.
function horizonScore(inv: Investor, parcel: Parcel): MatchFactor {
  const incomeReady = parcel.current_status === "developed";
  const map: Record<Horizon, { score: number; detail: string }> = {
    short: {
      score: incomeReady ? 1 : 0.35,
      detail: incomeReady
        ? `Developed parcel can generate returns within a short horizon.`
        : `Undeveloped status is a poor fit for a short horizon.`,
    },
    long: {
      score:
        parcel.current_status === "vacant" ||
        parcel.current_status === "under_development"
          ? 1
          : 0.6,
      detail:
        parcel.current_status === "vacant"
          ? `Greenfield parcel suits a long-horizon, build-out strategy.`
          : `Workable for a long horizon, though upside is partly realised.`,
    },
    medium: {
      score: 0.75,
      detail: `Most parcel statuses are workable on a medium horizon.`,
    },
  };
  const h = map[inv.investment_horizon];
  return {
    key: "horizon",
    label: "Horizon fit",
    score: h.score,
    weight: WEIGHTS.horizon,
    detail: h.detail,
  };
}

export function scoreParcel(inv: Investor, parcel: Parcel): ParcelMatch {
  const [capMin, capMax] = parseCapitalRange(inv.capital_range_aed);
  const flags: string[] = [];

  const sector = sectorScore(inv, parcel);
  const cap = capitalScore(parcel, capMin, capMax);
  if (cap.flag) flags.push(cap.flag);
  const district = districtScore(inv, parcel);
  const risk = riskScore(inv, parcel);
  const horizon = horizonScore(inv, parcel);

  // Reserved parcels are unavailable; flag rather than silently rank them.
  if (parcel.current_status === "reserved") {
    flags.push("Parcel is currently reserved");
  }

  const factors = [sector, cap.factor, district, risk, horizon];
  const total =
    factors.reduce((sum, f) => sum + f.score * f.weight, 0) * 100;

  return { parcel, total: Math.round(total * 10) / 10, factors, flags };
}

export function matchInvestor(
  inv: Investor,
  parcels: Parcel[],
  topN = 10,
): ParcelMatch[] {
  return parcels
    .map((p) => scoreParcel(inv, p))
    .sort((a, b) => b.total - a.total)
    .slice(0, topN);
}

function fmt(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  return n.toLocaleString();
}
