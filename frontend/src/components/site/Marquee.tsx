const mots = ["Solidarité", "Entraide", "Éducation", "Environnement", "Lien social", "Engagement", "Partage", "Citoyenneté"];

export function Marquee() {
  const liste = [...mots, ...mots];
  return (
    <div className="overflow-hidden border-b-4 border-ink bg-pink py-3 text-pink-foreground" aria-hidden="true">
      <div className="animate-marquee flex w-max gap-8 whitespace-nowrap">
        {liste.map((mot, i) => (
          <span key={i} className="flex items-center gap-8 font-display text-lg uppercase">
            {mot}
            <span className="h-3 w-3 rounded-full bg-mustard" />
          </span>
        ))}
      </div>
    </div>
  );
}
