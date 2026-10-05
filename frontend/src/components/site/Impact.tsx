import { useEffect, useState } from "react";
import { statistiques as defaultStats } from "./data";
import { useInView } from "./Reveal";
import statsApi, { type StatistiquesData } from "@/services/statsApi";

const couleurs = ["text-mustard", "text-pink", "text-emerald"];

function Compteur({ valeur }: { valeur: string }) {
  const cible = Number(valeur.replace(/\s/g, ""));
  const { ref, visible } = useInView<HTMLSpanElement>();
  const [n, setN] = useState(0);

  useEffect(() => {
    if (!visible) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return setN(cible);
    const debut = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - debut) / 1600);
      setN(Math.round(cible * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [visible, cible]);

  return <span ref={ref}>{visible ? n.toLocaleString("fr-FR") : valeur}</span>;
}

export function Impact() {
  const [stats, setStats] = useState(defaultStats);

  useEffect(() => {
    statsApi
      .getStatistiques()
      .then((data: StatistiquesData) => {
        setStats([
          { valeur: String(data.totalMissions ?? 4), libelle: "missions publiées" },
          { valeur: String(data.totalBenevoles ?? 44), libelle: "bénévoles recherchés" },
          { valeur: String(data.totalAssociations ?? 4), libelle: "associations partenaires" },
        ]);
      })
      .catch(() => {});
  }, []);

  return (
    <section className="border-b-4 border-ink bg-ink text-paper">
      <div className="mx-auto max-w-6xl px-5 py-14 lg:py-20">
        <h2 className="text-3xl sm:text-4xl">Notre impact</h2>

        <div className="mt-10 grid gap-8 sm:grid-cols-3">
          {stats.map((stat, index) => (
            <div key={stat.libelle}>
              <p className={`font-display text-5xl lg:text-6xl ${couleurs[index % couleurs.length]}`}>
                <Compteur valeur={stat.valeur} />
              </p>
              <p className="mt-2 text-sm uppercase tracking-wide opacity-80">
                {stat.libelle}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
