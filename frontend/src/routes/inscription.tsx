import { useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { useAuthModal } from "@/context/AuthModalContext";

export const Route = createFileRoute("/inscription")({
  validateSearch: z.object({
    role: z.enum(["BENEVOLE", "ASSOCIATION"]).optional(),
  }),
  head: () => ({
    meta: [
      { title: "Inscription — CountMeIn" },
      { name: "description", content: "Crée ton compte bénévole ou association sur CountMeIn." },
    ],
  }),
  component: InscriptionRedirect,
});

function InscriptionRedirect() {
  const search = Route.useSearch();
  const { openRegisterBenevole, openRegisterAssociation } = useAuthModal();
  const navigate = useNavigate();

  useEffect(() => {
    navigate({ to: "/" }).then(() => {
      if (search.role === "ASSOCIATION") {
        openRegisterAssociation();
      } else {
        openRegisterBenevole();
      }
    });
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper">
      <p className="text-sm font-semibold text-muted-foreground">Redirection…</p>
    </div>
  );
}
