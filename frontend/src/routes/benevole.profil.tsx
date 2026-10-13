import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Check, Plus, X, ChevronDown, ChevronUp, MapPin, Phone, User, Eye, EyeOff, Sparkles } from 'lucide-react';
import { AddressMapModal } from '@/components/common/AddressMapModal';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/dashboard/ConfirmDialog';
import { ImageUpload } from '@/components/common/ImageUpload';
import { useAuth } from '@/context/AuthContext';
import { benevoleApi } from '@/services/benevoleApi';
import { benevoleProfile as fallbackProfile } from '@/components/dashboard/data';
import {
  fetchCompetences,
  fetchDomaines,
  type CompetenceItem,
  type DomaineItem,
} from '@/services/authApi';

export const Route = createFileRoute('/benevole/profil')({
  component: ProfilBenevole,
});

/* ── champ texte stylé ── */
const fieldClass =
  'w-full rounded-xl border-2 border-ink bg-paper px-4 py-3 text-sm font-medium text-ink placeholder:text-muted-foreground shadow-[3px_3px_0_var(--color-ink)] transition-all focus:shadow-[4px_4px_0_var(--color-ink)] focus:outline-none';

function Field({
  id, label, required, children,
}: { id?: string; label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-sm font-bold text-ink">
        {label}{required && <span className="text-pink ml-0.5">*</span>}
      </Label>
      {children}
    </div>
  );
}

