import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, X, LogOut, User } from "lucide-react";
import logoImage from "@/assets/logo.png";
import { useAuth, getInitial } from "@/context/AuthContext";

const liens = [
  { label: "Accueil", to: "/" as const },
  { label: "Missions", to: "/missions" as const },
  { label: "Comment ça marche", to: "/" as const, hash: "comment" },
  { label: "Vérifier un certificat", to: "/certificat" as const },
];

export function Header() {
  const [ouvert, setOuvert] = useState(false);
  const { user, logout } = useAuth();
  const initial = getInitial(user);

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
          {user ? (
            <div className="flex items-center gap-3">
              <div
                title={user.email}
                className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-ink bg-mustard text-lg font-extrabold text-ink shadow-[3px_3px_0_var(--color-ink)]"
              >
                {initial}
              </div>
              <button
                onClick={logout}
                title="Se déconnecter"
                className="press hidden sm:inline-flex items-center gap-1.5 rounded-xl border-2 border-ink bg-paper px-4 py-2.5 text-sm font-semibold hover:bg-pink hover:text-pink-foreground"
              >
                <LogOut className="h-4 w-4" />
                Déconnexion
              </button>
            </div>
          ) : (
            <>
              <Link
                to="/login"
                className="press hidden items-center rounded-xl border-2 border-ink bg-paper px-4 py-2.5 text-sm font-semibold shadow-[3px_3px_0_var(--color-ink)] hover:bg-muted sm:inline-flex"
              >
                Connexion
              </Link>
              <Link
                to="/inscription"
                search={{ role: "ASSOCIATION" }}
                className="press hidden items-center rounded-xl border-2 border-ink bg-paper px-5 py-2.5 text-sm font-semibold shadow-[4px_4px_0_var(--color-emerald)] sm:inline-flex"
              >
                Je suis une association
              </Link>
              <Link
                to="/inscription"
                search={{ role: "BENEVOLE" }}
                className="press hidden shrink-0 items-center rounded-xl border-2 border-ink bg-pink px-5 py-2.5 text-sm font-semibold text-pink-foreground shadow-[4px_4px_0_var(--color-ink)] sm:inline-flex"
              >
                Devenir bénévole
              </Link>
            </>
          )}

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
              {user ? (
                <div className="flex items-center justify-between p-2 rounded-xl border-2 border-ink bg-mustard">
                  <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-ink bg-paper font-bold">
                      {initial}
                    </div>
                    <span className="text-xs font-bold truncate max-w-[150px]">{user.email}</span>
                  </div>
                  <button
                    onClick={() => {
                      logout();
                      setOuvert(false);
                    }}
                    className="p-2 rounded-lg bg-pink text-pink-foreground border border-ink"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setOuvert(false)}
                    className="rounded-xl border-2 border-ink bg-paper px-4 py-3 text-center text-sm font-semibold shadow-[3px_3px_0_var(--color-ink)]"
                  >
                    Connexion
                  </Link>
                  <Link
                    to="/inscription"
                    search={{ role: "BENEVOLE" }}
                    onClick={() => setOuvert(false)}
                    className="rounded-xl border-2 border-ink bg-pink px-4 py-3 text-center text-sm font-semibold text-pink-foreground shadow-[4px_4px_0_var(--color-ink)]"
                  >
                    Devenir bénévole
                  </Link>
                  <Link
                    to="/inscription"
                    search={{ role: "ASSOCIATION" }}
                    onClick={() => setOuvert(false)}
                    className="rounded-xl border-2 border-ink bg-paper px-4 py-3 text-center text-sm font-semibold shadow-[4px_4px_0_var(--color-emerald)]"
                  >
                    Je suis une association
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
