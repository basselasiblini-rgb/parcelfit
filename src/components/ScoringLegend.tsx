"use client";

import { useState } from "react";
import { WEIGHTS } from "@/lib/matcher";

const FACTORS = [
  {
    key: "sector",
    weight: WEIGHTS.sector,
    label: "Sector fit",
    detail: "Land use vs preferred sector; logistics maps to industrial.",
  },
  {
    key: "capital",
    weight: WEIGHTS.capital,
    label: "Capital fit",
    detail: "Parcel value vs mandate range; rewards budget sweet-spot.",
  },
  {
    key: "district",
    weight: WEIGHTS.district,
    label: "District fit",
    detail: "Soft preference — not a hard filter.",
  },
  {
    key: "risk",
    weight: WEIGHTS.risk,
    label: "Risk alignment",
    detail: "Status, infrastructure, and development potential vs risk profile.",
  },
  {
    key: "horizon",
    weight: WEIGHTS.horizon,
    label: "Horizon fit",
    detail: "Parcel status vs investment horizon.",
  },
] as const;

export function ScoringLegend() {
  const [open, setOpen] = useState(false);

  return (
    <section
      style={{
        border: "1px solid var(--ink-line)",
        borderRadius: "var(--radius)",
        overflow: "hidden",
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          padding: "12px 14px",
          background: "transparent",
          border: "none",
          color: "var(--text-dim)",
          fontSize: 13,
          textAlign: "left",
        }}
      >
        <span>How scoring works</span>
        <span className="mono" style={{ fontSize: 11, color: "var(--text-faint)" }}>
          {open ? "−" : "+"}
        </span>
      </button>

      {open && (
        <div
          style={{
            padding: "0 14px 14px",
            display: "grid",
            gap: 12,
            borderTop: "1px solid var(--ink-line-soft)",
          }}
        >
          <p style={{ fontSize: 12.5, color: "var(--text-faint)", paddingTop: 12, lineHeight: 1.5 }}>
            Match score = weighted sum of five factors × 100. Weights are explicit
            product judgements in{" "}
            <span className="mono" style={{ color: "var(--text-dim)" }}>matcher.ts</span>,
            not learned from outcomes.
          </p>

          <div
            style={{
              display: "flex",
              height: 8,
              borderRadius: 4,
              overflow: "hidden",
              background: "var(--ink-line-soft)",
            }}
            aria-hidden
          >
            {FACTORS.map((f) => (
              <div
                key={f.key}
                style={{
                  width: `${f.weight * 100}%`,
                  background:
                    f.key === "sector"
                      ? "var(--sand)"
                      : f.key === "capital"
                        ? "var(--signal-dim)"
                        : "var(--text-faint)",
                  opacity: f.key === "district" || f.key === "risk" || f.key === "horizon" ? 0.55 : 1,
                }}
                title={`${f.label} ${Math.round(f.weight * 100)}%`}
              />
            ))}
          </div>

          <div style={{ display: "grid", gap: 8 }}>
            {FACTORS.map((f) => (
              <div
                key={f.key}
                style={{
                  display: "grid",
                  gridTemplateColumns: "auto 1fr",
                  gap: "4px 10px",
                  fontSize: 12,
                }}
              >
                <span className="mono" style={{ color: "var(--sand)", minWidth: 32 }}>
                  {Math.round(f.weight * 100)}%
                </span>
                <span style={{ color: "var(--text-dim)" }}>
                  <strong style={{ fontWeight: 600, color: "var(--text)" }}>
                    {f.label}
                  </strong>
                  {" — "}
                  {f.detail}
                </span>
              </div>
            ))}
          </div>

          <p style={{ fontSize: 11.5, color: "var(--text-faint)", lineHeight: 1.45 }}>
            On each parcel: factor score × weight = points toward 100 (shown as +N on
            each bar). Scores 80+ = strong mandate fit; differentiation below that
            band comes from risk and horizon.
          </p>
        </div>
      )}
    </section>
  );
}
