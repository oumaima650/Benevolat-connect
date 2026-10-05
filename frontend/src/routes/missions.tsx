import { createFileRoute } from "@tanstack/react-router";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { MissionSearch } from "@/components/site/MissionSearch";

const title = "Toutes les missions — CountMeIn";
const description = "Parcours toutes les missions de bénévolat par mot-clé, ville et domaine.";

export const Route = createFileRoute("/missions")({
  head: () => ({
    meta: [
      { title }, { name: "description", content: description },
      { property: "og:title", content: title }, { property: "og:description", content: description },
      { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <div className="min-h-screen bg-paper">
      <Header />
      <main><MissionSearch titre="Toutes les missions" /></main>
      <Footer />
    </div>
  ),
});
