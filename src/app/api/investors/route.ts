import { NextResponse } from "next/server";
import { loadInvestors } from "@/lib/data";

// GET /api/investors — lightweight list for the mandate picker.
export async function GET() {
  const investors = await loadInvestors();
  return NextResponse.json({ investors });
}
