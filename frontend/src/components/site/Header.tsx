import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Menu, X, LogOut } from "lucide-react";
import logoImage from "@/assets/logo.png";
import { useAuth } from "@/context/AuthContext";
import { UserAvatar } from "@/components/common/UserAvatar";

const liens = [
  { label: "Accueil",              to: "/" as const },
  { label: "Missions",             to: "/missions" as const },
  { label: "Associations",         to: "/associations" as const },
  { label: "Comment ça marche",    to: "/comment-ca-marche" as const },
  { label: "Vérifier un certificat", to: "/certificat" as const },
];

export function Header() {
  const [ouvert, setOuvert] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function goToDashboard() {
    if (!user) return;
    navigate({ to: user.role === "ASSOCIATION" ? "/association" : "/benevole" });
  }

  return (
    <header className="sticky top-0 z-40 border-b-4 border-ink bg-paper w-full">
      <div className="w-full flex items-center justify-between gap-4 px-6 py-3.5 lg:px-12">

        {/* Logo */}
        <Link to="/" className="flex shrink-0 items-center">
          <img
            src={logoImage}
            alt="CountMeIn — Connecter, Soutenir, Agir"
            className="h-11 w-auto max-w-full lg:h-13"
          />
        </Link>

        {/* Nav desktop */}
        <nav className="hidden items-center gap-6 lg:flex">
          {liens.map((lien) => (
            <Link
              key={lien.label}
              to={lien.to}
              className="text-sm font-semibold text-foreground transition-colors hover:text-pink"
            >
              {lien.label}
            </Link>
          ))}
        </nav>

        {/* Actions desktop */}
        <div className="hidden items-center gap-2 lg:flex">
          {user ? (
            /* ── Connecté ── */
            <div className="flex items-center gap-3">
              <UserAvatar user={user} size="md" onClick={goToDashboard} />
              <button
                onClick={logout}
                className="press inline-flex items-center gap-1.5 rounded-xl border-2 border-ink bg-paper px-4 py-2 text-sm font-semibold hover:bg-muted"
              >
                <LogOut className="h-4 w-4" />
                Déconnexion
              </button>
            </div>
          ) : (
            /* ── Non connecté : 3 boutons compacts ── */
            <>
              <Link
                to="/login"
                className="press inline-flex items-center rounded-xl border-2 border-ink bg-paper px-4 py-2.5 text-sm font-semibold shadow-[3px_3px_0_var(--color-ink)] hover:bg-muted"
              >
                Connexion
              </Link>
              <Link
                to="/inscription"
                search={{ role: "ASSOCIATION" }}
                className="press inline-flex items-center rounded-xl border-2 border-ink bg-paper px-5 py-2.5 text-sm font-semibold shadow-[4px_4px_0_var(--color-emerald)]"
              >
                Je suis une association
              </Link>
              <Link
                to="/inscription"
                search={{ role: "BENEVOLE" }}
                className="press inline-flex shrink-0 items-center rounded-xl border-2 border-ink bg-pink px-5 py-2.5 text-sm font-semibold text-pink-foreground shadow-[4px_4px_0_var(--color-ink)]"
              >
                Devenir bénévole
              </Link>
            </>
          )}
        </div>

        {/* Burger mobile */}
        <button
          type="button"
          aria-label={ouvert ? "Fermer le menu" : "Ouvrir le menu"}
          aria-expanded={ouvert}
          onClick={() => setOuvert(o => !o)}
          className="press inline-flex h-11 w-11 items-center justify-center rounded-xl border-2 border-ink bg-mustard lg:hidden"
        >
          {ouvert ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Menu mobile */}
      {ouvert && (
        <div className="border-t-2 border-ink bg-paper lg:hidden">
          <nav className="flex flex-col gap-1 px-6 py-4">
            {liens.map((lien) => (
              <Link
                key={lien.label}
                to={lien.to}
                onClick={() => setOuvert(false)}
                className="rounded-lg px-3 py-2.5 text-base font-semibold hover:bg-muted"
              >
                {lien.label}
              </Link>
            ))}

            <div className="mt-4 flex flex-col gap-2 border-t-2 border-ink pt-4">
              {user ? (
                <div className="flex items-center justify-between rounded-xl border-2 border-ink bg-mustard p-3">
                  <div className="flex items-center gap-2">
                    <UserAvatar user={user} size="sm" onClick={() => { goToDashboard(); setOuvert(false); }} />
                    <span className="text-xs font-bold truncate max-w-[140px]">{user.email}</span>
                  </div>
                  <button
                    onClick={() => { logout(); setOuvert(false); }}
                    className="rounded-lg border border-ink bg-pink p-2 text-pink-foreground"
                    title="Déconnexion"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setOuvert(false)}
                    className="flex items-center justify-center gap-2 rounded-xl border-2 border-ink bg-paper px-4 py-3 text-sm font-semibold shadow-[3px_3px_0_var(--color-ink)]"
                  >
                    Connexion
                  </Link>
                  <Link
                    to="/inscription"
                    search={{ role: "BENEVOLE" }}
                    onClick={() => setOuvert(false)}
                    className="flex items-center justify-center gap-2 rounded-xl border-2 border-ink bg-pink px-4 py-3 text-sm font-semibold text-pink-foreground shadow-[3px_3px_0_var(--color-ink)]"
                  >
                    Devenir bénévole
                  </Link>
                  <Link
                    to="/inscription"
                    search={{ role: "ASSOCIATION" }}
                    onClick={() => setOuvert(false)}
                    className="flex items-center justify-center gap-2 rounded-xl border-2 border-ink bg-emerald px-4 py-3 text-sm font-semibold text-emerald-foreground shadow-[3px_3px_0_var(--color-ink)]"
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
