import { createFileRoute } from "@tanstack/react-router";
import { AuthPage } from "@/components/site/AuthPage";

const title = "Connexion — CountMeIn";
const description = "Connecte-toi à CountMeIn en tant que bénévole ou association.";

export const Route = createFileRoute("/connexion")({
  validateSearch: (s: Record<string, unknown>) => ({
    profil: s["profil"] === "association" ? ("association" as const) : ("benevole" as const),
  }),
  head: () => ({
    meta: [
      { title }, { name: "description", content: description },
      { property: "og:title", content: title }, { property: "og:description", content: description },
      { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <AuthPage mode="connexion" profil={Route.useSearch().profil} />,
});
