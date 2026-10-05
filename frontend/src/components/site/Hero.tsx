import { Link } from "@tanstack/react-router";
import heroImage from "@/assets/hero-benevoles.jpg";
import { GlobeMotif, HandsMotif } from "./icons";

export function Hero() {
  return (
    <section className="border-b-4 border-ink bg-mustard">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 lg:grid-cols-2 lg:items-center lg:py-20">
        <div className="min-w-0">
          <span className="animate-rise inline-flex items-center gap-2 rounded-full border-2 border-ink bg-paper px-3 py-1 text-xs font-semibold uppercase tracking-wide">
            <HandsMotif className="h-4 w-4 text-emerald" />
            Bénévoles & associations
          </span>

          <h1 className="animate-rise mt-5 text-4xl leading-[1.05] [animation-delay:100ms] sm:text-5xl lg:text-6xl">
            Le temps que tu donnes change une vie près de chez toi.
          </h1>

          <p className="animate-rise mt-5 max-w-lg text-base leading-relaxed [animation-delay:200ms] sm:text-lg">
            CountMeIn met en relation les bénévoles et les associations.
            Inscription <strong>premier arrivé, premier servi</strong> : si la
            mission est complète, tu rejoins la liste d'attente automatique et tu
            es prévenu dès qu'une place se libère.
          </p>

          <div className="animate-rise mt-8 flex flex-wrap gap-3 [animation-delay:300ms]">
            <Link
              to="/inscription"
              search={{ profil: "benevole" }}
              className="press inline-flex items-center rounded-xl border-2 border-ink bg-ink px-5 py-3 text-sm font-semibold text-paper shadow-[5px_5px_0_var(--color-pink)]"
            >
              Trouver une mission
            </Link>
            <Link
              to="/inscription"
              search={{ profil: "association" }}
              className="press inline-flex items-center rounded-xl border-2 border-ink bg-paper px-5 py-3 text-sm font-semibold text-foreground shadow-[5px_5px_0_var(--color-emerald)]"
            >
              Publier une mission
            </Link>
          </div>
        </div>

        <div className="animate-rise relative [animation-delay:200ms]">
          <div className="animate-float absolute -left-4 -top-4 hidden h-20 w-20 rounded-2xl bg-emerald sm:block" />
          <GlobeMotif className="animate-float absolute -bottom-6 -right-4 z-10 h-20 w-20 text-pink [animation-delay:1.2s]" />
          <img
            src={heroImage}
            alt="Des bénévoles souriants préparent des colis solidaires"
            width={1200}
            height={1408}
            className="relative w-full rounded-2xl border-4 border-ink object-cover grayscale"
          />
        </div>
      </div>
    </section>
  );
}
