import Link from "next/link";

export default function LandingPage() {
  return (
    <section className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl items-center gap-12 px-6 py-16 lg:grid-cols-[1.1fr_0.9fr]">
      <div>
        <p className="mb-4 text-sm font-semibold uppercase tracking-wide text-teal-700">
          Confidential investment intelligence
        </p>
        <h1 className="max-w-3xl text-5xl font-semibold tracking-tight text-ink">
          ShadowRaise helps founders share signal without exposing raw financials.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
          Founders submit private metrics, confidential compute returns derived
          signals, and investors see investment signal memos they can act on.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            className="rounded-md bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
            href="/dashboard"
          >
            View Dashboard
          </Link>
          <Link
            className="rounded-md border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-ink transition hover:bg-slate-100"
            href="/submit"
          >
            Submit Deal
          </Link>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-soft">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <p className="text-sm font-semibold text-ink">Investor Memo Preview</p>
            <p className="text-sm text-slate-500">Raw data hidden</p>
          </div>
          <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700">
            Token gated
          </span>
        </div>
        <div className="mt-5 space-y-4">
          {[
            ["Signal score", "34/100", "Public signal"],
            ["Burn multiple", "0.82x", "Efficient"],
            ["Runway", "16 months", "Healthy"],
          ].map(([label, value, note]) => (
            <div
              className="flex items-center justify-between rounded-md bg-slate-50 p-4"
              key={label}
            >
              <div>
                <p className="text-sm font-medium text-ink">{label}</p>
                <p className="text-xs text-slate-500">{note}</p>
              </div>
              <p className="text-lg font-semibold text-ink">{value}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
