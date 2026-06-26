# ParcelFit — Cursor Project Rules

## What this project is
An Investor–Parcel Matching Copilot for the Abu Dhabi AI PropTech Challenge
(Investment Intelligence track). It scores Abu Dhabi land parcels against an
investor's mandate using a transparent, weighted engine, then has an LLM write
an investment-committee briefing on top.

## Architecture (keep this separation intact)
- `src/lib/types.ts` — domain types. Field names mirror the dataset CSVs exactly.
- `src/lib/csv.ts` — CSV + capital-range parsing. No external CSV dependency.
- `src/lib/matcher.ts` — THE CORE. Deterministic, weighted, explainable scoring.
  Every factor returns a score AND a plain-language `detail`. Weights are explicit
  constants that sum to 1.0. Do not turn this into a black box.
- `src/lib/agent.ts` — the LLM layer. It writes prose from scores; it does NOT
  compute the maths. Always keep the deterministic fallback working.
- `src/lib/data.ts` — server-side CSV loader with module-level cache.
- `src/app/api/*` — thin route handlers. Logic lives in `lib`, not in routes.
- `src/components/*` — client UI. The FactorBars component is the signature element.

## Design principles
- **Transparency over magic.** The score must always be decomposable into its
  factors in the UI. That auditability is the product thesis.
- **AI does judgement, code does arithmetic.** Never move scoring into the prompt.
- **Graceful degradation.** The app must work with no ANTHROPIC_API_KEY set.
- **Evidence over claims.** UI and rationale only state what the data supports.

## Dataset facts (do not re-derive)
- Investors: investor_id, investor_type, preferred_sector, preferred_district,
  capital_range_aed (string range like "15M-60M" / "500M-2B"), risk_profile,
  investment_horizon, strategic_fit_score.
- Parcels: parcel_id, district, zone, land_use, parcel_size_sqm, current_status,
  infrastructure_score, development_potential_score, estimated_value_aed,
  recommended_use.
- `preferred_sector` and `land_use` share six values; investor-only `logistics`
  maps to parcel `land_use` `industrial`.
- Both files join on `district` (see districts.csv for centroid/yield context).

## Conventions
- TypeScript strict. `@/` path alias maps to `src/`.
- No secrets in client code; the Anthropic call is server-side only (route handler).
- Model string: `claude-sonnet-4-6`. Cache the system prompt with cache_control.
