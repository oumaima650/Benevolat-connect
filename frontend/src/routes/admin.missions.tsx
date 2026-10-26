import { createFileRoute, Link } from '@tanstack/react-router';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  ArrowUpRight, Calendar, Check, EyeOff, Flag, Loader2, MapPin, RotateCcw, Search, ShieldCheck, Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { StatusBadge } from '@/components/dashboard/StatusBadge';
import { adminApi, signalerChangementAdmin, type MissionAdmin } from '@/services/adminApi';

export const Route = createFileRoute('/admin/missions')({
  component: AdminModeration,
});

type Filtre = 'signalees' | 'masquees' | 'toutes';

function formaterDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

function MissionModCard({ m, busy, onMasquer, onRetablir }: {
  m: MissionAdmin; busy: boolean; onMasquer: () => void; onRetablir: () => void;
}) {
  return (
    <div className={`rounded-2xl border-2 border-ink p-5 shadow-[4px_4px_0_var(--color-ink)] ${
      m.estSignalee ? 'bg-pink/10' : m.estMasquee ? 'bg-muted' : 'bg-paper'
    }`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-display text-lg font-black text-ink">{m.titre}</h3>
            <StatusBadge statut={m.statut as any} />
            {m.estSignalee && (
              <span className="flex items-center gap-1 rounded-full border border-ink bg-pink px-2 py-0.5 text-[11px] font-bold text-ink">
                <Flag className="h-3 w-3" /> Signalée
              </span>
            )}
            {m.estMasquee && (
              <span className="flex items-center gap-1 rounded-full border border-ink bg-ink px-2 py-0.5 text-[11px] font-bold text-paper">
                <EyeOff className="h-3 w-3" /> Masquée
              </span>
            )}
          </div>
          <p className="mt-1 text-sm font-semibold text-ink/80">{m.associationNom}</p>
          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            {m.ville && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{m.ville}</span>}
            <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{formaterDate(m.dateDebut)}</span>
            <span className="flex items-center gap-1"><Users className="h-3 w-3" />{m.nbInscrits} inscrit(s)</span>
            {m.domaine && <span>{m.domaine}</span>}
          </div>
        </div>
        {!m.estMasquee && (
          <Link to="/missions/$id" params={{ id: String(m.id) }} target="_blank"
            className="flex items-center gap-1 text-xs font-semibold text-ink underline underline-offset-2">
            Voir la page publique <ArrowUpRight className="h-3 w-3" />
          </Link>
        )}
      </div>

      {m.description && <p className="mt-3 line-clamp-2 text-sm text-ink/80">{m.description}</p>}

      {m.estSignalee && m.motifSignalement && (
        <p className="mt-3 rounded-xl border-2 border-ink bg-paper p-3 text-sm">
          <span className="font-bold">Motif du signalement :</span> {m.motifSignalement}
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {!m.estMasquee && (
          <Button size="sm" onClick={onMasquer} disabled={busy}
            className="rounded-xl border-2 border-ink bg-ink font-bold text-paper shadow-[2px_2px_0_var(--color-pink)] hover:bg-ink/90">
            <EyeOff className="mr-1.5 h-3.5 w-3.5" /> Masquer
          </Button>
        )}
        {m.estMasquee && (
          <Button size="sm" onClick={onRetablir} disabled={busy}
            className="rounded-xl border-2 border-ink bg-emerald font-bold text-emerald-foreground shadow-[2px_2px_0_var(--color-ink)] hover:bg-emerald/90">
            {busy ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="mr-1.5 h-3.5 w-3.5" />}
            Rétablir
          </Button>
        )}
        {m.estSignalee && !m.estMasquee && (
          <Button size="sm" variant="outline" onClick={onRetablir} disabled={busy}
            className="rounded-xl border-2 border-ink font-bold shadow-[2px_2px_0_var(--color-ink)]">
            <Check className="mr-1.5 h-3.5 w-3.5" /> Ignorer le signalement
          </Button>
        )}
      </div>
    </div>
  );
}

function AdminModeration() {
  const [missions, setMissions] = useState<MissionAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtre, setFiltre] = useState<Filtre>('signalees');
  const [recherche, setRecherche] = useState('');
  const [busyId, setBusyId] = useState<number | null>(null);
  const [aMasquer, setAMasquer] = useState<MissionAdmin | null>(null);
  const [motif, setMotif] = useState('');

  useEffect(() => {
    adminApi.missions()
      .then((data) => {
        setMissions(data);
        if (!data.some((m) => m.estSignalee)) setFiltre('toutes');
      })
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false));
  }, []);

  const compte = {
    signalees: missions.filter((m) => m.estSignalee).length,
    masquees: missions.filter((m) => m.estMasquee).length,
    toutes: missions.length,
  };

  const visibles = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    return missions
      .filter((m) => filtre === 'toutes' || (filtre === 'signalees' ? m.estSignalee : m.estMasquee))
      .filter((m) => !q || m.titre.toLowerCase().includes(q) || (m.associationNom ?? '').toLowerCase().includes(q));
  }, [missions, filtre, recherche]);

  function remplacer(maj: MissionAdmin) {
    setMissions((prev) => prev.map((m) => (m.id === maj.id ? maj : m)));
    signalerChangementAdmin();
  }

  async function confirmerMasquage() {
    if (!aMasquer) return;
    setBusyId(aMasquer.id);
    try {
      remplacer(await adminApi.masquerMission(aMasquer.id, motif.trim()));
      toast.success("Mission masquée. L'association a été prévenue.");
      setAMasquer(null);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusyId(null);
    }
  }

  async function retablir(m: MissionAdmin) {
    setBusyId(m.id);
    try {
      remplacer(await adminApi.retablirMission(m.id));
      toast.success(m.estMasquee ? 'Mission rétablie.' : 'Signalement ignoré.');
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusyId(null);
    }
  }

  const ONGLETS: { value: Filtre; label: string }[] = [
    { value: 'signalees', label: 'Signalées' },
    { value: 'masquees', label: 'Masquées' },
    { value: 'toutes', label: 'Toutes' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-black text-ink">Modération des missions</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Une mission masquée disparaît de la recherche et de la carte ; ses inscriptions sont conservées.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1 rounded-xl border-2 border-ink bg-muted p-1">
          {ONGLETS.map(({ value, label }) => (
            <button key={value} onClick={() => setFiltre(value)}
              className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${
                filtre === value ? 'bg-emerald font-bold text-emerald-foreground' : 'text-ink/70 hover:text-ink'
              }`}>
              {label} ({compte[value]})
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={recherche} onChange={(e) => setRecherche(e.target.value)} placeholder="Titre, association…"
            className="rounded-xl border-2 border-ink pl-9" />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-emerald" /></div>
      ) : visibles.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-ink/30 py-16 text-center">
          <ShieldCheck className="h-10 w-10 text-emerald" />
          <p className="font-semibold text-ink">
            {filtre === 'signalees' ? 'Aucune mission signalée — tout est en ordre.' : 'Aucune mission.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {visibles.map((m) => (
            <MissionModCard key={m.id} m={m} busy={busyId === m.id}
              onMasquer={() => { setAMasquer(m); setMotif(m.motifSignalement ?? ''); }}
              onRetablir={() => retablir(m)} />
          ))}
        </div>
      )}

      <Dialog open={!!aMasquer} onOpenChange={(v) => !v && setAMasquer(null)}>
        <DialogContent className="rounded-2xl border-2 border-ink bg-paper shadow-[6px_6px_0_var(--color-ink)] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display font-black text-ink">Masquer « {aMasquer?.titre} »</DialogTitle>
            <DialogDescription>
              La mission ne sera plus visible du public. L'association recevra le motif ci-dessous.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="motif-masquage" className="text-sm font-bold text-ink">Motif</Label>
            <Textarea id="motif-masquage" rows={3} value={motif} onChange={(e) => setMotif(e.target.value)}
              className="rounded-xl border-2 border-ink" />
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setAMasquer(null)} className="flex-1 rounded-xl border-2 border-ink font-bold">
              Annuler
            </Button>
            <Button onClick={confirmerMasquage} disabled={busyId === aMasquer?.id}
              className="flex-1 rounded-xl border-2 border-ink bg-ink font-bold text-paper shadow-[3px_3px_0_var(--color-pink)] hover:bg-ink/90">
              Masquer la mission
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
