import { useState, useEffect, type FormEvent } from "react";
import { z } from "zod";
import { MapPin, Loader2, Check, Plus, ChevronLeft, Mail, RefreshCw, Eye, EyeOff, Zap, Sprout, PartyPopper } from "lucide-react";
import ReCAPTCHA from "react-google-recaptcha";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { FormError, FormSuccess, authInput, authButton } from "@/components/auth/AuthLayout";
import { ImageUpload } from "@/components/common/ImageUpload";
import {
  errorMessage, register, sendOtp, verifyEmail,
  fetchCompetences, fetchDomaines,
  type CompetenceItem, type DomaineItem,
} from "@/services/authApi";
import { useAuth } from "@/context/AuthContext";
import { useAuthModal } from "@/context/AuthModalContext";

/* ── Schemas ── */
const step1Schema = z.object({
  email: z.string().trim().email("E-mail invalide").max(255),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères").max(128),
  confirm: z.string(),
}).refine((d) => d.password === d.confirm, { message: "Les mots de passe ne correspondent pas", path: ["confirm"] });

const step2Schema = z.object({
  nom: z.string().trim().min(1, "Nom requis").max(100),
  prenom: z.string().trim().min(1, "Prénom requis").max(100),
  ville: z.string().trim().min(1, "Ville requise").max(100),
});

const TOTAL_STEPS = 4;
const STEP_LABELS = ["Compte", "Profil", "Centres d'intérêt", "Vérification"];

/* ── Barre de progression ── */
function StepBar({ current, total, labels }: { current: number; total: number; labels: string[] }) {
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-bold text-muted-foreground">Étape {current} sur {total}</span>
        <span className="text-xs font-bold text-ink">{labels[current - 1]}</span>
      </div>
      <div className="flex gap-1.5">
        {Array.from({ length: total }).map((_, i) => (
          <div key={i} className={`h-2 flex-1 rounded-full border border-ink transition-all ${i < current ? "bg-mustard" : "bg-paper"}`} />
        ))}
      </div>
    </div>
  );
}

function Field({ id, label, ...props }: { id: string; label: string } & React.ComponentPropsWithoutRef<"input">) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-sm font-bold text-ink">{label}</Label>
      <input id={id} className={authInput} {...props} />
    </div>
  );
}

