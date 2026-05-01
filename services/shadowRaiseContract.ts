"use client";

import {
  createPublicClient,
  http,
  isAddress,
  type Address,
  type Hex,
  type PublicClient,
} from "viem";
import { arbitrumSepolia } from "viem/chains";
import { shadowRaiseDealRegistryAbi } from "@/lib/abis/shadowRaiseDealRegistry";
import {
  assertArbitrumSepolia,
  createArbitrumSepoliaWalletClient,
  encryptUint256Input,
  getConnectedWalletAddress,
} from "@/services/noxClient";
import type { FinancialInput, OnChainDealPublicSignals } from "@/types";

export type OnChainSubmitStage = "encrypting" | "submitting";

export type CreateDealOnChainOptions = {
  onStatusChange?: (stage: OnChainSubmitStage) => void;
};

export type CreateDealOnChainResult = {
  transactionHash: Hex;
  publicSignals: OnChainDealPublicSignals;
};

export async function createDealOnChain(
  formValues: FinancialInput,
  options: CreateDealOnChainOptions = {},
): Promise<CreateDealOnChainResult> {
  const contractAddress = getRegistryAddress();
  const walletClient = createArbitrumSepoliaWalletClient();
  const publicClient = createPublicClient({
    chain: arbitrumSepolia,
    transport: http(),
  });
  await assertArbitrumSepolia(walletClient);
  const account = await getConnectedWalletAddress(walletClient);
  const publicSignals = buildPublicSignals(formValues);

  options.onStatusChange?.("encrypting");
  const monthlyRevenue = await encryptUint256Input(
    toUint256BigInt(formValues.monthlyRevenue, "monthly revenue"),
    contractAddress,
  );
  const monthlyBurn = await encryptUint256Input(
    toUint256BigInt(formValues.monthlyBurn, "monthly burn"),
    contractAddress,
  );
  const runwayMonths = await encryptUint256Input(
    toUint256BigInt(formValues.runwayMonths, "runway months"),
    contractAddress,
  );
  const grossMargin = await encryptUint256Input(
    toUint256BigInt(formValues.grossMargin, "gross margin"),
    contractAddress,
  );
  const customerCount = await encryptUint256Input(
    toUint256BigInt(formValues.customerCount, "customer count"),
    contractAddress,
  );

  options.onStatusChange?.("submitting");
  const createDealArgs = [
    formValues.companyName,
    formValues.sector,
    toUint256BigInt(formValues.fundingTarget, "funding target"),
    publicSignals.publicMetadataURI,
    BigInt(publicSignals.publicRiskScore),
    publicSignals.publicRiskLevel,
    BigInt(publicSignals.publicConfidenceScore),
    publicSignals.revenueBand,
    publicSignals.burnRiskBand,
    monthlyRevenue.handle,
    monthlyRevenue.handleProof,
    monthlyBurn.handle,
    monthlyBurn.handleProof,
    runwayMonths.handle,
    runwayMonths.handleProof,
    grossMargin.handle,
    grossMargin.handleProof,
    customerCount.handle,
    customerCount.handleProof,
  ] as const;
  const fees = await estimateBufferedFees(publicClient);
  const { request } = await publicClient.simulateContract({
    account,
    address: contractAddress,
    abi: shadowRaiseDealRegistryAbi,
    functionName: "createDeal",
    args: createDealArgs,
    maxFeePerGas: fees.maxFeePerGas,
    maxPriorityFeePerGas: fees.maxPriorityFeePerGas,
  });
  const transactionHash = await walletClient.writeContract(request);
  const receipt = await publicClient.waitForTransactionReceipt({
    hash: transactionHash,
  });

  if (receipt.status === "reverted") {
    throw new Error("Onchain deal submission reverted.");
  }

  return {
    transactionHash,
    publicSignals,
  };
}

