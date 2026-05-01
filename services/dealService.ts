import { deterministicSignalMemoFromAnalysis } from "@/services/aiInsights";
import { processConfidentialData } from "@/services/confidentialProcessing";
import type { Deal, FinancialInput } from "@/types";

export async function analyzeSubmittedDeal(input: FinancialInput): Promise<Deal> {
  const riskAnalysis = await processConfidentialData(input);
  const aiInsight = deterministicSignalMemoFromAnalysis(input, riskAnalysis);

  return {
    id: crypto.randomUUID(),
    companyName: input.companyName,
    sector: input.sector,
    fundingTarget: input.fundingTarget,
    submittedAt: new Date().toISOString(),
    riskAnalysis,
    aiInsight,
  };
}
