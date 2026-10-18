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
import { login } from "@/services/authApi";
import { useAuth } from "@/context/AuthContext";
import { useAuthModal } from "@/context/AuthModalContext";

export function LoginModal() {
  const { modal, closeModal, openRegisterBenevole, openRegisterAssociation, openForgotPassword } = useAuthModal();
  const { loginUser } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function reset() {
    setEmail("");
    setPassword("");
    setShowPwd(false);
    setError(null);
    setSuccess(null);
    setLoading(false);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await login(email.trim(), password);
      if (res.success) {
        setSuccess("Connexion réussie !");
        const token = res.token || "demo_token_" + Date.now();
        const userData = res.user || { email: email.trim(), role: "BENEVOLE" };
        loginUser(userData, token);
        setTimeout(() => {
          closeModal();
          reset();
          // Rester sur la page actuelle — ne pas rediriger vers le dashboard
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
    <Dialog
      open={modal === "login"}
      onOpenChange={(open) => {
        if (!open) { closeModal(); reset(); }
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl border-2 border-ink bg-paper shadow-[6px_6px_0_var(--color-ink)] sm:max-w-md">
        <DialogHeader className="mb-2">
          <DialogTitle className="font-display text-2xl font-black text-ink">
            Connexion
          </DialogTitle>
          <p className="text-sm font-medium text-muted-foreground">
            Content de te revoir sur CountMeIn !
          </p>
          <div className="mt-2 h-1 w-10 rounded-full border border-ink bg-mustard" />
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-5">
          <FormSuccess message={success} />
          <FormError message={error} />

          {/* Email */}
          <div className="space-y-1.5">
            <Label htmlFor="login-email" className="text-sm font-bold text-ink">
              Adresse e-mail
            </Label>
            <input
              id="login-email"
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
            <Label htmlFor="login-password" className="text-sm font-bold text-ink">
              Mot de passe
            </Label>
            <div className="relative">
              <input
                id="login-password"
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
            <button
              type="button"
              onClick={() => { reset(); openForgotPassword(); }}
              className="inline-block text-xs font-bold text-ink underline underline-offset-2 hover:text-pink"
            >
              Mot de passe oublié ?
            </button>
          </div>

          {/* Submit */}
          <Button type="submit" disabled={loading} className={authButton}>
            {loading ? "Connexion en cours…" : "Se connecter →"}
          </Button>

          {/* Séparateur */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            ou
            <span className="h-px flex-1 bg-border" />
          </div>

          {/* Liens inscription */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => { reset(); openRegisterBenevole(); }}
              className="press flex items-center justify-center rounded-xl border-2 border-ink bg-mustard px-3 py-2.5 text-xs font-bold text-ink shadow-[3px_3px_0_var(--color-ink)] hover:opacity-90 text-center"
            >
              Devenir bénévole
            </button>
            <button
              type="button"
              onClick={() => { reset(); openRegisterAssociation(); }}
              className="press flex items-center justify-center rounded-xl border-2 border-ink bg-emerald px-3 py-2.5 text-xs font-bold text-emerald-foreground shadow-[3px_3px_0_var(--color-ink)] hover:opacity-90 text-center"
            >
              Inscrire mon association
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
