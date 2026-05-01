"use client";

import { useTokenGate } from "@/hooks/useTokenGate";

export function TokenGateNotice() {
  const { hasAccess, tokenLabel } = useTokenGate();

  return (
    <div className="rounded-lg border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-800">
      {hasAccess
        ? `Access granted for ${tokenLabel}. Only public investment signals are shown.`
        : "Investor access is locked. Connect wallet to continue."}
    </div>
  );
}
