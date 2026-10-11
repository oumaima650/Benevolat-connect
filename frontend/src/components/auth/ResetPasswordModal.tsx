import { useState, type FormEvent } from "react";
import { Eye, EyeOff } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { FormError, FormSuccess, authInput, authButton } from "@/components/auth/AuthLayout";
import { resetPassword } from "@/services/authApi";
import { useAuthModal } from "@/context/AuthModalContext";

export function ResetPasswordModal() {
  const { modal, resetToken, closeModal, openLogin } = useAuthModal();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function reset() {
    setPassword("");
    setConfirm("");
    setShowPwd(false);
    setShowConfirm(false);
    setError(null);
    setSuccess(null);
    setLoading(false);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!resetToken) return setError("Lien de réinitialisation invalide.");
    if (password.length < 6) return setError("Le mot de passe doit contenir au moins 6 caractères.");
    if (password !== confirm) return setError("Les mots de passe ne correspondent pas.");

    setLoading(true);
    try {
      const res = await resetPassword(resetToken, password);
      if (res.success) {
        setSuccess("Mot de passe mis à jour avec succès !");
        setTimeout(() => { closeModal(); reset(); openLogin(); }, 1500);
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
    <Dialog
      open={modal === "reset-password"}
      onOpenChange={(open) => { if (!open) { closeModal(); reset(); } }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl border-2 border-ink bg-paper shadow-[6px_6px_0_var(--color-ink)] sm:max-w-md">
        <DialogHeader className="mb-2">
          <DialogTitle className="font-display text-2xl font-black text-ink">
            Nouveau mot de passe
          </DialogTitle>
          <p className="text-sm font-medium text-muted-foreground">
            Choisissez un mot de passe sécurisé d'au moins 6 caractères.
          </p>
          <div className="mt-2 h-1 w-10 rounded-full border border-ink bg-pink" />
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-5">
          <FormSuccess message={success} />
          <FormError message={error} />

          {/* Nouveau mot de passe */}
          <div className="space-y-1.5">
            <Label htmlFor="reset-pwd" className="text-sm font-bold text-ink">
              Nouveau mot de passe
            </Label>
            <div className="relative">
              <input
                id="reset-pwd"
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
            {/* Indicateur de force */}
            {password.length > 0 && (
              <div className="flex items-center gap-1 pt-1">
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
                <span className="ml-1 text-[10px] text-muted-foreground">
                  {password.length < 4 ? "Faible" : password.length < 7 ? "Moyen" : password.length < 10 ? "Bien" : "Fort"}
                </span>
              </div>
            )}
          </div>

          {/* Confirmation */}
          <div className="space-y-1.5">
            <Label htmlFor="reset-confirm" className="text-sm font-bold text-ink">
              Confirmation
            </Label>
            <div className="relative">
              <input
                id="reset-confirm"
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
      </DialogContent>
    </Dialog>
  );
}
