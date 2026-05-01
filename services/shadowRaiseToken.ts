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
import { shadowRaiseConfidentialTokenAbi } from "@/lib/abis/shadowRaiseConfidentialToken";
import {
  assertArbitrumSepolia,
  createArbitrumSepoliaWalletClient,
  getConnectedWalletAddress,
} from "@/services/noxClient";

const OPERATOR_APPROVAL_SECONDS = 10 * 60;

export async function claimDemoCredits(): Promise<Hex> {
  const tokenAddress = getTokenAddress();
  const walletClient = createArbitrumSepoliaWalletClient();
  const publicClient = createArbitrumSepoliaPublicClient();
  await assertArbitrumSepolia(walletClient);
  const account = await getConnectedWalletAddress(walletClient);
  const fees = await estimateBufferedFees(publicClient);
  const { request } = await publicClient.simulateContract({
    account,
    address: tokenAddress,
    abi: shadowRaiseConfidentialTokenAbi,
    functionName: "claimDemoCredits",
    maxFeePerGas: fees.maxFeePerGas,
    maxPriorityFeePerGas: fees.maxPriorityFeePerGas,
  });
  const transactionHash = await walletClient.writeContract(request);
  await waitForSuccessfulReceipt(publicClient, transactionHash);

  return transactionHash;
}

export async function setRegistryAsOperator(): Promise<Hex> {
  const tokenAddress = getTokenAddress();
  const registryAddress = getRegistryAddress();
  const walletClient = createArbitrumSepoliaWalletClient();
  const publicClient = createArbitrumSepoliaPublicClient();
  await assertArbitrumSepolia(walletClient);
  const account = await getConnectedWalletAddress(walletClient);
  const until = Math.floor(Date.now() / 1000) + OPERATOR_APPROVAL_SECONDS;
  const fees = await estimateBufferedFees(publicClient);
  const { request } = await publicClient.simulateContract({
    account,
    address: tokenAddress,
    abi: shadowRaiseConfidentialTokenAbi,
    functionName: "setOperator",
    args: [registryAddress, until],
    maxFeePerGas: fees.maxFeePerGas,
    maxPriorityFeePerGas: fees.maxPriorityFeePerGas,
  });
  const transactionHash = await walletClient.writeContract(request);
  await waitForSuccessfulReceipt(publicClient, transactionHash);

  return transactionHash;
}

export async function hasClaimedDemoCredits(address: Address) {
  return createArbitrumSepoliaPublicClient().readContract({
    address: getTokenAddress(),
    abi: shadowRaiseConfidentialTokenAbi,
    functionName: "hasClaimedDemoCredits",
    args: [address],
  });
}

export async function isRegistryOperator(address: Address) {
  return createArbitrumSepoliaPublicClient().readContract({
    address: getTokenAddress(),
    abi: shadowRaiseConfidentialTokenAbi,
    functionName: "isOperator",
    args: [address, getRegistryAddress()],
  });
}

function getTokenAddress(): Address {
  const tokenAddress = process.env.NEXT_PUBLIC_SHADOWRAISE_TOKEN_ADDRESS;

  if (!tokenAddress || !isAddress(tokenAddress)) {
    throw new Error("Missing NEXT_PUBLIC_SHADOWRAISE_TOKEN_ADDRESS.");
  }

  return tokenAddress;
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
