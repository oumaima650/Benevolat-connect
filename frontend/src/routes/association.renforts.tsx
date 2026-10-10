import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { toast } from 'sonner';
import { Zap, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { StatusBadge } from '@/components/dashboard/StatusBadge';

export const Route = createFileRoute('/association/renforts')({
  component: Renforts,
});

interface MissionRenfort {
  id: string;
  titre: string;
  ville: string;
  statut: 'EN_COURS' | 'RENFORT_URGENT';
  renforts: number;
  renfortsObtenu: number;
  etapeAttente: boolean;
  etapePublique: boolean;
}

const MISSIONS_INIT: MissionRenfort[] = [
  {
    id: 'r1',
    titre: "Collecte de vêtements d'hiver",
    ville: 'Tétouan',
    statut: 'RENFORT_URGENT',
    renforts: 5,
    renfortsObtenu: 2,
    etapeAttente: true,
    etapePublique: true,
  },
  {
    id: 'r2',
    titre: 'Distribution de repas solidaires',
    ville: 'Tanger',
    statut: 'EN_COURS',
    renforts: 0,
    renfortsObtenu: 0,
    etapeAttente: false,
    etapePublique: false,
  },
  {
    id: 'r3',
    titre: 'Soutien psychologique post-séisme',
    ville: 'Marrakech',
    statut: 'RENFORT_URGENT',
    renforts: 8,
    renfortsObtenu: 3,
    etapeAttente: true,
    etapePublique: false,
  },
];

function Renforts() {
  const [missions, setMissions] = useState<MissionRenfort[]>(MISSIONS_INIT);
  const [dialogId, setDialogId] = useState<string | null>(null);
  const [nombreRenforts, setNombreRenforts] = useState('');

  const dialogMission = missions.find((m) => m.id === dialogId);

  function declarerRenfort() {
    const n = parseInt(nombreRenforts, 10);
    if (isNaN(n) || n <= 0) {
      toast.error('Veuillez saisir un nombre valide.');
      return;
    }
    setMissions((prev) =>
      prev.map((m) =>
        m.id === dialogId
          ? { ...m, statut: 'RENFORT_URGENT' as const, renforts: n, renfortsObtenu: 0, etapeAttente: true }
          : m,
      ),
    );
    toast.success(`🚨 Besoin de ${n} renforts déclaré !`);
    setDialogId(null);
    setNombreRenforts('');
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-black text-ink">Renforts</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Gérez les besoins en renforts pour vos missions en cours.
        </p>
      </div>

      <div className="space-y-4">
        {missions.map((m) => {
          const pct = m.renforts > 0 ? Math.round((m.renfortsObtenu / m.renforts) * 100) : 0;
          return (
            <div
              key={m.id}
              className="rounded-2xl border-2 border-ink bg-paper p-5 shadow-[4px_4px_0_var(--color-ink)]"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-display font-bold text-ink">{m.titre}</h2>
                  <p className="text-sm text-muted-foreground">{m.ville}</p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge statut={m.statut} />
                  <Button
                    size="sm"
                    onClick={() => setDialogId(m.id)}
                    className="rounded-xl border-2 border-ink bg-red-500 font-bold text-white shadow-[2px_2px_0_var(--color-ink)] hover:bg-red-600"
                  >
                    <Zap className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
                    Déclarer un besoin
                  </Button>
                </div>
              </div>

              {m.renforts > 0 && (
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-ink">Renforts obtenus</span>
                    <span className="font-bold text-ink">
                      {m.renfortsObtenu} / {m.renforts}
                    </span>
                  </div>
                  <Progress value={pct} className="h-3" />
                </div>
              )}

              {/* Steps */}
              {m.renforts > 0 && (
                <div className="mt-4 flex flex-wrap gap-3">
                  <div
                    className={`flex items-center gap-2 rounded-xl border-2 px-3 py-2 text-xs font-semibold ${
                      m.etapeAttente
                        ? 'border-green-400 bg-green-50 text-green-700'
                        : 'border-ink/20 bg-muted text-muted-foreground'
                    }`}
                  >
                    {m.etapeAttente && <CheckCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />}
                    Liste d'attente contactée
                  </div>
                  <div
                    className={`flex items-center gap-2 rounded-xl border-2 px-3 py-2 text-xs font-semibold ${
                      m.etapePublique
                        ? 'border-blue-400 bg-blue-50 text-blue-700'
                        : 'border-ink/20 bg-muted text-muted-foreground'
                    }`}
                  >
                    {m.etapePublique && <CheckCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />}
                    {m.etapePublique ? 'En cours :' : ''} Inscription urgente publique ouverte
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Dialog */}
      <Dialog open={!!dialogId} onOpenChange={(v) => !v && setDialogId(null)}>
        <DialogContent className="border-2 border-ink shadow-[4px_4px_0_var(--color-ink)]">
          <DialogHeader>
            <DialogTitle className="font-display font-black text-ink">
              Déclarer un besoin de renfort
            </DialogTitle>
            <DialogDescription>
              Mission : <strong>{dialogMission?.titre}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label htmlFor="nb-renforts">Nombre de bénévoles supplémentaires nécessaires</Label>
            <Input
              id="nb-renforts"
              type="number"
              min={1}
              value={nombreRenforts}
              onChange={(e) => setNombreRenforts(e.target.value)}
              placeholder="Ex: 5"
              className="w-32 rounded-xl border-2 border-ink"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogId(null)} className="rounded-xl border-2 border-ink">
              Annuler
            </Button>
            <Button
              onClick={declarerRenfort}
              className="rounded-xl border-2 border-ink bg-red-500 font-bold text-white shadow-[2px_2px_0_var(--color-ink)]"
            >
              Confirmer le besoin
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
