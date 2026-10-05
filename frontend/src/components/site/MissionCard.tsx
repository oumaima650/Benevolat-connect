import { Link } from "@tanstack/react-router";
import { ArrowUpRight, CalendarDays, MapPin, Users, Clock3, Navigation } from "lucide-react";
import { formaterDate, type Mission } from "./data";
import { missionPresentation } from "./mission-presentation";

export function MissionCard({ mission, distance, actif, onHover }: { mission: Mission; distance?: number | undefined; actif?: boolean; onHover?: (id: string) => void }) {
  const complet = mission.placesRestantes === 0;
  const { Icon, color, background } = missionPresentation(mission.domaine);
  return (
    <article
      onMouseEnter={() => onHover?.(mission.id)}
      className={`mission-card flex h-full flex-col overflow-hidden rounded-lg border-2 border-ink bg-paper transition-transform duration-200 ${actif ? "shadow-[6px_6px_0_var(--color-pink)]" : ""}`}
    >
      <div className={`flex items-center justify-between gap-3 border-b-2 border-ink px-5 py-4 ${background} ${color}`}>
        <Icon className="h-8 w-8 shrink-0" strokeWidth={1.7} aria-hidden="true" />
        <span className="text-right text-xs font-bold">{mission.domaine}</span>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="text-xs font-semibold text-muted-foreground">{mission.association}</p>
        <h3 className="mt-2 text-xl leading-tight">{mission.titre}</h3>
        <div className="mt-4 space-y-2 text-xs text-muted-foreground">
          <p className="flex items-start gap-2"><MapPin className="h-4 w-4 shrink-0" />{mission.adresse}</p>
          <p className="flex items-center gap-2"><CalendarDays className="h-4 w-4 shrink-0" />{formaterDate(mission.date)} → {formaterDate(mission.dateFin)}</p>
          {distance !== undefined && <p className="flex items-center gap-2 font-semibold text-ink"><Navigation className="h-4 w-4 shrink-0" />à {Math.round(distance)} km de toi</p>}
        </div>
        <p className="mt-4 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{mission.description}</p>
        <div className="mt-auto pt-5">
          <p className={`flex items-center gap-2 text-xs font-bold ${complet ? "text-ink" : "text-emerald"}`}>
            {complet ? <Clock3 className="h-4 w-4" /> : <Users className="h-4 w-4" />}
            {complet ? `Complet · ${mission.listeAttente} en attente` : `${mission.placesRestantes} / ${mission.placesDemandees} places restantes`}
          </p>
          <Link to="/missions/$id" params={{ id: mission.id }} className="mt-4 flex w-full items-center justify-between border-t border-ink/20 pt-4 text-sm font-bold hover:text-pink">
            Voir le détail de la mission <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </article>
  );
}
