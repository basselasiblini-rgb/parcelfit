// Client-facing shape of the /api/match response.
import type { MatchResult } from "@/lib/types";

export interface MatchResponse extends MatchResult {
  rationale: string | null;
}
