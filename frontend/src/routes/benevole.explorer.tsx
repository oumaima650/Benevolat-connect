import { createFileRoute, Link, useRouter } from '@tanstack/react-router';
import { useState, useEffect } from 'react';

type ExplorerSearch = {
  tab?: 'missions' | 'carte';
};
import {
  Search,
  LayoutList,
  LayoutGrid,
  CalendarDays,
  MapPin,
  Users,
  ChevronLeft,
  ChevronRight,
  Zap,
  Check,
  X,
  AlertCircle,
  Trophy,
  Clock,
  Sparkles,
  RefreshCw,
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
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import explorerApi, {
  type ExplorerMission,
  type ExplorerStats,
  type ExplorerFilters,
  type StatutInscription,
  type MissionCarte,
} from '@/services/explorerApi';
import { MissionMap } from '@/components/site/MissionMap';
import { formaterDate, MissionCard, MissionDetailDialog } from '@/components/explorer/ExplorerMissionCard';

const PAGE_SIZE = 10;

function DashboardStats({ stats, loading }: { stats: ExplorerStats | null; loading: boolean }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-28 rounded-2xl border-2 border-ink" />
        ))}
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-2xl border-2 border-ink bg-paper p-4 shadow-[4px_4px_0_var(--color-ink)]">
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-8 w-16" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Missions réalisées */}
      <div className="rounded-2xl border-2 border-ink bg-paper p-4 shadow-[4px_4px_0_var(--color-ink)]">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
          <Trophy className="h-4 w-4" />
          Missions réalisées
        </div>
        <p className="text-2xl font-black text-ink">{stats.missionsRealisees}</p>
      </div>

      {/* Inscriptions à venir */}
      <div className="rounded-2xl border-2 border-ink bg-paper p-4 shadow-[4px_4px_0_var(--color-ink)]">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
          <CalendarDays className="h-4 w-4" />
          Inscriptions à venir
        </div>
        <p className="text-2xl font-black text-ink">{stats.inscriptionsAVenir}</p>
      </div>

      {/* En liste d'attente */}
      <div className="rounded-2xl border-2 border-ink bg-paper p-4 shadow-[4px_4px_0_var(--color-ink)]">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
          <Clock className="h-4 w-4" />
          En liste d'attente
        </div>
        <div className="flex items-center gap-2">
          <p className="text-2xl font-black text-ink">{stats.enListeAttente}</p>
          {stats.renfortDisponiblePourMoi && (
            <span className="h-2 w-2 rounded-full bg-red-500" title="Renfort urgent disponible" />
          )}
        </div>
      </div>

      {/* Recommandations */}
      <Link
        to="/benevole/recommandations"
        className="rounded-2xl border-2 border-ink bg-mustard/20 p-4 shadow-[4px_4px_0_var(--color-ink)] hover:bg-mustard/30 transition-colors text-left"
      >
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
          <Sparkles className="h-4 w-4" />
          Missions qui me correspondent
        </div>
        <p className="text-2xl font-black text-ink">{stats.recommandations.nombre}</p>
        {stats.recommandations.meilleurScore && (
          <p className="text-xs text-muted-foreground mt-1">
            Meilleur score : {stats.recommandations.meilleurScore}%
          </p>
        )}
      </Link>
    </div>
  );
}

