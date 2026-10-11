import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { lazy, Suspense, useState, useEffect } from 'react';
import { z } from 'zod';
import { toast } from 'sonner';
import { X, Plus, Loader2, Check, BookOpen, MapPin, Zap, Save, Rocket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchDomaines, fetchCompetences, type DomaineItem, type CompetenceItem } from '@/services/authApi';
import { createMission, updateMission, getMyMissions } from '@/services/associationApi';

export const Route = createFileRoute('/association/nouvelle-mission')({
  validateSearch: z.object({ id: z.string().optional() }),
  component: NouvelleMission,
});

const MissionMapPicker = lazy(() => import('@/components/dashboard/MissionMapPicker'));

function TagInput({ tags, onChange, placeholder }: { tags: string[]; onChange: (t: string[]) => void; placeholder: string }) {
  const [input, setInput] = useState('');
  function add() {
    const v = input.trim();
    if (v && !tags.includes(v)) onChange([...tags, v]);
    setInput('');
  }
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {tags.map((t) => (
          <span key={t} className="flex items-center gap-1 rounded-full border-2 border-ink bg-emerald/20 px-3 py-0.5 text-sm font-medium text-ink">
            {t}
            <button type="button" onClick={() => onChange(tags.filter((x) => x !== t))} className="ml-0.5 text-ink/60 hover:text-ink" aria-label={`Supprimer ${t}`}>
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <Input value={input} onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
          placeholder={placeholder} className="rounded-xl border-2 border-ink" />
        <Button type="button" variant="outline" size="sm" onClick={add}
          className="shrink-0 rounded-xl border-2 border-ink shadow-[2px_2px_0_var(--color-ink)]">
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
    titre: '',
    description: '',
    domaineId: 0,
    type: 'sur_place' as 'sur_place' | 'a_distance',
    adresse: '',
    dateDebut: '',
    dateFin: '',
    nbPlaces: '',
  });

  useEffect(() => {
    fetchDomaines().then(setCatalogDomaines);
    fetchCompetences().then(setCatalogCompetences);
  }, []);

  // Mode édition : charger les données de la mission
  useEffect(() => {
    if (!isEdit) return;
    getMyMissions()
      .then((missions) => {
        const m = missions.find((x) => String(x.id) === editId);
        if (!m) { toast.error('Mission introuvable.'); navigate({ to: '/association/missions' }); return; }
        setForm({
          titre: m.titre,
          description: m.description ?? '',
          domaineId: m.domaineId ?? 0,
          type: 'sur_place',
          adresse: m.adresse ?? '',
          dateDebut: m.dateDebut ? m.dateDebut.substring(0, 16) : '',
          dateFin: m.dateFin ? m.dateFin.substring(0, 16) : '',
          nbPlaces: String(m.nbPlaces),
        });
        setSelectedCompetenceIds(m.competenceIds ?? []);
        if (m.latitude && m.longitude) setPosition([m.latitude, m.longitude]);
      })
      .catch(() => toast.error('Impossible de charger la mission.'))
      .finally(() => setLoadingInit(false));
  }, [editId]);

  const toggleCompetence = (id: number) =>
    setSelectedCompetenceIds((prev) => prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]);

  async function handleSubmit(e: React.FormEvent, statut: 'BROUILLON' | 'PUBLIEE'): Promise<void> {
    e.preventDefault();
    if (!form.titre.trim()) { toast.error('Le titre est obligatoire.'); return; }
    if (!form.domaineId) { toast.error('Veuillez sélectionner un domaine.'); return; }
    if (!form.dateDebut) { toast.error('La date de début est obligatoire.'); return; }
    if (!form.nbPlaces || Number(form.nbPlaces) < 1) { toast.error('Le nombre de places doit être ≥ 1.'); return; }

    setSubmitting(true);
    try {
      const payload: MissionFormData = {
        titre: form.titre.trim(),
        description: form.description.trim() || undefined,
        domaineId: form.domaineId,
        adresse: form.adresse.trim() || undefined,
        latitude: form.type === 'sur_place' ? position[0] : undefined,
        longitude: form.type === 'sur_place' ? position[1] : undefined,
        dateDebut: form.dateDebut,
        dateFin: form.dateFin || undefined,
        nbPlaces: Number(form.nbPlaces),
        competenceIds: selectedCompetenceIds,
        statut,
      };

      if (isEdit) {
        await updateMission(Number(editId), payload);
        toast.success('Mission mise à jour !');
      } else {
        await createMission(payload);
        toast.success(statut === 'PUBLIEE' ? '🚀 Mission publiée !' : 'Brouillon enregistré.');
      }
      navigate({ to: '/association/missions' });
    } catch (err: any) {
      toast.error(err.message ?? 'Erreur lors de la soumission.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loadingInit) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-black text-ink">
          {isEdit ? 'Modifier la mission' : 'Créer une mission'}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {isEdit ? 'Modifiez les informations de votre mission.' : 'Renseignez les informations de votre nouvelle mission bénévole.'}
        </p>
      </div>

      <form className="space-y-5">

        {/* ── Section 1 : Informations générales ── */}
        <div className="rounded-2xl border-2 border-ink bg-paper p-5 shadow-[4px_4px_0_var(--color-ink)] space-y-4">
          <h2 className="flex items-center gap-2 font-display font-bold text-ink">
            <BookOpen className="h-5 w-5 text-pink" /> Informations générales
          </h2>

          <div className="space-y-1.5">
            <Label htmlFor="titre" className="text-sm font-bold text-ink">Titre *</Label>
            <Input id="titre" value={form.titre} onChange={set('titre')}
              placeholder="Ex: Distribution de repas solidaires"
              className="rounded-xl border-2 border-ink" required />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description" className="text-sm font-bold text-ink">Description</Label>
            <Textarea id="description" value={form.description} onChange={set('description')}
              placeholder="Décrivez la mission, ses objectifs et les tâches des bénévoles…"
              className="min-h-[100px] rounded-xl border-2 border-ink" />
          </div>

          {/* Domaine */}
          <div className="space-y-2">
            <Label className="text-sm font-bold text-ink">Domaine *</Label>
            <div className="flex flex-wrap gap-2">
              {catalogDomaines.map((d) => {
                const active = form.domaineId === d.id;
                return (
                  <Badge key={d.id} onClick={() => setForm((f) => ({ ...f, domaineId: d.id }))}
                    className={`cursor-pointer border border-ink text-xs transition-all ${active ? 'bg-emerald text-emerald-foreground font-bold' : 'bg-paper hover:bg-emerald/20 text-ink/80'}`}>
                    {active && <Check className="mr-1 h-3 w-3 inline" />}
                    {d.nom}
                  </Badge>
                );
              })}
            </div>
          </div>

          {/* Type */}
          <div className="space-y-2">
            <Label className="text-sm font-bold text-ink">Type de mission</Label>
            <RadioGroup
              value={form.type}
              onValueChange={(v: 'sur_place' | 'a_distance') => setForm((f) => ({ ...f, type: v }))}
              className="flex gap-4"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="sur_place" id="sur_place" />
                <Label htmlFor="sur_place" className="cursor-pointer font-normal">📍 Sur place</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="a_distance" id="a_distance" />
                <Label htmlFor="a_distance" className="cursor-pointer font-normal">💻 À distance</Label>
              </div>
            </RadioGroup>
          </div>
        </div>

        {/* ── Section 2 : Lieu & dates ── */}
        <div className="rounded-2xl border-2 border-ink bg-paper p-5 shadow-[4px_4px_0_var(--color-ink)] space-y-4">
          <h2 className="flex items-center gap-2 font-display font-bold text-ink">
            <MapPin className="h-5 w-5 text-pink" /> Lieu & dates
          </h2>

          {form.type === 'sur_place' && (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="adresse" className="text-sm font-bold text-ink">Adresse</Label>
                <Input id="adresse" value={form.adresse} onChange={set('adresse')}
                  placeholder="Ex: Bd Mohammed V, Tétouan"
                  className="rounded-xl border-2 border-ink" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-bold text-ink">Position sur la carte</Label>
                <p className="text-xs text-muted-foreground">Cliquez sur la carte pour placer le marqueur.</p>
                <Suspense fallback={<Skeleton className="h-60 w-full rounded-xl" />}>
                  <MissionMapPicker value={position} onChange={setPosition} />
                </Suspense>
                <p className="text-xs text-muted-foreground">
                  Position : {position[0].toFixed(4)}, {position[1].toFixed(4)}
                </p>
              </div>
            </>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="dateDebut" className="text-sm font-bold text-ink">Début *</Label>
              <Input id="dateDebut" type="datetime-local" value={form.dateDebut} onChange={set('dateDebut')}
                className="rounded-xl border-2 border-ink" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dateFin" className="text-sm font-bold text-ink">Fin</Label>
              <Input id="dateFin" type="datetime-local" value={form.dateFin} onChange={set('dateFin')}
                className="rounded-xl border-2 border-ink" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="places" className="text-sm font-bold text-ink">Nombre de places *</Label>
            <Input id="places" type="number" min={1} value={form.nbPlaces} onChange={set('nbPlaces')}
              placeholder="Ex: 20" className="w-36 rounded-xl border-2 border-ink" required />
          </div>
        </div>

        {/* ── Section 3 : Compétences ── */}
        <div className="rounded-2xl border-2 border-ink bg-paper p-5 shadow-[4px_4px_0_var(--color-ink)] space-y-4">
          <h2 className="flex items-center gap-2 font-display font-bold text-ink">
            <Zap className="h-5 w-5 text-mustard" /> Compétences requises
          </h2>
          <p className="text-xs text-muted-foreground">Sélectionnez dans le catalogue ou ajoutez les vôtres :</p>

          {/* Catalogue */}
          <div className="flex flex-wrap gap-2">
            {catalogCompetences.map((c) => {
              const active = selectedCompetenceIds.includes(c.id);
              return (
                <Badge key={c.id} onClick={() => toggleCompetence(c.id)}
                  className={`cursor-pointer border border-ink text-xs transition-all ${active ? 'bg-mustard text-ink font-bold' : 'bg-paper hover:bg-mustard/30 text-ink/80'}`}>
                  {active ? <Check className="mr-1 h-3 w-3 inline" /> : <Plus className="mr-1 h-3 w-3 inline" />}
                  {c.nom}
                </Badge>
              );
            })}
          </div>

          {/* Custom */}
          <TagInput tags={customCompetences} onChange={setCustomCompetences}
            placeholder="Autre compétence (Entrée pour valider)…" />
        </div>

        {/* ── Boutons ── */}
        <div className="flex flex-wrap gap-3">
          <Button type="button" variant="outline"
            disabled={submitting}
            onClick={(e) => handleSubmit(e, 'BROUILLON')}
            className="rounded-xl border-2 border-ink bg-mustard/30 font-bold shadow-[3px_3px_0_var(--color-ink)] hover:bg-mustard/60"
          >
            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {isEdit ? 'Enregistrer' : 'Enregistrer en brouillon'}
          </Button>
          {!isEdit && (
            <Button type="button"
              disabled={submitting}
              onClick={(e) => handleSubmit(e, 'PUBLIEE')}
              className="rounded-xl border-2 border-ink bg-emerald font-bold text-emerald-foreground shadow-[3px_3px_0_var(--color-ink)] hover:opacity-90"
            >
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Rocket className="mr-2 h-4 w-4" />}
              Publier la mission
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
