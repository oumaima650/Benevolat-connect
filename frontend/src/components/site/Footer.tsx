import logoImg from "@/assets/logo.png";

const colonnes = [
  { titre: "Plateforme", liens: ["Missions", "Comment ça marche", "Vérifier un certificat", "Aide"] },
  { titre: "Associations", liens: ["Publier une mission", "Tarifs", "Ressources"] },
  { titre: "Légal", liens: ["Mentions légales", "Confidentialité", "Conditions d'utilisation"] },
];

const reseaux = ["Instagram", "LinkedIn", "Facebook"];

export function Footer() {
  return (
    <footer className="bg-paper">
      <div className="mx-auto max-w-6xl px-5 py-14">
        <div className="grid gap-10 md:grid-cols-[1.3fr_repeat(3,1fr)]">
          <div className="min-w-0">
            <img
              src={logoImg}
              alt="CountMeIn — Connecter, Soutenir, Agir"
              width={348}
              height={96}
              className="h-12 w-auto max-w-full"
            />
            <p className="mt-4 max-w-xs text-sm text-muted-foreground">
              La plateforme qui relie les bénévoles et les associations, près de chez vous.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {reseaux.map((reseau) => (
                <a
                  key={reseau}
                  href="#"
                  className="rounded-lg border-2 border-ink px-3 py-1 text-xs font-semibold transition-colors hover:bg-mustard"
                >
                  {reseau}
                </a>
              ))}
            </div>
          </div>

          {colonnes.map((colonne) => (
            <div key={colonne.titre}>
              <p className="font-display text-sm uppercase tracking-wide">{colonne.titre}</p>
              <ul className="mt-4 space-y-2">
                {colonne.liens.map((lien) => (
                  <li key={lien}>
                    <a
                      href={lien === "Vérifier un certificat" ? "/certificat" : lien === "Missions" ? "/missions" : lien === "Publier une mission" ? "/inscription?profil=association" : "#"}
                      className="text-sm text-muted-foreground transition-colors hover:text-pink"
                    >
                      {lien}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p className="mt-12 border-t-2 border-ink pt-6 text-xs text-muted-foreground">
          © {new Date().getFullYear()} CountMeIn. Tous droits réservés.
        </p>
      </div>
    </footer>
  );
}
