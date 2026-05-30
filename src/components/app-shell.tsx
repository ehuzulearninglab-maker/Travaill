import Link from "next/link";
import { BookOpenCheck, Clock3, LayoutDashboard, Settings, ShieldCheck } from "lucide-react";
import { getCurrentUser } from "@/lib/current-user";

const navItems = [
  { href: "/tableau-de-bord", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/historique", label: "Historique", icon: Clock3 },
  { href: "/parametres", label: "Paramètres", icon: Settings }
];

export async function AppShell({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  const visibleNavItems =
    user?.role === "admin" ? [...navItems, { href: "/admin", label: "Admin", icon: ShieldCheck }] : navItems;

  return (
    <div className="min-h-screen">
      <header className="no-print sticky top-0 z-30 border-b border-stone-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <Link href="/tableau-de-bord" className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-sauge text-white shadow-sm">
              <BookOpenCheck size={22} aria-hidden="true" />
            </span>
            <span>
              <span className="block text-lg font-bold text-encre">Récepteur de fiches</span>
              <span className="block text-sm text-brun">Canevas pédagogique connecté</span>
            </span>
          </Link>

          <nav className="flex flex-wrap items-center gap-2">
            {visibleNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-stone-100 bg-white px-4 py-2 text-sm font-bold text-encre shadow-sm transition hover:border-sauge hover:text-sauge"
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

      <footer className="no-print border-t border-stone-100 bg-white/90 px-4 py-5 text-center text-sm font-medium text-brun">
        Créé par Ehuzu Learning Lab
      </footer>
    </div>
  );
}
