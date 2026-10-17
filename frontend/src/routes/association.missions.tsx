import { createFileRoute, Link } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  Search, ChevronLeft, ChevronRight, Loader2, Plus,
  Eye, Zap, Camera, MapPin, Calendar, Users, CheckCircle,
} from 'lucide-react';
import { StatusBadge } from '@/components/dashboard/StatusBadge';
import { ConfirmDialog } from '@/components/dashboard/ConfirmDialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { ImageUpload } from '@/components/common/ImageUpload';
import {
  getMyMissions, changeMissionStatut, demanderRenfort,
  addMissionImage, getMissionImages,
  type MissionDashboard, type ImageEvenementDashboard,
} from '@/services/associationApi';
import { formaterDate } from '@/components/dashboard/data';

export const Route = createFileRoute('/association/missions')({
  component: MesMissions,
});

const PAGE_SIZE = 5;

const STATUTS_FILTER = [
  { value: 'Tous', label: 'Tous les statuts' },
  { value: 'BROUILLON', label: 'Brouillon' },
  { value: 'PUBLIEE', label: 'Publiée' },
  { value: 'SATUREE', label: 'Saturée' },
  { value: 'EN_COURS', label: 'En cours' },
  { value: 'RENFORT_URGENT', label: 'Renfort urgent' },
  { value: 'TERMINEE', label: 'Terminée' },
  { value: 'CLOTUREE', label: 'Clôturée' },
  { value: 'ANNULEE', label: 'Annulée' },
];

type ConfirmAction = { id: number; action: 'publier' | 'annuler' | 'cloturer' | 'depublier' };

