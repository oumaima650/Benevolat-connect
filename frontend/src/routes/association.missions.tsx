import { createFileRoute, Link } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Search, ChevronLeft, ChevronRight, Loader2, Plus } from 'lucide-react';
import { StatusBadge } from '@/components/dashboard/StatusBadge';
import { ConfirmDialog } from '@/components/dashboard/ConfirmDialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getMyMissions, changeMissionStatut, type MissionDashboard } from '@/services/associationApi';
import { formaterDate } from '@/components/dashboard/data';

export const Route = createFileRoute('/association/missions')({
  component: MesMissions,
});

const PAGE_SIZE = 5;

const STATUTS_FILTER = [
  { value: 'Tous', label: 'Tous les statuts' },
  { value: 'BROUILLON', label: 'Brouillon' },
  { value: 'PUBLIEE', label: 'Publiée' },
  { value: 'COMPLETE', label: 'Complète' },
  { value: 'EN_COURS', label: 'En cours' },
  { value: 'RENFORT_URGENT', label: 'Renfort urgent' },
  { value: 'TERMINEE', label: 'Terminée' },
  { value: 'CLOTUREE', label: 'Clôturée' },
  { value: 'ANNULEE', label: 'Annulée' },
];

type ConfirmAction = { id: number; action: 'publier' | 'annuler' | 'cloturer' | 'depublier' };

