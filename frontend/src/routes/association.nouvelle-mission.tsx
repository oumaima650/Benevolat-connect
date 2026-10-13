import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { lazy, Suspense, useState, useEffect } from 'react';
import { z } from 'zod';
import { toast } from 'sonner';
import {
  X, Plus, Loader2, Check, BookOpen, MapPin, Zap,
  Save, Rocket, ChevronLeft, Calendar, Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchDomaines, fetchCompetences, type DomaineItem, type CompetenceItem } from '@/services/authApi';
import { createMission, updateMission, getMyMissions, type MissionFormData } from '@/services/associationApi';

export const Route = createFileRoute('/association/nouvelle-mission')({
  validateSearch: z.object({ id: z.string().optional() }),
  component: NouvelleMission,
});

const MissionMapPicker = lazy(() => import('@/components/dashboard/MissionMapPicker'));

/* ── Section card avec header coloré ── */
function SectionCard({ icon: Icon, title, iconColor = 'text-ink', badge, children }: {
  icon: React.ElementType; title: string; iconColor?: string; badge?: string; children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border-2 border-ink bg-paper shadow-[4px_4px_0_var(--color-ink)] overflow-hidden h-fit">
      <div className="flex items-center justify-between border-b-2 border-ink bg-muted/30 px-5 py-3.5">
        <div className="flex items-center gap-3">
          <div className={`flex h-8 w-8 items-center justify-center rounded-xl border-2 border-ink bg-paper shadow-[2px_2px_0_var(--color-ink)] ${iconColor}`}>
            <Icon className="h-4 w-4" />
          </div>
          <h2 className="font-display font-bold text-ink">{title}</h2>
        </div>
        {badge && <span className="text-xs font-medium text-muted-foreground">{badge}</span>}
      </div>
      <div className="p-5 space-y-4">{children}</div>
    </div>
  );
}

