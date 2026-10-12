import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { X, Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Skeleton } from '@/components/ui/skeleton';
import { ConfirmDialog } from '@/components/dashboard/ConfirmDialog';
import { useAuth } from '@/context/AuthContext';
import { benevoleApi, type BenevoleProfileApi } from '@/services/benevoleApi';
import { benevoleProfile as fallbackProfile } from '@/components/dashboard/data';

export const Route = createFileRoute('/benevole/profil')({
  component: ProfilBenevole,
});

// ── TagInput ─────────────────────────────────────────────────────────────────

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

// ── Skeleton loader ───────────────────────────────────────────────────────────

function ProfilSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Left column */}
      <div className="space-y-6 lg:col-span-2">
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-80" />
        </div>
        <div className="rounded-2xl border-2 border-ink bg-paper p-5 shadow-[4px_4px_0_var(--color-ink)] space-y-4">
          <Skeleton className="h-5 w-40" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Skeleton className="h-10 rounded-xl" />
            <Skeleton className="h-10 rounded-xl" />
          </div>
          <Skeleton className="h-10 rounded-xl" />
          <Skeleton className="h-10 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
        <div className="rounded-2xl border-2 border-ink bg-paper p-5 shadow-[4px_4px_0_var(--color-ink)] space-y-4">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-6 rounded-full" />
        </div>
        <div className="rounded-2xl border-2 border-ink bg-paper p-5 shadow-[4px_4px_0_var(--color-ink)] space-y-4">
          <Skeleton className="h-5 w-56" />
          <Skeleton className="h-10 rounded-xl" />
          <Skeleton className="h-10 rounded-xl" />
        </div>
        <Skeleton className="h-11 rounded-xl" />
      </div>
      {/* Right column */}
      <div className="space-y-6 lg:col-span-1">
        <div className="rounded-2xl border-2 border-ink bg-paper p-5 shadow-[4px_4px_0_var(--color-ink)] flex flex-col items-center gap-4">
          <Skeleton className="h-20 w-20 rounded-full" />
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

