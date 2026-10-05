import { useState } from "react";
import { formaterDate, verifierCertificat, type Certificat } from "./data";
import { Reveal } from "./Reveal";

export function CertificateCheck() {
  const [code, setCode] = useState("");
  const [resultat, setResultat] = useState<{ cert: Certificat | null } | null>(null);

  return (
    <section id="certificat" className="border-b-4 border-ink bg-mustard">
      <div className="mx-auto max-w-3xl px-5 py-14 lg:py-20">
        <Reveal>
          <h2 className="text-3xl sm:text-4xl">Vérifier un certificat</h2>
          <p className="mt-3">Saisis le code unique figurant sur le certificat de bénévolat.</p>
        </Reveal>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (code.trim()) setResultat({ cert: verifierCertificat(code) });
          }}
          className="mt-8 flex flex-col gap-3 sm:flex-row"
        >
          <input
            aria-label="Code du certificat"
            placeholder="Ex : CMI-2026-A7K9"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="flex-1 rounded-xl border-2 border-ink bg-paper px-4 py-3 font-semibold uppercase outline-none focus:shadow-[3px_3px_0_var(--color-pink)]"
          />
          <button className="press rounded-xl border-2 border-ink bg-ink px-6 py-3 text-sm font-semibold text-paper shadow-[5px_5px_0_var(--color-pink)]">
            Vérifier
          </button>
        </form>
        <p className="mt-2 text-xs">Codes de démonstration : CMI-2026-A7K9, CMI-2026-B3X1</p>

        {resultat && (
          <div
            key={code + String(!!resultat.cert)}
            role="status"
            className={`animate-scale-in mt-6 rounded-2xl border-4 border-ink p-6 shadow-[6px_6px_0_var(--color-ink)] ${resultat.cert ? "bg-emerald text-emerald-foreground" : "bg-pink text-pink-foreground"}`}
          >
            {resultat.cert ? (
              <>
                <p className="font-display text-xl">✓ Certificat valide</p>
                <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                  <div><dt className="opacity-80">Bénévole</dt><dd className="font-semibold">{resultat.cert.benevole}</dd></div>
                  <div><dt className="opacity-80">Mission</dt><dd className="font-semibold">{resultat.cert.mission}</dd></div>
                  <div><dt className="opacity-80">Association</dt><dd className="font-semibold">{resultat.cert.association}</dd></div>
                  <div><dt className="opacity-80">Date</dt><dd className="font-semibold">{formaterDate(resultat.cert.date)}</dd></div>
                  <div><dt className="opacity-80">Heures</dt><dd className="font-semibold">{resultat.cert.heures} h</dd></div>
                  <div><dt className="opacity-80">Code</dt><dd className="font-semibold">{resultat.cert.code}</dd></div>
                </dl>
              </>
            ) : (
              <>
                <p className="font-display text-xl">✗ Certificat invalide</p>
                <p className="mt-2 text-sm">Aucun certificat ne correspond à ce code. Vérifie la saisie ou contacte l'association.</p>
              </>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
