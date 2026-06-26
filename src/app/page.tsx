"use client";

import { useEffect, useMemo, useState } from "react";
import type { Investor } from "@/lib/types";
import type { MatchResponse } from "@/lib/api-types";
import { mandateSummary } from "@/lib/mandate-summary";
import { ParcelCard } from "@/components/ParcelCard";
import { ScoringLegend } from "@/components/ScoringLegend";

const DEMO_INVESTOR_ID = "INV-003";
const COMPARE_INVESTOR_ID = "INV-004";

function fmtAed(n: number): string {
  if (n >= 1_000_000_000) return `AED ${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `AED ${(n / 1_000_000).toFixed(1)}M`;
  return `AED ${n.toLocaleString()}`;
}

const MandateChip = ({ k, v }: { k: string; v: string }) => (
  <span style={{ display: "grid", gap: 2 }}>
    <span
      style={{
        fontSize: 10,
        color: "var(--text-faint)",
        textTransform: "uppercase",
        letterSpacing: 0.5,
      }}
    >
      {k}
    </span>
    <span className="mono" style={{ fontSize: 13, color: "var(--text)" }}>
      {v}
    </span>
  </span>
);

function StepBadge({
  n,
  label,
  active,
}: {
  n: number;
  label: string;
  active?: boolean;
}) {
  return (
    <span
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        minWidth: 0,
      }}
    >
      <span
        style={{
          width: 22,
          height: 22,
          borderRadius: 9999,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 11,
          fontWeight: 600,
          flexShrink: 0,
          background: active ? "var(--sand)" : "var(--ink-line)",
          color: active ? "var(--ink)" : "var(--text-dim)",
        }}
      >
        {n}
      </span>
      <span
        style={{
          fontSize: 12.5,
          color: active ? "var(--text)" : "var(--text-dim)",
        }}
      >
        {label}
      </span>
    </span>
  );
}

function ProvenanceBadge({ source }: { source: "ai" | "fallback" }) {
  const isAi = source === "ai";
  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: 0.3,
        textTransform: "uppercase",
        padding: "3px 8px",
        borderRadius: 4,
        border: `1px solid ${isAi ? "var(--signal-dim)" : "var(--ink-line)"}`,
        color: isAi ? "var(--signal)" : "var(--text-faint)",
        background: isAi ? "rgba(74, 222, 128, 0.08)" : "transparent",
      }}
    >
      {isAi ? "AI analyst" : "Offline fallback"}
    </span>
  );
}

export default function Home() {
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [result, setResult] = useState<MatchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [compareTipDismissed, setCompareTipDismissed] = useState(false);
  const [mandateFilter, setMandateFilter] = useState("");
  const [expandedIds, setExpandedIds] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/investors")
      .then((r) => r.json())
      .then((d) => {
        setInvestors(d.investors);
        if (d.investors.length) setSelected(d.investors[0].investor_id);
      })
      .catch(() => setError("Could not load investor mandates."));
  }, []);

  async function runMatchFor(investorId: string) {
    if (!investorId) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ investorId, topN: 8 }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Match failed");
      const data: MatchResponse = await res.json();
      setResult(data);
      setExpandedIds(data.matches.slice(0, 2).map((m) => m.parcel.parcel_id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function runMatch() {
    await runMatchFor(selected);
  }

  async function runDemo() {
    setSelected(DEMO_INVESTOR_ID);
    setCompareTipDismissed(false);
    await runMatchFor(DEMO_INVESTOR_ID);
  }

  const inv = investors.find((i) => i.investor_id === selected);
  const filteredInvestors = useMemo(() => {
    const q = mandateFilter.trim().toLowerCase();
    if (!q) return investors;
    return investors.filter((i) =>
      [
        i.investor_id,
        i.investor_type,
        i.preferred_sector,
        i.preferred_district,
        i.risk_profile,
        i.investment_horizon,
        i.capital_range_aed,
      ].some((field) => field.toLowerCase().includes(q)),
    );
  }, [investors, mandateFilter]);

  useEffect(() => {
    if (!filteredInvestors.length) return;
    if (!filteredInvestors.some((i) => i.investor_id === selected)) {
      setSelected(filteredInvestors[0].investor_id);
    }
  }, [filteredInvestors, selected]);

  const activeStep = result ? 3 : loading ? 2 : 1;
  const showCompareTip =
    result &&
    selected !== COMPARE_INVESTOR_ID &&
    !compareTipDismissed;
  const allBreakdownsExpanded =
    !!result && expandedIds.length === result.matches.length;

  function toggleExpanded(parcelId: string, open: boolean) {
    setExpandedIds((prev) =>
      open
        ? prev.includes(parcelId)
          ? prev
          : [...prev, parcelId]
        : prev.filter((id) => id !== parcelId),
    );
  }

  function toggleAllBreakdowns() {
    if (!result) return;
    if (allBreakdownsExpanded) {
      setExpandedIds(result.matches.slice(0, 2).map((m) => m.parcel.parcel_id));
      return;
    }
    setExpandedIds(result.matches.map((m) => m.parcel.parcel_id));
  }

  return (
    <main
      style={{
        maxWidth: 920,
        margin: "0 auto",
        padding: "32px 20px 80px",
        display: "grid",
        gap: 24,
      }}
    >
      <header style={{ display: "grid", gap: 8 }}>
        <span
          className="mono"
          style={{ fontSize: 12, color: "var(--sand)", letterSpacing: 1 }}
        >
          ABU DHABI · INVESTMENT INTELLIGENCE
        </span>
        <h1 style={{ fontSize: 30, fontWeight: 700, letterSpacing: -0.5 }}>
          ParcelFit
        </h1>
        <p style={{ color: "var(--text-dim)", fontSize: 15, maxWidth: 640 }}>
          An Abu Dhabi investment desk fields hundreds of mandates against
          hundreds of parcels — manually, and opaquely. ParcelFit ranks every
          parcel against a mandate and shows the committee <em>why</em>, factor
          by factor, with an AI analyst briefing on top.
        </p>
      </header>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 12,
          padding: "12px 14px",
          border: "1px solid var(--ink-line-soft)",
          borderRadius: "var(--radius)",
          background: "var(--ink-raised)",
        }}
      >
        <StepBadge n={1} label="Choose mandate" active={activeStep === 1} />
        <StepBadge
          n={2}
          label="Score all 600 parcels"
          active={activeStep === 2}
        />
        <StepBadge
          n={3}
          label="Briefing + ranked list"
          active={activeStep === 3}
        />
      </div>

      <section style={{ display: "grid", gap: 10 }}>
        <h2 style={{ fontSize: 13, fontWeight: 600, color: "var(--text-dim)" }}>
          Step 1 — Mandate
        </h2>
        <div
          style={{
            background: "var(--ink-raised)",
            border: "1px solid var(--ink-line)",
            borderRadius: "var(--radius)",
            padding: 16,
            display: "grid",
            gap: 14,
          }}
        >
          <div
            style={{
              display: "flex",
              gap: 10,
              flexWrap: "wrap",
              alignItems: "end",
            }}
          >
            <label style={{ display: "grid", gap: 6, flex: "1 1 260px" }}>
              <span style={{ fontSize: 12, color: "var(--text-dim)" }}>
                Filter mandates
              </span>
              <input
                type="search"
                value={mandateFilter}
                onChange={(e) => setMandateFilter(e.target.value)}
                placeholder="ID, sector, district, risk…"
                style={{
                  background: "var(--ink)",
                  color: "var(--text)",
                  border: "1px solid var(--ink-line)",
                  borderRadius: "var(--radius)",
                  padding: "10px 12px",
                  fontSize: 14,
                }}
              />
            </label>
            <label style={{ display: "grid", gap: 6, flex: "1 1 260px" }}>
              <span style={{ fontSize: 12, color: "var(--text-dim)" }}>
                Investor mandate
                {mandateFilter.trim() ? (
                  <span style={{ color: "var(--text-faint)" }}>
                    {" "}
                    · {filteredInvestors.length} match
                    {filteredInvestors.length === 1 ? "" : "es"}
                  </span>
                ) : null}
              </span>
              <select
                value={selected}
                onChange={(e) => {
                  setSelected(e.target.value);
                  setCompareTipDismissed(false);
                }}
                disabled={!filteredInvestors.length}
                style={{
                  background: "var(--ink)",
                  color: "var(--text)",
                  border: "1px solid var(--ink-line)",
                  borderRadius: "var(--radius)",
                  padding: "10px 12px",
                  fontSize: 14,
                  fontFamily: "var(--font-mono)",
                  opacity: filteredInvestors.length ? 1 : 0.6,
                }}
              >
                {filteredInvestors.map((i) => (
                  <option key={i.investor_id} value={i.investor_id}>
                    {i.investor_id} — {i.investor_type} · {i.preferred_sector}{" "}
                    · {i.preferred_district}
                  </option>
                ))}
              </select>
            </label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button
                onClick={runMatch}
                disabled={loading || !selected}
                style={{
                  background: "var(--sand)",
                  color: "var(--ink)",
                  border: "none",
                  borderRadius: "var(--radius)",
                  padding: "10px 22px",
                  fontSize: 14,
                  fontWeight: 600,
                  opacity: loading ? 0.6 : 1,
                }}
              >
                {loading ? "Scoring 600 parcels…" : "Find parcels"}
              </button>
              <button
                onClick={runDemo}
                disabled={loading}
                style={{
                  background: "transparent",
                  color: "var(--text-dim)",
                  border: "1px solid var(--ink-line)",
                  borderRadius: "var(--radius)",
                  padding: "10px 16px",
                  fontSize: 14,
                  opacity: loading ? 0.6 : 1,
                }}
              >
                Try demo ({DEMO_INVESTOR_ID})
              </button>
            </div>
          </div>

          {loading && (
            <div style={{ display: "grid", gap: 8 }}>
              <p style={{ fontSize: 13, color: "var(--text-dim)" }}>
                Scoring 600 parcels against this mandate and drafting the analyst
                briefing…
              </p>
              <div
                role="progressbar"
                aria-label="Matching in progress"
                style={{
                  height: 4,
                  borderRadius: 2,
                  overflow: "hidden",
                  background: "var(--ink-line-soft)",
                }}
              >
                <div className="match-progress-bar" />
              </div>
            </div>
          )}

          {inv && (
            <>
              <p
                style={{
                  fontSize: 13.5,
                  lineHeight: 1.5,
                  color: "var(--text-dim)",
                }}
              >
                {mandateSummary(inv)}
              </p>
              <div
                style={{
                  display: "flex",
                  gap: 22,
                  flexWrap: "wrap",
                  paddingTop: 12,
                  borderTop: "1px solid var(--ink-line-soft)",
                }}
              >
                <MandateChip k="type" v={inv.investor_type} />
                <MandateChip k="sector" v={inv.preferred_sector} />
                <MandateChip k="district" v={inv.preferred_district} />
                <MandateChip k="capital" v={inv.capital_range_aed} />
                <MandateChip k="risk" v={inv.risk_profile} />
                <MandateChip k="horizon" v={inv.investment_horizon} />
              </div>
            </>
          )}
        </div>
      </section>

      <ScoringLegend />

      {error && (
        <p style={{ color: "var(--warn)", fontSize: 14 }}>{error}</p>
      )}

      {!result && !loading && (
        <div
          style={{
            padding: "16px 18px",
            border: "1px dashed var(--ink-line)",
            borderRadius: "var(--radius)",
            display: "grid",
            gap: 8,
          }}
        >
          <p style={{ fontSize: 14, color: "var(--text-dim)", lineHeight: 1.55 }}>
            Select a mandate above, then run a match. ParcelFit scores every parcel
            in the dataset, ranks the top eight, and writes a committee briefing
            you can audit factor by factor.
          </p>
          <p style={{ fontSize: 13, color: "var(--text-faint)" }}>
            New here? Click{" "}
            <strong style={{ color: "var(--sand)", fontWeight: 600 }}>
              Try demo ({DEMO_INVESTOR_ID})
            </strong>{" "}
            for a balanced, short-horizon mandate — then switch to{" "}
            <span className="mono">{COMPARE_INVESTOR_ID}</span> to see vacant
            high-potential parcels rise for an aggressive profile.
          </p>
        </div>
      )}

      {result?.rationale && (
        <section style={{ display: "grid", gap: 10 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              flexWrap: "wrap",
            }}
          >
            <h2
              style={{ fontSize: 13, fontWeight: 600, color: "var(--text-dim)" }}
            >
              Step 2 — Analyst briefing
            </h2>
            {result.rationaleSource && (
              <ProvenanceBadge source={result.rationaleSource} />
            )}
          </div>
          <div
            style={{
              background:
                "linear-gradient(180deg, rgba(232,162,74,0.06), transparent)",
              border: "1px solid var(--ink-line)",
              borderRadius: "var(--radius)",
              padding: 18,
              display: "grid",
              gap: 8,
            }}
          >
            <span
              className="mono"
              style={{ fontSize: 11, color: "var(--sand)", letterSpacing: 1 }}
            >
              ANALYST BRIEFING
            </span>
            <p
              style={{
                fontSize: 14.5,
                lineHeight: 1.6,
                color: "var(--text)",
                whiteSpace: "pre-wrap",
              }}
            >
              {result.rationale}
            </p>
            {result.rationaleSource === "fallback" && (
              <p style={{ fontSize: 12, color: "var(--text-faint)" }}>
                Set <span className="mono">ANTHROPIC_API_KEY</span> for the full
                AI analyst briefing on Vercel.
              </p>
            )}
          </div>
        </section>
      )}

      {showCompareTip && (
        <div
          style={{
            display: "flex",
            gap: 12,
            alignItems: "start",
            justifyContent: "space-between",
            padding: "12px 14px",
            border: "1px solid var(--ink-line)",
            borderRadius: "var(--radius)",
            background: "var(--ink-raised)",
          }}
        >
          <p style={{ fontSize: 13, color: "var(--text-dim)", lineHeight: 1.5 }}>
            <strong style={{ color: "var(--text)", fontWeight: 600 }}>Tip:</strong>{" "}
            re-run with{" "}
            <button
              type="button"
              onClick={() => {
                setSelected(COMPARE_INVESTOR_ID);
                void runMatchFor(COMPARE_INVESTOR_ID);
              }}
              style={{
                background: "none",
                border: "none",
                padding: 0,
                color: "var(--sand)",
                fontFamily: "var(--font-mono)",
                fontSize: 13,
                textDecoration: "underline",
                cursor: "pointer",
              }}
            >
              {COMPARE_INVESTOR_ID}
            </button>{" "}
            (aggressive, long horizon) to see vacant parcels with high development
            potential rise — same engine, opposite mandate.
          </p>
          <button
            type="button"
            onClick={() => setCompareTipDismissed(true)}
            aria-label="Dismiss tip"
            style={{
              background: "transparent",
              border: "none",
              color: "var(--text-faint)",
              fontSize: 18,
              lineHeight: 1,
              padding: "0 4px",
              flexShrink: 0,
            }}
          >
            ×
          </button>
        </div>
      )}

      {result && (
        <section style={{ display: "grid", gap: 12 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "end",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <h2 style={{ fontSize: 13, fontWeight: 600, color: "var(--text-dim)" }}>
              Step 3 — Ranked parcels
            </h2>
            <div
              style={{
                display: "flex",
                gap: 12,
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <button
                type="button"
                onClick={toggleAllBreakdowns}
                style={{
                  background: "transparent",
                  color: "var(--text-dim)",
                  border: "1px solid var(--ink-line)",
                  borderRadius: "var(--radius)",
                  padding: "6px 12px",
                  fontSize: 12,
                }}
              >
                {allBreakdownsExpanded
                  ? "Collapse to top 2"
                  : "Show all breakdowns"}
              </button>
              <span
                className="mono"
                style={{ fontSize: 12, color: "var(--text-faint)" }}
              >
                budget {fmtAed(result.capitalMin)} – {fmtAed(result.capitalMax)} ·
                80+ = strong fit
              </span>
            </div>
          </div>
          {result.matches.map((m, i) => (
            <ParcelCard
              key={m.parcel.parcel_id}
              match={m}
              rank={i + 1}
              showFactorHelper={i === 0}
              open={expandedIds.includes(m.parcel.parcel_id)}
              onOpenChange={(open) => toggleExpanded(m.parcel.parcel_id, open)}
            />
          ))}
        </section>
      )}

      <footer
        style={{
          paddingTop: 8,
          borderTop: "1px solid var(--ink-line-soft)",
        }}
      >
        <p style={{ fontSize: 12, color: "var(--text-faint)", lineHeight: 1.5 }}>
          Challenge dataset · 200 investor mandates × 600 Abu Dhabi land parcels ·
          synthetic values for demonstration.
        </p>
      </footer>
    </main>
  );
}
