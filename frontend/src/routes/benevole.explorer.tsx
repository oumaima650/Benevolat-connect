import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import {
  Search,
  LayoutList,
  LayoutGrid,
  CalendarDays,
  MapPin,
  Users,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { StatusBadge } from '@/components/dashboard/StatusBadge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { formaterDate, type MissionDash } from '@/components/dashboard/data';
import { cn } from '@/lib/utils';

export const Route = createFileRoute('/benevole/explorer')({
  component: ExplorerMissions,
});

const MISSIONS_FICTIVES: MissionDash[] = [
  {
    id: 'e1', titre: 'Distribution de repas solidaires', association: 'Banque Alimentaire Tanger',
    domaine: 'Solidarité', ville: 'Tanger', adresse: 'Bd Mohammed V, Tanger',
    lat: 35.7595, lng: -5.834, dateDebut: '2026-09-15', dateFin: '2026-09-15',
    placesTotal: 15, placesConfirmees: 12, listeAttente: 3, statut: 'EN_COURS',
    competences: ['Logistique', 'Cuisine'],
    description: 'Aidez-nous à distribuer des repas chauds aux familles dans le besoin chaque weekend à Tanger.',
  },
  {
    id: 'e2', titre: "Plantation d'arbres en forêt de Bouhachem", association: 'Vert Maroc',
    domaine: 'Environnement', ville: 'Tétouan', adresse: 'Forêt Bouhachem, route de Chefchaouen',
    lat: 35.5704, lng: -5.3786, dateDebut: '2026-10-03', dateFin: '2026-10-03',
    placesTotal: 30, placesConfirmees: 14, listeAttente: 0, statut: 'PUBLIEE',
    competences: ['Jardinage'],
    description: 'Rejoignez-nous pour planter 500 arbres dans la forêt de Bouhachem. Matériel fourni.',
  },
  {
    id: 'e3', titre: 'Soutien scolaire pour lycéens', association: 'Association Avenir Rabat',
    domaine: 'Éducation', ville: 'Rabat', adresse: 'Lycée Ibn Rochd, Agdal',
    lat: 33.9716, lng: -6.8498, dateDebut: '2026-09-20', dateFin: '2026-12-20',
    placesTotal: 10, placesConfirmees: 10, listeAttente: 5, statut: 'COMPLETE',
    competences: ['Enseignement'],
    description: 'Accompagnez des lycéens en difficulté pour les préparer au baccalauréat.',
  },
  {
    id: 'e4', titre: "Collecte de vêtements d'hiver", association: 'Solidarité Nord',
    domaine: 'Solidarité', ville: 'Tétouan', adresse: 'Centre communautaire Martil',
    lat: 35.6138, lng: -5.3646, dateDebut: '2026-11-01', dateFin: '2026-11-30',
    placesTotal: 8, placesConfirmees: 3, listeAttente: 12, statut: 'RENFORT_URGENT',
    competences: ['Logistique'],
    description: "Collecte urgente de vêtements chauds avant l'hiver pour les familles vulnérables.",
  },
  {
    id: 'e5', titre: 'Atelier numérique pour seniors', association: 'Association Nour',
    domaine: 'Éducation', ville: 'Tétouan', adresse: 'Maison des associations, rue Sania',
    lat: 35.5714, lng: -5.3749, dateDebut: '2026-10-15', dateFin: '2026-12-15',
    placesTotal: 6, placesConfirmees: 0, listeAttente: 0, statut: 'PUBLIEE',
    competences: ['Informatique', 'Pédagogie'],
    description: 'Initiation aux outils numériques pour les personnes âgées du quartier.',
  },
  {
    id: 'e6', titre: 'Nettoyage de la plage Malabata', association: 'Éco Tanger',
    domaine: 'Environnement', ville: 'Tanger', adresse: 'Plage Malabata, Tanger',
    lat: 35.7882, lng: -5.7200, dateDebut: '2026-10-20', dateFin: '2026-10-20',
    placesTotal: 40, placesConfirmees: 28, listeAttente: 0, statut: 'PUBLIEE',
    competences: [],
    description: 'Grande journée de nettoyage de la plage Malabata avec tous les volontaires de la région.',
  },
  {
    id: 'e7', titre: 'Animation centre de jour personnes âgées', association: 'Bien-Être Rabat',
    domaine: 'Social', ville: 'Rabat', adresse: 'Centre de jour Hay Riad, Rabat',
    lat: 33.9900, lng: -6.8600, dateDebut: '2026-10-01', dateFin: '2027-03-31',
    placesTotal: 5, placesConfirmees: 3, listeAttente: 0, statut: 'PUBLIEE',
    competences: ['Animation', 'Communication'],
    description: 'Animez des ateliers créatifs et des sorties pour les résidents du centre de jour.',
  },
  {
    id: 'e8', titre: 'Tournoi sportif caritatif', association: 'Sport & Solidarité Tétouan',
    domaine: 'Sport', ville: 'Tétouan', adresse: 'Stade municipal de Tétouan',
    lat: 35.5750, lng: -5.3600, dateDebut: '2026-11-15', dateFin: '2026-11-15',
    placesTotal: 20, placesConfirmees: 15, listeAttente: 2, statut: 'PUBLIEE',
    competences: ['Organisation', 'Sport'],
    description: 'Organisation du tournoi sportif annuel au profit des familles défavorisées.',
  },
  {
    id: 'e9', titre: "Aide aux devoirs — quartier Azla", association: 'Jeunesse Active Tétouan',
    domaine: 'Éducation', ville: 'Tétouan', adresse: "École primaire Azla, Tétouan",
    lat: 35.5680, lng: -5.3800, dateDebut: '2026-09-22', dateFin: '2026-12-22',
    placesTotal: 8, placesConfirmees: 6, listeAttente: 1, statut: 'PUBLIEE',
    competences: ['Enseignement'],
    description: 'Appui scolaire pour les enfants du quartier Azla, 2 fois par semaine.',
  },
  {
    id: 'e10', titre: 'Campagne de sensibilisation au don de sang', association: 'Croissant-Rouge Maroc',
    domaine: 'Santé', ville: 'Tanger', adresse: 'Centre hospitalier Ibn Battuta, Tanger',
    lat: 35.7720, lng: -5.8100, dateDebut: '2026-10-10', dateFin: '2026-10-10',
    placesTotal: 12, placesConfirmees: 7, listeAttente: 0, statut: 'PUBLIEE',
    competences: ['Communication', 'Santé'],
    description: 'Sensibilisation au don de sang auprès du grand public lors d\'une journée nationale.',
  },
  {
    id: 'e11', titre: 'Jardin partagé — Médina Chefchaouen', association: 'Vertes Initiatives',
    domaine: 'Environnement', ville: 'Chefchaouen', adresse: 'Jardin communautaire Bab El Ain, Chefchaouen',
    lat: 35.1710, lng: -5.2635, dateDebut: '2026-10-25', dateFin: '2026-10-25',
    placesTotal: 15, placesConfirmees: 15, listeAttente: 4, statut: 'COMPLETE',
    competences: ['Jardinage'],
    description: 'Entretien collectif du jardin partagé de la médina et ateliers plantation.',
  },
  {
    id: 'e12', titre: 'Bibliothèque mobile rurale', association: 'Lecture Pour Tous',
    domaine: 'Éducation', ville: 'Tétouan', adresse: 'Douars environs de Tétouan',
    lat: 35.5200, lng: -5.4000, dateDebut: '2026-11-05', dateFin: '2026-11-05',
    placesTotal: 10, placesConfirmees: 4, listeAttente: 0, statut: 'PUBLIEE',
    competences: ['Communication'],
    description: "Amener des livres et des ateliers lecture dans les villages ruraux autour de Tétouan.",
  },
  {
    id: 'e13', titre: 'Soutien psychologique post-séisme', association: 'Santé Mentale Maroc',
    domaine: 'Santé', ville: 'Marrakech', adresse: 'Centre communautaire Gueliz, Marrakech',
    lat: 31.6295, lng: -7.9811, dateDebut: '2026-10-12', dateFin: '2026-12-12',
    placesTotal: 8, placesConfirmees: 2, listeAttente: 6, statut: 'RENFORT_URGENT',
    competences: ['Psychologie', 'Écoute'],
    description: 'Accompagnement des populations affectées. Formation préalable assurée.',
  },
  {
    id: 'e14', titre: 'Restauration façades médina Salé', association: 'Patrimoine Salé',
    domaine: 'Culture', ville: 'Salé', adresse: 'Médina de Salé, bab El Mrissa',
    lat: 34.0360, lng: -6.8200, dateDebut: '2026-11-20', dateFin: '2026-11-22',
    placesTotal: 25, placesConfirmees: 10, listeAttente: 0, statut: 'PUBLIEE',
    competences: ['Artisanat'],
    description: 'Rénovation participative des façades de la médina de Salé, encadrée par des artisans.',
  },
  {
    id: 'e15', titre: "Cours d'alphabétisation femmes rurales", association: 'Femmes & Avenir',
    domaine: 'Éducation', ville: 'Tétouan', adresse: 'Association Femmes & Avenir, rue Semia Bensouda',
    lat: 35.5740, lng: -5.3710, dateDebut: '2026-09-28', dateFin: '2026-12-28',
    placesTotal: 6, placesConfirmees: 4, listeAttente: 0, statut: 'PUBLIEE',
    competences: ['Enseignement'],
    description: "Cours d'alphabétisation et de calcul pour les femmes rurales en partenariat avec le ministère.",
  },
];

const DOMAINES = ['Tous', 'Solidarité', 'Environnement', 'Éducation', 'Sport', 'Santé', 'Culture', 'Social'];
const VILLES = ['Toutes', 'Tanger', 'Tétouan', 'Rabat', 'Chefchaouen', 'Salé', 'Marrakech'];
const STATUTS = [
  { value: 'Tous', label: 'Tous les statuts' },
  { value: 'PUBLIEE', label: 'Publiée' },
  { value: 'COMPLETE', label: 'Complète' },
  { value: 'EN_COURS', label: 'En cours' },
  { value: 'RENFORT_URGENT', label: 'Renfort urgent' },
];

const PAGE_SIZE = 10;

function MissionCard({ mission, onDetail }: { mission: MissionDash; onDetail: () => void }) {
  const [inscrit, setInscrit] = useState(false);
  const placesRestantes = mission.placesTotal - mission.placesConfirmees;
  const isComplete = placesRestantes === 0 || mission.statut === 'COMPLETE';
  const isUrgent = mission.statut === 'RENFORT_URGENT';

  function handleInscription(e: React.MouseEvent) {
    e.stopPropagation();
    if (isComplete) {
      toast.info("📋 Ajouté à la liste d'attente");
    } else {
      setInscrit(true);
      toast.success('✅ Inscription confirmée !');
    }
  }

  return (
    <article
      className={cn(
        'relative flex flex-col overflow-hidden rounded-2xl border-2 border-ink bg-paper shadow-[4px_4px_0_var(--color-ink)] transition-transform duration-200 hover:-translate-y-1 cursor-pointer',
        isUrgent && 'border-red-400',
      )}
      onClick={onDetail}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onDetail()}
      aria-label={`Voir les détails de ${mission.titre}`}
    >
      {isUrgent && (
        <div className="bg-red-500 px-4 py-1 text-center text-xs font-bold text-white">
          ⚡ Renfort urgent
        </div>
      )}
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-muted-foreground">{mission.association}</p>
            <h3 className="mt-1 text-base font-bold leading-tight text-ink">{mission.titre}</h3>
          </div>
          <StatusBadge statut={mission.statut} className="shrink-0" />
        </div>

        <div className="mt-3 space-y-1.5 text-xs text-muted-foreground">
          <p className="flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" /> {mission.adresse}
          </p>
          <p className="flex items-center gap-2">
            <CalendarDays className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            {formaterDate(mission.dateDebut)}
            {mission.dateDebut !== mission.dateFin && <> → {formaterDate(mission.dateFin)}</>}
          </p>
        </div>

        <span className="mt-3 inline-block w-fit rounded-full border border-mustard bg-mustard/20 px-2.5 py-0.5 text-xs font-semibold text-ink">
          {mission.domaine}
        </span>

        <div className="mt-3 flex items-center gap-4 text-xs">
          <span
            className={cn(
              'flex items-center gap-1 font-semibold',
              placesRestantes > 0 ? 'text-green-700' : 'text-orange-700',
            )}
          >
            <Users className="h-3.5 w-3.5" aria-hidden="true" />
            {placesRestantes > 0
              ? `${placesRestantes} place${placesRestantes > 1 ? 's' : ''} restante${placesRestantes > 1 ? 's' : ''}`
              : 'Complet'}
            <span className="text-muted-foreground font-normal">/ {mission.placesTotal}</span>
          </span>
          {mission.listeAttente > 0 && (
            <span className="text-muted-foreground">{mission.listeAttente} en attente</span>
          )}
        </div>

        <Button
          size="sm"
          onClick={handleInscription}
          disabled={inscrit}
          className={cn(
            'mt-4 w-full rounded-xl border-2 border-ink font-bold shadow-[3px_3px_0_var(--color-ink)]',
            inscrit
              ? 'bg-green-100 text-green-800 border-green-300'
              : isComplete
                ? 'bg-orange-100 text-orange-800 border-orange-300 hover:bg-orange-200'
                : 'bg-pink text-pink-foreground hover:opacity-90',
          )}
        >
          {inscrit ? '✓ Inscrit' : isComplete ? "Rejoindre la liste d'attente" : "S'inscrire"}
        </Button>
      </div>
    </article>
  );
}

