import { useState } from "react";
import { Flag } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { adminApi } from "@/services/adminApi";

const MOTIFS = ["Contenu inapproprié", "Informations trompeuses", "Mission frauduleuse ou payante", "Doublon"];

/** F41 : permet à un utilisateur connecté de signaler une mission à la modération. */
export function SignalerMission({ missionId }: { missionId: string | number }) {
  const [open, setOpen] = useState(false);
  const [motif, setMotif] = useState("");
  const [envoi, setEnvoi] = useState(false);

  async function envoyer() {
    setEnvoi(true);
    try {
      const res = await adminApi.signalerMission(missionId, motif.trim());
      toast.success(res.message);
      setOpen(false);
      setMotif("");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <>
      <button onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground underline-offset-2 hover:text-red-600 hover:underline">
        <Flag className="h-3.5 w-3.5" /> Signaler cette mission
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-2xl border-2 border-ink bg-paper shadow-[6px_6px_0_var(--color-ink)] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display font-black text-ink">Signaler cette mission</DialogTitle>
            <DialogDescription>Votre signalement est transmis à l'équipe de modération CountMeIn.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-wrap gap-2">
            {MOTIFS.map((m) => (
              <button key={m} onClick={() => setMotif(m)}
                className={`rounded-full border-2 border-ink px-3 py-1 text-xs font-semibold ${
                  motif === m ? "bg-pink text-ink" : "bg-paper hover:bg-muted"
                }`}>
                {m}
              </button>
            ))}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="motif-signalement" className="text-sm font-bold text-ink">Motif *</Label>
            <Textarea id="motif-signalement" rows={3} value={motif} onChange={(e) => setMotif(e.target.value)}
              placeholder="Décrivez le problème…" className="rounded-xl border-2 border-ink" />
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setOpen(false)} className="flex-1 rounded-xl border-2 border-ink font-bold">
              Annuler
            </Button>
            <Button onClick={envoyer} disabled={!motif.trim() || envoi}
              className="flex-1 rounded-xl border-2 border-ink bg-red-500 font-bold text-white shadow-[3px_3px_0_var(--color-ink)] hover:bg-red-600">
              Envoyer le signalement
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
