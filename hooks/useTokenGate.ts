"use client";

import { useMemo } from "react";

export function useTokenGate() {
  return useMemo(
    () => ({
      hasAccess: true,
      tokenLabel: "connected investor workspace",
    }),
    [],
  );
}
