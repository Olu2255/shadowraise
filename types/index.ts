import type { Address } from "viem";

export type RiskLevel = "low" | "medium" | "high";

export type FinancialInput = {
  companyName: string;
  sector: string;
  monthlyRevenue: number;
  monthlyBurn: number;
  runwayMonths: number;
  grossMargin: number;
  customerCount: number;
  fundingTarget: number;
};

export type OnChainDealPublicSignals = {
  publicMetadataURI: string;
  publicRiskScore: number;
  publicRiskLevel: RiskLevel;
  publicConfidenceScore: number;
  revenueBand: string;
  burnRiskBand: string;
};

export type RiskAnalysis = {
  score: number;
  level: RiskLevel;
  metrics: {
    revenueGrowthSignal: string;
    burnMultiple: number;
    runwayMonths: number;
    marginHealth: string;
  };
};

export type AIInsight = {
  summary: string;
  strengths: string[];
  risks: string[];
  recommendation: "watch" | "meet" | "investigate";
  memoSource?: "chaingpt" | "deterministic";
};

export type Deal = {
  id: string;
  founder?: Address;
  publicSignals?: OnChainDealPublicSignals;
  companyName: string;
  sector: string;
  fundingTarget: number;
  submittedAt: string;
  riskAnalysis: RiskAnalysis;
  aiInsight: AIInsight;
};
