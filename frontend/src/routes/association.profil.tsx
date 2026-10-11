import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Loader2, Check, Plus, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ImageUpload } from '@/components/common/ImageUpload';
import { UserAvatar } from '@/components/common/UserAvatar';
import { useAuth } from '@/context/AuthContext';
import {
  getMyProfile,
  updateMyProfile,
  type AssociationProfile,
} from '@/services/associationApi';
import { fetchDomaines, type DomaineItem } from '@/services/authApi';

export const Route = createFileRoute('/association/profil')({
  component: ProfilAssociation,
});

function ProfilAssociation() {
  const { user, loginUser } = useAuth();
  const token = localStorage.getItem('countmein_token') ?? '';

  const [profile, setProfile] = useState<AssociationProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [catalogDomaines, setCatalogDomaines] = useState<DomaineItem[]>([]);
  const [selectedDomaineIds, setSelectedDomaineIds] = useState<number[]>([]);

  const [form, setForm] = useState({
    nomAssociation: '',
    description: '',
    ville: '',
    contact: '',
    logoUrl: '',
  });

  useEffect(() => {
    fetchDomaines().then(setCatalogDomaines);
    getMyProfile()
      .then((p) => {
        setProfile(p);
        setForm({
          nomAssociation: p.nomAssociation ?? '',
          description: p.description ?? '',
          ville: p.ville ?? '',
          contact: p.contact ?? '',
          logoUrl: p.logoUrl ?? '',
        });
        setSelectedDomaineIds(p.domaineIds ?? []);
      })
      .catch(() => toast.error('Impossible de charger le profil.'))
      .finally(() => setLoading(false));
  }, []);

  const toggleDomaine = (id: number) =>
    setSelectedDomaineIds((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    );

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await updateMyProfile({
        ...form,
        domaineIds: selectedDomaineIds,
      });
      setProfile(updated);
      // Sync avatar dans le header
      if (user) {
        loginUser({ ...user, nomAssociation: updated.nomAssociation, photoUrl: updated.logoUrl ?? '' }, token);
      }
      toast.success('Profil mis à jour !');
    } catch (err: any) {
      toast.error(err.message ?? 'Erreur lors de la mise à jour.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const statutLabel =
    profile?.statutValidation === 'VALIDE'
      ? { label: '✓ Association validée', cls: 'border-green-300 bg-green-100 text-green-700' }
      : profile?.statutValidation === 'REFUSE'
      ? { label: '✗ Demande refusée', cls: 'border-red-300 bg-red-100 text-red-700' }
      : { label: '⏳ En attente de validation', cls: 'border-yellow-300 bg-yellow-50 text-yellow-700' };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-black text-ink">Profil de l'association</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Informations visibles par les bénévoles sur la plateforme.
        </p>
      </div>

      {/* Header avatar */}
      <div className="flex items-center gap-4">
        <UserAvatar user={user} size="lg" />
        <div>
          <p className="font-bold text-ink">{form.nomAssociation || profile?.nomAssociation}</p>
          <p className="text-sm text-muted-foreground">{form.ville || profile?.ville}</p>
          <span className={`mt-1.5 inline-flex items-center gap-1.5 rounded-full border px-3 py-0.5 text-xs font-semibold ${statutLabel.cls}`}>
            {statutLabel.label}
          </span>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        {/* Informations générales */}
        <div className="rounded-2xl border-2 border-ink bg-paper p-5 shadow-[4px_4px_0_var(--color-ink)] space-y-4">
          <h2 className="font-display font-bold text-ink">Informations générales</h2>

          {/* Email — lecture seule */}
          <div className="space-y-1.5">
            <Label className="text-sm font-bold text-ink">Adresse e-mail</Label>
            <Input
              value={profile?.email ?? ''}
              disabled
              className="rounded-xl border-2 border-ink bg-muted cursor-not-allowed opacity-70"
            />
            <p className="text-xs text-muted-foreground">L'adresse email ne peut pas être modifiée.</p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="nom-asso" className="text-sm font-bold text-ink">Nom de l'association *</Label>
            <Input
              id="nom-asso"
              required
              value={form.nomAssociation}
              onChange={(e) => setForm((f) => ({ ...f, nomAssociation: e.target.value }))}
              className="rounded-xl border-2 border-ink"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description-asso" className="text-sm font-bold text-ink">Description</Label>
            <Textarea
              id="description-asso"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="min-h-[100px] rounded-xl border-2 border-ink"
              placeholder="Décrivez votre association, ses valeurs et ses activités…"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="ville-asso" className="text-sm font-bold text-ink">Ville *</Label>
              <Input
                id="ville-asso"
                required
                value={form.ville}
                onChange={(e) => setForm((f) => ({ ...f, ville: e.target.value }))}
                className="rounded-xl border-2 border-ink"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="contact-asso" className="text-sm font-bold text-ink">Téléphone de contact</Label>
              <Input
                id="contact-asso"
                value={form.contact}
                onChange={(e) => setForm((f) => ({ ...f, contact: e.target.value }))}
                className="rounded-xl border-2 border-ink"
                placeholder="06 12 34 56 78"
              />
            </div>
          </div>

          {/* Logo */}
          <ImageUpload
            id="logo-asso"
            label="Logo de l'association"
            value={form.logoUrl}
            onChange={(url) => setForm((f) => ({ ...f, logoUrl: url }))}
          />
        </div>

        {/* Domaines */}
        <div className="rounded-2xl border-2 border-ink bg-paper p-5 shadow-[4px_4px_0_var(--color-ink)] space-y-3">
          <h2 className="font-display font-bold text-ink">🌱 Domaines d'activité</h2>
          <p className="text-xs text-muted-foreground">Sélectionnez les domaines de votre association :</p>
          <div className="flex flex-wrap gap-2">
            {catalogDomaines.map((d) => {
              const active = selectedDomaineIds.includes(d.id);
              return (
                <Badge
                  key={d.id}
                  onClick={() => toggleDomaine(d.id)}
                  className={`cursor-pointer border border-ink text-xs transition-all ${
                    active
                      ? 'bg-emerald text-emerald-foreground font-bold'
                      : 'bg-paper hover:bg-emerald/20 text-ink/80'
                  }`}
                >
                  {active ? <Check className="mr-1 h-3 w-3 inline" /> : <Plus className="mr-1 h-3 w-3 inline" />}
                  {d.nom}
                </Badge>
              );
            })}
          </div>
        </div>

        {/* Statut */}
        <div className="rounded-2xl border-2 border-ink bg-paper p-5 shadow-[4px_4px_0_var(--color-ink)]">
          <h2 className="font-display mb-3 font-bold text-ink">Statut de validation</h2>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground max-w-sm">
              {profile?.statutValidation === 'VALIDE'
                ? "Votre association est validée. Vous pouvez publier des missions."
                : profile?.statutValidation === 'REFUSE'
                ? "Votre demande a été refusée. Contactez l'équipe CountMeIn."
                : "Votre demande est en cours d'examen. Vous serez notifié(e) par email."}
            </p>
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-semibold ${statutLabel.cls}`}>
              {statutLabel.label}
            </span>
          </div>
        </div>

        <Button
          type="submit"
          disabled={saving}
          className="w-full rounded-xl border-2 border-ink bg-emerald font-bold text-emerald-foreground shadow-[3px_3px_0_var(--color-ink)] hover:opacity-90"
        >
          {saving ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Enregistrement…</>
          ) : (
            <><Save className="mr-2 h-4 w-4" />Enregistrer les modifications</>
          )}
        </Button>
      </form>
    </div>
  );
}
