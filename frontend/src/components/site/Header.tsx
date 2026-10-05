import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import logoImage from "@/assets/logo.png";

const liens = [
  { label: "Accueil", to: "/" as const },
  { label: "Missions", to: "/missions" as const },
  { label: "Comment ça marche", to: "/" as const, hash: "comment" },
  { label: "Vérifier un certificat", to: "/certificat" as const },
];

export function Header() {
  const [ouvert, setOuvert] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b-4 border-ink bg-paper w-full">
      <div className="w-full flex items-center justify-between gap-6 px-6 py-4 lg:px-12">
        <Link to="/" className="flex shrink-0 items-center gap-3">
          <img
            src={logoImage}
            alt="CountMeIn — Connecter, Soutenir, Agir"
            width={348}
            height={96}
            className="h-12 w-auto max-w-full lg:h-14"
          />
        </Link>

        <nav className="hidden items-center gap-8 lg:flex">
          {liens.map((lien) => (
            <Link
              key={lien.label}
              to={lien.to}
              {...(lien.hash ? { hash: lien.hash } : {})}
              className="text-base font-semibold text-foreground transition-colors hover:text-pink"
            >
              {lien.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <a
            href="/login?role=association"
            className="press hidden items-center rounded-xl border-2 border-ink bg-paper px-5 py-2.5 text-sm font-semibold shadow-[4px_4px_0_var(--color-emerald)] sm:inline-flex"
          >
            Je suis une association
          </a>
          <a
            href="/register?role=benevole"
            className="press hidden shrink-0 items-center rounded-xl border-2 border-ink bg-pink px-5 py-2.5 text-sm font-semibold text-pink-foreground shadow-[4px_4px_0_var(--color-ink)] sm:inline-flex"
          >
            Devenir bénévole
          </a>
          <button
            type="button"
            aria-label={ouvert ? "Fermer le menu" : "Ouvrir le menu"}
            aria-expanded={ouvert}
            onClick={() => setOuvert((o) => !o)}
            className="press inline-flex h-11 w-11 items-center justify-center rounded-xl border-2 border-ink bg-mustard lg:hidden"
          >
            {ouvert ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {ouvert && (
        <div className="animate-fade-in border-t-2 border-ink bg-paper lg:hidden">
          <nav className="flex flex-col gap-2 px-6 py-4">
            {liens.map((lien) => (
              <Link
                key={lien.label}
                to={lien.to}
                {...(lien.hash ? { hash: lien.hash } : {})}
                onClick={() => setOuvert(false)}
                className="rounded-lg px-3 py-2 text-base font-semibold hover:bg-muted"
              >
                {lien.label}
              </Link>
            ))}
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <a
                href="/register?role=benevole"
                onClick={() => setOuvert(false)}
                className="rounded-xl border-2 border-ink bg-pink px-4 py-3 text-center text-sm font-semibold text-pink-foreground shadow-[4px_4px_0_var(--color-ink)]"
              >
                Devenir bénévole
              </a>
              <a
                href="/login?role=association"
                onClick={() => setOuvert(false)}
                className="rounded-xl border-2 border-ink bg-paper px-4 py-3 text-center text-sm font-semibold shadow-[4px_4px_0_var(--color-emerald)]"
              >
                Je suis une association
              </a>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
