import { useState, type FormEvent } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";

import { AuthLayout, FormError, FormSuccess, authButton, authInput } from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { forgotPassword } from "@/services/authApi";

export const Route = createFileRoute("/mot-de-passe-oublie")({
  head: () => ({
    meta: [
      { title: "Mot de passe oublié — CountMeIn" },
      { name: "description", content: "Réinitialisez votre mot de passe CountMeIn." },
    ],
  }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await forgotPassword(email.trim());
      setSuccess("Un e-mail de réinitialisation a été envoyé si un compte existe avec cette adresse.");
    } catch {
      setError("Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout title="Mot de passe oublié ?" subtitle="Entrez votre e-mail pour recevoir un lien de réinitialisation.">
      <form onSubmit={onSubmit} className="space-y-4">
        <FormSuccess message={success} />
        <FormError message={error} />
        <div className="space-y-2">
          <Label htmlFor="email">E-mail</Label>
          <Input id="email" type="email" required autoComplete="email" className={authInput} value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <Button type="submit" disabled={loading} className={authButton}>
          {loading ? "Envoi…" : "Envoyer le lien"}
        </Button>
        <p className="text-center text-sm font-medium">
          <Link to="/login" className="font-bold underline hover:text-pink">← Retour à la connexion</Link>
        </p>
      </form>
    </AuthLayout>
  );
}
