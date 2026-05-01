import type { FinancialInput, RiskAnalysis } from "@/types";

export async function processConfidentialData(
  input: FinancialInput,
): Promise<RiskAnalysis> {
  // Placeholder for Nox confidential compute execution.
  const burnMultiple = input.monthlyBurn / Math.max(input.monthlyRevenue, 1);
  const marginPenalty = input.grossMargin < 45 ? 18 : input.grossMargin < 65 ? 8 : 0;
  const runwayPenalty = input.runwayMonths < 6 ? 22 : input.runwayMonths < 12 ? 10 : 0;
  const burnPenalty = burnMultiple > 1.5 ? 24 : burnMultiple > 1 ? 12 : 4;
  const scaleCredit = input.customerCount > 100 ? 10 : input.customerCount > 25 ? 5 : 0;

  const score = Math.min(
    100,
    Math.max(1, Math.round(30 + marginPenalty + runwayPenalty + burnPenalty - scaleCredit)),
  );

  return {
    score,
    level: score < 40 ? "low" : score < 70 ? "medium" : "high",
    metrics: {
      revenueGrowthSignal: input.monthlyRevenue > 50000 ? "Strong" : "Early",
      burnMultiple: Number(burnMultiple.toFixed(2)),
      runwayMonths: input.runwayMonths,
      marginHealth: input.grossMargin >= 65 ? "Efficient" : "Needs proof",
    },
  };
}
