import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { Building2, User } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
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

function DashboardLoginPage() {
  const { loginUser } = useAuth();
  const navigate = useNavigate();

  function accessBenevole() {
    loginUser(
      {
        email: 'yasmine@example.ma',
        prenom: 'Yasmine',
        nom: 'El Idrissi',
        role: 'BENEVOLE',
      },
      'demo-benevole-token',
    );
    navigate({ to: '/benevole' });
  }

  function accessAssociation() {
    loginUser(
      {
        email: 'contact@nour-asso.ma',
        nomAssociation: 'Association Nour',
        role: 'ASSOCIATION',
      },
      'demo-association-token',
    );
    navigate({ to: '/association' });
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
          Choisissez un rôle pour explorer l'espace correspondant. Aucun mot de passe requis — c'est une démonstration avec des données fictives.
        </p>
      </div>

      {/* Role cards */}
      <div className="grid w-full max-w-2xl gap-6 sm:grid-cols-2">
        {/* Bénévole */}
        <button
          onClick={accessBenevole}
          className="group flex flex-col items-center gap-5 rounded-2xl border-2 border-ink bg-mustard p-8 shadow-[4px_4px_0_var(--color-ink)] transition-transform duration-150 hover:-translate-y-1 hover:shadow-[6px_6px_0_var(--color-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring press"
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
            Accéder →
          </span>
        </button>

        {/* Association */}
        <button
          onClick={accessAssociation}
          className="group flex flex-col items-center gap-5 rounded-2xl border-2 border-ink bg-emerald p-8 shadow-[4px_4px_0_var(--color-ink)] transition-transform duration-150 hover:-translate-y-1 hover:shadow-[6px_6px_0_var(--color-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring press"
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
            Accéder →
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
