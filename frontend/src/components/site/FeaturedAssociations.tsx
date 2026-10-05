import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowUpRight, MapPin, Building2 } from "lucide-react";
import { associations as fallbackAssociations, type Association } from "./data";
import { missionPresentation } from "./mission-presentation";
import { Reveal } from "./Reveal";
import associationApi, { type AssociationBackend } from "@/services/associationApi";

function CarteAssociation({ association }: { association: any }) {
  const nom = association.nom || "";
  const domaine = association.domaine || "Solidarité";
  const ville = association.ville || "";
  const description = association.description || "";
  const photo = association.photoProfil;
  const initiales = nom ? nom.split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase() : "A";

  const { Icon, color, background } = missionPresentation(domaine);

  return (
    <article className="mission-card flex h-full flex-col overflow-hidden rounded-lg border-2 border-ink bg-paper">
      <div className={`flex items-center justify-between gap-3 border-b-2 border-ink px-5 py-4 ${background} ${color}`}>
        <Icon className="h-8 w-8 shrink-0" strokeWidth={1.7} aria-hidden="true" />
        <span className="text-right text-xs font-bold">{domaine}</span>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center gap-3">
          {photo ? (
            <img src={photo} alt={nom} className="h-12 w-12 shrink-0 rounded-full border-2 border-ink object-cover" />
          ) : (
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full border-2 border-ink bg-ink font-display text-sm font-black text-paper" aria-hidden="true">
              {initiales}
            </span>
          )}
          <div className="min-w-0">
            <h3 className="truncate text-lg leading-tight font-display">{nom}</h3>
            {ville && (
              <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 shrink-0" /> {ville}
              </p>
            )}
          </div>
        </div>
        <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-muted-foreground">{description}</p>
        <div className="mt-auto pt-5">
          <Link to="/missions" className="flex items-center justify-between border-t border-ink/20 pt-4 text-sm font-bold hover:text-pink">
            Voir ses missions <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </article>
  );
}

export function FeaturedAssociations() {
  const [assosList, setAssosList] = useState<any[]>(fallbackAssociations);

  useEffect(() => {
    associationApi.getFeaturedAssociations().then((data: AssociationBackend[]) => {
      if (data && data.length > 0) {
        setAssosList(data);
      }
    }).catch(() => {});
  }, []);

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
          {assosList.slice(0, 4).map((asso, i) => (
            <Reveal key={asso.id || asso.nom} delay={i * 100}>
              <CarteAssociation association={asso} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
