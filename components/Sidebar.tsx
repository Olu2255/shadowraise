"use client";

import { useWallet } from "@/hooks/useWallet";

const publicItems = [{ href: "#marketplace", label: "Marketplace" }];

const connectedItems = [
  { href: "#marketplace", label: "Marketplace" },
  { href: "#your-deals", label: "Your Deals" },
  { href: "#your-investments", label: "Your Investments" },
];

export function Sidebar() {
  const { isConnected } = useWallet();
  const items = isConnected ? connectedItems : publicItems;

  return (
    <aside className="hidden w-56 shrink-0 border-r border-slate-200 bg-white px-4 py-6 lg:block">
      <div className="mb-5 text-xs font-semibold uppercase tracking-wide text-slate-400">
        Investor Workspace
      </div>
      <div className="space-y-1">
        {items.map((item, index) => (
          <a
            href={item.href}
            key={item.label}
            className={`block w-full rounded-md px-3 py-2 text-left text-sm font-medium ${
              index === 0
                ? "bg-slate-900 text-white"
                : "text-slate-600 hover:bg-slate-100 hover:text-ink"
            }`}
          >
            {item.label}
          </a>
        ))}
      </div>
    </aside>
  );
}