function MesMissions() {
  const [missions, setMissions] = useState<MissionDashboard[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statut, setStatut] = useState('Tous');
  const [page, setPage] = useState(1);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  const [actioning, setActioning] = useState(false);

  useEffect(() => {
    getMyMissions()
      .then(setMissions)
      .catch(() => toast.error('Impossible de charger les missions.'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = missions.filter((m) => {
    const matchSearch = search === '' || m.titre.toLowerCase().includes(search.toLowerCase());
    const matchStatut = statut === 'Tous' || m.statut === statut;
    return matchSearch && matchStatut;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const actionStatutMap: Record<ConfirmAction['action'], string> = {
    publier: 'PUBLIEE',
    annuler: 'ANNULEE',
    cloturer: 'CLOTUREE',
    depublier: 'BROUILLON',
  };

  async function executeAction(action: ConfirmAction) {
    setActioning(true);
    try {
      const updated = await changeMissionStatut(action.id, actionStatutMap[action.action]);
      setMissions((prev) => prev.map((m) => (m.id === action.id ? updated : m)));
      const msgs = {
        publier: '🚀 Mission publiée !',
        annuler: 'Mission annulée.',
        cloturer: '✅ Mission clôturée !',
        depublier: 'Mission repassée en brouillon.',
      };
      toast.success(msgs[action.action]);
    } catch (err: any) {
      toast.error(err.message ?? 'Erreur lors de l\'action.');
    } finally {
      setActioning(false);
      setConfirmAction(null);
    }
  }

  const confirmItem = confirmAction ? missions.find((m) => m.id === confirmAction.id) : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-black text-ink">Mes missions</h1>
          <p className="mt-1 text-sm text-muted-foreground">{filtered.length} mission(s)</p>
        </div>
        <Link
          to="/association/nouvelle-mission"
          className="inline-flex items-center gap-2 rounded-xl border-2 border-ink bg-emerald px-4 py-2 text-sm font-bold text-emerald-foreground shadow-[3px_3px_0_var(--color-ink)] hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> Créer une mission
        </Link>
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap gap-3 rounded-2xl border-2 border-ink bg-paper p-4 shadow-[4px_4px_0_var(--color-ink)]">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher une mission…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9 rounded-xl border-2 border-ink"
          />
        </div>
        <Select value={statut} onValueChange={(v) => { setStatut(v); setPage(1); }}>
          <SelectTrigger className="w-52 rounded-xl border-2 border-ink">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            {STATUTS_FILTER.map((s) => (
              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border-2 border-ink shadow-[4px_4px_0_var(--color-ink)]">
          <table className="w-full text-sm">
            <thead className="bg-emerald text-emerald-foreground">
              <tr>
                <th className="border-b-2 border-ink px-4 py-3 text-left font-bold">Titre</th>
                <th className="hidden border-b-2 border-ink px-4 py-3 text-left font-bold md:table-cell">Dates</th>
                <th className="hidden border-b-2 border-ink px-4 py-3 text-left font-bold sm:table-cell">Places</th>
                <th className="hidden border-b-2 border-ink px-4 py-3 text-left font-bold lg:table-cell">Attente</th>
                <th className="border-b-2 border-ink px-4 py-3 text-left font-bold">Statut</th>
                <th className="border-b-2 border-ink px-4 py-3 text-left font-bold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                    Aucune mission trouvée.
                  </td>
                </tr>
              ) : (
                pageItems.map((m, idx) => (
                  <tr key={m.id} className={idx % 2 === 0 ? 'bg-paper' : 'bg-muted'}>
                    <td className="px-4 py-3 font-medium text-ink max-w-[200px] truncate">{m.titre}</td>
                    <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                      {formaterDate(m.dateDebut)}
                      {m.dateDebut !== m.dateFin && <> → {formaterDate(m.dateFin)}</>}
                    </td>
                    <td className="hidden px-4 py-3 sm:table-cell">
                      <span className={m.nbInscritsConfirmes === m.nbPlaces ? 'font-bold text-orange-600' : 'text-ink'}>
                        {m.nbInscritsConfirmes}
                      </span>
                      <span className="text-muted-foreground"> / {m.nbPlaces}</span>
                    </td>
                    <td className="hidden px-4 py-3 text-muted-foreground lg:table-cell">{m.nbListeAttente}</td>
                    <td className="px-4 py-3">
                      <StatusBadge statut={m.statut as any} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        {/* Modifier */}
                        {!['CLOTUREE', 'ANNULEE', 'TERMINEE'].includes(m.statut) && (
                          <Link
                            to="/association/nouvelle-mission"
                            search={{ id: String(m.id) }}
                            className="rounded-lg border border-ink bg-paper px-2 py-1 text-xs font-semibold hover:bg-muted"
                          >
                            Modifier
                          </Link>
                        )}
                        {/* Publier */}
                        {m.statut === 'BROUILLON' && (
                          <button
                            onClick={() => setConfirmAction({ id: m.id, action: 'publier' })}
                            className="rounded-lg border border-ink bg-emerald px-2 py-1 text-xs font-semibold text-emerald-foreground hover:opacity-90"
                          >
                            Publier
                          </button>
                        )}
                        {/* Dépublier → brouillon */}
                        {m.statut === 'PUBLIEE' && (
                          <button
                            onClick={() => setConfirmAction({ id: m.id, action: 'depublier' })}
                            className="rounded-lg border border-ink bg-mustard px-2 py-1 text-xs font-semibold text-ink hover:opacity-90"
                          >
                            Brouillon
                          </button>
                        )}
                        {/* Annuler */}
                        {['PUBLIEE', 'COMPLETE', 'RENFORT_URGENT'].includes(m.statut) && (
                          <button
                            onClick={() => setConfirmAction({ id: m.id, action: 'annuler' })}
                            className="rounded-lg border border-red-300 bg-red-50 px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-100"
                          >
                            Annuler
                          </button>
                        )}
                        {/* Clôturer */}
                        {['TERMINEE', 'EN_COURS'].includes(m.statut) && (
                          <button
                            onClick={() => setConfirmAction({ id: m.id, action: 'cloturer' })}
                            className="rounded-lg border border-ink bg-mustard px-2 py-1 text-xs font-semibold text-ink hover:opacity-90"
                          >
                            Clôturer
                          </button>
                        )}
                        {/* Inscrits */}
                        <Link
                          to="/association/inscrits"
                          className="rounded-lg border border-ink bg-paper px-2 py-1 text-xs font-semibold hover:bg-muted"
                        >
                          Inscrits
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <Button
            variant="outline" size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-xl border-2 border-ink shadow-[2px_2px_0_var(--color-ink)]"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-semibold text-ink">Page {page} / {totalPages}</span>
          <Button
            variant="outline" size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="rounded-xl border-2 border-ink shadow-[2px_2px_0_var(--color-ink)]"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Confirm dialog */}
      <ConfirmDialog
        open={!!confirmAction}
        onOpenChange={(v) => !v && setConfirmAction(null)}
        title={confirmAction ? {
          publier: 'Publier la mission',
          annuler: 'Annuler la mission',
          cloturer: 'Clôturer la mission',
          depublier: 'Repasser en brouillon',
        }[confirmAction.action] : ''}
        description={`Confirmer "${confirmAction?.action}" pour la mission "${confirmItem?.titre ?? ''}" ?`}
        confirmLabel={actioning ? 'En cours…' : 'Confirmer'}
        variant={confirmAction?.action === 'annuler' ? 'destructive' : 'default'}
        onConfirm={() => { if (confirmAction) executeAction(confirmAction); }}
      />
    </div>
  );
}
