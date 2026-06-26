// Client-facing shape of the /api/match response.
import type { MatchResult } from "@/lib/types";
import type { RationaleSource } from "@/lib/agent";

export interface MatchResponse extends MatchResult {
  rationale: string | null;
  rationaleSource: RationaleSource | null;
}
