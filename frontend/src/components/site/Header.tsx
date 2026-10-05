import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import logoImage from "@/assets/logo.png";

const liens = [
  { label: "Accueil", to: "/" as const },
  { label: "Missions", to: "/missions" as const },
  { label: "Comment ça marche", to: "/" as const, hash: "comment" },
  { label: "Vérifier un certificat", to: "/certificat" as const },
  { label: "Connexion", to: "/connexion" as const },
];

export function Header() {
  const [ouvert, setOuvert] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b-4 border-ink bg-paper">
      <div className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-5 py-4 lg:flex lg:justify-between">
        <Link to="/" className="flex min-w-0 items-center gap-3">
          <img
            src={logoImage}
            alt="CountMeIn — Connecter, Soutenir, Agir"
            width={348}
            height={96}
            className="h-10 w-auto max-w-full lg:h-11"
          />
        </Link>

        <nav className="hidden items-center gap-6 lg:flex">
          {liens.map((lien) => (
            <Link
              key={lien.label}
              to={lien.to}
              {...(lien.hash ? { hash: lien.hash } : {})}
              className="text-sm font-medium text-foreground transition-colors hover:text-pink"
            >
              {lien.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            to="/connexion"
            search={{ profil: "association" }}
            className="press hidden items-center rounded-xl border-2 border-ink bg-paper px-4 py-2 text-sm font-semibold shadow-[4px_4px_0_var(--color-emerald)] sm:inline-flex"
          >
            Je suis une association
          </Link>
          <Link
            to="/inscription"
            search={{ profil: "benevole" }}
            className="press hidden shrink-0 items-center rounded-xl border-2 border-ink bg-pink px-4 py-2 text-sm font-semibold text-pink-foreground shadow-[4px_4px_0_var(--color-ink)] sm:inline-flex"
          >
            Devenir bénévole
          </Link>
          <button
            type="button"
            aria-label={ouvert ? "Fermer le menu" : "Ouvrir le menu"}
            aria-expanded={ouvert}
            onClick={() => setOuvert((o) => !o)}
            className="press inline-flex h-10 w-10 items-center justify-center rounded-xl border-2 border-ink bg-mustard lg:hidden"
          >
            {ouvert ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {ouvert && (
        <div className="animate-fade-in border-t-2 border-ink bg-paper lg:hidden">
          <nav className="mx-auto flex max-w-6xl flex-col gap-1 px-5 py-4">
            {liens.map((lien) => (
              <Link
                key={lien.label}
                to={lien.to}
                {...(lien.hash ? { hash: lien.hash } : {})}
                onClick={() => setOuvert(false)}
                className="rounded-lg px-2 py-2 font-medium hover:bg-muted"
              >
                {lien.label}
              </Link>
            ))}
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Link
                to="/inscription"
                search={{ profil: "benevole" }}
                onClick={() => setOuvert(false)}
                className="rounded-xl border-2 border-ink bg-pink px-4 py-3 text-center text-sm font-semibold text-pink-foreground shadow-[4px_4px_0_var(--color-ink)]"
              >
                Devenir bénévole
              </Link>
              <Link
                to="/connexion"
                search={{ profil: "association" }}
                onClick={() => setOuvert(false)}
                className="rounded-xl border-2 border-ink bg-paper px-4 py-3 text-center text-sm font-semibold shadow-[4px_4px_0_var(--color-emerald)]"
              >
                Je suis une association
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
