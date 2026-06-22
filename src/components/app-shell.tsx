import Link from "next/link";
import { ChefHat, FileAudio2 } from "lucide-react";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="no-print sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#1B6CA8] text-white shadow-sm">
              <ChefHat size={22} aria-hidden="true" />
            </span>
            <span>
              <span className="block text-lg font-black text-slate-950">Cantine Intelligente</span>
              <span className="block text-sm font-semibold text-slate-500">Decision nutritionnelle et budgetaire</span>
            </span>
          </Link>
          <nav className="flex w-full gap-2 overflow-x-auto md:w-auto md:justify-end">
            <Link
              href="/"
              className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:border-sauge hover:text-sauge"
            >
              <ChefHat size={17} aria-hidden="true" />
              Cantine
            </Link>
            <Link
              href="/transcription"
              className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:border-sauge hover:text-sauge"
            >
              <FileAudio2 size={17} aria-hidden="true" />
              Transcription
            </Link>
          </nav>
        </div>
      </header>

      <main className="page-impression mx-auto min-h-[calc(100vh-137px)] max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {children}
      </main>

      <footer className="no-print border-t border-slate-200 bg-white px-4 py-5 text-center text-sm font-semibold text-slate-500">
        Créé par EHUZU LEARNING LAB
      </footer>
    </div>
  );
}
