import { Link } from "@tanstack/react-router";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formaterDate, type Mission } from "./data";

export function MissionDialog({ mission, onClose }: { mission: Mission | null; onClose: () => void }) {
  const complet = mission?.placesRestantes === 0;
  return (
    <Dialog open={!!mission} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="rounded-2xl border-4 border-ink bg-paper shadow-[8px_8px_0_var(--color-mustard)]">
        {mission && (
          <>
            <DialogHeader>
              <span className="inline-flex w-fit rounded-full border-2 border-ink px-3 py-1 text-xs font-semibold uppercase">{mission.domaine}</span>
              <DialogTitle className="pt-2 font-display text-2xl">{mission.titre}</DialogTitle>
              <DialogDescription>{mission.description}</DialogDescription>
            </DialogHeader>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div><dt className="text-muted-foreground">Association</dt><dd className="font-semibold">{mission.association}</dd></div>
              <div><dt className="text-muted-foreground">Ville</dt><dd className="font-semibold">{mission.ville}</dd></div>
              <div><dt className="text-muted-foreground">Date</dt><dd className="font-semibold">{formaterDate(mission.date)}</dd></div>
              <div><dt className="text-muted-foreground">Disponibilité</dt><dd className="font-semibold">{complet ? `Complet · ${mission.listeAttente} en attente` : `${mission.placesRestantes} places`}</dd></div>
            </dl>
            <Link
              to="/inscription"
              search={{ profil: "benevole" }}
              className={`press mt-2 inline-flex justify-center rounded-xl border-2 border-ink px-5 py-3 text-sm font-semibold shadow-[5px_5px_0_var(--color-ink)] ${complet ? "bg-pink text-pink-foreground" : "bg-emerald text-emerald-foreground"}`}
            >
              {complet ? "Rejoindre la liste d'attente" : "S'inscrire à cette mission"}
            </Link>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