function PasswordField({ id, label, value, onChange, autoComplete, showStrength }: {
  id: string; label: string; value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  autoComplete?: string;
  showStrength?: boolean;
}) {
  const [show, setShow] = useState(false);

  const strength = value.length === 0 ? 0
    : value.length < 4 ? 1
    : value.length < 7 ? 2
    : value.length < 10 ? 3
    : 4;

  const strengthLabel = ["", "Faible", "Moyen", "Bien", "Fort"][strength];
  const strengthColors = ["", "bg-red-400", "bg-orange-400", "bg-yellow-400", "bg-emerald"];

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-sm font-bold text-ink">{label}</Label>
      <div className="relative">
        <input id={id} type={show ? "text" : "password"} required
          autoComplete={autoComplete ?? "current-password"} placeholder="••••••••"
          className={authInput + " pr-11"} value={value} onChange={onChange} />
        <button type="button" onClick={() => setShow(v => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-ink"
          aria-label={show ? "Masquer" : "Afficher"}>
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {showStrength && value.length > 0 && (
        <div className="flex items-center gap-1 pt-0.5">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-colors border border-ink/10 ${
                i <= strength ? strengthColors[strength] : "bg-border"
              }`}
            />
          ))}
          <span className="ml-1 text-[10px] font-semibold text-muted-foreground">{strengthLabel}</span>
        </div>
      )}
    </div>
  );
}

export function RegisterBenevoleModal() {
  const { modal, closeModal, openLogin } = useAuthModal();
  const { loginUser } = useAuth();
  const siteKey = import.meta.env["VITE_RECAPTCHA_SITE_KEY"] as string | undefined;

  const [step, setStep] = useState(1);
  const [catalogCompetences, setCatalogCompetences] = useState<CompetenceItem[]>([]);
  const [catalogDomaines, setCatalogDomaines] = useState<DomaineItem[]>([]);
  const [selectedCompetences, setSelectedCompetences] = useState<string[]>([]);
  const [selectedDomaineIds, setSelectedDomaineIds] = useState<number[]>([]);
  const [customCompInput, setCustomCompInput] = useState("");
  const [geolocating, setGeolocating] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // OTP (étape 4 — après création du compte)
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [registeredToken, setRegisteredToken] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpSending, setOtpSending] = useState(false);
  const [otpCooldown, setOtpCooldown] = useState(0);

  const [form, setForm] = useState({
    email: "", password: "", confirm: "",
    nom: "", prenom: "", telephone: "", dateNaissance: "",
    adresse: "", ville: "", biographie: "", photoUrl: "",
    rayonDeplacementKm: 20,
    latitude: null as number | null, longitude: null as number | null,
  });

  useEffect(() => {
    if (modal === "register-benevole") {
      fetchCompetences().then(setCatalogCompetences);
      fetchDomaines().then(setCatalogDomaines);
    }
  }, [modal]);

  useEffect(() => {
    if (otpCooldown <= 0) return;
    const t = setTimeout(() => setOtpCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [otpCooldown]);

  function resetAll() {
    setStep(1);
    setSelectedCompetences([]); setSelectedDomaineIds([]);
    setCustomCompInput(""); setRecaptchaToken(null);
    setError(null); setSuccess(null); setLoading(false);
    setRegisteredEmail(""); setRegisteredToken("");
    setOtpCode(""); setOtpSending(false); setOtpCooldown(0);
    setForm({ email: "", password: "", confirm: "", nom: "", prenom: "", telephone: "",
      dateNaissance: "", adresse: "", ville: "", biographie: "", photoUrl: "",
      rayonDeplacementKm: 20, latitude: null, longitude: null });
  }

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const toggleCompetence = (nom: string) =>
    setSelectedCompetences(prev => prev.includes(nom) ? prev.filter(c => c !== nom) : [...prev, nom]);
  const toggleDomaine = (id: number) =>
    setSelectedDomaineIds(prev => prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]);
  const addCustomCompetence = () => {
    const t = customCompInput.trim();
    if (t && !selectedCompetences.includes(t)) { setSelectedCompetences(prev => [...prev, t]); setCustomCompInput(""); }
  };

  function handleGeolocate() {
    if (!navigator.geolocation) { setError("Géolocalisation non supportée."); return; }
    setGeolocating(true); setError(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude, lon = pos.coords.longitude;
        setForm(f => ({ ...f, latitude: lat, longitude: lon }));
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1`);
          if (res.ok) {
            const data = await res.json();
            const addr = data.address || {};
            const city = addr.city || addr.town || addr.village || addr.municipality || "";
            const street = [addr.road, addr.house_number].filter(Boolean).join(" ");
            setForm(f => ({ ...f, ville: city || f.ville, adresse: street || data.display_name || f.adresse }));
          }
        } catch {} finally { setGeolocating(false); }
      },
      (err) => { setGeolocating(false); setError("Position indisponible : " + err.message); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  function handleStep1(e: FormEvent) {
    e.preventDefault(); setError(null);
    const r = step1Schema.safeParse(form);
    if (!r.success) return setError(r.error.issues[0]?.message ?? "Formulaire invalide");
    setStep(2);
  }

  function handleStep2(e: FormEvent) {
    e.preventDefault(); setError(null);
    const r = step2Schema.safeParse(form);
    if (!r.success) return setError(r.error.issues[0]?.message ?? "Formulaire invalide");
    setStep(3);
  }

  /* ── Soumission étape 3 → crée le compte + envoie OTP ── */
  async function onSubmit(e: FormEvent) {
    e.preventDefault(); setError(null);
    if (!recaptchaToken && siteKey) return setError("Merci de cocher « Je ne suis pas un robot ».");
    setLoading(true);
    try {
      const res = await register({
        email: form.email.trim(), password: form.password,
        role: "BENEVOLE", recaptchaToken,
        latitude: form.latitude, longitude: form.longitude,
        domaineIds: selectedDomaineIds,
        nom: form.nom, prenom: form.prenom, telephone: form.telephone,
        dateNaissance: form.dateNaissance, adresse: form.adresse,
        ville: form.ville, photoUrl: form.photoUrl, biographie: form.biographie,
        rayonDeplacementKm: Number(form.rayonDeplacementKm),
        competences: selectedCompetences,
      });
      if ((res as any).success) {
        const token = (res as any).token || "token_" + Date.now();
        // Connecter l'utilisateur immédiatement
        loginUser({ email: form.email.trim(), role: "BENEVOLE", nom: form.nom, prenom: form.prenom, photoUrl: form.photoUrl }, token);
        setRegisteredEmail(form.email.trim());
        setRegisteredToken(token);
        setOtpCooldown(60);
        setStep(4); // Passer à l'étape de vérification OTP
      } else {
        setError((res as any).message || "Échec de la création du compte.");
      }
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  /* ── Renvoyer OTP ── */
  async function handleResendOtp() {
    if (otpCooldown > 0) return;
    setOtpSending(true); setError(null);
    try {
      await sendOtp(registeredEmail);
      setOtpCooldown(60);
    } catch { setError("Impossible de renvoyer le code."); }
    finally { setOtpSending(false); }
  }

  /* ── Vérifier OTP → terminer ── */
  async function handleVerifyOtp(e: FormEvent) {
    e.preventDefault(); setError(null);
    if (otpCode.trim().length !== 6) return setError("Le code doit contenir 6 chiffres.");
    setLoading(true);
    try {
      const res = await verifyEmail(registeredEmail, otpCode.trim());
      if (res.success) {
        setSuccess("Email vérifié ! Bienvenue sur CountMeIn");
        setTimeout(() => { closeModal(); resetAll(); }, 1500);
      } else {
        setError(res.message || "Code invalide ou expiré.");
      }
    } catch { setError("Code invalide ou expiré."); }
    finally { setLoading(false); }
  }

  /* ── Passer la vérification ── */
  function handleSkipVerification() {
    setSuccess("Compte créé ! Tu peux vérifier ton email plus tard.");
    setTimeout(() => { closeModal(); resetAll(); }, 1200);
  }

  return (
    <Dialog open={modal === "register-benevole"} onOpenChange={(open) => { if (!open) { closeModal(); resetAll(); } }}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl border-2 border-ink bg-paper shadow-[6px_6px_0_var(--color-ink)] sm:max-w-lg">
        <DialogHeader className="mb-1">
          <DialogTitle className="font-display text-2xl font-black text-ink">Inscription Bénévole</DialogTitle>
          <p className="text-sm font-medium text-muted-foreground">Rejoins la communauté CountMeIn.</p>
          <div className="mt-2 h-1 w-10 rounded-full border border-ink bg-mustard" />
        </DialogHeader>

        <StepBar current={step} total={TOTAL_STEPS} labels={STEP_LABELS} />
        <FormSuccess message={success} />
        <FormError message={error} />

        {/* ── ÉTAPE 1 : Compte ── */}
        {step === 1 && (
          <form onSubmit={handleStep1} className="space-y-4">
            <Field id="benv-email" label="E-mail *" type="email" required autoComplete="email" value={form.email} onChange={set("email")} placeholder="toi@example.ma" />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <PasswordField id="benv-pwd" label="Mot de passe *" autoComplete="new-password" value={form.password} onChange={set("password")} showStrength />
              <PasswordField id="benv-confirm" label="Confirmation *" autoComplete="new-password" value={form.confirm} onChange={set("confirm")} />
            </div>
            <Button type="submit" className={authButton}>Suivant →</Button>
            <p className="text-center text-sm font-medium text-muted-foreground">
              Déjà inscrit(e) ?{" "}
              <button type="button" onClick={() => { resetAll(); openLogin(); }} className="font-bold text-ink underline underline-offset-2 hover:text-pink">Se connecter</button>
            </p>
          </form>
        )}

        {/* ── ÉTAPE 2 : Profil ── */}
        {step === 2 && (
          <form onSubmit={handleStep2} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field id="benv-nom" label="Nom *" required value={form.nom} onChange={set("nom")} />
              <Field id="benv-prenom" label="Prénom *" required value={form.prenom} onChange={set("prenom")} />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field id="benv-tel" label="Téléphone" type="tel" value={form.telephone} onChange={set("telephone")} placeholder="06 12 34 56 78" />
              <Field id="benv-ddn" label="Date de naissance" type="date" value={form.dateNaissance} onChange={set("dateNaissance")} />
            </div>
            <div className="rounded-xl border-2 border-ink bg-paper/50 p-3 space-y-3">
              <div className="flex items-center justify-between">
                <Label className="font-bold flex items-center gap-1"><MapPin className="h-4 w-4 text-pink" /> Localisation *</Label>
                <Button type="button" variant="outline" size="sm" onClick={handleGeolocate} disabled={geolocating} className="text-xs border-ink hover:bg-mustard font-bold">
                  {geolocating ? <><Loader2 className="mr-1 h-3 w-3 animate-spin" />GPS…</> : <><MapPin className="mr-1 h-3 w-3" /> Me géolocaliser</>}
                </Button>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field id="benv-ville" label="Ville *" required value={form.ville} onChange={set("ville")} placeholder="Paris, Lyon…" />
                <Field id="benv-adresse" label="Adresse" value={form.adresse} onChange={set("adresse")} placeholder="12 Rue de la Paix" />
              </div>
            </div>
            <Field id="benv-rayon" label="Rayon de déplacement (km)" type="number" value={form.rayonDeplacementKm} onChange={set("rayonDeplacementKm")} min={1} max={500} />
            <ImageUpload id="benv-photo" label="Photo de profil" value={form.photoUrl} onChange={(url) => setForm(f => ({ ...f, photoUrl: url }))} />
            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={() => setStep(1)} className="flex-1 border-2 border-ink font-bold">
                <ChevronLeft className="h-4 w-4 mr-1" /> Précédent
              </Button>
              <Button type="submit" className={authButton + " flex-1"}>Suivant →</Button>
            </div>
          </form>
        )}

        {/* ── ÉTAPE 3 : Centres d'intérêt ── */}
        {step === 3 && (
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2 rounded-xl border-2 border-ink bg-paper/50 p-3">
              <Label className="font-bold flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5"><Zap className="h-4 w-4" /> Mes Compétences</span>
                <span className="text-xs text-muted-foreground font-normal">{selectedCompetences.length} sélectionnée(s)</span>
              </Label>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {catalogCompetences.map((comp) => {
                  const active = selectedCompetences.includes(comp.nom);
                  return (
                    <Badge key={comp.id} onClick={() => toggleCompetence(comp.nom)} className={`cursor-pointer border border-ink text-xs transition-all ${active ? "bg-mustard text-ink font-bold" : "bg-paper hover:bg-mustard/30 text-ink/80"}`}>
                      {active ? <Check className="mr-1 h-3 w-3 inline" /> : <Plus className="mr-1 h-3 w-3 inline" />}{comp.nom}
                    </Badge>
                  );
                })}
              </div>
              <div className="flex items-center gap-2 pt-2">
                <Input type="text" placeholder="Autre compétence..." value={customCompInput}
                  onChange={(e) => setCustomCompInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustomCompetence())}
                  className="h-8 text-xs border-ink bg-paper" />
                <Button type="button" variant="outline" size="sm" onClick={addCustomCompetence} className="h-8 text-xs border-ink hover:bg-mustard font-bold flex-shrink-0">Ajouter</Button>
              </div>
            </div>
            <div className="space-y-2 rounded-xl border-2 border-ink bg-paper/50 p-3">
              <Label className="font-bold flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5"><Sprout className="h-4 w-4" /> Domaines d'activité</span>
                <span className="text-xs text-muted-foreground font-normal">{selectedDomaineIds.length} sélectionné(s)</span>
              </Label>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {catalogDomaines.map((d) => {
                  const active = selectedDomaineIds.includes(d.id);
                  return (
                    <Badge key={d.id} onClick={() => toggleDomaine(d.id)} className={`cursor-pointer border border-ink text-xs transition-all ${active ? "bg-emerald text-emerald-foreground font-bold" : "bg-paper hover:bg-emerald/20 text-ink/80"}`}>
                      {active ? <Check className="mr-1 h-3 w-3 inline" /> : <Plus className="mr-1 h-3 w-3 inline" />}{d.nom}
                    </Badge>
                  );
                })}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="benv-bio" className="text-sm font-bold text-ink">Biographie / Présentation</Label>
              <Textarea id="benv-bio" className={authInput} value={form.biographie} onChange={set("biographie")} placeholder="Présentez-vous en quelques mots…" />
            </div>
            {siteKey ? (
              <ReCAPTCHA sitekey={siteKey} onChange={setRecaptchaToken} onExpired={() => setRecaptchaToken(null)} hl="fr" />
            ) : (
              <p className="text-xs text-muted-foreground italic">Mode Dev : reCAPTCHA désactivé.</p>
            )}
            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={() => setStep(2)} className="flex-1 border-2 border-ink font-bold">
                <ChevronLeft className="h-4 w-4 mr-1" /> Précédent
              </Button>
              <Button type="submit" disabled={loading} className={authButton + " flex-1"}>
                {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Création…</> : <span className="inline-flex items-center gap-1.5">Créer mon compte <PartyPopper className="h-4 w-4" /></span>}
              </Button>
            </div>
          </form>
        )}

        {/* ── ÉTAPE 4 : Vérification OTP ── */}
        {step === 4 && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div className="rounded-xl border-2 border-ink bg-mustard/20 p-4 text-center">
              <Mail className="mx-auto mb-2 h-8 w-8 text-ink" />
              <p className="text-sm font-bold text-ink">Un code a été envoyé à</p>
              <p className="text-base font-black text-ink">{registeredEmail}</p>
              <p className="mt-1 text-xs text-muted-foreground">Vérifie ta boîte de réception (et les spams).</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="benv-otp" className="text-sm font-bold text-ink">Code de vérification à 6 chiffres</Label>
              <input id="benv-otp" type="text" inputMode="numeric" pattern="[0-9]{6}" maxLength={6}
                placeholder="123456"
                className={authInput + " text-center text-2xl font-black tracking-[0.5em]"}
                value={otpCode} onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))} />
            </div>
            <Button type="submit" disabled={loading || otpCode.length !== 6} className={authButton}>
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Vérification…</> : "Vérifier mon email →"}
            </Button>
            <div className="flex items-center justify-between">
              <button type="button" onClick={handleSkipVerification} className="text-sm text-muted-foreground underline underline-offset-2 hover:text-ink">
                Vérifier plus tard
              </button>
              <button type="button" onClick={handleResendOtp} disabled={otpCooldown > 0 || otpSending} className="flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-ink disabled:opacity-50">
                <RefreshCw className={`h-3.5 w-3.5 ${otpSending ? "animate-spin" : ""}`} />
                {otpCooldown > 0 ? `Renvoyer (${otpCooldown}s)` : "Renvoyer"}
              </button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
