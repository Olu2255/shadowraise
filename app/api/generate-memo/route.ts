import { NextResponse } from "next/server";
import {
  deterministicSignalMemo,
  type PublicMemoSignals,
} from "@/services/aiInsights";
import type { RiskLevel } from "@/types";

const chainGptEndpoint = "https://api.chaingpt.org/chat/stream";
const memoCache = new Map<string, MemoApiResponse>();
const inFlightMemoRequests = new Map<string, Promise<MemoApiResponse>>();
const forbiddenPrivateFields = [
  "monthlyRevenue",
  "monthlyBurn",
  "runwayMonths",
  "grossMargin",
  "customerCount",
];

type ChainGptResponse = {
  status?: boolean;
  message?: string;
  data?: {
    bot?: string;
  };
};

export type MemoApiResponse = {
  memo: string;
  source: "chaingpt" | "deterministic";
};

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as Record<string, unknown>;

    if (forbiddenPrivateFields.some((field) => field in payload)) {
      return NextResponse.json(
        { error: "Memo generation accepts only public investment signals." },
        { status: 400 },
      );
    }

    const signals = parsePublicMemoSignals(payload);
    const memoKey = createMemoRequestKey(signals);
    const cachedMemo = memoCache.get(memoKey);

    if (cachedMemo) {
      return NextResponse.json(cachedMemo);
    }

    const inFlightMemo = inFlightMemoRequests.get(memoKey);

    if (inFlightMemo) {
      return NextResponse.json(await inFlightMemo);
    }

    const memoPromise = generateMemo(signals).then((memo) => {
      memoCache.set(memoKey, memo);
      return memo;
    });
    inFlightMemoRequests.set(memoKey, memoPromise);

    try {
      return NextResponse.json(await memoPromise);
    } finally {
      inFlightMemoRequests.delete(memoKey);
    }
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Unable to generate investment memo." },
      { status: 400 },
    );
  }
}

async function generateMemo(signals: PublicMemoSignals): Promise<MemoApiResponse> {
  const fallbackMemo = toMemoApiResponse(deterministicSignalMemo(signals));
  const apiKey = process.env.CHAINGPT_API_KEY;

  if (!apiKey) {
    console.log("Using deterministic memo fallback: missing ChainGPT API key");
    return fallbackMemo;
  }

  try {
    console.log("Calling ChainGPT memo API");
    const rawContent = await requestChainGptRawContent(apiKey, signals);
    const memo = cleanChainGptMemoText(rawContent);

    if (memo) {
      console.log("ChainGPT memo generated");
      return {
        memo,
        source: "chaingpt",
      };
    }

    console.log("Using deterministic memo fallback: empty ChainGPT response");
    return fallbackMemo;
  } catch (error) {
    console.warn("Using deterministic memo fallback: ChainGPT request failed", error);
    return fallbackMemo;
  }
}

async function requestChainGptRawContent(
  apiKey: string,
  signals: PublicMemoSignals,
) {
  const response = await fetch(chainGptEndpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "general_assistant",
      chatHistory: "off",
      question: buildChainGptPrompt(signals),
    }),
  });

  if (!response.ok) {
    throw new Error(`ChainGPT memo request failed with ${response.status}.`);
  }

  const rawResponse = await response.text();
  const result = parseChainGptEnvelope(rawResponse);

  if (!result) {
    return rawResponse;
  }

  if (!result.status) {
    throw new Error(result.message || "ChainGPT memo request was not successful.");
  }

  return result.data?.bot ?? "";
}

function parseChainGptEnvelope(rawResponse: string): ChainGptResponse | null {
  const trimmed = rawResponse.trim();

  if (!trimmed.startsWith("{")) {
    return null;
  }

  try {
    return JSON.parse(trimmed) as ChainGptResponse;
  } catch (error) {
    console.warn("ChainGPT response was not JSON; treating body as memo text.", error);
    return null;
  }
}

