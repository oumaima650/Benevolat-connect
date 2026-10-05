import { formaterDate, type Mission } from "./data";

export function MissionCard({ mission, onOpen }: { mission: Mission; onOpen?: (m: Mission) => void }) {
  const complet = mission.placesRestantes === 0;
  const urgent = !complet && mission.placesRestantes <= 3;

  return (
    <article
      role={onOpen ? "button" : undefined}
      tabIndex={onOpen ? 0 : undefined}
      onClick={() => onOpen?.(mission)}
      onKeyDown={(e) => {
        if (onOpen && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onOpen(mission);
        }
      }}
      className={`press flex h-full flex-col rounded-2xl border-4 border-ink bg-paper p-5 shadow-[6px_6px_0_var(--color-mustard)] ${onOpen ? "cursor-pointer hover:shadow-[9px_9px_0_var(--color-mustard)]" : ""}`}
    >
      <span className="inline-flex w-fit rounded-full border-2 border-ink px-3 py-1 text-xs font-semibold uppercase tracking-wide">
        {mission.domaine}
      </span>
      <h3 className="mt-4 text-lg leading-snug">{mission.titre}</h3>
      <p className="mt-2 text-sm font-medium">{mission.association}</p>
      <p className="mt-1 text-sm text-muted-foreground">
        {mission.ville} · {formaterDate(mission.date)}
      </p>

      <div className="mt-auto pt-5">
        <span
          className={`inline-flex rounded-lg border-2 border-ink px-3 py-1 text-xs font-semibold ${
            complet ? "bg-pink text-pink-foreground" : "bg-emerald text-emerald-foreground"
          } ${complet || urgent ? "animate-badge" : ""}`}
        >
          {complet
            ? `Liste d'attente · ${mission.listeAttente} en attente`
            : `${mission.placesRestantes} places restantes`}
        </span>
      </div>
    </article>
  );
}
