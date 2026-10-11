import { Link } from "@tanstack/react-router";
import { GlobeMotif, HandsMotif, SmileMotif } from "./icons";
import { Reveal } from "./Reveal";
import { useAuth } from "@/context/AuthContext";
import { LayoutDashboard, ArrowUpRight } from "lucide-react";

const avantages = [
  { Icon: SmileMotif, couleur: "text-mustard", titre: "Des missions près de chez toi", texte: "Choisis selon ta ville, tes envies et ton emploi du temps." },
  { Icon: HandsMotif, couleur: "text-pink", titre: "Inscription simple et équitable", texte: "Premier arrivé, premier servi, avec liste d'attente automatique." },
  { Icon: GlobeMotif, couleur: "text-emerald", titre: "Un certificat reconnu", texte: "Valorise ton engagement avec un certificat vérifiable en ligne." },
];

export function BecomeVolunteer() {
  const { user } = useAuth();

  // Un bénévole ou une association déjà connecté(e) ne voit pas cette section
  if (user) {
    // Si c'est un bénévole connecté → afficher un bloc de bienvenue personnalisé
    if (user.role === "BENEVOLE") {
      return (
        <section id="devenir-benevole" className="border-b-4 border-ink bg-mustard">
          <div className="mx-auto max-w-6xl px-5 py-14 lg:py-20">
            <Reveal className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-ink/60">Bienvenue</p>
                <h2 className="mt-2 text-3xl sm:text-4xl text-ink">
                  Content de te revoir,{" "}
                  <span className="font-black">{user.prenom ?? user.nom ?? "bénévole"} !</span>
                </h2>
                <p className="mt-3 max-w-lg text-ink/70">
                  Retrouve tes missions confirmées, ta liste d'attente et tes certificats dans ton espace personnel.
                </p>
              </div>
              <Link
                to="/benevole"
                className="press inline-flex shrink-0 items-center gap-2 rounded-xl border-2 border-ink bg-ink px-6 py-3.5 text-sm font-bold text-paper shadow-[4px_4px_0_var(--color-paper)]"
              >
                <LayoutDashboard className="h-4 w-4" />
                Mon espace bénévole
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Reveal>
          </div>
        </section>
      );
    }
    // Si c'est une association → ne rien afficher (ForAssociations gère son propre cas)
    return null;
  }

  return (
    <section id="devenir-benevole" className="border-b-4 border-ink bg-paper">
      <div className="mx-auto max-w-6xl px-5 py-14 lg:py-20">
        <Reveal>
          <h2 className="text-3xl sm:text-4xl">Devenir bénévole</h2>
          <p className="mt-3 max-w-xl text-muted-foreground">Donne de ton temps, gagne en expérience et rencontre des gens formidables.</p>
        </Reveal>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {avantages.map(({ Icon, couleur, titre, texte }, i) => (
            <Reveal key={titre} delay={i * 120}>
              <article className="press h-full rounded-2xl border-4 border-ink bg-paper p-6 shadow-[6px_6px_0_var(--color-pink)]">
                <Icon className={`h-12 w-12 ${couleur}`} />
                <h3 className="mt-4 text-xl">{titre}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{texte}</p>
              </article>
            </Reveal>
          ))}
        </div>
        <Reveal className="mt-10">
          <Link
            to="/inscription"
            search={{ role: "BENEVOLE" }}
            className="press inline-flex items-center rounded-xl border-2 border-ink bg-pink px-5 py-3 text-sm font-semibold text-pink-foreground shadow-[5px_5px_0_var(--color-ink)]"
          >
            Je m'inscris comme bénévole
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
