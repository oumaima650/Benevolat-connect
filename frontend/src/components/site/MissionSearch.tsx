import { useEffect, useMemo, useState } from "react";
import { Search, RotateCcw, LocateFixed, Map as MapIcon, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { distanceKm, domaines as defaultDomaines, rechercherMissions as fallbackRechercher, villes as defaultVilles, type Mission } from "./data";
import { MissionCard } from "./MissionCard";
import { MissionMap } from "./MissionMap";
import { Reveal } from "./Reveal";
import missionApi from "@/services/missionApi";

const vide = { motCle: "", ville: "", domaine: "" };
const champ = "w-full rounded-xl border-2 border-ink bg-paper px-3 py-2.5 text-sm outline-none focus:shadow-[3px_3px_0_var(--color-pink)]";

export function MissionSearch({ limite, titre = "Rechercher une mission" }: { limite?: number; titre?: string }) {
  const [filtres, setFiltres] = useState(vide);
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [geoEtat, setGeoEtat] = useState<"" | "chargement" | "refus">("");
  const [rayon, setRayon] = useState(0);
  const [selection, setSelection] = useState<string | null>(null);
  const [carte, setCarte] = useState(true);
  const [villesList, setVillesList] = useState<string[]>(defaultVilles);
  const [domainesList, setDomainesList] = useState<string[]>(defaultDomaines);
  const [backendMissions, setBackendMissions] = useState<Mission[] | null>(null);

  useEffect(() => {
    missionApi.getCities().then((data) => data.length > 0 && setVillesList(data)).catch(() => {});
    missionApi.getDomaines().then((data) => data.length > 0 && setDomainesList(data)).catch(() => {});
  }, []);

  useEffect(() => {
    missionApi
      .searchMissions({
        q: filtres.motCle,
        ville: filtres.ville,
        domaine: filtres.domaine,
      })
      .then((data) => {
        if (data.length > 0) setBackendMissions(data);
      })
      .catch(() => {});
  }, [filtres]);

  const resultats = useMemo(() => {
    const source = backendMissions && backendMissions.length > 0 ? backendMissions : fallbackRechercher(filtres);
    let r = source.map((m) => ({ m, d: position ? distanceKm(position, m) : undefined }));
    if (position) {
      if (rayon) r = r.filter((x) => (x.d ?? 0) <= rayon);
      r.sort((a, b) => (a.d ?? 0) - (b.d ?? 0));
    }
    return r;
  }, [filtres, position, rayon, backendMissions]);

  const affiches = limite ? resultats.slice(0, limite) : resultats;
  const missionsCarte = useMemo(() => resultats.map((x) => x.m), [resultats]);

  const localiser = () => {
    if (!navigator.geolocation) return setGeoEtat("refus");
    setGeoEtat("chargement");
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setPosition({ lat: p.coords.latitude, lng: p.coords.longitude });
        setGeoEtat("");
      },
      () => setGeoEtat("refus"),
      { timeout: 10000 }
    );
  };

  const reset = () => {
    setFiltres(vide);
    setPosition(null);
    setRayon(0);
    setGeoEtat("");
  };

  return (
    <section id="recherche" className="border-b-4 border-ink bg-paper">
      <div className="mx-auto max-w-6xl px-5 py-14 lg:py-20">
        <Reveal>
          <h2 className="text-3xl sm:text-4xl">{titre}</h2>
          <p className="mt-3 text-muted-foreground">Trouve une mission près de chez toi, directement sur la carte.</p>
        </Reveal>

        <form
          onSubmit={(e) => e.preventDefault()}
          className="mt-8 grid gap-3 rounded-lg border-2 border-ink bg-mustard p-4 md:grid-cols-[2fr_1fr_1fr_auto]"
        >
          <div className="relative">
            <Search aria-hidden="true" className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <input
              aria-label="Mot-clé"
              placeholder="Mot-clé, adresse…"
              className={`${champ} pl-9`}
              value={filtres.motCle}
              onChange={(e) => setFiltres({ ...filtres, motCle: e.target.value })}
            />
          </div>
          <select
            aria-label="Ville"
            className={champ}
            value={filtres.ville}
            onChange={(e) => setFiltres({ ...filtres, ville: e.target.value })}
          >
            <option value="">Toutes les villes</option>
            {villesList.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
          <select
            aria-label="Domaine"
            className={champ}
            value={filtres.domaine}
            onChange={(e) => setFiltres({ ...filtres, domaine: e.target.value })}
          >
            <option value="">Tous les domaines</option>
            {domainesList.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          <Button
            variant="outline"
            type="button"
            onClick={reset}
            className="press h-auto rounded-lg border-2 border-ink bg-paper px-4 py-2.5 text-sm font-semibold"
          >
            <RotateCcw /> Réinitialiser
          </Button>

          <div className="flex flex-wrap items-center gap-3 md:col-span-4">
            <Button
              type="button"
              onClick={localiser}
              className="press h-auto rounded-lg border-2 border-ink bg-ink px-4 py-2.5 text-sm font-semibold text-paper hover:bg-ink"
            >
              <LocateFixed />{" "}
              {geoEtat === "chargement" ? "Localisation…" : position ? "Position trouvée" : "Missions autour de moi"}
            </Button>
            {position && (
              <select
                aria-label="Rayon"
                className={`${champ} w-auto`}
                value={rayon}
                onChange={(e) => setRayon(Number(e.target.value))}
              >
                <option value={0}>Toutes distances</option>
                <option value={10}>Moins de 10 km</option>
                <option value={50}>Moins de 50 km</option>
                <option value={200}>Moins de 200 km</option>
              </select>
            )}
            {geoEtat === "refus" && <span className="text-xs font-semibold">Localisation refusée ou indisponible.</span>}
            <Button
              type="button"
              variant="outline"
              onClick={() => setCarte(!carte)}
              className="ml-auto h-auto rounded-lg border-2 border-ink bg-paper px-3 py-2 text-xs font-semibold"
            >
              {carte ? (
                <>
                  <LayoutGrid /> Masquer la carte
                </>
              ) : (
                <>
                  <MapIcon /> Afficher la carte
                </>
              )}
            </Button>
          </div>
        </form>

        <p className="mt-6 text-sm text-muted-foreground">
          {resultats.length} mission{resultats.length > 1 ? "s" : ""} trouvée{resultats.length > 1 ? "s" : ""}
          {position ? " · triées par distance" : ""}
        </p>

        {carte && (
          <MissionMap
            missions={missionsCarte}
            selectedId={selection}
            onSelect={setSelection}
            position={position}
            className="mt-4 h-[380px] sm:h-[440px]"
          />
        )}

        {resultats.length === 0 ? (
          <div className="mt-4 rounded-2xl border-4 border-dashed border-ink p-10 text-center">
            <p className="font-display text-xl">Aucune mission ne correspond à ta recherche.</p>
            <p className="mt-2 text-sm text-muted-foreground">Essaie un autre mot-clé, une autre ville ou élargis le rayon.</p>
            <Button
              onClick={reset}
              className="press mt-5 h-auto rounded-lg border-2 border-ink bg-pink px-5 py-3 text-sm font-semibold text-pink-foreground shadow-[4px_4px_0_var(--color-ink)]"
            >
              <RotateCcw /> Réinitialiser la recherche
            </Button>
          </div>
        ) : (
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {affiches.map(({ m, d }, i) => (
              <Reveal key={m.id} delay={(i % 4) * 80}>
                <MissionCard mission={m} distance={d} actif={selection === m.id} onHover={setSelection} />
              </Reveal>
            ))}
          </div>
        )}

        {limite && resultats.length > limite && (
          <Link to="/missions" className="mt-8 inline-block text-sm font-semibold underline underline-offset-4">
            Voir les {resultats.length} missions
          </Link>
        )}
      </div>
    </section>
  );
}