function ExplorerMissions() {
  const [search, setSearch] = useState('');
  const [domaine, setDomaine] = useState('Tous');
  const [ville, setVille] = useState('Toutes');
  const [statut, setStatut] = useState('Tous');
  const [view, setView] = useState<'list' | 'grid'>('grid');
  const [page, setPage] = useState(1);
  const [detail, setDetail] = useState<MissionDash | null>(null);

  const filtered = MISSIONS_FICTIVES.filter((m) => {
    const matchSearch =
      search === '' ||
      m.titre.toLowerCase().includes(search.toLowerCase()) ||
      m.association.toLowerCase().includes(search.toLowerCase());
    const matchDomaine = domaine === 'Tous' || m.domaine === domaine;
    const matchVille = ville === 'Toutes' || m.ville === ville;
    const matchStatut = statut === 'Tous' || m.statut === statut;
    return matchSearch && matchDomaine && matchVille && matchStatut;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function resetPage() {
    setPage(1);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-black text-ink">Explorer les missions</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {filtered.length} mission{filtered.length > 1 ? 's' : ''} trouvée
          {filtered.length > 1 ? 's' : ''}
        </p>
      </div>

      {/* Filters */}
      <div className="rounded-2xl border-2 border-ink bg-paper p-4 shadow-[4px_4px_0_var(--color-ink)]">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              placeholder="Rechercher une mission…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                resetPage();
              }}
              className="pl-9 border-2 border-ink rounded-xl"
            />
          </div>
          <Select value={domaine} onValueChange={(v) => { setDomaine(v); resetPage(); }}>
            <SelectTrigger className="w-40 border-2 border-ink rounded-xl">
              <SelectValue placeholder="Domaine" />
            </SelectTrigger>
            <SelectContent>
              {DOMAINES.map((d) => (
                <SelectItem key={d} value={d}>{d}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={ville} onValueChange={(v) => { setVille(v); resetPage(); }}>
            <SelectTrigger className="w-40 border-2 border-ink rounded-xl">
              <SelectValue placeholder="Ville" />
            </SelectTrigger>
            <SelectContent>
              {VILLES.map((v) => (
                <SelectItem key={v} value={v}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statut} onValueChange={(v) => { setStatut(v); resetPage(); }}>
            <SelectTrigger className="w-48 border-2 border-ink rounded-xl">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              {STATUTS.map((s) => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* View toggle */}
          <div className="flex rounded-xl border-2 border-ink overflow-hidden">
            <button
              onClick={() => setView('grid')}
              className={cn(
                'px-3 py-2 transition-colors',
                view === 'grid' ? 'bg-mustard text-ink font-bold' : 'bg-paper text-muted-foreground hover:bg-muted',
              )}
              aria-label="Vue grille"
            >
              <LayoutGrid className="h-4 w-4" aria-hidden="true" />
            </button>
            <button
              onClick={() => setView('list')}
              className={cn(
                'px-3 py-2 transition-colors border-l-2 border-ink',
                view === 'list' ? 'bg-mustard text-ink font-bold' : 'bg-paper text-muted-foreground hover:bg-muted',
              )}
              aria-label="Vue liste"
            >
              <LayoutList className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      {/* Mission cards */}
      {pageItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Search className="h-12 w-12 text-muted-foreground mb-4" aria-hidden="true" />
          <p className="font-semibold text-ink">Aucune mission trouvée</p>
          <p className="text-sm text-muted-foreground mt-1">Essayez de modifier vos filtres.</p>
        </div>
      ) : (
        <div
          className={cn(
            view === 'grid' ? 'grid gap-4 sm:grid-cols-2 xl:grid-cols-3' : 'flex flex-col gap-4',
          )}
        >
          {pageItems.map((m) => (
            <MissionCard key={m.id} mission={m} onDetail={() => setDetail(m)} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-xl border-2 border-ink shadow-[2px_2px_0_var(--color-ink)]"
            aria-label="Page précédente"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </Button>
          <span className="text-sm font-semibold text-ink">
            Page {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="rounded-xl border-2 border-ink shadow-[2px_2px_0_var(--color-ink)]"
            aria-label="Page suivante"
          >
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!detail} onOpenChange={(v) => !v && setDetail(null)}>
        <DialogContent className="max-w-lg border-2 border-ink shadow-[4px_4px_0_var(--color-ink)]">
          {detail && (
            <>
              <DialogHeader>
                <DialogTitle className="font-display text-xl font-black text-ink">
                  {detail.titre}
                </DialogTitle>
                <DialogDescription asChild>
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <StatusBadge statut={detail.statut} />
                      <span className="rounded-full border border-mustard bg-mustard/20 px-2.5 py-0.5 text-xs font-semibold text-ink">
                        {detail.domaine}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-muted-foreground">{detail.association}</p>
                    <div className="space-y-1.5 text-sm text-muted-foreground">
                      <p className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />
                        {detail.adresse}
                      </p>
                      <p className="flex items-center gap-2">
                        <CalendarDays className="h-4 w-4 shrink-0" aria-hidden="true" />
                        {formaterDate(detail.dateDebut)} — {formaterDate(detail.dateFin)}
                      </p>
                      <p className="flex items-center gap-2">
                        <Users className="h-4 w-4 shrink-0" aria-hidden="true" />
                        {detail.placesTotal - detail.placesConfirmees} places restantes /{' '}
                        {detail.placesTotal} total
                      </p>
                    </div>
                    {detail.description && (
                      <p className="text-sm text-ink border-t border-ink/10 pt-3">
                        {detail.description}
                      </p>
                    )}
                    {detail.competences.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 border-t border-ink/10 pt-3">
                        {detail.competences.map((c) => (
                          <span
                            key={c}
                            className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground border border-ink/20"
                          >
                            {c}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </DialogDescription>
              </DialogHeader>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
