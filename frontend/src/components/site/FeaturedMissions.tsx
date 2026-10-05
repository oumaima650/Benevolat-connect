import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { missions, type Mission } from "./data";
import { MissionCard } from "./MissionCard";
import { MissionDialog } from "./MissionDialog";
import { Reveal } from "./Reveal";

export function FeaturedMissions() {
  const [selection, setSelection] = useState<Mission | null>(null);
  return (
    <section id="missions" className="border-b-4 border-ink bg-muted">
      <div className="mx-auto max-w-6xl px-5 py-14 lg:py-20">
        <Reveal className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4 sm:flex sm:justify-between">
          <div className="min-w-0">
            <h2 className="text-3xl sm:text-4xl">Missions à la une</h2>
            <p className="mt-3 text-muted-foreground">
              Des besoins concrets, publiés par nos associations partenaires.
            </p>
          </div>
          <Link to="/missions" className="shrink-0 text-sm font-semibold underline underline-offset-4 hover:text-pink">
            Voir tout
          </Link>
        </Reveal>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {missions.slice(0, 4).map((mission, i) => (
            <Reveal key={mission.id} delay={i * 100}>
              <MissionCard mission={mission} onOpen={setSelection} />
            </Reveal>
          ))}
        </div>
      </div>
      <MissionDialog mission={selection} onClose={() => setSelection(null)} />
    </section>
  );
}
