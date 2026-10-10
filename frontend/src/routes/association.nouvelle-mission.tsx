import { createFileRoute } from '@tanstack/react-router';
import { lazy, Suspense, useState } from 'react';
import { toast } from 'sonner';
import { X, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Skeleton } from '@/components/ui/skeleton';

export const Route = createFileRoute('/association/nouvelle-mission')({
  component: NouvelleMission,
});

const MissionMapPicker = lazy(() => import('@/components/dashboard/MissionMapPicker'));

const DOMAINES = ['Solidarité', 'Environnement', 'Éducation', 'Sport', 'Santé', 'Culture', 'Social'];

function TagInput({
  tags,
  onChange,
  placeholder,
}: {
  tags: string[];
  onChange: (t: string[]) => void;
  placeholder: string;
}) {
  const [input, setInput] = useState('');

  function add() {
    const v = input.trim();
    if (v && !tags.includes(v)) {
      onChange([...tags, v]);
    }
    setInput('');
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {tags.map((t) => (
          <span
            key={t}
            className="flex items-center gap-1 rounded-full border-2 border-ink bg-emerald/20 px-3 py-0.5 text-sm font-medium text-ink"
          >
            {t}
            <button
              type="button"
              onClick={() => onChange(tags.filter((x) => x !== t))}
              className="ml-0.5 text-ink/60 hover:text-ink"
              aria-label={`Supprimer ${t}`}
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              add();
            }
          }}
          placeholder={placeholder}
          className="rounded-xl border-2 border-ink"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={add}
          className="shrink-0 rounded-xl border-2 border-ink shadow-[2px_2px_0_var(--color-ink)]"
          aria-label="Ajouter"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}

function NouvelleMission() {
  const [form, setForm] = useState({
    titre: '',
    description: '',
    domaine: '',
    type: 'sur_place' as 'sur_place' | 'a_distance',
    adresse: '',
    dateDebut: '',
    dateFin: '',
    places: '',
    competences: [] as string[],
  });
  const [position, setPosition] = useState<[number, number]>([35.5785, -5.3684]);

  function handleSubmit(e: React.FormEvent, mode: 'brouillon' | 'publier') {
    e.preventDefault();
    if (mode === 'brouillon') {
      toast.info('Brouillon enregistré');
    } else {
      toast.success('Mission publiée !');
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-black text-ink">Créer une mission</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Renseignez les informations de votre mission bénévole.
        </p>
      </div>

      <form className="space-y-6">
        {/* Section 1: Informations */}
        <div className="rounded-2xl border-2 border-ink bg-paper p-5 shadow-[4px_4px_0_var(--color-ink)] space-y-4">
          <h2 className="font-display font-bold text-ink">1. Informations générales</h2>

          <div className="space-y-1.5">
            <Label htmlFor="titre">Titre de la mission <span className="text-red-500">*</span></Label>
            <Input
              id="titre"
              value={form.titre}
              onChange={(e) => setForm((f) => ({ ...f, titre: e.target.value }))}
              placeholder="Ex: Distribution de repas solidaires"
              className="rounded-xl border-2 border-ink"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Décrivez la mission, ses objectifs et les tâches des bénévoles…"
              className="min-h-[100px] rounded-xl border-2 border-ink"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="domaine">Domaine <span className="text-red-500">*</span></Label>
            <Select value={form.domaine} onValueChange={(v) => setForm((f) => ({ ...f, domaine: v }))}>
              <SelectTrigger id="domaine" className="rounded-xl border-2 border-ink">
                <SelectValue placeholder="Choisir un domaine" />
              </SelectTrigger>
              <SelectContent>
                {DOMAINES.map((d) => (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Type de mission</Label>
            <RadioGroup
              value={form.type}
              onValueChange={(v: 'sur_place' | 'a_distance') => setForm((f) => ({ ...f, type: v }))}
              className="flex gap-4"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="sur_place" id="sur_place" />
                <Label htmlFor="sur_place" className="cursor-pointer font-normal">Sur place</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="a_distance" id="a_distance" />
                <Label htmlFor="a_distance" className="cursor-pointer font-normal">À distance</Label>
              </div>
            </RadioGroup>
          </div>
        </div>

        <hr className="border-ink/20" />

        {/* Section 2: Lieu & dates */}
        <div className="rounded-2xl border-2 border-ink bg-paper p-5 shadow-[4px_4px_0_var(--color-ink)] space-y-4">
          <h2 className="font-display font-bold text-ink">2. Lieu & dates</h2>

          {form.type === 'sur_place' && (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="adresse">Adresse</Label>
                <Input
                  id="adresse"
                  value={form.adresse}
                  onChange={(e) => setForm((f) => ({ ...f, adresse: e.target.value }))}
                  placeholder="Ex: Bd Mohammed V, Tétouan"
                  className="rounded-xl border-2 border-ink"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Position sur la carte</Label>
                <p className="text-xs text-muted-foreground mb-1">
                  Cliquez sur la carte pour placer le marqueur exactement.
                </p>
                <Suspense fallback={<Skeleton className="h-60 w-full rounded-xl" />}>
                  <MissionMapPicker value={position} onChange={setPosition} />
                </Suspense>
                <p className="text-xs text-muted-foreground mt-1">
                  Position : {position[0].toFixed(4)}, {position[1].toFixed(4)}
                </p>
              </div>
            </>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="dateDebut">Date et heure de début <span className="text-red-500">*</span></Label>
              <Input
                id="dateDebut"
                type="datetime-local"
                value={form.dateDebut}
                onChange={(e) => setForm((f) => ({ ...f, dateDebut: e.target.value }))}
                className="rounded-xl border-2 border-ink"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dateFin">Date et heure de fin</Label>
              <Input
                id="dateFin"
                type="datetime-local"
                value={form.dateFin}
                onChange={(e) => setForm((f) => ({ ...f, dateFin: e.target.value }))}
                className="rounded-xl border-2 border-ink"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="places">Nombre de places <span className="text-red-500">*</span></Label>
            <Input
              id="places"
              type="number"
              min={1}
              value={form.places}
              onChange={(e) => setForm((f) => ({ ...f, places: e.target.value }))}
              placeholder="Ex: 20"
              className="w-36 rounded-xl border-2 border-ink"
              required
            />
          </div>
        </div>

        <hr className="border-ink/20" />

        {/* Section 3: Compétences */}
        <div className="rounded-2xl border-2 border-ink bg-paper p-5 shadow-[4px_4px_0_var(--color-ink)] space-y-4">
          <h2 className="font-display font-bold text-ink">3. Compétences requises</h2>
          <TagInput
            tags={form.competences}
            onChange={(t) => setForm((f) => ({ ...f, competences: t }))}
            placeholder="Ajouter une compétence (Entrée pour valider)…"
          />
        </div>

        {/* Buttons */}
        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={(e) => handleSubmit(e, 'brouillon')}
            className="rounded-xl border-2 border-ink shadow-[3px_3px_0_var(--color-ink)] bg-mustard/30 hover:bg-mustard/60"
          >
            Enregistrer en brouillon
          </Button>
          <Button
            type="button"
            onClick={(e) => handleSubmit(e, 'publier')}
            className="rounded-xl border-2 border-ink bg-emerald font-bold text-emerald-foreground shadow-[3px_3px_0_var(--color-ink)] hover:opacity-90"
          >
            Publier la mission
          </Button>
        </div>
      </form>
    </div>
  );
}
