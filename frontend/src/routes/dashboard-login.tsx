import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { Building2, User } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { login } from '@/services/authApi';
import logoImage from '@/assets/logo.png';

export const Route = createFileRoute('/dashboard-login')({
  head: () => ({
    meta: [
      { title: 'Accès démo — CountMeIn' },
      { name: 'description', content: "Choisissez votre rôle pour accéder à l'espace démo CountMeIn." },
    ],
  }),
  component: DashboardLoginPage,
});

/* Comptes de démonstration créés par DataSeeder côté backend. */
const DEMO_ACCOUNTS = {
  BENEVOLE: { email: 'yasmine@example.ma', password: 'secret123' },
  ASSOCIATION: { email: 'banque.alimentaire@email.com', password: 'secret123' },
} as const;

function DashboardLoginPage() {
  const { loginUser } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState<'BENEVOLE' | 'ASSOCIATION' | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function access(role: 'BENEVOLE' | 'ASSOCIATION') {
    setError(null);
    setBusy(role);
    try {
      const { email, password } = DEMO_ACCOUNTS[role];
      const res = await login(email, password);
      if (!res.success || !res.token || !res.user) {
        setError(res.message || 'Connexion démo impossible.');
        return;
      }
      loginUser(res.user, res.token);
      navigate({ to: role === 'BENEVOLE' ? '/benevole' : '/association' });
    } catch (e: any) {
      setError(e?.message ?? 'Serveur backend indisponible.');
    } finally {
      setBusy(null);
    }
  }

  function accessBenevole() {
    void access('BENEVOLE');
  }

  function accessAssociation() {
    void access('ASSOCIATION');
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-paper px-4 py-12">
      {/* Logo */}
      <Link to="/" className="mb-8 flex items-center gap-2">
        <img src={logoImage} alt="CountMeIn" className="h-10 w-auto" />
      </Link>

      {/* Title */}
      <div className="mb-10 text-center">
        <h1 className="font-display text-4xl font-black text-ink">Accès démo</h1>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          Choisissez un rôle pour explorer l'espace correspondant. La connexion utilise un compte de
          démonstration réel enregistré en base — aucune saisie de mot de passe n'est nécessaire.
        </p>
      </div>

      {error && (
        <div className="mb-6 w-full max-w-2xl rounded-2xl border-2 border-ink bg-pink/20 px-4 py-3 text-sm font-semibold text-ink shadow-[3px_3px_0_var(--color-ink)]">
          {error}
        </div>
      )}

      {/* Role cards */}
      <div className="grid w-full max-w-2xl gap-6 sm:grid-cols-2">
        {/* Bénévole */}
        <button
          onClick={accessBenevole}
          disabled={busy !== null}
          className="group flex flex-col items-center gap-5 rounded-2xl border-2 border-ink bg-mustard p-8 shadow-[4px_4px_0_var(--color-ink)] transition-transform duration-150 hover:-translate-y-1 hover:shadow-[6px_6px_0_var(--color-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring press disabled:opacity-60 disabled:hover:translate-y-0"
          aria-label="Accéder en tant que bénévole"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-ink bg-paper">
            <User className="h-8 w-8 text-ink" aria-hidden="true" />
          </div>
          <div className="text-center">
            <p className="font-display text-xl font-black text-ink">Bénévole</p>
            <p className="mt-1 text-sm text-ink/70">
              Explorez les missions, suivez votre parcours et gérez vos inscriptions.
            </p>
          </div>
          <span className="mt-2 inline-flex items-center rounded-full border-2 border-ink bg-paper px-4 py-1 text-sm font-bold text-ink">
            {busy === 'BENEVOLE' ? 'Connexion…' : 'Accéder →'}
          </span>
        </button>

        {/* Association */}
        <button
          onClick={accessAssociation}
          disabled={busy !== null}
          className="group flex flex-col items-center gap-5 rounded-2xl border-2 border-ink bg-emerald p-8 shadow-[4px_4px_0_var(--color-ink)] transition-transform duration-150 hover:-translate-y-1 hover:shadow-[6px_6px_0_var(--color-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring press disabled:opacity-60 disabled:hover:translate-y-0"
          aria-label="Accéder en tant qu'association"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-ink bg-paper">
            <Building2 className="h-8 w-8 text-ink" aria-hidden="true" />
          </div>
          <div className="text-center">
            <p className="font-display text-xl font-black text-paper">Association</p>
            <p className="mt-1 text-sm text-paper/80">
              Publiez des missions, gérez les inscrits et délivrez des certificats.
            </p>
          </div>
          <span className="mt-2 inline-flex items-center rounded-full border-2 border-ink bg-paper px-4 py-1 text-sm font-bold text-ink">
            {busy === 'ASSOCIATION' ? 'Connexion…' : 'Accéder →'}
          </span>
        </button>
      </div>

      {/* Back link */}
      <Link to="/" className="mt-10 text-sm font-semibold text-ink underline underline-offset-4 hover:text-pink">
        ← Retour à l'accueil
      </Link>
    </div>
  );
}
