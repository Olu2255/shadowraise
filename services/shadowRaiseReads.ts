"use client";

import { createPublicClient, http, isAddress, type Address } from "viem";
import { arbitrumSepolia } from "viem/chains";
import { shadowRaiseDealRegistryAbi } from "@/lib/abis/shadowRaiseDealRegistry";
import {
  deterministicSignalMemo,
  type PublicMemoSignals,
} from "@/services/aiInsights";
import type { Deal, RiskLevel } from "@/types";

type PublicDealContract = {
  id: bigint;
  founder: Address;
  companyName: string;
  sector: string;
  fundingTarget: bigint;
  publicMetadataURI: string;
  publicRiskScore: bigint;
  publicRiskLevel: string;
  publicConfidenceScore: bigint;
  revenueBand: string;
  burnRiskBand: string;
  active: boolean;
  createdAt: bigint;
};

export type InvestorInvestment = {
  id: string;
  dealId: string;
  investor: Address;
  createdAt: string;
};

type InvestmentIntentContract = {
  id: bigint;
  dealId: bigint;
  investor: Address;
  encryptedAmount: `0x${string}`;
  createdAt: bigint;
};

const publicClient = createPublicClient({
  chain: arbitrumSepolia,
  transport: http(),
});

export async function getDealCount() {
  return publicClient.readContract({
    address: getRegistryAddress(),
    abi: shadowRaiseDealRegistryAbi,
    functionName: "getDealCount",
  });
}

export async function getPublicDeal(id: bigint) {
  const publicDeal = (await publicClient.readContract({
    address: getRegistryAddress(),
    abi: shadowRaiseDealRegistryAbi,
    functionName: "getPublicDeal",
    args: [id],
  })) as PublicDealContract;

  return mapPublicDealToDeal(publicDeal);
}

export async function getAllPublicDeals() {
  const count = await getDealCount();

  if (count === BigInt(0)) {
    return [];
  }

  const ids = Array.from({ length: Number(count) }, (_, index) =>
    BigInt(index + 1),
  );
  const deals = await Promise.all(ids.map((id) => getPublicDeal(id)));

  return deals.filter(Boolean);
}

export async function getFounderDeals(address: Address) {
  const ids = await getFounderDealIds(address);
  const deals = await Promise.all(ids.map((id) => getPublicDeal(id)));

  return deals.filter(Boolean);
}

export async function getInvestorInvestmentIds(address: Address) {
  return publicClient.readContract({
    address: getRegistryAddress(),
    abi: shadowRaiseDealRegistryAbi,
    functionName: "getInvestorInvestmentIds",
    args: [address],
  });
}

export async function getInvestmentIntent(id: bigint): Promise<InvestorInvestment> {
  const investment = (await publicClient.readContract({
    address: getRegistryAddress(),
    abi: shadowRaiseDealRegistryAbi,
    functionName: "getInvestmentIntent",
    args: [id],
  })) as InvestmentIntentContract;

  return {
    id: safeBigIntToNumber(investment.id).toString(),
    dealId: safeBigIntToNumber(investment.dealId).toString(),
    investor: investment.investor,
    createdAt: new Date(
      safeBigIntToNumber(investment.createdAt) * 1000,
    ).toISOString(),
  };
}

export async function getInvestorInvestments(address: Address) {
  const ids = await getInvestorInvestmentIds(address);
  return Promise.all(ids.map((id) => getInvestmentIntent(id)));
}

async function getFounderDealIds(address: Address) {
  return publicClient.readContract({
    address: getRegistryAddress(),
    abi: shadowRaiseDealRegistryAbi,
    functionName: "getFounderDealIds",
    args: [address],
  });
}

function getRegistryAddress(): Address {
  const contractAddress = process.env.NEXT_PUBLIC_SHADOWRAISE_CONTRACT_ADDRESS;

  if (!contractAddress || !isAddress(contractAddress)) {
    throw new Error(
      "Missing NEXT_PUBLIC_SHADOWRAISE_CONTRACT_ADDRESS for marketplace reads.",
    );
  }

  return contractAddress;
}

function mapPublicDealToDeal(publicDeal: PublicDealContract): Deal {
  const riskLevel = normalizeRiskLevel(publicDeal.publicRiskLevel);
  const riskScore = safeBigIntToNumber(publicDeal.publicRiskScore);
  const memoSignals = mapPublicDealToMemoSignals(publicDeal);

  return {
    id: safeBigIntToNumber(publicDeal.id).toString(),
    founder: publicDeal.founder,
    publicSignals: {
      publicMetadataURI: publicDeal.publicMetadataURI,
      publicRiskScore: memoSignals.publicRiskScore,
      publicRiskLevel: memoSignals.publicRiskLevel,
      publicConfidenceScore: memoSignals.publicConfidenceScore,
      revenueBand: memoSignals.revenueBand,
      burnRiskBand: memoSignals.burnRiskBand,
    },
    companyName: publicDeal.companyName,
    sector: publicDeal.sector,
    fundingTarget: safeBigIntToNumber(publicDeal.fundingTarget),
    submittedAt: new Date(
      safeBigIntToNumber(publicDeal.createdAt) * 1000,
    ).toISOString(),
    riskAnalysis: {
      score: riskScore,
      level: riskLevel,
      metrics: {
        revenueGrowthSignal: publicDeal.revenueBand || "Onchain signal",
        burnMultiple: 0,
        runwayMonths: 0,
        marginHealth: publicDeal.burnRiskBand || "Confidential",
      },
    },
    aiInsight: deterministicSignalMemo(memoSignals),
  };
}

function mapPublicDealToMemoSignals(
  publicDeal: PublicDealContract,
): PublicMemoSignals {
  return {
    contractAddress: getRegistryAddress(),
    dealId: safeBigIntToNumber(publicDeal.id).toString(),
    companyName: publicDeal.companyName,
    sector: publicDeal.sector,
    fundingTarget: safeBigIntToNumber(publicDeal.fundingTarget),
    publicMetadataURI: publicDeal.publicMetadataURI,
    publicRiskScore: safeBigIntToNumber(publicDeal.publicRiskScore),
    publicRiskLevel: normalizeRiskLevel(publicDeal.publicRiskLevel),
    publicConfidenceScore: safeBigIntToNumber(publicDeal.publicConfidenceScore),
    revenueBand: publicDeal.revenueBand || "Onchain signal",
    burnRiskBand: publicDeal.burnRiskBand || "Confidential",
  };
}

function normalizeRiskLevel(value: string): RiskLevel {
  const normalized = value.toLowerCase();

  if (normalized === "low" || normalized === "medium" || normalized === "high") {
    return normalized;
  }

  return "medium";
}

function safeBigIntToNumber(value: bigint) {
  if (value > BigInt(Number.MAX_SAFE_INTEGER)) {
    return Number.MAX_SAFE_INTEGER;
  }

  return Number(value);
}