function ProfilBenevole() {
  const { user, token, updateUser } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    prenom: fallbackProfile.prenom,
    nom: fallbackProfile.nom,
    telephone: '',
    ville: fallbackProfile.ville,
    bio: fallbackProfile.bio,
    rayon: fallbackProfile.rayonKm,
    competences: fallbackProfile.competences,
    interets: fallbackProfile.interets,
  });

  const [pwOpen, setPwOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [pwForm, setPwForm] = useState({ actuel: '', nouveau: '', confirmation: '' });

  // ── Load profile from API ──────────────────────────────────────────────────
  useEffect(() => {
    if (!token) {
      // No token: seed from auth context user
      if (user) {
        setForm((f) => ({
          ...f,
          prenom: user.prenom ?? f.prenom,
          nom: user.nom ?? f.nom,
          telephone: user.telephone ?? f.telephone,
          ville: user.ville ?? f.ville,
        }));
      }
      setLoading(false);
      return;
    }

    benevoleApi
      .getProfile(token)
      .then((data: BenevoleProfileApi) => {
        setForm({
          prenom: data.prenom ?? user?.prenom ?? fallbackProfile.prenom,
          nom: data.nom ?? user?.nom ?? fallbackProfile.nom,
          telephone: data.telephone ?? '',
          ville: data.ville ?? user?.ville ?? fallbackProfile.ville,
          bio: data.biographie ?? fallbackProfile.bio,
          rayon: data.rayonDeplacementKm ?? fallbackProfile.rayonKm,
          competences: data.competences?.length ? data.competences : fallbackProfile.competences,
          interets: fallbackProfile.interets,
        });
      })
      .catch(() => {
        // Graceful fallback to auth context
        if (user) {
          setForm((f) => ({
            ...f,
            prenom: user.prenom ?? f.prenom,
            nom: user.nom ?? f.nom,
            telephone: user.telephone ?? f.telephone,
            ville: user.ville ?? f.ville,
          }));
        }
      })
      .finally(() => setLoading(false));
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Helpers ───────────────────────────────────────────────────────────────
  function getAvatarInitials() {
    if (form.prenom && form.nom) {
      return `${form.prenom.charAt(0)}${form.nom.charAt(0)}`.toUpperCase();
    }
    if (form.prenom) return form.prenom.charAt(0).toUpperCase();
    return user?.email?.charAt(0).toUpperCase() ?? '?';
  }

  const photoUrl = user?.photoUrl || user?.photoProfil || '';
  const hasValidPhoto = photoUrl.startsWith('http://') || photoUrl.startsWith('https://');

  // ── Save profile ───────────────────────────────────────────────────────────
  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!token) {
      toast.error('Vous devez être connecté pour modifier votre profil.');
      return;
    }
    setSaving(true);
    try {
      const updated = await benevoleApi.updateProfile(token, {
        prenom: form.prenom,
        nom: form.nom,
        telephone: form.telephone || undefined,
        ville: form.ville,
        biographie: form.bio,
        rayonDeplacementKm: form.rayon,
        competences: form.competences,
      });
      // Sync auth context with fresh data
      updateUser({
        prenom: updated.prenom,
        nom: updated.nom,
        ville: updated.ville,
        telephone: updated.telephone,
        photoUrl: updated.photoUrl,
      });
      toast.success('Profil mis à jour !');
    } catch {
      toast.error('Impossible de sauvegarder. Réessayez.');
    } finally {
      setSaving(false);
    }
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

  // ── Render ─────────────────────────────────────────────────────────────────
  if (loading) return <ProfilSkeleton />;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

      {/* ── Left column: forms ─────────────────────────────────────────────── */}
      <div className="space-y-6 lg:col-span-2">
        <div>
          <h1 className="font-display text-2xl font-black text-ink">Mon profil</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Renseignez vos informations pour que les associations vous trouvent.
          </p>
        </div>

        {/* Main form */}
        <form onSubmit={handleSave} className="space-y-5">
          {/* Informations personnelles */}
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
            <div className="grid gap-4 sm:grid-cols-2">
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
                <Label htmlFor="telephone">Téléphone</Label>
                <Input
                  id="telephone"
                  type="tel"
                  value={form.telephone}
                  onChange={(e) => setForm((f) => ({ ...f, telephone: e.target.value }))}
                  placeholder="+212 6XX XXX XXX"
                  className="rounded-xl border-2 border-ink"
                />
              </div>
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

          {/* Rayon de déplacement */}
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

          {/* Compétences & intérêts */}
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
            disabled={saving}
            className="w-full rounded-xl border-2 border-ink bg-pink font-bold text-pink-foreground shadow-[3px_3px_0_var(--color-ink)] hover:opacity-90 disabled:opacity-60"
          >
            {saving ? 'Enregistrement…' : 'Enregistrer les modifications'}
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
      </div>

      {/* ── Right column: avatar + summary ────────────────────────────────── */}
      <div className="space-y-6 lg:col-span-1">
        {/* Avatar card */}
        <div className="rounded-2xl border-2 border-ink bg-paper p-5 shadow-[4px_4px_0_var(--color-ink)] flex flex-col items-center gap-3 text-center">
          {hasValidPhoto ? (
            <img
              src={photoUrl}
              alt={`Photo de ${form.prenom}`}
              className="h-20 w-20 rounded-full border-2 border-ink object-cover shadow-[3px_3px_0_var(--color-ink)]"
            />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-ink bg-mustard text-2xl font-black text-ink shadow-[3px_3px_0_var(--color-ink)]">
              {getAvatarInitials()}
            </div>
          )}
          <div>
            <p className="font-bold text-ink">
              {form.prenom} {form.nom}
            </p>
            <p className="text-sm text-muted-foreground">{form.ville}</p>
            {form.telephone && (
              <p className="text-sm text-muted-foreground mt-0.5">{form.telephone}</p>
            )}
          </div>
        </div>

        {/* Résumé */}
        <div className="rounded-2xl border-2 border-ink bg-paper p-5 shadow-[4px_4px_0_var(--color-ink)] space-y-3">
          <h3 className="font-display font-bold text-ink text-sm">Résumé</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Rayon</span>
              <span className="font-medium text-ink">{form.rayon} km</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Compétences</span>
              <span className="font-medium text-ink">{form.competences.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Intérêts</span>
              <span className="font-medium text-ink">{form.interets.length}</span>
            </div>
          </div>
          {form.competences.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {form.competences.slice(0, 5).map((c) => (
                <span
                  key={c}
                  className="rounded-full border border-ink/30 bg-mustard/20 px-2 py-0.5 text-xs font-medium text-ink"
                >
                  {c}
                </span>
              ))}
              {form.competences.length > 5 && (
                <span className="rounded-full border border-ink/30 bg-paper px-2 py-0.5 text-xs text-muted-foreground">
                  +{form.competences.length - 5}
                </span>
              )}
            </div>
          )}
        </div>
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
