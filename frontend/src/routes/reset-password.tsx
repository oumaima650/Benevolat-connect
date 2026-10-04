import { useState, type FormEvent } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";

import { AuthLayout, FormError, FormSuccess, authButton, authInput } from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resetPassword } from "@/services/authApi";

export const Route = createFileRoute("/reset-password")({
  validateSearch: z.object({ token: z.string().catch("") }),
  head: () => ({
    meta: [
      { title: "Nouveau mot de passe — CountMeIn" },
      { name: "description", content: "Définissez votre nouveau mot de passe." },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const { token } = Route.useSearch();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!token) return setError("Jeton de réinitialisation manquant.");
    if (password.length < 6) return setError("Le mot de passe doit contenir au moins 6 caractères.");
    if (password !== confirm) return setError("Les mots de passe ne correspondent pas.");

    setLoading(true);
    try {
      const res = await resetPassword(token, password);
      if (res.success) {
        setSuccess("Mot de passe mis à jour ! Redirection vers la connexion...");
        setTimeout(() => navigate({ to: "/login", search: { reset: "1" } }), 2000);
      } else {
        setError(res.message || "Le jeton est invalide ou a expiré.");
      }
    } catch {
      setError("Le jeton est invalide ou a expiré.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout title="Réinitialisation du mot de passe" subtitle="Choisissez votre nouveau mot de passe.">
      <form onSubmit={onSubmit} className="space-y-4">
        <FormSuccess message={success} />
        <FormError message={error} />
        <div className="space-y-2">
          <Label htmlFor="password">Nouveau mot de passe</Label>
          <Input id="password" type="password" required className={authInput} value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm">Confirmation du mot de passe</Label>
          <Input id="confirm" type="password" required className={authInput} value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        </div>
        <Button type="submit" disabled={loading} className={authButton}>
          {loading ? "Mise à jour…" : "Mettre à jour le mot de passe"}
        </Button>
      </form>
    </AuthLayout>
  );
}
