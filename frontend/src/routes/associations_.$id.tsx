import { createFileRoute, Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import {
  ArrowLeft, ArrowUpRight, CalendarDays, Camera, ImageOff, Loader2, Mail, MapPin, Phone, Users,
} from 'lucide-react';
import { Header } from '@/components/site/Header';
import { Footer } from '@/components/site/Footer';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { StatusBadge } from '@/components/dashboard/StatusBadge';
import { formaterDate, type MissionStatut } from '@/components/dashboard/data';
import { missionPresentation } from '@/components/site/mission-presentation';
import associationApi, {
  type AssociationPublique, type MissionPublique, type PhotoEvenement,
} from '@/services/associationApi';

// « associations_ » : page autonome (pas imbriquée dans la liste /associations)
export const Route = createFileRoute('/associations_/$id')({
  head: () => ({ meta: [{ title: 'Association — CountMeIn' }] }),
  component: ProfilAssociation,
});

const STATUTS_OUVERTS = ['PUBLIEE', 'SATUREE', 'RENFORT_URGENT', 'EN_COURS'];

/** Profil public d'une association : présentation, missions à venir et passées avec leurs photos. */
function ProfilAssociation() {
  const { id } = Route.useParams();
  const [asso, setAsso] = useState<AssociationPublique | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [agrandie, setAgrandie] = useState<PhotoEvenement | null>(null);

  useEffect(() => {
    setLoading(true);
    associationApi.getProfilPublic(id)
      .then((a) => { setAsso(a); setErreur(null); })
      .catch((e: Error) => setErreur(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const maintenant = new Date();
  const aVenir = asso?.missions
    .filter((m) => STATUTS_OUVERTS.includes(m.statut) && new Date(m.dateFin) >= maintenant)
    .sort((a, b) => a.dateDebut.localeCompare(b.dateDebut)) ?? [];
  const passees = asso?.missions.filter((m) => !aVenir.includes(m)) ?? [];
  const nbPhotos = asso?.missions.reduce((n, m) => n + m.photos.length, 0) ?? 0;

  return (
    <div className="min-h-screen bg-paper">
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-5">
        <Link
          to="/associations"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" /> Toutes les associations
        </Link>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
        ) : erreur || !asso ? (
          <div className="mt-8 rounded-2xl border-2 border-ink bg-white p-8 text-center shadow-[4px_4px_0_var(--color-ink)]">
            <p className="text-ink">{erreur ?? 'Association introuvable.'}</p>
          </div>
        ) : (
          <div className="mt-6 space-y-12">
            <EnTete asso={asso} nbMissions={asso.missions.length} nbPhotos={nbPhotos} />

            <section className="space-y-4">
              <h2 className="font-display text-2xl font-black text-ink sm:text-3xl">Missions à venir</h2>
              {aVenir.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucune mission ouverte pour le moment.</p>
              ) : (
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {aVenir.map((m) => <CarteMission key={m.id} mission={m} onAgrandir={setAgrandie} />)}
                </div>
              )}
            </section>

            {passees.length > 0 && (
              <section className="space-y-4">
                <h2 className="font-display text-2xl font-black text-ink sm:text-3xl">Missions réalisées</h2>
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {passees.map((m) => <CarteMission key={m.id} mission={m} onAgrandir={setAgrandie} />)}
                </div>
              </section>
            )}
          </div>
        )}
      </main>
      <Footer />

      {/* Photo en grand */}
      <Dialog open={!!agrandie} onOpenChange={(v) => !v && setAgrandie(null)}>
        <DialogContent className="rounded-2xl border-2 border-ink bg-paper p-3 shadow-[6px_6px_0_var(--color-ink)] sm:max-w-4xl">
          <DialogTitle className="sr-only">{agrandie?.titre || 'Photo'}</DialogTitle>
          {agrandie && (
            <figure>
              <img src={agrandie.url} alt={agrandie.titre ?? ''} className="max-h-[75vh] w-full rounded-xl object-contain" />
              {(agrandie.titre || agrandie.description) && (
                <figcaption className="mt-2 px-1 text-sm text-ink">
                  {agrandie.titre && <span className="font-bold">{agrandie.titre}</span>}
                  {agrandie.titre && agrandie.description && ' — '}
                  {agrandie.description && <span className="text-muted-foreground">{agrandie.description}</span>}
                </figcaption>
              )}
            </figure>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EnTete({ asso, nbMissions, nbPhotos }: { asso: AssociationPublique; nbMissions: number; nbPhotos: number }) {
  const photo = asso.photoProfil && /^https?:\/\//.test(asso.photoProfil) ? asso.photoProfil : null;
  const initiales = asso.nom.split(' ').map((w) => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || 'A';

  return (
    <section className="overflow-hidden rounded-2xl border-2 border-ink bg-white shadow-[6px_6px_0_var(--color-ink)]">
      <div className="h-24 border-b-2 border-ink bg-mustard sm:h-32" aria-hidden="true" />
      <div className="px-5 pb-6 sm:px-8">
        <div className="relative z-10 -mt-12 flex flex-wrap items-end gap-4 sm:-mt-14">
          {photo ? (
            <img src={photo} alt={asso.nom}
              className="h-24 w-24 rounded-2xl border-2 border-ink bg-white object-cover shadow-[4px_4px_0_var(--color-ink)] sm:h-28 sm:w-28" />
          ) : (
            <span aria-hidden="true"
              className="grid h-24 w-24 place-items-center rounded-2xl border-2 border-ink bg-ink font-display text-3xl font-black text-paper shadow-[4px_4px_0_var(--color-ink)] sm:h-28 sm:w-28">
              {initiales}
            </span>
          )}
          <div className="min-w-0 flex-1 pb-1">
            <h1 className="font-display text-3xl font-black leading-tight text-ink sm:text-4xl">{asso.nom}</h1>
            {asso.ville && (
              <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" aria-hidden="true" /> {asso.ville}
              </p>
            )}
          </div>
        </div>

        {asso.domaines.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-2">
            {asso.domaines.map((d) => (
              <span key={d} className="rounded-full border-2 border-ink bg-mustard/30 px-3 py-0.5 text-xs font-bold text-ink">{d}</span>
            ))}
          </div>
        )}

        <div className="mt-5 grid gap-6 md:grid-cols-[1fr_260px]">
          <p className="whitespace-pre-line text-sm leading-relaxed text-ink">
            {asso.description || <span className="italic text-muted-foreground">Aucune description renseignée.</span>}
          </p>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Chiffre valeur={nbMissions} label={nbMissions > 1 ? 'missions' : 'mission'} />
              <Chiffre valeur={nbPhotos} label={nbPhotos > 1 ? 'photos' : 'photo'} />
            </div>
            <ul className="space-y-1.5 text-sm text-muted-foreground">
              {asso.contact && (
                <li className="flex items-center gap-2"><Phone className="h-4 w-4 shrink-0" /> {asso.contact}</li>
              )}
              {asso.email && (
                <li className="flex items-center gap-2 break-all">
                  <Mail className="h-4 w-4 shrink-0" />
                  <a href={`mailto:${asso.email}`} className="hover:text-pink hover:underline">{asso.email}</a>
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

function Chiffre({ valeur, label }: { valeur: number; label: string }) {
  return (
    <div className="rounded-xl border-2 border-ink bg-paper px-3 py-2 text-center shadow-[2px_2px_0_var(--color-ink)]">
      <p className="font-display text-2xl font-black text-ink">{valeur}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

const MINIATURES = 4;

function CarteMission({ mission, onAgrandir }: { mission: MissionPublique; onAgrandir: (p: PhotoEvenement) => void }) {
  const { Icon, color, background } = missionPresentation(mission.domaine ?? '');
  const ouverte = STATUTS_OUVERTS.includes(mission.statut);
  const visibles = mission.photos.slice(0, MINIATURES);
  const reste = mission.photos.length - visibles.length;

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl border-2 border-ink bg-paper shadow-[4px_4px_0_var(--color-ink)]">
      <div className={`flex items-center justify-between gap-2 border-b-2 border-ink px-4 py-2.5 ${background} ${color}`}>
        <span className="flex min-w-0 items-center gap-2 text-xs font-black uppercase tracking-wide">
          <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="truncate">{mission.domaine ?? 'Mission'}</span>
        </span>
        <StatusBadge statut={mission.statut as MissionStatut} className="shrink-0" />
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <h3 className="font-display text-lg font-black leading-tight text-ink">{mission.titre}</h3>
        <div className="space-y-1 text-xs text-muted-foreground">
          <p className="flex items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5 shrink-0" /> {formaterDate(mission.dateDebut)}
          </p>
          {mission.adresse && (
            <p className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 shrink-0" /> {mission.adresse}</p>
          )}
          {ouverte && (
            <p className="flex items-center gap-1.5 font-semibold text-ink">
              <Users className="h-3.5 w-3.5 shrink-0" />
              {mission.placesRestantes > 0
                ? `${mission.placesRestantes} place${mission.placesRestantes > 1 ? 's' : ''} disponible${mission.placesRestantes > 1 ? 's' : ''}`
                : 'Complet — liste d\'attente'}
            </p>
          )}
        </div>
        {mission.description && <p className="line-clamp-3 text-sm text-muted-foreground">{mission.description}</p>}

        {/* Photos de l'événement */}
        {mission.photos.length > 0 ? (
          <div>
            <p className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-ink">
              <Camera className="h-3.5 w-3.5" /> {mission.photos.length} photo{mission.photos.length > 1 ? 's' : ''} de l'événement
            </p>
            <div className="grid grid-cols-4 gap-1.5">
              {visibles.map((p, i) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onAgrandir(p)}
                  className="relative aspect-square overflow-hidden rounded-lg border-2 border-ink"
                  aria-label={`Agrandir ${p.titre || 'la photo'}`}
                >
                  <img src={p.url} alt={p.titre ?? ''} loading="lazy" className="h-full w-full object-cover transition-transform hover:scale-110" />
                  {i === visibles.length - 1 && reste > 0 && (
                    <span className="absolute inset-0 grid place-items-center bg-ink/60 text-sm font-black text-paper">+{reste}</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        ) : !ouverte && (
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <ImageOff className="h-3.5 w-3.5" /> Pas encore de photos pour cette mission.
          </p>
        )}

        <Link
          to="/missions/$id"
          params={{ id: String(mission.id) }}
          className="mt-auto flex items-center justify-between rounded-xl border-2 border-ink bg-paper px-3 py-2 text-sm font-bold text-ink shadow-[2px_2px_0_var(--color-ink)] transition-colors hover:bg-mustard"
        >
          {ouverte ? 'Voir et participer' : 'Voir la mission'}
          <ArrowUpRight className="h-4 w-4 shrink-0" />
        </Link>
      </div>
    </article>
  );
}
