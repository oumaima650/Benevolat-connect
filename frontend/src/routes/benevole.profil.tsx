import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { toast } from 'sonner';
import { X, Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { ConfirmDialog } from '@/components/dashboard/ConfirmDialog';
import { benevoleProfile } from '@/components/dashboard/data';

export const Route = createFileRoute('/benevole/profil')({
  component: ProfilBenevole,
});

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

  function remove(tag: string) {
    onChange(tags.filter((t) => t !== tag));
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {tags.map((t) => (
          <span
            key={t}
            className="flex items-center gap-1 rounded-full border-2 border-ink bg-mustard/30 px-3 py-0.5 text-sm font-medium text-ink"
          >
            {t}
            <button
              type="button"
              onClick={() => remove(t)}
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

function ProfilBenevole() {
  const [form, setForm] = useState({
    prenom: benevoleProfile.prenom,
    nom: benevoleProfile.nom,
    ville: benevoleProfile.ville,
    bio: benevoleProfile.bio,
    rayon: benevoleProfile.rayonKm,
    competences: benevoleProfile.competences,
    interets: benevoleProfile.interets,
  });

  const [pwOpen, setPwOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [pwForm, setPwForm] = useState({ actuel: '', nouveau: '', confirmation: '' });

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    toast.success('Profil mis à jour !');
  }

  function handlePwSave(e: React.FormEvent) {
    e.preventDefault();
    if (pwForm.nouveau !== pwForm.confirmation) {
      toast.error('Les mots de passe ne correspondent pas.');
      return;
    }
    toast.success('Mot de passe modifié !');
    setPwForm({ actuel: '', nouveau: '', confirmation: '' });
    setPwOpen(false);
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="font-display text-2xl font-black text-ink">Mon profil</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Renseignez vos informations pour que les associations vous trouvent.
        </p>
      </div>

      {/* Avatar */}
      <div className="flex items-center gap-4">
        <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-ink bg-mustard text-2xl font-black text-ink shadow-[3px_3px_0_var(--color-ink)]">
          YE
        </div>
        <div>
          <p className="font-bold text-ink">
            {form.prenom} {form.nom}
          </p>
          <p className="text-sm text-muted-foreground">{form.ville}</p>
        </div>
      </div>

      {/* Main form */}
      <form onSubmit={handleSave} className="space-y-5">
        <div className="rounded-2xl border-2 border-ink bg-paper p-5 shadow-[4px_4px_0_var(--color-ink)] space-y-4">
          <h2 className="font-display font-bold text-ink">Informations personnelles</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="prenom">Prénom</Label>
              <Input
                id="prenom"
                value={form.prenom}
                onChange={(e) => setForm((f) => ({ ...f, prenom: e.target.value }))}
                className="rounded-xl border-2 border-ink"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="nom">Nom</Label>
              <Input
                id="nom"
                value={form.nom}
                onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value }))}
                className="rounded-xl border-2 border-ink"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ville">Ville</Label>
            <Input
              id="ville"
              value={form.ville}
              onChange={(e) => setForm((f) => ({ ...f, ville: e.target.value }))}
              className="rounded-xl border-2 border-ink"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bio">Biographie</Label>
            <Textarea
              id="bio"
              value={form.bio}
              onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
              className="min-h-[100px] rounded-xl border-2 border-ink"
              placeholder="Parlez-vous en quelques mots…"
            />
          </div>
        </div>

        <div className="rounded-2xl border-2 border-ink bg-paper p-5 shadow-[4px_4px_0_var(--color-ink)] space-y-4">
          <h2 className="font-display font-bold text-ink">Rayon de déplacement</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Distance maximale</span>
              <span className="rounded-full border-2 border-ink bg-mustard px-3 py-0.5 text-sm font-bold text-ink">
                {form.rayon} km
              </span>
            </div>
            <Slider
              value={[form.rayon]}
              onValueChange={([v]) => setForm((f) => ({ ...f, rayon: v }))}
              min={5}
              max={200}
              step={5}
              className="w-full"
              aria-label="Rayon de déplacement en km"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>5 km</span>
              <span>200 km</span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border-2 border-ink bg-paper p-5 shadow-[4px_4px_0_var(--color-ink)] space-y-4">
          <h2 className="font-display font-bold text-ink">Compétences & centres d'intérêt</h2>
          <div className="space-y-1.5">
            <Label>Compétences</Label>
            <TagInput
              tags={form.competences}
              onChange={(t) => setForm((f) => ({ ...f, competences: t }))}
              placeholder="Ajouter une compétence…"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Centres d'intérêt</Label>
            <TagInput
              tags={form.interets}
              onChange={(t) => setForm((f) => ({ ...f, interets: t }))}
              placeholder="Ajouter un centre d'intérêt…"
            />
          </div>
        </div>

        <Button
          type="submit"
          className="w-full rounded-xl border-2 border-ink bg-pink font-bold text-pink-foreground shadow-[3px_3px_0_var(--color-ink)] hover:opacity-90"
        >
          Enregistrer les modifications
        </Button>
      </form>

      {/* Password section */}
      <div className="rounded-2xl border-2 border-ink bg-paper shadow-[4px_4px_0_var(--color-ink)] overflow-hidden">
        <button
          type="button"
          onClick={() => setPwOpen((v) => !v)}
          className="flex w-full items-center justify-between p-5 text-left"
          aria-expanded={pwOpen}
        >
          <h2 className="font-display font-bold text-ink">Changer mon mot de passe</h2>
          {pwOpen ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          )}
        </button>
        {pwOpen && (
          <form onSubmit={handlePwSave} className="border-t-2 border-ink p-5 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="pw-actuel">Mot de passe actuel</Label>
              <Input
                id="pw-actuel"
                type="password"
                value={pwForm.actuel}
                onChange={(e) => setPwForm((f) => ({ ...f, actuel: e.target.value }))}
                className="rounded-xl border-2 border-ink"
                autoComplete="current-password"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pw-nouveau">Nouveau mot de passe</Label>
              <Input
                id="pw-nouveau"
                type="password"
                value={pwForm.nouveau}
                onChange={(e) => setPwForm((f) => ({ ...f, nouveau: e.target.value }))}
                className="rounded-xl border-2 border-ink"
                autoComplete="new-password"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pw-confirmation">Confirmer le nouveau mot de passe</Label>
              <Input
                id="pw-confirmation"
                type="password"
                value={pwForm.confirmation}
                onChange={(e) => setPwForm((f) => ({ ...f, confirmation: e.target.value }))}
                className="rounded-xl border-2 border-ink"
                autoComplete="new-password"
              />
            </div>
            <Button
              type="submit"
              variant="outline"
              className="rounded-xl border-2 border-ink shadow-[2px_2px_0_var(--color-ink)]"
            >
              Modifier le mot de passe
            </Button>
          </form>
        )}
      </div>

      {/* Danger zone */}
      <div className="rounded-2xl border-2 border-red-400 bg-red-50 p-5 shadow-[4px_4px_0_var(--color-red-400)]">
        <h2 className="font-display mb-1 font-bold text-red-700">Zone dangereuse</h2>
        <p className="mb-4 text-sm text-red-600">
          Cette action désactivera définitivement votre compte. Vos inscriptions actives seront annulées.
        </p>
        <Button
          type="button"
          variant="destructive"
          onClick={() => setConfirmDelete(true)}
          className="rounded-xl border-2 border-red-700"
        >
          Désactiver mon compte
        </Button>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Désactiver votre compte"
        description="Êtes-vous sûr(e) de vouloir désactiver votre compte ? Vos inscriptions actives seront annulées. Cette action est irréversible."
        confirmLabel="Désactiver mon compte"
        variant="destructive"
        onConfirm={() => toast.error('Compte désactivé (démo)')}
      />
    </div>
  );
}
