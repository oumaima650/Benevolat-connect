import { useState } from "react";
import { BadgeCheck, ShieldCheck, ShieldX, ScanLine, Clock3, CalendarDays, Building2 } from "lucide-react";
import { formaterDate, verifierCertificat as fallbackVerifier, type Certificat } from "./data";
import { Reveal } from "./Reveal";
import certificatApi from "@/services/certificatApi";

const demos = ["CERT-2026-8821", "CERT-2026-9932", "CMI-2026-A7K9", "CMI-2026-B3X1"];

export function CertificateCheck() {
  const [code, setCode] = useState("");
  const [enCours, setEnCours] = useState(false);
  const [resultat, setResultat] = useState<{ cert: Certificat | null; code: string } | null>(null);

  const verifier = async (valeur: string) => {
    if (!valeur.trim()) return;
    setEnCours(true);
    setResultat(null);

    try {
      const res = await certificatApi.verifyCertificat(valeur);
      if (res.valide) {
        setResultat({
          code: valeur,
          cert: {
            code: res.codeVerification || valeur,
            benevole: `${res.benevolePrenom || ""} ${res.benevoleNom || ""}`.trim() || "Bénévole",
            mission: res.missionTitre || "Mission de bénévolat",
            association: res.associationNom || "Association",
            date: res.dateEmission || "2026-10-01",
            heures: res.nbHeures || 18,
          },
        });
      } else {
        const local = fallbackVerifier(valeur);
        setResultat({ cert: local, code: valeur });
      }
    } catch {
      const local = fallbackVerifier(valeur);
      setResultat({ cert: local, code: valeur });
    } finally {
      setEnCours(false);
    }
  };

  return (
    <section id="certificat" className="border-b-4 border-ink bg-ink text-paper py-16 lg:py-24">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 lg:grid-cols-[1fr_1.1fr] lg:items-center">
        <Reveal>
          <span className="inline-flex items-center gap-2 rounded-full border-2 border-mustard px-3 py-1 text-xs font-bold uppercase text-mustard">
            <ShieldCheck className="h-4 w-4" /> Authenticité garantie
          </span>
          <h2 className="mt-5 text-4xl leading-tight sm:text-5xl">
            Un certificat.<br />
            <span className="text-mustard">Une vérification.</span><br />
            Trois secondes.
          </h2>
          <p className="mt-4 max-w-md leading-relaxed opacity-80">
            Recruteur, école ou bénévole : saisis le code unique imprimé sur le certificat pour confirmer qu’il a bien été délivré par une association CountMeIn.
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              verifier(code);
            }}
            className="mt-8 flex flex-col gap-3 sm:flex-row"
          >
            <div className="relative flex-1">
              <ScanLine className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <input
                aria-label="Code du certificat"
                placeholder="CMI-2026-XXXX"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full rounded-xl border-2 border-paper bg-paper py-3.5 pl-12 pr-4 font-mono font-semibold uppercase tracking-widest text-ink outline-none focus:shadow-[4px_4px_0_var(--color-mustard)]"
              />
            </div>
            <button className="press rounded-xl border-2 border-ink bg-mustard px-6 py-3.5 text-sm font-bold text-ink shadow-[4px_4px_0_var(--color-pink)]">
              {enCours ? "Vérification…" : "Vérifier"}
            </button>
          </form>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs opacity-80">
            Essaie :
            {demos.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => {
                  setCode(d);
                  verifier(d);
                }}
                className="rounded-md border border-paper/40 px-2 py-1 font-mono hover:border-mustard hover:text-mustard"
              >
                {d}
              </button>
            ))}
          </div>
        </Reveal>

        <div className="relative min-h-[340px]" role="status" aria-live="polite">
          {!resultat && !enCours && (
            <div className="grid h-full min-h-[340px] place-items-center rounded-2xl border-2 border-dashed border-paper/40 p-8 text-center">
              <div>
                <BadgeCheck className="mx-auto h-14 w-14 text-mustard" strokeWidth={1.5} />
                <p className="mt-4 font-display text-xl">Le résultat s’affichera ici</p>
              </div>
            </div>
          )}
          {enCours && (
            <div className="grid h-full min-h-[340px] place-items-center rounded-2xl border-2 border-paper/40 p-8">
              <div className="h-14 w-14 animate-spin rounded-full border-4 border-paper/20 border-t-mustard" />
            </div>
          )}
          {resultat?.cert && (
            <div key={resultat.code} className="animate-scale-in relative rounded-2xl border-4 border-ink bg-paper p-8 text-ink shadow-[10px_10px_0_var(--color-mustard)]">
              <div className="absolute -right-4 -top-4 grid h-20 w-20 rotate-12 place-items-center rounded-full border-4 border-ink bg-emerald text-center text-[10px] font-black uppercase leading-tight text-paper">
                Certifié<br />✓
              </div>
              <p className="flex items-center gap-2 text-xs font-bold uppercase text-emerald">
                <ShieldCheck className="h-4 w-4" /> Certificat valide
              </p>
              <p className="mt-4 text-xs uppercase text-muted-foreground">Décerné à</p>
              <p className="font-display text-3xl">{resultat.cert.benevole}</p>
              <p className="mt-3 text-sm">
                pour sa participation à <strong>{resultat.cert.mission}</strong>
              </p>
              <div className="mt-6 grid grid-cols-3 gap-3 border-t-2 border-dashed border-ink/30 pt-5 text-sm">
                <div>
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <p className="mt-1 font-semibold leading-tight">{resultat.cert.association}</p>
                </div>
                <div>
                  <CalendarDays className="h-4 w-4 text-muted-foreground" />
                  <p className="mt-1 font-semibold">{formaterDate(resultat.cert.date)}</p>
                </div>
                <div>
                  <Clock3 className="h-4 w-4 text-muted-foreground" />
                  <p className="mt-1 font-display text-2xl leading-none">{resultat.cert.heures} h</p>
                </div>
              </div>
              <p className="mt-6 font-mono text-xs tracking-widest text-muted-foreground">N° {resultat.cert.code}</p>
            </div>
          )}
          {resultat && !resultat.cert && (
            <div key={resultat.code} className="animate-scale-in grid min-h-[340px] place-items-center rounded-2xl border-4 border-ink bg-pink p-8 text-center text-pink-foreground shadow-[10px_10px_0_var(--color-paper)]">
              <div>
                <ShieldX className="mx-auto h-14 w-14" strokeWidth={1.5} />
                <p className="mt-4 font-display text-2xl">Certificat introuvable</p>
                <p className="mt-2 text-sm">
                  Aucun certificat ne correspond au code « {resultat.code.toUpperCase()} ». Vérifie la saisie ou contacte l’association.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
