# Demo Script — ParcelFit (60 seconds)

Record this once early as your fallback, so a flaky-wifi live demo never sinks you.

## Setup (before recording)
- `npm run dev` running on http://localhost:3000
- `ANTHROPIC_API_KEY` set in `.env` so the briefing is the full LLM version
- Browser at the page, window clean

## The 60-second path

**0:00 — The frame (one line)**
"ParcelFit matches an investor mandate to Abu Dhabi land parcels — and shows you exactly why each one fits."

**0:08 — Pick a mandate**
Select `INV-003` (HNWI · residential · Al Maryah Island · 8M–40M · balanced · short).
Click **Find parcels**.

**0:18 — The briefing**
Read the top of the analyst briefing aloud — the verdict line.
"The model gives a committee-ready verdict, not just a list."

**0:28 — The signature: transparent score**
Expand the top parcel. Point at the five factor bars.
"Every score decomposes into weighted factors, each with a reason. Sector fit, capital fit, district, risk, horizon — nothing hidden."

**0:40 — Prove it reasons about the mandate**
Switch the dropdown to an aggressive / long-horizon investor (`INV-004`). Re-run.
"Watch the ranking flip — now it surfaces *vacant* parcels with high development potential. Same engine, opposite output, because the mandate changed. The AI does the judgement; the scoring stays auditable."

**0:55 — Close**
"Transparent enough for a committee to defend, and a regulator to inspect. That's the investment intelligence layer."

## If wifi dies
The app runs without an API key — the briefing falls back to a deterministic
summary and every other feature works. Say so out loud; it demonstrates the
graceful-degradation design rather than hiding it.
