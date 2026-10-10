import { useState, type FormEvent } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { Eye, EyeOff } from "lucide-react";

import { AuthLayout, FormError, FormSuccess, authButton, authInput } from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { resetPassword } from "@/services/authApi";

export const Route = createFileRoute("/reset-password")({
  validateSearch: z.object({ token: z.string().catch("") }),
  head: () => ({
    meta: [
      { title: "Nouveau mot de passe — CountMeIn" },
      { name: "description", content: "Définissez votre nouveau mot de passe CountMeIn." },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const { token } = Route.useSearch();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
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
        setSuccess("Mot de passe mis à jour ! Redirection vers la connexion…");
        setTimeout(() => navigate({ to: "/login", search: { reset: "1" } }), 2000);
      } else {
        setError(res.message || "Le lien est invalide ou a expiré.");
      }
    } catch {
      setError("Le lien est invalide ou a expiré. Veuillez en demander un nouveau.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Nouveau mot de passe"
      subtitle="Choisissez un mot de passe sécurisé d'au moins 6 caractères."
    >
      <form onSubmit={onSubmit} className="space-y-5">
        <FormSuccess message={success} />
        <FormError message={error} />

        {/* Nouveau mot de passe */}
        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-sm font-bold text-ink">
            Nouveau mot de passe
          </Label>
          <div className="relative">
            <input
              id="password"
              type={showPwd ? "text" : "password"}
              required
              autoComplete="new-password"
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
          {/* Force indicateur */}
          {password.length > 0 && (
            <div className="flex gap-1 pt-1">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className={`h-1.5 flex-1 rounded-full transition-colors ${
                    password.length >= i * 3
                      ? i <= 1 ? "bg-red-400"
                        : i <= 2 ? "bg-orange-400"
                        : i <= 3 ? "bg-yellow-400"
                        : "bg-emerald"
                      : "bg-border"
                  }`}
                />
              ))}
              <span className="text-[10px] text-muted-foreground ml-1">
                {password.length < 4 ? "Faible" : password.length < 7 ? "Moyen" : password.length < 10 ? "Bien" : "Fort"}
              </span>
            </div>
          )}
        </div>

        {/* Confirmation */}
        <div className="space-y-1.5">
          <Label htmlFor="confirm" className="text-sm font-bold text-ink">
            Confirmation du mot de passe
          </Label>
          <div className="relative">
            <input
              id="confirm"
              type={showConfirm ? "text" : "password"}
              required
              autoComplete="new-password"
              placeholder="••••••••"
              className={authInput + " pr-11"}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-ink"
              aria-label={showConfirm ? "Masquer" : "Afficher"}
            >
              {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {/* Correspondance */}
          {confirm.length > 0 && (
            <p className={`text-xs font-semibold ${password === confirm ? "text-emerald" : "text-destructive"}`}>
              {password === confirm ? "✓ Les mots de passe correspondent" : "✗ Les mots de passe ne correspondent pas"}
            </p>
          )}
        </div>

        <Button type="submit" disabled={loading} className={authButton}>
          {loading ? "Mise à jour…" : "Mettre à jour le mot de passe →"}
        </Button>
      </form>
    </AuthLayout>
  );
}
