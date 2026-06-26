import { NextRequest, NextResponse } from "next/server";
import { getInvestor, loadParcels } from "@/lib/data";
import { matchInvestor } from "@/lib/matcher";
import { generateRationale } from "@/lib/agent";
import type { MatchResult } from "@/lib/types";
import { parseCapitalRange } from "@/lib/csv";

// POST /api/match
// Body: { investorId: string, topN?: number, withRationale?: boolean }
// Returns the ranked parcel matches plus an optional LLM analyst briefing.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const investorId: string = body.investorId;
    const topN: number = body.topN ?? 8;
    const withRationale: boolean = body.withRationale ?? true;

    if (!investorId) {
      return NextResponse.json(
        { error: "investorId is required" },
        { status: 400 },
      );
    }

    const investor = await getInvestor(investorId);
    if (!investor) {
      return NextResponse.json(
        { error: `Investor ${investorId} not found` },
        { status: 404 },
      );
    }

    const parcels = await loadParcels();
    const matches = matchInvestor(investor, parcels, topN);
    const [capitalMin, capitalMax] = parseCapitalRange(investor.capital_range_aed);

    const result: MatchResult = {
      investor,
      capitalMin,
      capitalMax,
      matches,
      generatedAt: new Date().toISOString(),
    };

    const rationaleResult = withRationale
      ? await generateRationale({ investor, matches })
      : null;

    return NextResponse.json({
      ...result,
      rationale: rationaleResult?.text ?? null,
      rationaleSource: rationaleResult?.source ?? null,
    });
  } catch (err) {
    console.error("match error", err);
    return NextResponse.json(
      { error: "Failed to compute matches" },
      { status: 500 },
    );
  }
}
