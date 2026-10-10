import { createFileRoute, Link } from '@tanstack/react-router';
import { useState } from 'react';
import { toast } from 'sonner';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { StatusBadge } from '@/components/dashboard/StatusBadge';
import { ConfirmDialog } from '@/components/dashboard/ConfirmDialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formaterDate, type MissionDash, type MissionStatut } from '@/components/dashboard/data';

export const Route = createFileRoute('/association/missions')({
  component: MesMissions,
});

const MISSIONS_ASSO: MissionDash[] = [
  {
    id: 'a1', titre: 'Distribution de repas solidaires', association: 'Association Nour',
    domaine: 'Solidarité', ville: 'Tanger', adresse: 'Bd Mohammed V, Tanger',
    lat: 35.7595, lng: -5.834, dateDebut: '2026-09-15', dateFin: '2026-09-15',
    placesTotal: 15, placesConfirmees: 12, listeAttente: 3, statut: 'EN_COURS',
    competences: ['Logistique', 'Cuisine'],
  },
  {
    id: 'a2', titre: "Plantation d'arbres en forêt de Bouhachem", association: 'Association Nour',
    domaine: 'Environnement', ville: 'Tétouan', adresse: 'Forêt Bouhachem',
    lat: 35.5704, lng: -5.3786, dateDebut: '2026-10-03', dateFin: '2026-10-03',
    placesTotal: 30, placesConfirmees: 14, listeAttente: 0, statut: 'PUBLIEE',
    competences: ['Jardinage'],
  },
  {
    id: 'a3', titre: 'Soutien scolaire pour lycéens', association: 'Association Nour',
    domaine: 'Éducation', ville: 'Rabat', adresse: 'Lycée Ibn Rochd, Agdal',
    lat: 33.9716, lng: -6.8498, dateDebut: '2026-09-20', dateFin: '2026-12-20',
    placesTotal: 10, placesConfirmees: 10, listeAttente: 5, statut: 'COMPLETE',
    competences: ['Enseignement'],
  },
  {
    id: 'a4', titre: "Collecte de vêtements d'hiver", association: 'Association Nour',
    domaine: 'Solidarité', ville: 'Tétouan', adresse: 'Centre communautaire Martil',
    lat: 35.6138, lng: -5.3646, dateDebut: '2026-11-01', dateFin: '2026-11-30',
    placesTotal: 8, placesConfirmees: 3, listeAttente: 12, statut: 'RENFORT_URGENT',
    competences: ['Logistique'],
  },
  {
    id: 'a5', titre: 'Marathon caritatif', association: 'Association Nour',
    domaine: 'Sport', ville: 'Casablanca', adresse: 'Corniche de Casablanca',
    lat: 33.5882, lng: -7.6644, dateDebut: '2026-05-10', dateFin: '2026-05-10',
    placesTotal: 50, placesConfirmees: 50, listeAttente: 0, statut: 'TERMINEE',
    competences: [],
  },
  {
    id: 'a6', titre: 'Journée portes ouvertes culturelle', association: 'Association Nour',
    domaine: 'Culture', ville: 'Fès', adresse: 'Musée Batha, Fès el-Bali',
    lat: 34.0631, lng: -5.0, dateDebut: '2026-04-15', dateFin: '2026-04-16',
    placesTotal: 20, placesConfirmees: 20, listeAttente: 0, statut: 'CLOTUREE',
    competences: [],
  },
  {
    id: 'a7', titre: 'Campagne de sensibilisation santé', association: 'Association Nour',
    domaine: 'Santé', ville: 'Tanger', adresse: 'Place du Grand Socco, Tanger',
    lat: 35.7769, lng: -5.7987, dateDebut: '2026-08-05', dateFin: '2026-08-05',
    placesTotal: 12, placesConfirmees: 8, listeAttente: 0, statut: 'ANNULEE',
    competences: [],
  },
  {
    id: 'a8', titre: 'Atelier numérique pour seniors', association: 'Association Nour',
    domaine: 'Éducation', ville: 'Tétouan', adresse: 'Maison des associations, rue Sania',
    lat: 35.5714, lng: -5.3749, dateDebut: '2026-10-15', dateFin: '2026-12-15',
    placesTotal: 6, placesConfirmees: 0, listeAttente: 0, statut: 'BROUILLON',
    competences: ['Informatique'],
  },
  {
    id: 'a9', titre: "Aide alimentaire quartier Azla", association: 'Association Nour',
    domaine: 'Solidarité', ville: 'Tétouan', adresse: "Quartier Azla, Tétouan",
    lat: 35.5680, lng: -5.3800, dateDebut: '2026-09-22', dateFin: '2026-09-22',
    placesTotal: 20, placesConfirmees: 18, listeAttente: 0, statut: 'PUBLIEE',
    competences: [],
  },
  {
    id: 'a10', titre: 'Tournoi de futsal solidaire', association: 'Association Nour',
    domaine: 'Sport', ville: 'Tétouan', adresse: 'Stade municipal, Tétouan',
    lat: 35.5750, lng: -5.3600, dateDebut: '2026-12-05', dateFin: '2026-12-05',
    placesTotal: 30, placesConfirmees: 0, listeAttente: 0, statut: 'BROUILLON',
    competences: [],
  },
];

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

