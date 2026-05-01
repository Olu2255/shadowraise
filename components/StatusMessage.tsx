"use client";

type StatusMessageProps = {
  title: string;
  body: string;
  variant?: "error" | "success" | "warning" | "info";
  onRetry?: () => void;
  onClose?: () => void;
};

const styles = {
  error: "border-rose-200 bg-rose-50 text-rose-800",
  success: "border-teal-200 bg-teal-50 text-teal-800",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  info: "border-slate-200 bg-white text-slate-700",
};

export function StatusMessage({
  title,
  body,
  variant = "info",
  onRetry,
  onClose,
}: StatusMessageProps) {
  return (
    <div className={`rounded-lg border px-4 py-3 text-sm ${styles[variant]}`}>
      <p className="font-semibold">{title}</p>
      <p className="mt-1 leading-6">{body}</p>
      {variant === "error" ? (
        <p className="mt-2 text-xs">
          If the issue continues, check your wallet network and try again.
        </p>
      ) : null}
      {onRetry || onClose ? (
        <div className="mt-3 flex gap-2">
          {onRetry ? (
            <button
              className="rounded-md bg-white px-3 py-1.5 text-xs font-semibold text-ink ring-1 ring-slate-200 transition hover:bg-slate-100"
              onClick={onRetry}
              type="button"
            >
              Try again
            </button>
          ) : null}
          {onClose ? (
            <button
              className="rounded-md bg-white px-3 py-1.5 text-xs font-semibold text-ink ring-1 ring-slate-200 transition hover:bg-slate-100"
              onClick={onClose}
              type="button"
            >
              Close
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
