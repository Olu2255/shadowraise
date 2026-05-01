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

export type ConfidentialInvestmentResult = {
  transactionHash: Hex;
};

export async function investConfidentially(
  dealId: bigint,
  amount: bigint,
): Promise<ConfidentialInvestmentResult> {
  const registryAddress = getRegistryAddress();
  const walletClient = createArbitrumSepoliaWalletClient();
  const publicClient = createArbitrumSepoliaPublicClient();
  await assertArbitrumSepolia(walletClient);
  const account = await getConnectedWalletAddress(walletClient);
  const encryptedAmount = await encryptUint256Input(amount, registryAddress);
  const fees = await estimateBufferedFees(publicClient);
  const { request } = await publicClient.simulateContract({
    account,
    address: registryAddress,
    abi: shadowRaiseDealRegistryAbi,
    functionName: "investConfidentially",
    args: [dealId, encryptedAmount.handle, encryptedAmount.handleProof],
    maxFeePerGas: fees.maxFeePerGas,
    maxPriorityFeePerGas: fees.maxPriorityFeePerGas,
  });
  const transactionHash = await walletClient.writeContract(request);
  await waitForSuccessfulReceipt(publicClient, transactionHash);

  return { transactionHash };
}

function getRegistryAddress(): Address {
  const registryAddress = process.env.NEXT_PUBLIC_SHADOWRAISE_CONTRACT_ADDRESS;

  if (!registryAddress || !isAddress(registryAddress)) {
    throw new Error("Missing NEXT_PUBLIC_SHADOWRAISE_CONTRACT_ADDRESS.");
  }

  return registryAddress;
}

function createArbitrumSepoliaPublicClient() {
  return createPublicClient({
    chain: arbitrumSepolia,
    transport: http(),
  });
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
    maxFeePerGas: (estimatedMaxFee * BigInt(125)) / BigInt(100),
    maxPriorityFeePerGas: priorityFee,
  };
}

async function waitForSuccessfulReceipt(publicClient: PublicClient, hash: Hex) {
  const receipt = await publicClient.waitForTransactionReceipt({ hash });

  if (receipt.status === "reverted") {
    throw new Error("Transaction reverted.");
  }
}
