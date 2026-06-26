# ParcelFit — Investor–Parcel Matching Copilot

**Track:** Investment Intelligence · **Event:** Abu Dhabi AI PropTech Challenge (Cursor × eVoost AI, Hub71)

ParcelFit takes one investor mandate and returns the Abu Dhabi land parcels that fit it — ranked by a **transparent, auditable score** that decomposes into five weighted factors, with an **AI analyst briefing** written on top. The score is computed in code you can read; the language model does the judgement and synthesis, not the arithmetic.

---

## Problem & relevance

Abu Dhabi is attracting record capital across ~100 nationalities, but matching a specific investor mandate (sector, district, capital, risk, horizon) to the right land parcel is still manual, slow, and opaque. An investment desk fielding 200 mandates against 600 parcels needs to know *which* parcels fit *which* mandate — and **why**, in terms a committee can defend.

ParcelFit answers exactly the Investment Intelligence brief: *match the right investors with the right opportunities, and support smarter investment attraction.* It runs entirely on the challenge dataset — 200 investor mandates × 600 parcels — with zero manual data prep.

## What it does

1. Pick an investor mandate from the dataset.
2. ParcelFit scores all 600 parcels against that mandate and ranks the top 8.
3. Each parcel shows its **match score (0–100)** broken into five factors, each with a plain-language reason.
4. An **AI analyst briefing** gives the committee a verdict, the case for the top parcels, and the single most important tradeoff or caveat.

## How AI is used (real work, not decoration)

The design deliberately splits the labour:

- **Deterministic engine (`src/lib/matcher.ts`)** computes the score. Every factor — sector, capital, district, risk, horizon — returns a number *and* a reason. Weights are explicit constants that sum to 1.0. Nothing is hidden in a prompt.
- **LLM agent (`src/lib/agent.ts`)** consumes those scores and reasons and writes the investment-committee briefing: verdict, evidence-led case, honest caveats. It reasons over the shortlist; it never computes the maths.

This is the boundary the event itself recommends — *automate the deterministic, reserve AI for judgement.* The model used is **Claude Sonnet 4.6** via the Anthropic API, with the system prompt cached (`cache_control`) so repeated runs cost a fraction of the first.

The matching responds to the mandate, not just the sector. Verify it live:
- A **balanced / short-horizon** investor surfaces *developed, income-ready* parcels inside budget.
- An **aggressive / long-horizon** investor surfaces *vacant* parcels with high development potential.
Same engine, opposite output — driven by the mandate.

## Demo readiness

- **Run it:** `npm install && npm run dev` → http://localhost:3000. No API key needed — the app ships a deterministic rationale fallback so the full match flow works offline.
- **Full AI briefing:** copy `.env.example` to `.env`, set `ANTHROPIC_API_KEY`, restart.
- **60-second demo path:** select `INV-003` → *Find parcels* → read the briefing → expand the top parcel → show the five-factor breakdown → switch to an aggressive investor (`INV-004`) → show the ranking flip to vacant high-potential parcels.
- **Recorded fallback:** see `demo.md` for the script if live wifi fails.

## Technical execution

```
src/lib/types.ts     Domain types; field names mirror the dataset CSVs 1:1
src/lib/csv.ts       CSV + capital-range parsing ("15M-60M" → [15e6, 60e6])
src/lib/matcher.ts   The core: transparent, weighted, explainable scoring
src/lib/agent.ts     LLM briefing layer + deterministic fallback
src/lib/data.ts      Cached server-side CSV loader
src/app/api/match    POST endpoint: scores + rationale
src/app/api/investors GET endpoint: mandate picker
src/components/       FactorBars (signature element) + ParcelCard
src/app/page.tsx     Interactive desk UI
```

- **TypeScript strict**, `@/` path alias, clean `next build` with no type errors.
- **Logic lives in `lib`**, routes are thin. The engine is unit-testable in isolation.
- **Graceful degradation** everywhere: no key → fallback rationale; bad investor → 404 JSON; API failure → deterministic path.
- **No secrets client-side**: the Anthropic call is server-only in the route handler.

### The scoring model

Final score = Σ (factor_score × weight) × 100, with weights:

| Factor | Weight | What it measures |
|---|---|---|
| Sector fit | 0.28 | parcel `land_use` vs investor `preferred_sector` (logistics → industrial) |
| Capital fit | 0.24 | parcel `estimated_value_aed` vs parsed `capital_range_aed`; rewards the budget sweet-spot, with graceful falloff outside the range |
| District fit | 0.18 | parcel `district` vs `preferred_district` (soft, not a hard filter) |
| Risk alignment | 0.16 | status + infra + development potential vs `risk_profile` |
| Horizon fit | 0.14 | parcel status vs `investment_horizon` |

Caveats are surfaced as **flags**, never hidden: parcel above/below budget, reserved status, etc.

## Known limitations (honest scope)

We score what the tool actually does, not what it could do — these are real and deliberate:

- **Weights are a designed prior, not learned.** The five factor weights are an explicit product judgement (sector and capital matter most to a desk; horizon least), tunable in one place in `matcher.ts`. They are not fitted to outcome data — there is no outcome data in a synthetic set.
- **The top tier compresses by design.** Sector, capital, and district together account for 70 of 100 points and behave as near-threshold criteria, so qualifying parcels cluster high. We made capital fit *continuous* (rewarding the budget sweet-spot) to break flat ties, but a strong-fit shortlist will still score in a tight band — because, for a desk that won't look outside its mandate, that clustering is correct behaviour, not noise. Real differentiation happens on risk and horizon.
- **District is a soft factor, not a hard filter.** A parcel outside the preferred district can still rank highly if it is an exceptional fit otherwise. This is a choice (surface strong options the investor might miss); flipping it to a hard filter is a two-line change.
- **`logistics` has no parcel equivalent** in the dataset's `land_use` values, so we map it to `industrial` — the nearest real fit, surfaced explicitly in the rationale rather than hidden.
- **Synthetic data.** Scores reflect the challenge dataset's internal logic, not live Abu Dhabi valuations.

## Potential impact

ParcelFit is a working slice of an investment-desk intelligence layer. The same engine scales to: live mandate ingestion, parcel pipelines beyond the sample, portfolio-level basket construction, and demand-weighted scoring using the transactions dataset. The transparency is the moat — committees adopt tools whose recommendations they can defend, and regulators trust scores they can inspect.

## Dataset

Uses `sample_investors.csv` (200) and `sample_parcels.csv` (600) from the official challenge dataset, joined on `district`. All values synthetic; district names real.

## Built with Cursor

Project rules in `.cursor/rules/project.md` encode the architecture, the dataset schema, and the core principle (transparency over magic) so AI-assisted edits stay consistent with the design.
