import { lazy, Suspense, useState, type FormEvent } from "react";
import { ClientOnly, createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";
import { MapPin, Loader2 } from "lucide-react";

import { AuthLayout, FormError, FormSuccess, authButton, authInput } from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { errorMessage, register, type Role } from "@/services/authApi";

const ReCAPTCHA = lazy(() => import("react-google-recaptcha"));

export const Route = createFileRoute("/inscription")({
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
  dateNaissance: z.string().optional(),
  adresse: z.string().optional(),
  ville: z.string().trim().min(1, "Ville requise").max(100),
  biographie: z.string().optional(),
  rayonDeplacementKm: z.coerce.number().min(1).max(500).default(20),
  competencesStr: z.string().optional(),
  centresInteretStr: z.string().optional(),
});

const assoSchema = z.object({
  nomAssociation: z.string().trim().min(1, "Nom de l'association requis").max(150),
  domaine: z.string().trim().min(1, "Domaine d'activité requis").max(100),
  telephone: z.string().trim().min(1, "Téléphone de contact requis").max(30),
  adresse: z.string().optional(),
  ville: z.string().trim().min(1, "Ville requise").max(100),
  description: z.string().optional(),
});

function RegisterPage() {
  const siteKey = import.meta.env["VITE_RECAPTCHA_SITE_KEY"] as string | undefined;
  const [role, setRole] = useState<Role>("BENEVOLE");

  const [form, setForm] = useState({
    email: "",
    password: "",
    confirm: "",
    nom: "",
    prenom: "",
    dateNaissance: "",
    adresse: "",
    ville: "",
    biographie: "",
    rayonDeplacementKm: 20,
    competencesStr: "",
    centresInteretStr: "",
    nomAssociation: "",
    domaine: "",
    telephone: "",
    description: "",
    latitude: null as number | null,
    longitude: null as number | null,
  });

  const [geolocating, setGeolocating] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

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
    };

    if (role === "BENEVOLE") {
      const b = benevoleSchema.safeParse(form);
      if (!b.success) return setError(b.error.issues[0]?.message ?? "Formulaire bénévole invalide");
      payload = {
        ...payload,
        nom: b.data.nom,
        prenom: b.data.prenom,
        dateNaissance: b.data.dateNaissance,
        adresse: b.data.adresse,
        ville: b.data.ville,
        biographie: b.data.biographie,
        rayonDeplacementKm: b.data.rayonDeplacementKm,
        competences: b.data.competencesStr ? b.data.competencesStr.split(",").map((s) => s.trim()).filter(Boolean) : [],
        centresInteret: b.data.centresInteretStr ? b.data.centresInteretStr.split(",").map((s) => s.trim()).filter(Boolean) : [],
      };
    } else {
      const a = assoSchema.safeParse(form);
      if (!a.success) return setError(a.error.issues[0]?.message ?? "Formulaire association invalide");
      payload = {
        ...payload,
        nomAssociation: a.data.nomAssociation,
        domaine: a.data.domaine,
        telephone: a.data.telephone,
        adresse: a.data.adresse,
        ville: a.data.ville,
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
        setSuccess("Compte créé avec succès ! Tu peux maintenant te connecter.");
      } else {
        setError(res.message || "Échec de la création du compte.");
      }
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }

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
                <>
                  <Loader2 className="mr-1 h-3 w-3 animate-spin" /> GPS…
                </>
              ) : (
                <>📍 Me géolocaliser</>
              )}
            </Button>
          </div>

          {form.latitude && form.longitude && (
            <p className="text-xs text-emerald-700 font-medium">
              ✓ Coordonnées GPS capturées : {form.latitude.toFixed(5)}, {form.longitude.toFixed(5)}
            </p>
          )}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field id="ville" label="Ville *" value={form.ville} onChange={set("ville")} placeholder="Ex: Paris, Lyon..." required />
            <Field id="adresse" label="Adresse (Rue, N°)" value={form.adresse} onChange={set("adresse")} placeholder="Ex: 12 Rue de la Paix" />
          </div>
        </div>

        {role === "BENEVOLE" && (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field id="nom" label="Nom *" value={form.nom} onChange={set("nom")} required />
              <Field id="prenom" label="Prénom *" value={form.prenom} onChange={set("prenom")} required />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field id="dateNaissance" label="Date de naissance" type="date" value={form.dateNaissance} onChange={set("dateNaissance")} />
              <Field id="rayonDeplacementKm" label="Rayon de déplacement (km)" type="number" value={form.rayonDeplacementKm} onChange={set("rayonDeplacementKm")} min={1} max={500} />
            </div>
            <Field id="competencesStr" label="Compétences (séparées par virgules)" value={form.competencesStr} onChange={set("competencesStr")} placeholder="Informatique, Logistique..." />
            <Field id="centresInteretStr" label="Centres d'intérêt (séparés par virgules)" value={form.centresInteretStr} onChange={set("centresInteretStr")} placeholder="Écologie, Jeunesse..." />
            <div className="space-y-2">
              <Label htmlFor="biographie">Biographie / Présentation</Label>
              <Textarea id="biographie" className={authInput} value={form.biographie} onChange={set("biographie")} placeholder="Présentez-vous..." />
            </div>
          </>
        )}

        {role === "ASSOCIATION" && (
          <>
            <Field id="nomAssociation" label="Nom de l'association *" value={form.nomAssociation} onChange={set("nomAssociation")} required />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field id="domaine" label="Domaine d'activité *" value={form.domaine} onChange={set("domaine")} placeholder="Social, Écologie..." required />
              <Field id="telephone" label="Téléphone de contact *" value={form.telephone} onChange={set("telephone")} placeholder="06 12 34 56 78" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description de l'association</Label>
              <Textarea id="description" className={authInput} value={form.description} onChange={set("description")} placeholder="Objectifs de votre association..." />
            </div>
          </>
        )}

        <ClientOnly fallback={<div className="h-[78px]" />}>
          {siteKey ? (
            <Suspense fallback={<div className="h-[78px]" />}>
              <ReCAPTCHA sitekey={siteKey} onChange={setRecaptchaToken} onExpired={() => setRecaptchaToken(null)} hl="fr" />
            </Suspense>
          ) : (
            <p className="text-xs text-muted-foreground italic">Mode Dev : reCAPTCHA désactivé (VITE_RECAPTCHA_SITE_KEY non définie).</p>
          )}
        </ClientOnly>

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
