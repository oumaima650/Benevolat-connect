import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { missions as fallbackMissions, type Mission } from "./data";
import { MissionCard } from "./MissionCard";
import { Reveal } from "./Reveal";
import missionApi from "@/services/missionApi";

export function FeaturedMissions() {
  const [missionsList, setMissionsList] = useState<Mission[]>(fallbackMissions);

  useEffect(() => {
    missionApi
      .getFeaturedMissions()
      .then((data) => {
        if (data && data.length > 0) setMissionsList(data);
      })
      .catch(() => {});
  }, []);

  return (
    <section id="missions" className="border-b-4 border-ink bg-muted">
      <div className="mx-auto max-w-6xl px-5 py-14 lg:py-20">
        <Reveal className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4 sm:flex sm:justify-between">
          <div className="min-w-0">
            <h2 className="text-3xl sm:text-4xl">Missions à la une</h2>
            <p className="mt-3 text-muted-foreground">
              Des associations engagées. Des missions qui n’attendent que toi.
            </p>
          </div>
          <Link to="/missions" className="shrink-0 text-sm font-semibold underline underline-offset-4 hover:text-pink">
            Voir tout
          </Link>
        </Reveal>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {missionsList.slice(0, 4).map((mission, i) => (
            <Reveal key={mission.id} delay={i * 100}>
              <MissionCard mission={mission} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
