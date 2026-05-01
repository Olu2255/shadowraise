"use client";

import { FormEvent, useState } from "react";
import type { Deal, FinancialInput } from "@/types";
import { AIInsightBox } from "@/components/AIInsightBox";
import { StatusMessage } from "@/components/StatusMessage";
import { useWallet } from "@/hooks/useWallet";
import { formatCurrency } from "@/lib/format";
import {
  createDealOnChain,
  getReadableOnChainSubmitError,
} from "@/services/shadowRaiseContract";

type SubmitStatus = "idle" | "encrypting" | "submitting" | "success" | "error";

const initialForm: FinancialInput = {
  companyName: "",
  sector: "",
  monthlyRevenue: 50000,
  monthlyBurn: 45000,
  runwayMonths: 12,
  grossMargin: 70,
  customerCount: 50,
  fundingTarget: 1000000,
};

const numericFields: Array<keyof FinancialInput> = [
  "monthlyRevenue",
  "monthlyBurn",
  "runwayMonths",
  "grossMargin",
  "customerCount",
  "fundingTarget",
];

export function SubmitForm() {
  const { connect, isConnected } = useWallet();
  const [form, setForm] = useState<FinancialInput>(initialForm);
  const [deal, setDeal] = useState<Deal | null>(null);
  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [transactionHash, setTransactionHash] = useState<`0x${string}` | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isConnected) {
      setSubmitStatus("idle");
      setError(null);
      connect();
      return;
    }

    setSubmitStatus("encrypting");
    setError(null);
    setTransactionHash(null);

    try {
      const onChainResult = await createDealOnChain(form, {
        onStatusChange: setSubmitStatus,
      });
      setTransactionHash(onChainResult.transactionHash);
      setSubmitStatus("success");

      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (response.ok) {
        const result = (await response.json()) as { deal: Deal };
        setDeal(result.deal);
      }
    } catch (submissionError) {
      console.error(submissionError);
      setSubmitStatus("error");
      setError(getReadableError(submissionError));
    }
  }

  function updateField<Key extends keyof FinancialInput>(
    key: Key,
    value: FinancialInput[Key],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  const isBusy = submitStatus === "encrypting" || submitStatus === "submitting";

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
      <form
        onSubmit={handleSubmit}
        className="rounded-lg border border-slate-200 bg-white p-6 shadow-soft"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">Company name</span>
            <input
              className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
              onChange={(event) => updateField("companyName", event.target.value)}
              placeholder="Atlas Pay"
              required
              value={form.companyName}
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">Sector</span>
            <input
              className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
              onChange={(event) => updateField("sector", event.target.value)}
              placeholder="B2B Payments"
              required
              value={form.sector}
            />
          </label>

          {numericFields.map((field) => (
            <label className="space-y-2" key={field}>
              <span className="text-sm font-medium capitalize text-slate-700">
                {field.replace(/([A-Z])/g, " $1")}
              </span>
              <input
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                min={0}
                onChange={(event) => updateField(field, Number(event.target.value))}
                required
                type="number"
                value={form[field]}
              />
            </label>
          ))}
        </div>

        {!isConnected ? (
          <p className="mt-4 text-sm text-amber-700">
            Connect wallet to submit a confidential deal.
          </p>
        ) : null}

        {error ? (
          <div className="mt-4">
            <StatusMessage
              body={error}
              onClose={() => setError(null)}
              onRetry={() => setError(null)}
              title="Something went wrong"
              variant="error"
            />
          </div>
        ) : null}

        {transactionHash && submitStatus === "success" ? (
          <div className="mt-4">
            <StatusMessage
              body={`Deal submitted onchain: ${shortenHash(transactionHash)}`}
              onClose={() => setTransactionHash(null)}
              title="Deal submitted"
              variant="success"
            />
          </div>
        ) : null}

        <button
          className="mt-6 rounded-md bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
          disabled={isBusy}
          type="submit"
        >
          {getSubmitButtonLabel(submitStatus)}
        </button>
      </form>

      <aside className="space-y-4">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Encrypted with Nox
          </p>
          <h2 className="mt-2 text-lg font-semibold text-ink">
            Raw founder metrics stay private
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Private financial inputs are encrypted before submission. Only public
            investment signals are shown to investors.
          </p>
        </div>

        {deal ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Analysis result
                  </p>
                  <h2 className="mt-2 text-lg font-semibold text-ink">
                    {deal.companyName}
                  </h2>
                </div>
              </div>
              <p className="mt-4 text-sm text-slate-600">
                Funding target: {formatCurrency(deal.fundingTarget)}
              </p>
            </div>
            <AIInsightBox
              memo={deal.aiInsight.summary}
              source="deterministic"
              title="Investment Signal Memo"
            />
          </div>
        ) : null}
      </aside>
    </div>
  );
}

function getSubmitButtonLabel(status: SubmitStatus) {
  if (status === "encrypting") return "Encrypting financial metrics...";
  if (status === "submitting") return "Submitting deal onchain...";
  if (status === "success") return "Deal submitted";
  return "Run Confidential Analysis";
}

function getReadableError(error: unknown) {
  return getReadableOnChainSubmitError(error);
}

function shortenHash(hash: `0x${string}`) {
  return `${hash.slice(0, 10)}...${hash.slice(-6)}`;
}
