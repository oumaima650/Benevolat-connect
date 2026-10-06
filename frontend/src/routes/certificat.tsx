import { createFileRoute } from "@tanstack/react-router";
import { CertificateCheck } from "@/components/site/CertificateCheck";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";

const title = "Vérifier un certificat — CountMeIn";
const description = "Vérifie l'authenticité d'un certificat de bénévolat CountMeIn grâce à son code unique.";

export const Route = createFileRoute("/certificat")({
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
      <main><CertificateCheck /></main>
      <Footer />
    </div>
  ),
});