function MesMissions() {
  const [missions, setMissions] = useState<MissionDash[]>(MISSIONS_ASSO);
  const [search, setSearch] = useState('');
  const [statut, setStatut] = useState('Tous');
  const [page, setPage] = useState(1);
  const [confirmAction, setConfirmAction] = useState<{
    id: string;
    action: 'publier' | 'annuler' | 'cloturer';
  } | null>(null);

  const filtered = missions.filter((m) => {
    const matchSearch =
      search === '' || m.titre.toLowerCase().includes(search.toLowerCase());
    const matchStatut = statut === 'Tous' || m.statut === statut;
    return matchSearch && matchStatut;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function executeAction(id: string, action: 'publier' | 'annuler' | 'cloturer') {
    const newStatut: MissionStatut =
      action === 'publier' ? 'PUBLIEE' : action === 'annuler' ? 'ANNULEE' : 'CLOTUREE';
    setMissions((prev) => prev.map((m) => (m.id === id ? { ...m, statut: newStatut } : m)));
    const msgs = {
      publier: '🚀 Mission publiée !',
      annuler: 'Mission annulée.',
      cloturer: '✅ Mission clôturée !',
    };
    toast.success(msgs[action]);
    setConfirmAction(null);
  }

  const confirmItem = confirmAction
    ? missions.find((m) => m.id === confirmAction.id)
    : null;

  const actionLabels = {
    publier: 'Publier la mission',
    annuler: 'Annuler la mission',
    cloturer: 'Clôturer la mission',
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-black text-ink">Mes missions</h1>
          <p className="mt-1 text-sm text-muted-foreground">{filtered.length} missions</p>
        </div>
        <Link
          to="/association/nouvelle-mission"
          className="rounded-xl border-2 border-ink bg-emerald px-4 py-2 text-sm font-bold text-emerald-foreground shadow-[3px_3px_0_var(--color-ink)] hover:opacity-90"
        >
          + Créer une mission
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 rounded-2xl border-2 border-ink bg-paper p-4 shadow-[4px_4px_0_var(--color-ink)]">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
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
      <div className="overflow-x-auto rounded-2xl border-2 border-ink shadow-[4px_4px_0_var(--color-ink)]">
        <table className="w-full text-sm">
          <thead className="bg-emerald text-emerald-foreground">
            <tr>
              <th className="border-b-2 border-ink px-4 py-3 text-left font-bold">Titre</th>
              <th className="hidden border-b-2 border-ink px-4 py-3 text-left font-bold md:table-cell">Dates</th>
              <th className="hidden border-b-2 border-ink px-4 py-3 text-left font-bold sm:table-cell">Confirmés / Total</th>
              <th className="hidden border-b-2 border-ink px-4 py-3 text-left font-bold lg:table-cell">Attente</th>
              <th className="border-b-2 border-ink px-4 py-3 text-left font-bold">Statut</th>
              <th className="border-b-2 border-ink px-4 py-3 text-left font-bold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pageItems.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  Aucune mission trouvée.
                </td>
              </tr>
            ) : (
              pageItems.map((m, idx) => (
                <tr key={m.id} className={idx % 2 === 0 ? 'bg-paper' : 'bg-muted'}>
                  <td className="px-4 py-3 font-medium text-ink">{m.titre}</td>
                  <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                    {formaterDate(m.dateDebut)}
                    {m.dateDebut !== m.dateFin && <> → {formaterDate(m.dateFin)}</>}
                  </td>
                  <td className="hidden px-4 py-3 sm:table-cell">
                    <span className={m.placesConfirmees === m.placesTotal ? 'font-bold text-orange-600' : 'text-ink'}>
                      {m.placesConfirmees}
                    </span>
                    <span className="text-muted-foreground"> / {m.placesTotal}</span>
                  </td>
                  <td className="hidden px-4 py-3 text-muted-foreground lg:table-cell">
                    {m.listeAttente}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge statut={m.statut} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1.5">
                      {/* Modifier - all except CLOTUREE, ANNULEE, TERMINEE */}
                      {!['CLOTUREE', 'ANNULEE', 'TERMINEE'].includes(m.statut) && (
                        <Link
                          to="/association/nouvelle-mission"
                          className="rounded-lg border border-ink bg-paper px-2 py-1 text-xs font-semibold hover:bg-muted"
                        >
                          Modifier
                        </Link>
                      )}
                      {/* Publier - BROUILLON only */}
                      {m.statut === 'BROUILLON' && (
                        <button
                          onClick={() => setConfirmAction({ id: m.id, action: 'publier' })}
                          className="rounded-lg border border-ink bg-emerald px-2 py-1 text-xs font-semibold text-emerald-foreground hover:opacity-90"
                        >
                          Publier
                        </button>
                      )}
                      {/* Annuler - PUBLIEE or COMPLETE */}
                      {(m.statut === 'PUBLIEE' || m.statut === 'COMPLETE') && (
                        <button
                          onClick={() => setConfirmAction({ id: m.id, action: 'annuler' })}
                          className="rounded-lg border border-red-300 bg-red-50 px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-100"
                        >
                          Annuler
                        </button>
                      )}
                      {/* Clôturer - TERMINEE */}
                      {m.statut === 'TERMINEE' && (
                        <button
                          onClick={() => setConfirmAction({ id: m.id, action: 'cloturer' })}
                          className="rounded-lg border border-ink bg-mustard px-2 py-1 text-xs font-semibold text-ink hover:opacity-90"
                        >
                          Clôturer
                        </button>
                      )}
                      {/* Voir inscrits - always */}
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

      {/* Confirm dialog */}
      <ConfirmDialog
        open={!!confirmAction}
        onOpenChange={(v) => !v && setConfirmAction(null)}
        title={confirmAction ? actionLabels[confirmAction.action] : ''}
        description={`Êtes-vous sûr(e) de vouloir ${confirmAction?.action === 'publier' ? 'publier' : confirmAction?.action === 'annuler' ? 'annuler' : 'clôturer'} la mission "${confirmItem?.titre ?? ''}" ?`}
        confirmLabel={confirmAction ? actionLabels[confirmAction.action] : 'Confirmer'}
        variant={confirmAction?.action === 'annuler' ? 'destructive' : 'default'}
        onConfirm={() => {
          if (confirmAction) executeAction(confirmAction.id, confirmAction.action);
        }}
      />
    </div>
  );
}