function NiveauBadge({ stats, loading }: { stats: ExplorerStats | null; loading: boolean }) {
  if (loading || !stats) {
    return (
      <div className="rounded-2xl border-2 border-ink bg-paper p-4 shadow-[4px_4px_0_var(--color-ink)]">
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  const progress = stats.niveau.seuilSuivant
    ? (stats.niveau.missionsActuelles / stats.niveau.seuilSuivant) * 100
    : 100;

  return (
    <div className="rounded-2xl border-2 border-ink bg-paper p-4 shadow-[4px_4px_0_var(--color-ink)]">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="h-5 w-5 text-mustard" />
            <div>
              <p className="text-lg font-bold text-ink">Niv. {stats.niveau.niveau} · {stats.niveau.nom}</p>
              {stats.dernierBadge && (
                <p className="text-xs text-muted-foreground">{stats.dernierBadge.nom}</p>
              )}
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{stats.niveau.missionsActuelles} missions</span>
              {stats.niveau.seuilSuivant ? (
                <span>{stats.niveau.seuilSuivant} pour le badge {stats.niveau.niveauSuivant}</span>
              ) : (
                <span>Tous les badges paliers débloqués</span>
              )}
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-mustard transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProchaineMission({ stats, loading, onExplore }: { stats: ExplorerStats | null; loading: boolean; onExplore: () => void }) {
  if (loading || !stats?.prochaineMission) {
    return (
      <div className="rounded-2xl border-2 border-ink bg-paper p-4 shadow-[4px_4px_0_var(--color-ink)]">
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  if (!stats.prochaineMission) {
    return (
      <div className="rounded-2xl border-2 border-ink bg-paper p-4 shadow-[4px_4px_0_var(--color-ink)] text-center">
        <CalendarDays className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
        <p className="text-sm font-semibold text-ink mb-2">Aucune mission prévue</p>
        <Button
          size="sm"
          onClick={onExplore}
          className="rounded-xl border-2 border-ink bg-pink font-bold text-pink-foreground shadow-[3px_3px_0_var(--color-ink)] hover:opacity-90"
        >
          Explorer les missions
        </Button>
      </div>
    );
  }

  const dateDebut = new Date(stats.prochaineMission.dateDebut);
  const now = new Date();
  const diff = dateDebut.getTime() - now.getTime();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

  return (
    <div className="rounded-2xl border-2 border-ink bg-paper p-4 shadow-[4px_4px_0_var(--color-ink)]">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
        <CalendarDays className="h-4 w-4" />
        Prochaine mission
      </div>
      <p className="font-bold text-ink mb-1">{stats.prochaineMission.titre}</p>
      <p className="text-xs text-muted-foreground mb-2">
        {stats.prochaineMission.ville} • {formaterDate(stats.prochaineMission.dateDebut)}
      </p>
      <div className="flex items-center gap-1.5 text-xs">
        <Clock className="h-3.5 w-3.5" />
        <span className="font-semibold text-ink">
          {days > 0 ? `Dans ${days} jour${days > 1 ? 's' : ''}` : 'Aujourd\'hui'}
        </span>
      </div>
    </div>
  );
}


function ExplorerMissions() {
  const { token, user } = useAuth();
  const router = useRouter();
  const search = Route.useSearch();
  const [tab, setTab] = useState<'missions' | 'carte'>(search.tab === 'carte' ? 'carte' : 'missions');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ExplorerStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Filtres pour l'onglet "Toutes les missions"
  const [searchText, setSearchText] = useState('');
  const [domaine, setDomaine] = useState('');
  const [ville, setVille] = useState('');
  const [date, setDate] = useState('');
  const [competences, setCompetences] = useState<number[]>([]);
  const [placesDisponibles, setPlacesDisponibles] = useState(false);
  const [filtreInscription, setFiltreInscription] = useState<'disponibles' | 'inscrites' | 'terminees' | 'toutes'>('disponibles');
  const [page, setPage] = useState(0);
  const [view, setView] = useState<'list' | 'grid'>('grid');

  // Données pour chaque onglet
  const [missions, setMissions] = useState<ExplorerMission[]>([]);
  const [carteMissions, setCarteMissions] = useState<MissionCarte[]>([]);

  // Catalogues
  const [domaines, setDomaines] = useState<{ id: number; nom: string }[]>([]);
  const [villes, setVilles] = useState<string[]>([]);
  const [competencesList, setCompetencesList] = useState<{ id: number; nom: string }[]>([]);

  // Détail
  const [detail, setDetail] = useState<ExplorerMission | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Certificat
  const [certificat, setCertificat] = useState<{
    codeVerification: string;
    dateDelivrance: string;
    missionTitre: string;
    missionDateDebut: string;
    missionDateFin: string;
    associationNom: string;
  } | null>(null);
  const [certificatLoading, setCertificatLoading] = useState(false);

  // Chargement des catalogues (une seule fois)
  useEffect(() => {
    async function loadCatalogues() {
      const [d, v, c] = await Promise.all([
        explorerApi.domaines(),
        explorerApi.villes(),
        explorerApi.competences(),
      ]);
      setDomaines(d);
      setVilles(v);
      setCompetencesList(c);
    }
    loadCatalogues();
  }, []);

  // Chargement des stats (uniquement pour les bénévoles)
  useEffect(() => {
    if (user?.role === 'BENEVOLE' && token) {
      setStatsLoading(true);
      explorerApi.stats(token)
        .then(setStats)
        .catch(() => setStats(null))
        .finally(() => setStatsLoading(false));
    }
  }, [token, user]);

  // Chargement des missions selon l'onglet
  useEffect(() => {
    if (!token) return;

    async function loadData() {
      setLoading(true);
      try {
        if (tab === 'missions') {
          if (filtreInscription === 'inscrites') {
            const data = await explorerApi.mesInscriptions(token, page);
            setMissions(data.content);
          } else if (filtreInscription === 'terminees') {
            const data = await explorerApi.mesInscriptionsTerminees(token);
            setMissions(data);
          } else {
            const filters: ExplorerFilters = {
              page,
              domaine: domaine || undefined,
              ville: ville || undefined,
              date: date || undefined,
              competences: competences.length > 0 ? competences : undefined,
              placesDisponibles: placesDisponibles || undefined,
              inclureInscrites: filtreInscription === 'toutes' ? true : undefined,
            };
            const data = await explorerApi.explorer(token, filters);
            setMissions(data.content);
          }
        } else if (tab === 'carte') {
          const data = await explorerApi.carte(token, {
            domaine: domaine || undefined,
            date: date || undefined,
          });
          setCarteMissions(data);
        }
      } catch (error) {
        console.error('Erreur de chargement:', error);
        toast.error('Erreur lors du chargement des missions');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [token, tab, page, domaine, ville, date, competences, placesDisponibles, filtreInscription]);

  function resetPage() {
    setPage(0);
  }

  async function handleInscrire(missionId: number) {
    if (!token) {
      toast.error('Connectez-vous pour vous inscrire');
      return;
    }

    try {
      await explorerApi.inscrire(token, missionId);
      toast.success('Inscription confirmée !');
      // Recharger les données
      if (tab === 'missions') {
        if (filtreInscription === 'inscrites') {
          const data = await explorerApi.mesInscriptions(token, page);
          setMissions(data.content);
        } else if (filtreInscription === 'terminees') {
          const data = await explorerApi.mesInscriptionsTerminees(token);
          setMissions(data);
        } else {
          const filters: ExplorerFilters = { page, domaine, ville, date, competences, placesDisponibles, inclureInscrites: filtreInscription === 'toutes' ? true : undefined };
          const data = await explorerApi.explorer(token, filters);
          setMissions(data.content);
        }
      }
      // Recharger les stats
      if (user?.role === 'BENEVOLE') {
        const newStats = await explorerApi.stats(token);
        setStats(newStats);
      }
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de l\'inscription');
    }
  }

  async function handleAnnuler(missionId: number) {
    if (!token) return;

    try {
      await explorerApi.annuler(token, missionId);
      toast.success('Inscription annulée');
      // Recharger les données
      if (tab === 'missions') {
        if (filtreInscription === 'inscrites') {
          const data = await explorerApi.mesInscriptions(token, page);
          setMissions(data.content);
        } else if (filtreInscription === 'terminees') {
          const data = await explorerApi.mesInscriptionsTerminees(token);
          setMissions(data);
        } else {
          const filters: ExplorerFilters = { page, domaine, ville, date, competences, placesDisponibles, inclureInscrites: filtreInscription === 'toutes' ? true : undefined };
          const data = await explorerApi.explorer(token, filters);
          setMissions(data.content);
        }
      }
      // Recharger les stats
      if (user?.role === 'BENEVOLE') {
        const newStats = await explorerApi.stats(token);
        setStats(newStats);
      }
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de l\'annulation');
    }
  }

  async function handleConfirmerRenfort(missionId: number) {
    if (!token) return;

    try {
      await explorerApi.confirmerRenfort(token, missionId);
      toast.success('Venue confirmée !');
      // Recharger les données
      if (tab === 'missions') {
        if (filtreInscription === 'inscrites') {
          const data = await explorerApi.mesInscriptions(token, page);
          setMissions(data.content);
        } else if (filtreInscription === 'terminees') {
          const data = await explorerApi.mesInscriptionsTerminees(token);
          setMissions(data);
        } else {
          const filters: ExplorerFilters = { page, domaine, ville, date, competences, placesDisponibles, inclureInscrites: filtreInscription === 'toutes' ? true : undefined };
          const data = await explorerApi.explorer(token, filters);
          setMissions(data.content);
        }
      }
      // Recharger les stats
      if (user?.role === 'BENEVOLE') {
        const newStats = await explorerApi.stats(token);
        setStats(newStats);
      }
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la confirmation');
    }
  }

  async function handleDetail(missionId: number) {
    if (!token) return;

    setDetailLoading(true);
    try {
      const data = await explorerApi.detail(token, missionId);
      setDetail(data);
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors du chargement du détail');
    } finally {
      setDetailLoading(false);
    }
  }

  async function handleVoirCertificat(missionId: number) {
    if (!token) return;

    setCertificatLoading(true);
    try {
      const data = await explorerApi.getCertificat(token, missionId);
      setCertificat(data);
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors du chargement du certificat');
    } finally {
      setCertificatLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-black text-ink">Explorer les missions</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Trouvez la mission qui vous correspond.
        </p>
      </div>

      {/* Mini-dashboard (bénévoles uniquement) */}
      {user?.role === 'BENEVOLE' && (
        <>
          <DashboardStats stats={stats} loading={statsLoading} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <NiveauBadge stats={stats} loading={statsLoading} />
            <ProchaineMission stats={stats} loading={statsLoading} onExplore={() => router.navigate({ to: '/benevole/explorer', search: { tab: 'missions' } })} />
          </div>
        </>
      )}

      {/* Onglets */}
      <div className="flex gap-2 border-b-2 border-ink pb-1">
        <button
          onClick={() => { setTab('missions'); resetPage(); }}
          className={cn(
            'px-4 py-2 text-sm font-bold transition-colors rounded-t-lg',
            tab === 'missions' ? 'bg-mustard text-ink' : 'text-muted-foreground hover:bg-muted',
          )}
        >
          Toutes les missions
        </button>
        <button
          onClick={() => { setTab('carte'); }}
          className={cn(
            'px-4 py-2 text-sm font-bold transition-colors rounded-t-lg',
            tab === 'carte' ? 'bg-mustard text-ink' : 'text-muted-foreground hover:bg-muted',
          )}
        >
          Carte
        </button>
      </div>

      {/* Filtres (onglet missions) */}
      {tab === 'missions' && (
        <div className="rounded-2xl border-2 border-ink bg-paper p-4 shadow-[4px_4px_0_var(--color-ink)]">
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                placeholder="Rechercher une mission…"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="pl-9 border-2 border-ink rounded-xl"
              />
            </div>
            <Select value={domaine} onValueChange={(v) => { setDomaine(v); resetPage(); }}>
              <SelectTrigger className="w-40 border-2 border-ink rounded-xl">
                <SelectValue placeholder="Domaine" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Tous</SelectItem>
                {domaines.map((d) => (
                  <SelectItem key={d.id} value={d.nom}>{d.nom}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={ville} onValueChange={(v) => { setVille(v); resetPage(); }}>
              <SelectTrigger className="w-40 border-2 border-ink rounded-xl">
                <SelectValue placeholder="Ville" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Toutes</SelectItem>
                {villes.map((v) => (
                  <SelectItem key={v} value={v}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="date"
              value={date}
              onChange={(e) => { setDate(e.target.value); resetPage(); }}
              className="w-40 border-2 border-ink rounded-xl"
            />
            <Select value={filtreInscription} onValueChange={(v: 'disponibles' | 'inscrites' | 'terminees' | 'toutes') => { setFiltreInscription(v); resetPage(); }}>
              <SelectTrigger className="w-40 border-2 border-ink rounded-xl">
                <SelectValue placeholder="Filtre" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="disponibles">Disponibles</SelectItem>
                <SelectItem value="inscrites">Mes inscriptions</SelectItem>
                <SelectItem value="terminees">Terminées</SelectItem>
                <SelectItem value="toutes">Toutes</SelectItem>
              </SelectContent>
            </Select>
            <label className="flex items-center gap-2 text-sm text-ink cursor-pointer">
              <input
                type="checkbox"
                checked={placesDisponibles}
                onChange={(e) => { setPlacesDisponibles(e.target.checked); resetPage(); }}
                className="rounded border-ink"
              />
              Uniquement avec des places
            </label>

            {/* View toggle */}
            <div className="flex rounded-xl border-2 border-ink overflow-hidden ml-auto">
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
      )}

      {/* Filtres (onglet carte) */}
      {tab === 'carte' && (
        <div className="flex flex-wrap gap-3 rounded-2xl border-2 border-ink bg-paper p-4 shadow-[4px_4px_0_var(--color-ink)]">
          <Select value={domaine} onValueChange={setDomaine}>
            <SelectTrigger className="w-44 border-2 border-ink rounded-xl">
              <SelectValue placeholder="Domaine" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Tous</SelectItem>
              {domaines.map((d) => (
                <SelectItem key={d.id} value={d.nom}>{d.nom}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-44 border-2 border-ink rounded-xl"
            aria-label="Filtrer par date"
          />
          <div className="flex items-center gap-3 text-xs text-muted-foreground ml-auto">
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-green-500 border border-ink inline-block" aria-hidden="true" />
              Disponible
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-orange-400 border border-ink inline-block" aria-hidden="true" />
              Saturée
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-red-500 border border-ink inline-block" aria-hidden="true" />
              Urgent
            </span>
          </div>
        </div>
      )}

      {/* Contenu selon l'onglet */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-64 rounded-2xl border-2 border-ink" />
          ))}
        </div>
      ) : tab === 'missions' ? (
        <>
          {missions.length === 0 ? (
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
              {missions.map((m) => (
                <MissionCard
                  key={m.id}
                  mission={m}
                  onDetail={() => handleDetail(m.id)}
                  onInscrire={() => handleInscrire(m.id)}
                  onAnnuler={() => handleAnnuler(m.id)}
                  onConfirmerRenfort={() => handleConfirmerRenfort(m.id)}
                  onVoirCertificat={() => handleVoirCertificat(m.id)}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {page > 0 && (
            <div className="flex items-center justify-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="rounded-xl border-2 border-ink shadow-[2px_2px_0_var(--color-ink)]"
                aria-label="Page précédente"
              >
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              </Button>
              <span className="text-sm font-semibold text-ink">
                Page {page + 1}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p + 1)}
                disabled={missions.length < PAGE_SIZE}
                className="rounded-xl border-2 border-ink shadow-[2px_2px_0_var(--color-ink)]"
                aria-label="Page suivante"
              >
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
          )}
        </>
      ) : tab === 'carte' ? (
        <div className="rounded-2xl overflow-hidden border-2 border-ink shadow-[4px_4px_0_var(--color-ink)]" style={{ height: 'calc(100vh - 14rem)' }}>
          {carteMissions.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">Aucune mission géolocalisée trouvée</p>
            </div>
          ) : (
            <MissionMap
              missions={carteMissions.map((m) => ({
                id: String(m.id),
                titre: m.titre,
                description: '',
                domaine: m.domaine || '',
                association: m.associationNom || '',
                adresse: null,
                ville: m.ville || '',
                lat: m.latitude ? Number(m.latitude) : null,
                lng: m.longitude ? Number(m.longitude) : null,
                date: m.dateDebut,
                placesRestantes: m.placesRestantes,
                placesDemandees: m.placesRestantes + (m.statut === 'SATUREE' ? 0 : 5),
                listeAttente: 0,
              }))}
              selectedId={null}
              onSelect={(id) => handleDetail(Number(id))}
              className="h-full"
              zoom={6}
            />
          )}
        </div>
      ) : null}

      <MissionDetailDialog detail={detail} loading={detailLoading} onClose={() => setDetail(null)} />

      {/* Certificat Dialog */}
      <Dialog open={!!certificat} onOpenChange={(v) => !v && setCertificat(null)}>
        <DialogContent className="max-w-lg border-2 border-ink shadow-[4px_4px_0_var(--color-ink)]">
          {certificatLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : certificat && (
            <>
              <DialogHeader>
                <DialogTitle className="font-display text-xl font-black text-ink flex items-center gap-2">
                  <Trophy className="h-6 w-6 text-mustard" />
                  Certificat de participation
                </DialogTitle>
                <DialogDescription asChild>
                  <div className="space-y-4 pt-2">
                    <div className="rounded-xl bg-mustard/10 border-2 border-mustard p-4">
                      <p className="text-sm font-bold text-ink mb-2">Code de vérification</p>
                      <p className="text-lg font-mono font-black text-ink tracking-wider">{certificat.codeVerification}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-ink">{certificat.missionTitre}</p>
                      <p className="text-sm text-muted-foreground">{certificat.associationNom}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CalendarDays className="h-4 w-4" />
                        {formaterDate(certificat.missionDateDebut)} — {formaterDate(certificat.missionDateFin)}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        Délivré le {formaterDate(certificat.dateDelivrance)}
                      </div>
                    </div>
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

export const Route = createFileRoute('/benevole/explorer')({
  component: ExplorerMissions,
  validateSearch: (search: Record<string, unknown>): ExplorerSearch => ({
    tab: search['tab'] === 'carte' ? 'carte' : 'missions',
  }),
});
