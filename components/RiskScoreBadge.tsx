import type { RiskAnalysis } from "@/types";

const styles = {
  low: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  medium: "bg-amber-50 text-amber-700 ring-amber-200",
  high: "bg-rose-50 text-rose-700 ring-rose-200",
};

type RiskScoreBadgeProps = {
  riskAnalysis: RiskAnalysis;
};

export function RiskScoreBadge({ riskAnalysis }: RiskScoreBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ring-1 ${styles[riskAnalysis.level]}`}
    >
      <span>{riskAnalysis.score}/100</span>
      <span className="capitalize">{riskAnalysis.level} risk</span>
    </span>
  );
}
