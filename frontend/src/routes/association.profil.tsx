import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { associationProfile } from '@/components/dashboard/data';

export const Route = createFileRoute('/association/profil')({
  component: ProfilAssociation,
});

const DOMAINES = ['Solidarité', 'Environnement', 'Éducation', 'Sport', 'Santé', 'Culture', 'Social'];

function ProfilAssociation() {
  const [form, setForm] = useState({
    nom: associationProfile.nom,
    description: associationProfile.description,
    domaine: associationProfile.domaine,
    ville: associationProfile.ville,
    contact: associationProfile.contact,
  });

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    toast.success('Profil mis à jour !');
  }

  const isValidated = associationProfile.statut === 'VALIDEE';

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-black text-ink">Profil de l'association</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Informations visibles par les bénévoles sur la plateforme.
        </p>
      </div>

      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-ink bg-emerald text-2xl font-black text-emerald-foreground shadow-[3px_3px_0_var(--color-ink)]">
          AN
        </div>
        <div>
          <p className="font-bold text-ink">{form.nom}</p>
          <p className="text-sm text-muted-foreground">{form.ville}</p>
          <div className="mt-1.5">
            {isValidated ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-green-300 bg-green-100 px-3 py-0.5 text-xs font-semibold text-green-700">
                ✓ Association validée
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-yellow-300 bg-yellow-50 px-3 py-0.5 text-xs font-semibold text-yellow-700">
                ⏳ En attente de validation
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSave} className="space-y-5">
        <div className="rounded-2xl border-2 border-ink bg-paper p-5 shadow-[4px_4px_0_var(--color-ink)] space-y-4">
          <h2 className="font-display font-bold text-ink">Informations générales</h2>

          <div className="space-y-1.5">
            <Label htmlFor="nom-asso">Nom de l'association</Label>
            <Input
              id="nom-asso"
              value={form.nom}
              onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value }))}
              className="rounded-xl border-2 border-ink"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description-asso">Description</Label>
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
              <Label htmlFor="domaine-asso">Domaine principal</Label>
              <Select
                value={form.domaine}
                onValueChange={(v) => setForm((f) => ({ ...f, domaine: v }))}
              >
                <SelectTrigger id="domaine-asso" className="rounded-xl border-2 border-ink">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DOMAINES.map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ville-asso">Ville</Label>
              <Input
                id="ville-asso"
                value={form.ville}
                onChange={(e) => setForm((f) => ({ ...f, ville: e.target.value }))}
                className="rounded-xl border-2 border-ink"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="contact-asso">Contact (email / téléphone)</Label>
            <Input
              id="contact-asso"
              value={form.contact}
              onChange={(e) => setForm((f) => ({ ...f, contact: e.target.value }))}
              className="rounded-xl border-2 border-ink"
              placeholder="contact@association.ma"
            />
          </div>
        </div>

        {/* Statut section */}
        <div className="rounded-2xl border-2 border-ink bg-paper p-5 shadow-[4px_4px_0_var(--color-ink)]">
          <h2 className="font-display mb-3 font-bold text-ink">Statut de validation</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                {isValidated
                  ? 'Votre association est validée par l\'équipe CountMeIn. Vous pouvez publier des missions.'
                  : 'Votre demande est en cours d\'examen. Vous serez notifié(e) par email.'}
              </p>
            </div>
            {isValidated ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-green-300 bg-green-100 px-3 py-1 text-sm font-semibold text-green-700">
                ✓ Validée
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-yellow-300 bg-yellow-50 px-3 py-1 text-sm font-semibold text-yellow-700">
                ⏳ En attente
              </span>
            )}
          </div>
        </div>

        <Button
          type="submit"
          className="w-full rounded-xl border-2 border-ink bg-emerald font-bold text-emerald-foreground shadow-[3px_3px_0_var(--color-ink)] hover:opacity-90"
        >
          Enregistrer les modifications
        </Button>
      </form>
    </div>
  );
}
