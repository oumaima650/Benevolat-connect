import { useState, type FormEvent } from "react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { FormError, FormSuccess, authInput, authButton } from "@/components/auth/AuthLayout";
import { forgotPassword } from "@/services/authApi";
import { useAuthModal } from "@/context/AuthModalContext";

export function ForgotPasswordModal() {
  const { modal, closeModal, openLogin } = useAuthModal();

  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function reset() {
    setEmail("");
    setError(null);
    setSuccess(null);
    setLoading(false);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await forgotPassword(email.trim());
      setSuccess(
        "Si un compte existe avec cette adresse, vous recevrez un e-mail de réinitialisation dans quelques minutes."
      );
    } catch {
      setError("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog
      open={modal === "forgot-password"}
      onOpenChange={(open) => { if (!open) { closeModal(); reset(); } }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl border-2 border-ink bg-paper shadow-[6px_6px_0_var(--color-ink)] sm:max-w-md">
        <DialogHeader className="mb-2">
          <DialogTitle className="font-display text-2xl font-black text-ink">
            Mot de passe oublié ?
          </DialogTitle>
          <p className="text-sm font-medium text-muted-foreground">
            Entrez votre e-mail pour recevoir un lien de réinitialisation.
          </p>
          <div className="mt-2 h-1 w-10 rounded-full border border-ink bg-mustard" />
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-5">
          <FormSuccess message={success} />
          <FormError message={error} />

          <div className="space-y-1.5">
            <Label htmlFor="forgot-email" className="text-sm font-bold text-ink">
              Adresse e-mail
            </Label>
            <input
              id="forgot-email"
              type="email"
              required
              autoComplete="email"
              placeholder="toi@example.ma"
              className={authInput}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={!!success}
            />
          </div>

          {!success && (
            <Button type="submit" disabled={loading} className={authButton}>
              {loading ? "Envoi en cours…" : "Envoyer le lien →"}
            </Button>
          )}

          <div className="text-center">
            <button
              type="button"
              onClick={() => { reset(); openLogin(); }}
              className="text-sm font-bold text-ink underline underline-offset-2 hover:text-pink"
            >
              ← Retour à la connexion
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
