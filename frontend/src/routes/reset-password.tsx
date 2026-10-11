import { useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { useAuthModal } from "@/context/AuthModalContext";

export const Route = createFileRoute("/reset-password")({
  validateSearch: z.object({ token: z.string().catch("") }),
  head: () => ({
    meta: [
      { title: "Nouveau mot de passe — CountMeIn" },
      { name: "description", content: "Définissez votre nouveau mot de passe CountMeIn." },
    ],
  }),
  component: ResetPasswordRedirect,
});

function ResetPasswordRedirect() {
  const { token } = Route.useSearch();
  const { openResetPassword } = useAuthModal();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirige vers l'accueil et ouvre la modale avec le token
    navigate({ to: "/" }).then(() => {
      if (token) {
        openResetPassword(token);
      }
    });
  }, [token]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper">
      <p className="text-sm font-semibold text-muted-foreground">Redirection…</p>
    </div>
  );
}
