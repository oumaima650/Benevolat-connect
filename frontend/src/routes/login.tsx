import { useState, type FormEvent } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";

import { AuthLayout, FormError, FormSuccess, authButton, authInput } from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { login } from "@/services/authApi";

export const Route = createFileRoute("/login")({
  validateSearch: z.object({ reset: z.string().optional(), registered: z.string().optional() }),
  head: () => ({
    meta: [
      { title: "Connexion — CountMeIn" },
      { name: "description", content: "Connectez-vous à votre espace bénévole ou association CountMeIn." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { reset, registered } = Route.useSearch();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
    <AuthLayout title="Connexion" subtitle="Content de te revoir !">
      <form onSubmit={onSubmit} className="space-y-4">
        {registered && <FormSuccess message="Compte créé avec succès ! Tu peux maintenant te connecter." />}
        {reset && <FormSuccess message="Mot de passe modifié. Tu peux te connecter." />}
        <FormSuccess message={success} />
        <FormError message={error} />
        <div className="space-y-2">
          <Label htmlFor="email">E-mail</Label>
          <Input id="email" type="email" required autoComplete="email" className={authInput} value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Mot de passe</Label>
          <Input id="password" type="password" required autoComplete="current-password" className={authInput} value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <Link to="/mot-de-passe-oublie" className="block text-sm font-bold text-ink underline hover:text-pink">
          Mot de passe oublié ?
        </Link>
        <Button type="submit" disabled={loading} className={authButton}>
          {loading ? "Connexion…" : "Se connecter"}
        </Button>
        <p className="text-center text-sm font-medium">
          Pas encore de compte ?{" "}
          <Link to="/inscription" className="font-bold underline hover:text-pink">Inscris-toi</Link>
        </p>
      </form>
    </AuthLayout>
  );
}
