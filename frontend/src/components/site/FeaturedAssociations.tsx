import { Link } from "@tanstack/react-router";
import { ArrowUpRight, MapPin, Users } from "lucide-react";
import { associations, missions, type Association } from "./data";
import { missionPresentation } from "./mission-presentation";
import { Reveal } from "./Reveal";

type Vedette = {
  association: Association;
  ouvertes: number;
  places: number;
};

const vedettes: Vedette[] = associations
  .map((association) => {
    const ses = missions.filter((m) => m.associationId === association.id);
    return {
      association,
      ouvertes: ses.filter((m) => m.placesRestantes > 0).length,
      places: ses.reduce((somme, m) => somme + m.placesRestantes, 0),
    };
  })
  .sort((a, b) => b.places - a.places)
  .slice(0, 4);

function CarteAssociation({ vedette }: { vedette: Vedette }) {
  const { association, ouvertes, places } = vedette;
  const { Icon, color, background } = missionPresentation(association.domaine);
  return (
    <article className="mission-card flex h-full flex-col overflow-hidden rounded-lg border-2 border-ink bg-paper">
      <div className={`flex items-center justify-between gap-3 border-b-2 border-ink px-5 py-4 ${background} ${color}`}>
        <Icon className="h-8 w-8 shrink-0" strokeWidth={1.7} aria-hidden="true" />
        <span className="text-right text-xs font-bold">{association.domaine}</span>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center gap-3">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full border-2 border-ink bg-ink font-display text-sm font-black text-paper" aria-hidden="true">
            {association.initiales}
          </span>
          <div className="min-w-0">
            <h3 className="truncate text-lg leading-tight font-display">{association.nom}</h3>
            <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 shrink-0" /> {association.ville}
            </p>
          </div>
        </div>
        <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-muted-foreground">{association.description}</p>
        <div className="mt-4 flex gap-1.5">
          {association.galerie.slice(0, 3).map((image) => (
            <img
              key={image.src + image.legende}
              src={image.src}
              alt={image.legende}
              width={160}
              height={120}
              loading="lazy"
              className="h-14 w-1/3 rounded border border-ink/20 object-cover"
            />
          ))}
        </div>
        <div className="mt-auto pt-5">
          <p className={`flex items-center gap-2 text-xs font-bold ${places > 0 ? "text-emerald" : "text-ink"}`}>
            <Users className="h-4 w-4 shrink-0" />
            {places > 0 ? `${places} places à pourvoir · ${ouvertes} mission${ouvertes > 1 ? "s" : ""}` : "Missions complètes · liste d’attente ouverte"}
          </p>
          <Link to="/missions" className="mt-4 flex items-center justify-between border-t border-ink/20 pt-4 text-sm font-bold hover:text-pink">
            Voir ses missions <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </article>
  );
}

export function FeaturedAssociations() {
  return (
    <section className="border-b-4 border-ink bg-muted">
      <div className="mx-auto max-w-6xl px-5 py-14 lg:py-20">
        <Reveal className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4 sm:flex sm:justify-between">
          <div className="min-w-0">
            <h2 className="text-3xl sm:text-4xl">Associations vedettes</h2>
            <p className="mt-3 text-muted-foreground">
              Des équipes locales qui font bouger le Maroc. Rejoins celle qui te ressemble.
            </p>
          </div>
          <Link to="/missions" className="shrink-0 text-sm font-semibold underline underline-offset-4 hover:text-pink">
            Voir les missions
          </Link>
        </Reveal>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {vedettes.map((vedette, i) => (
            <Reveal key={vedette.association.id} delay={i * 100}>
              <CarteAssociation vedette={vedette} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
