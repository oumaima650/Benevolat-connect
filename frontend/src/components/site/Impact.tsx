import { statistiques } from "./data";

const couleurs = ["text-mustard", "text-pink", "text-emerald"];

export function Impact() {
  return (
    <section className="border-b-4 border-ink bg-ink text-paper">
      <div className="mx-auto max-w-6xl px-5 py-14 lg:py-20">
        <h2 className="text-3xl sm:text-4xl">Notre impact</h2>

        <div className="mt-10 grid gap-8 sm:grid-cols-3">
          {statistiques.map((stat, index) => (
            <div key={stat.libelle}>
              <p className={`font-display text-5xl lg:text-6xl ${couleurs[index]}`}>
                {stat.valeur}
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
