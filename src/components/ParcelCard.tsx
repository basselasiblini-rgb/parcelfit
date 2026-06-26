"use client";

import { useState } from "react";
import type { ParcelMatch } from "@/lib/types";
import { FactorBars } from "./FactorBars";

function fmtAed(n: number): string {
  if (n >= 1_000_000_000) return `AED ${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `AED ${(n / 1_000_000).toFixed(1)}M`;
  return `AED ${n.toLocaleString()}`;
}

const STATUS_LABEL: Record<string, string> = {
  vacant: "Vacant",
  reserved: "Reserved",
  under_development: "Under development",
  developed: "Developed",
};

export function ParcelCard({
  match,
  rank,
  showFactorHelper,
  open,
  onOpenChange,
}: {
  match: ParcelMatch;
  rank: number;
  showFactorHelper?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [internalOpen, setInternalOpen] = useState(rank <= 2);
  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalOpen;

  function toggleOpen() {
    const next = !isOpen;
    if (isControlled) onOpenChange?.(next);
    else setInternalOpen(next);
  }
  const p = match.parcel;
  const strong = match.total >= 80;

  return (
    <article
      style={{
        background: "var(--ink-raised)",
        border: "1px solid var(--ink-line)",
        borderLeft: `3px solid ${strong ? "var(--signal)" : "var(--sand)"}`,
        borderRadius: "var(--radius)",
        overflow: "hidden",
      }}
    >
      <button
        onClick={toggleOpen}
        style={{
          width: "100%",
          background: "transparent",
          border: "none",
          color: "inherit",
          padding: "14px 16px",
          display: "grid",
          gridTemplateColumns: "auto 1fr auto",
          gap: 14,
          alignItems: "center",
          textAlign: "left",
        }}
        aria-expanded={isOpen}
      >
        <span
          className="mono"
          style={{
            fontSize: 13,
            color: "var(--text-faint)",
            minWidth: 22,
          }}
        >
          {String(rank).padStart(2, "0")}
        </span>
        <span style={{ display: "grid", gap: 3 }}>
          <span style={{ display: "flex", gap: 8, alignItems: "baseline" }}>
            <span className="mono" style={{ fontSize: 14, fontWeight: 600 }}>
              {p.parcel_id}
            </span>
            <span style={{ fontSize: 12.5, color: "var(--text-dim)" }}>
              {p.land_use.replace("_", " ")} · {p.district}
            </span>
          </span>
          <span
            style={{ fontSize: 12, color: "var(--text-faint)" }}
            className="mono"
          >
            {fmtAed(p.estimated_value_aed)} · {p.parcel_size_sqm.toLocaleString()}{" "}
            sqm · {STATUS_LABEL[p.current_status] ?? p.current_status}
          </span>
        </span>
        <span style={{ textAlign: "right", display: "grid", gap: 2 }}>
          <span
            className="mono"
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: strong ? "var(--signal)" : "var(--sand)",
              lineHeight: 1,
            }}
          >
            {match.total}
          </span>
          <span style={{ fontSize: 10, color: "var(--text-faint)" }}>
            / 100
          </span>
        </span>
      </button>

      {match.flags.length > 0 && (
        <div
          style={{
            padding: "0 16px 10px",
            display: "flex",
            flexWrap: "wrap",
            gap: 6,
          }}
        >
          {match.flags.map((flag) => (
            <span
              key={flag}
              style={{
                fontSize: 11,
                color: "var(--warn)",
                border: "1px solid var(--warn)",
                borderRadius: 4,
                padding: "2px 7px",
                opacity: 0.85,
              }}
            >
              ⚠ {flag}
            </span>
          ))}
        </div>
      )}

      {isOpen && (
        <div
          style={{
            padding: "12px 16px 16px",
            borderTop: "1px solid var(--ink-line-soft)",
            display: "grid",
            gap: 14,
          }}
        >
          <div
            style={{
              display: "flex",
              gap: 16,
              flexWrap: "wrap",
              fontSize: 11.5,
              color: "var(--text-dim)",
            }}
            className="mono"
          >
            <span>zone {p.zone}</span>
            <span>infra {p.infrastructure_score}</span>
            <span>dev-potential {p.development_potential_score}</span>
            <span>rec: {p.recommended_use.replace(/_/g, " ")}</span>
          </div>
          <FactorBars factors={match.factors} showHelper={showFactorHelper} />
        </div>
      )}
    </article>
  );
}
