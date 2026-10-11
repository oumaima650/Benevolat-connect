import { useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { useAuthModal } from "@/context/AuthModalContext";

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
  component: LoginRedirect,
});

function LoginRedirect() {
  const { openLogin } = useAuthModal();
  const navigate = useNavigate();

  useEffect(() => {
    navigate({ to: "/" }).then(() => {
      openLogin();
    });
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper">
      <p className="text-sm font-semibold text-muted-foreground">Redirection…</p>
    </div>
  );
}
