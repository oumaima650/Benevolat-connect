import { Link } from "@tanstack/react-router";
import { ArrowUpRight, Megaphone, ListChecks, Award } from "lucide-react";
import associationsImage from "@/assets/associations.jpg";
import { associations } from "./data";

const etapes = [
  { Icon: Megaphone, titre: "Publiez", texte: "Une mission en 2 minutes, avec adresse, dates et nombre de places.", fond: "bg-mustard text-ink" },
  { Icon: ListChecks, titre: "Recrutez", texte: "Inscriptions et liste d’attente gérées automatiquement.", fond: "bg-pink text-pink-foreground" },
  { Icon: Award, titre: "Valorisez", texte: "Délivrez des certificats vérifiables en un clic.", fond: "bg-emerald text-emerald-foreground" },
];

export function ForAssociations() {
  return (
    <section id="associations" className="border-b-4 border-ink bg-paper">
      <div className="mx-auto max-w-6xl px-5 py-16 lg:py-24">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Espace associations</p>
            <h2 className="mt-3 text-4xl leading-[1.05] sm:text-6xl">Vous agissez.<br /><span className="relative inline-block"><span className="relative z-10">On mobilise.</span><span className="absolute inset-x-0 bottom-1 -z-0 h-4 bg-mustard" /></span></h2>
          </div>
          <p className="max-w-md leading-relaxed text-muted-foreground">Fini les tableurs et les appels sans fin. CountMeIn met votre cause sur la carte et vous amène des bénévoles motivés, près de chez vous.</p>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {etapes.map(({ Icon, titre, texte, fond }, i) => (
            <div key={titre} className={`mission-card rounded-lg border-2 border-ink p-6 transition-transform ${fond}`}>
              <div className="flex items-center justify-between"><Icon className="h-9 w-9" strokeWidth={1.6} /><span className="font-display text-5xl opacity-30">0{i + 1}</span></div>
              <h3 className="mt-6 text-2xl">{titre}</h3>
              <p className="mt-2 text-sm leading-relaxed">{texte}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 grid overflow-hidden rounded-lg border-2 border-ink bg-ink text-paper md:grid-cols-[1fr_1.2fr]">
          <img src={associationsImage} alt="Une responsable d'association accueille un nouveau bénévole" width={1200} height={912} loading="lazy" className="h-full max-h-80 w-full object-cover md:max-h-none" />
          <div className="flex flex-col justify-center p-8 lg:p-10">
            <p className="text-sm opacity-80">Elles nous font déjà confiance</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {associations.map((a) => (
                <span key={a.id} className="inline-flex items-center gap-2 rounded-full border border-paper/30 py-1 pl-1 pr-3 text-xs font-semibold">
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-mustard text-[10px] font-black text-ink">{a.initiales}</span>{a.nom}
                </span>
              ))}
            </div>
            <Link to="/inscription" search={{ profil: "association" }} className="press mt-8 inline-flex w-fit items-center gap-2 rounded-xl border-2 border-paper bg-mustard px-5 py-3 text-sm font-bold text-ink">
              Créer un compte association <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
