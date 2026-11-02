import { createFileRoute, Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { CalendarDays, Loader2, MapPin } from 'lucide-react';
import { Header } from '@/components/site/Header';
import { Footer } from '@/components/site/Footer';
import { useAuth } from '@/context/AuthContext';
import { getProfilPublic, type ProfilPublic } from '@/services/profilApi';
import { BanniereBenevole } from '@/components/gamification/BanniereBenevole';
import { BadgesDecroches } from '@/components/gamification/BadgesDecroches';

export const Route = createFileRoute('/benevoles/$id')({
  head: () => ({ meta: [{ title: 'Profil bénévole — CountMeIn' }] }),
  component: ProfilPublicBenevole,
});

/** Profil public d'un bénévole : bannière, niveau et badges décrochés (utilisateur connecté). */
function ProfilPublicBenevole() {
  const { id } = Route.useParams();
  const { token } = useAuth();
  const [profil, setProfil] = useState<ProfilPublic | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    setLoading(true);
    getProfilPublic(id)
      .then((p) => { setProfil(p); setErreur(null); })
      .catch((e: Error) => setErreur(e.message))
      .finally(() => setLoading(false));
  }, [id, token]);

  const nom = profil ? [profil.prenom, profil.nomInitiale].filter(Boolean).join(' ') || 'Bénévole' : '';
  const initiales = profil ? ((profil.prenom?.[0] ?? '') + (profil.nomInitiale?.[0] ?? '')).toUpperCase() || '?' : '';

  return (
    <div className="min-h-screen bg-paper">
      <Header />
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-5">
        {!token ? (
          <Message>
            Connecte-toi pour voir le profil des bénévoles.{' '}
            <Link to="/login" className="font-bold text-pink underline">Se connecter</Link>
          </Message>
        ) : loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
        ) : erreur || !profil ? (
          <Message>{erreur ?? 'Profil introuvable.'}</Message>
        ) : (
          <div className="grid gap-8 md:grid-cols-[280px_1fr]">
            {/* Colonne identité */}
            <aside className="space-y-4">
              {profil.photoUrl ? (
                <img
                  src={profil.photoUrl}
                  alt={nom}
                  className="h-40 w-40 rounded-full border-2 border-ink object-cover shadow-[4px_4px_0_var(--color-ink)] md:h-56 md:w-56"
                />
              ) : (
                <div className="flex h-40 w-40 items-center justify-center rounded-full border-2 border-ink bg-mustard text-5xl font-black text-ink shadow-[4px_4px_0_var(--color-ink)] md:h-56 md:w-56">
                  {initiales}
                </div>
              )}
              <div>
                <h1 className="font-display text-2xl font-black text-ink">{nom}</h1>
                <p className="text-sm text-muted-foreground">Niveau {profil.niveau} · {profil.nomNiveau}</p>
              </div>
              {profil.biographie && <p className="text-sm leading-relaxed text-ink">{profil.biographie}</p>}
              <ul className="space-y-1.5 text-sm text-muted-foreground">
                {profil.ville && (
                  <li className="flex items-center gap-2"><MapPin className="h-4 w-4" /> {profil.ville}</li>
                )}
                {profil.membreDepuis && (
                  <li className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4" />
                    Membre depuis {new Date(profil.membreDepuis).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                  </li>
                )}
              </ul>
              <div className="border-t border-ink/15 pt-4">
                <BadgesDecroches
                  badges={profil.badges}
                  taille={60}
                  titre="Badges"
                  vide="Pas encore de badge décroché."
                />
              </div>
            </aside>

            {/* Colonne principale */}
            <section className="space-y-6">
              <BanniereBenevole theme={profil.theme} niveau={profil.niveau} nomNiveau={profil.nomNiveau}>
                <p className="font-display text-2xl font-black">{profil.nomNiveau}</p>
                <p className="text-sm opacity-80">
                  {profil.niveau} mission{profil.niveau > 1 ? 's' : ''} réalisée{profil.niveau > 1 ? 's' : ''} avec certificat
                </p>
              </BanniereBenevole>

              {profil.competences.length > 0 && (
                <div className="rounded-2xl border-2 border-ink bg-paper p-5 shadow-[4px_4px_0_var(--color-ink)]">
                  <h2 className="mb-3 font-display font-bold text-ink">Compétences</h2>
                  <div className="flex flex-wrap gap-2">
                    {profil.competences.map((c) => (
                      <span key={c} className="rounded-full border-2 border-ink bg-muted px-3 py-0.5 text-xs font-semibold text-ink">{c}</span>
                    ))}
                  </div>
                </div>
              )}
            </section>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

function Message({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-md rounded-2xl border-2 border-ink bg-paper p-6 text-center text-sm text-ink shadow-[4px_4px_0_var(--color-ink)]">
      {children}
    </div>
  );
}
