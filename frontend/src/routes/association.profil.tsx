import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect, lazy, Suspense } from 'react';
import { toast } from 'sonner';
import {
  Loader2, Check, Plus, Save, Mail, Phone, MapPin, Navigation,
  Building2, ShieldCheck, ShieldAlert, Clock, Camera, Sprout,
  Lock, Eye, EyeOff, PowerOff, Power,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ImageUpload } from '@/components/common/ImageUpload';
import { useAuth } from '@/context/AuthContext';
import {
  getMyProfile, updateMyProfile, changePassword, toggleAccountStatut,
  type AssociationProfile,
} from '@/services/associationApi';
import { fetchDomaines, type DomaineItem } from '@/services/authApi';

export const Route = createFileRoute('/association/profil')({
  component: ProfilAssociation,
});

const MissionMapPicker = lazy(() => import('@/components/dashboard/MissionMapPicker'));

/* ── Carte statut validation ── */
function StatutCard({ statut }: { statut?: string }) {
  if (statut === 'VALIDE') return (
    <div className="flex items-start gap-3 rounded-2xl border-2 border-green-400 bg-green-50 p-4 shadow-[3px_3px_0_var(--color-ink)]">
      <ShieldCheck className="h-6 w-6 text-green-600 shrink-0 mt-0.5" />
      <div>
        <p className="font-bold text-green-800">Association validée ✓</p>
        <p className="text-xs text-green-700 mt-0.5">Validée par CountMeIn. Vous pouvez créer et publier des missions.</p>
      </div>
    </div>
  );
  if (statut === 'REFUSE') return (
    <div className="flex items-start gap-3 rounded-2xl border-2 border-red-400 bg-red-50 p-4 shadow-[3px_3px_0_var(--color-ink)]">
      <ShieldAlert className="h-6 w-6 text-red-600 shrink-0 mt-0.5" />
      <div>
        <p className="font-bold text-red-800">Demande refusée</p>
        <p className="text-xs text-red-700 mt-0.5">Contactez l'équipe CountMeIn pour plus d'informations.</p>
      </div>
    </div>
  );
  return (
    <div className="flex items-start gap-3 rounded-2xl border-2 border-yellow-400 bg-yellow-50 p-4 shadow-[3px_3px_0_var(--color-ink)]">
      <Clock className="h-6 w-6 text-yellow-600 shrink-0 mt-0.5" />
      <div>
        <p className="font-bold text-yellow-800">En attente de validation</p>
        <p className="text-xs text-yellow-700 mt-0.5">Dossier en cours d'examen. Profitez-en pour compléter votre profil.</p>
      </div>
    </div>
  );
}