function TagInput({ tags, onChange, placeholder }: { tags: string[]; onChange: (t: string[]) => void; placeholder: string }) {
  const [input, setInput] = useState('');
  function add() { const v = input.trim(); if (v && !tags.includes(v)) onChange([...tags, v]); setInput(''); }
  return (
    <div className="space-y-2">
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map(t => (
            <span key={t} className="flex items-center gap-1 rounded-full border-2 border-ink bg-mustard/30 px-2.5 py-0.5 text-xs font-semibold text-ink">
              {t}
              <button type="button" onClick={() => onChange(tags.filter(x => x !== t))} className="text-ink/50 hover:text-ink ml-0.5">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <Input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
          placeholder={placeholder} className="rounded-xl border-2 border-ink shadow-[2px_2px_0_var(--color-ink)]" />
        <Button type="button" variant="outline" size="sm" onClick={add}
          className="shrink-0 rounded-xl border-2 border-ink shadow-[2px_2px_0_var(--color-ink)] hover:bg-mustard">
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function NouvelleMission() {
  const navigate = useNavigate();
  const { id: editId } = Route.useSearch();
  const isEdit = !!editId;

  const [loadingInit, setLoadingInit] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [catalogDomaines, setCatalogDomaines] = useState<DomaineItem[]>([]);
  const [catalogCompetences, setCatalogCompetences] = useState<CompetenceItem[]>([]);
  const [selectedCompetenceIds, setSelectedCompetenceIds] = useState<number[]>([]);
  const [customCompetences, setCustomCompetences] = useState<string[]>([]);
  const [position, setPosition] = useState<[number, number]>([35.5785, -5.3684]);

  const [form, setForm] = useState({
    titre: '', description: '', domaineId: 0,
    adresse: '', dateDebut: '', dateFin: '', nbPlaces: '',
  });

  useEffect(() => {
    fetchDomaines().then(setCatalogDomaines);
    fetchCompetences().then(setCatalogCompetences);
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    getMyMissions().then(missions => {
      const m = missions.find(x => String(x.id) === editId);
      if (!m) { toast.error('Mission introuvable.'); navigate({ to: '/association/missions' }); return; }
      setForm({ titre: m.titre, description: m.description ?? '', domaineId: m.domaineId ?? 0, adresse: m.adresse ?? '', dateDebut: m.dateDebut ? m.dateDebut.substring(0, 16) : '', dateFin: m.dateFin ? m.dateFin.substring(0, 16) : '', nbPlaces: String(m.nbPlaces) });
      setSelectedCompetenceIds(m.competenceIds ?? []);
      if (m.latitude && m.longitude) setPosition([m.latitude, m.longitude]);
    }).catch(() => toast.error('Impossible de charger la mission.')).finally(() => setLoadingInit(false));
  }, [editId]);

  const toggleComp = (id: number) =>
    setSelectedCompetenceIds(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);

  async function handleSubmit(e: React.FormEvent, statut: 'BROUILLON' | 'PUBLIEE'): Promise<void> {
    e.preventDefault();
    if (!form.titre.trim()) { toast.error('Le titre est obligatoire.'); return; }
    if (!form.domaineId) { toast.error('Sélectionnez un domaine.'); return; }
    if (!form.dateDebut) { toast.error('La date de début est obligatoire.'); return; }
    if (!form.nbPlaces || Number(form.nbPlaces) < 1) { toast.error('Le nombre de places doit être ≥ 1.'); return; }
    setSubmitting(true);
    try {
      const payload: MissionFormData = {
        titre: form.titre.trim(), description: form.description.trim() || null,
        domaineId: form.domaineId, adresse: form.adresse.trim() || null,
        latitude: position[0],
        longitude: position[1],
        dateDebut: form.dateDebut, dateFin: form.dateFin || null,
        nbPlaces: Number(form.nbPlaces), competenceIds: selectedCompetenceIds, statut,
      };
      if (isEdit) { await updateMission(Number(editId), payload); toast.success('Mission mise à jour !'); }
      else { await createMission(payload); toast.success(statut === 'PUBLIEE' ? 'Mission publiée !' : 'Brouillon enregistré.'); }
      navigate({ to: '/association/missions' });
    } catch (err: any) {
      toast.error(err.message ?? 'Erreur.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loadingInit) return (
    <div className="flex items-center justify-center py-24">
      <Loader2 className="h-10 w-10 animate-spin text-emerald" />
    </div>
  );

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <div className="space-y-5">
      {/* ── En-tête ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link to="/association/missions" className="flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-ink mb-1">
            <ChevronLeft className="h-3.5 w-3.5" /> Mes missions
          </Link>
          <h1 className="font-display text-2xl font-black text-ink">
            {isEdit ? 'Modifier la mission' : 'Créer une mission'}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isEdit ? 'Modifiez les informations.' : 'Renseignez les informations de votre nouvelle mission.'}
          </p>
        </div>
        {isEdit && <span className="rounded-xl border-2 border-mustard bg-mustard/20 px-3 py-1.5 text-xs font-bold text-ink">Mode édition</span>}
      </div>

      <form className="space-y-0">
        {/* ── Layout 2 colonnes ── */}
        <div className="grid gap-5 lg:grid-cols-2">

          {/* ── Colonne gauche ── */}
          <div className="space-y-5">
            {/* Section 1 : Infos générales */}
            <SectionCard icon={BookOpen} title="Informations générales" iconColor="text-pink">
              <div className="space-y-1.5">
                <Label htmlFor="titre" className="text-sm font-bold text-ink">Titre <span className="text-pink">*</span></Label>
                <Input id="titre" value={form.titre} onChange={set('titre')}
                  placeholder="Ex: Distribution de repas solidaires"
                  className="rounded-xl border-2 border-ink shadow-[2px_2px_0_var(--color-ink)] focus:shadow-[3px_3px_0_var(--color-ink)] transition-shadow" />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="description" className="text-sm font-bold text-ink">Description</Label>
                <Textarea id="description" value={form.description} onChange={set('description')}
                  placeholder="Objectifs, tâches confiées aux bénévoles…"
                  className="min-h-[100px] rounded-xl border-2 border-ink shadow-[2px_2px_0_var(--color-ink)] resize-none" />
              </div>

              {/* Domaine */}
              <div className="space-y-2">
                <Label className="text-sm font-bold text-ink">Domaine d'activité <span className="text-pink">*</span></Label>
                <div className="flex flex-wrap gap-1.5">
                  {catalogDomaines.map(d => {
                    const active = form.domaineId === d.id;
                    return (
                      <Badge key={d.id} onClick={() => setForm(f => ({ ...f, domaineId: d.id }))}
                        className={`cursor-pointer border border-ink text-xs transition-all select-none ${active ? 'bg-emerald text-emerald-foreground font-bold shadow-[2px_2px_0_var(--color-ink)]' : 'bg-paper hover:bg-emerald/20 text-ink/80'}`}>
                        {active && <Check className="mr-1 h-3 w-3 inline" />}{d.nom}
                      </Badge>
                    );
                  })}
                </div>
                <p className="text-xs text-muted-foreground">Sélectionnez un seul domaine principal.</p>
              </div>
            </SectionCard>

            {/* Section 3 : Compétences */}
            <SectionCard icon={Zap} title="Compétences requises" iconColor="text-yellow-500"
              badge={`${selectedCompetenceIds.length} sélectionnée(s)`}>
              <div className="flex flex-wrap gap-1.5">
                {catalogCompetences.map(c => {
                  const active = selectedCompetenceIds.includes(c.id);
                  return (
                    <Badge key={c.id} onClick={() => toggleComp(c.id)}
                      className={`cursor-pointer border border-ink text-xs transition-all select-none ${active ? 'bg-mustard text-ink font-bold shadow-[2px_2px_0_var(--color-ink)]' : 'bg-paper hover:bg-mustard/30 text-ink/80'}`}>
                      {active ? <Check className="mr-1 h-3 w-3 inline" /> : <Plus className="mr-1 h-3 w-3 inline" />}{c.nom}
                    </Badge>
                  );
                })}
              </div>
              <div className="border-t border-ink/10 pt-3">
                <p className="text-xs font-semibold text-muted-foreground mb-2">Compétences spécifiques :</p>
                <TagInput tags={customCompetences} onChange={setCustomCompetences} placeholder="Ajouter une compétence…" />
              </div>
            </SectionCard>
          </div>

          {/* ── Colonne droite ── */}
          <div className="space-y-5">
            {/* Section 2 : Lieu & dates */}
            <SectionCard icon={MapPin} title="Lieu & dates" iconColor="text-blue-500">
              <div className="space-y-1.5">
                <Label htmlFor="adresse" className="text-sm font-bold text-ink">Adresse</Label>
                <Input id="adresse" value={form.adresse} onChange={set('adresse')}
                  placeholder="Bd Mohammed V, Tétouan"
                  className="rounded-xl border-2 border-ink shadow-[2px_2px_0_var(--color-ink)]" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-bold text-ink">Position sur la carte</Label>
                <p className="text-xs text-muted-foreground">Cliquez sur la carte pour placer le marqueur.</p>
                <Suspense fallback={<Skeleton className="h-56 w-full rounded-xl" />}>
                  <div className="rounded-xl overflow-hidden border-2 border-ink shadow-[3px_3px_0_var(--color-ink)]">
                    <MissionMapPicker value={position} onChange={setPosition} />
                  </div>
                </Suspense>
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
                  <MapPin className="h-3 w-3" /> {position[0].toFixed(5)}, {position[1].toFixed(5)}
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="dateDebut" className="text-sm font-bold text-ink">Début <span className="text-pink">*</span></Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input id="dateDebut" type="datetime-local" value={form.dateDebut} onChange={set('dateDebut')}
                      className="rounded-xl border-2 border-ink pl-9 shadow-[2px_2px_0_var(--color-ink)]" required />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="dateFin" className="text-sm font-bold text-ink">Fin</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input id="dateFin" type="datetime-local" value={form.dateFin} onChange={set('dateFin')}
                      className="rounded-xl border-2 border-ink pl-9 shadow-[2px_2px_0_var(--color-ink)]" />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="places" className="text-sm font-bold text-ink">Nombre de places <span className="text-pink">*</span></Label>
                <div className="relative w-48">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input id="places" type="number" min={1} value={form.nbPlaces} onChange={set('nbPlaces')}
                    placeholder="20"
                    className="rounded-xl border-2 border-ink pl-9 shadow-[2px_2px_0_var(--color-ink)]" required />
                </div>
                <p className="text-xs text-muted-foreground">Nombre maximum de bénévoles.</p>
              </div>
            </SectionCard>

            {/* Récapitulatif rapide */}
            <div className="rounded-2xl border-2 border-ink bg-muted/30 p-4 space-y-2">
              <p className="flex items-center gap-1.5 font-bold text-ink text-sm">
                <BookOpen className="h-3.5 w-3.5 text-muted-foreground" /> Récapitulatif
              </p>
              <div className="space-y-1 text-xs text-muted-foreground">
                <p><span className="font-semibold text-ink">Titre :</span> {form.titre || '—'}</p>
                <p><span className="font-semibold text-ink">Domaine :</span> {catalogDomaines.find(d => d.id === form.domaineId)?.nom || '—'}</p>
                <p><span className="font-semibold text-ink">Places :</span> {form.nbPlaces || '—'}</p>
                <p><span className="font-semibold text-ink">Compétences :</span> {selectedCompetenceIds.length + customCompetences.length} sélectionnée(s)</p>
              </div>
            </div>

            {/* Boutons */}
            <div className="flex flex-col gap-3">
              {!isEdit && (
                <Button type="button" disabled={submitting} onClick={e => handleSubmit(e, 'PUBLIEE')}
                  className="w-full rounded-xl border-2 border-ink bg-emerald font-bold text-emerald-foreground shadow-[4px_4px_0_var(--color-ink)] hover:-translate-y-0.5 hover:shadow-[5px_5px_0_var(--color-ink)] transition-all py-3 disabled:opacity-60 disabled:pointer-events-none">
                  {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Rocket className="mr-2 h-4 w-4" />}
                  Publier la mission
                </Button>
              )}
              <Button type="button" variant="outline" disabled={submitting} onClick={e => handleSubmit(e, 'BROUILLON')}
                className="w-full rounded-xl border-2 border-ink bg-paper font-bold shadow-[3px_3px_0_var(--color-ink)] hover:bg-mustard/40 transition-colors py-3">
                {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                {isEdit ? 'Enregistrer les modifications' : 'Enregistrer en brouillon'}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
