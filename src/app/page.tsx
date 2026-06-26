"use client";

import { useEffect, useState } from "react";
import type { Investor } from "@/lib/types";
import type { MatchResponse } from "@/lib/api-types";
import { ParcelCard } from "@/components/ParcelCard";

function fmtAed(n: number): string {
  if (n >= 1_000_000_000) return `AED ${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `AED ${(n / 1_000_000).toFixed(1)}M`;
  return `AED ${n.toLocaleString()}`;
}

const MandateChip = ({ k, v }: { k: string; v: string }) => (
  <span style={{ display: "grid", gap: 2 }}>
    <span style={{ fontSize: 10, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: 0.5 }}>
      {k}
    </span>
    <span className="mono" style={{ fontSize: 13, color: "var(--text)" }}>
      {v}
    </span>
  </span>
);

export default function Home() {
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [result, setResult] = useState<MatchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/investors")
      .then((r) => r.json())
      .then((d) => {
        setInvestors(d.investors);
        if (d.investors.length) setSelected(d.investors[0].investor_id);
      })
      .catch(() => setError("Could not load investor mandates."));
  }, []);

  async function runMatch() {
    if (!selected) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ investorId: selected, topN: 8 }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Match failed");
      setResult(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  const inv = investors.find((i) => i.investor_id === selected);

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

      {/* Mandate picker */}
      <section
        style={{
          background: "var(--ink-raised)",
          border: "1px solid var(--ink-line)",
          borderRadius: "var(--radius)",
          padding: 16,
          display: "grid",
          gap: 14,
        }}
      >
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "end" }}>
          <label style={{ display: "grid", gap: 6, flex: "1 1 260px" }}>
            <span style={{ fontSize: 12, color: "var(--text-dim)" }}>
              Investor mandate
            </span>
            <select
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
              style={{
                background: "var(--ink)",
                color: "var(--text)",
                border: "1px solid var(--ink-line)",
                borderRadius: "var(--radius)",
                padding: "10px 12px",
                fontSize: 14,
                fontFamily: "var(--font-mono)",
              }}
            >
              {investors.map((i) => (
                <option key={i.investor_id} value={i.investor_id}>
                  {i.investor_id} — {i.investor_type} · {i.preferred_sector} ·{" "}
                  {i.preferred_district}
                </option>
              ))}
            </select>
          </label>
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
            {loading ? "Matching…" : "Find parcels"}
          </button>
        </div>

        {inv && (
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
        )}
      </section>

      {error && (
        <p style={{ color: "var(--warn)", fontSize: 14 }}>{error}</p>
      )}

      {/* AI briefing */}
      {result?.rationale && (
        <section
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
        </section>
      )}

      {/* Ranked parcels */}
      {result && (
        <section style={{ display: "grid", gap: 12 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
            }}
          >
            <h2 style={{ fontSize: 16, fontWeight: 600 }}>
              Ranked parcels
            </h2>
            <span
              className="mono"
              style={{ fontSize: 12, color: "var(--text-faint)" }}
            >
              budget {fmtAed(result.capitalMin)} – {fmtAed(result.capitalMax)}
            </span>
          </div>
          {result.matches.map((m, i) => (
            <ParcelCard key={m.parcel.parcel_id} match={m} rank={i + 1} />
          ))}
        </section>
      )}

      {!result && !loading && (
        <p style={{ color: "var(--text-faint)", fontSize: 14 }}>
          Pick a mandate and run a match to see ranked parcels with a full
          factor breakdown.
        </p>
      )}
    </main>
  );
}