/* ── Reverse geocoding via Nominatim ── */
async function reverseGeocode(lat: number, lng: number): Promise<{ ville: string; adresse: string }> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`
    );
    if (!res.ok) return { ville: '', adresse: '' };
    const data = await res.json();
    const addr = data.address || {};
    const ville = addr.city || addr.town || addr.village || addr.municipality || '';
    const adresse = [addr.road, addr.house_number].filter(Boolean).join(' ') || data.display_name || '';
    return { ville, adresse };
  } catch {
    return { ville: '', adresse: '' };
  }
}

function ProfilAssociation() {
  const { user, loginUser } = useAuth();
  const token = localStorage.getItem('countmein_token') ?? '';

  const [profile, setProfile] = useState<AssociationProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [geolocating, setGeolocating] = useState(false);
  const [reversingGeo, setReversingGeo] = useState(false);
  const [catalogDomaines, setCatalogDomaines] = useState<DomaineItem[]>([]);
  const [selectedDomaineIds, setSelectedDomaineIds] = useState<number[]>([]);
  const [position, setPosition] = useState<[number, number]>([35.5785, -5.3684]);
  const [form, setForm] = useState({
    nomAssociation: '', description: '', ville: '', adresse: '', contact: '', logoUrl: '',
  });

  // Mot de passe
  const [pwdForm, setPwdForm] = useState({ current: '', next: '', confirm: '' });
  const [showPwd, setShowPwd] = useState({ current: false, next: false, confirm: false });
  const [savingPwd, setSavingPwd] = useState(false);

  // Statut compte (ACTIF / DESACTIVE) — distinct de statutValidation
  const [accountStatut, setAccountStatut] = useState<string>('ACTIF');
  const [togglingStatut, setTogglingStatut] = useState(false);
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);

  useEffect(() => {
    fetchDomaines().then(setCatalogDomaines);
    getMyProfile()
      .then((p) => {
        setProfile(p);
        setForm({
          nomAssociation: p.nomAssociation ?? '',
          description: p.description ?? '',
          ville: p.ville ?? '',
          adresse: p.adresse ?? '',
          contact: p.contact ?? '',
          logoUrl: p.logoUrl ?? '',
        });
        setSelectedDomaineIds(p.domaineIds ?? []);
        // statutCompte = ACTIF/DESACTIVE, distinct de statutValidation = VALIDE/REFUSE/EN_ATTENTE
        setAccountStatut(p.statutCompte ?? 'ACTIF');
        if (p.latitude && p.longitude) {
          setPosition([p.latitude, p.longitude]);
          if (!p.adresse && !p.ville) {
            setReversingGeo(true);
            reverseGeocode(p.latitude, p.longitude)
              .then(({ ville, adresse }) => setForm(f => ({ ...f, ville: ville || f.ville, adresse: adresse || f.adresse })))
              .finally(() => setReversingGeo(false));
          }
        }
      })
      .catch(() => toast.error('Impossible de charger le profil.'))
      .finally(() => setLoading(false));
  }, []);

  async function handleMapChange(pos: [number, number]) {
    setPosition(pos);
    setReversingGeo(true);
    try {
      const { ville, adresse } = await reverseGeocode(pos[0], pos[1]);
      setForm(f => ({ ...f, ville: ville || f.ville, adresse: adresse || f.adresse }));
    } finally {
      setReversingGeo(false);
    }
  }

  function handleGeolocate() {
    if (!navigator.geolocation) { toast.error('Géolocalisation non supportée.'); return; }
    setGeolocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude, lng = pos.coords.longitude;
        setPosition([lat, lng]);
        setReversingGeo(true);
        try {
          const { ville, adresse } = await reverseGeocode(lat, lng);
          setForm(f => ({ ...f, ville: ville || f.ville, adresse: adresse || f.adresse }));
        } finally { setGeolocating(false); setReversingGeo(false); }
      },
      (err) => { setGeolocating(false); toast.error('Position indisponible : ' + err.message); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  const toggleDomaine = (id: number) =>
    setSelectedDomaineIds(prev => prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]);

  async function handleSave(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    if (!form.nomAssociation.trim()) { toast.error('Le nom est obligatoire.'); return; }
    if (!form.ville.trim()) { toast.error('La ville est obligatoire.'); return; }
    setSaving(true);
    try {
      const updated = await updateMyProfile({
        ...form,
        latitude: position[0],
        longitude: position[1],
        domaineIds: selectedDomaineIds,
      });
      setProfile(updated);
      if (user) loginUser({ ...user, nomAssociation: updated.nomAssociation, photoUrl: updated.logoUrl ?? '' }, token);
      toast.success('Profil mis à jour !');
    } catch (err: any) {
      toast.error(err.message ?? 'Erreur lors de la mise à jour.');
    } finally { setSaving(false); }
  }

  async function handleChangePassword(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    if (!pwdForm.current || !pwdForm.next) { toast.error('Tous les champs sont requis.'); return; }
    if (pwdForm.next.length < 6) { toast.error('Minimum 6 caractères.'); return; }
    if (pwdForm.next !== pwdForm.confirm) { toast.error('Les mots de passe ne correspondent pas.'); return; }
    setSavingPwd(true);
    try {
      await changePassword(pwdForm.current, pwdForm.next);
      toast.success('Mot de passe mis à jour !');
      setPwdForm({ current: '', next: '', confirm: '' });
    } catch (err: any) {
      toast.error(err.message ?? 'Erreur.');
    } finally { setSavingPwd(false); }
  }

  async function handleToggleStatut() {
    setTogglingStatut(true);
    setConfirmDeactivate(false);
    try {
      const res = await toggleAccountStatut();
      setAccountStatut(res.statut);
      toast.success(res.message);
    } catch (err: any) {
      toast.error(err.message ?? 'Erreur.');
    } finally { setTogglingStatut(false); }
  }

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <div className="text-center space-y-3">
        <Loader2 className="h-10 w-10 animate-spin text-emerald mx-auto" />
        <p className="text-sm font-medium text-muted-foreground">Chargement du profil…</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-black text-ink">Profil de l'association</h1>
        <p className="mt-1 text-sm text-muted-foreground">Modifiez vos informations visibles par les bénévoles.</p>
      </div>

      <form onSubmit={handleSave}>
        <div className="grid gap-5 lg:grid-cols-3">

          {/* ══ COLONNE GAUCHE ══ */}
          <div className="space-y-5">

            {/* Card identité */}
            <div className="rounded-2xl border-2 border-ink bg-paper shadow-[4px_4px_0_var(--color-ink)] overflow-hidden">
              <div className="h-20 bg-emerald/20 border-b-2 border-ink" />
              <div className="px-5 pb-5 -mt-10">
                <div className="h-20 w-20 rounded-2xl border-2 border-ink shadow-[3px_3px_0_var(--color-ink)] overflow-hidden bg-muted flex items-center justify-center">
                  {form.logoUrl
                    ? <img src={form.logoUrl} alt="Logo" className="h-full w-full object-cover" />
                    : <Building2 className="h-10 w-10 text-muted-foreground/30" />
                  }
                </div>
                <p className="mt-3 font-display text-lg font-black text-ink truncate">
                  {form.nomAssociation || 'Mon association'}
                </p>
                <div className="flex flex-wrap gap-2 mt-1 text-xs text-muted-foreground">
                  {form.ville && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{form.ville}</span>}
                  {profile?.email && <span className="flex items-center gap-1 max-w-full truncate"><Mail className="h-3 w-3 shrink-0" />{profile.email}</span>}
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {profile?.domaineNoms?.slice(0, 3).map(d => (
                    <span key={d} className="rounded-full border border-emerald/50 bg-emerald/10 px-2 py-0.5 text-[10px] font-semibold text-emerald">{d}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Upload logo */}
            <div className="rounded-2xl border-2 border-ink bg-paper p-4 shadow-[4px_4px_0_var(--color-ink)]">
              <h3 className="flex items-center gap-2 font-bold text-ink text-sm mb-3">
                <Camera className="h-4 w-4 text-pink" /> Logo de l'association
              </h3>
              <ImageUpload id="logo-asso" label="" value={form.logoUrl}
                onChange={(url) => setForm(f => ({ ...f, logoUrl: url }))} />
            </div>

            {/* Statut de validation */}
            <StatutCard statut={profile?.statutValidation} />

            {/* Mot de passe */}
            <form onSubmit={handleChangePassword} className="rounded-2xl border-2 border-ink bg-paper shadow-[4px_4px_0_var(--color-ink)] overflow-hidden">
              <div className="flex items-center gap-3 border-b-2 border-ink bg-muted/30 px-4 py-3">
                <Lock className="h-4 w-4 text-mustard" />
                <h2 className="font-display font-bold text-ink text-sm">Mot de passe</h2>
              </div>
              <div className="p-4 space-y-3">
                {([
                  { key: 'current' as const, label: 'Actuel',    id: 'pwd-current', ac: 'current-password' },
                  { key: 'next'    as const, label: 'Nouveau',   id: 'pwd-next',    ac: 'new-password' },
                  { key: 'confirm' as const, label: 'Confirmer', id: 'pwd-confirm', ac: 'new-password' },
                ] as const).map(({ key, label, id, ac }) => (
                  <div key={key} className="space-y-1">
                    <Label htmlFor={id} className="text-xs font-bold text-ink">{label}</Label>
                    <div className="relative">
                      <input id={id} type={showPwd[key] ? 'text' : 'password'}
                        value={pwdForm[key]}
                        autoComplete={ac}
                        onChange={e => setPwdForm(f => ({ ...f, [key]: e.target.value }))}
                        placeholder="••••••••"
                        className="w-full rounded-xl border-2 border-ink bg-paper px-3 py-2 pr-9 text-sm shadow-[2px_2px_0_var(--color-ink)] focus:outline-none focus:shadow-[3px_3px_0_var(--color-ink)] transition-shadow" />
                      <button type="button"
                        onClick={() => setShowPwd(s => ({ ...s, [key]: !s[key] }))}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-ink">
                        {showPwd[key] ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>
                ))}
                <Button type="submit" disabled={savingPwd}
                  className="w-full border-2 border-ink bg-mustard font-bold text-ink shadow-[3px_3px_0_var(--color-ink)] hover:-translate-y-0.5 transition-all px-4 py-2 rounded-xl text-sm disabled:opacity-60 disabled:pointer-events-none mt-1">
                  {savingPwd ? <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />Enregistrement…</> : <><Lock className="mr-1.5 h-3.5 w-3.5" />Mettre à jour</>}
                </Button>
              </div>
            </form>

            {/* Gestion du compte */}
            <div className="rounded-2xl border-2 border-ink bg-paper shadow-[4px_4px_0_var(--color-ink)] overflow-hidden">
              <div className="flex items-center gap-3 border-b-2 border-ink bg-muted/30 px-4 py-3">
                <PowerOff className="h-4 w-4 text-red-500" />
                <h2 className="font-display font-bold text-ink text-sm">Gestion du compte</h2>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between rounded-xl border border-ink/20 bg-muted/30 px-3 py-2.5">
                  <div>
                    <p className="text-xs font-bold text-ink">Statut du compte</p>
                    <p className="text-xs text-muted-foreground">
                      {accountStatut === 'ACTIF' ? 'Actif et visible.' : 'Désactivé et invisible.'}
                    </p>
                  </div>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
                    accountStatut === 'ACTIF'
                      ? 'bg-green-100 text-green-700 border-green-300'
                      : 'bg-red-100 text-red-600 border-red-300'
                  }`}>
                    {accountStatut === 'ACTIF' ? 'Actif' : 'Désactivé'}
                  </span>
                </div>
                {accountStatut === 'ACTIF' && !confirmDeactivate && (
                  <Button type="button" variant="outline" onClick={() => setConfirmDeactivate(true)}
                    className="w-full border-2 border-red-400 text-red-600 text-sm font-bold hover:bg-red-50 rounded-xl px-4 py-2">
                    <PowerOff className="mr-1.5 h-3.5 w-3.5" /> Désactiver mon compte
                  </Button>
                )}
                {accountStatut === 'ACTIF' && confirmDeactivate && (
                  <div className="rounded-xl border-2 border-red-400 bg-red-50 p-3 space-y-2">
                    <p className="text-xs font-bold text-red-700">Confirmer la désactivation ?</p>
                    <p className="text-xs text-red-600">Votre compte sera invisible. Réactivable à tout moment.</p>
                    <div className="flex gap-2">
                      <Button type="button" onClick={handleToggleStatut} disabled={togglingStatut}
                        className="bg-red-500 text-white border-2 border-red-700 font-bold rounded-xl px-3 py-1.5 text-xs hover:bg-red-600 disabled:opacity-60">
                        {togglingStatut ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Confirmer'}
                      </Button>
                      <Button type="button" variant="outline" onClick={() => setConfirmDeactivate(false)}
                        className="border-2 border-ink font-bold rounded-xl px-3 py-1.5 text-xs">Annuler</Button>
                    </div>
                  </div>
                )}
                {accountStatut !== 'ACTIF' && (
                  <Button type="button" onClick={handleToggleStatut} disabled={togglingStatut}
                    className="w-full border-2 border-ink bg-emerald text-emerald-foreground text-sm font-bold shadow-[3px_3px_0_var(--color-ink)] hover:-translate-y-0.5 transition-all px-4 py-2 rounded-xl disabled:opacity-60 disabled:pointer-events-none">
                    {togglingStatut ? <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />Réactivation…</> : <><Power className="mr-1.5 h-3.5 w-3.5" />Réactiver mon compte</>}
                  </Button>
                )}
              </div>
            </div>

          </div>{/* fin colonne gauche */}

          {/* ══ COLONNE DROITE ══ */}
          <div className="lg:col-span-2 space-y-5">

            {/* Informations générales */}
            <div className="rounded-2xl border-2 border-ink bg-paper shadow-[4px_4px_0_var(--color-ink)] overflow-hidden">
              <div className="flex items-center gap-3 border-b-2 border-ink bg-muted/30 px-5 py-3.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl border-2 border-ink bg-paper shadow-[2px_2px_0_var(--color-ink)]">
                  <Building2 className="h-4 w-4 text-emerald" />
                </div>
                <h2 className="font-display font-bold text-ink">Informations générales</h2>
              </div>
              <div className="p-5 space-y-4">
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5 text-sm font-bold text-ink">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground" /> Adresse e-mail
                  </Label>
                  <Input value={profile?.email ?? ''} disabled
                    className="rounded-xl border-2 border-ink bg-muted/50 cursor-not-allowed text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">Non modifiable.</p>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="nom-asso" className="flex items-center gap-1.5 text-sm font-bold text-ink">
                    <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                    Nom de l'association <span className="text-pink">*</span>
                  </Label>
                  <Input id="nom-asso" required value={form.nomAssociation}
                    onChange={e => setForm(f => ({ ...f, nomAssociation: e.target.value }))}
                    placeholder="Ex: Association Solidarité+"
                    className="rounded-xl border-2 border-ink shadow-[2px_2px_0_var(--color-ink)] focus:shadow-[3px_3px_0_var(--color-ink)] transition-shadow" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="description-asso" className="text-sm font-bold text-ink">Description</Label>
                  <Textarea id="description-asso" value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    className="min-h-[110px] rounded-xl border-2 border-ink shadow-[2px_2px_0_var(--color-ink)] resize-none"
                    placeholder="Décrivez votre association, ses valeurs, ses missions…" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="contact-asso" className="flex items-center gap-1.5 text-sm font-bold text-ink">
                    <Phone className="h-3.5 w-3.5 text-muted-foreground" /> Téléphone de contact
                  </Label>
                  <Input id="contact-asso" value={form.contact}
                    onChange={e => setForm(f => ({ ...f, contact: e.target.value }))}
                    placeholder="06 12 34 56 78"
                    className="rounded-xl border-2 border-ink shadow-[2px_2px_0_var(--color-ink)] transition-shadow" />
                </div>
              </div>
            </div>

            {/* Localisation avec carte */}
            <div className="rounded-2xl border-2 border-ink bg-paper shadow-[4px_4px_0_var(--color-ink)] overflow-hidden">
              <div className="flex items-center justify-between border-b-2 border-ink bg-muted/30 px-5 py-3.5">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl border-2 border-ink bg-paper shadow-[2px_2px_0_var(--color-ink)]">
                    <MapPin className="h-4 w-4 text-blue-500" />
                  </div>
                  <h2 className="font-display font-bold text-ink">Localisation du siège</h2>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={handleGeolocate} disabled={geolocating}
                  className="flex items-center gap-1.5 text-xs border-ink hover:bg-mustard font-bold">
                  {geolocating
                    ? <><Loader2 className="h-3 w-3 animate-spin" />Localisation…</>
                    : <><Navigation className="h-3 w-3" />Me géolocaliser</>}
                </Button>
              </div>
              <div className="p-5 space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-sm font-bold text-ink">Position sur la carte</Label>
                  <p className="text-xs text-muted-foreground">Cliquez ou géolocalisez — ville et adresse se remplissent automatiquement.</p>
                  <Suspense fallback={<Skeleton className="h-56 w-full rounded-xl" />}>
                    <div className="rounded-xl overflow-hidden border-2 border-ink shadow-[3px_3px_0_var(--color-ink)]">
                      <MissionMapPicker value={position} onChange={handleMapChange} />
                    </div>
                  </Suspense>
                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
                    <MapPin className="h-3 w-3" />
                    {position[0].toFixed(5)}, {position[1].toFixed(5)}
                    {reversingGeo && <Loader2 className="h-3 w-3 animate-spin ml-1" />}
                  </p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="ville-asso" className="flex items-center gap-1.5 text-sm font-bold text-ink">
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground" /> Ville <span className="text-pink">*</span>
                    </Label>
                    <Input id="ville-asso" required value={form.ville}
                      onChange={e => setForm(f => ({ ...f, ville: e.target.value }))}
                      placeholder="Casablanca, Rabat…"
                      className="rounded-xl border-2 border-ink shadow-[2px_2px_0_var(--color-ink)] transition-shadow" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="adresse-asso" className="text-sm font-bold text-ink">Adresse</Label>
                    <Input id="adresse-asso" value={form.adresse}
                      onChange={e => setForm(f => ({ ...f, adresse: e.target.value }))}
                      placeholder="12 Bd Mohammed V"
                      className="rounded-xl border-2 border-ink shadow-[2px_2px_0_var(--color-ink)] transition-shadow" />
                  </div>
                </div>
              </div>
            </div>

            {/* Domaines */}
            <div className="rounded-2xl border-2 border-ink bg-paper shadow-[4px_4px_0_var(--color-ink)] overflow-hidden">
              <div className="flex items-center justify-between border-b-2 border-ink bg-muted/30 px-5 py-3.5">
                <h2 className="font-display font-bold text-ink flex items-center gap-2">
                  <Sprout className="h-4 w-4 text-green-600" /> Domaines d'activité
                </h2>
                <span className="text-xs font-medium text-muted-foreground">{selectedDomaineIds.length} sélectionné(s)</span>
              </div>
              <div className="p-5">
                <p className="text-xs text-muted-foreground mb-3">Cliquez pour sélectionner :</p>
                <div className="flex flex-wrap gap-2">
                  {catalogDomaines.map(d => {
                    const active = selectedDomaineIds.includes(d.id);
                    return (
                      <Badge key={d.id} onClick={() => toggleDomaine(d.id)}
                        className={`cursor-pointer border border-ink text-xs transition-all select-none ${
                          active ? 'bg-emerald text-emerald-foreground font-bold shadow-[2px_2px_0_var(--color-ink)]' : 'bg-paper hover:bg-emerald/20 text-ink/80'
                        }`}>
                        {active ? <Check className="mr-1 h-3 w-3 inline" /> : <Plus className="mr-1 h-3 w-3 inline" />}
                        {d.nom}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Bouton sauvegarder */}
            <Button type="submit" disabled={saving}
              className="w-full rounded-xl border-2 border-ink bg-emerald font-bold text-emerald-foreground shadow-[4px_4px_0_var(--color-ink)] hover:-translate-y-0.5 hover:shadow-[5px_5px_0_var(--color-ink)] transition-all disabled:opacity-60 disabled:pointer-events-none py-3">
              {saving
                ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Enregistrement…</>
                : <><Save className="mr-2 h-4 w-4" />Enregistrer les modifications</>
              }
            </Button>

          </div>{/* fin colonne droite */}
        </div>
      </form>
    </div>
  );
}
