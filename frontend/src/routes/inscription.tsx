import { useState, useEffect, type FormEvent } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { MapPin, Loader2, Check, Plus } from "lucide-react";
import ReCAPTCHA from "react-google-recaptcha";

import { AuthLayout, FormError, FormSuccess, authButton, authInput } from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ImageUpload } from "@/components/common/ImageUpload";
import {
  errorMessage,
  register,
  fetchCompetences,
  fetchDomaines,
  type Role,
  type CompetenceItem,
  type DomaineItem,
} from "@/services/authApi";

export const Route = createFileRoute("/inscription")({
  validateSearch: z.object({
    role: z.enum(["BENEVOLE", "ASSOCIATION"]).optional(),
  }),
  head: () => ({
    meta: [
      { title: "Inscription — CountMeIn" },
      { name: "description", content: "Crée ton compte bénévole ou association sur CountMeIn." },
    ],
  }),
  component: RegisterPage,
});

const baseSchema = z
  .object({
    email: z.string().trim().email("E-mail invalide").max(255),
    password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères").max(128),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, { message: "Les mots de passe ne correspondent pas", path: ["confirm"] });

const benevoleSchema = z.object({
  nom: z.string().trim().min(1, "Nom requis").max(100),
  prenom: z.string().trim().min(1, "Prénom requis").max(100),
  telephone: z.string().optional(),
  dateNaissance: z.string().optional(),
  adresse: z.string().optional(),
  ville: z.string().trim().min(1, "Ville requise").max(100),
  photoUrl: z.string().optional(),
  biographie: z.string().optional(),
  rayonDeplacementKm: z.coerce.number().min(1).max(500).default(20),
});

const assoSchema = z.object({
  nomAssociation: z.string().trim().min(1, "Nom de l'association requis").max(150),
  contact: z.string().trim().min(1, "Téléphone de contact requis").max(30),
  adresse: z.string().optional(),
  ville: z.string().trim().min(1, "Ville requise").max(100),
  logoUrl: z.string().optional(),
  description: z.string().optional(),
});

function RegisterPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const siteKey = import.meta.env["VITE_RECAPTCHA_SITE_KEY"] as string | undefined;
  const [role, setRole] = useState<Role>(search.role ?? "BENEVOLE");

  // Catalogue chargé depuis le backend
  const [catalogCompetences, setCatalogCompetences] = useState<CompetenceItem[]>([]);
  const [catalogDomaines, setCatalogDomaines] = useState<DomaineItem[]>([]);

  // Sélections actuelles
  const [selectedCompetences, setSelectedCompetences] = useState<string[]>([]);
  const [selectedDomaineIds, setSelectedDomaineIds] = useState<number[]>([]);
  const [customCompInput, setCustomCompInput] = useState("");

  const [form, setForm] = useState({
    email: "",
    password: "",
    confirm: "",
    nom: "",
    prenom: "",
    telephone: "",
    dateNaissance: "",
    adresse: "",
    ville: "",
    biographie: "",
    photoUrl: "",
    logoUrl: "",
    rayonDeplacementKm: 20,
    nomAssociation: "",
    contact: "",
    description: "",
    latitude: null as number | null,
    longitude: null as number | null,
  });

  const [geolocating, setGeolocating] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCompetences().then(setCatalogCompetences);
    fetchDomaines().then(setCatalogDomaines);
  }, []);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const toggleCompetence = (nom: string) => {
    setSelectedCompetences((prev) =>
      prev.includes(nom) ? prev.filter((item) => item !== nom) : [...prev, nom]
    );
  };

  const toggleDomaine = (id: number) => {
    setSelectedDomaineIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const addCustomCompetence = () => {
    const trimmed = customCompInput.trim();
    if (trimmed && !selectedCompetences.includes(trimmed)) {
      setSelectedCompetences((prev) => [...prev, trimmed]);
      setCustomCompInput("");
    }
  };

  const handleGeolocate = () => {
    if (!navigator.geolocation) {
      setError("La géolocalisation n'est pas supportée par votre navigateur.");
      return;
    }
    setGeolocating(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        setForm((f) => ({ ...f, latitude: lat, longitude: lon }));

        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1`);
          if (res.ok) {
            const data = await res.json();
            const addr = data.address || {};
            const detectedCity = addr.city || addr.town || addr.village || addr.municipality || "";
            const detectedStreet = [addr.road, addr.house_number].filter(Boolean).join(" ");
            setForm((f) => ({
              ...f,
              ville: detectedCity || f.ville,
              adresse: detectedStreet || data.display_name || f.adresse,
            }));
          }
        } catch {
        } finally {
          setGeolocating(false);
        }
      },
      (err) => {
        setGeolocating(false);
        setError("Impossible de déterminer votre position : " + err.message);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const base = baseSchema.safeParse(form);
    if (!base.success) return setError(base.error.issues[0]?.message ?? "Formulaire invalide");

    let payload: any = {
      email: base.data.email,
      password: base.data.password,
      role,
      recaptchaToken,
      latitude: form.latitude,
      longitude: form.longitude,
      domaineIds: selectedDomaineIds,
    };

    if (role === "BENEVOLE") {
      const b = benevoleSchema.safeParse(form);
      if (!b.success) return setError(b.error.issues[0]?.message ?? "Formulaire bénévole invalide");
      payload = {
        ...payload,
        nom: b.data.nom,
        prenom: b.data.prenom,
        telephone: b.data.telephone,
        dateNaissance: b.data.dateNaissance,
        adresse: b.data.adresse,
        ville: b.data.ville,
        photoUrl: b.data.photoUrl,
        biographie: b.data.biographie,
        rayonDeplacementKm: b.data.rayonDeplacementKm,
        competences: selectedCompetences,
      };
    } else {
      const a = assoSchema.safeParse(form);
      if (!a.success) return setError(a.error.issues[0]?.message ?? "Formulaire association invalide");
      payload = {
        ...payload,
        nomAssociation: a.data.nomAssociation,
        contact: a.data.contact,
        adresse: a.data.adresse,
        ville: a.data.ville,
        logoUrl: a.data.logoUrl,
        description: a.data.description,
      };
    }

    if (!recaptchaToken && siteKey) {
      return setError("Merci de cocher « Je ne suis pas un robot ».");
    }

    setLoading(true);
    try {
      const res = await register(payload);
      if (res.success) {
        setSuccess("Compte créé avec succès ! Redirection vers la page de connexion...");
        setTimeout(() => {
          navigate({ to: "/login", search: { registered: "true" } });
        }, 1500);
      } else {
        setError(res.message || "Échec de la création du compte.");
      }
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  /** Composant réutilisable du sélecteur de Domaines (partagé Bénévole + Association) */
  const DomaineSelector = () => (
    <div className="space-y-2 rounded-xl border-2 border-ink bg-paper/50 p-3">
      <Label className="font-bold flex items-center justify-between">
        <span>🌱 Domaines d'activité</span>
        <span className="text-xs text-muted-foreground font-normal">
          {selectedDomaineIds.length} sélectionné(s)
        </span>
      </Label>
      <p className="text-xs text-muted-foreground">
        {role === "BENEVOLE"
          ? "Sélectionnez les domaines de bénévolat qui vous passionnent :"
          : "Sélectionnez les domaines d'activité de votre association :"}
      </p>
      <div className="flex flex-wrap gap-1.5 pt-1">
        {catalogDomaines.map((domaine) => {
          const active = selectedDomaineIds.includes(domaine.id);
          return (
            <Badge
              key={domaine.id}
              onClick={() => toggleDomaine(domaine.id)}
              className={`cursor-pointer border border-ink text-xs transition-all ${
                active
                  ? "bg-emerald text-emerald-foreground font-bold shadow-sm"
                  : "bg-paper hover:bg-emerald/20 text-ink/80"
              }`}
            >
              {active ? <Check className="mr-1 h-3 w-3 inline" /> : <Plus className="mr-1 h-3 w-3 inline" />}
              {domaine.nom}
            </Badge>
          );
        })}
      </div>
    </div>
  );

  return (
    <AuthLayout title="Inscription" subtitle="Rejoins la communauté CountMeIn.">
      <form onSubmit={onSubmit} className="space-y-4">
        <Tabs value={role} onValueChange={(v) => setRole(v as Role)}>
          <TabsList className="grid h-auto w-full grid-cols-2 rounded-xl border-2 border-ink bg-paper p-1">
            <TabsTrigger value="BENEVOLE" className="rounded-lg py-2 data-[state=active]:bg-mustard data-[state=active]:text-ink font-bold">
              Je suis un(e) Bénévole
            </TabsTrigger>
            <TabsTrigger value="ASSOCIATION" className="rounded-lg py-2 data-[state=active]:bg-emerald data-[state=active]:text-emerald-foreground font-bold">
              Je suis une Association
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <FormSuccess message={success} />
        <FormError message={error} />

        <Field id="email" label="E-mail *" type="email" value={form.email} onChange={set("email")} autoComplete="email" required />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field id="password" label="Mot de passe *" type="password" value={form.password} onChange={set("password")} autoComplete="new-password" required />
          <Field id="confirm" label="Confirmation *" type="password" value={form.confirm} onChange={set("confirm")} autoComplete="new-password" required />
        </div>

        <div className="rounded-xl border-2 border-ink bg-paper/50 p-3 space-y-3">
          <div className="flex items-center justify-between">
            <Label className="font-bold flex items-center gap-1">
              <MapPin className="h-4 w-4 text-pink" /> Localisation & Adresse *
            </Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleGeolocate}
              disabled={geolocating}
              className="text-xs border-ink hover:bg-mustard font-bold"
            >
              {geolocating ? (
                <><Loader2 className="mr-1 h-3 w-3 animate-spin" /> GPS…</>
              ) : (
                <>📍 Me géolocaliser</>
              )}
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field id="ville" label="Ville *" value={form.ville} onChange={set("ville")} placeholder="Ex: Paris, Lyon..." required />
            <Field id="adresse" label="Adresse (Rue, N°)" value={form.adresse} onChange={set("adresse")} placeholder="Ex: 12 Rue de la Paix" />
          </div>
        </div>

        {/* ─────────────── BENEVOLE ─────────────── */}
        {role === "BENEVOLE" && (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field id="nom" label="Nom *" value={form.nom} onChange={set("nom")} required />
              <Field id="prenom" label="Prénom *" value={form.prenom} onChange={set("prenom")} required />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field id="telephone" label="Téléphone de contact" type="tel" value={form.telephone} onChange={set("telephone")} placeholder="06 12 34 56 78" />
              <Field id="dateNaissance" label="Date de naissance" type="date" value={form.dateNaissance} onChange={set("dateNaissance")} />
            </div>

            <Field id="rayonDeplacementKm" label="Rayon de déplacement (km)" type="number" value={form.rayonDeplacementKm} onChange={set("rayonDeplacementKm")} min={1} max={500} />

            <ImageUpload
              id="photoUrl"
              label="Photo de profil"
              value={form.photoUrl}
              onChange={(url) => setForm((f) => ({ ...f, photoUrl: url }))}
            />

            {/* Sélection des compétences (uniquement Bénévole) */}
            <div className="space-y-2 rounded-xl border-2 border-ink bg-paper/50 p-3">
              <Label className="font-bold flex items-center justify-between">
                <span>⚡ Mes Compétences</span>
                <span className="text-xs text-muted-foreground font-normal">{selectedCompetences.length} sélectionnée(s)</span>
              </Label>
              <p className="text-xs text-muted-foreground">Cliquez sur les compétences ci-dessous pour les sélectionner :</p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {catalogCompetences.map((comp) => {
                  const active = selectedCompetences.includes(comp.nom);
                  return (
                    <Badge
                      key={comp.id}
                      onClick={() => toggleCompetence(comp.nom)}
                      className={`cursor-pointer border border-ink text-xs transition-all ${
                        active
                          ? "bg-mustard text-ink font-bold shadow-sm"
                          : "bg-paper hover:bg-mustard/30 text-ink/80"
                      }`}
                    >
                      {active ? <Check className="mr-1 h-3 w-3 inline" /> : <Plus className="mr-1 h-3 w-3 inline" />}
                      {comp.nom}
                    </Badge>
                  );
                })}
              </div>
              <div className="flex items-center gap-2 pt-2">
                <Input
                  type="text"
                  placeholder="Autre compétence..."
                  value={customCompInput}
                  onChange={(e) => setCustomCompInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustomCompetence())}
                  className="h-8 text-xs border-ink bg-paper"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addCustomCompetence}
                  className="h-8 text-xs border-ink hover:bg-mustard font-bold flex-shrink-0"
                >
                  Ajouter
                </Button>
              </div>
            </div>

            {/* Sélection des Domaines (partagé) */}
            <DomaineSelector />

            <div className="space-y-2">
              <Label htmlFor="biographie">Biographie / Présentation</Label>
              <Textarea id="biographie" className={authInput} value={form.biographie} onChange={set("biographie")} placeholder="Présentez-vous en quelques mots..." />
            </div>
          </>
        )}

        {/* ─────────────── ASSOCIATION ─────────────── */}
        {role === "ASSOCIATION" && (
          <>
            <Field id="nomAssociation" label="Nom de l'association *" value={form.nomAssociation} onChange={set("nomAssociation")} required />

            <Field id="contact" label="Téléphone de contact *" type="tel" value={form.contact} onChange={set("contact")} placeholder="06 12 34 56 78" required />

            <ImageUpload
              id="logoUrl"
              label="Logo de l'association"
              value={form.logoUrl}
              onChange={(url) => setForm((f) => ({ ...f, logoUrl: url }))}
            />

            {/* Sélection des Domaines (partagé) */}
            <DomaineSelector />

            <div className="space-y-2">
              <Label htmlFor="description">Description de l'association</Label>
              <Textarea id="description" className={authInput} value={form.description} onChange={set("description")} placeholder="Objectifs de votre association..." />
            </div>
          </>
        )}

        {siteKey ? (
          <ReCAPTCHA sitekey={siteKey} onChange={setRecaptchaToken} onExpired={() => setRecaptchaToken(null)} hl="fr" />
        ) : (
          <p className="text-xs text-muted-foreground italic">Mode Dev : reCAPTCHA désactivé (VITE_RECAPTCHA_SITE_KEY non définie).</p>
        )}

        <Button type="submit" disabled={loading} className={authButton}>
          {loading ? "Création en cours…" : "Créer mon compte"}
        </Button>
        <p className="text-center text-sm font-medium">
          Déjà inscrit(e) ?{" "}
          <Link to="/login" className="font-bold underline hover:text-pink">Connecte-toi</Link>
        </p>
      </form>
    </AuthLayout>
  );
}

function Field({ id, label, ...props }: { id: string; label: string } & React.ComponentProps<typeof Input>) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} className={authInput} {...props} />
    </div>
  );
}
