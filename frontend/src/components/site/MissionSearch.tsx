import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { domaines, rechercherMissions, villes, type Mission } from "./data";
import { MissionCard } from "./MissionCard";
import { MissionDialog } from "./MissionDialog";
import { Reveal } from "./Reveal";

const vide = { motCle: "", ville: "", domaine: "" };
const champ = "w-full rounded-xl border-2 border-ink bg-paper px-3 py-2.5 text-sm outline-none focus:shadow-[3px_3px_0_var(--color-pink)]";

export function MissionSearch({ limite, titre = "Rechercher une mission" }: { limite?: number; titre?: string }) {
  const [filtres, setFiltres] = useState(vide);
  const [selection, setSelection] = useState<Mission | null>(null);
  const resultats = useMemo(() => rechercherMissions(filtres), [filtres]);
  const affiches = limite ? resultats.slice(0, limite) : resultats;

  return (
    <section id="recherche" className="border-b-4 border-ink bg-paper">
      <div className="mx-auto max-w-6xl px-5 py-14 lg:py-20">
        <Reveal>
          <h2 className="text-3xl sm:text-4xl">{titre}</h2>
          <p className="mt-3 text-muted-foreground">Mot-clé, ville, domaine : trouve la mission qui te correspond.</p>
        </Reveal>

        <form
          onSubmit={(e) => e.preventDefault()}
          className="mt-8 grid gap-3 rounded-2xl border-4 border-ink bg-mustard p-4 shadow-[6px_6px_0_var(--color-ink)] md:grid-cols-[2fr_1fr_1fr_auto]"
        >
          <input aria-label="Mot-clé" placeholder="Mot-clé (ex : repas, plage…)" className={champ} value={filtres.motCle} onChange={(e) => setFiltres({ ...filtres, motCle: e.target.value })} />
          <select aria-label="Ville" className={champ} value={filtres.ville} onChange={(e) => setFiltres({ ...filtres, ville: e.target.value })}>
            <option value="">Toutes les villes</option>
            {villes.map((v) => <option key={v}>{v}</option>)}
          </select>
          <select aria-label="Domaine" className={champ} value={filtres.domaine} onChange={(e) => setFiltres({ ...filtres, domaine: e.target.value })}>
            <option value="">Tous les domaines</option>
            {domaines.map((d) => <option key={d}>{d}</option>)}
          </select>
          <button type="button" onClick={() => setFiltres(vide)} className="press rounded-xl border-2 border-ink bg-paper px-4 py-2.5 text-sm font-semibold">
            Réinitialiser
          </button>
        </form>

        <p className="mt-6 text-sm text-muted-foreground">{resultats.length} mission{resultats.length > 1 ? "s" : ""} trouvée{resultats.length > 1 ? "s" : ""}</p>

        {resultats.length === 0 ? (
          <div className="mt-4 rounded-2xl border-4 border-dashed border-ink p-10 text-center">
            <p className="font-display text-xl">Aucune mission ne correspond à ta recherche.</p>
            <p className="mt-2 text-sm text-muted-foreground">Essaie un autre mot-clé, une autre ville ou un autre domaine.</p>
            <button onClick={() => setFiltres(vide)} className="press mt-5 rounded-xl border-2 border-ink bg-pink px-5 py-3 text-sm font-semibold text-pink-foreground shadow-[4px_4px_0_var(--color-ink)]">
              Réinitialiser la recherche
            </button>
          </div>
        ) : (
          <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {affiches.map((m, i) => (
              <Reveal key={m.id} delay={(i % 4) * 80}>
                <MissionCard mission={m} onOpen={setSelection} />
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
      <MissionDialog mission={selection} onClose={() => setSelection(null)} />
    </section>
  );
}
