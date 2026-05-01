"use client";

import { useEffect, useRef, useState } from "react";
import { useWallet } from "@/hooks/useWallet";

export function WalletButton() {
  const { address, connect, disconnect, isConnected, isReady } = useWallet();
  const [isOpen, setIsOpen] = useState(false);
  const [didCopy, setDidCopy] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const shortenedAddress = address ? shortenAddress(address) : null;

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handleClickOutside(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isConnected) {
      setIsOpen(false);
    }
  }, [isConnected]);

  async function handleCopyAddress() {
    if (!address) {
      return;
    }

    await navigator.clipboard.writeText(address);
    setDidCopy(true);
    window.setTimeout(() => setDidCopy(false), 1400);
  }

  function handleButtonClick() {
    if (!isConnected) {
      connect();
      return;
    }

    setIsOpen((current) => !current);
  }

  function handleDisconnect() {
    setIsOpen(false);
    disconnect();
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        aria-expanded={isConnected ? isOpen : undefined}
        className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-ink disabled:cursor-not-allowed disabled:opacity-60"
        disabled={!isReady}
        onClick={handleButtonClick}
        title={isConnected ? "Wallet menu" : "Connect wallet"}
        type="button"
      >
        {isConnected && shortenedAddress ? shortenedAddress : "Connect Wallet"}
        {isConnected ? (
          <svg
            aria-hidden="true"
            className={`h-3.5 w-3.5 transition ${isOpen ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              d="M6 9l6 6 6-6"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
            />
          </svg>
        ) : null}
      </button>

      {isConnected && address && shortenedAddress && isOpen ? (
        <div className="absolute right-0 top-12 z-50 w-64 rounded-lg border border-slate-200 bg-white p-2 shadow-soft">
          <div className="border-b border-slate-100 px-3 py-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Connected wallet
            </p>
            <p className="mt-1 text-sm font-semibold text-ink">{shortenedAddress}</p>
          </div>

          <div className="space-y-1 py-2">
            <button
              className="w-full rounded-md px-3 py-2 text-left text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-ink"
              onClick={handleCopyAddress}
              type="button"
            >
              {didCopy ? "Copied" : "Copy address"}
            </button>
            <div className="flex items-center justify-between rounded-md px-3 py-2 text-sm text-slate-600">
              <span>Network</span>
              <span className="font-medium text-ink">Arbitrum Sepolia</span>
            </div>
            <button
              className="w-full cursor-not-allowed rounded-md px-3 py-2 text-left text-sm font-medium text-slate-400"
              disabled
              type="button"
            >
              Switch wallet coming soon
            </button>
          </div>

          <div className="border-t border-slate-100 pt-2">
            <button
              className="w-full rounded-md px-3 py-2 text-left text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
              onClick={handleDisconnect}
              type="button"
            >
              Disconnect
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function shortenAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
