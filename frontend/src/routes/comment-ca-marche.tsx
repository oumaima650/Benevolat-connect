import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { HowItWorksDetailed } from "@/components/site/HowItWorksDetailed";

export const Route = createFileRoute("/comment-ca-marche")({
  head: () => ({
    meta: [
      { title: "Comment ça marche — CountMeIn" },
      { name: "description", content: "Découvrez les règles de CountMeIn : inscription équitable, cycle de vie des missions, badges, matching IA, certificats et notifications." },
    ],
  }),
  component: CommentCaMarchePage,
});

function CommentCaMarchePage() {
  return (
    <div className="min-h-screen bg-paper">
      <Header />
      <main>
        <HowItWorksDetailed />
      </main>
      <Footer />
    </div>
  );
}
