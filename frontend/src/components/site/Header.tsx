import { Logo } from "@/components/site/Logo";

const liens = ["Accueil", "Missions", "Comment ça marche", "Connexion"];

export function Header() {
  return (
    <header className="border-b-4 border-ink bg-paper">
      <div className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-5 py-4 lg:flex lg:justify-between">
        <a href="#" className="flex min-w-0 items-center gap-3">
          <Logo />
        </a>


        <nav className="hidden items-center gap-7 lg:flex">
          {liens.map((lien) => (
            <a
              key={lien}
              href="#"
              className="text-sm font-medium text-foreground transition-colors hover:text-pink"
            >
              {lien}
            </a>
          ))}
        </nav>

        <a
          href="#"
          className="inline-flex shrink-0 items-center rounded-xl border-2 border-ink bg-pink px-4 py-2 text-sm font-semibold text-pink-foreground shadow-[4px_4px_0_var(--color-ink)] transition-transform hover:-translate-y-0.5"
        >
          Devenir bénévole
        </a>
      </div>
    </header>
  );
}
