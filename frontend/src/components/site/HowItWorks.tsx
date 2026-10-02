import { etapes } from "./data";
import { GlobeMotif, HandsMotif, SmileMotif } from "./icons";

const motifs = [
  { Icon: GlobeMotif, couleur: "text-emerald", fond: "bg-emerald/15" },
  { Icon: HandsMotif, couleur: "text-pink", fond: "bg-pink/15" },
  { Icon: SmileMotif, couleur: "text-mustard", fond: "bg-mustard/25" },
];

export function HowItWorks() {
  return (
    <section id="comment" className="border-b-4 border-ink bg-paper">
      <div className="mx-auto max-w-6xl px-5 py-14 lg:py-20">
        <h2 className="text-3xl sm:text-4xl">Comment ça marche</h2>
        <p className="mt-3 max-w-xl text-muted-foreground">
          Trois étapes, aucune paperasse.
        </p>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {etapes.map((etape, index) => {
            const { Icon, couleur, fond } = motifs[index % motifs.length]!;
            return (
              <article
                key={etape.numero}
                className="rounded-2xl border-4 border-ink bg-paper p-6 shadow-[6px_6px_0_var(--color-ink)]"
              >
                <div
                  className={`inline-flex h-14 w-14 items-center justify-center rounded-xl ${fond}`}
                >
                  <Icon className={`h-9 w-9 ${couleur}`} />
                </div>
                <p className="mt-5 font-display text-sm text-muted-foreground">
                  {etape.numero}
                </p>
                <h3 className="mt-1 text-xl">{etape.titre}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {etape.texte}
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