export function getReadableOnChainSubmitError(error: unknown) {
  const message = getErrorText(error).toLowerCase();

  if (
    message.includes("arbitrum sepolia") ||
    message.includes("current chain id") ||
    message.includes("chain mismatch") ||
    message.includes("wrong chain")
  ) {
    return "Switch your wallet to Arbitrum Sepolia.";
  }

  if (
    message.includes("user rejected") ||
    message.includes("user denied") ||
    message.includes("rejected the request") ||
    message.includes("request rejected") ||
    message.includes("4001")
  ) {
    return "Transaction cancelled.";
  }

  if (
    message.includes("insufficient funds") ||
    message.includes("insufficient balance") ||
    message.includes("exceeds the balance")
  ) {
    return "Not enough Arbitrum Sepolia ETH for gas.";
  }

  if (
    message.includes("max fee per gas less than block base fee") ||
    (message.includes("maxfeepergas") && message.includes("base fee"))
  ) {
    return "Gas price moved. Try submitting again.";
  }

  return "Submission failed. Check console for details.";
}

function getRegistryAddress(): Address {
  const contractAddress = process.env.NEXT_PUBLIC_SHADOWRAISE_CONTRACT_ADDRESS;

  if (!contractAddress || !isAddress(contractAddress)) {
    throw new Error(
      "Missing NEXT_PUBLIC_SHADOWRAISE_CONTRACT_ADDRESS. Deploy the registry and set the frontend env var.",
    );
  }

  return contractAddress;
}

async function estimateBufferedFees(publicClient: PublicClient) {
  const [fees, block] = await Promise.all([
    publicClient.estimateFeesPerGas(),
    publicClient.getBlock({ blockTag: "latest" }),
  ]);
  const priorityFee = fees.maxPriorityFeePerGas;
  const latestBaseFee = block.baseFeePerGas ?? BigInt(0);
  const minimumMaxFee = latestBaseFee + priorityFee;
  const estimatedMaxFee =
    fees.maxFeePerGas > minimumMaxFee ? fees.maxFeePerGas : minimumMaxFee;

  return {
    maxFeePerGas: withBuffer(estimatedMaxFee),
    maxPriorityFeePerGas: priorityFee,
  };
}

function withBuffer(value: bigint) {
  return (value * BigInt(125)) / BigInt(100);
}

function getErrorText(error: unknown) {
  if (error instanceof Error) {
    return `${error.name} ${error.message} ${error.stack ?? ""}`;
  }

  if (typeof error === "string") {
    return error;
  }

  return JSON.stringify(error);
}

function buildPublicSignals(formValues: FinancialInput): OnChainDealPublicSignals {
  const burnMultiple =
    formValues.monthlyBurn / Math.max(formValues.monthlyRevenue, 1);
  const marginPenalty =
    formValues.grossMargin < 45 ? 18 : formValues.grossMargin < 65 ? 8 : 0;
  const runwayPenalty =
    formValues.runwayMonths < 6 ? 22 : formValues.runwayMonths < 12 ? 10 : 0;
  const burnPenalty = burnMultiple > 1.5 ? 24 : burnMultiple > 1 ? 12 : 4;
  const scaleCredit =
    formValues.customerCount > 100 ? 10 : formValues.customerCount > 25 ? 5 : 0;
  const publicRiskScore = Math.min(
    100,
    Math.max(1, Math.round(30 + marginPenalty + runwayPenalty + burnPenalty - scaleCredit)),
  );

  return {
    publicMetadataURI: `shadowraise:deal:${slugify(formValues.companyName)}`,
    publicRiskScore,
    publicRiskLevel:
      publicRiskScore < 40 ? "low" : publicRiskScore < 70 ? "medium" : "high",
    publicConfidenceScore: calculateConfidenceScore(formValues),
    revenueBand: getRevenueBand(formValues.monthlyRevenue),
    burnRiskBand: getBurnRiskBand(burnMultiple),
  };
}

function calculateConfidenceScore(formValues: FinancialInput) {
  let score = 55;

  if (formValues.runwayMonths >= 6) score += 15;
  if (formValues.monthlyBurn <= formValues.monthlyRevenue) score += 15;
  if (formValues.customerCount >= 50) score += 15;

  return Math.min(100, score);
}

function getRevenueBand(monthlyRevenue: number) {
  if (monthlyRevenue >= 100000) return "$100K+ MRR";
  if (monthlyRevenue >= 25000) return "$25K-$100K MRR";
  return "Sub-$25K MRR";
}

function getBurnRiskBand(burnMultiple: number) {
  if (burnMultiple <= 1) return "Disciplined";
  if (burnMultiple <= 1.5) return "Elevated";
  return "High";
}

function toUint256BigInt(value: number, fieldName: string) {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error(`${fieldName} must be a safe, non-negative whole number.`);
  }

  return BigInt(value);
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
