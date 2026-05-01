"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { isAddress, type Address } from "viem";
import { DealCard } from "@/components/DealCard";
import { Sidebar } from "@/components/Sidebar";
import { useWallet } from "@/hooks/useWallet";
import { formatCurrency } from "@/lib/format";
import {
  getAllPublicDeals,
  getFounderDeals,
  getInvestorInvestments,
  type InvestorInvestment,
} from "@/services/shadowRaiseReads";
import type { Deal } from "@/types";

export function DashboardContent() {
  const { address, isConnected } = useWallet();
  const [marketplaceDeals, setMarketplaceDeals] = useState<Deal[]>([]);
  const [founderDeals, setFounderDeals] = useState<Deal[]>([]);
  const [investments, setInvestments] = useState<InvestorInvestment[]>([]);
  const [isLoadingDeals, setIsLoadingDeals] = useState(true);
  const [isLoadingFounderDeals, setIsLoadingFounderDeals] = useState(false);
  const [isLoadingInvestments, setIsLoadingInvestments] = useState(false);
  const [readError, setReadError] = useState<string | null>(null);
  const [founderReadError, setFounderReadError] = useState<string | null>(null);
  const [investmentReadError, setInvestmentReadError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadMarketplaceDeals() {
      setIsLoadingDeals(true);
      setReadError(null);

      try {
        const onchainDeals = await getAllPublicDeals();

        if (!isMounted) {
          return;
        }

        setMarketplaceDeals(onchainDeals);
      } catch (error) {
        console.error(error);

        if (!isMounted) {
          return;
        }

        setReadError(getMarketplaceReadError(error));
        setMarketplaceDeals([]);
      } finally {
        if (isMounted) {
          setIsLoadingDeals(false);
        }
      }
    }

    void loadMarketplaceDeals();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadFounderDeals(founderAddress: Address) {
      setIsLoadingFounderDeals(true);
      setIsLoadingInvestments(true);
      setFounderReadError(null);
      setInvestmentReadError(null);

      try {
        const [onchainFounderDeals, onchainInvestments] = await Promise.all([
          getFounderDeals(founderAddress),
          getInvestorInvestments(founderAddress),
        ]);

        if (isMounted) {
          setFounderDeals(onchainFounderDeals);
          setInvestments(onchainInvestments);
        }
      } catch (error) {
        console.error(error);

        if (isMounted) {
          setFounderReadError("Unable to load submitted deals for this wallet.");
          setInvestmentReadError("Unable to load investments for this wallet.");
          setFounderDeals([]);
          setInvestments([]);
        }
      } finally {
        if (isMounted) {
          setIsLoadingFounderDeals(false);
          setIsLoadingInvestments(false);
        }
      }
    }

    if (isConnected && address && isAddress(address)) {
      void loadFounderDeals(address);
    } else {
      setFounderDeals([]);
      setInvestments([]);
      setFounderReadError(null);
      setInvestmentReadError(null);
      setIsLoadingFounderDeals(false);
      setIsLoadingInvestments(false);
    }

    return () => {
      isMounted = false;
    };
  }, [address, isConnected]);

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      <Sidebar />
      <section className="mx-auto w-full max-w-7xl px-6 py-8">
        <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">
              Deal flow
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-ink">
              Investor Dashboard
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Review public investment signals and memos. Raw founder metrics
              stay private.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-soft">
            <div className="px-3">
              <p className="text-xl font-semibold text-ink">{marketplaceDeals.length}</p>
              <p className="text-xs text-slate-500">Deals</p>
            </div>
            <div className="border-x border-slate-100 px-3">
              <p className="text-xl font-semibold text-ink">{marketplaceDeals.length}</p>
              <p className="text-xs text-slate-500">Public signals</p>
            </div>
            <div className="px-3">
              <p className="text-xl font-semibold text-ink">{marketplaceDeals.length}</p>
              <p className="text-xs text-slate-500">Signal memos</p>
            </div>
          </div>
        </div>

        {!isConnected ? (
          <div className="rounded-lg border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-800">
            Connect wallet to track submitted deals and investments.
          </div>
        ) : null}

        <section id="marketplace" className="mt-6">
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-ink">Marketplace</h2>
            <p className="mt-1 text-sm text-slate-600">
              Browse investment opportunities without connecting a wallet.
            </p>
          </div>
          {isLoadingDeals ? (
            <div className="rounded-lg border border-slate-200 bg-white p-5 text-sm text-slate-600 shadow-soft">
              Loading onchain marketplace deals...
            </div>
          ) : (
            <>
              {readError ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  {readError}
                </div>
              ) : marketplaceDeals.length === 0 ? (
                <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
                  <p className="text-sm font-semibold text-ink">
                    No investment opportunities available yet.
                  </p>
                  <p className="mt-2 text-sm text-slate-600">
                    Founders can submit a confidential deal to appear here.
                  </p>
                </div>
              ) : (
                <div className="grid gap-5 lg:grid-cols-2">
                  {marketplaceDeals.map((deal) => (
                    <DealCard deal={deal} key={deal.id} />
                  ))}
                </div>
              )}
            </>
          )}
        </section>

        {isConnected ? (
          <>
            <section id="your-deals" className="mt-8">
              <h2 className="text-xl font-semibold text-ink">Your Deals</h2>
              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                {isLoadingFounderDeals ? (
                  <div className="rounded-lg border border-slate-200 bg-white p-5 text-sm text-slate-600 shadow-soft">
                    Loading submitted deals...
                  </div>
                ) : null}
                {founderReadError ? (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">
                    {founderReadError}
                  </div>
                ) : null}
                {!isLoadingFounderDeals && !founderReadError && founderDeals.length === 0 ? (
                  <div className="rounded-lg border border-slate-200 bg-white p-5 text-sm text-slate-600 shadow-soft">
                    No deals submitted from this connected wallet.
                  </div>
                ) : null}
                {founderDeals.map((deal) => (
                  <Link
                    className="block rounded-lg border border-slate-200 bg-white p-5 shadow-soft transition hover:border-teal-200 hover:bg-teal-50/40"
                    href={`/deal/${deal.id}`}
                    key={deal.id}
                  >
                    <p className="text-lg font-semibold text-ink">{deal.companyName}</p>
                    <p className="mt-2 text-sm text-slate-600">
                      Public investment signals available
                    </p>
                    <p className="mt-4 text-sm font-semibold text-ink">
                      {formatCurrency(deal.fundingTarget)}
                    </p>
                    <p className="mt-3 text-sm font-semibold text-teal-700">
                      Founder view available
                    </p>
                    <p className="mt-2 text-xs leading-5 text-slate-500">
                      Investment amounts are encrypted through sRCC. Public totals
                      are not revealed in this MVP.
                    </p>
                    <p className="mt-3 text-sm font-semibold text-ink">
                      View founder details
                    </p>
                  </Link>
                ))}
              </div>
            </section>

            <section id="your-investments" className="mt-8">
              <h2 className="text-xl font-semibold text-ink">Your Investments</h2>
              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                {isLoadingInvestments ? (
                  <div className="rounded-lg border border-slate-200 bg-white p-5 text-sm text-slate-600 shadow-soft">
                    Loading investments...
                  </div>
                ) : null}
                {investmentReadError ? (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">
                    {investmentReadError}
                  </div>
                ) : null}
                {!isLoadingInvestments &&
                !investmentReadError &&
                investments.length === 0 ? (
                  <div className="rounded-lg border border-slate-200 bg-white p-5 text-sm text-slate-600 shadow-soft">
                    No private sRCC investments from this wallet yet.
                  </div>
                ) : null}
                {investments.map((investment) => (
                  <div
                    className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft"
                    key={investment.id}
                  >
                    <p className="text-lg font-semibold text-ink">
                      Investment #{investment.id}
                    </p>
                    <p className="mt-2 text-sm text-slate-600">
                      Deal #{investment.dealId}
                    </p>
                    <p className="mt-2 text-sm text-slate-600">
                      Status: Private investment submitted
                    </p>
                    <p className="mt-4 text-sm font-semibold text-ink">
                      Amount: Encrypted sRCC amount
                    </p>
                  </div>
                ))}
              </div>
            </section>
          </>
        ) : null}
      </section>
    </div>
  );
}

function getMarketplaceReadError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);

  if (message.includes("NEXT_PUBLIC_SHADOWRAISE_CONTRACT_ADDRESS")) {
    return "Contract address is not configured.";
  }

  return "Unable to load onchain marketplace deals.";
}
