import type {
  AIInsight,
  FinancialInput,
  OnChainDealPublicSignals,
  RiskAnalysis,
} from "@/types";

export type PublicMemoSignals = OnChainDealPublicSignals & {
  contractAddress?: string;
  dealId?: string;
  companyName: string;
  sector: string;
  fundingTarget: number;
};

export function deterministicSignalMemo(signals: PublicMemoSignals): AIInsight {
  const riskLevel = signals.publicRiskLevel;

  return {
    summary: `${signals.companyName} submitted confidential founder metrics onchain. Public signals show ${signals.revenueBand.toLowerCase()} revenue and ${signals.burnRiskBand.toLowerCase()} burn risk with ${signals.publicConfidenceScore}% confidence.`,
    strengths: [
      `Public confidence score: ${signals.publicConfidenceScore}/100`,
      `Revenue band: ${signals.revenueBand}`,
      `Risk level: ${riskLevel}`,
    ],
    risks: [
      "Raw financials remain encrypted",
      "Further diligence required before investment",
    ],
    recommendation:
      riskLevel === "low" ? "meet" : riskLevel === "medium" ? "investigate" : "watch",
    memoSource: "deterministic",
  };
}

export function deterministicSignalMemoFromAnalysis(
  input: FinancialInput,
  riskAnalysis: RiskAnalysis,
): AIInsight {
  return deterministicSignalMemo({
    companyName: input.companyName,
    sector: input.sector,
    fundingTarget: input.fundingTarget,
    publicMetadataURI: `shadowraise:local:${slugify(input.companyName)}`,
    publicRiskScore: riskAnalysis.score,
    publicRiskLevel: riskAnalysis.level,
    publicConfidenceScore: calculateConfidenceFromRisk(riskAnalysis),
    revenueBand: riskAnalysis.metrics.revenueGrowthSignal,
    burnRiskBand: riskAnalysis.metrics.marginHealth,
  });
}

export function withMemoText(
  fallbackInsight: AIInsight,
  memo: string,
  memoSource: AIInsight["memoSource"],
): AIInsight {
  return {
    ...fallbackInsight,
    summary: memo,
    memoSource,
  };
}

function calculateConfidenceFromRisk(riskAnalysis: RiskAnalysis) {
  return Math.max(1, Math.min(100, 100 - Math.round(riskAnalysis.score / 2)));
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
