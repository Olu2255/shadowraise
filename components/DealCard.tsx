import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/format";
import type { Deal } from "@/types";

type DealCardProps = {
  deal: Deal;
};

export function DealCard({ deal }: DealCardProps) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            {deal.sector}
          </p>
          <h3 className="mt-2 text-lg font-semibold text-ink">{deal.companyName}</h3>
        </div>
      </div>
      <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
        <div>
          <p className="text-xs text-slate-400">Target</p>
          <p className="font-semibold text-ink">{formatCurrency(deal.fundingTarget)}</p>
        </div>
        <div>
          <p className="text-xs text-slate-400">Submitted</p>
          <p className="font-semibold text-ink">{formatDate(deal.submittedAt)}</p>
        </div>
        <Link
          href={`/deal/${deal.id}`}
          className="rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
        >
          View
        </Link>
      </div>
    </article>
  );
}
