import { missions } from "./data";
import { MissionCard } from "./MissionCard";

export function FeaturedMissions() {
  return (
    <section id="missions" className="border-b-4 border-ink bg-muted">
      <div className="mx-auto max-w-6xl px-5 py-14 lg:py-20">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4 sm:flex sm:justify-between">
          <div className="min-w-0">
            <h2 className="text-3xl sm:text-4xl">Missions à la une</h2>
            <p className="mt-3 text-muted-foreground">
              Des besoins concrets, publiés par nos associations partenaires.
            </p>
          </div>
          <a href="#" className="shrink-0 text-sm font-semibold underline underline-offset-4">
            Voir tout
          </a>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {missions.map((mission) => (
            <MissionCard key={mission.id} mission={mission} />
          ))}
        </div>
      </div>
    </section>
  );
}
