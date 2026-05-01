"use client";

import { PrivyProvider, usePrivy, useWallets } from "@privy-io/react-auth";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type WalletContextValue = {
  isConnected: boolean;
  isReady: boolean;
  address: string | null;
  connect: () => void;
  disconnect: () => void;
};

const WalletContext = createContext<WalletContextValue | null>(null);

const demoWalletAddress = "0x1234567890abcdef1234567890abcdef1234abcd";

export function WalletProvider({ children }: { children: ReactNode }) {
  const privyAppId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;

  if (!privyAppId) {
    return <DemoWalletProvider>{children}</DemoWalletProvider>;
  }

  return (
    <PrivyProvider
      appId={privyAppId}
      config={{
        loginMethods: ["wallet"],
        appearance: {
          walletChainType: "ethereum-only",
        },
      }}
    >
      <PrivyWalletBridge>{children}</PrivyWalletBridge>
    </PrivyProvider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);

  if (!context) {
    throw new Error("useWallet must be used within WalletProvider");
  }

  return context;
}

function PrivyWalletBridge({ children }: { children: ReactNode }) {
  const { authenticated, login, logout, ready } = usePrivy();
  const { ready: walletsReady, wallets } = useWallets();

  const address = wallets[0]?.address ?? null;
  const isConnected = ready && walletsReady && authenticated && Boolean(address);

  const connect = useCallback(() => {
    login({ loginMethods: ["wallet"] });
  }, [login]);

  const disconnect = useCallback(() => {
    void logout();
  }, [logout]);

  const value = useMemo(
    () => ({
      isConnected,
      isReady: ready && walletsReady,
      address,
      connect,
      disconnect,
    }),
    [address, connect, disconnect, isConnected, ready, walletsReady],
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

function DemoWalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);

  const value = useMemo(
    () => ({
      isConnected: Boolean(address),
      isReady: true,
      address,
      connect: () => setAddress(demoWalletAddress),
      disconnect: () => setAddress(null),
    }),
    [address],
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}