/* ── catalogue de compétences cliquables ── */
function CatalogueCompetences({
  catalog, selected, onChange,
}: { catalog: CompetenceItem[]; selected: string[]; onChange: (s: string[]) => void }) {
  const [custom, setCustom] = useState('');

  function toggle(nom: string) {
    onChange(selected.includes(nom) ? selected.filter(c => c !== nom) : [...selected, nom]);
  }
  function addCustom() {
    const v = custom.trim();
    if (v && !selected.includes(v)) onChange([...selected, v]);
    setCustom('');
  }

  return (
    <div className="space-y-3">
      {/* Catalogue */}
      <div className="flex flex-wrap gap-2">
        {catalog.map(c => {
          const active = selected.includes(c.nom);
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => toggle(c.nom)}
              className={`inline-flex items-center gap-1.5 rounded-full border-2 px-3 py-1 text-xs font-bold transition-all ${
                active
                  ? 'border-ink bg-mustard text-ink shadow-[2px_2px_0_var(--color-ink)]'
                  : 'border-border bg-muted text-muted-foreground hover:border-ink hover:text-ink'
              }`}
            >
              {active && <Check className="h-3 w-3" />}
              {c.nom}
            </button>
          );
        })}
      </div>
      {/* Compétence personnalisée */}
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Autre compétence…"
          value={custom}
          onChange={e => setCustom(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustom(); } }}
          className={fieldClass + ' text-xs py-2'}
        />
        <button
          type="button"
          onClick={addCustom}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-ink bg-mustard shadow-[2px_2px_0_var(--color-ink)] hover:opacity-90"
        >
          <Plus className="h-4 w-4 text-ink" />
        </button>
      </div>
      {/* Sélectionnées hors catalogue */}
      {selected.filter(s => !catalog.find(c => c.nom === s)).length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.filter(s => !catalog.find(c => c.nom === s)).map(s => (
            <span key={s} className="inline-flex items-center gap-1 rounded-full border-2 border-ink bg-mustard/30 px-3 py-0.5 text-xs font-medium text-ink">
              {s}
              <button type="button" onClick={() => toggle(s)} className="ml-0.5 hover:text-pink">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── catalogue domaines cliquables ── */
function CatalogueDomaines({
  catalog, selected, onChange,
}: { catalog: DomaineItem[]; selected: number[]; onChange: (s: number[]) => void }) {
  function toggle(id: number) {
    onChange(selected.includes(id) ? selected.filter(d => d !== id) : [...selected, id]);
  }
  return (
    <div className="flex flex-wrap gap-2">
      {catalog.map(d => {
        const active = selected.includes(d.id);
        return (
          <button
            key={d.id}
            type="button"
            onClick={() => toggle(d.id)}
            className={`inline-flex items-center gap-1.5 rounded-full border-2 px-3 py-1 text-xs font-bold transition-all ${
              active
                ? 'border-ink bg-emerald text-emerald-foreground shadow-[2px_2px_0_var(--color-ink)]'
                : 'border-border bg-muted text-muted-foreground hover:border-ink hover:text-ink'
            }`}
          >
            {active && <Check className="h-3 w-3" />}
            {d.nom}
          </button>
        );
      })}
    </div>
  );
}

/* ── champ mot de passe avec toggle ── */
function PwField({ id, label, value, onChange, accent = false }: { id: string; label: string; value: string; onChange: (v: string) => void; accent?: boolean }) {
  const [show, setShow] = useState(false);
  const filled = value.length > 0;
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-bold text-ink">{label}</label>
      <div className="relative">
        <input
          id={id}
          type={show ? 'text' : 'password'}
          value={value}
          onChange={e => onChange(e.target.value)}
          className={`w-full rounded-xl border-2 px-3 py-2.5 pr-11 text-sm font-medium outline-none transition-all ${
            filled
              ? accent
                ? 'border-ink bg-mustard/20 shadow-[3px_3px_0_var(--color-ink)] text-ink'
                : 'border-ink bg-white shadow-[3px_3px_0_var(--color-ink)] text-ink'
              : 'border-ink bg-white text-ink'
          }`}
          autoComplete={id.includes('actuel') ? 'current-password' : 'new-password'}
        />
        <button
          type="button"
          onClick={() => setShow(v => !v)}
          className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors ${
            filled ? 'text-ink hover:text-ink/70' : 'text-muted-foreground hover:text-ink'
          }`}
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════ COMPOSANT PRINCIPAL ═══════════════════════ */
function ProfilBenevole() {
  const { user, token, updateUser } = useAuth();

  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [pwOpen, setPwOpen]     = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  /* catalogues depuis l'API */
  const [catalogComp, setCatalogComp]     = useState<CompetenceItem[]>([]);
  const [catalogDom, setCatalogDom]       = useState<DomaineItem[]>([]);

  /* formulaire */
  const [form, setForm] = useState({
    prenom:     user?.prenom ?? fallbackProfile.prenom,
    nom:        user?.nom    ?? fallbackProfile.nom,
    telephone:  user?.telephone ?? '',
    dateNaissance: '',
    ville:      user?.ville  ?? fallbackProfile.ville,
    latitude:   null as number | null,
    longitude:  null as number | null,
    bio:        fallbackProfile.bio,
    rayon:      fallbackProfile.rayonKm,
    competences: fallbackProfile.competences as string[],
    domaineIds:  [] as number[],
    photoUrl:    user?.photoUrl ?? '',
  });

  const [pw, setPw] = useState({ actuel: '', nouveau: '', confirmation: '' });
  const [geocodedAddress, setGeocodedAddress] = useState<string | null>(null);
  const [mapOpen, setMapOpen] = useState(false);

  /* photo */
  const photoUrl     = form.photoUrl || user?.photoUrl || '';
  const hasPhoto     = photoUrl.startsWith('http://') || photoUrl.startsWith('https://') || photoUrl.startsWith('data:');
  const initiales    = [form.prenom?.[0], form.nom?.[0]].filter(Boolean).join('').toUpperCase() || '?';

  /* ── chargement ── */
  useEffect(() => {
    Promise.all([fetchCompetences(), fetchDomaines()]).then(([comp, dom]) => {
      setCatalogComp(comp);
      setCatalogDom(dom);
    });

    if (!token) { setLoading(false); return; }

    benevoleApi.getProfile(token)
      .then(data => {
        setForm(f => ({
          ...f,
          prenom:        data.prenom        || f.prenom,
          nom:           data.nom           || f.nom,
          telephone:     data.telephone     || f.telephone,
          dateNaissance: data.dateNaissance || f.dateNaissance,
          ville:         data.ville         || f.ville,
          latitude:      data.latitude ?? f.latitude,
          longitude:     data.longitude ?? f.longitude,
          bio:           data.biographie    || f.bio,
          rayon:         data.rayonDeplacementKm ?? f.rayon,
          competences:   data.competences?.length ? data.competences : f.competences,
          domaineIds:    data.domaineIds ?? f.domaineIds,
          photoUrl:      data.photoUrl      || f.photoUrl,
        }));
      })
      .catch(() => {/* fallback silencieux */})
      .finally(() => setLoading(false));
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps



  /* ── sauvegarde profil ── */
  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!token) { toast.error('Vous devez être connecté.'); return; }
    setSaving(true);
    try {
      const updated = await benevoleApi.updateProfile(token, {
        prenom:             form.prenom,
        nom:                form.nom,
        telephone:          form.telephone,
        dateNaissance:      form.dateNaissance,
        ville:              form.ville,
        latitude:           form.latitude,
        longitude:          form.longitude,
        biographie:         form.bio,
        rayonDeplacementKm: form.rayon,
        competences:        form.competences,
        domaineIds:         form.domaineIds,
        photoUrl:           form.photoUrl,
      });
      updateUser({
        prenom: updated.prenom,
        nom: updated.nom,
        ville: updated.ville,
        ...(updated.photoUrl ? { photoUrl: updated.photoUrl } : {}),
      });
      toast.success('Profil mis à jour !');
    } catch {
      toast.error('Impossible de sauvegarder. Réessayez.');
    } finally {
      setSaving(false);
    }
  }

  /* ── changement mot de passe ── */
  function handlePwSave(e: React.FormEvent) {
    e.preventDefault();
    if (pw.nouveau.length < 6) { toast.error('Le nouveau mot de passe doit faire au moins 6 caractères.'); return; }
    if (pw.nouveau !== pw.confirmation) { toast.error('Les mots de passe ne correspondent pas.'); return; }
    toast.success('Mot de passe modifié !');
    setPw({ actuel: '', nouveau: '', confirmation: '' });
    setPwOpen(false);
  }

  /* ── skeleton ── */
  if (loading) return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <Skeleton className="h-10 w-64" />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-6">
          <Skeleton className="h-72 rounded-2xl" />
          <Skeleton className="h-44 rounded-2xl" />
        </div>
        <div className="lg:col-span-8 space-y-6">
          <Skeleton className="h-96 rounded-2xl" />
          <Skeleton className="h-48 rounded-2xl" />
        </div>
      </div>
    </div>
  );

  /* ═══════════════════════ RENDU ═══════════════════════ */
  return (
    <div className="mx-auto w-full max-w-7xl space-y-8">
      {/* ── En-tête de la page ── */}
      <div className="border-b-2 border-ink pb-6">
        <h1 className="font-display text-3xl font-black text-ink">Mon profil bénévole</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gérez vos informations personnelles, vos compétences et vos préférences d'engagement.
        </p>
      </div>

      <form onSubmit={handleSave}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* ══════════ COLONNE GAUCHE (4 colonnes) : Carte d'identité, Mobilité & Sécurité ══════════ */}
          <div className="lg:col-span-4 space-y-6">

            {/* Carte profil / avatar */}
            <div className="rounded-2xl border-2 border-ink bg-paper p-6 shadow-[4px_4px_0_var(--color-ink)] space-y-6 text-center">
              <div className="flex justify-center">
                {hasPhoto ? (
                  <img
                    src={photoUrl}
                    alt={initiales}
                    className="h-28 w-28 rounded-full border-2 border-ink object-cover shadow-[4px_4px_0_var(--color-ink)]"
                  />
                ) : (
                  <div className="flex h-28 w-28 items-center justify-center rounded-full border-2 border-ink bg-mustard text-3xl font-black text-ink shadow-[4px_4px_0_var(--color-ink)]">
                    {initiales}
                  </div>
                )}
              </div>

              <div>
                <h2 className="font-display text-xl font-black text-ink">
                  {form.prenom || form.nom ? `${form.prenom} ${form.nom}` : 'Bénévole'}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground flex items-center justify-center gap-1.5">
                  <MapPin className="h-4 w-4" /> {form.ville || 'Ville non renseignée'}
                </p>
                {form.telephone && (
                  <p className="mt-1 text-xs text-muted-foreground flex items-center justify-center gap-1.5">
                    <Phone className="h-3.5 w-3.5" /> {form.telephone}
                  </p>
                )}
                {user?.email && (
                  <p className="mt-1 text-xs text-muted-foreground font-mono">
                    {user.email}
                  </p>
                )}
              </div>

              <div className="pt-2 border-t-2 border-ink/10 text-left">
                <ImageUpload
                  id="benv-photo"
                  label="Changer ma photo de profil"
                  value={form.photoUrl}
                  onChange={(url) => setForm(f => ({ ...f, photoUrl: url }))}
                />
              </div>
            </div>

            {/* Rayon de déplacement */}
            <section className="rounded-2xl border-2 border-ink bg-paper p-6 shadow-[4px_4px_0_var(--color-ink)] space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display font-black text-ink">Rayon d'action</h3>
                  <p className="text-xs text-muted-foreground">Mobilité maximale</p>
                </div>
                <span className="rounded-full border-2 border-ink bg-mustard px-3 py-1 text-sm font-black text-ink shadow-[2px_2px_0_var(--color-ink)]">
                  {form.rayon} km
                </span>
              </div>
              <Slider
                value={[form.rayon]}
                onValueChange={(vals) => setForm(f => ({ ...f, rayon: vals[0] ?? f.rayon }))}
                min={5} max={200} step={5}
                aria-label="Rayon de déplacement"
              />
              <div className="flex justify-between text-xs font-semibold text-muted-foreground">
                <span>5 km</span>
                <span>100 km</span>
                <span>200 km</span>
              </div>
            </section>

            {/* Sécurité : Mot de passe */}
            <div className="rounded-2xl border-2 border-ink overflow-hidden shadow-[4px_4px_0_var(--color-ink)]">
              <button
                type="button"
                onClick={() => setPwOpen(v => !v)}
                className={`flex w-full items-center justify-between p-5 text-left transition-colors font-display font-black ${
                  pwOpen
                    ? 'bg-mustard text-ink'
                    : 'bg-mustard/30 text-ink hover:bg-mustard/50'
                }`}
                aria-expanded={pwOpen}
              >
                <div className="flex items-center gap-2">
                  <div className={`flex h-7 w-7 items-center justify-center rounded-lg border-2 ${
                    pwOpen ? 'border-ink bg-ink/10' : 'border-ink/40 bg-mustard/40'
                  }`}>
                    <Eye className="h-3.5 w-3.5 text-ink" />
                  </div>
                  <span>Changer mot de passe</span>
                </div>
                {pwOpen
                  ? <ChevronUp className="h-4 w-4 text-ink/60" />
                  : <ChevronDown className="h-4 w-4 text-ink/40" />}
              </button>
              {pwOpen && (
                <div className="border-t-2 border-ink bg-mustard/10 p-5 space-y-4">
                  <PwField id="pw-actuel" label="Mot de passe actuel" value={pw.actuel} onChange={v => setPw(p => ({ ...p, actuel: v }))} />
                  <PwField id="pw-nouveau" label="Nouveau mot de passe" value={pw.nouveau} onChange={v => setPw(p => ({ ...p, nouveau: v }))} accent />
                  {pw.nouveau.length > 0 && (
                    <div className="space-y-1">
                      <div className="flex gap-1">
                        {[1,2,3,4].map(i => (
                          <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${
                            pw.nouveau.length >= i * 3
                              ? i <= 1 ? 'bg-red-500' : i === 2 ? 'bg-orange-400' : i === 3 ? 'bg-yellow-400' : 'bg-emerald-500'
                              : 'bg-ink/20'
                          }`} />
                        ))}
                      </div>
                      <p className="text-[11px] font-semibold text-ink/70">
                        Force : {pw.nouveau.length < 4 ? 'Très faible' : pw.nouveau.length < 7 ? 'Faible' : pw.nouveau.length < 10 ? 'Bonne' : 'Excellente'}
                      </p>
                    </div>
                  )}
                  <PwField id="pw-confirmation" label="Confirmer nouveau mot de passe" value={pw.confirmation} onChange={v => setPw(p => ({ ...p, confirmation: v }))} accent />
                  {pw.nouveau.length > 0 && pw.confirmation.length > 0 && (
                    <div className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold border-2 ${
                      pw.nouveau === pw.confirmation
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                        : 'border-red-400 bg-red-50 text-red-700'
                    }`}>
                      {pw.nouveau === pw.confirmation
                        ? <span className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5" /> Les mots de passe correspondent</span>
                        : <span className="inline-flex items-center gap-1.5"><X className="h-3.5 w-3.5" /> Les mots de passe ne correspondent pas</span>}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={handlePwSave}
                    className="press w-full rounded-xl border-2 border-ink bg-mustard py-3 text-sm font-black text-ink shadow-[3px_3px_0_var(--color-ink)] hover:opacity-90 transition-colors"
                  >
                    <span className="inline-flex items-center justify-center gap-2">
                      <Check className="h-4 w-4" />
                      Valider le nouveau mot de passe
                    </span>
                  </button>
                </div>
              )}
            </div>

            {/* Zone dangereuse */}
            <div className="rounded-2xl border-2 border-red-300 bg-red-50/70 p-5 space-y-3">
              <h3 className="font-display font-bold text-red-800 text-sm">Zone sensible</h3>
              <p className="text-xs text-red-700 leading-relaxed">
                Désactiver le compte annule vos inscriptions aux missions en cours.
              </p>
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="press w-full rounded-xl border-2 border-red-700 bg-red-600 py-2 text-xs font-black text-white shadow-[2px_2px_0_#991b1b] hover:opacity-90"
              >
                Désactiver mon compte
              </button>
            </div>

          </div>

          {/* ══════════ COLONNE DROITE (8 colonnes) : Formulaire complet ══════════ */}
          <div className="lg:col-span-8 space-y-6">

            {/* 1. Informations personnelles */}
            <section className="rounded-2xl border-2 border-ink bg-paper p-6 shadow-[4px_4px_0_var(--color-ink)] space-y-5">
              <div className="flex items-center gap-2.5 pb-2 border-b-2 border-ink/10">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg border-2 border-ink bg-mustard shadow-[2px_2px_0_var(--color-ink)]">
                  <User className="h-4 w-4 text-ink" />
                </div>
                <div>
                  <h2 className="font-display text-lg font-black text-ink">Informations personnelles</h2>
                  <p className="text-xs text-muted-foreground">Vos coordonnées de base</p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field id="prenom" label="Prénom" required>
                  <input
                    id="prenom"
                    value={form.prenom}
                    onChange={e => setForm(f => ({ ...f, prenom: e.target.value }))}
                    placeholder="Votre prénom"
                    className={fieldClass}
                    required
                  />
                </Field>
                <Field id="nom" label="Nom" required>
                  <input
                    id="nom"
                    value={form.nom}
                    onChange={e => setForm(f => ({ ...f, nom: e.target.value }))}
                    placeholder="Votre nom"
                    className={fieldClass}
                    required
                  />
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field id="ville" label="Ville de résidence" required>
                  <input
                    id="ville"
                    value={form.ville}
                    onChange={e => setForm(f => ({ ...f, ville: e.target.value }))}
                    placeholder="Ex : Martil, Tétouan, Tanger…"
                    className={fieldClass}
                    required
                  />
                </Field>
                <Field id="telephone" label="Numéro de téléphone">
                  <input
                    id="telephone"
                    type="tel"
                    value={form.telephone}
                    onChange={e => setForm(f => ({ ...f, telephone: e.target.value }))}
                    placeholder="+212 6XX XXX XXX"
                    className={fieldClass}
                  />
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field id="dateNaissance" label="Date de naissance">
                  <input
                    id="dateNaissance"
                    type="date"
                    value={form.dateNaissance}
                    onChange={e => setForm(f => ({ ...f, dateNaissance: e.target.value }))}
                    className={fieldClass}
                  />
                </Field>

                {/* Géolocalisation → bouton + champ adresse lecture seule */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-bold text-ink">Adresse (GPS)</Label>
                    <button
                      type="button"
                      onClick={() => setMapOpen(true)}
                      className="press inline-flex items-center gap-1 rounded-lg border-2 border-ink bg-emerald px-2 py-0.5 text-xs font-bold text-emerald-foreground shadow-[2px_2px_0_var(--color-ink)] hover:opacity-90"
                    >
                      <MapPin className="h-3 w-3" />
                      Changer adresse
                    </button>
                  </div>
                  <div className={`flex items-start gap-2 rounded-xl border-2 border-ink px-3 py-2.5 text-sm font-medium shadow-[3px_3px_0_var(--color-ink)] ${
                    geocodedAddress ? 'bg-mustard/15' : 'bg-muted'
                  }`}>
                    <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-ink/60" />
                    <span className={geocodedAddress ? 'text-ink text-xs' : 'text-muted-foreground text-xs italic'}>
                      {geocodedAddress ?? 'Cliquez sur « Changer adresse » pour définir votre localisation'}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Utilisé pour vous recommander les missions les plus proches.
                  </p>
                </div>
              </div>

              <Field id="bio" label="Biographie & Présentation">
                <Textarea
                  id="bio"
                  value={form.bio}
                  onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                  className="min-h-[110px] rounded-xl border-2 border-ink shadow-[3px_3px_0_var(--color-ink)] focus:shadow-[4px_4px_0_var(--color-ink)] focus:outline-none"
                  placeholder="Partagez vos motivations, votre parcours ou ce qui vous tient à cœur…"
                />
              </Field>
            </section>

            {/* 2. Compétences */}
            <section className="rounded-2xl border-2 border-ink bg-paper p-6 shadow-[4px_4px_0_var(--color-ink)] space-y-4">
              <div className="flex items-center gap-2.5 pb-2 border-b-2 border-ink/10">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg border-2 border-ink bg-cyan shadow-[2px_2px_0_var(--color-ink)]">
                  <Sparkles className="h-4 w-4 text-ink" />
                </div>
                <div>
                  <h2 className="font-display text-lg font-black text-ink">Mes compétences</h2>
                  <p className="text-xs text-muted-foreground">
                    Indiquez vos savoir-faire pour recevoir les missions les plus pertinentes.
                  </p>
                </div>
              </div>
              <CatalogueCompetences
                catalog={catalogComp}
                selected={form.competences}
                onChange={c => setForm(f => ({ ...f, competences: c }))}
              />
              {form.competences.length === 0 && (
                <p className="text-xs text-muted-foreground italic">Aucune compétence sélectionnée.</p>
              )}
            </section>

            {/* 3. Domaines d'intérêt */}
            <section className="rounded-2xl border-2 border-ink bg-paper p-6 shadow-[4px_4px_0_var(--color-ink)] space-y-4">
              <div className="flex items-center gap-2.5 pb-2 border-b-2 border-ink/10">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg border-2 border-ink bg-pink shadow-[2px_2px_0_var(--color-ink)]">
                  <Check className="h-4 w-4 text-ink" />
                </div>
                <div>
                  <h2 className="font-display text-lg font-black text-ink">Domaines d'activité & centres d'intérêt</h2>
                  <p className="text-xs text-muted-foreground">
                    Sélectionnez les causes qui vous touchent (Environnement, Éducation, Santé, etc.).
                  </p>
                </div>
              </div>
              <CatalogueDomaines
                catalog={catalogDom}
                selected={form.domaineIds}
                onChange={d => setForm(f => ({ ...f, domaineIds: d }))}
              />
              {form.domaineIds.length === 0 && (
                <p className="text-xs text-muted-foreground italic">Aucun domaine sélectionné.</p>
              )}
              {form.domaineIds.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-ink/10">
                  <span className="text-xs font-bold text-ink">Sélectionnés ({form.domaineIds.length}) :</span>
                  {form.domaineIds.map(id => {
                    const d = catalogDom.find(x => x.id === id);
                    return d ? (
                      <Badge key={id} className="rounded-full border-2 border-ink bg-emerald text-emerald-foreground text-xs font-bold shadow-[2px_2px_0_var(--color-ink)]">
                        {d.nom}
                      </Badge>
                    ) : null;
                  })}
                </div>
              )}
            </section>

            {/* Bouton d'enregistrement bas de page */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={saving}
                className="press w-full rounded-xl border-2 border-ink bg-pink py-4 text-base font-black text-pink-foreground shadow-[4px_4px_0_var(--color-ink)] hover:opacity-90 disabled:opacity-60 disabled:pointer-events-none transition-all"
              >
                {saving ? 'Enregistrement en cours…' : 'Enregistrer toutes les modifications'}
              </button>
            </div>

          </div>

        </div>
      </form>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Désactiver votre compte"
        description="Êtes-vous sûr(e) ? Vos inscriptions actives seront annulées. Cette action est irréversible."
        confirmLabel="Désactiver mon compte"
        variant="destructive"
        onConfirm={() => { toast.error('Compte désactivé.'); }}
      />

      <AddressMapModal
        open={mapOpen}
        initial={{ latitude: form.latitude, longitude: form.longitude }}
        onClose={() => setMapOpen(false)}
        onConfirm={(result) => {
          setForm(f => ({
            ...f,
            latitude: result.latitude,
            longitude: result.longitude,
            ville: result.ville || f.ville,
          }));
          setGeocodedAddress(result.adresse);
          setMapOpen(false);
          toast.success('Adresse mise à jour !');
        }}
      />
    </div>
  );
}
