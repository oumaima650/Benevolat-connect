import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowUpRight, MapPin } from "lucide-react";
import { missionPresentation } from "./mission-presentation";
import { Reveal } from "./Reveal";
import associationApi, { type AssociationBackend } from "@/services/associationApi";

function isValidUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  return url.startsWith("http://") || url.startsWith("https://");
}

function CarteAssociation({ association }: { association: AssociationBackend }) {
  const nom         = association.nom || "";
  const domaine     = association.domaine || "Solidarité";
  const ville       = association.ville || "";
  const description = association.description || "";
  const rawPhoto    = association.photoProfil ?? null;
  const photo       = isValidUrl(rawPhoto) ? rawPhoto : null;
  const initiales   = nom
    ? nom
        .split(" ")
        .map((w: string) => w[0])
        .filter(Boolean)
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "A";

  const { Icon, color, background } = missionPresentation(domaine);

  return (
    <article className="flex h-full flex-col rounded-2xl border-2 border-ink bg-paper shadow-[4px_4px_0_var(--color-ink)] transition-all hover:-translate-y-1">
      {/* Corps : avatar + infos */}
      <div className="flex flex-1 flex-col gap-4 p-5">
        <div className="flex items-start gap-4">
          {/* Avatar 56×56 */}
          {photo ? (
            <img
              src={photo}
              alt={nom}
              className="h-14 w-14 shrink-0 rounded-xl border-2 border-ink object-cover"
            />
          ) : (
            <span
              aria-hidden="true"
              className={`grid h-14 w-14 shrink-0 place-items-center rounded-xl border-2 border-ink font-display text-sm font-black ${background} ${color}`}
            >
              {initiales}
            </span>
          )}

          {/* Infos */}
          <div className="min-w-0 flex-1">
            {/* Badge domaine */}
            <span
              className={`inline-flex items-center gap-1 rounded-md border border-ink/20 px-2 py-0.5 text-xs font-bold ${background} ${color}`}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              {domaine}
            </span>

            <h3 className="mt-1.5 truncate font-display text-lg leading-tight">
              {nom}
            </h3>

            {ville && (
              <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                {ville}
              </p>
            )}
          </div>
        </div>

        <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      </div>

      {/* Footer */}
      <div className="border-t-2 border-ink px-5 py-3">
        <Link
          to="/missions"
          className="flex items-center justify-between text-sm font-bold hover:text-pink"
        >
          Voir ses missions <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>
    </article>
  );
}

function SkeletonCarte() {
  return (
    <div className="h-32 animate-pulse rounded-xl border-2 border-ink bg-muted" />
  );
}

export function FeaturedAssociations() {
  const [assosList, setAssosList] = useState<AssociationBackend[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    associationApi
      .getFeaturedAssociations()
      .then((data: AssociationBackend[]) => {
        setAssosList(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="border-b-4 border-ink bg-muted">
      <div className="mx-auto max-w-6xl px-5 py-14 lg:py-20">
        <Reveal className="flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-3xl sm:text-4xl">Ils agissent près de vous</h2>
            <p className="mt-3 text-muted-foreground">
              Des équipes locales qui font bouger le Maroc. Rejoins celle qui te ressemble.
            </p>
          </div>
          <Link
            to="/associations"
            className="shrink-0 text-sm font-semibold underline underline-offset-4 hover:text-pink"
          >
            Voir toutes les associations
          </Link>
        </Reveal>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => <SkeletonCarte key={i} />)
          ) : assosList.length === 0 ? (
            <p className="col-span-4 text-sm text-muted-foreground">
              Aucune association disponible pour le moment.
            </p>
          ) : (
            assosList.slice(0, 4).map((asso, i) => (
              <Reveal key={asso.id ?? asso.nom} delay={i * 100}>
                <CarteAssociation association={asso} />
              </Reveal>
            ))
          )}
        </div>

        {!loading && assosList.length > 4 && (
          <div className="mt-8 flex justify-center">
            <Link
              to="/associations"
              className="press inline-flex items-center gap-2 rounded-xl border-2 border-ink bg-ink px-6 py-3 text-sm font-bold text-paper shadow-[4px_4px_0_var(--color-mustard)] hover:opacity-90"
            >
              Voir toutes les {assosList.length} associations
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