/* ── Modal Détail Mission ── */
function MissionDetailDialog({ mission, open, onClose }: {
  mission: MissionDashboard | null; open: boolean; onClose: () => void;
}) {
  if (!mission) return null;
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl border-2 border-ink bg-paper shadow-[6px_6px_0_var(--color-ink)] sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-xl font-black text-ink">{mission.titre}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          {/* Statut + domaine */}
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge statut={mission.statut as any} />
            {mission.domaineNom && (
              <span className="rounded-full border border-emerald/50 bg-emerald/10 px-2.5 py-0.5 text-xs font-semibold text-emerald">
                {mission.domaineNom}
              </span>
            )}
          </div>

          {/* Description */}
          {mission.description && (
            <p className="text-sm text-muted-foreground leading-relaxed">{mission.description}</p>
          )}

          {/* Infos */}
          <div className="rounded-xl border-2 border-ink bg-muted/30 p-4 space-y-2 text-sm">
            {mission.dateDebut && (
              <div className="flex items-center gap-2 text-ink">
                <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                <span>{formaterDate(mission.dateDebut)}
                  {mission.dateFin && mission.dateFin !== mission.dateDebut && ` → ${formaterDate(mission.dateFin)}`}
                </span>
              </div>
            )}
            {mission.adresse && (
              <div className="flex items-center gap-2 text-ink">
                <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                <span>{mission.adresse}{mission.ville ? `, ${mission.ville}` : ''}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-ink">
              <Users className="h-4 w-4 text-muted-foreground shrink-0" />
              <span>
                <span className={mission.nbInscritsConfirmes >= mission.nbPlaces ? 'font-bold text-orange-600' : 'font-bold'}>
                  {mission.nbInscritsConfirmes}
                </span>
                <span className="text-muted-foreground"> / {mission.nbPlaces} places</span>
                {mission.nbListeAttente > 0 && (
                  <span className="ml-2 text-orange-600 text-xs">({mission.nbListeAttente} en attente)</span>
                )}
              </span>
            </div>
          </div>

          {/* Compétences */}
          {mission.competenceNoms && mission.competenceNoms.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2">Compétences requises</p>
              <div className="flex flex-wrap gap-1.5">
                {mission.competenceNoms.map((c) => (
                  <Badge key={c} className="border border-ink bg-paper text-ink text-xs">{c}</Badge>
                ))}
              </div>
            </div>
          )}

          {/* Lien inscrits */}
          <Link
            to="/association/inscrits"
            onClick={onClose}
            className="flex items-center gap-2 rounded-xl border-2 border-ink bg-muted px-4 py-2.5 text-sm font-semibold hover:bg-emerald/10 transition-colors"
          >
            <CheckCircle className="h-4 w-4 text-emerald" /> Voir les inscrits
          </Link>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ── Modal Renfort ── */
function RenfortDialog({ mission, open, onClose, onConfirm }: {
  mission: MissionDashboard | null; open: boolean;
  onClose: () => void; onConfirm: (nb: number) => void;
}) {
  const [nb, setNb] = useState('1');
  if (!mission) return null;
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="rounded-2xl border-2 border-ink bg-paper shadow-[6px_6px_0_var(--color-ink)] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display font-black text-ink">⚡ Demander un renfort</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <p className="text-sm text-muted-foreground">
            Mission : <span className="font-semibold text-ink">{mission.titre}</span>
          </p>
          <div className="space-y-1.5">
            <Label htmlFor="nb-renfort" className="text-sm font-bold text-ink">
              Nombre de bénévoles supplémentaires *
            </Label>
            <Input id="nb-renfort" type="number" min={1} max={100} value={nb}
              onChange={(e) => setNb(e.target.value)}
              className="rounded-xl border-2 border-ink w-32 shadow-[2px_2px_0_var(--color-ink)]" />
          </div>
          <p className="text-xs text-muted-foreground">
            La mission passera au statut <strong>RENFORT URGENT</strong>. Les bénévoles en liste d'attente seront notifiés.
          </p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1 border-2 border-ink font-bold rounded-xl">
              Annuler
            </Button>
            <Button onClick={() => { onConfirm(Number(nb)); onClose(); }}
              disabled={!nb || Number(nb) < 1}
              className="flex-1 rounded-xl border-2 border-ink bg-pink font-bold text-pink-foreground shadow-[3px_3px_0_var(--color-ink)] hover:opacity-90">
              <Zap className="mr-2 h-4 w-4" /> Demander le renfort
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ── Modal Photos ── */
function PhotosDialog({ mission, open, onClose }: {
  mission: MissionDashboard | null; open: boolean; onClose: () => void;
}) {
  const [images, setImages] = useState<ImageEvenementDashboard[]>([]);
  const [loading, setLoading] = useState(false);
  const [newUrl, setNewUrl] = useState('');
  const [newTitre, setNewTitre] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!open || !mission) return;
    setLoading(true);
    getMissionImages(mission.id)
      .then(setImages)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [open, mission]);

  async function handleAdd() {
    if (!newUrl || !mission) return;
    setUploading(true);
    try {
      const img = await addMissionImage(mission.id, { url: newUrl, titre: newTitre, description: newDesc });
      setImages(prev => [img, ...prev]);
      setNewUrl(''); setNewTitre(''); setNewDesc('');
      toast.success('Photo ajoutée !');
    } catch (err: any) {
      toast.error(err.message ?? 'Erreur lors de l\'ajout.');
    } finally {
      setUploading(false);
    }
  }

  if (!mission) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl border-2 border-ink bg-paper shadow-[6px_6px_0_var(--color-ink)] sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-display font-black text-ink">📷 Photos — {mission.titre}</DialogTitle>
        </DialogHeader>
        <div className="space-y-5 mt-2">
          {/* Upload */}
          <div className="rounded-xl border-2 border-ink bg-muted/30 p-4 space-y-3">
            <p className="text-sm font-bold text-ink">Ajouter une photo</p>
            <ImageUpload id="photo-event" label="" value={newUrl} onChange={setNewUrl} />
            {newUrl && (
              <>
                <Input placeholder="Titre de la photo" value={newTitre}
                  onChange={e => setNewTitre(e.target.value)}
                  className="rounded-xl border-2 border-ink" />
                <Textarea placeholder="Description (optionnel)" value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  className="rounded-xl border-2 border-ink resize-none min-h-[60px]" />
                <Button onClick={handleAdd} disabled={uploading || !newUrl}
                  className="rounded-xl border-2 border-ink bg-emerald font-bold text-emerald-foreground shadow-[3px_3px_0_var(--color-ink)] hover:opacity-90">
                  {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Camera className="mr-2 h-4 w-4" />}
                  Ajouter la photo
                </Button>
              </>
            )}
          </div>

          {/* Galerie */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : images.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-6">Aucune photo pour le moment.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {images.map(img => (
                <div key={img.id} className="rounded-xl border-2 border-ink overflow-hidden shadow-[2px_2px_0_var(--color-ink)]">
                  <img src={img.url} alt={img.titre ?? ''} className="w-full h-32 object-cover" />
                  {img.titre && <p className="px-2 py-1 text-xs font-semibold text-ink truncate">{img.titre}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ── Page principale ── */
function MesMissions() {
  const [missions, setMissions] = useState<MissionDashboard[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statut, setStatut] = useState('Tous');
  const [page, setPage] = useState(1);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  const [actioning, setActioning] = useState(false);

  // Modals
  const [detailMission, setDetailMission] = useState<MissionDashboard | null>(null);
  const [renfortMission, setRenfortMission] = useState<MissionDashboard | null>(null);
  const [photosMission, setPhotosMission] = useState<MissionDashboard | null>(null);

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
    publier: 'PUBLIEE', annuler: 'ANNULEE', cloturer: 'CLOTUREE', depublier: 'BROUILLON',
  };

  async function executeAction(action: ConfirmAction) {
    setActioning(true);
    try {
      const updated = await changeMissionStatut(action.id, actionStatutMap[action.action]);
      setMissions(prev => prev.map(m => m.id === action.id ? updated : m));
      toast.success({ publier: '🚀 Mission publiée !', annuler: 'Mission annulée.', cloturer: '✅ Mission clôturée !', depublier: 'Repassée en brouillon.' }[action.action]);
    } catch (err: any) {
      toast.error(err.message ?? 'Erreur.');
    } finally { setActioning(false); setConfirmAction(null); }
  }

  async function handleRenfort(missionId: number, nb: number) {
    try {
      const updated = await demanderRenfort(missionId, nb);
      setMissions(prev => prev.map(m => m.id === missionId ? updated : m));
      toast.success(`⚡ Renfort demandé (${nb} bénévoles) !`);
    } catch (err: any) {
      toast.error(err.message ?? 'Erreur lors du renfort.');
    }
  }

  const confirmItem = confirmAction ? missions.find(m => m.id === confirmAction.id) : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-black text-ink">Mes missions</h1>
          <p className="mt-1 text-sm text-muted-foreground">{filtered.length} mission(s)</p>
        </div>
        <Link to="/association/nouvelle-mission"
          className="inline-flex items-center gap-2 rounded-xl border-2 border-ink bg-emerald px-4 py-2 text-sm font-bold text-emerald-foreground shadow-[3px_3px_0_var(--color-ink)] hover:opacity-90">
          <Plus className="h-4 w-4" /> Créer une mission
        </Link>
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap gap-3 rounded-2xl border-2 border-ink bg-paper p-4 shadow-[4px_4px_0_var(--color-ink)]">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Rechercher…" value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9 rounded-xl border-2 border-ink" />
        </div>
        <Select value={statut} onValueChange={(v) => { setStatut(v); setPage(1); }}>
          <SelectTrigger className="w-52 rounded-xl border-2 border-ink">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            {STATUTS_FILTER.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
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
                <th className="border-b-2 border-ink px-4 py-3 text-left font-bold">Statut</th>
                <th className="border-b-2 border-ink px-4 py-3 text-left font-bold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">Aucune mission trouvée.</td></tr>
              ) : pageItems.map((m, idx) => (
                <tr key={m.id} className={idx % 2 === 0 ? 'bg-paper' : 'bg-muted'}>
                  <td className="px-4 py-3 font-medium text-ink max-w-[200px] truncate">{m.titre}</td>
                  <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                    {formaterDate(m.dateDebut)}
                    {m.dateDebut !== m.dateFin && <> → {formaterDate(m.dateFin)}</>}
                  </td>
                  <td className="hidden px-4 py-3 sm:table-cell">
                    <span className={m.nbInscritsConfirmes >= m.nbPlaces ? 'font-bold text-orange-600' : 'text-ink'}>
                      {m.nbInscritsConfirmes}
                    </span>
                    <span className="text-muted-foreground"> / {m.nbPlaces}</span>
                  </td>
                  <td className="px-4 py-3"><StatusBadge statut={m.statut as any} /></td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {/* Voir */}
                      <button onClick={() => setDetailMission(m)}
                        className="rounded-lg border border-ink bg-paper px-2 py-1 text-xs font-semibold hover:bg-muted flex items-center gap-1">
                        <Eye className="h-3 w-3" /> Voir
                      </button>
                      {/* Modifier */}
                      {!['CLOTUREE', 'ANNULEE', 'TERMINEE'].includes(m.statut) && (
                        <Link to="/association/nouvelle-mission" search={{ id: String(m.id) }}
                          className="rounded-lg border border-ink bg-paper px-2 py-1 text-xs font-semibold hover:bg-muted">
                          Modifier
                        </Link>
                      )}
                      {/* Publier */}
                      {m.statut === 'BROUILLON' && (
                        <button onClick={() => setConfirmAction({ id: m.id, action: 'publier' })}
                          className="rounded-lg border border-ink bg-emerald px-2 py-1 text-xs font-semibold text-emerald-foreground hover:opacity-90">
                          Publier
                        </button>
                      )}
                      {/* Dépublier */}
                      {m.statut === 'PUBLIEE' && (
                        <button onClick={() => setConfirmAction({ id: m.id, action: 'depublier' })}
                          className="rounded-lg border border-ink bg-mustard px-2 py-1 text-xs font-semibold text-ink hover:opacity-90">
                          Brouillon
                        </button>
                      )}
                      {/* Renfort */}
                      {['EN_COURS', 'PUBLIEE'].includes(m.statut) && (
                        <button onClick={() => setRenfortMission(m)}
                          className="rounded-lg border border-orange-400 bg-orange-50 px-2 py-1 text-xs font-semibold text-orange-700 hover:bg-orange-100 flex items-center gap-1">
                          <Zap className="h-3 w-3" /> Renfort
                        </button>
                      )}
                      {/* Annuler */}
                      {['PUBLIEE', 'SATUREE', 'RENFORT_URGENT'].includes(m.statut) && (
                        <button onClick={() => setConfirmAction({ id: m.id, action: 'annuler' })}
                          className="rounded-lg border border-red-300 bg-red-50 px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-100">
                          Annuler
                        </button>
                      )}
                      {/* Clôturer */}
                      {['TERMINEE', 'EN_COURS'].includes(m.statut) && (
                        <button onClick={() => setConfirmAction({ id: m.id, action: 'cloturer' })}
                          className="rounded-lg border border-ink bg-mustard px-2 py-1 text-xs font-semibold text-ink hover:opacity-90">
                          Clôturer
                        </button>
                      )}
                      {/* Photos */}
                      {['CLOTUREE', 'TERMINEE'].includes(m.statut) && (
                        <button onClick={() => setPhotosMission(m)}
                          className="rounded-lg border border-ink bg-paper px-2 py-1 text-xs font-semibold hover:bg-muted flex items-center gap-1">
                          <Camera className="h-3 w-3" /> Photos
                        </button>
                      )}
                      {/* Inscrits */}
                      <Link to="/association/inscrits"
                        className="rounded-lg border border-ink bg-paper px-2 py-1 text-xs font-semibold hover:bg-muted">
                        Inscrits
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="rounded-xl border-2 border-ink shadow-[2px_2px_0_var(--color-ink)]">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-semibold text-ink">Page {page} / {totalPages}</span>
          <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            className="rounded-xl border-2 border-ink shadow-[2px_2px_0_var(--color-ink)]">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Dialogs */}
      <MissionDetailDialog mission={detailMission} open={!!detailMission} onClose={() => setDetailMission(null)} />
      <RenfortDialog mission={renfortMission} open={!!renfortMission}
        onClose={() => setRenfortMission(null)}
        onConfirm={(nb) => { if (renfortMission) handleRenfort(renfortMission.id, nb); }} />
      <PhotosDialog mission={photosMission} open={!!photosMission} onClose={() => setPhotosMission(null)} />

      {/* Confirm dialog */}
      <ConfirmDialog
        open={!!confirmAction} onOpenChange={(v) => !v && setConfirmAction(null)}
        title={confirmAction ? { publier: 'Publier', annuler: 'Annuler', cloturer: 'Clôturer', depublier: 'Brouillon' }[confirmAction.action] : ''}
        description={`Confirmer pour "${confirmItem?.titre ?? ''}" ?`}
        confirmLabel={actioning ? 'En cours…' : 'Confirmer'}
        variant={confirmAction?.action === 'annuler' ? 'destructive' : 'default'}
        onConfirm={() => { if (confirmAction) executeAction(confirmAction); }}
      />
    </div>
  );
}
