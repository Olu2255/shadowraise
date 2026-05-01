"use client";

import { useEffect, useMemo, useState } from "react";
import { AIInsightBox } from "@/components/AIInsightBox";
import { deterministicSignalMemo } from "@/services/aiInsights";
import type { AIInsight, RiskLevel } from "@/types";

type AIMemoProps = {
  companyName: string;
  sector: string;
  fundingTarget: number;
  publicRiskScore: number;
  publicRiskLevel: RiskLevel;
  publicConfidenceScore: number;
  revenueBand: string;
  burnRiskBand: string;
  fallbackMemo?: string;
  compact?: boolean;
};

type MemoResponse = {
  memo: string;
  source: NonNullable<AIInsight["memoSource"]>;
};

const memoCache = new Map<string, MemoResponse>();
const inFlightMemoRequests = new Map<string, Promise<MemoResponse>>();

export function AIMemo({
  burnRiskBand,
  compact = false,
  companyName,
  fallbackMemo,
  fundingTarget,
  publicConfidenceScore,
  publicRiskLevel,
  publicRiskScore,
  revenueBand,
  sector,
}: AIMemoProps) {
  const deterministicMemo = useMemo(
    () =>
      fallbackMemo ??
      deterministicSignalMemo({
        companyName,
        sector,
        fundingTarget,
        publicMetadataURI: "",
        publicRiskScore,
        publicRiskLevel,
        publicConfidenceScore,
        revenueBand,
        burnRiskBand,
      }).summary,
    [
      burnRiskBand,
      companyName,
      fallbackMemo,
      fundingTarget,
      publicConfidenceScore,
      publicRiskLevel,
      publicRiskScore,
      revenueBand,
      sector,
    ],
  );
  const memoKey = useMemo(
    () =>
      JSON.stringify({
        companyName,
        sector,
        fundingTarget,
        publicRiskScore,
        publicRiskLevel,
        publicConfidenceScore,
        revenueBand,
        burnRiskBand,
      }),
    [
      burnRiskBand,
      companyName,
      fundingTarget,
      publicConfidenceScore,
      publicRiskLevel,
      publicRiskScore,
      revenueBand,
      sector,
    ],
  );
  const [memoState, setMemoState] = useState<MemoResponse>(() => ({
    memo: deterministicMemo,
    source: "deterministic",
  }));
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    setMemoState({
      memo: deterministicMemo,
      source: "deterministic",
    });

    const cachedMemo = memoCache.get(memoKey);

    if (cachedMemo) {
      setMemoState(cachedMemo);
      setIsLoading(false);
      return;
    }

    async function loadMemo() {
      setIsLoading(true);

      try {
        const memoResult = await getOrCreateMemoRequest(memoKey, {
          companyName,
          sector,
          fundingTarget,
          publicMetadataURI: "",
          publicRiskScore,
          publicRiskLevel,
          publicConfidenceScore,
          revenueBand,
          burnRiskBand,
        });

        if (isMounted) {
          const nextMemoState = memoResult.memo
            ? memoResult
            : { memo: deterministicMemo, source: "deterministic" as const };

          if (!memoResult.memo) {
            memoCache.set(memoKey, nextMemoState);
          }

          setMemoState(nextMemoState);
        }
      } catch (error) {
        console.warn("Unable to generate AI memo.", error);

        if (isMounted) {
          const fallbackMemoState = {
            memo: deterministicMemo,
            source: "deterministic" as const,
          };

          memoCache.set(memoKey, fallbackMemoState);
          setMemoState(fallbackMemoState);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadMemo();

    return () => {
      isMounted = false;
    };
  }, [
    burnRiskBand,
    companyName,
    deterministicMemo,
    fundingTarget,
    memoKey,
    publicConfidenceScore,
    publicRiskLevel,
    publicRiskScore,
    revenueBand,
    sector,
  ]);

  const title =
    memoState.source === "chaingpt" ? "AI Investment Memo" : "Investment Signal Memo";

  return (
    <AIInsightBox
      compact={compact}
      loading={isLoading}
      memo={memoState.memo}
      source={memoState.source}
      title={title}
    />
  );
}

async function getOrCreateMemoRequest(
  memoKey: string,
  payload: Record<string, unknown>,
) {
  const inFlightMemo = inFlightMemoRequests.get(memoKey);

  if (inFlightMemo) {
    return inFlightMemo;
  }

  const memoPromise = fetchMemo(payload);
  inFlightMemoRequests.set(memoKey, memoPromise);

  try {
    const memoResult = await memoPromise;

    if (memoResult.memo) {
      memoCache.set(memoKey, memoResult);
    }

    return memoResult;
  } finally {
    inFlightMemoRequests.delete(memoKey);
  }
}

async function fetchMemo(payload: Record<string, unknown>): Promise<MemoResponse> {
  const response = await fetch("/api/generate-memo", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error("Memo generation request failed.");
  }

  const result = (await response.json()) as MemoResponse;

  return {
    memo: typeof result.memo === "string" ? result.memo.trim() : "",
    source: result.source === "chaingpt" ? "chaingpt" : "deterministic",
  };
}
