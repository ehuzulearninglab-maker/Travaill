import Link from "next/link";
import { BookOpenCheck, Clock3, LayoutDashboard, Settings } from "lucide-react";

const navItems = [
  { href: "/tableau-de-bord", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/historique", label: "Historique", icon: Clock3 },
  { href: "/parametres", label: "Paramètres", icon: Settings }
];

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="no-print border-b border-stone-200/80 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <Link href="/tableau-de-bord" className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-md bg-sauge text-white">
              <BookOpenCheck size={22} aria-hidden="true" />
            </span>
            <span>
              <span className="block text-lg font-bold text-encre">Récepteur de fiches</span>
              <span className="block text-sm text-stone-600">Canevas pédagogique connecté</span>
            </span>
          </Link>

          <nav className="flex flex-wrap items-center gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="inline-flex items-center gap-2 rounded-md border border-stone-200 bg-white px-3 py-2 text-sm font-medium text-stone-700 transition hover:border-sauge hover:text-sauge"
                >
                  <Icon size={16} aria-hidden="true" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="page-impression mx-auto min-h-[calc(100vh-170px)] max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {children}
      </main>

      <footer className="no-print border-t border-stone-200/80 bg-white/75 px-4 py-5 text-center text-sm font-medium text-stone-600">
        Créé par Ehuzu Learning Lab
      </footer>
    </div>
  );
}
