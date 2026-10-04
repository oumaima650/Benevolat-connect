import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Logo } from "@/components/site/Logo";

export const authInput =
  "border-2 border-ink rounded-xl bg-paper px-4 py-3 shadow-neo transition-all focus:shadow-neo-lg focus:translate-x-[-1px] focus:translate-y-[-1px] focus:outline-none font-medium text-ink placeholder:text-muted-foreground w-full";

export const authButton =
  "w-full rounded-xl border-2 border-ink bg-pink text-pink-foreground font-black text-lg py-3 shadow-neo hover:shadow-neo-lg hover:-translate-x-[2px] hover:-translate-y-[2px] active:translate-x-0 active:translate-y-0 transition-all";

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
    <div className="min-h-screen bg-paper flex flex-col justify-between p-4 sm:p-6 md:p-8">
      <header className="flex justify-between items-center max-w-5xl mx-auto w-full">
        <Link to="/" className="inline-block">
          <Logo />
        </Link>
        <Link
          to="/"
          className="rounded-xl border-2 border-ink bg-cream px-4 py-2 text-sm font-bold shadow-neo hover:bg-mustard transition-colors"
        >
          ← Retour à l'accueil
        </Link>
      </header>

      <main className="max-w-md w-full mx-auto my-8">
        <div className="rounded-2xl border-3 border-ink bg-card p-6 sm:p-8 shadow-neo-xl">
          <div className="mb-6 text-center">
            <h1 className="text-3xl font-black text-ink">{title}</h1>
            {subtitle && <p className="text-sm font-medium text-muted-foreground mt-1">{subtitle}</p>}
          </div>
          {children}
        </div>
      </main>

      <footer className="text-center text-xs font-semibold text-muted-foreground">
        © {new Date().getFullYear()} CountMeIn — Plateforme de bénévolat
      </footer>
    </div>
  );
}

export function FormSuccess({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="rounded-xl border-2 border-ink bg-emerald/20 p-3 text-sm font-bold text-emerald-900 shadow-neo mb-4">
      ✓ {message}
    </div>
  );
}

export function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="rounded-xl border-2 border-ink bg-coral/20 p-3 text-sm font-bold text-coral-900 shadow-neo mb-4">
      ⚠️ {message}
    </div>
  );
}
