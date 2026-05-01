type AIInsightBoxProps = {
  title: string;
  memo: string;
  loading?: boolean;
  source?: "chaingpt" | "deterministic";
  compact?: boolean;
};

export function AIInsightBox({
  compact = false,
  loading = false,
  memo,
  source,
  title,
}: AIInsightBoxProps) {
  return (
    <section
      className={
        compact
          ? "rounded-md bg-slate-50 p-3"
          : "rounded-lg border border-slate-200 bg-white p-5 shadow-soft"
      }
    >
      <div className="mb-3 flex items-center justify-between gap-4">
        <h2 className="text-base font-semibold text-ink">{title}</h2>
        {source ? (
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold capitalize text-slate-600">
            {source === "chaingpt" ? "ChainGPT" : "Signals"}
          </span>
        ) : null}
      </div>
      <p
        className={`text-sm leading-6 text-slate-600 ${
          compact && !loading ? "line-clamp-3" : ""
        }`}
      >
        {loading ? "Generating AI insight from public investment signals..." : memo}
      </p>
    </section>
  );
}
