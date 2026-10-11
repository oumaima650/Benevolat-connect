import { useState, type FormEvent } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { Eye, EyeOff } from "lucide-react";

import { AuthLayout, FormError, FormSuccess, authButton, authInput } from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { login } from "@/services/authApi";
import { useAuth } from "@/context/AuthContext";

export const Route = createFileRoute("/login")({
  validateSearch: z.object({
    reset: z.string().optional(),
    registered: z.string().optional(),
    redirect: z.string().optional(),
  }),
  head: () => ({
    meta: [
      { title: "Connexion — CountMeIn" },
      { name: "description", content: "Connectez-vous à votre espace bénévole ou association CountMeIn." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { reset, registered, redirect } = Route.useSearch();
  const navigate = useNavigate();
  const { loginUser } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await login(email.trim(), password);
      if (res.success) {
        setSuccess("Connexion réussie !");
        const token = res.token || "demo_token_" + Date.now();
        const u = res.user || {};
        const userData = {
          id:             u.id,
          email:          u.email ?? email.trim(),
          nom:            u.nom,
          prenom:         u.prenom,
          nomAssociation: u.nomAssociation ?? (u.role === "ASSOCIATION" ? u.nom : undefined),
          role:           u.role ?? "BENEVOLE",
          photoUrl:       u.photoProfil ?? undefined,  // URL Cloudinary depuis la colonne photoProfil
          ville:          u.ville,
          telephone:      u.telephone,
        };
        loginUser(userData, token);
        setTimeout(() => {
          navigate({ to: redirect ? (redirect as any) : "/" });
        }, 800);
      } else {
        setError(res.message || "Identifiants invalides.");
      }
    } catch {
      setError("Identifiants invalides ou serveur indisponible.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout title="Connexion" subtitle="Content de te revoir sur CountMeIn !">
      <form onSubmit={onSubmit} className="space-y-5">
        {registered && (
          <FormSuccess message="Compte créé avec succès ! Tu peux maintenant te connecter." />
        )}
        {reset && (
          <FormSuccess message="Mot de passe modifié. Tu peux te connecter." />
        )}
        <FormSuccess message={success} />
        <FormError message={error} />

        {/* Email */}
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-sm font-bold text-ink">
            Adresse e-mail
          </Label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            placeholder="toi@example.ma"
            className={authInput}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        {/* Mot de passe */}
        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-sm font-bold text-ink">
            Mot de passe
          </Label>
          <div className="relative">
            <input
              id="password"
              type={showPwd ? "text" : "password"}
              required
              autoComplete="current-password"
              placeholder="••••••••"
              className={authInput + " pr-11"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowPwd((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-ink"
              aria-label={showPwd ? "Masquer" : "Afficher"}
            >
              {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <Link
            to="/mot-de-passe-oublie"
            className="inline-block text-xs font-bold text-ink underline underline-offset-2 hover:text-pink"
          >
            Mot de passe oublié ?
          </Link>
        </div>

        {/* Submit */}
        <Button type="submit" disabled={loading} className={authButton}>
          {loading ? "Connexion en cours…" : "Se connecter →"}
        </Button>

        {/* Séparateur */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex-1 h-px bg-border" />
          ou
          <span className="flex-1 h-px bg-border" />
        </div>

        {/* Liens inscription */}
        <div className="grid grid-cols-2 gap-3">
          <Link
            to="/inscription"
            search={{ role: "BENEVOLE" }}
            className="press flex items-center justify-center rounded-xl border-2 border-ink bg-mustard px-3 py-2.5 text-xs font-bold text-ink shadow-[3px_3px_0_var(--color-ink)] hover:opacity-90 text-center"
          >
            Devenir bénévole
          </Link>
          <Link
            to="/inscription"
            search={{ role: "ASSOCIATION" }}
            className="press flex items-center justify-center rounded-xl border-2 border-ink bg-emerald px-3 py-2.5 text-xs font-bold text-emerald-foreground shadow-[3px_3px_0_var(--color-ink)] hover:opacity-90 text-center"
          >
            Inscrire mon association
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
}
