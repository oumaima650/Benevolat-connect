import { etapes } from "./data";
import { GlobeMotif, HandsMotif, SmileMotif } from "./icons";
import { Reveal } from "./Reveal";

type IconComponent = React.ComponentType<{ className?: string }>;

const accentColors: string[] = ["bg-mustard", "bg-pink", "bg-emerald"];
const icons: IconComponent[] = [GlobeMotif, HandsMotif, SmileMotif];

export function HowItWorks() {
  return (
    <section id="comment" className="border-b-4 border-ink bg-paper">
      <div className="mx-auto max-w-6xl px-5 py-14 lg:py-20">
        <Reveal>
          <h2 className="text-3xl sm:text-4xl">En 3 étapes, c'est tout</h2>
          <p className="mt-3 max-w-xl text-muted-foreground">
            Aucune paperasse. Juste de l'action.
          </p>
        </Reveal>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {etapes.map((etape, i) => {
            const Icon = icons[i % icons.length] as IconComponent;
            const accent = accentColors[i % accentColors.length] as string;
            return (
              <Reveal key={etape.numero} delay={i * 120}>
                <article className="relative overflow-hidden rounded-2xl border-2 border-ink bg-paper p-6 shadow-[6px_6px_0_var(--color-ink)] transition-all hover:-translate-y-1">
                  {/* Numéro en arrière-plan */}
                  <span
                    aria-hidden="true"
                    className="absolute right-4 top-2 font-display text-6xl font-black leading-none text-ink opacity-10"
                  >
                    {etape.numero}
                  </span>

                  {/* Icône */}
                  <div
                    className={`inline-flex h-14 w-14 items-center justify-center rounded-xl border-2 border-ink ${accent}`}
                  >
                    <Icon className="h-8 w-8 text-ink" />
                  </div>

                  <h3 className="mt-5 font-display text-xl font-black leading-tight">
                    {etape.titre}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {etape.texte}
                  </p>
                </article>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
