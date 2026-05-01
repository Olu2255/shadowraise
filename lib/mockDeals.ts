import type { Deal } from "@/types";

export const mockDeals: Deal[] = [
  {
    id: "atlas-pay",
    companyName: "Atlas Pay",
    sector: "B2B Payments",
    fundingTarget: 1200000,
    submittedAt: "2026-04-20T10:00:00.000Z",
    riskAnalysis: {
      score: 34,
      level: "low",
      metrics: {
        revenueGrowthSignal: "Strong",
        burnMultiple: 0.82,
        runwayMonths: 16,
        marginHealth: "Efficient",
      },
    },
    aiInsight: {
      summary:
        "Atlas Pay has strong payment-volume signals and healthy burn discipline. Confidential analysis suggests the team is ready for partner meetings.",
      strengths: ["Efficient burn", "High-margin revenue", "Clear enterprise wedge"],
      risks: ["Customer concentration needs review", "Payments compliance diligence required"],
      recommendation: "meet",
    },
  },
  {
    id: "neuro-ledger",
    companyName: "NeuroLedger",
    sector: "AI Accounting",
    fundingTarget: 850000,
    submittedAt: "2026-04-22T14:30:00.000Z",
    riskAnalysis: {
      score: 58,
      level: "medium",
      metrics: {
        revenueGrowthSignal: "Early",
        burnMultiple: 1.18,
        runwayMonths: 10,
        marginHealth: "Needs proof",
      },
    },
    aiInsight: {
      summary:
        "NeuroLedger is early but promising, with enough signal to justify deeper diligence if the investor has thesis alignment.",
      strengths: ["Timely AI automation thesis", "Founder-market fit", "Growing customer base"],
      risks: ["Shorter runway", "Margin profile still developing", "Competitive category"],
      recommendation: "investigate",
    },
  },
  {
    id: "carbon-loop",
    companyName: "CarbonLoop",
    sector: "Climate Finance",
    fundingTarget: 2000000,
    submittedAt: "2026-04-24T09:15:00.000Z",
    riskAnalysis: {
      score: 72,
      level: "high",
      metrics: {
        revenueGrowthSignal: "Early",
        burnMultiple: 1.64,
        runwayMonths: 5,
        marginHealth: "Needs proof",
      },
    },
    aiInsight: {
      summary:
        "CarbonLoop has a compelling market but current burn and runway suggest investors should monitor until financing or revenue quality improves.",
      strengths: ["Large market", "Differentiated data partnerships", "Policy tailwinds"],
      risks: ["High burn multiple", "Short runway", "Long enterprise sales cycle"],
      recommendation: "watch",
    },
  },
];

export function getDeals() {
  return mockDeals;
}

export function getDealById(id: string) {
  return mockDeals.find((deal) => deal.id === id);
}
