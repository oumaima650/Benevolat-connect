import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Zap, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { StatusBadge } from '@/components/dashboard/StatusBadge';
import { getMyMissions, demanderRenfort, type MissionDashboard } from '@/services/associationApi';

export const Route = createFileRoute('/association/renforts')({
  component: Renforts,
});

function Renforts() {
  const [missions, setMissions] = useState<MissionDashboard[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogMission, setDialogMission] = useState<MissionDashboard | null>(null);
  const [nombreRenforts, setNombreRenforts] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getMyMissions()
      .then((data) => {
        // Afficher uniquement les missions actives (EN_COURS, PUBLIEE, RENFORT_URGENT)
        const actives = data.filter(m =>
          ['EN_COURS', 'PUBLIEE', 'RENFORT_URGENT', 'SATUREE'].includes(m.statut)
        );
        setMissions(actives);
      })
      .catch(() => toast.error('Impossible de charger les missions.'))
      .finally(() => setLoading(false));
  }, []);

  async function declarerRenfort() {
    const n = parseInt(nombreRenforts, 10);
    if (isNaN(n) || n <= 0) { toast.error('Veuillez saisir un nombre valide.'); return; }
    if (!dialogMission) return;

    setSubmitting(true);
    try {
      const updated = await demanderRenfort(dialogMission.id, n);
      setMissions(prev => prev.map(m => m.id === updated.id ? updated : m));
      toast.success(`⚡ Besoin de ${n} renforts déclaré !`);
      setDialogMission(null);
      setNombreRenforts('');
    } catch (err: any) {
      toast.error(err.message ?? 'Erreur lors de la déclaration du renfort.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-black text-ink">Renforts</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Gérez les besoins en renforts pour vos missions en cours.
        </p>
      </div>

      {missions.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-ink/30 bg-paper p-12 text-center">
          <p className="text-2xl mb-2">⚡</p>
          <p className="font-bold text-ink">Aucune mission active</p>
          <p className="text-sm text-muted-foreground mt-1">
            Les renforts sont disponibles pour les missions publiées, saturées, en cours ou déjà en renfort.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {missions.map((m) => {
            const nbRenfort = m.nbRenfortDemande ?? 0;
            const nbConfirmes = m.nbInscritsConfirmes ?? 0;
            const nbPlaces = m.nbPlaces ?? 0;
            const pct = nbPlaces > 0
              ? Math.min(100, Math.round((nbConfirmes / nbPlaces) * 100))
              : 0;
            const isRenfortUrgent = m.statut === 'RENFORT_URGENT';

            return (
              <div key={m.id}
                className={`rounded-2xl border-2 border-ink bg-paper p-5 shadow-[4px_4px_0_var(--color-ink)] ${
                  isRenfortUrgent ? 'border-red-400' : ''
                }`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="font-display font-bold text-ink">{m.titre}</h2>
                    <p className="text-sm text-muted-foreground">{m.ville}</p>
                    {m.domaineNom && (
                      <span className="mt-1 inline-block rounded-full border border-emerald/50 bg-emerald/10 px-2 py-0.5 text-xs font-semibold text-emerald">
                        {m.domaineNom}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge statut={m.statut as any} />
                    <Button size="sm" onClick={() => { setDialogMission(m); setNombreRenforts(''); }}
                      className="rounded-xl border-2 border-ink bg-red-500 font-bold text-white shadow-[2px_2px_0_var(--color-ink)] hover:bg-red-600">
                      <Zap className="mr-1.5 h-3.5 w-3.5" />
                      Déclarer un besoin
                    </Button>
                  </div>
                </div>

                {/* Barre de remplissage */}
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-ink">Inscrits confirmés</span>
                    <span className="font-bold text-ink">{nbConfirmes} / {nbPlaces}</span>
                  </div>
                  <Progress value={pct} className="h-3" />
                </div>

                {/* Infos renfort */}
                {isRenfortUrgent && nbRenfort > 0 && (
                  <div className="mt-3 flex flex-wrap gap-3">
                    <div className="flex items-center gap-2 rounded-xl border-2 border-red-400 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
                      <Zap className="h-3.5 w-3.5 shrink-0" />
                      {nbRenfort} bénévole(s) supplémentaire(s) demandé(s)
                    </div>
                    <div className="flex items-center gap-2 rounded-xl border-2 border-green-400 bg-green-50 px-3 py-2 text-xs font-semibold text-green-700">
                      <CheckCircle className="h-3.5 w-3.5 shrink-0" />
                      Liste d'attente contactée automatiquement
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Dialog déclaration renfort */}
      <Dialog open={!!dialogMission} onOpenChange={(v) => !v && setDialogMission(null)}>
        <DialogContent className="rounded-2xl border-2 border-ink bg-paper shadow-[6px_6px_0_var(--color-ink)]">
          <DialogHeader>
            <DialogTitle className="font-display font-black text-ink">
              ⚡ Déclarer un besoin de renfort
            </DialogTitle>
            <DialogDescription>
              Mission : <strong>{dialogMission?.titre}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label htmlFor="nb-renforts" className="text-sm font-bold text-ink">
              Nombre de bénévoles supplémentaires nécessaires
            </Label>
            <Input id="nb-renforts" type="number" min={1} value={nombreRenforts}
              onChange={(e) => setNombreRenforts(e.target.value)}
              placeholder="Ex: 5"
              className="w-36 rounded-xl border-2 border-ink shadow-[2px_2px_0_var(--color-ink)]" />
            <p className="text-xs text-muted-foreground">
              La mission passera au statut <strong>RENFORT URGENT</strong>. Les bénévoles en liste d'attente seront automatiquement notifiés.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogMission(null)}
              className="rounded-xl border-2 border-ink">
              Annuler
            </Button>
            <Button onClick={declarerRenfort} disabled={submitting || !nombreRenforts}
              className="rounded-xl border-2 border-ink bg-red-500 font-bold text-white shadow-[3px_3px_0_var(--color-ink)] hover:bg-red-600 disabled:opacity-60 disabled:pointer-events-none">
              {submitting
                ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Envoi…</>
                : <><Zap className="mr-2 h-4 w-4" />Confirmer le besoin</>
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
