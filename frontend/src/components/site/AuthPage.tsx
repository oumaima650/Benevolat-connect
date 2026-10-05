import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Footer } from "./Footer";
import { Header } from "./Header";
import { HandsMotif, SmileMotif } from "./icons";

export type Profil = "benevole" | "association";
const champ = "w-full rounded-xl border-2 border-ink bg-paper px-3 py-2.5 text-sm outline-none focus:shadow-[3px_3px_0_var(--color-pink)]";

export function AuthPage({ mode, profil }: { mode: "connexion" | "inscription"; profil: Profil }) {
  const [envoye, setEnvoye] = useState(false);
  const asso = profil === "association";
  const autreMode = mode === "connexion" ? "/inscription" : "/connexion";

  return (
    <div className="min-h-screen bg-paper">
      <Header />
      <main className={`border-b-4 border-ink ${asso ? "bg-emerald" : "bg-mustard"}`}>
        <div className="mx-auto max-w-lg px-5 py-14">
          <div className="animate-rise rounded-2xl border-4 border-ink bg-paper p-6 shadow-[8px_8px_0_var(--color-ink)] sm:p-8">
            <div className="grid grid-cols-2 gap-2 rounded-xl border-2 border-ink p-1">
              {(["benevole", "association"] as const).map((p) => (
                <Link
                  key={p}
                  to={mode === "connexion" ? "/connexion" : "/inscription"}
                  search={{ profil: p }}
                  className={`rounded-lg px-3 py-2 text-center text-sm font-semibold transition-colors ${profil === p ? (p === "association" ? "bg-emerald text-emerald-foreground" : "bg-pink text-pink-foreground") : "hover:bg-muted"}`}
                >
                  {p === "benevole" ? "Bénévole" : "Association"}
                </Link>
              ))}
            </div>

            <div className="mt-6 flex items-center gap-3">
              {asso ? <HandsMotif className="h-10 w-10 text-emerald" /> : <SmileMotif className="h-10 w-10 text-mustard" />}
              <h1 className="text-2xl">
                {mode === "connexion" ? "Connexion" : "Inscription"} {asso ? "association" : "bénévole"}
              </h1>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              {asso ? "Publiez vos missions et gérez vos bénévoles." : "Trouve une mission et inscris-toi en un clic."}
            </p>

            {envoye ? (
              <div className="animate-scale-in mt-6 rounded-xl border-2 border-ink bg-muted p-4 text-sm">
                Merci ! La création de compte sera disponible très bientôt.
              </div>
            ) : (
              <form className="mt-6 space-y-3" onSubmit={(e) => { e.preventDefault(); setEnvoye(true); }}>
                {mode === "inscription" && (
                  <input required className={champ} placeholder={asso ? "Nom de l'association" : "Prénom et nom"} />
                )}
                {mode === "inscription" && <input required className={champ} placeholder="Ville" />}
                <input required type="email" className={champ} placeholder="Adresse e-mail" />
                <input required type="password" minLength={6} className={champ} placeholder="Mot de passe" />
                <button className={`press w-full rounded-xl border-2 border-ink px-5 py-3 text-sm font-semibold shadow-[5px_5px_0_var(--color-ink)] ${asso ? "bg-emerald text-emerald-foreground" : "bg-pink text-pink-foreground"}`}>
                  {mode === "connexion" ? "Se connecter" : "Créer mon compte"}
                </button>
              </form>
            )}

            <p className="mt-6 text-center text-sm">
              {mode === "connexion" ? "Pas encore de compte ? " : "Déjà inscrit ? "}
              <Link to={autreMode} search={{ profil }} className="font-semibold underline underline-offset-4">
                {mode === "connexion" ? "Créer un compte" : "Se connecter"}
              </Link>
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
