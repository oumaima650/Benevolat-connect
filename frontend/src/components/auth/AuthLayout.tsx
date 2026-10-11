import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import logoImage from "@/assets/logo.png";

/* ── classes réutilisables exportées vers les pages ── */
export const authInput =
  "w-full rounded-xl border-2 border-ink bg-paper px-4 py-3 text-sm font-medium text-ink placeholder:text-muted-foreground shadow-[3px_3px_0_var(--color-ink)] transition-all focus:-translate-x-px focus:-translate-y-px focus:shadow-[4px_4px_0_var(--color-ink)] focus:outline-none";

export const authButton =
  "w-full rounded-xl border-2 border-ink bg-pink px-5 py-3.5 text-base font-black text-pink-foreground shadow-[4px_4px_0_var(--color-ink)] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0_var(--color-ink)] active:translate-x-0 active:translate-y-0 active:shadow-none disabled:opacity-60 disabled:pointer-events-none";

/* ── layout principal ── */
export function AuthLayout({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-paper">

      {/* ── Colonne unique : formulaire ── */}
      <div className="flex flex-1 flex-col min-h-screen">
        {/* Header mobile */}
        <header className="flex items-center justify-between border-b-4 border-ink bg-paper px-6 py-4 lg:px-8">
          <Link to="/">
            <img src={logoImage} alt="CountMeIn" className="h-9 w-auto" />
          </Link>
          <Link
            to="/"
            className="press rounded-xl border-2 border-ink bg-paper px-3 py-2 text-xs font-bold shadow-[3px_3px_0_var(--color-ink)] hover:bg-muted"
          >
            ← Accueil
          </Link>
        </header>

        {/* Zone formulaire */}
        <main className="flex flex-1 flex-col items-center justify-center px-4 py-10 sm:px-6 lg:px-10">
          <div className="w-full max-w-md">
            {/* Titre */}
            <div className="mb-8">
              <h1 className="font-display text-3xl font-black text-ink">{title}</h1>
              {subtitle && (
                <p className="mt-1.5 text-sm font-medium text-muted-foreground">{subtitle}</p>
              )}
              {/* Trait décoratif */}
              <div className="mt-3 h-1 w-12 rounded-full bg-mustard border border-ink" />
            </div>

            {/* Card contenu */}
            <div className="rounded-2xl border-2 border-ink bg-paper p-6 sm:p-8 shadow-[6px_6px_0_var(--color-ink)]">
              {children}
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t-2 border-ink bg-muted px-6 py-4 text-center text-xs font-semibold text-muted-foreground">
          © {new Date().getFullYear()} CountMeIn — Plateforme de bénévolat au Maroc
        </footer>
      </div>
    </div>
  );
}
/* ── Messages inline ── */
export function FormSuccess({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="flex items-start gap-2 rounded-xl border-2 border-emerald bg-emerald/10 p-3 text-sm font-semibold text-ink shadow-[2px_2px_0_var(--color-emerald)]">
      <span className="shrink-0 text-emerald">✓</span>
      <span>{message}</span>
    </div>
  );
}

export function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="flex items-start gap-2 rounded-xl border-2 border-destructive bg-destructive/10 p-3 text-sm font-semibold text-ink shadow-[2px_2px_0_var(--color-destructive)]">
      <span className="shrink-0">⚠️</span>
      <span>{message}</span>
    </div>
  );
}
