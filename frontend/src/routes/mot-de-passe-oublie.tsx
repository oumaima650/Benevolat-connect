import { useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAuthModal } from "@/context/AuthModalContext";

export const Route = createFileRoute("/mot-de-passe-oublie")({
  head: () => ({
    meta: [
      { title: "Mot de passe oublié — CountMeIn" },
      { name: "description", content: "Réinitialisez votre mot de passe CountMeIn." },
    ],
  }),
  component: ForgotPasswordRedirect,
});

function ForgotPasswordRedirect() {
  const { openForgotPassword } = useAuthModal();
  const navigate = useNavigate();

  useEffect(() => {
    navigate({ to: "/" }).then(() => {
      openForgotPassword();
    });
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper">
      <p className="text-sm font-semibold text-muted-foreground">Redirection…</p>
    </div>
  );
}
