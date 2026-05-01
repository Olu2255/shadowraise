import Link from "next/link";
import { WalletButton } from "@/components/WalletButton";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/submit", label: "Submit Deal" },
];

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-3 font-semibold text-ink">
          <span className="grid h-9 w-9 place-items-center rounded-md bg-ink text-sm text-white">
            SR
          </span>
          <span>ShadowRaise</span>
        </Link>
        <div className="flex items-center gap-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-ink"
            >
              {item.label}
            </Link>
          ))}
          <WalletButton />
        </div>
      </nav>
    </header>
  );
}
