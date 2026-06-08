import Link from "next/link";
import { ChefHat, ClipboardList, PackageCheck, ShieldCheck, SlidersHorizontal } from "lucide-react";

const navItems = [
  { href: "/#planification", label: "Planifier", icon: SlidersHorizontal },
  { href: "/#menu", label: "Menu", icon: ChefHat },
  { href: "/#achats", label: "Achats", icon: PackageCheck },
  { href: "/#rapport", label: "Rapport", icon: ClipboardList },
  { href: "/#admin", label: "Admin", icon: ShieldCheck }
];

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="no-print sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#1B6CA8] text-white shadow-sm">
              <ChefHat size={22} aria-hidden="true" />
            </span>
            <span>
              <span className="block text-lg font-black text-slate-950">Cantine Intelligente</span>
              <span className="block text-sm font-semibold text-slate-500">Decision nutritionnelle et budgetaire</span>
            </span>
          </Link>

          <nav className="flex flex-wrap items-center gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="inline-flex min-h-[40px] items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 shadow-sm transition hover:border-[#1B6CA8] hover:text-[#1B6CA8]"
                >
                  <Icon size={16} aria-hidden="true" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="page-impression mx-auto min-h-[calc(100vh-154px)] max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {children}
      </main>

      <footer className="no-print border-t border-slate-200 bg-white px-4 py-5 text-center text-sm font-semibold text-slate-500">
        Cantine Intelligente - MVP local de planification alimentaire scolaire
      </footer>
    </div>
  );
}
