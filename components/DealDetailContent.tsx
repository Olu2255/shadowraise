"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { isAddress, type Hex } from "viem";
import { AIMemo } from "@/components/AIMemo";
import { StatusMessage } from "@/components/StatusMessage";
import { TokenGateNotice } from "@/components/TokenGateNotice";
import { useWallet } from "@/hooks/useWallet";
import { formatCurrency, formatDate } from "@/lib/format";
import {
  getReadableOnChainSubmitError,
} from "@/services/shadowRaiseContract";
import { investConfidentially } from "@/services/shadowRaiseInvestments";
import { getPublicDeal } from "@/services/shadowRaiseReads";
import {
  claimDemoCredits,
  hasClaimedDemoCredits,
  isRegistryOperator,
  setRegistryAsOperator,
} from "@/services/shadowRaiseToken";
import type { Deal } from "@/types";

type DealDetailContentProps = {
  dealId: string;
  fallbackDeal: Deal | null;
};

type ActionStatus = "idle" | "pending" | "success" | "error";

export function DealDetailContent({
  dealId,
  fallbackDeal,
}: DealDetailContentProps) {
  const { address, connect, isConnected } = useWallet();
  const [deal, setDeal] = useState<Deal | null>(fallbackDeal);
  const [isLoadingDeal, setIsLoadingDeal] = useState(true);
  const [dealError, setDealError] = useState<string | null>(null);
  const [amount, setAmount] = useState("100");
  const [claimStatus, setClaimStatus] = useState<ActionStatus>("idle");
  const [approvalStatus, setApprovalStatus] = useState<ActionStatus>("idle");
  const [investmentStatus, setInvestmentStatus] = useState<ActionStatus>("idle");
  const [investmentHash, setInvestmentHash] = useState<Hex | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const numericDealId = parseDealId(dealId);

  useEffect(() => {
    let isMounted = true;

    async function loadDeal() {
      if (numericDealId === null) {
        setIsLoadingDeal(false);
        return;
      }

      setIsLoadingDeal(true);
      setDealError(null);

      try {
        const onchainDeal = await getPublicDeal(numericDealId);

        if (isMounted) {
          setDeal(onchainDeal);
        }
      } catch (error) {
        console.error(error);

        if (isMounted) {
          setDealError("Unable to load this onchain deal.");
          setDeal(fallbackDeal);
        }
      } finally {
        if (isMounted) {
          setIsLoadingDeal(false);
        }
      }
    }

    void loadDeal();

    return () => {
      isMounted = false;
    };
  }, [fallbackDeal, numericDealId]);

  useEffect(() => {
    let isMounted = true;

    async function loadWalletInvestmentState(walletAddress: `0x${string}`) {
      try {
        const [claimed, operator] = await Promise.all([
          hasClaimedDemoCredits(walletAddress),
          isRegistryOperator(walletAddress),
        ]);

        if (isMounted) {
          setClaimStatus(claimed ? "success" : "idle");
          setApprovalStatus(operator ? "success" : "idle");
        }
      } catch (error) {
        console.error(error);
      }
    }

    if (isConnected && address && isAddress(address)) {
      void loadWalletInvestmentState(address);
    } else {
      setClaimStatus("idle");
      setApprovalStatus("idle");
    }

    return () => {
      isMounted = false;
    };
  }, [address, isConnected]);

  async function handleClaimDemoCredits() {
    if (!isConnected) {
      setActionError(null);
      setInvestmentHash(null);
      connect();
      return;
    }

    setClaimStatus("pending");
    setActionError(null);
    setInvestmentHash(null);

    try {
      await claimDemoCredits();
      setClaimStatus("success");
    } catch (error) {
      console.error(error);
      setClaimStatus("error");
      setActionError(getInvestmentError(error));
    }
  }

  async function handleAuthorizePrivateInvestment() {
    if (!isConnected) {
      setActionError(null);
      setInvestmentHash(null);
      connect();
      return;
    }

    setApprovalStatus("pending");
    setActionError(null);
    setInvestmentHash(null);

    try {
      await setRegistryAsOperator();
      setApprovalStatus("success");
    } catch (error) {
      console.error(error);
      setApprovalStatus("error");
      setActionError(getInvestmentError(error));
    }
  }

  async function handleInvest() {
    if (!isConnected) {
      setActionError(null);
      setInvestmentHash(null);
      connect();
      return;
    }

    if (claimStatus !== "success") {
      setActionError("Claim demo sRCC before investing privately.");
      setInvestmentHash(null);
      return;
    }

    if (approvalStatus !== "success") {
      setActionError("Authorize private investment before investing.");
      setInvestmentHash(null);
      return;
    }

    if (numericDealId === null) {
      setActionError("This fallback deal is not available for onchain investment.");
      return;
    }

    setInvestmentStatus("pending");
    setActionError(null);
    setInvestmentHash(null);

    try {
      const result = await investConfidentially(
        numericDealId,
        parseInvestmentAmount(amount),
      );
      setInvestmentHash(result.transactionHash);
      setInvestmentStatus("success");
    } catch (error) {
      console.error(error);
      setInvestmentStatus("error");
      setActionError(getInvestmentError(error));
    }
  }

  if (isLoadingDeal && !deal) {
    return (
      <section className="mx-auto max-w-7xl px-6 py-8">
        <p className="text-sm text-slate-600">Loading deal...</p>
      </section>
    );
  }

  if (!deal) {
    return (
      <section className="mx-auto max-w-7xl px-6 py-8">
        <Link className="text-sm font-semibold text-teal-700 hover:text-teal-900" href="/dashboard">
          Back to dashboard
        </Link>
        <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">
          {dealError ?? "Deal not found."}
        </div>
      </section>
    );
  }

  const isFounderView =
    isConnected && addressesMatch(address, deal.founder);
  const memoSignals = getMemoSignals(deal);

  return (
    <section className="mx-auto max-w-7xl px-6 py-8">
      <Link className="text-sm font-semibold text-teal-700 hover:text-teal-900" href="/dashboard">
        Back to dashboard
      </Link>

      {dealError ? (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {dealError}
        </div>
      ) : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-soft">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">
                  {deal.sector}
                </p>
                <h1 className="mt-2 text-4xl font-semibold text-ink">
                  {deal.companyName}
                </h1>
                <p className="mt-3 text-sm text-slate-500">
                  Submitted {formatDate(deal.submittedAt)}
                </p>
              </div>
            </div>
          </div>

          <AIMemo
            burnRiskBand={memoSignals.burnRiskBand}
            companyName={deal.companyName}
            fallbackMemo={deal.aiInsight.summary}
            fundingTarget={deal.fundingTarget}
            publicConfidenceScore={memoSignals.publicConfidenceScore}
            publicRiskLevel={memoSignals.publicRiskLevel}
            publicRiskScore={memoSignals.publicRiskScore}
            revenueBand={memoSignals.revenueBand}
            sector={deal.sector}
          />

          {isFounderView ? <FounderView deal={deal} /> : null}
        </div>

        <aside className="space-y-4">
          <TokenGateNotice />
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Confidential metrics
            </p>
            <div className="mt-4 space-y-4">
              <Metric label="Funding target" value={formatCurrency(deal.fundingTarget)} />
              <Metric
                label="Burn risk"
                value={deal.riskAnalysis.metrics.marginHealth}
              />
              <Metric
                label="Revenue signal"
                value={deal.riskAnalysis.metrics.revenueGrowthSignal}
              />
              <Metric label="Signal score" value={`${deal.riskAnalysis.score}/100`} />
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Private investment powered by sRCC
            </p>

            {actionError ? (
              <div className="mt-4">
                <StatusMessage
                  body={actionError}
                  onClose={() => setActionError(null)}
                  onRetry={() => setActionError(null)}
                  title="Something went wrong"
                  variant="error"
                />
              </div>
            ) : null}
            {investmentStatus === "success" && investmentHash ? (
              <div className="mt-4">
                <StatusMessage
                  body={`Private investment submitted: ${shortenHash(investmentHash)}`}
                  onClose={() => setInvestmentHash(null)}
                  title="Private investment submitted"
                  variant="success"
                />
              </div>
            ) : null}

            <p className="mt-3 text-sm leading-6 text-slate-600">
              sRCC is a demo confidential investment credit used for this testnet flow.
            </p>

            {!isConnected ? (
              <button
                className="mt-5 w-full rounded-md bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
                onClick={() => {
                  setActionError(null);
                  setInvestmentHash(null);
                  connect();
                }}
                type="button"
              >
                Connect wallet to invest privately
              </button>
            ) : (
              <>
                {claimStatus === "success" ? (
                  <div className="mt-4 rounded-md border border-teal-200 bg-teal-50 px-3 py-2 text-sm text-teal-800">
                    <p className="font-semibold">Demo allocation claimed: 1,000 sRCC</p>
                    <p className="mt-1">sRCC balance is encrypted by design.</p>
                  </div>
                ) : null}

                {claimStatus !== "success" ? (
                  <div className="mt-5 space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">
                      Step 1: Claim demo sRCC
                    </p>
                    <p className="text-sm leading-6 text-slate-600">
                      You receive 1,000 demo sRCC for this testnet flow.
                    </p>
                    <button
                      className="w-full rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={claimStatus === "pending"}
                      onClick={handleClaimDemoCredits}
                      type="button"
                    >
                      {claimStatus === "pending" ? "Claiming..." : "Claim demo sRCC"}
                    </button>
                  </div>
                ) : approvalStatus !== "success" ? (
                  <div className="mt-5 space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">
                      Step 2: Authorize private investment
                    </p>
                    <p className="text-sm leading-6 text-slate-600">
                      Authorization lets ShadowRaise move your demo sRCC only for this
                      private investment flow.
                    </p>
                    <button
                      className="w-full rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={approvalStatus === "pending"}
                      onClick={handleAuthorizePrivateInvestment}
                      type="button"
                    >
                      {approvalStatus === "pending"
                        ? "Authorizing..."
                        : "Authorize private investment"}
                    </button>
                  </div>
                ) : (
                  <div className="mt-5 space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">
                      Step 3: Invest privately
                    </p>
                    <p className="text-sm leading-6 text-slate-600">
                      Investment amounts are encrypted through sRCC. Public totals are
                      not revealed in this MVP.
                    </p>
                    <p className="text-sm font-semibold text-teal-700">
                      Investment authorization active
                    </p>
                    <label className="block space-y-2">
                      <span className="text-sm font-medium text-slate-700">sRCC amount</span>
                      <input
                        className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                        min={1}
                        onChange={(event) => setAmount(event.target.value)}
                        type="number"
                        value={amount}
                      />
                    </label>
                    <button
                      className="w-full rounded-md bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
                      disabled={investmentStatus === "pending"}
                      onClick={handleInvest}
                      type="button"
                    >
                      {investmentStatus === "pending" ? "Investing privately..." : "Invest"}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </aside>
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 pb-3 last:border-0 last:pb-0">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="text-sm font-semibold text-ink">{value}</span>
    </div>
  );
}

function FounderView({ deal }: { deal: Deal }) {
  return (
    <section className="rounded-lg border border-teal-200 bg-teal-50 p-5 shadow-soft">
      <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">
        Founder View
      </p>
      <h2 className="mt-2 text-lg font-semibold text-ink">
        You submitted this deal
      </h2>
      <div className="mt-4 space-y-4">
        <Metric label="Funding target" value={formatCurrency(deal.fundingTarget)} />
        <Metric
          label="Private investments received count"
          value="Not publicly aggregated"
        />
      </div>
      <div className="mt-4 rounded-md border border-teal-200 bg-white/70 px-3 py-2 text-sm leading-6 text-slate-700">
        <p className="font-semibold text-ink">Investment records</p>
        Private investment records are tracked per investor wallet. Deal-level
        aggregation is a planned improvement.
      </div>
      <p className="mt-3 text-xs leading-5 text-slate-500">
        Investment amounts are encrypted through sRCC. Public totals are not
        revealed in this MVP.
      </p>
    </section>
  );
}

function parseDealId(value: string) {
  if (!/^\d+$/.test(value)) {
    return null;
  }

  return BigInt(value);
}

function parseInvestmentAmount(value: string) {
  const parsed = Number(value);

  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new Error("Enter a whole sRCC amount greater than 0.");
  }

  return BigInt(parsed);
}

function getInvestmentError(error: unknown) {
  const text = error instanceof Error ? error.message.toLowerCase() : String(error);

  if (text.includes("already claimed")) {
    return "Demo sRCC already claimed for this wallet.";
  }

  if (text.includes("registry not operator")) {
    return "Authorize private investment before investing.";
  }

  return getReadableOnChainSubmitError(error);
}

function shortenHash(hash: Hex) {
  return `${hash.slice(0, 10)}...${hash.slice(-6)}`;
}

function addressesMatch(
  left: string | null | undefined,
  right: string | null | undefined,
) {
  return Boolean(left && right && left.toLowerCase() === right.toLowerCase());
}

function getMemoSignals(deal: Deal) {
  return {
    publicRiskScore: deal.publicSignals?.publicRiskScore ?? deal.riskAnalysis.score,
    publicRiskLevel: deal.publicSignals?.publicRiskLevel ?? deal.riskAnalysis.level,
    publicConfidenceScore:
      deal.publicSignals?.publicConfidenceScore ??
      Math.max(1, Math.min(100, 100 - Math.round(deal.riskAnalysis.score / 2))),
    revenueBand:
      deal.publicSignals?.revenueBand ?? deal.riskAnalysis.metrics.revenueGrowthSignal,
    burnRiskBand: deal.publicSignals?.burnRiskBand ?? deal.riskAnalysis.metrics.marginHealth,
  };
}
