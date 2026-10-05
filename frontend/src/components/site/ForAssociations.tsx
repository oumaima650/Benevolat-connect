import { Link } from "@tanstack/react-router";
import associationsImage from "@/assets/associations.jpg";
import { HandsMotif } from "./icons";

const arguments_ = [
  "Publiez une mission en 2 minutes, gratuitement.",
  "Gérez les inscriptions et la liste d'attente automatiquement.",
  "Délivrez un certificat de bénévolat en un clic.",
];

export function ForAssociations() {
  return (
    <section id="associations" className="border-b-4 border-ink bg-emerald text-emerald-foreground">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 lg:grid-cols-2 lg:items-center lg:py-20">
        <div className="relative order-2 lg:order-1">
          <HandsMotif className="absolute -left-4 -top-6 z-10 h-20 w-20 text-mustard" />
          <img
            src={associationsImage}
            alt="Une responsable d'association accueille un nouveau bénévole"
            width={1200}
            height={912}
            loading="lazy"
            className="w-full rounded-2xl border-4 border-ink object-cover grayscale"
          />
        </div>

        <div className="order-1 min-w-0 lg:order-2">
          <h2 className="text-3xl sm:text-4xl">Pour les associations</h2>
          <p className="mt-4 max-w-md leading-relaxed">
            Trouvez des bénévoles motivés, sans tableurs ni appels sans fin.
            CountMeIn s'occupe des inscriptions, vous vous occupez du terrain.
          </p>

          <ul className="mt-6 space-y-3">
            {arguments_.map((argument) => (
              <li key={argument} className="flex gap-3">
                <span className="mt-2 h-3 w-3 shrink-0 rounded-sm bg-mustard" />
                <span className="text-sm leading-relaxed">{argument}</span>
              </li>
            ))}
          </ul>

          <Link
            to="/inscription"
            search={{ profil: "association" }}
            className="mt-8 inline-flex items-center rounded-xl border-2 border-ink bg-paper px-5 py-3 text-sm font-semibold text-foreground shadow-[5px_5px_0_var(--color-ink)] transition-transform hover:-translate-y-0.5"
          >
            Créer un compte association
          </Link>
        </div>
      </div>
    </section>
  );
}
