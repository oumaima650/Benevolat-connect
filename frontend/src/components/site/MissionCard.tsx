import type { Mission } from "./data";

export function MissionCard({ mission }: { mission: Mission }) {
  const complet = mission.placesRestantes === 0;

  return (
    <article className="flex h-full flex-col rounded-2xl border-4 border-ink bg-paper p-5 shadow-[6px_6px_0_var(--color-mustard)]">
      <span className="inline-flex w-fit rounded-full border-2 border-ink px-3 py-1 text-xs font-semibold uppercase tracking-wide">
        {mission.domaine}
      </span>
      <h3 className="mt-4 text-lg leading-snug">{mission.titre}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{mission.ville}</p>

      <div className="mt-auto pt-5">
        <span
          className={`inline-flex rounded-lg border-2 border-ink px-3 py-1 text-xs font-semibold ${
            complet ? "bg-pink text-pink-foreground" : "bg-emerald text-emerald-foreground"
          }`}
        >
          {complet
            ? `Liste d'attente · ${mission.listeAttente} en attente`
            : `${mission.placesRestantes} places restantes`}
        </span>
      </div>
    </article>
  );
}
