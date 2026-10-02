import { createFileRoute } from "@tanstack/react-router";

import { FeaturedMissions } from "@/components/site/FeaturedMissions";
import { Footer } from "@/components/site/Footer";
import { ForAssociations } from "@/components/site/ForAssociations";
import { Header } from "@/components/site/Header";
import { Hero } from "@/components/site/Hero";
import { HowItWorks } from "@/components/site/HowItWorks";
import { Impact } from "@/components/site/Impact";

const title = "CountMeIn — Bénévoles et associations, réunis";
const description =
  "CountMeIn relie bénévoles et associations : inscription premier arrivé premier servi, liste d'attente automatique et certificat de bénévolat.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-paper">
      <Header />
      <main>
        <Hero />
        <HowItWorks />
        <FeaturedMissions />
        <Impact />
        <ForAssociations />
      </main>
      <Footer />
    </div>
  );
}
