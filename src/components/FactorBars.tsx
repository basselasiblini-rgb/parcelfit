"use client";

import type { MatchFactor } from "@/lib/types";

// The signature element: a parcel's score decomposed into its weighted factors,
// so the committee can see exactly why a parcel ranked where it did.
export function FactorBars({ factors }: { factors: MatchFactor[] }) {
  return (
    <div style={{ display: "grid", gap: 8 }}>
      {factors.map((f) => {
        const pct = Math.round(f.score * 100);
        const contribution = Math.round(f.score * f.weight * 100);
        return (
          <div key={f.key} style={{ display: "grid", gap: 3 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                fontSize: 12,
              }}
            >
              <span style={{ color: "var(--text-dim)" }}>{f.label}</span>
              <span
                className="mono"
                style={{ color: "var(--text-faint)", fontSize: 11 }}
              >
                {pct}% × {Math.round(f.weight * 100)}w → +{contribution}
              </span>
            </div>
            <div
              style={{
                height: 6,
                background: "var(--ink-line-soft)",
                borderRadius: 3,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${pct}%`,
                  background:
                    f.score >= 0.7
                      ? "var(--signal)"
                      : f.score >= 0.4
                        ? "var(--sand)"
                        : "var(--warn)",
                  transition: "width 0.4s ease",
                }}
              />
            </div>
            <p
              style={{
                fontSize: 11.5,
                color: "var(--text-faint)",
                lineHeight: 1.4,
              }}
            >
              {f.detail}
            </p>
          </div>
        );
      })}
    </div>
  );
}