function buildChainGptPrompt(signals: PublicMemoSignals) {
  return [
    "Return only the memo body as plain text.",
    "Do not return JSON.",
    "Do not use Markdown.",
    "Do not include a title.",
    "Do not include headings.",
    "Do not use code fences.",
    "Do not use backticks.",
    "Do not use bullet points unless absolutely necessary.",
    "Write one concise investor-facing memo paragraph.",
    "",
    "Use only these public investment signals:",
    "- company name",
    "- sector",
    "- funding target",
    "- risk score",
    "- risk level",
    "- confidence score",
    "- revenue band",
    "- burn risk band",
    "",
    "Do not invent hidden financials.",
    "Do not imply access to raw private metrics.",
    "Do not provide financial advice.",
    "Keep the memo balanced, cautious, and practical.",
    "",
    "Public investment signal values:",
    JSON.stringify(
      {
        companyName: signals.companyName,
        sector: signals.sector,
        fundingTarget: signals.fundingTarget,
        publicRiskScore: signals.publicRiskScore,
        publicRiskLevel: signals.publicRiskLevel,
        publicConfidenceScore: signals.publicConfidenceScore,
        revenueBand: signals.revenueBand,
        burnRiskBand: signals.burnRiskBand,
      },
      null,
      2,
    ),
  ].join("\n");
}

function parsePublicMemoSignals(payload: Record<string, unknown>): PublicMemoSignals {
  const publicRiskLevel = normalizeRiskLevel(payload.publicRiskLevel);

  return {
    contractAddress: readOptionalString(payload.contractAddress),
    dealId: readOptionalString(payload.dealId),
    companyName: readString(payload.companyName, "companyName"),
    sector: readString(payload.sector, "sector"),
    fundingTarget: readNumber(payload.fundingTarget, "fundingTarget"),
    publicMetadataURI: readOptionalString(payload.publicMetadataURI),
    publicRiskScore: readBoundedScore(payload.publicRiskScore, "publicRiskScore"),
    publicRiskLevel,
    publicConfidenceScore: readBoundedScore(
      payload.publicConfidenceScore,
      "publicConfidenceScore",
    ),
    revenueBand: readString(payload.revenueBand, "revenueBand"),
    burnRiskBand: readString(payload.burnRiskBand, "burnRiskBand"),
  };
}

function toMemoApiResponse(insight: ReturnType<typeof deterministicSignalMemo>) {
  return {
    memo: insight.summary,
    source: "deterministic" as const,
  };
}

function createMemoRequestKey(signals: PublicMemoSignals) {
  return JSON.stringify({
    contractAddress: signals.contractAddress ?? "",
    dealId: signals.dealId ?? "",
    companyName: signals.companyName,
    sector: signals.sector,
    fundingTarget: signals.fundingTarget,
    publicRiskScore: signals.publicRiskScore,
    publicRiskLevel: signals.publicRiskLevel,
    publicConfidenceScore: signals.publicConfidenceScore,
    revenueBand: signals.revenueBand,
    burnRiskBand: signals.burnRiskBand,
  });
}

function cleanChainGptMemoText(value: string) {
  return value
    .trim()
    .replace(/^```(?:\w+)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .replace(/`/g, "")
    .replace(/^\s*#{1,6}\s*investment memo\s*:?\s*(?:\r?\n)?/i, "")
    .replace(/^\s*investment memo\s*:?\s*(?:\r?\n)?/i, "")
    .replace(/^\s*#{1,6}\s+[^\r\n]*(?:\r?\n)?/i, "")
    .replace(/^[-*_]{3,}\s*/m, "")
    .replace(/\s+/g, " ")
    .trim();
}

function readString(value: unknown, fieldName: string) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${fieldName} is required.`);
  }

  return value.trim();
}

function readOptionalString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function readNumber(value: unknown, fieldName: string) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${fieldName} must be a number.`);
  }

  return value;
}

function readBoundedScore(value: unknown, fieldName: string) {
  const score = readNumber(value, fieldName);

  if (score < 0 || score > 100) {
    throw new Error(`${fieldName} must be between 0 and 100.`);
  }

  return Math.round(score);
}

function normalizeRiskLevel(value: unknown): RiskLevel {
  if (value === "low" || value === "medium" || value === "high") {
    return value;
  }

  throw new Error("publicRiskLevel must be low, medium, or high.");
}
