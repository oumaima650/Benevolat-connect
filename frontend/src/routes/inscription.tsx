import { createFileRoute } from "@tanstack/react-router";
import { AuthPage } from "@/components/site/AuthPage";

const title = "Inscription — CountMeIn";
const description = "Crée ton compte CountMeIn : bénévole ou association, en quelques secondes.";

export const Route = createFileRoute("/inscription")({
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
  component: () => <AuthPage mode="inscription" profil={Route.useSearch().profil} />,
});
