import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';
import {
  AlertCircle,
  CalendarDays,
  Check,
  MapPin,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Users,
  Wifi,
  X,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { StatusBadge } from '@/components/dashboard/StatusBadge';
import { ExplorerMiniDashboard } from '@/components/dashboard/ExplorerMiniDashboard';
import { MissionExplorerCard } from '@/components/dashboard/MissionExplorerCard';
import {
  resolveMissionAction,
  toneForStatut,
  TONE_CLASSES,
  TONE_MARKER_COLORS,
  type MissionActionContext,
  type MissionActionKind,
} from '@/components/dashboard/missionAction';
import { formaterDate } from '@/components/dashboard/data';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { ApiHttpError } from '@/services/benevoleApi';
import explorerApi, {
  type CompetenceOption,
  type DomaineOption,
  type ExplorerMission,
  type ExplorerPage,
  type ExplorerStats,
  type MissionCarte,
} from '@/services/explorerApi';
import type { MapMarker } from '@/components/dashboard/MapComponent';

const MapComponent = lazy(() => import('@/components/dashboard/MapComponent'));

export type ExplorerTabKey = 'toutes' | 'recommandees' | 'carte';

interface ExplorerMissionsProps {
  /** Onglet ouvert au chargement (le menu latéral pointe vers l'un des trois). */
  initialTab?: ExplorerTabKey;
}

/** Sentinelle Radix Select : une valeur vide n'est pas sélectionnable. */
const TOUS = 'all';

function messageErreur(err: unknown, fallback: string): string {
  return err instanceof Error && err.message ? err.message : fallback;
}

function carteVersMarqueur(m: MissionCarte): MapMarker | null {
  if (m.latitude == null || m.longitude == null) return null;
  return {
    id: m.id,
    titre: m.titre,
    lat: Number(m.latitude),
    lng: Number(m.longitude),
    lieu: m.ville ?? 'Lieu non précisé',
    date: formaterDate(m.dateDebut),
    places: m.placesRestantes,
    statut: m.statut,
    color: TONE_MARKER_COLORS[toneForStatut(m.statut)],
  };
}

/**
 * Page « Explorer les missions » de l'espace bénévole.
 *
 * Page unique : mini-dashboard + 3 onglets (Toutes / Recommandées / Carte).
 * Aucune règle métier n'est appliquée ici : le backend revérifie tout (RM13),
 * le frontend se contente de rendre ce qu'il reçoit via une fonction unique
 * (`resolveMissionAction`).
 */
export function ExplorerMissions({ initialTab = 'toutes' }: ExplorerMissionsProps) {
  const { token, user, logout } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab] = useState<ExplorerTabKey>(initialTab);
  /** Incrémenté après chaque action pour rafraîchir stats + listes. */
  const [version, setVersion] = useState(0);

  // ── Catalogue (filtres) ──────────────────────────────────────────────────
  const [domaines, setDomaines] = useState<DomaineOption[]>([]);
  const [competences, setCompetences] = useState<CompetenceOption[]>([]);
  const [villes, setVilles] = useState<string[]>([]);

  // ── Filtres « Toutes les missions » ──────────────────────────────────────
  const [domaine, setDomaine] = useState(TOUS);
  const [ville, setVille] = useState(TOUS);
  const [date, setDate] = useState('');
  const [competenceIds, setCompetenceIds] = useState<number[]>([]);
  const [placesSeulement, setPlacesSeulement] = useState(false);
  const [page, setPage] = useState(0);

  // ── Filtres « Carte » ────────────────────────────────────────────────────
  const [carteDomaine, setCarteDomaine] = useState(TOUS);
  const [carteDate, setCarteDate] = useState('');

  // ── Données ──────────────────────────────────────────────────────────────
  const [stats, setStats] = useState<ExplorerStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsFailed, setStatsFailed] = useState(false);

  const [pageData, setPageData] = useState<ExplorerPage | null>(null);
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);

  const [recos, setRecos] = useState<ExplorerMission[]>([]);
  const [recosLoading, setRecosLoading] = useState(false);
  const [recosError, setRecosError] = useState<string | null>(null);

  const [marqueurs, setMarqueurs] = useState<MapMarker[]>([]);
  const [carteLoading, setCarteLoading] = useState(false);
  const [carteError, setCarteError] = useState<string | null>(null);

  const [detail, setDetail] = useState<ExplorerMission | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);

  // Le menu latéral pointe vers les trois routes ; on suit le changement d'onglet.
  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  /** Purge la session et renvoie vers la connexion si le JWT est invalide/expiré. */
  const gererErreurAuth = useCallback(
    (err: unknown): boolean => {
      if (err instanceof ApiHttpError && (err.status === 401 || err.status === 403)) {
        logout();
        toast.error('Session invalide ou expirée. Reconnectez-vous.');
        void navigate({ to: '/login' });
        return true;
      }
      return false;
    },
    [logout, navigate],
  );

  // Catalogue des filtres (une seule fois).
  useEffect(() => {
    let cancelled = false;
    void Promise.all([explorerApi.domaines(), explorerApi.competences(), explorerApi.villes()]).then(
      ([listeDomaines, listeCompetences, listeVilles]) => {
        if (cancelled) return;
        setDomaines(listeDomaines);
        setCompetences(listeCompetences);
        setVilles(listeVilles);
      },
    );
    return () => {
      cancelled = true;
    };
  }, []);

  // Mini-dashboard.
  useEffect(() => {
    if (!token) {
      setStatsLoading(false);
      setStatsFailed(true);
      return;
    }
    let cancelled = false;
    setStatsLoading(true);
    setStatsFailed(false);
    explorerApi
      .stats(token)
      .then((payload) => {
        if (!cancelled) setStats(payload);
      })
      .catch((err) => {
        if (cancelled || gererErreurAuth(err)) return;
        setStats(null);
        setStatsFailed(true);
      })
      .finally(() => {
        if (!cancelled) setStatsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token, version, gererErreurAuth]);

  // Onglet « Toutes les missions » (pagination serveur, 10 par page).
  useEffect(() => {
    if (!token || tab !== 'toutes') return;
    let cancelled = false;
    setListLoading(true);
    setListError(null);
    explorerApi
      .explorer(token, {
        page,
        domaine: domaine === TOUS ? undefined : domaine,
        ville: ville === TOUS ? undefined : ville,
        date: date || undefined,
        competences: competenceIds.length ? competenceIds : undefined,
        placesDisponibles: placesSeulement || undefined,
      })
      .then((payload) => {
        if (!cancelled) setPageData(payload);
      })
      .catch((err) => {
        if (cancelled || gererErreurAuth(err)) return;
        setPageData(null);
        setListError(messageErreur(err, 'Erreur lors du chargement des missions.'));
      })
      .finally(() => {
        if (!cancelled) setListLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token, tab, page, domaine, ville, date, competenceIds, placesSeulement, version, gererErreurAuth]);

  // Onglet « Recommandées pour moi ».
  useEffect(() => {
    if (!token || tab !== 'recommandees') return;
    let cancelled = false;
    setRecosLoading(true);
    setRecosError(null);
    explorerApi
      .recommandations(token)
      .then((payload) => {
        if (!cancelled) setRecos(payload);
      })
      .catch((err) => {
        if (cancelled || gererErreurAuth(err)) return;
        setRecos([]);
        setRecosError(messageErreur(err, 'Erreur lors du chargement des recommandations.'));
      })
      .finally(() => {
        if (!cancelled) setRecosLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token, tab, version, gererErreurAuth]);

  // Onglet « Carte ».
  useEffect(() => {
    if (!token || tab !== 'carte') return;
    let cancelled = false;
    setCarteLoading(true);
    setCarteError(null);
    explorerApi
      .carte(token, {
        domaine: carteDomaine === TOUS ? undefined : carteDomaine,
        date: carteDate || undefined,
      })
      .then((rows) => {
        if (cancelled) return;
        setMarqueurs(rows.map(carteVersMarqueur).filter((m): m is MapMarker => m !== null));
      })
      .catch((err) => {
        if (cancelled || gererErreurAuth(err)) return;
        setMarqueurs([]);
        setCarteError(messageErreur(err, 'Erreur lors du chargement de la carte.'));
      })
      .finally(() => {
        if (!cancelled) setCarteLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token, tab, carteDomaine, carteDate, version, gererErreurAuth]);

  const contexte = useMemo<MissionActionContext>(
    () => ({
      connecte: Boolean(user),
      role: user?.role ?? null,
      administrateur: user?.role === 'ADMIN',
    }),
    [user],
  );

  const rafraichir = useCallback(() => setVersion((v) => v + 1), []);

  /** Action unique : inscription, liste d'attente, annulation, confirmation de renfort. */
  const handleAction = useCallback(
    async (kind: MissionActionKind, mission: ExplorerMission) => {
      if (kind === 'SE_CONNECTER') {
        void navigate({ to: '/login' });
        return;
      }
      if (!token) return;
      setBusyId(mission.id);
      try {
        if (kind === 'ANNULER_INSCRIPTION' || kind === 'QUITTER_LISTE_ATTENTE') {
          await explorerApi.annuler(token, mission.id);
          toast.success('Inscription annulée.');
        } else if (kind === 'CONFIRMER_RENFORT') {
          await explorerApi.confirmerRenfort(token, mission.id);
          toast.success('Votre venue est confirmée. Merci !');
        } else {
          const res = await explorerApi.inscrire(token, mission.id);
          if (res.statutInscription === 'EN_LISTE_ATTENTE') {
            toast.success(
              res.rang != null
                ? `Ajouté en liste d'attente (position ${res.rang}).`
                : "Ajouté en liste d'attente.",
            );
          } else {
            toast.success('Inscription confirmée !');
          }
        }
        // Rafraîchit le mini-dashboard et l'onglet courant.
        rafraichir();
        // Rafraîchit la modale de détail si elle est ouverte sur cette mission.
        if (detail?.id === mission.id) {
          setDetailLoading(true);
          explorerApi
            .detail(token, mission.id)
            .then(setDetail)
            .catch(() => undefined)
            .finally(() => setDetailLoading(false));
        }
      } catch (err) {
        if (gererErreurAuth(err)) return;
        toast.error(messageErreur(err, "L'action a échoué."));
      } finally {
        setBusyId(null);
      }
    },
    [token, detail, rafraichir, gererErreurAuth, navigate],
  );

  /** Ouvre la modale de détail (affichage immédiat puis données complètes). */
  const ouvrirDetail = useCallback(
    async (mission: ExplorerMission) => {
      setDetail(mission);
      if (!token) return;
      setDetailLoading(true);
      try {
        setDetail(await explorerApi.detail(token, mission.id));
      } catch (err) {
        if (!gererErreurAuth(err)) toast.error(messageErreur(err, 'Mission introuvable.'));
      } finally {
        setDetailLoading(false);
      }
    },
    [token, gererErreurAuth],
  );

  function basculerCompetence(id: number) {
    setPage(0);
    setCompetenceIds((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    );
  }

  function reinitialiserFiltres() {
    setDomaine(TOUS);
    setVille(TOUS);
    setDate('');
    setCompetenceIds([]);
    setPlacesSeulement(false);
    setPage(0);
  }

  const filtresActifs =
    domaine !== TOUS || ville !== TOUS || date !== '' || placesSeulement || competenceIds.length > 0;

  const totalPages = pageData?.totalPages ?? 0;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl font-black text-ink">Explorer les missions</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Trouvez la mission qui vous correspond : filtrez, consultez les recommandations ou
          parcourez la carte.
        </p>
      </header>

      {/* Mini-dashboard (bénévole connecté) */}
      <ExplorerMiniDashboard
        stats={stats}
        loading={statsLoading}
        failed={statsFailed}
        onShowRecommandations={() => setTab('recommandees')}
        onShowToutes={() => setTab('toutes')}
      />

      <Tabs value={tab} onValueChange={(v) => setTab(v as ExplorerTabKey)}>
        <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 rounded-2xl border-2 border-ink bg-paper p-1.5 shadow-[4px_4px_0_var(--color-ink)]">
          <TabsTrigger
            value="toutes"
            className="rounded-xl px-3 py-2 text-sm font-bold data-[state=active]:bg-mustard data-[state=active]:text-ink data-[state=active]:shadow-none"
          >
            Toutes les missions
          </TabsTrigger>
          <TabsTrigger
            value="recommandees"
            className="rounded-xl px-3 py-2 text-sm font-bold data-[state=active]:bg-mustard data-[state=active]:text-ink data-[state=active]:shadow-none"
          >
            Recommandées pour moi
          </TabsTrigger>
          <TabsTrigger
            value="carte"
            className="rounded-xl px-3 py-2 text-sm font-bold data-[state=active]:bg-mustard data-[state=active]:text-ink data-[state=active]:shadow-none"
          >
            Carte
          </TabsTrigger>
        </TabsList>

        {/* ① Toutes les missions */}
        <TabsContent value="toutes" className="space-y-4">
          <div className="rounded-2xl border-2 border-ink bg-paper p-4 shadow-[4px_4px_0_var(--color-ink)]">
            <div className="flex flex-wrap items-center gap-3">
              <Select
                value={domaine}
                onValueChange={(v) => {
                  setDomaine(v);
                  setPage(0);
                }}
              >
                <SelectTrigger className="w-44 rounded-xl border-2 border-ink">
                  <SelectValue placeholder="Domaine" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={TOUS}>Tous les domaines</SelectItem>
                  {domaines.map((d) => (
                    <SelectItem key={d.id} value={d.nom}>
                      {d.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={ville}
                onValueChange={(v) => {
                  setVille(v);
                  setPage(0);
                }}
              >
                <SelectTrigger className="w-44 rounded-xl border-2 border-ink">
                  <SelectValue placeholder="Ville" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={TOUS}>Toutes les villes</SelectItem>
                  {villes.map((v) => (
                    <SelectItem key={v} value={v}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Input
                type="date"
                value={date}
                onChange={(e) => {
                  setDate(e.target.value);
                  setPage(0);
                }}
                className="w-44 rounded-xl border-2 border-ink"
                aria-label="Missions démarrant à partir du"
              />

              <button
                type="button"
                onClick={() => {
                  setPlacesSeulement((v) => !v);
                  setPage(0);
                }}
                aria-pressed={placesSeulement}
                className={cn(
                  'rounded-xl border-2 border-ink px-3 py-2 text-xs font-bold transition-colors',
                  placesSeulement
                    ? 'bg-mustard text-ink'
                    : 'bg-paper text-muted-foreground hover:bg-muted',
                )}
              >
                Uniquement avec des places
              </button>

              {filtresActifs && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={reinitialiserFiltres}
                  className="rounded-xl border-2 border-ink font-semibold shadow-[2px_2px_0_var(--color-ink)]"
                >
                  <X className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
                  Réinitialiser
                </Button>
              )}
            </div>

            {competences.length > 0 && (
              <div className="mt-3 border-t border-ink/10 pt-3">
                <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                  <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
                  Compétences requises
                </p>
                <div className="flex max-h-24 flex-wrap gap-1.5 overflow-y-auto">
                  {competences.map((c) => {
                    const actif = competenceIds.includes(c.id);
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => basculerCompetence(c.id)}
                        aria-pressed={actif}
                        className={cn(
                          'rounded-full border-2 px-2.5 py-0.5 text-[11px] font-semibold transition-colors',
                          actif
                            ? 'border-ink bg-mustard text-ink'
                            : 'border-ink/20 bg-muted text-muted-foreground hover:bg-muted/70',
                        )}
                      >
                        {c.nom}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {listError && (
            <div className="flex items-start gap-2 rounded-2xl border-2 border-ink bg-red-50 p-4 text-sm text-red-800 shadow-[3px_3px_0_var(--color-ink)]">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <div>
                <p className="font-semibold">{listError}</p>
                <button
                  type="button"
                  onClick={rafraichir}
                  className="mt-2 inline-flex items-center gap-1.5 rounded-xl border-2 border-ink bg-paper px-3 py-1.5 text-xs font-bold text-ink shadow-[2px_2px_0_var(--color-ink)]"
                >
                  <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                  Réessayer
                </button>
              </div>
            </div>
          )}

          {listLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-80 rounded-2xl" />
              ))}
            </div>
          ) : pageData && pageData.content.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {pageData.content.map((m) => (
                <MissionExplorerCard
                  key={m.id}
                  mission={m}
                  context={contexte}
                  busy={busyId === m.id}
                  onAction={handleAction}
                  onDetail={ouvrirDetail}
                />
              ))}
            </div>
          ) : (
            !listError && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Search className="mb-4 h-12 w-12 text-muted-foreground" aria-hidden="true" />
                <p className="font-semibold text-ink">Aucune mission trouvée</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Essayez de modifier vos filtres.
                </p>
              </div>
            )
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="rounded-xl border-2 border-ink shadow-[2px_2px_0_var(--color-ink)]"
              >
                Précédent
              </Button>
              <span className="text-sm font-semibold text-ink">
                Page {page + 1} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="rounded-xl border-2 border-ink shadow-[2px_2px_0_var(--color-ink)]"
              >
                Suivant
              </Button>
            </div>
          )}
        </TabsContent>

        {/* ② Recommandées pour moi */}
        <TabsContent value="recommandees" className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Missions ouvertes (publiées, à venir, sans chevauchement) triées par score de
            compatibilité avec votre profil.
          </p>

          {recosError && (
            <div className="rounded-2xl border-2 border-ink bg-red-50 p-4 text-sm text-red-800 shadow-[3px_3px_0_var(--color-ink)]">
              <p className="font-semibold">{recosError}</p>
            </div>
          )}

          {recosLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-80 rounded-2xl" />
              ))}
            </div>
          ) : recos.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {recos.map((m) => (
                <MissionExplorerCard
                  key={m.id}
                  mission={m}
                  context={contexte}
                  showScore
                  busy={busyId === m.id}
                  onAction={handleAction}
                  onDetail={ouvrirDetail}
                />
              ))}
            </div>
          ) : (
            !recosError && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Search className="mb-4 h-12 w-12 text-muted-foreground" aria-hidden="true" />
                <p className="font-semibold text-ink">Aucune recommandation pour le moment</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Complétez votre profil (ville, compétences) pour recevoir des suggestions.
                </p>
              </div>
            )
          )}
        </TabsContent>

        {/* ③ Carte */}
        <TabsContent value="carte" className="space-y-4">
          <div className="flex flex-wrap items-center gap-3 rounded-2xl border-2 border-ink bg-paper p-4 shadow-[4px_4px_0_var(--color-ink)]">
            <Select value={carteDomaine} onValueChange={setCarteDomaine}>
              <SelectTrigger className="w-44 rounded-xl border-2 border-ink">
                <SelectValue placeholder="Domaine" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={TOUS}>Tous les domaines</SelectItem>
                {domaines.map((d) => (
                  <SelectItem key={d.id} value={d.nom}>
                    {d.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              type="date"
              value={carteDate}
              onChange={(e) => setCarteDate(e.target.value)}
              className="w-44 rounded-xl border-2 border-ink"
              aria-label="Missions démarrant à partir du"
            />

            <div className="ml-auto flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span
                  className="inline-block h-3 w-3 rounded-full border border-ink"
                  style={{ backgroundColor: TONE_MARKER_COLORS.green }}
                  aria-hidden="true"
                />
                Publiée
              </span>
              <span className="flex items-center gap-1.5">
                <span
                  className="inline-block h-3 w-3 rounded-full border border-ink"
                  style={{ backgroundColor: TONE_MARKER_COLORS.orange }}
                  aria-hidden="true"
                />
                Saturée
              </span>
              <span className="flex items-center gap-1.5">
                <span
                  className="inline-block h-3 w-3 rounded-full border border-ink"
                  style={{ backgroundColor: TONE_MARKER_COLORS.red }}
                  aria-hidden="true"
                />
                Renfort urgent
              </span>
            </div>
          </div>

          {carteError && (
            <div className="rounded-2xl border-2 border-ink bg-red-50 p-4 text-sm text-red-800 shadow-[3px_3px_0_var(--color-ink)]">
              <p className="font-semibold">{carteError}</p>
            </div>
          )}

          <div
            className="overflow-hidden rounded-2xl border-2 border-ink shadow-[4px_4px_0_var(--color-ink)]"
            style={{ height: 'calc(100vh - 22rem)', minHeight: '420px' }}
          >
            {carteLoading ? (
              <Skeleton className="h-full w-full" />
            ) : marqueurs.length > 0 ? (
              <Suspense fallback={<Skeleton className="h-full w-full" />}>
                <MapComponent markers={marqueurs} height="100%" />
              </Suspense>
            ) : (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <MapPin className="mb-4 h-12 w-12 text-muted-foreground" aria-hidden="true" />
                <p className="font-semibold text-ink">Aucune mission géolocalisée</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Les missions à distance n’apparaissent pas sur la carte.
                </p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Modale de détail */}
      <Dialog open={detail !== null} onOpenChange={(v) => !v && setDetail(null)}>
        <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto border-2 border-ink shadow-[4px_4px_0_var(--color-ink)]">
          {detail && <DetailMission
            mission={detail}
            context={contexte}
            busy={busyId === detail.id}
            loading={detailLoading}
            onAction={handleAction}
          />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ── Modale de détail ──────────────────────────────────────────────────────── */

interface DetailMissionProps {
  mission: ExplorerMission;
  context: MissionActionContext;
  busy: boolean;
  loading: boolean;
  onAction: (kind: MissionActionKind, mission: ExplorerMission) => void;
}

function DetailMission({ mission, context, busy, loading, onAction }: DetailMissionProps) {
  const action = resolveMissionAction(mission, context);

  return (
    <>
      <DialogHeader>
        <DialogTitle className="font-display text-xl font-black text-ink">
          {mission.titre}
        </DialogTitle>
        <DialogDescription asChild>
          <div className="space-y-4 pt-2">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge statut={mission.statut} />
              {mission.domaine && (
                <span className="rounded-full border border-mustard bg-mustard/20 px-2.5 py-0.5 text-xs font-semibold text-ink">
                  {mission.domaine}
                </span>
              )}
              {loading && (
                <span className="text-xs text-muted-foreground">Mise à jour…</span>
              )}
            </div>

            <p className="text-sm font-semibold text-muted-foreground">
              {mission.associationNom ?? 'Association partenaire'}
            </p>

            <div className="space-y-1.5 text-sm text-muted-foreground">
              <p className="flex items-center gap-2">
                {mission.aDistance ? (
                  <>
                    <Wifi className="h-4 w-4 shrink-0" aria-hidden="true" /> À distance
                  </>
                ) : (
                  <>
                    <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />
                    {mission.adresse || mission.associationVille || 'Lieu non précisé'}
                  </>
                )}
              </p>
              <p className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 shrink-0" aria-hidden="true" />
                {formaterDate(mission.dateDebut)}
                {mission.dateFin && formaterDate(mission.dateFin) !== formaterDate(mission.dateDebut) && (
                  <> — {formaterDate(mission.dateFin)}</>
                )}
              </p>
              <p className="flex items-center gap-2">
                <Users className="h-4 w-4 shrink-0" aria-hidden="true" />
                {mission.placesRestantes} / {mission.nbPlaces} places restantes ·{' '}
                {mission.listeAttenteCount} en liste d’attente
              </p>
              {mission.statut === 'RENFORT_URGENT' && (
                <p className="font-semibold text-red-700">
                  {mission.nbRenfortDemande ?? 0} bénévole
                  {(mission.nbRenfortDemande ?? 0) > 1 ? 's' : ''} recherché
                  {(mission.nbRenfortDemande ?? 0) > 1 ? 's' : ''}
                </p>
              )}
            </div>

            {mission.description && (
              <p className="border-t border-ink/10 pt-3 text-sm text-ink">{mission.description}</p>
            )}

            {mission.competences.length > 0 && (
              <div className="flex flex-wrap gap-1.5 border-t border-ink/10 pt-3">
                {mission.competences.map((c) => (
                  <span
                    key={c}
                    className="rounded-full border border-ink/20 bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground"
                  >
                    {c}
                  </span>
                ))}
              </div>
            )}

            {/* Badge + boutons (situation du bénévole) */}
            <div className="border-t border-ink/10 pt-3">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    'inline-flex items-center gap-1 rounded-full border-2 px-2.5 py-0.5 text-xs font-bold',
                    TONE_CLASSES[action.badge.tone],
                  )}
                >
                  {action.badge.confirmed && <Check className="h-3 w-3" aria-hidden="true" />}
                  {action.badge.label}
                </span>
                {action.detail && (
                  <span className="text-xs text-muted-foreground">{action.detail}</span>
                )}
              </div>

              {action.message && (
                <p className="mt-2 rounded-lg border border-ink/15 bg-muted px-3 py-2 text-xs text-muted-foreground">
                  {action.message}
                </p>
              )}

              {action.buttons.length > 0 && (
                <div className="mt-3 space-y-2">
                  {action.buttons.map((button) => (
                    <Button
                      key={button.kind + button.label}
                      size="sm"
                      disabled={busy || button.disabled}
                      onClick={() => !button.disabled && onAction(button.kind, mission)}
                      className={cn(
                        'w-full rounded-xl border-2 border-ink font-bold shadow-[3px_3px_0_var(--color-ink)]',
                        button.variant === 'danger' && 'bg-paper text-red-700 hover:bg-red-50',
                        button.variant === 'neutral' && 'bg-paper text-ink hover:bg-muted',
                        button.variant === 'primary' && 'bg-pink text-pink-foreground hover:opacity-90',
                        button.disabled && 'cursor-not-allowed opacity-60',
                      )}
                    >
                      {button.label}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogDescription>
      </DialogHeader>
    </>
  );
}

export default ExplorerMissions;
