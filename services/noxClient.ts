"use client";

import {
  createViemHandleClient,
  type Handle,
  type HexString,
} from "@iexec-nox/handle";
import { createWalletClient, custom, type Address, type WalletClient } from "viem";
import { arbitrumSepolia } from "viem/chains";

type BrowserEthereumProvider = Parameters<typeof custom>[0];

declare global {
  interface Window {
    ethereum?: BrowserEthereumProvider;
  }
}

export type EncryptedUint256Input = {
  handle: Handle<"uint256">;
  handleProof: HexString;
};

export function createArbitrumSepoliaWalletClient() {
  const ethereum = getEthereumProvider();

  return createWalletClient({
    chain: arbitrumSepolia,
    transport: custom(ethereum),
  });
}

export async function getConnectedWalletAddress(
  walletClient: WalletClient,
): Promise<Address> {
  const [account] = await walletClient.getAddresses();

  if (!account) {
    throw new Error("Connect wallet to submit a confidential deal.");
  }

  return account;
}

export async function assertArbitrumSepolia(walletClient: WalletClient) {
  const chainId = await walletClient.getChainId();

  if (chainId !== arbitrumSepolia.id) {
    throw new Error(
      `Switch your wallet to Arbitrum Sepolia before submitting. Current chain ID: ${chainId}.`,
    );
  }
}

export async function encryptUint256Input(
  value: bigint,
  contractAddress: Address,
): Promise<EncryptedUint256Input> {
  const walletClient = createArbitrumSepoliaWalletClient();
  await assertArbitrumSepolia(walletClient);
  await getConnectedWalletAddress(walletClient);

  const handleClient = await createViemHandleClient(walletClient);
  return handleClient.encryptInput(value, "uint256", contractAddress);
}

function getEthereumProvider(): BrowserEthereumProvider {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error(
      "Browser wallet provider not found. Connect a wallet with Arbitrum Sepolia support.",
    );
  }

  return window.ethereum;
}
