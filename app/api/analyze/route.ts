import { NextResponse } from "next/server";
import { analyzeSubmittedDeal } from "@/services/dealService";
import type { FinancialInput } from "@/types";

export async function POST(request: Request) {
  const input = (await request.json()) as FinancialInput;

  if (!input.companyName || !input.sector) {
    return NextResponse.json(
      { error: "Company name and sector are required." },
      { status: 400 },
    );
  }

  const deal = await analyzeSubmittedDeal(input);

  return NextResponse.json({ deal });
}
